/**
 * Chord detection, recognition, and alignment engine for Chordician.
 */

// Comprehensive Chord Regex matching standard, extended, and slash chords (strictly capital root)
export const CHORD_REGEX = /^[A-G](?:#|b)?(?:m|min|minor|maj|major|dim|dim7|aug|sus2|sus4|sus|add9|add11|add2|add4|5|2|4|6|m6|6\/9|7|maj7|maj9|maj11|maj13|m7|min7|m9|m11|m13|7sus4|7b5|7#5|7b9|7#9|9|11|13)?(?:\/[A-G](?:#|b)?)?$/;

// Regex for extracting chords with positions within a line
export const CHORD_FIND_REGEX = /\b[A-G](?:#|b)?(?:m|min|minor|maj|major|dim|dim7|aug|sus2|sus4|sus|add9|add11|add2|add4|5|2|4|6|m6|6\/9|7|maj7|maj9|maj11|maj13|m7|min7|m9|m11|m13|7sus4|7b5|7#5|7b9|7#9|9|11|13)?(?:\/[A-G](?:#|b)?)?\b/g;

// Words that frequently appear in lyrics and might falsely match a chord token
const COMMON_NON_CHORD_WORDS = new Set([
  'A', 'I', 'IN', 'AM', 'ME', 'BE', 'TO', 'DO', 'SO', 'NO', 'ON', 'AT', 'IF',
  'OR', 'IS', 'AS', 'HE', 'WE', 'BY', 'MY', 'UP', 'AN', 'IT', 'US', 'OH', 'AH'
]);

/**
 * Checks if a single word/token is a valid musical chord.
 */
export function isChord(token, isContextChordLine = false) {
  if (!token || typeof token !== 'string') return false;
  const clean = token.trim().replace(/^[,.:;!|()\[\]{}]+|[,.:;!|()\[\]{}]+$/g, '');
  if (!clean) return false;

  // If not explicitly in a chord line, block ambiguous English/lyric words
  if (!isContextChordLine && COMMON_NON_CHORD_WORDS.has(clean.toUpperCase())) {
    // Only allow if it's explicitly capitalized like a chord in a chord context (e.g. "Am", "Em")
    if (clean === 'I' || clean === 'a' || clean === 'A' || clean === 'in' || clean === 'am' || clean === 'Am' && !isContextChordLine) {
      if (clean === 'Am') {
        // Am is very common chord, but if isolated in lowercase it's usually lyrics
        return true;
      }
      return false;
    }
  }

  // Must match chord pattern
  return CHORD_REGEX.test(clean);
}

/**
 * Checks if an entire text line represents a chord line (vs a lyric line).
 */
export function isChordLine(line) {
  if (!line || typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Split tokens by whitespace or chord bar symbols '|'
  const tokens = trimmed.split(/[\s|/\\-]+/).filter(t => t.length > 0);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  let wordCount = 0;

  for (const token of tokens) {
    if (isChord(token, true)) {
      chordCount++;
    } else {
      // Check if token is just punctuation or section numbers
      if (/^[0-9x\-:()|.,/]+$/.test(token)) {
        continue;
      }
      wordCount++;
    }
  }

  const totalRelevantTokens = chordCount + wordCount;
  if (totalRelevantTokens === 0) return false;

  // If all tokens are chords and at least 1 chord exists
  if (wordCount === 0 && chordCount >= 1) return true;

  // If over 60% of tokens are chords
  if (chordCount / totalRelevantTokens >= 0.6) return true;

  return false;
}

/**
 * Extracts chords and their horizontal character position offsets from a chord line.
 */
export function extractChordsFromLine(chordLine) {
  if (!chordLine || typeof chordLine !== 'string') return [];

  const chords = [];
  // Tokenize while preserving index
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(chordLine)) !== null) {
    const rawToken = match[0];
    const position = match.index;

    // Clean surrounding punctuation while adjusting offset
    const leadingPunctMatch = rawToken.match(/^[,.:;!|()\[\]{}]+/);
    const leadingOffset = leadingPunctMatch ? leadingPunctMatch[0].length : 0;
    const cleanToken = rawToken.replace(/^[,.:;!|()\[\]{}]+|[,.:;!|()\[\]{}]+$/g, '');

    if (isChord(cleanToken, true)) {
      chords.push({
        chord: cleanToken,
        position: position + leadingOffset,
        confidence: 0.96
      });
    }
  }

  return chords;
}

/**
 * Parses bracketed inline chords (e.g. "[Dm]Maravaamal [Am]Ninaiththeeraiyaa")
 * into a clean lyric string and positioned chord items.
 */
export function parseInlineBracketedChords(line) {
  if (!line || typeof line !== 'string') {
    return { lyrics: '', chords: [] };
  }

  // Check if line contains [Chord] or (Chord)
  const bracketRegex = /\[([A-G][#b]?[^\]\s]*)\]|\(([A-G][#b]?[^)\s]*)\)/g;
  let cleanLyrics = '';
  const chords = [];
  let lastIndex = 0;
  let match;

  while ((match = bracketRegex.exec(line)) !== null) {
    const chordCandidate = (match[1] || match[2] || '').trim();
    const matchIndex = match.index;

    // Append lyrics before this bracketed chord
    cleanLyrics += line.substring(lastIndex, matchIndex);

    if (isChord(chordCandidate, true)) {
      chords.push({
        chord: chordCandidate,
        position: cleanLyrics.length,
        confidence: 0.98
      });
    } else {
      // If not a chord, keep original text
      cleanLyrics += match[0];
    }

    lastIndex = matchIndex + match[0].length;
  }

  // Append remaining lyrics
  cleanLyrics += line.substring(lastIndex);

  return {
    lyrics: cleanLyrics,
    chords
  };
}

/**
 * Intelligently unbundles glued/attached chords (e.g. "DmMaravaamal", "AmA#Manathaara", "CIthuvarai")
 * into clean lyric characters and positioned chords.
 */
export function parseAttachedChordLine(rawLine) {
  if (!rawLine || typeof rawLine !== 'string') return { lyrics: '', chords: [] };

  // 1. If line already contains bracketed notation [Dm], use bracket parser
  if (/\[[A-G][#b]?[^\]\s]*\]|\([A-G][#b]?[^)\s]*\)/.test(rawLine)) {
    return parseInlineBracketedChords(rawLine);
  }

  // Multi-character chord prefix (e.g. "Dm", "Am", "A#", "F#m", "G7") attached to letters
  const MULTI_CHAR_CHORD_PREFIX = /^([A-G][#b](?:m|min|maj|dim|aug|sus[24]?|add[924]?|[245679]|maj7|m7|min7)?|[A-G](?:m|min|maj|dim|aug|sus[24]?|add[924]?|[245679]|maj7|m7|min7))(?=[A-Za-z\u0B80-\u0BFF\u0900-\u097F])/;
  
  // Single-letter chord ('A'-'G') followed by an UPPERCASE letter or chord separator (e.g. "CIthuvarai", "CElroyee", "DMaravaamal")
  const SINGLE_LETTER_CHORD_PREFIX = /^([A-G])(?=[A-Z\u0B80-\u0BFF\u0900-\u097F])/;

  const tokens = rawLine.split(/(\s+)/);
  let cleanLyrics = '';
  const chords = [];

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      cleanLyrics += token;
      continue;
    }

    let remaining = token;
    let wordClean = '';

    while (remaining.length > 0) {
      // Check for standalone chord token
      if (isChord(remaining, true)) {
        chords.push({
          chord: remaining,
          position: cleanLyrics.length + wordClean.length,
          confidence: 0.95
        });
        break;
      }

      // Check for multi-character chord prefix (e.g. "Dm" in "DmMaravaamal", "Am" in "AmA#Manathaara")
      const multiMatch = remaining.match(MULTI_CHAR_CHORD_PREFIX);
      if (multiMatch && isChord(multiMatch[1], true)) {
        const chordCandidate = multiMatch[1];
        chords.push({
          chord: chordCandidate,
          position: cleanLyrics.length + wordClean.length,
          confidence: 0.95
        });
        remaining = remaining.substring(chordCandidate.length);
        continue;
      }

      // Check for single-letter chord attached to a capitalized word (e.g. "C" in "CIthuvarai")
      const singleMatch = remaining.match(SINGLE_LETTER_CHORD_PREFIX);
      if (singleMatch && isChord(singleMatch[1], true) && remaining.length >= 3) {
        const chordCandidate = singleMatch[1];
        chords.push({
          chord: chordCandidate,
          position: cleanLyrics.length + wordClean.length,
          confidence: 0.95
        });
        remaining = remaining.substring(chordCandidate.length);
        continue;
      }

      wordClean += remaining[0];
      remaining = remaining.substring(1);
    }

    cleanLyrics += wordClean;
  }

  return {
    lyrics: cleanLyrics,
    chords
  };
}

/**
 * Constructs an aligned chord string with whitespace padding corresponding to character offsets
 */
export function buildAlignedChordString(chords = []) {
  if (!chords || chords.length === 0) return '';

  const sorted = [...chords].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  let chordLine = '';
  for (const item of sorted) {
    const chordName = (item.chord || '').trim();
    if (!chordName) continue;

    const targetPos = Math.max(0, item.position ?? 0);

    if (chordLine.length < targetPos) {
      chordLine += ' '.repeat(targetPos - chordLine.length);
    } else if (chordLine.length > 0) {
      chordLine += ' ';
    }

    chordLine += chordName;
  }

  return chordLine;
}
