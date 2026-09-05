import React from 'react';
import { RefreshCw, X, Download, WifiOff } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export default function ReloadPrompt() {
  const {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    closePrompt,
    isOnline
  } = usePWA();

  if (!needRefresh && !offlineReady && isOnline) {
    return null;
  }

  return (
    <aside className="pwa-toast-container" aria-live="polite">
      {/* Offline Alert Banner (Only when internet connection is lost) */}
      {!isOnline && (
        <div className="pwa-toast pwa-offline-toast">
          <div className="pwa-toast-icon">
            <WifiOff size={18} />
          </div>
          <div className="pwa-toast-message">
            <span className="pwa-toast-title">You're currently offline</span>
            <span className="pwa-toast-desc">Cached songs and tools are available. Server features require internet.</span>
          </div>
        </div>
      )}

      {/* New Version Update Banner */}
      {needRefresh && (
        <div className="pwa-toast pwa-update-toast">
          <div className="pwa-toast-icon">
            <RefreshCw size={18} className="pwa-spin-icon" />
          </div>
          <div className="pwa-toast-message">
            <span className="pwa-toast-title">New version available</span>
            <span className="pwa-toast-desc">Refresh to update to the latest version of Chordician.</span>
          </div>
          <div className="pwa-toast-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => updateServiceWorker(true)}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={closePrompt}
              aria-label="Dismiss update notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Offline Ready notification (shown briefly on initial SW cache) */}
      {offlineReady && !needRefresh && isOnline && (
        <div className="pwa-toast pwa-ready-toast">
          <div className="pwa-toast-icon">
            <Download size={18} />
          </div>
          <div className="pwa-toast-message">
            <span className="pwa-toast-title">Chordician ready for offline use</span>
          </div>
          <div className="pwa-toast-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={closePrompt}
              aria-label="Dismiss ready notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
