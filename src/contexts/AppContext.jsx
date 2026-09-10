import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentTenant, updateTenant } = useTenant();
  const [activeModule, setActiveModule] = useState('pos');
  const [currency, setCurrency] = useState(currentTenant?.defaultCurrency || 'USD');
  const [exchangeRate, setExchangeRate] = useState(currentTenant?.exchangeRate || 198);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync exchange rate and currency when active tenant changes
  useEffect(() => {
    if (currentTenant) {
      if (currentTenant.exchangeRate) setExchangeRate(currentTenant.exchangeRate);
      if (currentTenant.defaultCurrency) setCurrency(currentTenant.defaultCurrency);
    }
  }, [currentTenant]);

  const toggleCurrency = () => setCurrency(c => c === 'USD' ? 'LRD' : 'USD');
  const toggleSidebar = () => setIsSidebarOpen(o => !o);

  const updateExchangeRate = async (rate) => {
    const numRate = Number(rate);
    setExchangeRate(numRate);
    if (updateTenant) {
      await updateTenant({ exchangeRate: numRate });
    }
  };

  const storeSettings = {
    storeName: currentTenant?.businessName || 'Retail Store',
    businessType: currentTenant?.businessType || 'General Retail',
    address: currentTenant?.address || 'Monrovia, Liberia',
    phone: currentTenant?.phone || currentTenant?.ownerPhone || '',
    whatsappNumber: currentTenant?.whatsappNumber || currentTenant?.ownerPhone || '',
    logoUrl: currentTenant?.logoUrl || '',
    themeColor: currentTenant?.themeColor || '#0ea5e9',
    exchangeRate: exchangeRate,
  };

  const updateStoreSettings = async (newSettings) => {
    if (updateTenant) {
      await updateTenant(newSettings);
    }
  };

  return (
    <AppContext.Provider value={{
      activeModule,
      setActiveModule,
      currency,
      toggleCurrency,
      exchangeRate,
      updateExchangeRate,
      isSidebarOpen,
      toggleSidebar,
      storeSettings,
      updateStoreSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
