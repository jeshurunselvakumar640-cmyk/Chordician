import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Music,
  Plus,
  Heart,
  Settings
} from 'lucide-react';
import { useThisSunday } from '../../context/ThisSundayContext.jsx';

export default function BottomNav({ totalSongs = 0, favoriteCount = 0 }) {
  const { songIds } = useThisSunday();
  const thisSundayCount = songIds ? songIds.length : 0;

  return (
    <nav className="bottom-nav" aria-label="Mobile bottom navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <LayoutDashboard size={20} />
        <span className="bottom-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/this-sunday"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        aria-label="This Sunday"
      >
        <div className="bottom-nav-icon-wrapper">
          <CalendarDays size={20} />
          {thisSundayCount > 0 && (
            <span className="bottom-nav-badge">{thisSundayCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">Sunday</span>
      </NavLink>

      {/* Highlighted Center Add Action */}
      <NavLink
        to="/add-song"
        className="bottom-nav-add-btn"
        aria-label="Add new song"
      >
        <div className="bottom-nav-add-icon">
          <Plus size={24} />
        </div>
      </NavLink>

      <NavLink
        to="/songs"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        aria-label="My Songs"
      >
        <div className="bottom-nav-icon-wrapper">
          <Music size={20} />
          {totalSongs > 0 && (
            <span className="bottom-nav-badge">{totalSongs}</span>
          )}
        </div>
        <span className="bottom-nav-label">Songs</span>
      </NavLink>

      <NavLink
        to="/favorites"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        aria-label="Favorites"
      >
        <div className="bottom-nav-icon-wrapper">
          <Heart size={20} />
          {favoriteCount > 0 && (
            <span className="bottom-nav-badge">{favoriteCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">Favorites</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        aria-label="Settings"
      >
        <Settings size={20} />
        <span className="bottom-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
}
