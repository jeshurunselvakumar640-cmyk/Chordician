import {
  SHARP_SCALE,
  FLAT_SCALE,
  NOTE_TO_SEMITONE,
  KEY_SPELLING_PREFERENCE,
  ALL_KEYS
} from '../utils/musicConstants.js';
import { MAJOR_KEY_FAMILIES, MINOR_KEY_FAMILIES } from '../data/keyChordFamilies.js';

// Pre-computed map from targetKey -> array of 12 note spellings for each semitone (0..11)
const KEY_SEMITONE_SPELLING_MAP = {};

const THEORETICAL_NOTE_PATTERN = /^(?:[A-G](?:##|bb|[𝄪𝄫])|B#|E#|Fb|Cb)$/i;

export function isTheoreticalSpelling(note) {
  if (!note || typeof note !== 'string') return false;
  return THEORETICAL_NOTE_PATTERN.test(note.trim());
}

function buildKeySpellingMap(keyFamily) {
  const spelling = new Array(12).fill(null);
  const isFlatPref = KEY_SPELLING_PREFERENCE[keyFamily.key] === 'flat';
  const defaultScale = isFlatPref ? FLAT_SCALE : SHARP_SCALE;

  // 1. Fill defaults
  for (let i = 0; i < 12; i++) {
    spelling[i] = defaultScale[i];
  }

  // 2. Populate exact diatonic notes from the key scale
  if (Array.isArray(keyFamily.scale)) {
    for (const note of keyFamily.scale) {
      const clean = normalizeNoteName(note);
      const st = NOTE_TO_SEMITONE[clean];
      if (st !== undefined) {
        spelling[st] = isTheoreticalSpelling(clean) ? defaultScale[st] : clean;
      }
    }
  }

  return spelling;
}

// Populate for all major and minor keys
[...MAJOR_KEY_FAMILIES, ...MINOR_KEY_FAMILIES].forEach((kf) => {
  if (kf && kf.key) {
    KEY_SEMITONE_SPELLING_MAP[kf.key] = buildKeySpellingMap(kf);
  }
});

/**
 * Normalizes a note or key name (e.g. 'db' -> 'Db', 'c#' -> 'C#', 'e♯' -> 'E#', 'b♭' -> 'Bb')
 */
export function normalizeNoteName(note) {
  if (!note || typeof note !== 'string') return '';
  const trimmed = note.trim()
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b');
  if (trimmed.length === 0) return '';
  const letter = trimmed[0].toUpperCase();
  const accidental = trimmed.slice(1);
  return letter + accidental;
}

/**
 * Extracts root note from a key string (e.g. "C#m" -> "C#", "Ab" -> "Ab")
 */
export function getRootFromKey(key) {
  if (!key) return 'C';
  const cleaned = String(key).trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  const match = cleaned.match(/^[A-Ga-g][#b]?/);
  return match ? normalizeNoteName(match[0]) : 'C';
}

/**
 * Calculates semitone distance from originalKey to targetKey (0 to 11)
 */
export function calculateSemitoneDistance(originalKey, targetKey) {
  const rootFrom = getRootFromKey(originalKey);
  const rootTo = getRootFromKey(targetKey);

  const semitoneFrom = NOTE_TO_SEMITONE[rootFrom] ?? 0;
  const semitoneTo = NOTE_TO_SEMITONE[rootTo] ?? 0;

  let delta = (semitoneTo - semitoneFrom) % 12;
  if (delta < 0) delta += 12;
  return delta;
}

/**
 * Converts a semitone index (0..11) to note name based on destination key or preference
 */
export function semitoneToNoteName(semitone, preferenceOrTargetKey = 'sharp') {
  const normalizedIndex = ((semitone % 12) + 12) % 12;

  // 1. Check if target key has a dedicated key-aware scale mapping
  if (KEY_SEMITONE_SPELLING_MAP[preferenceOrTargetKey]) {
    const candidate = KEY_SEMITONE_SPELLING_MAP[preferenceOrTargetKey][normalizedIndex];
    if (candidate && !isTheoreticalSpelling(candidate)) {
      return candidate;
    }
  }

  // 2. Check if preference is explicitly 'flat' or 'sharp'
  if (preferenceOrTargetKey === 'flat') {
    return FLAT_SCALE[normalizedIndex];
  }
  if (preferenceOrTargetKey === 'sharp') {
    return SHARP_SCALE[normalizedIndex];
  }

  // 3. Fallback to key preference if key was specified without a scale
  const pref = KEY_SPELLING_PREFERENCE[preferenceOrTargetKey] || 'sharp';
  return pref === 'flat' ? FLAT_SCALE[normalizedIndex] : SHARP_SCALE[normalizedIndex];
}

/**
 * Transposes a single note without octave (e.g. "C#" + 2 -> "D#", "F#" - 2 in Key D -> "E")
 */
export function transposeNote(note, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  const normalized = normalizeNoteName(note);
  if (!(normalized in NOTE_TO_SEMITONE)) return note;

  const currentSemitone = NOTE_TO_SEMITONE[normalized];
  const newSemitone = ((currentSemitone + semitoneDelta) % 12 + 12) % 12;
  return semitoneToNoteName(newSemitone, preferenceOrTargetKey);
}

/**
 * Transposes a single chord string (e.g. "Cmaj7", "F#m7/E", "Bb/D", "Eb", "Csus4")
 */
export function transposeChord(chordStr, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!chordStr || typeof chordStr !== 'string') return chordStr;
  const trimmed = chordStr.trim();
  if (!trimmed) return '';

  if (semitoneDelta % 12 === 0) return trimmed;

  // Regex to match: [Root Note][Chord Quality][Optional /Slash Note]
  const chordRegex = /^([A-Ga-g](?:##|bb|[#b♭♯𝄪𝄫])?)([^/]*)(?:\/([A-Ga-g](?:##|bb|[#b♭♯𝄪𝄫])?))?$/;
  const match = trimmed.match(chordRegex);

  if (!match) {
    return trimmed;
  }

  const [, root, quality, bass] = match;
  const transposedRoot = transposeNote(root, semitoneDelta, preferenceOrTargetKey);
  const transposedBass = bass ? transposeNote(bass, semitoneDelta, preferenceOrTargetKey) : null;

  if (transposedBass) {
    return `${transposedRoot}${quality}/${transposedBass}`;
  }
  return `${transposedRoot}${quality}`;
}

/**
 * Transposes a line of chords while preserving spacing/layout
 */
export function transposeChordLine(chordLine, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!chordLine || typeof chordLine !== 'string') return chordLine;
  if (semitoneDelta % 12 === 0) return chordLine;

  const chordTokenRegex = /\b([A-Ga-g](?:##|bb|[#b♭♯𝄪𝄫])?(?:[^\s/|)}\]–—\-,;:]*)(?:\/[A-Ga-g](?:##|bb|[#b♭♯𝄪𝄫])?)?)/g;
  return chordLine.replace(chordTokenRegex, (match) => {
    return transposeChord(match, semitoneDelta, preferenceOrTargetKey);
  });
}

/**
 * Transposes a single lead/bass note with octave (e.g. "C4", "F#4", "Bb3", "f#'", "c2")
 */
export function transposeNoteWithOctave(noteStr, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!noteStr || typeof noteStr !== 'string') return noteStr;
  const trimmed = noteStr.trim();
  if (semitoneDelta % 12 === 0) return trimmed;

  // Match Note with numeric octave (e.g. "C#4", "Eb3", "A5")
  const noteOctaveRegex = /^([A-Ga-g][#b♭♯]?)([0-8])$/;
  const match = trimmed.match(noteOctaveRegex);

  if (!match) {
    // Check if apostrophe octave or plain note
    return transposeNoteUnit(trimmed, semitoneDelta, preferenceOrTargetKey);
  }

  const [, noteName, octaveStr] = match;
  const normalizedNote = normalizeNoteName(noteName);
  if (!(normalizedNote in NOTE_TO_SEMITONE)) return trimmed;

  const octave = parseInt(octaveStr, 10);
  const totalSemitones = (octave * 12) + NOTE_TO_SEMITONE[normalizedNote] + semitoneDelta;

  const newOctave = Math.floor(totalSemitones / 12);
  const newNoteSemitone = ((totalSemitones % 12) + 12) % 12;
  const newNoteName = semitoneToNoteName(newNoteSemitone, preferenceOrTargetKey);

  // Clamp octave to reasonable piano range (0 to 8)
  const clampedOctave = Math.max(0, Math.min(8, newOctave));
  const isLower = noteName[0] >= 'a' && noteName[0] <= 'g';
  const resultName = isLower ? newNoteName.toLowerCase() : newNoteName;
  return `${resultName}${clampedOctave}`;
}

/**
 * Transposes a single note unit (with optional numeric or apostrophe octave)
 */
function transposeNoteUnit(unit, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  const match = unit.match(/^([A-Ga-g][#b♭♯]?)(['`’]*|\d*)$/);
  if (!match) return unit;
  const [, noteName, octModifier] = match;
  const isLower = noteName[0] >= 'a' && noteName[0] <= 'g';

  if (!octModifier) {
    const transposed = transposeNote(noteName, semitoneDelta, preferenceOrTargetKey);
    return isLower ? transposed.toLowerCase() : transposed;
  }

  // Numeric octave
  if (/^\d+$/.test(octModifier)) {
    return transposeNoteWithOctave(unit, semitoneDelta, preferenceOrTargetKey);
  }

  // Apostrophe octave (e.g. "f#'", "c''")
  const transposed = transposeNote(noteName, semitoneDelta, preferenceOrTargetKey);
  const resultName = isLower ? transposed.toLowerCase() : transposed;
  return `${resultName}${octModifier}`;
}

/**
 * Transposes a note token or cluster (e.g. "E4", "F#", "EE", "AAA", "AC#", "F#F#", "f#'")
 */
export function transposeNoteCluster(token, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!token || typeof token !== 'string') return token;
  if (semitoneDelta % 12 === 0) return token;

  const isPureNoteCluster = /^([A-Ga-g][#b♭♯]?(['`’]*|\d*))+$/.test(token);
  if (!isPureNoteCluster) return token;

  return token.replace(/([A-Ga-g][#b♭♯]?(['`’]*|\d*))/g, (match) => {
    return transposeNoteUnit(match, semitoneDelta, preferenceOrTargetKey);
  });
}

/**
 * Keywords in lead lines that must not be parsed as notes
 */
const NON_NOTE_KEYWORDS = /^(?:Lead|lead|LEAD|Solo|solo|SOLO|Intro|intro|INTRO|Outro|outro|OUTRO|Melody|melody|MELODY|Riff|riff|RIFF|Interlude|interlude|Verse|verse|Chorus|chorus|Bridge|bridge|fade|repeat|end|x\d+|\(\w+\))$/i;

/**
 * Transposes a sequence of lead/bass notes (e.g. "E4 G4 C5 G4", "E F# G# A", "EE AAA AC#", "C3 - G3 - C4", "f#' g#' a''")
 */
export function transposeNoteLine(noteLine, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!noteLine || typeof noteLine !== 'string') return noteLine;
  if (semitoneDelta % 12 === 0) return noteLine;

  return noteLine.replace(/\S+/g, (token) => {
    if (NON_NOTE_KEYWORDS.test(token) || token === '|' || token === '||' || token === '-' || token === '—' || token === '–') {
      return token;
    }
    if (/^([A-Ga-g][#b♭♯]?(['`’]*|\d*))+$/.test(token)) {
      return transposeNoteCluster(token, semitoneDelta, preferenceOrTargetKey);
    }
    return token;
  });
}

/**
 * Transposes inline lead sections in lyrics or annotations
 * Matches: [Lead: ...], (Lead: ...), {Lead: ...}, Lead: ...
 */
export function transposeInlineLeadInLyrics(lyricsLine, semitoneDelta, preferenceOrTargetKey = 'sharp') {
  if (!lyricsLine || typeof lyricsLine !== 'string') return lyricsLine;
  if (semitoneDelta % 12 === 0) return lyricsLine;

  // 1. Bracketed lead / solo / melody: [Lead: E F# G], (Lead: E4 G4), [Solo: ...], [Melody: ...]
  const bracketedLeadRegex = /([\[\(\{])\s*((?:Lead|lead|LEAD|Solo|solo|SOLO|Melody|melody|MELODY|Riff|riff|RIFF)\s*[:\-–—]?\s*)([^\]\)\}\n]+)([\]\)\}])/g;
  let result = lyricsLine.replace(bracketedLeadRegex, (fullMatch, openBracket, leadPrefix, notesContent, closeBracket) => {
    const transposedNotes = transposeNoteLine(notesContent, semitoneDelta, preferenceOrTargetKey);
    return `${openBracket}${leadPrefix}${transposedNotes}${closeBracket}`;
  });

  // 2. Line-starting Lead: Lead: E F# G# or Solo: E4 G4 C5
  const lineStartLeadRegex = /^(\s*(?:Lead|lead|LEAD|Solo|solo|SOLO|Melody|melody|MELODY|Riff|riff|RIFF)\s*[:\-–—]\s*)(.+)$/i;
  result = result.replace(lineStartLeadRegex, (fullMatch, leadPrefix, notesContent) => {
    const transposedNotes = transposeNoteLine(notesContent, semitoneDelta, preferenceOrTargetKey);
    return `${leadPrefix}${transposedNotes}`;
  });

  return result;
}

/**
 * Transposes a row's content dynamically according to its type
 */
export function transposeRowContent(content, rowType, semitoneDelta, targetKey) {
  if (semitoneDelta % 12 === 0) return content;
  const preferenceOrTargetKey = targetKey || 'sharp';

  if (rowType === 'chords') {
    if (Array.isArray(content)) {
      return content.map(c => transposeChord(c, semitoneDelta, preferenceOrTargetKey));
    }
    return transposeChordLine(String(content), semitoneDelta, preferenceOrTargetKey);
  }

  if (rowType === 'lead' || rowType === 'bass') {
    if (Array.isArray(content)) {
      return content.map(n => transposeNoteLine(n, semitoneDelta, preferenceOrTargetKey));
    }
    return transposeNoteLine(String(content), semitoneDelta, preferenceOrTargetKey);
  }

  // If row is lyrics or other text, transpose any embedded lead notes
  if (typeof content === 'string') {
    return transposeInlineLeadInLyrics(content, semitoneDelta, preferenceOrTargetKey);
  }

  return content;
}

/**
 * Step key up or down by 1 semitone
 */
export function stepKey(currentKey, direction = 1) {
  const isMinor = /m$/i.test(String(currentKey || '').trim());
  const root = getRootFromKey(currentKey);
  const currentSemitone = NOTE_TO_SEMITONE[root] ?? 0;
  const newSemitone = (currentSemitone + direction + 12) % 12;
  
  // Decide whether to return sharp or flat based on direction & key
  const preference = direction < 0 ? 'flat' : 'sharp';
  const steppedRoot = semitoneToNoteName(newSemitone, preference);
  return isMinor ? `${steppedRoot}m` : steppedRoot;
}

/**
 * Dynamically transposes an entire song data structure for rendering.
 * Does NOT mutate the input song object.
 */
export function transposeSong(song, targetKey) {
  if (!song || typeof song !== 'object') return null;
  const originalKey = song.originalKey || 'C';
  const effectiveTargetKey = targetKey || originalKey;
  const semitoneDelta = calculateSemitoneDistance(originalKey, effectiveTargetKey);

  // Normalize sections from song data
  let rawSections = [];
  if (Array.isArray(song.sections) && song.sections.length > 0) {
    rawSections = song.sections;
  } else if (song.content || song.lyrics || song.chords) {
    // Fallback single section if raw content was stored at document root
    const fallbackRows = [];
    if (song.chords) fallbackRows.push({ id: 'r_root_chords', type: 'chords', content: song.chords });
    if (song.lyrics) fallbackRows.push({ id: 'r_root_lyrics', type: 'lyrics', content: song.lyrics });
    if (song.content && !song.chords && !song.lyrics) {
      fallbackRows.push({ id: 'r_root_content', type: 'lyrics', content: song.content });
    }
    rawSections = [{ id: 'sec_root', name: 'Main', rows: fallbackRows }];
  }

  const sections = rawSections.map((section, sIdx) => {
    if (!section) {
      return { id: `sec_${sIdx}`, name: `Section ${sIdx + 1}`, rows: [] };
    }
    if (typeof section === 'string') {
      return {
        id: `sec_${sIdx}`,
        name: section,
        rows: [{ id: `r_${sIdx}_1`, type: 'lyrics', content: section, displayContent: section }]
      };
    }

    let rows = Array.isArray(section.rows) ? section.rows : [];

    // If rows are empty but lines exist (e.g. parsed / Chordex format), convert lines to rows
    if (rows.length === 0 && Array.isArray(section.lines) && section.lines.length > 0) {
      rows = [];
      section.lines.forEach((line, lIdx) => {
        if (!line) return;
        const lineChords = Array.isArray(line.chords)
          ? line.chords
              .map(c => (typeof c === 'string' ? c : c?.chord || ''))
              .filter(Boolean)
              .join('   ')
          : (line.rawChordLine || line.chords || '');
        const lineLyrics = line.lyrics !== undefined ? line.lyrics : (typeof line === 'string' ? line : '');

        if (lineChords) {
          rows.push({ id: `r_${sIdx}_${lIdx}_c`, type: 'chords', content: lineChords });
        }
        if (lineLyrics) {
          rows.push({ id: `r_${sIdx}_${lIdx}_l`, type: 'lyrics', content: lineLyrics });
        }
      });
    }

    return {
      ...section,
      id: section.id || `sec_${sIdx + 1}`,
      name: section.name || `Section ${sIdx + 1}`,
      rows: rows.map((row, rIdx) => {
        if (!row) {
          return { id: `r_${sIdx}_${rIdx}`, type: 'lyrics', content: '', displayContent: '' };
        }
        if (typeof row === 'string') {
          return {
            id: `r_${sIdx}_${rIdx}`,
            type: 'lyrics',
            content: row,
            displayContent: transposeRowContent(row, 'lyrics', semitoneDelta, effectiveTargetKey)
          };
        }

        const rowType = row.type || (row.chords ? 'chords' : (row.lyrics ? 'lyrics' : 'custom'));
        const rawContent =
          row.displayContent !== undefined
            ? row.displayContent
            : (row.content !== undefined ? row.content : (row.chords || row.lyrics || row.text || ''));

        return {
          ...row,
          id: row.id || `r_${sIdx}_${rIdx}`,
          type: rowType,
          content: rawContent,
          displayContent: transposeRowContent(rawContent, rowType, semitoneDelta, effectiveTargetKey)
        };
      })
    };
  });

  return {
    ...song,
    originalKey,
    activeKey: effectiveTargetKey,
    semitoneDelta,
    sections
  };
}
