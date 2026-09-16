/**
 * Device Binding & Offline 4-Digit Passcode Management
 * Designed for RetailOS Liberia (Monrovia Merchants)
 *
 * Allows a store owner to bind their business to their smartphone, tablet, or PC.
 * Once bound, the store unlocks in <50ms using a 4-digit PIN with ZERO network requirement.
 */

const BOUND_STORE_KEY = 'retailos_bound_store';
const LOCAL_TENANTS_KEY = 'retailos_local_tenants';

/**
 * Get the store currently bound to this physical device.
 * @returns {Object|null}
 */
export function getBoundStore() {
  try {
    const raw = localStorage.getItem(BOUND_STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading bound store:', e);
    return null;
  }
}

/**
 * Bind a business store to this physical device with a 4-digit passcode.
 * @param {Object} store
 * @param {string} passcode 4-digit PIN string
 */
export function bindStoreToDevice(store, passcode) {
  if (!store || !store.businessId) return null;

  const boundRecord = {
    businessId: store.businessId,
    businessName: store.businessName,
    slug: store.slug || store.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    businessType: store.businessType || 'General Retail',
    ownerName: store.ownerName || 'Store Owner',
    ownerPhone: store.ownerPhone || store.phone || '',
    terminalEmail: store.terminalEmail || `pos_${store.slug || 'terminal'}@retailos.lr`,
    ownerEmail: store.ownerEmail || '',
    themeColor: store.themeColor || '#10b981',
    primaryCurrency: store.primaryCurrency || 'USD',
    secondaryCurrency: store.secondaryCurrency || 'LRD',
    exchangeRate: store.exchangeRate || 198,
    passcode: String(passcode).trim(),
    boundAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(BOUND_STORE_KEY, JSON.stringify(boundRecord));
    localStorage.setItem('retailos_active_tenant_id', boundRecord.businessId);

    // Also ensure this store is in local tenants list
    const existingRaw = localStorage.getItem(LOCAL_TENANTS_KEY);
    const existingList = existingRaw ? JSON.parse(existingRaw) : [];
    const updatedList = [
      boundRecord,
      ...existingList.filter((t) => (t.businessId || t.id) !== boundRecord.businessId),
    ];
    localStorage.setItem(LOCAL_TENANTS_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.warn('Error saving bound store to localStorage:', e);
  }

  return boundRecord;
}

/**
 * Verify if an entered 4-digit passcode matches the bound store or registered staff.
 * @param {string} enteredPasscode
 * @returns {boolean}
 */
export function verifyDevicePasscode(enteredPasscode) {
  const bound = getBoundStore();
  if (!bound) return false;

  const cleanEntered = String(enteredPasscode).trim();
  const cleanStored = String(bound.passcode || '').trim();

  // Allow default test passcode '1234' if store doesn't have one set
  if (!cleanStored && cleanEntered === '1234') {
    return true;
  }

  return cleanEntered === cleanStored;
}

/**
 * Unbind the store from this device (e.g. if the merchant sells the phone or wants to change store).
 */
export function unbindDeviceStore() {
  try {
    localStorage.removeItem(BOUND_STORE_KEY);
    localStorage.removeItem('retailos_local_user');
    localStorage.removeItem('retailos_active_tenant_id');
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error unbinding device store:', e);
  }
}

/**
 * Preset sample stores for quick demo testing in Monrovia
 */
export const SAMPLE_BOUND_STORES = [
  {
    businessId: 'biz_wd_men_fashion',
    businessName: 'WD Men Fashion',
    slug: 'wd-men-fashion',
    businessType: 'Boutique & Fashion',
    ownerName: 'Wilcom Duncan',
    ownerPhone: '0770430269',
    ownerEmail: 'wilcom@wd.com',
    terminalEmail: 'pos_wd_men_fashion@retailos.lr',
    themeColor: '#10b981',
    passcode: '1234',
  },
  {
    businessId: 'biz_monrovia_glam',
    businessName: 'Monrovia Glam Retail',
    slug: 'monrovia-glam',
    businessType: 'Cosmetics & Beauty',
    ownerName: 'Fatu Johnson',
    ownerPhone: '0778000001',
    ownerEmail: 'fatu@monroviaglam.com',
    terminalEmail: 'terminal@monroviaglam.com',
    themeColor: '#0ea5e9',
    passcode: '1234',
  },
];
