import React, { useRef } from 'react';
import { 
  Building2, 
  Printer, 
  X, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Percent,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useTenant } from '../../contexts/TenantContext';

export default function LraTaxReportModal({ isOpen, onClose, sales = [], expenses = [], products = [] }) {
  const { formatUSD, formatLRD, fxRate } = useCurrency();
  const { currentStore, currentTenant } = useTenant();
  const printRef = useRef(null);

  if (!isOpen) return null;

  // 1. Gross Inflows
  const grossSalesUSD = sales.reduce((acc, s) => acc + Number(s.totalUSD || s.total || 0), 0);
  const discountsUSD = sales.reduce((acc, s) => acc + Number(s.discountUSD || 0), 0);
  const netSalesUSD = grossSalesUSD;
  const netSalesLRD = netSalesUSD * fxRate;

  // Inflow by tender (Cash vs Mobile Money / Digital)
  const momoSalesUSD = sales.reduce((acc, s) => {
    const pm = (s.paymentMethod || '').toLowerCase();
    if (pm.includes('momo') || pm.includes('mobile money') || pm.includes('orange') || pm.includes('lonestar') || pm.includes('telecom')) {
      return acc + Number(s.totalUSD || s.total || 0);
    }
    return acc;
  }, 0);
  const cashSalesUSD = netSalesUSD - momoSalesUSD;

  // 2. COGS calculation
  const productCostMap = {};
  products.forEach((p) => {
    productCostMap[p.id] = Number(p.costPriceUSD || p.costPrice || 0);
    if (p.name) productCostMap[p.name.toLowerCase()] = Number(p.costPriceUSD || p.costPrice || 0);
  });

  let estimatedCogsUSD = 0;
  sales.forEach((s) => {
    if (Array.isArray(s.items)) {
      s.items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const unitCost = productCostMap[item.id] || (item.name && productCostMap[item.name.toLowerCase()]) || Number(item.costPriceUSD || 0) || (Number(item.priceUSD || 0) * 0.65);
        estimatedCogsUSD += unitCost * qty;
      });
    }
  });

  // 3. Allowable Operating Expenses
  const totalExpensesUSD = expenses.reduce((acc, e) => {
    if (e.currency === 'LRD') {
      return acc + (Number(e.amount || 0) / fxRate);
    }
    return acc + Number(e.amount || 0);
  }, 0);

  // 4. Net Taxable Business Income
  const grossProfitUSD = Math.max(0, netSalesUSD - estimatedCogsUSD);
  const netTaxableIncomeUSD = Math.max(0, grossProfitUSD - totalExpensesUSD);
  const netTaxableIncomeLRD = netTaxableIncomeUSD * fxRate;

  // 5. Statutory Tax Computations
  // GST (Goods & Services Tax standard rate = 10%)
  const gstLiabilityUSD = netSalesUSD * 0.10;
  const gstLiabilityLRD = gstLiabilityUSD * fxRate;

  // Turnover / Commercial Tax (Small & Medium Enterprise Presumptive rate = 4%)
  const turnoverTaxUSD = netSalesUSD * 0.04;
  const turnoverTaxLRD = turnoverTaxUSD * fxRate;

  const handlePrint = () => {
    window.print();
  };

  const storeName = currentStore?.name || currentTenant?.businessName || 'Liberian Retail Enterprise';
  const tinNumber = currentTenant?.tin || currentStore?.tin || 'LRA-PENDING-TIN';
  const address = currentStore?.address || currentTenant?.city || 'Monrovia, Republic of Liberia';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Top Action Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Liberia Revenue Authority (LRA) Tax Readiness Audit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print LRA Return Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Statement Area */}
        <div ref={printRef} className="p-6 sm:p-10 space-y-6 text-slate-800">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-black uppercase tracking-wider mb-2">
                Republic of Liberia • LRA Form Compliant
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tax Readiness & Sales Ledger Summary
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Official Revenue, Deductibles, and Turnover Tax Assessment
              </p>
            </div>

            <div className="text-right sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-0.5">
              <div className="text-[10px] font-bold uppercase text-slate-500">Taxpayer Registration</div>
              <div className="font-mono font-bold text-slate-900">{storeName}</div>
              <div className="text-slate-600 text-[11px]">TIN: <span className="font-mono font-bold text-slate-800">{tinNumber}</span></div>
              <div className="text-slate-500 text-[10px]">{address}</div>
            </div>
          </div>

          {/* Statement Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Reporting Window</span>
              <div className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Official Store FX</span>
              <div className="font-bold text-slate-800">$1 USD = {formatLRD(fxRate)}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Total Invoices</span>
              <div className="font-bold text-slate-800">{sales.length} Receipts</div>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Digital Tender Share</span>
              <div className="font-bold text-emerald-700">
                {netSalesUSD > 0 ? Math.round((momoSalesUSD / netSalesUSD) * 100) : 0}% Mobile Money
              </div>
            </div>
          </div>

          {/* Core Tax Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-100/80 px-4 py-2.5 font-black text-slate-800 uppercase tracking-wide text-[10px]">
              Section 1: Gross Sales & Revenue Declarations
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="font-semibold text-slate-700">1.0 Gross Commercial Sales Volume</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatUSD(grossSalesUSD)}</span>
                  <span className="text-slate-500 text-[11px] ml-2 font-mono">({formatLRD(netSalesLRD)})</span>
                </div>
              </div>
              <div className="flex justify-between items-center px-4 py-2 pl-8 text-slate-600 bg-slate-50/50">
                <span>1.1 Mobile Money / Digital Inflow (Lonestar / Orange)</span>
                <span className="font-mono font-medium">{formatUSD(momoSalesUSD)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 pl-8 text-slate-600 bg-slate-50/50">
                <span>1.2 Physical Cash Counter Inflow</span>
                <span className="font-mono font-medium">{formatUSD(cashSalesUSD)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-emerald-50/40">
                <span className="font-bold text-emerald-900">Total Net Taxable Inflow</span>
                <span className="font-black text-emerald-900">{formatUSD(netSalesUSD)}</span>
              </div>
            </div>

            <div className="bg-slate-100/80 px-4 py-2.5 font-black text-slate-800 uppercase tracking-wide text-[10px] border-t border-slate-200">
              Section 2: Allowable Cost & Operating Deductions
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-slate-700 font-semibold">2.0 Cost of Goods Sold (Inventory Purchase Cost)</span>
                <span className="font-bold text-slate-800">({formatUSD(estimatedCogsUSD)})</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-slate-700 font-semibold">2.1 Logged Operating Overheads (Utilities, Fuel, Rent, Transport)</span>
                <span className="font-bold text-amber-700">({formatUSD(totalExpensesUSD)})</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 font-bold text-slate-900">
                <span>Adjusted Net Commercial Profit</span>
                <span>{formatUSD(netTaxableIncomeUSD)} ({formatLRD(netTaxableIncomeLRD)})</span>
              </div>
            </div>

            <div className="bg-slate-900 text-white px-4 py-2.5 font-black uppercase tracking-wide text-[10px]">
              Section 3: Estimated Statutory Tax Obligations
            </div>
            <div className="divide-y divide-slate-800 bg-slate-950 text-slate-200">
              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <div className="font-bold text-white">Tier A: Liberia Goods & Services Tax (GST @ 10%)</div>
                  <div className="text-[10px] text-slate-400">Applicable on registered standard rated retail goods</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-400 text-sm">{formatUSD(gstLiabilityUSD)}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{formatLRD(gstLiabilityLRD)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <div className="font-bold text-white">Tier B: Small Business Commercial Turnover Tax (Presumptive @ 4%)</div>
                  <div className="text-[10px] text-slate-400">Simplified turnover filing for micro and small enterprises under LRA code</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-400 text-sm">{formatUSD(turnoverTaxUSD)}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{formatLRD(turnoverTaxLRD)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Audit Disclaimer */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">LRA Statutory Audit Note</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                This document is generated by RetailOS Liberia based on recorded point-of-sale transactions and logged expense vouchers. Use these figures when preparing your monthly or quarterly filings with the Liberia Revenue Authority. Keep physical receipts and Mobile Money reference numbers on file for verification.
              </div>
            </div>
          </div>

          {/* Signatures for Print Form */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                Prepared By (Store Accountant / Manager)
              </div>
              <div className="text-[10px] text-slate-400">Signature & Date</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                Certified Tax Agent / LRA Official
              </div>
              <div className="text-[10px] text-slate-400">Stamp & Verification Date</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-[11px] text-slate-500 font-medium">
            Dual-Currency Tax Estimation Engine • Liberia Commerce Act
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
