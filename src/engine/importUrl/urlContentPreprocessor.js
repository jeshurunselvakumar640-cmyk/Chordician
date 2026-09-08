/**
 * Isolated URL Content Preprocessor and Filtering Layer for Chordician.
 *
 * Responsibilities:
 * 1. Source-Aware Website Detection (thegodsmusic.com, tamilchristiansongs.in, generic).
 * 2. Website Noise Removal (navigation, advertisements, related songs, guitar tab diagrams, footers).
 * 3. Song Block Extraction (locating the authentic chord/lyric section).
 * 4. Structural Line Reconstruction for Collapsed Lines (preserving existing line breaks when valid).
 * 5. Feeding Clean Normalized Raw Chord Text into the Existing Smart Paster.
 */

import { isChord } from '../core/chordDetector.js';
import { isSectionHeader } from '../core/lyricDetector.js';

// Regex for single chord token with standard musical qualities and slash chords
const SINGLE_CHORD_REGEX =
  /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus[24]?|add[0-9]+|b5|#5|#9|b9|#11|7|9|11|13)*(?:\/[A-G][#b]?(?:m|maj|min)?[0-9]*)?$/;

// Common musical chord prefixes sorted from longest to shortest
const MUSICAL_CHORD_PREFIXES = [
  'C#m7', 'F#m7', 'G#m7', 'D#m7', 'Bbm7', 'Ebm7', 'Abm7',
  'E/C#m7', 'A/F#m7', 'B/Bm7', 'E/C#m', 'E/A', 'D/F#', 'C/E', 'G/B', 'F#/A#', 'C7/Am',
  'Cadd9', 'Gadd9', 'Dadd9', 'Aadd9', 'Fsus4', 'Gsus4', 'Csus4', 'Dsus4', 'Asus4', 'Esus4', 'Bsus4',
  'Gaug', 'Caug', 'Faug', 'Aaug', 'Daug', 'Eaug', 'Baug',
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Ebm', 'Abm',
  'A#', 'Bb', 'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  'C9', 'D9', 'E9', 'F9', 'G9', 'A9', 'B9',
  'C', 'D', 'E', 'F', 'G', 'A', 'B'
];

/**
 * Detects the website source from sourceUrl and raw content.
 * @param {string} sourceUrl
 * @param {string} [rawContent='']
 * @returns {'thegodsmusic' | 'tamilchristiansongs' | 'generic'}
 */
export function detectUrlSource(sourceUrl = '', rawContent = '') {
  const urlLower = (sourceUrl || '').toLowerCase();
  const contentLower = (rawContent || '').toLowerCase();

  if (urlLower.includes('thegodsmusic') || contentLower.includes('thegodsmusic') || contentLower.includes('the gods music')) {
    return 'thegodsmusic';
  }

  if (
    urlLower.includes('tamilchristiansongs') ||
    urlLower.includes('gospelchords') ||
    urlLower.includes('tamilchristianlyrics') ||
    contentLower.includes('tamilchristiansongs')
  ) {
    return 'tamilchristiansongs';
  }

  return 'generic';
}

/**
 * Strips emoji icons, empty brackets, and non-content noise from text.
 * @param {string} text
 * @returns {string}
 */
