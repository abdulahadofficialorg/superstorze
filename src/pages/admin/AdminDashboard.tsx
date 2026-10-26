import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeAllOrders,
  saveProduct,
  deleteProduct,
  saveCategory,
  deleteCategory,
  updateOrderStatus,
  updateSiteSettings,
  initializeDatabaseIfEmpty,
  subscribeAllDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
  subscribeAllUsers,
  adminAdjustUserWallet,
  subscribeAllWalletTransactions,
  resetLegacy850Balances,
} from '../../services/storeService';
import { initialProducts, initialCategories, initialSiteSettings } from '../../data/seedData';
import {
  Product,
  Category,
  Order,
  SiteSettings,
  ProductVariation,
  CustomField,
  DepositRequest,
  UserProfile,
  WalletTransaction,
} from '../../types';
import { AUTHORIZED_ADMIN_EMAIL } from '../../context/AuthContext';
import {
  checkSupabaseTableStatus,
  fetchTopUpRequirementsFromSupabase,
  drainQueue,
  getLocalQueue,
  SUPABASE_SETUP_SQL,
  SUPABASE_PROJECT_ID,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  SavedTopUpRequirementRow,
} from '../../services/supabaseService';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Settings,
  CreditCard,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  X,
  RefreshCw,
  Sparkles,
  Save,
  Check,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  XCircle,
  Hourglass,
  Copy,
  ExternalLink,
  Users,
  UserCheck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Database,
  Bell,
  Headphones,
  MessageSquare,
  Share2,
  Sliders,
  Globe,
  Shield,
  Phone,
  Mail,
  Send,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'deposits'
  | 'users'
  | 'products'
  | 'categories'
  | 'payments'
  | 'settings'
  | 'supabase';

