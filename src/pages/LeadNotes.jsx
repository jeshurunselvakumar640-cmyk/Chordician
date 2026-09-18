import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Music2,
  Sparkles,
  Plus,
  Check,
  Trash2,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  Music,
  FileDown
} from 'lucide-react';
import {
  hasMeaningfulLead,
  getStoredLeadNotes,
  addSongToLeadNotes,
  removeSongFromLeadNotes
} from '../services/leadNotesService';
import { useToast } from '../context/ToastContext';
import KeyBadge from '../components/UI/KeyBadge';
import EmptyState from '../components/UI/EmptyState';
import SearchBar from '../components/SearchBar/SearchBar';
import { SongCardSkeleton } from '../components/UI/SkeletonLoader';
import { getStoredViewMode, setStoredViewMode } from '../services/storage';
import { searchSongsWithFuzzy } from '../utils/fuzzySearch';

export default function LeadNotes({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [leadSongIds, setLeadSongIds] = useState(() => getStoredLeadNotes());
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [viewMode, setViewMode] = useState(() => getStoredViewMode());

  // Listen for real-time lead notes updates from cloud or local changes
  useEffect(() => {
    const handleSync = (e) => {
      const updatedIds = Array.isArray(e.detail) ? e.detail : [];
      setLeadSongIds(updatedIds);
    };

    window.addEventListener('chordician:lead-notes-updated', handleSync);
    return () => {
      window.removeEventListener('chordician:lead-notes-updated', handleSync);
    };
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };

  // 1. Identify all songs in library that contain meaningful Lead content
  const allEligibleLeadSongs = useMemo(() => {
    return (Array.isArray(songs) ? songs : []).filter((s) => s && s.id && hasMeaningfulLead(s));
  }, [songs]);

  // 2. Map user's personal saved Lead Notes songs in order
  const myLeadSongs = useMemo(() => {
    const safeSongs = Array.isArray(songs) ? songs.filter((s) => s && s.id) : [];
    const map = new Map(safeSongs.map((s) => [s.id, s]));
    return (leadSongIds || []).map((id) => map.get(id)).filter(Boolean);
  }, [leadSongIds, songs]);

  // 3. Filtered lists based on search query
  const { filteredMyLeadSongs, filteredAvailableSongs } = useMemo(() => {
    const query = deferredSearchQuery.trim();
    if (!query) {
      return {
        filteredMyLeadSongs: myLeadSongs,
        filteredAvailableSongs: allEligibleLeadSongs
      };
    }

    const mySearchResult = searchSongsWithFuzzy(myLeadSongs, query);
    const availableSearchResult = searchSongsWithFuzzy(allEligibleLeadSongs, query);

    return {
      filteredMyLeadSongs: mySearchResult.results,
      filteredAvailableSongs: availableSearchResult.results
    };
  }, [myLeadSongs, allEligibleLeadSongs, deferredSearchQuery]);

  // Action: Add song to personal Lead Notes
  const handleAdd = (songId, title = 'Song') => {
    const next = addSongToLeadNotes(songId);
    setLeadSongIds(next);
    showToast(`Added "${title}" to Lead Notes`, 'success', 2000);
  };

  // Action: Remove song from personal Lead Notes
  const handleRemove = (songId, title = 'Song') => {
    const next = removeSongFromLeadNotes(songId);
    setLeadSongIds(next);
    showToast(`Removed "${title}" from Lead Notes`, 'info', 2000);
  };

  return (
    <div className="lead-notes-page" style={{ padding: '24px 20px 80px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary-bg), var(--bg-surface-elevated))',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-primary-light, var(--border-subtle))',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Music2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Lead Notes
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {myLeadSongs.length} {myLeadSongs.length === 1 ? 'song' : 'songs'} in your personal list • {allEligibleLeadSongs.length} available with Lead notes
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Search within Lead Notes */}
      {(allEligibleLeadSongs.length > 0 || myLeadSongs.length > 0) && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: '28px' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search lead songs by title, artist, key..."
            songs={allEligibleLeadSongs}
          />
        </div>
      )}

      {isLoading ? (
        <div className="songs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {/* SECTION B: MY LEAD NOTES */}
          <section className="my-lead-notes-section">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  My Lead Notes
                </h2>
                <span className="badge" style={{
                  backgroundColor: 'var(--color-primary-bg)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}>
                  {myLeadSongs.length}
                </span>
              </div>
            </div>

            {filteredMyLeadSongs.length === 0 ? (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <EmptyState
                  type="songs"
                  title={searchQuery ? 'No matching songs in My Lead Notes' : "You haven't added any songs to Lead Notes yet."}
                  description={
                    searchQuery
                      ? 'Try another search term or browse the available songs with Lead below.'
                      : 'Add songs from the Available Songs with Lead section below to practice and perform your melody/lead parts.'
                  }
                  actionText={!searchQuery && allEligibleLeadSongs.length > 0 ? 'View Available Lead Songs' : undefined}
                  onAction={() => {
                    document.getElementById('available-lead-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="songs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredMyLeadSongs.map((song) => (
                  <div
                    key={song.id}
                    className="card song-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <Link
                          to={`/songs/${song.id}`}
                          style={{
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            color: 'var(--text-main)',
                            textDecoration: 'none',
                            lineHeight: 1.3
                          }}
                        >
                          {song.title}
                        </Link>
                        <KeyBadge musicKey={song.key || song.originalKey || 'C'} />
                      </div>

                      {song.artist && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          {song.artist}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            color: '#a855f7',
                            border: '1px solid rgba(168, 85, 247, 0.28)'
                          }}
                        >
                          <Sparkles size={11} />
                          LEAD
                        </span>
                        {song.tempo && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            • {song.tempo} BPM
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      <Link
                        to={`/songs/${song.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                      >
                        <ArrowRight size={14} />
                        <span>Open</span>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemove(song.id, song.title)}
                        title="Remove from Lead Notes list"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="songs-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredMyLeadSongs.map((song) => (
                  <div
                    key={song.id}
                    className="card song-list-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-md)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                      <KeyBadge musicKey={song.key || song.originalKey || 'C'} />
                      <div>
                        <Link
                          to={`/songs/${song.id}`}
                          style={{
                            fontWeight: 700,
                            fontSize: '0.98rem',
                            color: 'var(--text-main)',
                            textDecoration: 'none'
                          }}
                        >
                          {song.title}
                        </Link>
                        {song.artist && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {song.artist}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(168, 85, 247, 0.12)',
                          color: '#a855f7',
                          border: '1px solid rgba(168, 85, 247, 0.28)'
                        }}
                      >
                        <Sparkles size={10} />
                        LEAD
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/songs/${song.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <ArrowRight size={14} />
                        <span>Open</span>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemove(song.id, song.title)}
                        title="Remove from Lead Notes"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION A: AVAILABLE SONGS WITH LEAD */}
          <section className="available-lead-notes-section" id="available-lead-section">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Available Songs with Lead
                </h2>
                <span className="badge" style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}>
                  {allEligibleLeadSongs.length}
                </span>
              </div>
            </div>

            {filteredAvailableSongs.length === 0 ? (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <EmptyState
                  type="songs"
                  title="No songs with Lead notes found yet."
                  description="When songs in your library have melody or lead notes notation added, they will appear here automatically."
                  actionText="Browse All Songs"
                  actionLink="/songs"
                />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="songs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredAvailableSongs.map((song) => {
                  const isAdded = (leadSongIds || []).includes(song.id);
                  return (
                    <div
                      key={song.id}
                      className="card song-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <Link
                            to={`/songs/${song.id}`}
                            style={{
                              fontWeight: 800,
                              fontSize: '1.05rem',
                              color: 'var(--text-main)',
                              textDecoration: 'none',
                              lineHeight: 1.3
                            }}
                          >
                            {song.title}
                          </Link>
                          <KeyBadge musicKey={song.key || song.originalKey || 'C'} />
                        </div>

                        {song.artist && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            {song.artist}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(168, 85, 247, 0.12)',
                              color: '#a855f7',
                              border: '1px solid rgba(168, 85, 247, 0.28)'
                            }}
                          >
                            <Sparkles size={11} />
                            LEAD
                          </span>
                          {song.tempo && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                              • {song.tempo} BPM
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        {isAdded ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled
                            style={{ width: '100%', justifyContent: 'center', opacity: 0.85, cursor: 'default' }}
                          >
                            <Check size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>Added ✓</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAdd(song.id, song.title)}
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            <Plus size={14} />
                            <span>+ Add to Lead Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="songs-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredAvailableSongs.map((song) => {
                  const isAdded = (leadSongIds || []).includes(song.id);
                  return (
                    <div
                      key={song.id}
                      className="card song-list-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderRadius: 'var(--radius-md)',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                        <KeyBadge musicKey={song.key || song.originalKey || 'C'} />
                        <div>
                          <Link
                            to={`/songs/${song.id}`}
                            style={{
                              fontWeight: 700,
                              fontSize: '0.98rem',
                              color: 'var(--text-main)',
                              textDecoration: 'none'
                            }}
                          >
                            {song.title}
                          </Link>
                          {song.artist && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {song.artist}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            color: '#a855f7',
                            border: '1px solid rgba(168, 85, 247, 0.28)'
                          }}
                        >
                          <Sparkles size={10} />
                          LEAD
                        </span>
                      </div>

                      <div>
                        {isAdded ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled
                            style={{ opacity: 0.85, cursor: 'default' }}
                          >
                            <Check size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>Added ✓</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAdd(song.id, song.title)}
                          >
                            <Plus size={14} />
                            <span>+ Add to Lead Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
