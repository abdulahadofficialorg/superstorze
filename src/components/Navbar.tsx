import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { openSupportDesk } from './SupportWidget';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  Zap,
  Clock,
  Sparkles,
  LogOut,
  Wallet,
  PlusCircle,
  Sun,
  Moon,
  Globe,
  Headphones,
  Bell,
  MessageCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { siteSettings, currentPage, navigateTo, searchTerm, setSearchTerm } = useStore();
  const { user, profile, isAdmin, loginWithGoogle, openAuthModal, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { theme, toggleTheme, language, toggleLanguage, t } = useThemeLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigateTo('catalog');
    }
  };

  const navLinks = [
    { label: t('nav_home'), page: 'home' as const, isTrack: false },
    { label: t('nav_game_topup'), page: 'catalog' as const, categorySlug: 'game-top-up', isTrack: false },
    { label: t('nav_digital_cards'), page: 'catalog' as const, categorySlug: 'digital-cards', isTrack: false },
    { label: t('nav_track_order'), page: 'track-order' as const, isTrack: true },
  ];

  const showAnnouncement = siteSettings.announcementEnabled !== false && Boolean(siteSettings.announcement);

  return (
    <header className="sticky top-0 z-50 transition-all">
      {/* Top Announcement Bar */}
      {showAnnouncement && (
        <div className="announcement-banner bg-gradient-to-r from-[#EAF4FF] via-[#C7E2FF] to-[#EAF4FF] dark:from-cyan-950 dark:via-[#101B2D] dark:to-blue-950 border-b border-[#C7E2FF] dark:border-[#172B45] text-slate-800 dark:text-cyan-200 text-xs py-1.5 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-cyan-500/20 border border-blue-400/40 dark:border-cyan-400/30 text-blue-700 dark:text-cyan-300 font-bold text-[10px] tracking-wide uppercase flex-shrink-0">
                <Bell className="w-2.5 h-2.5 animate-bounce" />
                <span>{siteSettings.announcementBadge || 'জরুরি নোটিশ'}</span>
              </span>
              <p className="truncate text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs">
                {siteSettings.announcement}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={openSupportDesk}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <Headphones className="w-3 h-3" />
                <span>লাইভ সাপোর্ট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="navbar-container bg-white/95 dark:bg-[#101B2D]/95 backdrop-blur-md border-b border-[#C7E2FF] dark:border-[#172B45] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            {/* Logo */}
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group flex-shrink-0 min-w-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#4D91E8] via-[#6BA8F5] to-[#4D91E8] flex items-center justify-center font-heading font-black text-white text-sm sm:text-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                SS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-black text-sm sm:text-xl text-slate-900 dark:text-white tracking-tight group-hover:text-[#4D91E8] dark:group-hover:text-cyan-400 transition-colors truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                  {siteSettings.storeName || 'SuperStorez.com'}
                </span>
                <span className="hidden sm:block text-[10px] text-[#4D91E8] dark:text-cyan-400 -mt-1 font-semibold tracking-wider uppercase">
                  Gaming & Top-up Store
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const isActive =
                  currentPage === link.page ||
                  (link.categorySlug && currentPage === 'catalog');

                if (link.isTrack) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => navigateTo(link.page)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                        currentPage === 'track-order'
                          ? 'bg-[#6BA8F5]/20 dark:bg-cyan-500/20 text-[#2563EB] dark:text-cyan-300 border-[#6BA8F5] dark:border-cyan-500/50 shadow-sm'
                          : 'bg-[#EAF4FF] dark:bg-[#172B45] text-slate-700 dark:text-slate-300 border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/40 hover:text-[#2563EB] dark:hover:text-cyan-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#6BA8F5] dark:bg-cyan-400 animate-pulse"></span>
                      <span>{link.label}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={link.label}
                    onClick={() =>
                      navigateTo(link.page, link.categorySlug ? { categorySlug: link.categorySlug } : undefined)
                    }
                    className={`relative px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#2563EB] dark:text-cyan-400'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-gradient-to-r from-[#6BA8F5] to-[#4D91E8] dark:from-cyan-500 dark:to-cyan-300 rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* Support Desk Trigger */}
              <button
                onClick={openSupportDesk}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer ml-1"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'bn' ? 'সাপোর্ট' : 'Support'}</span>
              </button>
            </nav>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative flex-1 max-w-xs xl:max-w-sm mx-2"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('nav_search_placeholder')}
                className="w-full bg-[#EAF4FF] dark:bg-[#172B45] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 pl-10 pr-4 py-2 rounded-full border border-[#C7E2FF] dark:border-[#172B45] focus:outline-none focus:border-[#6BA8F5] dark:focus:border-cyan-500 transition-all"
              />
            </form>

            {/* Right Action Area */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              
              {/* Bangla / English Toggle (Desktop & Tablet) */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-cyan-400 transition-all cursor-pointer shadow-sm group"
                title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
                aria-label="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#4D91E8] dark:text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
                <span className="font-heading font-bold text-[11px] tracking-wide">
                  {language === 'bn' ? 'বাং' : 'EN'}
                </span>
              </button>

              {/* Day / Night Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/60 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-cyan-400 transition-all cursor-pointer shadow-sm flex items-center justify-center group"
                title={theme === 'dark' ? t('mode_day') : t('mode_night')}
                aria-label="Toggle Day / Night Mode"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-200" />
                ) : (
                  <Moon className="w-4 h-4 text-[#2563EB] group-hover:-rotate-12 transition-transform duration-200" />
                )}
              </button>

              {/* User / Login Area */}
              <div className="relative">
                {user ? (
                  <div>
                    {/* Desktop full pill */}
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-cyan-900/60 hover:border-[#6BA8F5] dark:hover:border-cyan-500/50 transition-all text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer"
                    >
                      <span className="text-slate-500 dark:text-slate-400">{t('nav_balance')}:</span>
                      <span className="font-heading font-bold text-[#2563EB] dark:text-cyan-400">
                        ৳ {(profile?.walletBalance ?? 0).toFixed(2)}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-cyan-950 flex items-center justify-center text-[#2563EB] dark:text-cyan-400 border border-[#C7E2FF] dark:border-cyan-700/50 overflow-hidden">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Mobile compact avatar */}
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="sm:hidden w-8 h-8 rounded-full bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-cyan-700/50 flex items-center justify-center text-[#2563EB] dark:text-cyan-400 overflow-hidden"
                      aria-label="User profile"
                    >
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openAuthModal}
                    className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6BA8F5] dark:bg-cyan-500/10 hover:bg-[#4D91E8] dark:hover:bg-cyan-500/20 border border-[#6BA8F5] dark:border-cyan-500/50 text-xs sm:text-sm text-white dark:text-cyan-300 font-semibold cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <span>{t('nav_login')}</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 dark:bg-cyan-950 flex items-center justify-center text-white dark:text-cyan-400">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  </button>
                )}

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#101B2D] border border-[#C7E2FF] dark:border-[#172B45] shadow-2xl py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#C7E2FF] dark:border-[#172B45]">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {profile?.displayName || t('nav_user_greeting')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-2 flex items-center justify-between text-xs bg-[#EAF4FF] dark:bg-[#172B45] p-2 rounded-lg border border-[#C7E2FF] dark:border-cyan-900/40">
                        <span className="text-slate-600 dark:text-slate-300">{t('nav_balance')}</span>
                        <span className="font-heading font-bold text-[#2563EB] dark:text-cyan-400">
                          ৳ {(profile?.walletBalance ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigateTo('account')}
                        className="mt-2 w-full py-1.5 rounded-lg bg-[#6BA8F5] dark:bg-cyan-500 hover:bg-[#4D91E8] dark:hover:bg-cyan-400 text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{t('nav_deposit_btn')}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => navigateTo('account')}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-[#EAF4FF] dark:hover:bg-[#172B45] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#2563EB] dark:text-cyan-400" />
                      <span>{t('nav_my_account')}</span>
                    </button>

                    <button
                      onClick={() => navigateTo('account')}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-[#EAF4FF] dark:hover:bg-[#172B45] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>{t('nav_wallet_history')}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => navigateTo('admin')}
                        className="w-full text-left px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t('nav_admin_panel')}</span>
                      </button>
                    )}

                    <div className="border-t border-[#C7E2FF] dark:border-[#172B45] mt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav_logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-full bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] hover:border-[#6BA8F5] dark:hover:border-cyan-500/60 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
                title={t('nav_cart')}
                aria-label="View shopping cart"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black font-extrabold text-[10px] sm:text-xs flex items-center justify-center shadow-md">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-white cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('nav_search_placeholder')}
                className="w-full bg-[#EAF4FF] dark:bg-[#172B45] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2 rounded-full border border-[#C7E2FF] dark:border-[#172B45] focus:outline-none focus:border-[#6BA8F5] dark:focus:border-cyan-500 transition-all"
              />
            </form>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-[#C7E2FF] dark:border-[#172B45] space-y-3 animate-in slide-in-from-top duration-200">
              
              {/* If not logged in on mobile, show quick Login CTA */}
              {!user && (
                <div className="p-3 rounded-2xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#1f3a5e] flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{t('nav_login')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">অর্ডার ও ওয়ালেট ব্যবহারের জন্য</p>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black font-bold text-xs shadow-md cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </div>
              )}

              {/* If logged in on mobile, show wallet banner */}
              {user && (
                <div className="p-3 rounded-2xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#1f3a5e] flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {profile?.displayName || 'সম্মানিত গ্রাহক'}
                    </p>
                    <p className="text-xs text-[#2563EB] dark:text-cyan-400 font-bold">
                      {t('nav_balance')}: ৳ {(profile?.walletBalance ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateTo('account');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#6BA8F5] dark:bg-cyan-500 text-white dark:text-black font-bold text-xs cursor-pointer"
                    >
                      + ডিপোজিট
                    </button>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo(link.page, link.categorySlug ? { categorySlug: link.categorySlug } : undefined);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between cursor-pointer ${
                      currentPage === link.page
                        ? 'bg-[#6BA8F5]/15 dark:bg-cyan-500/10 text-[#2563EB] dark:text-cyan-400 border border-[#6BA8F5]/40 dark:border-cyan-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-[#EAF4FF] dark:hover:bg-[#172B45]/50'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.isTrack && (
                      <span className="w-2 h-2 rounded-full bg-[#6BA8F5] dark:bg-cyan-400 animate-pulse"></span>
                    )}
                  </button>
                ))}

                {/* Mobile Live Support Button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSupportDesk();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>{language === 'bn' ? 'লাইভ সাপোর্ট ও হেল্পডেস্ক' : 'Live Support & Helpdesk'}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </div>

              {/* Day / Night and Bangla / English Quick Controls for Mobile */}
              <div className="pt-2 border-t border-[#C7E2FF] dark:border-[#172B45] grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>{t('mode_day')}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#2563EB]" />
                      <span>{t('mode_night')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#EAF4FF] dark:bg-[#172B45] border border-[#C7E2FF] dark:border-[#172B45] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#4D91E8] dark:text-cyan-400" />
                  <span>{language === 'bn' ? 'English (EN)' : 'বাংলা (BN)'}</span>
                </button>
              </div>

              {/* If user is logged in, show logout inside mobile drawer */}
              {user && (
                <div className="pt-2 border-t border-[#C7E2FF] dark:border-[#172B45]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav_logout')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
