import React, { useState, useMemo } from 'react';
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
  Check,
  Printer,
  DollarSign,
  Coins,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { printToBluetoothThermalPrinter, buildZReportEscPos } from '../../utils/bluetoothPrinter';

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

const fmt = (val, d = 2) => {
  const n = Number(val);
  return isNaN(n) ? (0).toFixed(d) : n.toFixed(d);
};

export default function CashReconciliation({
  sales = [],
  expenses: propExpenses = 0,
  expectedCash: propExpectedCash,
  grossRevenue: propGrossRevenue,
  cashSales: propCashSales,
  deliveryCash: propDeliveryCash,
  dateLabel = 'Today'
}) {
  const [openModal, setOpenModal] = useState(false);
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
  const [btPrinting, setBtPrinting] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const { exchangeRate = 198 } = useApp();
  const { getTenantCol, currentTenant, currentStore } = useTenant();
  const { formatUSD, formatLRD } = useCurrency();

  // Safe numerical calculations from sales array
  const grossRevenue = propGrossRevenue !== undefined
    ? Number(propGrossRevenue || 0)
    : (Array.isArray(sales) ? sales.reduce((acc, s) => acc + Number(s.total || s.amountPaid || 0), 0) : 0);

  const cashSales = propCashSales !== undefined
    ? Number(propCashSales || 0)
    : (Array.isArray(sales) ? sales.filter(s => {
        const pm = (s.paymentMethod || 'cash').toLowerCase();
        return pm.includes('cash') || pm === 'cod';
      }).reduce((acc, s) => acc + Number(s.amountPaid ?? s.total ?? 0), 0) : 0);

  const momoSales = Array.isArray(sales) 
    ? sales.filter(s => {
        const pm = (s.paymentMethod || '').toLowerCase();
        return pm.includes('momo') || pm.includes('orange') || pm.includes('mobile');
      }).reduce((acc, s) => acc + Number(s.amountPaid ?? s.total ?? 0), 0)
    : 0;

  const deliveryCash = propDeliveryCash !== undefined
    ? Number(propDeliveryCash || 0)
    : (Array.isArray(sales) ? sales.filter(s => s.fulfillmentType === 'delivery' && (s.paymentMethod || '').toLowerCase().includes('cash')).reduce((acc, s) => acc + Number(s.amountPaid ?? s.total ?? 0), 0) : 0);

  const expenses = Number(propExpenses || 0);

  const expectedCash = propExpectedCash !== undefined
    ? Number(propExpectedCash || 0)
    : Math.max(0, cashSales - expenses);

  const parsedUSD = parseFloat(countedUSD) || 0;
  const parsedLRD = parseFloat(countedLRD) || 0;
  const totalCounted = parsedUSD + (parsedLRD / exchangeRate);
  const variance = totalCounted - expectedCash;
  const absVariance = Math.abs(variance);
  const hasDiscrepancy = absVariance >= 0.05;
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
    const storeName = currentTenant?.businessName || currentStore?.name || 'Retail Store';
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const auditRecord = {
      date: dateStr,
      timestamp: serverTimestamp(),
      cashierName,
      cashierEmail: currentUser?.email || '',
      expectedCashUSD: Number(fmt(expectedCash)),
      countedUSD: parsedUSD,
      countedLRD: parsedLRD,
      exchangeRateUsed: exchangeRate,
      totalCountedUSD: Number(fmt(totalCounted)),
      varianceUSD: Number(fmt(variance)),
      status: !hasDiscrepancy ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'SHORTAGE',
      discrepancyReason: cashierReasonCustom.trim() || cashierReasonPreset || 'Balanced',
      requiresManagerAuth: isLargeVariance,
      managerApproved: isLargeVariance ? managerApproved : null,
      managerName: isLargeVariance ? managerName.trim() : null,
      grossRevenue: Number(fmt(grossRevenue)),
      cashSales: Number(fmt(cashSales)),
      deliveryCash: Number(fmt(deliveryCash)),
      expenses: Number(fmt(expenses)),
    };

    try {
      if (getTenantCol) {
        await addDoc(getTenantCol('reconciliations'), auditRecord);
      }

      // Construct Executive WhatsApp Z-Report
      const waText = 
        `📊 *${storeName.toUpperCase()} — DAILY EXECUTIVE Z-REPORT*\n` +
        `📅 Date: ${dateStr}\n` +
        `👤 Cashier on Duty: ${cashierName}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Gross Sales:* $${fmt(grossRevenue)} (~L$${(grossRevenue * exchangeRate).toFixed(0)})\n` +
        `💵 *Cash In Drawer:* $${fmt(cashSales)}\n` +
        `📱 *Mobile Money (MoMo):* $${fmt(momoSales)}\n` +
        `🛵 *COD Delivery Cash:* $${fmt(deliveryCash)}\n` +
        `📉 *Store Expenses Paid:* -$${fmt(expenses)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎯 *Expected Cash:* $${fmt(expectedCash)}\n` +
        `💼 *Physical Cash Counted:* $${fmt(totalCounted)}\n` +
        `   • USD Bills: $${fmt(parsedUSD)}\n` +
        `   • LRD Bills: L$${parsedLRD.toLocaleString()} ($${fmt(parsedLRD / exchangeRate)})\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚖️ *DRAWER VARIANCE:* ${variance >= 0 ? '+' : ''}$${fmt(variance)} (${auditRecord.status})\n` +
        (hasDiscrepancy ? `📝 *Explanation:* ${auditRecord.discrepancyReason}\n` : `✅ *Status:* Perfectly Balanced\n`) +
        (isLargeVariance ? `👔 *Manager Approved:* Yes (${managerName || 'Manager'})\n` : '') +
        `\n_Generated via RetailOS Liberia · Cloud Retail Security_`;

      setResult({ ...auditRecord, waText });
    } catch (err) {
      console.error('Reconciliation notice:', err);
      // Construct result locally even if Firestore network or quota is down
      const waText = 
        `📊 *${storeName.toUpperCase()} — DAILY EXECUTIVE Z-REPORT*\n` +
        `📅 Date: ${dateStr}\n` +
        `👤 Cashier on Duty: ${cashierName}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Gross Sales:* $${fmt(grossRevenue)}\n` +
        `💵 *Cash In Drawer:* $${fmt(cashSales)}\n` +
        `🎯 *Expected Cash:* $${fmt(expectedCash)}\n` +
        `💼 *Physical Cash Counted:* $${fmt(totalCounted)}\n` +
        `⚖️ *DRAWER VARIANCE:* ${variance >= 0 ? '+' : ''}$${fmt(variance)} (${auditRecord.status})\n`;
      setResult({ ...auditRecord, waText });
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

  const handlePrintZReport = async () => {
    setBtPrinting(true);
    try {
      const zData = {
        date: new Date().toLocaleDateString('en-US'),
        cashierName: userProfile?.displayName || userProfile?.email || 'Cashier',
        totalSales: grossRevenue,
        salesCount: Array.isArray(sales) ? sales.length : 0,
        cashSales,
        momoSales,
        cardSales: 0,
        openingFloat: 0,
        countedCash: totalCounted,
        expectedCash,
        variance,
        status: !hasDiscrepancy ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'SHORTAGE',
        rate: exchangeRate
      };
      const bytes = buildZReportEscPos(zData, currentTenant?.businessName || currentStore?.name || 'RetailOS Store');
      await printToBluetoothThermalPrinter(bytes);
    } catch (e) {
      alert('Thermal printer notice: ' + (e.message || 'Printer unavailable. Connect Bluetooth 58mm printer.'));
    } finally {
      setBtPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-slate-900">Physical Cash Drawer Balancing</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Count register cash banknotes (USD & LRD), balance daily sales against physical drawer, and dispatch WhatsApp Z-reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintZReport}
              disabled={btPrinting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-300 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{btPrinting ? 'Printing...' : 'Print Z-Report 58mm'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenModal(true);
                setResult(null);
                setErrorMessage('');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Audit & WhatsApp Z-Report</span>
            </button>
          </div>
        </div>

        {/* Financial Flow Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Gross Sales</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">${fmt(grossRevenue)}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">~L$ {(grossRevenue * exchangeRate).toFixed(0)}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Cash Inflow</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">${fmt(cashSales)}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Physical Counter Sales</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block">Expenses Paid Out</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">-${fmt(expenses)}</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Petty Cash / Supplies</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">Expected Drawer Cash</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">${fmt(expectedCash)}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">~L$ {(expectedCash * exchangeRate).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Inline Physical Cash Counter Form */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span>Banknote Denomination Physical Count</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the exact physical cash counted in your cash drawer at the end of the shift.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              Counted USD Cash ($ Bills)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">$</span>
              <input
                type="number"
                step="0.01"
                value={countedUSD}
                onChange={(e) => setCountedUSD(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2.5 text-base text-slate-900 font-black focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Total sum of all USD notes ($100, $50, $20, $10, $5, $1)
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              Counted Liberian Dollars (L$ Bills)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">L$</span>
              <input
                type="number"
                value={countedLRD}
                onChange={(e) => setCountedLRD(e.target.value)}
                placeholder="0"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-base text-slate-900 font-black focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Converted @ {exchangeRate} LRD/USD = <strong className="text-slate-800">${fmt(parsedLRD / exchangeRate)} USD</strong>
            </p>
          </div>
        </div>

        {/* Live Calculated Variance Banner */}
        {(countedUSD !== '' || countedLRD !== '') && (
          <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            !hasDiscrepancy
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : variance > 0
              ? 'bg-sky-50 border-sky-300 text-sky-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Drawer Status</span>
              <span className="text-2xl font-black flex items-center gap-2 mt-0.5">
                {!hasDiscrepancy ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>BALANCED ($0.00)</span>
                  </>
                ) : variance > 0 ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-sky-600" />
                    <span>CASH SURPLUS (+${fmt(variance)})</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-6 h-6 text-rose-600" />
                    <span>CASH SHORTAGE (-${fmt(absVariance)})</span>
                  </>
                )}
              </span>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <p className="font-bold">Total Counted: <span className="font-mono text-sm">${fmt(totalCounted)}</span></p>
              <p className="text-slate-600">Expected: <span className="font-mono">${fmt(expectedCash)}</span></p>
            </div>
          </div>
        )}

        {/* Discrepancy Reason Selector */}
        {hasDiscrepancy && (
          <div className="space-y-3 bg-amber-50/70 border border-amber-200 p-5 rounded-2xl">
            <label className="block text-xs font-black text-amber-900 uppercase tracking-wider">
              Discrepancy Reason / Explanation (Required for Store Audit)
            </label>
            <select
              value={cashierReasonPreset}
              onChange={(e) => setCashierReasonPreset(e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
            >
              <option value="">Select pre-set operational reason...</option>
              {COMMON_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              type="text"
              value={cashierReasonCustom}
              onChange={(e) => setCashierReasonCustom(e.target.value)}
              placeholder="Or specify cashier notes / details..."
              className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>
        )}

        {/* Manager Approval Gatekeeper (for large variances) */}
        {isLargeVariance && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Variance Exceeds $5.00 Threshold — Store Manager Approval Required</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Store Manager Full Name"
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
              />
              <label className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={managerApproved}
                  onChange={(e) => setManagerApproved(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0 w-4 h-4"
                />
                <span>I authorize closing shift with this variance</span>
              </label>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{saving ? 'Recording Audit...' : 'Record Cash Audit & Generate Z-Report'}</span>
          </button>
        </div>
      </div>

      {/* Result Z-Report Modal */}
      <Modal
        isOpen={openModal || Boolean(result)}
        onClose={() => {
          setOpenModal(false);
          setResult(null);
        }}
        title="Executive Cash Drawer Audit & WhatsApp Z-Report"
        size="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => {
                setOpenModal(false);
                setResult(null);
              }}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-bold"
            >
              Close
            </button>

            {result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 rounded-xl border border-slate-300"
                >
                  {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copiedReport ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp Z-Report</span>
                </button>
              </div>
            )}
          </div>
        }
      >
        {result ? (
          <div className="space-y-4 font-sans">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-base font-black text-slate-900">Drawer Reconciled Successfully!</h4>
              <p className="text-xs text-emerald-800 font-medium">
                Shift status: <strong className="uppercase">{result.status}</strong> · Variance: {result.varianceUSD >= 0 ? '+' : ''}${result.varianceUSD} USD
              </p>
            </div>

            <div className="bg-slate-900 text-slate-100 border border-slate-800 p-4 rounded-2xl shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Official WhatsApp Dispatch Preview
                </span>
                <span className="text-[10px] text-slate-400">Liberia RetailOS Format</span>
              </div>
              <pre className="text-xs text-emerald-200 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {result.waText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter physical cash counted on the drawer balancing workbench and click <strong>"Record Cash Audit"</strong> to generate the executive report.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
