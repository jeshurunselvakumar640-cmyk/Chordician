import React from 'react';
import {
  Sliders,
  Languages,
  Piano,
  Sun,
  Moon,
  Check,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppMode, SUPPORTED_LANGUAGES } from '../../context/AppModeContext';
import { useTheme } from '../../context/ThemeContext';
import { getLyricalTranslation } from '../i18n/translations';
import { APP_VERSION } from '../../config/version';

export default function LyricalSettings() {
  const { language, setLanguage, setAppMode } = useAppMode();
  const { theme, setTheme, isDark } = useTheme();
  const t = getLyricalTranslation(language);

  const handleSwitchToChordician = () => {
    setAppMode('chordician');
  };

  return (
    <div className="lyrical-page">
      <div className="lyrical-header-block">
        <h1 className="lyrical-title">{t.settingsTitle}</h1>
        <p className="lyrical-subtitle">{t.settingsSubtitle}</p>
      </div>

      {/* 1. App Mode Switch Section */}
      <div className="card lyrical-card" style={{ marginBottom: '20px' }}>
        <h2 className="lyrical-section-title">
          <Layers size={19} style={{ color: '#ec4899' }} />
          <span>{t.switchAppSection}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '2px', marginBottom: '16px' }}>
          {t.switchAppDesc}
        </p>

        <div className="lyrical-switch-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="lyrical-mode-indicator-icon">
              <Piano size={22} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.96rem', color: 'var(--text-main)' }}>
                Chordician (Piano Notes)
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chords, vocal lead notes, key transpose & sheet music
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSwitchToChordician}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
            }}
          >
            <span>{t.switchToChordicianBtn}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. Language Selection Section */}
      <div className="card lyrical-card" style={{ marginBottom: '20px' }}>
        <h2 className="lyrical-section-title">
          <Languages size={19} style={{ color: 'var(--color-primary)' }} />
          <span>{t.languageSection}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '2px', marginBottom: '16px' }}>
          {t.languageDesc}
        </p>

        <div className="settings-theme-grid">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`settings-theme-option ${isSelected ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
              >
                <div className="settings-theme-info">
                  <Languages size={18} style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                  <div>
                    <div className="settings-theme-name">{lang.nativeLabel}</div>
                    <div className="settings-theme-desc">{lang.label}</div>
                  </div>
                </div>
                {isSelected && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Appearance & Theme */}
      <div className="card lyrical-card" style={{ marginBottom: '20px' }}>
        <h2 className="lyrical-section-title">
          <Sliders size={19} style={{ color: '#f59e0b' }} />
          <span>{t.appearanceSection}</span>
        </h2>

        <div className="settings-theme-grid">
          <div
            onClick={() => setTheme('dark')}
            className={`settings-theme-option dark-theme-option ${isDark ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Moon size={18} className="text-amber-400" />
              <div>
                <div className="settings-theme-name">{t.darkTheme}</div>
              </div>
            </div>
            {isDark && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>

          <div
            onClick={() => setTheme('light')}
            className={`settings-theme-option light-theme-option ${!isDark ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Sun size={18} className="text-amber-500" />
              <div>
                <div className="settings-theme-name">{t.lightTheme}</div>
              </div>
            </div>
            {!isDark && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>
        </div>
      </div>

      {/* 4. About Lyrical */}
      <div className="card lyrical-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(217, 70, 239, 0.1))',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Lyrical</span>
              <span className="app-version-badge">v{APP_VERSION}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
              {t.lyricalDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
