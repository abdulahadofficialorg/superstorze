import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { Zap, Shield, Clock } from 'lucide-react';

export const QuickZoneCards: React.FC = () => {
  const { navigateTo } = useStore();
  const { isBangla, t } = useLanguage();

  const zones = [
    {
      tag: isBangla ? 'টপআপ জোন' : 'TOP-UP ZONE',
      title: isBangla ? 'গেম টপআপ' : 'Game Top-Up',
      subtitle: isBangla ? 'Free Fire, PUBG, MLBB, Valorant' : 'Free Fire, PUBG, MLBB, Valorant',
      icon: Zap,
      iconColor: 'text-[#2563EB] dark:text-cyan-400',
      iconBg: 'bg-[#EAF4FF] dark:bg-[#172B45] border-[#C7E2FF] dark:border-[#1f3a5e]',
      onClick: () => navigateTo('catalog', { categorySlug: 'game-top-up' }),
    },
    {
      tag: isBangla ? 'ডিজিটাল কার্ড' : 'DIGITAL CARDS',
      title: isBangla ? 'গিফট কার্ড ও কি' : 'Gift Cards & Keys',
      subtitle: isBangla ? 'Steam, Google Play, Apple, Win 11' : 'Steam, Google Play, Apple, Win 11',
      icon: Shield,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
      onClick: () => navigateTo('catalog', { categorySlug: 'digital-cards' }),
    },
    {
      tag: isBangla ? 'লাইভ ফিচার' : 'LIVE FEATURE',
      tagDot: true,
      title: isBangla ? 'অর্ডার ট্র্যাকার' : 'Order Tracker',
      subtitle: isBangla ? 'অর্ডার নম্বর দিয়ে লাইভ স্ট্যাটাস দেখুন' : 'Check real-time delivery status',
      icon: Clock,
      iconColor: 'text-[#2563EB] dark:text-cyan-400',
      iconBg: 'bg-[#EAF4FF] dark:bg-[#172B45] border-[#C7E2FF] dark:border-[#1f3a5e]',
      onClick: () => navigateTo('track-order'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones.map((zone, idx) => {
          const Icon = zone.icon;
          return (
            <div
              key={idx}
              onClick={zone.onClick}
              className="quick-zone-card cursor-pointer group relative rounded-2xl bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/50 p-5 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-md flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {zone.tagDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6BA8F5] dark:bg-cyan-400 animate-pulse" />
                  )}
                  <span className="text-[11px] font-bold text-[#2563EB] dark:text-cyan-400 uppercase tracking-wider">
                    {zone.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-cyan-400 transition-colors">
                  {zone.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{zone.subtitle}</p>
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border ${zone.iconBg} ${zone.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 ml-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
