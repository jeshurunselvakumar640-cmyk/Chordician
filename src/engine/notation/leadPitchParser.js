/**
 * Lead Note to Scientific Pitch Parser for Western Musical Notation
 *
 * Chordician Lead Octave Convention:
 * - Unmarked notes: c..b -> C3..B3 (octave 3 default)
 * - Single apostrophe: c'..b' -> C4..B4 (octave 4)
 * - Double apostrophe: c''..b'' -> C5..B5 (octave 5)
 * - Triple apostrophe: c'''..b''' -> C6..B6 (octave 6)
 * - Explicit digits: c2 -> C2, a2 -> A2, b2 -> B2, g2 -> G2, c4 -> C4, etc.
 * - Accidentals: f# -> F#3, f#' -> F#4, bb -> Bb3, c#2 -> C#2, eb' -> Eb4
 *
 * Diatonic Offset Reference: Middle C (C4) = 0
 */

import { hasMeaningfulLead } from '../../services/leadNotesService.js';

// Base step diatonic index relative to C (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
const STEP_INDEX = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6
};

// Semitones from C within the octave
const STEP_SEMITONES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

/**
 * Calculates the diatonic offset from Middle C (C4 = 0).
 * Examples:
 * - C4: (4 - 4)*7 + 0 = 0 (Middle C)
 * - D4: 1
 * - E4: 2 (Bottom line of treble staff)
 * - F4: 3
 * - G4: 4
 * - A4: 5
 * - B4: 6 (Middle line of treble staff)
 * - C5: 7
 * - F5: 10 (Top line of treble staff)
 * - C3: (3 - 4)*7 + 0 = -7
 * - C2: (2 - 4)*7 + 0 = -14
 *
 * @param {string} step - 'A'..'G'
 * @param {number} octave - integer
 * @returns {number}
 */
export function calculateDiatonicOffset(step, octave) {
  const s = String(step || 'C').toUpperCase();
  const stepIdx = STEP_INDEX[s] !== undefined ? STEP_INDEX[s] : 0;
  const oct = typeof octave === 'number' && !Number.isNaN(octave) ? octave : 3;
  return (oct - 4) * 7 + stepIdx;
}

/**
 * Parses a single lead note token string into pitch and notation metadata.
 * Returns null if the token is not a note, barline, or rest.
 *
 * @param {string} rawToken - e.g. "c", "f#", "bb", "c'", "c''", "c2", "F#4", "|"
 * @returns {Object|null}
 */
