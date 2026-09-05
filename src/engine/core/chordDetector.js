/**
 * Robust, syntax-aware musical chord detector for Chordician.
 */

// Common English/Tamil romanized words that could collide with 1-2 letter chord symbols
const COMMON_WORD_COLLISIONS = new Set([
  'A', 'I', 'AM', 'IN', 'AN', 'BE', 'DO', 'AT', 'AS', 'HE', 'ME', 'SO', 'GO',
  'NO', 'TO', 'BY', 'MY', 'WE', 'IF', 'OR', 'IS', 'IT', 'ON', 'OF', 'FOR', 'AND',
  'THE', 'CAN', 'ALL', 'YOU', 'ARE', 'SEE', 'DAM', 'MAN', 'NAN', 'EN', 'UN'
]);

/**
 * Normalizes Unicode accidentals (e.g. ♯ -> #, ♭ -> b) and trims whitespace.
 * @param {string} chord
 * @returns {string}
 */
export function normalizeChordString(chord) {
  if (!chord || typeof chord !== 'string') return '';
  return chord
    .trim()
    .replace(/\u266F|\uD834\uDD2A|\u266D/g, (match) => {
      if (match === '\u266F' || match === '\uD834\uDD2A') return '#';
      if (match === '\u266D') return 'b';
      return match;
    });
}

// Regex for single chord token (e.g. C, Dm, F#m7, Bsus4, Cadd9, G13, C/E, C7/Am)
const SINGLE_CHORD_REGEX =
  /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add|\+|-|°|o)?[0-9]*(?:sus[24]?|add[0-9]+|b5|#5|#9|b9|#11)?(?:\/[A-G][#b]?(?:m|maj|min)?[0-9]*)?$/;

/**
 * Validates whether a token string is a valid musical chord.
 * @param {string} token Candidate chord string
 * @param {boolean} [strict=false] If true, rejects common English word collisions unless capitalized explicitly
 * @returns {boolean}
 */
export function isChord(token, strict = false) {
  if (!token || typeof token !== 'string') return false;
  const clean = normalizeChordString(token);
  if (clean.length === 0 || clean.length > 14) return false;

  // Root must be capital [A-G]
  if (!/^[A-G]/.test(clean)) return false;

  // Filter out Roman numerals or arbitrary letter sequences like "Abc", "Dec"
  if (strict) {
    const upper = clean.toUpperCase();
    if (COMMON_WORD_COLLISIONS.has(upper) && clean.length <= 3 && !clean.includes('#') && !clean.includes('/')) {
      if (clean === 'A' || clean === 'Am') {
        return clean === 'A' || clean === 'Am';
      }
      return false;
    }
  }

  return SINGLE_CHORD_REGEX.test(clean);
}

/**
 * Checks if a string starts with a valid chord prefix in attached/glued chord lines.
 * Example: "DmMaravaamal" -> { chord: "Dm", length: 2 }
 * Example: "Amazing" -> null (not chord "A" + "mazing")
 * @param {string} text
 * @returns {{ chord: string, length: number } | null}
 */
export function matchChordPrefix(text) {
  if (!text || text.length === 0) return null;
  const normalized = normalizeChordString(text);

  // Must start with capital root A-G
  if (!/^[A-G]/.test(normalized)) return null;

  // Candidate prefix lengths to test from longest to shortest
  const maxLen = Math.min(12, normalized.length);
  for (let len = maxLen; len >= 1; len--) {
    const candidate = normalized.substring(0, len);
    if (isChord(candidate, true)) {
      const remainder = normalized.substring(len);
      if (remainder.length === 0) {
        return { chord: candidate, length: len };
      }

      // Check boundary conditions:
      // 1. If candidate is single letter root without accidental (e.g. "A", "C", "G"):
      if (/^[A-G]$/.test(candidate)) {
        // If remainder is lowercase ASCII letters, this is an English word (e.g. "Amazing", "Grace", "Come")
        if (/^[a-z]/.test(remainder)) {
          continue;
        }
        // Valid if followed by Capital letter (e.g. "CAmazing"), Indic script (e.g. "Cபாடல்"), whitespace, or punctuation
        if (/^[A-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s\[\]\(\)\-—.,!?:;]/.test(remainder)) {
          return { chord: candidate, length: len };
        }
        continue;
      }

      // 2. If candidate is minor (e.g. "Dm", "Am", "Em"):
      if (/^[A-G]m$/.test(candidate)) {
        // If followed by lowercase letters, it might be an English word like "Email", "Empty", "Ambassador"
        if (/^[a-z]/.test(remainder)) {
          continue;
        }
        // Followed by Capital letter (e.g. "DmAmazing", "AmNinaiththeeraiyaa"), Indic, or whitespace
        if (/^[A-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s\[\]\(\)\-—.,!?:;]/.test(remainder)) {
          return { chord: candidate, length: len };
        }
        // Or consecutive chord like "AmA#"
        if (/^[A-G][#b]/.test(remainder)) {
          return { chord: candidate, length: len };
        }
        continue;
      }

      // 3. For chords with accidental/quality/numbers (e.g. "A#", "Bb", "F#m", "Cadd9", "Gsus4", "C7/Am"):
      if (/^[A-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s\[\]\(\)\-—.,!?:;a-z]/.test(remainder)) {
        return { chord: candidate, length: len };
      }
    }
  }

  return null;
}

/**
 * Extracts all valid chord tokens and their 0-based character start indices from a line.
 * @param {string} line
 * @returns {Array<{ chord: string, position: number }>}
 */
export function extractChordsFromLine(line) {
  if (!line || typeof line !== 'string') return [];
  const normalized = normalizeChordString(line);
  const chords = [];

  const tokenRegex = /\S+/g;
  let match;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    const token = match[0];
    const index = match.index;

    const cleanToken = token.replace(/^[\[\(\{<"'`]+|[\]\)\}>"'`,.!?:;]+$/g, '');
    if (cleanToken && isChord(cleanToken, true)) {
      chords.push({
        chord: cleanToken,
        position: index
      });
    }
  }

  return chords;
}

/**
 * Determines whether an entire line consists predominantly of chords (> 70% chord tokens).
 * @param {string} line
 * @returns {boolean}
 */
export function isChordLine(line) {
  if (!line || typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;

  if (/^\[?(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|சரணம்|பல்லவி|அனுபல்லவி|Stanza|Refrain)\b/i.test(trimmed)) {
    return false;
  }

  if (/[,.!?;:]\s+[A-Za-z\u0B80-\u0BFF\u0900-\u097F]/.test(trimmed)) {
    return false;
  }

  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    const clean = token.replace(/^[\[\(\{<"'`]+|[\]\)\}>"'`,.!?:;]+$/g, '');
    if (isChord(clean, true)) {
      chordCount++;
    }
  }

  return chordCount / tokens.length >= 0.7;
}
