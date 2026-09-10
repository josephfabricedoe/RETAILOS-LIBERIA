import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  getDocs,
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isSuperAdminEmail } from '../utils/rbac';

const TenantContext = createContext(null);

// Default fallback seed for demo / first launch in Liberia
export const DEFAULT_DEMO_BUSINESS = {
  businessId: 'biz_monrovia_glam',
  businessName: 'Monrovia Glam Retail',
  slug: 'monrovia-glam',
  businessType: 'Boutique & Fashion',
  ownerName: 'Fatu Johnson',
  ownerEmail: 'fatu@monroviaglam.com',
  ownerPhone: '+231778000001',
  terminalEmail: 'terminal@monroviaglam.com',
  logoUrl: '',
  themeColor: '#0ea5e9', // Clean ocean blue
  defaultCurrency: 'USD',
  exchangeRate: 198,
  address: 'Broad & Randall Street, Monrovia, Liberia',
  phone: '0778000001',
  whatsappNumber: '231778000001',
  subscriptionPlan: 'growth',
  subscriptionStatus: 'active',
  trialEndsAt: '2026-10-10',
  createdAt: new Date().toISOString().slice(0, 10),
};

export const WD_MEN_FASHION = {
  businessId: 'biz_wd_men_fashion',
  businessName: 'WD Men Fashion',
  slug: 'wd-men-fashion',
  businessType: 'Boutique & Fashion',
  ownerName: 'Wilcom Duncan',
  ownerEmail: 'wilcom@wd.com',
  ownerPhone: '0770430269',
  terminalEmail: 'pos_wd_men_fashion@retailos.lr',
  logoUrl: '',
  themeColor: '#10b981', // Clean emerald green
  currencyMode: 'dual',
  primaryCurrency: 'USD',
  primarySymbol: '$',
  secondaryCurrency: 'LRD',
  secondarySymbol: 'L$',
  defaultCurrency: 'USD',
  exchangeRate: 198,
  fxRate: 198,
  address: 'Randall Street, Waterside, Monrovia, Liberia',
  phone: '0770430269',
  whatsappNumber: '231770430269',
  subscriptionPlan: 'starter',
  subscriptionStatus: 'active',
  trialEndsAt: '2026-12-31',
  createdAt: new Date().toISOString().slice(0, 10),
};

