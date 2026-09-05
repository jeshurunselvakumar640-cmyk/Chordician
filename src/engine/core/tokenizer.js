/**
 * Character-aware multi-language tokenizer for Chordician.
 * Parses input character-by-character supporting attached chords, inline bracketed chords,
 * Indic scripts (Tamil, Hindi), Latin text, numbers, and musical repetition notation.
 */

import { isChord, matchChordPrefix, normalizeChordString } from './chordDetector.js';
import { removeEmojis } from './lyricDetector.js';

/**
 * Tokenizes a single line of text into chord and lyric segments with exact lyric offset positions.
 * @param {string} rawLine
 * @returns {{
 *   originalLine: string,
 *   lyrics: string,
 *   chords: Array<{ chord: string, position: number, confidence: number }>,
 *   isSectionHeader: boolean,
 *   isChordOnly: boolean
 * }}
 */
export function tokenizeLine(rawLine) {
  let line = removeEmojis(rawLine);
  const trimmed = line.trim();

  if (!trimmed) {
    return {
      originalLine: rawLine,
      lyrics: '',
      chords: [],
      isSectionHeader: false,
      isChordOnly: false
    };
  }

  // 1. Check for Inline Bracketed Chords e.g. [Dm]Amazing Grace [Am]How sweet or empty brackets []
  if (/\[.*?\]|\(.*?\)/.test(line)) {
    return parseInlineBracketedLine(line);
  }

  // 2. Character-by-character scan for attached / glued chords (e.g. DmMaravaamal, AmA#Manathaara)
  let reconstructedLyrics = '';
  const chords = [];

  let i = 0;
  while (i < line.length) {
    const char = line[i];

    // Handle whitespace
    if (/\s/.test(char)) {
      reconstructedLyrics += char;
      i++;
      continue;
    }

    // Check if remaining substring starts with a chord prefix
    const sub = line.substring(i);
    const chordMatch = matchChordPrefix(sub);

    if (chordMatch) {
      const chordValue = normalizeChordString(chordMatch.chord);
      const currentLyricPosition = reconstructedLyrics.length;

      chords.push({
        chord: chordValue,
        position: currentLyricPosition,
        confidence: 0.98
      });

      i += chordMatch.length;

      // Handle any whitespace immediately following the chord
      while (i < line.length && line[i] === ' ') {
        i++;
      }
      continue;
    }

    // Otherwise consume character as lyric
    reconstructedLyrics += char;
    i++;
  }

  const cleanLyrics = reconstructedLyrics.trimEnd();

  return {
    originalLine: rawLine,
    lyrics: cleanLyrics,
    chords,
    isSectionHeader: false,
    isChordOnly: cleanLyrics.length === 0 && chords.length > 0
  };
}

/**
 * Parses inline bracketed notations like "[Dm]Amazing [Am]Grace" into lyrics and positioned chords.
 * @param {string} line
 */
function parseInlineBracketedLine(line) {
  let reconstructedLyrics = '';
  const chords = [];

  let i = 0;
  while (i < line.length) {
    const ch = line[i];

    if (ch === '[' || ch === '(') {
      const closeBracket = ch === '[' ? ']' : ')';
      const closeIdx = line.indexOf(closeBracket, i + 1);

      if (closeIdx !== -1 && closeIdx - i <= 14) {
        const candidate = line.substring(i + 1, closeIdx).trim();
        if (isChord(candidate, true)) {
          chords.push({
            chord: normalizeChordString(candidate),
            position: reconstructedLyrics.length,
            confidence: 0.99
          });
          i = closeIdx + 1;
          continue;
        } else if (candidate.length === 0) {
          // Empty bracket marker like [] or [ ] or ()
          i = closeIdx + 1;
          continue;
        }
      }
    }

    reconstructedLyrics += ch;
    i++;
  }

  return {
    originalLine: line,
    lyrics: reconstructedLyrics.trimEnd(),
    chords,
    isSectionHeader: false,
    isChordOnly: reconstructedLyrics.trim().length === 0 && chords.length > 0
  };
}
