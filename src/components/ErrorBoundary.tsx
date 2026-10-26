import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SuperStorez App ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b15] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d1629] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 mx-auto shadow-xl">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>

            <div>
              <h2 className="font-heading font-black text-2xl text-white">
                সাময়িক ত্রুটি দেখা দিয়েছে
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                পেজটি লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে পেজটি রিলোড দিন অথবা মূল পাতায় ফিরে যান।
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/40 border border-slate-800 rounded-xl text-left text-[11px] text-rose-300 font-mono overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিলোড দিন</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>মূল পাতা</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
