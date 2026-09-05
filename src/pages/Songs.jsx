import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  RotateCcw,
  FileDown
} from 'lucide-react';
import SongCard from '../components/SongCard/SongCard';
import SearchBar from '../components/SearchBar/SearchBar';
import EmptyState from '../components/UI/EmptyState';
import BatchExportModal from '../components/Modal/BatchExportModal';
import { SongCardSkeleton } from '../components/UI/SkeletonLoader';
import { ALL_KEYS, SONG_CATEGORIES, PRIMARY_LANGUAGES } from '../utils/musicConstants.js';
import { getStoredViewMode, setStoredViewMode } from '../services/storage.js';

export default function Songs({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || 'ALL';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedKey, setSelectedKey] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('updated_desc');
  const [viewMode, setViewMode] = useState(() => getStoredViewMode());
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);

  // Keep state in sync with URL search params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    const newParams = {};
    if (query.trim()) newParams.q = query;
    if (selectedCategory !== 'ALL') newParams.category = selectedCategory;
    setSearchParams(newParams);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    const newParams = {};
    if (searchQuery.trim()) newParams.q = searchQuery;
    if (cat !== 'ALL') newParams.category = cat;
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedKey('ALL');
    setSelectedCategory('ALL');
    setFavoritesOnly(false);
    setSortBy('updated_desc');
    setSearchParams({});
  };

  // Language & category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: songs.length,
      Tamil: songs.filter((s) => (s.category || '').toLowerCase() === 'tamil').length,
      Hindi: songs.filter((s) => (s.category || '').toLowerCase() === 'hindi').length,
      English: songs.filter((s) => (s.category || '').toLowerCase() === 'english').length
    };
    return counts;
  }, [songs]);

  // Filter & Sort Songs
  const filteredSongs = useMemo(() => {
    return songs
      .filter((song) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (song.title || '').toLowerCase().includes(q);
          const matchArtist = (song.artist || '').toLowerCase().includes(q);
          const matchCategory = (song.category || '').toLowerCase().includes(q);
          
          const matchLyrics = (song.sections || []).some((sec) =>
            (sec.rows || []).some((row) =>
              row.type === 'lyrics' && (row.content || '').toLowerCase().includes(q)
            )
          );

          if (!matchTitle && !matchArtist && !matchCategory && !matchLyrics) {
            return false;
          }
        }

        if (selectedKey !== 'ALL' && song.originalKey !== selectedKey) {
          return false;
        }

        if (selectedCategory !== 'ALL' && (song.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        if (favoritesOnly && !song.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title_asc') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'artist_asc') {
          return (a.artist || '').localeCompare(b.artist || '');
        }
        if (sortBy === 'created_desc') {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [songs, searchQuery, selectedKey, selectedCategory, favoritesOnly, sortBy]);

  const hasActiveFilters = searchQuery.trim() || selectedKey !== 'ALL' || selectedCategory !== 'ALL' || favoritesOnly;

  return (
    <div className="songs-page">
      {/* Header & Controls */}
      <div className="songs-page-header">
        <div>
          <h1 className="songs-page-title">My Songs</h1>
          <p className="songs-page-subtitle">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} in your personal library
          </p>
        </div>

        {/* View Toggle & Batch PDF Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {songs.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsBatchExportOpen(true)}
              title="Select songs to export as PDF"
              style={{ padding: '6px 12px', fontSize: '0.84rem' }}
            >
              <FileDown size={15} />
              <span className="hide-mobile">Export PDF</span>
            </button>
          )}

          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleViewModeChange('grid')}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleViewModeChange('list')}
              title="List view"
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Language Quick Filter Chips Bar */}
      <div className="songs-language-chips-bar">
        <button
          type="button"
          className={`songs-lang-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('ALL')}
        >
          <span>All Songs</span>
          <span className="lang-chip-count">{categoryCounts.ALL}</span>
        </button>

        <button
          type="button"
          className={`songs-lang-chip chip-tamil ${selectedCategory.toLowerCase() === 'tamil' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('Tamil')}
        >
          <span>🇮🇳 Tamil</span>
          <span className="lang-chip-count">{categoryCounts.Tamil}</span>
        </button>

        <button
          type="button"
          className={`songs-lang-chip chip-hindi ${selectedCategory.toLowerCase() === 'hindi' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('Hindi')}
        >
          <span>🇮🇳 Hindi</span>
          <span className="lang-chip-count">{categoryCounts.Hindi}</span>
        </button>

        <button
          type="button"
          className={`songs-lang-chip chip-english ${selectedCategory.toLowerCase() === 'english' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('English')}
        >
          <span>🌐 English</span>
          <span className="lang-chip-count">{categoryCounts.English}</span>
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="card songs-filter-card">
        <div className="songs-filter-grid">
          {/* Search input (full width) */}
          <div className="songs-search-col">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by title, artist, lyrics..."
            />
          </div>

          {/* Key Filter */}
          <select
            className="form-select font-mono-input filter-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            aria-label="Filter by musical key"
          >
            <option value="ALL">All Keys</option>
            {ALL_KEYS.map((k) => (
              <option key={k} value={k}>
                Key of {k}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="form-select filter-select"
            value={selectedCategory}
            onChange={(e) => handleCategorySelect(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            <optgroup label="Languages">
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="English">English</option>
            </optgroup>
            <optgroup label="Genres & Other Categories">
              {SONG_CATEGORIES.filter(c => !PRIMARY_LANGUAGES.includes(c)).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Sort By */}
          <select
            className="form-select filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort songs"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="created_desc">Recently Added</option>
            <option value="title_asc">Title (A to Z)</option>
            <option value="artist_asc">Artist (A to Z)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="songs-filter-footer">
            <span className="songs-filter-count">
              Filtered results: <strong>{filteredSongs.length}</strong>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Songs Output */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'songs-grid' : 'songs-list'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredSongs.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            type="search"
            title="No matching songs found"
            description="No songs matched your current search filters. Try clearing your filters or searching a different term."
            actionText="Clear All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            type="songs"
            title="Your songbook is empty"
            description="Add your first song with chords and lyrics to start building your piano repertoire."
            actionText="+ Add Song"
            actionLink="/add-song"
          />
        )
      ) : viewMode === 'grid' ? (
        <div className="songs-grid">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              viewMode="grid"
              onToggleFavorite={onToggleFavorite}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      ) : (
        <div className="songs-list">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              viewMode="list"
              onToggleFavorite={onToggleFavorite}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Multi-Song Batch Export PDF Modal */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        songs={filteredSongs.length > 0 ? filteredSongs : songs}
        title="Export Songs to PDF"
        subtitle="Chordician Personal Songbook"
      />
    </div>
  );
}
