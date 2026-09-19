/**
 * Vocal Lead Sheet & Pitch/Rhythm Parser for Western Musical Notation
 *
 * Chordician Lead Conventions:
 * - Octaves:
 *   - Unmarked notes: c..b -> C3..B3 (octave 3 default)
 *   - Single apostrophe: c'..b' -> C4..B4 (octave 4)
 *   - Double apostrophe: c''..b'' -> C5..B5 (octave 5)
 *   - Explicit digits: c2 -> C2, a2 -> A2, b2 -> B2, g2 -> G2, c4 -> C4, etc.
 *   - Accidentals: f# -> F#3, f#' -> F#4, bb -> Bb3, c#2 -> C#2, eb' -> Eb4
 *
 * - Rhythmic Duration Conventions (Optional Suffix or Object metadata):
 *   - Whole (1): :1 or :w -> duration: 'whole'
 *   - Half (2): :2 or :h -> duration: 'half'
 *   - Quarter (4): :4 or :q -> duration: 'quarter' (default)
 *   - Eighth (8): :8 or :e -> duration: 'eighth'
 *   - Sixteenth (16): :16 or :s -> duration: 'sixteenth'
 *   - Dotted: appending '.' (e.g. :4. or :8.) -> dotted: true
 *   - Ties: ~ or _tie -> tieStart: true
 *
 * Synchronized Vocal Lead Sheet Layers:
 * 1. Chords (above staff)
 * 2. Melody / Rhythm (on 5-line staff with Treble G-clef, notes, stems, beams, ties, dots, rests)
 * 3. Lyrics (below staff with dynamic clearance avoiding ledger line collisions)
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

// Beat lengths relative to quarter note = 1.0
export const DURATION_BEAT_VALUES = {
  whole: 4.0,
  half: 2.0,
  quarter: 1.0,
  eighth: 0.5,
  sixteenth: 0.25
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
 * Parses a single lead note token string into pitch, rhythm, and notation metadata.
 * Returns null if the token is not a note, barline, or rest.
 *
 * @param {string} rawToken - e.g. "c", "f#", "bb", "c'", "c''", "c2", "F#4:8", "G4:4.", "c~", "|"
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

  // Handle Rests (e.g. "-", "-:4", "-:8", "-:2", "-:1", "-:16", "-.")
  if (token.startsWith('-') || token.startsWith('_') || token === '—' || token === '–') {
    let restDuration = 'quarter';
    let isDotted = false;
    if (token.includes(':16') || token.includes(':s')) restDuration = 'sixteenth';
    else if (token.includes(':8') || token.includes(':e')) restDuration = 'eighth';
    else if (token.includes(':2') || token.includes(':h')) restDuration = 'half';
    else if (token.includes(':1') || token.includes(':w')) restDuration = 'whole';
    else if (token.includes(':4') || token.includes(':q')) restDuration = 'quarter';

    if (token.includes('.')) isDotted = true;

    return {
      type: 'rest',
      raw: token,
      duration: restDuration,
      dotted: isDotted,
      beatValue: (DURATION_BEAT_VALUES[restDuration] || 1.0) * (isDotted ? 1.5 : 1.0)
    };
  }

  // Check for Tie Indicator (~ or _tie)
  let isTieStart = false;
  let isTieEnd = false;
  let workToken = token;
  if (workToken.endsWith('~') || workToken.includes('_tie') || workToken.includes('-tie')) {
    isTieStart = true;
    workToken = workToken.replace(/~|_tie|-tie/g, '');
  }

  // Check for explicit Duration suffix (:4, :8, :16, :2, :1, :w, :h, :q, :e, :s, etc.)
  let duration = 'quarter';
  let dotted = false;

  const durationMatch = workToken.match(/:([1248]|16|[whqes])(\.?)$/i);
  if (durationMatch) {
    const durCode = durationMatch[1].toLowerCase();
    if (durCode === '1' || durCode === 'w') duration = 'whole';
    else if (durCode === '2' || durCode === 'h') duration = 'half';
    else if (durCode === '4' || durCode === 'q') duration = 'quarter';
    else if (durCode === '8' || durCode === 'e') duration = 'eighth';
    else if (durCode === '16' || durCode === 's') duration = 'sixteenth';

    if (durationMatch[2] === '.') dotted = true;
    workToken = workToken.substring(0, durationMatch.index);
  }

  // Clean triple/double sharps while preserving note letter
  const clean = workToken.replace(/##+|♯♯+/g, '#').replace(/([A-Ga-g])(bb+|♭♭+)/g, '$1b');

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
  const beatValue = (DURATION_BEAT_VALUES[duration] || 1.0) * (dotted ? 1.5 : 1.0);

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
    midiNote,
    duration,
    dotted,
    tieStart: isTieStart,
    tieEnd: isTieEnd,
    beatValue
  };
}

/**
 * Tokenizes a lead line string into individual note tokens, barlines, and rests.
 *
 * @param {string} line - e.g. "c f g a b c' | f# g#' a''"
 * @returns {Array<Object>} parsed items
 */