const getLocalTenants = () => {
  try {
    const raw = localStorage.getItem('retailos_local_tenants');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export function TenantProvider({ children, currentUser }) {
  const [allTenants, setAllTenants] = useState(() => {
    const locals = getLocalTenants();
    return [WD_MEN_FASHION, DEFAULT_DEMO_BUSINESS, ...locals];
  });

  const [currentTenantId, setCurrentTenantId] = useState(() => {
    // 1. Check URL query (?store=slug or ?biz=slug)
    const urlParams = new URLSearchParams(window.location.search);
    const queryStore = urlParams.get('store') || urlParams.get('biz');
    if (queryStore) return queryStore;

    // 2. Check saved tenant ID
    try {
      const saved = localStorage.getItem('retailos_active_tenant_id');
      if (saved) return saved;
    } catch (e) {}

    return WD_MEN_FASHION.businessId;
  });

  const [currentTenant, setCurrentTenant] = useState(() => {
    const initialList = [WD_MEN_FASHION, DEFAULT_DEMO_BUSINESS, ...getLocalTenants()];
    return initialList.find(b => b.businessId === currentTenantId || b.slug === currentTenantId) || WD_MEN_FASHION;
  });

  const [loadingTenants, setLoadingTenants] = useState(false);

  const isSuperAdmin = currentUser ? isSuperAdminEmail(currentUser.email) : false;

  // Listen to all businesses in real-time
  useEffect(() => {
    let mounted = true;
    const unsub = onSnapshot(
      collection(db, 'businesses'),
      async (snap) => {
        if (!mounted) return;
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Merge with predefined seeds and local storage
          const merged = [WD_MEN_FASHION, ...list, ...getLocalTenants()];
          const unique = Array.from(new Map(merged.map(item => [item.businessId || item.id, item])).values());
          setAllTenants(unique);

          // Find match by businessId or slug or default
          const found = unique.find(b => b.businessId === currentTenantId || b.slug === currentTenantId || b.id === currentTenantId);
          if (found) {
            setCurrentTenant(found);
          } else if (unique.length > 0) {
            setCurrentTenant(unique[0]);
            setCurrentTenantId(unique[0].businessId || unique[0].id);
          }
        } else {
          const fallbackList = [WD_MEN_FASHION, DEFAULT_DEMO_BUSINESS, ...getLocalTenants()];
          setAllTenants(fallbackList);
          setCurrentTenant(fallbackList[0]);
        }
        setLoadingTenants(false);
      },
      (err) => {
        console.warn('Businesses listener notice (offline / quota fallback active):', err);
        const fallbackList = [WD_MEN_FASHION, DEFAULT_DEMO_BUSINESS, ...getLocalTenants()];
        setAllTenants(fallbackList);
        const found = fallbackList.find(b => b.businessId === currentTenantId || b.slug === currentTenantId || b.id === currentTenantId);
        if (found) {
          setCurrentTenant(found);
        } else {
          setCurrentTenant(fallbackList[0]);
        }
        setLoadingTenants(false);
      }
    );

    return () => {
      mounted = false;
      unsub();
    };
  }, [currentTenantId]);

  // If user logs in with personal or terminal email, automatically resolve their assigned store
  useEffect(() => {
    if (!currentUser || !allTenants.length) return;
    const email = currentUser.email?.toLowerCase().trim();

    // Super Admins don't get forced to one store, but regular users/terminals do!
    if (!isSuperAdmin) {
      const matchedStore = allTenants.find(b => 
        b.terminalEmail?.toLowerCase().trim() === email || 
        b.ownerEmail?.toLowerCase().trim() === email
      );
      if (matchedStore) {
        const id = matchedStore.businessId || matchedStore.id;
        setCurrentTenantId(id);
        setCurrentTenant(matchedStore);
        try {
          localStorage.setItem('retailos_active_tenant_id', id);
        } catch (e) {}
      }
    }
  }, [currentUser, allTenants, isSuperAdmin]);

  // Apply tenant dynamic branding (theme accent color) to document
  useEffect(() => {
    if (currentTenant?.themeColor) {
      document.documentElement.style.setProperty('--brand-primary', currentTenant.themeColor);
      document.documentElement.style.setProperty('--brand-accent', currentTenant.themeColor);
    }
  }, [currentTenant?.themeColor]);

  // Switch active tenant workspace (for Super Admins or multi-store owners)
  const switchTenant = (tenantIdOrSlug) => {
    const found = allTenants.find(b => b.businessId === tenantIdOrSlug || b.slug === tenantIdOrSlug || b.id === tenantIdOrSlug);
    const targetId = found ? (found.businessId || found.id) : tenantIdOrSlug;
    setCurrentTenantId(targetId);
    if (found) setCurrentTenant(found);
    try {
      localStorage.setItem('retailos_active_tenant_id', targetId);
    } catch (e) {}
  };

  // Helper to get scoped collection reference: /businesses/{businessId}/{collectionName}
  const getTenantCol = (collectionName) => {
    const bizId = currentTenant?.businessId || currentTenantId || DEFAULT_DEMO_BUSINESS.businessId;
    return collection(db, 'businesses', bizId, collectionName);
  };

  // Helper to get scoped doc reference: /businesses/{businessId}/{collectionName}/{docId}
  const getTenantDoc = (collectionName, docId) => {
    const bizId = currentTenant?.businessId || currentTenantId || DEFAULT_DEMO_BUSINESS.businessId;
    return doc(db, 'businesses', bizId, collectionName, docId);
  };

  // Update current tenant configuration
  const updateTenant = async (fields) => {
    const bizId = currentTenant?.businessId || currentTenantId || DEFAULT_DEMO_BUSINESS.businessId;
    await setDoc(doc(db, 'businesses', bizId), {
      ...fields,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setCurrentTenant(prev => ({ ...prev, ...fields }));
  };

  // Update specific tenant configuration (for Super Admin dashboard)
  const updateTenantById = async (targetBizId, fields) => {
    if (!targetBizId) return;
    await setDoc(doc(db, 'businesses', targetBizId), {
      ...fields,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    if ((currentTenant?.businessId || currentTenantId) === targetBizId) {
      setCurrentTenant(prev => ({ ...prev, ...fields }));
    }
  };

  // Register a new tenant business (Used by Super Admin & Self-Service onboarding)
  const createTenant = async (newStoreData) => {
    const slug = newStoreData.slug || newStoreData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const businessId = newStoreData.businessId || `biz_${slug}_${Date.now().toString().slice(-4)}`;

    const fullRecord = {
      businessId,
      businessName: newStoreData.businessName,
      slug,
      businessType: newStoreData.businessType || 'General Retail',
      ownerName: newStoreData.ownerName || '',
      ownerEmail: newStoreData.ownerEmail || '',
      ownerPhone: newStoreData.ownerPhone || '',
      terminalEmail: newStoreData.terminalEmail || '',
      logoUrl: newStoreData.logoUrl || '',
      themeColor: newStoreData.themeColor || '#0ea5e9',
      defaultCurrency: newStoreData.defaultCurrency || 'USD',
      exchangeRate: Number(newStoreData.exchangeRate) || 198,
      address: newStoreData.address || 'Monrovia, Liberia',
      phone: newStoreData.phone || newStoreData.ownerPhone || '',
      whatsappNumber: newStoreData.whatsappNumber || '',
      subscriptionPlan: newStoreData.subscriptionPlan || 'starter',
      subscriptionStatus: newStoreData.subscriptionStatus || 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await setDoc(doc(db, 'businesses', businessId), fullRecord, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc notice (using local storage fallback):', e);
    }
    // Always persist to local storage for offline resilience
    try {
      const existing = getLocalTenants();
      const updated = [fullRecord, ...existing.filter(t => t.businessId !== businessId)];
      localStorage.setItem('retailos_local_tenants', JSON.stringify(updated));
      localStorage.setItem('retailos_active_tenant_id', businessId);
      setAllTenants(prev => [fullRecord, ...prev.filter(t => (t.businessId || t.id) !== businessId)]);
    } catch (e) {}

    setCurrentTenantId(businessId);
    setCurrentTenant(fullRecord);
    return fullRecord;
  };

    const activeStoreObj = currentTenant
      ? { ...currentTenant, name: currentTenant.businessName || currentTenant.name || 'Store', fxRate: currentTenant.exchangeRate || 198 }
      : { ...DEFAULT_DEMO_BUSINESS, name: DEFAULT_DEMO_BUSINESS.businessName, fxRate: DEFAULT_DEMO_BUSINESS.exchangeRate };

  return (
    <TenantContext.Provider value={{
      currentTenant,
      tenant: currentTenant,
      currentStore: activeStoreObj,
      store: activeStoreObj,
      tenantId: currentTenant?.businessId || currentTenantId,
      allTenants,
      loadingTenants,
      isSuperAdmin,
      switchTenant,
      updateTenant,
      updateTenantById,
      createTenant,
      getTenantCol,
      getTenantDoc,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider');
  return ctx;
}
