import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs sm:text-sm animate-in slide-in-from-right duration-200 ${
            t.type === 'success'
              ? 'bg-[#0a1827]/95 text-cyan-200 border-cyan-800/80 shadow-cyan-950/50'
              : t.type === 'error'
              ? 'bg-[#210c14]/95 text-rose-200 border-rose-800/80 shadow-rose-950/50'
              : 'bg-[#0f172a]/95 text-slate-200 border-slate-700/80 shadow-slate-950/50'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}

          <div className="flex-1 font-medium leading-snug">{t.message}</div>

          <button
            onClick={() => removeToast(t.id)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
