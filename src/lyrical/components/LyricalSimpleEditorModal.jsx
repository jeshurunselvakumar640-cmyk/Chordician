import React, { useState, useEffect } from 'react';
import { Edit3, X, Check, Wine, AlertCircle, ArrowLeft, Plus, Trash2, Music, Link2, Unlink } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { useAuth } from '../../context/AuthContext';
import { getLyricalTranslation } from '../i18n/translations';
import { generateSongTransliterations } from '../transliteration/index.js';
import { sanitizeSecondaryTitles } from '../services/lyricalSearch.js';
import LyricalChordicianLinkModal from './LyricalChordicianLinkModal';

export default function LyricalSimpleEditorModal({
  isOpen,
  onClose,
  initialData = null,
  onSaveSong,
  onBackToImport
}) {
  const { language } = useAppMode();
  const auth = useAuth();
  const isOwner = Boolean(auth?.isOwner);
  const t = getLyricalTranslation(language);

  const [title, setTitle] = useState('');
  const [secondaryTitles, setSecondaryTitles] = useState([]);
  const [artist, setArtist] = useState('');
  const [songLanguage, setSongLanguage] = useState('Tamil');
  const [lyrics, setLyrics] = useState('');
  const [isCommunion, setIsCommunion] = useState(false);
  const [chordicianSongId, setChordicianSongId] = useState(null);
  const [chordicianSongTitle, setChordicianSongTitle] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSecondaryTitles(Array.isArray(initialData.secondaryTitles) ? [...initialData.secondaryTitles] : []);
      setArtist(initialData.artist || '');
      setSongLanguage(initialData.originalLanguage || initialData.language || 'Tamil');
      setLyrics(initialData.originalLyrics || initialData.lyrics || '');
      setIsCommunion(Boolean(initialData.isCommunion));
      setChordicianSongId(initialData.chordicianSongId || null);
      setChordicianSongTitle(initialData.chordicianSongTitle || '');
      setErrorMessage('');
    } else {
      setTitle('');
      setSecondaryTitles([]);
      setArtist('');
      setSongLanguage('Tamil');
      setLyrics('');
      setIsCommunion(false);
      setChordicianSongId(null);
      setChordicianSongTitle('');
      setErrorMessage('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddSecondaryTitle = () => {
    setSecondaryTitles((prev) => [...prev, '']);
  };

  const handleSecondaryTitleChange = (index, val) => {
    setSecondaryTitles((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveSecondaryTitle = (index) => {
    setSecondaryTitles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a song title.');
      return;
    }
    if (!lyrics.trim()) {
      setErrorMessage('Please enter or review song lyrics.');
      return;
    }

    setIsSaving(true);
    const cleanLyrics = lyrics.trim();
    const cleanSecondaryTitles = sanitizeSecondaryTitles(secondaryTitles, title.trim());
    const transliterations = generateSongTransliterations(cleanLyrics, songLanguage);

    const newSong = {
      id: initialData?.id || `lyr-${Date.now()}`,
      title: title.trim(),
      secondaryTitles: cleanSecondaryTitles,
      artist: artist.trim() || 'Unknown Artist',
      singer: artist.trim() || 'Unknown Artist',
      language: songLanguage,
      originalLanguage: transliterations.originalLanguage || songLanguage,
      originalLyrics: cleanLyrics,
      lyrics: cleanLyrics,
      tamilLyrics: initialData?.tamilLyrics || transliterations.tamilLyrics,
      englishLyrics: initialData?.englishLyrics || transliterations.englishLyrics,
      hindiLyrics: initialData?.hindiLyrics || transliterations.hindiLyrics,
      isCommunion: Boolean(isCommunion),
      category: isCommunion ? 'Communion' : 'Worship',
      chordicianSongId: isOwner ? chordicianSongId : (initialData?.chordicianSongId || null),
      chordicianSongTitle: isOwner ? chordicianSongTitle : (initialData?.chordicianSongTitle || ''),
      sourceUrl: initialData?.sourceUrl || '',
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    if (onSaveSong) {
      onSaveSong(newSong);
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content lyrical-editor-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '94%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToImport && (
              <button
                type="button"
                className="btn btn-ghost btn-icon-sm"
                onClick={onBackToImport}
                aria-label={t.backBtn}
                title={t.backBtn}
                style={{ marginRight: '2px' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="lyrical-modal-icon-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t.editorTitle}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {t.editorSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label={t.closeBtn}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '68vh', overflowY: 'auto' }}>
          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="lyrical-import-error-banner" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem' }}>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Song Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="editor-title-input">
                <span>{t.titleLabel} *</span>
              </label>
              <input
                id="editor-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={t.titlePlaceholder}
                className="form-input"
                required
              />
            </div>

            {/* Artist / Singer */}
            <div className="form-group">
              <label className="form-label" htmlFor="editor-artist-input">
                <span>{t.singerLabel}</span>
              </label>
              <input
                id="editor-artist-input"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder={t.artistPlaceholder}
                className="form-input"
              />
            </div>
          </div>

          {/* Secondary / Alternate Titles Section */}
          <div className="lyrical-secondary-titles-section">
            <div className="lyrical-secondary-titles-header">
              <label className="form-label" style={{ marginBottom: 0 }}>
                <span>{t.secondaryTitlesLabel}</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm lyrical-add-secondary-title-btn"
                onClick={handleAddSecondaryTitle}
              >
                <Plus size={14} />
                <span>{t.addSecondaryTitleBtn}</span>
              </button>
            </div>

            {secondaryTitles.length > 0 && (
              <div className="lyrical-secondary-titles-list">
                {secondaryTitles.map((st, idx) => (
                  <div key={idx} className="lyrical-secondary-title-row">
                    <input
                      type="text"
                      value={st}
                      onChange={(e) => handleSecondaryTitleChange(idx, e.target.value)}
                      placeholder={t.secondaryTitlePlaceholder}
                      className="form-input lyrical-secondary-title-input"
                      aria-label={`${t.secondaryTitlesLabel} ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon-sm lyrical-remove-secondary-title-btn"
                      onClick={() => handleRemoveSecondaryTitle(idx)}
                      aria-label={t.removeSecondaryTitle}
                      title={t.removeSecondaryTitle}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Language & Communion Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            {/* Language Selector */}
            <div className="form-group" style={{ maxWidth: '200px', flex: 1 }}>
              <label className="form-label" htmlFor="editor-language-select">
                <span>{t.languageLabel}</span>
              </label>
              <select
                id="editor-language-select"
                value={songLanguage}
                onChange={(e) => setSongLanguage(e.target.value)}
                className="form-select"
              >
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Telugu">Telugu</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Kannada">Kannada</option>
              </select>
            </div>

            {/* Communion Song Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isCommunion ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)',
                border: `1px solid ${isCommunion ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                marginTop: '22px'
              }}
            >
              <input
                type="checkbox"
                checked={isCommunion}
                onChange={(e) => setIsCommunion(e.target.checked)}
                style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <Wine size={16} style={{ color: isCommunion ? '#ef4444' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isCommunion ? '#ef4444' : 'var(--text-main)' }}>
                {t.communionCheckboxLabel}
              </span>
            </label>
          </div>

          {/* Chordician Piano Notes Link Section */}
          <div className="lyrical-secondary-titles-section" style={{ borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t.chordicianLinkSection || 'Chordician Piano Notes'}
                </span>
              </div>

              {chordicianSongId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsLinkModalOpen(true)}
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    <Link2 size={13} />
                    <span>{t.changeChordicianLinkBtn || 'Change Link'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setChordicianSongId(null);
                      setChordicianSongTitle('');
                    }}
                    style={{ fontSize: '0.8rem', padding: '4px 10px', color: '#ef4444' }}
                  >
                    <Unlink size={13} />
                    <span>{t.unlinkChordicianBtn || 'Unlink'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsLinkModalOpen(true)}
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  <Link2 size={13} />
                  <span>{t.linkChordicianBtn || 'Link with Chordician'}</span>
                </button>
              )}
            </div>

            {chordicianSongId && (
              <div style={{ marginTop: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-success)' }} />
                <span>
                  {t.chordicianLinked || 'Linked with Chordician'}: <strong>{chordicianSongTitle || chordicianSongId}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Clean Lyrics Text Area */}
          <div className="form-group">
            <label className="form-label" htmlFor="editor-lyrics-textarea">
              <span>{t.lyricsLabel} *</span>
            </label>
            <textarea
              id="editor-lyrics-textarea"
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t.lyricsPlaceholder}
              className="form-textarea"
              rows={12}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.94rem',
                lineHeight: 1.6,
                resize: 'vertical'
              }}
              required
            />
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check size={16} />
            <span>{t.saveSongBtn}</span>
          </button>
        </div>
      </div>

      {/* Owner Chordician Song Link Selector Modal */}
      <LyricalChordicianLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        currentLinkedId={chordicianSongId}
        onSelectSong={(cSong) => {
          if (cSong) {
            setChordicianSongId(cSong.id);
            setChordicianSongTitle(cSong.title || '');
          }
        }}
      />
    </div>
  );
}

