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
 * Splits a linked chord-and-lyric line pair at a character index.
 * Automatically distributes and recalculates relative chord positions for both resulting lines.
 *
 * @param {string} chordLine - Monospace chord line
 * @param {string} lyricLine - Corresponding lyric line
 * @param {number} splitIndex - Character index in lyricLine where Enter was pressed
 * @returns {{
 *   line1: { chords: string, lyrics: string },
 *   line2: { chords: string, lyrics: string }
 * }}
 */
export function splitLinkedLine(chordLine = '', lyricLine = '', splitIndex = 0) {
  const lyrics = String(lyricLine || '');
  const chordsStr = String(chordLine || '');

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

  return {
    line1: {
      chords: buildChordLineFromList(leftChords),
      lyrics: leftLyrics
    },
    line2: {
      chords: buildChordLineFromList(rightChords),
      lyrics: rightLyrics
    }
  };
}

/**
 * Merges two linked chord-and-lyric lines when Backspace is pressed at index 0 of line2.
 *
 * @param {{ chords: string, lyrics: string }} line1
 * @param {{ chords: string, lyrics: string }} line2
 * @returns {{ chords: string, lyrics: string, mergeOffset: number }}
 */
export function mergeLinkedLines(line1, line2) {
  const lyrics1 = String(line1?.lyrics || '');
  const lyrics2 = String(line2?.lyrics || '');
  const chords1 = String(line1?.chords || '');
  const chords2 = String(line2?.chords || '');

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

  return {
    chords: buildChordLineFromList(mergedChords),
    lyrics: mergedLyrics,
    mergeOffset
  };
}
