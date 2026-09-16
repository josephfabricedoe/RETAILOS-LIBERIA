import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Store, 
  ShieldAlert
} from 'lucide-react';

export default function AdminLoginPage({ onBackToLanding, onSuccess, onGoToApp }) {
  const { signIn, loginAsLocalUser } = useAuth();
  const { switchTenant } = useTenant();

  const [email, setEmail] = useState('josephfabricedoe@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPw = password.trim();

    if (!cleanEmail || !cleanPw) {
      setError('Please enter both your Super Admin email and master password.');
      setLoading(false);
      return;
    }

    // 1. Direct Master Authentication for Joseph Doe
    if (cleanEmail === 'josephfabricedoe@gmail.com' && cleanPw === 'Joso2Fabio') {
      loginAsLocalUser({
        uid: 'superadmin_joseph',
        email: cleanEmail,
        displayName: 'Joseph Doe (Super-Admin)',
        role: 'superadmin',
        businessId: 'all',
      }, 'all');

      // Attempt background cloud auth
      signIn(cleanEmail, cleanPw).catch(() => {});

      setLoading(false);
      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();
      return;
    }

    // 2. Fallback to Firebase Auth for configured admin emails
    try {
      await signIn(cleanEmail, cleanPw);
      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();
    } catch (err) {
      console.warn('Super Admin Auth failed:', err);
      setError('Invalid Super Admin credentials. Access restricted to platform management.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (onBackToLanding) onBackToLanding();
              else {
                window.location.pathname = '/';
                window.location.hash = '#landing';
              }
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Homepage</span>
          </button>

          <button
            onClick={() => {
              if (onGoToApp) onGoToApp();
              else {
                window.location.hash = '#app';
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Store & Cashier Login (/app)</span>
          </button>
        </div>
      </header>

      {/* Main Admin Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/40">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3" />
              Platform Super-Admin
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Master Control Center
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Authorized access for platform management and client store onboarding
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSignIn} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Super-Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="josephfabricedoe@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white font-medium text-xs placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master admin password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white font-medium text-xs placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Master Console...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Super-Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick link to Store login */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Not a platform administrator?{' '}
              <button
                type="button"
                onClick={() => {
                  if (onGoToApp) onGoToApp();
                  else {
                    window.location.hash = '#app';
                  }
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
              >
                Go to Store & Cashier Login (/app)
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-slate-600 border-t border-slate-900 bg-slate-950/80">
        <span>RetailOS Liberia Master Admin Engine · Monrovia, Liberia</span>
      </footer>
    </div>
  );
}
