import React, { useState, useEffect } from 'react';
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
  Check,
  Trash2,
  AlertTriangle,
  Database,
  Activity,
  Download,
  Wrench,
  X
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import NewStoreModal from './NewStoreModal';

import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function SuperAdminDashboard({ onEnterStore }) {
  const { allTenants, currentTenant, switchTenant, updateTenantById, deleteTenant } = useTenant();
  const { setActiveModule, adminTab, setAdminTab } = useApp();

  const activeTab = adminTab || 'stores';
  const setActiveTab = setAdminTab || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Deletion State
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Copy State
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  // Incoming Leads from public website
  const [leads, setLeads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Subscribe to live leads from Firestore with offline cache fallback
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(db, 'leads'),
        (snap) => {
          const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          
          // Merge with any local cache leads so none are lost
          let merged = [...fetched];
          try {
            const local = JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
            for (const item of local) {
              if (!merged.some(m => m.id === item.id || (m.businessName === item.businessName && m.phone === item.phone))) {
                merged.push(item);
              }
            }
          } catch (e) {}

          // Sort descending by creation date (newest first)
          merged.sort((a, b) => {
            const dateA = new Date(a.createdAt || (a.serverCreatedAt?.seconds ? a.serverCreatedAt.seconds * 1000 : 0));
            const dateB = new Date(b.createdAt || (b.serverCreatedAt?.seconds ? b.serverCreatedAt.seconds * 1000 : 0));
            return dateB - dateA;
          });

          setLeads(merged);
          try {
            localStorage.setItem('retailos_local_leads', JSON.stringify(merged));
          } catch (e) {}
        },
        (err) => {
          console.warn('Leads live subscription notice:', err);
        }
      );
    } catch (e) {
      console.warn('Leads snapshot setup warning:', e);
    }
    return () => unsub();
  }, []);

  const pendingLeadsCount = leads.filter((l) => l.status !== 'onboarded').length;

  // Platform Aggregate KPIs
  const totalStores = allTenants.length;
  const activeStores = allTenants.filter(t => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trial').length;
  
  // Platform MRR calculation
  const PLAN_PRICES = {
    starter: 0,
    growth: 19.99,
    enterprise: 39.99
  };

  const mrrUSD = allTenants.reduce((sum, t) => {
    if (t.subscriptionStatus === 'suspended') return sum;
    const plan = t.subscriptionPlan || 'starter';
    return sum + (PLAN_PRICES[plan] || 0);
  }, 0);

  const avgRate = allTenants.length > 0 ? (allTenants.reduce((s, t) => s + (Number(t.exchangeRate) || 198), 0) / allTenants.length) : 198;
  const mrrLRD = Math.round(mrrUSD * avgRate);
  const arrUSD = Math.round(mrrUSD * 12);

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

  const handleConfirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const bizId = storeToDelete.businessId || storeToDelete.id;
      if (deleteTenant) {
        await deleteTenant(bizId);
      } else {
        await deleteDoc(doc(db, 'businesses', bizId));
      }
      setStoreToDelete(null);
    } catch (err) {
      console.error('Delete store error:', err);
      setDeleteError('Failed to delete store. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);

  const handleRefreshLeads = async () => {
    setIsRefreshingLeads(true);
    try {
      const snap = await getDocs(collection(db, 'leads'));
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      let merged = [...fetched];
      try {
        const local = JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
        for (const item of local) {
          if (!merged.some(m => m.id === item.id || (m.businessName === item.businessName && m.phone === item.phone))) {
            merged.push(item);
          }
        }
      } catch (e) {}
      merged.sort((a, b) => {
        const dateA = new Date(a.createdAt || (a.serverCreatedAt?.seconds ? a.serverCreatedAt.seconds * 1000 : 0));
        const dateB = new Date(b.createdAt || (b.serverCreatedAt?.seconds ? b.serverCreatedAt.seconds * 1000 : 0));
        return dateB - dateA;
      });
      setLeads(merged);
      try {
        localStorage.setItem('retailos_local_leads', JSON.stringify(merged));
      } catch (e) {}
    } catch (err) {
      console.warn('Manual leads refresh note:', err);
    } finally {
      setIsRefreshingLeads(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Delete this merchant inquiry?')) return;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      const local = JSON.parse(localStorage.getItem('retailos_local_leads') || '[]');
      localStorage.setItem('retailos_local_leads', JSON.stringify(local.filter((l) => l.id !== leadId)));
    } catch (e) {}
    try {
      await deleteDoc(doc(db, 'leads', leadId));
    } catch (e) {
      console.warn('Delete lead warning:', e);
    }
  };

  const handleCopyDirectLoginLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/app`;
    navigator.clipboard.writeText(url);
    setCopiedLink('direct');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyAdminLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/admin`;
    navigator.clipboard.writeText(url);
    setCopiedAdminLink(true);
    setTimeout(() => setCopiedAdminLink(false), 2500);
  };

  const handleExportPlatformData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'RetailOS Liberia',
      totalTenants: allTenants.length,
      tenants: allTenants,
      leads: leads,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `retailos_platform_export_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-850 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ⚡ PLATFORM SUPER-ADMIN
            </span>
            <span className="text-xs text-slate-400">Master Service Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            RetailOS Liberia
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Operator Suite
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Platform Operator: <span className="text-white font-medium">Joseph Doe & Team</span> · Empowering retail stores across Liberia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* STORE APP LINK BUTTON */}
          <button
            onClick={() => handleCopyDirectLoginLink()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 transition-all shadow-sm"
            title="Copy dedicated store & cashier app link (/app)"
          >
            {copiedLink === 'direct' ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-emerald-400" />}
            <span>{copiedLink === 'direct' ? 'Copied /app!' : 'Copy Store App Link (/app)'}</span>
          </button>

          {/* SUPER ADMIN LINK BUTTON */}
          <button
            onClick={handleCopyAdminLink}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 transition-all shadow-sm"
            title="Copy super admin portal link (/admin)"
          >
            {copiedAdminLink ? <Check className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
            <span>{copiedAdminLink ? 'Copied /admin!' : 'Copy Admin Link (/admin)'}</span>
          </button>

          {/* SETUP BUSINESS BUTTON */}
          <button
            onClick={() => {
              setSelectedLead(null);
              setShowNewStoreModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Setup New Business</span>
          </button>
        </div>
      </div>

      {/* Top Operator Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Businesses</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalStores}</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> {activeStores} Active & Operational
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Revenue (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">${mrrUSD.toFixed(2)}</div>
          <p className="text-xs text-slate-400 mt-1">SaaS Recurring Subscriptions</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local Currency (LRD)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">L${mrrLRD.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Converted @ ~{Math.round(avgRate)} LRD/USD</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Sync Online</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate font-mono">
            Firebase: retailos-liberia-212ba
          </p>
        </div>
      </div>

      {/* Operator Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'stores'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Client Businesses ({totalStores})</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'financials'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Platform Financials (MRR)</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative whitespace-nowrap ${
            activeTab === 'inquiries'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Inbound Leads ({leads.length})</span>
          {pendingLeadsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingLeadsCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Tech Health & Operations</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLIENT BUSINESSES DIRECTORY                       */}
      {/* ========================================================= */}
      {activeTab === 'stores' && (
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-3xl p-5 space-y-4 shadow-xl">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-black text-white">Client Stores & Workspaces</h2>
              <p className="text-xs text-slate-400">All registered Liberian businesses using RetailOS</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores, owners, slugs..."
                  className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none w-64 transition"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">All Statuses ({allTenants.length})</option>
                <option value="active">Active Only</option>
                <option value="trial">Free Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Stores Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Business / Store</th>
                  <th className="py-3 px-4">Store Slug & Catalog</th>
                  <th className="py-3 px-4">Owner & Contact</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Exchange Rate</th>
                  <th className="py-3 px-4 text-right">Service Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-750">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      <Store className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-semibold text-sm">No businesses found matching criteria.</p>
                      <p className="text-xs text-slate-500">Click "Setup New Business" to onboard a store.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => {
                    const waNumber = (t.whatsappNumber || t.ownerPhone || t.phone || '').replace(/[^0-9]/g, '');

                    return (
                      <tr key={t.businessId || t.id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm shrink-0"
                              style={{ backgroundColor: t.themeColor || '#10b981' }}
                            >
                              {(t.businessName || 'S')[0]}
                            </div>
                            <div>
                              <span className="font-extrabold text-white text-sm block leading-snug">{t.businessName}</span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {t.businessType || 'Retail'} · {t.address || 'Monrovia'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="text-[11px] text-cyan-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              /{t.slug}
                            </code>
                            <a
                              href={`/?store=${t.slug}#catalog`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-cyan-400 transition-colors"
                              title="Open Customer WhatsApp Catalog"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-slate-200">{t.ownerName || 'Store Owner'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">{t.ownerEmail || t.ownerPhone || 'No email'}</span>
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
                            {/* Copy Sign-in Link */}
                            <button
                              onClick={() => handleCopyDirectLoginLink(t.ownerEmail)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                              title={`Copy direct login link for ${t.ownerEmail || t.businessName}`}
                            >
                              {copiedLink === t.ownerEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />}
                              <span>{copiedLink === t.ownerEmail ? 'Copied!' : 'Login Link'}</span>
                            </button>

                            {/* Access Store as Tech Support */}
                            <button
                              onClick={() => handleEnterStore(t)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-sm"
                              title="Enter store workspace as tech support to configure inventory, pos, or settings"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Access Store</span>
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(t)}
                              className={`p-1.5 rounded-xl border text-xs transition-colors ${
                                t.subscriptionStatus === 'active'
                                  ? 'bg-amber-900/20 text-amber-300 border-amber-700/40 hover:bg-amber-900/40'
                                  : 'bg-emerald-900/20 text-emerald-300 border-emerald-700/40 hover:bg-emerald-900/40'
                              }`}
                              title={t.subscriptionStatus === 'active' ? 'Suspend Store' : 'Activate Store'}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE STORE PERMANENTLY */}
                            <button
                              onClick={() => setStoreToDelete(t)}
                              className="p-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white transition-colors"
                              title="Permanently Delete Store from Platform"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================= */}
      {/* TAB 2: PLATFORM FINANCIALS (RETAILOS SAAS REVENUE)        */}
      {/* ========================================================= */}
      {activeTab === 'financials' && (
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-black text-white">Platform Revenue & Subscription Financials</h2>
              <p className="text-xs text-slate-400">Monthly recurring income generated by RetailOS Liberia across all client stores</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
              Annual Run Rate: ${arrUSD.toLocaleString()} USD / yr
            </div>
          </div>

          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Starter Plan ($0/mo)</span>
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">Free Tier</span>
              </div>
              <div className="text-2xl font-black text-white">
                {allTenants.filter(t => (t.subscriptionPlan || 'starter') === 'starter').length} Stores
              </div>
              <p className="text-xs text-slate-400">Full basic POS & Offline local database</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-850 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase">
                <span>Growth Plan ($19.99/mo)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">L$ 3,960/mo</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {allTenants.filter(t => t.subscriptionPlan === 'growth').length} Stores
              </div>
              <p className="text-xs text-slate-400">
                Monthly: ${(allTenants.filter(t => t.subscriptionPlan === 'growth').length * 19.99).toFixed(2)} USD
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-850 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase">
                <span>Enterprise Plan ($39.99/mo)</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">L$ 7,920/mo</span>
              </div>
              <div className="text-2xl font-black text-cyan-400">
                {allTenants.filter(t => t.subscriptionPlan === 'enterprise').length} Stores
              </div>
              <p className="text-xs text-slate-400">
                Monthly: ${(allTenants.filter(t => t.subscriptionPlan === 'enterprise').length * 39.99).toFixed(2)} USD
              </p>
            </div>
          </div>

          {/* Client Subscriptions & Billing Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client Billing & Subscription Roster</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Client Business</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4">Active Plan</th>
                    <th className="py-3 px-4">Monthly Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Renewal / Trial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750">
                  {allTenants.map(t => {
                    const plan = t.subscriptionPlan || 'starter';
                    const fee = PLAN_PRICES[plan] || 0;
                    return (
                      <tr key={t.businessId || t.id} className="hover:bg-slate-750/40">
                        <td className="py-3.5 px-4 font-bold text-white">{t.businessName}</td>
                        <td className="py-3.5 px-4 text-slate-300">{t.ownerName || 'Merchant'}</td>
                        <td className="py-3.5 px-4 uppercase font-bold text-cyan-300">{plan}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {fee === 0 ? 'Free' : `$${fee.toFixed(2)} USD`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.subscriptionStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                            t.subscriptionStatus === 'trial' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {t.subscriptionStatus || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                          {t.trialEndsAt || 'Ongoing'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INBOUND LEADS & REGISTRATIONS                     */}
      {/* ========================================================= */}
      {activeTab === 'inquiries' && (
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-black text-white">Merchant Inquiries from Website</h2>
              <p className="text-xs text-slate-400">Prospective retail businesses who filled out "Register Your Business" on the website</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshLeads}
                disabled={isRefreshingLeads}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                title="Force refresh leads from Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLeads ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                <span>{isRefreshingLeads ? 'Refreshing...' : 'Refresh Leads'}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setShowNewStoreModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Manual Business Setup</span>
              </button>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <MessageCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No merchant inquiries received yet.</p>
              <p className="text-xs text-slate-500">When visitors submit registration requests on the homepage, their details appear here in real-time.</p>
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
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOnboarded ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {isOnboarded ? '✓ Onboarded' : '★ New Lead'}
                        </span>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Delete / Dismiss inquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                          <span>Onboard as Live Store</span>
                        </button>
                      )}

                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.ownerName || '')}%2C%20thank%20you%20for%20registering%20${encodeURIComponent(lead.businessName)}%20on%20RetailOS%20Liberia!`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl border border-emerald-500/30 transition flex items-center gap-1 text-xs font-semibold"
                          title="Contact Merchant on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: TECHNICAL OPERATIONS & SYSTEM HEALTH               */}
      {/* ========================================================= */}
      {activeTab === 'system' && (
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="pb-4 border-b border-slate-700">
            <h2 className="text-lg font-black text-white">Technical Operations & Diagnostics</h2>
            <p className="text-xs text-slate-400">Multi-tenant database connectivity, API status, and data export tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Cloud Firestore Database</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• <strong>Project ID:</strong> <code className="text-cyan-300">retailos-liberia-212ba</code></li>
                <li>• <strong>Hosting Domain:</strong> <code className="text-cyan-300">https://liberiaretailos.online</code></li>
                <li>• <strong>Multi-Tenant Isolation:</strong> Active (/businesses/{"{businessId}"})</li>
                <li>• <strong>Firestore Security Rules:</strong> Deployed & Enforced</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Dedicated Portal Endpoints</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Super-Admin Master Portal</span>
                    <code className="text-[11px] text-slate-400">/admin</code>
                  </div>
                  <button
                    onClick={handleCopyAdminLink}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 rounded-lg font-bold transition"
                  >
                    {copiedAdminLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Merchant & Cashier Store App</span>
                    <code className="text-[11px] text-slate-400">/app</code>
                  </div>
                  <button
                    onClick={() => handleCopyDirectLoginLink()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-300 rounded-lg font-bold transition"
                  >
                    {copiedLink === 'direct' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Full Platform Data Export</h3>
              <p className="text-xs text-slate-400">Download a JSON snapshot of all registered businesses, plans, and leads</p>
            </div>
            <button
              onClick={handleExportPlatformData}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Platform JSON</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE STORE CONFIRMATION MODAL                          */}
      {/* ========================================================= */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-600/80 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-white">Permanently Delete Business?</h3>
              <p className="text-xs text-slate-400">
                You are about to delete <strong className="text-rose-300 font-bold">{storeToDelete.businessName}</strong> ({storeToDelete.slug}).
              </p>
            </div>

            <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-[11px] text-rose-200 space-y-1 leading-relaxed">
              <p className="font-bold uppercase tracking-wider text-rose-300">Warning: This cannot be undone</p>
              <p>• All store products, transactions, customer accounts, and settings will be erased from Cloud Firestore.</p>
              <p>• Staff logins for <span className="font-mono text-white">{storeToDelete.ownerEmail || 'this store'}</span> will be revoked.</p>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-400 font-bold text-center">{deleteError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStoreToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteStore}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting Store...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW STORE ONBOARDING MODAL */}
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
