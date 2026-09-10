import React, { useState } from 'react';
import { 
  Store, 
  Phone, 
  MapPin, 
  Palette, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  Smartphone,
  Coins,
  ArrowRightLeft
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import { WEST_AFRICAN_CURRENCIES } from '../../hooks/useCurrency';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLOR_PRESETS = [
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Indigo Blue', hex: '#6366f1' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Rose Pink', hex: '#f43f5e' },
  { name: 'Violet Purple', hex: '#8b5cf6' },
  { name: 'Teal Cyan', hex: '#0d9488' }
];

export default function StoreInfoForm() {
  const { currentStore, tenantId } = useTenant();
  const { updateCurrencySettings } = useApp();

  const [formData, setFormData] = useState({
    name: currentStore?.name || '',
    category: currentStore?.category || 'General Retail',
    phone: currentStore?.phone || '',
    address: currentStore?.address || '',
    themeColor: currentStore?.themeColor || '#10b981',
    receiptFooter: currentStore?.receiptFooter || 'Thank you for your patronage! Please keep your receipt.',
    momoNumber: currentStore?.momoNumber || '',
    orangeNumber: currentStore?.orangeNumber || '',
    // Currency configuration
    currencyMode: currentStore?.currencyMode || 'dual',
    primaryCurrency: currentStore?.primaryCurrency || currentStore?.defaultCurrency || 'USD',
    primarySymbol: currentStore?.primarySymbol || '$',
    secondaryCurrency: currentStore?.secondaryCurrency || 'LRD',
    secondarySymbol: currentStore?.secondarySymbol || 'L$',
    exchangeRate: currentStore?.exchangeRate || currentStore?.fxRate || 198
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePrimaryCurrencyChange = (code) => {
    const found = WEST_AFRICAN_CURRENCIES.find((c) => c.code === code);
    setFormData((prev) => ({
      ...prev,
      primaryCurrency: code,
      primarySymbol: found ? found.symbol : '$'
    }));
  };

  const handleSecondaryCurrencyChange = (code) => {
    const found = WEST_AFRICAN_CURRENCIES.find((c) => c.code === code);
    setFormData((prev) => ({
      ...prev,
      secondaryCurrency: code,
      secondarySymbol: found ? found.symbol : 'L$',
      exchangeRate: found ? found.defaultRate : prev.exchangeRate
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    setLoading(true);
    setSuccess(false);

    try {
      const storeDocRef = doc(db, 'businesses', tenantId);
      const updates = {
        ...formData,
        exchangeRate: parseFloat(formData.exchangeRate || 198),
        fxRate: parseFloat(formData.exchangeRate || 198),
        updatedAt: Timestamp.now()
      };

      await updateDoc(storeDocRef, updates);
      if (updateCurrencySettings) {
        await updateCurrencySettings(updates);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update store settings:', err);
      alert('Error updating store settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Profile & Multi-Currency</h2>
          <p className="text-xs text-slate-500">
            Configure your business details, single/dual currency modes, and brand colors
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Name *</label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
            >
              <option value="General Retail">General Retail & Provisions</option>
              <option value="Cosmetics & Beauty">Cosmetics & Beauty Store</option>
              <option value="Boutique & Fashion">Boutique & Clothing</option>
              <option value="Pharmacy">Pharmacy & Healthcare</option>
              <option value="Supermarket">Supermarket & Grocery</option>
              <option value="Electronics">Phones & Electronics</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Phone / WhatsApp</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="0770123456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Physical Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Sinkor, Monrovia, Liberia"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Currency Configuration Section (Requirement 1: Single or Dual & Editable Currencies) */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                Store Currency Operating Mode
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose single currency or dual currency with live exchange rate
              </p>
            </div>

            {/* Single vs Dual Toggle */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, currencyMode: 'single' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  formData.currencyMode === 'single'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Currency
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, currencyMode: 'dual' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  formData.currencyMode === 'dual'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dual Currency
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Primary Currency */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Currency ({formData.currencyMode === 'dual' ? 'Base / Benchmark' : 'Active Store Currency'})
              </label>
              <select
                value={formData.primaryCurrency}
                onChange={(e) => handlePrimaryCurrencyChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
              >
                {WEST_AFRICAN_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Currency (only if dual) */}
            {formData.currencyMode === 'dual' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Secondary Currency (Local Counter Currency)
                </label>
                <select
                  value={formData.secondaryCurrency}
                  onChange={(e) => handleSecondaryCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
                >
                  {WEST_AFRICAN_CURRENCIES.filter((c) => c.code !== formData.primaryCurrency).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-white/70 rounded-xl border border-slate-200/60 flex items-center text-xs text-slate-500">
                <span>
                  All products, POS receipts, and accounting will operate strictly in{' '}
                  <strong className="text-slate-800">{formData.primaryCurrency} ({formData.primarySymbol})</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Exchange Rate Input (if dual) */}
          {formData.currencyMode === 'dual' && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800 text-xs">
                  Exchange Rate: 1 {formData.primaryCurrency} =
                </span>
                <p className="text-[11px] text-slate-500">
                  Update anytime to reflect market fluctuations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 text-right text-sm"
                />
                <span className="font-bold text-slate-700 text-xs">{formData.secondaryCurrency}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Money Details */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Mobile Money Direct Merchant Accounts
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lonestar MTN MoMo #</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                <input
                  type="text"
                  placeholder="0886000000"
                  value={formData.momoNumber}
                  onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Orange Money #</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                <input
                  type="text"
                  placeholder="0776000000"
                  value={formData.orangeNumber}
                  onChange={(e) => setFormData({ ...formData, orangeNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Brand Theme Color */}
        <div>
          <label className="block font-semibold text-slate-700 mb-2">
            Store Accent / Theme Color
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setFormData({ ...formData, themeColor: preset.hex })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                  formData.themeColor === preset.hex
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Receipt Footer */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Receipt Footer Message
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <textarea
              rows="2"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Store Profile & Currency'}
          </button>
        </div>
      </form>
    </div>
  );
}
