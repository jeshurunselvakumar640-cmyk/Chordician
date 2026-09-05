import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  FileText,
  Download,
  FileDown,
  Info,
  Sliders,
  Printer,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  formatSongDetailsText,
  formatFullNotesText,
  copyTextToClipboard,
  shareViaWebAPI,
  downloadTextFile,
  exportSongsToPDF
} from '../../services/shareService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { transposeSong } from '../../services/transposer.js';
import { ALL_KEYS } from '../../utils/musicConstants.js';
import { getSongById } from '../../firebase/songs.js';

export default function ShareModal({
  isOpen,
  onClose,
  song,
  initialKey
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'full' | 'pdf'
  const [selectedKey, setSelectedKey] = useState(initialKey || song?.originalKey || 'C');
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(null);
  const [fullSong, setFullSong] = useState(song);
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!song) return;

    setSelectedKey(initialKey || song.originalKey || 'C');

    if (!song.sections || song.sections.length === 0) {
      setIsLoadingSong(true);
      getSongById(song.id).then((res) => {
        if (isMounted && res?.data) {
          setFullSong({ ...song, ...res.data });
        }
        if (isMounted) setIsLoadingSong(false);
      }).catch(() => {
        if (isMounted) setIsLoadingSong(false);
      });
    } else {
      setFullSong(song);
    }

    return () => {
      isMounted = false;
    };
  }, [song, initialKey]);

  useEffect(() => {
    setIsCopied(false);
  }, [activeTab, selectedKey]);

  // Transposed song instance if selectedKey differs
  const currentSong = useMemo(() => {
    const targetSong = fullSong || song;
    if (!targetSong) return null;
    if (selectedKey && selectedKey !== targetSong.originalKey) {
      return transposeSong(targetSong, selectedKey);
    }
    return targetSong;
  }, [fullSong, song, selectedKey]);

  const detailsText = useMemo(() => {
    const targetSong = fullSong || song;
    if (!targetSong) return '';
    return formatSongDetailsText(targetSong, selectedKey);
  }, [fullSong, song, selectedKey]);

  const fullNotesText = useMemo(() => {
    const targetSong = fullSong || song;
    if (!targetSong) return '';
    return formatFullNotesText(targetSong, selectedKey);
  }, [fullSong, song, selectedKey]);

  if (!isOpen || !song) return null;

  const handleCopy = async (text, label = 'Text') => {
    const success = await copyTextToClipboard(text);
    if (success) {
      setIsCopied(true);
      showToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } else {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleNativeShare = async (text, title) => {
    const result = await shareViaWebAPI(title || song.title, text);
    if (result.shared) {
      showToast('Shared successfully!', 'success');
    } else if (result.copied) {
      setIsCopied(true);
      showToast('Copied to clipboard (Share sheet unavailable)', 'info');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    const filename = `${song.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_${selectedKey}.txt`;
    downloadTextFile(filename, fullNotesText);
    showToast('Downloaded text file', 'success');
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setPdfProgress('Preparing PDF...');
    try {
      const songToExport = {
        ...currentSong,
        activeKey: selectedKey
      };
      await exportSongsToPDF(songToExport, {
        documentSubtitle: 'Chordician Piano Songbook',
        onProgress: (current, total) => {
          setPdfProgress(`Rendering page ${current} of ${total}...`);
        }
      });
      showToast(`Exported "${song.title}" PDF successfully!`, 'success');
      onClose();
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExportingPDF(false);
      setPdfProgress(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container share-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '100%' }}
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
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                Share "{song.title}"
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Choose format to copy, send, or export
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

        {/* Transpose Key Bar for Sharing */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--bg-surface-elevated, var(--bg-surface))',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Share in Key:</span>
            <strong style={{ color: 'var(--color-primary)' }}>{selectedKey}</strong>
            {selectedKey !== song.originalKey && (
              <span className="badge badge-meta" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                Transposed from {song.originalKey || 'C'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              className="form-select"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontWeight: '600'
              }}
            >
              {ALL_KEYS.map((k) => (
                <option key={k} value={k}>
                  Key of {k} {k === song.originalKey ? '(Original)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="share-modal-tabs">
          <button
            type="button"
            className={`share-modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <Info size={15} />
            <span>1. Song Details</span>
          </button>
          <button
            type="button"
            className={`share-modal-tab ${activeTab === 'full' ? 'active' : ''}`}
            onClick={() => setActiveTab('full')}
          >
            <FileText size={15} />
            <span>2. Full Chords & Lyrics</span>
          </button>
          <button
            type="button"
            className={`share-modal-tab ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            <FileDown size={15} />
            <span>3. Branded PDF</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* TAB 1: Song Details Only */}
          {activeTab === 'details' && (
            <div className="share-tab-content">
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Quick summary text format with title, style number, scale, and beat:
              </p>

              <div className="share-text-preview-box">
                <pre>{detailsText}</pre>
              </div>

              <div className="share-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopy(detailsText, 'Song details')}
                >
                  {isCopied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Details'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleNativeShare(detailsText, `${song.title} - Details`)}
                >
                  <Share2 size={16} />
                  <span>Share via Apps</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Full Notes (Lyrics & Chords) */}
          {activeTab === 'full' && (
            <div className="share-tab-content">
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Complete chord sheet text with chords positioned directly above lyrics:
              </p>

              <div className="share-text-preview-box" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <pre>{fullNotesText}</pre>
              </div>

              <div className="share-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDownloadTxt}
                  title="Download plain text file"
                >
                  <Download size={16} />
                  <span>Download .txt</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopy(fullNotesText, 'Full chords & lyrics')}
                >
                  {isCopied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Notes'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleNativeShare(fullNotesText, `${song.title} - Chords & Lyrics`)}
                >
                  <Share2 size={16} />
                  <span>Share via Apps</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Branded PDF Export */}
          {activeTab === 'pdf' && (
            <div className="share-tab-content">
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                  <strong style={{ fontSize: '0.95rem' }}>Chordician Printable Song Sheet</strong>
                </div>

                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li><strong>Header:</strong> Chordician branding header ("Your chords. Your key.")</li>
                  <li><strong>Scale / Key:</strong> Rendered in <strong>Key of {selectedKey}</strong></li>
                  <li><strong>Sections:</strong> Chords aligned over lyrics with support for Tamil Unicode</li>
                  <li><strong>Footer:</strong> <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>© Jeshurun Selvakumar</span> & Page numbers</li>
                </ul>
              </div>

              <div className="share-actions-row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isExportingPDF}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  style={{ minWidth: '160px' }}
                >
                  {isExportingPDF ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>{pdfProgress || 'Exporting...'}</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={16} />
                      <span>Export Song PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
