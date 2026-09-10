import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { 
  Lock, Mail, Eye, EyeOff, AlertCircle, ShoppingBag, Store, Sparkles, 
  User, Phone, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { WEST_AFRICAN_CURRENCIES } from '../hooks/useCurrency';

const STORE_TYPES = [
  'Boutique & Fashion',
  'Pharmacy & Healthcare',
  'Cosmetics & Beauty',
  'Supermarket & Grocery',
  'Electronics & Phones',
  'Provision & General Store',
  'Hardware & Building Materials',
  'Restaurant & Cafe',
];

export default function LoginPage({ onOpenCatalog, onGoToLanding }) {
  const { signIn } = useAuth();
  const { currentTenant } = useTenant();
  
  // Tab Mode: 'signin' or 'signup'
  const [mode, setMode] = useState('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Sign Up State
  const [signupBusinessName, setSignupBusinessName] = useState('');
  const [signupBusinessType, setSignupBusinessType] = useState('Boutique & Fashion');
  const [signupOwnerName, setSignupOwnerName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCurrencyMode, setSignupCurrencyMode] = useState('dual');
  const [signupPrimaryCurrency, setSignupPrimaryCurrency] = useState('USD');
  const [signupSecondaryCurrency, setSignupSecondaryCurrency] = useState('LRD');
  const [signupFxRate, setSignupFxRate] = useState(198);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Sign In (Store Owner or Cashier)
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email. Click "Register New Store" to create one.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(msgs[err.code] || 'Sign-in failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Self-Service Sign Up (Store Owner - Free Forever Plan)
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupBusinessName.trim() || !signupOwnerName.trim()) {
      setError('Business Name and Store Owner Name are required.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword);
      const uid = cred.user.uid;

      // 2. Generate store identifiers
      const slug = signupBusinessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `store-${Date.now().toString().slice(-4)}`;
      const businessId = `biz_${slug}_${Date.now().toString().slice(-4)}`;

      const primaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === signupPrimaryCurrency);
      const secondaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === signupSecondaryCurrency);

      // 3. Create Business Tenant record in Firestore
      const newBusinessRecord = {
        businessId,
        businessName: signupBusinessName.trim(),
        slug,
        businessType: signupBusinessType,
        ownerName: signupOwnerName.trim(),
        ownerEmail: signupEmail.trim(),
        ownerPhone: signupPhone.trim(),
        terminalEmail: `pos_${slug}@retailos.lr`,
        themeColor: '#10b981',
        currencyMode: signupCurrencyMode,
        primaryCurrency: signupPrimaryCurrency,
        primarySymbol: primaryObj?.symbol || '$',
        secondaryCurrency: signupCurrencyMode === 'dual' ? signupSecondaryCurrency : '',
        secondarySymbol: signupCurrencyMode === 'dual' ? (secondaryObj?.symbol || 'L$') : '',
        exchangeRate: Number(signupFxRate) || 198,
        fxRate: Number(signupFxRate) || 198,
        subscriptionPlan: 'starter', // Free Forever Entry Plan
        subscriptionStatus: 'active',
        address: 'Monrovia, Liberia',
        phone: signupPhone.trim(),
        whatsappNumber: signupPhone.replace(/[^0-9]/g, ''),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'businesses', businessId), newBusinessRecord);

      // 4. Create User Profile linking to new business
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: signupEmail.trim(),
        displayName: signupOwnerName.trim(),
        role: 'owner', // Full Store Owner Access
        tenantId: businessId,
        businessName: signupBusinessName.trim(),
        createdAt: serverTimestamp(),
      });

      // 5. Populate initial default products so store owner can test immediately
      const defaultProducts = [
        {
          name: 'Classic Men Polo T-Shirt',
          category: 'Apparel & Fashion',
          retailPrice: 15.00,
          wholesalePrice: 12.00,
          showroomQty: 24,
          storeroomQty: 50,
          barcode: '1001',
          createdAt: serverTimestamp(),
        },
        {
          name: 'Shea Butter Body Lotion 400ml',
          category: 'Cosmetics & Beauty',
          retailPrice: 8.50,
          wholesalePrice: 6.00,
          showroomQty: 18,
          storeroomQty: 36,
          barcode: '1002',
          createdAt: serverTimestamp(),
        },
        {
          name: 'Paracetamol Tablets 500mg (100s)',
          category: 'Pharmacy & Healthcare',
          retailPrice: 4.00,
          wholesalePrice: 2.50,
          showroomQty: 30,
          storeroomQty: 100,
          barcode: '1003',
          createdAt: serverTimestamp(),
        }
      ];

      for (const prod of defaultProducts) {
        const prodRef = doc(db, 'businesses', businessId, 'products', `prod_${Date.now()}_${Math.floor(Math.random()*1000)}`);
        await setDoc(prodRef, prod);
      }

      // Automatically sign in
      window.location.reload();
    } catch (err) {
      console.error('Registration error:', err);
      const msgs = {
        'auth/email-already-in-use': 'This email is already registered. Please click "Sign In" instead.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      };
      setError(msgs[err.code] || err.message || 'Failed to create your store account.');
    } finally {
      setLoading(false);
    }
  };

  const storeName = currentTenant?.businessName || 'RetailOS Liberia';
  const themeColor = currentTenant?.themeColor || '#10b981';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-100 to-slate-100 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Store / Platform Logo */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div 
              className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-md mx-auto border-2 border-white text-white font-black text-2xl"
              style={{ backgroundColor: themeColor }}
            >
              {currentTenant?.logoUrl ? (
                <img src={currentTenant.logoUrl} alt={storeName} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <Store className="w-8 h-8" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {mode === 'signup' ? 'RetailOS Liberia' : storeName}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1 text-emerald-700">
            {mode === 'signup' ? 'Create Your Store · Free Forever' : (currentTenant?.businessType || 'Cloud POS & Retail OS')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 font-semibold'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 font-semibold'
              }`}
            >
              Register Free Store
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-rose-800 text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="owner@yourstore.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(v => !v)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Signing In...' : 'Sign In to Store'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
                >
                  New business in Liberia? Register your store free &rarr;
                </button>
              </div>
            </form>
          ) : (
            /* SIGN UP FORM (Free Forever Plan) */
            <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Free Forever Plan ($0/mo)</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Full Store Owner access to POS, Showroom inventory, CSV template, and Store settings. No credit card required.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  value={signupBusinessName}
                  onChange={e => setSignupBusinessName(e.target.value)}
                  placeholder="e.g. Sinkor Cosmetics, Kollie Supermarket"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store Type
                  </label>
                  <select
                    value={signupBusinessType}
                    onChange={e => setSignupBusinessType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store Owner Name *
                  </label>
                  <input
                    type="text"
                    value={signupOwnerName}
                    onChange={e => setSignupOwnerName(e.target.value)}
                    placeholder="e.g. Fatu Johnson"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Owner Email (Login) *
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="owner@store.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={e => setSignupPhone(e.target.value)}
                    placeholder="0770xxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Currency Setup
                  </label>
                  <select
                    value={signupCurrencyMode}
                    onChange={e => setSignupCurrencyMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="dual">Dual Currency (USD + LRD)</option>
                    <option value="single">Single Currency (USD only)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Setting Up Your Store...' : 'Create Store & Start Free'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold"
                >
                  Already registered? Sign in to your store
                </button>
              </div>
            </form>
          )}

          {/* Catalog & Landing quick jumps */}
          <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
            {onOpenCatalog && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Browse Storefront Catalog</span>
              </button>
            )}

            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>About RetailOS Liberia / Platform Overview</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Support Hotline */}
        <div className="text-center text-xs text-slate-500 mt-6 space-y-1 font-medium">
          <p>
            Liberia Support & Training: <a href="tel:0770430269" className="font-bold text-emerald-700 hover:underline font-mono">0770430269</a>
            <span className="mx-1 text-slate-400">·</span>
            <a href="https://wa.me/231770430269" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-bold">WhatsApp</a>
          </p>
          <p className="text-slate-400 text-[11px]">
            RetailOS Liberia &copy; {new Date().getFullYear()} · Multi-Tenant Retail OS
          </p>
        </div>
      </div>
    </div>
  );
}
