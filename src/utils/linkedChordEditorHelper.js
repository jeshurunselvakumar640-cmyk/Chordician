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
