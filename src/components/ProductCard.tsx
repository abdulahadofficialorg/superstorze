import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { ArrowRight, Star, Flame } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo } = useStore();
  const { isBangla, t } = useLanguage();

  const validVariations = (product.variations || []).filter(
    (v) => typeof v.price === 'number' && !isNaN(v.price)
  );
  const minPrice =
    validVariations.length > 0
      ? Math.min(...validVariations.map((v) => v.price))
      : (product.basePrice || 0);

  const maxPrice =
    validVariations.length > 0
      ? Math.max(...validVariations.map((v) => v.price))
      : (product.basePrice || 0);

  const priceRange =
    minPrice === maxPrice
      ? `৳ ${minPrice}`
      : `৳ ${minPrice} - ৳ ${maxPrice}`;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div
      onClick={() => navigateTo('product-details', { productId: product.id })}
      className="product-item-card cursor-pointer group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/60 p-4 transition-all duration-200 hover:-translate-y-1.5 shadow-sm hover:shadow-md"
    >
      <div>
        {/* Image banner area */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-slate-900 border border-[#C7E2FF] dark:border-slate-800">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

          {/* Badges on image */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {product.isPopular && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shadow-md">
                <Flame className="w-3 h-3 fill-black" />
                <span>{isBangla ? 'জনপ্রিয়' : 'POPULAR'}</span>
              </span>
            )}
            {product.isFeatured && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black shadow-md">
                <Star className="w-3 h-3 fill-white dark:fill-black" />
                <span>{isBangla ? 'ফিচার্ড' : 'FEATURED'}</span>
              </span>
            )}
          </div>

          {/* Stock Tag on Image */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white shadow-sm">
                {isBangla ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-black shadow-sm">
                {isBangla ? 'সীমিত স্টক' : 'Low Stock'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white shadow-sm">
                {isBangla ? 'স্টকে আছে' : 'In Stock'}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="text-[11px] text-[#2563EB] dark:text-cyan-400 font-semibold mb-1 truncate">
          {product.tags && product.tags.length > 0
            ? product.tags.join(' • ')
            : product.categoryName}
        </div>

        {/* Product Title */}
        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Product Subtitle */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {product.subtitle || product.description}
        </p>
      </div>

      {/* Footer info & CTA */}
      <div className="pt-4 mt-3 border-t border-[#C7E2FF] dark:border-[#172B45] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mb-0.5">
            {isBangla ? 'শুরু হচ্ছে' : 'Starts from'}
          </span>
          <span className="font-heading font-bold text-base text-[#2563EB] dark:text-cyan-400">
            {priceRange}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigateTo('product-details', { productId: product.id });
          }}
          disabled={isOutOfStock}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-[#EAF4FF] hover:bg-[#6BA8F5] text-[#2563EB] hover:text-white border border-[#C7E2FF] hover:border-[#6BA8F5] dark:bg-[#172B45] dark:hover:bg-[#4D91E8] dark:text-cyan-300 dark:hover:text-white dark:border-[#1f3a5e] shadow-sm'
          }`}
        >
          <span>{isOutOfStock ? (isBangla ? 'স্টক নেই' : 'Out of Stock') : (isBangla ? 'কিনুন' : 'Buy Now')}</span>
          {!isOutOfStock && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
