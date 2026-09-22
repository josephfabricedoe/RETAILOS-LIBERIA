import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Receipt, 
  Plus, 
  UploadCloud, 
  Calendar,
  Layers,
  ArrowRightLeft,
  Lock,
  FileSpreadsheet,
  Camera,
  ShieldCheck,
  FileText,
  X,
  Download,
  Eye
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../hooks/useAuth';
import PlanUpgradeLockView from '../shared/PlanUpgradeLockView';
import DateFilterBar from './DateFilterBar';
import SummaryMetrics from './SummaryMetrics';
import SalesChart from './SalesChart';
import PaymentPieChart from './PaymentPieChart';
import TopProducts from './TopProducts';
import SalesInflow from './SalesInflow';
import SalesImport from './SalesImport';
import ExpenseForm from './ExpenseForm';
import CashReconciliation from './CashReconciliation';
import ShiftHandoverModal from './ShiftHandoverModal';
import DetailedStoreReport from './DetailedStoreReport';
import ReceiptModal from '../pos/ReceiptModal';
import SupplierBillsView from './SupplierBillsView';
import LraTaxReportModal from './LraTaxReportModal';
import { exportQuickBooksJournalEntries } from '../../utils/exportCsv';

export default function FinanceView() {
  const { currentStore, currentTenant } = useTenant();
  const { isSuperAdmin } = useAuth();
  const storePlan = currentTenant?.subscriptionPlan || 'starter';
  const isFreePlan = !isSuperAdmin && storePlan === 'starter';

  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, expenses, bills, drawer, pnl
  const [dateFilter, setDateFilter] = useState(isFreePlan ? 'today' : 'thisMonth');
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showLraModal, setShowLraModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedExpenseSlip, setSelectedExpenseSlip] = useState(null);

  // Scoped tenant collections
  const { docs: allSales, loading: salesLoading } = useTenantCollection('sales');
  const { docs: allExpenses, loading: expLoading } = useTenantCollection('expenses');
  const { docs: products } = useTenantCollection('products');

  // Filter sales and expenses by date filter
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateFilter === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    } else if (dateFilter === 'thisWeek') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
      endDate = new Date();
    } else if (dateFilter === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date();
    } else if (dateFilter === 'custom') {
      startDate = new Date(customRange.start + 'T00:00:00');
      endDate = new Date(customRange.end + 'T23:59:59');
    }

    const sFilter = allSales.filter((s) => {
      const d = s.date ? new Date(s.date) : s.timestamp?.toDate ? s.timestamp.toDate() : null;
      if (!d) return true;
      return d >= startDate && d <= endDate;
    });

    const eFilter = allExpenses.filter((e) => {
      const d = e.date ? new Date(e.date) : e.createdAt?.toDate ? e.createdAt.toDate() : null;
      if (!d) return true;
      return d >= startDate && d <= endDate;
    });

    return { filteredSales: sFilter, filteredExpenses: eFilter };
  }, [allSales, allExpenses, dateFilter, customRange]);

  const tabs = [
    { id: 'overview', label: isFreePlan ? 'Daily Sales Overview' : 'Financial Overview', icon: BarChart3 },
    { id: 'transactions', label: isFreePlan ? 'Daily Sales Inflow' : 'Sales & Receipts', icon: Receipt, badge: filteredSales.length },
    { id: 'expenses', label: 'Store Expenses', icon: Wallet, badge: isFreePlan ? undefined : filteredExpenses.length, isLocked: isFreePlan, planRequired: 'Growth' },
    { id: 'bills', label: 'Supplier Bills (A/P)', icon: FileText, isLocked: isFreePlan, planRequired: 'Growth' },
    { id: 'drawer', label: 'Cash Drawer & Shifts', icon: ArrowRightLeft, isLocked: isFreePlan, planRequired: 'Growth' },
    { id: 'pnl', label: 'P&L Statement', icon: Layers, isLocked: isFreePlan, planRequired: 'Growth' }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isFreePlan ? 'Daily Financial Report' : 'Financial Hub'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {currentStore?.name || 'Store'}
            </span>
            {isFreePlan && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Free Forever Plan
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isFreePlan
              ? 'Daily sales overview and daily sales inflow transactions (Free Forever Plan)'
              : 'Dual-currency sales analytics, cash drawer balancing, and store P&L ledger'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              if (isFreePlan) {
                setActiveTab('expenses');
              } else {
                setShowExpenseModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition"
          >
            {isFreePlan ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            Record Expense
            {isFreePlan && <span className="text-[9px] bg-amber-700/50 px-1 py-0.2 rounded text-white">Growth</span>}
          </button>

          <button
            onClick={() => {
              if (isFreePlan) {
                setActiveTab('drawer');
              } else {
                setShowHandoverModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm transition"
          >
            {isFreePlan ? <Lock className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
            Shift Handover
            {isFreePlan && <span className="text-[9px] bg-slate-700 px-1 py-0.2 rounded text-slate-200">Growth</span>}
          </button>

          <button
            type="button"
            onClick={() => setShowLraModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl shadow-xs transition"
            title="Liberia Revenue Authority (LRA) Tax Readiness Audit & Return"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">LRA Tax Readiness</span>
            <span className="md:hidden">LRA Tax</span>
          </button>

          <button
            type="button"
            onClick={() => exportQuickBooksJournalEntries({
              sales: filteredSales,
              expenses: filteredExpenses,
              products,
              storeName: currentStore?.name || 'Retail Store',
              fxRate: currentStore?.exchangeRate || currentStore?.fxRate || 198,
              dateLabel: dateFilter
            })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl shadow-xs transition"
            title="Download standard General Ledger Journal Entries CSV for QuickBooks, Xero, or Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">QuickBooks / GL Export</span>
            <span className="md:hidden">Export GL</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
            title="Import Sales CSV"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Filter & Quick Switcher */}
      <DateFilterBar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customRange={customRange}
        setCustomRange={setCustomRange}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.isLocked && (
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <Lock className="w-2.5 h-2.5" />
                  {tab.planRequired || 'Growth'}
                </span>
              )}
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SummaryMetrics sales={filteredSales} expenses={filteredExpenses} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesChart sales={filteredSales} />
            </div>
            <div>
              <PaymentPieChart sales={filteredSales} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts sales={filteredSales} />
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Cash Operations
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">Physical Cash Drawer Balancing</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Reconcile register cash against POS sales totals in both USD and Liberian Dollars before closing store.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2 my-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">Active Shift:</span>
                  <span className="text-slate-900 font-bold">Standard Terminal Session</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">Recorded Inflow:</span>
                  <span className="text-emerald-600 font-bold">{filteredSales.length} Transactions</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('drawer')}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                Open Drawer Balancing Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <SalesInflow
          sales={filteredSales}
          onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
        />
      )}

      {activeTab === 'expenses' && (
        isFreePlan ? (
          <PlanUpgradeLockView moduleId="expenses" requiredPlan="growth" />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Operating Expenses</h2>
                <p className="text-xs text-slate-500">Record and track store overheads (Rent, Fuel, Keh-Keh, Wages)</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Logged By</th>
                    <th className="py-3 px-4 text-center">Receipt Slip</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No expenses logged for this time range.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                            {exp.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {exp.description || exp.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {exp.recordedBy || exp.loggedBy || 'Staff'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {exp.receiptPhoto ? (
                            <button
                              onClick={() => setSelectedExpenseSlip(exp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200 transition"
                              title="Inspect Expense Receipt Slip Photo"
                            >
                              <Camera className="w-3 h-3 text-amber-600" />
                              <span>View Slip</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {exp.currency === 'LRD' ? `L$ ${Number(exp.amount).toLocaleString()}` : `$${Number(exp.amount).toFixed(2)}`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'bills' && (
        isFreePlan ? (
          <PlanUpgradeLockView moduleId="bills" requiredPlan="growth" />
        ) : (
          <SupplierBillsView />
        )
      )}

      {activeTab === 'drawer' && (
        isFreePlan ? (
          <PlanUpgradeLockView moduleId="drawer" requiredPlan="growth" />
        ) : (
          <CashReconciliation 
            sales={filteredSales} 
            expenses={filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0)}
          />
        )
      )}

      {activeTab === 'pnl' && (
        isFreePlan ? (
          <PlanUpgradeLockView moduleId="pnl" requiredPlan="growth" />
        ) : (
          <DetailedStoreReport
            sales={filteredSales}
            expenses={filteredExpenses}
            products={products}
          />
        )
      )}

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseForm onClose={() => setShowExpenseModal(false)} />
      )}

      {showImportModal && (
        <SalesImport
          onClose={() => setShowImportModal(false)}
          onComplete={() => setShowImportModal(false)}
        />
      )}

      {showHandoverModal && (
        <ShiftHandoverModal onClose={() => setShowHandoverModal(false)} />
      )}

      {selectedReceipt && (
        <ReceiptModal
          sale={selectedReceipt}
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      <LraTaxReportModal
        isOpen={showLraModal}
        onClose={() => setShowLraModal(false)}
        sales={filteredSales}
        expenses={filteredExpenses}
        products={products}
      />

      {/* Expense Receipt Slip Inspection Modal */}
      {selectedExpenseSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs uppercase tracking-wider">Expense Receipt Voucher Slip</span>
              </div>
              <button
                onClick={() => setSelectedExpenseSlip(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center max-h-96">
                <img
                  src={selectedExpenseSlip.receiptPhoto}
                  alt="Expense Receipt Slip"
                  className="object-contain w-full max-h-96 rounded-2xl"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-bold text-slate-900">{selectedExpenseSlip.category || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount:</span>
                  <span className="font-black text-slate-900">
                    {selectedExpenseSlip.currency === 'LRD' ? `L$ ${Number(selectedExpenseSlip.amount).toLocaleString()}` : `$${Number(selectedExpenseSlip.amount).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Recorded By:</span>
                  <span className="font-medium text-slate-700">{selectedExpenseSlip.recordedBy || selectedExpenseSlip.loggedBy || 'Staff'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="font-mono text-slate-700">{selectedExpenseSlip.date || 'N/A'}</span>
                </div>
                {selectedExpenseSlip.notes && (
                  <div className="pt-1 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold text-slate-700">Memo: </span>
                    {selectedExpenseSlip.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={selectedExpenseSlip.receiptPhoto}
                  download={`receipt-${selectedExpenseSlip.id || Date.now()}.jpg`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <button
                  onClick={() => setSelectedExpenseSlip(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