export function parseLeadTokenToPitch(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const token = rawToken.trim();
  if (!token) return null;

  // Handle Barline
  if (token === '|' || token === '||') {
    return {
      type: 'barline',
      raw: token
    };
  }

  // Handle Rest / Dash / Pause
  if (token === '-' || token === '_' || token === '—' || token === '–') {
    return {
      type: 'rest',
      raw: token
    };
  }

  // Clean triple/double sharps while preserving note letter
  const clean = token.replace(/##+|♯♯+/g, '#').replace(/([A-Ga-g])(bb+|♭♭+)/g, '$1b');

  // Regex to extract [Step][Accidental][Apostrophes OR Digits]
  // Matches: 'f', 'F#', 'bb', 'c\'', 'd\'\'', 'c2', 'F#4', 'G#5', 'eb\'', 'A#3'
  const match = clean.match(/^([A-Ga-g])([#b♯♭]?)(['`’]*|\d*)$/);
  if (!match) {
    return null;
  }

  const [, rawStep, rawAcc, rawOctModifier] = match;
  const step = rawStep.toUpperCase();

  // Normalize accidental
  let accidental = '';
  let accidentalType = null;
  if (rawAcc === '#' || rawAcc === '♯') {
    accidental = '#';
    accidentalType = 'sharp';
  } else if (rawAcc === 'b' || rawAcc === '♭') {
    accidental = 'b';
    accidentalType = 'flat';
  }

  // Determine Octave according to Chordician Lead Octave Convention:
  // - Unmarked: Octave 3 (default)
  // - Digit: explicit octave (e.g. '2' -> 2, '4' -> 4)
  // - Apostrophes: 1 apostrophe = 4, 2 apostrophes = 5, 3 = 6, etc.
  let octave = 3; // Default for unmarked notes
  if (/^\d+$/.test(rawOctModifier)) {
    octave = parseInt(rawOctModifier, 10);
  } else if (rawOctModifier && /['`’]+/.test(rawOctModifier)) {
    const apostropheCount = (rawOctModifier.match(/['`’]/g) || []).length;
    octave = 3 + apostropheCount;
  }

  // Clamp octave to safe musical range (0 to 8)
  octave = Math.max(0, Math.min(8, octave));

  const scientificPitch = `${step}${accidental}${octave}`;
  const displayNote = `${step}${accidental}`;
  const diatonicOffset = calculateDiatonicOffset(step, octave);

  // Calculate MIDI Note number (C4 = 60)
  const semitoneInOctave = STEP_SEMITONES[step] + (accidental === '#' ? 1 : (accidental === 'b' ? -1 : 0));
  const midiNote = (octave + 1) * 12 + semitoneInOctave;

  return {
    type: 'note',
    raw: rawToken,
    step,
    accidental,
    accidentalType,
    octave,
    scientificPitch,
    displayNote,
    diatonicOffset,
    midiNote
  };
}

/**
 * Tokenizes a lead line string into individual note tokens and barlines.
 *
 * @param {string} line - e.g. "c f g a b c' | f# g#' a''"
 * @returns {Array<Object>} parsed items
 */
export function parseLeadLine(line) {
  if (!line || typeof line !== 'string') return [];

  // Split on spaces, preserving '|' and notes
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const items = [];

  for (const token of tokens) {
    const parsed = parseLeadTokenToPitch(token);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Scans a song object and extracts all structured lead lines grouped by section.
 * Handles sections, rows, lines, flat rows, or root lead property.
 *
 * @param {Object} song
 * @returns {Array<{ name: string, items: Array<Object>, rawText: string }>}
 */
export function extractLeadSectionsFromSong(song) {
  if (!song || !hasMeaningfulLead(song)) {
    return [];
  }

  const sectionsWithLead = [];

  const extractLeadFromRows = (rows, sectionName = 'Lead Section') => {
    if (!Array.isArray(rows)) return null;
    const items = [];
    const textLines = [];

    for (const row of rows) {
      if (!row) continue;
      if (row.type === 'lead') {
        const rowContent =
          row.displayContent !== undefined
            ? row.displayContent
            : row.content !== undefined
            ? row.content
            : row.text || row.chords || '';
        if (typeof rowContent === 'string' && rowContent.trim().length > 0) {
          const parsed = parseLeadLine(rowContent);
          if (parsed.length > 0) {
            items.push(...parsed);
            textLines.push(rowContent.trim());
          }
        }
      } else if (row.lead && typeof row.lead === 'string' && row.lead.trim().length > 0) {
        const parsed = parseLeadLine(row.lead);
        if (parsed.length > 0) {
          items.push(...parsed);
          textLines.push(row.lead.trim());
        }
      }
    }

    if (items.length > 0) {
      return {
        name: sectionName,
        items,
        rawText: textLines.join('  |  ')
      };
    }
    return null;
  };

  // 1. Check sections array
  if (Array.isArray(song.sections) && song.sections.length > 0) {
    song.sections.forEach((section, idx) => {
      if (!section) return;
      const sectionName = section.name || `Section ${idx + 1}`;

      // Check section.rows
      if (Array.isArray(section.rows)) {
        const secLead = extractLeadFromRows(section.rows, sectionName);
        if (secLead) sectionsWithLead.push(secLead);
      }

      // Check section.lines
      if (Array.isArray(section.lines)) {
        const lineItems = [];
        const lineTexts = [];

        section.lines.forEach((line) => {
          if (!line) return;
          if (line.lead && typeof line.lead === 'string' && line.lead.trim().length > 0) {
            const parsed = parseLeadLine(line.lead);
            if (parsed.length > 0) {
              lineItems.push(...parsed);
              lineTexts.push(line.lead.trim());
            }
          }
          if (Array.isArray(line.rows)) {
            const rowLead = extractLeadFromRows(line.rows, sectionName);
            if (rowLead) {
              lineItems.push(...rowLead.items);
              lineTexts.push(rowLead.rawText);
            }
          }
        });

        if (lineItems.length > 0) {
          sectionsWithLead.push({
            name: sectionName,
            items: lineItems,
            rawText: lineTexts.join('  |  ')
          });
        }
      }
    });
  }

  // 2. Check flat song.rows if no sections produced lead
  if (sectionsWithLead.length === 0 && Array.isArray(song.rows)) {
    const flatLead = extractLeadFromRows(song.rows, 'Lead Melody');
    if (flatLead) sectionsWithLead.push(flatLead);
  }

  // 3. Direct song.lead property fallback
  if (sectionsWithLead.length === 0 && song.lead && typeof song.lead === 'string') {
    const parsed = parseLeadLine(song.lead);
    if (parsed.length > 0) {
      sectionsWithLead.push({
        name: 'Lead Melody',
        items: parsed,
        rawText: song.lead.trim()
      });
    }
  }

  return sectionsWithLead;
}

/**
 * Returns total note count in a song's Lead sections.
 *
 * @param {Object} song
 * @returns {number}
 */
export function getLeadNoteCount(song) {
  const sections = extractLeadSectionsFromSong(song);
  let count = 0;
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.type === 'note') count += 1;
    }
  }
  return count;
}
