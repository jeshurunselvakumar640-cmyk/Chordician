/**
 * High-Precision Chord and Scale Note Calculator for Chordician
 * Covers Major, Minor, 7th, Maj7, Min7, Diminished, Augmented, Sus2/4, Power 5th,
 * 6th/m6, Add9/madd9, 9th/maj9/m9, 11th/maj11/m11, 13th/maj13/m13, Half-diminished,
 * Altered dominant chords, and Slash chords.
 */

// Canonical Chromatic Scale (Sharps and Flats)
const SEMITONES = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Flat-preferring roots
const FLAT_ROOTS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

/**
 * Standard Major & Natural Minor Scale Lookup Dictionaries
 */
export const MAJOR_SCALES = {
  'C':   ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'C#':  ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'Db':  ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  'D':   ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'D#':  ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D'],
  'Eb':  ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'E':   ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'F':   ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'F#':  ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'Gb':  ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'G':   ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'G#':  ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G'],
  'Ab':  ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'A':   ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'A#':  ['A#', 'C', 'D', 'D#', 'F', 'G', 'A'],
  'Bb':  ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'B':   ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
};

export const MINOR_SCALES = {
  'C':   ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  'C#':  ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
  'D':   ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
  'D#':  ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
  'Eb':  ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
  'E':   ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
  'F':   ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
  'F#':  ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
  'G':   ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
  'G#':  ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
  'A':   ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  'A#':  ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
  'Bb':  ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
  'B':   ['B', 'C#', 'D', 'E', 'F#', 'G', 'A']
};

/**
 * Standard Explicit Chord Note Lookups for maximum accuracy
 */
