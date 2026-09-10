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
  { label: 'Emerald Green', color: '#10b981' },
  { label: 'Ocean Blue', color: '#0ea5e9' },
  { label: 'Royal Purple', color: '#8b5cf6' },
  { label: 'Amber Gold', color: '#f59e0b' },
  { label: 'Rose Blush', color: '#f43f5e' },
  { label: 'Deep Slate', color: '#334155' },
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
  const [themeColor, setThemeColor] = useState('#10b981');

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
            tenantId: newStore.id,
            businessName: businessName.trim(),
            createdAt: serverTimestamp(),
          });
        } catch (authErr) {
          console.warn('Auth user creation note:', authErr);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Register Store Workspace</h2>
              <p className="text-[11px] text-slate-500 font-medium">Setup single or dual currency POS for your business</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Support helper */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
          <span className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            Questions or need setup assistance? Call/WhatsApp: <strong className="font-bold">0770430269</strong>
          </span>
          <span className="text-emerald-800 font-extrabold">$0 Entry Plan Available</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Business / Store Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Sinkor Care Pharmacy"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Store URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                placeholder="sinkor-pharmacy"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Retail Sector
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              >
                {STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Currency Mode Selection */}
            <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Store Currency Mode
                </span>
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('single')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      currencyMode === 'single' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Single Currency
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('dual')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      currencyMode === 'dual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Dual Currency
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Primary Currency</label>
                  <select
                    value={primaryCurrency}
                    onChange={(e) => setPrimaryCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    {WEST_AFRICAN_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                    ))}
                  </select>
                </div>

                {currencyMode === 'dual' ? (
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Secondary Currency</label>
                    <select
                      value={secondaryCurrency}
                      onChange={(e) => setSecondaryCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    >
                      {WEST_AFRICAN_CURRENCIES.filter(c => c.code !== primaryCurrency).map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center text-slate-500 text-[11px] pt-4 font-medium">
                    Store will operate exclusively in {primaryCurrency}.
                  </div>
                )}
              </div>

              {currencyMode === 'dual' && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-slate-600 text-[11px] font-medium">Exchange Rate (1 {primaryCurrency} =)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-emerald-700 font-mono font-bold text-right"
                    />
                    <span className="text-slate-800 font-bold">{secondaryCurrency}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Emmanuel Weah"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Owner Phone / WhatsApp
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="e.g. 0777123456"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Owner Email (Login Account)
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@yourstore.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Login Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subscription Plan
              </label>
              <select
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-bold"
              >
                <option value="starter">Entry Plan ($0/mo - Free Forever)</option>
                <option value="growth">Growth Plan ($19.99/mo or ~L$3,950)</option>
                <option value="enterprise">Enterprise Plan ($39.99/mo - Free Setup & Training)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Store Location / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sinkor 12th St, Monrovia"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            {/* Brand Theme Picker */}
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_THEMES.map(th => (
                  <button
                    key={th.color}
                    type="button"
                    onClick={() => setThemeColor(th.color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                      themeColor === th.color
                        ? 'border-emerald-600 text-slate-950 bg-emerald-50'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
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
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-xl transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50"
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
