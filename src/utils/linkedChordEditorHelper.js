/**
 * Helper functions for Interactive Linked Lyric & Chord Editor.
 * Maintains precise alignment and position mapping between chords and lyrics during inline edits, splits, and merges.
 */

import { extractChordsFromLine } from '../engine/core/chordDetector.js';

/**
 * Builds a formatted monospace chord string from an array of { chord, position } objects.
 * @param {Array<{ chord: string, position: number }>} chords
 * @returns {string}
 */
export function buildChordLineFromList(chords) {
  if (!chords || chords.length === 0) return '';

  const sorted = [...chords].sort((a, b) => a.position - b.position);
  let result = '';

  for (const item of sorted) {
    const chord = (item.chord || '').trim();
    if (!chord) continue;

    const targetPos = Math.max(0, item.position);
    if (result.length < targetPos) {
      result += ' '.repeat(targetPos - result.length);
    } else if (result.length > targetPos && result.length > 0) {
      // Ensure at least 1 space separation if overlapping
      result += ' ';
    }
    result += chord;
  }

  return result;
}

/**
 * Extracts note tokens and their 0-based character positions from a lead note line.
 * @param {string} line
 * @returns {Array<{ note: string, position: number }>}
 */
export function extractLeadNotesFromLine(line) {
  if (!line || typeof line !== 'string') return [];
  const notes = [];
  const tokenRegex = /\S+/g;
  let match;
  while ((match = tokenRegex.exec(line)) !== null) {
    notes.push({
      note: match[0],
      position: match.index
    });
  }
  return notes;
}

/**
 * Builds a formatted monospace lead string from an array of { note, position } objects.
 * @param {Array<{ note: string, position: number }>} notes
 * @returns {string}
 */
export function buildLeadLineFromList(notes) {
  if (!notes || notes.length === 0) return '';
  const sorted = [...notes].sort((a, b) => a.position - b.position);
  let result = '';
  for (const item of sorted) {
    const note = (item.note || item.chord || '').trim();
    if (!note) continue;
    const targetPos = Math.max(0, item.position);
    if (result.length < targetPos) {
      result += ' '.repeat(targetPos - result.length);
    } else if (result.length > targetPos && result.length > 0) {
      result += ' ';
    }
    result += note;
  }
  return result;
}

/**
 * Splits a linked chord-and-lyric line pair (with optional lead melody notes) at a character index.
 * Automatically distributes and recalculates relative chord and lead positions for both resulting lines.
 *
 * @param {string} chordLine - Monospace chord line
 * @param {string} lyricLine - Corresponding lyric line
 * @param {number} splitIndex - Character index in lyricLine where Enter was pressed
 * @param {string | null} [leadLine=null] - Optional monospace lead note line
 * @returns {{
 *   line1: { chords: string, lyrics: string, lead: string | null },
 *   line2: { chords: string, lyrics: string, lead: string | null }
 * }}
 */
export function splitLinkedLine(chordLine = '', lyricLine = '', splitIndex = 0, leadLine = null) {
  const lyrics = String(lyricLine || '');
  const chordsStr = String(chordLine || '');
  const leadStr = leadLine !== null && leadLine !== undefined ? String(leadLine || '') : null;

  const safeSplit = Math.max(0, Math.min(lyrics.length, splitIndex));

  const leftLyrics = lyrics.slice(0, safeSplit);
  const rightLyrics = lyrics.slice(safeSplit);

  // Extract all chords with original column positions
  const parsedChords = extractChordsFromLine(chordsStr);

  const leftChords = [];
  const rightChords = [];

  for (const c of parsedChords) {
    if (c.position < safeSplit) {
      leftChords.push({
        chord: c.chord,
        position: c.position
      });
    } else {
      // Shift position relative to the start of the second line
      const newPos = Math.max(0, c.position - safeSplit);
      rightChords.push({
        chord: c.chord,
        position: newPos
      });
    }
  }

  // Split lead notes if present
  let leftLead = null;
  let rightLead = null;
  if (leadStr !== null) {
    const parsedLead = extractLeadNotesFromLine(leadStr);
    const lLead = [];
    const rLead = [];

    for (const n of parsedLead) {
      if (n.position < safeSplit) {
        lLead.push({ note: n.note, position: n.position });
      } else {
        const newPos = Math.max(0, n.position - safeSplit);
        rLead.push({ note: n.note, position: newPos });
      }
    }
    leftLead = buildLeadLineFromList(lLead);
    rightLead = buildLeadLineFromList(rLead);
  }

  return {
    line1: {
      chords: buildChordLineFromList(leftChords),
      lyrics: leftLyrics,
      lead: leftLead
    },
    line2: {
      chords: buildChordLineFromList(rightChords),
      lyrics: rightLyrics,
      lead: rightLead
    }
  };
}