export const AdminDashboard: React.FC = () => {
  const { products, categories, siteSettings, navigateTo, showToast } = useStore();
  const { user, profile, isAdmin, revokeAdminSession } = useAuth();

  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Search & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [settingsSubTab, setSettingsSubTab] = useState<'banner' | 'hero' | 'support' | 'trust' | 'general' | 'social' | 'footer'>('banner');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Deposit Requests State
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [depositFilter, setDepositFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [rejectModalDeposit, setRejectModalDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('ভুল ট্রানজেকশন আইডি অথবা পেমেন্ট পাওয়া যায়নি');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [confirmApproveDeposit, setConfirmApproveDeposit] = useState<DepositRequest | null>(null);

  // User Management State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [selectedUserForWalletAdjust, setSelectedUserForWalletAdjust] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);
  const [allWalletTxs, setAllWalletTxs] = useState<WalletTransaction[]>([]);
  const [isResetting850, setIsResetting850] = useState(false);

  // Supabase Integration State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    activeTable?: string;
    error?: string;
    projectId: string;
  } | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [supabaseRows, setSupabaseRows] = useState<SavedTopUpRequirementRow[]>([]);
  const [loadingSupabaseRows, setLoadingSupabaseRows] = useState(false);
  const [supabaseQueueCount, setSupabaseQueueCount] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [supabaseSearchQuery, setSupabaseSearchQuery] = useState('');

  const loadSupabaseInfo = async () => {
    setLoadingSupabase(true);
    setLoadingSupabaseRows(true);
    try {
      const status = await checkSupabaseTableStatus();
      setSupabaseStatus(status);
      setSupabaseQueueCount(getLocalQueue().length);
      const res = await fetchTopUpRequirementsFromSupabase();
      if (res.success) {
        setSupabaseRows(res.data);
      }
    } catch (err) {
      console.warn('Supabase fetch error:', err);
    } finally {
      setLoadingSupabase(false);
      setLoadingSupabaseRows(false);
    }
  };

  const handleSyncSupabaseQueue = async () => {
    setIsSyncingQueue(true);
    try {
      const res = await drainQueue();
      if (res.synced > 0) {
        showToast(`${res.synced} টি সংরক্ষিত রিকোয়ারমেন্ট সফলভাবে Supabase-এ সিঙ্ক হয়েছে!`, 'success');
        loadSupabaseInfo();
      } else if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('সিঙ্ক করার মতো পেন্ডিং কোনো ডাটা নেই।', 'info');
      }
    } finally {
      setIsSyncingQueue(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'supabase') {
      loadSupabaseInfo();
    }
  }, [currentTab]);

  useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    const unsub = subscribeAllOrders((orders) => {
      setAllOrders(orders);
      setLoadingOrders(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubDeposits = subscribeAllDepositRequests((requests) => {
      setDepositRequests(requests);
      setLoadingDeposits(false);
    });
    return () => unsubDeposits();
  }, []);

  useEffect(() => {
    const unsubUsers = subscribeAllUsers((users) => {
      setAllUsers(users);
      setLoadingUsers(false);
    });
    const unsubTxs = subscribeAllWalletTransactions((txs) => {
      setAllWalletTxs(txs);
    });
    return () => {
      unsubUsers();
      unsubTxs();
    };
  }, []);

  // Stats calculation
  const totalSales = allOrders
    .filter((o) => o.paymentStatus === 'Paid' || o.orderStatus === 'Completed' || o.orderStatus === 'Delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = allOrders.filter((o) => o.orderStatus === 'Pending').length;
  const completedOrdersCount = allOrders.filter(
    (o) => o.orderStatus === 'Completed' || o.orderStatus === 'Delivered'
  ).length;
  const cancelledOrdersCount = allOrders.filter(
    (o) => o.orderStatus === 'Cancelled' || o.orderStatus === 'Refunded'
  ).length;
  const lowStockProductsCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const pendingDepositsCount = depositRequests.filter((d) => d.status === 'Pending').length;
  const approvedDepositsCount = depositRequests.filter((d) => d.status === 'Approved').length;
  const totalDepositsApproved = depositRequests
    .filter((d) => d.status === 'Approved')
    .reduce((sum, d) => sum + d.amount, 0);

  // Filtered deposits
  const filteredDeposits = depositRequests.filter((d) => {
    const matchesStatus = depositFilter === 'all' || d.status === depositFilter;
    const q = depositSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      d.id.toLowerCase().includes(q) ||
      d.userName.toLowerCase().includes(q) ||
      d.userEmail.toLowerCase().includes(q) ||
      d.senderNumber.includes(q) ||
      d.transactionId.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleConfirmApprove = async () => {
    if (!confirmApproveDeposit) return;
    setIsProcessingDeposit(true);
    try {
      await approveDepositRequest(confirmApproveDeposit.id, user?.email || 'admin');
      showToast(
        `ডিপোজিট ${confirmApproveDeposit.id} সফলভাবে অনুমোদিত হয়েছে এবং কাস্টমারের ওয়ালেটে ৳${confirmApproveDeposit.amount.toFixed(2)} যোগ হয়েছে!`,
        'success'
      );
      setConfirmApproveDeposit(null);
      if (viewingScreenshot) setViewingScreenshot(null);
    } catch (err: any) {
      showToast(`ডিপোজিট অনুমোদন ব্যর্থ হয়েছে: ${err.message}`, 'error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleSaveWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForWalletAdjust) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('দয়া করে সঠিক টাকার পরিমাণ লিখুন।', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('টাকা যোগ/কর্তন করার কারণ বা নোট লিখুন।', 'error');
      return;
    }

    setIsAdjustingWallet(true);
    try {
      await adminAdjustUserWallet({
        userId: selectedUserForWalletAdjust.uid,
        amount: amt,
        actionType: adjustType,
        reason: adjustReason.trim(),
        adminEmail: user?.email || 'admin',
      });
      showToast(
        `সফলভাবে ${selectedUserForWalletAdjust.displayName || 'ইউজার'} এর ওয়ালেট ${
          adjustType === 'ADD' ? '৳' + amt + ' যোগ' : '৳' + amt + ' কর্তন'
        } করা হয়েছে!`,
        'success'
      );
      setSelectedUserForWalletAdjust(null);
      setAdjustAmount('');
      setAdjustReason('');
    } catch (err: any) {
      showToast(`ব্যালেন্স আপডেট ব্যর্থ হয়েছে: ${err.message}`, 'error');
    } finally {
      setIsAdjustingWallet(false);
    }
  };

  const handleReset850Balances = async () => {
    setIsResetting850(true);
    try {
      const count = await resetLegacy850Balances(user?.email || 'admin');
      showToast(`${count} জন ইউজারের পূর্ববর্তী ৮৫০/৮০০ ব্যালেন্স রিসেট করে ৳০ করা হয়েছে।`, 'success');
    } catch (err: any) {
      showToast(`রিসেট করতে সমস্যা হয়েছে: ${err.message}`, 'error');
    } finally {
      setIsResetting850(false);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectModalDeposit) return;
    setIsProcessingDeposit(true);
    try {
      await rejectDepositRequest(rejectModalDeposit.id, rejectReason, user?.email || 'admin');
      showToast(`ডিপোজিট ${rejectModalDeposit.id} বাতিল করা হয়েছে।`, 'info');
      setRejectModalDeposit(null);
      if (viewingScreenshot) setViewingScreenshot(null);
    } catch (err: any) {
      showToast(`বাতিল করতে সমস্যা হয়েছে: ${err.message}`, 'error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Filtered orders
  const filteredOrders = allOrders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const q = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.transactionId && o.transactionId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const q = productSearchQuery.toLowerCase().trim();
    return (
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  });

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (
    orderId: string,
    orderStatus: Order['orderStatus'],
    paymentStatus: Order['paymentStatus'],
    deliveryNotes?: string,
    notes?: string
  ) => {
    try {
      await updateOrderStatus(orderId, orderStatus, paymentStatus, deliveryNotes, notes);
      showToast(`অর্ডার ${orderId} স্ট্যাটাস আপডেট সফল হয়েছে!`, 'success');
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails((prev) =>
          prev
            ? {
                ...prev,
                orderStatus,
                paymentStatus,
                digitalDeliveryNotes: deliveryNotes,
                adminNotes: notes,
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
      showToast('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Seed / Reset Database Helper
  const handleSeedDatabase = async () => {
    try {
      for (const p of initialProducts) {
        await saveProduct(p);
      }
      for (const c of initialCategories) {
        await saveCategory(c);
      }
      await updateSiteSettings(initialSiteSettings);
      showToast('ডাটাবেজ সফলভাবে সিড করা হয়েছে!', 'success');
    } catch (err: any) {
      showToast('সিডিং ব্যর্থ হয়েছে: ' + err.message, 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSiteSettings(settingsForm);
      showToast('সাইট ও কন্টেন্ট সেটিংস সফলভাবে ক্লাউডে সংরক্ষণ করা হয়েছে!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('সেটিংস সংরক্ষণ ব্যর্থ হয়েছে: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Restrict Admin Access strictly to the specific authorized Google email
  if (!isAdmin || !user?.email || user.email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen bg-[#060b14] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0a1122] border border-rose-900/60 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-black text-2xl text-white">
            অ্যাক্সেস ডিনাইড (Access Denied)
          </h2>
          <p className="text-xs text-slate-300">
            এই এডমিন প্যানেল শুধুমাত্র অনুমোদিত Google অ্যাকাউন্ট (<strong className="text-cyan-400 font-mono">{AUTHORIZED_ADMIN_EMAIL}</strong>) এর জন্য সংরক্ষিত।
          </p>
          <div className="pt-2 space-y-2">
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF4FF] dark:bg-[#080D18] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Admin Top Header */}
      <div className="bg-white dark:bg-[#101B2D] border-b border-[#C7E2FF] dark:border-[#172B45] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="স্টোরে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg text-white">SuperStorez BD</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                ADMIN PANEL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              রিয়েল-টাইম ডাটাবেজ ও অর্ডার কন্ট্রোল প্যানেল
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Seeder Button */}
          <button
            onClick={handleSeedDatabase}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800 text-xs font-semibold transition-all"
            title="রিস্পন্স প্রোডাক্ট ও ক্যাটাগরি সিড করুন"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Demo Data</span>
          </button>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-300 block font-medium">
              {profile?.displayName || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {user?.email || 'admin@superstorez.com'}
            </span>
          </div>

          {/* Lock Session Button */}
          <button
            onClick={() => {
              if (confirm('আপনি কি এডমিন প্যানেল লক করতে চান?')) {
                revokeAdminSession();
                navigateTo('home');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-all"
            title="এডমিন সেশন লক করুন"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>লক করুন</span>
          </button>
        </div>
      </div>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Sidebar Navigation (Optimized for Mobile & Desktop) */}
        <aside className="w-full md:w-64 bg-white dark:bg-[#101B2D] border-r border-b md:border-b-0 border-[#C7E2FF] dark:border-[#172B45] p-2 sm:p-4 flex md:flex-col overflow-x-auto md:overflow-visible scrollbar-none gap-1.5 sm:space-y-1 flex-shrink-0">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>ড্যাশবোর্ড ওভারভিউ</span>
          </button>

          <button
            onClick={() => setCurrentTab('orders')}
            className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'orders'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>সকল অর্ডার</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black ml-1.5">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('deposits')}
            className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'deposits'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>ডিপোজিট রিকোয়েস্ট</span>
            </div>
            {pendingDepositsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black ml-1.5">
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('users')}
            className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'users'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>ইউজার ও ওয়ালেট</span>
            </div>
            {allUsers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 ml-1.5">
                {allUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'products'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4 text-cyan-400" />
            <span>প্রোডাক্ট ম্যানেজমেন্ট</span>
          </button>

          <button
            onClick={() => setCurrentTab('categories')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'categories'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
          </button>

          <button
            onClick={() => setCurrentTab('payments')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'payments'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>পেমেন্ট গেটওয়ে</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>সাইট ও কন্টেন্ট সেটিংস</span>
          </button>

          <button
            onClick={() => setCurrentTab('supabase')}
            className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full cursor-pointer ${
              currentTab === 'supabase'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>সুপাবেস (Supabase)</span>
            </div>
            {supabaseQueueCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse ml-1.5">
                {supabaseQueueCount}
              </span>
            )}
          </button>

          <div className="pt-6 border-t border-slate-800/80">
            <button
              onClick={() => navigateTo('home')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>লাইভ স্টোর দেখুন</span>
            </button>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-[#0a1224] border border-slate-800">
                  <span className="text-xs text-slate-400">সর্বমোট সেলস (বিক্রয়)</span>
                  <div className="font-heading font-black text-2xl sm:text-3xl text-cyan-400 mt-1">
                    ৳ {totalSales.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    সফল ও পেইড অর্ডার থেকে
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a1224] border border-slate-800">
                  <span className="text-xs text-slate-400">মোট অর্ডার</span>
                  <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
                    {allOrders.length}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {completedOrdersCount} টি সম্পন্ন
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a1224] border border-amber-900/40 bg-amber-950/10">
                  <span className="text-xs text-amber-300">পেন্ডিং অর্ডার</span>
                  <div className="font-heading font-black text-2xl sm:text-3xl text-amber-400 mt-1">
                    {pendingOrdersCount}
                  </div>
                  <span className="text-[10px] text-amber-400/80 mt-1 block">
                    ভেরিফিকেশনের অপেক্ষায়
                  </span>
                </div>

                <div
                  onClick={() => setCurrentTab('deposits')}
                  className="p-5 rounded-2xl bg-[#0a1224] border border-cyan-900/40 bg-cyan-950/10 cursor-pointer hover:border-cyan-500/50 transition-colors"
                >
                  <span className="text-xs text-cyan-300">পেন্ডিং ডিপোজিট</span>
                  <div className="font-heading font-black text-2xl sm:text-3xl text-cyan-400 mt-1">
                    {pendingDepositsCount}
                  </div>
                  <span className="text-[10px] text-cyan-400/80 mt-1 block">
                    {approvedDepositsCount} টি অনুমোদিত
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a1224] border border-slate-800">
                  <span className="text-xs text-slate-400">মোট প্রোডাক্ট</span>
                  <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
                    {products.length}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {lowStockProductsCount} টি লো স্টক
                  </span>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="p-6 rounded-3xl bg-[#0a1122] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-white">
                    সাম্প্রতিক অর্ডারসমূহ
                  </h3>
                  <button
                    onClick={() => setCurrentTab('orders')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    সকল অর্ডার দেখুন ({allOrders.length})
                  </button>
                </div>

                {allOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    এখনও কোনো অর্ডার পাওয়া যায়নি।
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-400 bg-slate-900/60 uppercase">
                        <tr>
                          <th className="p-3">অর্ডার আইডি</th>
                          <th className="p-3">কাস্টমার</th>
                          <th className="p-3">মোবাইল</th>
                          <th className="p-3">পদ্ধতি ও TrxID</th>
                          <th className="p-3">মূল্য</th>
                          <th className="p-3">স্ট্যাটাস</th>
                          <th className="p-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {allOrders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-heading font-bold text-cyan-400">
                              {ord.id}
                            </td>
                            <td className="p-3 text-slate-200">{ord.customerName}</td>
                            <td className="p-3 font-mono text-slate-300">{ord.customerPhone}</td>
                            <td className="p-3 text-slate-300">
                              <span className="font-semibold text-white">{ord.paymentMethod}</span>
                              {ord.transactionId && (
                                <span className="font-mono text-cyan-400 ml-1">
                                  ({ord.transactionId})
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-heading font-bold text-cyan-400">
                              ৳ {ord.totalAmount}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ord.orderStatus === 'Delivered' || ord.orderStatus === 'Completed'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : ord.orderStatus === 'Pending'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium"
                              >
                                বিস্তারিত
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white">
                    অর্ডার ম্যানেজমেন্ট
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    গ্রাহকের দেয়া অর্ডার যাচাই ও লাইভ ডেলিভারি স্ট্যাটাস আপডেট করুন
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="আইডি, মোবাইল বা TrxID..."
                      className="bg-[#0a1122] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-[#0a1122] text-xs text-slate-300 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    <option value="all">সব স্ট্যাটাস ({allOrders.length})</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-3xl bg-[#0a1122] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-400 bg-slate-900/80 uppercase">
                      <tr>
                        <th className="p-4">অর্ডার আইডি</th>
                        <th className="p-4">তারিখ</th>
                        <th className="p-4">কাস্টমার</th>
                        <th className="p-4">মোবাইল</th>
                        <th className="p-4">পেমেন্ট মেথড</th>
                        <th className="p-4">TrxID</th>
                        <th className="p-4">টাকা</th>
                        <th className="p-4">পেমেন্ট</th>
                        <th className="p-4">অর্ডার স্ট্যাটাস</th>
                        <th className="p-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            কোনো অর্ডার পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-heading font-black text-cyan-400 tracking-wider">
                              {ord.id}
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[11px]">
                              {new Date(ord.createdAt).toLocaleDateString('bn-BD')}
                            </td>
                            <td className="p-4 font-medium text-white">{ord.customerName}</td>
                            <td className="p-4 font-mono text-slate-300">{ord.customerPhone}</td>
                            <td className="p-4 font-semibold text-white">{ord.paymentMethod}</td>
                            <td className="p-4 font-mono text-cyan-400">{ord.transactionId || '-'}</td>
                            <td className="p-4 font-heading font-black text-cyan-400 text-sm">
                              ৳ {ord.totalAmount}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ord.paymentStatus === 'Paid'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(
                                    ord.id,
                                    e.target.value as any,
                                    ord.paymentStatus
                                  )
                                }
                                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:border-cyan-500"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 font-medium"
                              >
                                ডিটেইলস
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEPOSITS MANAGEMENT */}
          {currentTab === 'deposits' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white flex items-center gap-2.5">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                    <span>ডিপোজিট রিকোয়েস্ট ম্যানেজমেন্ট</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    কাস্টমারদের বিকাশ, নগদ ও রকেটের ম্যানুয়াল ডিপোজিট রিকোয়েস্ট ভেরিফাই করুন এবং অনুমোদন দিন।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={depositSearchQuery}
                      onChange={(e) => setDepositSearchQuery(e.target.value)}
                      placeholder="TrxID, নাম্বার বা নাম খুঁজুন..."
                      className="bg-[#0a1122] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 w-56 sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Filters & Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `সবগুলো (${depositRequests.length})` },
                  { id: 'Pending', label: `পেন্ডিং (${pendingDepositsCount})` },
                  { id: 'Approved', label: `অনুমোদিত (${approvedDepositsCount})` },
                  { id: 'Rejected', label: `বাতিল (${depositRequests.filter((d) => d.status === 'Rejected').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDepositFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      depositFilter === f.id
                        ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-3xl bg-[#0a1122] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-400 bg-slate-900/60 uppercase">
                      <tr>
                        <th className="p-4">ডিপোজিট আইডি ও তারিখ</th>
                        <th className="p-4">কাস্টমার তথ্য</th>
                        <th className="p-4">পেমেন্ট মাধ্যম ও প্রেরক</th>
                        <th className="p-4">ট্রানজেকশন আইডি (TrxID)</th>
                        <th className="p-4">পেমেন্ট প্রুফ (স্ক্রিনশট)</th>
                        <th className="p-4">পরিমাণ (টাকা)</th>
                        <th className="p-4">স্ট্যাটাস</th>
                        <th className="p-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredDeposits.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-400">
                            কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredDeposits.map((dep) => (
                          <tr key={dep.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4">
                              <span className="font-heading font-bold text-cyan-400 block">
                                {dep.id}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                                {new Date(dep.createdAt).toLocaleString('bn-BD')}
                              </span>
                            </td>

                            <td className="p-4">
                              <p className="font-semibold text-white">{dep.userName}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{dep.userEmail}</p>
                              {dep.userNote && (
                                <p className="text-[10px] text-cyan-300/80 italic mt-0.5">
                                  নোট: {dep.userNote}
                                </p>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${
                                  dep.paymentMethod === 'bKash'
                                    ? 'bg-pink-950 text-pink-300 border border-pink-800'
                                    : dep.paymentMethod === 'Nagad'
                                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                                    : dep.paymentMethod === 'Rocket'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                }`}
                              >
                                {dep.paymentMethod}
                              </span>
                              <div className="text-[11px] font-mono text-slate-300">
                                <span>প্রেরক: </span>
                                <strong className="text-white">{dep.senderNumber}</strong>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                <span>প্রাপক: {dep.targetNumber}</span>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-cyan-300 font-bold tracking-wider">
                                  {dep.transactionId}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(dep.transactionId);
                                    showToast('TrxID কপি হয়েছে!', 'success');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                  title="TrxID কপি করুন"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            <td className="p-4">
                              {dep.screenshotUrl ? (
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={() => setViewingScreenshot(dep.screenshotUrl || null)}
                                    className="w-12 h-12 rounded-lg bg-black/60 border border-slate-700 overflow-hidden cursor-pointer hover:border-cyan-400 transition-all flex-shrink-0 group relative"
                                    title="বড় করে দেখতে ক্লিক করুন"
                                  >
                                    <img
                                      src={dep.screenshotUrl}
                                      alt="Screenshot"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Eye className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setViewingScreenshot(dep.screenshotUrl || null)}
                                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>প্রুফ দেখুন</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">ছবি নেই</span>
                              )}
                            </td>

                            <td className="p-4">
                              <span className="font-heading font-black text-base text-cyan-400 font-mono">
                                ৳ {dep.amount.toFixed(2)}
                              </span>
                            </td>

                            <td className="p-4">
                              {dep.status === 'Pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                                  <Hourglass className="w-3 h-3" />
                                  <span>পেন্ডিং</span>
                                </span>
                              )}
                              {dep.status === 'Approved' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>অনুমোদিত</span>
                                  </span>
                                  {dep.processedBy && (
                                    <span className="block text-[9px] text-slate-500 mt-0.5 font-mono">
                                      by {dep.processedBy}
                                    </span>
                                  )}
                                </div>
                              )}
                              {dep.status === 'Rejected' && (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                    <XCircle className="w-3 h-3" />
                                    <span>বাতিল</span>
                                  </span>
                                  {dep.adminNote && (
                                    <span className="block text-[9px] text-rose-400 mt-0.5 max-w-[140px] truncate" title={dep.adminNote}>
                                      {dep.adminNote}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              {dep.status === 'Pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setConfirmApproveDeposit(dep)}
                                    disabled={isProcessingDeposit}
                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1 cursor-pointer"
                                    title="কাস্টমারের ওয়ালেটে ব্যালেন্স যোগ করুন"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>অনুমোদন</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectModalDeposit(dep);
                                      setRejectReason('ভুল ট্রানজেকশন আইডি অথবা পেমেন্ট পাওয়া যায়নি');
                                    }}
                                    disabled={isProcessingDeposit}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                                    title="বাতিল করুন"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>বাতিল</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USER MANAGEMENT & WALLET */}
          {currentTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white">
                    ইউজার ম্যানেজমেন্ট ও ওয়ালেট
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    রেজিস্টার্ড সকল গ্রাহকের তথ্য, ওয়ালেট ব্যালেন্স নিয়ন্ত্রণ ও বিস্তারিত ট্রানজেকশন হিস্টরি
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="নাম, ইমেইল বা UID দিয়ে খুঁজুন..."
                      className="bg-[#0a1122] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#0a1122] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">মোট নিবন্ধিত ইউজার</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="font-heading font-black text-2xl text-white mt-1">
                    {allUsers.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a1122] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">সর্বমোট ইউজার ওয়ালেট ব্যালেন্স</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-heading font-black text-2xl text-emerald-400 mt-1 font-mono">
                    ৳ {allUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0).toFixed(2)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a1122] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">অনুমোদিত ডিপোজিট সর্বমোট</span>
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="font-heading font-black text-2xl text-cyan-400 mt-1 font-mono">
                    ৳ {totalDepositsApproved.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Alert / Reset button if any user has the legacy 850 or 800 balance */}
              {allUsers.some((u) => {
                const b = Number(u.walletBalance);
                return b === 850 || b === 800 || (u.walletBalance as any) === '850' || (u.walletBalance as any) === '800';
              }) && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">
                        {allUsers.filter((u) => {
                          const b = Number(u.walletBalance);
                          return b === 850 || b === 800 || (u.walletBalance as any) === '850' || (u.walletBalance as any) === '800';
                        }).length} জন ইউজারের একাউন্টে পূর্বে ভুলবশত অটোমেটিক ৮৫০/৮০০ ব্যালেন্স যুক্ত হয়েছিল
                      </h4>
                      <p className="text-[11px] text-amber-300/80">
                        নতুন রেজিস্টারকৃত ইউজারের ব্যালেন্স এখন থেকে ৳০। এক ক্লিকে পূর্ববর্তী সকল ৮৫০/৮০০ ব্যালেন্স রিসেট করে ৳০ করতে পারেন।
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset850Balances}
                    disabled={isResetting850}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isResetting850 ? 'রিসেট হচ্ছে...' : 'সকল ৮৫০/৮০০ ব্যালেন্স ৳০ করুন'}
                  </button>
                </div>
              )}

              {/* Users Table */}
              <div className="rounded-3xl bg-[#0a1122] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-400 bg-slate-900/80 uppercase">
                      <tr>
                        <th className="p-4">গ্রাহক (Customer)</th>
                        <th className="p-4">ইউজার আইডি (UID)</th>
                        <th className="p-4">নিবন্ধন তারিখ</th>
                        <th className="p-4">ওয়ালেট ব্যালেন্স</th>
                        <th className="p-4">মোট অর্ডার</th>
                        <th className="p-4">মোট ডিপোজিট</th>
                        <th className="p-4">স্ট্যাটাস</th>
                        <th className="p-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-400">
                            ইউজার ডাটা লোড হচ্ছে...
                          </td>
                        </tr>
                      ) : (
                        allUsers
                          .filter((u) => {
                            const q = userSearchQuery.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              u.uid.toLowerCase().includes(q) ||
                              (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                              (u.email && u.email.toLowerCase().includes(q)) ||
                              (u.phoneNumber && u.phoneNumber.includes(q))
                            );
                          })
                          .map((u) => {
                            const userOrdersCount = allOrders.filter((o) => o.userId === u.uid).length;
                            const userDepositsTotal = depositRequests
                              .filter((d) => d.userId === u.uid && d.status === 'Approved')
                              .reduce((s, d) => s + d.amount, 0);

                            return (
                              <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    {u.photoURL ? (
                                      <img
                                        src={u.photoURL}
                                        alt={u.displayName}
                                        className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs flex-shrink-0">
                                        {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-white">
                                        {u.displayName || 'নাম নেই'}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        {u.email}
                                      </div>
                                      {u.phoneNumber && (
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          ফোন: {u.phoneNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="text-slate-400 max-w-[100px] truncate" title={u.uid}>
                                      {u.uid}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.uid);
                                        showToast('UID কপি হয়েছে!', 'success');
                                      }}
                                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white cursor-pointer"
                                      title="UID কপি করুন"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>

                                <td className="p-4 text-slate-400 text-[11px]">
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString('bn-BD', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : '—'}
                                </td>

                                <td className="p-4">
                                  <span className="font-heading font-black text-cyan-400 font-mono text-sm">
                                    ৳ {(u.walletBalance ?? 0).toFixed(2)}
                                  </span>
                                </td>

                                <td className="p-4 text-slate-300">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold">
                                    {userOrdersCount} টি
                                  </span>
                                </td>

                                <td className="p-4 text-slate-300 font-mono">
                                  ৳ {userDepositsTotal.toFixed(2)}
                                </td>

                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.status === 'Suspended'
                                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    }`}
                                  >
                                    {u.status || 'Active'}
                                  </span>
                                </td>

                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedUserForWalletAdjust(u);
                                        setAdjustAmount('');
                                        setAdjustReason('');
                                        setAdjustType('ADD');
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                      title="ওয়ালেট ব্যালেন্স যোগ বা কর্তন করুন"
                                    >
                                      <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>ব্যালেন্স এডজাস্ট</span>
                                    </button>

                                    <button
                                      onClick={() => setSelectedUserForDetail(u)}
                                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      title="সম্পূর্ণ হিস্টরি ও বিবরণ দেখুন"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white">
                    প্রোডাক্ট ম্যানেজমেন্ট
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    টপআপ ও গিফট কার্ড প্রোডাক্ট, ভ্যারিয়েশন এবং কাস্টম ফিল্ড পরিচালনা করুন
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="প্রোডাক্ট খুঁজুন..."
                      className="bg-[#0a1122] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct({
                        id: `prod_${Date.now()}`,
                        name: '',
                        subtitle: '',
                        categoryId: categories[0]?.id || 'game-top-up',
                        categoryName: categories[0]?.name || 'Game Top-Up',
                        tags: ['Topup', 'Instant'],
                        description: '',
                        instructions: '',
                        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
                        basePrice: 100,
                        stock: 50,
                        isFeatured: false,
                        isPopular: false,
                        isActive: true,
                        customFields: [{ id: 'cf_1', label: 'Player ID', placeholder: 'ID দিন', required: true, type: 'text' }],
                        variations: [{ id: 'v_1', name: 'Standard Package', price: 100, stock: 50, active: true }],
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন প্রোডাক্ট যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="rounded-3xl bg-[#0a1122] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-slate-400 bg-slate-900/80 uppercase">
                      <tr>
                        <th className="p-4">ছবি ও নাম</th>
                        <th className="p-4">ক্যাটাগরি</th>
                        <th className="p-4">মূল্য</th>
                        <th className="p-4">প্যাকেজ সংখ্যা</th>
                        <th className="p-4">স্টক</th>
                        <th className="p-4">স্ট্যাটাস</th>
                        <th className="p-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800"
                              />
                              <div>
                                <div className="font-heading font-bold text-white text-sm">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {p.subtitle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-cyan-400 font-medium">{p.categoryName}</td>
                          <td className="p-4 font-heading font-black text-white text-sm">
                            ৳ {p.basePrice}
                          </td>
                          <td className="p-4 text-slate-300">
                            {p.variations?.length || 0} টি প্যাকেজ
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.stock > 5
                                  ? 'text-emerald-400'
                                  : p.stock > 0
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.isActive ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                              title="সম্পাদনা"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`'${p.name}' প্রোডাক্টটি ডিলিট করতে চান?`)) {
                                  await deleteProduct(p.id);
                                  showToast('প্রোডাক্ট ডিলিট করা হয়েছে', 'success');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                              title="ডিলিট"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {currentTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white">
                    ক্যাটাগরি ম্যানেজমেন্ট
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    স্টোরের ক্যাটাগরি তৈরি ও সাজান
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory({
                      id: `cat_${Date.now()}`,
                      name: '',
                      nameBn: '',
                      slug: '',
                      icon: 'Gamepad2',
                      description: '',
                      isActive: true,
                      order: categories.length + 1,
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ক্যাটাগরি</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-bold text-lg text-white">
                          {cat.name}
                        </span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">
                          #{cat.order}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-300 mb-1">{cat.nameBn}</div>
                      <p className="text-xs text-slate-400 mb-4">{cat.description}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`'${cat.name}' ক্যাটাগরি ডিলিট করতে চান?`)) {
                            await deleteCategory(cat.id);
                            showToast('ক্যাটাগরি ডিলিট করা হয়েছে', 'success');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS CONFIG */}
          {currentTab === 'payments' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="font-heading font-black text-2xl text-white">
                  পেমেন্ট গেটওয়ে সেটিংস
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  বিকাশ, নগদ ও রকেট পেমেন্ট নাম্বার এবং নির্দেশাবলি কনফিগার করুন
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* bKash */}
                <div className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-[#ff4f9e] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#e2136e]" />
                    <span>bKash Settings (বিকাশ)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">বিকাশ নাম্বার</label>
                      <input
                        type="text"
                        value={settingsForm.bkashNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })}
                        className="w-full bg-[#0d1629] text-sm text-cyan-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">অ্যাকাউন্ট টাইপ</label>
                      <input
                        type="text"
                        value={settingsForm.bkashType}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bkashType: e.target.value })}
                        placeholder="Personal (Send Money)"
                        className="w-full bg-[#0d1629] text-sm text-slate-200 px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Nagad */}
                <div className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-[#ffaa47] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#f7941d]" />
                    <span>Nagad Settings (নগদ)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">নগদ নাম্বার</label>
                      <input
                        type="text"
                        value={settingsForm.nagadNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })}
                        className="w-full bg-[#0d1629] text-sm text-cyan-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">অ্যাকাউন্ট টাইপ</label>
                      <input
                        type="text"
                        value={settingsForm.nagadType}
                        onChange={(e) => setSettingsForm({ ...settingsForm, nagadType: e.target.value })}
                        placeholder="Personal (Send Money)"
                        className="w-full bg-[#0d1629] text-sm text-slate-200 px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Rocket */}
                <div className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-[#d46fe0] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#8c3795]" />
                    <span>Rocket Settings (রকেট)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">রকেট নাম্বার</label>
                      <input
                        type="text"
                        value={settingsForm.rocketNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, rocketNumber: e.target.value })}
                        className="w-full bg-[#0d1629] text-sm text-cyan-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">অ্যাকাউন্ট টাইপ</label>
                      <input
                        type="text"
                        value={settingsForm.rocketType}
                        onChange={(e) => setSettingsForm({ ...settingsForm, rocketType: e.target.value })}
                        placeholder="Personal"
                        className="w-full bg-[#0d1629] text-sm text-slate-200 px-3 py-2 rounded-xl border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-5 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    চেকআউটে পেমেন্টের নির্দেশাবলি:
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.paymentInstructions}
                    onChange={(e) => setSettingsForm({ ...settingsForm, paymentInstructions: e.target.value })}
                    className="w-full bg-[#0d1629] text-xs text-slate-200 p-3 rounded-xl border border-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>পেমেন্ট সেটিংস সংরক্ষণ করুন</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: SITE & CONTENT SETTINGS (EXPANDED ACCESSIBILITY & CONTROLS) */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              {/* Header with Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="font-heading font-black text-2xl text-white flex items-center gap-2.5">
                    <Sliders className="w-6 h-6 text-cyan-400" />
                    <span>সাইট ও কন্টেন্ট সেটিংস (সম্পূর্ণ নিয়ন্ত্রণ)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    ব্যানার, হিরো সেকশন, অ্যাকশন বাটন, কাস্টমার হেল্পডেস্ক, ট্রাস্ট ব্যাজ ও পলিসিসমূহ এখান থেকে নিয়ন্ত্রণ করুন।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('আপনি কি ডিফল্ট সেটিংস রিস্টোর করতে চান?')) {
                        setSettingsForm(initialSiteSettings);
                        showToast('ডিফল্ট সেটিংস লোড করা হয়েছে। সেভ করতে বাটন চাপুন।', 'info');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                  >
                    ডিফল্ট রিস্টোর
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    disabled={isSavingSettings}
                    className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Save className="w-4 h-4 text-black" />
                    )}
                    <span>{isSavingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Navigation for Ultra-Organized Accessibility */}
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#09101f] border border-slate-800 text-xs">
                {[
                  { id: 'banner', label: '📢 ব্যানার ও নোটিশ', icon: Bell },
                  { id: 'hero', label: '⚡ হিরো ও বাটন', icon: Sparkles },
                  { id: 'support', label: '🎧 সাপোর্ট হেল্পডেস্ক', icon: Headphones },
                  { id: 'trust', label: '🛡️ ট্রাস্ট ব্যাজ', icon: Shield },
                  { id: 'general', label: '🏢 স্টোর ও লিমিট', icon: Settings },
                  { id: 'social', label: '🌐 সোশ্যাল মিডিয়া', icon: Share2 },
                  { id: 'footer', label: '📜 ফুটার ও পলিসি', icon: Globe },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = settingsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSettingsSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. ANNOUNCEMENT BANNER */}
                {settingsSubTab === 'banner' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <Bell className="w-4 h-4 text-cyan-400" />
                            <span>টপ নোটিশ ও অ্যানাউন্সমেন্ট বার</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            ওয়েবসাইটের একদম উপরে জরুরি বার্তা বা অফার প্রদর্শন করুন
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.announcementEnabled !== false}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                announcementEnabled: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                          <span className="ml-2.5 text-xs font-semibold text-slate-200">
                            {settingsForm.announcementEnabled !== false ? 'চালু আছে' : 'বন্ধ আছে'}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ব্যানার ব্যাজ টেক্সট
                          </label>
                          <input
                            type="text"
                            value={settingsForm.announcementBadge || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, announcementBadge: e.target.value })
                            }
                            placeholder="যেমন: জরুরি নোটিশ / অফার"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ব্যানার নোটিশ মেসেজ (Notice Text)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.announcement || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, announcement: e.target.value })
                            }
                            placeholder="যেমন: ⚡ ইনস্ট্যান্ট ডেলিভারি চালু আছে! বিকাশ, নগদ ও রকেটে দ্রুত পেমেন্ট সুবিধা।"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="pt-3 border-t border-slate-800/60">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          লাইভ প্রিভিউ (গ্রাহক যেভাবে দেখবে):
                        </span>
                        {settingsForm.announcementEnabled !== false ? (
                          <div className="bg-gradient-to-r from-cyan-950 via-[#0a1b2d] to-blue-950 border border-cyan-800/40 text-cyan-200 text-xs py-2 px-4 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold text-[10px] uppercase">
                                {settingsForm.announcementBadge || 'জরুরি নোটিশ'}
                              </span>
                              <span className="truncate text-slate-200 text-xs">
                                {settingsForm.announcement || 'কোনো নোটিশ সেট করা নেই'}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800">
                              লাইভ সাপোর্ট
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-500 text-center">
                            ব্যানারটি বর্তমানে বন্ধ করা রয়েছে। ওয়েবসাইটে প্রদর্শিত হবে না।
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. HERO SECTION & CTAS */}
                {settingsSubTab === 'hero' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>হিরো সেকশন ও টাইটেল কনফিগারেশন</span>
                      </h3>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          হিরো টপ ব্যাজ (Top Badge)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroBadge}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroBadge: e.target.value })
                          }
                          className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            হিরো টাইটেল (লাইন ১)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.heroTitle}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                            }
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            হিরো টাইটেল হাইলাইট (লাইন ২ - সিয়ান কালার)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.heroTitleHighlight}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, heroTitleHighlight: e.target.value })
                            }
                            className="w-full bg-[#0d1629] text-sm text-cyan-400 font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          হিরো সাবটাইটেল ডেসক্রিপশন
                        </label>
                        <textarea
                          rows={3}
                          value={settingsForm.heroSubtitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                          }
                          className="w-full bg-[#0d1629] text-xs text-white p-3 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none leading-relaxed"
                        />
                      </div>

                      {/* Action Buttons Setup */}
                      <div className="pt-4 border-t border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          হিরো অ্যাকশন বাটন কন্ট্রোল:
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[#09101f] border border-slate-800/80 space-y-2">
                            <span className="text-xs font-bold text-cyan-400">বাটন ১ (প্রাইমারি)</span>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">বাটন টেক্সট</label>
                              <input
                                type="text"
                                value={settingsForm.heroCta1Text || ''}
                                onChange={(e) =>
                                  setSettingsForm({ ...settingsForm, heroCta1Text: e.target.value })
                                }
                                placeholder="টপ-আপ করুন"
                                className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">টার্গেট স্লাগ</label>
                              <input
                                type="text"
                                value={settingsForm.heroCta1Link || ''}
                                onChange={(e) =>
                                  setSettingsForm({ ...settingsForm, heroCta1Link: e.target.value })
                                }
                                placeholder="game-top-up"
                                className="w-full bg-[#0d1629] text-xs font-mono text-cyan-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                              />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-[#09101f] border border-slate-800/80 space-y-2">
                            <span className="text-xs font-bold text-slate-300">বাটন ২ (সেকেন্ডারি)</span>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">বাটন টেক্সট</label>
                              <input
                                type="text"
                                value={settingsForm.heroCta2Text || ''}
                                onChange={(e) =>
                                  setSettingsForm({ ...settingsForm, heroCta2Text: e.target.value })
                                }
                                placeholder="গিফট কার্ড কিনুন"
                                className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">টার্গেট স্লাগ</label>
                              <input
                                type="text"
                                value={settingsForm.heroCta2Link || ''}
                                onChange={(e) =>
                                  setSettingsForm({ ...settingsForm, heroCta2Link: e.target.value })
                                }
                                placeholder="digital-cards"
                                className="w-full bg-[#0d1629] text-xs font-mono text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                              />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-[#09101f] border border-slate-800/80 space-y-2 sm:col-span-2">
                            <span className="text-xs font-bold text-cyan-300">বাটন ৩ (অ্যাকশন / ট্র্যাকিং বাটন)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">বাটন টেক্সট</label>
                                <input
                                  type="text"
                                  value={settingsForm.heroCta3Text || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, heroCta3Text: e.target.value })
                                  }
                                  placeholder="অর্ডার ট্র্যাক করুন"
                                  className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">টার্গেট পেজ / স্লাগ</label>
                                <input
                                  type="text"
                                  value={settingsForm.heroCta3Link || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, heroCta3Link: e.target.value })
                                  }
                                  placeholder="track-order"
                                  className="w-full bg-[#0d1629] text-xs font-mono text-cyan-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Homepage Section Headings */}
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            হোমপেজ সেকশন শিরোনাম ও সাবটাইটেল:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-[#09101f] border border-slate-800/80 space-y-2">
                              <span className="text-xs font-bold text-amber-400">জনপ্রিয় প্রোডাক্ট সেকশন</span>
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">টাইটেল</label>
                                <input
                                  type="text"
                                  value={settingsForm.popularSectionTitle || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, popularSectionTitle: e.target.value })
                                  }
                                  placeholder="জনপ্রিয় প্রোডাক্ট ও অফার"
                                  className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">সাবটাইটেল</label>
                                <input
                                  type="text"
                                  value={settingsForm.popularSectionSubtitle || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, popularSectionSubtitle: e.target.value })
                                  }
                                  placeholder="সবচেয়ে বেশি ক্রয়কৃত টপআপ ও ডিজিটাল ভাউচার"
                                  className="w-full bg-[#0d1629] text-xs text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#09101f] border border-slate-800/80 space-y-2">
                              <span className="text-xs font-bold text-cyan-400">ডিজিটাল গিফট কার্ড সেকশন</span>
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">টাইটেল</label>
                                <input
                                  type="text"
                                  value={settingsForm.giftCardSectionTitle || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, giftCardSectionTitle: e.target.value })
                                  }
                                  placeholder="ডিজিটাল গিফট কার্ড ও রিডিম কোড"
                                  className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">সাবটাইটেল</label>
                                <input
                                  type="text"
                                  value={settingsForm.giftCardSectionSubtitle || ''}
                                  onChange={(e) =>
                                    setSettingsForm({ ...settingsForm, giftCardSectionSubtitle: e.target.value })
                                  }
                                  placeholder="স্টিম, গুগল প্লে, অ্যাপল ও অন্যান্য অফিশিয়াল ভাউচার"
                                  className="w-full bg-[#0d1629] text-xs text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CUSTOMER SUPPORT & HELPLINE */}
                {settingsSubTab === 'support' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Headphones className="w-4 h-4 text-emerald-400" />
                        <span>কাস্টমার সাপোর্ট ও হেল্পডেস্ক চ্যানেলসমূহ</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        এখানে দেওয়া চ্যানেলগুলো সাইটের ফ্লোটিং সাপোর্ট উইজেট, ফুটার এবং নেভবারে স্বয়ংক্রিয়ভাবে কার্যকর হবে।
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            হোয়াটসঅ্যাপ সাপোর্ট নম্বর (WhatsApp)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.supportWhatsapp}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, supportWhatsapp: e.target.value })
                            }
                            placeholder="+8801788992211"
                            className="w-full bg-[#0d1629] text-sm text-emerald-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-emerald-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            টেলিগ্রাম ইউজারনেম (Telegram Support)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.supportTelegram || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, supportTelegram: e.target.value })
                            }
                            placeholder="@superstorez_support"
                            className="w-full bg-[#0d1629] text-sm text-cyan-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            সাপোর্ট অফিসিয়াল ইমেইল (Email)
                          </label>
                          <input
                            type="email"
                            value={settingsForm.supportEmail}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, supportEmail: e.target.value })
                            }
                            placeholder="support@superstorez.com"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            সাপোর্ট হেল্পলাইন আওয়ার্স (Service Hours)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.supportHours || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, supportHours: e.target.value })
                            }
                            placeholder="প্রতিদিন সকাল ০৯:০০ - রাত ০১:০০"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          সাপোর্ট ডেস্কে প্রদর্শিত জরুরি সহায়তা বার্তা (Support Notice)
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.supportNotice || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, supportNotice: e.target.value })
                          }
                          placeholder="যেকোনো সহায়তায় আমাদের হোয়াটসঅ্যাপ বা টেলিগ্রামে সরাসরি মেসেজ দিন, তাৎক্ষণিক সমাধান দেওয়া হবে।"
                          className="w-full bg-[#0d1629] text-xs text-white p-3 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TRUST BADGES */}
                {settingsSubTab === 'trust' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span>ট্রাস্ট ব্যাজ ও গ্রাহক নিরাপত্তা বার্তা</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        হিরো সেকশনের নিচে ও ফুটারের প্রধান ৩টি আস্থার প্রতীক ও টেক্সট কাস্টমাইজ করুন।
                      </p>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ট্রাস্ট ফিচার ১ (ডেলিভারি সংক্রান্ত)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.trustBadge1 || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, trustBadge1: e.target.value })
                            }
                            placeholder="১-৫ মিনিটে ইনস্ট্যান্ট অটো ডেলিভারি"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ট্রাস্ট ফিচার ২ (গেটওয়ে ও সিকিউরিটি সংক্রান্ত)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.trustBadge2 || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, trustBadge2: e.target.value })
                            }
                            placeholder="১০০% অফিশিয়াল ও নিরাপদ গেটওয়ে"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ট্রাস্ট ফিচার ৩ (গ্রাহক সেবা সংক্রান্ত)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.trustBadge3 || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, trustBadge3: e.target.value })
                            }
                            placeholder="২৪/৭ লাইভ গ্রাহক সেবা"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. STORE & DEPOSIT LIMITS */}
                {settingsSubTab === 'general' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Settings className="w-4 h-4 text-cyan-400" />
                        <span>স্টোর ব্র্যান্ডিং ও ডিপোজিট লিমিট</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            স্টোরের নাম (Store Name)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.storeName}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, storeName: e.target.value })
                            }
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            স্টোর ট্যাগলাইন (Tagline)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.tagline || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, tagline: e.target.value })
                            }
                            placeholder="বাংলাদেশের বিশ্বস্ত গেমিং ও ইনস্ট্যান্ট টপআপ মার্কেটপ্লেস"
                            className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            সর্বনিম্ন ডিপোজিট সীমা (Min Deposit Limit)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={settingsForm.minDepositAmount ?? 50}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  minDepositAmount: Math.max(1, parseInt(e.target.value) || 0),
                                })
                              }
                              className="w-full bg-[#0d1629] text-sm text-cyan-400 font-mono font-bold px-3 py-2 rounded-xl border border-slate-700"
                            />
                            <span className="absolute right-3 top-2 text-xs text-slate-400">টাকা (৳)</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            কারেন্সি চিহ্ন (Currency Symbol)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.currencySymbol || '৳'}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })
                            }
                            className="w-full bg-[#0d1629] text-sm text-white font-bold px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            লোগো ইমেজ ইউআরএল (Logo Image URL - ঐচ্ছিক)
                          </label>
                          <input
                            type="url"
                            value={settingsForm.logoUrl || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, logoUrl: e.target.value })
                            }
                            placeholder="https://yourdomain.com/logo.png (খালি রাখলে টেক্সট লোগো দেখাবে)"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            চেকআউট সিকিউরিটি ব্যাজ টেক্সট
                          </label>
                          <input
                            type="text"
                            value={settingsForm.securityBadgeNote || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, securityBadgeNote: e.target.value })
                            }
                            placeholder="১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট গেটওয়ে।"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2 rounded-xl border border-slate-700"
                          />
                        </div>
                      </div>

                      {/* Payment Notes */}
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          পেমেন্ট গেটওয়ে নির্দেশনা ও শর্ট নোট:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] text-pink-400 font-bold block mb-1">বিকাশ নোট</label>
                            <input
                              type="text"
                              value={settingsForm.bkashHelpNote || ''}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, bkashHelpNote: e.target.value })
                              }
                              placeholder="বিকাশ অ্যাপ থেকে Send Money..."
                              className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-orange-400 font-bold block mb-1">নগদ নোট</label>
                            <input
                              type="text"
                              value={settingsForm.nagadHelpNote || ''}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, nagadHelpNote: e.target.value })
                              }
                              placeholder="নগদ অ্যাপ বা *167# ডায়াল..."
                              className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-purple-400 font-bold block mb-1">রকেট নোট</label>
                            <input
                              type="text"
                              value={settingsForm.rocketHelpNote || ''}
                              onChange={(e) =>
                                setSettingsForm({ ...settingsForm, rocketHelpNote: e.target.value })
                              }
                              placeholder="রকেট অ্যাপ বা *322# ডায়াল..."
                              className="w-full bg-[#0d1629] text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SOCIAL MEDIA LINKS */}
                {settingsSubTab === 'social' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Share2 className="w-4 h-4 text-cyan-400" />
                        <span>সোশ্যাল মিডিয়া ও কমিউনিটি চ্যানেলস</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ফেসবুক পেজ ইউআরএল (Facebook Page)
                          </label>
                          <input
                            type="url"
                            value={settingsForm.facebookPageUrl || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, facebookPageUrl: e.target.value })
                            }
                            placeholder="https://facebook.com/yourpage"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ইউটিউব চ্যানেল ইউআরএল (YouTube)
                          </label>
                          <input
                            type="url"
                            value={settingsForm.youtubeChannelUrl || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, youtubeChannelUrl: e.target.value })
                            }
                            placeholder="https://youtube.com/@yourchannel"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1">
                            ডিসকর্ড সার্ভার ইনভাইট (Discord)
                          </label>
                          <input
                            type="url"
                            value={settingsForm.discordCommunityUrl || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, discordCommunityUrl: e.target.value })
                            }
                            placeholder="https://discord.gg/yourserver"
                            className="w-full bg-[#0d1629] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. FOOTER & POLICIES */}
                {settingsSubTab === 'footer' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-6 rounded-2xl bg-[#0a1122] border border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>ফুটার টেক্সট ও কপিরাইট</span>
                      </h3>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          ফুটার স্টোর বিবরণ (Footer Brand Description)
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.footerText}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, footerText: e.target.value })
                          }
                          className="w-full bg-[#0d1629] text-xs text-white p-3 rounded-xl border border-slate-700 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          কপিরাইট লাইন (Copyright Text)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.copyrightText || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, copyrightText: e.target.value })
                          }
                          placeholder="© 2026 SuperStorez.com. সর্বস্বত্ব সংরক্ষিত।"
                          className="w-full bg-[#0d1629] text-sm text-white px-3 py-2 rounded-xl border border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Sticky-Save Bar */}
                <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-[#080d1a]/95 border border-cyan-800/60 backdrop-blur-md flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>যেকোনো পরিবর্তন করার পর অবশ্যই সেভ করুন</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Save className="w-4 h-4 text-black" />
                    )}
                    <span>{isSavingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: SUPABASE INTEGRATION */}
          {currentTab === 'supabase' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
                      সুপাবেস ব্যাকএন্ড ইন্টিগ্রেশন (Supabase)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      গ্রাহকের পূরণকৃত টপ-আপ রিকোয়ারমেন্টস ও কাস্টমার ডাটা স্বয়ংক্রিয়ভাবে আপনার Supabase ডাটাবেজে জমা হচ্ছে।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSupabaseInfo}
                    disabled={loadingSupabase}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSupabase ? 'animate-spin' : ''}`} />
                    <span>রিফ্রেশ করুন</span>
                  </button>

                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-900/30"
                  >
                    <span>Supabase ড্যাশবোর্ড</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Status / Credentials Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Project ID */}
                <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    প্রজেক্ট আইডি (Project ID)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-300 truncate">
                      {SUPABASE_PROJECT_ID}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_PROJECT_ID);
                        showToast('Project ID কপি করা হয়েছে!', 'success');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy Project ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {SUPABASE_URL}
                  </span>
                </div>

                {/* API Key */}
                <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      পাবলিশেবল কী (Anon Key)
                    </span>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      {showApiKey ? 'হাইড' : 'দেখান'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-300 truncate max-w-[150px]">
                      {showApiKey ? SUPABASE_ANON_KEY : `${SUPABASE_ANON_KEY.substring(0, 14)}...`}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_ANON_KEY);
                        showToast('API Key কপি করা হয়েছে!', 'success');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy API Key"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-400 block">
                    ✓ ক্লায়েন্ট অথরাইজেশন সক্রিয়
                  </span>
                </div>

                {/* Connection & Table Status */}
                <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    টেবিল স্ট্যাটাস (Table Status)
                  </span>
                  <div>
                    {loadingSupabase ? (
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> চেক করা হচ্ছে...
                      </span>
                    ) : supabaseStatus?.tableExists ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {supabaseStatus.activeTable} (Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        টেবিল তৈরি পেন্ডিং
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {supabaseStatus?.tableExists
                      ? 'ডাটাবেজ প্রস্তুত ও রিসিভ করছে'
                      : 'নিচে দেওয়া SQL রান করে টেবিল তৈরি করুন'}
                  </span>
                </div>

                {/* Queue / Sync */}
                <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    অফলাইন বাফার কিউ (Queue)
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-xl text-white">
                      {supabaseQueueCount}{' '}
                      <span className="text-xs font-normal text-slate-400">আইটেম</span>
                    </span>
                    {supabaseQueueCount > 0 && (
                      <button
                        onClick={handleSyncSupabaseQueue}
                        disabled={isSyncingQueue}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                        <span>সিঙ্ক করুন</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {supabaseQueueCount > 0
                      ? 'টেবিল তৈরি হলে স্বয়ংক্রিয় সিঙ্ক হবে'
                      : 'সকল ডাটা সম্পূর্ণ সিঙ্কড'}
                  </span>
                </div>
              </div>

              {/* SQL Setup Banner (Especially if table is pending) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1c33] to-[#0a1628] border border-cyan-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        সুপাবেসে টপ-আপ রিকোয়ারমেন্টস টেবিল তৈরি (Quick 1-Click Setup)
                      </h4>
                      <p className="text-xs text-slate-300">
                        আপনার Supabase ড্যাশবোর্ডের <strong className="text-cyan-300">SQL Editor</strong>-এ নিচের কোডটি পেস্ট করে Run করলেই টেবিল এবং সিকিউরিটি পলিসি সক্রিয় হয়ে যাবে।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                        setCopiedSql(true);
                        showToast('SQL কোড ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
                        setTimeout(() => setCopiedSql(false), 2500);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>কপি সম্পন্ন!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>SQL কপি করুন</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>SQL Editor খুলুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="bg-[#050b16] rounded-xl p-3 border border-slate-800 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-cyan-200/90 whitespace-pre">
                    {`CREATE TABLE IF NOT EXISTS public.top_up_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id TEXT,
  product_id TEXT,
  product_name TEXT,
  package_name TEXT,
  price NUMERIC,
  player_id TEXT,
  server_zone_id TEXT,
  in_game_name TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  payment_method TEXT DEFAULT 'SSBD Wallet',
  status TEXT DEFAULT 'requirements_filled'
);`}
                  </pre>
                </div>
              </div>

              {/* Table of Saved Top-Up Requirements */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-white">
                      সুপাবেসে সংরক্ষিত টপ-আপ রিকোয়ারমেন্টস ({supabaseRows.length})
                    </h3>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={supabaseSearchQuery}
                      onChange={(e) => setSupabaseSearchQuery(e.target.value)}
                      placeholder="প্লেয়ার আইডি, গেম বা নাম দিয়ে খুঁজুন..."
                      className="w-full bg-[#0a1224] text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-cyan-500"
                    />
                  </div>
                </div>

                {loadingSupabaseRows ? (
                  <div className="p-12 text-center rounded-2xl bg-[#091122] border border-slate-800">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">সুপাবেস থেকে ডাটা লোড হচ্ছে...</p>
                  </div>
                ) : supabaseRows.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-[#091122] border border-slate-800 text-center space-y-2">
                    <Database className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">
                      এখনো কোনো টপ-আপ রিকোয়ারমেন্ট রেকর্ড পাওয়া যায়নি
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      গ্রাহকরা যখন কোনো প্রোডাক্ট পেজে Player ID বা প্রয়োজনীয় তথ্য পূরণ করবেন, অথবা অর্ডার সম্পন্ন করবেন, তা সাথে সাথে আপনার Supabase টেবিলে জমা হবে এবং এখানে প্রদর্শিত হবে।
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#0a1224] border border-slate-800 overflow-x-auto shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#070d1a] border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="py-3 px-4">তারিখ ও সময়</th>
                          <th className="py-3 px-4">প্রোডাক্ট ও প্যাকেজ</th>
                          <th className="py-3 px-4">প্লেয়ার আইডি / তথ্য</th>
                          <th className="py-3 px-4">মূল্য</th>
                          <th className="py-3 px-4">কাস্টমার</th>
                          <th className="py-3 px-4">স্ট্যাটাস</th>
                          <th className="py-3 px-4">অর্ডার আইডি</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {supabaseRows
                          .filter((r) => {
                            if (!supabaseSearchQuery.trim()) return true;
                            const q = supabaseSearchQuery.toLowerCase();
                            return (
                              (r.product_name && r.product_name.toLowerCase().includes(q)) ||
                              (r.player_id && r.player_id.toLowerCase().includes(q)) ||
                              (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
                              (r.customer_phone && r.customer_phone.toLowerCase().includes(q)) ||
                              (r.order_id && r.order_id.toLowerCase().includes(q)) ||
                              (r.custom_fields && JSON.stringify(r.custom_fields).toLowerCase().includes(q))
                            );
                          })
                          .map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                {row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{row.product_name}</div>
                                <div className="text-[11px] text-cyan-400">{row.package_name}</div>
                              </td>
                              <td className="py-3 px-4">
                                {row.player_id && (
                                  <div className="font-mono text-cyan-300 font-bold">
                                    ID: {row.player_id}
                                  </div>
                                )}
                                {row.server_zone_id && (
                                  <div className="text-[11px] text-slate-400">
                                    Zone: {row.server_zone_id}
                                  </div>
                                )}
                                {row.custom_fields && Object.keys(row.custom_fields).length > 0 && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                    {Object.entries(row.custom_fields).map(([k, v]) => (
                                      <div key={k}>
                                        <span className="text-slate-500">{k}:</span>{' '}
                                        <span className="text-slate-300 font-mono">{String(v)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400 whitespace-nowrap">
                                ৳ {row.price || 0}
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-200">{row.customer_name || 'N/A'}</div>
                                {row.customer_phone && (
                                  <div className="font-mono text-[11px] text-slate-400">
                                    {row.customer_phone}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.status === 'order_confirmed'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : row.status === 'buy_now_intent'
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                      : row.status === 'added_to_cart'
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {row.status || 'requirements_filled'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-cyan-400 text-[11px]">
                                {row.order_id || '—'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ORDER DETAILS & STATUS UPDATE */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-cyan-800/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400">অর্ডার নম্বর</span>
                <h3 className="font-heading font-black text-2xl text-cyan-400 tracking-wider">
                  {selectedOrderDetails.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070c18] p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">কাস্টমার নাম:</span>
                <span className="text-white font-medium">{selectedOrderDetails.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">মোবাইল:</span>
                <span className="text-slate-200 font-mono">{selectedOrderDetails.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">মেথড:</span>
                <span className="text-cyan-400 font-bold">{selectedOrderDetails.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 block">TrxID:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {selectedOrderDetails.transactionId || 'N/A'}
                </span>
              </div>
            </div>

            {/* Items with Player ID */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                অর্ডারকৃত আইটেম ও ক্রেডেনশিয়ালস:
              </h4>
              {selectedOrderDetails.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#080d19] border border-slate-800 text-xs flex justify-between"
                >
                  <div>
                    <div className="font-heading font-bold text-white text-sm">
                      {item.productName}
                    </div>
                    <div className="text-cyan-400 mt-0.5">
                      {item.variationName} (পরিমাণ: {item.quantity})
                    </div>
                    {item.customFieldValues &&
                      Object.entries(item.customFieldValues).map(([k, v]) => (
                        <div key={k} className="text-slate-400 mt-1">
                          <span className="text-slate-500">{k}: </span>
                          <span className="text-cyan-300 font-mono font-bold select-all">{v}</span>
                        </div>
                      ))}
                  </div>
                  <div className="font-heading font-black text-cyan-400 text-sm">
                    ৳ {item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Digital Delivery Code Editor (Admin can paste codes for customer to see) */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60">
              <label className="text-xs font-bold text-cyan-300 block">
                ডিজিটাল ভাউচার / গিফট কার্ড কোড ডেলিভারি:
              </label>
              <p className="text-[11px] text-slate-400">
                এখানে রিডিম কোড বা পিন লিখে স্ট্যাটাস Delivered করলে গ্রাহক Track Order পেজে কোডটি দেখতে ও কপি করতে পারবে।
              </p>
              <input
                type="text"
                value={selectedOrderDetails.digitalDeliveryNotes || ''}
                onChange={(e) =>
                  setSelectedOrderDetails({
                    ...selectedOrderDetails,
                    digitalDeliveryNotes: e.target.value,
                  })
                }
                placeholder="যেমন: STEAM-9X82-KL12-MN90"
                className="w-full bg-[#070d1a] border border-cyan-700/80 font-mono text-cyan-300 text-sm px-3.5 py-2 rounded-xl focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                এডমিন ইন্টারনাল নোট (ঐচ্ছিক):
              </label>
              <input
                type="text"
                value={selectedOrderDetails.adminNotes || ''}
                onChange={(e) =>
                  setSelectedOrderDetails({
                    ...selectedOrderDetails,
                    adminNotes: e.target.value,
                  })
                }
                placeholder="অর্ডারের কোনো অভ্যন্তরীণ মন্তব্য..."
                className="w-full bg-[#070d1a] border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-xl"
              />
            </div>

            {/* Status Selectors */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs text-slate-400 block mb-1">অর্ডার স্ট্যাটাস</label>
                <select
                  value={selectedOrderDetails.orderStatus}
                  onChange={(e) =>
                    setSelectedOrderDetails({
                      ...selectedOrderDetails,
                      orderStatus: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#070d1a] border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">পেমেন্ট স্ট্যাটাস</label>
                <select
                  value={selectedOrderDetails.paymentStatus}
                  onChange={(e) =>
                    setSelectedOrderDetails({
                      ...selectedOrderDetails,
                      paymentStatus: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#070d1a] border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() =>
                  handleUpdateOrderStatus(
                    selectedOrderDetails.id,
                    selectedOrderDetails.orderStatus,
                    selectedOrderDetails.paymentStatus,
                    selectedOrderDetails.digitalDeliveryNotes,
                    selectedOrderDetails.adminNotes
                  )
                }
                className="px-5 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold shadow-md shadow-cyan-500/20"
              >
                স্ট্যাটাস সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCT ADD / EDIT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-heading font-black text-xl text-white">
                {editingProduct.name ? 'প্রোডাক্ট সম্পাদনা করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">প্রোডাক্টের নাম (English)</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Valorant Points (VP)"
                    className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">সাবটাইটেল (বাংলা)</label>
                  <input
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    placeholder="ভ্যালোরেন্ট পয়েন্টস্ (Riot Code)"
                    className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const found = categories.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categoryName: found?.name || 'Game Top-Up',
                      });
                    }}
                    className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.nameBn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">মূল্য (শুরু হচ্ছে ৳)</label>
                  <input
                    type="number"
                    value={editingProduct.basePrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl font-bold font-heading"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl font-bold font-heading"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">প্রোডাক্ট ইমেজ URL</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বর্ণনা (Description)</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>

              {/* Variations Editor */}
              <div className="p-4 rounded-2xl bg-[#070c18] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">প্যাকেজ / ভ্যারিয়েশন সমূহ:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ProductVariation = {
                        id: `var_${Date.now()}`,
                        name: 'নতুন প্যাকেজ',
                        price: editingProduct.basePrice,
                        stock: 50,
                        active: true,
                      };
                      setEditingProduct({
                        ...editingProduct,
                        variations: [...(editingProduct.variations || []), newVar],
                      });
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px]"
                  >
                    + প্যাকেজ যোগ
                  </button>
                </div>

                {editingProduct.variations?.map((v, idx) => (
                  <div key={v.id} className="flex items-center gap-2 bg-[#09101e] p-2 rounded-xl">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...editingProduct.variations];
                        updated[idx].name = e.target.value;
                        setEditingProduct({ ...editingProduct, variations: updated });
                      }}
                      placeholder="প্যাকেজ নাম"
                      className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const updated = [...editingProduct.variations];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        setEditingProduct({ ...editingProduct, variations: updated });
                      }}
                      placeholder="মূল্য"
                      className="w-20 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-cyan-400 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.variations.filter((_, i) => i !== idx);
                        setEditingProduct({ ...editingProduct, variations: updated });
                      }}
                      className="text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Fields Editor */}
              <div className="p-4 rounded-2xl bg-[#070c18] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    কাস্টম প্লেয়ার ফিল্ড (চেকআউটে গ্রাহক যা প্রদান করবে):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newField: CustomField = {
                        id: `cf_${Date.now()}`,
                        label: 'Player ID',
                        placeholder: 'আপনার আইডি দিন',
                        required: true,
                        type: 'text',
                      };
                      setEditingProduct({
                        ...editingProduct,
                        customFields: [...(editingProduct.customFields || []), newField],
                      });
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px]"
                  >
                    + ফিল্ড যোগ
                  </button>
                </div>

                {editingProduct.customFields?.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2 bg-[#09101e] p-2 rounded-xl">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const updated = [...editingProduct.customFields];
                        updated[idx].label = e.target.value;
                        setEditingProduct({ ...editingProduct, customFields: updated });
                      }}
                      placeholder="ফিল্ড লেবেল (e.g. Server ID)"
                      className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const updated = [...editingProduct.customFields];
                          updated[idx].required = e.target.checked;
                          setEditingProduct({ ...editingProduct, customFields: updated });
                        }}
                      />
                      <span>আবশ্যক</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProduct.customFields.filter((_, i) => i !== idx);
                        setEditingProduct({ ...editingProduct, customFields: updated });
                      }}
                      className="text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                    }
                  />
                  <span>সক্রিয় (Active)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isPopular}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isPopular: e.target.checked })
                    }
                  />
                  <span>জনপ্রিয় (Popular)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                    }
                  />
                  <span>ফিচার্ড (Featured)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={async () => {
                  if (!editingProduct.name.trim()) {
                    showToast('প্রোডাক্ট নাম আবশ্যক', 'error');
                    return;
                  }
                  await saveProduct(editingProduct);
                  setIsProductModalOpen(false);
                  showToast('প্রোডাক্ট সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
                }}
                className="px-5 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold shadow-md"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CATEGORY ADD / EDIT */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-heading font-black text-lg text-white">ক্যাটাগরি সম্পাদনা</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">ক্যাটাগরি নাম (English)</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ক্যাটাগরি নাম (বাংলা)</label>
                <input
                  type="text"
                  value={editingCategory.nameBn}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameBn: e.target.value })}
                  className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বর্ণনা</label>
                <input
                  type="text"
                  value={editingCategory.description}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full bg-[#070d1a] border border-slate-700 text-white p-2.5 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={async () => {
                  await saveCategory(editingCategory);
                  setIsCategoryModalOpen(false);
                  showToast('ক্যাটাগরি সেভ হয়েছে', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Payment Screenshot */}
      {viewingScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setViewingScreenshot(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-[#0a1122] border border-slate-800 rounded-3xl p-5 overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingScreenshot(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/80 border border-slate-700 flex items-center justify-center text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading font-bold text-sm text-white mb-3 text-center">
              পেমেন্ট কনফার্মেশন স্ক্রিনশট প্রুফ
            </h3>

            <div className="w-full flex-1 max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-black/40 p-2">
              <img
                src={viewingScreenshot}
                alt="Payment Screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Deposit Modal */}
      {rejectModalDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full bg-[#0a1122] border border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>ডিপোজিট বাতিল করুন ({rejectModalDeposit.id})</span>
              </h3>
              <button
                onClick={() => setRejectModalDeposit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              কাস্টমার <strong className="text-white">{rejectModalDeposit.userName}</strong> (৳{rejectModalDeposit.amount}) এর ডিপোজিট বাতিলের কারণ নির্ধারণ করুন:
            </p>

            <div className="space-y-2">
              {[
                'ভুল ট্রানজেকশন আইডি (TrxID নট ফাউন্ড)',
                'স্টেটমেন্টে কোনো টাকা জমা পাওয়া যায়নি',
                'টাকার পরিমাণ অমিল (Amount Mismatch)',
                'প্রেরক নাম্বার স্টেটমেন্টের সাথে মেলেনি',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors ${
                    rejectReason === reason
                      ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">কাস্টম কারণ বা নোট লিখুন:</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#060c18] border border-slate-700 focus:border-rose-500 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalDeposit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleRejectDeposit}
                disabled={isProcessingDeposit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                {isProcessingDeposit ? 'বাতিল হচ্ছে...' : 'বাতিল নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPROVE DEPOSIT CONFIRMATION */}
      {confirmApproveDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full bg-[#0a1122] border border-emerald-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-heading font-bold text-base text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>ডিপোজিট রিকোয়েস্ট অনুমোদন</span>
              </h3>
              <button
                onClick={() => setConfirmApproveDeposit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#070c18] border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">ডিপোজিট আইডি:</span>
                <span className="font-mono font-bold text-cyan-400">{confirmApproveDeposit.id}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">গ্রাহকের নাম:</span>
                <span className="font-semibold text-white">{confirmApproveDeposit.userName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">ইমেইল:</span>
                <span className="font-mono text-slate-300">{confirmApproveDeposit.userEmail}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">মেথড ও প্রেরক:</span>
                <span className="font-mono text-white">
                  {confirmApproveDeposit.paymentMethod} ({confirmApproveDeposit.senderNumber})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">TrxID:</span>
                <span className="font-mono font-bold text-cyan-300">{confirmApproveDeposit.transactionId}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                <span className="text-white">অনুমোদিত পরিমাণ:</span>
                <span className="font-mono text-emerald-400 font-heading text-base">
                  ৳ {confirmApproveDeposit.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40">
              আপনি কি নিশ্চিত? <strong>{confirmApproveDeposit.userName}</strong> এর ওয়ালেটে <strong>৳{confirmApproveDeposit.amount.toFixed(2)}</strong> যোগ করা হবে এবং রিকোয়েস্টটি Approved হিসেবে মার্ক হবে।
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmApproveDeposit(null)}
                disabled={isProcessingDeposit}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isProcessingDeposit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingDeposit ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>অনুমোদন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>অনুমোদন নিশ্চিত করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL WALLET BALANCE ADJUSTMENT */}
      {selectedUserForWalletAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full bg-[#0a1122] border border-cyan-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <span>ম্যানুয়াল ওয়ালেট ব্যালেন্স এডজাস্ট</span>
              </h3>
              <button
                onClick={() => setSelectedUserForWalletAdjust(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#070c18] border border-slate-800 text-xs space-y-1">
              <div className="text-white font-semibold">{selectedUserForWalletAdjust.displayName || 'Unnamed User'}</div>
              <div className="text-slate-400 font-mono text-[11px]">{selectedUserForWalletAdjust.email}</div>
              <div className="pt-2 flex justify-between border-t border-slate-800/80">
                <span className="text-slate-400">বর্তমান ওয়ালেট ব্যালেন্স:</span>
                <span className="font-mono font-bold text-cyan-400">
                  ৳ {(selectedUserForWalletAdjust.walletBalance || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveWalletAdjustment} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">অ্যাকশন নির্বাচন করুন:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustType === 'ADD'
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>+ টাকা যোগ (Credit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEDUCT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustType === 'DEDUCT'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>- টাকা কর্তন (Debit)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">টাকার পরিমাণ (৳):</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="যেমন: 500"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-500 rounded-xl p-2.5 text-sm text-cyan-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">কারণ বা প্রশাসনিক নোট (বাধ্যতামূলক):</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="যেমন: ম্যানুয়াল পেমেন্ট প্রুফ ভেরিফাইড / রিফান্ড সমন্বয়"
                  className="w-full bg-[#070c18] border border-slate-700 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              {/* Preview */}
              {adjustAmount && !isNaN(parseFloat(adjustAmount)) && parseFloat(adjustAmount) > 0 && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>বর্তমান ব্যালেন্স:</span>
                    <span className="font-mono">৳ {(selectedUserForWalletAdjust.walletBalance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>পরিবর্তন:</span>
                    <span className={`font-mono font-bold ${adjustType === 'ADD' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {adjustType === 'ADD' ? '+' : '-'} ৳ {parseFloat(adjustAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                    <span className="text-white">নতুন ব্যালেন্স হবে:</span>
                    <span className="font-mono text-cyan-400">
                      ৳ {Math.max(
                        0,
                        adjustType === 'ADD'
                          ? (selectedUserForWalletAdjust.walletBalance || 0) + parseFloat(adjustAmount)
                          : (selectedUserForWalletAdjust.walletBalance || 0) - parseFloat(adjustAmount)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForWalletAdjust(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingWallet}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAdjustingWallet ? 'আপডেট হচ্ছে...' : 'ব্যালেন্স আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER DETAILS & TRANSACTION HISTORY */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#0a1122] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {selectedUserForDetail.photoURL ? (
                  <img
                    src={selectedUserForDetail.photoURL}
                    alt={selectedUserForDetail.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {(selectedUserForDetail.displayName || selectedUserForDetail.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">
                    {selectedUserForDetail.displayName || 'Unnamed User'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedUserForDetail.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">বর্তমান ওয়ালেট:</span>
                <span className="font-heading font-black text-cyan-400 text-base font-mono">
                  ৳ {(selectedUserForDetail.walletBalance || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">মোট অর্ডার:</span>
                <span className="font-heading font-bold text-white text-base">
                  {allOrders.filter((o) => o.userId === selectedUserForDetail.uid).length} টি
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">মোট ডিপোজিট:</span>
                <span className="font-heading font-bold text-emerald-400 text-base font-mono">
                  ৳ {depositRequests
                    .filter((d) => d.userId === selectedUserForDetail.uid && d.status === 'Approved')
                    .reduce((s, d) => s + d.amount, 0)
                    .toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">অ্যাকাউন্ট স্ট্যাটাস:</span>
                <span className="font-bold text-white mt-1 block">
                  {selectedUserForDetail.status || 'Active'}
                </span>
              </div>
            </div>

            {/* User Deposit History */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-cyan-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>ডিপোজিট রিকোয়েস্ট হিস্টরি</span>
              </h4>

              <div className="rounded-2xl bg-[#070c18] border border-slate-800 overflow-hidden">
                {depositRequests.filter((d) => d.userId === selectedUserForDetail.uid).length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">কোনো ডিপোজিট রেকর্ড নেই</p>
                ) : (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-slate-400 bg-slate-900/60 uppercase">
                        <tr>
                          <th className="p-3">আইডি ও তারিখ</th>
                          <th className="p-3">মেথড</th>
                          <th className="p-3">TrxID</th>
                          <th className="p-3">পরিমাণ</th>
                          <th className="p-3">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {depositRequests
                          .filter((d) => d.userId === selectedUserForDetail.uid)
                          .map((d) => (
                            <tr key={d.id} className="hover:bg-slate-800/30">
                              <td className="p-3">
                                <span className="font-bold text-white block">{d.id}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(d.createdAt).toLocaleDateString('bn-BD')}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-cyan-400">{d.paymentMethod}</td>
                              <td className="p-3 font-mono text-slate-300">{d.transactionId}</td>
                              <td className="p-3 font-mono font-bold text-white">৳ {d.amount}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    d.status === 'Approved'
                                      ? 'bg-emerald-950 text-emerald-300'
                                      : d.status === 'Rejected'
                                      ? 'bg-rose-950 text-rose-300'
                                      : 'bg-amber-950 text-amber-300'
                                  }`}
                                >
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Ledger History */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-emerald-400 flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>ওয়ালেট লেজার লেনদেন (Transaction Ledger)</span>
              </h4>

              <div className="rounded-2xl bg-[#070c18] border border-slate-800 overflow-hidden">
                {allWalletTxs.filter((tx) => tx.userId === selectedUserForDetail.uid).length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">কোনো লেজার লেনদেন পাওয়া যায়নি</p>
                ) : (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-slate-400 bg-slate-900/60 uppercase">
                        <tr>
                          <th className="p-3">তারিখ</th>
                          <th className="p-3">টাইপ</th>
                          <th className="p-3">পরিমাণ</th>
                          <th className="p-3">পূর্বের / নতুন ব্যালেন্স</th>
                          <th className="p-3">বিবরণ / কারণ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {allWalletTxs
                          .filter((tx) => tx.userId === selectedUserForDetail.uid)
                          .map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-800/30">
                              <td className="p-3 text-[10px] text-slate-400 font-mono">
                                {new Date(tx.createdAt).toLocaleString('bn-BD')}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tx.type.includes('CREDIT') || tx.type.includes('ADD')
                                      ? 'bg-emerald-950 text-emerald-400'
                                      : 'bg-rose-950 text-rose-400'
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold">
                                <span
                                  className={
                                    tx.type.includes('CREDIT') || tx.type.includes('ADD')
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }
                                >
                                  {tx.type.includes('CREDIT') || tx.type.includes('ADD') ? '+' : '-'} ৳ {tx.amount}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] font-mono text-slate-400">
                                ৳ {tx.previousBalance} → ৳ {tx.newBalance}
                              </td>
                              <td className="p-3 text-[11px] text-slate-300 max-w-xs truncate" title={tx.description}>
                                {tx.description}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
