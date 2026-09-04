import {
  isChordLine,
  extractChordsFromLine,
  parseInlineBracketedChords,
  parseAttachedChordLine,
  buildAlignedChordString,
  isChord
} from './chordParser.js';
import { isSectionHeader, cleanSectionName } from './sectionParser.js';

const ALL_VALID_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
];

/**
 * Normalizes extracted raw text into the official Chordician song data model.
 */
export function normalizeSongData({ title, artist, originalKey, rawText }, sourceUrl = '') {
  const lines = (rawText || '').split(/\r?\n/);

  const sections = [];
  let currentSection = {
    name: 'Verse 1',
    rows: []
  };

  let pendingChordLine = null;
  let sectionIndex = 1;
  let rowIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // 1. Skip completely empty lines if no pending chord line
    if (!trimmedLine) {
      if (pendingChordLine !== null) {
        // Flush pending chord line as standalone chords row
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
        pendingChordLine = null;
      }
      continue;
    }

    // 2. Check for Section Header (e.g. "[Verse 1]", "Chorus:", etc.)
    if (isSectionHeader(trimmedLine)) {
      if (pendingChordLine !== null) {
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
        pendingChordLine = null;
      }

      // If current section has rows, save it before starting new one
      if (currentSection.rows.length > 0) {
        sections.push({
          id: `sec_${sections.length + 1}`,
          name: currentSection.name,
          rows: currentSection.rows
        });
        sectionIndex++;
        rowIndex = 1;
      }

      currentSection = {
        name: cleanSectionName(trimmedLine),
        rows: []
      };
      continue;
    }

    // 3. Check for Inline Bracketed Chords (e.g. "[Dm]Maravaamal [Am]Ninaiththeeraiyaa")
    if (/\[[A-G][#b]?[^\]\s]*\]|\([A-G][#b]?[^)\s]*\)/.test(rawLine)) {
      if (pendingChordLine !== null) {
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
        pendingChordLine = null;
      }

      const inline = parseInlineBracketedChords(rawLine);
      if (inline.chords.length > 0) {
        const chordRowContent = buildAlignedChordString(inline.chords);
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: chordRowContent
        });
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'lyrics',
          content: inline.lyrics
        });
        continue;
      }
    }

    // 4. Check for Attached Chords (e.g. "DmMaravaamal NinaiththeeraiyaaAmA#Manathaara")
    const attached = parseAttachedChordLine(rawLine);
    if (attached.chords.length > 0 && attached.lyrics.trim().length > 0) {
      if (pendingChordLine !== null) {
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
        pendingChordLine = null;
      }

      const chordRowContent = buildAlignedChordString(attached.chords);
      currentSection.rows.push({
        id: `r_${sectionIndex}_${rowIndex++}`,
        type: 'chords',
        content: chordRowContent
      });
      currentSection.rows.push({
        id: `r_${sectionIndex}_${rowIndex++}`,
        type: 'lyrics',
        content: attached.lyrics.trimEnd()
      });
      continue;
    }

    // 5. Check for Chord Line vs Lyric Line (Two-Layer chord-above-lyrics)
    if (isChordLine(rawLine)) {
      if (pendingChordLine !== null) {
        // Two consecutive chord lines -> flush previous as standalone
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
      }
      pendingChordLine = rawLine;
    } else {
      // It's a lyric line
      if (pendingChordLine !== null) {
        // Paired chord line + lyric line!
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'chords',
          content: pendingChordLine
        });
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'lyrics',
          content: rawLine.trimEnd()
        });
        pendingChordLine = null;
      } else {
        // Standalone lyric line (no chords above it)
        currentSection.rows.push({
          id: `r_${sectionIndex}_${rowIndex++}`,
          type: 'lyrics',
          content: rawLine.trimEnd()
        });
      }
    }
  }

  // Flush any final pending chord line
  if (pendingChordLine !== null) {
    currentSection.rows.push({
      id: `r_${sectionIndex}_${rowIndex++}`,
      type: 'chords',
      content: pendingChordLine
    });
  }

  // Push final section
  if (currentSection.rows.length > 0) {
    sections.push({
      id: `sec_${sections.length + 1}`,
      name: currentSection.name,
      rows: currentSection.rows
    });
  }

  // Fallback section if no rows were generated
  if (sections.length === 0) {
    sections.push({
      id: 'sec_1',
      name: 'Verse 1',
      rows: [
        { id: 'r_1_1', type: 'chords', content: 'C   F   G   C' },
        { id: 'r_1_2', type: 'lyrics', content: '' }
      ]
    });
  }

  // Infer Key if missing
  const effectiveKey = inferKey(sections, originalKey);

  return {
    title: (title || 'Imported Web Song').trim(),
    artist: (artist || '').trim(),
    originalKey: effectiveKey,
    category: 'Worship',
    style: null,
    tempo: null,
    timeSignature: '4/4',
    notes: sourceUrl ? `Imported from URL: ${sourceUrl}` : 'Imported via URL',
    sections,
    _chordexMeta: {
      sourceUrl,
      sectionsCount: sections.length,
      linesCount: sections.reduce((acc, s) => acc + s.rows.length, 0),
      chordsCount: sections.reduce((acc, s) =>
        acc + s.rows.filter(r => r.type === 'chords' && r.content.trim().length > 0).length, 0)
    }
  };
}

/**
 * Infers the most likely musical key from the first section's chords if none was detected.
 */
function inferKey(sections, explicitKey) {
  if (explicitKey) {
    const clean = explicitKey.trim().toUpperCase();
    const rootMatch = clean.match(/^[A-G][#B]?/);
    if (rootMatch && ALL_VALID_KEYS.includes(rootMatch[0])) {
      return rootMatch[0];
    }
  }

  for (const sec of sections) {
    for (const row of sec.rows) {
      if (row.type === 'chords' && row.content) {
        const tokens = row.content.trim().split(/\s+/);
        for (const token of tokens) {
          const clean = token.replace(/[^A-Za-z0-9#]/g, '');
          const match = clean.match(/^[A-G][#b]?/);
          if (match && ALL_VALID_KEYS.includes(match[0].toUpperCase())) {
            return match[0].toUpperCase();
          }
        }
      }
    }
  }

  return 'C';
}
