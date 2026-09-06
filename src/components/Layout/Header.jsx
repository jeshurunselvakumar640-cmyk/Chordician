import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Plus,
  Sparkles,
  Search,
  RefreshCw,
  X,
  Piano
} from 'lucide-react';
import SearchBar from '../SearchBar/SearchBar';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import UserProfileDropdown from './UserProfileDropdown';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Header({
  onToggleMobile,
  searchQuery,
  onSearchChange,
  onRefresh
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleQuickRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
        showToast('Library refreshed from cloud', 'success', 1500);
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleSearchSubmit = (val) => {
    onSearchChange(val);
    if (location.pathname !== '/songs' && val.trim()) {
      navigate(`/songs?q=${encodeURIComponent(val)}`);
    }
  };

  return (
    <header className="header">
      {/* Mobile Top Bar */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Open navigation drawer"
        >
          <Menu size={22} />
        </button>

        {/* Brand in Header on Mobile */}
        <Link to="/" className="mobile-brand-link">
          <div className="mobile-brand-icon">
            <Piano size={20} />
          </div>
          <span className="mobile-brand-title">Chordician</span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="desktop-search-wrapper">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchSubmit}
            placeholder="Search songs, artists, chords..."
          />
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="header-right">
        {/* Mobile Search Trigger */}
        <button
          type="button"
          className="btn-icon mobile-search-toggle"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
          title={mobileSearchOpen ? 'Close search' : 'Search songs'}
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Desktop Quick Actions (Owner Only) */}
        {canEdit && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm desktop-only-action"
              onClick={handleQuickRefresh}
              title="Refresh library from cloud"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Sync
            </button>

            <Link
              to="/import"
              className="btn btn-secondary btn-sm desktop-only-action"
              title="Import song from screenshot with AI"
            >
              <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
              AI Import
            </Link>

            <Link
              to="/add-song"
              className="btn btn-primary btn-sm desktop-only-action"
              title="Create a new structured song"
            >
              <Plus size={16} />
              Add Song
            </Link>
          </>
        )}

        <ThemeToggle />

        {/* User Profile / Auth Dropdown */}
        <UserProfileDropdown />
      </div>

      {/* Mobile Expandable Search Bar */}
      {mobileSearchOpen && (
        <div className="mobile-search-dropdown">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              handleSearchSubmit(val);
            }}
            placeholder="Search songs, artists, lyrics..."
            autoFocus={true}
          />
        </div>
      )}
    </header>
  );
}
