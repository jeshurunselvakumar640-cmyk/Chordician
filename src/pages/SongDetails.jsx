import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Edit2,
  Trash2,
  Maximize2,
  Printer,
  Music,
  Sliders,
  Clock,
  Gauge,
  FileText,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { getSongById } from '../firebase/songs.js';
import { transposeSong } from '../services/transposer.js';
import { formatStyleCode, formatMainStyleHighlight } from '../data/songStyles.js';
import { useToast } from '../context/ToastContext.jsx';
import { useThisSunday } from '../context/ThisSundayContext.jsx';
import KeyBadge from '../components/UI/KeyBadge';
import TransposeBar from '../components/Transposer/TransposeBar';
import SongViewer from '../components/SongView/SongViewer';
import PerformanceModal from '../components/Modal/PerformanceModal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import { SongDetailsSkeleton } from '../components/UI/SkeletonLoader';

export default function SongDetails({
  cachedSongs = [],
  onToggleFavorite,
  onDeleteSong
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [song, setSong] = useState(() => {
    return cachedSongs.find((s) => s.id === id) || null;
  });
  const [isLoading, setIsLoading] = useState(!song);
  const [error, setError] = useState(null);

  const [activeKey, setActiveKey] = useState('C');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch song from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadSong() {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      const res = await getSongById(id);
      if (!isMounted) return;

      if (res.error) {
        setError(res.error);
        showToast(res.error, 'error');
      } else if (res.data) {
        setSong(res.data);
        setActiveKey(res.data.originalKey || 'C');
      }
      setIsLoading(false);
    }

    loadSong();

    return () => {
      isMounted = false;
    };
  }, [id, showToast]);

  // Keep activeKey in sync when song is first loaded
  useEffect(() => {
    if (song?.originalKey && !activeKey) {
      setActiveKey(song.originalKey);
    }
  }, [song, activeKey]);

  // Dynamically Transposed Song Model (Pure calculation - does not mutate original)
  const transposedSong = useMemo(() => {
    if (!song) return null;
    return transposeSong(song, activeKey || song.originalKey || 'C');
  }, [song, activeKey]);

  const { 
    isInThisSunday, 
    toggleSong, 
    getAdjacentSongs, 
    serviceDate, 
    formatServiceDate 
  } = useThisSunday();

  const isSelectedForSunday = song ? isInThisSunday(song.id) : false;
  const adjacentInfo = song ? getAdjacentSongs(song.id, cachedSongs) : null;
  const inSundaySetlist = Boolean(adjacentInfo && adjacentInfo.currentIndex !== -1);

  const handleNextSong = () => {
    if (adjacentInfo?.nextSong) {
      navigate(`/songs/${adjacentInfo.nextSong.id}`);
    }
  };

  const handlePrevSong = () => {
    if (adjacentInfo?.prevSong) {
      navigate(`/songs/${adjacentInfo.prevSong.id}`);
    }
  };

  const handleFavoriteClick = async () => {
    if (!song) return;
    const newStatus = !song.favorite;
    setSong((prev) => ({ ...prev, favorite: newStatus }));
    if (onToggleFavorite) {
      await onToggleFavorite(song.id, !newStatus);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!song) return;
    setIsDeleting(true);
    if (onDeleteSong) {
      const success = await onDeleteSong(song.id);
      if (success) {
        navigate('/songs');
      }
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <SongDetailsSkeleton />;
  }

  if (error || !song) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Music size={48} style={{ margin: '0 auto 16px', color: 'var(--color-danger)' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Song Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          {error || 'The song you requested does not exist or has been removed.'}
        </p>
        <Link to="/songs" className="btn btn-primary">
          <ArrowLeft size={16} />
          Return to Songs Library
        </Link>
      </div>
    );
  }

  const { title, artist, originalKey, category, style, favorite } = song;
  const isTransposed = activeKey !== originalKey;

  return (
    <div className="song-details-page">
      {/* Top Navigation & Action Row */}
      <div className="song-details-top-bar">
        <button
          type="button"
          className="btn btn-secondary btn-icon-sm"
          onClick={() => navigate('/songs')}
          aria-label="Back to song library"
        >
          <ArrowLeft size={18} />
          <span className="hide-mobile">All Songs</span>
        </button>

        <div className="song-details-action-group">
          {/* This Sunday Setlist Quick Toggle */}
          <button
            type="button"
            className={`btn ${isSelectedForSunday ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              if (song) {
                const added = toggleSong(song.id);
                showToast(
                  added ? `Added "${song.title}" to This Sunday` : `Removed "${song.title}" from This Sunday`,
                  added ? 'success' : 'info'
                );
              }
            }}
            title={isSelectedForSunday ? 'In This Sunday setlist' : 'Add to This Sunday setlist'}
            aria-label="Toggle This Sunday"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <CalendarDays size={16} />
            <span className="hide-mobile">{isSelectedForSunday ? 'In This Sunday' : '+ This Sunday'}</span>
          </button>

          {/* Performance Mode (Highlighted for Pianist) */}
          <button
            type="button"
            className="btn btn-primary song-perf-trigger-btn"
            onClick={() => setIsPerformanceOpen(true)}
            title="Open distraction-free Performance Mode"
          >
            <Maximize2 size={16} />
            <span>Play Mode</span>
          </button>

          <button
            type="button"
            className={`btn btn-secondary btn-icon-favorite ${favorite ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
          >
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
          </button>

          <Link
            to={`/songs/${id}/edit`}
            className="btn btn-secondary"
            title="Edit song structure"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <Edit2 size={16} />
            <span className="hide-mobile">Edit</span>
          </Link>

          <button
            type="button"
            className="btn btn-secondary hide-mobile"
            onClick={handlePrint}
            title="Print chord chart"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
          >
            <Printer size={16} />
          </button>

          <button
            type="button"
            className="btn btn-ghost text-danger"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete this song"
            aria-label="Delete song"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* This Sunday Worship Setlist Flow Bar */}
      {inSundaySetlist && (
        <div 
          className="card this-sunday-flow-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CalendarDays size={13} />
              This Sunday
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Song <strong>{adjacentInfo.currentIndex + 1}</strong> of <strong>{adjacentInfo.total}</strong> ({formatServiceDate(serviceDate)})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrevSong}
              disabled={!adjacentInfo.prevSong}
              title={adjacentInfo.prevSong ? `Previous: ${adjacentInfo.prevSong.title}` : 'No previous song'}
            >
              <ChevronLeft size={16} />
              <span className="hide-mobile">Previous</span>
            </button>

            <Link
              to="/this-sunday"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              title="View full Sunday setlist"
            >
              View Setlist
            </Link>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNextSong}
              disabled={!adjacentInfo.nextSong}
              title={adjacentInfo.nextSong ? `Next: ${adjacentInfo.nextSong.title}` : 'No next song'}
            >
              <span className="hide-mobile">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Unified Modern Song Header Card */}
      <div className="card song-details-header-card">
        <div className="song-details-header-content">
          <div className="song-details-title-group">
            <h1 className="song-details-title">
              {title}
            </h1>
            <div className="song-details-artist-row">
              <span className="song-details-artist">
                <User size={14} style={{ opacity: 0.7 }} />
                {artist || 'Unknown Artist'}
              </span>
            </div>
          </div>

          <div className="song-details-badges-group">
            <span className="badge badge-key">
              Key: <strong>{originalKey || 'C'}</strong>
            </span>
            {isTransposed && (
              <span className="badge badge-key transposed-badge">
                Playing in: <strong>{activeKey}</strong>
              </span>
            )}
            {category && (
              <span
                className={`badge badge-category ${
                  category.toLowerCase() === 'tamil' ? 'badge-lang-tamil' :
                  category.toLowerCase() === 'hindi' ? 'badge-lang-hindi' :
                  category.toLowerCase() === 'english' ? 'badge-lang-english' : ''
                }`}
              >
                {category.toLowerCase() === 'tamil' ? '🇮🇳 Tamil' :
                 category.toLowerCase() === 'hindi' ? '🇮🇳 Hindi' :
                 category.toLowerCase() === 'english' ? '🌐 English' : category}
              </span>
            )}
            {style?.name && (
              <span
                className="badge badge-style badge-style-highlight"
                title={`Style: ${style.category || ''} → ${style.name} (${formatStyleCode(style)})`}
              >
                <Sliders size={12} />
                <span>Style: <strong>{formatMainStyleHighlight(style)}</strong></span>
              </span>
            )}
            {song.tempo && (
              <span className="badge badge-meta" title={`Tempo: ${song.tempo} BPM`}>
                <Gauge size={12} />
                <span>{song.tempo} BPM</span>
              </span>
            )}
            {song.timeSignature && (
              <span className="badge badge-meta" title={`Time Signature: ${song.timeSignature}`}>
                <Clock size={12} />
                <span>{song.timeSignature}</span>
              </span>
            )}
            {song.notes && (
              <span className="badge badge-notes" title={`Performance Notes: ${song.notes}`}>
                <FileText size={12} />
                <span>{song.notes}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Transposition Toolbar */}
      <div className="song-details-transposer-wrapper">
        <TransposeBar
          originalKey={originalKey || 'C'}
          activeKey={activeKey}
          semitoneDelta={transposedSong?.semitoneDelta || 0}
          onChangeKey={setActiveKey}
        />
      </div>

      {/* Structured Song Content (Piano Friendly Reading) */}
      <SongViewer transposedSong={transposedSong} />

      {/* Performance Mode Modal (Supports Portrait & Landscape) */}
      <PerformanceModal
        isOpen={isPerformanceOpen}
        onClose={() => setIsPerformanceOpen(false)}
        transposedSong={transposedSong}
        onChangeKey={setActiveKey}
        setlistSongs={inSundaySetlist ? adjacentInfo.setlistSongs : []}
        currentIndex={inSundaySetlist ? adjacentInfo.currentIndex : -1}
        onNextSong={handleNextSong}
        onPrevSong={handlePrevSong}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete "${title}"?`}
        message="This will permanently delete this song and its musical sections from your Firestore database. This action cannot be undone."
        confirmText="Delete Song"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
