import React, { useState } from 'react';
import { X, Building2, Store, Mail, Phone, Lock, DollarSign, Palette, Sparkles, Coins, PhoneCall, Key } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { WEST_AFRICAN_CURRENCIES } from '../../hooks/useCurrency';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

const PRESET_THEMES = [
  { label: 'Ocean Blue', color: '#0ea5e9' },
  { label: 'Emerald Green', color: '#10b981' },
  { label: 'Royal Purple', color: '#8b5cf6' },
  { label: 'Amber Gold', color: '#f59e0b' },
  { label: 'Rose Blush', color: '#f43f5e' },
  { label: 'Slate Dark', color: '#475569' },
];

export default function NewStoreModal({ onClose, onCreated }) {
  const { createTenant } = useTenant();
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [businessType, setBusinessType] = useState('Boutique & Fashion');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [terminalEmail, setTerminalEmail] = useState('');
  const [themeColor, setThemeColor] = useState('#0ea5e9');

  // Currency configuration
  const [currencyMode, setCurrencyMode] = useState('dual');
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');
  const [secondaryCurrency, setSecondaryCurrency] = useState('LRD');
  const [exchangeRate, setExchangeRate] = useState(198);

  const [subscriptionPlan, setSubscriptionPlan] = useState('starter'); // default to entry free forever
  const [address, setAddress] = useState('Monrovia, Liberia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val) => {
    setBusinessName(val);
    const genSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setSlug(genSlug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !slug.trim()) {
      setError('Business Name and Store Slug are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const primaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === primaryCurrency);
      const secondaryObj = WEST_AFRICAN_CURRENCIES.find((c) => c.code === secondaryCurrency);

      const newStore = await createTenant({
        businessName: businessName.trim(),
        slug: slug.trim(),
        businessType,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        terminalEmail: terminalEmail.trim() || `pos_${slug}@retailos.lr`,
        themeColor,
        currencyMode,
        primaryCurrency,
        primarySymbol: primaryObj?.symbol || '$',
        secondaryCurrency: currencyMode === 'dual' ? secondaryCurrency : '',
        secondarySymbol: currencyMode === 'dual' ? (secondaryObj?.symbol || 'L$') : '',
        exchangeRate: Number(exchangeRate) || 198,
        fxRate: Number(exchangeRate) || 198,
        subscriptionPlan,
        subscriptionStatus: 'active',
        address: address.trim(),
        phone: ownerPhone.trim(),
        whatsappNumber: ownerPhone.replace(/[^0-9]/g, ''),
      });

      // If owner email and password provided, create Firebase Auth user account
      if (ownerEmail.trim() && password.trim()) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, ownerEmail.trim(), password.trim());
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email: ownerEmail.trim(),
            displayName: ownerName.trim() || 'Store Owner',
            role: 'owner',
            businessId: newStore.businessId,
            createdAt: serverTimestamp(),
          }, { merge: true });
        } catch (authErr) {
          console.warn('Auth user registration notice:', authErr);
        }
      }

      if (onCreated) onCreated(newStore);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to provision new store.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Store Workspace</h2>
              <p className="text-[11px] text-slate-400">Setup single or dual currency POS for your business</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Support helper */}
        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-6 py-2 flex items-center justify-between text-[11px] text-emerald-300">
          <span className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            Questions or need setup assistance? Call/WhatsApp: <strong>0770430269</strong>
          </span>
          <span className="text-emerald-400 font-bold">$0 Entry Plan Available</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Business / Store Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Sinkor Care Pharmacy"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Store URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                placeholder="sinkor-pharmacy"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Retail Sector
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                {STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Currency Mode Selection */}
            <div className="sm:col-span-2 bg-slate-900/90 border border-slate-700 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Store Currency Mode
                </span>
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('single')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      currencyMode === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Single Currency
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('dual')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      currencyMode === 'dual' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Dual Currency
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Primary Currency</label>
                  <select
                    value={primaryCurrency}
                    onChange={(e) => setPrimaryCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {WEST_AFRICAN_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                    ))}
                  </select>
                </div>

                {currencyMode === 'dual' ? (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Secondary Currency</label>
                    <select
                      value={secondaryCurrency}
                      onChange={(e) => setSecondaryCurrency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      {WEST_AFRICAN_CURRENCIES.filter(c => c.code !== primaryCurrency).map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center text-slate-400 text-[11px] pt-4">
                    Store will operate exclusively in {primaryCurrency}.
                  </div>
                )}
              </div>

              {currencyMode === 'dual' && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-slate-400 text-[11px]">Exchange Rate (1 {primaryCurrency} =)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-mono font-bold text-right"
                    />
                    <span className="text-slate-300 font-bold">{secondaryCurrency}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Emmanuel Weah"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner Phone / WhatsApp
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="e.g. 0777123456"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner Email (Login Account)
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@yourstore.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Login Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Subscription Plan
              </label>
              <select
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value="starter">Entry Plan ($0/mo - Free Forever)</option>
                <option value="growth">Growth Plan ($19.99/mo or ~L$3,950)</option>
                <option value="enterprise">Enterprise Plan ($39.99/mo - Free Setup & Training)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Store Location / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sinkor 12th St, Monrovia"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Brand Theme Picker */}
            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_THEMES.map(th => (
                  <button
                    key={th.color}
                    type="button"
                    onClick={() => setThemeColor(th.color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      themeColor === th.color
                        ? 'border-white text-white bg-slate-700 shadow-md'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: th.color }} />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Provisioning...' : 'Deploy Store Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