const KNOWN_CHORD_NOTES = {
  // 1. Major
  'C': 'C-E-G', 'C#': 'C#-F-G#', 'Db': 'Db-F-Ab',
  'D': 'D-F#-A', 'D#': 'D#-G-A#', 'Eb': 'Eb-G-Bb',
  'E': 'E-G#-B', 'F': 'F-A-C', 'F#': 'F#-A#-C#', 'Gb': 'Gb-Bb-Db',
  'G': 'G-B-D', 'G#': 'G#-C-D#', 'Ab': 'Ab-C-Eb',
  'A': 'A-C#-E', 'A#': 'A#-D-F', 'Bb': 'Bb-D-F', 'B': 'B-D#-F#',

  // 2. Minor
  'Cm': 'C-Eb-G', 'C#m': 'C#-E-G#', 'Dbm': 'Db-Fb-Ab',
  'Dm': 'D-F-A', 'D#m': 'D#-F#-A#', 'Ebm': 'Eb-Gb-Bb',
  'Em': 'E-G-B', 'Fm': 'F-Ab-C', 'F#m': 'F#-A-C#', 'Gbm': 'Gb-Bbb-Db',
  'Gm': 'G-Bb-D', 'G#m': 'G#-B-D#', 'Abm': 'Ab-Cb-Eb',
  'Am': 'A-C-E', 'A#m': 'A#-C#-F', 'Bbm': 'Bb-Db-F', 'Bm': 'B-D-F#',

  // 3. Dominant 7
  'C7': 'C-E-G-Bb', 'C#7': 'C#-F-G#-B', 'Db7': 'Db-F-Ab-B',
  'D7': 'D-F#-A-C', 'D#7': 'D#-G-A#-C#', 'Eb7': 'Eb-G-Bb-Db',
  'E7': 'E-G#-B-D', 'F7': 'F-A-C-Eb', 'F#7': 'F#-A#-C#-E', 'Gb7': 'Gb-Bb-Db-E',
  'G7': 'G-B-D-F', 'G#7': 'G#-C-D#-F#', 'Ab7': 'Ab-C-Eb-Gb',
  'A7': 'A-C#-E-G', 'A#7': 'A#-D-F-G#', 'Bb7': 'Bb-D-F-Ab', 'B7': 'B-D#-F#-A',

  // 4. Major 7
  'Cmaj7': 'C-E-G-B', 'C#maj7': 'C#-F-G#-C', 'Dbmaj7': 'Db-F-Ab-C',
  'Dmaj7': 'D-F#-A-C#', 'D#maj7': 'D#-G-A#-D', 'Ebmaj7': 'Eb-G-Bb-D',
  'Emaj7': 'E-G#-B-D#', 'Fmaj7': 'F-A-C-E', 'F#maj7': 'F#-A#-C#-F', 'Gbmaj7': 'Gb-Bb-Db-F',
  'Gmaj7': 'G-B-D-F#', 'G#maj7': 'G#-C-D#-G', 'Abmaj7': 'Ab-C-Eb-G',
  'Amaj7': 'A-C#-E-G#', 'A#maj7': 'A#-D-F-A', 'Bbmaj7': 'Bb-D-F-A', 'Bmaj7': 'B-D#-F#-A#',

  // 5. Minor 7
  'Cm7': 'C-Eb-G-Bb', 'C#m7': 'C#-E-G#-B', 'Dbm7': 'Db-Fb-Ab-B',
  'Dm7': 'D-F-A-C', 'D#m7': 'D#-F#-A#-C#', 'Ebm7': 'Eb-Gb-Bb-Db',
  'Em7': 'E-G-B-D', 'Fm7': 'F-Ab-C-Eb', 'F#m7': 'F#-A-C#-E', 'Gbm7': 'Gb-Bbb-Db-E',
  'Gm7': 'G-Bb-D-F', 'G#m7': 'G#-B-D#-F#', 'Abm7': 'Ab-Cb-Eb-Gb',
  'Am7': 'A-C-E-G', 'A#m7': 'A#-C#-F-G#', 'Bbm7': 'Bb-Db-F-Ab', 'Bm7': 'B-D-F#-A',

  // 6. Diminished
  'Cdim': 'C-Eb-Gb', 'C#dim': 'C#-E-G', 'Dbdim': 'Db-Fb-G',
  'Ddim': 'D-F-Ab', 'D#dim': 'D#-F#-A', 'Ebdim': 'Eb-Gb-A',
  'Edim': 'E-G-Bb', 'Fdim': 'F-Ab-B', 'F#dim': 'F#-A-C', 'Gbdim': 'Gb-A-C',
  'Gdim': 'G-Bb-Db', 'G#dim': 'G#-B-D', 'Abdim': 'Ab-B-D',
  'Adim': 'A-C-Eb', 'A#dim': 'A#-C#-E', 'Bbdim': 'Bb-Db-E', 'Bdim': 'B-D-F',

  // 7. Augmented
  'Caug': 'C-E-G#', 'C#aug': 'C#-F-A', 'Dbaug': 'Db-F-A',
  'Daug': 'D-F#-A#', 'D#aug': 'D#-G-B', 'Ebaug': 'Eb-G-B',
  'Eaug': 'E-G#-C', 'Faug': 'F-A-C#', 'F#aug': 'F#-A#-D', 'Gbaug': 'Gb-Bb-D',
  'Gaug': 'G-B-D#', 'G#aug': 'G#-C-E', 'Abaug': 'Ab-C-E',
  'Aaug': 'A-C#-F', 'A#aug': 'A#-D-F#', 'Bbaug': 'Bb-D-F#', 'Baug': 'B-D#-G',

  // 8. Sus2
  'Csus2': 'C-D-G', 'C#sus2': 'C#-D#-G#', 'Dbsus2': 'Db-Eb-Ab',
  'Dsus2': 'D-E-A', 'D#sus2': 'D#-F-A#', 'Ebsus2': 'Eb-F-Bb',
  'Esus2': 'E-F#-B', 'Fsus2': 'F-G-C', 'F#sus2': 'F#-G#-C#', 'Gbsus2': 'Gb-Ab-Db',
  'Gsus2': 'G-A-D', 'G#sus2': 'G#-A#-D#', 'Absus2': 'Ab-Bb-Eb',
  'Asus2': 'A-B-E', 'A#sus2': 'A#-C-F', 'Bbsus2': 'Bb-C-F', 'Bsus2': 'B-C#-F#',

  // 8. Sus4
  'Csus4': 'C-F-G', 'C#sus4': 'C#-F#-G#', 'Dbsus4': 'Db-Gb-Ab',
  'Dsus4': 'D-G-A', 'D#sus4': 'D#-G#-A#', 'Ebsus4': 'Eb-Ab-Bb',
  'Esus4': 'E-A-B', 'Fsus4': 'F-Bb-C', 'F#sus4': 'F#-B-C#', 'Gbsus4': 'Gb-B-Db',
  'Gsus4': 'G-C-D', 'G#sus4': 'G#-C#-D#', 'Absus4': 'Ab-Db-Eb',
  'Asus4': 'A-D-E', 'A#sus4': 'A#-D#-F', 'Bbsus4': 'Bb-Eb-F', 'Bsus4': 'B-E-F#',

  // 9. Power / 5th
  'C5': 'C-G', 'C#5': 'C#-G#', 'Db5': 'Db-Ab',
  'D5': 'D-A', 'D#5': 'D#-A#', 'Eb5': 'Eb-Bb',
  'E5': 'E-B', 'F5': 'F-C', 'F#5': 'F#-C#', 'Gb5': 'Gb-Db',
  'G5': 'G-D', 'G#5': 'G#-D#', 'Ab5': 'Ab-Eb',
  'A5': 'A-E', 'A#5': 'A#-F', 'Bb5': 'Bb-F', 'B5': 'B-F#',

  // 10. 6th
  'C6': 'C-E-G-A', 'Cm6': 'C-Eb-G-A',
  'D6': 'D-F#-A-B', 'Dm6': 'D-F-A-B',
  'E6': 'E-G#-B-C#', 'Em6': 'E-G-B-C#',
  'F6': 'F-A-C-D', 'Fm6': 'F-Ab-C-D',
  'G6': 'G-B-D-E', 'Gm6': 'G-Bb-D-E',
  'A6': 'A-C#-E-F#', 'Am6': 'A-C-E-F#',
  'B6': 'B-D#-F#-G#', 'Bm6': 'B-D-F#-G#',

  // 11. Add9
  'Cadd9': 'C-E-G-D', 'Cmadd9': 'C-Eb-G-D',
  'Dadd9': 'D-F#-A-E', 'Dmadd9': 'D-F-A-E',
  'Eadd9': 'E-G#-B-F#', 'Emadd9': 'E-G-B-F#',
  'Fadd9': 'F-A-C-G', 'Fmadd9': 'F-Ab-C-G',
  'Gadd9': 'G-B-D-A', 'Gmadd9': 'G-Bb-D-A',
  'Aadd9': 'A-C#-E-B', 'Amadd9': 'A-C-E-B',
  'Badd9': 'B-D#-F#-C#', 'Bmadd9': 'B-D-F#-C#',

  // 12. 9th
  'C9': 'C-E-G-Bb-D', 'Cmaj9': 'C-E-G-B-D', 'Cm9': 'C-Eb-G-Bb-D',
  'D9': 'D-F#-A-C-E', 'Dmaj9': 'D-F#-A-C#-E', 'Dm9': 'D-F-A-C-E',
  'E9': 'E-G#-B-D-F#', 'Emaj9': 'E-G#-B-D#-F#', 'Em9': 'E-G-B-D-F#',
  'F9': 'F-A-C-Eb-G', 'Fmaj9': 'F-A-C-E-G', 'Fm9': 'F-Ab-C-Eb-G',
  'G9': 'G-B-D-F-A', 'Gmaj9': 'G-B-D-F#-A', 'Gm9': 'G-Bb-D-F-A',
  'A9': 'A-C#-E-G-B', 'Amaj9': 'A-C#-E-G#-B', 'Am9': 'A-C-E-G-B',
  'B9': 'B-D#-F#-A-C#', 'Bmaj9': 'B-D#-F#-A#-C#', 'Bm9': 'B-D-F#-A-C#',

  // 13. 11th
  'C11': 'C-E-G-Bb-D-F', 'Cmaj11': 'C-E-G-B-D-F', 'Cm11': 'C-Eb-G-Bb-D-F',
  'D11': 'D-F#-A-C-E-G', 'Dmaj11': 'D-F#-A-C#-E-G', 'Dm11': 'D-F-A-C-E-G',
  'E11': 'E-G#-B-D-F#-A', 'Emaj11': 'E-G#-B-D#-F#-A', 'Em11': 'E-G-B-D-F#-A',
  'F11': 'F-A-C-Eb-G-Bb', 'Fmaj11': 'F-A-C-E-G-Bb', 'Fm11': 'F-Ab-C-Eb-G-Bb',
  'G11': 'G-B-D-F-A-C', 'Gmaj11': 'G-B-D-F#-A-C', 'Gm11': 'G-Bb-D-F-A-C',
  'A11': 'A-C#-E-G-B-D', 'Amaj11': 'A-C#-E-G#-B-D', 'Am11': 'A-C-E-G-B-D',
  'B11': 'B-D#-F#-A-C#-E', 'Bmaj11': 'B-D#-F#-A#-C#-E', 'Bm11': 'B-D-F#-A-C#-E',

  // 14. 13th
  'C13': 'C-E-G-Bb-D-F-A', 'Cmaj13': 'C-E-G-B-D-F-A', 'Cm13': 'C-Eb-G-Bb-D-F-A',
  'D13': 'D-F#-A-C-E-G-B', 'Dmaj13': 'D-F#-A-C#-E-G-B', 'Dm13': 'D-F-A-C-E-G-B',
  'E13': 'E-G#-B-D-F#-A-C#', 'Emaj13': 'E-G#-B-D#-F#-A-C#', 'Em13': 'E-G-B-D-F#-A-C#',
  'F13': 'F-A-C-Eb-G-Bb-D', 'Fmaj13': 'F-A-C-E-G-Bb-D', 'Fm13': 'F-Ab-C-Eb-G-Bb-D',
  'G13': 'G-B-D-F-A-C-E', 'Gmaj13': 'G-B-D-F#-A-C-E', 'Gm13': 'G-Bb-D-F-A-C-E',
  'A13': 'A-C#-E-G-B-D-F#', 'Amaj13': 'A-C#-E-G#-B-D-F#', 'Am13': 'A-C-E-G-B-D-F#',
  'B13': 'B-D#-F#-A-C#-E-G#', 'Bmaj13': 'B-D#-F#-A#-C#-E-G#', 'Bm13': 'B-D-F#-A-C#-E-G#',

  // 15. Half-diminished (m7b5)
  'Cm7b5': 'C-Eb-Gb-Bb', 'C#m7b5': 'C#-E-G-B',
  'Dm7b5': 'D-F-Ab-C', 'D#m7b5': 'D#-F#-A-C#', 'Ebm7b5': 'Eb-Gb-A-Db',
  'Em7b5': 'E-G-Bb-D', 'Fm7b5': 'F-Ab-B-Eb', 'F#m7b5': 'F#-A-C-E',
  'Gm7b5': 'G-Bb-Db-F', 'G#m7b5': 'G#-B-D-F#', 'Abm7b5': 'Ab-B-D-Gb',
  'Am7b5': 'A-C-Eb-G', 'A#m7b5': 'A#-C#-E-G#', 'Bbm7b5': 'Bb-Db-E-Ab', 'Bm7b5': 'B-D-F-A'
};

