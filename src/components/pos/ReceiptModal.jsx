import React, { useRef, useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { useApp } from '../../contexts/AppContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  Printer,
  Share2,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  printToBluetoothThermalPrinter,
  buildSaleReceiptEscPos,
  getConnectedPrinterName,
  isWebBluetoothSupported,
  connectBluetoothPrinter,
} from '../../utils/bluetoothPrinter';

export default function ReceiptModal({ isOpen, onClose, sale }) {
  const { storeSettings, exchangeRate } = useApp();
  const { currentStore } = useTenant();
  const receiptRef = useRef(null);

  const [btStatus, setBtStatus] = useState('idle');
  const [btError, setBtError] = useState('');
  const [printerName, setPrinterName] = useState(getConnectedPrinterName());
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBtStatus('idle');
      setBtError('');
      setPrinterName(getConnectedPrinterName());
    }
  }, [isOpen]);

  if (!sale) return null;

  const rate = exchangeRate || 198;
  const lrd = (usd) => (Number(usd || 0) * rate).toFixed(0);

  const handleBluetoothPrint = async () => {
    setBtStatus('printing');
    setBtError('');

    try {
      const escPosBytes = buildSaleReceiptEscPos(sale, storeSettings, rate);
      const res = await printToBluetoothThermalPrinter(escPosBytes);

      setPrinterName(res.printerName);
      setBtStatus('success');

      setTimeout(() => {
        setBtStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Bluetooth print failed:', err);
      setBtStatus('error');
      setBtError(
        err.message ||
          'Failed to communicate with Bluetooth printer. Please ensure printer is ON and paired.'
      );
    }
  };

  const handlePairPrinter = async () => {
    setBtStatus('connecting');
    setBtError('');
    try {
      const conn = await connectBluetoothPrinter();
      setPrinterName(conn.name);
      setBtStatus('idle');
    } catch (err) {
      setBtStatus('error');
      setBtError(err.message || 'Could not pair with Bluetooth printer.');
    }
  };

  const handleSystemPrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const itemsList = (sale.items || [])
      .map((i) => `• ${i.name} x${i.quantity} — $${Number(i.total).toFixed(2)}`)
      .join('\n');
    const storeName = storeSettings?.storeName || 'RETAIL STORE';
    const receiptNo = sale.receiptNo || sale.id?.slice(-6).toUpperCase();
    const dateStr = new Date(sale.timestamp?.toDate?.() || Date.now()).toLocaleDateString();

    const text =
      `🏪 *${storeName}*\n` +
      `🧾 *Receipt #${receiptNo}*\n` +
      `📅 Date: ${dateStr}\n` +
      `👤 Client: ${sale.customerName || 'Valued Customer'}${sale.customerPhone ? ` (${sale.customerPhone})` : ''}\n\n` +
      `*Purchased Items:*\n${itemsList}\n\n` +
      (sale.discount > 0 ? `🏷️ *Order Discount:* -$${Number(sale.discount).toFixed(2)}\n` : '') +
      `💵 *TOTAL USD:* $${Number(sale.total).toFixed(2)}\n` +
      `🇱🇷 *TOTAL LRD:* L$${lrd(sale.total)}\n` +
      `💳 Payment Method: ${sale.paymentMethod || 'Cash'}\n` +
      (sale.amountPaid > 0 ? `💵 Paid: $${Number(sale.amountPaid).toFixed(2)}\n` : '') +
      (sale.balanceOwed > 0 ? `⚠️ *BALANCE DUE (Credit):* $${Number(sale.balanceOwed).toFixed(2)}\n` : '') +
      (sale.change > 0 ? `🪙 Change: $${Number(sale.change).toFixed(2)}\n` : '') +
      `\nThank you for your business!\n_Powered by RetailOS Liberia_`;

    const cleanPhone = (sale.customerPhone || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Receipt"
      size="sm"
      footer={
        <div className="space-y-2.5 w-full">
          {btStatus === 'error' && (
            <div className="text-xs text-red-800 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-900">Bluetooth Notice</p>
                <p>{btError}</p>
              </div>
            </div>
          )}

          {btStatus === 'success' && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Printed to {printerName || '58mm Printer'} successfully!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBluetoothPrint}
              disabled={btStatus === 'printing' || btStatus === 'connecting'}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{btStatus === 'printing' ? 'Printing...' : 'Bluetooth 58mm'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-700/20"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Receipt</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={handlePairPrinter}
              className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 text-[11px] font-semibold"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>{printerName ? `Paired: ${printerName}` : 'Pair New Printer'}</span>
            </button>
            <button
              onClick={handleSystemPrint}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[11px] font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Standard Print</span>
            </button>
          </div>
        </div>
      }
    >
      {/* On-screen Receipt Preview */}
      <div
        ref={receiptRef}
        className="bg-white text-slate-900 rounded-xl p-4 font-mono text-xs shadow-inner space-y-3"
      >
        <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
          {(storeSettings?.logoUrl || currentStore?.logoUrl) && (
            <img
              src={storeSettings?.logoUrl || currentStore?.logoUrl}
              alt="Store Logo"
              className="w-12 h-12 object-contain mx-auto mb-2"
            />
          )}
          <p className="font-extrabold text-sm uppercase tracking-wide">
            {storeSettings?.storeName || currentStore?.name || 'RETAIL STORE'}
          </p>
          <p className="text-[10px] text-slate-600">
            {storeSettings?.address || currentStore?.address || 'Monrovia, Liberia'}
          </p>
          {(storeSettings?.phone || currentStore?.phone) && (
            <p className="text-[10px] text-slate-600">
              Tel: {storeSettings?.phone || currentStore?.phone}
            </p>
          )}
          <p className="text-[11px] font-bold mt-1">
            RECEIPT #{sale.receiptNo || sale.id?.slice(-6).toUpperCase()}
          </p>
          <p className="text-[10px] text-slate-500">
            {new Date(sale.timestamp?.toDate?.() || Date.now()).toLocaleString()}
          </p>
        </div>

        {sale.customerName && sale.customerName !== 'Walk-in Customer' && (
          <div className="border-b border-dashed border-slate-300 pb-2 text-[11px]">
            <span className="font-semibold">Customer: </span>
            <span>{sale.customerName}</span>
            {sale.customerPhone && <span className="text-slate-500"> ({sale.customerPhone})</span>}
          </div>
        )}

        {/* Item Rows */}
        <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
          {(sale.items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between items-baseline text-[11px]">
              <div className="min-w-0 pr-2">
                <p className="font-bold truncate">{item.name}</p>
                <p className="text-[10px] text-slate-500">
                  {item.quantity} x ${Number(item.unitPrice).toFixed(2)} ({item.pricingMode || 'retail'})
                </p>
              </div>
              <span className="font-bold whitespace-nowrap">${Number(item.total).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs pt-1">
          {sale.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Order Discount:</span>
              <span>-${Number(sale.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
            <span>TOTAL (USD):</span>
            <span>${Number(sale.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-700">
            <span>TOTAL (LRD):</span>
            <span>L${lrd(sale.total)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[11px] pt-1">
            <span>Payment:</span>
            <span>{sale.paymentMethod || 'Cash'}</span>
          </div>
          {sale.amountPaid > 0 && (
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Amount Tendered:</span>
              <span>${Number(sale.amountPaid).toFixed(2)}</span>
            </div>
          )}
          {sale.change > 0 && (
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Change:</span>
              <span>${Number(sale.change).toFixed(2)}</span>
            </div>
          )}
          {sale.balanceOwed > 0 && (
            <div className="flex justify-between text-red-600 font-bold text-[11px]">
              <span>Balance Due (Credit):</span>
              <span>${Number(sale.balanceOwed).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
          <p>Thank you for your business!</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Powered by RetailOS Liberia</p>
        </div>
      </div>
    </Modal>
  );
}
