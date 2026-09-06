import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredDesktopMode, setStoredDesktopMode } from '../services/storage';
import { Smartphone } from 'lucide-react';

const DeviceModeContext = createContext();

export function DeviceModeProvider({ children }) {
  const [isDesktopMode, setIsDesktopMode] = useState(() => {
    return getStoredDesktopMode();
  });

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    
    if (isDesktopMode) {
      document.documentElement.classList.add('desktop-mode-forced');
      document.body.classList.add('desktop-mode-forced');
      if (metaViewport) {
        metaViewport.setAttribute(
          'content',
          'width=1200, initial-scale=0.35, minimum-scale=0.25, maximum-scale=3.0, user-scalable=yes'
        );
      }
    } else {
      document.documentElement.classList.remove('desktop-mode-forced');
      document.body.classList.remove('desktop-mode-forced');
      if (metaViewport) {
        metaViewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }

    setStoredDesktopMode(isDesktopMode);
  }, [isDesktopMode]);

  const toggleDesktopMode = () => {
    setIsDesktopMode((prev) => !prev);
  };

  const setDesktopMode = (val) => {
    setIsDesktopMode(Boolean(val));
  };

  return (
    <DeviceModeContext.Provider
      value={{
        isDesktopMode,
        toggleDesktopMode,
        setDesktopMode
      }}
    >
      {children}

      {/* Floating Desktop Mode Indicator & Quick Switcher on Mobile Screens */}
      {isDesktopMode && (
        <div
          className="desktop-mode-floating-banner"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-primary, #6366f1)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '30px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => setDesktopMode(false)}
          title="Desktop Mode is active on mobile. Click to switch back to Mobile View."
        >
          <Smartphone size={16} />
          <span>Exit Desktop Mode</span>
        </div>
      )}
    </DeviceModeContext.Provider>
  );
}

export function useDeviceMode() {
  const context = useContext(DeviceModeContext);
  if (!context) {
    throw new Error('useDeviceMode must be used within a DeviceModeProvider');
  }
  return context;
}
