import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTenant } from './contexts/TenantContext';
import { useApp } from './contexts/AppContext';

// Direct critical views
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ErrorBoundary from './components/shared/ErrorBoundary';
import PwaInstallPrompt from './components/shared/PwaInstallPrompt';

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

  // Navigation State: 'landing' | 'login' | 'admin' | 'workspace' | 'catalog'
  const [currentView, setCurrentView] = useState(() => {
    // 1. Check direct URL pathname, hash or query params
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (
      pathname === '/admin' || 
      pathname.startsWith('/admin') || 
      hash === '#admin' || 
      viewParam === 'admin' || 
      params.has('admin')
    ) {
      return 'admin';
    }

    if (
      pathname === '/app' || 
      pathname.startsWith('/app') || 
      pathname === '/login' || 
      pathname.startsWith('/login') || 
      hash === '#app' || 
      hash === '#login' || 
      viewParam === 'app' || 
      viewParam === 'login' || 
      params.has('app') || 
      params.has('login')
    ) {
      return 'login';
    }
    if (hash === '#catalog' || viewParam === 'catalog') return 'catalog';
    if (hash === '#landing' || viewParam === 'landing') return 'landing';

    return 'landing';
  });

  // Keep view synchronized with hash and URL navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      if (
        pathname === '/admin' || 
        pathname.startsWith('/admin') || 
        hash === '#admin' || 
        params.has('admin')
      ) {
        setCurrentView('admin');
      } else if (
        pathname === '/app' || 
        pathname.startsWith('/app') || 
        pathname === '/login' || 
        pathname.startsWith('/login') || 
        hash === '#app' || 
        hash === '#login' || 
        params.has('app') || 
        params.has('login')
      ) {
        setCurrentView('login');
      } else if (hash === '#catalog') {
        setCurrentView('catalog');
      } else if (hash === '#landing') {
        setCurrentView('landing');
      } else if (hash === '#workspace' || hash === '#pos') {
        setCurrentView('workspace');
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  // Synchronize view with authentication state
  useEffect(() => {
    if (currentUser && currentView !== 'catalog') {
      setCurrentView('workspace');
      if (isSuperAdmin) {
        setActiveModule('superadmin');
      }
    } else if (!currentUser && currentView === 'workspace') {
      setCurrentView('login');
    }
  }, [currentUser, isSuperAdmin]);

  // Non-blocking auth resolution: Never stall the user on login or catalog screens
  if (authLoading && currentView === 'workspace' && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3 shadow-sm" />
        <p className="text-xs text-slate-600 font-bold tracking-wider uppercase">
          Loading RetailOS Liberia...
        </p>
      </div>
    );
  }

  // 1. Public Digital Storefront Catalog
  if (currentView === 'catalog') {
    return (
      <ErrorBoundary>
        <PwaInstallPrompt />
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
        <PwaInstallPrompt />
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

  // 3. Super-Admin Master Portal Login (/admin)
  if (currentView === 'admin' && !currentUser) {
    return (
      <ErrorBoundary>
        <PwaInstallPrompt />
        <AdminLoginPage
          onBackToLanding={() => {
            window.location.hash = '#landing';
            setCurrentView('landing');
          }}
          onGoToApp={() => {
            window.location.hash = '#app';
            setCurrentView('login');
          }}
          onSuccess={() => {
            setActiveModule('superadmin');
            window.location.hash = '#workspace';
            setCurrentView('workspace');
          }}
        />
      </ErrorBoundary>
    );
  }

  // 4. White-Label Staff & Owner Login Page (/app or /login or any unauthenticated state)
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <PwaInstallPrompt />
        <LoginPage
          onBackToLanding={() => {
            window.location.hash = '#landing';
            setCurrentView('landing');
          }}
          onGoToAdmin={() => {
            window.location.hash = '#admin';
            setCurrentView('admin');
          }}
          onSuccess={() => {
            window.location.hash = '#workspace';
            setCurrentView('workspace');
          }}
        />
      </ErrorBoundary>
    );
  }

  // 5. Authenticated Store Workspace / POS Shell
  return (
    <ErrorBoundary>
      <PwaInstallPrompt />
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
          onSignOut={() => {
            if (isSuperAdmin) {
              window.location.hash = '#admin';
              setCurrentView('admin');
            } else {
              window.location.hash = '#app';
              setCurrentView('login');
            }
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
