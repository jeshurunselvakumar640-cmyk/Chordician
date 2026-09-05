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

  let reconstructedLyrics = '';
  const chords = [];
  let lastChordEnd = -1;

  let i = 0;
  while (i < line.length) {
    const char = line[i];

    // 1. Handle whitespace
    if (/\s/.test(char)) {
      reconstructedLyrics += char;
      i++;
      continue;
    }

    // 2. Check for bracketed expressions e.g. [Dm], (Am), [], [ ], or [Verse 1], (x2)
    if (char === '[' || char === '(') {
      const closeBracket = char === '[' ? ']' : ')';
      const closeIdx = line.indexOf(closeBracket, i + 1);

      if (closeIdx !== -1 && closeIdx - i <= 14) {
        const candidate = line.substring(i + 1, closeIdx).trim();

        // Check if inside bracket is a valid chord
        if (isChord(candidate, true)) {
          const chordValue = normalizeChordString(candidate);
          chords.push({
            chord: chordValue,
            position: reconstructedLyrics.length,
            confidence: 0.99
          });
          i = closeIdx + 1;
          lastChordEnd = i;
          // Handle whitespace immediately following bracketed chord: preserve in lyrics
          if (i < line.length && line[i] === ' ') {
            reconstructedLyrics += ' ';
            while (i < line.length && line[i] === ' ') {
              i++;
            }
          }
          continue;
        } else if (candidate.length === 0) {
          // Empty bracket marker like [] or [ ] - strip from lyrics
          i = closeIdx + 1;
          continue;
        }
      }
      // If not a chord bracket, fall through to process char as lyric (preserves "(x2)", "(2)", etc.)
    }

    // 3. Scan for attached / glued chords (e.g. Amஎல், DmMaravaamal, AmA#Manathaara)
    const canBeChordStart =
      i === 0 ||
      i === lastChordEnd ||
      !/[a-z]/.test(line[i - 1]);

    const sub = line.substring(i);
    const chordMatch = canBeChordStart ? matchChordPrefix(sub) : null;

    if (chordMatch) {
      const chordValue = normalizeChordString(chordMatch.chord);
      const currentLyricPosition = reconstructedLyrics.length;

      chords.push({
        chord: chordValue,
        position: currentLyricPosition,
        confidence: 0.98
      });

      i += chordMatch.length;
      lastChordEnd = i;

      // Handle any whitespace immediately following the chord: preserve in lyrics
      if (i < line.length && line[i] === ' ') {
        reconstructedLyrics += ' ';
        while (i < line.length && line[i] === ' ') {
          i++;
        }
      }
      continue;
    }

    // 4. Otherwise consume character as lyric
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
