import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import { onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { 
  ClipboardCheck, 
  Store, 
  Warehouse, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  History, 
  Save, 
  RotateCcw
} from 'lucide-react';
import { DEFAULT_RETAIL_CATEGORIES } from '../pos/POSView';

const REASON_PRESETS = [
  'Showroom tester / display sample used',
  'Damaged / broken packaging disposed',
  'Physical count correction (previous miscount)',
  'Unrecorded showroom-storeroom transfer',
  'Expired / quality check removal',
  'Shrinkage / unrecorded stock shortage',
  'Other (specify in notes)'
];

export default function StockAuditModal({ isOpen, onClose }) {
  const { userProfile, currentUser } = useAuth();
  const { getTenantCol, getTenantDoc, tenantId } = useTenant();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('audit'); // 'audit' | 'history'
  const [auditLocation, setAuditLocation] = useState('showroom');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [auditEntries, setAuditEntries] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('products'), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return unsub;
    } catch (e) {
      console.warn('Audit products notice:', e);
      setLoading(false);
    }
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    try {
      const unsub = onSnapshot(getTenantCol('inventory_audits'), (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => (b.timestamp?.toMillis ? b.timestamp.toMillis() : 0) - (a.timestamp?.toMillis ? a.timestamp.toMillis() : 0));
        setHistoryLogs(logs);
      });
      return unsub;
    } catch (e) {
      console.warn('Audit logs notice:', e);
    }
  }, [isOpen, tenantId]);

  const handleCountChange = (productId, val) => {
    const num = val === '' ? '' : parseInt(val, 10);
    setAuditEntries(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        counted: num,
        reasonPreset: prev[productId]?.reasonPreset || REASON_PRESETS[0],
      }
    }));
  };

  const handleReasonChange = (productId, reason) => {
    setAuditEntries(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reasonPreset: reason,
      }
    }));
  };

  const variances = useMemo(() => {
    const list = [];
    products.forEach(p => {
      const entry = auditEntries[p.id];
      if (entry && entry.counted !== '' && !isNaN(entry.counted)) {
        const systemQty = auditLocation === 'showroom' ? (p.showroomQty || 0) : (p.storeroomQty || 0);
        const countedQty = parseInt(entry.counted, 10);
        const diff = countedQty - systemQty;
        if (diff !== 0) {
          list.push({
            productId: p.id,
            name: p.name,
            barcode: p.barcode,
            systemQty,
            countedQty,
            variance: diff,
            reason: entry.reasonPreset || 'Inventory audit adjustment',
          });
        }
      }
    });
    return list;
  }, [products, auditEntries, auditLocation]);

  const handleSubmitAudit = async () => {
    if (variances.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      const auditorName = userProfile?.displayName || userProfile?.email || 'Store Auditor';
      const auditPayload = {
        location: auditLocation,
        auditorName,
        auditorId: currentUser?.uid || 'kiosk',
        itemsAuditedCount: Object.keys(auditEntries).length,
        discrepancyItemsCount: variances.length,
        variances,
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US'),
      };

      await addDoc(getTenantCol('inventory_audits'), auditPayload);

      for (const it of variances) {
        const updateField = auditLocation === 'showroom' ? 'showroomQty' : 'storeroomQty';
        await updateDoc(getTenantDoc('products', it.productId), {
          [updateField]: it.countedQty,
          lastAuditedAt: serverTimestamp(),
        });
      }

      setSuccessNotice(`Successfully reconciled ${variances.length} stock discrepancies!`);
      setAuditEntries({});
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Audit submit error:', err);
      alert('Failed to save audit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Stock Cycle Count & Discrepancy Audit"
      size="5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {variances.length > 0 && (
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{variances.length} item discrepancy detected</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
            {viewMode === 'audit' && (
              <button
                type="button"
                disabled={variances.length === 0 || submitting}
                onClick={handleSubmitAudit}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Applying...' : `Reconcile ${variances.length} Discrepancies`}</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* View Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                viewMode === 'audit' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Perform Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                viewMode === 'history' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit History Log ({historyLogs.length})</span>
            </button>
          </div>

          {viewMode === 'audit' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Location:</span>
              <button
                type="button"
                onClick={() => setAuditLocation('showroom')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  auditLocation === 'showroom' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Showroom Shelves
              </button>
              <button
                type="button"
                onClick={() => setAuditLocation('storeroom')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  auditLocation === 'storeroom' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Storeroom Backroom
              </button>
            </div>
          )}
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {viewMode === 'audit' ? (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter product by name or barcode..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {DEFAULT_RETAIL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Audit Entry Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50 max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-semibold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3 text-center">System Qty</th>
                    <th className="py-2.5 px-3 text-center">Counted Qty</th>
                    <th className="py-2.5 px-3 text-center">Variance</th>
                    <th className="py-2.5 px-3">Discrepancy Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map(p => {
                    const systemQty = auditLocation === 'showroom' ? (p.showroomQty || 0) : (p.storeroomQty || 0);
                    const entry = auditEntries[p.id];
                    const countedVal = entry?.counted !== undefined ? entry.counted : '';
                    const hasCount = countedVal !== '' && !isNaN(countedVal);
                    const diff = hasCount ? (parseInt(countedVal, 10) - systemQty) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-white truncate max-w-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{p.barcode || p.id}</p>
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold text-slate-300">
                          {systemQty}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={countedVal}
                            onChange={(e) => handleCountChange(p.id, e.target.value)}
                            placeholder={String(systemQty)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-cyan-500"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center font-black">
                          {hasCount ? (
                            diff === 0 ? (
                              <span className="text-emerald-400 font-bold">✓ Match</span>
                            ) : diff > 0 ? (
                              <span className="text-cyan-400 font-bold">+{diff} Surplus</span>
                            ) : (
                              <span className="text-red-400 font-bold">{diff} Shortage</span>
                            )
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {hasCount && diff !== 0 ? (
                            <select
                              value={entry?.reasonPreset || REASON_PRESETS[0]}
                              onChange={(e) => handleReasonChange(p.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white max-w-[220px] focus:outline-none focus:border-cyan-500"
                            >
                              {REASON_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="text-slate-600 text-[10px]">No variance</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* History View */
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {historyLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No audit cycle logs recorded yet.</p>
            ) : (
              historyLogs.map(log => (
                <div key={log.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span>Audit: {log.location?.toUpperCase()}</span>
                      <span className="text-slate-400 font-normal">by {log.auditorName}</span>
                    </div>
                    <span className="text-slate-500">{log.date || 'Recent'}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {log.discrepancyItemsCount || 0} discrepancy adjustments made across {log.itemsAuditedCount || 0} items checked.
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
