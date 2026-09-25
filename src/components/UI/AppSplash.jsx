import React, { useState, useEffect } from 'react';
import { Piano } from 'lucide-react';

/**
 * Chordician Startup / App Open Splash Screen
 * 
 * Renders a musical, reverent brand opening while the application hydrates.
 * Exits smoothly via GPU composite transform and opacity when isReady transitions to true.
 */
export default function AppSplash({ isReady = false }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(() => {
    // Only show splash on initial cold application boot
    try {
      return Boolean(sessionStorage.getItem('chordician_splash_shown'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isUnmounted) return;

    if (isReady) {
      // Trigger exit animation
      setIsExiting(true);
      try {
        sessionStorage.setItem('chordician_splash_shown', 'true');
      } catch {}

      const exitTimer = setTimeout(() => {
        setIsUnmounted(true);
      }, 320); // Matches --motion-duration-panel (300ms + margin)

      return () => clearTimeout(exitTimer);
    }
  }, [isReady, isUnmounted]);

  // If splash has completed its lifecycle, remove completely from DOM
  if (isUnmounted) {
    return null;
  }

  return (
    <div
      className={`app-splash-container ${isExiting ? 'app-splash-exit' : ''}`}
      role="status"
      aria-label="Chordician initializing"
      aria-live="polite"
    >
      <div className="app-splash-backdrop" />
      <div className="app-splash-content">
        {/* Brand Musical Icon Mark */}
        <div className="app-splash-logo-wrap">
          <div className="app-splash-glow-ring" />
          <div className="brand-logo app-splash-brand-logo" aria-hidden="true">
            <img src="/favicon.svg" alt="" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Wordmark */}
        <div className="app-splash-wordmark-wrap">
          <h1 className="app-splash-wordmark">CHORDICIAN</h1>
          <div className="app-splash-harmony-line">
            <span className="app-splash-line-segment" />
            <span className="app-splash-line-dot" />
            <span className="app-splash-line-segment" />
          </div>
          <p className="app-splash-tagline">EVERY CHORD, FOR HIM</p>
        </div>

        {/* Subtle Initialization Pulse */}
        <div className="app-splash-status" aria-hidden="true">
          <span className="app-splash-pulse-dot" />
          <span className="app-splash-status-text">Initializing songbook...</span>
        </div>
      </div>
    </div>
  );
}
