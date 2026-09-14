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
    core: ['C', 'F', 'G'],
    relative: ['Dm', 'Em', 'Am'],
    dim: 'Bdim',
    dominant7: 'G7',
    relativeMinorKey: 'Am'
  },
  {
    key: 'C#',
    mode: 'major',
    tonic: 'C#',
    core: ['C#', 'F#', 'G#'],
    relative: ['D#m', 'Fm', 'A#m'],
    dim: 'Cdim',
    dominant7: 'G#7',
    relativeMinorKey: 'A#m'
  },
  {
    key: 'D',
    mode: 'major',
    tonic: 'D',
    core: ['D', 'G', 'A'],
    relative: ['Em', 'F#m', 'Bm'],
    dim: 'C#dim',
    dominant7: 'A7',
    relativeMinorKey: 'Bm'
  },
  {
    key: 'Eb',
    mode: 'major',
    tonic: 'Eb',
    core: ['Eb', 'Ab', 'Bb'],
    relative: ['Fm', 'Gm', 'Cm'],
    dim: 'Ddim',
    dominant7: 'Bb7',
    relativeMinorKey: 'Cm'
  },
  {
    key: 'E',
    mode: 'major',
    tonic: 'E',
    core: ['E', 'A', 'B'],
    relative: ['F#m', 'G#m', 'C#m'],
    dim: 'D#dim',
    dominant7: 'B7',
    relativeMinorKey: 'C#m'
  },
  {
    key: 'F',
    mode: 'major',
    tonic: 'F',
    core: ['F', 'Bb', 'C'],
    relative: ['Gm', 'Am', 'Dm'],
    dim: 'Edim',
    dominant7: 'C7',
    relativeMinorKey: 'Dm'
  },
  {
    key: 'F#',
    mode: 'major',
    tonic: 'F#',
    core: ['F#', 'B', 'C#'],
    relative: ['G#m', 'A#m', 'D#m'],
    dim: 'Fdim',
    dominant7: 'C#7',
    relativeMinorKey: 'D#m'
  },
  {
    key: 'G',
    mode: 'major',
    tonic: 'G',
    core: ['G', 'C', 'D'],
    relative: ['Am', 'Bm', 'Em'],
    dim: 'F#dim',
    dominant7: 'D7',
    relativeMinorKey: 'Em'
  },
  {
    key: 'Ab',
    mode: 'major',
    tonic: 'Ab',
    core: ['Ab', 'Db', 'Eb'],
    relative: ['Bbm', 'Cm', 'Fm'],
    dim: 'Gdim',
    dominant7: 'Eb7',
    relativeMinorKey: 'Fm'
  },
  {
    key: 'A',
    mode: 'major',
    tonic: 'A',
    core: ['A', 'D', 'E'],
    relative: ['Bm', 'C#m', 'F#m'],
    dim: 'G#dim',
    dominant7: 'E7',
    relativeMinorKey: 'F#m'
  },
  {
    key: 'Bb',
    mode: 'major',
    tonic: 'Bb',
    core: ['Bb', 'Eb', 'F'],
    relative: ['Cm', 'Dm', 'Gm'],
    dim: 'Adim',
    dominant7: 'F7',
    relativeMinorKey: 'Gm'
  },
  {
    key: 'B',
    mode: 'major',
    tonic: 'B',
    core: ['B', 'E', 'F#'],
    relative: ['C#m', 'D#m', 'G#m'],
    dim: 'A#dim',
    dominant7: 'F#7',
    relativeMinorKey: 'G#m'
  }
];

export const MINOR_KEY_FAMILIES = [
  {
    key: 'Cm',
    mode: 'minor',
    tonic: 'Cm',
    core: ['Cm', 'Fm', 'Gm'],
    relativeMajor: ['Eb', 'Ab', 'Bb'],
    dim: 'Ddim',
    harmonicV7: 'G7',
    relativeMajorKey: 'Eb'
  },
  {
    key: 'C#m',
    mode: 'minor',
    tonic: 'C#m',
    core: ['C#m', 'F#m', 'G#m'],
    relativeMajor: ['E', 'A', 'B'],
    dim: 'D#dim',
    harmonicV7: 'G#7',
    relativeMajorKey: 'E'
  },
  {
    key: 'Dm',
    mode: 'minor',
    tonic: 'Dm',
    core: ['Dm', 'Gm', 'Am'],
    relativeMajor: ['F', 'Bb', 'C'],
    dim: 'Edim',
    harmonicV7: 'A7',
    relativeMajorKey: 'F'
  },
  {
    key: 'Ebm',
    mode: 'minor',
    tonic: 'Ebm',
    core: ['Ebm', 'Abm', 'Bbm'],
    relativeMajor: ['Gb', 'Cb', 'Db'],
    dim: 'Fdim',
    harmonicV7: 'Bb7',
    relativeMajorKey: 'Gb'
  },
  {
    key: 'Em',
    mode: 'minor',
    tonic: 'Em',
    core: ['Em', 'Am', 'Bm'],
    relativeMajor: ['G', 'C', 'D'],
    dim: 'F#dim',
    harmonicV7: 'B7',
    relativeMajorKey: 'G'
  },
  {
    key: 'Fm',
    mode: 'minor',
    tonic: 'Fm',
    core: ['Fm', 'Bbm', 'Cm'],
    relativeMajor: ['Ab', 'Db', 'Eb'],
    dim: 'Gdim',
    harmonicV7: 'C7',
    relativeMajorKey: 'Ab'
  },
  {
    key: 'F#m',
    mode: 'minor',
    tonic: 'F#m',
    core: ['F#m', 'Bm', 'C#m'],
    relativeMajor: ['A', 'D', 'E'],
    dim: 'G#dim',
    harmonicV7: 'C#7',
    relativeMajorKey: 'A'
  },
  {
    key: 'Gm',
    mode: 'minor',
    tonic: 'Gm',
    core: ['Gm', 'Cm', 'Dm'],
    relativeMajor: ['Bb', 'Eb', 'F'],
    dim: 'Adim',
    harmonicV7: 'D7',
    relativeMajorKey: 'Bb'
  },
  {
    key: 'G#m',
    mode: 'minor',
    tonic: 'G#m',
    core: ['G#m', 'C#m', 'D#m'],
    relativeMajor: ['B', 'E', 'F#'],
    dim: 'A#dim',
    harmonicV7: 'D#7',
    relativeMajorKey: 'B'
  },
  {
    key: 'Am',
    mode: 'minor',
    tonic: 'Am',
    core: ['Am', 'Dm', 'Em'],
    relativeMajor: ['C', 'F', 'G'],
    dim: 'Bdim',
    harmonicV7: 'E7',
    relativeMajorKey: 'C'
  },
  {
    key: 'Bbm',
    mode: 'minor',
    tonic: 'Bbm',
    core: ['Bbm', 'Ebm', 'Fm'],
    relativeMajor: ['Db', 'Gb', 'Ab'],
    dim: 'Cdim',
    harmonicV7: 'F7',
    relativeMajorKey: 'Db'
  },
  {
    key: 'Bm',
    mode: 'minor',
    tonic: 'Bm',
    core: ['Bm', 'Em', 'F#m'],
    relativeMajor: ['D', 'G', 'A'],
    dim: 'C#dim',
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
