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
  ShoppingBag
} from 'lucide-react';
import { useTenant, DEFAULT_DEMO_BUSINESS } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import NewStoreModal from './NewStoreModal';

export default function SuperAdminDashboard({ onEnterStore }) {
  const { allTenants, currentTenant, switchTenant, updateTenant, updateTenantById, createTenant } = useTenant();
  const { setActiveModule } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

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

  // Quick provision popular Liberia small retail businesses for demo
  const handleSeedLiberiaDemos = async () => {
    setSeeding(true);
    const demos = [
      {
        businessName: 'Sinkor Care Pharmacy',
        slug: 'sinkor-care-pharmacy',
        businessType: 'Pharmacy & Healthcare',
        ownerName: 'Dr. Massa Kamara',
        ownerPhone: '0770555111',
        ownerEmail: 'massa@sinkorcare.com',
        terminalEmail: 'pos@sinkorcare.com',
        themeColor: '#10b981',
        exchangeRate: 198,
        subscriptionPlan: 'growth',
        subscriptionStatus: 'active',
        address: 'Tubman Blvd, 12th Street Sinkor, Monrovia',
      },
      {
        businessName: 'Paynesville Grocery Mart',
        slug: 'paynesville-grocery',
        businessType: 'Supermarket & Grocery',
        ownerName: 'Kollie Mulbah',
        ownerPhone: '0886123987',
        ownerEmail: 'kollie@paynesvillegrocery.lr',
        terminalEmail: 'pos@paynesvillegrocery.lr',
        themeColor: '#f59e0b',
        exchangeRate: 200,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        address: 'ELWA Junction, Paynesville, Liberia',
      },
      {
        businessName: 'Waterside Provisions Hub',
        slug: 'waterside-provisions',
        businessType: 'Provision & General Store',
        ownerName: 'Hawa Sirleaf',
        ownerPhone: '0777444222',
        ownerEmail: 'hawa@watersidehub.lr',
        terminalEmail: 'pos@watersidehub.lr',
        themeColor: '#8b5cf6',
        exchangeRate: 198,
        subscriptionPlan: 'starter',
        subscriptionStatus: 'active',
        address: 'Water Street Commercial District, Monrovia',
      }
    ];

    try {
      for (const d of demos) {
        if (!allTenants.some(t => t.slug === d.slug)) {
          await createTenant(d);
        }
      }
    } catch (e) {
      console.warn('Demo seed error:', e);
    } finally {
      setSeeding(false);
    }
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
            Platform Management: <span className="text-white font-medium">RetailOS Liberia Team</span> · Empowering retail across Liberia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeedLiberiaDemos}
            disabled={seeding}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors disabled:opacity-50"
            title="Seed sample Monrovia retail businesses"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Stores'}</span>
          </button>

          <button
            onClick={() => setShowNewStoreModal(true)}
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

      {/* Stores Directory Section */}
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

      {showNewStoreModal && (
        <NewStoreModal
          onClose={() => setShowNewStoreModal(false)}
          onCreated={(store) => {
            switchTenant(store.businessId);
            setActiveModule('pos');
            if (onEnterStore) onEnterStore();
          }}
        />
      )}
    </div>
  );
}
