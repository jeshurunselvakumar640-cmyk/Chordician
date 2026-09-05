import React, { useState } from 'react';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Plus,
  X
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
  onMoveDown,
  onInsertBelow,
  onInsertAbove
}) {
  const [showHelper, setShowHelper] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);

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
          {/* Plus icon to insert new row directly below */}
          <button
            type="button"
            className={`btn-ghost editor-icon-btn ${showInsertMenu ? 'btn-primary' : ''}`}
            onClick={() => setShowInsertMenu(!showInsertMenu)}
            title="Insert row below (Chords, Lyrics, Lead notes...)"
            aria-label="Insert row below"
            style={{
              color: showInsertMenu ? '#ffffff' : 'var(--color-primary)',
              background: showInsertMenu ? 'var(--color-primary)' : 'rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px'
            }}
          >
            <Plus size={16} />
          </button>

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

      {/* Insert Row In-Between Panel */}
      {showInsertMenu && (
        <div
          className="editor-insert-between-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '8px',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1.5px dashed var(--color-primary)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Insert below:
            </span>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                onInsertBelow?.('chords');
                setShowInsertMenu(false);
              }}
              style={{ fontSize: '0.78rem', padding: '3px 8px', fontWeight: '600' }}
            >
              + Chords
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                onInsertBelow?.('lyrics');
                setShowInsertMenu(false);
              }}
              style={{ fontSize: '0.78rem', padding: '3px 8px', fontWeight: '600' }}
            >
              + Lyrics
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                onInsertBelow?.('lead');
                setShowInsertMenu(false);
              }}
              style={{ fontSize: '0.78rem', padding: '3px 8px', color: '#b45309', fontWeight: '600' }}
            >
              + Lead
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                onInsertBelow?.('bass');
                setShowInsertMenu(false);
              }}
              style={{ fontSize: '0.78rem', padding: '3px 8px', color: '#0369a1', fontWeight: '600' }}
            >
              + Bass
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                onInsertBelow?.('notes');
                setShowInsertMenu(false);
              }}
              style={{ fontSize: '0.78rem', padding: '3px 8px', fontWeight: '600' }}
            >
              + Note
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowInsertMenu(false)}
            style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--text-muted)' }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
