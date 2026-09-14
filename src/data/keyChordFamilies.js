import { getChordNotes } from '../utils/chordNotesCalculator.js';

/**
 * Chordician Primary Music Theory Reference
 * Definitive 24-Key Major and Minor Chord Family Chart.
 *
 * Used across the Deterministic Key Detection Engine and Chord Theory Reference Guide.
 */

export const MAJOR_KEY_FAMILIES = [
  {
    key: 'C',
    mode: 'major',
    tonic: 'C',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    core: ['C', 'F', 'G'],
    relative: ['Dm', 'Em', 'Am'],
    dim: 'Bdim',
    allChords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    dominant7: 'G7',
    relativeMinorKey: 'Am'
  },
  {
    key: 'C#',
    mode: 'major',
    tonic: 'C#',
    scale: ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C'],
    core: ['C#', 'F#', 'G#'],
    relative: ['D#m', 'Fm', 'A#m'],
    dim: 'Cdim',
    allChords: ['C#', 'D#m', 'Fm', 'F#', 'G#', 'A#m', 'Cdim'],
    dominant7: 'G#7',
    relativeMinorKey: 'A#m'
  },
  {
    key: 'D',
    mode: 'major',
    tonic: 'D',
    scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    core: ['D', 'G', 'A'],
    relative: ['Em', 'F#m', 'Bm'],
    dim: 'C#dim',
    allChords: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    dominant7: 'A7',
    relativeMinorKey: 'Bm'
  },
  {
    key: 'Eb',
    mode: 'major',
    tonic: 'Eb',
    scale: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    core: ['Eb', 'Ab', 'Bb'],
    relative: ['Fm', 'Gm', 'Cm'],
    dim: 'Ddim',
    allChords: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
    dominant7: 'Bb7',
    relativeMinorKey: 'Cm'
  },
  {
    key: 'E',
    mode: 'major',
    tonic: 'E',
    scale: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    core: ['E', 'A', 'B'],
    relative: ['F#m', 'G#m', 'C#m'],
    dim: 'D#dim',
    allChords: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
    dominant7: 'B7',
    relativeMinorKey: 'C#m'
  },
  {
    key: 'F',
    mode: 'major',
    tonic: 'F',
    scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    core: ['F', 'Bb', 'C'],
    relative: ['Gm', 'Am', 'Dm'],
    dim: 'Edim',
    allChords: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
    dominant7: 'C7',
    relativeMinorKey: 'Dm'
  },
  {
    key: 'F#',
    mode: 'major',
    tonic: 'F#',
    scale: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'],
    core: ['F#', 'B', 'C#'],
    relative: ['G#m', 'A#m', 'D#m'],
    dim: 'Fdim',
    allChords: ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'Fdim'],
    dominant7: 'C#7',
    relativeMinorKey: 'D#m'
  },
  {
    key: 'G',
    mode: 'major',
    tonic: 'G',
    scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    core: ['G', 'C', 'D'],
    relative: ['Am', 'Bm', 'Em'],
    dim: 'F#dim',
    allChords: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    dominant7: 'D7',
    relativeMinorKey: 'Em'
  },
  {
    key: 'Ab',
    mode: 'major',
    tonic: 'Ab',
    scale: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    core: ['Ab', 'Db', 'Eb'],
    relative: ['Bbm', 'Cm', 'Fm'],
    dim: 'Gdim',
    allChords: ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
    dominant7: 'Eb7',
    relativeMinorKey: 'Fm'
  },
  {
    key: 'A',
    mode: 'major',
    tonic: 'A',
    scale: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    core: ['A', 'D', 'E'],
    relative: ['Bm', 'C#m', 'F#m'],
    dim: 'G#dim',
    allChords: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
    dominant7: 'E7',
    relativeMinorKey: 'F#m'
  },
  {
    key: 'Bb',
    mode: 'major',
    tonic: 'Bb',
    scale: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    core: ['Bb', 'Eb', 'F'],
    relative: ['Cm', 'Dm', 'Gm'],
    dim: 'Adim',
    allChords: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
    dominant7: 'F7',
    relativeMinorKey: 'Gm'
  },
  {
    key: 'B',
    mode: 'major',
    tonic: 'B',
    scale: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    core: ['B', 'E', 'F#'],
    relative: ['C#m', 'D#m', 'G#m'],
    dim: 'A#dim',
    allChords: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
    dominant7: 'F#7',
    relativeMinorKey: 'G#m'
  }
];

