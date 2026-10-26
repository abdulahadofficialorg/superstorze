import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, categories, selectedCategorySlug, searchTerm, setSearchTerm, navigateTo } =
    useStore();
  const { isBangla, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategorySlug || 'all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'name'>('popular');

  useEffect(() => {
    if (selectedCategorySlug) {
      setActiveCategory(selectedCategorySlug);
    }
  }, [selectedCategorySlug]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.isActive) return false;
        const matchesCategory =
          activeCategory === 'all' || p.categoryId === activeCategory;
        const matchesSearch =
          searchTerm.trim() === '' ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        if (sortBy === 'price-low') return a.basePrice - b.basePrice;
        if (sortBy === 'price-high') return b.basePrice - a.basePrice;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, activeCategory, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Home Button */}
      <div className="mb-4">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#101B2D] hover:bg-[#EAF4FF] dark:hover:bg-[#172B45] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-[#C7E2FF] dark:border-[#172B45] text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#2563EB] dark:text-cyan-400" />
          <span>{isBangla ? '← হোমে ফিরে যান' : '← Back to Home'}</span>
        </button>
      </div>

      {/* Header and Search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              {isBangla ? 'প্রোডাক্ট ক্যাটালগ ও গেম স্টোর' : 'Product Catalog & Store'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isBangla
                ? 'আপনার পছন্দের গেম টপআপ ও ডিজিটাল কার্ড বেছে নিন'
                : 'Browse all game top-ups, gift cards and subscriptions'}
            </p>
          </div>

          {/* Search Bar in Catalog */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBangla ? 'গেম বা কার্ড খুঁজুন...' : 'Search games or cards...'}
              className="w-full bg-white dark:bg-[#172B45] text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 pl-10 pr-9 py-2.5 rounded-xl border border-[#C7E2FF] dark:border-[#172B45] focus:outline-none focus:border-[#6BA8F5] dark:focus:border-cyan-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] shadow-sm">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black shadow-sm'
                  : 'bg-[#EAF4FF] dark:bg-[#172B45] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#C7E2FF] dark:hover:bg-[#1f3a5e] border border-[#C7E2FF] dark:border-[#172B45]'
              }`}
            >
              {isBangla
                ? `সকল পণ্য (${products.filter((p) => p.isActive).length})`
                : `All Items (${products.filter((p) => p.isActive).length})`}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black shadow-sm'
                    : 'bg-[#EAF4FF] dark:bg-[#172B45] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#C7E2FF] dark:hover:bg-[#1f3a5e] border border-[#C7E2FF] dark:border-[#172B45]'
                }`}
              >
                {isBangla ? (cat.nameBn || cat.name) : cat.name}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">{isBangla ? 'সাজান:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#EAF4FF] dark:bg-[#172B45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 border border-[#C7E2FF] dark:border-[#172B45] focus:outline-none cursor-pointer"
            >
              <option value="popular">{isBangla ? 'জনপ্রিয়তা' : 'Most Popular'}</option>
              <option value="price-low">{isBangla ? 'কম দাম আগে' : 'Price: Low to High'}</option>
              <option value="price-high">{isBangla ? 'বেশি দাম আগে' : 'Price: High to Low'}</option>
              <option value="name">{isBangla ? 'নাম (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#101B2D] rounded-3xl border border-[#C7E2FF] dark:border-[#172B45] shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-base mb-2">
            {isBangla ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchTerm('');
            }}
            className="text-xs text-[#2563EB] dark:text-cyan-400 hover:underline cursor-pointer"
          >
            {isBangla ? 'সকল ফিল্টার মুছুন' : 'Clear all filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
