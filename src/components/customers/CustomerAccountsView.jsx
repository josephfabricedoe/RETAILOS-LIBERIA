import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Star, 
  CreditCard, 
  DollarSign, 
  MessageCircle, 
  CheckCircle2, 
  X,
  AlertCircle,
  History,
  TrendingUp
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import { addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

export default function CustomerAccountsView() {
  const { getTenantCol, getTenantDoc, currentStore } = useTenant();
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { docs: customers, loading } = useTenantCollection('customers');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, DEBTORS, VIPS
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    initialDebtUSD: 0
  });

  // Debt Payment Form State
  const [paymentData, setPaymentData] = useState({
    amountUSD: '',
    currency: 'USD',
    paymentMethod: 'Cash USD',
    notes: ''
  });

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    if (!matchSearch) return false;
    if (filter === 'DEBTORS') return Number(c.outstandingDebtUSD || 0) > 0;
    if (filter === 'VIPS') return Number(c.loyaltyPoints || 0) >= 100;
    return true;
  });

  // Total outstanding store debt
  const totalDebtUSD = customers.reduce((sum, c) => sum + Number(c.outstandingDebtUSD || 0), 0);
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + Number(c.loyaltyPoints || 0), 0);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    try {
      const customersCol = getTenantCol('customers');
      await addDoc(customersCol, {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim(),
        notes: newCustomer.notes.trim(),
        loyaltyPoints: 0,
        outstandingDebtUSD: parseFloat(newCustomer.initialDebtUSD || 0),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', notes: '', initialDebtUSD: 0 });
    } catch (err) {
      console.error('Failed to create customer:', err);
      alert('Error creating customer: ' + err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentData.amountUSD) return;

    const paidUSD = paymentData.currency === 'LRD'
      ? parseFloat(paymentData.amountUSD) / fxRate
      : parseFloat(paymentData.amountUSD);

    const currentDebt = Number(selectedCustomer.outstandingDebtUSD || 0);
    const newDebt = Math.max(0, currentDebt - paidUSD);

    try {
      const custDocRef = getTenantDoc('customers', selectedCustomer.id);
      await updateDoc(custDocRef, {
        outstandingDebtUSD: newDebt,
        updatedAt: Timestamp.now()
      });

      // Record repayment in sales ledger
      const salesCol = getTenantCol('sales');
      await addDoc(salesCol, {
        receiptNumber: `PAY-${Date.now().toString().slice(-6)}`,
        customerName: selectedCustomer.name,
        customerId: selectedCustomer.id,
        paymentMethod: paymentData.paymentMethod,
        totalUSD: paidUSD,
        totalLRD: paidUSD * fxRate,
        date: new Date().toISOString(),
        isDebtRepayment: true,
        notes: `Debt repayment: ${paymentData.notes || 'No memo'}`
      });

      setShowPaymentModal(false);
      setSelectedCustomer(null);
      setPaymentData({ amountUSD: '', currency: 'USD', paymentMethod: 'Cash USD', notes: '' });
    } catch (err) {
      console.error('Failed to record repayment:', err);
      alert('Error recording debt payment: ' + err.message);
    }
  };

  const handleSendWhatsAppReminder = (customer) => {
    const storeName = currentStore?.name || 'our store';
    const debt = formatUSD(customer.outstandingDebtUSD || 0);
    const debtLRD = formatLRD((customer.outstandingDebtUSD || 0) * fxRate);
    const message = `Hello ${customer.name}, friendly reminder from *${storeName}* regarding your store credit balance of *${debt}* (${debtLRD}). Please let us know when convenient to settle or send via Mobile Money. Thank you!`;
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone.startsWith('231') ? cleanPhone : '231' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Accounts & Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Store credit tabs, VIP loyalty points, and client contact directory
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Registered Accounts</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700">Total Customer Store Credit (Debt)</span>
            <p className="text-2xl font-black text-amber-900 mt-1">{formatUSD(totalDebtUSD)}</p>
            <span className="text-[11px] text-amber-600 font-semibold">{formatLRD(totalDebtUSD * fxRate)}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700">Accumulated Loyalty Points</span>
            <p className="text-2xl font-black text-emerald-900 mt-1">{totalLoyaltyPoints.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">VIP Program Active</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilter('DEBTORS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'DEBTORS' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Has Debt ({customers.filter((c) => Number(c.outstandingDebtUSD || 0) > 0).length})
          </button>
          <button
            onClick={() => setFilter('VIPS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filter === 'VIPS' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            VIP Loyalty ({customers.filter((c) => Number(c.loyaltyPoints || 0) >= 100).length})
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Phone / WhatsApp</th>
              <th className="py-3 px-4">Loyalty Points</th>
              <th className="py-3 px-4 text-right">Credit / Tab Balance</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                  No customers match this search or filter.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => {
                const debt = Number(cust.outstandingDebtUSD || 0);
                const points = Number(cust.loyaltyPoints || 0);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      {cust.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{cust.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {cust.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No phone</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className={`w-3.5 h-3.5 ${points >= 100 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        <span className="font-bold text-slate-700">{points} pts</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {debt > 0 ? (
                        <div>
                          <span className="font-bold text-red-600">{formatUSD(debt)}</span>
                          <div className="text-[10px] text-slate-400">{formatLRD(debt * fxRate)}</div>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Cleared ($0.00)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {debt > 0 && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setShowPaymentModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition"
                              title="Settle Payment"
                            >
                              Settle Tab
                            </button>
                            {cust.phone && (
                              <button
                                onClick={() => handleSendWhatsAppReminder(cust)}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">New Customer Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatu Kollie"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="e.g. 0770123456 or 0886123456"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="customer@gmail.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Credit / Debt Balance ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newCustomer.initialDebtUSD}
                  onChange={(e) => setNewCustomer({ ...newCustomer, initialDebtUSD: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Address</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Regular buyer from Sinkor, preferred pay day 15th"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Debt Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Settle Credit Tab</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-red-50 rounded-xl text-red-800 flex justify-between items-center">
                <span>Total Outstanding Credit:</span>
                <span className="font-black text-sm">{formatUSD(selectedCustomer.outstandingDebtUSD || 0)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Currency</label>
                  <select
                    value={paymentData.currency}
                    onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LRD">LRD (L$)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={paymentData.amountUSD}
                    onChange={(e) => setPaymentData({ ...paymentData, amountUSD: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Cash USD">Cash USD</option>
                  <option value="Cash LRD">Cash LRD</option>
                  <option value="Lonestar MTN MoMo">Lonestar MTN MoMo</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="POS Card">POS / Card</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Memo / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. MTN MoMo Txn # 123456"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
