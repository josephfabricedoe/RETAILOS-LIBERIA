import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { ShoppingCart, Package, HeartHandshake, BarChart3, Truck, Users } from 'lucide-react';
import { canAccessModule, normalizeRole } from '../../utils/rbac';

const PRIMARY_MOBILE_ITEMS = [
  { id: 'pos',        label: 'POS',        icon: ShoppingCart },
  { id: 'delivery',   label: 'Delivery',   icon: Truck },
  { id: 'customers',  label: 'VIP',        icon: HeartHandshake },
  { id: 'inventory',  label: 'Stock',      icon: Package },
  { id: 'finance',    label: 'Finance',    icon: BarChart3 },
];

export default function BottomNav() {
  const { activeModule, setActiveModule } = useApp();
  const { userProfile, currentUser } = useAuth();
  const role = normalizeRole(userProfile?.role, currentUser?.email);

  const visibleItems = PRIMARY_MOBILE_ITEMS.filter(i => canAccessModule(role, i.id));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around py-1.5 safe-bottom">
      {visibleItems.map(item => {
        const Icon = item.icon;
        const active = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              active ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
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
