import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Bell, AlertTriangle, ShoppingCart, X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [lowStock, setLowStock] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const ref = useRef(null);
  const { format } = useCurrency();
  const { getTenantCol, tenantId } = useTenant();

  useEffect(() => {
    if (!tenantId) return;
    try {
      const q = query(getTenantCol('products'), where('showroomQty', '<', 5));
      return onSnapshot(q, snap => setLowStock(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch (e) {
      console.warn('Low stock notice:', e);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    try {
      const start = new Date(); 
      start.setHours(0, 0, 0, 0);
      const q = query(
        getTenantCol('sales'),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      return onSnapshot(q, snap => setTodaySales(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch (e) {
      console.warn('Today sales notice:', e);
    }
  }, [tenantId]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const todayTotal = todaySales.reduce((s, x) => s + (x.total || 0), 0);
  const alertCount = lowStock.length;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {alertCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Store Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-100 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">Today's Sales</span>
              </div>
              <p className="text-xl font-black text-slate-900">{format(todayTotal)}</p>
              <p className="text-[11px] text-slate-500 font-medium">{todaySales.length} transaction{todaySales.length !== 1 ? 's' : ''} recorded</p>
            </div>

            {lowStock.length > 0 ? (
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-amber-900">{lowStock.length} Low Stock Alert{lowStock.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  {lowStock.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{p.barcode}</p>
                      </div>
                      <span className="text-xs font-black text-amber-700 ml-2 flex-shrink-0">{p.showroomQty} left</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-500 font-semibold">All inventory levels healthy ✓</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
