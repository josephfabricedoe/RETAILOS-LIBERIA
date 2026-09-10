import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTenant } from './contexts/TenantContext';
import { useApp } from './contexts/AppContext';

// Views & Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Shell from './components/layout/Shell';
import CustomerCatalog from './components/public/CustomerCatalog';
import ErrorBoundary from './components/shared/ErrorBoundary';

export default function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const { currentTenant, switchTenant, allTenants, isSuperAdmin } = useTenant();
  const { setActiveModule } = useApp();

  // Navigation State: 'landing' | 'login' | 'workspace' | 'catalog'
  const [currentView, setCurrentView] = useState(() => {
    // 1. Check URL hash or query params
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (hash === '#catalog' || viewParam === 'catalog') return 'catalog';
    if (hash === '#login' || viewParam === 'login') return 'login';
    if (hash === '#landing' || viewParam === 'landing') return 'landing';

    // 2. If user already has a saved session token in localStorage/session
    return 'landing';
  });

  // Keep view synchronized with hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#catalog') setCurrentView('catalog');
      else if (hash === '#login') setCurrentView('login');
      else if (hash === '#landing') setCurrentView('landing');
      else if (hash === '#workspace' || hash === '#pos') setCurrentView('workspace');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // When user logs in, route them straight into workspace
  useEffect(() => {
    if (currentUser && currentView !== 'catalog') {
      setCurrentView('workspace');
    }
  }, [currentUser]);

  // Loading spinner during Firebase initial auth resolution
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Initializing RetailOS Liberia...
        </p>
      </div>
    );
  }

  // 1. Public Digital Storefront Catalog
  if (currentView === 'catalog') {
    return (
      <ErrorBoundary>
        <CustomerCatalog
          onOpenStaffLogin={() => {
            window.location.hash = '#login';
            setCurrentView('login');
          }}
        />
      </ErrorBoundary>
    );
  }

  // 2. SaaS Marketing Landing Page
  if (currentView === 'landing' && !currentUser) {
    return (
      <ErrorBoundary>
        <LandingPage
          onOpenLogin={() => {
            window.location.hash = '#login';
            setCurrentView('login');
          }}
          onEnterDemo={(storeId) => {
            if (storeId) switchTenant(storeId);
            setCurrentView('workspace');
          }}
        />
      </ErrorBoundary>
    );
  }

  // 3. White-Label Staff & Owner Login Page
  if (currentView === 'login' && !currentUser) {
    return (
      <ErrorBoundary>
        <LoginPage
          onBackToLanding={() => {
            window.location.hash = '#landing';
            setCurrentView('landing');
          }}
          onSuccess={() => {
            window.location.hash = '#workspace';
            setCurrentView('workspace');
          }}
        />
      </ErrorBoundary>
    );
  }

  // 4. Authenticated Store Workspace / POS Shell
  return (
    <ErrorBoundary>
      <Shell
        onGoToCatalog={() => {
          window.location.hash = '#catalog';
          setCurrentView('catalog');
        }}
        onGoToLanding={() => {
          window.location.hash = '#landing';
          setCurrentView('landing');
        }}
      />
    </ErrorBoundary>
  );
}
