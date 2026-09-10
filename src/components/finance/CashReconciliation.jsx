import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';

const COMMON_REASONS = [
  'Currency exchange rate fluctuation (USD / LRD conversion)',
  'Minor customer change shortage / coin unavailable',
  'Customer tip or extra cash left in drawer',
  'Unrecorded small store supply / petty cash purchase',
  'Unrecorded supplier restock cash payout',
  'Cashier change calculation error',
  'Counterfeit bill rejected / removed from drawer',
  'Other (specify below)'
];

export default function CashReconciliation({
  expectedCash,
  grossRevenue = 0,
  cashSales = 0,
  deliveryCash = 0,
  expenses = 0,
  dateLabel = 'Today'
}) {
  const [open, setOpen] = useState(false);
  const [countedUSD, setCountedUSD] = useState('');
  const [countedLRD, setCountedLRD] = useState('');
  const [cashierReasonPreset, setCashierReasonPreset] = useState('');
  const [cashierReasonCustom, setCashierReasonCustom] = useState('');
  const [managerApproved, setManagerApproved] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const { exchangeRate = 198 } = useApp();
  const { getTenantCol, currentTenant } = useTenant();
  const { format } = useCurrency();

  const totalCounted = (parseFloat(countedUSD) || 0) + ((parseFloat(countedLRD) || 0) / exchangeRate);
  const variance = totalCounted - expectedCash;
  const absVariance = Math.abs(variance);
  const hasDiscrepancy = absVariance >= 0.01;
  const isLargeVariance = absVariance >= 5.00;

  const handleSave = async () => {
    if (countedUSD === '' && countedLRD === '') {
      setErrorMessage('Please enter physical cash counted (USD or LRD).');
      return;
    }

    if (hasDiscrepancy && !cashierReasonPreset && !cashierReasonCustom.trim()) {
      setErrorMessage('Please select or specify a reason for the cash discrepancy.');
      return;
    }

    if (isLargeVariance && !managerApproved) {
      setErrorMessage('Variances of $5.00 or more require Store Manager authorization.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    const cashierName = userProfile?.displayName || userProfile?.email || 'Store Cashier';
    const storeName = currentTenant?.businessName || 'Retail Store';
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const auditRecord = {
      date: dateStr,
      timestamp: serverTimestamp(),
      cashierName,
      cashierEmail: currentUser?.email || '',
      expectedCashUSD: Number(expectedCash.toFixed(2)),
      countedUSD: parseFloat(countedUSD) || 0,
      countedLRD: parseFloat(countedLRD) || 0,
      exchangeRateUsed: exchangeRate,
      totalCountedUSD: Number(totalCounted.toFixed(2)),
      varianceUSD: Number(variance.toFixed(2)),
      status: !hasDiscrepancy ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'SHORTAGE',
      discrepancyReason: cashierReasonCustom.trim() || cashierReasonPreset || 'Balanced',
      requiresManagerAuth: isLargeVariance,
      managerApproved: isLargeVariance ? managerApproved : null,
      managerName: isLargeVariance ? managerName.trim() : null,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      cashSales: Number(cashSales.toFixed(2)),
      deliveryCash: Number(deliveryCash.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
    };

    try {
      await addDoc(getTenantCol('reconciliations'), auditRecord);

      // Construct Executive WhatsApp Z-Report
      const waText = 
        `📊 *${storeName.toUpperCase()} — DAILY EXECUTIVE Z-REPORT*\n` +
        `📅 Date: ${dateStr}\n` +
        `👤 Cashier on Duty: ${cashierName}\n` +
        `----------------------------------------\n` +
        `💰 *Gross Sales:* $${grossRevenue.toFixed(2)} (~L$${(grossRevenue * exchangeRate).toFixed(0)})\n` +
        `💵 *Cash In Drawer:* $${cashSales.toFixed(2)}\n` +
        `🛵 *COD Delivery Cash:* $${deliveryCash.toFixed(2)}\n` +
        `📉 *Store Expenses Paid:* -$${expenses.toFixed(2)}\n` +
        `----------------------------------------\n` +
        `🎯 *Expected Cash:* $${expectedCash.toFixed(2)}\n` +
        `💼 *Physical Cash Counted:* $${totalCounted.toFixed(2)}\n` +
        `   • USD Bills: $${(parseFloat(countedUSD) || 0).toFixed(2)}\n` +
        `   • LRD Bills: L$${(parseFloat(countedLRD) || 0).toLocaleString()} ($${((parseFloat(countedLRD) || 0) / exchangeRate).toFixed(2)})\n` +
        `----------------------------------------\n` +
        `⚖️ *DRAWER VARIANCE:* ${variance >= 0 ? '+' : ''}$${variance.toFixed(2)} (${auditRecord.status})\n` +
        (hasDiscrepancy ? `📝 *Explanation:* ${auditRecord.discrepancyReason}\n` : `✅ *Status:* Perfectly Balanced\n`) +
        (isLargeVariance ? `👔 *Manager Approved:* Yes (${managerName || 'Manager'})\n` : '') +
        `\n_Generated via RetailOS Liberia · Cloud Retail Security_`;

      setResult({ ...auditRecord, waText });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save reconciliation.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!result?.waText) return;
    const phone = (currentTenant?.whatsappNumber || currentTenant?.ownerPhone || '').replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(result.waText)}` : `https://wa.me/?text=${encodeURIComponent(result.waText)}`;
    window.open(url, '_blank');
  };

  const handleCopyReport = () => {
    if (!result?.waText) return;
    navigator.clipboard.writeText(result.waText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setResult(null);
          setErrorMessage('');
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
      >
        <Scale className="w-4 h-4" />
        <span>Cash Drawer Audit & Z-Report</span>
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Cash Drawer Reconciliation & WhatsApp Z-Report"
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>

            {result ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
                >
                  {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReport ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp Z-Report to Owner</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{saving ? 'Verifying...' : 'Finalize & Generate Z-Report'}</span>
              </button>
            )}
          </div>
        }
      >
        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Drawer Reconciled Successfully!</h4>
              <p className="text-xs text-emerald-300">
                Shift status: <strong className="uppercase">{result.status}</strong> · Variance: {result.varianceUSD >= 0 ? '+' : ''}${result.varianceUSD}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Preview:</h5>
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {result.waText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* System Expected Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-semibold block">Gross Revenue</span>
                <span className="text-sm font-black text-white">${grossRevenue.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-semibold block">In-Store Cash</span>
                <span className="text-sm font-black text-emerald-400">${cashSales.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-semibold block">Delivery COD Cash</span>
                <span className="text-sm font-black text-cyan-400">${deliveryCash.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-semibold block">Expected Cash</span>
                <span className="text-sm font-black text-amber-400">${expectedCash.toFixed(2)}</span>
              </div>
            </div>

            {/* Cash Counts Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Counted USD Cash ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={countedUSD}
                    onChange={(e) => setCountedUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Counted LRD Cash (L$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">L$</span>
                  <input
                    type="number"
                    value={countedLRD}
                    onChange={(e) => setCountedLRD(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Converted @ {exchangeRate} LRD/USD = ${((parseFloat(countedLRD) || 0) / exchangeRate).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Live Variance Badge */}
            {(countedUSD !== '' || countedLRD !== '') && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                !hasDiscrepancy
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : variance > 0
                  ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Calculated Variance</span>
                  <span className="text-xl font-black">
                    {variance >= 0 ? '+' : ''}${variance.toFixed(2)} ({!hasDiscrepancy ? 'BALANCED' : variance > 0 ? 'CASH SURPLUS' : 'CASH SHORTAGE'})
                  </span>
                </div>
                <div className="text-right text-xs">
                  <p>Total Counted: <strong>${totalCounted.toFixed(2)}</strong></p>
                  <p className="text-slate-400 text-[10px]">Expected: ${expectedCash.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Discrepancy Reason */}
            {hasDiscrepancy && (
              <div className="space-y-2 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Discrepancy Explanation (Required)
                </label>
                <select
                  value={cashierReasonPreset}
                  onChange={(e) => setCashierReasonPreset(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select pre-set operational reason...</option>
                  {COMMON_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="text"
                  value={cashierReasonCustom}
                  onChange={(e) => setCashierReasonCustom(e.target.value)}
                  placeholder="Or write specific notes / explanation..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Manager Approval Gatekeeper (over $5 variance) */}
            {isLargeVariance && (
              <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Variance Over $5.00 Threshold — Store Manager Authorization Required</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Store Manager Full Name"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <label className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={managerApproved}
                      onChange={(e) => setManagerApproved(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    <span>I authorize closing shift with this variance</span>
                  </label>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
