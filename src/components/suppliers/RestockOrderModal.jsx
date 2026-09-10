import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { addDoc, updateDoc, increment, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { 
  PackageCheck, 
  Send, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  DollarSign,
  Share2,
  X,
  Boxes,
  Phone
} from 'lucide-react';

const TRADE_HUBS = [
  { id: 'dubai', name: 'Dubai, UAE', leadTime: '3-5 weeks' },
  { id: 'china', name: 'Guangzhou / Yiwu, China', leadTime: '4-6 weeks' },
  { id: 'nigeria', name: 'Lagos, Nigeria', leadTime: '1-2 weeks' },
  { id: 'ghana', name: 'Accra, Ghana', leadTime: '1-2 weeks' },
  { id: 'ivory_coast', name: 'Abidjan, Ivory Coast', leadTime: '1-2 weeks' },
  { id: 'liberia', name: 'Monrovia, Liberia (Local)', leadTime: '1-2 days' },
];

export default function RestockOrderModal({
  isOpen,
  onClose,
  supplier = null,
  targetProduct = null,
}) {
  const { format } = useCurrency();
  const { currentUser, userProfile } = useAuth();
  const { getTenantCol, getTenantDoc, tenantId, currentTenant } = useTenant();

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(supplier?.id || '');
  const [orderItems, setOrderItems] = useState([]);
  const [paymentSource, setPaymentSource] = useState('cash_drawer');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    try {
      const unsubP = onSnapshot(getTenantCol('products'), snap => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubS = onSnapshot(getTenantCol('suppliers'), snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSuppliers(list);
        if (!selectedSupplierId && list.length > 0) {
          setSelectedSupplierId(supplier?.id || list[0].id);
        }
      });
      return () => { unsubP(); unsubS(); };
    } catch (e) {
      console.warn('Restock sync notice:', e);
    }
  }, [isOpen, tenantId, supplier]);

  useEffect(() => {
    if (targetProduct) {
      setOrderItems([{
        productId: targetProduct.id,
        name: targetProduct.name,
        costPrice: targetProduct.costPrice || 0,
        quantity: 12,
        total: (targetProduct.costPrice || 0) * 12,
      }]);
      if (targetProduct.supplierId) {
        setSelectedSupplierId(targetProduct.supplierId);
      }
    }
  }, [targetProduct]);

  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId) || supplier;

  const handleAddItem = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setOrderItems(prev => {
      if (prev.some(it => it.productId === prod.id)) return prev;
      const cost = prod.costPrice || 0;
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        costPrice: cost,
        quantity: 12,
        total: cost * 12,
      }];
    });
  };

  const updateItem = (idx, field, val) => {
    setOrderItems(prev => {
      const copy = [...prev];
      const it = { ...copy[idx], [field]: val };
      it.total = (Number(it.costPrice) || 0) * (Number(it.quantity) || 0);
      copy[idx] = it;
      return copy;
    });
  };

  const removeItem = (idx) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalOrderAmount = orderItems.reduce((sum, it) => sum + (it.total || 0), 0);

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      const orderPayload = {
        poNumber,
        supplierId: selectedSupplierId || null,
        supplierName: activeSupplier?.name || 'Unassigned Supplier',
        items: orderItems,
        totalAmount: totalOrderAmount,
        paymentSource,
        notes,
        status: 'pending', // 'pending' | 'in_transit' | 'received'
        leadTimeWeeks: activeSupplier?.transitLeadWeeks || 2,
        createdBy: userProfile?.displayName || userProfile?.email || 'Store Owner',
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US'),
      };

      const docRef = await addDoc(getTenantCol('restockOrders'), orderPayload);

      // If paid from cash drawer, also log an operating expense
      if (paymentSource === 'cash_drawer' && totalOrderAmount > 0) {
        await addDoc(getTenantCol('expenses'), {
          category: 'Supplier Restock PO',
          amount: totalOrderAmount,
          currency: 'USD',
          notes: `Restock Order #${poNumber} from ${orderPayload.supplierName}`,
          date: new Date().toISOString().slice(0, 10),
          recordedBy: userProfile?.displayName || userProfile?.email || 'Owner',
          timestamp: serverTimestamp(),
        });
      }

      setCompletedOrder({ id: docRef.id, ...orderPayload });
    } catch (err) {
      console.error(err);
      alert('Failed to submit restock order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsAppPO = () => {
    if (!completedOrder) return;
    const storeName = currentTenant?.businessName || 'Retail Store';
    const itemsList = completedOrder.items.map(it => `• ${it.name} x${it.quantity} @ $${Number(it.costPrice).toFixed(2)} = $${Number(it.total).toFixed(2)}`).join('\n');
    const text = 
      `📦 *PURCHASE ORDER #${completedOrder.poNumber}*\n` +
      `🏪 Store: *${storeName}* (Monrovia, Liberia)\n` +
      `🏢 Vendor: ${completedOrder.supplierName}\n` +
      `📅 Date: ${completedOrder.date}\n\n` +
      `*Items Requested:*\n${itemsList}\n\n` +
      `💰 *TOTAL PO VALUE:* $${Number(completedOrder.totalAmount).toFixed(2)}\n\n` +
      `Please confirm stock availability and shipping schedule. Thank you!`;

    const cleanPhone = (activeSupplier?.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={completedOrder ? `PO #${completedOrder.poNumber} Generated` : 'Create Restock Purchase Order'}
      size="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            {completedOrder ? 'Done' : 'Cancel'}
          </button>

          {completedOrder ? (
            <button
              type="button"
              onClick={handleShareWhatsAppPO}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Send PO to Supplier on WhatsApp</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={orderItems.length === 0 || submitting}
              onClick={handleSubmitOrder}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Generating PO...' : `Confirm PO ($${totalOrderAmount.toFixed(2)})`}</span>
            </button>
          )}
        </div>
      }
    >
      {completedOrder ? (
        <div className="py-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white">Purchase Order Successfully Created</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            PO #{completedOrder.poNumber} for <strong className="text-white">{completedOrder.supplierName}</strong> ($ {Number(completedOrder.totalAmount).toFixed(2)}) is now logged in your procurement pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Supplier Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Supplier / Vendor
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.country || 'Local'}) · ~{s.transitLeadWeeks || 1}wks lead
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Funding / Payment Source
              </label>
              <select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="cash_drawer">Register Cash Drawer (Auto-deducted from shift)</option>
                <option value="momo">Mobile Money (Lonestar MTN / Orange Money)</option>
                <option value="bank_transfer">Bank Wire / FX Bureau</option>
                <option value="credit">On Terms / Pay on Arrival (COD)</option>
              </select>
            </div>
          </div>

          {/* Add Product dropdown */}
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">+ Add Product to Restock Bundle...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [Shelf: {p.showroomQty || 0} | Back: {p.storeroomQty || 0}]
                </option>
              ))}
            </select>
          </div>

          {/* Order Items Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 w-28">Cost Price ($)</th>
                  <th className="py-2.5 px-3 w-24">Order Qty</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-bold text-white truncate max-w-xs">{item.name}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.costPrice}
                        onChange={(e) => updateItem(idx, 'costPrice', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs text-center"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-black text-cyan-300">
                      ${Number(item.total).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orderItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      Select items above to add to this restock purchase order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Purchase Order Cost:</span>
            <span className="text-lg font-black text-white">${totalOrderAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
