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
  expenses: {
    title: 'Store Overhead & Expense Tracking',
    description: 'Track operating overheads like generator fuel, shop rent, transport, and staff stipends with receipts and category reports.',
    benefits: [
      'Categorized overhead tracking (Generator fuel, Rent, Logistics)',
      'Dual-currency expense recording (USD and LRD)',
      'Monthly overhead breakdown and export',
    ],
  },
  drawer: {
    title: 'Cash Drawer Balancing & Shift Handover',
    description: 'Count physical cash drawer banknotes (USD & LRD), reconcile cash against register sales, and record shift handovers.',
    benefits: [
      'Banknote denomination calculator (USD notes & LRD banknotes)',
      'Cash discrepancy variance tracking (Over / Short)',
      'Shift handover Z-reports and staff audit',
    ],
  },
  pnl: {
    title: 'Automated Profit & Loss Statement (P&L)',
    description: 'Real-time financial statement showing Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Operating Margin.',
    benefits: [
      'Automated COGS and gross profit margin percentage',
      'Net operating profit calculation after expenses',
      'Executive financial reporting formatted for store owners',
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
  storefront: {
    title: 'Public Online Storefront & WhatsApp Ordering',
    description: 'Provide customers with an international-standard online store link. Customers can browse your real-time showroom stock, create a shopping bag, and dispatch verified orders directly to your WhatsApp counter.',
    benefits: [
      'Custom branded URL: retailos-liberia.web.app/?store=your-store#catalog',
      'Real-time showroom shelf stock sync with zero manual updating',
      'Direct customer WhatsApp order dispatch with items and total',
      'Upload your store logo and remove the RetailOS watermark',
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
    `Hello RetailOS Liberia Team, I am the owner of ${storeName}. I would like to upgrade our RetailOS store from ${currentPlanName} to the ${requiredPlan.name} (${requiredPlan.price}) to unlock ${details.title}.`
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-900">
        {/* Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                Requires {requiredPlan.name}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">{details.title}</h2>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 font-medium block">Your Current Plan:</span>
            <span className="text-xs font-black text-emerald-700">{currentPlanName}</span>
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>{requiredPlan.name} Feature</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Current Plan: <strong className="text-slate-900">{currentPlanName}</strong>
          </span>
        </div>

        {/* Feature Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {details.title}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {details.description}
          </p>
        </div>

        {/* What You Get in This Tier */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            What your business unlocks on {requiredPlan.name}:
          </span>
          <ul className="space-y-2.5">
            {details.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Card Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
              Flexible Monthly Plan
            </span>
            <span className="text-lg font-black text-slate-900">{requiredPlan.name}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-700">{requiredPlan.price}</span>
            <span className="text-[10px] text-slate-500 font-medium block">No contract · Cancel anytime</span>
          </div>
        </div>

        {/* Call to Action: RetailOS Liberia Support Line */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-center text-slate-600 font-medium">
            Contact the <strong className="text-slate-900 font-bold">RetailOS Liberia Team</strong> to activate your upgrade. Our team will switch on your new features immediately from the Master Admin Console:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <a
              href={`https://wa.me/231770430269?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp RetailOS Team to Upgrade</span>
            </a>

            <a
              href="tel:0770430269"
              className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call: 0770430269</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
