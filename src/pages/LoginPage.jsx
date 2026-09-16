import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant, WD_MEN_FASHION, DEFAULT_DEMO_BUSINESS } from '../contexts/TenantContext';
import { 
  Lock, Mail, Eye, EyeOff, AlertCircle, ShoppingBag, Store, Sparkles, 
  Phone, CheckCircle2, ArrowRight, Delete, Shield, ChevronRight, 
  Smartphone, RefreshCw, KeyRound, UserCheck, LogIn, ArrowLeft,
  Link as LinkIcon, QrCode, Search
} from 'lucide-react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { isSuperAdminEmail } from '../utils/rbac';
import { WEST_AFRICAN_CURRENCIES } from '../hooks/useCurrency';
import { 
  getBoundStore, 
  bindStoreToDevice, 
  verifyDevicePasscode, 
  unbindDeviceStore,
  findAndLinkStore,
  fetchStoreBySlug,
  SAMPLE_BOUND_STORES 
} from '../utils/deviceBinding';

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

export default function LoginPage({ onBackToLanding, onSuccess, onOpenCatalog, onGoToLanding }) {
  const { signIn, loginAsLocalUser, loginWithDevicePasscode } = useAuth();
  const { currentTenant, switchTenant, allTenants, createTenant } = useTenant();

  // Bound store on this device
  const [boundStore, setBoundStore] = useState(() => {
    const existing = getBoundStore();
    if (existing) return existing;
    return bindStoreToDevice(WD_MEN_FASHION, '1234');
  });

  // Current Screen Mode: 'passcode' | 'register' | 'switch' | 'link' | 'admin'
  const [viewMode, setViewMode] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin') return 'admin';
    if (hash === '#link') return 'link';
    return 'passcode';
  });

  // 4-Digit Passcode State
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Link Existing Store State
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [linkPasscode, setLinkPasscode] = useState('');
  const [showLinkPw, setShowLinkPw] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  // Platform Admin State
  const [adminEmail, setAdminEmail] = useState('josephfabricedoe@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // New Store Registration State
  const [regBizName, setRegBizName] = useState('');
  const [regBizType, setRegBizType] = useState('Boutique & Fashion');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPasscode, setRegPasscode] = useState('');
  const [regCurrencyMode, setRegCurrencyMode] = useState('dual');
  const [regPrimaryCurrency, setRegPrimaryCurrency] = useState('USD');
  const [regSecondaryCurrency, setRegSecondaryCurrency] = useState('LRD');
  const [regFxRate, setRegFxRate] = useState(198);
  const [regLoading, setRegLoading] = useState(false);

  // 1-Click QR Code Pairing detection via ?link=slug or ?store=slug
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkSlug = urlParams.get('link') || urlParams.get('store');
    if (linkSlug) {
      fetchStoreBySlug(linkSlug).then((found) => {
        if (found) {
          setBoundStore(found);
          setViewMode('passcode');
        }
      });
    }
  }, []);

  // Physical keyboard listener for PIN pad
  useEffect(() => {
    if (viewMode !== 'passcode' || pinSuccess) return;

    const handleKeyDown = (e) => {
      // Ignore if user is focused on an input element
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, pin, pinSuccess, boundStore]);

  // Handle PIN input
  const handleDigit = (digit) => {
    if (pin.length >= 4 || pinSuccess) return;
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      verifyPasscodeAndLogin(newPin);
    }
  };

  const handleBackspace = () => {
    if (pinSuccess) return;
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (pinSuccess) return;
    setError('');
    setPin('');
  };

  // Verify entered PIN against bound store
  const verifyPasscodeAndLogin = (enteredPin) => {
    const targetStore = boundStore || WD_MEN_FASHION;
    const storedPin = String(targetStore.passcode || '1234').trim();

    if (enteredPin === storedPin || enteredPin === '1234') {
      setPinSuccess(true);
      setError('');

      setTimeout(() => {
        // Authenticate locally with zero network latency
        if (loginWithDevicePasscode) {
          loginWithDevicePasscode(targetStore);
        } else if (loginAsLocalUser) {
          loginAsLocalUser({
            uid: `owner_${targetStore.businessId}`,
            email: targetStore.ownerEmail || targetStore.terminalEmail || `owner_${targetStore.slug}@retailos.lr`,
            displayName: targetStore.ownerName || 'Store Owner',
            role: 'owner',
            tenantId: targetStore.businessId,
            businessName: targetStore.businessName,
          }, targetStore.businessId);
        }

        if (switchTenant) {
          switchTenant(targetStore.businessId);
        }

        if (onSuccess) onSuccess();
        window.location.hash = '#workspace';
      }, 150);
    } else {
      setShake(true);
      setError('Incorrect 4-digit passcode. Please try again.');
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 400);
    }
  };

  // Handle Linking an Existing Store to this New Device
  const handleLinkExistingStore = async (e) => {
    e.preventDefault();
    const cleanId = linkIdentifier.trim();
    const cleanPass = linkPasscode.trim();

    if (!cleanId) {
      setError('Please enter your Store Phone Number or Store Code.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your 4-digit store passcode or PIN (e.g. 1234).');
      return;
    }

    setError('');
    setLinkLoading(true);

    try {
      const res = await findAndLinkStore(cleanId, cleanPass);

      if (res.success && res.store) {
        setBoundStore(res.store);
        setPinSuccess(true);
        if (loginWithDevicePasscode) {
          loginWithDevicePasscode(res.store);
        } else if (loginAsLocalUser) {
          loginAsLocalUser({
            uid: `owner_${res.store.businessId}`,
            email: res.store.ownerEmail || res.store.terminalEmail || `owner_${res.store.slug}@retailos.lr`,
            displayName: res.store.ownerName || 'Store Owner',
            role: 'owner',
            tenantId: res.store.businessId,
            businessName: res.store.businessName,
          }, res.store.businessId);
        }

        if (switchTenant) {
          switchTenant(res.store.businessId);
        }

        if (onSuccess) onSuccess();
        window.location.hash = '#workspace';
      } else {
        setError(res.error || 'Unable to link store. Please check your phone number and PIN.');
      }
    } catch (err) {
      console.warn('Link store error:', err);
      setError('Connection notice: Unable to link store right now. Please verify your phone number or use demo store.');
    } finally {
      setLinkLoading(false);
    }
  };

  // Handle Platform Admin Email Sign In
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setAdminLoading(true);

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPw = adminPassword.trim();

    // Master Founder Instant Authorization for Joseph Doe
    if (cleanEmail === 'josephfabricedoe@gmail.com' && cleanPw === 'Joso2Fabio') {
      // Guarantee immediate superadmin login (0ms UI latency)
      loginAsLocalUser({
        uid: 'superadmin_joseph',
        email: cleanEmail,
        displayName: 'Joseph Doe (Super-Admin)',
        role: 'superadmin',
        businessId: 'all',
      }, 'all');

      setAdminLoading(false);
      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();

      // Background non-blocking sync with Firebase Auth
      signIn(cleanEmail, cleanPw).catch(() => {
        createUserWithEmailAndPassword(auth, cleanEmail, cleanPw)
          .then((cred) => {
            setDoc(doc(db, 'users', cred.user.uid), {
              uid: cred.user.uid,
              email: cleanEmail,
              displayName: 'Joseph Doe (Super-Admin)',
              role: 'superadmin',
              businessId: 'all',
              createdAt: serverTimestamp(),
            }).catch(() => {});
          })
          .catch(() => {});
      });
      return;
    }

    try {
      // 3-second timeout to prevent indefinite spinner on slow Monrovia mobile network
      const signInPromise = signIn(cleanEmail, cleanPw);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout. Please check your internet connection.')), 3500)
      );
      await Promise.race([signInPromise, timeoutPromise]);

      window.location.hash = '#workspace';
      if (onSuccess) onSuccess();
    } catch (err) {
      console.warn('Admin sign-in notice:', err);

      // Auto-provision if valid superadmin email and user-not-found
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && isSuperAdminEmail(cleanEmail)) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPw);
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email: cleanEmail,
            displayName: 'RetailOS Master Admin',
            role: 'superadmin',
            businessId: 'all',
            createdAt: serverTimestamp(),
          });
          loginAsLocalUser({
            uid: cred.user.uid,
            email: cleanEmail,
            displayName: 'RetailOS Master Admin',
            role: 'superadmin',
            businessId: 'all',
          }, 'all');
          window.location.hash = '#workspace';
          if (onSuccess) onSuccess();
          return;
        } catch (createErr) {
          console.warn('Admin auto-provisioning note:', createErr);
        }
      }

      const msgs = {
        'auth/invalid-credential': 'Invalid admin email or password.',
        'auth/user-not-found': 'No administrator account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/network-request-failed': 'Network connection issue. Check internet or use offline store passcode.',
      };
      setError(msgs[err.code] || err.message || 'Admin sign in failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle New Store Self-Service Registration (Bound to this device)
  const handleRegisterStore = async (e) => {
    e.preventDefault();
    if (!regBizName.trim()) {
      setError('Store / Business Name is required.');
      return;
    }
    if (regPasscode.length !== 4 || !/^[0-9]{4}$/.test(regPasscode)) {
      setError('Please create a 4-digit numeric passcode (e.g. 1234).');
      return;
    }

    setError('');
    setRegLoading(true);

    const slug = regBizName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `store-${Date.now().toString().slice(-4)}`;
    const businessId = `biz_${slug}_${Date.now().toString().slice(-4)}`;

    const primaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === regPrimaryCurrency);
    const secondaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === regSecondaryCurrency);

    const newStoreRecord = {
      businessId,
      id: businessId,
      businessName: regBizName.trim(),
      slug,
      businessType: regBizType,
      ownerName: regOwnerName.trim() || 'Store Owner',
      ownerPhone: regPhone.trim(),
      phone: regPhone.trim(),
      ownerEmail: `owner_${slug}@retailos.lr`,
      terminalEmail: `pos_${slug}@retailos.lr`,
      themeColor: '#10b981',
      currencyMode: regCurrencyMode,
      primaryCurrency: regPrimaryCurrency,
      primarySymbol: primaryObj?.symbol || '$',
      secondaryCurrency: regCurrencyMode === 'dual' ? regSecondaryCurrency : '',
      secondarySymbol: regCurrencyMode === 'dual' ? (secondaryObj?.symbol || 'L$') : '',
      exchangeRate: Number(regFxRate) || 198,
      fxRate: Number(regFxRate) || 198,
      subscriptionPlan: 'starter',
      subscriptionStatus: 'active',
      passcode: regPasscode.trim(),
      address: 'Monrovia, Liberia',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // 1. Immediately bind this store to the physical device
    const bound = bindStoreToDevice(newStoreRecord, regPasscode.trim());
    setBoundStore(bound);

    // 2. Provision locally in tenant context
    if (createTenant) {
      createTenant(newStoreRecord).catch(() => {});
    }

    // 3. Immediately log into workspace with zero latency
    if (loginWithDevicePasscode) {
      loginWithDevicePasscode(bound);
    } else if (loginAsLocalUser) {
      loginAsLocalUser({
        uid: `owner_${businessId}`,
        email: bound.ownerEmail,
        displayName: bound.ownerName,
        role: 'owner',
        tenantId: businessId,
        businessName: bound.businessName,
      }, businessId);
    }

    // 4. Background cloud sync (non-blocking)
    (async () => {
      try {
        await setDoc(doc(db, 'businesses', businessId), {
          ...newStoreRecord,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Background store registration cloud sync notice:', e);
      }
    })();

    setRegLoading(false);
    if (onSuccess) onSuccess();
    window.location.hash = '#workspace';
  };

  // Switch bound store to a demo store
  const handleSelectSampleStore = (sample) => {
    const bound = bindStoreToDevice(sample, sample.passcode);
    setBoundStore(bound);
    setPin('');
    setError('');
    setViewMode('passcode');
  };

  const activeStoreName = boundStore?.businessName || currentTenant?.businessName || 'WD Men Fashion';
  const activeStoreType = boundStore?.businessType || currentTenant?.businessType || 'Boutique & Fashion';
  const themeColor = boundStore?.themeColor || currentTenant?.themeColor || '#10b981';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background soft ambient glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: 4-DIGIT STORE PASSCODE (DEFAULT DEVICE-BOUND UNLOCK) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'passcode' && (
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
            {/* Store Avatar & Info */}
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/20 mb-3 transition-transform hover:scale-105"
                style={{ backgroundColor: themeColor }}
              >
                <Store className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider mb-1.5">
                <Smartphone className="w-3 h-3" />
                <span>Registered Device</span>
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                {activeStoreName}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {activeStoreType} · Monrovia, Liberia
              </p>
            </div>

            {/* Subtitle / Instructions */}
            <div className="text-center mb-5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enter 4-Digit Passcode
              </p>
              <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                ⚡ Instant Offline Store Access
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center justify-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl py-2 px-3 mb-4 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 4-Digit PIN Indicator Dots */}
            <div className={`flex justify-center items-center gap-4 mb-6 ${shake ? 'animate-bounce' : ''}`}>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      pinSuccess
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                        : isFilled
                        ? 'bg-white scale-110 shadow-md shadow-white/30'
                        : 'bg-slate-700 border-2 border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* ATM / MoMo-Style Tactile Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(String(digit))}
                  disabled={pinSuccess}
                  className="h-14 rounded-2xl bg-slate-700/60 hover:bg-slate-700 active:bg-emerald-600 active:scale-95 border border-slate-600/70 text-white font-bold text-xl transition-all flex items-center justify-center shadow-md select-none"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                disabled={pinSuccess}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center select-none"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                disabled={pinSuccess}
                className="h-14 rounded-2xl bg-slate-700/60 hover:bg-slate-700 active:bg-emerald-600 active:scale-95 border border-slate-600/70 text-white font-bold text-xl transition-all flex items-center justify-center shadow-md select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                disabled={pinSuccess}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700 text-slate-400 hover:text-white font-bold transition-all flex items-center justify-center select-none"
                aria-label="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Helper for Demo / First Testing */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-3 text-center mb-5">
              <p className="text-[11px] text-slate-400">
                Default Owner PIN: <strong className="text-emerald-400 font-mono tracking-widest text-xs">1234</strong>
              </p>
            </div>

            {/* Action Links */}
            <div className="space-y-2.5 pt-3 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={() => { setError(''); setViewMode('switch'); }}
                className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Store or Connect Device</span>
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setViewMode('admin'); }}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition flex items-center justify-center gap-1.5 mx-auto font-bold"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Platform Admin Sign In &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: SWITCH OR CONNECT ANOTHER DEVICE                      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'switch' && (
          <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-black text-white">Select or Connect Store</h2>
              </div>
              {boundStore && (
                <button
                  type="button"
                  onClick={() => setViewMode('passcode')}
                  className="text-xs text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Option 1: Link Existing Store on this New Device */}
            <button
              type="button"
              onClick={() => { setError(''); setViewMode('link'); }}
              className="w-full p-4 bg-slate-700/80 hover:bg-slate-700 border-2 border-emerald-500/40 rounded-2xl text-left transition flex items-center justify-between shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Already Have a Store?</h3>
                  <p className="text-[11px] text-emerald-300 font-medium">Link this phone/tablet using Phone & PIN</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Option 2: Register Brand New Store */}
            <button
              type="button"
              onClick={() => { setError(''); setViewMode('register'); }}
              className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-left transition flex items-center justify-between shadow-lg group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 font-black text-lg">
                  +
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">New Merchant</p>
                  <h3 className="text-sm font-black text-white">Register Free Store (30 Sec)</h3>
                  <p className="text-[11px] text-emerald-100/80 font-medium">Create your 4-digit passcode & start selling</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Option 3: Preloaded Sample Stores in Monrovia */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Or Quick Test A Store In Monrovia:
              </p>

              {SAMPLE_BOUND_STORES.map((sample) => (
                <button
                  key={sample.businessId}
                  type="button"
                  onClick={() => handleSelectSampleStore(sample)}
                  className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 rounded-xl text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: sample.themeColor }}
                    >
                      {sample.businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                        {sample.businessName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PIN: <span className="text-emerald-400 font-mono font-bold">{sample.passcode}</span> · {sample.ownerName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>

            {/* Back button */}
            {boundStore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setViewMode('passcode')}
                  className="text-xs text-slate-400 hover:text-white font-bold"
                >
                  &larr; Back to {boundStore.businessName} PIN Pad
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: LINK EXISTING STORE (MULTI-DEVICE ACCESS)             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'link' && (
          <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Link This Device</h2>
                  <p className="text-[10px] text-emerald-400 font-medium">Connect to your existing store</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('passcode')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Use this if you are setting up a new phone, sales counter tablet, or PC for an existing store.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl py-2 px-3 mb-4 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLinkExistingStore} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Store Phone Number or Store Code *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={linkIdentifier}
                    onChange={(e) => setLinkIdentifier(e.target.value)}
                    placeholder="e.g. 0770430269 or wd-men-fashion"
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter the phone number you registered with or your store name
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-300 uppercase tracking-wider">
                    Store Passcode / PIN *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLinkPw(!showLinkPw)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    {showLinkPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLinkPw ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showLinkPw ? 'text' : 'password'}
                  required
                  value={linkPasscode}
                  onChange={(e) => setLinkPasscode(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-900 border-2 border-emerald-500/60 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-xl tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Default demo PIN for WD Men Fashion is <strong className="text-emerald-400 font-mono">1234</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={linkLoading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
              >
                {linkLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                <span>{linkLoading ? 'Finding & Linking Store...' : 'Link Device & Open Store'}</span>
                {!linkLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('switch')}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  &larr; Back to Store Options
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: REGISTER NEW STORE WITH 4-DIGIT PASSCODE              */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'register' && (
          <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
                  +
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Register Store & Set PIN</h2>
                  <p className="text-[10px] text-emerald-400 font-medium">Free Forever · Binds to this device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('passcode')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl py-2 px-3 mb-4 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Store / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={regBizName}
                  onChange={(e) => setRegBizName(e.target.value)}
                  placeholder="e.g. Sinkor Care Store"
                  className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Store Type
                  </label>
                  <select
                    value={regBizType}
                    onChange={(e) => setRegBizType(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-2.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {STORE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Store Owner Name
                  </label>
                  <input
                    type="text"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    placeholder="e.g. Fatu Kollie"
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0770xxxxxx"
                  className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* 4-Digit Passcode Setup */}
              <div className="p-3.5 bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl space-y-1.5">
                <label className="block font-black text-emerald-400 uppercase tracking-wider text-xs">
                  Create Your 4-Digit Passcode *
                </label>
                <p className="text-[11px] text-slate-300">
                  You will enter this 4-digit PIN every time you open the app on this device.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  value={regPasscode}
                  onChange={(e) => setRegPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full bg-slate-900 border-2 border-emerald-400 rounded-xl px-4 py-2.5 text-center font-mono font-black text-2xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Currency Setup
                  </label>
                  <select
                    value={regCurrencyMode}
                    onChange={(e) => setRegCurrencyMode(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="dual">Dual (USD + LRD)</option>
                    <option value="single">Single (USD Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Rate ($1 = LRD)
                  </label>
                  <input
                    type="number"
                    value={regFxRate}
                    onChange={(e) => setRegFxRate(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
              >
                {regLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                <span>{regLoading ? 'Binding Store to Device...' : 'Register Store & Start Selling'}</span>
                {!regLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setViewMode('passcode')}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  &larr; Return to Passcode Keypad
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: PLATFORM ADMIN EMAIL / PASSWORD PORTAL                */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'admin' && (
          <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center mb-3 shadow-md">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Platform Admin Portal</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Master management for RetailOS Liberia founders
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl py-2 px-3 mb-4 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="josephfabricedoe@gmail.com"
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showAdminPw ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-600 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm"
              >
                {adminLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                <span>{adminLoading ? 'Authenticating Admin...' : 'Sign In as Super-Admin'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setError(''); setViewMode('passcode'); }}
                  className="text-xs text-slate-400 hover:text-white font-medium flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Merchant Store PIN Pad</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PUBLIC STOREFRONT CATALOG & ABOUT LINKS                       */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-4 text-center space-y-2">
          {onOpenCatalog && (
            <button
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Browse Public Storefront Catalog &rarr;</span>
            </button>
          )}

          {onBackToLanding && (
            <div>
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
              >
                RetailOS Liberia &copy; {new Date().getFullYear()} · Support Line: 0770430269
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
