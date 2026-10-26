import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, SiteSettings, Order } from '../types';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeSiteSettings,
  initializeDatabaseIfEmpty,
} from '../services/storeService';
import { initialProducts, initialCategories, initialSiteSettings } from '../data/seedData';

export type PageRoute =
  | 'home'
  | 'catalog'
  | 'product-details'
  | 'cart'
  | 'checkout'
  | 'track-order'
  | 'order-confirmation'
  | 'account'
  | 'admin';

interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  siteSettings: SiteSettings;
  loading: boolean;
  currentPage: PageRoute;
  selectedProductId: string | null;
  selectedCategorySlug: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  lastCreatedOrder: Order | null;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
  navigateTo: (
    page: PageRoute,
    params?: { productId?: string; categorySlug?: string; order?: Order }
  ) => void;
  refreshData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
  const [loading, setLoading] = useState(true);

  // Routing
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || window.location.pathname.includes('/admin')) return 'admin';
      if (hash === 'track-order') return 'track-order';
      if (hash === 'catalog') return 'catalog';
      if (hash === 'account') return 'account';
    }
    return 'home';
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Toast
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (
    page: PageRoute,
    params?: { productId?: string; categorySlug?: string; order?: Order }
  ) => {
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.categorySlug !== undefined) setSelectedCategorySlug(params.categorySlug);
    if (params?.order) setLastCreatedOrder(params.order);

    setCurrentPage(page);
    try {
      window.location.hash = page;
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin') setCurrentPage('admin');
      else if (hash === 'track-order') setCurrentPage('track-order');
      else if (hash === 'catalog') setCurrentPage('catalog');
      else if (hash === 'account') setCurrentPage('account');
      else if (hash === 'home' || hash === '') setCurrentPage('home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Real-time subscriptions
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubCategories = subscribeCategories((cats) => {
      setCategories(cats);
    });

    const unsubSettings = subscribeSiteSettings((settings) => {
      setSiteSettings(settings);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        siteSettings,
        loading,
        currentPage,
        selectedProductId,
        selectedCategorySlug,
        searchTerm,
        setSearchTerm,
        lastCreatedOrder,
        toasts,
        showToast,
        removeToast,
        navigateTo,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
