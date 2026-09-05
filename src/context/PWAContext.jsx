import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAContext = createContext({
  canInstall: false,
  isStandalone: false,
  installApp: async () => {},
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: async () => {},
  closePrompt: () => {},
  isOnline: true
});

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Register service worker with prompt mode
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for updates periodically every hour
        setInterval(() => {
          r.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('PWA service worker registration error:', error);
    }
  });

  // Detect standalone display mode
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' && window.navigator.standalone === true);
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      setIsStandalone(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar on mobile
      e.preventDefault();
      // Stash event so it can be triggered unobtrusively by user action
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('Chordician PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error during PWA installation:', err);
      return false;
    }
  }, [deferredPrompt]);

  const closePrompt = useCallback(() => {
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  const canInstall = Boolean(deferredPrompt && !isStandalone);

  return (
    <PWAContext.Provider
      value={{
        canInstall,
        isStandalone,
        installApp,
        needRefresh,
        offlineReady,
        updateServiceWorker,
        closePrompt,
        isOnline
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
