/**
 * RetailOS Liberia - Role-Based Access Control (RBAC) & Multi-Tenant Authority System
 * 
 * 1. Super Admin ('superadmin'): RetailOS Liberia Team & System Master Admins.
 *    Unrestricted access across all tenant businesses, platform dashboard, subscription billing, and tenant switching.
 * 2. Store Owner / CEO ('owner'): Master authority for their specific business.
 *    Restock, Suppliers, Staff Salaries/PINs, Store Settings, Financial Controls.
 * 3. Store Manager ('manager'): Shift approvals, Cash drawer variance approvals, Inventory counts, WhatsApp marketing.
 *    (Restricted: Store Settings, Staff PINs, Supplier pipelines).
 * 4. Cashier ('cashier'): POS checkout, Customer VIP lookups, Delivery board, Attendance clock-in.
 * 5. Delivery Driver ('delivery'): Delivery board status updates & Attendance clock-in only.
 */

export const SUPERADMIN_EMAILS = [
  'josephfabricedoe@gmail.com',  // RetailOS Master Admin
  'jambeautystorelib@gmail.com',  // RetailOS Master Admin
];

export function isSuperAdminEmail(email) {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(String(email).toLowerCase().trim());
}

export const ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  CASHIER: 'cashier',
};

export function normalizeRole(role, email = null) {
  if (email && isSuperAdminEmail(email)) return 'superadmin';
  if (!role) return 'cashier';
  const r = String(role).toLowerCase().trim();
  if (r === 'superadmin') return 'superadmin';
  if (r === 'admin' || r === 'owner' || r === 'ceo' || r === 'manager') return 'owner';
  return 'cashier';
}

export const ROLE_DEFINITIONS = {
  superadmin: {
    id: 'superadmin',
    label: 'Platform Super-Admin',
    badge: '⚡ Super-Admin',
    badgeColor: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/50',
    description: 'Platform Master Authority: Business onboarding, cashier credentials, and system oversight.',
    tier: 3,
  },
  owner: {
    id: 'owner',
    label: 'Store Owner',
    badge: '👑 Store Owner',
    badgeColor: 'bg-purple-900/50 text-purple-200 border-purple-500/50',
    description: 'Store Authority: Full access to POS, inventory, daily finance reports, customer tabs, and store settings.',
    tier: 2,
  },
  cashier: {
    id: 'cashier',
    label: 'Store Cashier',
    badge: '💳 Cashier',
    badgeColor: 'bg-cyan-900/40 text-cyan-300 border-cyan-600/40',
    description: 'Sales Authority: Fast POS sales, cash / MoMo receipts, and product search.',
    tier: 1,
  },
};

export const ROLE_PERMISSIONS = {
  cashier:    ['pos'],
  owner:      ['pos', 'inventory', 'finance', 'customers', 'settings'],
  superadmin: ['pos', 'inventory', 'finance', 'customers', 'settings', 'superadmin'],
};

export const PLAN_TIERS = {
  starter: {
    id: 'starter',
    name: 'RetailOS Core',
    price: 'Standard',
    description: 'Fast POS, inventory stock, customer store credit & daily financial reports',
    modules: ['pos', 'inventory', 'customers', 'settings', 'finance', 'superadmin'],
  },
};

export function isModuleAvailableForPlan(plan = 'starter', moduleId) {
  const p = (plan || 'starter').toLowerCase().trim();
  if (p === 'enterprise') return true;
  const planInfo = PLAN_TIERS[p] || PLAN_TIERS.starter;
  return planInfo.modules.includes(moduleId);
}

export function getRequiredPlanForModule(moduleId) {
  if (PLAN_TIERS.starter.modules.includes(moduleId)) return 'starter';
  if (PLAN_TIERS.growth.modules.includes(moduleId)) return 'growth';
  return 'enterprise';
}

export function canAccessModule(role, moduleId, plan = 'enterprise') {
  const norm = normalizeRole(role);
  if (norm === 'superadmin') return true;
  const allowed = ROLE_PERMISSIONS[norm] || [];
  if (!allowed.includes(moduleId)) return false;
  return isModuleAvailableForPlan(plan, moduleId);
}

export function getDefaultModuleForRole(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'delivery':
      return 'delivery';
    case 'superadmin':
      return 'superadmin';
    case 'cashier':
    case 'manager':
    case 'owner':
    default:
      return 'pos';
  }
}

export function isSuperAdmin(role, email = null) {
  if (email && isSuperAdminEmail(email)) return true;
  return normalizeRole(role) === 'superadmin';
}

export function isOwner(role) {
  const norm = normalizeRole(role);
  return norm === 'owner' || norm === 'superadmin';
}

export function isManager(role) {
  const norm = normalizeRole(role);
  return norm === 'manager' || norm === 'owner' || norm === 'superadmin';
}

export function isCashier(role) {
  const norm = normalizeRole(role);
  return norm === 'cashier' || norm === 'manager' || norm === 'owner' || norm === 'superadmin';
}

export function isDelivery(role) {
  return true;
}
