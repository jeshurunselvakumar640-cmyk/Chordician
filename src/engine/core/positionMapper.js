/**
 * Position Mapper for aligning chords with lyric character columns.
 */

import { extractChordsFromLine } from './chordDetector.js';

/**
 * Builds a monospace-spaced chord line string from an array of positioned chords.
 * Example: [{ chord: 'Dm', position: 0 }, { chord: 'Am', position: 16 }] -> "Dm              Am"
 * @param {Array<{ chord: string, position: number }>} chords
 * @returns {string}
 */
export function buildAlignedChordString(chords) {
  if (!Array.isArray(chords) || chords.length === 0) return '';

  const sorted = [...chords].sort((a, b) => a.position - b.position);

  let result = '';
  let cursor = 0;

  for (const item of sorted) {
    const chord = (item.chord || '').trim();
    if (!chord) continue;

    const targetPos = Math.max(0, item.position ?? 0);

    if (targetPos > cursor) {
      result += ' '.repeat(targetPos - cursor);
      cursor = targetPos;
    } else if (cursor > 0 && result.length > 0 && !result.endsWith(' ')) {
      result += ' ';
      cursor += 1;
    }

    result += chord;
    cursor += chord.length;
  }

  return result.trimEnd();
}

/**
 * Maps a standalone chord line to horizontal positions above a corresponding lyric line.
 * @param {string} chordLine
 * @param {string} lyricLine
 * @returns {{ lyrics: string, chords: Array<{ chord: string, position: number, confidence: number }> }}
 */
export function pairChordLineWithLyric(chordLine, lyricLine) {
  const extracted = extractChordsFromLine(chordLine);
  const cleanLyrics = lyricLine ? lyricLine.trimEnd() : '';

  const mappedChords = extracted.map(item => ({
    chord: item.chord,
    position: item.position,
    confidence: 0.99
  }));

  return {
    lyrics: cleanLyrics,
    chords: mappedChords
  };
}
