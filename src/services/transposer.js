import {
  SHARP_SCALE,
  FLAT_SCALE,
  NOTE_TO_SEMITONE,
  KEY_SPELLING_PREFERENCE,
  ALL_KEYS
} from '../utils/musicConstants.js';

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
 * Converts a semitone index (0..11) to note name based on preference
 */
export function semitoneToNoteName(semitone, preference = 'sharp') {
  const normalizedIndex = ((semitone % 12) + 12) % 12;
  if (preference === 'flat') {
    return FLAT_SCALE[normalizedIndex];
  }
  return SHARP_SCALE[normalizedIndex];
}

/**
 * Transposes a single note without octave (e.g. "C#" + 2 -> "D#")
 */
export function transposeNote(note, semitoneDelta, preference = 'sharp') {
  const normalized = normalizeNoteName(note);
  if (!(normalized in NOTE_TO_SEMITONE)) return note;

  const currentSemitone = NOTE_TO_SEMITONE[normalized];
  const newSemitone = (currentSemitone + semitoneDelta) % 12;
  return semitoneToNoteName(newSemitone, preference);
}

/**
 * Transposes a single chord string (e.g. "Cmaj7", "F#m7/E", "Bb/D", "Eb", "Csus4")
 */
export function transposeChord(chordStr, semitoneDelta, preference = 'sharp') {
  if (!chordStr || typeof chordStr !== 'string') return chordStr;
  const trimmed = chordStr.trim();
  if (!trimmed) return '';

  if (semitoneDelta % 12 === 0) return trimmed;

  // Regex to match: [Root Note][Chord Quality][Optional /Slash Note]
  const chordRegex = /^([A-Ga-g][#b♭♯]?)([^/]*)(?:\/([A-Ga-g][#b♭♯]?))?$/;
  const match = trimmed.match(chordRegex);

  if (!match) {
    return trimmed;
  }

  const [, root, quality, bass] = match;
  const transposedRoot = transposeNote(root, semitoneDelta, preference);
  const transposedBass = bass ? transposeNote(bass, semitoneDelta, preference) : null;

  if (transposedBass) {
    return `${transposedRoot}${quality}/${transposedBass}`;
  }
  return `${transposedRoot}${quality}`;
}

/**
 * Transposes a line of chords while preserving spacing/layout
 */
export function transposeChordLine(chordLine, semitoneDelta, preference = 'sharp') {
  if (!chordLine || typeof chordLine !== 'string') return chordLine;
  if (semitoneDelta % 12 === 0) return chordLine;

  return chordLine.replace(/\b([A-Ga-g][#b♭♯]?(?:[^\s/]*)(?:\/[A-Ga-g][#b♭♯]?)?)\b/g, (match) => {
    return transposeChord(match, semitoneDelta, preference);
  });
}

/**
 * Transposes a single lead/bass note with octave (e.g. "C4", "F#4", "Bb3")
 */
export function transposeNoteWithOctave(noteStr, semitoneDelta, preference = 'sharp') {
  if (!noteStr || typeof noteStr !== 'string') return noteStr;
  const trimmed = noteStr.trim();
  if (semitoneDelta % 12 === 0) return trimmed;

  // Match Note with Octave number (e.g. "C#4", "Eb3", "A5")
  const noteOctaveRegex = /^([A-Ga-g][#b♭♯]?)([0-8])$/;
  const match = trimmed.match(noteOctaveRegex);

  if (!match) {
    // If no octave provided, fallback to plain note transposition
    return transposeNote(trimmed, semitoneDelta, preference);
  }

  const [, noteName, octaveStr] = match;
  const normalizedNote = normalizeNoteName(noteName);
  if (!(normalizedNote in NOTE_TO_SEMITONE)) return trimmed;

  const octave = parseInt(octaveStr, 10);
  const totalSemitones = (octave * 12) + NOTE_TO_SEMITONE[normalizedNote] + semitoneDelta;

  const newOctave = Math.floor(totalSemitones / 12);
  const newNoteSemitone = ((totalSemitones % 12) + 12) % 12;
  const newNoteName = semitoneToNoteName(newNoteSemitone, preference);

  // Clamp octave to reasonable piano range (0 to 8)
  const clampedOctave = Math.max(0, Math.min(8, newOctave));
  return `${newNoteName}${clampedOctave}`;
}

/**
 * Transposes a single note unit (with optional octave)
 */
function transposeNoteUnit(unit, semitoneDelta, preference = 'sharp') {
  const match = unit.match(/^([A-Ga-g][#b♭♯]?)([0-8]?)$/);
  if (!match) return unit;
  const [, noteName, oct] = match;
  if (oct) {
    return transposeNoteWithOctave(unit, semitoneDelta, preference);
  }
  return transposeNote(noteName, semitoneDelta, preference);
}

/**
 * Transposes a note token or cluster (e.g. "E4", "F#", "EE", "AAA", "AC#", "F#F#")
 */
export function transposeNoteCluster(token, semitoneDelta, preference = 'sharp') {
  if (!token || typeof token !== 'string') return token;
  if (semitoneDelta % 12 === 0) return token;

  const isPureNoteCluster = /^([A-Ga-g][#b♭♯]?[0-8]?)+$/.test(token);
  if (!isPureNoteCluster) return token;

  return token.replace(/([A-Ga-g][#b♭♯]?[0-8]?)/g, (match) => {
    return transposeNoteUnit(match, semitoneDelta, preference);
  });
}

/**
 * Keywords in lead lines that must not be parsed as notes
 */
const NON_NOTE_KEYWORDS = /^(?:Lead|lead|LEAD|Solo|solo|SOLO|Intro|intro|INTRO|Outro|outro|OUTRO|Melody|melody|MELODY|Riff|riff|RIFF|Interlude|interlude|Verse|verse|Chorus|chorus|Bridge|bridge|fade|repeat|end|x\d+|\(\w+\))$/i;

/**
 * Transposes a sequence of lead/bass notes (e.g. "E4 G4 C5 G4", "E F# G# A", "EE AAA AC#", "C3 - G3 - C4")
 */
export function transposeNoteLine(noteLine, semitoneDelta, preference = 'sharp') {
  if (!noteLine || typeof noteLine !== 'string') return noteLine;
  if (semitoneDelta % 12 === 0) return noteLine;

  return noteLine.replace(/(\b[A-Za-z0-8#b♭♯-]+\b|[A-Ga-g][#b♭♯]?[0-8]?)/g, (token) => {
    if (NON_NOTE_KEYWORDS.test(token)) {
      return token;
    }
    if (/^([A-Ga-g][#b♭♯]?[0-8]?)+$/.test(token)) {
      return transposeNoteCluster(token, semitoneDelta, preference);
    }
    return token;
  });
}

/**
 * Transposes inline lead sections in lyrics or annotations
 * Matches: [Lead: ...], (Lead: ...), {Lead: ...}, Lead: ...
 */
export function transposeInlineLeadInLyrics(lyricsLine, semitoneDelta, preference = 'sharp') {
  if (!lyricsLine || typeof lyricsLine !== 'string') return lyricsLine;
  if (semitoneDelta % 12 === 0) return lyricsLine;

  // 1. Bracketed lead / solo / melody: [Lead: E F# G], (Lead: E4 G4), [Solo: ...], [Melody: ...]
  const bracketedLeadRegex = /([\[\(\{])\s*((?:Lead|lead|LEAD|Solo|solo|SOLO|Melody|melody|MELODY|Riff|riff|RIFF)\s*[:\-–—]?\s*)([^\]\)\}\n]+)([\]\)\}])/g;
  let result = lyricsLine.replace(bracketedLeadRegex, (fullMatch, openBracket, leadPrefix, notesContent, closeBracket) => {
    const transposedNotes = transposeNoteLine(notesContent, semitoneDelta, preference);
    return `${openBracket}${leadPrefix}${transposedNotes}${closeBracket}`;
  });

  // 2. Line-starting Lead: Lead: E F# G# or Solo: E4 G4 C5
  const lineStartLeadRegex = /^(\s*(?:Lead|lead|LEAD|Solo|solo|SOLO|Melody|melody|MELODY|Riff|riff|RIFF)\s*[:\-–—]\s*)(.+)$/i;
  result = result.replace(lineStartLeadRegex, (fullMatch, leadPrefix, notesContent) => {
    const transposedNotes = transposeNoteLine(notesContent, semitoneDelta, preference);
    return `${leadPrefix}${transposedNotes}`;
  });

  return result;
}

/**
 * Transposes a row's content dynamically according to its type
 */
export function transposeRowContent(content, rowType, semitoneDelta, targetKey) {
  if (semitoneDelta % 12 === 0) return content;
  const preference = KEY_SPELLING_PREFERENCE[targetKey] || 'sharp';

  if (rowType === 'chords') {
    if (Array.isArray(content)) {
      return content.map(c => transposeChord(c, semitoneDelta, preference));
    }
    return transposeChordLine(String(content), semitoneDelta, preference);
  }

  if (rowType === 'lead' || rowType === 'bass') {
    if (Array.isArray(content)) {
      return content.map(n => transposeNoteLine(n, semitoneDelta, preference));
    }
    return transposeNoteLine(String(content), semitoneDelta, preference);
  }

  // If row is lyrics or other text, transpose any embedded lead notes
  if (typeof content === 'string') {
    return transposeInlineLeadInLyrics(content, semitoneDelta, preference);
  }

  return content;
}

/**
 * Step key up or down by 1 semitone
 */
export function stepKey(currentKey, direction = 1) {
  const root = getRootFromKey(currentKey);
  const currentSemitone = NOTE_TO_SEMITONE[root] ?? 0;
  const newSemitone = (currentSemitone + direction + 12) % 12;
  
  // Decide whether to return sharp or flat based on direction & key
  const preference = direction < 0 ? 'flat' : 'sharp';
  return semitoneToNoteName(newSemitone, preference);
}

/**
 * Dynamically transposes an entire song data structure for rendering.
 * Does NOT mutate the input song object.
 */
export function transposeSong(song, targetKey) {
  if (!song) return null;
  const originalKey = song.originalKey || 'C';
  const effectiveTargetKey = targetKey || originalKey;
  const semitoneDelta = calculateSemitoneDistance(originalKey, effectiveTargetKey);

  return {
    ...song,
    originalKey,
    activeKey: effectiveTargetKey,
    semitoneDelta,
    sections: (song.sections || []).map(section => ({
      ...section,
      rows: (section.rows || []).map(row => ({
        ...row,
        displayContent: transposeRowContent(row.content, row.type, semitoneDelta, effectiveTargetKey)
      }))
    }))
  };
}
