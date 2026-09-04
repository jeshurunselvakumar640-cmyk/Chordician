import { ALL_KEYS } from '../utils/musicConstants.js';
import { findStyle } from '../data/songStyles.js';

/**
 * Validates the raw JSON returned from Gemini Vision / Chordex AI
 */
export function validateChordexData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid or empty song data received.' };
  }

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    return { valid: false, error: 'No musical sections could be detected in this image.' };
  }

  return { valid: true, error: null };
}

/**
 * Constructs an aligned chord string with whitespace padding corresponding to character offsets
 */
export function buildAlignedChordString(chords = []) {
  if (!chords || chords.length === 0) return '';

  // Sort chords by horizontal character position
  const sorted = [...chords].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  let chordLine = '';
  for (const item of sorted) {
    const chordName = (item.chord || '').trim();
    if (!chordName) continue;

    const targetPos = Math.max(0, item.position ?? 0);

    if (chordLine.length < targetPos) {
      chordLine += ' '.repeat(targetPos - chordLine.length);
    } else if (chordLine.length > 0) {
      // Ensure at least 1 space between consecutive or touching chords
      chordLine += ' ';
    }

    chordLine += chordName;
  }

  return chordLine;
}

/**
 * Infers the most likely musical key from detected chords if none was provided
 */
export function inferOriginalKey(sections, providedKey) {
  if (providedKey && ALL_KEYS.includes(providedKey.trim())) {
    return providedKey.trim();
  }

  // Find first non-empty chord in first section
  for (const section of sections || []) {
    for (const line of section.lines || []) {
      if (line.chords && line.chords.length > 0) {
        const firstChord = line.chords[0].chord || '';
        const rootMatch = firstChord.match(/^[A-Ga-g][#b]?/);
        if (rootMatch) {
          const root = rootMatch[0].toUpperCase();
          if (ALL_KEYS.includes(root)) {
            return root;
          }
        }
      }
    }
  }

  return 'C'; // Default fallback
}

/**
 * Converts Chordex AI structured JSON into the existing Chordician Song Editor format
 */
export function convertChordexToChordician(chordexData) {
  if (!chordexData) return null;

  const title = (chordexData.title || '').trim() || 'Imported Chord Sheet';
  const artist = (chordexData.artist || '').trim() || '';
  const originalKey = inferOriginalKey(chordexData.sections, chordexData.originalKey);
  const category = 'Worship';

  // Handle detected style safely without inventing styles
  let validatedStyle = null;
  if (chordexData.style && typeof chordexData.style === 'object') {
    const matched = findStyle(chordexData.style.category, chordexData.style.name);
    if (matched) {
      validatedStyle = {
        category: matched.category,
        name: matched.name,
        churchStyleNumber: matched.churchStyleNumber,
        keyboardStyleNumber: matched.keyboardStyleNumber
      };
    } else if (chordexData.style.name && chordexData.style.category) {
      validatedStyle = {
        category: chordexData.style.category,
        name: chordexData.style.name,
        churchStyleNumber: chordexData.style.churchStyleNumber || '',
        keyboardStyleNumber: chordexData.style.keyboardStyleNumber || null
      };
    }
  }

  const sections = (chordexData.sections || []).map((sec, sIdx) => {
    const sectionName = (sec.name || '').trim() || `Section ${sIdx + 1}`;
    const rows = [];

    (sec.lines || []).forEach((line, lIdx) => {
      const lineLyrics = (line.lyrics || '').trim();
      const lineChords = buildAlignedChordString(line.chords);

      // If line has chords, add chords row
      if (lineChords) {
        rows.push({
          id: `r_${sIdx}_${lIdx}_chords`,
          type: 'chords',
          content: lineChords
        });
      }

      // If line has lyrics, add lyrics row
      if (lineLyrics) {
        rows.push({
          id: `r_${sIdx}_${lIdx}_lyrics`,
          type: 'lyrics',
          content: lineLyrics
        });
      }
    });

    // Fallback row if section is completely empty
    if (rows.length === 0) {
      rows.push({
        id: `r_${sIdx}_empty`,
        type: 'chords',
        content: ''
      });
    }

    return {
      id: `sec_${sIdx + 1}`,
      name: sectionName,
      rows
    };
  });

  return {
    title,
    artist,
    originalKey,
    category,
    style: validatedStyle,
    tempo: null,
    timeSignature: '4/4',
    notes: 'Imported via Chordex AI Vision',
    sections,
    // Keep source metadata
    _chordexMeta: {
      overallConfidence: chordexData.overallConfidence || 0.95,
      sectionsCount: sections.length,
      linesCount: (chordexData.sections || []).reduce((acc, s) => acc + (s.lines?.length || 0), 0),
      chordsCount: (chordexData.sections || []).reduce((acc, s) =>
        acc + (s.lines || []).reduce((lAcc, l) => lAcc + (l.chords?.length || 0), 0), 0)
    }
  };
}
