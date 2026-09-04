import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers
} from 'lucide-react';
import SongRowEditor from './SongRowEditor';
import { COMMON_SECTION_NAMES } from '../../utils/musicConstants.js';

export default function SongSectionEditor({
  section,
  index,
  totalSections,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleNameChange = (newName) => {
    onChange({
      ...section,
      name: newName
    });
  };

  const handleAddRow = (type = 'chords') => {
    const newRow = {
      id: 'row_' + Date.now() + Math.random().toString(36).substring(2, 6),
      type,
      content: ''
    };
    onChange({
      ...section,
      rows: [...(section.rows || []), newRow]
    });
  };

  const handleRowChange = (rowIndex, updatedRow) => {
    const newRows = [...(section.rows || [])];
    newRows[rowIndex] = updatedRow;
    onChange({
      ...section,
      rows: newRows
    });
  };

  const handleDeleteRow = (rowIndex) => {
    const newRows = (section.rows || []).filter((_, i) => i !== rowIndex);
    onChange({
      ...section,
      rows: newRows
    });
  };

  const handleMoveRow = (rowIndex, direction) => {
    const rows = [...(section.rows || [])];
    const targetIndex = rowIndex + direction;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const temp = rows[rowIndex];
    rows[rowIndex] = rows[targetIndex];
    rows[targetIndex] = temp;

    onChange({
      ...section,
      rows
    });
  };

  return (
    <div className="editor-section-card">
      <div className="editor-section-header">
        <div className="editor-section-title-group">
          <Layers size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input
            type="text"
            className="form-input editor-section-name-input"
            value={section.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Verse 1, Chorus"
            aria-label="Section title"
          />

          <button
            type="button"
            className="btn btn-secondary btn-sm editor-preset-btn"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            Presets
          </button>
        </div>

        <div className="editor-section-controls">
          <button
            type="button"
            className="btn-ghost editor-icon-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move section up"
            aria-label="Move section up"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            className="btn-ghost editor-icon-btn"
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            title="Move section down"
            aria-label="Move section down"
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            className="btn-ghost text-danger editor-icon-btn"
            onClick={onDelete}
            title="Delete section"
            aria-label="Delete section"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="editor-preset-pill-box">
          {COMMON_SECTION_NAMES.map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn btn-secondary btn-sm editor-preset-pill"
              onClick={() => {
                handleNameChange(preset);
                setShowSuggestions(false);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Rows Container */}
      <div className="editor-rows-wrapper">
        {(section.rows || []).length === 0 ? (
          <div className="editor-empty-rows">
            <p style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>No rows in this section yet.</p>
            <div className="editor-quick-row-types">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleAddRow('chords')}
              >
                + Chords Row
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddRow('lyrics')}
              >
                + Lyrics Row
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddRow('lead')}
              >
                + Lead Row
              </button>
            </div>
          </div>
        ) : (
          (section.rows || []).map((row, rIndex) => (
            <SongRowEditor
              key={row.id || rIndex}
              row={row}
              index={rIndex}
              totalRows={(section.rows || []).length}
              onChange={(updated) => handleRowChange(rIndex, updated)}
              onDelete={() => handleDeleteRow(rIndex)}
              onMoveUp={() => handleMoveRow(rIndex, -1)}
              onMoveDown={() => handleMoveRow(rIndex, 1)}
            />
          ))
        )}
      </div>

      {(section.rows || []).length > 0 && (
        <div className="editor-add-row-toolbar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAddRow('chords')}
          >
            <Plus size={14} /> Chords
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAddRow('lyrics')}
          >
            <Plus size={14} /> Lyrics
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAddRow('lead')}
          >
            <Plus size={14} /> Lead Notes
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAddRow('bass')}
          >
            <Plus size={14} /> Bass Notes
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleAddRow('notes')}
          >
            <Plus size={14} /> Note
          </button>
        </div>
      )}
    </div>
  );
}
