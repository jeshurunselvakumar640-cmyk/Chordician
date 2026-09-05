import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wine,
  Sparkles,
  Plus,
  Play,
  Maximize2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music,
  Printer,
  Sliders,
  Gauge,
  FileDown,
  HeartHandshake
} from 'lucide-react';
import { useCommunion } from '../context/CommunionContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import KeyBadge from '../components/UI/KeyBadge';
import EmptyState from '../components/UI/EmptyState';
import PerformanceModal from '../components/Modal/PerformanceModal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import BatchExportModal from '../components/Modal/BatchExportModal';
import AddCommunionSongModal from '../components/Modal/AddCommunionSongModal';
import { formatMainStyleHighlight } from '../data/songStyles.js';
import { transposeSong } from '../services/transposer.js';

export default function CommunionSongs({ songs = [], isLoading = false }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    songIds,
    removeSong,
    reorderSongs,
    clearCommunion
  } = useCommunion();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isExportPDFOpen, setIsExportPDFOpen] = useState(false);

  // Performance / Play Mode state
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  const [activeKeyOverrides, setActiveKeyOverrides] = useState({});

  // Map songIds to full song objects in order
  const communionSongs = useMemo(() => {
    const map = new Map(songs.map((s) => [s.id, s]));
    return songIds.map((id) => map.get(id)).filter(Boolean);
  }, [songIds, songs]);

  // Current playing song model in Performance Mode
  const activePlayingSong = communionSongs[activeSongIndex] || null;
  const currentSongKey = activePlayingSong
    ? activeKeyOverrides[activePlayingSong.id] || activePlayingSong.originalKey || 'C'
    : 'C';

  const transposedPlayingSong = useMemo(() => {
    if (!activePlayingSong) return null;
    return transposeSong(activePlayingSong, currentSongKey);
  }, [activePlayingSong, currentSongKey]);

  const handleStartCommunion = (startIndex = 0) => {
    if (communionSongs.length === 0) {
      showToast('Please add at least one song to your Communion setlist first.', 'warning');
      return;
    }
    setActiveSongIndex(Math.max(0, Math.min(startIndex, communionSongs.length - 1)));
    setIsPerformanceOpen(true);
  };

  const handleNextSong = () => {
    if (activeSongIndex < communionSongs.length - 1) {
      setActiveSongIndex((prev) => prev + 1);
    }
  };

  const handlePrevSong = () => {
    if (activeSongIndex > 0) {
      setActiveSongIndex((prev) => prev - 1);
    }
  };

  const handleChangeKey = (newKey) => {
    if (!activePlayingSong) return;
    setActiveKeyOverrides((prev) => ({
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
    if (index < communionSongs.length - 1) {
      reorderSongs(index, index + 1);
      showToast('Song order updated', 'info', 1500);
    }
  };

  const handleRemove = (songId, title) => {
    removeSong(songId);
    showToast(`Removed "${title}" from Communion Songs`, 'info');
  };

  const handleClearConfirm = () => {
    clearCommunion();
    setIsClearModalOpen(false);
    showToast('Communion songs setlist cleared', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="communion-page">
      {/* Top Banner / Hero Card */}
      <div
        className="dashboard-banner communion-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(159, 18, 57, 0.15) 0%, rgba(225, 29, 72, 0.08) 50%, rgba(136, 19, 55, 0.15) 100%)',
          borderColor: 'rgba(225, 29, 72, 0.3)'
        }}
      >
        <div className="this-sunday-hero-left">
          <div className="this-sunday-badge-row">
            <span
              className="badge badge-category"
              style={{
                backgroundColor: 'rgba(225, 29, 72, 0.18)',
                color: '#f43f5e',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Wine size={14} />
              <span>Holy Communion & Lord's Supper</span>
            </span>
            <span className="badge badge-meta">
              {communionSongs.length} {communionSongs.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          <h1 className="dashboard-title" style={{ marginTop: '8px', marginBottom: '6px' }}>
            Communion Songs
          </h1>
          <p className="dashboard-subtitle">
            Curated setlist of reverent, contemplative worship songs for the Lord's table.
          </p>
        </div>

        {/* Action Controls */}
        <div className="this-sunday-hero-actions">
          {communionSongs.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-lg this-sunday-play-btn"
              onClick={() => handleStartCommunion(0)}
              title="Open full-screen Performance Mode for Communion Service"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                borderColor: '#e11d48'
              }}
            >
              <Play size={18} fill="currentColor" />
              <span>Start Communion</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
            title="Add songs to Communion"
          >
            <Plus size={18} />
            <span>Add Songs</span>
          </button>

          {communionSongs.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsExportPDFOpen(true)}
                title="Export entire Communion setlist as PDF"
              >
                <FileDown size={16} />
                <span className="hide-mobile">Export PDF</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary hide-mobile"
                onClick={handlePrint}
                title="Print Communion chord charts"
              >
                <Printer size={16} />
              </button>

              <button
                type="button"
                className="btn btn-ghost text-danger"
                onClick={() => setIsClearModalOpen(true)}
                title="Clear Communion setlist"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Communion Song List */}
      {communionSongs.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(225, 29, 72, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#e11d48'
            }}
          >
            <Wine size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Communion Songs Added Yet</h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '460px',
              margin: '0 auto 24px',
              fontSize: '0.94rem'
            }}
          >
            Build your collection of reflective songs for the Lord's Supper. You can quickly add songs from any song page or card using the <strong>+ Communion</strong> button.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                borderColor: '#e11d48'
              }}
            >
              <Plus size={18} />
              <span>Add Songs to Communion</span>
            </button>
            <Link to="/songs" className="btn btn-secondary">
              <span>Browse All Songs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="this-sunday-list">
          {communionSongs.map((song, index) => {
            const isFirst = index === 0;
            const isLast = index === communionSongs.length - 1;

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
                  <div
                    className="this-sunday-order-badge"
                    style={{
                      backgroundColor: 'rgba(225, 29, 72, 0.15)',
                      color: '#e11d48',
                      border: '1px solid rgba(225, 29, 72, 0.3)'
                    }}
                  >
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

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '4px',
                        fontSize: '0.84rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span>{song.artist || 'Unknown Artist'}</span>
                      <span>•</span>
                      <span>{song.category || 'Communion'}</span>
                      {song.style?.name && (
                        <>
                          <span>•</span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--text-main)',
                              fontWeight: 600
                            }}
                          >
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
                    onClick={() => handleStartCommunion(index)}
                    title="Launch Performance Play Mode starting at this song"
                    style={{
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      borderColor: '#e11d48'
                    }}
                  >
                    <Maximize2 size={14} />
                    <span>Play Mode</span>
                  </button>

                  <Link
                    to={`/songs/${song.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Open song sheet"
                  >
                    <span>View</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => handleRemove(song.id, song.title)}
                    title="Remove from Communion Songs"
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
      <AddCommunionSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        songs={songs}
      />

      {/* Batch Export PDF Modal for Communion Setlist */}
      <BatchExportModal
        isOpen={isExportPDFOpen}
        onClose={() => setIsExportPDFOpen(false)}
        songs={communionSongs}
        title="Export Communion Songs as PDF"
        defaultSelectedIds={songIds}
        subtitle="Holy Communion Worship Setlist"
      />

      {/* Clear Setlist Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear Communion Songs?"
        message="Are you sure you want to remove all songs from your Communion setlist? Your songs will remain safely stored in your main library."
        confirmText="Clear List"
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
          setlistSongs={communionSongs}
          currentIndex={activeSongIndex}
          onNextSong={handleNextSong}
          onPrevSong={handlePrevSong}
        />
      )}
    </div>
  );
}
