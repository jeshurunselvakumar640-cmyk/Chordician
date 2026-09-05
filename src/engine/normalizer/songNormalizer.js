/**
 * Song Normalizer & Adapter to Chordician Editor Model.
 */

import { buildAlignedChordString } from '../core/positionMapper.js';
import { transliterateTamilToTanglish } from '../core/tamilTransliteration.js';

/**
 * Cleans and formats a title string (transliterating Tamil to Tanglish if needed).
 * @param {string} titleStr
 * @returns {string}
 */
function formatTitleResult(titleStr) {
  if (!titleStr) return '';
  let result = titleStr.trim();

  // Strip repetition markers and trailing ellipsis/counters
  result = result
    .replace(/\(\s*[xX]?\d+\s*\)/g, '')
    .replace(/\(\s*[0-9\.\s]+\s*\)/g, '')
    .replace(/\.\.\..*$/, '')
    .replace(/-\s*\d+$/, '')
    .replace(/^[0-9]+[\.\)]\s*/, '')
    .trim();

  if (/[\u0B80-\u0BFF]/.test(result)) {
    result = transliterateTamilToTanglish(result);
  }

  // If phrase contains many words, limit to first 3 words for concise title
  const words = result.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    result = words.slice(0, 3).join(' ');
  } else {
    result = words.join(' ');
  }

  return result;
}

/**
 * Infers a clean song title in Tanglish if in Tamil Unicode, or derives title from first lyric line.
 * @param {import('../core/types.js').ChordicianSection[]} sections
 * @param {string} [explicitTitle]
 * @param {Array} [rawSections]
 * @returns {string}
 */
export function inferTitleFromSections(sections, explicitTitle, rawSections = []) {
  let candidate = (explicitTitle || '').trim();

  if (candidate === 'Imported Song' || candidate === 'Untitled' || candidate === 'Untitled Song' || candidate === 'Unknown') {
    candidate = '';
  }

  // If explicit title is already specified
  if (candidate) {
    if (/[\u0B80-\u0BFF]/.test(candidate)) {
      return transliterateTamilToTanglish(candidate);
    }
    return candidate;
  }

  // Search through raw parsed sections if provided
  for (const sec of rawSections || []) {
    for (const line of sec.lines || []) {
      if (line.lyrics && line.lyrics.trim()) {
        const formatted = formatTitleResult(line.lyrics);
        if (formatted) {
          return formatted;
        }
      }
    }
  }

  // Search through normalized sections
  for (const sec of sections || []) {
    for (const row of sec.rows || []) {
      if (row.type === 'lyrics' && row.content && row.content.trim()) {
        const formatted = formatTitleResult(row.content);
        if (formatted) {
          return formatted;
        }
      }
    }
  }

  return 'Imported Song';
}

/**
 * Converts a ParsedSong intermediate structure into the official Chordician song model.
 * @param {import('../core/types.js').ParsedSong} parsed
 * @param {string} [sourceUrl='']
 * @returns {import('../core/types.js').ChordicianSong}
 */
export function normalizeToChordicianSong(parsed, sourceUrl = '') {
  const artist = (parsed.artist || '').trim();
  const timeSignature = parsed.timeSignature || '4/4';
  const tempo = parsed.tempo ?? null;
  const category = parsed.category || 'Worship';

  const sections = (parsed.sections || []).map((sec, sIdx) => {
    const sectionName = (sec.name || '').trim() || `Section ${sIdx + 1}`;
    const rows = [];
    let rowIdx = 1;

    (sec.lines || []).forEach((line) => {
      const chordContent =
        line.rawChordLine ||
        (line.chords && line.chords.length > 0 ? buildAlignedChordString(line.chords) : '');

      if (chordContent) {
        rows.push({
          id: `r_${sIdx + 1}_${rowIdx++}`,
          type: 'chords',
          content: chordContent
        });
      }

      if (line.lyrics) {
        rows.push({
          id: `r_${sIdx + 1}_${rowIdx++}`,
          type: 'lyrics',
          content: line.lyrics
        });
      }

      if (line.lead) {
        rows.push({
          id: `r_${sIdx + 1}_${rowIdx++}`,
          type: 'lead',
          content: line.lead
        });
      }
    });

    if (rows.length === 0) {
      rows.push({
        id: `r_${sIdx + 1}_1`,
        type: 'chords',
        content: 'C'
      });
      rows.push({
        id: `r_${sIdx + 1}_2`,
        type: 'lyrics',
        content: ''
      });
    }

    return {
      id: sec.id || `sec_${sIdx + 1}`,
      name: sectionName,
      rows
    };
  });

  const title = inferTitleFromSections(sections, parsed.title, parsed.sections);
  const originalKey = inferKeyFromSections(sections, parsed.originalKey);

  const totalLines = sections.reduce((acc, s) => acc + s.rows.length, 0);
  const totalChords = sections.reduce(
    (acc, s) => acc + s.rows.filter(r => r.type === 'chords' && r.content.trim().length > 0).length,
    0
  );

  return {
    title,
    artist,
    originalKey,
    category,
    style: null,
    tempo,
    timeSignature,
    notes: sourceUrl ? `Imported from: ${sourceUrl}` : 'Imported via Chordician Engine',
    sections,
    _chordexMeta: {
      sourceUrl,
      sectionsCount: sections.length,
      linesCount: totalLines,
      chordsCount: totalChords,
      confidence: parsed.confidence ?? 0.95
    }
  };
}

/**
 * Infers the most likely musical key from chords in lyrics/sheet if none specified.
 * @param {import('../core/types.js').ChordicianSection[]} sections
 * @param {string} [explicitKey]
 * @returns {string}
 */
export function inferKeyFromSections(sections, explicitKey) {
  if (explicitKey) {
    const clean = explicitKey.trim();
    const rootMatch = clean.match(/^[A-G][#b]?/i);
    if (rootMatch) {
      const char0 = rootMatch[0].charAt(0).toUpperCase();
      const char1 = rootMatch[0].length > 1 ? (rootMatch[0].charAt(1).toLowerCase() === 'b' ? 'b' : '#') : '';
      return char0 + char1;
    }
  }

  for (const sec of sections || []) {
    for (const row of sec.rows || []) {
      if (row.type === 'chords' && row.content) {
        const tokens = row.content.trim().split(/\s+/);
        for (const token of tokens) {
          const match = token.match(/^[A-G][#b]?/i);
          if (match) {
            const char0 = match[0].charAt(0).toUpperCase();
            const char1 = match[0].length > 1 ? (match[0].charAt(1).toLowerCase() === 'b' ? 'b' : '#') : '';
            return char0 + char1;
          }
        }
      }
    }
  }

  return 'C';
}
