import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Plus, X, User } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import LyricalSongItem from '../components/LyricalSongItem';
import { filterAndRankLyricalSongs } from '../services/lyricalSearch';

export default function LyricalHome({
  songs = [],
  favorites = [],
  onToggleFavorite,
  onOpenAddModal,
  onEditSong,
  onDeleteSong,
  searchQuery = '',
  onSearchChange,
  selectedArtist = null,
  onClearArtist
}) {
  const navigate = useNavigate();
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);
  const [localSearch, setLocalSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const effectiveSearch = typeof onSearchChange === 'function' ? searchQuery : localSearch;
  const handleSearchChange = (val) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  const categories = [
    { id: 'ALL', label: t.allSongs },
    { id: 'TAMIL', label: t.catTamil },
    { id: 'ENGLISH', label: t.catEnglish },
    { id: 'HINDI', label: t.catHindi },
    { id: 'WORSHIP', label: t.catWorship }
  ];

  // Filter songs by search query (80% similarity threshold on main/secondary titles), category, and artist
  const filteredSongs = useMemo(() => {
    return filterAndRankLyricalSongs(
      songs,
      effectiveSearch,
      activeCategory,
      selectedArtist,
      80
    );
  }, [songs, selectedArtist, activeCategory, effectiveSearch]);

  const handleSelectSong = (song) => {
    navigate(`/song/${song.id}`);
  };

  return (
    <div className="lyrical-page lyrical-home-page">
      {/* Top Welcome & Header */}
      <div className="lyrical-page-header">
        <h1 className="lyrical-page-title">{t.homeTitle}</h1>
        <p className="lyrical-page-subtitle">{t.homeSubtitle}</p>
      </div>

      {/* Search Input Bar */}
      <div className="lyrical-search-wrapper">
        <Search size={18} className="lyrical-search-icon" />
        <input
          type="text"
          value={effectiveSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="lyrical-search-input"
          aria-label={t.searchPlaceholder}
        />
        {effectiveSearch && (
          <button
            type="button"
            className="lyrical-search-clear-btn"
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Language / Category Filter Chips */}
      <div className="lyrical-filter-chips" role="tablist" aria-label="Song language filter">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`lyrical-filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected Artist Active Filter Banner */}
      {selectedArtist && (
        <div className="lyrical-active-filter-banner">
          <div className="lyrical-active-filter-content">
            <User size={14} />
            <span>{t.singerLabel}: <strong>{selectedArtist}</strong></span>
            {onClearArtist && (
              <button
                type="button"
                className="lyrical-clear-filter-btn"
                onClick={onClearArtist}
                aria-label="Clear artist filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* All Songs Vertical List */}
      {filteredSongs.length > 0 ? (
        <div className="lyrical-songs-list" role="feed" aria-label={t.allSongs}>
          {filteredSongs.map((song) => (
            <LyricalSongItem
              key={song.id}
              song={song}
              isFavorite={favorites.includes(song.id)}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEditSong}
              onDelete={onDeleteSong}
              onClick={handleSelectSong}
            />
          ))}
        </div>
      ) : (
        /* Empty Search / Library State */
        <div className="lyrical-card lyrical-empty-card">
          <div className="lyrical-empty-icon-wrap">
            <BookOpen size={32} />
          </div>
          <h2 className="lyrical-empty-title">{songs.length === 0 ? t.noSongsYet : t.noSongsFound}</h2>
          <p className="lyrical-empty-desc">{t.noSongsSubtitle}</p>
          {onOpenAddModal && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddModal}
            >
              <Plus size={18} />
              <span>{t.navAdd}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