export const MINOR_KEY_FAMILIES = [
  {
    key: 'Cm',
    mode: 'minor',
    tonic: 'Cm',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    core: ['Cm', 'Fm', 'Gm'],
    relativeMajor: ['Eb', 'Ab', 'Bb'],
    dim: 'Ddim',
    allChords: ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
    harmonicV7: 'G7',
    relativeMajorKey: 'Eb'
  },
  {
    key: 'C#m',
    mode: 'minor',
    tonic: 'C#m',
    scale: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    core: ['C#m', 'F#m', 'G#m'],
    relativeMajor: ['E', 'A', 'B'],
    dim: 'D#dim',
    allChords: ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'],
    harmonicV7: 'G#7',
    relativeMajorKey: 'E'
  },
  {
    key: 'Dm',
    mode: 'minor',
    tonic: 'Dm',
    scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    core: ['Dm', 'Gm', 'Am'],
    relativeMajor: ['F', 'Bb', 'C'],
    dim: 'Edim',
    allChords: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
    harmonicV7: 'A7',
    relativeMajorKey: 'F'
  },
  {
    key: 'Ebm',
    mode: 'minor',
    tonic: 'Ebm',
    scale: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    core: ['Ebm', 'Abm', 'Bbm'],
    relativeMajor: ['Gb', 'Cb', 'Db'],
    dim: 'Fdim',
    allChords: ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db'],
    harmonicV7: 'Bb7',
    relativeMajorKey: 'Gb'
  },
  {
    key: 'Em',
    mode: 'minor',
    tonic: 'Em',
    scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    core: ['Em', 'Am', 'Bm'],
    relativeMajor: ['G', 'C', 'D'],
    dim: 'F#dim',
    allChords: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
    harmonicV7: 'B7',
    relativeMajorKey: 'G'
  },
  {
    key: 'Fm',
    mode: 'minor',
    tonic: 'Fm',
    scale: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    core: ['Fm', 'Bbm', 'Cm'],
    relativeMajor: ['Ab', 'Db', 'Eb'],
    dim: 'Gdim',
    allChords: ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'],
    harmonicV7: 'C7',
    relativeMajorKey: 'Ab'
  },
  {
    key: 'F#m',
    mode: 'minor',
    tonic: 'F#m',
    scale: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    core: ['F#m', 'Bm', 'C#m'],
    relativeMajor: ['A', 'D', 'E'],
    dim: 'G#dim',
    allChords: ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'],
    harmonicV7: 'C#7',
    relativeMajorKey: 'A'
  },
  {
    key: 'Gm',
    mode: 'minor',
    tonic: 'Gm',
    scale: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    core: ['Gm', 'Cm', 'Dm'],
    relativeMajor: ['Bb', 'Eb', 'F'],
    dim: 'Adim',
    allChords: ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'],
    harmonicV7: 'D7',
    relativeMajorKey: 'Bb'
  },
  {
    key: 'G#m',
    mode: 'minor',
    tonic: 'G#m',
    scale: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    core: ['G#m', 'C#m', 'D#m'],
    relativeMajor: ['B', 'E', 'F#'],
    dim: 'A#dim',
    allChords: ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'],
    harmonicV7: 'D#7',
    relativeMajorKey: 'B'
  },
  {
    key: 'Am',
    mode: 'minor',
    tonic: 'Am',
    scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    core: ['Am', 'Dm', 'Em'],
    relativeMajor: ['C', 'F', 'G'],
    dim: 'Bdim',
    allChords: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
    harmonicV7: 'E7',
    relativeMajorKey: 'C'
  },
  {
    key: 'Bbm',
    mode: 'minor',
    tonic: 'Bbm',
    scale: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    core: ['Bbm', 'Ebm', 'Fm'],
    relativeMajor: ['Db', 'Gb', 'Ab'],
    dim: 'Cdim',
    allChords: ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab'],
    harmonicV7: 'F7',
    relativeMajorKey: 'Db'
  },
  {
    key: 'Bm',
    mode: 'minor',
    tonic: 'Bm',
    scale: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    core: ['Bm', 'Em', 'F#m'],
    relativeMajor: ['D', 'G', 'A'],
    dim: 'C#dim',
    allChords: ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'],
    harmonicV7: 'F#7',
    relativeMajorKey: 'D'
  }
];

