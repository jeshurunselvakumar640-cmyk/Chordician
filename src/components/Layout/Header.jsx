import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Plus,
  Sparkles,
  User,
  Search,
  X,
  Piano
} from 'lucide-react';
import SearchBar from '../SearchBar/SearchBar';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

export default function Header({
  onToggleMobile,
  searchQuery,
  onSearchChange
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Desktop Quick Actions */}
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

        <ThemeToggle />

        <div
          className="user-profile-badge desktop-only-action"
          title="Pianist Profile"
        >
          <User size={18} />
        </div>
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
