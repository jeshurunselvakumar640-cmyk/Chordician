/**
 * Multi-language lyric, section header, and song annotation detector.
 */

// Section header regex supporting English, Tamil, Hindi, and Indian transliterated terms
export const SECTION_HEADER_REGEX =
  /^(?:\[|\(|\#)?\s*(?:Verse(?:\s*\d+)?|Chorus(?:\s*\d+)?|Bridge(?:\s*\d+)?|Intro(?:\s*\d+)?|Outro(?:\s*\d+)?|Pre-Chorus(?:\s*\d+)?|Hook(?:\s*\d+)?|Interlude(?:\s*\d+)?|Tag(?:\s*\d+)?|Ending|Stanza(?:\s*\d+)?|Refrain|Pallavi|Charanam(?:\s*\d+)?|Anupallavi|சரணம்(?:\s*\d+)?|பல்லவி|அனுபல்லவி|முன்னுரை|स्थायी|अंतरा|मुखड़ा)\s*(?:\]|\)|\:|\-)?$/i;

// Repetition markers (e.g. -2, x2, X2, ...X2, (2), (x2))
export const REPEAT_MARKER_REGEX =
  /(?:\.{2,}\s*)?(?:[-–—\s]?\s*(?:x\s*\d+|\d+\s*x|X\s*\d+|\d+\s*X|\(\s*\d+\s*\)|\(\s*x\s*\d+\s*\)|-\s*\d+|repeat\s+\d+\s+times)\b|\s*-\s*\d+$)/i;

/**
 * Strips all emoji characters and pictogram symbols from a string.
 * @param {string} str
 * @returns {string}
 */
export function removeEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(
    /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
    ''
  );
}

/**
 * Checks if a string is a section header like [Verse 1], Chorus:, சரணம் 1, etc.
 * @param {string} text
 * @returns {boolean}
 */
export function isSectionHeader(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  return SECTION_HEADER_REGEX.test(trimmed);
}

/**
 * Cleans section header string to a standardized title (e.g. "[Chorus]" -> "Chorus").
 * @param {string} text
 * @returns {string}
 */
export function formatSectionName(text) {
  if (!text) return 'Verse 1';
  let clean = text.replace(/^[\[\(\{<#]+|[\]\)\}>:—\-]+$/g, '').trim();

  if (/^(?:hook)$/i.test(clean)) {
    return 'Chorus (Hook)';
  }
  if (/^(?:pallavi|பல்லவி|स्थायी|मुखड़ा)$/i.test(clean)) {
    return 'Chorus (Pallavi)';
  }
  if (/^(?:charanam|சரணம்|अंतरा)(?:\s*(\d+))?$/i.test(clean)) {
    const numMatch = clean.match(/\d+/);
    const num = numMatch ? numMatch[0] : '';
    return num ? `Verse ${num} (Charanam)` : 'Verse (Charanam)';
  }

  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean || 'Verse 1';
}

/**
 * Checks whether a character belongs to Unicode Tamil, Hindi/Devanagari, Telugu, or Malayalam blocks.
 * @param {string} char
 * @returns {boolean}
 */
export function isIndicCharacter(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0B80 && code <= 0x0BFF) || // Tamil
    (code >= 0x0900 && code <= 0x097F) || // Devanagari / Hindi
    (code >= 0x0C00 && code <= 0x0C7F) || // Telugu
    (code >= 0x0D00 && code <= 0x0D7F)    // Malayalam
  );
}

/**
 * Determines whether a text string contains lyric poetry/words.
 * @param {string} text
 * @returns {boolean}
 */
export function isLyricText(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = removeEmojis(text).trim();
  if (clean.length === 0) return false;

  return /[A-Za-z\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F]{2,}/.test(clean);
}
