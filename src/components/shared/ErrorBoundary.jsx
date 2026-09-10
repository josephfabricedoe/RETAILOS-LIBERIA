import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RetailOS App Crash caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('retailos_role_override');
      sessionStorage.clear();
    } catch (e) {}
    window.location.hash = '#workspace';
    window.location.reload();
  };

  handleSignOutAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.hash = '#login';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
            <p className="text-xs text-slate-400">
              The application encountered an unexpected state. Your local data and sales records remain safe.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-red-900/40 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-red-300">
                {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleSignOutAndReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