/**
 * Merges two linked chord-and-lyric lines (with optional lead notes) when Backspace is pressed at index 0 of line2.
 *
 * @param {{ chords: string, lyrics: string, lead?: string | null }} line1
 * @param {{ chords: string, lyrics: string, lead?: string | null }} line2
 * @returns {{ chords: string, lyrics: string, lead: string | null, mergeOffset: number }}
 */
export function mergeLinkedLines(line1, line2) {
  const lyrics1 = String(line1?.lyrics || '');
  const lyrics2 = String(line2?.lyrics || '');
  const chords1 = String(line1?.chords || '');
  const chords2 = String(line2?.chords || '');
  const lead1 = line1?.lead !== undefined && line1?.lead !== null ? String(line1.lead || '') : null;
  const lead2 = line2?.lead !== undefined && line2?.lead !== null ? String(line2.lead || '') : null;

  const mergeOffset = lyrics1.length;
  const mergedLyrics = lyrics1 + lyrics2;

  const parsed1 = extractChordsFromLine(chords1);
  const parsed2 = extractChordsFromLine(chords2);

  const mergedChords = [...parsed1];
  for (const c of parsed2) {
    mergedChords.push({
      chord: c.chord,
      position: c.position + mergeOffset
    });
  }

  // Merge lead notes if present
  let mergedLead = null;
  if (lead1 !== null || lead2 !== null) {
    const parsedLead1 = extractLeadNotesFromLine(lead1 || '');
    const parsedLead2 = extractLeadNotesFromLine(lead2 || '');
    const mLead = [...parsedLead1];
    for (const n of parsedLead2) {
      mLead.push({
        note: n.note,
        position: n.position + mergeOffset
      });
    }
    mergedLead = buildLeadLineFromList(mLead);
  }

  return {
    chords: buildChordLineFromList(mergedChords),
    lyrics: mergedLyrics,
    lead: mergedLead,
    mergeOffset
  };
}

/**
 * Merges two sections in a song structure.
 * Appends rows from source section into target section, keeping target section's name,
 * and smartly adjusts subsequent numbered section headers (e.g. Verse 3 -> Verse 2).
 *
 * @param {Array<object>} sections - Array of song sections
 * @param {number} targetIndex - Index of the section that will absorb the content
 * @param {number} sourceIndex - Index of the section that will be merged and removed
 * @returns {Array<object>} - Updated sections array
 */
export function mergeSections(sections, targetIndex, sourceIndex) {
  if (!Array.isArray(sections) || sections.length < 2) return sections;
  if (targetIndex < 0 || targetIndex >= sections.length) return sections;
  if (sourceIndex < 0 || sourceIndex >= sections.length) return sections;
  if (targetIndex === sourceIndex) return sections;

  const targetSec = sections[targetIndex];
  const sourceSec = sections[sourceIndex];

  const mergedRows = [
    ...(targetSec.rows || []).map((r) => ({ ...r })),
    ...(sourceSec.rows || []).map((r) => ({ ...r }))
  ];

  const mergedSection = {
    ...targetSec,
    name: targetSec.name || `Section ${targetIndex + 1}`,
    rows: mergedRows
  };

  // Build new array with target merged and source removed
  const result = [];
  for (let i = 0; i < sections.length; i++) {
    if (i === targetIndex) {
      result.push(mergedSection);
    } else if (i === sourceIndex) {
      // Skip source section as it is merged
      continue;
    } else {
      result.push({ ...sections[i] });
    }
  }

  // Check if target and source shared a numbered prefix (e.g., "Verse 1" and "Verse 2")
  const targetName = (targetSec.name || '').trim();
  const sourceName = (sourceSec.name || '').trim();

  // Pattern matches: "Verse 1", "Chorus 2", "Section 3", "Stanza 1", "Part 2", "V1", "C2", etc.
  const numPattern = /^(.+?)\s*(\d+)$/i;
  const targetMatch = targetName.match(numPattern);
  const sourceMatch = sourceName.match(numPattern);

  if (targetMatch && sourceMatch) {
    const targetPrefix = targetMatch[1].trim().toLowerCase();
    const sourcePrefix = sourceMatch[1].trim().toLowerCase();
    const targetNum = parseInt(targetMatch[2], 10);
    const sourceNum = parseInt(sourceMatch[2], 10);

    // If they have the same prefix and consecutive numbers (e.g. Verse 1 and Verse 2)
    if (targetPrefix === sourcePrefix && sourceNum === targetNum + 1) {
      // Renumber subsequent sections of the same prefix starting after the merged index
      const startIndex = Math.min(targetIndex, sourceIndex) + 1;
      for (let j = startIndex; j < result.length; j++) {
        const sec = result[j];
        const secName = (sec.name || '').trim();
        const m = secName.match(numPattern);
        if (m) {
          const prefix = m[1].trim().toLowerCase();
          const num = parseInt(m[2], 10);
          if (prefix === targetPrefix && num > targetNum) {
            const origPrefix = m[1].trim();
            const hasSpace = /\s/.test(m[0]);
            const sep = hasSpace ? ' ' : '';
            const newNum = num - 1;
            result[j] = {
              ...sec,
              name: `${origPrefix}${sep}${newNum}`
            };
          }
        }
      }
    }
  }

  return result;
}