/**
 * Calculates note components dynamically from intervals if not in lookup table
 */
function calculateDynamicChordNotes(root, quality) {
  const rootSemitone = SEMITONES[root];
  if (rootSemitone === undefined) return '';

  const isFlat = FLAT_ROOTS.has(root) || root.includes('b');
  const scale = isFlat ? FLAT_NAMES : SHARP_NAMES;

  // Relative interval offsets in semitones
  let intervals = [0, 4, 7]; // Default Major (1, 3, 5)

  const q = quality.toLowerCase().trim();

  if (q === 'm' || q === 'min' || q === '-') {
    intervals = [0, 3, 7]; // 1, b3, 5
  } else if (q === '7' || q === 'dom7') {
    intervals = [0, 4, 7, 10]; // 1, 3, 5, b7
  } else if (q === 'maj7' || q === 'm7' && quality.includes('maj') || q === 'Δ') {
    intervals = [0, 4, 7, 11]; // 1, 3, 5, 7
  } else if (q === 'm7' || q === 'min7') {
    intervals = [0, 3, 7, 10]; // 1, b3, 5, b7
  } else if (q === 'dim' || q === 'o') {
    intervals = [0, 3, 6]; // 1, b3, b5
  } else if (q === 'dim7' || q === 'o7') {
    intervals = [0, 3, 6, 9]; // 1, b3, b5, bb7
  } else if (q === 'aug' || q === '+') {
    intervals = [0, 4, 8]; // 1, 3, #5
  } else if (q === 'sus2') {
    intervals = [0, 2, 7]; // 1, 2, 5
  } else if (q === 'sus4' || q === 'sus') {
    intervals = [0, 5, 7]; // 1, 4, 5
  } else if (q === '7sus4' || q === '7sus') {
    intervals = [0, 5, 7, 10]; // 1, 4, 5, b7
  } else if (q === '5') {
    intervals = [0, 7]; // 1, 5
  } else if (q === '6') {
    intervals = [0, 4, 7, 9]; // 1, 3, 5, 6
  } else if (q === 'm6') {
    intervals = [0, 3, 7, 9]; // 1, b3, 5, 6
  } else if (q === 'add9' || q === '2') {
    intervals = [0, 4, 7, 2]; // 1, 3, 5, 9
  } else if (q === 'madd9') {
    intervals = [0, 3, 7, 2]; // 1, b3, 5, 9
  } else if (q === '9') {
    intervals = [0, 4, 7, 10, 2]; // 1, 3, 5, b7, 9
  } else if (q === 'maj9') {
    intervals = [0, 4, 7, 11, 2]; // 1, 3, 5, 7, 9
  } else if (q === 'm9') {
    intervals = [0, 3, 7, 10, 2]; // 1, b3, 5, b7, 9
  } else if (q === 'm7b5' || q === 'ø') {
    intervals = [0, 3, 6, 10]; // 1, b3, b5, b7
  } else if (q === '7b5') {
    intervals = [0, 4, 6, 10]; // 1, 3, b5, b7
  } else if (q === '7#5') {
    intervals = [0, 4, 8, 10]; // 1, 3, #5, b7
  } else if (q === '7b9') {
    intervals = [0, 4, 7, 10, 1]; // 1, 3, 5, b7, b9
  } else if (q === '7#9') {
    intervals = [0, 4, 7, 10, 3]; // 1, 3, 5, b7, #9
  } else if (q === '11') {
    intervals = [0, 4, 7, 10, 2, 5];
  } else if (q === 'maj11') {
    intervals = [0, 4, 7, 11, 2, 5];
  } else if (q === 'm11') {
    intervals = [0, 3, 7, 10, 2, 5];
  } else if (q === '13') {
    intervals = [0, 4, 7, 10, 2, 5, 9];
  } else if (q === 'maj13') {
    intervals = [0, 4, 7, 11, 2, 5, 9];
  } else if (q === 'm13') {
    intervals = [0, 3, 7, 10, 2, 5, 9];
  }

  const notes = intervals.map((iv) => {
    const noteIdx = (rootSemitone + iv) % 12;
    return scale[noteIdx];
  });

  return notes.join('-');
}

