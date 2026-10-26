import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import {
  MessageCircle,
  X,
  Phone,
  Mail,
  Send,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ShieldCheck,
  Headphones,
} from 'lucide-react';

export const OPEN_SUPPORT_EVENT = 'open-superstorez-support-modal';

export function openSupportDesk() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_SUPPORT_EVENT));
  }
}

export const SupportWidget: React.FC = () => {
  const { siteSettings, navigateTo } = useStore();
  const { isBangla } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [orderTrackInput, setOrderTrackInput] = useState('');
  const [hasNewNotification, setHasNewNotification] = useState(true);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(OPEN_SUPPORT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_SUPPORT_EVENT, handleOpen);
  }, []);

  const cleanWhatsapp = (siteSettings.supportWhatsapp || '01788992211')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '880');

  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    'আসসালামু আলাইকুম, SuperStorez থেকে আমার একটি সহায়তা প্রয়োজন।'
  )}`;

  const telegramHandle = (siteSettings.supportTelegram || '@superstorez_support').replace(/^@/, '');
  const telegramUrl = `https://t.me/${telegramHandle}`;

  const faqs = [
    {
      q: 'টাকা পাঠানোর কতক্ষণের মধ্যে ডায়মন্ড/ইউসি ডেলিভারি পাব?',
      a: 'অর্ডার করার পর আমাদের স্বয়ংক্রিয় সিস্টেম ১ থেকে ৫ মিনিটের মধ্যে গেম অ্যাকাউন্টে সরাসরি টপআপ সম্পন্ন করে। সার্ভার ব্যস্ত থাকলে সর্বোচ্চ ১৫ মিনিট লাগতে পারে।',
    },
    {
      q: 'ওয়ালেটে ডিপোজিট করার পর ব্যালেন্স যোগ হতে কত সময় লাগে?',
      a: 'বিকাশ, নগদ বা রকেটে ট্রানজেকশন আইডি দিয়ে সাবমিট করার পর আমাদের অটো-ভেরিফিকেশন ২ থেকে ১০ মিনিটের মধ্যে ব্যালেন্স যুক্ত করে দেয়।',
    },
    {
      q: 'অর্ডার সফল না হলে কি রিফান্ড পাওয়া যায়?',
      a: 'হ্যাঁ, কোনো কারণে টেকনিক্যাল ত্রুটিতে ডেলিভারি অসম্ভব হলে ১০০% টাকা আপনার সুপারস্টোরজ ওয়ালেট বা মূল বিকাশ/নগদে রিফান্ড প্রদান করা হয়।',
    },
  ];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderTrackInput.trim()) {
      setIsOpen(false);
      navigateTo('track-order');
    }
  };

  return (
    <>
      {/* Floating Support Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Pulsing Help Bubble for first-time visitors */}
        {hasNewNotification && !isOpen && (
          <div className="mb-2 relative animate-bounce">
            <div className="bg-gradient-to-r from-[#6BA8F5] to-[#4D91E8] text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg flex items-center gap-1.5 border border-[#C7E2FF]/60">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{isBangla ? 'সাহায্য দরকার? লাইভ সাপোর্ট!' : 'Need help? Live Support'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasNewNotification(false);
                }}
                className="hover:text-black ml-1 text-white font-bold"
              >
                ×
              </button>
            </div>
            <div className="w-2 h-2 bg-[#4D91E8] rotate-45 absolute -bottom-1 right-6" />
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(true);
            setHasNewNotification(false);
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#4D91E8] via-[#6BA8F5] to-[#4D91E8] hover:from-[#3a7cd4] hover:to-[#5a9bf0] text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
          aria-label="কাস্টমার সাপোর্ট"
        >
          <Headphones className="w-5 h-5 text-white relative z-10" />
          <span className="hidden sm:inline font-heading font-black text-xs text-white uppercase tracking-wider relative z-10">
            {isBangla ? 'লাইভ সাপোর্ট' : 'Live Support'}
          </span>

          {/* Green Online Dot */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-[#080D18]" />
          </span>
        </button>
      </div>

      {/* Support Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="modal-surface bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#EAF4FF] dark:bg-[#172B45] border-b border-[#C7E2FF] dark:border-[#1f3a5e] flex items-start justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[#6BA8F5]/20 dark:bg-cyan-500/20 border border-[#6BA8F5]/40 dark:border-cyan-500/40 flex items-center justify-center text-[#2563EB] dark:text-cyan-300">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                      {isBangla ? 'গ্রাহক সেবা ও লাইভ হেল্পডেস্ক' : 'Customer Support & Helpdesk'}
                    </h3>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-950/80 border border-emerald-500/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isBangla ? 'অনলাইনে আছেন (দ্রুত রিপ্লাই)' : 'Online (Instant Reply)'}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] text-slate-700 dark:text-slate-300 text-[11px]">
                    <Clock className="w-3 h-3 text-[#2563EB] dark:text-cyan-400" />
                    <span>{siteSettings.supportHours || 'প্রতিদিন সকাল ০৯:০০ - রাত ০১:০০'}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors relative z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Notice Banner */}
              {siteSettings.supportNotice && (
                <div className="p-3.5 rounded-2xl bg-[#EAF4FF] dark:bg-cyan-950/40 border border-[#C7E2FF] dark:border-cyan-800/60 text-xs text-slate-800 dark:text-cyan-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{siteSettings.supportNotice}</p>
                </div>
              )}

              {/* Instant Contact Channels */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  {isBangla ? 'সরাসরি যোগাযোগ চ্যানেলসমূহ' : 'Direct Support Channels'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#EAF4FF] hover:bg-[#C7E2FF] dark:bg-[#172B45] dark:hover:bg-[#1f3a5e] border border-[#C7E2FF] dark:border-emerald-800/50 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                          {isBangla ? 'হোয়াটসঅ্যাপ চ্যাট' : 'WhatsApp Chat'}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                          {siteSettings.supportWhatsapp || '+880 1788-992211'}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </a>

                  {/* Telegram */}
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#EAF4FF] hover:bg-[#C7E2FF] dark:bg-[#172B45] dark:hover:bg-[#1f3a5e] border border-[#C7E2FF] dark:border-cyan-800/50 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#2563EB] dark:text-cyan-400 flex items-center justify-center font-bold">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-cyan-300 transition-colors">
                          {isBangla ? 'টেলিগ্রাম সাপোর্ট' : 'Telegram Support'}
                        </div>
                        <div className="text-[11px] text-[#2563EB] dark:text-cyan-400 font-mono font-medium">
                          {siteSettings.supportTelegram || '@superstorez_support'}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                  </a>

                  {/* Email Support */}
                  <a
                    href={`mailto:${siteSettings.supportEmail || 'support@superstorez.com'}`}
                    className="p-3.5 rounded-2xl bg-[#EAF4FF] hover:bg-[#C7E2FF] dark:bg-[#172B45] dark:hover:bg-[#1f3a5e] border border-[#C7E2FF] dark:border-purple-800/50 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                          {isBangla ? 'ইমেইল সাপোর্ট' : 'Email Support'}
                        </div>
                        <div className="text-[11px] text-purple-600 dark:text-purple-400 font-mono truncate max-w-[140px] font-medium">
                          {siteSettings.supportEmail || 'support@superstorez.com'}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </a>
                </div>
              </div>

              {/* Quick Order Lookup Form */}
              <div className="p-4 rounded-2xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#1f3a5e]">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Search className="w-3.5 h-3.5 text-[#2563EB] dark:text-cyan-400" />
                  <span>{isBangla ? 'অর্ডার স্টেটাস চেক করবেন?' : 'Check Order Status'}</span>
                </div>
                <form onSubmit={handleTrackSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={orderTrackInput}
                    onChange={(e) => setOrderTrackInput(e.target.value)}
                    placeholder="যেমন: SSBD-89210"
                    className="flex-1 bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6BA8F5]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#6BA8F5] hover:bg-[#4D91E8] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-black font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isBangla ? 'ট্র্যাক' : 'Track'}
                  </button>
                </form>
              </div>

              {/* FAQ Accordion */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#2563EB] dark:text-cyan-400" />
                    <span>{isBangla ? 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)' : 'Frequently Asked Questions'}</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, idx) => {
                    const isExpanded = activeFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#1f3a5e] overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveFaqIndex(isExpanded ? null : idx)}
                          className="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#2563EB] dark:text-cyan-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-[#C7E2FF] dark:border-[#1f3a5e] pt-2.5">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#EAF4FF] dark:bg-[#172B45] border-t border-[#C7E2FF] dark:border-[#1f3a5e] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>১০০% নিরাপদ ও নির্ভরযোগ্য সহায়তা</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                {isBangla ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
