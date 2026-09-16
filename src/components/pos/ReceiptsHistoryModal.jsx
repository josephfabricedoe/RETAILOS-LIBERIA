import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import ReceiptModal from './ReceiptModal';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  Receipt,
  Search,
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Printer,
  DollarSign,
  Package,
} from 'lucide-react';

import { getPendingSales } from '../../utils/offlineSales';

export default function ReceiptsHistoryModal({ isOpen, onClose, initialFilter = 'all' }) {
  const { format } = useCurrency();
  const { getTenantCol, tenantId } = useTenant();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState(initialFilter);
  const [selectedSale, setSelectedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    setFilterTab(initialFilter);
    setLoading(true);

    const offlineList = getPendingSales(tenantId);

    try {
      const q = query(getTenantCol('sales'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }));
          const existingIds = new Set(list.map(s => s.id));
          const unmergedOffline = offlineList.filter(s => !existingIds.has(s.id));
          setSales([...unmergedOffline, ...list]);
          setLoading(false);
        },
        (err) => {
          console.warn('Error loading sales receipts:', err);
          const fallbackQ = getTenantCol('sales');
          onSnapshot(
            fallbackQ,
            (snap) => {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              const existingIds = new Set(list.map(s => s.id));
              const unmergedOffline = offlineList.filter(s => !existingIds.has(s.id));
              const combined = [...unmergedOffline, ...list];
              combined.sort((a, b) => {
                const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.queuedAt || 0);
                const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.queuedAt || 0);
                return tb - ta;
              });
              setSales(combined);
              setLoading(false);
            }
          );
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Receipt history notice:', e);
      setLoading(false);
    }
  }, [isOpen, tenantId, initialFilter]);

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (s.receiptNo || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.customerPhone || '').toLowerCase().includes(q) ||
      (s.cashierName || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterTab === 'credit') {
      return Number(s.balanceOwed || 0) > 0;
    }
    if (filterTab === 'paid') {
      return !s.balanceOwed || Number(s.balanceOwed) <= 0;
    }
    return true;
  });

  const handleOpenReceipt = (sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Receipt Archive & Audit Log" size="4xl">
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search receipt #, customer name, phone, or cashier..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                All Receipts ({sales.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('credit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'credit'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Credit Sales ({sales.filter((s) => Number(s.balanceOwed || 0) > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('paid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Fully Paid
              </button>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto max-h-[55vh]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Receipt / Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment / Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Loading receipts...</span>
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No receipts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s) => {
                      const receiptNo = s.receiptNo || s.id?.slice(-6).toUpperCase();
                      const dateStr = new Date(
                        s.timestamp?.toDate?.() || Date.now()
                      ).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      const timeStr = new Date(
                        s.timestamp?.toDate?.() || Date.now()
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isCredit = Number(s.balanceOwed || 0) > 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-900 block">#{receiptNo}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {dateStr} · {timeStr}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 block truncate max-w-[140px]">
                              {s.customerName || 'Walk-in'}
                            </span>
                            {s.customerPhone && (
                              <span className="text-[10px] text-slate-500 font-mono block">{s.customerPhone}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="text-slate-800 font-bold">
                              {(s.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)} pcs
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {(s.items || []).length} item types
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-black text-slate-900 block">{format(s.total || 0)}</span>
                            {s.discount > 0 && (
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                -${Number(s.discount).toFixed(2)} off
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {isCredit ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                  Credit (Owed: ${Number(s.balanceOwed).toFixed(2)})
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block">
                                  Paid: ${Number(s.amountPaid || 0).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                {s.paymentMethod || 'Cash'}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(s)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-emerald-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {receiptOpen && selectedSale && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
        />
      )}
    </>
  );
}
