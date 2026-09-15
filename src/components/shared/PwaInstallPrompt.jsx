import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Detect if already running as standalone installed app
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Android / Chrome PWA install trigger
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS, if not standalone and hasn't dismissed in this session, show prompt
    if (isIosDevice && !standalone && !sessionStorage.getItem('retailos_ios_pwa_dismissed')) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // If Android beforeinstallprompt hasn't triggered (e.g. inside Facebook webview)
      alert("To install: Tap the 3 dots (⋮) in your browser menu and choose 'Install app' or 'Add to Home screen'.");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (e) {
      console.warn('Install prompt error:', e);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      sessionStorage.setItem('retailos_ios_pwa_dismissed', 'true');
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Top Installation Ribbon */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs shadow-md z-40 sticky top-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="truncate font-semibold">
            {isIOS ? (
              <>Install <strong>RetailOS</strong> on your iPhone for instant 1-tap launch!</>
            ) : (
              <>Install <strong>RetailOS Liberia</strong> App on your home screen!</>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1 bg-white text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 font-black rounded-lg transition-colors text-xs shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Install App</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-white/70 hover:text-white rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                R
              </div>
              <div>
                <h4 className="font-black text-slate-950 text-base">Install on iPhone / iPad</h4>
                <p className="text-xs text-slate-500">Add RetailOS to your Home Screen</p>
              </div>
            </div>

            <div className="space-y-4 my-5 text-xs text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900">Tap the Safari Share button</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                    Look for the <Share className="w-3.5 h-3.5 text-blue-600 inline" /> icon at the bottom of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900">Select "Add to Home Screen"</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-slate-800 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">Tap "Add" in top right</p>
                  <p className="text-slate-500 mt-0.5">
                    RetailOS will appear as a standalone app on your iPhone home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/25"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
