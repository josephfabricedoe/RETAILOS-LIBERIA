import React, { useState, useEffect } from 'react';
import { onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import SupplierModal from './SupplierModal';
import RestockOrderModal from './RestockOrderModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Clock, 
  Phone, 
  MapPin, 
  PackageCheck, 
  Boxes, 
  Ship, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Truck
} from 'lucide-react';

export default function SuppliersView() {
  const { getTenantCol, getTenantDoc, tenantId } = useTenant();
  const { format } = useCurrency();

  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pipeline'); // 'pipeline' | 'directory'

  const [searchQuery, setSearchQuery] = useState('');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedSupplierForRestock, setSelectedSupplierForRestock] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    try {
      const unsubS = onSnapshot(getTenantCol('suppliers'), snap => {
        setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      const unsubO = onSnapshot(getTenantCol('restockOrders'), snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
        setOrders(list);
      });
      const unsubP = onSnapshot(getTenantCol('products'), snap => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubS(); unsubO(); unsubP(); };
    } catch (e) {
      console.warn('Suppliers sync notice:', e);
      setLoading(false);
    }
  }, [tenantId]);

  // Mark PO as received and increment storeroom stock!
  const handleMarkReceived = async (order) => {
    if (!window.confirm(`Confirm receipt of PO #${order.poNumber}? This will automatically add quantities to storeroom inventory.`)) return;

    try {
      await updateDoc(getTenantDoc('restockOrders', order.id), {
        status: 'received',
        receivedAt: new Date().toISOString(),
      });

      for (const item of (order.items || [])) {
        if (item.productId) {
          try {
            await updateDoc(getTenantDoc('products', item.productId), {
              storeroomQty: increment(item.quantity || 0),
            });
          } catch (pErr) {
            console.warn('Product stock increment notice:', pErr);
          }
        }
      }

      alert(`PO #${order.poNumber} marked as received! Storeroom inventory updated.`);
    } catch (err) {
      alert('Failed to mark received: ' + err.message);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.country || '').toLowerCase().includes(q);
  });

  const pendingOrders = orders.filter(o => o.status !== 'received');
  const receivedOrders = orders.filter(o => o.status === 'received');

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'pipeline' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Transit Restock Pipeline ({pendingOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'directory' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Supplier Directory ({suppliers.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSupplierForRestock(null);
              setRestockModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditSupplier(null);
              setSupplierModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {tab === 'pipeline' ? (
        <div className="space-y-4">
          {/* Active Transit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500">
                <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold text-slate-400">No active restock orders in transit</p>
                <p className="text-xs text-slate-600 mt-1">Create a purchase order when products are running low.</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-cyan-300">
                        #{order.poNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Lead: ~{order.leadTimeWeeks || 2} wks</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-base">{order.supplierName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ordered on: {order.date}</p>
                    </div>

                    <div className="border-t border-slate-800 pt-2.5 space-y-1 text-xs">
                      {(order.items || []).slice(0, 3).map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span className="truncate pr-2">{it.name}</span>
                          <span className="font-mono text-slate-400 whitespace-nowrap">x{it.quantity}</span>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <p className="text-[10px] text-slate-500">
                          +{order.items.length - 3} more items in this bundle
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Cost</span>
                      <span className="text-sm font-black text-white">${Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkReceived(order)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Receive Stock</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Supplier Directory Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..."
                className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vendor & Origin</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4">
                      <h4 className="font-bold text-white text-xs">{s.name}</h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{s.country || 'Liberia (Local)'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <p>{s.contactPerson || '—'}</p>
                      <p className="text-[10px] text-slate-500">{s.phone || 'No phone'}</p>
                    </td>

                    <td className="py-3 px-4 font-bold text-amber-400">
                      ~{s.transitLeadWeeks || 1} weeks
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {s.terms || 'Cash on Delivery'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierForRestock(s);
                            setRestockModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold"
                        >
                          Order Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditSupplier(s);
                            setSupplierModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {supplierModalOpen && (
        <SupplierModal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          editSupplier={editSupplier}
        />
      )}

      {restockModalOpen && (
        <RestockOrderModal
          isOpen={restockModalOpen}
          onClose={() => setRestockModalOpen(false)}
          supplier={selectedSupplierForRestock}
        />
      )}
    </div>
  );
}
