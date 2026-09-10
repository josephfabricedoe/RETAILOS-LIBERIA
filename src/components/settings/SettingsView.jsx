import React, { useState } from 'react';
import { 
  Settings, 
  Printer, 
  Download, 
  Trash2, 
  CreditCard, 
  ShieldCheck, 
  Wifi, 
  CheckCircle2, 
  RefreshCw,
  Store,
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import StoreInfoForm from './StoreInfoForm';
import FactoryResetModal from './FactoryResetModal';
import { useTenant } from '../../contexts/TenantContext';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { exportToCsv } from '../../utils/exportCsv';
import { printReceipt58mm } from '../../utils/bluetoothPrinter';

export default function SettingsView() {
  const { currentStore, currentTenant, tenantId, isSuperAdmin } = useTenant();
  const { docs: products } = useTenantCollection('products');
  const { docs: sales } = useTenantCollection('sales');
  const { docs: customers } = useTenantCollection('customers');

  const [showResetModal, setShowResetModal] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('Disconnected');
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const storePlan = currentTenant?.subscriptionPlan || currentStore?.subscriptionPlan || 'starter';
  const isEnterpriseStore = isSuperAdmin || storePlan === 'enterprise';
  const storeSlug = currentStore?.slug || currentTenant?.slug || tenantId || 'store';
  const storefrontUrl = `${window.location.origin}/?store=${storeSlug}#catalog`;

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    const mockSale = {
      receiptNumber: 'TEST-0001',
      date: new Date().toISOString(),
      cashierName: 'Test Cashier',
      customerName: 'Sample Customer',
      paymentMethod: 'Cash USD',
      totalUSD: 15.00,
      totalLRD: 3000,
      items: [
        { name: '58mm Printer Test', quantity: 1, priceUSD: 15.00, subtotalUSD: 15.00 }
      ]
    };

    try {
      await printReceipt58mm(mockSale, {
        name: currentStore?.name || 'RetailOS Test',
        address: currentStore?.address || 'Monrovia, Liberia',
        phone: currentStore?.phone || '',
        receiptFooter: 'Bluetooth Print OK!'
      });
      setPrinterStatus('Connected (58mm Ready)');
    } catch (err) {
      console.warn('Printer test warning:', err);
      setPrinterStatus('Bluetooth unavailable or cancelled');
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleExportFullBackup = () => {
    // 1. Export Products
    if (products.length > 0) {
      exportToCsv(products, `${currentStore?.slug || 'store'}_products_${new Date().toISOString().slice(0,10)}.csv`);
    }
    // 2. Export Customers
    if (customers.length > 0) {
      exportToCsv(customers, `${currentStore?.slug || 'store'}_customers_${new Date().toISOString().slice(0,10)}.csv`);
    }
    // 3. Export Sales
    if (sales.length > 0) {
      exportToCsv(sales, `${currentStore?.slug || 'store'}_sales_${new Date().toISOString().slice(0,10)}.csv`);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage hardware integrations, receipts, store profile, and database backups
        </p>
      </div>

      {/* Store Profile Form */}
      <StoreInfoForm />

      {/* Public Online Customer Storefront (Enterprise Exclusive) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Public Online Storefront</h2>
                {isEnterpriseStore ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active on Web
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    <Lock className="w-3 h-3 text-purple-700" />
                    Enterprise Only ($39.99/mo)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Shareable digital catalog link for customers to browse live shelf stock and dispatch WhatsApp orders
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Your Public Storefront Catalog URL:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 truncate select-all">
                {storefrontUrl}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(storefrontUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2500);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                  <span>{copiedUrl ? 'Copied URL!' : 'Copy Link'}</span>
                </button>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200 shrink-0"
                >
                  <span>Open Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {!isEnterpriseStore && (
            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-950">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Unlock Your Live Online Storefront with Enterprise</span>
              </div>
              <p className="text-purple-900 leading-relaxed">
                Currently on the <strong>{currentStore?.subscriptionPlan || 'starter'}</strong> tier. Visitors to your storefront URL will see an &ldquo;Offline / Coming Soon&rdquo; notice until your store is upgraded to Enterprise ($39.99/mo).
              </p>
              <div className="pt-1">
                <a
                  href="tel:0770430269"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition"
                >
                  <span>Call 0770430269 for Instant Enterprise Upgrade</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bluetooth Thermal Printer Hardware */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ESC/POS 58mm Receipt Printer</h2>
              <p className="text-xs text-slate-500">Connect via Web Bluetooth on mobile phones, tablets, or laptops</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
            {printerStatus}
          </span>
        </div>

        <div className="py-4 space-y-3 text-xs text-slate-600">
          <p>
            RetailOS supports direct driverless printing to portable 58mm Bluetooth thermal printers (Goojprt, MPT-II, Netum, etc.) commonly used across Liberia.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestPrint}
              disabled={isTestingPrinter}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {isTestingPrinter ? 'Connecting Bluetooth...' : 'Pair & Test 58mm Print'}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription & Multi-Tenant Plan */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Subscription & SaaS Plan</h2>
              <p className="text-xs text-slate-500">
                Support & Training Hotline: <a href="tel:0770430269" className="font-bold text-emerald-600 hover:underline">0770430269</a>
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs uppercase">
            {currentStore?.subscriptionPlan || currentStore?.plan || 'Growth Plan'}
          </span>
        </div>

        <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block mb-1">Monthly Billing</span>
            <span className="font-bold text-slate-800 text-sm">
              {currentStore?.subscriptionPlan === 'starter' || currentStore?.plan === 'Starter'
                ? '$0 / mo (Free Forever)'
                : currentStore?.subscriptionPlan === 'enterprise' || currentStore?.plan === 'Enterprise'
                ? '$39.99 / mo'
                : '$19.99 / mo'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block mb-1">Status</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentStore?.status === 'active' ? 'Active & Up-to-Date' : 'Active (Trial)'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block mb-1">Store Isolation ID</span>
            <span className="font-mono text-slate-600 text-[11px] truncate block">
              {tenantId || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Backup & Danger Zone */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Management & Safety</h2>
          <p className="text-xs text-slate-500">Download complete offline backups or wipe demo records</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl">
          <div>
            <h4 className="font-bold text-slate-800 text-xs">Export Complete Store Backup (CSV)</h4>
            <p className="text-[11px] text-slate-500">Download all products, sales inflow, and customers in separate spreadsheets.</p>
          </div>
          <button
            onClick={handleExportFullBackup}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSVs
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-red-50/60 rounded-2xl border border-red-100">
          <div>
            <h4 className="font-bold text-red-900 text-xs">Factory Reset Store Ledger</h4>
            <p className="text-[11px] text-red-600">Delete all test sales, expenses, and deliveries for a fresh start.</p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {showResetModal && (
        <FactoryResetModal onClose={() => setShowResetModal(false)} />
      )}
    </div>
  );
}
