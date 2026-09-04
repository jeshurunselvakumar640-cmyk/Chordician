import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Plus,
  ArrowLeft,
  Music2,
  AlertCircle,
  Sliders,
  ChevronDown,
  X,
  Sparkles
} from 'lucide-react';
import { ALL_KEYS, SONG_CATEGORIES, PRIMARY_LANGUAGES } from '../../utils/musicConstants.js';
import { formatStyleCode } from '../../data/songStyles.js';
import SongSectionEditor from './SongSectionEditor';
import StyleSelectorModal from './StyleSelectorModal';

export default function SongEditor({
  initialSong = null,
  onSave,
  isSubmitting = false,
  isEdit = false
}) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialSong?.title || '');
  const [artist, setArtist] = useState(initialSong?.artist || '');
  const [originalKey, setOriginalKey] = useState(initialSong?.originalKey || 'C');
  const [category, setCategory] = useState(initialSong?.category || 'Worship');
  const [style, setStyle] = useState(initialSong?.style || null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [tempo, setTempo] = useState(initialSong?.tempo || '');
  const [timeSignature, setTimeSignature] = useState(initialSong?.timeSignature || '4/4');
  const [notes, setNotes] = useState(initialSong?.notes || '');
  const [sections, setSections] = useState(
    initialSong?.sections?.length
      ? initialSong.sections
      : [
          {
            id: 'sec_1',
            name: 'Verse 1',
            rows: [
              { id: 'r1', type: 'chords', content: 'C   F   C   G' },
              { id: 'r2', type: 'lyrics', content: '' }
            ]
          }
        ]
  );

  const [validationError, setValidationError] = useState('');

  const handleAddSection = () => {
    const sectionNumber = sections.length + 1;
    const newSection = {
      id: 'sec_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: `Section ${sectionNumber}`,
      rows: [
        {
          id: 'r_' + Date.now() + '_1',
          type: 'chords',
          content: ''
        },
        {
          id: 'r_' + Date.now() + '_2',
          type: 'lyrics',
          content: ''
        }
      ]
    };
    setSections([...sections, newSection]);
  };

  const handleSectionChange = (index, updatedSection) => {
    const updated = [...sections];
    updated[index] = updatedSection;
    setSections(updated);
  };

  const handleDeleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index, direction) => {
    const updated = [...sections];
    const target = index + direction;
    if (target < 0 || target >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setSections(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Song title is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationError('');

    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      originalKey,
      category,
      style: style ? {
        category: style.category,
        name: style.name,
        churchStyleNumber: style.churchStyleNumber || '',
        keyboardStyleNumber: style.keyboardStyleNumber || null
      } : null,
      tempo: tempo ? parseInt(tempo, 10) : null,
      timeSignature,
      notes: notes.trim(),
      sections: sections.map((sec, idx) => ({
        id: sec.id || `sec_${idx}`,
        name: sec.name || `Section ${idx + 1}`,
        rows: (sec.rows || []).map((row, rIdx) => ({
          id: row.id || `row_${idx}_${rIdx}`,
          type: row.type || 'chords',
          content: row.content || ''
        }))
      }))
    };

    onSave(songData);
  };

  return (
    <form onSubmit={handleSubmit} className="song-editor-form">
      {/* Top action header */}
      <div className="editor-top-bar">
        <div className="editor-top-title-group">
          <button
            type="button"
            className="btn btn-secondary btn-icon-sm"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="editor-main-title">
            {isEdit ? 'Edit Song' : 'Create New Song'}
          </h1>
        </div>

        <div className="editor-top-actions">
          <button
            type="button"
            className="btn btn-secondary hide-extra-small"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary editor-save-btn"
            disabled={isSubmitting}
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Saving...' : 'Save Song'}</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="editor-validation-banner">
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Song Metadata Card */}
      <div className="card editor-meta-card">
        <h2 className="editor-meta-title">
          <Music2 size={20} style={{ color: 'var(--color-primary)' }} />
          Song Information
        </h2>

        <div className="editor-meta-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="song-title">
              Song Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="song-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Amazing Grace"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="song-artist">
              Artist / Composer
            </label>
            <input
              id="song-artist"
              type="text"
              className="form-input"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. John Newton"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="song-key">
              Original Key <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="song-key"
              className="form-select font-mono-input"
              value={originalKey}
              onChange={(e) => setOriginalKey(e.target.value)}
            >
              {ALL_KEYS.map((k) => (
                <option key={k} value={k}>
                  Key of {k}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="form-label-row-with-pills">
              <label className="form-label" htmlFor="song-category" style={{ marginBottom: 0 }}>
                Language / Category
              </label>
              <div className="quick-language-pills">
                {PRIMARY_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`btn-language-pill ${category === lang ? 'active' : ''}`}
                    onClick={() => setCategory(lang)}
                  >
                    {lang === 'Tamil' ? '🇮🇳 Tamil' : lang === 'Hindi' ? '🇮🇳 Hindi' : '🌐 English'}
                  </button>
                ))}
              </div>
            </div>
            <select
              id="song-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <optgroup label="Languages">
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="English">English</option>
              </optgroup>
              <optgroup label="Genres & Other Categories">
                {SONG_CATEGORIES.filter(c => !PRIMARY_LANGUAGES.includes(c)).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Musical Style Selector (Keyboard / Church Style) */}
        <div className="editor-style-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="song-style-trigger">
              Musical Style (Keyboard & Rhythm)
            </label>
            {style ? (
              <div className="style-selected-banner">
                <div
                  className="style-selected-left"
                  onClick={() => setIsStyleModalOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="style-selected-icon-badge">
                    <Sparkles size={18} />
                  </div>
                  <div className="style-selected-text-col">
                    <div className="style-selected-title-row">
                      <span className="style-selected-badge">{style.category}</span>
                      <strong className="style-selected-name">{style.name}</strong>
                    </div>
                    <span className="style-selected-code">
                      {formatStyleCode(style)}
                    </span>
                  </div>
                </div>

                <div className="style-selected-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsStyleModalOpen(true)}
                    title="Change style"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon-sm text-danger"
                    onClick={() => setStyle(null)}
                    title="Remove style"
                    aria-label="Remove style"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="song-style-trigger"
                type="button"
                className="style-selector-trigger-btn"
                onClick={() => setIsStyleModalOpen(true)}
              >
                <div className="style-trigger-content">
                  <Sliders size={18} className="style-trigger-icon" />
                  <span>Select Musical Style (e.g. Indian → Dandiya, 8Beat, Ballad...)</span>
                </div>
                <ChevronDown size={18} className="style-trigger-arrow" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Extra Fields */}
        <div className="editor-extra-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="song-tempo">
              Tempo (BPM)
            </label>
            <input
              id="song-tempo"
              type="number"
              min="30"
              max="300"
              className="form-input"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="e.g. 72"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="song-time-sig">
              Time Signature
            </label>
            <select
              id="song-time-sig"
              className="form-select font-mono-input"
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="6/8">6/8</option>
              <option value="2/4">2/4</option>
              <option value="12/8">12/8</option>
              <option value="5/4">5/4</option>
            </select>
          </div>

          <div className="form-group editor-notes-field">
            <label className="form-label" htmlFor="song-notes">
              Master Performance Notes
            </label>
            <input
              id="song-notes"
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Capo 2, expressive piano intro"
            />
          </div>
        </div>
      </div>

      {/* Sections Manager */}
      <div className="editor-sections-wrapper">
        <div className="editor-sections-header">
          <h2 className="editor-sections-title">Song Sections</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddSection}
          >
            <Plus size={16} />
            <span>Add Section</span>
          </button>
        </div>

        {sections.map((section, sIndex) => (
          <SongSectionEditor
            key={section.id || sIndex}
            section={section}
            index={sIndex}
            totalSections={sections.length}
            onChange={(updated) => handleSectionChange(sIndex, updated)}
            onDelete={() => handleDeleteSection(sIndex)}
            onMoveUp={() => handleMoveSection(sIndex, -1)}
            onMoveDown={() => handleMoveSection(sIndex, 1)}
          />
        ))}

        <button
          type="button"
          className="btn btn-secondary add-section-block-btn"
          onClick={handleAddSection}
        >
          <Plus size={18} />
          Add Another Section (Chorus, Bridge, Outro...)
        </button>
      </div>

      {/* Bottom Save Bar (Sticky on Mobile) */}
      <div className="editor-bottom-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-lg editor-save-main-btn"
          disabled={isSubmitting}
        >
          <Save size={18} />
          <span>{isSubmitting ? 'Saving to Firestore...' : 'Save Song'}</span>
        </button>
      </div>

      {/* Style Selector Modal */}
      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        selectedStyle={style}
        onSelectStyle={(newStyle) => setStyle(newStyle)}
      />
    </form>
  );
}
