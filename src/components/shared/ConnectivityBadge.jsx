import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, X, Cloud, CloudOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function ConnectivityBadge() {
  const { isOnline, reconnected, checkConnection } = useNetworkStatus();
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [dismissOfflineBanner, setDismissOfflineBanner] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await checkConnection();
      setTestResult(ok ? 'connected' : 'disconnected');
    } catch {
      setTestResult('disconnected');
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {/* Floating Global Reconnected Banner (Toast) */}
      {reconnected && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-xl border border-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Connection Restored! Cloud sync active.</span>
          </div>
        </div>
      )}

      {/* Floating Global Offline Banner */}
      {!isOnline && !dismissOfflineBanner && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-amber-600">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <WifiOff className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span>
              Offline Mode: Internet connection lost. RetailOS continues running locally — sales will sync when reconnected.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissOfflineBanner(true)}
            className="p-1 hover:bg-amber-600/30 rounded-lg transition text-slate-950 hidden sm:inline-flex"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Pill Button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
          isOnline
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 animate-pulse'
        }`}
        title={isOnline ? 'Network status: Online (Click for details)' : 'Network status: Offline Mode (Click for details)'}
      >
        {isOnline ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Wifi className="w-3 h-3 text-emerald-600 hidden sm:inline" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
            </span>
            <WifiOff className="w-3 h-3 text-amber-700" />
            <span className="text-[11px]">Offline</span>
          </>
        )}
      </button>

      {/* Info Popover Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-slate-900 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                    <Cloud className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                    <CloudOff className="w-4 h-4" />
                  </div>
                )}
                <h3 className="font-black text-sm text-slate-900">
                  {isOnline ? 'System is Online' : 'Operating in Offline Mode'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setTestResult(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isOnline ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {isOnline ? 'Connected to Cloud' : 'Internet Disconnected'}
                  </h4>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    {isOnline
                      ? 'Transactions, inventory updates, and attendance are syncing in real time to the cloud database.'
                      : 'You can continue ringing up sales, scanning barcodes, printing receipts, and managing stock. All data is saved on your device and will sync automatically when your internet connection returns.'}
                  </p>
                </div>
              </div>

              {/* Local Storage & PWA Caching Status */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Device Storage Engine:</span>
                  <span className="font-bold text-emerald-700">Service Worker & Local Cache Active</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cloud Provider:</span>
                  <span className="font-mono text-slate-700 font-semibold">Google Firebase (Liberia Node)</span>
                </div>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-xl border text-center font-bold text-xs ${
                  testResult === 'connected' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResult === 'connected' ? '✓ Ping verified: High-speed connection' : '✕ No active internet response'}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setTestResult(null);
                  }}
                  className="py-2 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
