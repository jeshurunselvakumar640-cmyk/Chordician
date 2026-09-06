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
  Info,
  Combine,
  Layers
} from 'lucide-react';
import { splitLinkedLine, mergeLinkedLines, mergeSections } from '../../utils/linkedChordEditorHelper.js';

export default function LinkedChordPreviewEditor({ song, onSongChange }) {
  if (!song || !song.sections) return null;

  const [activeEditingId, setActiveEditingId] = useState(null);

  // Helper to merge a section into the previous section
  const handleMergeWithPrevious = (sectionIndex) => {
    if (sectionIndex <= 0) return;
    const updatedSections = mergeSections(song.sections, sectionIndex - 1, sectionIndex);
    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to merge the next section into this section
  const handleMergeWithNext = (sectionIndex) => {
    if (sectionIndex >= song.sections.length - 1) return;
    const updatedSections = mergeSections(song.sections, sectionIndex, sectionIndex + 1);
    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to update section name
  const handleSectionNameChange = (sectionIndex, newName) => {
    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      return { ...sec, name: newName };
    });
    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to delete an entire section
  const handleDeleteSection = (sectionIndex) => {
    if (song.sections.length <= 1) return;
    const updatedSections = song.sections.filter((_, sIdx) => sIdx !== sectionIndex);
    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to move a section up or down
  const handleMoveSection = (sectionIndex, direction) => {
    const targetIndex = sectionIndex + direction;
    if (targetIndex < 0 || targetIndex >= song.sections.length) return;
    const updated = [...song.sections];
    const temp = updated[sectionIndex];
    updated[sectionIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    onSongChange({
      ...song,
      sections: updated
    });
  };

  // Helper to add a new empty section below
  const handleAddSection = (afterIndex) => {
    const nextNum = song.sections.length + 1;
    const newSec = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Section ${nextNum}`,
      rows: [
        { id: `row_${Date.now()}_c`, type: 'chords', content: '' },
        { id: `row_${Date.now()}_l`, type: 'lyrics', content: '' }
      ]
    };
    const updated = [...song.sections];
    updated.splice(afterIndex + 1, 0, newSec);
    onSongChange({
      ...song,
      sections: updated
    });
  };


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

  // Handles splitting linked chord, lyric, and lead rows when user presses Enter inside lyrics
  const handleLyricKeyDown = (e, sectionIndex, chordRowIndex, lyricRowIndex, leadRowIndex = null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputEl = e.target;
      const cursorIndex = inputEl.selectionStart ?? inputEl.value.length;

      const currentSec = song.sections[sectionIndex];
      const chordRow = chordRowIndex !== null ? currentSec.rows[chordRowIndex] : null;
      const lyricRow = currentSec.rows[lyricRowIndex];
      const leadRow = leadRowIndex !== null ? currentSec.rows[leadRowIndex] : null;

      const splitResult = splitLinkedLine(
        chordRow?.content || '',
        lyricRow?.content || '',
        cursorIndex,
        leadRow?.content || null
      );

      const newChordRowId = `row_${Date.now()}_c`;
      const newLyricRowId = `row_${Date.now()}_l`;
      const newLeadRowId = `row_${Date.now()}_ld`;

      const newRows = [];
      for (let r = 0; r < currentSec.rows.length; r++) {
        if (chordRowIndex !== null && r === chordRowIndex) {
          newRows.push({ ...chordRow, content: splitResult.line1.chords });
        } else if (r === lyricRowIndex) {
          newRows.push({ ...lyricRow, content: splitResult.line1.lyrics });
          if (leadRowIndex === null) {
            // Insert the new second line pair immediately below
            if (chordRowIndex !== null) {
              newRows.push({
                id: newChordRowId,
                type: 'chords',
                content: splitResult.line2.chords
              });
            }
            newRows.push({
              id: newLyricRowId,
              type: 'lyrics',
              content: splitResult.line2.lyrics
            });
          }
        } else if (leadRowIndex !== null && r === leadRowIndex) {
          newRows.push({ ...leadRow, content: splitResult.line1.lead || '' });
          // Insert the new second line trio immediately below
          if (chordRowIndex !== null) {
            newRows.push({
              id: newChordRowId,
              type: 'chords',
              content: splitResult.line2.chords
            });
          }
          newRows.push({
            id: newLyricRowId,
            type: 'lyrics',
            content: splitResult.line2.lyrics
          });
          newRows.push({
            id: newLeadRowId,
            type: 'lead',
            content: splitResult.line2.lead || ''
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
        // Find previous linked unit to merge
        const step = leadRowIndex !== null ? 3 : 2;
        if (lyricRowIndex >= step) {
          e.preventDefault();
          const prevLyricRowIndex = lyricRowIndex - step;
          const prevChordRowIndex = chordRowIndex !== null ? chordRowIndex - step : null;
          const prevLeadRowIndex = leadRowIndex !== null ? leadRowIndex - step : null;

          const currentSec = song.sections[sectionIndex];
          const prevChordRow = prevChordRowIndex !== null ? currentSec.rows[prevChordRowIndex] : null;
          const prevLyricRow = currentSec.rows[prevLyricRowIndex];
          const prevLeadRow = prevLeadRowIndex !== null ? currentSec.rows[prevLeadRowIndex] : null;

          const currChordRow = chordRowIndex !== null ? currentSec.rows[chordRowIndex] : null;
          const currLyricRow = currentSec.rows[lyricRowIndex];
          const currLeadRow = leadRowIndex !== null ? currentSec.rows[leadRowIndex] : null;

          const mergeRes = mergeLinkedLines(
            {
              chords: prevChordRow?.content || '',
              lyrics: prevLyricRow?.content || '',
              lead: prevLeadRow ? prevLeadRow.content : null
            },
            {
              chords: currChordRow?.content || '',
              lyrics: currLyricRow?.content || '',
              lead: currLeadRow ? currLeadRow.content : null
            }
          );

          const newRows = [];
          for (let r = 0; r < currentSec.rows.length; r++) {
            if (prevChordRowIndex !== null && r === prevChordRowIndex) {
              newRows.push({ ...prevChordRow, content: mergeRes.chords });
            } else if (r === prevLyricRowIndex) {
              newRows.push({ ...prevLyricRow, content: mergeRes.lyrics });
            } else if (prevLeadRowIndex !== null && r === prevLeadRowIndex) {
              newRows.push({ ...prevLeadRow, content: mergeRes.lead || '' });
            } else if (
              (chordRowIndex !== null && r === chordRowIndex) ||
              r === lyricRowIndex ||
              (leadRowIndex !== null && r === leadRowIndex)
            ) {
              // Skip current unit as it's merged into previous
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

  // Helper to delete a row trio (chord, lyric, lead)
  const handleDeleteTrio = (sectionIndex, chordRowIndex, lyricRowIndex, leadRowIndex) => {
    const currentSec = song.sections[sectionIndex];
    const newRows = currentSec.rows.filter(
      (_, idx) => idx !== chordRowIndex && idx !== lyricRowIndex && idx !== leadRowIndex
    );

    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      return { ...sec, rows: newRows };
    });

    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to add a new empty line pair or trio at the end of a section
  const handleAddLinePair = (sectionIndex) => {
    const currentSec = song.sections[sectionIndex];
    const hasLeadInSec = (currentSec.rows || []).some((r) => r.type === 'lead');

    const newRows = [
      ...currentSec.rows,
      { id: `row_${Date.now()}_c`, type: 'chords', content: '' },
      { id: `row_${Date.now()}_l`, type: 'lyrics', content: '' }
    ];

    if (hasLeadInSec) {
      newRows.push({ id: `row_${Date.now()}_ld`, type: 'lead', content: '' });
    }

    const updatedSections = song.sections.map((sec, sIdx) => {
      if (sIdx !== sectionIndex) return sec;
      return { ...sec, rows: newRows };
    });

    onSongChange({
      ...song,
      sections: updatedSections
    });
  };

  // Helper to attach a lead row to an existing chord-lyric pair
  const handleAddLeadToPair = (sectionIndex, lyricRowIndex) => {
    const currentSec = song.sections[sectionIndex];
    const newLeadRow = { id: `row_${Date.now()}_ld`, type: 'lead', content: '' };

    const newRows = [...currentSec.rows];
    newRows.splice(lyricRowIndex + 1, 0, newLeadRow);

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
          <strong>Interactive Linked Lyrics, Chords & Lead Notes</strong>
          <p>
            Chords, lyrics, and lead melody notes are synchronized together. Press <kbd>Enter</kbd> anywhere in the lyrics to split the line—the chords and lead notes above and below will automatically follow and align to their respective words!
          </p>
        </div>
      </div>

      <div className="linked-sections-container">
        {song.sections.map((section, sIdx) => {
          // Group rows into linked triplets (chords + lyrics + lead), pairs, or single rows
          const rowPairs = [];
          const rows = section.rows || [];

          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];

            // 1. Triplet: chords + lyrics + lead
            if (
              row.type === 'chords' &&
              r + 1 < rows.length && rows[r + 1].type === 'lyrics' &&
              r + 2 < rows.length && rows[r + 2].type === 'lead'
            ) {
              rowPairs.push({
                type: 'linked_trio',
                chordRow: row,
                lyricRow: rows[r + 1],
                leadRow: rows[r + 2],
                chordRowIndex: r,
                lyricRowIndex: r + 1,
                leadRowIndex: r + 2
              });
              r += 2;
            }
            // 2. Pair: chords + lyrics
            else if (row.type === 'chords' && r + 1 < rows.length && rows[r + 1].type === 'lyrics') {
              rowPairs.push({
                type: 'linked_pair',
                chordRow: row,
                lyricRow: rows[r + 1],
                chordRowIndex: r,
                lyricRowIndex: r + 1
              });
              r++;
            }
            // 3. Pair: lyrics + lead
            else if (row.type === 'lyrics' && r + 1 < rows.length && rows[r + 1].type === 'lead') {
              rowPairs.push({
                type: 'linked_lyric_lead',
                lyricRow: row,
                leadRow: rows[r + 1],
                lyricRowIndex: r,
                leadRowIndex: r + 1
              });
              r++;
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
                <div className="linked-section-title-group">
                  <Layers size={16} className="linked-section-icon" />
                  <input
                    type="text"
                    className="linked-section-name-input"
                    value={section.name || ''}
                    placeholder={`Section ${sIdx + 1}`}
                    onChange={(e) => handleSectionNameChange(sIdx, e.target.value)}
                    title="Edit section name"
                  />
                </div>

                <div className="linked-section-actions">
                  {sIdx > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs linked-merge-action-btn"
                      onClick={() => handleMergeWithPrevious(sIdx)}
                      title={`Merge "${section.name || 'Section ' + (sIdx + 1)}" with "${song.sections[sIdx - 1]?.name || 'Section ' + sIdx}" above`}
                    >
                      <Combine size={13} />
                      <span>Merge with Above</span>
                    </button>
                  )}

                  {sIdx < song.sections.length - 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs linked-merge-action-btn"
                      onClick={() => handleMergeWithNext(sIdx)}
                      title={`Merge "${song.sections[sIdx + 1]?.name || 'Section ' + (sIdx + 2)}" into "${section.name || 'Section ' + (sIdx + 1)}"`}
                    >
                      <Combine size={13} />
                      <span>Merge with Below</span>
                    </button>
                  )}

                  <div className="linked-section-reorder-group">
                    <button
                      type="button"
                      className="btn-ghost linked-action-icon-btn"
                      onClick={() => handleMoveSection(sIdx, -1)}
                      disabled={sIdx === 0}
                      title="Move section up"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost linked-action-icon-btn"
                      onClick={() => handleMoveSection(sIdx, 1)}
                      disabled={sIdx === song.sections.length - 1}
                      title="Move section down"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>

                  {song.sections.length > 1 && (
                    <button
                      type="button"
                      className="btn-ghost text-danger linked-action-icon-btn"
                      onClick={() => handleDeleteSection(sIdx)}
                      title="Delete section"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="linked-pairs-list">
                {rowPairs.map((pair, pIdx) => {
                  // Linked Trio: Chords + Lyrics + Lead
                  if (pair.type === 'linked_trio') {
                    const { chordRow, lyricRow, leadRow, chordRowIndex, lyricRowIndex, leadRowIndex } = pair;
                    return (
                      <div key={`trio-${chordRow.id}-${lyricRow.id}-${leadRow.id}`} className="linked-pair-row linked-trio-row">
                        {/* Chord Line Input */}
                        <div className="linked-chord-line-wrapper">
                          <input
                            type="text"
                            className="linked-chord-input font-mono-input"
                            value={chordRow.content}
                            placeholder="Chords (e.g. A           G           D           A)"
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
                            placeholder="Lyrics... (Press Enter to split line & chords & lead)"
                            onChange={(e) => handleUpdateRow(sIdx, lyricRowIndex, e.target.value)}
                            onKeyDown={(e) => handleLyricKeyDown(e, sIdx, chordRowIndex, lyricRowIndex, leadRowIndex)}
                          />

                          <button
                            type="button"
                            className="linked-pair-delete-btn"
                            onClick={() => handleDeleteTrio(sIdx, chordRowIndex, lyricRowIndex, leadRowIndex)}
                            title="Delete this chord, lyric & lead group"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Lead Line Input */}
                        <div className="linked-lead-line-wrapper">
                          <span className="linked-lead-badge">LEAD</span>
                          <input
                            type="text"
                            className="linked-lead-input font-mono-input"
                            value={leadRow.content}
                            placeholder="Lead notes (e.g. EE   AAA   AC#   BA BG)"
                            onChange={(e) => handleUpdateRow(sIdx, leadRowIndex, e.target.value)}
                            title="Edit lead / melody notes on this line"
                          />
                        </div>
                      </div>
                    );
                  }

                  // Linked Pair: Chords + Lyrics
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
                            onKeyDown={(e) => handleLyricKeyDown(e, sIdx, chordRowIndex, lyricRowIndex, null)}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 6px', fontSize: '0.72rem', color: '#fbbf24', opacity: 0.8 }}
                              onClick={() => handleAddLeadToPair(sIdx, lyricRowIndex)}
                              title="Attach Lead notes to this line"
                            >
                              + Lead
                            </button>
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
                      </div>
                    );
                  }

                  // Linked Lyric + Lead Pair
                  if (pair.type === 'linked_lyric_lead') {
                    const { lyricRow, leadRow, lyricRowIndex, leadRowIndex } = pair;
                    return (
                      <div key={`pair-${lyricRow.id}-${leadRow.id}`} className="linked-pair-row">
                        <div className="linked-lyric-line-wrapper">
                          <input
                            id={`lyric-input-${lyricRow.id}`}
                            type="text"
                            className="linked-lyric-input"
                            value={lyricRow.content}
                            placeholder="Lyrics..."
                            onChange={(e) => handleUpdateRow(sIdx, lyricRowIndex, e.target.value)}
                            onKeyDown={(e) => handleLyricKeyDown(e, sIdx, null, lyricRowIndex, leadRowIndex)}
                          />

                          <button
                            type="button"
                            className="linked-pair-delete-btn"
                            onClick={() => handleDeletePair(sIdx, lyricRowIndex, leadRowIndex)}
                            title="Delete this lyric & lead pair"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="linked-lead-line-wrapper">
                          <span className="linked-lead-badge">LEAD</span>
                          <input
                            type="text"
                            className="linked-lead-input font-mono-input"
                            value={leadRow.content}
                            placeholder="Lead notes..."
                            onChange={(e) => handleUpdateRow(sIdx, leadRowIndex, e.target.value)}
                          />
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

              {/* Section Footer Actions */}
              <div className="linked-section-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddLinePair(sIdx)}
                >
                  <Plus size={14} />
                  <span>Add Line</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleAddSection(sIdx)}
                  title="Insert a new section below"
                >
                  <Plus size={14} />
                  <span>Add Section Below</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
