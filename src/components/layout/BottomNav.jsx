import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart, Package, HeartHandshake, BarChart3, Truck, Users, Building2, DollarSign, ShieldCheck } from 'lucide-react';
import { canAccessModule, normalizeRole } from '../../utils/rbac';

const PRIMARY_MOBILE_ITEMS = [
  { id: 'pos',        label: 'POS',        icon: ShoppingCart },
  { id: 'inventory',  label: 'Stock',      icon: Package },
  { id: 'customers',  label: 'Credit',     icon: HeartHandshake },
  { id: 'finance',    label: 'Sales',      icon: BarChart3 },
];

const SUPERADMIN_BOTTOM_ITEMS = [
  { id: 'stores',     label: 'Stores',     icon: Building2 },
  { id: 'financials', label: 'Revenue',    icon: DollarSign },
  { id: 'inquiries',  label: 'Leads',      icon: Users },
  { id: 'system',     label: 'Health',     icon: ShieldCheck },
];

export default function BottomNav() {
  const { activeModule, setActiveModule, adminTab, setAdminTab } = useApp();
  const { userProfile, currentUser, isSuperAdmin } = useAuth();
  const role = normalizeRole(userProfile?.role, currentUser?.email);

  if (isSuperAdmin && activeModule === 'superadmin') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-1.5 shadow-lg safe-bottom">
        {SUPERADMIN_BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = (adminTab || 'stores') === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule('superadmin');
                setAdminTab(item.id);
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? 'text-cyan-400 font-black' : 'text-slate-400 hover:text-white font-semibold'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  const visibleItems = PRIMARY_MOBILE_ITEMS.filter(i => canAccessModule(role, i.id));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 shadow-lg safe-bottom">
      {visibleItems.map(item => {
        const Icon = item.icon;
        const active = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              active ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
