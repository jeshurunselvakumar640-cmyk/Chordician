import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Languages, Menu } from 'lucide-react';
import { useAppMode, SUPPORTED_LANGUAGES } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import { APP_VERSION } from '../../config/version';

export default function LyricalHeader({ onToggleMobile }) {
  const { language, setLanguage } = useAppMode();
  const t = getLyricalTranslation(language);

  const handleCycleLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.findIndex(l => l.id === language);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    setLanguage(SUPPORTED_LANGUAGES[nextIndex].id);
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[1];

  return (
    <header className="header lyrical-top-header">
      <div className="header-left">
        {/* Mobile Sidebar Hamburger Drawer Toggle */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Open navigation drawer"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Brand Link (visible on mobile where sidebar is hidden) */}
        <Link to="/" className="mobile-brand-link" aria-label="Lyrical Home">
          <div className="mobile-brand-icon">
            <Sparkles size={18} />
          </div>
          <span className="mobile-brand-title">{t.appName}</span>
          <span className="app-version-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
            v{APP_VERSION}
          </span>
        </Link>
      </div>

      {/* Header Right Actions */}
      <div className="header-right">
        {/* UI Language Switcher */}
        <button
          type="button"
          className="btn btn-secondary btn-sm lyrical-lang-switch-btn"
          onClick={handleCycleLanguage}
          title="Change language (Tamil / English / Hindi)"
        >
          <Languages size={15} />
          <span>{currentLangObj.nativeLabel}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
