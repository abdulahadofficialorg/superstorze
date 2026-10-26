import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { placeWalletOrder } from '../services/storeService';
import { saveTopUpRequirementToSupabase } from '../services/supabaseService';
import { DepositModal } from '../components/DepositModal';
import {
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  Wallet,
  Clock,
  Sparkles,
  ShoppingBag,
  PlusCircle,
  ArrowLeft,
  LogIn,
  CheckCircle2,
  X,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { navigateTo, showToast } = useStore();
  const { user, profile, loginWithGoogle, openAuthModal } = useAuth();
  const { isBangla, t } = useLanguage();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState(profile?.displayName || user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-bold text-xl text-white mb-2">
          আপনার কার্ট বর্তমানে খালি
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          চেকআউট সম্পন্ন করার জন্য প্রথমে আপনার পছন্দের প্রোডাক্ট কার্টে যোগ করুন।
        </p>
        <button
          onClick={() => navigateTo('catalog')}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm shadow-md cursor-pointer"
        >
          ক্যাটালগে ফিরে যান
        </button>
      </div>
    );
  }

  const currentWallet = profile?.walletBalance ?? 0;
  const isBalanceShort = currentWallet < subtotal;
  const remainingBalance = currentWallet - subtotal;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) {
      errs.name = 'আপনার নাম প্রদান করুন';
    }
    if (!customerPhone.trim()) {
      errs.phone = 'মোবাইল নাম্বার আবশ্যক (যেমন: 017XXXXXXXX)';
    } else if (customerPhone.replace(/[^0-9]/g, '').length < 11) {
      errs.phone = 'সঠিক ১১ সংখ্যার মোবাইল নাম্বার দিন';
    }

    if (isBalanceShort) {
      errs.wallet = `আপনার ওয়ালেট ব্যালেন্স অপর্যাপ্ত! বর্তমান ব্যালেন্স ৳${currentWallet.toFixed(
        2
      )}, প্রয়োজন ৳${subtotal.toFixed(2)}। দয়া করে প্রথমে ওয়ালেটে টাকা ডিপোজিট করুন।`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('অর্ডার করতে দয়া করে প্রথমে সাইন ইন করুন।', 'error');
      openAuthModal();
      return;
    }

    if (!validateForm()) {
      if (isBalanceShort) {
        showToast('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। প্রথমে ডিপোজিট করুন।', 'error');
      } else {
        showToast('দয়া করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন।', 'error');
      }
      return;
    }

    setShowConfirmModal(true);
  };

  const executeOrder = async () => {
    if (isSubmitting) return; // Prevent duplicate clicks
    if (!user) {
      showToast('অর্ডার করতে দয়া করে প্রথমে সাইন ইন করুন।', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const order = await placeWalletOrder({
        userId: user.uid,
        orderData: {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || user?.email || '',
          customerNotes: customerNotes.trim() || '',
          items,
          totalAmount: subtotal,
        },
      });

      setShowConfirmModal(false);
      clearCart();

      // Sync confirmed order details and top-up requirements to Supabase
      for (const item of items) {
        saveTopUpRequirementToSupabase({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          packageName: item.variationName,
          price: item.price * item.quantity,
          customFields: item.customFieldValues || {},
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || user?.email || '',
          customerNotes: customerNotes.trim(),
          paymentMethod: 'SSBD Wallet',
          status: 'order_confirmed',
        }).catch((err) => console.warn('[Supabase] Sync notice:', err));
      }

      showToast(`অর্ডার সফলভাবে নিশ্চিত হয়েছে! অর্ডার আইডি: ${order.id}`, 'success');
      navigateTo('order-confirmation', { order });
    } catch (err: any) {
      console.error('Order error:', err);
      showToast(err.message || 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Shop Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigateTo('catalog')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1122] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>{isBangla ? '← কেনাকাটায় ফিরে যান (Back to Shop)' : '← Back to Shop'}</span>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          {isBangla ? 'ওয়ালেট চেকআউট ও অর্ডার কনফার্মেশন' : 'Wallet Checkout & Confirmation'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isBangla
            ? 'আপনার ওয়ালেট ব্যালেন্স থেকে ইনস্ট্যান্ট পেমেন্ট করে তাৎক্ষণিক ডেলিভারি গ্রহণ করুন।'
            : 'Pay instantly from your wallet balance for immediate automated delivery.'}
        </p>
      </div>

      {/* Guest Warning / Login Prompt */}
      {!user && (
        <div className="mb-6 p-5 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>ওয়ালেট চেকআউট করতে সাইন ইন করুন</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              প্রোডাক্ট কিনতে এবং ওয়ালেট ব্যালেন্স ব্যবহার করতে আপনার একাউন্টে সাইন ইন থাকা আবশ্যক।
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন / সাইন ইন করুন</span>
          </button>
        </div>
      )}

      <form onSubmit={handleOpenConfirmModal}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Wallet Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Essential Customer Information */}
            <div className="p-6 rounded-3xl bg-[#0a1122] border border-slate-800 space-y-4">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs flex items-center justify-center font-bold">
                  ১
                </span>
                <span>অর্ডার ডেলিভারি তথ্য</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    আপনার নাম <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="যেমন: সাকিব আল হাসান"
                    className="w-full bg-[#0d1629] text-sm text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    মোবাইল নাম্বার <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX"
                    className="w-full bg-[#0d1629] text-sm text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ইমেইল এড্রেস (ঐচ্ছিক / ডেলিভারি রিসিটের জন্য)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0d1629] text-sm text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  অর্ডার সংক্রান্ত বিশেষ নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="যদি কোনো অতিরিক্ত তথ্য জানাতে চান..."
                  className="w-full bg-[#0d1629] text-sm text-slate-200 px-4 py-2 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* 2. Wallet-Only Payment & Confirmation Card */}
            <div className="p-6 rounded-3xl bg-[#0a1122] border border-cyan-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs flex items-center justify-center font-bold">
                    ২
                  </span>
                  <span>পেমেন্ট মাধ্যম (Wallet Payment)</span>
                </h3>

                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  ইনস্ট্যান্ট ওয়ালেট পে
                </span>
              </div>

              {/* Wallet Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1830] via-[#091122] to-[#070c18] border border-cyan-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <span>বর্তমান ওয়ালেট ব্যালেন্স:</span>
                  </span>
                  <span className="font-heading font-black text-lg text-cyan-400 font-mono">
                    ৳ {currentWallet.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <span className="text-slate-400">অর্ডারের মোট মূল্য:</span>
                  <span className="font-heading font-bold text-base text-white font-mono">
                    ৳ {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-300">কেনার পর অবশিষ্ট ব্যালেন্স:</span>
                  <span
                    className={`font-heading font-black text-base font-mono ${
                      remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ৳ {remainingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status & Deposit Action */}
              {isBalanceShort ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!</strong>
                      <span>
                        ঘাটতির পরিমাণ: ৳{(subtotal - currentWallet).toFixed(2)} টাকা। অর্ডার কনফার্ম করতে বিকাশ, নগদ বা রকেটে টাকা পাঠিয়ে ওয়ালেটে ডিপোজিট করুন।
                      </span>
                    </div>
                  </div>

                  {/* Manual Deposit Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDepositModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-heading font-black text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>এখনই টাকা ডিপোজিট করুন (Deposit Funds)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স রয়েছে!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    “অর্ডার নিশ্চিত করুন” বাটনে চাপ দেওয়া মাত্রই আপনার ওয়ালেট থেকে ৳{subtotal.toFixed(2)} কাটা হবে এবং আইটেমটি প্রসেস হবে।
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-[#0a1122] border border-slate-800 space-y-4 sticky top-24">
              <h3 className="font-heading font-bold text-base text-white pb-3 border-b border-slate-800">
                অর্ডার সামারি ({items.length} টি আইটেম)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#0d1629] border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{item.productName}</div>
                      <div className="text-[11px] text-cyan-400">
                        {item.variationName} × {item.quantity}
                      </div>
                      {item.customFieldValues &&
                        Object.entries(item.customFieldValues).map(([k, v]) => (
                          <div key={k} className="text-[10px] text-slate-400 font-mono truncate">
                            {k}: {v}
                          </div>
                        ))}
                    </div>
                    <div className="font-heading font-black text-cyan-400 text-sm whitespace-nowrap">
                      ৳ {item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>সাবটোটাল</span>
                  <span className="font-semibold font-mono">৳ {subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-emerald-400 font-semibold">ফ্রি (০ টাকা)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>গেটওয়ে সার্ভিস ফি</span>
                  <span className="text-emerald-400 font-semibold">ফ্রি</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>মোট প্রদেয় টাকা:</span>
                  <span className="font-heading font-black text-xl text-cyan-400 font-mono">
                    ৳ {subtotal}
                  </span>
                </div>
              </div>

              {/* Confirmation Button */}
              <div className="pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isBalanceShort || !user}
                  className={`w-full py-3.5 rounded-2xl font-heading font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                    isBalanceShort || !user
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black shadow-cyan-500/25 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    </>
                  ) : isBalanceShort ? (
                    <span>ব্যালেন্স অপর্যাপ্ত — ডিপোজিট করুন</span>
                  ) : !user ? (
                    <span>অর্ডার করতে সাইন ইন করুন</span>
                  ) : (
                    <>
                      <span>অর্ডার কনফার্ম করুন (Confirm Order)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('catalog')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল / শপে ফিরে যান
                </button>

                <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>১০০% নিরাপদ ওয়ালেট লেনদেন</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Manual Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      {/* Checkout Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full bg-[#0a1122] border border-cyan-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/80">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                    অর্ডার নিশ্চিতকরণ
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-medium">Checkout Confirmation</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-[#070c18] border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Your Available Balance:</span>
                <span className="font-mono font-bold text-cyan-400">৳ {currentWallet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Order Total:</span>
                <span className="font-mono font-bold text-white">৳ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-semibold">
                <span className="text-slate-300">Remaining Balance After Purchase:</span>
                <span
                  className={`font-mono font-black text-sm ${
                    remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ৳ {remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Confirmation Note Prompt */}
            {isBalanceShort ? (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs space-y-2">
                <p className="font-semibold">
                  আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! ঘাটতি: ৳{(subtotal - currentWallet).toFixed(2)} টাকা।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setIsDepositModalOpen(true);
                  }}
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  টাকা ডিপোজিট করুন
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-800/40">
                Are you sure you want to confirm this order? <strong>৳{subtotal.toFixed(2)}</strong> will be deducted from your wallet balance.
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel / Back
              </button>
              <button
                type="button"
                onClick={executeOrder}
                disabled={isSubmitting || isBalanceShort}
                className={`flex-1 py-3 rounded-xl font-heading font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSubmitting || isBalanceShort
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black shadow-cyan-500/25 active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>প্রসেসিং...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
