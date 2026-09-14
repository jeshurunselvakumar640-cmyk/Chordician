import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectKeyFromChords,
  detectKeyFromSong,
  normalizeChordForTheory,
  areChordsEquivalent,
  isMinorKey
} from '../../utils/keyDetector.js';

import { ALL_KEY_FAMILIES } from '../../data/keyChordFamilies.js';

// 1. Basic Major Triads
test('Key Detector: C F G -> C Major', () => {
  const result = detectKeyFromChords(['C', 'F', 'G']);
  assert.equal(result.detectedKey, 'C');
  assert.equal(result.mode, 'major');
  assert.equal(result.isMinor, false);
});

test('Key Detector: G C D -> G Major', () => {
  const result = detectKeyFromChords(['G', 'C', 'D']);
  assert.equal(result.detectedKey, 'G');
  assert.equal(result.mode, 'major');
  assert.equal(result.isMinor, false);
});

test('Key Detector: A D E -> A Major', () => {
  const result = detectKeyFromChords(['A', 'D', 'E']);
  assert.equal(result.detectedKey, 'A');
  assert.equal(result.mode, 'major');
  assert.equal(result.isMinor, false);
});

// 2. Minor Triads & Fidelity
test('Key Detector: Am Dm Em -> Am Minor', () => {
  const result = detectKeyFromChords(['Am', 'Dm', 'Em']);
  assert.equal(result.detectedKey, 'Am');
  assert.equal(result.mode, 'minor');
  assert.equal(result.isMinor, true);
});

test('Key Detector: Cm Fm Gm -> Cm Minor', () => {
  const result = detectKeyFromChords(['Cm', 'Fm', 'Gm']);
  assert.equal(result.detectedKey, 'Cm');
  assert.equal(result.mode, 'minor');
  assert.equal(result.isMinor, true);
});

test('Key Detector: Em Am Bm -> Em Minor', () => {
  const result = detectKeyFromChords(['Em', 'Am', 'Bm']);
  assert.equal(result.detectedKey, 'Em');
  assert.equal(result.mode, 'minor');
  assert.equal(result.isMinor, true);
});

test('Key Detector: G#m C#m D#m -> G#m Minor (Fidelity Check)', () => {
  const result = detectKeyFromChords(['G#m', 'C#m', 'D#m']);
  assert.equal(result.detectedKey, 'G#m');
  assert.equal(result.mode, 'minor');
  assert.equal(result.isMinor, true);
});

test('Key Detector: Bm Em F#m -> Bm Minor', () => {
  const result = detectKeyFromChords(['Bm', 'Em', 'F#m']);
  assert.equal(result.detectedKey, 'Bm');
  assert.equal(result.mode, 'minor');
  assert.equal(result.isMinor, true);
});

// 3. Minor vs Relative Major Ambiguity Resolution
test('Key Detector: Ambiguity Resolution - C F G Am favors C Major when C is tonic center', () => {
  const result = detectKeyFromChords(['C', 'F', 'G', 'Am', 'C']);
  assert.equal(result.detectedKey, 'C');
  assert.equal(result.mode, 'major');
});

test('Key Detector: Ambiguity Resolution - Am Dm Em C favors Am Minor when Am is tonic center', () => {
  const result = detectKeyFromChords(['Am', 'Dm', 'Em', 'C', 'Am']);
  assert.equal(result.detectedKey, 'Am');
  assert.equal(result.mode, 'minor');
});

// 4. Quality Preservation & Extensions
test('Key Detector: Am7 contributes to Am minor (not A major)', () => {
  const norm = normalizeChordForTheory('Am7');
  assert.equal(norm.baseChord, 'Am');
  assert.equal(norm.isMinor, true);

  const result = detectKeyFromChords(['Am7', 'Dm7', 'Em7']);
  assert.equal(result.detectedKey, 'Am');
  assert.equal(result.mode, 'minor');
});

test('Key Detector: Cmaj7 contributes to C major', () => {
  const norm = normalizeChordForTheory('Cmaj7');
  assert.equal(norm.baseChord, 'C');
  assert.equal(norm.isMajor7, true);

  const result = detectKeyFromChords(['Cmaj7', 'Fmaj7', 'G7', 'C']);
  assert.equal(result.detectedKey, 'C');
  assert.equal(result.mode, 'major');
});

