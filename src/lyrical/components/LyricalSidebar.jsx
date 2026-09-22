import React, { useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Wine,
  ListMusic,
  Settings,
  Sparkles,
  X,
  Users,
  Mic2,
  ChevronRight,
  Plus,
  Globe
} from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import { APP_VERSION } from '../../config/version';

export default function LyricalSidebar({
  mobileOpen = false,
  onCloseMobile,
  artists = [],
  onSelectArtist,
  selectedArtist = null,
  onOpenAddManual,
  onOpenImportUrl
}) {
  const location = useLocation();
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('mobile-nav-open');
    } else {
      document.body.classList.remove('mobile-nav-open');
    }
    return () => {
      document.body.classList.remove('mobile-nav-open');
    };
  }, [mobileOpen]);

  const navItems = [
    { to: '/', label: t.navHome, icon: <Home size={19} /> },
    { to: '/this-sunday', label: t.navThisSunday, icon: <CalendarDays size={19} /> },
    { to: '/communion', label: t.navCommunion, icon: <Wine size={19} /> },
    { to: '/lists', label: t.navLists, icon: <ListMusic size={19} /> },
    { to: '/settings', label: t.navSettings, icon: <Settings size={19} /> }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar lyrical-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="brand-logo lyrical-brand-logo" onClick={onCloseMobile} aria-label="Lyrical Home">
            <Sparkles size={20} />
          </Link>
          <div className="brand-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/" className="brand-name" onClick={onCloseMobile}>
                {t.appName}
              </Link>
              <span className="app-version-badge">v{APP_VERSION}</span>
            </div>
            <span className="brand-tagline">{t.appTagline}</span>
          </div>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions (Add Song & Import from URL) */}
        <div className="lyrical-sidebar-actions">
          <button
            type="button"
            className="btn btn-primary lyrical-sidebar-action-btn"
            onClick={() => {
              if (onOpenAddManual) onOpenAddManual();
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <Plus size={17} />
            <span>{t.addSongManually || t.navAdd}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary lyrical-sidebar-action-btn"
            onClick={() => {
              if (onOpenImportUrl) onOpenImportUrl();
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <Globe size={17} />
            <span>{t.importFromUrl || t.importUrlTitle}</span>
          </button>
        </div>

        {/* Main Navigation items */}
        <nav className="sidebar-nav" aria-label="Lyrical main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              {item.icon}
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Artists Section */}
        <div className="lyrical-sidebar-section">
          <div className="lyrical-sidebar-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic2 size={15} className="text-muted" />
              <span className="lyrical-sidebar-section-title">{t.artistsTitle}</span>
            </div>
          </div>

          <div className="lyrical-sidebar-artists-list">
            {artists && artists.length > 0 ? (
              artists.map((artist) => {
                const isSelected = selectedArtist === artist.name;
                return (
                  <button
                    key={artist.name || artist.id}
                    type="button"
                    className={`lyrical-artist-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectArtist) onSelectArtist(artist.name);
                      if (onCloseMobile) onCloseMobile();
                    }}
                  >
                    <span className="lyrical-artist-name">{artist.name}</span>
                    <span className="lyrical-artist-count">{artist.songCount || artist.count || 0}</span>
                  </button>
                );
              })
            ) : (
              <div className="lyrical-artists-empty">
                <span>{t.noArtistsFound}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className="nav-link"
            onClick={onCloseMobile}
            style={{ width: '100%' }}
          >
            <Settings size={18} />
            <span className="nav-text">{t.navSettings}</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
