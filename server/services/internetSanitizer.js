/**
 * Internet Song Content Sanitizer for Chordician / Chordex.
 *
 * Rules:
 * 1. Romanized Text Only: Discards native scripts (Tamil, Devanagari, Telugu, Malayalam).
 *    When dual sections exist (In Tamil vs In English), selects the Romanized English section.
 * 2. Strip Metadata & Boilerplate: Headers, navigation, ads, tablatures (e|-...), canvas, metronomes, footers.
 * 3. Preserve Chord Structure:
 *    - Case A: Vertical spatial alignment for separate chord lines above lyrics.
 *    - Case B: Raw format for inline embedded chords (e.g. DEnthappakkam...).
 * 4. Retain Section Markers: [Verse 1], Pre-chorus, Chorus, Stanza:, Verse 2, etc.
 */

// Regex patterns for native / non-Latin regional scripts
const NATIVE_SCRIPTS_REGEX = /[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF]/;

// Musical chord indicators
const CHORD_TOKENS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];

/**
 * Checks if a string contains non-Latin regional script characters.
 * @param {string} text
 * @returns {boolean}
 */
export function hasNativeScript(text) {
  if (!text || typeof text !== 'string') return false;
  return NATIVE_SCRIPTS_REGEX.test(text);
}

/**
 * Removes native script characters from a line, or checks if line is predominantly native script.
 * @param {string} line
 * @returns {string}
 */
export function stripNativeScriptFromLine(line) {
  if (!line || typeof line !== 'string') return '';
  if (!hasNativeScript(line)) return line;

  // Remove parenthesized native script and normalize surrounding single space
  let cleaned = line.replace(/\s*\([^)]*[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF][^)]*\)\s*/g, ' ');
  // Strip any remaining isolated native script characters
  cleaned = cleaned.replace(/[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF]/g, '');
  return cleaned;
}

/**
 * Checks if a line contains guitar tablature diagram notation (e.g. e|-2---3...).
 * @param {string} line
 * @returns {boolean}
 */
export function isGuitarTabLine(line) {
  const trimmed = line.trim();
  if (/^[eEaAdDgGbB]\s*\|\s*[-0-9pbrh\/~|\s]+$/i.test(trimmed)) return true;
  if (/^[-0-9pbrh\/~|xX\s]{6,}$/.test(trimmed) && (trimmed.includes('|') || trimmed.includes('-'))) {
    // Check if line consists mostly of dashes, bars, numbers, x
    const tabChars = (trimmed.match(/[-|0-9xX/]/g) || []).length;
    if (tabChars / trimmed.length > 0.6) return true;
  }
  return false;
}

/**
 * Checks if a line is a section marker (e.g. Pre-chorus, Chorus, [Verse 1], Stanza:).
 * @param {string} line
 * @returns {boolean}
 */
export function isSectionMarkerLine(line) {
  const trimmed = line.trim();
  return (
    /^(?:\[|\*\*)?(?:Intro|Verse|Chorus|Pre-chorus|Bridge|Outro|Ending|Interlude|Stanza|Hook)(?:\s*\d+)?(?::|\b|\*\*|\])/i.test(trimmed) ||
    /^Stanza\s*:?$/i.test(trimmed) ||
    /^Pre-chorus$/i.test(trimmed) ||
    /^Chorus$/i.test(trimmed) ||
    /^Verse\s*\d+$/i.test(trimmed)
  );
}

/**
 * Strips HTML tags while preserving line breaks and horizontal spacing.
 * @param {string} html
 * @returns {string}
 */
