import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Truck, 
  ChevronLeft, 
  LogOut, 
  Settings, 
  UserCog, 
  HeartHandshake, 
  Building2, 
  MessageCircle,
  Lock,
  Store,
  Sparkles
} from 'lucide-react';
import { canAccessModule, normalizeRole, ROLE_DEFINITIONS, isModuleAvailableForPlan, getRequiredPlanForModule, PLAN_TIERS } from '../../utils/rbac';

const NAV_ITEMS = [
  { id: 'pos',        label: 'Point of Sale',           icon: ShoppingCart },
  { id: 'inventory',  label: 'Inventory Stock',         icon: Package },
  { id: 'customers',  label: 'Customers & VIP',         icon: HeartHandshake },
  { id: 'storefront', label: 'Online Storefront',       icon: Store },
  { id: 'suppliers',  label: 'Suppliers & Restock',     icon: Building2 },
  { id: 'finance',    label: 'Finance & Reports',       icon: BarChart3 },
  { id: 'attendance', label: 'Staff Attendance',        icon: Users },
  { id: 'staff',      label: 'Staff Management',        icon: UserCog },
  { id: 'delivery',   label: 'Delivery Logistics',      icon: Truck },
  { id: 'marketing',  label: 'WhatsApp Marketing',      icon: MessageCircle },
];

const BOTTOM_ITEMS = [
  { id: 'settings',   label: 'Store Settings',          icon: Settings },
];

function NavButton({ id, label, icon: Icon, active, isOpen, onClick, highlight = false, isLocked = false, requiredPlan = null }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
          : highlight
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : highlight ? 'text-emerald-600' : 'text-slate-500'}`} />
        {isOpen && <span className="truncate">{label}</span>}
      </div>
      {isLocked && isOpen && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold flex items-center gap-0.5 uppercase tracking-wider shrink-0">
          <Lock className="w-2.5 h-2.5" />
          <span>{requiredPlan === 'enterprise' ? 'Ent' : 'Growth'}</span>
        </span>
      )}
    </button>
  );
}

export default function Sidebar() {
  const { activeModule, setActiveModule, isSidebarOpen, toggleSidebar } = useApp();
  const { userProfile, signOut, isSharedTerminal, lockTerminalStaff, isSuperAdmin, currentUser, setRole } = useAuth();
  const { currentTenant } = useTenant();

  const role = normalizeRole(userProfile?.role, currentUser?.email);
  const roleDef = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.cashier;
  const storePlan = currentTenant?.subscriptionPlan || 'starter';

  const filtered = NAV_ITEMS.filter(i => isSuperAdmin || canAccessModule(role, i.id, 'enterprise'));
  const bottomFiltered = BOTTOM_ITEMS.filter(i => isSuperAdmin || canAccessModule(role, i.id, 'enterprise'));

  const storeName = currentTenant?.businessName || 'RetailOS Liberia';
  const themeColor = currentTenant?.themeColor || '#10b981';

  const planBadgeName = storePlan === 'enterprise' ? 'Enterprise' : storePlan === 'growth' ? 'Growth' : 'Free Forever';

  const isFounderName = userProfile?.displayName === 'Joseph Doe' || userProfile?.displayName === 'Malydia Jasay';
  const effectiveDisplayName = isSuperAdmin || isFounderName ? 'RetailOS Master Admin' : (userProfile?.displayName || 'Store Owner');

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-xs ${isSidebarOpen ? 'w-56' : 'w-16'}`}>
      {/* Store Header */}
      <div className="flex items-center gap-2.5 p-4 border-b border-slate-200 bg-slate-50/70">
        <div 
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          {currentTenant?.logoUrl ? (
            <img src={currentTenant.logoUrl} alt={storeName} className="w-full h-full object-cover rounded-xl" />
          ) : (
            (storeName || 'R')[0]
          )}
        </div>
        {isSidebarOpen && (
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight block leading-tight truncate">
              {storeName}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              RetailOS Liberia
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Super-Admin Direct Entry Link */}
        {isSuperAdmin && (
          <div className="mb-2 pb-2 border-b border-slate-200">
            <NavButton
              id="superadmin"
              label="Super-Admin Hub"
              icon={Sparkles}
              active={activeModule === 'superadmin'}
              isOpen={isSidebarOpen}
              onClick={setActiveModule}
              highlight={true}
            />
          </div>
        )}

        {filtered.map(item => {
          const isLocked = !isSuperAdmin && !isModuleAvailableForPlan(storePlan, item.id);
          const reqPlan = getRequiredPlanForModule(item.id);
          return (
            <NavButton
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              active={activeModule === item.id}
              isOpen={isSidebarOpen}
              onClick={setActiveModule}
              isLocked={isLocked}
              requiredPlan={reqPlan}
            />
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-slate-200 bg-slate-50/50 space-y-1">
        {bottomFiltered.map(item => (
          <NavButton
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            active={activeModule === item.id}
            isOpen={isSidebarOpen}
            onClick={setActiveModule}
          />
        ))}

        {/* User Role Badge & Switcher */}
        <div className={`px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs my-1 ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center shadow-xs">
              <span className="text-xs font-bold text-white">{(effectiveDisplayName || 'O')[0].toUpperCase()}</span>
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{effectiveDisplayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border block ${roleDef.badgeColor}`}>
                    {roleDef.badge}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold block">
                    {planBadgeName}
                  </span>
                </div>
                {!isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setRole(role === 'owner' ? 'cashier' : 'owner')}
                    className="text-[9px] text-emerald-700 hover:text-emerald-900 underline font-bold mt-1 block"
                    title="Toggle between Owner (Full Access) and Cashier (Register only)"
                  >
                    {role === 'owner' ? 'Preview Cashier View' : 'Back to Store Owner'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Shared Terminal Lock */}
        {isSharedTerminal && (
          <button
            onClick={lockTerminalStaff}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-medium transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
            title="Lock register and switch staff PIN"
          >
            <Lock className="w-4 h-4 flex-shrink-0 text-amber-600" />
            {isSidebarOpen && <span>Switch Staff</span>}
          </button>
        )}

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
