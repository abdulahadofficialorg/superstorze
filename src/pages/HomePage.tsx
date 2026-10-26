import React from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from '../components/Hero';
import { QuickZoneCards } from '../components/QuickZoneCards';
import { ProductCard } from '../components/ProductCard';
import { HowItWorks } from '../components/HowItWorks';
import { Zap, ArrowRight, Sparkles, Shield, Gift } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, categories, siteSettings, navigateTo } = useStore();

  const popularProducts = products.filter((p) => p.isPopular && p.isActive).slice(0, 6);
  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive).slice(0, 6);

  return (
    <div>
      {/* Hero Section matching screenshot 1 */}
      <Hero />

      {/* 3 Quick Zone Cards matching screenshot 1 */}
      <QuickZoneCards />

      {/* Popular Products & Offers Section matching screenshot 1 & 2 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg sm:text-2xl font-heading">
              <Zap className="w-5 h-5 fill-amber-400" />
              <span>{siteSettings.popularSectionTitle || 'জনপ্রিয় প্রোডাক্ট ও অফার'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {siteSettings.popularSectionSubtitle || 'সবচেয়ে বেশি ক্রয়কৃত টপআপ ও ডিজিটাল ভাউচার'}
            </p>
          </div>

          <button
            onClick={() => navigateTo('catalog')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium group transition-colors cursor-pointer"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product Cards Grid matching reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Featured Digital Gift Cards Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg sm:text-2xl font-heading">
              <Gift className="w-5 h-5" />
              <span>{siteSettings.giftCardSectionTitle || 'ডিজিটাল গিফট কার্ড ও রিডিম কোড'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {siteSettings.giftCardSectionSubtitle || 'স্টিম, গুগল প্লে, অ্যাপল ও অন্যান্য অফিশিয়াল ভাউচার'}
            </p>
          </div>

          <button
            onClick={() => navigateTo('catalog', { categorySlug: 'digital-cards' })}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium group transition-colors"
          >
            <span>কার্ডসমূহ</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredProducts
            .filter((p) => p.categoryId === 'digital-cards')
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>

      {/* How it Works Section matching screenshot 2 */}
      <HowItWorks />
    </div>
  );
};
