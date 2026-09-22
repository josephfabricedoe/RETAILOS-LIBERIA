import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Trash2, 
  Search, 
  Check, 
  FileText,
  CreditCard
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import { addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function SupplierBillsView() {
  const { getTenantCol, getTenantDoc, currentStore } = useTenant();
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { docs: bills = [], loading } = useTenantCollection('bills');

  const [filter, setFilter] = useState('ALL'); // ALL, UNPAID, DUE_SOON, OVERDUE, PAID
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [payModalBill, setPayModalBill] = useState(null);
  const [payMethod, setPayMethod] = useState('Cash USD');

  // Form State
  const [form, setForm] = useState({
    supplierName: '',
    invoiceNumber: '',
    category: 'Inventory Restock',
    amount: '',
    currency: 'USD',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: ''
  });

  const getBillDueStatus = (bill) => {
    if (bill.status === 'paid') return { status: 'paid', label: 'Paid in Full', color: 'emerald', days: 0 };
    if (!bill.dueDate) return { status: 'unpaid', label: 'Unpaid', color: 'slate', days: 0 };

    const dueTime = new Date(bill.dueDate + 'T23:59:59').getTime();
    const nowTime = Date.now();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'overdue', 
        label: `${Math.abs(diffDays)} Days Overdue`, 
        color: 'rose', 
        days: diffDays,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' 
      };
    } else if (diffDays <= 7) {
      return { 
        status: 'due_soon', 
        label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, 
        color: 'amber', 
        days: diffDays,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' 
      };
    } else {
      return { 
        status: 'current', 
        label: `Due in ${diffDays} days`, 
        color: 'blue', 
        days: diffDays,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' 
      };
    }
  };

  // Metrics
  const summary = bills.reduce((acc, b) => {
    const amtUSD = b.currency === 'LRD' ? (Number(b.amount || 0) / fxRate) : Number(b.amount || 0);
    const dueInfo = getBillDueStatus(b);

    if (b.status === 'paid') {
      acc.paidUSD += amtUSD;
      acc.paidCount += 1;
    } else {
      acc.unpaidUSD += amtUSD;
      acc.unpaidCount += 1;

      if (dueInfo.status === 'overdue') {
        acc.overdueUSD += amtUSD;
        acc.overdueCount += 1;
      } else if (dueInfo.status === 'due_soon') {
        acc.dueSoonUSD += amtUSD;
        acc.dueSoonCount += 1;
      }
    }
    return acc;
  }, { unpaidUSD: 0, unpaidCount: 0, overdueUSD: 0, overdueCount: 0, dueSoonUSD: 0, dueSoonCount: 0, paidUSD: 0, paidCount: 0 });

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      (b.supplierName && b.supplierName.toLowerCase().includes(search.toLowerCase())) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    const dueInfo = getBillDueStatus(b);

    if (filter === 'UNPAID') return b.status !== 'paid';
    if (filter === 'DUE_SOON') return b.status !== 'paid' && dueInfo.status === 'due_soon';
    if (filter === 'OVERDUE') return b.status !== 'paid' && dueInfo.status === 'overdue';
    if (filter === 'PAID') return b.status === 'paid';
    return true;
  });

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!form.supplierName.trim() || !form.amount || isNaN(Number(form.amount))) {
      alert('Please fill out supplier name and a valid amount.');
      return;
    }

    try {
      const billsCol = getTenantCol('bills');
      await addDoc(billsCol, {
        supplierName: form.supplierName.trim(),
        invoiceNumber: form.invoiceNumber.trim() || `BILL-${Date.now().toString().slice(-6)}`,
        category: form.category,
        amount: parseFloat(form.amount),
        currency: form.currency,
        dueDate: form.dueDate,
        notes: form.notes.trim(),
        status: 'unpaid',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      setShowAddModal(false);
      setForm({
        supplierName: '',
        invoiceNumber: '',
        category: 'Inventory Restock',
        amount: '',
        currency: 'USD',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        notes: ''
      });
    } catch (err) {
      console.error('Error creating bill:', err);
      alert('Failed to save supplier bill: ' + err.message);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!payModalBill) return;

    try {
      const billRef = getTenantDoc('bills', payModalBill.id);
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod: payMethod,
        updatedAt: Timestamp.now()
      });

      // Optionally record an expense voucher into expenses so cash/drawer reconciles
      try {
        const expensesCol = getTenantCol('expenses');
        await addDoc(expensesCol, {
          category: 'Supplier Cash Payout',
          amount: parseFloat(payModalBill.amount),
          currency: payModalBill.currency || 'USD',
          notes: `Paid Supplier Bill #${payModalBill.invoiceNumber || payModalBill.id} to ${payModalBill.supplierName}`,
          paymentMethod: payMethod,
          billId: payModalBill.id,
          date: new Date().toISOString().slice(0, 10),
          createdAt: Timestamp.now()
        });
      } catch (expErr) {
        console.warn('Expense voucher linking optional notice:', expErr);
      }

      setPayModalBill(null);
    } catch (err) {
      console.error('Error settling bill:', err);
      alert('Failed to settle bill: ' + err.message);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier bill?')) return;
    try {
      const billRef = getTenantDoc('bills', id);
      await deleteDoc(billRef);
    } catch (err) {
      console.error('Error deleting bill:', err);
      alert('Failed to delete bill: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              Accounts Payable (A/P)
            </span>
            <span className="text-xs text-slate-400 font-semibold">Vendor Obligations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Supplier Bills & Payables Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Track unpaid vendor invoices, upcoming due dates, and synchronize payouts with your store ledger.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier Bill</span>
        </button>
      </div>

      {/* A/P Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter(filter === 'UNPAID' ? 'ALL' : 'UNPAID')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filter === 'UNPAID' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${filter === 'UNPAID' ? 'text-slate-300' : 'text-slate-500'}`}>
              Total Outstanding A/P
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${filter === 'UNPAID' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {summary.unpaidCount} bills
            </span>
          </div>
          <p className={`text-xl font-black mt-2 ${filter === 'UNPAID' ? 'text-white' : 'text-slate-900'}`}>
            {formatUSD(summary.unpaidUSD)}
          </p>
          <span className={`text-[11px] ${filter === 'UNPAID' ? 'text-slate-400' : 'text-slate-500'}`}>
            {formatLRD(summary.unpaidUSD * fxRate)}
          </span>
        </div>

        <div 
          onClick={() => setFilter(filter === 'DUE_SOON' ? 'ALL' : 'DUE_SOON')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filter === 'DUE_SOON' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${filter === 'DUE_SOON' ? 'text-amber-100' : 'text-amber-800'}`}>
              Due Next 7 Days
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${filter === 'DUE_SOON' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {summary.dueSoonCount}
            </span>
          </div>
          <p className={`text-xl font-black mt-2 ${filter === 'DUE_SOON' ? 'text-white' : 'text-amber-900'}`}>
            {formatUSD(summary.dueSoonUSD)}
          </p>
          <span className={`text-[11px] ${filter === 'DUE_SOON' ? 'text-amber-100' : 'text-amber-700'}`}>
            {formatLRD(summary.dueSoonUSD * fxRate)}
          </span>
        </div>

        <div 
          onClick={() => setFilter(filter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filter === 'OVERDUE' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${filter === 'OVERDUE' ? 'text-rose-100' : 'text-rose-800'}`}>
              Overdue Bills
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${filter === 'OVERDUE' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {summary.overdueCount}
            </span>
          </div>
          <p className={`text-xl font-black mt-2 ${filter === 'OVERDUE' ? 'text-white' : 'text-rose-900'}`}>
            {formatUSD(summary.overdueUSD)}
          </p>
          <span className={`text-[11px] ${filter === 'OVERDUE' ? 'text-rose-100' : 'text-rose-700'}`}>
            {formatLRD(summary.overdueUSD * fxRate)}
          </span>
        </div>

        <div 
          onClick={() => setFilter(filter === 'PAID' ? 'ALL' : 'PAID')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filter === 'PAID' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${filter === 'PAID' ? 'text-emerald-100' : 'text-emerald-800'}`}>
              Settled Bills (Paid)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${filter === 'PAID' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {summary.paidCount}
            </span>
          </div>
          <p className={`text-xl font-black mt-2 ${filter === 'PAID' ? 'text-white' : 'text-emerald-900'}`}>
            {formatUSD(summary.paidUSD)}
          </p>
          <span className={`text-[11px] ${filter === 'PAID' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            {formatLRD(summary.paidUSD * fxRate)}
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bills by supplier or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({bills.length})
          </button>
          <button
            onClick={() => setFilter('UNPAID')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'UNPAID' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Unpaid ({summary.unpaidCount})
          </button>
          <button
            onClick={() => setFilter('DUE_SOON')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'DUE_SOON' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Due Soon ({summary.dueSoonCount})
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'OVERDUE' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Overdue ({summary.overdueCount})
          </button>
          <button
            onClick={() => setFilter('PAID')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Paid ({summary.paidCount})
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No supplier bills found in this view.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const dueInfo = getBillDueStatus(bill);
                  const isPaid = bill.status === 'paid';
                  const amountUSD = bill.currency === 'LRD' ? (Number(bill.amount) / fxRate) : Number(bill.amount);

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{bill.supplierName}</div>
                        {bill.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{bill.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {bill.invoiceNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {bill.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${dueInfo.badgeClass}`}>
                            {dueInfo.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {dueInfo.status === 'due_soon' && <Clock className="w-3 h-3 text-amber-600" />}
                            {dueInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {bill.currency === 'LRD' ? `L$ ${Number(bill.amount).toLocaleString()}` : `$${Number(bill.amount).toFixed(2)}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {bill.currency === 'LRD' ? `$${amountUSD.toFixed(2)} USD` : formatLRD(amountUSD * fxRate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => setPayModalBill(bill)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition"
                              title="Mark as Paid"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Supplier Bill (Payable)</h3>
            <p className="text-xs text-slate-500">Record a new invoice or payment due to an inventory supplier.</p>

            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Supplier / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monrovia Beverage Wholesalers"
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    placeholder="e.g., INV-8921"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Inventory Restock">Inventory Restock</option>
                    <option value="Transport / Logistics">Transport / Logistics</option>
                    <option value="Generator Fuel">Generator Fuel</option>
                    <option value="Store Rent">Store Rent</option>
                    <option value="Packaging & Bags">Packaging & Bags</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount Due *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LRD">LRD (L$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Memo / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Payable net 15 days upon container arrival"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Bill Modal */}
      {payModalBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Settle Supplier Bill</h3>
            <p className="text-xs text-slate-500">
              Confirm payout of <strong className="text-slate-900">{payModalBill.currency === 'LRD' ? `L$ ${Number(payModalBill.amount).toLocaleString()}` : `$${Number(payModalBill.amount).toFixed(2)}`}</strong> to <strong className="text-slate-900">{payModalBill.supplierName}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursement Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white font-bold"
                >
                  <option value="Cash USD">Cash USD</option>
                  <option value="Cash LRD">Cash LRD</option>
                  <option value="Lonestar MoMo">Lonestar Cell MTN MoMo</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Bank Transfer">Bank Wire / Check</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-medium border border-emerald-200">
                This payout will automatically record an expense voucher under your store operating expenses for accurate net cash reconciliation.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalBill(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsPaid}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Confirm Settle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