test('Key Detector: C#maj7, G7, Bdim, Dsus4 preserve chord qualities', () => {
  const normCsMaj7 = normalizeChordForTheory('C#maj7');
  assert.equal(normCsMaj7.baseChord, 'C#');
  assert.equal(normCsMaj7.isMajor7, true);

  const normG7 = normalizeChordForTheory('G7');
  assert.equal(normG7.baseChord, 'G');
  assert.equal(normG7.isDominant7, true);

  const normBdim = normalizeChordForTheory('Bdim');
  assert.equal(normBdim.baseChord, 'Bdim');
  assert.equal(normBdim.isDiminished, true);

  const normDsus4 = normalizeChordForTheory('Dsus4');
  assert.equal(normDsus4.baseChord, 'D');
  assert.equal(normDsus4.isSuspended, true);
});

// 5. Slash Chords Preservation
test('Key Detector: Slash chords strip bass without corrupting roots', () => {
  const norm1 = normalizeChordForTheory('Am/G');
  assert.equal(norm1.baseChord, 'Am');
  assert.equal(norm1.isMinor, true);

  const norm2 = normalizeChordForTheory('G/B');
  assert.equal(norm2.baseChord, 'G');
  assert.equal(norm2.isMinor, false);

  const result = detectKeyFromChords(['Am/G', 'F/A', 'G/B', 'C/E', 'Am']);
  assert.equal(result.mode, 'minor');
});

// 6. Evaluation of All 24 Key Candidates
test('Key Detector: All 24 Candidates are Evaluated', () => {
  assert.equal(ALL_KEY_FAMILIES.length, 24);
  const majorKeys = ALL_KEY_FAMILIES.filter((f) => f.mode === 'major');
  const minorKeys = ALL_KEY_FAMILIES.filter((f) => f.mode === 'minor');
  assert.equal(majorKeys.length, 12);
  assert.equal(minorKeys.length, 12);

  // Test detecting each of the 24 keys from its core triads
  ALL_KEY_FAMILIES.forEach((family) => {
    const chords = [...family.core];
    const detected = detectKeyFromChords(chords);
    assert.equal(
      detected.mode,
      family.mode,
      `Failed mode match for key ${family.key}: expected ${family.mode}, got ${detected.mode}`
    );
  });
});

// 7. Enharmonic Comparison without Notation Rewrite
test('Key Detector: Enharmonics compare accurately without mutating display', () => {
  assert.equal(areChordsEquivalent('C#', 'Db'), true);
  assert.equal(areChordsEquivalent('G#m', 'Abm'), true);
  assert.equal(areChordsEquivalent('F#', 'Gb'), true);
  assert.equal(areChordsEquivalent('A#m', 'Bbm'), true);
  assert.equal(areChordsEquivalent('C', 'Cm'), false);
});

// 8. Song Helper & Manual Key Preservation
test('Key Detector: detectKeyFromSong preserves manual explicit key mode', () => {
  const songWithManualKey = {
    title: 'Manual Song',
    originalKey: 'F#m',
    sections: [
      {
        rows: [
          { type: 'chords', content: 'F#m Bm C#m' }
        ]
      }
    ]
  };

  const detection = detectKeyFromSong(songWithManualKey);
  assert.equal(detection.originalKey, 'F#m');
  assert.equal(detection.mode, 'minor');
  assert.equal(detection.isMinor, true);
  assert.equal(detection.hasExplicitKey, true);
});

// 9. Style Filtering & Pending Styles Logic
test('Style Filtering: Identifies pending vs assigned styles and assignment updates', () => {
  const songs = [
    { id: '1', title: 'Song Without Style', originalKey: 'Am', style: null },
    { id: '2', title: 'Song With Empty Style', originalKey: 'G', style: { name: '' } },
    { id: '3', title: 'Song With Assigned Style', originalKey: 'C', style: { name: 'BollyMix 1', category: 'Indian' } }
  ];

  // Helper to filter pending styles
  const isPendingStyle = (s) => !s?.style || !s.style.name || (typeof s.style === 'string' && !s.style.trim());

  let pending = songs.filter(isPendingStyle);
  assert.equal(pending.length, 2);
  assert.equal(pending[0].id, '1');
  assert.equal(pending[1].id, '2');

  // Assign style to song 1
  songs[0].style = { name: 'PianoBallad', category: 'Ballad' };
  pending = songs.filter(isPendingStyle);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, '2');
});
