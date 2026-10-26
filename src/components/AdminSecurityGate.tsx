import React, { useState } from 'react';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  LogIn,
  ArrowLeft,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const AdminSecurityGate: React.FC = () => {
  const { loginWithGoogle, signInWithEmail } = useAuth();
  const { navigateTo } = useStore();

  const [adminEmail, setAdminEmail] = useState(AUTHORIZED_ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (adminEmail.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      setErrorMessage(
        'অ্যাক্সেস ডিনাইড! শুধুমাত্র অনুমোদিত এডমিন ইমেইল (' +
          AUTHORIZED_ADMIN_EMAIL +
          ') দিয়ে লগইন করলেই এডমিন প্যানেল সচল হবে।'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmail(adminEmail, adminPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'এডমিন লগইন ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'অথেন্টিকেশন ত্রুটি');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const loggedUser = await loginWithGoogle();
      if (!loggedUser) {
        setErrorMessage('লগইন বাতিল বা ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      } else if (!loggedUser.email || loggedUser.email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage('অ্যাক্সেস ডিনাইড! শুধুমাত্র অনুমোদিত নির্দিষ্ট এডমিন আইডি দিয়ে লগইন করলেই এডমিন প্যানেল অন হবে, অন্য কোনো একাউন্টে এডমিন এক্সেস দেওয়া হবে না।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'অথেন্টিকেশন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050912] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background security grid and glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[#0a1122]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Shield Icon */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mx-auto shadow-xl shadow-cyan-500/20 mb-3">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>

          <h2 className="font-heading font-black text-2xl text-white">
            এডমিন কন্ট্রোল প্যানেল
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            সংরক্ষিত এলাকা: শুধুমাত্র নির্দিষ্ট এডমিন আইডি দিয়ে লগইন করলেই এডমিন অন হবে
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Method 1: Email & Password Admin Sign-In */}
          <form onSubmit={handleEmailAdminLogin} className="p-5 rounded-2xl bg-[#0d1629] border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">এডমিন ইমেইল ও পাসওয়ার্ড:</span>
              <span className="text-[10px] text-cyan-400 font-mono">Email Sign-In</span>
            </div>

            <div>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="abdulahad.onr2@gmail.com"
                required
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="এডমিন পাসওয়ার্ড লিখুন"
                required
                className="w-full bg-[#060c18] border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-heading font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ইমেইল দিয়ে এডমিন লগইন (Sign In)</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              অথবা Google দিয়ে
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Method 2: Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#0d1629] hover:bg-[#121f38] border border-slate-700/80 hover:border-cyan-500/50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>Google একাউন্ট দিয়ে এডমিন সাইন-ইন</span>
          </button>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigateTo('home')}
          className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>মূল ওয়েবসাইটে ফিরে যান</span>
        </button>
      </div>
    </div>
  );
};