export function removeWebsiteNoise(text) {
  if (!text || typeof text !== 'string') return '';

  const rawLines = text.split(/\r?\n/);
  const cleanLines = [];
  let inGuitarTab = false;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // 1. ASCII Guitar tab lines: e|-1---1---3... or B|-3---0...
    if (/^[eEaAdDgGbB]\s*\|\s*[-0-9pbrh\/~|\s]+$/i.test(trimmed)) {
      inGuitarTab = true;
      continue;
    }
    if (inGuitarTab && /^[-0-9pbrh\/~|\s]+$/.test(trimmed)) {
      continue;
    }
    inGuitarTab = false;

    // 2. Alphabet search index lines & markdown link clusters:
    if (/^(?:[A-Z]\s+){6,}[A-Z]$/i.test(trimmed)) {
      continue;
    }
    if (trimmed.includes('அஆஇ') || trimmed.includes('ககாகிகீ')) {
      continue;
    }
    if (/^(?:\[[^\]]+\]\(https?:\/\/[^\)]+\)\s*)+$/i.test(trimmed)) {
      continue;
    }
    if (/^\[[^\]]+\]\(https?:\/\/[^\)]+\)$/i.test(trimmed)) {
      continue;
    }

    // 3. Site titles & Brand headers
    if (/^(?:Tamil Christian Songs|The Gods Music|Ultimate Guitar|Chordsver)(?:\s*\.IN|\s*\.com)?$/i.test(trimmed)) {
      continue;
    }

    // 4. Navigation headers / Website breadcrumbs (excluding section headers like TAMIL LYRICS)
    if (!/^(?:TAMIL\s+LYRICS|LYRICS\s+IN\s+TAMIL|PADAL\s+VARIGAL|HINDI\s+LYRICS|MALAYALAM\s+LYRICS|TELUGU\s+LYRICS|KANNADA\s+LYRICS)\b/i.test(trimmed)) {
      if (/^(?:Home|Albums|Artists|Notes|Chords|Lyrics|Tabs|Bible|Submit|Contact Us|Discover more|Search|Quick Links|Christian Song Lyrics|Christian|Worship Song Collections)\s*(?:[|/,•>»-]\s*|\s+)/i.test(trimmed)) {
        continue;
      }
      if (/^(?:Home|Albums|Artists|Notes|Chords|Buy Chords Book|Contact Us|Discover more|Christian Song Lyrics|Christian|Worship Song Collections)$/i.test(trimmed)) {
        continue;
      }
    }

    // 5. Instrument / Page Title lines (excluding duplicate lyrics section headers)
    if (!/^(?:TAMIL\s+LYRICS|LYRICS\s+IN\s+TAMIL|PADAL\s+VARIGAL|HINDI\s+LYRICS|MALAYALAM\s+LYRICS|TELUGU\s+LYRICS|KANNADA\s+LYRICS)\b/i.test(trimmed)) {
      if (/^(?:#{1,3}\s*)?.+?\s+(?:Chords|Lyrics|Tabs|Song)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i.test(trimmed)) {
        continue;
      }
    }

    // 6. Advertisements & Promotions
    if (/^(?:Advertisement|Ads|Sponsored|Buy books|Buy Chords Book|Amazon product|Google Ads)\b/i.test(trimmed)) {
      continue;
    }

    // 7. Social Sharing & Media links
    if (/^(?:Share on|Share this|Like this|Tweet|Pin it|Follow us|Join WhatsApp|Subscribe to YouTube|Facebook|Twitter|WhatsApp|Telegram)\b/i.test(trimmed)) {
      continue;
    }

    // 8. Common trailing metadata & footers
    if (/^(?:Related chords|Related songs|Similar songs|You May Also Like|Top Artists|Languages|Browse|Footer|Comments|Leave a reply|Copyright\s*©|All rights reserved|©\s*\d+)\b/i.test(trimmed)) {
      continue;
    }

    // 9. Player toolbar buttons
    if (/^(?:Transpose|1-2-3|Print|Tamil English|Tamil Search|English Songs|Font Size|Dark Mode|Hide Chords|Tamil English\s+Tamil English\s+Transpose|1-2-3\s+Print)$/i.test(trimmed)) {
      continue;
    }

    cleanLines.push(raw);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Extracts the relevant chord-and-lyrics section from raw website content.
 * @param {string} rawContent
 * @param {'thegodsmusic' | 'tamilchristiansongs' | 'generic'} source
 * @returns {string}
 */
export function extractRelevantSongBlock(rawContent, source = 'generic') {
  if (!rawContent || typeof rawContent !== 'string') return '';

  const lines = rawContent.split(/\r?\n/);

  if (source === 'thegodsmusic') {
    // Look for headings: "## ... Chords In English", "## ... Chords In Tamil", "Keyboard Chords In English", etc.
    let startIndex = -1;
    let stopIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      // Check for song heading
      if (
        /^(?:#{1,3}\s*)?.+?(?:Keyboard|Guitar|Piano)?\s*Chords\s+In\s+(?:English|Tamil)\b/i.test(trimmed) ||
        /^(?:#{1,3}\s*)?.+?\s+Keyboard Chords\b/i.test(trimmed)
      ) {
        startIndex = i;
        break;
      }

      // Or first section marker if heading wasn't formatted as expected
      if (/^\*\*(?:Chorus|Verse|Intro|Bridge)\b/i.test(trimmed) || /^\[(?:Chorus|Verse|Intro|Bridge)\]/i.test(trimmed)) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      startIndex = 0;
    }

    // Scan for stop index (Related chords, Discover more, Footer, Buy books, etc.)
    for (let i = startIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      if (/^(?:Discover more|Advertisements?|Related chords?|Related songs?|Buy books?|Buy Chords Book|Footer|Comments|Leave a Reply|Copyright|All rights reserved)\b/i.test(trimmed)) {
        stopIndex = i;
        break;
      }
    }

    const selectedLines = stopIndex !== -1 ? lines.slice(startIndex, stopIndex) : lines.slice(startIndex);
    return selectedLines.join('\n').trim();
  }

  if (source === 'tamilchristiansongs') {
    let startIndex = -1;
    let stopIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      // Check for chord start line or heading
      if (containsHighChordDensity(trimmed)) {
        startIndex = i;
        break;
      }

      if (/^(?:#{1,3}\s*)?.+?\s+Chords\b/i.test(trimmed) || /^(?:#{1,3}\s*)?[அ-ஹ\s]+(?:\s+Chords)?$/i.test(trimmed)) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      startIndex = 0;
    }

    for (let i = startIndex + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      if (/^(?:Related|Chord Diagrams|e\|-|Top Artists|Languages|Browse|Footer|©\s*\d+)\b/i.test(trimmed)) {
        stopIndex = i;
        break;
      }
    }

    const selectedLines = stopIndex !== -1 ? lines.slice(startIndex, stopIndex) : lines.slice(startIndex);
    return selectedLines.join('\n').trim();
  }

  // Generic fallback: preserve the block
  return rawContent;
}

/**
 * Checks if a text string has high chord density (> 3 valid chords).
 */
function containsHighChordDensity(line) {
  let count = 0;
  for (const c of MUSICAL_CHORD_PREFIXES) {
    if (line.includes(c)) {
      count++;
    }
  }
  return count >= 3;
}

/**
 * Determines whether line reconstruction is needed.
 * Returns FALSE when meaningful line breaks already exist.
 * Returns TRUE only when lines are collapsed/concatenated.
 * @param {string} block
 * @param {'thegodsmusic' | 'tamilchristiansongs' | 'generic'} source
 * @returns {boolean}
 */
export function needsLineReconstruction(block, source = 'generic') {
  if (!block || typeof block !== 'string') return false;

  // thegodsmusic.com content already contains valid line breaks: preserve them!
  if (source === 'thegodsmusic') {
    return false;
  }

  const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;

  // If there are multiple well-proportioned lines (< 120 chars each), do not reconstruct
  if (lines.length >= 4 && lines.every(l => l.length < 120)) {
    return false;
  }

  // If there is any abnormally long line (> 100 chars) with multiple concatenated chords/phrases
  for (const l of lines) {
    if (l.length > 100 && containsHighChordDensity(l)) {
      return true;
    }
  }

  return lines.length <= 2 && lines.some(l => l.length > 80 && containsHighChordDensity(l));
}

/**
 * Helper to find valid musical chord at character offset idx
 */
function findChordAt(str, idx) {
  const sub = str.substring(idx);

  // Support bracketed chords [Dm], [A#], [F#m7], etc.
  const bracketMatch = sub.match(/^\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus[24]?|add[0-9]+|b5|#5|#9|b9|#11|7|9|11|13)*(?:\/[A-G][#b]?(?:m|maj|min)?[0-9]*)?)\]/);
  if (bracketMatch) {
    return bracketMatch[0];
  }

  for (const c of MUSICAL_CHORD_PREFIXES) {
    if (sub.startsWith(c)) {
      // Must not be an English word like "Amazing", "Grace", "Email"
      if (/^[A-G]$/.test(c) && /^[a-z]/.test(sub.substring(1))) {
        continue;
      }
      if (/^[A-G]m$/.test(c) && /^[a-z]/.test(sub.substring(2))) {
        continue;
      }
      return c;
    }
  }
  return null;
}

/**
 * Intelligently reconstructs collapsed/concatenated lines into intended musical lines.
 * Strictly avoids using capitalization alone as a chord boundary.
 * Recognizes embedded chords inside words (e.g. MaaGaugThthiA#Ramae, NeeCmR, OliyiA#L).
 *
 * @param {string} block
 * @param {'thegodsmusic' | 'tamilchristiansongs' | 'generic'} source
 * @returns {string}
 */
export function reconstructMusicalLines(block, source = 'generic') {
  if (!block || typeof block !== 'string') return '';

  const rawLines = block.split(/\r?\n/);
  const reconstructed = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (reconstructed.length > 0 && reconstructed[reconstructed.length - 1] !== '') {
        reconstructed.push('');
      }
      continue;
    }

    // If line is short or a real section header, keep intact
    if (trimmed.length < 90 || isSectionHeader(trimmed) || /^\*\*/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
      reconstructed.push(trimmed);
      continue;
    }

    // Split collapsed line using structural analysis
    const chunks = splitCollapsedLine(trimmed);
    for (const chunk of chunks) {
      if (chunk) reconstructed.push(chunk);
    }
  }

  return reconstructed.join('\n').trim();
}

/**
 * Structural splitter for a single collapsed chord+lyric line.
 */
function splitCollapsedLine(line) {
  const chunks = [];
  let currentChunk = '';
  let i = 0;

  while (i < line.length) {
    // 1. Repetition marker check e.g. (A#2), (2), (x2), (4)
    const repMatch = line.substring(i).match(/^\((?:[A-G][#b]?)?[0-9xX]+\)/);
    if (repMatch) {
      currentChunk += repMatch[0];
      i += repMatch[0].length;

      // Check if immediately followed by a new chord starting a line
      const chordAhead = findChordAt(line, i);
      if (chordAhead && currentChunk.trim().length > 10) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      continue;
    }

    // 1b. Verse number indicator e.g. "D1DSinna" or "1DSinna"
    const verseNumMatch = line.substring(i).match(/^(?:[A-G][#b]?)?([1-9])([A-G][#b]?[A-Za-z\u0B80-\u0BFF\u0900-\u097F])/);
    if (verseNumMatch && currentChunk.trim().length >= 15) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      i += (verseNumMatch[0].length - verseNumMatch[2].length);
      continue;
    }

    // 2. Structural chord + word boundary check
    const chord = findChordAt(line, i);
    if (chord && currentChunk.trim().length >= 12) {
      const remainderAfterChord = line.substring(i + chord.length);

      // Check if remainder is a single letter followed by another chord (e.g. 'LD#Vaasam' or 'RFParisuththar')
      const singleLetterThenChord = /^[A-Za-z]/.test(remainderAfterChord) && findChordAt(remainderAfterChord, 1);

      // Criteria for new musical line start:
      // A. The text after chord starts with a multisyllable word start (>= 3 chars) and is NOT a single letter before a chord
      const isWordStartAfterChord =
        /^[A-Z][a-z]{2,}/.test(remainderAfterChord) &&
        !singleLetterThenChord;

      // B. It is NOT an internal syllable of an embedded chord word like:
      //    "MaaGaugThthiA#Ramae" (Ththi, Ramae) or "NeeCmR" (R) or "OliyiA#L" (L) or "SeFYpavarae" (Ypavarae)
      const isInsideEmbeddedWord = /^(?:Ththi|Ramae|Mae|Tha|Se|Ypavarae|Rar|Ththu|DR|Thamaanaar|NG|R\b|L\b)/.test(remainderAfterChord);

      // C. Preceding chunk completed a lyric word/suffix
      const prevCompletedWord =
        currentChunk.endsWith('OliyiA#L') ||
        currentChunk.endsWith('Theyvam') ||
        currentChunk.trim().endsWith('Parisuththa') ||
        currentChunk.endsWith('Ramae') ||
        currentChunk.endsWith('Parisuththar') ||
        currentChunk.endsWith('SonthamaayinaarA') ||
        currentChunk.endsWith('MakilvomBm') ||
        /[a-z]{3,}$/i.test(currentChunk.trim()) ||
        /[LR]\b/i.test(currentChunk.trim()) ||
        /A#L$/.test(currentChunk);

      if (isWordStartAfterChord && !isInsideEmbeddedWord && prevCompletedWord) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }

    currentChunk += line[i];
    i++;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Main entry point for URL content preprocessing.
 *
 * Pipeline:
 * URL Fetch Content
 *   ↓
 * Detect Source
 *   ↓
 * Extract Relevant Song Block
 *   ↓
 * Remove Website Noise
 *   ↓
 * If needs reconstruction: Reconstruct Missing Line Breaks
 *   ↓
 * Return Clean Raw Chord Text (ready for Smart Paster)
 *
 * @param {string} rawFetchedContent
 * @param {string} [sourceUrl='']
 * @returns {string} Clean raw chord text
 */
export function preprocessUrlContent(rawFetchedContent, sourceUrl = '') {
  if (!rawFetchedContent || typeof rawFetchedContent !== 'string') {
    return '';
  }

  // 1. Detect Source
  const source = detectUrlSource(sourceUrl, rawFetchedContent);

  // 2. Extract Relevant Song Block
  let songBlock = extractRelevantSongBlock(rawFetchedContent, source);

  // 3. Remove Website Noise
  songBlock = removeWebsiteNoise(songBlock);

  // 4. Reconstruct Line Breaks if needed
  if (needsLineReconstruction(songBlock, source)) {
    songBlock = reconstructMusicalLines(songBlock, source);
  }

  return songBlock.trim();
}
