import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentTenant, updateTenant } = useTenant();
  const [activeModule, setActiveModule] = useState('pos');
  const [adminTab, setAdminTab] = useState('stores');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Currency configuration
  const [currencyMode, setCurrencyMode] = useState(currentTenant?.currencyMode || 'dual');
  const [primaryCurrency, setPrimaryCurrency] = useState(currentTenant?.primaryCurrency || currentTenant?.defaultCurrency || 'USD');
  const [primarySymbol, setPrimarySymbol] = useState(currentTenant?.primarySymbol || '$');
  const [secondaryCurrency, setSecondaryCurrency] = useState(currentTenant?.secondaryCurrency || 'LRD');
  const [secondarySymbol, setSecondarySymbol] = useState(currentTenant?.secondarySymbol || 'L$');
  const [exchangeRate, setExchangeRate] = useState(currentTenant?.exchangeRate || 198);
  const [currency, setCurrency] = useState(currentTenant?.primaryCurrency || 'USD');

  // Sync settings when active tenant changes
  useEffect(() => {
    if (currentTenant) {
      if (currentTenant.currencyMode) setCurrencyMode(currentTenant.currencyMode);
      if (currentTenant.primaryCurrency) {
        setPrimaryCurrency(currentTenant.primaryCurrency);
        setCurrency(currentTenant.primaryCurrency);
      }
      if (currentTenant.primarySymbol) setPrimarySymbol(currentTenant.primarySymbol);
      if (currentTenant.secondaryCurrency) setSecondaryCurrency(currentTenant.secondaryCurrency);
      if (currentTenant.secondarySymbol) setSecondarySymbol(currentTenant.secondarySymbol);
      if (currentTenant.exchangeRate) setExchangeRate(currentTenant.exchangeRate);
    }
  }, [currentTenant]);

  const toggleCurrency = () => {
    if (currencyMode !== 'dual') return;
    setCurrency((c) => (c === primaryCurrency ? secondaryCurrency : primaryCurrency));
  };

  const toggleSidebar = () => setIsSidebarOpen((o) => !o);

  const updateExchangeRate = async (rate) => {
    const numRate = Number(rate);
    setExchangeRate(numRate);
    if (updateTenant) {
      await updateTenant({ exchangeRate: numRate });
    }
  };

  const updateCurrencySettings = async (settings) => {
    if (settings.currencyMode) setCurrencyMode(settings.currencyMode);
    if (settings.primaryCurrency) {
      setPrimaryCurrency(settings.primaryCurrency);
      setCurrency(settings.primaryCurrency);
    }
    if (settings.primarySymbol) setPrimarySymbol(settings.primarySymbol);
    if (settings.secondaryCurrency) setSecondaryCurrency(settings.secondaryCurrency);
    if (settings.secondarySymbol) setSecondarySymbol(settings.secondarySymbol);
    if (settings.exchangeRate) setExchangeRate(Number(settings.exchangeRate));

    if (updateTenant) {
      await updateTenant(settings);
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
    currencyMode,
    primaryCurrency,
    primarySymbol,
    secondaryCurrency,
    secondarySymbol,
    exchangeRate,
  };

  const updateStoreSettings = async (newSettings) => {
    if (updateTenant) {
      await updateTenant(newSettings);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        adminTab,
        setAdminTab,
        currency,
        toggleCurrency,
        currencyMode,
        primaryCurrency,
        primarySymbol,
        secondaryCurrency,
        secondarySymbol,
        exchangeRate,
        updateExchangeRate,
        updateCurrencySettings,
        isSidebarOpen,
        toggleSidebar,
        storeSettings,
        updateStoreSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
