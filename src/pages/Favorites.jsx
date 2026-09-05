import React, { useState, useMemo } from 'react';
import { LayoutGrid, List, Heart, FileDown, Sparkles } from 'lucide-react';
import SongCard from '../components/SongCard/SongCard';
import SearchBar from '../components/SearchBar/SearchBar';
import EmptyState from '../components/UI/EmptyState';
import BatchExportModal from '../components/Modal/BatchExportModal';
import { SongCardSkeleton } from '../components/UI/SkeletonLoader';
import { getStoredViewMode, setStoredViewMode } from '../services/storage.js';
import { searchSongsWithFuzzy } from '../utils/fuzzySearch.js';

export default function Favorites({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => getStoredViewMode());
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };

  const { favoriteSongs, didYouMean, isFuzzyMatch } = useMemo(() => {
    const baseFavorites = songs.filter((song) => song.favorite);
    if (!searchQuery.trim()) {
      return { favoriteSongs: baseFavorites, didYouMean: null, isFuzzyMatch: false };
    }
    const searchResult = searchSongsWithFuzzy(baseFavorites, searchQuery);
    return {
      favoriteSongs: searchResult.results,
      didYouMean: searchResult.didYouMean,
      isFuzzyMatch: searchResult.isFuzzyMatch
    };
  }, [songs, searchQuery]);

  return (
    <div className="favorites-page">
      {/* Header */}
      <div className="favorites-page-header">
        <div className="favorites-title-group">
          <div className="favorites-icon-badge">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="favorites-title">Favorite Songs</h1>
            <p className="favorites-subtitle">
              {favoriteSongs.length} {favoriteSongs.length === 1 ? 'song' : 'songs'} marked as favorite
            </p>
          </div>
        </div>

        {/* View Toggle & Batch Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {favoriteSongs.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsBatchExportOpen(true)}
              title="Export favorite songs as PDF"
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

      {/* Search within favorites */}
      {songs.some((s) => s.favorite) && (
        <div className="card favorites-search-card">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search favorite songs..."
          />
        </div>
      )}

      {/* "Did You Mean" Spelling Suggestion Banner */}
      {isFuzzyMatch && didYouMean && (
        <div className="did-you-mean-banner">
          <div className="did-you-mean-content">
            <Sparkles size={16} className="did-you-mean-icon" />
            <span className="did-you-mean-text">
              Showing results for similar spelling. Did you mean:{' '}
            </span>
            <button
              type="button"
              className="did-you-mean-btn"
              onClick={() => setSearchQuery(didYouMean)}
              title={`Search for "${didYouMean}"`}
            >
              <strong>{didYouMean}</strong>
            </button>
            <span className="did-you-mean-qm">?</span>
          </div>
        </div>
      )}

      {/* Output */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'songs-grid' : 'songs-list'}>
          {[1, 2, 3].map((i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : favoriteSongs.length === 0 ? (
        <EmptyState
          type="favorites"
          title={searchQuery ? 'No matching favorite songs' : 'No favorites added yet'}
          description={
            searchQuery
              ? 'Try a different search term to find your favorite songs.'
              : 'Click the heart icon on any song to quickly access your favorite piano arrangements here.'
          }
          actionText="Browse All Songs"
          actionLink="/songs"
        />
      ) : viewMode === 'grid' ? (
        <div className="songs-grid">
          {favoriteSongs.map((song) => (
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
          {favoriteSongs.map((song) => (
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

      {/* Batch Export PDF Modal for Favorites */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        songs={favoriteSongs}
        title="Export Favorite Songs to PDF"
        subtitle="Chordician Favorite Songs"
      />
    </div>
  );
}
