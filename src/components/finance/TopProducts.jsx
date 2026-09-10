import React from 'react';
import { Package, TrendingUp } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

export default function TopProducts({ sales = [], limit = 5 }) {
  const { formatUSD } = useCurrency();

  const productMap = {};

  sales.forEach((s) => {
    if (Array.isArray(s.items)) {
      s.items.forEach((item) => {
        const id = item.id || item.name;
        const name = item.name || 'Unnamed Product';
        const qty = Number(item.quantity || 1);
        const revenue = Number(item.subtotalUSD || (item.priceUSD * qty) || 0);

        if (!productMap[id]) {
          productMap[id] = { id, name, qty: 0, revenue: 0 };
        }
        productMap[id].qty += qty;
        productMap[id].revenue += revenue;
      });
    }
  });

  const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  const maxRevenue = sorted.length > 0 ? sorted[0].revenue : 1;

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <Package className="w-10 h-10 mb-2 stroke-1" />
        <p className="text-sm font-medium">No product sales data recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Top Performing Products</h3>
          <p className="text-xs text-slate-500">Highest grossing items in this time window</p>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((prod, idx) => {
          const pct = Math.min(100, Math.round((prod.revenue / maxRevenue) * 100));
          return (
            <div key={prod.id} className="group">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 truncate">{prod.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-900 font-bold">{formatUSD(prod.revenue)}</span>
                  <span className="text-slate-400 font-normal ml-2">({prod.qty} sold)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
