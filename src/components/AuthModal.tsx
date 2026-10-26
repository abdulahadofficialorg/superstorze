import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/ThemeLanguageContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    loginWithGoogle,
  } = useAuth();
  const { isBangla } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        isBangla
          ? 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।'
          : 'Please enter both email and password.'
      );
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage(
        isBangla
          ? 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে।');
        } else {
          closeAuthModal();
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (!res.success) {
          setErrorMessage(res.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
        } else {
          setSuccessMessage(
            res.message ||
              (isBangla
                ? 'একাউন্ট সফলভাবে তৈরি হয়েছে! আপনি এখন লগইন করতে পারেন।'
                : 'Account created successfully! You can now sign in.')
          );
          if (res.message?.includes('লগইন সম্পন্ন')) {
            setTimeout(() => closeAuthModal(), 1200);
          } else {
            setMode('signin');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google সাইন-ইন ব্যর্থ হয়েছে');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0a1122] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-500/20 mb-3">
            {mode === 'signin' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="font-heading font-black text-2xl text-white">
            {mode === 'signin'
              ? isBangla
                ? 'একাউন্টে সাইন ইন করুন'
                : 'Sign in to Account'
              : isBangla
              ? 'নতুন একাউন্ট তৈরি করুন'
              : 'Create New Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {isBangla
              ? 'সুপার স্টোরেজ বিডি গেমিং শপ এবং ওয়ালেট অ্যাক্সেস'
              : 'Access your SuperStorez BD wallet and gaming account'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-[#060c18] border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('signin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-cyan-500 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isBangla ? 'লগইন (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('signup')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-cyan-500 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isBangla ? 'রেজিস্ট্রেশন (Register)' : 'Register'}
          </button>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isBangla ? 'আপনার পূর্ণ নাম:' : 'Full Name:'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isBangla ? 'যেমন: আব্দুল্লাহ' : 'e.g. John Doe'}
                  className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isBangla ? 'ইমেইল এড্রেস:' : 'Email Address:'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isBangla ? 'পাসওয়ার্ড:' : 'Password:'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-heading font-black text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isBangla ? 'ইমেইল দিয়ে লগইন করুন' : 'Sign In with Email'}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isBangla ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Registration'}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {isBangla ? 'অথবা Google দিয়ে' : 'Or via Google'}
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Google One-Click Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-2.5 rounded-xl bg-[#060c18] hover:bg-[#0c162c] text-white border border-slate-700/80 hover:border-cyan-500/50 font-medium text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isBangla ? 'Google দিয়ে সাইন ইন করুন' : 'Sign In with Google'}</span>
        </button>

        {/* Footer switch */}
        <div className="text-center text-[11px] text-slate-400 pt-1">
          {mode === 'signin' ? (
            <span>
              {isBangla ? 'একাউন্ট নেই?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                {isBangla ? 'এখনই রেজিস্ট্রেশন করুন' : 'Register now'}
              </button>
            </span>
          ) : (
            <span>
              {isBangla ? 'পূর্বেই একাউন্ট রয়েছে?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                {isBangla ? 'লগইন করুন' : 'Sign In'}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
