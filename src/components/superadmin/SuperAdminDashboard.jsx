import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Plus, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  TrendingUp, 
  MessageCircle, 
  LogIn, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import NewStoreModal from './NewStoreModal';

import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function SuperAdminDashboard({ onEnterStore }) {
  const { allTenants, currentTenant, switchTenant, updateTenant, updateTenantById, createTenant } = useTenant();
  const { setActiveModule } = useApp();
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'inquiries'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Incoming Leads from public website
  const [leads, setLeads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Subscribe to live leads from Firestore
  React.useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'leads'), (snap) => {
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (fetched.length > 0) {
          setLeads(fetched);
          try {
            localStorage.setItem('retailos_local_leads', JSON.stringify(fetched));
          } catch (e) {}
        }
      });
      return unsub;
    } catch (e) {
      console.warn('Leads snapshot notice:', e);
    }
  }, []);

  const pendingLeadsCount = leads.filter((l) => l.status !== 'onboarded').length;

  // Platform Aggregate KPIs
  const totalStores = allTenants.length;
  const activeStores = allTenants.filter(t => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trial').length;
  
  // Calculate estimated Monthly Recurring Revenue (MRR) based on tiers
  // Starter: $0 (Free Forever), Growth: $19.99, Enterprise: $39.99
  const mrrUSD = allTenants.reduce((sum, t) => {
    if (t.subscriptionStatus === 'suspended') return sum;
    if (t.subscriptionPlan === 'enterprise') return sum + 39.99;
    if (t.subscriptionPlan === 'growth') return sum + 19.99;
    return sum + 0; // Entry plan is $0 Free Forever
  }, 0);

  const avgRate = allTenants.length > 0 ? (allTenants.reduce((s, t) => s + (Number(t.exchangeRate) || 198), 0) / allTenants.length) : 198;
  const mrrLRD = Math.round(mrrUSD * avgRate);

  const filteredTenants = allTenants.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchQuery = (t.businessName || '').toLowerCase().includes(q) || 
                       (t.ownerName || '').toLowerCase().includes(q) ||
                       (t.slug || '').toLowerCase().includes(q) ||
                       (t.businessType || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || t.subscriptionStatus === filterStatus;
    return matchQuery && matchStatus;
  });

  const handleEnterStore = (tenant) => {
    switchTenant(tenant.businessId || tenant.id);
    setActiveModule('pos');
    if (onEnterStore) onEnterStore();
  };

  const handleToggleStatus = async (tenant) => {
    const newStatus = tenant.subscriptionStatus === 'active' ? 'suspended' : 'active';
    const bizId = tenant.businessId || tenant.id;
    await updateTenantById(bizId, { subscriptionStatus: newStatus });
  };

  const handleUpdatePlan = async (tenant, newPlan) => {
    const bizId = tenant.businessId || tenant.id;
    await updateTenantById(bizId, { subscriptionPlan: newPlan });
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  const handleCopyDirectLoginLink = (userEmail = '') => {
    const origin = window.location.origin;
    const url = userEmail 
      ? `${origin}/app?email=${encodeURIComponent(userEmail)}`
      : `${origin}/app`;
    navigator.clipboard.writeText(url);
    setCopiedLink(userEmail || 'direct');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyAdminLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/admin`;
    navigator.clipboard.writeText(url);
    setCopiedAdminLink(true);
    setTimeout(() => setCopiedAdminLink(false), 2500);
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-850 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ⚡ PLATFORM SUPER-ADMIN
            </span>
            <span className="text-xs text-slate-400">Master Control Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            RetailOS Liberia
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Multi-Tenant SaaS
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Platform Management: <span className="text-white font-medium">Joseph Doe & RetailOS Team</span> · Empowering retail across Liberia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* DEDICATED STORE APP LINK BUTTON */}
          <button
            onClick={() => handleCopyDirectLoginLink()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 transition-all shadow-sm"
            title="Copy dedicated store & cashier app link (/app)"
          >
            {copiedLink === 'direct' ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-emerald-400" />}
            <span>{copiedLink === 'direct' ? 'Copied /app!' : 'Copy Store App Link (/app)'}</span>
          </button>

          {/* DEDICATED SUPER ADMIN LINK BUTTON */}
          <button
            onClick={handleCopyAdminLink}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 transition-all shadow-sm"
            title="Copy super admin portal link (/admin)"
          >
            {copiedAdminLink ? <Check className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
            <span>{copiedAdminLink ? 'Copied /admin!' : 'Copy Admin Link (/admin)'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedLead(null);
              setShowNewStoreModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Store</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Client Stores</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalStores}</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> {activeStores} Operational / Active
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Platform MRR (USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">${mrrUSD.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Monthly Subscription Revenue</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Platform MRR (LRD)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">L${mrrLRD.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Converted @ ~{Math.round(avgRate)} LRD/USD</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Workspace</span>
            <Store className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white truncate">
            {currentTenant?.businessName || 'None Selected'}
          </div>
          <p className="text-xs text-purple-300 mt-1 truncate">
            Slug: {currentTenant?.slug}
          </p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'stores'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Active Client Stores ({totalStores})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
            activeTab === 'inquiries'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Web Registrations & Leads ({leads.length})</span>
          {pendingLeadsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingLeadsCount} new
            </span>
          )}
        </button>
      </div>

      {/* Tab Content: Inquiries / Leads */}
      {activeTab === 'inquiries' ? (
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white">Merchant Inquiries from Webpage</h2>
              <p className="text-xs text-slate-400">Stores that submitted "Register Your Business" on the website</p>
            </div>
            <button
              onClick={() => {
                setSelectedLead(null);
                setShowNewStoreModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Manual Business Setup</span>
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <MessageCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No merchant inquiries received yet.</p>
              <p className="text-xs text-slate-500">When visitors click "Register Your Business" on the website, their details appear here in real-time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.map((lead) => {
                const isOnboarded = lead.status === 'onboarded';
                const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

                return (
                  <div 
                    key={lead.id} 
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isOnboarded 
                        ? 'bg-slate-850/60 border-slate-700 opacity-75' 
                        : 'bg-slate-750/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-white text-base block">{lead.businessName}</span>
                        <span className="text-xs text-emerald-400 font-semibold">{lead.businessType || 'Retail'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isOnboarded ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {isOnboarded ? '✓ Onboarded' : '★ New Lead'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Owner / Contact</span>
                        <span className="font-semibold text-white">{lead.ownerName || 'Merchant'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Phone / WhatsApp</span>
                        <span className="font-mono font-bold text-emerald-300">{lead.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block">Location</span>
                        <span className="text-slate-300">{lead.location || 'Monrovia'}</span>
                      </div>
                      {lead.notes && (
                        <div className="col-span-2 p-2 bg-slate-800 rounded-xl text-[11px] text-slate-400 italic">
                          "{lead.notes}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2 border-t border-slate-700/60">
                      {!isOnboarded && (
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowNewStoreModal(true);
                          }}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Onboard & Create Logins</span>
                        </button>
                      )}
                      <a
                        href={`https://wa.me/231${cleanPhone.slice(-9)}?text=Hello%20${encodeURIComponent(lead.ownerName || lead.businessName)}%2C%20this%20is%20Joseph%20Doe%20from%20RetailOS%20Liberia.%20I%20received%20your%20store%20registration.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-slate-700 hover:bg-slate-650 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      /* Stores Directory Section */
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Client Retail Businesses</h2>
            <p className="text-xs text-slate-400">Manage client workspaces, subscriptions, and live tenant assistance</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business, owner, slug..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Free Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-850/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Business & Sector</th>
                <th className="py-3.5 px-4">Store Slug / Public URL</th>
                <th className="py-3.5 px-4">Owner & Contact</th>
                <th className="py-3.5 px-4">Plan & Status</th>
                <th className="py-3.5 px-4">Rate (USD/LRD)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No businesses matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrent = (t.businessId || t.id) === (currentTenant?.businessId || currentTenant?.id);
                  const waNumber = (t.whatsappNumber || t.ownerPhone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr key={t.businessId || t.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                            style={{ backgroundColor: t.themeColor || '#0ea5e9' }}
                          >
                            {(t.businessName || 'S')[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{t.businessName}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{t.businessType || 'General Retail'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] text-cyan-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            ?store={t.slug}
                          </code>
                          <a
                            href={`/?store=${t.slug}#catalog`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Open Public WhatsApp Catalog"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-slate-200">{t.ownerName || 'Store Manager'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{t.ownerPhone || t.phone || 'No phone'}</span>
                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <select
                            value={t.subscriptionPlan || 'starter'}
                            onChange={(e) => handleUpdatePlan(t, e.target.value)}
                            className="bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-[11px] font-bold text-cyan-300 focus:outline-none cursor-pointer uppercase transition-colors"
                            title="Super-Admin: Change subscription plan"
                          >
                            <option value="starter">Starter ($0 Free)</option>
                            <option value="growth">Growth ($19.99/mo)</option>
                            <option value="enterprise">Enterprise ($39.99/mo)</option>
                          </select>
                          <div>
                            {t.subscriptionStatus === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                              </span>
                            ) : t.subscriptionStatus === 'trial' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                                <Clock className="w-3 h-3" /> Free Trial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-semibold">
                                <AlertCircle className="w-3 h-3" /> Suspended
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        L$ {t.exchangeRate || 198}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyDirectLoginLink(t.ownerEmail)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                            title={`Copy direct login link for ${t.ownerEmail || t.businessName}`}
                          >
                            {copiedLink === t.ownerEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />}
                            <span>{copiedLink === t.ownerEmail ? 'Copied!' : 'Login Link'}</span>
                          </button>

                          <button
                            onClick={() => handleEnterStore(t)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                            title="Enter this store workspace to manage stock, sales, or settings"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Enter Workspace</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`p-1.5 rounded-xl border text-xs transition-colors ${
                              t.subscriptionStatus === 'active'
                                ? 'bg-red-900/20 text-red-300 border-red-700/40 hover:bg-red-900/40'
                                : 'bg-emerald-900/20 text-emerald-300 border-emerald-700/40 hover:bg-emerald-900/40'
                            }`}
                            title={t.subscriptionStatus === 'active' ? 'Suspend Store' : 'Activate Store'}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showNewStoreModal && (
        <NewStoreModal
          prefillLead={selectedLead}
          onClose={() => {
            setShowNewStoreModal(false);
            setSelectedLead(null);
          }}
          onCreated={(store) => {
            if (selectedLead?.id) {
              setLeads((prev) =>
                prev.map((l) => (l.id === selectedLead.id ? { ...l, status: 'onboarded' } : l))
              );
              try {
                updateDoc(doc(db, 'leads', selectedLead.id), { status: 'onboarded' }).catch(() => {});
              } catch (e) {}
            }
          }}
        />
      )}
    </div>
  );
}
