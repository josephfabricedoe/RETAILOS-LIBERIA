import React, { useState, useMemo } from 'react';
import { Search, Download, Eye, FileText, ArrowUpDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { exportToCsv } from '../../utils/exportCsv';

export default function SalesInflow({ sales = [], onViewReceipt }) {
  const { formatUSD, formatLRD } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        (s.receiptNumber && s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.cashierName && s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchMethod = methodFilter === 'ALL' || s.paymentMethod === methodFilter;
      return matchSearch && matchMethod;
    }).sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      if (sortAsc) {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [sales, searchTerm, methodFilter, sortField, sortAsc]);

  const handleExport = () => {
    const dataToExport = filteredSales.map((s) => ({
      Receipt: s.receiptNumber || s.id,
      Date: s.date ? new Date(s.date).toLocaleString() : 'N/A',
      Customer: s.customerName || 'Walk-in',
      ItemsCount: Array.isArray(s.items) ? s.items.length : 1,
      PaymentMethod: s.paymentMethod || 'Cash',
      TotalUSD: s.totalUSD || s.total || 0,
      TotalLRD: s.totalLRD || 0,
      Cashier: s.cashierName || 'Staff'
    }));
    exportToCsv(dataToExport, `RetailOS_Sales_Inflow_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Sales Inflow & Transactions</h3>
          <p className="text-xs text-slate-500">Live ledger of all store purchases and payments</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt, customer, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash USD">Cash USD</option>
            <option value="Cash LRD">Cash LRD</option>
            <option value="Lonestar MTN MoMo">MTN MoMo</option>
            <option value="Orange Money">Orange Money</option>
            <option value="POS Card">Card / POS</option>
            <option value="Credit">Credit / Pay Later</option>
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Receipt #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4 text-right">Amount (USD)</th>
              <th className="py-3 px-4 text-right">Amount (LRD)</th>
              <th className="py-3 px-4 text-center">Staff</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 stroke-1 opacity-50" />
                  <p className="font-medium">No transactions found</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {s.receiptNumber || s.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {s.date ? new Date(s.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{s.customerName || 'Walk-in Customer'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {s.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatUSD(s.totalUSD || s.total || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-500">
                    {formatLRD(s.totalLRD || 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {s.cashierName || 'Staff'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {onViewReceipt && (
                      <button
                        onClick={() => onViewReceipt(s)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredSales.length} of {sales.length} transactions</span>
        <div className="font-bold text-slate-800">
          Filtered Volume: {formatUSD(filteredSales.reduce((acc, s) => acc + Number(s.totalUSD || s.total || 0), 0))}
        </div>
      </div>
    </div>
  );
}
