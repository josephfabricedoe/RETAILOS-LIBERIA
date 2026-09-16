import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Phone, 
  Sparkles, 
  ArrowLeft,
  KeyRound,
  User,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function withTimeout(promise, timeoutMs = 3500) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
    ),
  ]);
}

export default function LoginPage({ onBackToLanding, onSuccess, onGoToLanding, onGoToAdmin }) {
  const { signIn, loginAsLocalUser } = useAuth();
  const { switchTenant } = useTenant();

  const [email, setEmail] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('email') || '';
    } catch (e) {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPw = password.trim();

    if (!cleanEmail || !cleanPw) {
      setError('Please enter both your email address and password.');
      setLoading(false);
      return;
    }

    // 1. Instant Super-Admin Master Login for Joseph Doe (< 15ms)
    if (cleanEmail === 'josephfabricedoe@gmail.com' && cleanPw === 'Joso2Fabio') {
      loginAsLocalUser({
        uid: 'superadmin_joseph',
        email: cleanEmail,
        displayName: 'Joseph Doe (Super-Admin)',
        role: 'superadmin',
        businessId: 'all',
      }, 'all');

      setLoading(false);
      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();

      // Non-blocking Firebase Auth sync in background
      signIn(cleanEmail, cleanPw).catch(() => {});
      return;
    }

    // 2. Check local accounts cache for 0ms instant login (works 100% offline)
    try {
      const localAccounts = JSON.parse(localStorage.getItem('retailos_platform_accounts') || '[]');
      const match = localAccounts.find(
        (a) => a.email && a.email.toLowerCase() === cleanEmail && a.password === cleanPw
      );

      if (match) {
        loginAsLocalUser(match, match.businessId);
        if (switchTenant && match.businessId) {
          switchTenant(match.businessId);
        }
        setLoading(false);
        window.location.hash = '#workspace';
        if (onSuccess) onSuccess();
        return;
      }
    } catch (e) {
      console.warn('Local account cache error:', e);
    }

    // 3. Query Firestore 'users' collection with fast timeout
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snap = await withTimeout(getDocs(q), 3500);

      if (!snap.empty) {
        const userDoc = snap.docs[0].data();
        if (userDoc.password && userDoc.password === cleanPw) {
          loginAsLocalUser(userDoc, userDoc.businessId);
          if (switchTenant && userDoc.businessId) {
            switchTenant(userDoc.businessId);
          }

          // Cache locally for instant future logins
          try {
            const localAccs = JSON.parse(localStorage.getItem('retailos_platform_accounts') || '[]');
            const updated = [userDoc, ...localAccs.filter((a) => a.email !== userDoc.email)];
            localStorage.setItem('retailos_platform_accounts', JSON.stringify(updated));
          } catch (e) {}

          setLoading(false);
          window.location.hash = '#workspace';
          if (onSuccess) onSuccess();
          return;
        }
      }
    } catch (cloudErr) {
      console.warn('Cloud user lookup notice:', cloudErr);
    }

    // 4. Try standard Firebase Auth
    try {
      await withTimeout(signIn(cleanEmail, cleanPw), 3500);
      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();
    } catch (authErr) {
      console.warn('Authentication failure notice:', authErr);
      setError('Invalid email or password. Please verify your credentials with your store administrator.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (eMail, pw) => {
    setEmail(eMail);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background soft ambient glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (onBackToLanding) onBackToLanding();
              else if (onGoToLanding) onGoToLanding();
              else window.location.hash = '#landing';
            }}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Support Hotline: </span>
            <a href="tel:0770430269" className="font-mono font-bold text-slate-900 hover:underline">
              0770430269
            </a>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-600/30">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              RetailOS <span className="text-emerald-600">Liberia</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Sign in with your Store Owner or Cashier credentials
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@store.lr or cashier1@store.lr"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your store password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-medium text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Store</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role Access Information */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Role-Based Access Control</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-500 pl-6 list-disc">
              <li><strong className="text-slate-700">Store Owner:</strong> Full store access (POS, Inventory, Daily Reports, Customers).</li>
              <li><strong className="text-slate-700">Cashier:</strong> POS register access only to ring sales and print receipts.</li>
            </ul>
          </div>

          {/* Registration Notice */}
          <div className="text-center pt-1 space-y-2">
            <p className="text-xs text-slate-500">
              Need a store account?{' '}
              <button
                onClick={() => {
                  if (onBackToLanding) onBackToLanding();
                  else if (onGoToLanding) onGoToLanding();
                  else window.location.hash = '#landing';
                }}
                className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                Register your business
              </button>
            </p>
            <p className="text-[11px] text-slate-400">
              Platform Administrator?{' '}
              <button
                type="button"
                onClick={() => {
                  if (onGoToAdmin) onGoToAdmin();
                  else {
                    window.location.hash = '#admin';
                  }
                }}
                className="text-slate-600 hover:text-slate-900 font-semibold hover:underline"
              >
                Sign In to Super-Admin (/admin)
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Support Hotline */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Need help logging in?</span>
          <a
            href="https://wa.me/231770430269?text=Hello%20RetailOS%20Liberia%2C%20I%20need%20assistance%20logging%20into%20my%20store"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp (0770430269)</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
