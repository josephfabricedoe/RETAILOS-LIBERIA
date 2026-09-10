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

// Views
import POSView from '../pos/POSView';
import InventoryView from '../inventory/InventoryView';
import SuppliersView from '../suppliers/SuppliersView';
import MarketingView from '../marketing/MarketingView';
import FinanceView from '../finance/FinanceView';
import AttendanceView from '../attendance/AttendanceView';
import DeliveryBoard from '../delivery/DeliveryBoard';
import StaffView from '../staff/StaffView';
import SettingsView from '../settings/SettingsView';
import CustomerAccountsView from '../customers/CustomerAccountsView';
import SuperAdminDashboard from '../superadmin/SuperAdminDashboard';

import { 
  LogOut, 
  ShieldAlert, 
  ShoppingBag, 
  Menu, 
  X, 
  ShoppingCart, 
  Package, 
  Building2, 
  MessageCircle, 
  BarChart3, 
  HeartHandshake, 
  Users, 
  Truck, 
  UserCog, 
  Settings,
  Lock,
  Store,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { canAccessModule, normalizeRole, getDefaultModuleForRole, ROLE_DEFINITIONS } from '../../utils/rbac';

const MODULE_VIEWS = {
  pos:        POSView,
  inventory:  InventoryView,
  suppliers:  SuppliersView,
  marketing:  MarketingView,
  finance:    FinanceView,
  customers:  CustomerAccountsView,
  attendance: AttendanceView,
  delivery:   DeliveryBoard,
  staff:      StaffView,
  settings:   SettingsView,
  superadmin: SuperAdminDashboard,
};

const MODULE_LABELS = {
  pos:        'Point of Sale',
  inventory:  'Inventory Management',
  suppliers:  'Suppliers & Restocking',
  marketing:  'WhatsApp Marketing',
  finance:    'Finance & Daily Reports',
  customers:  'Customers & VIP Accounts',
  attendance: 'Staff Attendance',
  delivery:   'Delivery Logistics',
  staff:      'Staff Management',
  settings:   'Store Settings',
  superadmin: 'Super-Admin Suite',
};

const ALL_MOBILE_MODULES = [
  { id: 'pos',        label: 'Point of Sale',          icon: ShoppingCart },
  { id: 'delivery',   label: 'Delivery Board',         icon: Truck },
  { id: 'attendance', label: 'Staff Attendance',        icon: Users },
  { id: 'customers',  label: 'Customers & VIP',         icon: HeartHandshake },
  { id: 'inventory',  label: 'Inventory Stock',         icon: Package },
  { id: 'finance',    label: 'Finance & Reports',       icon: BarChart3 },
  { id: 'marketing',  label: 'WhatsApp Marketing',      icon: MessageCircle },
  { id: 'suppliers',  label: 'Suppliers & Restock',     icon: Building2 },
  { id: 'staff',      label: 'Staff Management',        icon: UserCog },
  { id: 'settings',   label: 'Store Settings',          icon: Settings },
  { id: 'superadmin', label: 'Platform Super-Admin',    icon: Sparkles },
];

export default function Shell({ onGoToCatalog, onGoToLanding }) {
  const { activeModule, setActiveModule } = useApp();
  const { 
    userProfile, 
    signOut, 
    isSharedTerminal, 
    isTerminalLocked, 
    lockTerminalStaff,
    isSuperAdmin,
    currentUser
  } = useAuth();
  const { currentTenant, switchTenant } = useTenant();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const userRole = normalizeRole(userProfile?.role, currentUser?.email);
  const roleDef = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS.cashier;
  const isBlocked = !canAccessModule(userRole, activeModule);

  // Auto-redirect if user opens a module they don't have clearance for
  useEffect(() => {
    if (!canAccessModule(userRole, activeModule)) {
      const defaultMod = getDefaultModuleForRole(userRole);
      if (activeModule !== defaultMod) {
        setActiveModule(defaultMod);
      }
    }
  }, [userRole, activeModule, setActiveModule]);

  let ActiveView = MODULE_VIEWS[activeModule] || POSView;

  const storeName = currentTenant?.businessName || 'RetailOS Liberia';
  const themeColor = currentTenant?.themeColor || '#0ea5e9';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden selection:bg-cyan-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Super-Admin Impersonation Banner */}
        {isSuperAdmin && activeModule !== 'superadmin' && (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Super-Admin Workspace Mode:</span>
              <span className="text-white font-bold bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30">
                {currentTenant?.businessName} ({currentTenant?.slug})
              </span>
            </div>
            <button
              onClick={() => setActiveModule('superadmin')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Master Dashboard</span>
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center gap-2.5 px-3 sm:px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Store Logo / Badge */}
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md flex-shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            {currentTenant?.logoUrl ? (
              <img src={currentTenant.logoUrl} alt={storeName} className="w-full h-full object-cover rounded-xl" />
            ) : (
              (storeName || 'R')[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                {MODULE_LABELS[activeModule] || storeName}
              </h1>
              <span className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleDef.badgeColor}`}>
                {roleDef.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate">
              {storeName} · {currentTenant?.address || 'Monrovia, Liberia'}
            </p>
          </div>

          {/* Public Storefront Link */}
          {onGoToCatalog && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
              title="View Public Customer Storefront Catalog"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          )}

          {/* Shared Terminal Lock / Switch Staff */}
          {isSharedTerminal && (
            <button
              type="button"
              onClick={lockTerminalStaff}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Lock register and switch staff PIN"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Switch Staff</span>
              <span className="sm:hidden">Lock</span>
            </button>
          )}

          <CurrencyToggle />
          <NotificationBell />
          <button
            onClick={signOut}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <PwaInstallPrompt />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          {isBlocked ? (
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
          ) : (
            <ActiveView onEnterStore={() => setActiveModule('pos')} />
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

          <div className="relative w-72 max-w-[80vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  {(storeName || 'R')[0]}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-sm block leading-tight truncate">{storeName}</span>
                  <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider block">RetailOS POS</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-3 space-y-1 overflow-y-auto">
              {ALL_MOBILE_MODULES.filter(m => canAccessModule(userRole, m.id)).map(item => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 px-1">
                Signed in as: <span className="text-white font-medium">{userProfile?.displayName || userProfile?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
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
    </div>
  );
}
