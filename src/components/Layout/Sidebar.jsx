import React, { useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Heart,
  Clock,
  Settings,
  Plus,
  Sparkles,
  Piano,
  CalendarDays,
  Wine,
  Download,
  Crown,
  X
} from 'lucide-react';
import { useThisSunday } from '../../context/ThisSundayContext.jsx';
import { useCommunion } from '../../context/CommunionContext.jsx';
import { usePWA } from '../../context/PWAContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  totalSongs = 0,
  favoriteCount = 0
}) {
  const location = useLocation();
  const { songIds } = useThisSunday();
  const thisSundayCount = songIds ? songIds.length : 0;
  const { songIds: communionSongIds } = useCommunion();
  const communionCount = communionSongIds ? communionSongIds.length : 0;
  const { canInstall, installApp } = usePWA();
  const { canEdit, openAuthModal } = useAuth();

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) {
      onCloseMobile();
    }
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { to: '/this-sunday', label: 'This Sunday', icon: <CalendarDays size={19} />, badge: thisSundayCount > 0 ? thisSundayCount : null },
    { to: '/communion', label: 'Communion', icon: <Wine size={19} />, badge: communionCount > 0 ? communionCount : null },
    { to: '/songs', label: 'My Songs', icon: <Music size={19} />, badge: totalSongs > 0 ? totalSongs : null },
    { to: '/favorites', label: 'Favorites', icon: <Heart size={19} />, badge: favoriteCount > 0 ? favoriteCount : null },
    { to: '/recent', label: 'Recently Added', icon: <Clock size={19} /> },
    ...(canEdit ? [{ to: '/import', label: 'AI Import', icon: <Sparkles size={19} /> }] : []),
    { to: '/settings', label: 'Settings', icon: <Settings size={19} /> }
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

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="brand-logo" onClick={onCloseMobile} aria-label="Chordician Home">
            <Piano size={22} />
          </Link>
          <div className="brand-info">
            <Link to="/" className="brand-name" onClick={onCloseMobile}>
              Chordician
            </Link>
            <span className="brand-tagline">Your chords. Your key.</span>
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

        {/* Navigation items */}
        <nav className="sidebar-nav" aria-label="Main navigation">
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
              {item.badge !== null && item.badge !== undefined && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Quick Action */}
        <div className="sidebar-footer">
          {canInstall && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                installApp();
                if (onCloseMobile) onCloseMobile();
              }}
              style={{ width: '100%', marginBottom: '8px' }}
            >
              <Download size={18} />
              Install App
            </button>
          )}

          {canEdit ? (
            <Link
              to="/add-song"
              className="btn btn-primary"
              onClick={onCloseMobile}
              style={{ width: '100%' }}
            >
              <Plus size={18} />
              Add Song
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                openAuthModal('login');
              }}
              style={{
                width: '100%',
                fontSize: '0.82rem',
                border: '1px dashed var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              <Crown size={14} style={{ color: '#f59e0b' }} /> Sign in as Owner
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
