import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTenant } from '../../contexts/TenantContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, product }) {
  const { getTenantDoc } = useTenant();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const maxQty = product.storeroomQty || 0;

  const handleTransfer = async () => {
    if (qty < 1 || qty > maxQty) {
      setError(`Transfer qty must be between 1 and ${maxQty}`);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const ref = getTenantDoc('products', product.id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('Product not found in store inventory');
        const data = snap.data();
        const newStoreroom = (data.storeroomQty || 0) - qty;
        const newShowroom = (data.showroomQty || 0) + qty;
        if (newStoreroom < 0) throw new Error('Insufficient storeroom stock');
        tx.update(ref, { storeroomQty: newStoreroom, showroomQty: newShowroom });
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer to Showroom Shelves"
      footer={
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading || maxQty === 0}
            className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            {loading ? 'Transferring...' : <><ArrowRight className="w-4 h-4" /> Confirm Transfer</>}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-slate-800/80 border border-slate-750 rounded-2xl p-3">
          <p className="font-bold text-white text-sm">{product.name}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{product.barcode || 'No barcode'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Storeroom Back Stock</p>
            <p className="text-2xl font-black text-white mt-1">{product.storeroomQty || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Showroom Shelf Stock</p>
            <p className="text-2xl font-black text-cyan-300 mt-1">{product.showroomQty || 0}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Quantity to Move to Showroom
          </label>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
          />
          {maxQty === 0 && (
            <p className="text-xs text-amber-400 mt-1 font-medium">No stock available in storeroom to transfer.</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 p-2 bg-red-950/40 rounded-xl border border-red-800/40">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
