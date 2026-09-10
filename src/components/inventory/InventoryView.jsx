import React, { useState } from 'react';
import ShowroomTable from './ShowroomTable';
import StoreroomTable from './StoreroomTable';
import TransferModal from './TransferModal';
import CSVImport from './CSVImport';
import StockAuditModal from './StockAuditModal';
import RestockOrderModal from '../suppliers/RestockOrderModal';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { isOwner, isManager } from '../../utils/rbac';
import { Store, Warehouse, Upload, ClipboardCheck, Lock } from 'lucide-react';
import PlanUpgradeLockView from '../shared/PlanUpgradeLockView';

const TABS = [
  { id: 'showroom', label: 'Showroom Shelves', icon: Store },
  { id: 'storeroom', label: 'Storeroom Backroom', icon: Warehouse },
];

export default function InventoryView() {
  const [tab, setTab] = useState('showroom');
  const [transferProduct, setTransferProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const { userProfile, currentUser, isSuperAdmin } = useAuth();
  const { currentTenant } = useTenant();

  const isOwnerUser = isOwner(userProfile?.role);
  const canImport = isOwnerUser || isManager(userProfile?.role);
  const storePlan = currentTenant?.subscriptionPlan || 'starter';
  const isStoreroomLocked = !isSuperAdmin && storePlan === 'starter';

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Tabs + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isTabLocked = id === 'storeroom' && isStoreroomLocked;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {isTabLocked && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Growth</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {canImport && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-400 text-slate-300 hover:text-emerald-300 rounded-xl text-xs font-bold transition-colors shadow-xs"
              title="Conduct physical shelf or warehouse cycle count audit"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Cycle Count Audit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImport(v => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>CSV Import</span>
            </button>
          </div>
        )}
      </div>

      {showImport && canImport && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Bulk Import Products via CSV</h3>
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <CSVImport />
        </div>
      )}

      {/* Main Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {tab === 'showroom' && (
          <ShowroomTable 
            onRestockClick={isOwnerUser ? setRestockProduct : null} 
            onOpenImport={() => setShowImport(true)}
          />
        )}
        {tab === 'storeroom' && (
          isStoreroomLocked ? (
            <PlanUpgradeLockView moduleId="storeroom" />
          ) : (
            <StoreroomTable 
              onTransferClick={setTransferProduct} 
              onRestockClick={isOwnerUser ? setRestockProduct : null}
            />
          )
        )}
      </div>

      {/* Modals */}
      {transferProduct && (
        <TransferModal
          isOpen={Boolean(transferProduct)}
          onClose={() => setTransferProduct(null)}
          product={transferProduct}
        />
      )}

      {isOwnerUser && restockProduct && (
        <RestockOrderModal
          isOpen={Boolean(restockProduct)}
          onClose={() => setRestockProduct(null)}
          targetProduct={restockProduct}
        />
      )}

      {auditModalOpen && (
        <StockAuditModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
        />
      )}
    </div>
  );
}