export const ALL_KEY_FAMILIES = [...MAJOR_KEY_FAMILIES, ...MINOR_KEY_FAMILIES];

/**
 * Enharmonic equivalence map for internal comparison only.
 * Preserves original user notation in display outputs.
 */
export const ENHARMONIC_EQUIVALENTS = {
  'C#': 'Db',
  'Db': 'C#',
  'D#': 'Eb',
  'Eb': 'D#',
  'F#': 'Gb',
  'Gb': 'F#',
  'G#': 'Ab',
  'Ab': 'G#',
  'A#': 'Bb',
  'Bb': 'A#'
};

/**
 * Extracts formatted Key Guide details for any selected key.
 * @param {string} keyName - e.g. "C", "Am", "F#", "G#m", "Eb"
 * @returns {{ key: string, mode: string, label: string, scale: string[], scaleFormatted: string, coreChords: Array<{chord: string, notes: string}>, relativeChords: Array<{chord: string, notes: string}>, dimChord: {chord: string, notes: string}|null, allChords: string[], allChordsFormatted: string }|null}
 */
export function getKeyGuideData(keyName) {
  if (!keyName || typeof keyName !== 'string') return null;

  const clean = keyName.trim().replace(/♯/g, '#').replace(/♭/g, 'b');

  // Match key family directly
  let family = ALL_KEY_FAMILIES.find((f) => f.key.toLowerCase() === clean.toLowerCase());

  // Fallback to enharmonic equivalent if needed
  if (!family) {
    const enharmonic =
      ENHARMONIC_EQUIVALENTS[clean] ||
      (clean.endsWith('m') && ENHARMONIC_EQUIVALENTS[clean.slice(0, -1)]
        ? ENHARMONIC_EQUIVALENTS[clean.slice(0, -1)] + 'm'
        : null);
    if (enharmonic) {
      family = ALL_KEY_FAMILIES.find((f) => f.key.toLowerCase() === enharmonic.toLowerCase());
    }
  }

  if (!family) return null;

  const isMinor = family.mode === 'minor';
  const displayRoot = isMinor ? family.key.replace(/m$/i, '') : family.key;
  const label = `${displayRoot} ${isMinor ? 'Minor' : 'Major'}`;

  const formatTriadNotes = (chordName) => {
    const res = getChordNotes(chordName);
    return res && res.notes ? res.notes.replace(/-/g, ' · ') : chordName;
  };

  const coreChords = (family.core || []).map((chord) => ({
    chord,
    notes: formatTriadNotes(chord)
  }));

  const relList = isMinor
    ? (family.relativeMajor || family.relative || [])
    : (family.relative || []);
  const relativeChords = relList.map((chord) => ({
    chord,
    notes: formatTriadNotes(chord)
  }));

  const dimChord = family.dim
    ? {
        chord: family.dim,
        notes: formatTriadNotes(family.dim)
      }
    : null;

  const scale = family.scale || [];
  const scaleFormatted = scale.join(' · ');

  const allChords = family.allChords || [];
  const allChordsFormatted = allChords.join(' · ');

  return {
    key: family.key,
    mode: family.mode,
    label,
    scale,
    scaleFormatted,
    coreChords,
    relativeChords,
    dimChord,
    allChords,
    allChordsFormatted
  };
}
