import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  Sparkles,
  Plus,
  Play,
  Maximize2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music,
  ArrowRight,
  Search,
  Check,
  X,
  Printer,
  Info,
  Sliders,
  Clock,
  Gauge,
  Layers,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useThisSunday } from '../context/ThisSundayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import KeyBadge from '../components/UI/KeyBadge';
import EmptyState from '../components/UI/EmptyState';
import PerformanceModal from '../components/Modal/PerformanceModal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import { formatMainStyleHighlight } from '../data/songStyles.js';
import { transposeSong } from '../services/transposer.js';

export default function ThisSunday({ songs = [], isLoading = false }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    serviceDate,
    songIds,
    setDate,
    removeSong,
    addSong,
    toggleSong,
    reorderSongs,
    clearSetlist,
    getUpcomingSunday,
    formatServiceDate,
    getDaysUntil,
    isDateExpired
  } = useThisSunday();

  // Search & Filter state for Add Songs Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('ALL');

  // Clear confirm modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Performance / Play Mode state
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  const [activeKeyOverrides, setActiveKeyOverrides] = useState({});

  // Map songIds to full song objects in order
  const setlistSongs = useMemo(() => {
    const map = new Map(songs.map(s => [s.id, s]));
    return songIds.map(id => map.get(id)).filter(Boolean);
  }, [songIds, songs]);

  // Available songs to add (not yet in setlist)
  const availableSongs = useMemo(() => {
    return songs.filter(s => !songIds.includes(s.id));
  }, [songs, songIds]);

  // Filtered available songs for modal picker
  const filteredModalSongs = useMemo(() => {
    return songs.filter(s => {
      const matchSearch =
        !modalSearch.trim() ||
        (s.title || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
        (s.artist || '').toLowerCase().includes(modalSearch.toLowerCase());
      const matchCat =
        modalCategory === 'ALL' ||
        (s.category || '').toLowerCase() === modalCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [songs, modalSearch, modalCategory]);

  const daysUntilText = getDaysUntil(serviceDate);
  const isPast = isDateExpired(serviceDate);

  // Current playing song model in Performance Mode
  const activePlayingSong = setlistSongs[activeSongIndex] || null;
  const currentSongKey = activePlayingSong
    ? (activeKeyOverrides[activePlayingSong.id] || activePlayingSong.originalKey || 'C')
    : 'C';

  const transposedPlayingSong = useMemo(() => {
    if (!activePlayingSong) return null;
    return transposeSong(activePlayingSong, currentSongKey);
  }, [activePlayingSong, currentSongKey]);

  // Handle Play Mode launch from a specific song in setlist
  const handleStartService = (startIndex = 0) => {
    if (setlistSongs.length === 0) {
      showToast('Please add at least one song to your Sunday setlist first.', 'warning');
      return;
    }
    setActiveSongIndex(Math.max(0, Math.min(startIndex, setlistSongs.length - 1)));
    setIsPerformanceOpen(true);
  };

  // Next and Previous song navigation handlers for Performance Mode
  const handleNextSong = () => {
    if (activeSongIndex < setlistSongs.length - 1) {
      setActiveSongIndex(prev => prev + 1);
    }
  };

  const handlePrevSong = () => {
    if (activeSongIndex > 0) {
      setActiveSongIndex(prev => prev - 1);
    }
  };

  const handleChangeKey = (newKey) => {
    if (!activePlayingSong) return;
    setActiveKeyOverrides(prev => ({
      ...prev,
      [activePlayingSong.id]: newKey
    }));
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      reorderSongs(index, index - 1);
      showToast('Song order updated', 'info', 1500);
    }
  };

  const handleMoveDown = (index) => {
    if (index < setlistSongs.length - 1) {
      reorderSongs(index, index + 1);
      showToast('Song order updated', 'info', 1500);
    }
  };

  const handleRemove = (songId, title) => {
    removeSong(songId);
    showToast(`Removed "${title}" from This Sunday`, 'info');
  };

  const handleClearConfirm = () => {
    clearSetlist();
    setIsClearModalOpen(false);
    showToast('This Sunday setlist cleared', 'info');
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate) {
      setDate(newDate);
      showToast(`Service date set to ${formatServiceDate(newDate)}`, 'success');
    }
  };

  const handleSetToUpcomingSunday = () => {
    const upcoming = getUpcomingSunday();
    setDate(upcoming);
    showToast(`Service date set to upcoming Sunday (${formatServiceDate(upcoming)})`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="this-sunday-page">
      {/* Top Banner / Hero Card */}
      <div className="dashboard-banner this-sunday-hero">
        <div className="this-sunday-hero-left">
          <div className="this-sunday-badge-row">
            <span className="badge badge-category" style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
              <CalendarDays size={14} />
              <span>Worship Service Planner</span>
            </span>
            <span className={`badge ${isPast ? 'badge-key transposed-badge' : 'badge-meta'}`}>
              {daysUntilText}
            </span>
          </div>

          <h1 className="dashboard-title" style={{ marginTop: '8px', marginBottom: '6px' }}>
            This Sunday's Setlist
          </h1>
          <p className="dashboard-subtitle">
            {formatServiceDate(serviceDate) || 'Sunday Service'} • {setlistSongs.length} {setlistSongs.length === 1 ? 'song selected' : 'songs selected'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="this-sunday-hero-actions">
          {setlistSongs.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-lg this-sunday-play-btn"
              onClick={() => handleStartService(0)}
              title="Open full-screen Performance Mode for Sunday Service"
            >
              <Play size={18} fill="currentColor" />
              <span>Start Service</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            title="Add songs from library"
          >
            <Plus size={18} />
            <span>Add Songs</span>
          </button>

          {setlistSongs.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-secondary hide-mobile"
                onClick={handlePrint}
                title="Print Sunday chord charts"
              >
                <Printer size={16} />
              </button>

              <button
                type="button"
                className="btn btn-ghost text-danger"
                onClick={() => setIsClearModalOpen(true)}
                title="Clear entire setlist"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Service Date & Auto-Expiration Control Bar */}
      <div className="card this-sunday-date-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '0.94rem' }}>Scheduled Service Date:</strong>
            </div>

            <input
              type="date"
              value={serviceDate}
              onChange={handleDateChange}
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '160px',
                padding: '6px 12px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
              title="Pick service date"
            />

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleSetToUpcomingSunday}
              title="Reset to next Sunday"
              style={{ fontSize: '0.82rem' }}
            >
              <RotateCcw size={13} />
              <span>Upcoming Sunday</span>
            </button>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
            <span>Auto-clears after service date has passed.</span>
          </div>
        </div>
      </div>

      {/* Setlist Song List */}
      {setlistSongs.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--color-primary)'
          }}>
            <CalendarDays size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Your Sunday Setlist is Empty</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px', fontSize: '0.94rem' }}>
            Select songs from your library to prepare for <strong>{formatServiceDate(serviceDate)}</strong>. You can reorder songs and navigate seamlessly during the service.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={18} />
              <span>Add Songs to This Sunday</span>
            </button>
            <Link to="/songs" className="btn btn-secondary">
              <span>Browse All Songs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="this-sunday-list">
          {setlistSongs.map((song, index) => {
            const isFirst = index === 0;
            const isLast = index === setlistSongs.length - 1;

            return (
              <div
                key={song.id}
                className="card this-sunday-item-card"
                style={{
                  marginBottom: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Left: Position & Title Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '220px' }}>
                  <div className="this-sunday-order-badge">
                    {index + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <Link
                        to={`/songs/${song.id}`}
                        style={{
                          fontSize: '1.08rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          textDecoration: 'none'
                        }}
                        className="hover-primary"
                      >
                        {song.title}
                      </Link>
                      <KeyBadge songKey={song.originalKey || 'C'} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.84rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>{song.artist || 'Unknown Artist'}</span>
                      <span>•</span>
                      <span>{song.category || 'Worship'}</span>
                      {song.style?.name && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 600 }}>
                            <Sliders size={12} />
                            {formatMainStyleHighlight(song.style)}
                          </span>
                        </>
                      )}
                      {song.tempo && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Gauge size={12} />
                            {song.tempo} BPM
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Order & Play Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon-xs"
                      onClick={() => handleMoveUp(index)}
                      disabled={isFirst}
                      title="Move song up"
                      style={{ padding: '2px 6px', height: '22px' }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon-xs"
                      onClick={() => handleMoveDown(index)}
                      disabled={isLast}
                      title="Move song down"
                      style={{ padding: '2px 6px', height: '22px' }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartService(index)}
                    title="Launch Performance Play Mode starting at this song"
                  >
                    <Maximize2 size={14} />
                    <span>Play Mode</span>
                  </button>

                  <Link
                    to={`/songs/${song.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Open songbook sheet"
                  >
                    <span>View</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => handleRemove(song.id, song.title)}
                    title="Remove from Sunday setlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Songs Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content this-sunday-add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%' }}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add Songs to This Sunday</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Select songs from your library for {formatServiceDate(serviceDate)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon-sm"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Language Filter */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search songs by title or artist..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['ALL', 'Tamil', 'Hindi', 'English', 'Worship'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${modalCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setModalCategory(cat)}
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    {cat === 'ALL' ? 'All Songs' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Song Selection List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '12px 20px' }}>
              {filteredModalSongs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                  <Music size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p>No matching songs found.</p>
                </div>
              ) : (
                filteredModalSongs.map((song) => {
                  const isInSetlist = songIds.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        marginBottom: '6px',
                        backgroundColor: isInSetlist ? 'var(--color-primary-light)' : 'transparent',
                        border: `1px solid ${isInSetlist ? 'var(--border-focus)' : 'var(--border-color)'}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${isInSetlist ? 'var(--color-primary)' : 'var(--text-muted)'}`,
                          backgroundColor: isInSetlist ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          {isInSetlist && <Check size={14} />}
                        </div>

                        <div>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                            {song.title}
                          </strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {song.artist || 'Unknown Artist'} • {song.category || 'General'}
                          </div>
                        </div>
                      </div>

                      <KeyBadge songKey={song.originalKey || 'C'} />
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                {songIds.length} {songIds.length === 1 ? 'song selected' : 'songs selected'}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Setlist Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear This Sunday's Setlist?"
        message="Are you sure you want to remove all songs from This Sunday's service queue? Your songs will remain safely stored in your main library."
        confirmText="Clear Setlist"
        onConfirm={handleClearConfirm}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Performance / Play Mode with Next & Previous Song Navigation */}
      {isPerformanceOpen && transposedPlayingSong && (
        <PerformanceModal
          isOpen={isPerformanceOpen}
          onClose={() => setIsPerformanceOpen(false)}
          transposedSong={transposedPlayingSong}
          onChangeKey={handleChangeKey}
          setlistSongs={setlistSongs}
          currentIndex={activeSongIndex}
          onNextSong={handleNextSong}
          onPrevSong={handlePrevSong}
        />
      )}
    </div>
  );
}
