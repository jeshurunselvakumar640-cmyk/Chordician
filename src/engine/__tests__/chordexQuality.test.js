import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inferOriginalKey,
  normalizeKey,
  buildAlignedChordString,
  convertChordexToChordician
} from '../../services/chordexConverter.js';

test('Chordex Fidelity - G#m is strictly distinct from G#', () => {
  const gSharpMinorKey = normalizeKey('G#m');
  const gSharpMajorKey = normalizeKey('G#');

  assert.equal(gSharpMinorKey, 'G#m');
  assert.equal(gSharpMajorKey, 'G#');
  assert.notEqual(gSharpMinorKey, gSharpMajorKey, 'G#m must not equal G#');
});

test('Chordex Fidelity - Minor Keys Normalization & Inferences', () => {
  const minorKeys = [
    ['Am', 'Am'],
    ['Bm', 'Bm'],
    ['Cm', 'Cm'],
    ['Dm', 'Dm'],
    ['Em', 'Em'],
    ['F#m', 'F#m'],
    ['G#m', 'G#m'],
    ['C#m', 'C#m'],
    ['Bbm', 'Bbm'],
    ['D#m', 'D#m'],
    ['Ebm', 'Ebm'],
    ['Fm', 'Fm'],
    ['Gm', 'Gm'],
    ['A#m', 'A#m'],
    ['Abm', 'Abm']
  ];

  for (const [input, expected] of minorKeys) {
    assert.equal(normalizeKey(input), expected, `Failed normalizing minor key: ${input}`);
    assert.equal(inferOriginalKey([], input), expected, `Failed inferring provided minor key: ${input}`);

    // Test inferring from first chord in section
    const sections = [
      {
        lines: [
          {
            chords: [{ chord: input, position: 0 }]
          }
        ]
      }
    ];
    assert.equal(inferOriginalKey(sections, null), expected, `Failed inferring key from first chord: ${input}`);
  }
});

test('Chordex Fidelity - Major Keys Normalization & Inferences', () => {
  const majorKeys = [
    ['A', 'A'],
    ['B', 'B'],
    ['C', 'C'],
    ['C#', 'C#'],
    ['D', 'D'],
    ['E', 'E'],
    ['F', 'F'],
    ['F#', 'F#'],
    ['G', 'G'],
    ['G#', 'G#'],
    ['Bb', 'Bb'],
    ['Eb', 'Eb'],
    ['Ab', 'Ab']
  ];

  for (const [input, expected] of majorKeys) {
    assert.equal(normalizeKey(input), expected, `Failed normalizing major key: ${input}`);
    assert.equal(inferOriginalKey([], input), expected, `Failed inferring provided major key: ${input}`);

    const sections = [
      {
        lines: [
          {
            chords: [{ chord: input, position: 0 }]
          }
        ]
      }
    ];
    assert.equal(inferOriginalKey(sections, null), expected, `Failed inferring key from first major chord: ${input}`);
  }
});

test('Chordex Fidelity - Key Inference from Extended/Complex Chords', () => {
  const complexChords = [
    ['G#7', 'G#'],
    ['G#m7', 'G#m'],
    ['C#maj7', 'C#'],
    ['F#dim', 'F#'],
    ['Asus4', 'A'],
    ['Am/G', 'Am'],
    ['G#m/B', 'G#m'],
    ['C/E', 'C'],
    ['F#m7', 'F#m']
  ];

  for (const [chordInput, expectedKey] of complexChords) {
    const sections = [
      {
        lines: [
          {
            chords: [{ chord: chordInput, position: 0 }]
          }
        ]
      }
    ];
    assert.equal(inferOriginalKey(sections, null), expectedKey, `Failed inferring key from complex chord: ${chordInput}`);
  }
});

test('Chordex Fidelity - buildAlignedChordString preserves all chord qualities', () => {
  const chords = [
    { chord: 'G#m', position: 0 },
    { chord: 'G#7', position: 8 },
    { chord: 'G#m7', position: 16 },
    { chord: 'C#maj7', position: 26 },
    { chord: 'F#dim', position: 36 },
    { chord: 'Asus4', position: 46 }
  ];

  const aligned = buildAlignedChordString(chords);
  assert.ok(aligned.includes('G#m'), 'Must contain G#m');
  assert.ok(aligned.includes('G#7'), 'Must contain G#7');
  assert.ok(aligned.includes('G#m7'), 'Must contain G#m7');
  assert.ok(aligned.includes('C#maj7'), 'Must contain C#maj7');
  assert.ok(aligned.includes('F#dim'), 'Must contain F#dim');
  assert.ok(aligned.includes('Asus4'), 'Must contain Asus4');
});

test('Chordex Fidelity - Full convertChordexToChordician Pipeline with G#m and complex chords', () => {
  const mockChordexData = {
    title: 'G#m Test Song',
    artist: 'Worship Artist',
    originalKey: 'G#m',
    overallConfidence: 0.98,
    sections: [
      {
        id: 'sec-1',
        name: 'Verse 1',
        lines: [
          {
            id: 'l-1',
            lyrics: 'Lord You are holy and faithful',
            chords: [
              { chord: 'G#m', position: 0, confidence: 0.99 },
              { chord: 'C#m', position: 13, confidence: 0.97 },
              { chord: 'F#m', position: 22, confidence: 0.96 },
              { chord: 'G#m7', position: 28, confidence: 0.98 }
            ]
          },
          {
            id: 'l-2',
            lyrics: 'Forever and ever Amen',
            chords: [
              { chord: 'C#maj7', position: 0, confidence: 0.95 },
              { chord: 'F#dim', position: 12, confidence: 0.94 },
              { chord: 'Asus4', position: 18, confidence: 0.93 }
            ]
          }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(mockChordexData);

  assert.equal(converted.title, 'G#m Test Song');
  assert.equal(converted.originalKey, 'G#m', 'Original key must remain G#m, not G#');
  assert.equal(converted.sections.length, 1);

  const chordsRow1 = converted.sections[0].rows.find(r => r.type === 'chords');
  assert.ok(chordsRow1, 'Chords row must exist');
  assert.ok(chordsRow1.content.includes('G#m'), 'Chords row must contain G#m');
  assert.ok(chordsRow1.content.includes('C#m'), 'Chords row must contain C#m');
  assert.ok(chordsRow1.content.includes('F#m'), 'Chords row must contain F#m');
  assert.ok(chordsRow1.content.includes('G#m7'), 'Chords row must contain G#m7');

  const chordsRow2 = converted.sections[0].rows.filter(r => r.type === 'chords')[1];
  assert.ok(chordsRow2, 'Second chords row must exist');
  assert.ok(chordsRow2.content.includes('C#maj7'), 'Chords row must contain C#maj7');
  assert.ok(chordsRow2.content.includes('F#dim'), 'Chords row must contain F#dim');
  assert.ok(chordsRow2.content.includes('Asus4'), 'Chords row must contain Asus4');
});
