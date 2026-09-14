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
  Layers,
  CalendarDays,
  Play,
  FileDown,
  CheckSquare,
  Check,
  Wine,
  Sliders,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import SongCard from '../components/SongCard/SongCard';
import EmptyState from '../components/UI/EmptyState';
import BatchExportModal from '../components/Modal/BatchExportModal';
import StyleSelectorModal from '../components/SongEditor/StyleSelectorModal';
import { StatsSkeleton, SongCardSkeleton } from '../components/UI/SkeletonLoader';
import { PRIMARY_LANGUAGES } from '../utils/musicConstants.js';
import { useThisSunday } from '../context/ThisSundayContext.jsx';
import { useCommunion } from '../context/CommunionContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { exportSongsToPDF } from '../services/shareService.js';
import { updateSong } from '../firebase/songs.js';
import { detectKeyFromSong } from '../utils/keyDetector.js';

export default function Dashboard({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest,
  onSongUpdated
}) {
  const { showToast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);

  // Pending Styles management state
  const [pendingFilterMode, setPendingFilterMode] = useState('ALL'); // 'ALL' | 'MAJOR' | 'MINOR'
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [isExpandedPending, setIsExpandedPending] = useState(false);
  const [assigningSong, setAssigningSong] = useState(null);


  const { songIds, serviceDate, formatServiceDate, getDaysUntil, getDaysUntilNumber } = useThisSunday();
  const { songIds: communionSongIds } = useCommunion();
  const communionCount = communionSongIds ? communionSongIds.length : 0;

  const handleExportSelectedPDF = async () => {
    if (selectedSongIds.length === 0) {
      showToast('Please select at least 1 song to export', 'warning');
      return;
    }
    const safeSongs = Array.isArray(songs) ? songs.filter((s) => s && s.id) : [];
    const songMap = new Map(safeSongs.map((s) => [s.id, s]));
    const selectedSongs = (selectedSongIds || []).map((id) => songMap.get(id)).filter(Boolean);

    setIsExportingPDF(true);
    setExportProgress('Compiling PDF...');

    try {
      await exportSongsToPDF(selectedSongs, {
        documentSubtitle: 'Chordician Songbook',
        onProgress: (curr, total) => {
          setExportProgress(`Rendering song ${curr} of ${total}...`);
        }
      });
      showToast(`Exported ${selectedSongs.length} songs to PDF!`, 'success');
      setIsSelectionMode(false);
      setSelectedSongIds([]);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export PDF. Please try again.', 'error');
    } finally {
      setIsExportingPDF(false);
      setExportProgress(null);
    }
  };

  const daysUntil = getDaysUntilNumber(serviceDate);
  const daysUntilText = getDaysUntil(serviceDate);
  const sundaySongs = useMemo(() => {
    const safeSongs = Array.isArray(songs) ? songs : [];
    return (songIds || []).map((id) => safeSongs.find((s) => s && s.id === id)).filter(Boolean);
  }, [songIds, songs]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats = useMemo(() => {
    const safeSongs = Array.isArray(songs) ? songs.filter(Boolean) : [];
    const total = safeSongs.length;
    const favorites = safeSongs.filter((s) => s && s.favorite).length;
    
    // Distinct keys used
    const keysSet = new Set(safeSongs.map((s) => s && s.originalKey).filter(Boolean));
    const distinctKeys = keysSet.size;

    // Recently added in the last 7 days or top 5
    const recentCount = Math.min(5, total);

    // Language counts
    const tamilCount = safeSongs.filter((s) => typeof s?.category === 'string' && s.category.toLowerCase() === 'tamil').length;
    const hindiCount = safeSongs.filter((s) => typeof s?.category === 'string' && s.category.toLowerCase() === 'hindi').length;
    const englishCount = safeSongs.filter((s) => typeof s?.category === 'string' && s.category.toLowerCase() === 'english').length;
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

  // Complete global /songs scan for songs without an assigned style
  const pendingStyleSongs = useMemo(() => {
    const safeSongs = Array.isArray(songs) ? songs.filter(Boolean) : [];
    return safeSongs.filter((s) => {
      if (!s.style) return true;
      if (typeof s.style === 'string') return !s.style.trim();
      if (typeof s.style === 'object') return !s.style.name || !s.style.name.trim();
      return true;
    });
  }, [songs]);

  // Major and Minor counts within pending styles
  const { pendingMajorCount, pendingMinorCount } = useMemo(() => {
    let major = 0;
    let minor = 0;
    pendingStyleSongs.forEach((song) => {
      const keyInfo = detectKeyFromSong(song);
      if (keyInfo.isMinor) minor++;
      else major++;
    });
    return { pendingMajorCount: major, pendingMinorCount: minor };
  }, [pendingStyleSongs]);

  // Filtered and searched pending styles
  const displayedPendingSongs = useMemo(() => {
    let list = pendingStyleSongs;
    if (pendingFilterMode === 'MAJOR') {
      list = list.filter((s) => !detectKeyFromSong(s).isMinor);
    } else if (pendingFilterMode === 'MINOR') {
      list = list.filter((s) => detectKeyFromSong(s).isMinor);
    }
    if (pendingSearchQuery.trim()) {
      const q = pendingSearchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.artist || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [pendingStyleSongs, pendingFilterMode, pendingSearchQuery]);

  // Surgical Style Assignment Handler
  const handleAssignStyle = async (selectedStyle) => {
    if (!assigningSong || !selectedStyle) return;
    try {
      // Surgical update: Preserve all existing fields and update ONLY style
      const updatedPayload = { ...assigningSong, style: selectedStyle };
      const res = await updateSong(assigningSong.id, updatedPayload);
      if (res.success) {
        showToast(`Assigned style "${selectedStyle.name}" to "${assigningSong.title}"`, 'success');
        if (onSongUpdated) {
          onSongUpdated(updatedPayload);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chordician:song-updated', { detail: updatedPayload }));
        }
      } else {
        showToast(res.error || 'Failed to update style', 'error');
      }
    } catch (err) {
      console.error('handleAssignStyle error:', err);
      showToast('Error assigning style', 'error');
    } finally {
      setAssigningSong(null);
    }
  };

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
          <button
            type="button"
            className="btn btn-secondary dashboard-action-btn"
            onClick={() => setIsBatchExportOpen(true)}
            title="Export songs as branded PDF"
          >
            <FileDown size={16} style={{ color: 'var(--color-primary)' }} />
            <span>Export PDF</span>
          </button>
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

      {/* This Sunday Live Worship Setlist Widget */}
      <div
        className="card this-sunday-dashboard-widget"
        style={{
          marginBottom: '28px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: sundaySongs.length > 0 ? '16px' : 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <CalendarDays size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>This Sunday's Service</h2>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                  {formatServiceDate(serviceDate)}
                </span>
                {daysUntilText && daysUntil >= 0 && (
                  <span
                    className={`badge ${daysUntil === 0 ? 'badge-success' : 'badge-meta'}`}
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    {daysUntilText}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {sundaySongs.length > 0
                  ? `${sundaySongs.length} ${sundaySongs.length === 1 ? 'song' : 'songs'} selected for worship • Auto-expires after Sunday`
                  : 'No songs selected for this Sunday yet. Plan your worship setlist!'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sundaySongs.length > 0 && (
              <Link
                to={`/songs/${sundaySongs[0].id}`}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
              >
                <Play size={16} fill="currentColor" />
                <span>Start Service</span>
              </Link>
            )}
            <Link
              to="/this-sunday"
              className={`btn ${sundaySongs.length > 0 ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              <span>{sundaySongs.length > 0 ? 'Manage Setlist' : '+ Plan This Sunday'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {sundaySongs.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {sundaySongs.map((song, index) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 14px',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated, var(--bg-surface))',
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{song.title}</span>
                <span className="badge badge-key" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                  {song.originalKey || 'C'}
                </span>
              </Link>
            ))}
          </div>
        )}
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
            to="/communion"
            className="dashboard-lang-card lang-card-communion"
            style={{
              borderColor: 'rgba(225, 29, 72, 0.25)',
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.06) 0%, rgba(159, 18, 57, 0.08) 100%)'
            }}
          >
            <div className="lang-card-left">
              <span className="lang-card-flag">🍷</span>
              <div>
                <strong className="lang-card-title">Communion</strong>
                <span className="lang-card-sub">திருவிருந்து பாடல்கள்</span>
              </div>
            </div>
            <span
              className="lang-card-count-badge"
              style={{
                backgroundColor: 'rgba(225, 29, 72, 0.15)',
                color: '#e11d48'
              }}
            >
              {communionCount} {communionCount === 1 ? 'song' : 'songs'}
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

      {/* Pending Song Styles Section */}
      <div
        className="card dashboard-pending-styles-section"
        style={{
          marginBottom: '28px',
          padding: '22px 24px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)'
              }}
            >
              <Sliders size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Pending Song Styles</h2>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    backgroundColor: pendingStyleSongs.length > 0 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: pendingStyleSongs.length > 0 ? '#ec4899' : '#10b981',
                    border: `1px solid ${pendingStyleSongs.length > 0 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                  }}
                >
                  {pendingStyleSongs.length} {pendingStyleSongs.length === 1 ? 'song pending' : 'songs pending'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {pendingStyleSongs.length > 0
                  ? 'Songs awaiting keyboard / rhythm style assignment. Detect keys and assign styles for accompaniment.'
                  : 'All songs in your library have an assigned musical style! 🎉'}
              </p>
            </div>
          </div>

          {/* Quick Filter Pills + Search Bar */}
          {pendingStyleSongs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Filter Pills */}
              <div className="dashboard-filter-pills" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`dashboard-filter-pill ${pendingFilterMode === 'ALL' ? 'active' : ''}`}
                  onClick={() => setPendingFilterMode('ALL')}
                >
                  All ({pendingStyleSongs.length})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-pill ${pendingFilterMode === 'MAJOR' ? 'active' : ''}`}
                  onClick={() => setPendingFilterMode('MAJOR')}
                >
                  Major ({pendingMajorCount})
                </button>
                <button
                  type="button"
                  className={`dashboard-filter-pill ${pendingFilterMode === 'MINOR' ? 'active' : ''}`}
                  onClick={() => setPendingFilterMode('MINOR')}
                >
                  Minor ({pendingMinorCount})
                </button>
              </div>

              {/* Quick Search */}
              <div style={{ position: 'relative', minWidth: '180px' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter pending..."
                  value={pendingSearchQuery}
                  onChange={(e) => setPendingSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 32px',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pending Songs List or Empty State */}
        {pendingStyleSongs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px dashed rgba(16, 185, 129, 0.25)'
            }}
          >
            <Sparkles size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 4px', color: 'var(--text-main)' }}>
              100% Styled Library
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Every song in your complete repertoire has a rhythm style assigned.
            </p>
          </div>
        ) : displayedPendingSongs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-subtle)'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No pending songs found matching "{pendingSearchQuery}" ({pendingFilterMode} mode).
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '10px',
                marginTop: '12px'
              }}
            >
              {(isExpandedPending ? displayedPendingSongs : displayedPendingSongs.slice(0, 6)).map((song) => {
                const keyInfo = detectKeyFromSong(song);
                const isMinor = keyInfo.isMinor;
                return (
                  <div
                    key={song.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      gap: '12px',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link
                        to={`/songs/${song.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--text-main)',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {song.title}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {song.artist && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                            {song.artist}
                          </span>
                        )}
                        {/* Key & Mode badge */}
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            fontWeight: '600',
                            backgroundColor: isMinor ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: isMinor ? '#a855f7' : '#3b82f6',
                            border: `1px solid ${isMinor ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`
                          }}
                          title={`Detected Key: ${keyInfo.detectedKey} (${keyInfo.mode})`}
                        >
                          {keyInfo.detectedKey} ({keyInfo.mode})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAssigningSong(song)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.78rem',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sliders size={13} style={{ color: 'var(--color-primary)' }} />
                      <span>Assign Style</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {displayedPendingSongs.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsExpandedPending((prev) => !prev)}
                  style={{ fontSize: '0.84rem' }}
                >
                  {isExpandedPending ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      <span>Show All {displayedPendingSongs.length} Pending Songs</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Songs Section with Quick Filter Pills & Selection Mode */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

            {/* Selection & Export Action Buttons */}
            {displayedSongs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isSelectionMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    if (!isSelectionMode) {
                      setIsSelectionMode(true);
                      setSelectedSongIds([]);
                    } else {
                      setIsSelectionMode(false);
                      setSelectedSongIds([]);
                    }
                  }}
                  title="Toggle checkbox selection mode on song cards"
                  style={{ padding: '6px 12px', fontSize: '0.84rem' }}
                >
                  <CheckSquare size={15} />
                  <span>{isSelectionMode ? 'Exit Select' : 'Select'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsBatchExportOpen(true)}
                  title="Open batch PDF export dialog"
                  style={{ padding: '6px 12px', fontSize: '0.84rem' }}
                >
                  <FileDown size={15} />
                  <span className="hide-mobile">Export PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selection Active Banner */}
        {isSelectionMode && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 18px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} color="var(--color-primary)" />
                <span>{selectedSongIds.length} of {displayedSongs.length} selected</span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedSongIds(displayedSongs.map((s) => s.id))}
                  style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                >
                  Select All Shown
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedSongIds([])}
                  style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsBatchExportOpen(true)}
                style={{ fontSize: '0.82rem', padding: '4px 10px' }}
              >
                <Sparkles size={14} />
                <span>Browse Full Library ({songs.length})</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExportSelectedPDF}
                disabled={selectedSongIds.length === 0 || isExportingPDF}
                style={{ minWidth: '150px' }}
              >
                {isExportingPDF ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>{exportProgress || 'Exporting...'}</span>
                  </>
                ) : (
                  <>
                    <FileDown size={15} />
                    <span>Export PDF ({selectedSongIds.length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedSongIds([]);
                }}
                style={{ fontSize: '0.82rem' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

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
                isSelectionMode={isSelectionMode}
                isSelected={selectedSongIds.includes(song.id)}
                onToggleSelect={(id) => {
                  setSelectedSongIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch Export PDF Modal */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        songs={songs}
        defaultSelectedIds={selectedSongIds.length > 0 ? selectedSongIds : songs.map((s) => s.id)}
        title="Export Songs to PDF"
        subtitle="Chordician Songbook"
      />

      {/* Style Selector Modal for Pending Style Assignment */}
      {assigningSong && (
        <StyleSelectorModal
          isOpen={Boolean(assigningSong)}
          onClose={() => setAssigningSong(null)}
          selectedStyle={assigningSong.style}
          onSelectStyle={handleAssignStyle}
        />
      )}
    </div>
  );
}

