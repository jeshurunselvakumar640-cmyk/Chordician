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
 * Maps a standalone chord line to horizontal positions above a corresponding lyric line,
 * automatically handling and shifting around any empty anchor bracket markers like [].
 * @param {string} chordLine
 * @param {string} lyricLine
 * @returns {{ lyrics: string, chords: Array<{ chord: string, position: number, confidence: number }> }}
 */
export function pairChordLineWithLyric(chordLine, lyricLine) {
  const extracted = extractChordsFromLine(chordLine);
  let cleanLyrics = lyricLine ? lyricLine.trimEnd() : '';

  // Check if lyricLine contains empty bracket markers like [] or [ ]
  const bracketRegex = /\[\s*\]|\(\s*\)/g;
  const brackets = [];
  let bMatch;
  while ((bMatch = bracketRegex.exec(cleanLyrics)) !== null) {
    brackets.push({ index: bMatch.index, length: bMatch[0].length });
  }

  const mappedChords = extracted.map(item => {
    let finalPos = item.position;
    if (brackets.length > 0) {
      const shift = brackets
        .filter(b => b.index < item.position)
        .reduce((sum, b) => sum + b.length, 0);
      finalPos = Math.max(0, item.position - shift);
    }
    return {
      chord: item.chord,
      position: finalPos,
      confidence: 0.99
    };
  });

  if (brackets.length > 0) {
    cleanLyrics = cleanLyrics.replace(bracketRegex, '').trimEnd();
  }

  return {
    lyrics: cleanLyrics,
    chords: mappedChords
  };
}
