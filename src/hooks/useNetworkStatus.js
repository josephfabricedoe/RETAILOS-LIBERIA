import { useState, useEffect, useCallback, useRef } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [reconnected, setReconnected] = useState(false);
  const wasOffline = useRef(!isOnline);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline.current) {
      setReconnected(true);
      const timer = setTimeout(() => {
        setReconnected(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
    wasOffline.current = false;
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    wasOffline.current = true;
    setReconnected(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Active ping verification (helps detect cellular connection with 0 balance / data bundle)
  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${window.location.origin}/manifest.webmanifest?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const ok = res.ok || res.status === 304;
      if (ok && !isOnline) {
        handleOnline();
      }
      return ok;
    } catch {
      // In offline PWA, Service Worker may answer, so fall back to navigator.onLine
      return navigator.onLine;
    }
  }, [isOnline, handleOnline]);

  return { isOnline, reconnected, checkConnection };
}
