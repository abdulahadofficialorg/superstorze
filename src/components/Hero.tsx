import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { Zap, ArrowRight, CheckCircle2, ShieldCheck, Headphones } from 'lucide-react';

export const Hero: React.FC = () => {
  const { siteSettings, navigateTo } = useStore();
  const { isBangla, t } = useLanguage();

  return (
    <div className="relative pt-4 pb-6 md:pt-8 md:pb-10 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#6BA8F5]/10 dark:bg-[#4D91E8]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-purple-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Hero Card Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hero-card-container relative rounded-3xl overflow-hidden border border-[#C7E2FF] dark:border-[#172B45] bg-white dark:bg-[#101B2D] p-5 sm:p-10 md:p-14 shadow-md dark:shadow-2xl transition-colors">
          
          {/* Subtle Gaming Background Imagery with overlay */}
          <div
            className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none bg-cover bg-center mix-blend-luminosity"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent dark:from-[#080D18] dark:via-[#101B2D]/90 dark:to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF4FF] dark:bg-cyan-950/70 border border-[#C7E2FF] dark:border-cyan-800/60 text-[#2563EB] dark:text-cyan-300 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#6BA8F5] dark:bg-cyan-400 animate-ping" />
              <span>
                {isBangla ? (siteSettings.heroBadge || t('hero_badge')) : t('hero_badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 dark:text-white leading-[1.18] mb-4 sm:mb-5">
              <span>
                {isBangla ? (siteSettings.heroTitle || t('hero_title_1')) : t('hero_title_1')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#2563EB] via-[#4D91E8] to-[#6BA8F5] dark:from-cyan-400 dark:via-cyan-300 dark:to-blue-400 bg-clip-text text-transparent">
                {isBangla ? (siteSettings.heroTitleHighlight || t('hero_title_highlight')) : t('hero_title_highlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl font-normal">
              {isBangla ? (siteSettings.heroSubtitle || t('hero_subtitle')) : t('hero_subtitle')}
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-8 sm:mb-10">
              {/* Primary CTA */}
              <button
                onClick={() =>
                  navigateTo(
                    'catalog',
                    siteSettings.heroCta1Link ? { categorySlug: siteSettings.heroCta1Link } : { categorySlug: 'game-top-up' }
                  )
                }
                className="btn-brand-accent flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#6BA8F5] hover:bg-[#4D91E8] dark:bg-[#4D91E8] dark:hover:bg-[#3b82f6] text-white font-bold text-xs sm:text-base transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{siteSettings.heroCta1Text || t('hero_btn_topup')}</span>
              </button>

              {/* Secondary CTA */}
              <button
                onClick={() =>
                  navigateTo(
                    'catalog',
                    siteSettings.heroCta2Link ? { categorySlug: siteSettings.heroCta2Link } : { categorySlug: 'digital-cards' }
                  )
                }
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#EAF4FF] hover:bg-[#C7E2FF] dark:bg-[#172B45] dark:hover:bg-[#1f3a5e] text-slate-800 dark:text-white border border-[#C7E2FF] dark:border-[#172B45] font-semibold text-xs sm:text-base transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>{siteSettings.heroCta2Text || t('hero_btn_cards')}</span>
                <ArrowRight className="w-4 h-4 text-[#2563EB] dark:text-cyan-400" />
              </button>

              {/* Button 3 (Dynamic or Order Track) */}
              <button
                onClick={() =>
                  navigateTo(
                    (siteSettings.heroCta3Link as any) || 'track-order'
                  )
                }
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#EAF4FF] dark:bg-cyan-950/40 hover:bg-[#C7E2FF] dark:hover:bg-cyan-950/70 text-[#2563EB] dark:text-cyan-300 border border-[#C7E2FF] dark:border-cyan-800/60 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#6BA8F5] dark:bg-cyan-400" />
                <span>{siteSettings.heroCta3Text || t('hero_btn_track')}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-5 sm:pt-6 border-t border-[#C7E2FF] dark:border-[#172B45] flex flex-wrap items-center gap-3 sm:gap-8 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{siteSettings.trustBadge1 || t('hero_feature_delivery')}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-cyan-400" />
                <span>{siteSettings.trustBadge2 || t('hero_feature_gateway')}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Headphones className="w-4 h-4 text-[#2563EB] dark:text-cyan-400" />
                <span>{siteSettings.trustBadge3 || t('hero_feature_support')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
