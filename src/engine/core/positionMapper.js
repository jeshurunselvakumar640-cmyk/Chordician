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
 * @returns {{ lyrics: string, chords: Array<{ chord: string, position: number, confidence: number }>, rawChordLine: string, type: string }}
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
    chords: mappedChords,
    rawChordLine: chordLine,
    type: cleanLyrics ? 'lyric_with_chords' : 'chords_only'
  };
}

const PHRASE_STARTERS = [
  'மாட்சிமை', 'துதியும்', 'தூயவர்', 'அன்பர்', 'விடுதலை', 'இராஜாக்களாக', 'உமக்கென',
  'நோக்கிப்', 'வானமும்', 'நான்', 'காக்கும்', 'இஸ்ரவேலைக்', 'எந்நாளும்', 'எனது',
  'பகலினிலும்', 'தயவாய்', 'தேவனே', 'பெலத்தால்', 'கிருபையால்', 'எனக்குச்', 'எப்படி'
];

const PHRASE_ENDERS = [
  'உமக்கன்றோ', 'செய்தீர்', 'சொல்வேன்', 'பார்க்கின்றேன்', 'பார்த்தேன்', 'விடமாட்டார்',
  'உறங்கமாட்டார்', 'தூங்க மாட்டார்', 'இரத்தத்தால்', 'கொடுத்தீர்', 'கொண்டீர்', 'நினைத்தீர்',
  'துதிப்பேன்', 'விடாமல்', 'கட்டினீர்', 'இருந்தேன்', 'இரட்சித்தீரே', 'ஆக்கினீர்',
  'தந்தீர்', 'இருப்பதினால்', 'எனக்கில்லை', 'நின்றால்', 'எழும்பிடுவேன்', 'காக்கின்றார்',
  'இருக்கின்றார்', 'பாதுகாக்கின்றார்', 'படைத்தவரை', 'ஸ்தோத்திரமும்', 'லேவியராக'
];

/**
 * Splits horizontally concatenated chord and lyric lines into natural 2-to-4 bar musical lines.
 * @param {string} chordLine
 * @param {string} lyricLine
 * @returns {Array<{ lyrics: string, chords: Array<{ chord: string, position: number, confidence: number }>, rawChordLine: string, type: string }>}
 */
export function splitHorizontallyConcatenatedLine(chordLine, lyricLine) {
  if (!chordLine || !lyricLine || lyricLine.length < 20) {
    return [pairChordLineWithLyric(chordLine, lyricLine)];
  }

  const words = [];
  let regex = /\S+/g;
  let match;
  while ((match = regex.exec(lyricLine)) !== null) {
    words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }

  if (words.length <= 3) {
    return [pairChordLineWithLyric(chordLine, lyricLine)];
  }

  const splitIndices = new Set();

  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i];
    const nextW = words[i + 1];

    const isStarter = PHRASE_STARTERS.some(s => nextW.word.startsWith(s));
    const isEnder = PHRASE_ENDERS.some(e => w.word.endsWith(e) || w.word === e);
    const isEnAnbar = w.word === 'என்' && nextW.word.startsWith('அன்பர்');

    if (isStarter || isEnder || isEnAnbar) {
      splitIndices.add(nextW.start);
    }
  }

  const sortedPoints = Array.from(splitIndices)
    .filter(idx => idx > 5 && idx < lyricLine.length - 4)
    .sort((a, b) => a - b);

  const filteredPoints = [];
  for (const pt of sortedPoints) {
    if (filteredPoints.length === 0 || pt - filteredPoints[filteredPoints.length - 1] >= 8) {
      filteredPoints.push(pt);
    }
  }

  if (filteredPoints.length === 0) {
    return [pairChordLineWithLyric(chordLine, lyricLine)];
  }

  const segments = [];
  const boundaries = [0, ...filteredPoints, lyricLine.length];
  const allChords = extractChordsFromLine(chordLine);

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];

    const segLyrics = lyricLine.substring(start, end).trim();
    if (!segLyrics) continue;

    const segChords = allChords
      .filter(c => {
        if (i === 0) {
          return c.position < end - 1;
        }
        if (i === boundaries.length - 2) {
          return c.position >= boundaries[i] - 1;
        }
        return c.position >= boundaries[i] - 1 && c.position < end - 1;
      })
      .map(c => ({
        chord: c.chord,
        position: Math.max(0, c.position - start),
        confidence: 0.99
      }));

    segments.push({
      lyrics: segLyrics,
      chords: segChords,
      rawChordLine: buildAlignedChordString(segChords),
      type: 'lyric_with_chords'
    });
  }

  return segments;
}
