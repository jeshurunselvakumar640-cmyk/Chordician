import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Plus,
  ListMusic,
  Settings
} from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalBottomNav({ onAddClick }) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  return (
    <nav className="lyrical-bottom-nav" aria-label="Lyrical navigation">
      {/* 1. Home */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `lyrical-nav-item ${isActive ? 'active' : ''}`}
        aria-label={t.navHome}
      >
        <Home size={20} />
        <span className="lyrical-nav-label">{t.navHome}</span>
      </NavLink>

      {/* 2. This Sunday */}
      <NavLink
        to="/this-sunday"
        className={({ isActive }) => `lyrical-nav-item ${isActive ? 'active' : ''}`}
        aria-label={t.navThisSunday}
      >
        <CalendarDays size={20} />
        <span className="lyrical-nav-label">{t.navThisSunday}</span>
      </NavLink>

      {/* 3. Central Add Button (+) */}
      <button
        type="button"
        className="lyrical-nav-add-btn"
        onClick={onAddClick}
        aria-label={t.navAdd}
      >
        <div className="lyrical-nav-add-icon">
          <Plus size={24} />
        </div>
      </button>

      {/* 4. Lists */}
      <NavLink
        to="/lists"
        className={({ isActive }) => `lyrical-nav-item ${isActive ? 'active' : ''}`}
        aria-label={t.navLists}
      >
        <ListMusic size={20} />
        <span className="lyrical-nav-label">{t.navLists}</span>
      </NavLink>

      {/* 5. Settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) => `lyrical-nav-item ${isActive ? 'active' : ''}`}
        aria-label={t.navSettings}
      >
        <Settings size={20} />
        <span className="lyrical-nav-label">{t.navSettings}</span>
      </NavLink>
    </nav>
  );
}
