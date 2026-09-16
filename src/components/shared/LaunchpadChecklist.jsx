import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Package, 
  Settings, 
  UserCheck, 
  ShoppingCart, 
  Smartphone, 
  Trash2, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useApp } from '../../contexts/AppContext';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { loadSampleProducts, clearSampleProducts } from '../../utils/sampleProducts';

export default function LaunchpadChecklist() {
  const { currentTenant, getTenantDoc, getTenantCol, tenantId } = useTenant();
  const { setActiveModule } = useApp();

  const { docs: products } = useTenantCollection('products');
  const { docs: sales } = useTenantCollection('sales');
  const { docs: staff } = useTenantCollection('staff');

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [clearingSamples, setClearingSamples] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Check dismissal in localStorage
  useEffect(() => {
    if (tenantId) {
      const isDismissed = localStorage.getItem(`retailos_launchpad_dismissed_${tenantId}`);
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, [tenantId]);

  const handleDismiss = () => {
    setDismissed(true);
    if (tenantId) {
      localStorage.setItem(`retailos_launchpad_dismissed_${tenantId}`, 'true');
    }
  };

  const handleRestore = () => {
    setDismissed(false);
    if (tenantId) {
      localStorage.removeItem(`retailos_launchpad_dismissed_${tenantId}`);
    }
  };

  // Milestone Checks
  const hasConfig = Boolean(
    (currentTenant?.phone && currentTenant?.phone.length > 5) ||
    currentTenant?.exchangeRate ||
    currentTenant?.address
  );
  const hasProducts = (products?.length || 0) >= 3;
  const hasStaff = (staff?.length || 0) >= 1;
  const hasSale = (sales?.length || 0) >= 1;
  const isInstalled = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );

  const sampleCount = (products || []).filter(p => p.isSample).length;

  const steps = [
    {
      id: 'settings',
      label: 'Store Profile & Exchange Rate',
      desc: 'Set your daily USD/LRD rate and store phone number',
      done: hasConfig,
      action: () => setActiveModule('settings'),
      buttonText: 'Configure Rate & Info',
      icon: Settings
    },
    {
      id: 'inventory',
      label: 'Stock Your Inventory',
      desc: `${products.length} product${products.length === 1 ? '' : 's'} in catalog (target: at least 3)`,
      done: hasProducts,
      action: () => setActiveModule('inventory'),
      buttonText: 'Open Inventory Stock',
      icon: Package
    },
    {
      id: 'staff',
      label: 'Create Cashier PIN',
      desc: hasStaff ? `${staff.length} staff member active` : 'Secure your POS register with 4-digit staff PINs',
      done: hasStaff,
      action: () => setActiveModule('staff'),
      buttonText: 'Add Staff Member',
      icon: UserCheck
    },
    {
      id: 'pos',
      label: 'Ring Up First Test Sale',
      desc: hasSale ? `${sales.length} transactions recorded` : 'Test the cash register with Cash, MoMo, or Credit',
      done: hasSale,
      action: () => setActiveModule('pos'),
      buttonText: 'Open POS Register',
      icon: ShoppingCart
    },
    {
      id: 'install',
      label: 'Install App on Device',
      desc: isInstalled ? 'Installed as native app' : 'Add RetailOS to your phone or tablet home screen',
      done: isInstalled,
      action: () => {
        // Trigger install prompt if available or scroll down
        const promptBtn = document.querySelector('[data-pwa-install-btn]');
        if (promptBtn) {
          promptBtn.click();
        } else {
          alert('Tap the "Install App" banner at the bottom of the screen or use your browser menu to "Add to Home Screen".');
        }
      },
      buttonText: isInstalled ? 'Installed' : 'Install on Phone',
      icon: Smartphone
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // 1-Click Load Sample Products
  const handleLoadSamples = async () => {
    try {
      setLoadingSamples(true);
      setActionMessage('');
      const count = await loadSampleProducts(getTenantDoc);
      setActionMessage(`Loaded ${count} Liberian retail sample products!`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Failed to load sample products:', err);
      setActionMessage('Could not load sample products. Please check connection.');
    } finally {
      setLoadingSamples(false);
    }
  };

  // 1-Click Clear Sample Products
  const handleClearSamples = async () => {
    if (!window.confirm('Wipe all 8 sample demo items? Any real products you created will not be touched.')) return;
    try {
      setClearingSamples(true);
      setActionMessage('');
      const count = await clearSampleProducts(getTenantCol, getTenantDoc);
      setActionMessage(`Removed ${count} sample items.`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Failed to clear sample products:', err);
      setActionMessage('Failed to clear samples.');
    } finally {
      setClearingSamples(false);
    }
  };

  if (dismissed) {
    return (
      <div className="mx-4 sm:mx-8 mt-4 flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-2xs text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">Store Launchpad:</span>
          <span>{completedCount}/{steps.length} milestones complete ({progressPercent}%)</span>
        </div>
        <button
          type="button"
          onClick={handleRestore}
          className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          View Launch Checklist
        </button>
      </div>
    );
  }

  // If 100% completed, show celebration banner
  if (completedCount === steps.length && !collapsed) {
    return (
      <div className="mx-4 sm:mx-8 mt-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">Your Store is 100% Ready for Business!</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800">
                  Ready to Trade
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                All 5 launch milestones have been verified. You can now ring up daily customer sales with confidence.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sampleCount > 0 && (
              <button
                type="button"
                onClick={handleClearSamples}
                disabled={clearingSamples}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition border border-white/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearingSamples ? 'Clearing...' : 'Clear Demo Items'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 bg-white text-emerald-900 font-bold rounded-xl text-xs hover:bg-emerald-50 transition shadow-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 sm:mx-8 mt-4 bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Store Launchpad Checklist
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {completedCount} of {steps.length} Complete ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these essential steps to prepare your store for live commercial trading in Liberia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 1-Click Sample Products Button */}
          {sampleCount === 0 ? (
            <button
              type="button"
              onClick={handleLoadSamples}
              disabled={loadingSamples}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Add 8 realistic Liberian retail items with real barcodes to test the POS register"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{loadingSamples ? 'Loading Samples...' : 'Load 8 Sample Items'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClearSamples}
              disabled={clearingSamples}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              title="Remove sample items when ready to enter real store stock"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearingSamples ? 'Clearing...' : `Wipe ${sampleCount} Samples`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title={collapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-100 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Steps List */}
      {!collapsed && (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step.done 
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-800' 
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${
                        step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {idx + 1}. {step.label}
                      </span>
                    </div>
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {step.desc}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={step.action}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      step.done
                        ? 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                        : 'bg-slate-900 hover:bg-black text-white shadow-xs'
                    }`}
                  >
                    <span>{step.buttonText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
