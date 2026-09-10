import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShoppingBag, Store, Sparkles } from 'lucide-react';

export default function LoginPage({ onOpenCatalog, onGoToLanding }) {
  const { signIn } = useAuth();
  const { currentTenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(msgs[err.code] || 'Sign-in failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const storeName = currentTenant?.businessName || 'RetailOS Liberia';
  const themeColor = currentTenant?.themeColor || '#0ea5e9';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Store / Platform Logo */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl mx-auto border-2 border-white/20 text-white font-black text-2xl"
              style={{ backgroundColor: themeColor }}
            >
              {currentTenant?.logoUrl ? (
                <img src={currentTenant.logoUrl} alt={storeName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Store className="w-10 h-10" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            {storeName}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest mt-1 text-cyan-400">
            {currentTenant?.businessType || 'Cloud POS & Operations'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Staff & Terminal Sign In</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Liberia POS
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@store.com"
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(v => !v)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Signing In...' : 'Sign In to Register'}
            </button>
          </form>

          {/* Catalog & Landing quick jumps */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
            {onOpenCatalog && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Browse Storefront Catalog</span>
              </button>
            )}

            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>About RetailOS Liberia / Free Trial</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mt-6 space-y-1">
          <p>
            Liberia Support & Training: <a href="tel:0770430269" className="font-bold text-emerald-400 hover:underline font-mono">0770430269</a>
            <span className="mx-1 text-slate-600">·</span>
            <a href="https://wa.me/231770430269" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">WhatsApp</a>
          </p>
          <p className="text-slate-600">
            RetailOS Liberia &copy; {new Date().getFullYear()} · Multi-Tenant Retail OS
          </p>
        </div>
      </div>
    </div>
  );
}
