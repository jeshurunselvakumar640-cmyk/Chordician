import React, { useState, useEffect, useMemo } from 'react';
import { Search, Music, X, Check, Link as LinkIcon } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import { getSongs } from '../../firebase/songs';

export default function LyricalChordicianLinkModal({
  isOpen,
  onClose,
  currentLinkedId = null,
  onSelectSong
}) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  const [chordicianSongs, setChordicianSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getSongs()
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          setChordicianSongs(list);
        })
        .catch(() => {
          setChordicianSongs([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return chordicianSongs;
    const q = searchQuery.trim().toLowerCase();
    return chordicianSongs.filter((s) => {
      const title = (s.title || '').toLowerCase();
      const artist = (s.artist || s.singer || '').toLowerCase();
      return title.includes(q) || artist.includes(q);
    });
  }, [chordicianSongs, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content lyrical-link-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '94%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="lyrical-modal-icon-badge"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}
            >
              <Music size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                {t.selectChordicianSongModalTitle || 'Select Chordician Song'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label={t.closeBtn || 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="lyrical-search-wrapper" style={{ margin: 0 }}>
            <Search size={16} className="lyrical-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.selectChordicianSongSearchPlaceholder || 'Search Chordician songs by title or artist...'}
              className="lyrical-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="lyrical-search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Songs List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: '200px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Loading Chordician songs...
            </div>
          ) : filteredSongs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredSongs.map((cSong) => {
                const isSelected = String(cSong.id) === String(currentLinkedId);
                return (
                  <div
                    key={cSong.id}
                    className={`lyrical-chord-link-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (onSelectSong) onSelectSong(cSong);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cSong.title}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {cSong.artist || cSong.singer || 'Unknown Artist'} {cSong.key ? `• Key: ${cSong.key}` : ''}
                      </span>
                    </div>

                    <div style={{ marginLeft: '12px', flexShrink: 0 }}>
                      {isSelected ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} />
                          <span>Linked</span>
                        </span>
                      ) : (
                        <span className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <Music size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {t.noChordicianSongsFound || 'No Chordician songs found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