/**
 * Splits a section into two parts at a given row index.
 * Rows from 0 to splitRowIndex - 1 remain in Part 1.
 * Rows from splitRowIndex to end move into a new Part 2 section directly below it.
 *
 * @param {Array<object>} sections - Array of song sections
 * @param {number} sectionIndex - Index of the section to split
 * @param {number} splitRowIndex - Row index where the split should occur
 * @param {string} [customNewName] - Optional custom name for the new section
 * @returns {Array<object>} - Updated sections array with the new split section inserted
 */
export function splitSection(sections, sectionIndex, splitRowIndex, customNewName = null) {
  if (!Array.isArray(sections) || sectionIndex < 0 || sectionIndex >= sections.length) {
    return sections;
  }

  const targetSec = sections[sectionIndex];
  const rows = targetSec.rows || [];
  if (rows.length <= 1 || splitRowIndex <= 0 || splitRowIndex >= rows.length) {
    return sections;
  }

  const part1Rows = rows.slice(0, splitRowIndex);
  const part2Rows = rows.slice(splitRowIndex);

  const baseName = (targetSec.name || `Section ${sectionIndex + 1}`).trim();
  
  let part1Name = baseName;
  let part2Name = customNewName;

  if (!part2Name) {
    const numMatch = baseName.match(/^(.+?)\s*(\d+)$/i);
    if (numMatch) {
      const prefix = numMatch[1].trim();
      const num = parseInt(numMatch[2], 10);
      part2Name = `${prefix} ${num + 1}`;
    } else {
      part1Name = `${baseName} (Part 1)`;
      part2Name = `${baseName} (Part 2)`;
    }
  }

  const part1Sec = {
    ...targetSec,
    name: part1Name,
    rows: part1Rows
  };

  const part2Sec = {
    id: 'sec_' + Date.now() + Math.random().toString(36).substring(2, 6),
    name: part2Name,
    rows: part2Rows
  };

  const result = [];
  for (let i = 0; i < sections.length; i++) {
    if (i === sectionIndex) {
      result.push(part1Sec);
      result.push(part2Sec);
    } else {
      result.push({ ...sections[i] });
    }
  }

  return result;
}

/**
 * Inserts a brand new empty section at a specific position in the sections list.
 *
 * @param {Array<object>} sections - Array of song sections
 * @param {number} insertIndex - Position where the new section will be inserted
 * @param {string} [sectionName] - Optional custom name
 * @returns {Array<object>}
 */
export function insertSection(sections, insertIndex, sectionName = null) {
  if (!Array.isArray(sections)) return sections;

  const targetIndex = Math.max(0, Math.min(sections.length, insertIndex));
  const ts = Date.now() + Math.random().toString(36).substring(2, 6);
  const newSection = {
    id: 'sec_' + ts,
    name: sectionName || `Section ${targetIndex + 1}`,
    rows: [
      { id: `r_${ts}_1`, type: 'chords', content: '' },
      { id: `r_${ts}_2`, type: 'lyrics', content: '' },
      { id: `r_${ts}_3`, type: 'lead', content: '' }
    ]
  };

  const result = [...sections];
  result.splice(targetIndex, 0, newSection);
  return result;
}

