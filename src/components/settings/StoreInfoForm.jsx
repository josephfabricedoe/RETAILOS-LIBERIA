import React, { useState, useEffect } from 'react';
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
  ArrowRightLeft,
  Upload,
  Image as ImageIcon,
  Lock,
  Sparkles,
  Trash2,
  Globe,
  Tag
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import { WEST_AFRICAN_CURRENCIES } from '../../hooks/useCurrency';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
  const { currentStore, currentTenant, tenantId, isSuperAdmin, updateTenant, updateTenantById } = useTenant();
  const { updateCurrencySettings } = useApp();

  const storePlan = currentTenant?.subscriptionPlan || currentStore?.subscriptionPlan || 'starter';
  const canCustomBrand = isSuperAdmin || storePlan === 'growth' || storePlan === 'enterprise';
  const canHideWatermark = isSuperAdmin || storePlan === 'enterprise';

  const [formData, setFormData] = useState({
    name: currentTenant?.businessName || currentStore?.name || '',
    category: currentTenant?.businessType || currentStore?.category || 'General Retail',
    tagline: currentTenant?.tagline || currentStore?.tagline || '',
    phone: currentTenant?.phone || currentTenant?.ownerPhone || currentStore?.phone || '',
    whatsappNumber: currentTenant?.whatsappNumber || currentTenant?.phone || currentStore?.phone || '',
    address: currentTenant?.address || currentStore?.address || '',
    logoUrl: currentTenant?.logoUrl || currentStore?.logoUrl || '',
    themeColor: currentTenant?.themeColor || currentStore?.themeColor || '#10b981',
    receiptFooter: currentTenant?.receiptFooter || currentStore?.receiptFooter || 'Thank you for your patronage! Please keep your receipt.',
    momoNumber: currentTenant?.momoNumber || currentStore?.momoNumber || '',
    orangeNumber: currentTenant?.orangeNumber || currentStore?.orangeNumber || '',
    hideWatermark: currentTenant?.hideWatermark || currentStore?.hideWatermark || false,
    // Currency configuration
    currencyMode: currentTenant?.currencyMode || currentStore?.currencyMode || 'dual',
    primaryCurrency: currentTenant?.primaryCurrency || currentStore?.defaultCurrency || 'USD',
    primarySymbol: currentTenant?.primarySymbol || currentStore?.primarySymbol || '$',
    secondaryCurrency: currentTenant?.secondaryCurrency || currentStore?.secondaryCurrency || 'LRD',
    secondarySymbol: currentTenant?.secondarySymbol || currentStore?.secondarySymbol || 'L$',
    exchangeRate: currentTenant?.exchangeRate || currentStore?.exchangeRate || currentStore?.fxRate || 198
  });

  // Keep form data synchronized when active tenant or store changes or finishes loading
  useEffect(() => {
    const s = currentTenant || currentStore;
    if (!s) return;
    setFormData(prev => ({
      ...prev,
      name: s.businessName || s.name || prev.name,
      category: s.businessType || s.category || prev.category,
      tagline: s.tagline !== undefined ? s.tagline : prev.tagline,
      phone: s.phone || s.ownerPhone || prev.phone,
      whatsappNumber: s.whatsappNumber || s.phone || s.ownerPhone || prev.whatsappNumber,
      address: s.address !== undefined ? s.address : prev.address,
      logoUrl: s.logoUrl !== undefined ? s.logoUrl : prev.logoUrl,
      themeColor: s.themeColor || prev.themeColor,
      receiptFooter: s.receiptFooter !== undefined ? s.receiptFooter : prev.receiptFooter,
      momoNumber: s.momoNumber !== undefined ? s.momoNumber : prev.momoNumber,
      orangeNumber: s.orangeNumber !== undefined ? s.orangeNumber : prev.orangeNumber,
      hideWatermark: s.hideWatermark !== undefined ? s.hideWatermark : prev.hideWatermark,
      currencyMode: s.currencyMode || prev.currencyMode,
      primaryCurrency: s.primaryCurrency || s.defaultCurrency || prev.primaryCurrency,
      primarySymbol: s.primarySymbol || prev.primarySymbol,
      secondaryCurrency: s.secondaryCurrency || prev.secondaryCurrency,
      secondarySymbol: s.secondarySymbol || prev.secondarySymbol,
      exchangeRate: s.exchangeRate || s.fxRate || prev.exchangeRate,
    }));
  }, [
    currentTenant?.businessId,
    currentTenant?.id,
    currentTenant?.businessName,
    currentTenant?.name,
    currentTenant?.updatedAt,
    currentStore?.businessId,
    currentStore?.name
  ]);

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

  // Image compressor for store logo (< 40KB base64)
  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canCustomBrand) {
      alert('Store logo customization is exclusive to the Growth ($19.99/mo) and Enterprise ($39.99/mo) plans.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/png', 0.85);
        setFormData((prev) => ({ ...prev, logoUrl: compressedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeBizId = currentTenant?.businessId || currentTenant?.id || tenantId;
    if (!activeBizId) return;

    setLoading(true);
    setSuccess(false);

    try {
      const cleanName = (formData.name || formData.businessName || 'My Store').trim();
      const cleanRate = parseFloat(formData.exchangeRate || 198);

      const updates = {
        ...formData,
        name: cleanName,
        businessName: cleanName,
        category: formData.category || 'General Retail',
        businessType: formData.category || 'General Retail',
        exchangeRate: cleanRate,
        fxRate: cleanRate,
        updatedAt: new Date().toISOString()
      };

      if (updateTenantById) {
        await updateTenantById(activeBizId, updates);
      } else if (updateTenant) {
        await updateTenant(updates);
      } else {
        await setDoc(doc(db, 'businesses', activeBizId), updates, { merge: true });
      }

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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 text-slate-900">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Profile & Branding</h2>
          <p className="text-xs text-slate-500">
            Configure your business identity, store logo, currency mode, and public contact lines
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Changes Saved Live!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. Store Logo & Brand Identity (Growth / Enterprise Feature) */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Store Logo & Official Branding
              </span>
            </div>
            {!canCustomBrand ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                <Lock className="w-3 h-3 text-amber-700" />
                Growth &amp; Enterprise
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Unlocked
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Your store logo appears on the POS register, thermal receipts, and the public online storefront catalog.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
            {/* Logo Preview */}
            <div className="w-20 h-20 rounded-2xl border-2 border-slate-300 bg-white flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Store Logo Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-0.5 opacity-50" />
                  <span className="text-[9px] font-bold uppercase">No Logo</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    canCustomBrand
                      ? 'bg-slate-900 hover:bg-black text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File (PNG / JPG)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={!canCustomBrand}
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>

                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* URL Alternative */}
              <div className="pt-1">
                <input
                  type="url"
                  placeholder="Or paste an image web link (https://...)"
                  disabled={!canCustomBrand}
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono text-[11px] disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Basic Business Details */}
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
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Tagline / Slogan</label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Liberia's Premier Cosmetics & Fragrance Store"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 bg-white"
            >
              <option value="General Retail">General Retail &amp; Provisions</option>
              <option value="Cosmetics & Beauty">Cosmetics &amp; Beauty Store</option>
              <option value="Boutique & Fashion">Boutique &amp; Clothing</option>
              <option value="Pharmacy">Pharmacy &amp; Healthcare</option>
              <option value="Supermarket">Supermarket &amp; Grocery</option>
              <option value="Electronics">Phones &amp; Electronics</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Physical Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Broad & Randall St, Monrovia"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Phone Numbers: Owner Private Phone vs Storefront WhatsApp Order Desk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Storefront Customer WhatsApp Line
              <span className="text-slate-400 font-normal ml-1">(Receives online orders)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
              <input
                type="text"
                placeholder="e.g. 0770123456"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Store Owner Contact Phone
              <span className="text-slate-400 font-normal ml-1">(Store management)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 0770123456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Currency Configuration Section */}
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
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Watermark Removal (Enterprise Feature) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">Remove &ldquo;Powered by RetailOS&rdquo; Watermark</span>
              {!canHideWatermark && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  Enterprise Only
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Remove the RetailOS platform badge from your online storefront footer for a 100% white-label experience.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              disabled={!canHideWatermark}
              checked={formData.hideWatermark}
              onChange={(e) => setFormData({ ...formData, hideWatermark: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"></div>
          </label>
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
            {loading ? 'Saving Changes...' : 'Save Store Profile & Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}
