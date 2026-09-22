import React from 'react';
import { Share2, DollarSign, TrendingUp, TrendingDown, Layers, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import { exportQuickBooksJournalEntries } from '../../utils/exportCsv';

export default function DetailedStoreReport({ sales = [], expenses = [], products = [] }) {
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { currentStore } = useTenant();

  // 1. Gross Revenue & Discounts
  const grossSalesUSD = sales.reduce((acc, s) => acc + Number(s.totalUSD || s.total || 0), 0);
  const discountsUSD = sales.reduce((acc, s) => acc + Number(s.discountUSD || 0), 0);
  const netSalesUSD = grossSalesUSD;

  // 2. Approximate COGS (Cost of Goods Sold)
  // Match items in sales with products costPrice
  const productCostMap = {};
  products.forEach((p) => {
    productCostMap[p.id] = Number(p.costPriceUSD || p.costPrice || 0);
    if (p.name) productCostMap[p.name.toLowerCase()] = Number(p.costPriceUSD || p.costPrice || 0);
  });

  let estimatedCogsUSD = 0;
  sales.forEach((s) => {
    if (Array.isArray(s.items)) {
      s.items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const unitCost = productCostMap[item.id] || (item.name && productCostMap[item.name.toLowerCase()]) || Number(item.costPriceUSD || 0) || (Number(item.priceUSD || 0) * 0.65); // default fallback 65% cogs
        estimatedCogsUSD += unitCost * qty;
      });
    }
  });

  const grossProfitUSD = Math.max(0, netSalesUSD - estimatedCogsUSD);
  const grossMarginPct = netSalesUSD > 0 ? Math.round((grossProfitUSD / netSalesUSD) * 100) : 0;

  // 3. Operating Expenses
  const totalExpensesUSD = expenses.reduce((acc, e) => {
    if (e.currency === 'LRD') {
      return acc + (Number(e.amount || 0) / fxRate);
    }
    return acc + Number(e.amount || 0);
  }, 0);

  // Group expenses by category
  const expenseCatMap = {};
  expenses.forEach((e) => {
    const cat = e.category || 'General';
    const amountUSD = e.currency === 'LRD' ? (Number(e.amount || 0) / fxRate) : Number(e.amount || 0);
    expenseCatMap[cat] = (expenseCatMap[cat] || 0) + amountUSD;
  });

  // 4. Net Operating Profit
  const netProfitUSD = grossProfitUSD - totalExpensesUSD;
  const netMarginPct = netSalesUSD > 0 ? Math.round((netProfitUSD / netSalesUSD) * 100) : 0;

  // 5. Category Profit Margin Leaderboard (Class P&L)
  const productCategoryMap = {};
  products.forEach((p) => {
    const cat = p.category || 'General Merchandise';
    if (p.id) productCategoryMap[p.id] = cat;
    if (p.name) productCategoryMap[p.name.toLowerCase()] = cat;
  });

  const categoryPerformance = {};
  sales.forEach((s) => {
    if (Array.isArray(s.items)) {
      s.items.forEach((item) => {
        const cat = item.category || productCategoryMap[item.id] || (item.name && productCategoryMap[item.name.toLowerCase()]) || 'General Merchandise';
        const qty = Number(item.quantity || 1);
        const itemPrice = Number(item.priceUSD || item.price || 0);
        const revenue = Number(item.totalUSD || (itemPrice * qty) || 0);
        const unitCost = productCostMap[item.id] || (item.name && productCostMap[item.name.toLowerCase()]) || Number(item.costPriceUSD || 0) || (itemPrice * 0.65);
        const cogs = unitCost * qty;

        if (!categoryPerformance[cat]) {
          categoryPerformance[cat] = { category: cat, revenueUSD: 0, cogsUSD: 0, unitsSold: 0 };
        }
        categoryPerformance[cat].revenueUSD += revenue;
        categoryPerformance[cat].cogsUSD += cogs;
        categoryPerformance[cat].unitsSold += qty;
      });
    }
  });

  const categoryLeaderboard = Object.values(categoryPerformance).map((c) => {
    const grossProfit = Math.max(0, c.revenueUSD - c.cogsUSD);
    const marginPct = c.revenueUSD > 0 ? Math.round((grossProfit / c.revenueUSD) * 100) : 0;
    return {
      ...c,
      grossProfitUSD: grossProfit,
      marginPct
    };
  }).sort((a, b) => b.grossProfitUSD - a.grossProfitUSD);

  const handleShareWhatsApp = () => {
    const storeName = currentStore?.name || 'Retail Store';
    const text = `📊 *${storeName.toUpperCase()} - P&L Financial Report*
📅 Date: ${new Date().toLocaleDateString()}
FX Rate: $1 USD = $${fxRate} LRD

💰 *REVENUE*
• Gross Sales: ${formatUSD(grossSalesUSD)} (${formatLRD(grossSalesUSD * fxRate)})
• Total Transactions: ${sales.length}

📦 *COST OF GOODS*
• Estimated COGS: ${formatUSD(estimatedCogsUSD)}
• Gross Profit: ${formatUSD(grossProfitUSD)} (${grossMarginPct}% Margin)

📉 *OPERATING EXPENSES*
• Total Expenses: ${formatUSD(totalExpensesUSD)}
${Object.entries(expenseCatMap).map(([k, v]) => `  - ${k}: ${formatUSD(v)}`).join('\n')}

💵 *NET BOTTOM LINE*
• Net Profit: *${formatUSD(netProfitUSD)}* (${formatLRD(netProfitUSD * fxRate)})
• Net Margin: *${netMarginPct}%*

_Generated via RetailOS Liberia Multi-Tenant Platform_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            Executive Ledger
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Store Profit & Loss Statement (P&L)
          </h2>
          <p className="text-xs text-slate-500">
            Automated net profitability calculations including sales, estimated COGS, and overheads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportQuickBooksJournalEntries({
              sales,
              expenses,
              products,
              storeName: currentStore?.name || 'Retail Store',
              fxRate: fxRate || 198,
              dateLabel: new Date().toISOString().slice(0, 10)
            })}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition"
            title="Download standard General Ledger Journal Entries CSV for QuickBooks Online, Desktop, Xero, or Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export for QuickBooks (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500">Net Store Revenue</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatUSD(netSalesUSD)}</p>
          <span className="text-[11px] text-slate-500 font-medium">{formatLRD(netSalesUSD * fxRate)}</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100">
          <span className="text-xs font-semibold text-amber-700">Operating Expenses</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{formatUSD(totalExpensesUSD)}</p>
          <span className="text-[11px] text-amber-600 font-medium">{expenses.length} logged expense items</span>
        </div>

        <div className={`p-5 rounded-2xl border ${netProfitUSD >= 0 ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' : 'bg-red-50/60 border-red-100 text-red-900'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-80">Net Store Profit</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/80">
              {netMarginPct}% margin
            </span>
          </div>
          <p className="text-2xl font-black mt-1">{formatUSD(netProfitUSD)}</p>
          <span className="text-[11px] font-medium opacity-80">{formatLRD(netProfitUSD * fxRate)}</span>
        </div>
      </div>

      {/* Detailed P&L breakdown table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
        <div className="bg-slate-50 px-5 py-3 font-bold text-slate-700 uppercase tracking-wider text-[11px] border-b border-slate-100">
          Financial Statement Breakdown
        </div>

        <div className="divide-y divide-slate-100 font-medium">
          {/* Revenue */}
          <div className="flex justify-between items-center px-5 py-3 hover:bg-slate-50/50">
            <span className="text-slate-800 font-bold">1. Gross Sales Revenue</span>
            <span className="font-bold text-slate-900">{formatUSD(grossSalesUSD)}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 pl-8 text-slate-500 bg-slate-50/20">
            <span>Less: Promotional Discounts</span>
            <span className="text-red-500">({formatUSD(discountsUSD)})</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3 bg-emerald-50/30 font-bold text-emerald-900">
            <span>Net Sales Volume</span>
            <span>{formatUSD(netSalesUSD)}</span>
          </div>

          {/* COGS */}
          <div className="flex justify-between items-center px-5 py-3 hover:bg-slate-50/50">
            <span className="text-slate-800 font-bold">2. Cost of Goods Sold (COGS)</span>
            <span className="font-bold text-slate-900">({formatUSD(estimatedCogsUSD)})</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3 bg-slate-100/50 font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <span>Gross Profit</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {grossMarginPct}%
              </span>
            </div>
            <span>{formatUSD(grossProfitUSD)}</span>
          </div>

          {/* Operating Overheads */}
          <div className="flex justify-between items-center px-5 py-3 hover:bg-slate-50/50">
            <span className="text-slate-800 font-bold">3. Total Store Operating Expenses</span>
            <span className="font-bold text-amber-700">({formatUSD(totalExpensesUSD)})</span>
          </div>
          {Object.entries(expenseCatMap).map(([cat, amount]) => (
            <div key={cat} className="flex justify-between items-center px-5 py-2 pl-8 text-slate-500">
              <span>{cat}</span>
              <span>{formatUSD(amount)}</span>
            </div>
          ))}

          {/* Bottom Line */}
          <div className="flex justify-between items-center px-5 py-4 bg-slate-900 text-white font-black text-sm">
            <div className="flex items-center gap-2">
              <span>NET OPERATING PROFIT</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                {netMarginPct}% Net
              </span>
            </div>
            <div className="text-right">
              <div>{formatUSD(netProfitUSD)}</div>
              <div className="text-[10px] text-slate-400 font-normal">{formatLRD(netProfitUSD * fxRate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Profit Margin Leaderboard (QuickBooks Class / Department P&L) */}
      <div className="border border-slate-200 rounded-3xl p-6 sm:p-7 bg-white shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                Class / Segment P&L
              </span>
              <span className="text-xs font-bold text-slate-400">QuickBooks-Grade Margin Analysis</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Category Profit Margin Leaderboard
            </h3>
            <p className="text-xs text-slate-500">
              Ranked breakdown of gross profit margins, revenue contribution, and units sold across your inventory categories.
            </p>
          </div>
        </div>

        {categoryLeaderboard.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No product categories with completed sales yet in this reporting window.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Inventory Category</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Cost (COGS)</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 w-44">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categoryLeaderboard.map((item, idx) => {
                  const isTop = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

                  return (
                    <tr key={item.category} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${
                          isTop 
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' 
                            : isSecond 
                            ? 'bg-slate-200 text-slate-800' 
                            : isThird 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.category}</div>
                        {isTop && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            ★ Top Profit Driver
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.unitsSold.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatUSD(item.revenueUSD)}</div>
                        <div className="text-[10px] text-slate-400">{formatLRD(item.revenueUSD * fxRate)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        {formatUSD(item.cogsUSD)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-emerald-700">{formatUSD(item.grossProfitUSD)}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{formatLRD(item.grossProfitUSD * fxRate)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-black text-slate-900">{item.marginPct}%</span>
                            <span className={`text-[10px] font-semibold ${
                              item.marginPct >= 35 
                                ? 'text-emerald-600' 
                                : item.marginPct >= 20 
                                ? 'text-amber-600' 
                                : 'text-slate-500'
                            }`}>
                              {item.marginPct >= 35 ? 'High Margin' : item.marginPct >= 20 ? 'Healthy' : 'Volume'}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.marginPct >= 35 
                                  ? 'bg-emerald-500' 
                                  : item.marginPct >= 20 
                                  ? 'bg-amber-500' 
                                  : 'bg-slate-400'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(5, item.marginPct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
