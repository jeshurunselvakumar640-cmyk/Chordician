import React, { useState, useEffect } from 'react';

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
          <svg
            className="app-splash-logo-svg"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Background Rounded Shield / Key Base */}
            <rect
              x="8"
              y="8"
              width="56"
              height="56"
              rx="16"
              fill="url(#splash-bg-grad)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
            />
            
            {/* Piano Keys Silhouette */}
            <path
              d="M20 44V28C20 25.7909 21.7909 24 24 24H28V38H25V44H20Z"
              fill="rgba(255, 255, 255, 0.2)"
            />
            <path
              d="M44 44V28C44 25.7909 45.7909 24 48 24H52V44H47V38H44V44Z"
              fill="rgba(255, 255, 255, 0.2)"
            />
            
            {/* Center Cross / Music Clef Motif */}
            <path
              d="M36 20V52"
              stroke="url(#splash-cross-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M26 31H46"
              stroke="url(#splash-cross-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            
            {/* Harmonic Note Orbs */}
            <circle cx="26" cy="31" r="3.5" fill="#f59e0b" />
            <circle cx="46" cy="31" r="3.5" fill="#6366f1" />
            <circle cx="36" cy="20" r="2.5" fill="#f59e0b" />
            
            <defs>
              <linearGradient id="splash-bg-grad" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e1b4b" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="splash-cross-grad" x1="26" y1="20" x2="46" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="0.4" stopColor="#fbbf24" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
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
