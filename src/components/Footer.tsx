import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { openSupportDesk } from './SupportWidget';
import { Headphones, MessageCircle, Send, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { siteSettings, navigateTo } = useStore();
  const { isAdmin } = useAuth();
  const { isBangla, t } = useLanguage();

  const cleanWhatsapp = (siteSettings.supportWhatsapp || '01788992211')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '880');

  return (
    <footer className="border-t border-[#C7E2FF] dark:border-[#172B45] bg-white dark:bg-[#101B2D] text-slate-600 dark:text-slate-400 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div>
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer mb-4"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4D91E8] to-[#6BA8F5] flex items-center justify-center font-heading font-black text-white text-sm">
                SS
              </div>
              <span className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                {siteSettings.storeName || 'SuperStorez.com'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              {isBangla
                ? siteSettings.footerText ||
                  'বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ডিজিটাল পণ্য ও ইনস্ট্যান্ট গেম টপআপ মার্কেটপ্লেস। ১০০% অফিশিয়াল ও নিরাপদ গেটওয়ে।'
                : 'Bangladesh’s most trusted marketplace for digital game top-ups and gift cards. 100% official and automated.'}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isBangla
                ? 'সার্বক্ষণিক ডিজিটাল অটোমেশন ও সিকিউর গেটওয়ে সংযুক্ত।'
                : '24/7 automated delivery & secure payment gateway.'}
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-4">
              {isBangla ? 'ক্যাটাগরি সমূহ' : 'Categories'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigateTo('catalog', { categorySlug: 'game-top-up' })}
                  className="hover:text-[#2563EB] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isBangla ? 'ফ্রি ফায়ার ডায়মন্ড টপআপ' : 'Free Fire Diamond Top-Up'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('catalog', { categorySlug: 'game-top-up' })}
                  className="hover:text-[#2563EB] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isBangla ? 'পাবজি মোবাইল ইউসি (UC)' : 'PUBG Mobile UC'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('catalog', { categorySlug: 'digital-cards' })}
                  className="hover:text-[#2563EB] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isBangla ? 'স্টিম ওয়ালেট গিফট কার্ড' : 'Steam Wallet Gift Cards'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('catalog', { categorySlug: 'digital-cards' })}
                  className="hover:text-[#2563EB] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isBangla ? 'গুগল প্লে স্টোর কার্ড' : 'Google Play Gift Cards'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center justify-between">
              <span>{isBangla ? 'কাস্টমার সার্ভিস ও হেল্পডেস্ক' : 'Customer Service & Helpdesk'}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={openSupportDesk}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-semibold transition-all cursor-pointer mb-1"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>{isBangla ? 'লাইভ সাপোর্ট ওপেন করুন' : 'Open Live Support'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('track-order')}
                  className="text-[#2563EB] dark:text-cyan-400 hover:underline font-semibold transition-colors cursor-pointer"
                >
                  {isBangla ? 'অর্ডার লাইভ ট্র্যাক করুন' : 'Live Order Tracker'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('account')}
                  className="hover:text-[#2563EB] dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isBangla ? 'ওয়ালেট ব্যালেন্স ও হিস্ট্রি' : 'Wallet Balance & History'}
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span>{isBangla ? 'হোয়াটসঅ্যাপ: ' : 'WhatsApp: '}</span>
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 dark:text-slate-200 hover:text-emerald-500 font-mono transition-colors font-medium"
                >
                  {siteSettings.supportWhatsapp || '+880 1788-992211'}
                </a>
              </li>
              {siteSettings.supportTelegram && (
                <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Send className="w-3.5 h-3.5 text-[#2563EB] dark:text-cyan-400 flex-shrink-0" />
                  <span>{isBangla ? 'টেলিগ্রাম: ' : 'Telegram: '}</span>
                  <a
                    href={`https://t.me/${siteSettings.supportTelegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] dark:text-cyan-400 hover:underline font-mono font-medium"
                  >
                    {siteSettings.supportTelegram}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                <span>{isBangla ? 'ইমেইল: ' : 'Email: '}</span>
                <a
                  href={`mailto:${siteSettings.supportEmail || 'support@superstorez.com'}`}
                  className="text-slate-900 dark:text-slate-200 hover:text-purple-500 font-mono transition-colors font-medium"
                >
                  {siteSettings.supportEmail || 'support@superstorez.com'}
                </a>
              </li>
              {siteSettings.supportHours && (
                <li className="text-[11px] text-slate-500 pt-1 border-t border-[#C7E2FF] dark:border-[#172B45]">
                  {siteSettings.supportHours}
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Safe Payments */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base mb-4">
              {isBangla ? 'নিরাপদ পেমেন্ট মেথড' : 'Payment Methods'}
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-1 rounded bg-[#e2136e] text-white font-bold text-[11px] shadow-sm">
                bKash
              </span>
              <span className="px-2.5 py-1 rounded bg-[#f7941d] text-white font-bold text-[11px] shadow-sm">
                Nagad
              </span>
              <span className="px-2.5 py-1 rounded bg-[#8c3795] text-white font-bold text-[11px] shadow-sm">
                Rocket
              </span>
              <span className="px-2.5 py-1 rounded bg-[#6BA8F5] dark:bg-cyan-950/60 text-white dark:text-cyan-300 font-bold text-[11px] shadow-sm">
                SSBD Wallet
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isBangla
                ? 'সমস্ত লেনদেন এনক্রিপ্ট করা ও রিয়েল-টাইম MFS লেজার দ্বারা সুরক্ষিত।'
                : 'All transactions are encrypted and tracked via real-time ledger.'}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#C7E2FF] dark:border-[#172B45] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 {siteSettings.storeName || 'SuperStorez.com'}. {isBangla ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">{isBangla ? 'প্রাইভেসি পলিসি' : 'Privacy Policy'}</span>
            <span>•</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">{isBangla ? 'টার্মস অ্যান্ড কন্ডিশনস' : 'Terms & Conditions'}</span>
            <span>•</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">{isBangla ? 'রিফান্ড গ্যারান্টি' : 'Refund Policy'}</span>

            {/* Admin Portal Access */}
            {isAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={() => navigateTo('admin')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAF4FF] dark:bg-slate-900 text-[#2563EB] dark:text-cyan-300 border border-[#C7E2FF] dark:border-slate-700 text-[11px] transition-all cursor-pointer font-medium"
                  title="SuperStorez Admin Dashboard"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6BA8F5] dark:bg-cyan-400 animate-pulse" />
                  <span>{isBangla ? 'এডমিন প্যানেল' : 'Admin Panel'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
