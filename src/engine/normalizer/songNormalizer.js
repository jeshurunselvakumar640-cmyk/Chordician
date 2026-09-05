/**
 * Song Normalizer & Adapter to Chordician Editor Model.
 */

import { buildAlignedChordString } from '../core/positionMapper.js';

/**
 * Converts a ParsedSong intermediate structure into the official Chordician song model.
 * @param {import('../core/types.js').ParsedSong} parsed
 * @param {string} [sourceUrl='']
 * @returns {import('../core/types.js').ChordicianSong}
 */
export function normalizeToChordicianSong(parsed, sourceUrl = '') {
  const title = (parsed.title || '').trim() || 'Imported Song';
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
 * Infers the most likely musical key from the first chord occurrence if none specified.
 * @param {import('../core/types.js').ChordicianSection[]} sections
 * @param {string} [explicitKey]
 * @returns {string}
 */
export function inferKeyFromSections(sections, explicitKey) {
  if (explicitKey) {
    const clean = explicitKey.trim().toUpperCase();
    const rootMatch = clean.match(/^[A-G][#B]?/);
    if (rootMatch) {
      const normalizedRoot = rootMatch[0].charAt(0) + (rootMatch[0].charAt(1) === 'B' ? 'b' : rootMatch[0].charAt(1) || '');
      return normalizedRoot;
    }
  }

  for (const sec of sections) {
    for (const row of sec.rows) {
      if (row.type === 'chords' && row.content) {
        const tokens = row.content.trim().split(/\s+/);
        for (const token of tokens) {
          const match = token.match(/^[A-G][#b]?/);
          if (match) {
            return match[0];
          }
        }
      }
    }
  }

  return 'C';
}
