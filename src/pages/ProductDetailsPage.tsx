import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import { saveTopUpRequirementToSupabase } from '../services/supabaseService';
import { Product, ProductVariation } from '../types';
import {
  ArrowLeft,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export const ProductDetailsPage: React.FC = () => {
  const { products, selectedProductId, navigateTo, showToast } = useStore();
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const { isBangla, t } = useLanguage();

  const product: Product | undefined = products.find((p) => p.id === selectedProductId) || products[0];

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      if (product.variations && product.variations.length > 0) {
        const firstActive = product.variations.find((v) => v.active && v.stock > 0) || product.variations[0];
        setSelectedVariation(firstActive);
      } else {
        setSelectedVariation(null);
      }
      setCustomFieldValues({});
      setFieldErrors({});
      setQuantity(1);
    }
  }, [product?.id]);

  const currentPrice = selectedVariation ? selectedVariation.price : (product?.basePrice ?? 0);
  const oldPrice = selectedVariation?.oldPrice || product?.oldPrice;
  const discountPercent = oldPrice && currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
  const isOutOfStock = selectedVariation ? selectedVariation.stock <= 0 : (product ? product.stock <= 0 : false);

  // Debounced auto-save to Supabase when custom fields are filled
  useEffect(() => {
    const hasValues = Object.values(customFieldValues).some((v) => v && v.trim().length > 0);
    if (!hasValues || !product) return;

    const timer = setTimeout(() => {
      saveTopUpRequirementToSupabase({
        productId: product.id,
        productName: product.name,
        packageName: selectedVariation?.name || 'Standard Package',
        price: currentPrice * quantity,
        customFields: customFieldValues,
        customerName: profile?.displayName || user?.displayName || 'Customer',
        customerEmail: profile?.email || user?.email || '',
        customerPhone: profile?.phoneNumber || '',
        status: 'requirements_filled',
      }).catch((err) => console.warn('[Supabase] Auto-save notice:', err));
    }, 1200);

    return () => clearTimeout(timer);
  }, [customFieldValues, selectedVariation?.id, quantity, product?.id, currentPrice]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">প্রোডাক্ট লোড হচ্ছে অথবা খুঁজে পাওয়া যায়নি।</p>
        <button
          onClick={() => navigateTo('catalog')}
          className="mt-4 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-sm"
        >
          ক্যাটালগে ফিরে যান
        </button>
      </div>
    );
  }

  const validateCustomFields = (): boolean => {
    const errors: Record<string, string> = {};
    if (product.customFields) {
      for (const field of product.customFields) {
        const val = customFieldValues[field.label]?.trim() || '';
        if (field.required && !val) {
          errors[field.label] = `${field.label} প্রদান করা আবশ্যক`;
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('এই ভ্যারিয়েশনটির স্টক শেষ হয়ে গেছে।', 'error');
      return;
    }
    if (!validateCustomFields()) {
      showToast('দয়া করে আবশ্যকীয় তথ্যগুলো পূরণ করুন।', 'error');
      return;
    }

    const cartItemId = `${product.id}_${selectedVariation?.id || 'base'}_${JSON.stringify(customFieldValues)}`;

    addToCart({
      id: cartItemId,
      productId: product.id,
      productName: product.name,
      subtitle: product.subtitle,
      variationId: selectedVariation?.id || 'base',
      variationName: selectedVariation?.name || 'Standard Package',
      price: currentPrice,
      quantity,
      imageUrl: product.imageUrl,
      customFieldValues,
    });

    // Save top-up requirement details to Supabase backend
    saveTopUpRequirementToSupabase({
      productId: product.id,
      productName: product.name,
      packageName: selectedVariation?.name || 'Standard Package',
      price: currentPrice * quantity,
      customFields: customFieldValues,
      customerName: profile?.displayName || user?.displayName || 'Customer',
      customerEmail: profile?.email || user?.email || '',
      customerPhone: profile?.phoneNumber || '',
      status: 'added_to_cart',
    }).catch((err) => console.warn('Supabase top-up requirement save notice:', err));

    showToast(`'${product.name}' কার্টে যুক্ত করা হয়েছে!`, 'success');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast('এই প্যাকেজটির স্টক বর্তমানে শেষ।', 'error');
      return;
    }
    if (!validateCustomFields()) {
      showToast('দয়া করে আবশ্যক তথ্যগুলো দিন।', 'error');
      return;
    }

    const cartItemId = `${product.id}_${selectedVariation?.id || 'base'}_${JSON.stringify(customFieldValues)}`;

    addToCart({
      id: cartItemId,
      productId: product.id,
      productName: product.name,
      subtitle: product.subtitle,
      variationId: selectedVariation?.id || 'base',
      variationName: selectedVariation?.name || 'Standard Package',
      price: currentPrice,
      quantity,
      imageUrl: product.imageUrl,
      customFieldValues,
    });

    // Save top-up requirement details to Supabase backend
    saveTopUpRequirementToSupabase({
      productId: product.id,
      productName: product.name,
      packageName: selectedVariation?.name || 'Standard Package',
      price: currentPrice * quantity,
      customFields: customFieldValues,
      customerName: profile?.displayName || user?.displayName || 'Customer',
      customerEmail: profile?.email || user?.email || '',
      customerPhone: profile?.phoneNumber || '',
      status: 'buy_now_intent',
    }).catch((err) => console.warn('Supabase top-up requirement save notice:', err));

    navigateTo('checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigateTo('catalog')}
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-cyan-400 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{isBangla ? '← ক্যাটালগে ফিরে যান' : '← Back to Catalog'}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Media & Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl overflow-hidden bg-[#0c1426] border border-slate-800 p-2 shadow-2xl">
            <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-slate-900">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101e] via-transparent to-transparent opacity-60" />

              {/* Tag pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500 text-black shadow-lg">
                  {product.categoryName}
                </span>
                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-lg">
                    {discountPercent}% {isBangla ? 'ছাড়' : 'OFF'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Trust badges */}
          <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{isBangla ? '১০০% অফিসিয়াল কোড ও গ্যারান্টিযুক্ত টপআপ' : '100% Official Codes & Guaranteed Top-Up'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{isBangla ? '১ থেকে ৩ মিনিটের মধ্যে অটোমেটিক ডেলিভারি' : '1-3 Minutes Instant Automated Delivery'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{isBangla ? 'বিকাশ, নগদ ও রকেটে সম্পূর্ণ নিরাপদ লেনদেন' : 'Secure payments via bKash, Nagad & Rocket'}</span>
            </div>
          </div>

          {/* Instructions Guide */}
          {product.instructions && (
            <div className="p-5 rounded-2xl bg-[#0a1224] border border-slate-800">
              <h4 className="font-heading font-bold text-sm text-cyan-400 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" />
                <span>{isBangla ? 'রিডিম বা ব্যবহারের নিয়ম' : 'How to Redeem / Use'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {product.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Details, Variations & Configurator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div>
            <div className="text-xs font-medium text-cyan-400 mb-1">
              {product.tags?.join(' • ')}
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white">
              {product.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
              {product.subtitle}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="font-heading font-black text-3xl sm:text-4xl text-cyan-400">
                ৳ {currentPrice * quantity}
              </span>
              {oldPrice && oldPrice > currentPrice && (
                <span className="text-slate-500 line-through text-lg font-heading">
                  ৳ {oldPrice * quantity}
                </span>
              )}
              {isOutOfStock ? (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {isBangla ? 'স্টক আউট' : 'Out of Stock'}
                </span>
              ) : (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {isBangla ? 'স্টকে আছে' : 'In Stock'}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {product.description}
          </div>

          {/* Step 1: Variations / Packages Selection */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isBangla ? '১. প্যাকেজ নির্বাচন করুন' : '1. Select Package'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation?.id === v.id;
                  const isAvailable = v.active && v.stock > 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedVariation(v)}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                          : isAvailable
                          ? 'bg-[#0d1629] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          : 'bg-slate-900/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="font-heading font-bold text-xs sm:text-sm truncate">
                        {v.name}
                      </div>
                      <div className="font-heading font-extrabold text-sm text-cyan-400 mt-1">
                        ৳ {v.price}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Custom Credentials Required Fields */}
          {product.customFields && product.customFields.length > 0 && (
            <div className="space-y-3 p-5 rounded-2xl bg-[#0a1224] border border-slate-800">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isBangla ? '২. প্লেয়ার আইডি ও তথ্য প্রদান করুন' : '2. Enter Player ID & Requirements'}
              </label>

              {product.customFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">
                      {field.label} {field.required && <span className="text-cyan-400">*</span>}
                    </span>
                    {field.helpText && (
                      <span className="text-[11px] text-slate-400">{field.helpText}</span>
                    )}
                  </div>

                  <input
                    type={field.type || 'text'}
                    value={customFieldValues[field.label] || ''}
                    onChange={(e) => {
                      setCustomFieldValues({
                        ...customFieldValues,
                        [field.label]: e.target.value,
                      });
                      if (fieldErrors[field.label]) {
                        const newErrs = { ...fieldErrors };
                        delete newErrs[field.label];
                        setFieldErrors(newErrs);
                      }
                    }}
                    onBlur={() => {
                      const val = customFieldValues[field.label]?.trim();
                      if (val && product) {
                        saveTopUpRequirementToSupabase({
                          productId: product.id,
                          productName: product.name,
                          packageName: selectedVariation?.name || 'Standard Package',
                          price: currentPrice * quantity,
                          customFields: customFieldValues,
                          customerName: profile?.displayName || user?.displayName || 'Customer',
                          customerEmail: profile?.email || user?.email || '',
                          customerPhone: profile?.phoneNumber || '',
                          status: 'requirements_filled',
                        }).catch((err) => console.warn('[Supabase] Field onBlur save notice:', err));
                      }
                    }}
                    placeholder={field.placeholder || (isBangla ? `আপনার ${field.label} লিখুন` : `Enter your ${field.label}`)}
                    className={`w-full bg-[#0d1629] text-sm text-slate-200 px-4 py-2.5 rounded-xl border transition-all ${
                      fieldErrors[field.label]
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'
                    }`}
                  />
                  {fieldErrors[field.label] && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors[field.label]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isBangla ? 'পরিমাণ (Quantity):' : 'Quantity:'}
            </span>
            <div className="flex items-center bg-[#0d1629] border border-slate-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <span className="w-10 text-center font-heading font-bold text-base text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-[#121c32] hover:bg-[#1a2745] text-cyan-300 border-cyan-800/80 hover:border-cyan-400 shadow-md'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isBangla ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-500/25 active:scale-[0.99]'
              }`}
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{isBangla ? 'এখনই কিনুন' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
