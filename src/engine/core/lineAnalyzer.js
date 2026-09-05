/**
 * Line Structure Analyzer for classifying line types and extracting metadata/sections.
 */

import { isChordLine } from './chordDetector.js';
import { isSectionHeader, formatSectionName, removeEmojis } from './lyricDetector.js';

const SINGLE_NOTE_REGEX = /^[A-G][#b♭♯]?(?:m|maj|min|dim|aug|sus[24]?|add9|7)?$/i;
const TIME_SIG_REGEX = /^(?:[1-9]|1[0-2])\/(?:2|4|8|16)$/;
const KEY_MARKER_REGEX = /^(?:Key|Scale|Pitch)\s*[:|-]?\s*([A-G][#b♭♯]?(?:m|maj|min)?)$/i;
const TEMPO_REGEX = /^(?:Tempo|BPM)\s*[:|-]?\s*(\d{2,3})\s*(?:bpm)?$/i;
const INSTRUMENT_TAB_HEADER_REGEX =
  /^(?:.+?\s+)?(?:Chords|Lyrics|Tabs|Song|Chord Chart|Sheet Music)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i;

const FOOTER_UI_STOP_REGEX =
  /^(?:Your Account|Your Favourites|Your favorites|Interactive chord editor|Click a word|ChordPro source|Edit chords|Version history|Restricted \(copyright\)|Top Artists|Chords Z|Top Songs|Popular Songs|All Artists|Browse by|A B C D E F G|HIJKLMNOPQRSTUVWXYZ|Leave a Reply|Comments|Recent Posts|You May Also Like|Related Posts|Popular Songs|Footer Navigation|Similar Songs|Next Post|Previous Post|Tags:|Categories:|Copyright\s*©|All rights reserved)\b/i;

/**
 * Classifies an array of raw text lines into structured line types,
 * while detecting and filtering transpose ladders, isolated metadata lines, and trailing UI footers.
 * @param {string[]} rawLines
 * @returns {Array<{
 *   raw: string,
 *   trimmed: string,
 *   type: 'SECTION_HEADER' | 'CHORD_LINE' | 'INLINE_BRACKETED' | 'ATTACHED_CHORDS' | 'LYRIC_ONLY' | 'METADATA_KEY' | 'METADATA_TIME' | 'METADATA_TEMPO' | 'METADATA_HEADER' | 'TRANSPOSE_LADDER' | 'EMPTY',
 *   metaKey?: string,
 *   metaValue?: string,
 *   sectionName?: string
 * }>}
 */
export function analyzeLines(rawLines) {
  const result = [];

  // Pass 1: Initial classification and emoji cleaning
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const noEmoji = removeEmojis(raw);
    const trimmed = noEmoji.trim();

    if (!trimmed) {
      result.push({ raw: noEmoji, trimmed: '', type: 'EMPTY' });
      continue;
    }

    if (isSectionHeader(trimmed)) {
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'SECTION_HEADER',
        sectionName: formatSectionName(trimmed)
      });
      continue;
    }

    const keyMatch = trimmed.match(KEY_MARKER_REGEX);
    if (keyMatch) {
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'METADATA_KEY',
        metaValue: keyMatch[1].toUpperCase()
      });
      continue;
    }

    if (TIME_SIG_REGEX.test(trimmed)) {
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'METADATA_TIME',
        metaValue: trimmed
      });
      continue;
    }

    const tempoMatch = trimmed.match(TEMPO_REGEX);
    if (tempoMatch) {
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'METADATA_TEMPO',
        metaValue: tempoMatch[1]
      });
      continue;
    }

    if (INSTRUMENT_TAB_HEADER_REGEX.test(trimmed)) {
      const cleanTitle = trimmed.replace(/\s*(?:[-–—|:]\s*)?(?:Chords|Lyrics|Tabs|Song|Chord Chart|Sheet Music)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i, '').trim();
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'METADATA_HEADER',
        metaValue: cleanTitle
      });
      continue;
    }

    if (FOOTER_UI_STOP_REGEX.test(trimmed)) {
      result.push({
        raw: noEmoji,
        trimmed,
        type: 'TRANSPOSE_LADDER' // Treat as skippable non-song line
      });
      continue;
    }

    if (/\[[A-G][#b]?[^\]\s]*\]|\([A-G][#b]?[^)\s]*\)/.test(trimmed)) {
      result.push({ raw: noEmoji, trimmed, type: 'INLINE_BRACKETED' });
      continue;
    }

    if (isChordLine(noEmoji)) {
      result.push({ raw: noEmoji, trimmed, type: 'CHORD_LINE' });
      continue;
    }

    // Default to lyric line
    result.push({ raw: noEmoji, trimmed, type: 'LYRIC_ONLY' });
  }

  // Pass 2: Detect transpose note ladders (runs of >= 3 consecutive single-note lines)
  let runStart = -1;
  let runCount = 0;

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item.trimmed && SINGLE_NOTE_REGEX.test(item.trimmed)) {
      if (runStart === -1) runStart = i;
      runCount++;
    } else if (item.type === 'EMPTY' && runStart !== -1) {
      continue;
    } else {
      if (runCount >= 3) {
        for (let j = runStart; j < i; j++) {
          if (result[j].trimmed && SINGLE_NOTE_REGEX.test(result[j].trimmed)) {
            result[j].type = 'TRANSPOSE_LADDER';
          }
        }
      }
      runStart = -1;
      runCount = 0;
    }
  }
  if (runCount >= 3) {
    for (let j = runStart; j < result.length; j++) {
      if (result[j].trimmed && SINGLE_NOTE_REGEX.test(result[j].trimmed)) {
        result[j].type = 'TRANSPOSE_LADDER';
      }
    }
  }

  // Pass 3: Check for isolated single-note key marker or duplicate title header before the first song line
  let songStarted = false;
  let songLinesCount = 0;
  let stopIndex = -1;

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item.type === 'EMPTY' || item.type === 'TRANSPOSE_LADDER') continue;

    // Check for terminal footer stop conditions ONLY after a substantial song body has been parsed (>= 8 lines)
    if (songLinesCount >= 8) {
      if (/^(?:Leave a Reply|Comments|Recent Posts|You May Also Like|Related Posts|Popular Songs|Footer Navigation|Similar Songs|Next Post|Previous Post|Tags:|Categories:|Copyright\s*©|All rights reserved)\b/i.test(item.trimmed)) {
        stopIndex = i;
        break;
      }
    }

    // Metadata lines don't trigger song start
    if (item.type === 'METADATA_KEY' || item.type === 'METADATA_TIME' || item.type === 'METADATA_TEMPO' || item.type === 'METADATA_HEADER') {
      continue;
    }

    if (!songStarted) {
      if (item.type === 'SECTION_HEADER') {
        songStarted = true;
        continue;
      }

      // Check if top line is single-note key indicator (e.g. "   F")
      if (item.type === 'CHORD_LINE' && SINGLE_NOTE_REGEX.test(item.trimmed)) {
        item.type = 'METADATA_KEY';
        item.metaValue = item.trimmed.toUpperCase();
        continue;
      }

      songStarted = true;
      songLinesCount++;
    } else {
      songLinesCount++;
    }
  }

  if (stopIndex !== -1) {
    return result.slice(0, stopIndex);
  }

  return result;
}
