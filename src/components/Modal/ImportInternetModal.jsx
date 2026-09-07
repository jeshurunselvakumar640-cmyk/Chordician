import React, { useState } from 'react';
import {
  Search,
  Globe,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardPaste,
  FileText,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { searchAndImportFromInternet } from '../../services/internetSongImporter.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ImportInternetModal({
  isOpen,
  onClose,
  onPassToSmartPaster
}) {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(1);
  const [searchStatusMsg, setSearchStatusMsg] = useState('Searching allowlisted sources in order...');
  const [searchResult, setSearchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (queryParam = null) => {
    const q = (typeof queryParam === 'string' ? queryParam : searchQuery).trim();
    if (!q) {
      showToast('Please enter a song title to search.', 'warning');
      return;
    }

    setIsSearching(true);
    setSearchStep(1);
    setSearchStatusMsg('Checking source 1: chordsver.com...');
    setSearchResult(null);
    setErrorMessage(null);

    // Multi-stage progressive status feedback
    const t1 = setTimeout(() => {
      setSearchStep(2);
      setSearchStatusMsg('Checking sources: thegodsmusic.com & tamilchristiansongs.in...');
    }, 1200);

    const t2 = setTimeout(() => {
      setSearchStep(3);
      setSearchStatusMsg('Checking churchspot.com & songsofpraise.in...');
    }, 2800);

    const t3 = setTimeout(() => {
      setSearchStep(4);
      setSearchStatusMsg('Filtering Romanized lyrics & sanitizing chord blocks...');
    }, 4500);

    try {
      const res = await searchAndImportFromInternet(q);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsSearching(false);

      if (res.success && res.rawContent) {
        setSearchResult(res);
        showToast(`✓ Found song on ${res.sourceName || 'internet source'}!`, 'success');
      } else {
        setErrorMessage(res.error || 'Song not found in selected sources.');
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsSearching(false);
      setErrorMessage(err.message || 'An error occurred during internet search.');
    }
  };

  const handleConfirmPassToSmartPaster = () => {
    if (!searchResult?.rawContent) return;

    if (typeof onPassToSmartPaster === 'function') {
      onPassToSmartPaster({
        rawContent: searchResult.rawContent,
        title: searchResult.title || searchQuery,
        artist: searchResult.artist || '',
        key: searchResult.key || 'C',
        sourceUrl: searchResult.sourceUrl || '',
        sourceName: searchResult.sourceName || 'Internet Import'
      });
      showToast('Chords passed directly to Smart Paster!', 'success');
    }
    onClose();
  };

  const handleReset = () => {
    setSearchResult(null);
    setErrorMessage(null);
    setSearchQuery('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-container import-internet-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Globe size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                Import from Internet
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Search 6 prioritized chord sources with automatic Romanized filtering
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

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Search Input Box */}
          <div className="import-internet-search-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
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
                className="form-input font-sans"
                placeholder="Enter song title (e.g. Uyar Malaiyo, Pavitra Aatma Aa)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                disabled={isSearching}
                style={{ paddingLeft: '38px', height: '44px', fontSize: '0.94rem' }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
              style={{ minWidth: '150px', height: '44px', justifyContent: 'center' }}
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Search & Import</span>
                </>
              )}
            </button>
          </div>

          {/* Ordered Sources Ribbon */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Priority Sources:</span>
            <span className="source-pill">1. chordsver</span>
            <span>→</span>
            <span className="source-pill">2. thegodsmusic</span>
            <span>→</span>
            <span className="source-pill">3. tamilchristiansongs</span>
            <span>→</span>
            <span className="source-pill">4. churchspot</span>
            <span>→</span>
            <span className="source-pill">5. songsofpraise</span>
            <span>→</span>
            <span className="source-pill">6. yeshukegeet</span>
          </div>

          {/* Live Progress / Loading Indicator */}
          {isSearching && (
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  {searchStatusMsg}
                </strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '30px' }}>
                Searching allowlisted sources with fuzzy title matching and Romanized script filtering...
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && !isSearching && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ef4444',
                fontSize: '0.88rem'
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Song not found in selected sources</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {errorMessage}. You can search using alternate spelling or paste the chords directly into Smart Paster.
                </p>
              </div>
            </div>
          )}

          {/* Quick Preview Box of Found Chords & Lyrics */}
          {searchResult && (
            <div className="import-internet-preview-card" style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                    {searchResult.title || searchQuery}
                  </strong>
                  {searchResult.key && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '0.78rem'
                      }}
                    >
                      Key: {searchResult.key}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 600
                    }}
                  >
                    Source: {searchResult.sourceName}
                  </span>
                </div>
              </div>

              {/* Formatted Chord Preview Box */}
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-app)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  color: 'var(--chord-text, #818cf8)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {searchResult.rawContent}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                ✨ Romanized text and chords extracted cleanly. Clicking below will pass this directly into Chordex Smart Paster.
              </p>
            </div>
          )}

          {/* Sample quick search pills */}
          {!searchResult && !isSearching && (
            <div style={{ marginTop: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                Sample titles to try:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['Uyar Malaiyo', 'Pavitra Aatma Aa', 'Maravaamal Ninaiththeeraiyaa', 'Mere Jeevan Mai', 'Bless The Lord 10,000 Reasons'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSearchQuery(sample);
                      handleSearch(sample);
                    }}
                    style={{ fontSize: '0.78rem', padding: '3px 8px', border: '1px dashed var(--border-subtle)' }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          {searchResult ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmPassToSmartPaster}
              style={{ minWidth: '180px', gap: '8px' }}
            >
              <ClipboardPaste size={16} />
              <span>Pass to Smart Paster</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search size={14} />
              <span>Search Internet Sources</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
