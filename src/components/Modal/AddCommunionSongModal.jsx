import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Music, Check, X, Wine } from 'lucide-react';
import KeyBadge from '../UI/KeyBadge';
import { useCommunion } from '../../context/CommunionContext.jsx';
import { searchSongsWithFuzzy } from '../../utils/fuzzySearch.js';

export default function AddCommunionSongModal({
  isOpen,
  onClose,
  songs = []
}) {
  const { songIds, toggleSong } = useCommunion();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const { filteredSongs, didYouMean, isFuzzyMatch } = useMemo(() => {
    const baseList = songs.filter((s) => {
      return (
        category === 'ALL' ||
        (s.category || '').toLowerCase() === category.toLowerCase()
      );
    });

    if (!search.trim()) {
      return { filteredSongs: baseList, didYouMean: null, isFuzzyMatch: false };
    }

    const searchResult = searchSongsWithFuzzy(baseList, search);
    return {
      filteredSongs: searchResult.results,
      didYouMean: searchResult.didYouMean,
      isFuzzyMatch: searchResult.isFuzzyMatch
    };
  }, [songs, search, category]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content this-sunday-add-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wine size={18} style={{ color: '#ec4899' }} />
              <h3 className="modal-title">Add Songs to Communion</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select reflective and worship songs for the Lord's Supper
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search communion songs by title or artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}
          >
            {['ALL', 'Tamil', 'Hindi', 'English', 'Worship'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(cat)}
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              >
                {cat === 'ALL' ? 'All Songs' : cat}
              </button>
            ))}
          </div>

          {isFuzzyMatch && didYouMean && (
            <div className="did-you-mean-banner did-you-mean-modal" style={{ margin: '8px 0 0 0' }}>
              <Sparkles size={14} className="did-you-mean-icon" />
              <span style={{ fontSize: '0.82rem' }}>Did you mean:</span>
              <button
                type="button"
                className="did-you-mean-btn"
                style={{ fontSize: '0.82rem', padding: '2px 8px' }}
                onClick={() => setSearch(didYouMean)}
              >
                <strong>{didYouMean}</strong>
              </button>
              <span>?</span>
            </div>
          )}
        </div>

        {/* Songs List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '12px 20px' }}>
          {filteredSongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
              <Music size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>No matching songs found.</p>
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isInCommunion = songIds.includes(song.id);

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
                    backgroundColor: isInCommunion ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                    border: `1px solid ${isInCommunion ? '#ec4899' : 'var(--border-color)'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${isInCommunion ? '#ec4899' : 'var(--text-muted)'}`,
                        backgroundColor: isInCommunion ? '#ec4899' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      {isInCommunion && <Check size={14} />}
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

        <div
          className="modal-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            {songIds.length} {songIds.length === 1 ? 'song selected' : 'songs selected'}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
