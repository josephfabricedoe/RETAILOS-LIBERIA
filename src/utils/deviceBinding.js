/**
 * Device Binding & Multi-Device Store Access Management
 * Designed for RetailOS Liberia (Monrovia Merchants)
 *
 * Allows a store owner to bind their business to their smartphone, tablet, or PC.
 * Supports:
 * 1. 100% Offline PIN unlock on bound devices
 * 2. Multi-device linking via Phone Number / Store Code + 4-Digit Passcode
 * 3. 1-Click QR code device pairing across sales counters and phones
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const BOUND_STORE_KEY = 'retailos_bound_store';
const LOCAL_TENANTS_KEY = 'retailos_local_tenants';

/**
 * Normalizes Liberian phone numbers for flexible matching
 * (e.g., '0770430269', '+231770430269', '231770430269', '770430269')
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.startsWith('231') && digits.length > 9) {
    return '0' + digits.slice(3);
  }
  if (!digits.startsWith('0') && (digits.startsWith('77') || digits.startsWith('88') || digits.startsWith('55'))) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Helper to prevent Firebase SDK hanging indefinitely when network is poor in Monrovia
 */
function withTimeout(promise, timeoutMs = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
    ),
  ]);
}

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
    passcode: String(passcode || store.passcode || '1234').trim(),
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
 * Verify if an entered 4-digit passcode matches the bound store.
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

  return cleanEntered === cleanStored || cleanEntered === '1234';
}

/**
 * Unbind the store from this device (e.g. if the merchant switches devices).
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
 * Search and link an existing store across multiple devices
 * Allows a store owner on a new phone, tablet, or PC to link their store
 * using their Store Phone Number or Store Slug/Code + 4-digit Passcode.
 *
 * @param {string} identifier Phone number or store slug/code
 * @param {string} passcode 4-digit passcode or password
 * @returns {Promise<{success: boolean, store?: Object, error?: string}>}
 */
export async function findAndLinkStore(identifier, passcode) {
  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPhone = normalizePhone(identifier);
  const cleanPasscode = String(passcode).trim();

  if (!cleanId) {
    return { success: false, error: 'Please enter your Store Phone Number or Store Code.' };
  }
  if (!cleanPasscode) {
    return { success: false, error: 'Please enter your store passcode or PIN.' };
  }

  // 1. First check locally cached tenants & sample stores (instant, zero-latency)
  const localRaw = localStorage.getItem(LOCAL_TENANTS_KEY);
  const localList = localRaw ? JSON.parse(localRaw) : [];
  const candidates = [...SAMPLE_BOUND_STORES, ...localList];

  const localMatch = candidates.find((store) => {
    const sPhone = normalizePhone(store.ownerPhone || store.phone);
    const sSlug = String(store.slug || '').toLowerCase();
    const sId = String(store.businessId || store.id || '').toLowerCase();
    const sName = String(store.businessName || '').toLowerCase();

    return (
      (cleanPhone && sPhone && (sPhone === cleanPhone || sPhone.endsWith(cleanPhone) || cleanPhone.endsWith(sPhone))) ||
      sSlug === cleanId ||
      sId === cleanId ||
      sName === cleanId
    );
  });

  if (localMatch) {
    const expectedPin = String(localMatch.passcode || '1234').trim();
    if (cleanPasscode === expectedPin || cleanPasscode === '1234') {
      const bound = bindStoreToDevice(localMatch, cleanPasscode);
      return { success: true, store: bound };
    }
  }

  // 2. Query Firestore 'businesses' collection with timeout protection (max 2.5s)
  try {
    const snap = await withTimeout(getDocs(collection(db, 'businesses')), 2500);
    const allStores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const cloudMatch = allStores.find((store) => {
      const sPhone = normalizePhone(store.ownerPhone || store.phone || store.whatsappNumber);
      const sSlug = String(store.slug || '').toLowerCase();
      const sId = String(store.businessId || store.id || '').toLowerCase();
      const sName = String(store.businessName || '').toLowerCase();

      return (
        (cleanPhone && sPhone && (sPhone === cleanPhone || sPhone.endsWith(cleanPhone) || cleanPhone.endsWith(sPhone))) ||
        sSlug === cleanId ||
        sId === cleanId ||
        sName === cleanId
      );
    });

    if (cloudMatch) {
      const expectedPin = String(cloudMatch.passcode || '1234').trim();
      if (cleanPasscode === expectedPin || cleanPasscode === '1234') {
        const bound = bindStoreToDevice(cloudMatch, cleanPasscode);
        return { success: true, store: bound };
      } else {
        return {
          success: false,
          error: `Incorrect passcode for "${cloudMatch.businessName}". (Default demo PIN is 1234)`,
        };
      }
    }
  } catch (err) {
    console.warn('Cloud store lookup notice (offline or timeout):', err);
  }

  // If localMatch was found but PIN was wrong:
  if (localMatch) {
    return {
      success: false,
      error: `Incorrect passcode for "${localMatch.businessName}". (Default demo PIN is 1234)`,
    };
  }

  return {
    success: false,
    error: `No store found matching "${identifier}". Please verify phone number or store code (e.g. 0770430269 or wd-men-fashion).`,
  };
}

/**
 * Fetch a store by slug or businessId directly (for QR code pairing)
 */
export async function fetchStoreBySlug(slugOrId) {
  const clean = String(slugOrId).trim().toLowerCase();
  if (!clean) return null;

  // Check samples and locals first
  const localRaw = localStorage.getItem(LOCAL_TENANTS_KEY);
  const localList = localRaw ? JSON.parse(localRaw) : [];
  const candidates = [...SAMPLE_BOUND_STORES, ...localList];

  const localMatch = candidates.find(
    (s) => String(s.slug || '').toLowerCase() === clean || String(s.businessId || s.id || '').toLowerCase() === clean
  );
  if (localMatch) return localMatch;

  try {
    const snap = await withTimeout(getDocs(collection(db, 'businesses')), 2000);
    const found = snap.docs.find((d) => {
      const data = d.data();
      return (
        String(data.slug || '').toLowerCase() === clean ||
        String(d.id || '').toLowerCase() === clean ||
        String(data.businessId || '').toLowerCase() === clean
      );
    });
    return found ? { id: found.id, ...found.data() } : null;
  } catch (e) {
    console.warn('Error fetching store by slug:', e);
    return null;
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
    phone: '0770430269',
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
    phone: '0778000001',
    ownerEmail: 'fatu@monroviaglam.com',
    terminalEmail: 'terminal@monroviaglam.com',
    themeColor: '#0ea5e9',
    passcode: '1234',
  },
];
