import React, { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import { ArrowRight, Boxes, Package } from 'lucide-react';

export default function StoreroomTable({ onTransferClick, onRestockClick }) {
  const { getTenantCol, tenantId } = useTenant();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    if (!tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('products'), snap => {
        setProducts(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => (p.storeroomQty || 0) > 0 || p.reorderTrigger)
        );
        setLoading(false);
      });
      return unsub;
    } catch (e) {
      console.warn('Storeroom notice:', e);
      setLoading(false);
    }
  }, [tenantId]);

  if (loading) return <div className="text-slate-500 text-xs p-6 text-center">Loading backroom inventory...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-slate-850 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
          <tr>
            <th className="text-left py-3 px-4">Item & Barcode</th>
            <th className="text-right py-3 px-4">Storeroom Qty</th>
            <th className="text-right py-3 px-4">Reorder Trigger</th>
            <th className="text-center py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {products.map(p => (
            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-4">
                <div className="font-bold text-white text-xs">{p.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{p.barcode || p.id}</span>
                </div>
              </td>

              <td className="py-3 px-4 text-right">
                <span className={`font-black text-sm ${(p.storeroomQty || 0) <= (p.reorderTrigger || 10) ? 'text-amber-400' : 'text-white'}`}>
                  {p.storeroomQty || 0} pcs
                </span>
              </td>

              <td className="py-3 px-4 text-right text-slate-400 font-mono">{p.reorderTrigger || 10}</td>

              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTransferClick(p)}
                    disabled={(p.storeroomQty || 0) === 0}
                    title="Transfer from Storeroom to Showroom"
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Move to Shelves</span>
                  </button>

                  {onRestockClick && (
                    <button
                      type="button"
                      onClick={() => onRestockClick(p)}
                      title="Order Restock from Supplier"
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-slate-500 py-12 text-xs">
                No backroom stock recorded. Use Transfer or Stock Audit to adjust quantities.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
