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
  /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add|\+|-|°|ø)?[0-9]*(?:sus[24]?|add[0-9]+|b5|#5|#9|b9|#11)?(?:\/[A-G][#b]?(?:m|maj|min)?[0-9]*)?$/;

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
 * Example: "Come" -> null (not chord "Co" + "me" or "C" + "ome")
 * @param {string} text
 * @param {string} [prevChar='']
 * @returns {{ chord: string, length: number } | null}
 */
export function matchChordPrefix(text, prevChar = '') {
  if (!text || text.length === 0) return null;
  const normalized = normalizeChordString(text);

  // Must start with capital root A-G
  if (!/^[A-G]/.test(normalized)) return null;

  // Candidate prefix lengths to test from longest to shortest
  const maxLen = Math.min(12, normalized.length);
  for (let len = maxLen; len >= 1; len--) {
    const candidate = normalized.substring(0, len);
    // Chord symbol itself must not end with whitespace
    if (/\s$/.test(candidate)) continue;

    if (isChord(candidate, true)) {
      const remainder = normalized.substring(len);

      // RULE 1: If remainder starts with lowercase ASCII letter [a-z], this is part of a word (e.g. Come, Amazing, Father, Email, Down)
      // Genuine attached chords are never followed immediately by lowercase letters without space/brackets.
      if (/^[a-z]/.test(remainder)) {
        continue;
      }

      // RULE 2: If candidate is single letter root without accidental (e.g. "A", "C", "E", "G"):
      if (/^[A-G]$/.test(candidate)) {
        // If preceded by a lowercase letter (e.g. "rajavukkE", "anbE", "iyEsu", "ennOtu"):
        // Single letter root attached to lowercase word is a transliteration vowel UNLESS followed immediately by a Capital letter (e.g. "NanCRi") or Indic script
        if (/[a-z]/.test(prevChar)) {
          if (!/^[A-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F]/.test(remainder)) {
            continue;
          }
        }

        // If preceded by an uppercase letter (e.g. 'E' in 'EGNai', 'N' in 'eNGgal', 'D' in 'DHevan'):
        // Single letter root glued inside an uppercase letter cluster is part of a transliterated word/digraph, NOT a chord.
        if (/[A-Z]/.test(prevChar)) {
          continue;
        }

        // Check for uppercase transliteration clusters in remainder (e.g. 'EGNai' where E is followed by G + N + ai):
        // If remainder starts with multiple consecutive capital letters followed by lowercase (e.g. 'GNai' -> G + N + ai),
        // this is a transliterated consonant cluster (like GN / TH / SH / CH), NOT a single letter chord.
        if (/^[A-Z]{2,}[a-z]/.test(remainder)) {
          continue;
        }
      }

      // RULE 3: If candidate ends in capital 'M' (e.g. "A#M", "CM") and remainder starts with lowercase letter:
      if (/M$/.test(candidate) && /^[a-z]/.test(remainder)) {
        continue;
      }

      // Valid boundary: end of string, Capital letter, Indic script, whitespace, numbers, or punctuation
      if (
        remainder.length === 0 ||
        /^[A-Z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s\[\]\(\)\-—.,!?:;0-9]/.test(remainder)
      ) {
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
  const normalized = line.replace(/\u266F|\uD834\uDD2A|\u266D/g, (match) => {
    if (match === '\u266F' || match === '\uD834\uDD2A') return '#';
    if (match === '\u266D') return 'b';
    return match;
  });
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

/**
 * Detects if a text line represents instrumental/melody lead notes
 * (e.g. "EE      AAA     AC#         BA BG       C# C#BAGA",
 *       "C# D   EEE     EF#ED    DC#B     BBBDDC#BA",
 *       "C#C#C#DEEF#F#F#EDEDC#   DDDDDBGGC#BA",
 *       "C4 Eb4 G4", "E4 G4 C5 G4 E4").
 * @param {string} line
 * @returns {boolean}
 */
export function isLeadLine(line) {
  if (!line || typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;

  // If line contains Indic characters (Tamil/Hindi) or bracketed chords, it's not lead
  if (/[\u0B80-\u0BFF\u0900-\u097F]/.test(trimmed)) return false;
  if (/\[[A-G][#b]?/.test(trimmed)) return false;

  // Section headers or metadata
  if (/^\[?(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|சரணம்|பல்லவி|அனுபல்லவி|Stanza|Refrain|Key|Tempo|Scale)\b/i.test(trimmed)) {
    return false;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  // Lead indicators:
  // 1. Run of 2+ capital note letters run together (e.g. EE, AAA, AC#, BA, BG, C#BAGA, EF#ED, DC#B, BBBDDC#BA, GAABC#, C#C#C#DEEF#F#F#EDEDC#, DDDDDBGGC#BA, EEA, AAAB)
  const multiNoteRunRegex = /^(?:[A-G][#b♯♭]?){2,}$/;
  // 2. Note with octave (e.g. C4, Eb4, G4, C#5)
  const octaveNoteRegex = /^[A-G][#b♯♭]?[1-8]$/;
  // 3. Single note (e.g. C, C#, Db, E, F#)
  const singleNoteRegex = /^[A-G][#b♯♭]?$/;

  let leadRunCount = 0;
  let octaveCount = 0;
  let nonNoteWordCount = 0;

  for (const token of tokens) {
    const clean = token.replace(/^[\[\(\{<"'`]+|[\]\)\}>"'`,.!?:;~-]+$/g, '');
    if (!clean) continue;

    if (multiNoteRunRegex.test(clean)) {
      leadRunCount++;
    } else if (octaveNoteRegex.test(clean)) {
      octaveCount++;
    } else if (singleNoteRegex.test(clean)) {
      // single note
    } else if (isChord(clean, true)) {
      // standard chord
    } else {
      if (/^(?:[A-G][#b♯♭]?[1-8]?[\-\/\.\,\s]*)+$/.test(clean)) {
        leadRunCount++;
      } else {
        nonNoteWordCount++;
      }
    }
  }

  return (leadRunCount > 0 || octaveCount >= 2) && nonNoteWordCount < tokens.length * 0.25;
}

