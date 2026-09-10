import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-white">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-cyan-400 animate-bounce" />
        <span>Install <strong>RetailOS Liberia</strong> App on home screen for full offline POS access!</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors text-xs"
        >
          Install App
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
