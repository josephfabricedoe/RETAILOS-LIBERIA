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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center font-sans text-slate-900">
          <div className="max-w-md w-full bg-white border-2 border-slate-200 p-8 rounded-3xl space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Something Went Wrong</h2>
            <p className="text-xs text-slate-600 font-medium">
              The application encountered an unexpected state. Your local data and sales records remain safe.
            </p>

            {this.state.error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-800">
                {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleSignOutAndReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
