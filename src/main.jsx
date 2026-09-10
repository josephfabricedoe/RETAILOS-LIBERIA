import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TenantProvider } from './contexts/TenantContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TenantProvider>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </TenantProvider>
  </React.StrictMode>
);
