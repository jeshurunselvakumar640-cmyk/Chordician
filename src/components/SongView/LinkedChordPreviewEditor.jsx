import React, { useState, useRef } from 'react';
import {
  Music,
  Plus,
  Trash2,
  Edit3,
  Split,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { splitLinkedLine, mergeLinkedLines } from '../../utils/linkedChordEditorHelper.js';

export default function LinkedChordPreviewEditor({ song, onSongChange }) {
  if (!song || !song.sections) return null;

  const [activeEditingId, setActiveEditingId] = useState(null);

  // Updates a specific row content in a section
  const handleUpdateRow = (sectionIndex, rowIndex, newContent) => {
    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      const updatedRows = sec.rows.map((row, rIdx) => {
        if (rIdx !== rowIndex) return row;
        return { ...row, content: newContent };
      });
      return { ...sec, rows: updatedRows };
    });

    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Handles splitting linked chord & lyric rows when user presses Enter inside lyrics
  const handleLyricKeyDown = (e, sectionIndex, chordRowIndex, lyricRowIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputEl = e.target;
      const cursorIndex = inputEl.selectionStart ?? inputEl.value.length;

      const currentSec = song.sections[sectionIndex];
      const chordRow = currentSec.rows[chordRowIndex];
      const lyricRow = currentSec.rows[lyricRowIndex];

      const splitResult = splitLinkedLine(
        chordRow?.content || '',
        lyricRow?.content || '',
        cursorIndex
      );

      const newChordRowId = `row_${Date.now()}_c`;
      const newLyricRowId = `row_${Date.now()}_l`;

      const newRows = [];
      for (let r = 0; r < currentSec.rows.length; r++) {
        if (r === chordRowIndex) {
          newRows.push({ ...chordRow, content: splitResult.line1.chords });
        } else if (r === lyricRowIndex) {
          newRows.push({ ...lyricRow, content: splitResult.line1.lyrics });
          // Insert the new second line pair immediately below
          newRows.push({
            id: newChordRowId,
            type: 'chords',
            content: splitResult.line2.chords
          });
          newRows.push({
            id: newLyricRowId,
            type: 'lyrics',
            content: splitResult.line2.lyrics
          });
        } else {
          newRows.push(currentSec.rows[r]);
        }
      }

      const updatedSections = song.sections.map((sec, sIdx) => {
        if (sIdx !== sectionIndex) return sec;
        return { ...sec, rows: newRows };
      });

      onSongChange({
        ...song,
        sections: updatedSections
      });

      // Focus the new lyric line on next render
      setTimeout(() => {
        const nextInput = document.getElementById(`lyric-input-${newLyricRowId}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(0, 0);
        }
      }, 50);
    } else if (e.key === 'Backspace') {
      const inputEl = e.target;
      if (inputEl.selectionStart === 0 && inputEl.selectionEnd === 0) {
        // Find previous linked pair to merge
        if (chordRowIndex >= 2 && lyricRowIndex >= 3) {
          e.preventDefault();
          const prevChordRowIndex = chordRowIndex - 2;
          const prevLyricRowIndex = lyricRowIndex - 2;

          const currentSec = song.sections[sectionIndex];
          const prevChordRow = currentSec.rows[prevChordRowIndex];
          const prevLyricRow = currentSec.rows[prevLyricRowIndex];
          const currChordRow = currentSec.rows[chordRowIndex];
          const currLyricRow = currentSec.rows[lyricRowIndex];

          const mergeRes = mergeLinkedLines(
            { chords: prevChordRow.content, lyrics: prevLyricRow.content },
            { chords: currChordRow.content, lyrics: currLyricRow.content }
          );

          const newRows = [];
          for (let r = 0; r < currentSec.rows.length; r++) {
            if (r === prevChordRowIndex) {
              newRows.push({ ...prevChordRow, content: mergeRes.chords });
            } else if (r === prevLyricRowIndex) {
              newRows.push({ ...prevLyricRow, content: mergeRes.lyrics });
            } else if (r === chordRowIndex || r === lyricRowIndex) {
              // Skip current pair as it's merged into previous
              continue;
            } else {
              newRows.push(currentSec.rows[r]);
            }
          }

          const updatedSections = song.sections.map((sec, sIdx) => {
            if (sIdx !== sectionIndex) return sec;
            return { ...sec, rows: newRows };
          });

          onSongChange({
            ...song,
            sections: updatedSections
          });

          setTimeout(() => {
            const prevInput = document.getElementById(`lyric-input-${prevLyricRow.id}`);
            if (prevInput) {
              prevInput.focus();
              prevInput.setSelectionRange(mergeRes.mergeOffset, mergeRes.mergeOffset);
            }
          }, 50);
        }
      }
    }
  };

  // Helper to delete a row pair
  const handleDeletePair = (sectionIndex, chordRowIndex, lyricRowIndex) => {
    const currentSec = song.sections[sectionIndex];
    const newRows = currentSec.rows.filter((_, idx) => idx !== chordRowIndex && idx !== lyricRowIndex);

    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      return { ...sec, rows: newRows };
    });

    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to add a new empty line pair at the end of a section
  const handleAddLinePair = (sectionIndex) => {
    const currentSec = song.sections[sectionIndex];
    const newRows = [
      ...currentSec.rows,
      { id: `row_${Date.now()}_c`, type: 'chords', content: '' },
      { id: `row_${Date.now()}_l`, type: 'lyrics', content: '' }
    ];

    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      return { ...sec, rows: newRows };
    });

    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  return (
    <div className="linked-preview-editor">
      <div className="linked-editor-banner">
        <div className="linked-editor-banner-icon">
          <Sparkles size={18} />
        </div>
        <div className="linked-editor-banner-text">
          <strong>Interactive Linked Lyrics & Chords</strong>
          <p>
            Chords and lyrics are locked together. Press <kbd>Enter</kbd> anywhere in the lyrics to split the line—the chords above will automatically follow and realign to their respective words!
          </p>
        </div>
      </div>

      <div className="linked-sections-container">
        {song.sections.map((section, sIdx) => {
          // Group rows into linked chord+lyric pairs
          const rowPairs = [];
          const rows = section.rows || [];

          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (row.type === 'chords' && r + 1 < rows.length && rows[r + 1].type === 'lyrics') {
              rowPairs.push({
                type: 'linked_pair',
                chordRow: row,
                lyricRow: rows[r + 1],
                chordRowIndex: r,
                lyricRowIndex: r + 1
              });
              r++; // Skip the paired lyric row
            } else {
              rowPairs.push({
                type: 'single_row',
                row,
                rowIndex: r
              });
            }
          }

          return (
            <div key={section.id || sIdx} className="linked-section-block">
              <div className="linked-section-header">
                <span className="linked-section-tag">{section.name || `Section ${sIdx + 1}`}</span>
              </div>

              <div className="linked-pairs-list">
                {rowPairs.map((pair, pIdx) => {
                  if (pair.type === 'linked_pair') {
                    const { chordRow, lyricRow, chordRowIndex, lyricRowIndex } = pair;
                    return (
                      <div key={`pair-${chordRow.id}-${lyricRow.id}`} className="linked-pair-row">
                        {/* Chord Line Input */}
                        <div className="linked-chord-line-wrapper">
                          <input
                            type="text"
                            className="linked-chord-input font-mono-input"
                            value={chordRow.content}
                            placeholder="Chords (e.g. G           D)"
                            onChange={(e) => handleUpdateRow(sIdx, chordRowIndex, e.target.value)}
                            title="Edit chords on this line"
                          />
                        </div>

                        {/* Lyric Line Input */}
                        <div className="linked-lyric-line-wrapper">
                          <input
                            id={`lyric-input-${lyricRow.id}`}
                            type="text"
                            className="linked-lyric-input"
                            value={lyricRow.content}
                            placeholder="Lyrics... (Press Enter to split line & chords)"
                            onChange={(e) => handleUpdateRow(sIdx, lyricRowIndex, e.target.value)}
                            onKeyDown={(e) => handleLyricKeyDown(e, sIdx, chordRowIndex, lyricRowIndex)}
                          />

                          <button
                            type="button"
                            className="linked-pair-delete-btn"
                            onClick={() => handleDeletePair(sIdx, chordRowIndex, lyricRowIndex)}
                            title="Delete this chord & lyric pair"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Single row (notes, lead, bass, standalone chord/lyric)
                  const { row, rowIndex } = pair;
                  return (
                    <div key={row.id || rowIndex} className="linked-single-row">
                      <span className="linked-row-type-badge">{row.type.toUpperCase()}</span>
                      <input
                        type="text"
                        className={`linked-single-input ${row.type === 'chords' || row.type === 'lead' || row.type === 'bass' ? 'font-mono-input' : ''}`}
                        value={row.content}
                        onChange={(e) => handleUpdateRow(sIdx, rowIndex, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add Line Pair Button */}
              <div className="linked-section-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddLinePair(sIdx)}
                >
                  <Plus size={14} />
                  <span>Add Line to {section.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
