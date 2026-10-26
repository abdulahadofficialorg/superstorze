import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { subscribeUserOrders, subscribeUserDepositRequests } from '../services/storeService';
import { Order, DepositRequest } from '../types';
import { DepositModal } from '../components/DepositModal';
import {
  User as UserIcon,
  Wallet,
  Clock,
  Package,
  ArrowRight,
  PlusCircle,
  LogIn,
  CheckCircle2,
  XCircle,
  Hourglass,
  Eye,
  X,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, profile, loginWithGoogle, openAuthModal } = useAuth();
  const { navigateTo } = useStore();
  const { isBangla, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'orders' | 'deposits'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setDepositRequests([]);
      setLoadingOrders(false);
      setLoadingDeposits(false);
      return;
    }

    const unsubOrders = subscribeUserOrders(
      user.uid,
      (data) => {
        setOrders(data);
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false)
    );

    const unsubDeposits = subscribeUserDepositRequests(
      user.uid,
      (data) => {
        setDepositRequests(data);
        setLoadingDeposits(false);
      },
      () => setLoadingDeposits(false)
    );

    return () => {
      unsubOrders();
      unsubDeposits();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mx-auto mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-white mb-2">
          {isBangla ? 'কাস্টমার একাউন্ট' : 'Customer Account'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isBangla
            ? 'আপনার ওয়ালেট ব্যালেন্স দেখা, টাকা ডিপোজিট করা এবং পূর্বের অর্ডার হিস্ট্রি ট্র্যাক করার জন্য সাইন ইন করুন।'
            : 'Sign in to check your wallet balance, deposit funds, and track your orders.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={openAuthModal}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isBangla ? 'ইমেইল অথবা Google দিয়ে সাইন ইন / রেজিস্ট্রেশন' : 'Sign In with Email or Google'}</span>
          </button>

          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 rounded-xl bg-[#0d1629] hover:bg-[#121f38] border border-slate-700/80 hover:border-cyan-500/50 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>{isBangla ? 'সরাসরি Google দিয়ে লগইন' : 'Direct Google Sign In'}</span>
          </button>
        </div>
      </div>
    );
  }

  const pendingDepositsCount = depositRequests.filter((d) => d.status === 'Pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1122] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>{isBangla ? '← হোমে ফিরে যান' : '← Back to Home'}</span>
        </button>

        <button
          onClick={() => navigateTo('catalog')}
          className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{isBangla ? 'প্রোডাক্ট ক্যাটালগ' : 'Product Catalog'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* User Header & Wallet Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#0a1122] border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950 border border-cyan-700/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-cyan-400" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="font-heading font-black text-2xl text-white">
                {profile?.displayName || (isBangla ? 'সম্মানিত গেমার' : 'Valued Gamer')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {profile?.role === 'admin'
                  ? (isBangla ? 'এডমিনিস্ট্রেটর' : 'Administrator')
                  : (isBangla ? 'ভেরিফাইড মেম্বার' : 'Verified Member')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">{user.email}</p>
            <p className="text-xs text-slate-400">
              {isBangla
                ? 'SuperStorez.com এর সাথে যুক্ত থাকার জন্য ধন্যবাদ। এখানে আপনি আপনার ওয়ালেট ব্যালেন্স বাড়াতে এবং যেকোনো অর্ডারের লাইভ আপডেট দেখতে পারবেন।'
                : 'Thank you for choosing SuperStorez.com. Manage your wallet balance and review your complete transaction history here.'}
            </p>
          </div>
        </div>

        {/* Wallet Card with Manual Deposit Button */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1830] via-[#091122] to-[#070c18] border border-cyan-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                <span>SSBD Wallet</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {isBangla ? 'অ্যাক্টিভ ব্যালেন্স' : 'Active Balance'}
              </span>
            </div>

            <div className="font-heading font-black text-3xl sm:text-4xl text-cyan-400 mt-2">
              ৳ {(profile?.walletBalance ?? 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isBangla
                ? 'যেকোনো গেম টপআপ বা গিফট কার্ডে ১-ক্লিক ইনস্ট্যান্ট পেমেন্ট'
                : 'Instant 1-click checkout on all products'}
            </p>
          </div>

          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-heading font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBangla ? 'টাকা ডিপোজিট করুন (Deposit Money)' : 'Deposit Money'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Orders vs Deposits */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isBangla ? `আমার অর্ডারসমূহ (${orders.length})` : `My Orders (${orders.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer relative ${
            activeTab === 'deposits'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isBangla ? `ডিপোজিট হিস্ট্রি (${depositRequests.length})` : `Deposit History (${depositRequests.length})`}</span>
          {pendingDepositsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-lg text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>{isBangla ? 'পূর্ববর্তী অর্ডারসমূহ' : 'Order History'}</span>
            </h2>
            <button
              onClick={() => navigateTo('track-order')}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              {isBangla ? 'লাইভ ট্র্যাকার' : 'Live Tracker'}
            </button>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isBangla ? 'অর্ডার লোড হচ্ছে...' : 'Loading orders...'}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0a1122] border border-slate-800 text-center">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-sm mb-1">
                {isBangla ? 'এখনও কোনো অর্ডার রেকর্ড নেই' : 'No orders recorded yet'}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {isBangla
                  ? 'আপনার পছন্দের গেম বা কার্ড অর্ডার করতে আমাদের ক্যাটালগ দেখুন।'
                  : 'Browse our catalog to place your first game top-up or gift card order.'}
              </p>
              <button
                onClick={() => navigateTo('catalog')}
                className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-xs cursor-pointer"
              >
                {isBangla ? 'এখনই ব্রাউজ করুন' : 'Browse Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-lg text-cyan-400 tracking-wider">
                        {ord.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {ord.orderStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      {ord.items.map((i) => `${i.productName} (${i.variationName})`).join(', ')}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(ord.createdAt).toLocaleString(isBangla ? 'bn-BD' : 'en-US')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{isBangla ? 'মোট মূল্য' : 'Total'}</span>
                      <span className="font-heading font-black text-lg text-cyan-400">
                        ৳ {ord.totalAmount}
                      </span>
                    </div>

                    <button
                      onClick={() => navigateTo('track-order', { order: ord })}
                      className="px-3.5 py-2 rounded-xl bg-[#0d1629] hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isBangla ? 'ট্র্যাক করুন' : 'Track'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deposit Requests History */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-lg text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <span>{isBangla ? 'ডিপোজিট রিকোয়েস্ট তালিকা' : 'Deposit Requests'}</span>
            </h2>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isBangla ? 'নতুন ডিপোজিট' : 'New Deposit'}</span>
            </button>
          </div>

          {loadingDeposits ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isBangla ? 'ডিপোজিট ডাটা লোড হচ্ছে...' : 'Loading deposits...'}
            </div>
          ) : depositRequests.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0a1122] border border-slate-800 text-center">
              <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-sm mb-1">
                {isBangla ? 'কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি' : 'No deposit requests found'}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {isBangla
                  ? 'বিকাশ, নগদ বা রকেটের মাধ্যমে টাকা পাঠিয়ে এখনই আপনার ওয়ালেট ব্যালেন্স বাড়ান।'
                  : 'Add funds via bKash, Nagad or Rocket to recharge your wallet balance.'}
              </p>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-xs cursor-pointer"
              >
                {isBangla ? 'টাকা ডিপোজিট করুন' : 'Deposit Money'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {depositRequests.map((dep) => (
                <div
                  key={dep.id}
                  className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-black text-base text-cyan-400 tracking-wider">
                        {dep.id}
                      </span>

                      {/* Status Badges */}
                      {dep.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                          <Hourglass className="w-3 h-3 animate-pulse" />
                          <span>{isBangla ? 'পেন্ডিং (ভেরিফিকেশন চলছে)' : 'Pending Verification'}</span>
                        </span>
                      )}
                      {dep.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isBangla ? 'অনুমোদিত (টাকা যুক্ত হয়েছে)' : 'Approved (Credited)'}</span>
                        </span>
                      )}
                      {dep.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>{isBangla ? 'বাতিল করা হয়েছে' : 'Rejected'}</span>
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {dep.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono">
                      <span>{isBangla ? 'প্রেরক: ' : 'Sender: '}<strong className="text-white">{dep.senderNumber}</strong></span>
                      <span>TrxID: <strong className="text-cyan-300">{dep.transactionId}</strong></span>
                      <span className="text-slate-500 font-sans">
                        {new Date(dep.createdAt).toLocaleString(isBangla ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>

                    {dep.adminNote && (
                      <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg mt-2">
                        {isBangla ? `এডমিন নোট: ${dep.adminNote}` : `Admin Note: ${dep.adminNote}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Screenshot thumbnail if available */}
                    {dep.screenshotUrl && (
                      <button
                        onClick={() => setViewingScreenshot(dep.screenshotUrl || null)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
                        title={isBangla ? 'পেমেন্ট প্রুফ স্ক্রিনশট দেখুন' : 'View payment screenshot'}
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isBangla ? 'প্রুফ' : 'Proof'}</span>
                      </button>
                    )}

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{isBangla ? 'জমার পরিমাণ' : 'Amount'}</span>
                      <span className="font-heading font-black text-xl text-cyan-400 font-mono">
                        ৳ {dep.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={() => {
          setActiveTab('deposits');
        }}
      />

      {/* High-Resolution Screenshot Lightbox Modal */}
      {viewingScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in cursor-pointer"
          onClick={() => setViewingScreenshot(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-[#0a1122] border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingScreenshot(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-slate-700 flex items-center justify-center text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={viewingScreenshot}
              alt="Payment Screenshot"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              {isBangla ? 'পেমেন্ট কনফার্মেশন স্ক্রিনশট' : 'Payment Confirmation Screenshot'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
