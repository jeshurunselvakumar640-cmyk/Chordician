import {
  SHARP_SCALE,
  FLAT_SCALE,
  NOTE_TO_SEMITONE,
  KEY_SPELLING_PREFERENCE,
  ALL_KEYS
} from '../utils/musicConstants.js';

/**
 * Normalizes a note or key name (e.g. 'db' -> 'Db', 'c#' -> 'C#')
 */
export function normalizeNoteName(note) {
  if (!note || typeof note !== 'string') return '';
  const trimmed = note.trim();
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
  const match = key.trim().match(/^[A-Ga-g][#b]?/);
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
  // Group 1: Root note (e.g. "C#", "Bb", "A")
  // Group 2: Quality (e.g. "m7", "maj7", "sus4", "dim", "aug", "add9", "7#9", "")
  // Group 3: Optional slash note (e.g. "E", "G#")
  const chordRegex = /^([A-Ga-g][#b]?)([^/]*)(?:\/([A-Ga-g][#b]?))?$/;
  const match = trimmed.match(chordRegex);

  if (!match) {
    // If not matching standard chord pattern, try tokenizing in case of multiple chords
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

  // Match chord tokens surrounded by spaces, tabs, or line boundaries
  // A chord token is non-whitespace that begins with a musical note [A-Ga-g]
  return chordLine.replace(/\b([A-Ga-g][#b]?(?:[^\s/]*)(?:\/[A-Ga-g][#b]?)?)\b/g, (match) => {
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
  const noteOctaveRegex = /^([A-Ga-g][#b]?)([0-8])$/;
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
 * Transposes a sequence of lead/bass notes (e.g. "E4 G4 C5 G4" or "C3 - G3 - C4")
 */
export function transposeNoteLine(noteLine, semitoneDelta, preference = 'sharp') {
  if (!noteLine || typeof noteLine !== 'string') return noteLine;
  if (semitoneDelta % 12 === 0) return noteLine;

  // Match all [Note][Octave] tokens e.g. E4, F#4, Bb3
  return noteLine.replace(/\b([A-Ga-g][#b]?)([0-8])\b/g, (match) => {
    return transposeNoteWithOctave(match, semitoneDelta, preference);
  });
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
      return content.map(n => transposeNoteWithOctave(n, semitoneDelta, preference));
    }
    return transposeNoteLine(String(content), semitoneDelta, preference);
  }

  // Lyrics, notes, custom remain unchanged
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