/**
 * Returns formatted component notes for any chord string (including slash chords)
 * @param {string} chordStr - e.g. "C", "F#m", "G/B", "Csus4", "Em7", "Cadd9"
 * @returns {{ chord: string, root: string, quality: string, bass: string|null, notes: string, formatted: string }}
 */
export function getChordNotes(chordStr) {
  if (!chordStr || typeof chordStr !== 'string') {
    return { chord: '', root: '', quality: '', bass: null, notes: '', formatted: '' };
  }

  const clean = chordStr.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  if (!clean) return { chord: '', root: '', quality: '', bass: null, notes: '', formatted: '' };

  // Check for slash chord (e.g. "C/E", "G/B", "Dm/F")
  const slashParts = clean.split('/');
  const mainChord = slashParts[0].trim();
  const bass = slashParts[1] ? slashParts[1].trim() : null;

  // Check direct known dictionary first
  if (KNOWN_CHORD_NOTES[mainChord]) {
    const chordNotes = KNOWN_CHORD_NOTES[mainChord];
    const formatted = bass ? `${chordNotes} (Bass: ${bass})` : chordNotes;
    return { chord: clean, root: mainChord, quality: '', bass, notes: chordNotes, formatted };
  }

  // Parse root and quality
  const match = mainChord.match(/^([A-Ga-g][#b]?)(.*)$/);
  if (!match) {
    return { chord: clean, root: clean, quality: '', bass, notes: '', formatted: clean };
  }

  const root = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const quality = match[2];

  // Check normalized lookup
  const normalizedKey = `${root}${quality}`;
  if (KNOWN_CHORD_NOTES[normalizedKey]) {
    const chordNotes = KNOWN_CHORD_NOTES[normalizedKey];
    const formatted = bass ? `${chordNotes} (Bass: ${bass})` : chordNotes;
    return { chord: clean, root, quality, bass, notes: chordNotes, formatted };
  }

  // Calculate dynamically
  const calculatedNotes = calculateDynamicChordNotes(root, quality) || `${root}`;
  const formatted = bass ? `${calculatedNotes} (Bass: ${bass})` : calculatedNotes;

  return {
    chord: clean,
    root,
    quality,
    bass,
    notes: calculatedNotes,
    formatted
  };
}

/**
 * Returns formatted scale notes for a given key (Major or Natural Minor)
 * @param {string} keyName - e.g. "C", "F#m", "Eb", "Em", "G"
 * @returns {{ key: string, root: string, type: string, notes: string[], formatted: string, label: string }}
 */
export function getScaleNotes(keyName) {
  if (!keyName || typeof keyName !== 'string') {
    return {
      key: 'C',
      root: 'C',
      type: 'major',
      notes: MAJOR_SCALES['C'],
      formatted: MAJOR_SCALES['C'].concat('C').join(' - '),
      label: 'C Major'
    };
  }

  const clean = keyName.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  const isMinor = /m$/i.test(clean);
  const root = isMinor ? clean.replace(/m$/i, '') : clean;
  const normalizedRoot = root.charAt(0).toUpperCase() + root.slice(1);

  if (isMinor) {
    const scaleNotes = MINOR_SCALES[normalizedRoot] || MINOR_SCALES['A'];
    const octaved = [...scaleNotes, normalizedRoot];
    return {
      key: clean,
      root: normalizedRoot,
      type: 'minor',
      notes: scaleNotes,
      formatted: octaved.join(' - '),
      label: `${normalizedRoot} Minor`
    };
  }

  const scaleNotes = MAJOR_SCALES[normalizedRoot] || MAJOR_SCALES['C'];
  const octaved = [...scaleNotes, normalizedRoot];
  return {
    key: clean,
    root: normalizedRoot,
    type: 'major',
    notes: scaleNotes,
    formatted: octaved.join(' - '),
    label: `${normalizedRoot} Major`
  };
}

/**
 * Extracts all unique chords from a song in chronological order of appearance
 * @param {Object} song
 * @returns {Array<string>} list of unique chord strings
 */
export function extractSongUniqueChords(song) {
  if (!song || !Array.isArray(song.sections)) return [];

  const seen = new Set();
  const uniqueChords = [];

  for (const sec of song.sections) {
    // Check rows
    for (const row of sec.rows || []) {
      if (row.type === 'chords' && row.content) {
        let tokens = [];
        if (Array.isArray(row.content)) {
          tokens = row.content;
        } else if (typeof row.content === 'string') {
          tokens = row.content.trim().split(/\s+/).filter(Boolean);
        }
        for (const token of tokens) {
          const clean = String(token || '').trim();
          if (clean && !seen.has(clean)) {
            seen.add(clean);
            uniqueChords.push(clean);
          }
        }
      }
    }
    // Check legacy lines
    for (const line of sec.lines || []) {
      if (Array.isArray(line.chords)) {
        for (const c of line.chords) {
          const name = typeof c === 'string' ? c : c?.chord;
          if (name && !seen.has(name)) {
            seen.add(name);
            uniqueChords.push(name);
          }
        }
      } else if (typeof line.chords === 'string') {
        const tokens = line.chords.trim().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          if (token && !seen.has(token)) {
            seen.add(token);
            uniqueChords.push(token);
          }
        }
      }
    }
  }

  return uniqueChords;
}