/**
 * Normalizes a list of section rows into the standard 3-layer structure:
 * 1. Chords row (content or '')
 * 2. Lyrics row (content or '')
 * 3. Lead row   (content or '')
 *
 * Preserves all existing row content, character positioning, chord qualities, and lead notes.
 *
 * @param {Array<{ id?: string, type: string, content?: string }>} rows
 * @returns {Array<{ id: string, type: string, content: string }>}
 */
export function normalizeSectionRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    const ts = Date.now() + Math.random().toString(36).substring(2, 6);
    return [
      { id: `r_${ts}_c`, type: 'chords', content: '' },
      { id: `r_${ts}_l`, type: 'lyrics', content: '' },
      { id: `r_${ts}_ld`, type: 'lead', content: '' }
    ];
  }

  const normalized = [];
  let i = 0;

  while (i < rows.length) {
    const currentRow = rows[i];
    const rowType = currentRow.type || 'lyrics';

    if (rowType === 'chords') {
      const nextRow = i + 1 < rows.length ? rows[i + 1] : null;
      const nextNextRow = i + 2 < rows.length ? rows[i + 2] : null;

      if (nextRow && nextRow.type === 'lyrics') {
        if (nextNextRow && nextNextRow.type === 'lead') {
          // Triplet: chords + lyrics + lead
          normalized.push({ ...currentRow, content: currentRow.content || '' });
          normalized.push({ ...nextRow, content: nextRow.content || '' });
          normalized.push({ ...nextNextRow, content: nextNextRow.content || '' });
          i += 3;
        } else {
          // Pair: chords + lyrics -> add blank lead
          const leadId = `${nextRow.id || currentRow.id || 'r'}_ld`;
          normalized.push({ ...currentRow, content: currentRow.content || '' });
          normalized.push({ ...nextRow, content: nextRow.content || '' });
          normalized.push({ id: leadId, type: 'lead', content: '' });
          i += 2;
        }
      } else {
        // Standalone chords -> add blank lyrics and blank/existing lead
        const lyricId = `${currentRow.id || 'r'}_l`;
        normalized.push({ ...currentRow, content: currentRow.content || '' });
        normalized.push({ id: lyricId, type: 'lyrics', content: '' });
        if (nextRow && nextRow.type === 'lead') {
          normalized.push({ ...nextRow, content: nextRow.content || '' });
          i += 2;
        } else {
          const leadId = `${currentRow.id || 'r'}_ld`;
          normalized.push({ id: leadId, type: 'lead', content: '' });
          i += 1;
        }
      }
    } else if (rowType === 'lyrics') {
      const nextRow = i + 1 < rows.length ? rows[i + 1] : null;
      const chordId = `${currentRow.id || 'r'}_c`;

      if (nextRow && nextRow.type === 'lead') {
        // Pair: lyrics + lead -> add blank chords above
        normalized.push({ id: chordId, type: 'chords', content: '' });
        normalized.push({ ...currentRow, content: currentRow.content || '' });
        normalized.push({ ...nextRow, content: nextRow.content || '' });
        i += 2;
      } else {
        // Single lyrics -> add blank chords above and blank lead below
        const leadId = `${currentRow.id || 'r'}_ld`;
        normalized.push({ id: chordId, type: 'chords', content: '' });
        normalized.push({ ...currentRow, content: currentRow.content || '' });
        normalized.push({ id: leadId, type: 'lead', content: '' });
        i += 1;
      }
    } else if (rowType === 'lead') {
      // Standalone lead -> add blank chords and blank lyrics above
      const chordId = `${currentRow.id || 'r'}_c`;
      const lyricId = `${currentRow.id || 'r'}_l`;
      normalized.push({ id: chordId, type: 'chords', content: '' });
      normalized.push({ id: lyricId, type: 'lyrics', content: '' });
      normalized.push({ ...currentRow, content: currentRow.content || '' });
      i += 1;
    } else {
      // Other row types (e.g. 'notes', 'bass', 'custom') -> keep as is
      normalized.push({ ...currentRow });
      i += 1;
    }
  }

  return normalized;
}

/**
 * Normalizes all sections of a song to enforce the standard 3-layer row structure.
 *
 * @param {Array<object>} sections
 * @returns {Array<object>}
 */
export function normalizeSongSectionsForEditor(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [
      {
        id: 'sec_1',
        name: 'Verse 1',
        rows: normalizeSectionRows([])
      }
    ];
  }

  return sections.map((sec, sIdx) => ({
    ...sec,
    id: sec.id || `sec_${sIdx + 1}`,
    name: sec.name || `Section ${sIdx + 1}`,
    rows: normalizeSectionRows(sec.rows || [])
  }));
}
