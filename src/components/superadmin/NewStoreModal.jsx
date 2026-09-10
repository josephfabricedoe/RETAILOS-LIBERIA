import React, { useState } from 'react';
import { X, Building2, Store, Mail, Phone, Lock, DollarSign, Palette, Sparkles } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

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
  const [ownerPhone, setOwnerPhone] = useState('');
  const [terminalEmail, setTerminalEmail] = useState('');
  const [themeColor, setThemeColor] = useState('#0ea5e9');
  const [exchangeRate, setExchangeRate] = useState(198);
  const [subscriptionPlan, setSubscriptionPlan] = useState('growth');
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
      const newStore = await createTenant({
        businessName: businessName.trim(),
        slug: slug.trim(),
        businessType,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        terminalEmail: terminalEmail.trim() || `pos_${slug}@retailos.lr`,
        themeColor,
        exchangeRate: Number(exchangeRate) || 198,
        subscriptionPlan,
        subscriptionStatus: 'active',
        address: address.trim(),
        phone: ownerPhone.trim(),
        whatsappNumber: ownerPhone.replace(/[^0-9]/g, ''),
      });

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
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Provision New Client Store</h2>
              <p className="text-xs text-slate-400">Register and configure a Liberian retail enterprise</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Store URL Slug *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                  placeholder="sinkor-pharmacy"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Catalog URL: ?store={slug || 'store-name'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner / Manager Full Name
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner Phone / WhatsApp (Liberia)
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Owner Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@store.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Terminal Login Email (Shared Kiosk)
              </label>
              <input
                type="email"
                value={terminalEmail}
                onChange={(e) => setTerminalEmail(e.target.value)}
                placeholder={`terminal@${slug || 'store'}.com`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Initial Exchange Rate ($1 USD = L$ LRD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">L$</span>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Subscription Tier
              </label>
              <select
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="starter">Starter Plan ($25/mo or L$4,950)</option>
                <option value="growth">Growth Plan ($45/mo or L$8,910)</option>
                <option value="enterprise">Enterprise Plan ($85/mo or L$16,830)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Physical Store Address (Liberia)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Tubman Boulevard, Sinkor, Monrovia"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Brand Theme Picker */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
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
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
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
