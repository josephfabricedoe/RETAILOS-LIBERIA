import React from 'react';
import { Lock, Sparkles, Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { PLAN_TIERS, getRequiredPlanForModule } from '../../utils/rbac';

const MODULE_DETAILS = {
  storeroom: {
    title: 'Storeroom & Warehouse Reserve Tracking',
    description: 'Separate backroom bulk warehouse inventory from showroom display shelves, perform 1-click shelf restocking transfers, and conduct cycle count audits.',
    benefits: [
      'Separate warehouse reserve quantities from counter display stock',
      '1-click restock transfer orders with audit history',
      'Physical warehouse cycle count reconciliations',
    ],
  },
  suppliers: {
    title: 'Suppliers & In-Transit Restock Tracking',
    description: 'Manage local and overseas vendor directories, issue purchase orders, and monitor in-transit lead times from China, USA, or Ghana.',
    benefits: [
      'Automatic vendor debt and payments ledger',
      'Overseas sea & air cargo shipment status tracker',
      '1-click restock purchase order creation',
    ],
  },
  finance: {
    title: 'Finance, Cash Balancing & Shift Z-Reports',
    description: 'Track daily gross profit, monitor generator fuel and operating overheads, balance physical USD and LRD banknotes, and generate shift handover Z-reports.',
    benefits: [
      'Physical cash drawer denomination reconciliation (USD & LRD)',
      'Automated P&L statement and gross margin percentage',
      'Expense categorizer (Generator fuel, shop rent, logistics)',
    ],
  },
  staff: {
    title: 'Staff Management & Kiosk PIN Security',
    description: 'Create multi-staff accounts with individualized 4-digit PINs, configure counter cashier roles, and track staff sales performance.',
    benefits: [
      'Shared counter tablet/laptop kiosk PIN lock',
      'Individual staff sales commission & performance audit',
      'Role-based permissions (Cashier vs Manager vs Owner)',
    ],
  },
  attendance: {
    title: 'Automated Staff Attendance & Clock-In Ledger',
    description: 'Track staff arrival times automatically upon first PIN unlock of the morning, verify attendance timestamps, and prevent buddy punching.',
    benefits: [
      'Automatic morning punch-in timestamp',
      'Monthly attendance log exportable for payroll',
      'Shift duration and overtime tracking',
    ],
  },
  delivery: {
    title: 'Bike & Keh-Keh Delivery Dispatch Board',
    description: 'Coordinate customer orders with dispatch riders across Monrovia, track landmark drop-offs, and send automatic WhatsApp dispatch summaries.',
    benefits: [
      'Real-time delivery status: Pending → Dispatched → Delivered',
      'Landmark and customer directions formatted for riders',
      '1-click WhatsApp order dispatch to motorbike & keh-keh riders',
    ],
  },
  marketing: {
    title: 'WhatsApp Broadcast Campaigns & VIP Marketing',
    description: 'Broadcast personalized promotions, seasonal sales notices, and new stock alerts directly to hundreds of customers via WhatsApp.',
    benefits: [
      'Target VIP customers, high spenders, or credit tab customers',
      'Pre-formatted WhatsApp message templates',
      'Increase repeat store visits without expensive SMS fees',
    ],
  },
};

export default function PlanUpgradeLockView({ moduleId }) {
  const { currentTenant } = useTenant();
  const requiredPlanId = getRequiredPlanForModule(moduleId);
  const requiredPlan = PLAN_TIERS[requiredPlanId] || PLAN_TIERS.growth;
  const details = MODULE_DETAILS[moduleId] || {
    title: 'Premium Management Feature',
    description: 'Upgrade your store subscription plan to unlock this advanced operational module.',
    benefits: ['Full module access', 'Dedicated technical support', 'Data export and reports'],
  };

  const currentPlanId = currentTenant?.subscriptionPlan || 'starter';
  const currentPlanName = PLAN_TIERS[currentPlanId]?.name || 'Free Forever ($0)';
  const storeName = currentTenant?.businessName || 'My Store';

  const waText = encodeURIComponent(
    `Hello Joseph and Malydia, I am the owner of ${storeName}. I would like to upgrade our RetailOS store from ${currentPlanName} to the ${requiredPlan.name} (${requiredPlan.price}) to unlock ${details.title}.`
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                Requires {requiredPlan.name}
              </span>
              <h2 className="text-xl font-black text-white mt-1">{details.title}</h2>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Your Current Plan:</span>
            <span className="text-xs font-bold text-cyan-300">{currentPlanName}</span>
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {details.description}
          </p>

          <div className="bg-slate-850/70 border border-slate-750 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">What you get when you upgrade:</h4>
            <ul className="space-y-2 text-xs text-slate-200">
              {details.benefits.map((b, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-850 to-blue-950/40 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">{requiredPlan.name}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{requiredPlan.description}</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-2xl font-black text-white">{requiredPlan.price}</span>
            <span className="text-[10px] text-slate-400 block">No contract · Cancel anytime</span>
          </div>
        </div>

        {/* Call to Action: Joseph & Malydia Support Hotline */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-center text-slate-400">
            Contact platform founders <strong className="text-white">Joseph Doe</strong> & <strong className="text-white">Malydia Jasay</strong> to activate your upgrade. They will switch on your new features immediately from the Master Admin Console:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <a
              href={`https://wa.me/231770430269?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Joseph & Malydia to Upgrade</span>
            </a>

            <a
              href="tel:0770430269"
              className="py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call: 0770430269</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
