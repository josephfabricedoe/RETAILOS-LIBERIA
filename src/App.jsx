import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTenant } from './contexts/TenantContext';
import { useApp } from './contexts/AppContext';

// Direct critical views
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Lazy-loaded heavy views
const Shell = lazy(() => import('./components/layout/Shell'));
const CustomerCatalog = lazy(() => import('./components/public/CustomerCatalog'));

const PageFallback = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3 shadow-sm" />
    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">
      Loading...
    </p>
  </div>
);

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

  // Non-blocking auth resolution: Only display fullscreen initializing spinner if entering workspace/login
  if (authLoading && (currentView === 'workspace' || currentView === 'login')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4 shadow-sm" />
        <p className="text-xs text-slate-600 font-bold tracking-wider uppercase">
          Initializing RetailOS Liberia...
        </p>
      </div>
    );
  }

  // 1. Public Digital Storefront Catalog
  if (currentView === 'catalog') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <CustomerCatalog
            onOpenStaffLogin={() => {
              window.location.hash = '#login';
              setCurrentView('login');
            }}
          />
        </Suspense>
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
          onGoToLogin={() => {
            window.location.hash = '#login';
            setCurrentView('login');
          }}
          onStoreRegistered={(newStore) => {
            if (newStore?.businessId) {
              switchTenant(newStore.businessId);
            }
            window.location.hash = '#workspace';
            setCurrentView('workspace');
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
      <Suspense fallback={<PageFallback />}>
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
      </Suspense>
    </ErrorBoundary>
  );
}
