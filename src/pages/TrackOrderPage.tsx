import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { getOrderById, getOrdersByPhone } from '../services/storeService';
import { Order, OrderStatus } from '../types';
import {
  Search,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Key,
  ArrowLeft,
} from 'lucide-react';

export const TrackOrderPage: React.FC = () => {
  const { lastCreatedOrder, navigateTo, showToast } = useStore();
  const { isBangla, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(lastCreatedOrder?.id || '');
  const [loading, setLoading] = useState(false);
  const [foundOrders, setFoundOrders] = useState<Order[]>(lastCreatedOrder ? [lastCreatedOrder] : []);
  const [searched, setSearched] = useState(!!lastCreatedOrder);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      showToast(isBangla ? 'দয়া করে আপনার অর্ডার নম্বর বা মোবাইল নাম্বার লিখুন।' : 'Please enter your Order ID or Phone number.', 'error');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      if (query.toUpperCase().startsWith('SSBD-')) {
        const order = await getOrderById(query);
        setFoundOrders(order ? [order] : []);
      } else {
        const byId = await getOrderById(query);
        if (byId) {
          setFoundOrders([byId]);
        } else {
          const byPhone = await getOrdersByPhone(query);
          setFoundOrders(byPhone);
        }
      }
    } catch (err) {
      console.error('Track error:', err);
      showToast(isBangla ? 'অর্ডার ট্র্যাক করতে সমস্যা হয়েছে।' : 'Error tracking order.', 'error');
      setFoundOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'Confirmed':
        return 2;
      case 'Processing':
        return 3;
      case 'Delivered':
      case 'Completed':
        return 4;
      case 'Cancelled':
      case 'Refunded':
        return -1;
      default:
        return 1;
    }
  };

  const steps = [
    {
      title: isBangla ? 'অর্ডার প্লেসড' : 'Order Placed',
      desc: isBangla ? 'অর্ডার রিকোয়েস্ট গৃহীত হয়েছে' : 'Order request received',
    },
    {
      title: isBangla ? 'পেমেন্ট ভেরিফাইড' : 'Payment Verified',
      desc: isBangla ? 'টাকা ও TrxID নিশ্চিত হয়েছে' : 'Funds & TrxID confirmed',
    },
    {
      title: isBangla ? 'প্রসেসিং চলছে' : 'Processing',
      desc: isBangla ? 'টপআপ বা কোড জেনারেট হচ্ছে' : 'Recharge / code generation',
    },
    {
      title: isBangla ? 'ডেলিভারি সম্পন্ন' : 'Delivered',
      desc: isBangla ? 'আইডিতে যুক্ত বা কোড ডেলিভার্ড' : 'Delivered to game / inbox',
    },
  ];

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(isBangla ? 'কোড কপি করা হয়েছে!' : 'Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0a1122] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>{isBangla ? '← হোমে ফিরে যান' : '← Back to Home'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isBangla ? 'রিয়েল-টাইম লাইভ ট্র্যাকার' : 'Real-Time Order Tracker'}</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
          {t('track_title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('track_subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-10">
        <form
          onSubmit={handleTrack}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto bg-[#0a1122] p-2 rounded-2xl border border-slate-800 shadow-xl"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('track_input_placeholder')}
              className="w-full bg-[#0d1629] text-sm text-slate-200 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            {loading ? (
              <span>{isBangla ? 'অনুসন্ধান হচ্ছে...' : 'Searching...'}</span>
            ) : (
              <span>{t('track_btn')}</span>
            )}
          </button>
        </form>
      </div>

      {/* Results Area */}
      {searched && (
        <div className="space-y-8">
          {foundOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0a1120] border border-slate-800 text-center max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-white mb-1">
                {isBangla ? 'কোনো অর্ডার খুঁজে পাওয়া যায়নি' : 'No Order Found'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBangla
                  ? 'দয়া করে সঠিক অর্ডার আইডি বা মোবাইল নম্বর দিয়েছেন কিনা তা পুনরায় যাচাই করুন।'
                  : 'Please verify that you entered the correct Order ID or registered phone number.'}
              </p>
            </div>
          ) : (
            foundOrders.map((order) => {
              const currentStep = getStatusStepIndex(order.orderStatus);
              const isCancelled =
                order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-[#0a1122] border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6"
                >
                  {/* Top Bar with Status and ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">
                        {isBangla ? 'অর্ডার আইডি' : 'Order ID'}
                      </span>
                      <h2 className="font-heading font-black text-2xl text-cyan-400 tracking-wider">
                        {order.id}
                      </h2>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {isBangla ? 'তারিখ: ' : 'Date: '}
                        {new Date(order.createdAt).toLocaleString(isBangla ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          order.orderStatus === 'Delivered' || order.orderStatus === 'Completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : order.orderStatus === 'Processing'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                            : isCancelled
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {isBangla ? `অর্ডার: ${order.orderStatus}` : `Status: ${order.orderStatus}`}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {isBangla ? `পেমেন্ট: ${order.paymentStatus}` : `Payment: ${order.paymentStatus}`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  {!isCancelled ? (
                    <div className="py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                        {steps.map((st, i) => {
                          const stepNum = i + 1;
                          const isDone = currentStep >= stepNum;

                          return (
                            <div
                              key={i}
                              className={`p-4 rounded-2xl border text-center transition-all ${
                                isDone
                                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                                  : 'bg-[#0d1629]/50 border-slate-800 opacity-60'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xs ${
                                  isDone
                                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isDone ? '✓' : stepNum}
                              </div>
                              <div
                                className={`font-heading font-bold text-xs sm:text-sm ${
                                  isDone ? 'text-white' : 'text-slate-400'
                                }`}
                              >
                                {st.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                                {st.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800 text-rose-300 text-xs">
                      {isBangla
                        ? 'অর্ডারটি বাতিল বা রিফান্ড করা হয়েছে। বিস্তারিত জানতে আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন।'
                        : 'This order was cancelled or refunded. Contact support for details.'}
                    </div>
                  )}

                  {/* Digital Delivery Box */}
                  {order.digitalDeliveryNotes && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#0c1830] to-cyan-950/60 border border-cyan-500/60 shadow-lg shadow-cyan-500/15">
                      <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-sm mb-2">
                        <Key className="w-4 h-4" />
                        <span>{t('track_digital_code')}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080d19] p-3.5 rounded-xl border border-cyan-800/80">
                        <span className="font-mono font-bold text-base sm:text-lg text-white select-all break-all">
                          {order.digitalDeliveryNotes}
                        </span>
                        <button
                          onClick={() => handleCopyVoucher(order.digitalDeliveryNotes || '')}
                          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? (isBangla ? 'কপি হয়েছে' : 'Copied') : (isBangla ? 'কোড কপি করুন' : 'Copy Code')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-3">
                    <h3 className="font-heading font-bold text-sm text-slate-200 uppercase tracking-wider">
                      {isBangla ? 'অর্ডারকৃত প্রোডাক্টসমূহ:' : 'Ordered Items:'}
                    </h3>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#070c18] border border-slate-800"
                      >
                        <div>
                          <div className="font-heading font-bold text-white text-sm">
                            {item.productName}
                          </div>
                          <div className="text-cyan-400 text-xs mt-0.5">
                            {item.variationName} × {item.quantity}
                          </div>
                          {item.customFieldValues &&
                            Object.entries(item.customFieldValues).map(([k, v]) => (
                              <div key={k} className="text-xs text-slate-400 mt-1">
                                {k}: <span className="text-slate-200 font-mono font-medium">{v}</span>
                              </div>
                            ))}
                        </div>
                        <div className="font-heading font-bold text-base text-cyan-400 self-end sm:self-auto">
                          ৳ {item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Footer */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#080e1c] border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">{isBangla ? 'কাস্টমার নাম:' : 'Customer Name:'}</span>
                      <span className="text-slate-200 font-medium">{order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBangla ? 'মোবাইল:' : 'Phone:'}</span>
                      <span className="text-slate-200 font-mono">{order.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBangla ? 'পেমেন্ট মেথড:' : 'Payment Method:'}</span>
                      <span className="text-slate-200 font-semibold">{order.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBangla ? 'সর্বমোট:' : 'Total Amount:'}</span>
                      <span className="font-heading font-black text-cyan-400 text-sm">
                        ৳ {order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
