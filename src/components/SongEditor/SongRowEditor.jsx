import React, { useState } from 'react';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { ROW_TYPES } from '../../utils/musicConstants.js';
import ChordHelper from './ChordHelper';

export default function SongRowEditor({
  row,
  index,
  totalRows,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const [showHelper, setShowHelper] = useState(false);

  const handleTypeChange = (e) => {
    onChange({
      ...row,
      type: e.target.value
    });
  };

  const handleContentChange = (e) => {
    onChange({
      ...row,
      content: e.target.value
    });
  };

  const handleInsertSnippet = (snippet) => {
    const current = row.content || '';
    onChange({
      ...row,
      content: current + snippet
    });
  };

  const getPlaceholder = () => {
    switch (row.type) {
      case 'chords':
        return 'e.g. C   F   G   Am7   C/E';
      case 'lyrics':
        return 'Enter song lyrics for this line...';
      case 'lead':
        return 'e.g. E4 G4 C5 G4 E4 (Piano melody)';
      case 'bass':
        return 'e.g. C3 G3 C4 (Bass / Left hand notes)';
      case 'notes':
        return 'e.g. Arpeggiate gently, sustain pedal';
      case 'custom':
      default:
        return 'Custom text or notation...';
    }
  };

  const isMono = row.type === 'chords' || row.type === 'lead' || row.type === 'bass' || row.type === 'custom';
  const canUseHelper = row.type === 'chords' || row.type === 'lead' || row.type === 'bass';

  return (
    <div className="editor-row-item">
      <div className="editor-row-header">
        <div className="editor-row-type-group">
          <select
            className="form-select editor-row-type-select"
            value={row.type}
            onChange={handleTypeChange}
            aria-label="Row content type"
          >
            {ROW_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {canUseHelper && (
            <button
              type="button"
              className={`btn btn-sm editor-helper-toggle-btn ${showHelper ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowHelper(!showHelper)}
              title="Toggle quick musical pickers"
            >
              <Sparkles size={13} />
              <span className="hide-extra-small">Quick Chips</span>
            </button>
          )}
        </div>

        <div className="editor-row-actions">
          <button
            type="button"
            className="btn-ghost editor-icon-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move row up"
            aria-label="Move row up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            className="btn-ghost editor-icon-btn"
            onClick={onMoveDown}
            disabled={index === totalRows - 1}
            title="Move row down"
            aria-label="Move row down"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            className="btn-ghost text-danger editor-icon-btn"
            onClick={onDelete}
            title="Delete row"
            aria-label="Delete row"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <input
        type="text"
        className={`form-input editor-row-input ${isMono ? 'font-mono-input' : ''}`}
        value={row.content || ''}
        onChange={handleContentChange}
        placeholder={getPlaceholder()}
        aria-label={`${row.type} content`}
      />

      {showHelper && canUseHelper && (
        <ChordHelper rowType={row.type} onInsert={handleInsertSnippet} />
      )}
    </div>
  );
}