export function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';

  let text = html;

  // Remove script and style tags completely
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Convert <br> and <p> and <div> closing to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8211;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/&#8216;/gi, '‘')
    .replace(/&#8217;/gi, '’')
    .replace(/&#8220;/gi, '“')
    .replace(/&#8221;/gi, '”');

  return text;
}

/**
 * Main sanitization router for internet-scraped content.
 * Accepts raw text or HTML and host domain, applies the site-specific and universal rules.
 *
 * @param {string} rawContent - Raw HTML or scraped text
 * @param {string} domain - The source domain (e.g. 'chordsver.com')
 * @returns {string} Clean, Romanized chord & lyric text
 */
export function sanitizeInternetSongContent(rawContent, domain = '') {
  if (!rawContent || typeof rawContent !== 'string') return '';

  // 1. Convert HTML to formatted plain text if needed
  let text = rawContent.includes('<') && rawContent.includes('>') ? htmlToPlainText(rawContent) : rawContent;

  const domainLower = String(domain || '').toLowerCase();

  // 2. Dispatch domain-specific handling
  if (domainLower.includes('chordsver')) {
    return sanitizeChordsverContent(text);
  }
  if (domainLower.includes('thegodsmusic')) {
    return sanitizeTheGodsMusicContent(text);
  }
  if (domainLower.includes('tamilchristiansongs')) {
    return sanitizeTamilChristianSongsContent(text);
  }
  if (domainLower.includes('churchspot')) {
    return sanitizeChurchspotContent(text);
  }
  if (domainLower.includes('songsofpraise')) {
    return sanitizeSongsOfPraiseContent(text);
  }
  if (domainLower.includes('yeshukegeet')) {
    return sanitizeYeshuKeGeetContent(text);
  }

  // 3. Generic fallback sanitizer
  return sanitizeGenericInternetContent(text);
}

/**
 * Sanitizer for chordsver.com
 */
export function sanitizeChordsverContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;
  let inGuitarTab = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Stop conditions
    if (/^(?:SONGWRITER\s*:|ARTIST INFO|©\s*\d+|All rights reserved|Related chords|Leave a Reply)/i.test(trimmed)) {
      break;
    }

    // Start conditions: Key indicator or first chord line
    if (!started) {
      if (/^KEY\s*:\s*[A-G]/i.test(trimmed)) {
        // We can skip the "KEY: D" header or let the next line start the song
        started = true;
        continue;
      }
      if (/^[A-G][#b]?(?:maj|min|m|M|7|9|sus|dim|aug)?(?:\s+[A-G][#b]?.*)?$/.test(trimmed) && trimmed.length < 40) {
        started = true;
      } else if (/^(?:D|G|A|C|E|F|B|Em|Am|Dm|Bm|F#m)\b/.test(trimmed) && !trimmed.includes('Difficulty') && !trimmed.includes('BPM:')) {
        started = true;
      }
    }

    if (!started) continue;

    // Filter headers/controls if they appear after start
    if (/^(?:Difficulty\s*:|Language\s*:|BPM\s*:|Play Metronome|Font Size|Hide Chords|Dark Mode|Select Key|Transpose|Speed\s*:)/i.test(trimmed)) {
      continue;
    }

    // Guitar tab filter
    if (isGuitarTabLine(trimmed)) {
      inGuitarTab = true;
      continue;
    }
    if (inGuitarTab && isGuitarTabLine(trimmed)) continue;
    inGuitarTab = false;

    // Discard any native script
    if (hasNativeScript(trimmed)) {
      const romanized = stripNativeScriptFromLine(raw);
      if (romanized.trim()) cleanLines.push(romanized);
      continue;
    }

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Sanitizer for thegodsmusic.com
 * Handles dual Tamil vs English sections: extracts ONLY the English/Romanized section.
 */
export function sanitizeTheGodsMusicContent(text) {
  const lines = text.split(/\r?\n/);
  let englishStartIndex = -1;
  let englishStopIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Look for "Chords in English" heading
    if (/^(?:#{1,3}\s*)?.+?(?:Keyboard|Guitar|Piano)?\s*Chords\s+in\s+English\b/i.test(trimmed)) {
      englishStartIndex = i + 1;
      continue;
    }
  }

  // Fallback: If no explicit heading, locate first line with English transliterated lyrics + chords after any Tamil block
  if (englishStartIndex === -1) {
    let passedTamil = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (hasNativeScript(trimmed)) {
        passedTamil = true;
        continue;
      }
      if (passedTamil && trimmed.length > 5 && !hasNativeScript(trimmed)) {
        if (/^[A-G]/.test(trimmed) || isSectionMarkerLine(trimmed)) {
          englishStartIndex = i;
          break;
        }
      }
    }
  }

  if (englishStartIndex === -1) {
    englishStartIndex = 0;
  }

  // Scan for stop index
  for (let i = englishStartIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (/^(?:Buy Tamil Christian|Buy Chords Book|Search for a song|More Chords|Related chords|Discover more|Advertisements?|Leave a Reply|Copyright|©)\b/i.test(trimmed)) {
      englishStopIndex = i;
      break;
    }
  }

  const selectedLines = englishStopIndex !== -1 ? lines.slice(englishStartIndex, englishStopIndex) : lines.slice(englishStartIndex);
  const cleanLines = [];

  for (const raw of selectedLines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Skip any native script line if it leaked in
    if (hasNativeScript(trimmed)) continue;

    // Skip promo/footer lines
    if (/^(?:Home|Albums|Artists|Notes|Chords|Buy Chords Book|Contact Us)\b/i.test(trimmed)) continue;

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Sanitizer for tamilchristiansongs.in
 */
export function sanitizeTamilChristianSongsContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;
  let inGuitarTab = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Stop conditions
    if (/^(?:Top Artists|Languages|Similar Songs|Related|©\s*\d+|All rights reserved|Leave a Reply)\b/i.test(trimmed)) {
      break;
    }

    // Discard Guitar Tab block
    if (/^.+?Chords\s+Guitar\b/i.test(trimmed) || isGuitarTabLine(trimmed)) {
      inGuitarTab = true;
      continue;
    }
    if (inGuitarTab) {
      if (isGuitarTabLine(trimmed)) continue;
      inGuitarTab = false;
    }

    // Discard native Tamil script lines
    if (hasNativeScript(trimmed)) {
      continue;
    }

    // Start condition: First Romanized line with chords
    if (!started) {
      if (/^[A-G][a-zA-Z0-9#\s\/\(\)]+/.test(trimmed) && trimmed.length >= 10) {
        if (!trimmed.includes('Tamil Christian') && !trimmed.includes('Transpose') && !trimmed.includes('English')) {
          started = true;
        }
      }
    }

    if (!started) continue;

    // Skip player controls & toolbars
    if (/^(?:Transpose|1-2-3|Print|Tamil\s+English|Font Size|Dark Mode)\b/i.test(trimmed)) {
      continue;
    }

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Sanitizer for churchspot.com
 */
export function sanitizeChurchspotContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Stop conditions
    if (/^(?:Related Posts|Share this|Copyright|©\s*\d+|Comments|Leave a comment)\b/i.test(trimmed)) {
      break;
    }

    // Discard native script
    if (hasNativeScript(trimmed)) {
      continue;
    }

    // Start condition
    if (!started) {
      if (/^[A-G][#b]?(?:m|maj|7|sus|dim)?(?:\s+[A-G]|\b)/.test(trimmed) || isSectionMarkerLine(trimmed)) {
        if (!trimmed.includes('Search') && !trimmed.includes('Menu')) {
          started = true;
        }
      }
    }

    if (!started) continue;

    // Skip tab diagrams
    if (isGuitarTabLine(trimmed)) continue;

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Sanitizer for songsofpraise.in
 */
export function sanitizeSongsOfPraiseContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Stop conditions
    if (/^(?:Chords Used\s*:|Donate via|GPay|Net Banking|Related Songs|Footer|©\s*\d+)\b/i.test(trimmed)) {
      break;
    }

    // Discard login/header noise
    if (/^(?:Guest!|Please log in|Language\s*:?|Original Scale\s*:?|Song Details|Scale\s*:?)/i.test(trimmed)) {
      continue;
    }

    // Start conditions
    if (!started) {
      // Look for first chord line or Romanized lyrics line (e.g. "Ab Db Bbm" or "Pavitra aatma aa")
      if (/^[A-G][#b]?(?:m|maj|7|dim|aug)?(?:\s+[A-G][#b]?)*/.test(trimmed) && trimmed.length < 40) {
        started = true;
      } else if (/^[A-Za-z\s,']{6,}$/.test(trimmed) && !trimmed.includes('Lyrics & Chords of')) {
        started = true;
      }
    }

    if (!started) continue;

    // Strip canvas elements or tab notation
    if (trimmed.includes('canvas canvas') || isGuitarTabLine(trimmed)) {
      continue;
    }

    // Strip parenthesized Devanagari script if present in any line
    let sanitizedLine = stripNativeScriptFromLine(raw);
    if (!sanitizedLine.trim()) continue;

    cleanLines.push(sanitizedLine);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Sanitizer for yeshukegeet.com
 */
export function sanitizeYeshuKeGeetContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Stop conditions
    if (/^(?:Chords & Notes Chart|Recent Posts|Leave a Reply|Categories|Archives|©\s*\d+)\b/i.test(trimmed)) {
      break;
    }

    // Discard header info
    if (/^(?:YESHU KE GEET|Strumming Pattern\s*:|Capo\s*:|Chords Used\s*:|CHORDS$)/i.test(trimmed)) {
      continue;
    }
    if (/^.+?-\s*Easy Guitar Chords\b/i.test(trimmed)) {
      continue;
    }

    // Start condition: Pre-chorus, Chorus, Verse 1, or first chord/lyrics line
    if (!started) {
      if (isSectionMarkerLine(trimmed) || /^[A-G][#b]?(?:m|maj|7)?(?:\s+[A-G]|\b)/.test(trimmed) || trimmed.startsWith('**G**') || trimmed.startsWith('**C**')) {
        started = true;
      }
    }

    if (!started) continue;

    // Strip native script if any
    if (hasNativeScript(trimmed)) {
      const sanitized = stripNativeScriptFromLine(raw);
      if (sanitized.trim()) cleanLines.push(sanitized);
      continue;
    }

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Generic fallback sanitizer
 */
export function sanitizeGenericInternetContent(text) {
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let started = false;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (started && cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Skip tab diagrams
    if (isGuitarTabLine(trimmed)) continue;

    // Skip native script
    if (hasNativeScript(trimmed)) {
      const stripped = stripNativeScriptFromLine(raw);
      if (stripped.trim()) cleanLines.push(stripped);
      continue;
    }

    // Skip standard footer / copyright lines
    if (/^(?:©\s*\d+|All rights reserved|Comments|Leave a reply|Privacy Policy|Terms of Service)\b/i.test(trimmed)) {
      break;
    }

    if (!started) {
      if (/^[A-G][#b]?(?:m|maj|7)?/.test(trimmed) || isSectionMarkerLine(trimmed)) {
        started = true;
      }
    }

    if (started) {
      cleanLines.push(raw);
    }
  }

  return cleanLines.length > 0 ? cleanLines.join('\n').trim() : text.trim();
}

/**
 * Validates whether the sanitized text represents a viable chord/lyric sheet.
 * @param {string} text
 * @returns {boolean}
 */
export function isValidChordSheetContent(text) {
  if (!text || typeof text !== 'string') return false;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return false;

  // Must contain Romanized letters
  if (!/[a-zA-Z]/.test(text)) return false;

  // Must contain at least 2 musical chords
  let chordMatches = 0;
  for (const c of CHORD_TOKENS) {
    const regex = new RegExp(`\\b${c}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) chordMatches += matches.length;
    // Also check embedded chords (e.g. DEnthappakkam)
    const embeddedRegex = new RegExp(`[A-G][#b]?(?:m|maj|7)?[A-Z][a-z]+`, 'g');
    const embeddedMatches = text.match(embeddedRegex);
    if (embeddedMatches) chordMatches += embeddedMatches.length;
  }

  return chordMatches >= 2;
}
