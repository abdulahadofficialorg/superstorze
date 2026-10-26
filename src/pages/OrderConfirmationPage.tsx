import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { lastCreatedOrder, navigateTo, showToast } = useStore();
  const [copiedId, setCopiedId] = useState(false);

  if (!lastCreatedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি</h2>
        <p className="text-sm text-slate-400 mb-6">আপনার অর্ডার ট্র্যাক করতে অর্ডার নম্বর দিন।</p>
        <button
          onClick={() => navigateTo('track-order')}
          className="px-5 py-2.5 bg-cyan-500 text-black font-semibold rounded-xl text-sm"
        >
          অর্ডার ট্র্যাক করুন
        </button>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(lastCreatedOrder.id);
    setCopiedId(true);
    showToast('অর্ডার আইডি কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl bg-[#0a1224] border border-cyan-800/60 p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-cyan-500/10 blur-[80px] pointer-events-none" />

        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-cyan-950/80 border-2 border-cyan-500/60 flex items-center justify-center text-cyan-400 mx-auto mb-6 shadow-xl shadow-cyan-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mb-2">
          আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!
        </h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
          আমাদের অটোমেশন সিস্টেম আপনার অর্ডারটি প্রসেস করছে। ১-৩ মিনিটের মধ্যে আপনার আইটেম পৌঁছে দেওয়া হবে।
        </p>

        {/* Order ID Pill */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0d172e] border border-cyan-700/50 mb-8 shadow-inner">
          <span className="text-xs text-slate-400 font-medium">অর্ডার নাম্বার:</span>
          <span className="font-heading font-black text-xl text-cyan-400 tracking-wider">
            {lastCreatedOrder.id}
          </span>
          <button
            onClick={handleCopyId}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="অর্ডার নাম্বার কপি করুন"
          >
            {copiedId ? (
              <Check className="w-4 h-4 text-cyan-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="rounded-2xl bg-[#070c18] border border-slate-800 p-5 text-left mb-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">অর্ডার স্ট্যাটাস</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
              {lastCreatedOrder.orderStatus}
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              আইটেমসমূহ:
            </span>
            {lastCreatedOrder.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 text-xs bg-[#0b1222] p-3 rounded-xl border border-slate-800/80"
              >
                <div>
                  <div className="font-heading font-bold text-white text-sm">
                    {item.productName}
                  </div>
                  <div className="text-cyan-400 mt-0.5">
                    {item.variationName} × {item.quantity}
                  </div>
                  {item.customFieldValues &&
                    Object.entries(item.customFieldValues).map(([k, v]) => (
                      <div key={k} className="text-slate-400 mt-0.5">
                        {k}: <span className="text-slate-200 font-mono font-medium">{v}</span>
                      </div>
                    ))}
                </div>
                <div className="font-heading font-bold text-sm text-cyan-400">
                  ৳ {item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">কাস্টমার নাম:</span>
              <span className="text-slate-200 font-medium">{lastCreatedOrder.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">মোবাইল নাম্বার:</span>
              <span className="text-slate-200 font-mono">{lastCreatedOrder.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 block">পেমেন্ট মেথড:</span>
              <span className="text-slate-200 font-semibold">{lastCreatedOrder.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Transaction ID:</span>
              <span className="text-cyan-400 font-mono font-bold">
                {lastCreatedOrder.transactionId || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-sm font-bold text-white">সর্বমোট মূল্য:</span>
            <span className="font-heading font-black text-xl text-cyan-400">
              ৳ {lastCreatedOrder.totalAmount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigateTo('track-order')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <Clock className="w-4 h-4" />
            <span>অর্ডার লাইভ ট্র্যাক করুন</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all"
          >
            হোমপেজে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
};
