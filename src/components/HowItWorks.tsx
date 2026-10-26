import React from 'react';
import { useLanguage } from '../context/ThemeLanguageContext';

export const HowItWorks: React.FC = () => {
  const { isBangla, t } = useLanguage();

  const steps = [
    {
      num: isBangla ? '১' : '1',
      title: t('step_1_title'),
      desc: t('step_1_desc'),
    },
    {
      num: isBangla ? '২' : '2',
      title: t('step_2_title'),
      desc: t('step_2_desc'),
    },
    {
      num: isBangla ? '৩' : '3',
      title: t('step_3_title'),
      desc: t('step_3_desc'),
    },
  ];

  return (
    <section className="py-14 border-t border-[#C7E2FF] dark:border-[#172B45]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="step-card-container rounded-3xl border border-[#C7E2FF] dark:border-[#172B45] bg-white dark:bg-[#101B2D] p-6 sm:p-12 relative overflow-hidden shadow-sm">
          {/* Subtle gradient glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#6BA8F5]/5 dark:bg-[#4D91E8]/5 blur-[100px] pointer-events-none" />

          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">
              {t('how_it_works_title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              {t('how_it_works_subtitle')}
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="step-item-card rounded-2xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#1f3a5e] p-6 relative hover:border-[#6BA8F5] dark:hover:border-[#4D91E8]/60 transition-all shadow-sm"
              >
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#1f3a5e] text-[#2563EB] dark:text-[#4D91E8] font-heading font-extrabold text-base flex items-center justify-center mb-4 shadow-sm">
                  {s.num}
                </div>

                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
