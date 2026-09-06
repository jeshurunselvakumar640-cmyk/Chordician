/**
 * Song Content Extraction Layer for Import from URL and Smart Paste.
 * Intelligently isolates and extracts ONLY the actual song lyrics and chords
 * from messy webpage content, preserving raw chord formatting, line breaks,
 * spacing, repetition markers, ellipsis notation, and Unicode lyrics.
 *
 * This is an isolated preprocessing layer that outputs cleaned raw song content
 * directly into the existing Smart Paste -> Chordex pipeline without altering
 * chord reconstruction logic.
 */

import { isChord, isChordLine, matchChordPrefix, extractChordsFromLine } from '../core/chordDetector.js';
import { isSectionHeader, isLyricText, removeEmojis } from '../core/lyricDetector.js';

// Single chord token regex (e.g. D, G, Em, A, Bm, F#m, C#m, Dmaj7, D/F#, etc.)
const SINGLE_CHORD_REGEX = /^[A-G][#b♭♯]?(?:maj|min|m|M|dim|aug|sus[24]?|add[0-9]+|b5|#5|#9|b9|#11|7|9|11|13)?(?:\/[A-G][#b♭♯]?(?:m|maj|min)?[0-9]*)?$/i;

// Time signature regex (e.g. 4/4, 3/4, 6/8)
const TIME_SIG_REGEX = /^(?:[1-9]|1[0-2])\/(?:2|4|8|16)$/;

// Instrument tab / title line regex (e.g. "Paavangal Pokkavae Chords", "Amazing Grace Lyrics & Tabs for Guitar")
const INSTRUMENT_TAB_HEADER_REGEX =
  /^(?:.+?\s+)?(?:Chords|Lyrics|Tabs|Song|Chord Chart|Sheet Music)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i;

// Trailing stop regex - matches footer, comments, related songs, and marketing junk
const FOOTER_UI_STOP_REGEX =
  /^(?:Advertisement|Ads|Ad|Leave a Reply|Comments|Facebook Comments|Recent Posts|You May Also Like|Related Posts|Related Songs|Popular Songs|Footer Navigation|Footer|Similar Songs|Next Post|Previous Post|Tags:|Categories:|Copyright(?:\s*©|\b)|©\s*\d+|All rights reserved|Latest Songs|Churchspot Mobile App|Download from Google Playstore|Google Certified|No data collected|Creating UNLIMITED|Restore Purchase|Save songs for OFFLINE|Subscribe Now|No Thanks|No Ads|Please rate this tab|Rate this tab|Rate this song|More Versions|Other Versions|Versions of this song|Song Title on Youtube|YouTube information|Artist Info|Songwriter|SONGWRITER|Privacy Policy|Terms of Service|Terms and Conditions|Cookie Policy|DMCA|Top Artists|Browse by|Browse|Languages|Your Account|Your Favourites|Your favorites|Interactive chord editor|Click a word|ChordPro source|Edit chords|Version history|Restricted \(copyright\))\b/i;


// Duplicate lyrics section header regex (e.g. "TAMIL LYRICS", "LYRICS IN TAMIL", "PADAL VARIGAL")
const DUPLICATE_LYRICS_HEADER_REGEX =
  /^(?:TAMIL\s+LYRICS|LYRICS\s+IN\s+TAMIL|TAMIL\s+PADAL\s+VARIGAL|PADAL\s+VARIGAL|HINDI\s+LYRICS|MALAYALAM\s+LYRICS|TELUGU\s+LYRICS|KANNADA\s+LYRICS|LYRICS\s+ONLY|LYRICS\s*:|LYRICS\s+AND\s+MEANING|ENGLISH\s+MEANING|MEANING\s*:)\b/i;

/**
 * Checks whether a line is an unrelated header, metadata, or UI control that should be stripped before the song begins.
 * @param {string} trimmed
 * @returns {boolean}
 */
export function isUnrelatedHeaderLine(trimmed) {
  if (!trimmed) return false;

  // Alphabet search navigation: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"
  if (/^(?:[A-Z]\s+){5,}[A-Z]$/i.test(trimmed)) {
    return true;
  }
  // Tamil alphabet sequences: "அஆஇ..."
  if (trimmed.includes('அஆஇ') || trimmed.includes('ககாகிகீ') || (trimmed.length > 35 && !trimmed.includes(' ') && /[அ-ஹ]/.test(trimmed))) {
    return true;
  }

  // Language lists: "Tamil | Malayalam | Hindi | Telugu | Kannada | English"
  if (/^(?:(?:Tamil|Malayalam|Hindi|Kannada|Telugu|English|Marathi|Bengali|Gujarati|Punjabi)\s*(?:[|/,•-]\s*|\s+)){2,}(?:Tamil|Malayalam|Hindi|Kannada|Telugu|English|Marathi|Bengali|Gujarati|Punjabi)?$/i.test(trimmed)) {
    return true;
  }
  if (/^(?:Tamil|Malayalam|Hindi|Kannada|Telugu|English|Tamil English)$/i.test(trimmed)) {
    return true;
  }

  // Navigation breadcrumbs: "Home > Songs > ..." or "Home / Chords & Tabs / ..."
  if (/^(?:Home|Songs|Lyrics|Chords|Tabs|Artists|Events|Submit Chords|Request a Song|Login|Register)\s*[>»/|]\s*/i.test(trimmed)) {
    return true;
  }
  if (/^(?:Home|Chords & Tabs|Artists|Events|Submit Chords|Request a Song|Login|Register|Tabs|Courses|Songbooks|Articles|Forums|Bible)$/i.test(trimmed)) {
    return true;
  }

  // Views, difficulty, ratings: "20,467 views", "Difficulty: Beginner", "Difficulty: Novice"
  if (/^(?:\d+(?:,\d+)?\s*views|Difficulty\s*:\s*.*|Rating\s*:\s*.*|Please rate this tab)$/i.test(trimmed)) {
    return true;
  }

  // Tuning, Capo, Author: "Tuning: E A D G B E", "Capo: No capo", "Author: perfectpraveen", "Language: Tamil"
  if (/^(?:Standard Tuning|Tuning|Capo|Key of the song|Tempo|BPM|Language|Author|Contributor|Tabbed by|Arranged by)\s*[:|-]\s*.*$/i.test(trimmed)) {
    return true;
  }

  // Strumming headers: "## Strumming", "There is no strumming pattern."
  if (/^#{1,3}\s*Strumming\b/i.test(trimmed) || /^There is no strumming pattern\.?$/i.test(trimmed) || /^Strumming Pattern\s*[:|-]/i.test(trimmed)) {
    return true;
  }

  // UI buttons and controls: "BPM", "Font Size", "Hide Chords", "Dark Mode", "Select Key / Transpose", "Speed: 1.0", "Print", "Transpose", "1-2-3"
  if (/^(?:BPM|\d+\s*BPM|Font Size|Hide Chords|Dark Mode|Select Key\s*(?:\/\s*Transpose)?|Speed\s*:\s*[\d.]+|Print|Transpose|1-2-3|Tamil English|Tamil Search|English Songs|Chord Videos\*?|New Song Request\*?|PPT\*?|A\-|A\+)$/i.test(trimmed)) {
    return true;
  }

  // Combined Key and BPM metadata: "KEY: D | [140 BPM]", "Key: G | 4/4"
  if (/^(?:KEY|Key|Scale)\s*:\s*[A-G][#b]?(?:m|maj|min)?(?:\s*\|\s*(?:\[?\d+\s*BPM\]?|(?:[1-9]|1[0-2])\/(?:2|4|8|16)))?$/i.test(trimmed)) {
    return true;
  }

  // Chord list header before song: "## Chords", "Chord Diagrams", "Chords used in this song"
  if (/^#{1,3}\s*Chords\b/i.test(trimmed) || /^Chord Diagrams\b/i.test(trimmed) || /^Chords used in this song\b/i.test(trimmed)) {
    return true;
  }

  // Ascii guitar tab strings: "e|-2---3---0---|", "B|-3---0---0---|"
  if (/^[eEaAdDgGbB]\s*\|\s*[-0-9pbrh\/~|\s]+$/i.test(trimmed)) {
    return true;
  }

  // Standalone URLs: "https://..."
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return true;
  }

  // Marketing blurbs
  if (/^(?:You can unlock some amazing features|If you are already subscribed|No Permissions Required|Small Size|Save songs for|Create UNLIMITED|Restore Purchase|Subscribe Now|No Thanks|No Ads|Google Certified|No data collected|Download from Google Playstore|Churchspot Mobile App)/i.test(trimmed)) {
    return true;
  }

  // Social sharing headers: "Share this:", "Follow us on"
  if (/^(?:Share this:|Share on|Like this:|Tweet|Pin it|Email this|Follow us on|Join our (?:WhatsApp|Telegram) group|Subscribe to our (?:YouTube|channel)|Join (?:WhatsApp|Telegram)|Click here for|Download (?:PDF|Chords|Audio)|Listen on (?:Spotify|Apple Music|Amazon))\b/i.test(trimmed)) {
    return true;
  }

  // Header Title / Instrument lines e.g. "# Paavangal Pokkavae Chords", "by Misc Praise Songs"
  if (/^#{1,3}\s+.+?\s+(?:Chords|Lyrics|Tabs|Song)$/i.test(trimmed) || /^by\s+[A-Za-z0-9\s.,'&-]+$/i.test(trimmed)) {
    return true;
  }

  // Generic UI words alone on a single line
  if (/^(?:Lyrics|Chords|Bible|Share|Related|Print|Transpose|Download|Guitar|Keyboard|Piano|Search|Menu|Home|About|Contact|Privacy|Terms|DMCA|Advertisement)$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a line qualifies as the beginning of actual song content.
 * @param {string} raw
 * @param {string} trimmed
 * @param {string|null} nextTrimmed
 * @returns {boolean}
 */
export function isSongStartLine(raw, trimmed, nextTrimmed = null) {
  if (!trimmed) return false;

  // 1. Explicit Section Header: [Verse 1], [Chorus], Verse 1, Chorus, Pallavi, etc.
  if (isSectionHeader(trimmed)) {
    return true;
  }

  // 2. Bracketed chord inline notation: "[D]Paavangal [G]Pokkavae" or "[Verse 1]"
  if (/\[[A-G][#b]?[^\]\s]*\]/.test(trimmed) && isLyricText(trimmed)) {
    return true;
  }

  // 3. Attached chord + lyric: "Dபாவங்கள் போGக்கவே..." or "DmMaravaamal..."
  const prefix = matchChordPrefix(trimmed);
  if (prefix && isLyricText(trimmed)) {
    return true;
  }

  // 4. Separate Chord Line (e.g. "D         G") followed by lyric line (e.g. "Paavangal Pokkavae")
  if (isChordLine(trimmed)) {
    // If next line has lyrics, this is definitely the song start!
    if (nextTrimmed && isLyricText(nextTrimmed) && !isUnrelatedHeaderLine(nextTrimmed)) {
      return true;
    }
    // If chord line has 2 or more distinct chords and isn't a single note ladder
    const parsed = extractChordsFromLine(trimmed);
    if (parsed.length >= 2) {
      return true;
    }
  }

  // 5. Lyric text line that contains musical repetition markers like "(2)", "(4)", "x2"
  if (isLyricText(trimmed) && /(?:\(\s*\d+\s*\)|x\s*\d+|\.\.\.|\–\s*\d+)/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a line marks the end of the song content.
 * @param {string} trimmed
 * @param {number} validSongLinesCount
 * @returns {boolean}
 */
export function isSongStopLine(trimmed, validSongLinesCount = 0) {
  if (!trimmed) return false;

  // Once a song has at least a few lines, stop immediately at known footer/trailing keywords
  if (validSongLinesCount >= 2) {
    if (FOOTER_UI_STOP_REGEX.test(trimmed)) {
      return true;
    }
    if (/^(?:Related|Related Songs|Similar Songs|You May Also Like|More by Artist|Recommended Songs|Top Artists|Languages|Browse|Footer|Comments|Facebook Comments|Please rate this tab|More Versions)\b/i.test(trimmed)) {
      return true;
    }
    if (/^Chord Diagrams\b/i.test(trimmed) || /^Guitar Chords\b/i.test(trimmed) || /^Chord Chart\b/i.test(trimmed)) {
      return true;
    }
    if (/^#{1,3}\s*(?:Chord Diagrams|Related|Comments|More Versions)\b/i.test(trimmed)) {
      return true;
    }
    // Duplicate Lyrics-Only Section (e.g. "TAMIL LYRICS" after Romanized chords)
    if (DUPLICATE_LYRICS_HEADER_REGEX.test(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts and cleans the raw song chords and lyrics from messy website content.
 * Preserves exact chord placement, spacing, line breaks, section headers, and Unicode lyrics.
 *
 * @param {string} rawWebsiteContent - Raw webpage or pasted text
 * @param {Object} [options={}] - Options (metadata capture, etc.)
 * @returns {string} - Cleaned raw song content ready for Smart Paste / Chordex
 */
export function extractSongContent(rawWebsiteContent, options = {}) {
  if (!rawWebsiteContent || typeof rawWebsiteContent !== 'string') {
    return '';
  }

  const rawLines = rawWebsiteContent.split(/\r?\n/);
  const processed = [];

  // Phase 1: Normalize and remove emojis & empty brackets
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const noEmoji = removeEmojis(raw);
    const noBrackets = noEmoji.replace(/\[\s*\]|\(\s*\)/g, '');
    const trimmed = noBrackets.trim();
    processed.push({ raw: noBrackets, trimmed });
  }

  // Phase 2: Detect transpose note ladders (runs of >= 3 consecutive single note lines)
  const isLadder = new Array(processed.length).fill(false);
  let runStart = -1;
  let runCount = 0;

  for (let i = 0; i < processed.length; i++) {
    const { trimmed } = processed[i];
    if (trimmed && SINGLE_CHORD_REGEX.test(trimmed) && !trimmed.includes(' ')) {
      if (runStart === -1) runStart = i;
      runCount++;
    } else if (!trimmed && runStart !== -1) {
      continue;
    } else {
      if (runCount >= 3) {
        for (let j = runStart; j < i; j++) {
          if (processed[j].trimmed && SINGLE_CHORD_REGEX.test(processed[j].trimmed)) {
            isLadder[j] = true;
          }
        }
      }
      runStart = -1;
      runCount = 0;
    }
  }
  if (runCount >= 3) {
    for (let j = runStart; j < processed.length; j++) {
      if (processed[j].trimmed && SINGLE_CHORD_REGEX.test(processed[j].trimmed)) {
        isLadder[j] = true;
      }
    }
  }

  // Phase 3: Identify Song Start Boundary
  let songStartIndex = -1;

  for (let i = 0; i < processed.length; i++) {
    if (isLadder[i]) continue;
    const { raw, trimmed } = processed[i];
    if (!trimmed) continue;

    // Look ahead to find next non-empty line
    let nextTrimmed = null;
    for (let j = i + 1; j < processed.length; j++) {
      if (processed[j].trimmed) {
        nextTrimmed = processed[j].trimmed;
        break;
      }
    }

    if (isSongStartLine(raw, trimmed, nextTrimmed)) {
      songStartIndex = i;
      break;
    }
  }

  // If no clear start was found, fallback to index 0
  if (songStartIndex === -1) {
    songStartIndex = 0;
  }

  // Phase 4: Extract song lines and stop at Song End Boundary
  const cleanLines = [];
  let validSongLinesCount = 0;

  for (let i = songStartIndex; i < processed.length; i++) {
    if (isLadder[i]) continue;
    const { raw, trimmed } = processed[i];

    // Handle empty lines (preserve stanza separation)
    if (!trimmed) {
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // Check Song End Boundary
    if (isSongStopLine(trimmed, validSongLinesCount)) {
      break;
    }

    // Filter noise lines if they appear unexpectedly
    if (isUnrelatedHeaderLine(trimmed) && validSongLinesCount === 0) {
      continue;
    }
    if (FOOTER_UI_STOP_REGEX.test(trimmed)) {
      if (validSongLinesCount >= 2) break;
      continue;
    }

    cleanLines.push(raw);
    validSongLinesCount++;
  }

  let resultText = cleanLines.join('\n').trim();

  // Phase 5: High-Density Fallback if result was unexpectedly small
  if (!resultText || validSongLinesCount < 2) {
    resultText = extractHighestDensitySongBlock(processed);
  }

  return resultText;
}

/**
 * Fallback density-based extractor for unstructured text.
 * Finds the contiguous block with the highest musical chord & lyric density.
 * @param {Array<{ raw: string, trimmed: string }>} processedLines
 * @returns {string}
 */
function extractHighestDensitySongBlock(processedLines) {
  if (!processedLines || processedLines.length === 0) return '';

  const scores = processedLines.map(({ trimmed }) => {
    if (!trimmed) return 0;
    let score = 0;
    if (isChordLine(trimmed)) score += 8;
    if (isSectionHeader(trimmed)) score += 10;
    if (matchChordPrefix(trimmed)) score += 6;
    if (/\[[A-G][#b]?[^\]\s]*\]/.test(trimmed)) score += 6;
    if (isLyricText(trimmed)) score += 2;
    if (isUnrelatedHeaderLine(trimmed) || FOOTER_UI_STOP_REGEX.test(trimmed)) score -= 15;
    return score;
  });

  // Find start and end indices of positive scoring region
  let firstPositive = -1;
  let lastPositive = -1;

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > 0) {
      if (firstPositive === -1) firstPositive = i;
      lastPositive = i;
    }
  }

  if (firstPositive === -1 || lastPositive === -1) {
    // Return all lines that look like text
    return processedLines
      .filter(p => p.trimmed && !isUnrelatedHeaderLine(p.trimmed))
      .map(p => p.raw)
      .join('\n')
      .trim();
  }

  const slice = processedLines.slice(firstPositive, lastPositive + 1);
  const result = [];
  for (const item of slice) {
    if (!item.trimmed) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
    } else if (!isUnrelatedHeaderLine(item.trimmed)) {
      result.push(item.raw);
    }
  }

  return result.join('\n').trim();
}
