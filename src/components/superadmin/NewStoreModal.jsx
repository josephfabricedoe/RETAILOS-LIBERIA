import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  User, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  MessageCircle,
  KeyRound,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, auth } from '../../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const STORE_TYPES = [
  'Boutique & Fashion',
  'Cosmetics & Hair Beauty',
  'Pharmacy & Health',
  'Supermarket & Grocery',
  'Provisions & Household Goods',
  'Electronics & Phones',
  'Building Materials & Hardware',
  'Restaurant & Cafe',
  'General Retail Goods',
];

export default function NewStoreModal({ onClose, onCreated, prefillLead = null }) {
  const { createTenant } = useTenant();

  // Business Details
  const [businessName, setBusinessName] = useState(prefillLead?.businessName || '');
  const [businessType, setBusinessType] = useState(prefillLead?.businessType || 'Boutique & Fashion');
  const [ownerPhone, setOwnerPhone] = useState(prefillLead?.phone || '');
  const [address, setAddress] = useState(prefillLead?.location || 'Sinkor, Monrovia, Liberia');
  const [exchangeRate, setExchangeRate] = useState(198);

  // Main Store Owner Account
  const [ownerName, setOwnerName] = useState(prefillLead?.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(() => {
    if (prefillLead?.businessName) {
      const slug = prefillLead.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return `owner@${slug || 'store'}.lr`;
    }
    return '';
  });
  const [ownerPassword, setOwnerPassword] = useState('Store2026!');

  // Custom Cashier Accounts
  const [cashiers, setCashiers] = useState([
    {
      id: 1,
      name: 'Cashier 1',
      email: '',
      password: 'Cashier123!',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSummary, setCreatedSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-generate suggested email prefixes when business name changes
  const handleNameChange = (val) => {
    setBusinessName(val);
    const cleanSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
    if (!ownerEmail || ownerEmail.endsWith('.lr')) {
      setOwnerEmail(`owner@${cleanSlug || 'store'}.lr`);
    }
    setCashiers((prev) =>
      prev.map((c, idx) => ({
        ...c,
        email: c.email && !c.email.endsWith('.lr') ? c.email : `cashier${idx + 1}@${cleanSlug || 'store'}.lr`,
      }))
    );
  };

  const handleAddCashier = () => {
    const cleanSlug = businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '') || 'store';
    const nextNum = cashiers.length + 1;
    setCashiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Cashier ${nextNum}`,
        email: `cashier${nextNum}@${cleanSlug}.lr`,
        password: `Cashier${nextNum}23!`,
      },
    ]);
  };

  const handleRemoveCashier = (id) => {
    if (cashiers.length <= 1) return;
    setCashiers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCashierChange = (id, field, value) => {
    setCashiers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Business Name is required.');
      return;
    }
    if (!ownerEmail.trim()) {
      setError('Store Owner Email is required.');
      return;
    }
    if (!ownerPassword.trim()) {
      setError('Store Owner Password is required.');
      return;
    }

    // Validate cashiers
    for (const c of cashiers) {
      if (!c.email.trim() || !c.password.trim()) {
        setError('All cashier rows must have a valid Email and Password.');
        return;
      }
    }

    setError('');
    setLoading(true);

    const cleanSlug = businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store';
    const storeId = `biz_${cleanSlug}_${Date.now().toString().slice(-4)}`;

    const fullRecord = {
      businessId: storeId,
      id: storeId,
      businessName: businessName.trim(),
      slug: cleanSlug,
      businessType,
      ownerName: ownerName.trim() || `${businessName.trim()} Owner`,
      ownerEmail: ownerEmail.trim().toLowerCase(),
      ownerPhone: ownerPhone.trim(),
      phone: ownerPhone.trim(),
      address: address.trim() || 'Monrovia, Liberia',
      primaryCurrency: 'USD',
      primarySymbol: '$',
      secondaryCurrency: 'LRD',
      secondarySymbol: 'L$',
      exchangeRate: Number(exchangeRate) || 198,
      fxRate: Number(exchangeRate) || 198,
      subscriptionPlan: 'starter',
      subscriptionStatus: 'active',
      themeColor: '#10b981',
      createdAt: new Date().toISOString(),
    };

    // Prepare Account Objects
    const ownerAccount = {
      uid: `user_${Date.now()}_owner`,
      email: ownerEmail.trim().toLowerCase(),
      password: ownerPassword.trim(),
      displayName: ownerName.trim() || `${businessName.trim()} Owner`,
      role: 'owner',
      businessId: storeId,
      businessName: businessName.trim(),
    };

    const cashierAccounts = cashiers.map((c, idx) => ({
      uid: `user_${Date.now()}_cashier_${idx + 1}`,
      email: c.email.trim().toLowerCase(),
      password: c.password.trim(),
      displayName: c.name.trim() || `Cashier ${idx + 1}`,
      role: 'cashier',
      businessId: storeId,
      businessName: businessName.trim(),
    }));

    const allNewAccounts = [ownerAccount, ...cashierAccounts];

    // 1. Save in local accounts registry for 0ms instant login
    try {
      const existingAccounts = JSON.parse(localStorage.getItem('retailos_platform_accounts') || '[]');
      const filtered = existingAccounts.filter((a) => !allNewAccounts.some((n) => n.email === a.email));
      localStorage.setItem('retailos_platform_accounts', JSON.stringify([...filtered, ...allNewAccounts]));

      // Save tenant in local tenants list
      const existingTenants = JSON.parse(localStorage.getItem('retailos_local_tenants') || '[]');
      localStorage.setItem('retailos_local_tenants', JSON.stringify([fullRecord, ...existingTenants.filter(t => (t.businessId || t.id) !== storeId)]));
    } catch (e) {
      console.warn('Local account saving notice:', e);
    }

    // 2. Persist to Firestore
    try {
      if (createTenant) {
        await createTenant(fullRecord);
      } else {
        await setDoc(doc(db, 'businesses', storeId), fullRecord);
      }

      // Save user records in Firestore users collection
      for (const acc of allNewAccounts) {
        await setDoc(doc(db, 'users', acc.uid), {
          ...acc,
          createdAt: serverTimestamp(),
        });
      }
    } catch (dbErr) {
      console.warn('Firestore cloud sync notice:', dbErr);
    }

    setLoading(false);
    setCreatedSummary({
      store: fullRecord,
      owner: ownerAccount,
      cashiers: cashierAccounts,
    });

    if (onCreated) onCreated(fullRecord);
  };

  const getWhatsAppMessage = () => {
    if (!createdSummary) return '';
    const { store, owner, cashiers } = createdSummary;
    let msg = `*Welcome to RetailOS Liberia! 🇱🇷*\n\n`;
    msg += `Your store workspace for *${store.businessName}* has been set up and is live!\n\n`;
    msg += `*Login Portal:* https://retailos-liberia-212ba.web.app\n\n`;
    msg += `*👑 STORE OWNER LOGIN (Full Access):*\n`;
    msg += `• Email: ${owner.email}\n`;
    msg += `• Password: ${owner.password}\n\n`;
    msg += `*💳 CASHIER LOGIN(S) (POS Register Access):*\n`;
    cashiers.forEach((c) => {
      msg += `• ${c.displayName}: ${c.email} / Password: ${c.password}\n`;
    });
    msg += `\nYou can sign in right now on any phone, tablet, or PC to ring sales!`;
    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = getWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {createdSummary ? 'Business Successfully Onboarded!' : 'Onboard New Business & Credentials'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {createdSummary ? 'Share login details with the merchant' : 'Create store, owner email/password, and cashier logins'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdSummary ? (
          /* Credentials Created Summary */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{createdSummary.store.businessName} is Ready!</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                The business has been provisioned. The store owner and cashiers can immediately log in with their respective credentials.
              </p>
            </div>

            {/* Owner Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span>👑</span> Store Owner Login (Full Access)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Owner Role
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                  <span className="font-mono font-bold text-slate-900">{createdSummary.owner.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Password</span>
                  <span className="font-mono font-bold text-emerald-800">{createdSummary.owner.password}</span>
                </div>
              </div>
            </div>

            {/* Cashiers Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span>💳</span> Cashier Login(s) (POS Only)
                </span>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                  Cashier Role
                </span>
              </div>
              <div className="space-y-2">
                {createdSummary.cashiers.map((c, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Name</span>
                      <span className="font-bold text-slate-900">{c.displayName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Cashier Email</span>
                      <span className="font-mono font-bold text-slate-800">{c.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Password</span>
                      <span className="font-mono font-bold text-cyan-800">{c.password}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Ready Share Card */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials for WhatsApp'}</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-6 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Store Creation Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                {error}
              </div>
            )}

            {/* Section 1: Store Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>1. Store Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Business / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Sinkor Glam Boutique"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium bg-white"
                  >
                    {STORE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Store Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="e.g. 0770430269"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Store Address / Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Tubman Blvd, Sinkor, Monrovia"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Exchange Rate (USD to LRD)
                  </label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Main Business Owner Login */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                <User className="w-4 h-4 text-purple-600" />
                <span>2. Store Owner Login (Full Store Access)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Massa Kamara"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g. owner@store.lr"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Owner Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Custom Cashier Logins */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-cyan-600" />
                  <span>3. Cashier Logins (POS Register Access Only)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCashier}
                  className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cashier</span>
                </button>
              </div>

              <div className="space-y-3">
                {cashiers.map((c, idx) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-7 gap-2 items-center">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-600 text-[10px] uppercase">Cashier Name</label>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleCashierChange(c.id, 'name', e.target.value)}
                        placeholder={`Cashier ${idx + 1}`}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:border-cyan-500 outline-none font-medium text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-600 text-[10px] uppercase">Cashier Email</label>
                      <input
                        type="email"
                        required
                        value={c.email}
                        onChange={(e) => handleCashierChange(c.id, 'email', e.target.value)}
                        placeholder="cashier@store.lr"
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:border-cyan-500 outline-none font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-600 text-[10px] uppercase">Password</label>
                      <input
                        type="text"
                        required
                        value={c.password}
                        onChange={(e) => handleCashierChange(c.id, 'password', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 focus:border-cyan-500 outline-none font-mono font-bold text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                      {cashiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCashier(c.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Cashier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Business & Accounts...</span>
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    <span>Save Business & Create Accounts</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