export function parseLeadLine(line) {
  if (!line || typeof line !== 'string') return [];

  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const items = [];

  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseLeadTokenToPitch(tokens[i]);
    if (parsed) {
      // If previous item was a tie start, mark this item as tie end if identical pitch
      if (items.length > 0 && items[items.length - 1].tieStart && parsed.type === 'note') {
        if (items[items.length - 1].scientificPitch === parsed.scientificPitch) {
          parsed.tieEnd = true;
        }
      }
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Extracts positioned chord symbols from a chords string or array.
 *
 * @param {string|Array<Object>} chordsData
 * @returns {Array<{ chord: string, position: number }>}
 */
export function extractPositionedChords(chordsData) {
  if (!chordsData) return [];

  if (Array.isArray(chordsData)) {
    return chordsData
      .map((c) => {
        if (typeof c === 'string') return { chord: c.trim(), position: 0 };
        if (c && typeof c.chord === 'string') return { chord: c.chord.trim(), position: c.position || 0 };
        return null;
      })
      .filter(Boolean);
  }

  if (typeof chordsData !== 'string') return [];

  const raw = chordsData.trimEnd();
  if (!raw) return [];

  const list = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    list.push({
      chord: match[0],
      position: match.index
    });
  }
  return list;
}

/**
 * Scans a song object and extracts full Vocal Lead Sheet phrases grouped by section.
 * Each phrase synchronizes:
 * - Chords (Layer 1)
 * - Melody / Staff notes with Rhythm (Layer 2)
 * - Lyrics (Layer 3)
 *
 * @param {Object} song
 * @returns {Array<{ name: string, phrases: Array<{ items: Array<Object>, chords: Array<Object>, rawChords: string, lyrics: string, rawLead: string }>, items: Array<Object> }>}
 */
export function extractLeadSheetSectionsFromSong(song) {
  if (!song || !hasMeaningfulLead(song)) {
    return [];
  }

  const sectionsList = [];

  const processRowsToPhrases = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const phrases = [];

    let currentChordsStr = '';
    let currentChordsList = [];
    let currentLeadStr = '';
    let currentLeadItems = [];
    let currentLyricsStr = '';

    const flushCurrentPhrase = () => {
      if (currentLeadItems.length > 0) {
        phrases.push({
          items: currentLeadItems,
          chords: currentChordsList.length > 0 ? currentChordsList : extractPositionedChords(currentChordsStr),
          rawChords: currentChordsStr.trim(),
          lyrics: currentLyricsStr.trim(),
          rawLead: currentLeadStr.trim()
        });
      }
      currentChordsStr = '';
      currentChordsList = [];
      currentLeadStr = '';
      currentLeadItems = [];
      currentLyricsStr = '';
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;

      if (row.lead || (row.chords && row.lyrics && row.type === undefined)) {
        if (row.lead && typeof row.lead === 'string') {
          const parsed = parseLeadLine(row.lead);
          if (parsed.length > 0) {
            flushCurrentPhrase();
            phrases.push({
              items: parsed,
              chords: extractPositionedChords(row.chords),
              rawChords: Array.isArray(row.chords) ? row.chords.map(c => c.chord || c).join(' ') : String(row.chords || ''),
              lyrics: String(row.lyrics || ''),
              rawLead: row.lead.trim()
            });
            continue;
          }
        }
      }

      const { type = 'chords', displayContent, content, chords, lyrics, text: rowText } = typeof row === 'string' ? { type: 'lyrics', content: row } : row;
      const rawContent = displayContent !== undefined ? displayContent : (content !== undefined ? content : (chords || lyrics || rowText || ''));
      const text = Array.isArray(rawContent) ? rawContent.join('   ') : String(rawContent || '');

      if (type === 'chords') {
        if (currentLeadItems.length > 0) {
          flushCurrentPhrase();
        }
        currentChordsStr = text;
        currentChordsList = extractPositionedChords(row.chords || text);
      } else if (type === 'lead') {
        if (currentLeadItems.length > 0) {
          flushCurrentPhrase();
        }
        currentLeadStr = text;
        currentLeadItems = parseLeadLine(text);
      } else if (type === 'lyrics') {
        currentLyricsStr = text;
        if (currentLeadItems.length > 0) {
          flushCurrentPhrase();
        }
      }
    }

    flushCurrentPhrase();
    return phrases;
  };

  // 1. Check sections array
  if (Array.isArray(song.sections) && song.sections.length > 0) {
    song.sections.forEach((section, idx) => {
      if (!section) return;
      const sectionName = section.name || `Section ${idx + 1}`;
      let phrases = [];

      if (Array.isArray(section.rows)) {
        phrases = processRowsToPhrases(section.rows);
      }

      if (phrases.length === 0 && Array.isArray(section.lines)) {
        const lineRows = [];
        section.lines.forEach((line) => {
          if (!line) return;
          if (line.lead) {
            lineRows.push({ type: 'chords', content: line.chords || line.rawChordLine || '' });
            lineRows.push({ type: 'lead', content: line.lead });
            lineRows.push({ type: 'lyrics', content: line.lyrics || '' });
          } else if (Array.isArray(line.rows)) {
            lineRows.push(...line.rows);
          }
        });
        phrases = processRowsToPhrases(lineRows);
      }

      if (phrases.length > 0) {
        const allItems = [];
        phrases.forEach(p => allItems.push(...p.items));

        sectionsList.push({
          name: sectionName,
          phrases,
          items: allItems
        });
      }
    });
  }

  // 2. Check flat song.rows fallback
  if (sectionsList.length === 0 && Array.isArray(song.rows)) {
    const phrases = processRowsToPhrases(song.rows);
    if (phrases.length > 0) {
      const allItems = [];
      phrases.forEach(p => allItems.push(...p.items));
      sectionsList.push({
        name: 'Vocal Lead Melody',
        phrases,
        items: allItems
      });
    }
  }

  // 3. Direct song.lead property fallback
  if (sectionsList.length === 0 && song.lead && typeof song.lead === 'string') {
    const parsed = parseLeadLine(song.lead);
    if (parsed.length > 0) {
      sectionsList.push({
        name: 'Vocal Lead Melody',
        phrases: [{
          items: parsed,
          chords: [],
          rawChords: '',
          lyrics: '',
          rawLead: song.lead.trim()
        }],
        items: parsed
      });
    }
  }

  return sectionsList;
}

/**
 * Legacy support: returns lead sections with flat items list.
 *
 * @param {Object} song
 * @returns {Array<{ name: string, items: Array<Object>, rawText: string }>}
 */
export function extractLeadSectionsFromSong(song) {
  const sheetSections = extractLeadSheetSectionsFromSong(song);
  return sheetSections.map(sec => ({
    name: sec.name,
    items: sec.items,
    rawText: sec.phrases.map(p => p.rawLead).filter(Boolean).join('  |  ')
  }));
}

/**
 * Returns total note count in a song's Lead sections.
 *
 * @param {Object} song
 * @returns {number}
 */
export function getLeadNoteCount(song) {
  const sections = extractLeadSheetSectionsFromSong(song);
  let count = 0;
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.type === 'note') count += 1;
    }
  }
  return count;
}
