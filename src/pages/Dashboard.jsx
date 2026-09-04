import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Heart,
  Clock,
  Key,
  Plus,
  Sparkles,
  ArrowRight,
  Globe,
  Layers
} from 'lucide-react';
import SongCard from '../components/SongCard/SongCard';
import EmptyState from '../components/UI/EmptyState';
import { StatsSkeleton, SongCardSkeleton } from '../components/UI/SkeletonLoader';
import { PRIMARY_LANGUAGES } from '../utils/musicConstants.js';

export default function Dashboard({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats = useMemo(() => {
    const total = songs.length;
    const favorites = songs.filter((s) => s.favorite).length;
    
    // Distinct keys used
    const keysSet = new Set(songs.map((s) => s.originalKey).filter(Boolean));
    const distinctKeys = keysSet.size;

    // Recently added in the last 7 days or top 5
    const recentCount = Math.min(5, total);

    // Language counts
    const tamilCount = songs.filter((s) => (s.category || '').toLowerCase() === 'tamil').length;
    const hindiCount = songs.filter((s) => (s.category || '').toLowerCase() === 'hindi').length;
    const englishCount = songs.filter((s) => (s.category || '').toLowerCase() === 'english').length;
    const othersCount = total - (tamilCount + hindiCount + englishCount);

    return {
      total,
      favorites,
      distinctKeys,
      recentCount,
      tamilCount,
      hindiCount,
      englishCount,
      othersCount
    };
  }, [songs]);

  const displayedSongs = useMemo(() => {
    let list = [...songs];
    if (selectedLanguage !== 'ALL') {
      list = list.filter((s) => (s.category || '').toLowerCase() === selectedLanguage.toLowerCase());
    }
    return list.slice(0, 6);
  }, [songs, selectedLanguage]);

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-text">
          <h1 className="dashboard-title">
            {greeting} 👋
          </h1>
          <p className="dashboard-subtitle">
            Ready to play? Your personal piano songbook is synchronized and ready.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions">
          <Link to="/import" className="btn btn-secondary dashboard-action-btn">
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            <span>AI Import</span>
          </Link>
          <Link to="/add-song" className="btn btn-primary dashboard-action-btn">
            <Plus size={18} />
            <span>Add Song</span>
          </Link>
        </div>
      </div>

      {/* Language Categories Quick Hub */}
      <div className="dashboard-languages-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">Categories & Languages</h2>
            <p className="dashboard-section-subtitle">Browse your songs by language</p>
          </div>
          <Link to="/songs" className="btn btn-ghost btn-sm dashboard-browse-all-link">
            <span>Explore all</span> <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-language-cards-grid">
          <Link
            to="/songs?category=Tamil"
            className={`dashboard-lang-card lang-card-tamil ${selectedLanguage === 'Tamil' ? 'selected' : ''}`}
          >
            <div className="lang-card-left">
              <span className="lang-card-flag">🇮🇳</span>
              <div>
                <strong className="lang-card-title">Tamil</strong>
                <span className="lang-card-sub">தமிழ் பாடல்கள்</span>
              </div>
            </div>
            <span className="lang-card-count-badge">
              {stats.tamilCount} {stats.tamilCount === 1 ? 'song' : 'songs'}
            </span>
          </Link>

          <Link
            to="/songs?category=Hindi"
            className={`dashboard-lang-card lang-card-hindi ${selectedLanguage === 'Hindi' ? 'selected' : ''}`}
          >
            <div className="lang-card-left">
              <span className="lang-card-flag">🇮🇳</span>
              <div>
                <strong className="lang-card-title">Hindi</strong>
                <span className="lang-card-sub">हिंदी गाने</span>
              </div>
            </div>
            <span className="lang-card-count-badge">
              {stats.hindiCount} {stats.hindiCount === 1 ? 'song' : 'songs'}
            </span>
          </Link>

          <Link
            to="/songs?category=English"
            className={`dashboard-lang-card lang-card-english ${selectedLanguage === 'English' ? 'selected' : ''}`}
          >
            <div className="lang-card-left">
              <span className="lang-card-flag">🌐</span>
              <div>
                <strong className="lang-card-title">English</strong>
                <span className="lang-card-sub">Hymns & Worship</span>
              </div>
            </div>
            <span className="lang-card-count-badge">
              {stats.englishCount} {stats.englishCount === 1 ? 'song' : 'songs'}
            </span>
          </Link>

          <Link
            to="/songs"
            className="dashboard-lang-card lang-card-all"
          >
            <div className="lang-card-left">
              <span className="lang-card-flag">🎵</span>
              <div>
                <strong className="lang-card-title">All Songs</strong>
                <span className="lang-card-sub">All Genres</span>
              </div>
            </div>
            <span className="lang-card-count-badge">
              {stats.total} total
            </span>
          </Link>
        </div>
      </div>

      {/* Statistics Grid (2x2 on Mobile, 4x1 on Desktop) */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <Music size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Songs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <Heart size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.favorites}</span>
              <span className="stat-label">Favorites</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Clock size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.recentCount}</span>
              <span className="stat-label">Recently Added</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Key size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.distinctKeys}</span>
              <span className="stat-label">Keys Used</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Songs Section with Quick Filter Pills */}
      <div className="dashboard-recent-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">
              {selectedLanguage === 'ALL' ? 'Recently Added Songs' : `${selectedLanguage} Songs`}
            </h2>
            <p className="dashboard-section-subtitle">
              {selectedLanguage === 'ALL'
                ? 'Pick up right where you left off'
                : `Showing recent ${selectedLanguage} songs from your library`}
            </p>
          </div>

          {/* Quick Language Filter Pills on Dashboard */}
          <div className="dashboard-filter-pills">
            <button
              type="button"
              className={`dashboard-filter-pill ${selectedLanguage === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('ALL')}
            >
              All ({songs.length})
            </button>
            <button
              type="button"
              className={`dashboard-filter-pill ${selectedLanguage === 'Tamil' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('Tamil')}
            >
              🇮🇳 Tamil ({stats.tamilCount})
            </button>
            <button
              type="button"
              className={`dashboard-filter-pill ${selectedLanguage === 'Hindi' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('Hindi')}
            >
              🇮🇳 Hindi ({stats.hindiCount})
            </button>
            <button
              type="button"
              className={`dashboard-filter-pill ${selectedLanguage === 'English' ? 'active' : ''}`}
              onClick={() => setSelectedLanguage('English')}
            >
              🌐 English ({stats.englishCount})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="songs-grid">
            {[1, 2, 3].map((i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedSongs.length === 0 ? (
          <EmptyState
            type="songs"
            title={selectedLanguage === 'ALL' ? "Your songbook is empty" : `No ${selectedLanguage} songs found`}
            description={
              selectedLanguage === 'ALL'
                ? "Add your first song with chords, lead notes, and lyrics to start building your personal piano repertoire."
                : `You haven't added any ${selectedLanguage} songs yet. Categorize a song as ${selectedLanguage} in the editor!`
            }
            actionText={`+ Add ${selectedLanguage === 'ALL' ? '' : selectedLanguage + ' '}Song`}
            actionLink="/add-song"
          />
        ) : (
          <div className="songs-grid">
            {displayedSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                viewMode="grid"
                onToggleFavorite={onToggleFavorite}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

