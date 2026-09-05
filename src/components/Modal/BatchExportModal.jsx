import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileDown,
  Search,
  Check,
  CheckSquare,
  Square,
  Music,
  CalendarDays,
  Sparkles,
  Sliders,
  Filter
} from 'lucide-react';
import KeyBadge from '../UI/KeyBadge';
import { exportSongsToPDF } from '../../services/shareService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatMainStyleHighlight } from '../../data/songStyles.js';

export default function BatchExportModal({
  isOpen,
  onClose,
  songs = [],
  title = 'Export Songs to PDF',
  defaultSelectedIds = [],
  subtitle = 'Chordician Songbook'
}) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState(null);
  const [customSubtitle, setCustomSubtitle] = useState(subtitle);

  // Initialize selected IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultSelectedIds && defaultSelectedIds.length > 0) {
        setSelectedIds([...defaultSelectedIds]);
      } else {
        // Default to selecting all if small list, or empty
        setSelectedIds(songs.map((s) => s.id));
      }
      setCustomSubtitle(subtitle);
    }
  }, [isOpen, defaultSelectedIds, songs, subtitle]);

  // Filter songs by search and category
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.artist || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === 'ALL' ||
        (s.category || '').toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [songs, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleToggleSong = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredSongs.map((s) => s.id);
    const union = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    setSelectedIds(union);
  };

  const handleDeselectAll = () => {
    const filteredSet = new Set(filteredSongs.map((s) => s.id));
    setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least 1 song to export', 'warning');
      return;
    }

    const songMap = new Map(songs.map((s) => [s.id, s]));
    // Preserve defaultSelectedIds order if provided, otherwise preserve songs array order
    const orderedSongs = selectedIds.map((id) => songMap.get(id)).filter(Boolean);

    setIsExporting(true);
    setProgressText('Compiling PDF pages...');

    try {
      await exportSongsToPDF(orderedSongs, {
        documentSubtitle: customSubtitle || 'Chordician Songbook',
        onProgress: (curr, total) => {
          setProgressText(`Rendering song ${curr} of ${total}...`);
        }
      });
      showToast(`Exported ${orderedSongs.length} songs to PDF!`, 'success');
      onClose();
    } catch (err) {
      console.error('Batch export failed:', err);
      showToast('Failed to export PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      setProgressText(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container batch-export-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary), #a855f7)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileDown size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                {title}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select songs to compile into a branded PDF with header & footer
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--bg-surface-elevated, var(--bg-surface))',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Subtitle config */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              PDF Header Subtitle:
            </span>
            <input
              type="text"
              className="form-input"
              value={customSubtitle}
              onChange={(e) => setCustomSubtitle(e.target.value)}
              placeholder="e.g. Sunday Worship Service"
              style={{ fontSize: '0.82rem', padding: '4px 10px', height: 'auto' }}
            />
          </div>

          {/* Search & Filter Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {['ALL', 'Tamil', 'Hindi', 'English'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  {cat === 'Tamil' ? '🇮🇳 Tamil' : cat === 'Hindi' ? '🇮🇳 Hindi' : cat === 'English' ? '🌐 Eng' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Select / Deselect All Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong>{selectedIds.length}</strong> of {songs.length} songs selected
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleSelectAll}
                style={{ fontSize: '0.78rem', padding: '2px 8px' }}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDeselectAll}
                style={{ fontSize: '0.78rem', padding: '2px 8px' }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div
          className="modal-body"
          style={{
            padding: '12px 20px',
            maxHeight: '320px',
            overflowY: 'auto'
          }}
        >
          {filteredSongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Music size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No matching songs found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredSongs.map((song) => {
                const isSelected = selectedIds.includes(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => handleToggleSong(song.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--text-muted)'}`,
                          background: isSelected ? 'var(--color-primary)' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {isSelected && <Check size={14} />}
                      </div>

                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {song.artist || 'Unknown Artist'} • {song.category || 'General'}
                          {song.style?.name && ` • ${formatMainStyleHighlight(song.style)}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyBadge songKey={song.originalKey || 'C'} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            PDF includes <strong>© Jeshurun Selvakumar</strong> & Page Nos.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={isExporting || selectedIds.length === 0}
              style={{ minWidth: '160px' }}
            >
              {isExporting ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  <span>{progressText || 'Exporting...'}</span>
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  <span>Export PDF ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
