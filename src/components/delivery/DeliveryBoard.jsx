import React, { useState } from 'react';
import { 
  Bike, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Share2, 
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import { addDoc, updateDoc, Timestamp } from 'firebase/firestore';

export default function DeliveryBoard() {
  const { getTenantCol, getTenantDoc, currentStore } = useTenant();
  const { formatUSD, formatLRD } = useCurrency();
  const { docs: deliveries, loading } = useTenantCollection('deliveries');
  const { docs: staffMembers } = useTenantCollection('staff');

  const riders = staffMembers.filter((s) => s.role === 'delivery' || s.role === 'cashier');

  const [filter, setFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    orderTotalUSD: '',
    deliveryFeeUSD: '2.00',
    riderName: '',
    riderPhone: '',
    notes: '',
    status: 'PENDING'
  });

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!newDelivery.customerName.trim() || !newDelivery.deliveryAddress.trim()) return;

    try {
      const deliveriesCol = getTenantCol('deliveries');
      await addDoc(deliveriesCol, {
        ...newDelivery,
        orderTotalUSD: parseFloat(newDelivery.orderTotalUSD || 0),
        deliveryFeeUSD: parseFloat(newDelivery.deliveryFeeUSD || 0),
        createdAt: Timestamp.now(),
        dispatchedAt: null,
        deliveredAt: null
      });

      setShowNewModal(false);
      setNewDelivery({
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        orderTotalUSD: '',
        deliveryFeeUSD: '2.00',
        riderName: '',
        riderPhone: '',
        notes: '',
        status: 'PENDING'
      });
    } catch (err) {
      alert('Error scheduling delivery: ' + err.message);
    }
  };

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    try {
      const docRef = getTenantDoc('deliveries', deliveryId);
      const updates = { status: newStatus };
      if (newStatus === 'DISPATCHED') updates.dispatchedAt = Timestamp.now();
      if (newStatus === 'DELIVERED') updates.deliveredAt = Timestamp.now();
      await updateDoc(docRef, updates);
    } catch (err) {
      alert('Error updating delivery: ' + err.message);
    }
  };

  const handleWhatsAppRider = (item) => {
    const text = `🛵 *DELIVERY DISPATCH - ${currentStore?.name || 'Retail Store'}*
👤 *Customer:* ${item.customerName}
📞 *Phone:* ${item.customerPhone}
📍 *Delivery Landmark:* ${item.deliveryAddress}
💵 *Order Total to Collect:* ${formatUSD(item.orderTotalUSD || 0)}
🛵 *Delivery Fee:* ${formatUSD(item.deliveryFeeUSD || 0)}
📝 *Notes:* ${item.notes || 'None'}

Please confirm when en route and when delivered safely!`;

    const riderPhone = (item.riderPhone || '').replace(/[^0-9]/g, '');
    const url = riderPhone
      ? `https://wa.me/${riderPhone.startsWith('231') ? riderPhone : '231' + riderPhone.replace(/^0/, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filtered = deliveries.filter((d) => {
    if (filter === 'ALL') return true;
    return d.status === filter;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery & Keh-Keh Dispatch</h1>
          <p className="text-xs text-slate-500 mt-1">
            Coordinate bike deliveries, track customer drop-offs, and dispatch riders via WhatsApp
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          New Delivery Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {['ALL', 'PENDING', 'DISPATCHED', 'DELIVERED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              filter === st
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {st === 'ALL' ? 'All Deliveries' : st.charAt(0) + st.slice(1).toLowerCase()} (
            {st === 'ALL' ? deliveries.length : deliveries.filter((d) => d.status === st).length})
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
            <Bike className="w-12 h-12 mx-auto mb-2 opacity-50 stroke-1" />
            <p className="font-semibold text-sm">No delivery orders in this status</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isPending = item.status === 'PENDING';
            const isDispatched = item.status === 'DISPATCHED';
            const isDelivered = item.status === 'DELIVERED';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700'
                            : isDispatched
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-2">{item.customerName}</h3>
                    </div>

                    <span className="font-black text-slate-900 text-sm">
                      {formatUSD(item.orderTotalUSD || 0)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-800">{item.deliveryAddress}</span>
                    </div>

                    {item.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono">{item.customerPhone}</span>
                      </div>
                    )}

                    {item.riderName && (
                      <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-xl">
                        <Bike className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Rider: <strong>{item.riderName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleWhatsAppRider(item)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Send Details via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'DISPATCHED')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        Dispatch <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isDispatched && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'DELIVERED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        Delivered <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isDelivered && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Delivery Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">New Delivery Task</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Doe"
                  value={newDelivery.customerName}
                  onChange={(e) => setNewDelivery({ ...newDelivery, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  placeholder="0770123456"
                  value={newDelivery.customerPhone}
                  onChange={(e) => setNewDelivery({ ...newDelivery, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address / Landmark *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. 15th Street Sinkor, opposite Total Gas Station"
                  value={newDelivery.deliveryAddress}
                  onChange={(e) => setNewDelivery({ ...newDelivery, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={newDelivery.orderTotalUSD}
                    onChange={(e) => setNewDelivery({ ...newDelivery, orderTotalUSD: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2.00"
                    value={newDelivery.deliveryFeeUSD}
                    onChange={(e) => setNewDelivery({ ...newDelivery, deliveryFeeUSD: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Rider</label>
                  <select
                    value={newDelivery.riderName}
                    onChange={(e) => {
                      const selected = riders.find((r) => r.name === e.target.value);
                      setNewDelivery({
                        ...newDelivery,
                        riderName: e.target.value,
                        riderPhone: selected?.phone || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Rider / Bike</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.name}>{r.name} ({r.role})</option>
                    ))}
                    <option value="External Keh-Keh">External Keh-Keh</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rider Phone</label>
                  <input
                    type="text"
                    placeholder="0770000000"
                    value={newDelivery.riderPhone}
                    onChange={(e) => setNewDelivery({ ...newDelivery, riderPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
