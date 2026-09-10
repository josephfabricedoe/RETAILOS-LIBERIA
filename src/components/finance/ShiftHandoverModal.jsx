import React, { useState } from 'react';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../contexts/AppContext';
import { useTenant } from '../../contexts/TenantContext';
import { useCurrency } from '../../hooks/useCurrency';
import Modal from '../shared/Modal';
import { 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Bluetooth, 
  Lock,
  Unlock
} from 'lucide-react';
import { printToBluetoothThermalPrinter, buildZReportEscPos } from '../../utils/bluetoothPrinter';

export default function ShiftHandoverModal({ isOpen, onClose, sales = [], expenses = [] }) {
  const { currentUser, userProfile } = useAuth();
  const { exchangeRate, storeSettings } = useApp();
  const { getTenantCol, currentTenant } = useTenant();
  const { format } = useCurrency();

  const [openingFloatUSD, setOpeningFloatUSD] = useState('0');
  const [countedCashUSD, setCountedCashUSD] = useState('');
  const [countedCashLRD, setCountedCashLRD] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [btStatus, setBtStatus] = useState('idle');

  const grossSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const cashSales = sales.filter(s => (s.paymentMethod || 'Cash').toLowerCase().includes('cash')).reduce((sum, s) => sum + (s.total || 0), 0);
  const momoSales = sales.filter(s => (s.paymentMethod || '').toLowerCase().includes('momo') || (s.paymentMethod || '').toLowerCase().includes('mobile')).reduce((sum, s) => sum + (s.total || 0), 0);
  const cardSales = sales.filter(s => (s.paymentMethod || '').toLowerCase().includes('card')).reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const float = parseFloat(openingFloatUSD) || 0;
  const expectedCash = float + cashSales - totalExpenses;
  const rate = exchangeRate || 198;
  const totalCounted = (parseFloat(countedCashUSD) || 0) + ((parseFloat(countedCashLRD) || 0) / rate);
  const variance = totalCounted - expectedCash;

  const handlePrintZReport = async () => {
    setBtStatus('printing');
    try {
      const zData = {
        date: new Date().toLocaleDateString('en-US'),
        cashierName: userProfile?.displayName || userProfile?.email || 'Cashier',
        totalSales: grossSales,
        salesCount: sales.length,
        cashSales,
        momoSales,
        cardSales,
        openingFloat: float,
        countedCash: totalCounted,
        expectedCash,
        variance,
        status: Math.abs(variance) < 0.05 ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'SHORTAGE',
      };

      const escPos = buildZReportEscPos(zData, currentTenant || storeSettings);
      await printToBluetoothThermalPrinter(escPos);
      setBtStatus('success');
      setTimeout(() => setBtStatus('idle'), 3000);
    } catch (e) {
      alert(e.message || 'Bluetooth printer error');
      setBtStatus('error');
    }
  };

  const handleSaveShift = async () => {
    setSaving(true);
    try {
      const cashierName = userProfile?.displayName || userProfile?.email || 'Cashier';
      const handoverData = {
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US'),
        cashierName,
        cashierId: currentUser?.uid || 'kiosk',
        openingFloatUSD: float,
        countedCashUSD: parseFloat(countedCashUSD) || 0,
        countedCashLRD: parseFloat(countedCashLRD) || 0,
        totalCountedUSD: Number(totalCounted.toFixed(2)),
        expectedCashUSD: Number(expectedCash.toFixed(2)),
        varianceUSD: Number(variance.toFixed(2)),
        grossSales: Number(grossSales.toFixed(2)),
        salesCount: sales.length,
        cashSales: Number(cashSales.toFixed(2)),
        momoSales: Number(momoSales.toFixed(2)),
        expenses: Number(totalExpenses.toFixed(2)),
        notes,
      };

      await addDoc(getTenantCol('shiftHandovers'), handoverData);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      alert('Failed to save shift handover: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Register Shift Handover & Z-Report"
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintZReport}
              disabled={btStatus === 'printing'}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold border border-slate-700"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{btStatus === 'printing' ? 'Printing...' : 'Print Z-Report 58mm'}</span>
            </button>
            <button
              type="button"
              disabled={saving || savedSuccess}
              onClick={handleSaveShift}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {saving ? 'Closing Shift...' : (savedSuccess ? 'Shift Closed ✓' : 'Close Shift & Finalize')}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Sales Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gross Sales</span>
            <span className="text-sm font-black text-white">${grossSales.toFixed(2)}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cash in Drawer</span>
            <span className="text-sm font-black text-emerald-400">${cashSales.toFixed(2)}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">MoMo / Orange</span>
            <span className="text-sm font-black text-amber-400">${momoSales.toFixed(2)}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expenses Paid</span>
            <span className="text-sm font-black text-rose-400">-${totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        {/* Counted Cash Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Opening Float ($)
            </label>
            <input
              type="number"
              value={openingFloatUSD}
              onChange={(e) => setOpeningFloatUSD(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Counted USD Cash ($)
            </label>
            <input
              type="number"
              value={countedCashUSD}
              onChange={(e) => setCountedCashUSD(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Counted LRD Cash (L$)
            </label>
            <input
              type="number"
              value={countedCashLRD}
              onChange={(e) => setCountedCashLRD(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Live Variance Calculation */}
        <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Calculated Drawer Balance</span>
            <span className="text-lg font-black text-white">
              Expected: ${expectedCash.toFixed(2)} · Counted: ${totalCounted.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold block text-slate-400">Variance</span>
            <span className={`text-base font-black ${
              Math.abs(variance) < 0.05 ? 'text-emerald-400' : variance > 0 ? 'text-cyan-400' : 'text-red-400'
            }`}>
              {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Shift Handover Notes / Manager Comments
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes on drawer float, cashier switch, or shift events..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </Modal>
  );
}
