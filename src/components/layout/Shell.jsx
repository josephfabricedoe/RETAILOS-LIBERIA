import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CurrencyToggle from '../shared/CurrencyToggle';
import NotificationBell from '../shared/NotificationBell';
import PwaInstallPrompt from '../shared/PwaInstallPrompt';
import TerminalPinModal from '../auth/TerminalPinModal';
import LaunchpadChecklist from '../shared/LaunchpadChecklist';
import ConnectivityBadge from '../shared/ConnectivityBadge';
import DevicePairingModal from '../settings/DevicePairingModal';

// Views (Lazily loaded for instant shell bootup)
const POSView = React.lazy(() => import('../pos/POSView'));
const InventoryView = React.lazy(() => import('../inventory/InventoryView'));
const FinanceView = React.lazy(() => import('../finance/FinanceView'));
const CustomerAccountsView = React.lazy(() => import('../customers/CustomerAccountsView'));
const SettingsView = React.lazy(() => import('../settings/SettingsView'));
const SuperAdminDashboard = React.lazy(() => import('../superadmin/SuperAdminDashboard'));

import { 
  LogOut, 
  ShieldAlert, 
  ShoppingBag, 
  Menu, 
  X, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  HeartHandshake, 
  Settings,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { canAccessModule, normalizeRole, getDefaultModuleForRole, ROLE_DEFINITIONS, isModuleAvailableForPlan } from '../../utils/rbac';

const MODULE_VIEWS = {
  pos:        POSView,
  inventory:  InventoryView,
  finance:    FinanceView,
  customers:  CustomerAccountsView,
  settings:   SettingsView,
  superadmin: SuperAdminDashboard,
};

const MODULE_LABELS = {
  pos:        'Point of Sale',
  inventory:  'Inventory Stock',
  finance:    'Daily Sales & Reports',
  customers:  'Customers & Store Credit',
  settings:   'Store Settings',
  superadmin: 'Super-Admin Suite',
};

const ALL_MOBILE_MODULES = [
  { id: 'pos',        label: 'Point of Sale',          icon: ShoppingCart },
  { id: 'inventory',  label: 'Inventory Stock',         icon: Package },
  { id: 'customers',  label: 'Customers & Credit',      icon: HeartHandshake },
  { id: 'finance',    label: 'Sales & Reports',         icon: BarChart3 },
  { id: 'settings',   label: 'Store Settings',          icon: Settings },
  { id: 'superadmin', label: 'Super-Admin Suite',       icon: Sparkles },
];

export default function Shell({ onGoToCatalog, onGoToLanding, onSignOut }) {
  const { activeModule, setActiveModule } = useApp();
  const { 
    userProfile, 
    signOut, 
    isSharedTerminal, 
    isTerminalLocked, 
    lockTerminalStaff,
    isSuperAdmin,
    currentUser,
    setRole
  } = useAuth();
  const { currentTenant, switchTenant } = useTenant();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Signout warning:', e);
    }
    if (onSignOut) onSignOut();
    else if (onGoToLanding) onGoToLanding();
  };

  const userRole = normalizeRole(userProfile?.role, currentUser?.email);
  const roleDef = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS.cashier;
  const storePlan = currentTenant?.subscriptionPlan || 'starter';
  const isSuper = isSuperAdmin || userRole === 'superadmin';

  // Role permissions check (checks if the user's role allows this module)
  const isRoleAllowed = isSuper || canAccessModule(userRole, activeModule, 'enterprise');

  // Plan level check (checks if the store's current subscription plan includes this module)
  const isPlanAllowed = isSuper || isModuleAvailableForPlan(storePlan, activeModule);

  // Auto-redirect only if role is completely disallowed (e.g. counter cashier tries to open settings)
  useEffect(() => {
    if (!isSuper && !canAccessModule(userRole, activeModule, 'enterprise')) {
      const defaultMod = getDefaultModuleForRole(userRole);
      if (activeModule !== defaultMod) {
        setActiveModule(defaultMod);
      }
    } else if (isSuper && activeModule === 'pos') {
      setActiveModule('superadmin');
    }
  }, [userRole, activeModule, setActiveModule, isSuper]);

  let ActiveView = MODULE_VIEWS[activeModule] || POSView;

  const storeName = currentTenant?.businessName || 'RetailOS Liberia';
  const themeColor = currentTenant?.themeColor || '#0ea5e9';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden selection:bg-emerald-500 selection:text-white text-slate-900 font-sans">
      <Sidebar onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Super-Admin Impersonation Banner */}
        {isSuperAdmin && activeModule !== 'superadmin' && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs text-white shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-bold tracking-wide">Super-Admin Workspace Mode:</span>
              <span className="text-emerald-950 font-black bg-white px-2.5 py-0.5 rounded-full shadow-xs">
                {currentTenant?.businessName} ({currentTenant?.slug})
              </span>
            </div>
            <button
              onClick={() => setActiveModule('superadmin')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 text-white font-bold border border-white/20 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Master Dashboard</span>
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-3 bg-white border-b border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border border-slate-200"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Store Logo / Badge */}
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            {currentTenant?.logoUrl ? (
              <img src={currentTenant.logoUrl} alt={storeName} className="w-full h-full object-contain rounded-xl bg-white p-0.5" />
            ) : (
              (storeName || 'R')[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                {MODULE_LABELS[activeModule] || storeName}
              </h1>
              <button
                type="button"
                onClick={() => !isSuperAdmin && setRole(userRole === 'owner' ? 'cashier' : 'owner')}
                className={`hidden sm:inline-flex text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${roleDef.badgeColor} ${!isSuperAdmin ? 'hover:opacity-85 cursor-pointer shadow-2xs' : ''}`}
                title={!isSuperAdmin ? `Current Mode: ${roleDef.label}. Click to toggle Owner / Cashier` : 'Platform Super-Admin'}
              >
                {roleDef.badge}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold hidden sm:block truncate">
              {storeName} · {currentTenant?.address || 'Monrovia, Liberia'}
            </p>
          </div>

          {/* Public Storefront Link */}
          {onGoToCatalog && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black border border-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              title="View Public Customer Storefront Catalog"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          )}

          {/* Multi-Device QR Pairing for Store Owners */}
          {(userRole === 'owner' || isSuper) && (
            <button
              type="button"
              onClick={() => setShowPairingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
              title="Connect another phone, tablet, or PC to this store"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Link Device</span>
            </button>
          )}

          {/* Shared Terminal Lock / Switch Staff */}
          {isSharedTerminal && (
            <button
              type="button"
              onClick={lockTerminalStaff}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition shadow-xs"
              title="Lock register and switch staff PIN"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Switch Staff</span>
              <span className="sm:hidden">Lock</span>
            </button>
          )}

          <CurrencyToggle />
          <NotificationBell />
          <ConnectivityBadge />
          <button
            onClick={handleSignOut}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 bg-slate-100/70 text-slate-900">
          {(userRole === 'owner' || isSuper) && <LaunchpadChecklist />}
          {!isRoleAllowed ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Restricted Access Module</h2>
              <p className="text-slate-400 text-sm max-w-md mb-2">
                This section is protected by store confidentiality rules and is not accessible with your authority level ({roleDef.badge}).
              </p>
              <button
                onClick={() => setActiveModule(getDefaultModuleForRole(userRole))}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/25"
              >
                Return to {MODULE_LABELS[getDefaultModuleForRole(userRole)]}
              </button>
            </div>
          ) : !isPlanAllowed ? (
            <PlanUpgradeLockView moduleId={activeModule} />
          ) : (
            <React.Suspense fallback={
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading module...</span>
              </div>
            }>
              <ActiveView onEnterStore={() => setActiveModule('pos')} />
            </React.Suspense>
          )}
        </main>
      </div>

      <BottomNav />

      {/* Mobile Slide-Over Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-white border-r border-slate-200 h-full flex flex-col p-4 shadow-2xl z-10 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  {(storeName || 'R')[0]}
                </div>
                <div className="min-w-0">
                  <span className="font-black text-slate-900 text-sm block leading-tight truncate">{storeName}</span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">RetailOS POS</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-3 space-y-1 overflow-y-auto">
              {ALL_MOBILE_MODULES.filter(m => isSuper || canAccessModule(userRole, m.id, 'enterprise')).map(item => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                const isLocked = !isSuper && !isModuleAvailableForPlan(storePlan, item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isLocked && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-black flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Upgrade</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="text-xs text-slate-500 px-1 font-semibold">
                Signed in as: <span className="text-slate-900 font-bold">{isSuperAdmin ? 'RetailOS Master Admin' : (userProfile?.displayName || userProfile?.email)}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-Digit PIN Terminal Kiosk Lock Screen */}
      {isTerminalLocked && <TerminalPinModal />}

      {/* Multi-Device QR Pairing Modal */}
      {showPairingModal && (
        <DevicePairingModal onClose={() => setShowPairingModal(false)} />
      )}
    </div>
  );
}
