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

export function TenantProvider({ children, currentUser }) {
  const [allTenants, setAllTenants] = useState([]);
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

    return DEFAULT_DEMO_BUSINESS.businessId;
  });

  const [currentTenant, setCurrentTenant] = useState(DEFAULT_DEMO_BUSINESS);
  const [loadingTenants, setLoadingTenants] = useState(true);

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
          setAllTenants(list);

          // Find match by businessId or slug or default
          const found = list.find(b => b.businessId === currentTenantId || b.slug === currentTenantId || b.id === currentTenantId);
          if (found) {
            setCurrentTenant(found);
          } else if (list.length > 0) {
            setCurrentTenant(list[0]);
            setCurrentTenantId(list[0].businessId || list[0].id);
          }
        } else {
          // Auto-seed default business if collection is empty
          try {
            await setDoc(doc(db, 'businesses', DEFAULT_DEMO_BUSINESS.businessId), DEFAULT_DEMO_BUSINESS, { merge: true });
            setAllTenants([DEFAULT_DEMO_BUSINESS]);
            setCurrentTenant(DEFAULT_DEMO_BUSINESS);
          } catch (e) {
            console.warn('Tenant seed notice:', e);
          }
        }
        setLoadingTenants(false);
      },
      (err) => {
        console.warn('Businesses listener notice:', err);
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

    await setDoc(doc(db, 'businesses', businessId), fullRecord, { merge: true });
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
