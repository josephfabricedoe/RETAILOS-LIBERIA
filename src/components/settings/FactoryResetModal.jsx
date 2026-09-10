import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { getDocs, deleteDoc } from 'firebase/firestore';

export default function FactoryResetModal({ onClose }) {
  const { currentStore, getTenantCol } = useTenant();
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetName = currentStore?.name || '';
  const isMatch = confirmName.trim().toLowerCase() === targetName.trim().toLowerCase();

  const handleReset = async () => {
    if (!isMatch) return;
    setLoading(true);
    setError(null);

    try {
      // Collections to clear within this store's subcollection
      const collectionsToClear = ['sales', 'expenses', 'deliveries', 'attendance', 'campaigns'];

      for (const colName of collectionsToClear) {
        const colRef = getTenantCol(colName);
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }

      alert('Store transaction and ledger data has been reset to clean slate.');
      onClose();
    } catch (err) {
      console.error('Reset error:', err);
      setError('Reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">Store Factory Reset</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div className="p-3 bg-red-50 text-red-800 rounded-xl">
            <p className="font-semibold">Warning: Irreversible Data Deletion</p>
            <p className="mt-1 text-[11px] text-red-700">
              This will wipe all sales history, receipts, expenses, attendance logs, and delivery records for <strong>{targetName}</strong>. Your product catalog and staff roster will be preserved.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-900 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Type <span className="font-bold text-red-600">"{targetName}"</span> to confirm:
            </label>
            <input
              type="text"
              placeholder={targetName}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isMatch || loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {loading ? 'Wiping...' : 'Confirm Factory Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
