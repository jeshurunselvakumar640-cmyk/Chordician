import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Combine,
  Split
} from 'lucide-react';
import SongRowEditor from './SongRowEditor';
import { COMMON_SECTION_NAMES } from '../../utils/musicConstants.js';
import { splitLinkedLine, mergeLinkedLines } from '../../utils/linkedChordEditorHelper.js';

export default function SongSectionEditor({
  section,
  index,
  totalSections,
  selectedKey,
  smartLead = false,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMergeUp,
  onMergeDown,
  onInsertAbove,
  onInsertBelow,
  onSplitSection
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

  const handleInsertRow = (targetIndex, type = 'chords') => {
    const newRow = {
      id: 'row_' + Date.now() + Math.random().toString(36).substring(2, 6),
      type,
      content: ''
    };
    const newRows = [...(section.rows || [])];
    newRows.splice(targetIndex, 0, newRow);
    onChange({
      ...section,
      rows: newRows
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

  const handleRowKeyDown = (e, rIndex) => {
    const rows = section.rows || [];
    const currentRow = rows[rIndex];
    if (!currentRow) return;

    if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13) {
      e.preventDefault();

      if (currentRow.type === 'lyrics') {
        const inputEl = e.target;
        const cursorIndex = inputEl.selectionStart ?? (currentRow.content || '').length;

        // Identify associated chord row (immediately above) and lead row (immediately below)
        const chordRow = rIndex > 0 && rows[rIndex - 1].type === 'chords' ? rows[rIndex - 1] : null;
        const leadRow = rIndex + 1 < rows.length && rows[rIndex + 1].type === 'lead' ? rows[rIndex + 1] : null;

        const splitResult = splitLinkedLine(
          chordRow?.content || '',
          currentRow.content || '',
          cursorIndex,
          leadRow ? (leadRow.content || '') : null
        );

        const newChordId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_c';
        const newLyricId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_l';
        const newLeadId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_ld';

        const newRows = [];
        for (let r = 0; r < rows.length; r++) {
          if (chordRow && r === rIndex - 1) {
            newRows.push({ ...chordRow, content: splitResult.line1.chords });
          } else if (r === rIndex) {
            newRows.push({ ...currentRow, content: splitResult.line1.lyrics });
            if (!leadRow) {
              newRows.push({
                id: newChordId,
                type: 'chords',
                content: splitResult.line2.chords
              });
              newRows.push({
                id: newLyricId,
                type: 'lyrics',
                content: splitResult.line2.lyrics
              });
              newRows.push({
                id: newLeadId,
                type: 'lead',
                content: splitResult.line2.lead || ''
              });
            }
          } else if (leadRow && r === rIndex + 1) {
            newRows.push({ ...leadRow, content: splitResult.line1.lead || '' });
            newRows.push({
              id: newChordId,
              type: 'chords',
              content: splitResult.line2.chords
            });
            newRows.push({
              id: newLyricId,
              type: 'lyrics',
              content: splitResult.line2.lyrics
            });
            newRows.push({
              id: newLeadId,
              type: 'lead',
              content: splitResult.line2.lead || ''
            });
          } else {
            newRows.push(rows[r]);
          }
        }

        onChange({
          ...section,
          rows: newRows
        });

        setTimeout(() => {
          const nextInput = document.getElementById(`row-input-${newLyricId}`);
          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(0, 0);
          }
        }, 50);
      } else if (currentRow.type === 'chords') {
        // If lyrics row immediately below exists, advance focus to it
        if (rIndex + 1 < rows.length && rows[rIndex + 1].type === 'lyrics') {
          const nextInput = document.getElementById(`row-input-${rows[rIndex + 1].id}`);
          if (nextInput) {
            nextInput.focus();
            const len = nextInput.value?.length || 0;
            nextInput.setSelectionRange(len, len);
          }
        } else {
          // Insert a lyrics row and lead row below
          const newLyricId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_l';
          const newLeadId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_ld';
          const newRows = [...rows];
          newRows.splice(rIndex + 1, 0, { id: newLyricId, type: 'lyrics', content: '' }, { id: newLeadId, type: 'lead', content: '' });
          onChange({
            ...section,
            rows: newRows
          });
          setTimeout(() => {
            const nextInput = document.getElementById(`row-input-${newLyricId}`);
            if (nextInput) {
              nextInput.focus();
            }
          }, 50);
        }
      } else if (currentRow.type === 'lead') {
        // If next row is chords or lyrics, advance focus to it
        if (rIndex + 1 < rows.length && (rows[rIndex + 1].type === 'chords' || rows[rIndex + 1].type === 'lyrics')) {
          const nextInput = document.getElementById(`row-input-${rows[rIndex + 1].id}`);
          if (nextInput) {
            nextInput.focus();
          }
        } else {
          // If at the end of section, add a new standard chord-lyric-lead triplet
          const newChordId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_c';
          const newLyricId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_l';
          const newLeadId = 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_ld';
          const newRows = [...rows];
          newRows.push({ id: newChordId, type: 'chords', content: '' });
          newRows.push({ id: newLyricId, type: 'lyrics', content: '' });
          newRows.push({ id: newLeadId, type: 'lead', content: '' });
          onChange({
            ...section,
            rows: newRows
          });
          setTimeout(() => {
            const nextInput = document.getElementById(`row-input-${newChordId}`);
            if (nextInput) {
              nextInput.focus();
            }
          }, 50);
        }
      }
    } else if (e.key === 'Backspace' || e.keyCode === 8 || e.which === 8) {
      if (currentRow.type === 'lyrics') {
        const inputEl = e.target;
        if (inputEl.selectionStart === 0 && inputEl.selectionEnd === 0) {
          // Find the previous lyric row in this section
          let prevLyricIndex = -1;
          for (let i = rIndex - 1; i >= 0; i--) {
            if (rows[i].type === 'lyrics') {
              prevLyricIndex = i;
              break;
            }
          }

          if (prevLyricIndex >= 0) {
            e.preventDefault();

            const prevLyricRow = rows[prevLyricIndex];
            const prevChordRow = prevLyricIndex > 0 && rows[prevLyricIndex - 1].type === 'chords' ? rows[prevLyricIndex - 1] : null;
            const prevLeadRow = prevLyricIndex + 1 < rows.length && rows[prevLyricIndex + 1].type === 'lead' ? rows[prevLyricIndex + 1] : null;

            const currChordRow = rIndex > 0 && rows[rIndex - 1].type === 'chords' ? rows[rIndex - 1] : null;
            const currLyricRow = currentRow;
            const currLeadRow = rIndex + 1 < rows.length && rows[rIndex + 1].type === 'lead' ? rows[rIndex + 1] : null;

            const mergeRes = mergeLinkedLines(
              {
                chords: prevChordRow?.content || '',
                lyrics: prevLyricRow?.content || '',
                lead: prevLeadRow ? (prevLeadRow.content || '') : null
              },
              {
                chords: currChordRow?.content || '',
                lyrics: currLyricRow?.content || '',
                lead: currLeadRow ? (currLeadRow.content || '') : null
              }
            );

            const newRows = [];
            for (let r = 0; r < rows.length; r++) {
              if (prevChordRow && r === prevLyricIndex - 1) {
                newRows.push({ ...prevChordRow, content: mergeRes.chords });
              } else if (r === prevLyricIndex) {
                // If previous had no chords, but current had chords, add a chords row above previous lyric
                if (!prevChordRow && currChordRow && mergeRes.chords.trim()) {
                  newRows.push({
                    id: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_c',
                    type: 'chords',
                    content: mergeRes.chords
                  });
                }
                newRows.push({ ...prevLyricRow, content: mergeRes.lyrics });
                // If previous had no lead, but current had lead, add a lead row below previous lyric
                if (!prevLeadRow && currLeadRow && mergeRes.lead && mergeRes.lead.trim()) {
                  newRows.push({
                    id: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_ld',
                    type: 'lead',
                    content: mergeRes.lead
                  });
                }
              } else if (prevLeadRow && r === prevLyricIndex + 1) {
                newRows.push({ ...prevLeadRow, content: mergeRes.lead || '' });
              } else if (
                (currChordRow && r === rIndex - 1) ||
                r === rIndex ||
                (currLeadRow && r === rIndex + 1)
              ) {
                // Skip current row(s) because they merged into previous
                continue;
              } else {
                newRows.push(rows[r]);
              }
            }

            onChange({
              ...section,
              rows: newRows
            });

            setTimeout(() => {
              const prevInput = document.getElementById(`row-input-${prevLyricRow.id}`);
              if (prevInput) {
                prevInput.focus();
                prevInput.setSelectionRange(mergeRes.mergeOffset, mergeRes.mergeOffset);
              }
            }, 50);
          }
        }
      }
    }
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
          {onInsertBelow && (
            <button
              type="button"
              className="btn-ghost editor-icon-btn"
              onClick={onInsertBelow}
              title="Add a new section directly below this section"
              aria-label="Add section below"
              style={{ color: 'var(--color-primary)' }}
            >
              <Plus size={18} />
            </button>
          )}
          {index > 0 && onMergeUp && (
            <button
              type="button"
              className="btn-ghost editor-icon-btn"
              onClick={onMergeUp}
              title="Merge with section above"
              aria-label="Merge with section above"
            >
              <Combine size={18} />
            </button>
          )}
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
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Insert at top:</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleInsertRow(0, 'chords')}
                  style={{ fontSize: '0.72rem', padding: '1px 6px' }}
                  title="Insert chords row at the very top"
                >
                  + Chords
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleInsertRow(0, 'lyrics')}
                  style={{ fontSize: '0.72rem', padding: '1px 6px' }}
                  title="Insert lyrics row at the very top"
                >
                  + Lyrics
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleInsertRow(0, 'lead')}
                  style={{ fontSize: '0.72rem', padding: '1px 6px', color: '#b45309' }}
                  title="Insert lead melody row at the very top"
                >
                  + Lead
                </button>
              </div>
            </div>

            {(section.rows || []).map((row, rIndex) => (
              <SongRowEditor
                key={row.id || rIndex}
                row={row}
                index={rIndex}
                totalRows={(section.rows || []).length}
                selectedKey={selectedKey}
                smartLead={smartLead}
                onChange={(updated) => handleRowChange(rIndex, updated)}
                onDelete={() => handleDeleteRow(rIndex)}
                onMoveUp={() => handleMoveRow(rIndex, -1)}
                onMoveDown={() => handleMoveRow(rIndex, 1)}
                onInsertBelow={(type) => handleInsertRow(rIndex + 1, type)}
                onInsertAbove={(type) => handleInsertRow(rIndex, type)}
                onSplitSection={() => onSplitSection?.(rIndex)}
                onInsertSectionBelow={onInsertBelow}
                onKeyDown={(e) => handleRowKeyDown(e, rIndex)}
              />
            ))}
          </>
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
