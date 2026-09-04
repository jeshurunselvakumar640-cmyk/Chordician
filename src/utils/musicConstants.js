/**
 * Music Theory Constants and Definitions for Chordician
 */

export const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_SCALE  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
];

export const NOTE_TO_SEMITONE = {
  'B#': 0, 'C': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'E#': 5, 'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

// Map whether a key traditionally uses flats or sharps for spelling
export const KEY_SPELLING_PREFERENCE = {
  'C': 'sharp',
  'C#': 'sharp',
  'Db': 'flat',
  'D': 'sharp',
  'D#': 'sharp',
  'Eb': 'flat',
  'E': 'sharp',
  'F': 'flat',
  'F#': 'sharp',
  'Gb': 'flat',
  'G': 'sharp',
  'G#': 'sharp',
  'Ab': 'flat',
  'A': 'sharp',
  'A#': 'flat', // Bb is standard
  'Bb': 'flat',
  'B': 'sharp'
};

export const PRIMARY_LANGUAGES = ['Tamil', 'Hindi', 'English'];

export const SONG_CATEGORIES = [
  'Tamil',
  'Hindi',
  'English',
  'Worship',
  'Hymn',
  'Gospel',
  'Pop',
  'Rock',
  'Classical',
  'Jazz',
  'Blues',
  'Folk',
  'R&B / Soul',
  'Country',
  'Soundtrack',
  'Original',
  'Practice / Study',
  'Other'
];

export const ROW_TYPES = [
  { id: 'chords', label: 'Chords', icon: 'Hash', description: 'Harmonic chords (e.g. C, G/B, Am7, F#m)' },
  { id: 'lyrics', label: 'Lyrics', icon: 'AlignLeft', description: 'Vocal lyrics or verse text' },
  { id: 'lead', label: 'Lead / Right Hand', icon: 'Music', description: 'Melody / piano right-hand lead notes (e.g. E4 G4 C5)' },
  { id: 'bass', label: 'Bass / Left Hand', icon: 'Volume2', description: 'Bassline / piano left-hand notes (e.g. C3 G3 C4)' },
  { id: 'notes', label: 'Performance Notes', icon: 'FileText', description: 'Pedal markings, dynamics, tempo reminders' },
  { id: 'custom', label: 'Custom / Other', icon: 'Layers', description: 'Free-form musical notation or cues' }
];

export const COMMON_SECTION_NAMES = [
  'Intro',
  'Verse 1',
  'Verse 2',
  'Verse 3',
  'Pre-Chorus',
  'Chorus',
  'Chorus 1',
  'Chorus 2',
  'Bridge',
  'Vamp / Loop',
  'Instrumental',
  'Solo',
  'Interlude',
  'Outro',
  'Ending'
];

export const COMMON_CHORD_QUALITIES = [
  '', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', 'dim', 'dim7', 'aug', 'add9', '9', 'm9', '11', '13', '6', 'm6', 'm7b5'
];
