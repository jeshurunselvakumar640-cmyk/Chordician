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

test('Chordex Section Structure - Multiple lyric lines grouped in a single section without fake chords', () => {
  const lyricsOnlyData = {
    title: 'Multi-line Lyric Song',
    artist: 'Worship Artist',
    sections: [
      {
        id: 'sec-1',
        name: 'Verse 1',
        type: 'verse',
        lines: [
          { id: 'l-1', lyrics: 'Line 1 of verse', chords: [] },
          { id: 'l-2', lyrics: 'Line 2 of verse', chords: [] },
          { id: 'l-3', lyrics: 'Line 3 of verse', chords: [] },
          { id: 'l-4', lyrics: 'Line 4 of verse', chords: [] }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(lyricsOnlyData);
  assert.equal(converted.sections.length, 1, 'Should contain exactly 1 section for all 4 lines');
  assert.equal(converted.sections[0].name, 'Verse 1');

  // Standard 3-layer structure per line: chords (blank), lyrics, lead (blank)
  const rows = converted.sections[0].rows;
  assert.equal(rows.length, 12, '4 lines * 3 rows (chords, lyrics, lead) = 12 rows');

  const chordRows = rows.filter(r => r.type === 'chords');
  const lyricRows = rows.filter(r => r.type === 'lyrics');
  const leadRows = rows.filter(r => r.type === 'lead');

  assert.equal(chordRows.length, 4);
  assert.ok(chordRows.every(r => r.content === ''), 'All chords rows must be blank without fake chords');
  assert.equal(lyricRows.length, 4, 'All 4 lyric lines must be preserved as lyric rows');
  assert.equal(lyricRows[0].content, 'Line 1 of verse');
  assert.equal(lyricRows[3].content, 'Line 4 of verse');
  assert.equal(leadRows.length, 4);
  assert.ok(leadRows.every(r => r.content === ''), 'All lead rows must be blank without fake lead notes');
});

test('Chordex Section Structure - Repetition markers (-2, - 2, (2), x2) preserved intact', () => {
  const repetitionData = {
    title: 'Repetition Marker Test',
    sections: [
      {
        id: 'sec-1',
        name: 'Chorus',
        type: 'chorus',
        lines: [
          { id: 'l-1', lyrics: 'Is Mittee Ke Bartan Mein,', chords: [] },
          { id: 'l-2', lyrics: 'Pavitra Aatma Basata Hai-2', chords: [] },
          { id: 'l-3', lyrics: 'Deh To Meree Hai, Svabhaav Usaka Hai -2', chords: [] },
          { id: 'l-4', lyrics: 'Kaaya Meree Hai, Jindagaanee Usakee Hai (2)', chords: [] },
          { id: 'l-5', lyrics: 'Har Shabd Usaka Hai x2', chords: [] }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(repetitionData);
  assert.equal(converted.sections.length, 1);
  const lyricRows = converted.sections[0].rows.filter(r => r.type === 'lyrics');
  assert.equal(lyricRows.length, 5);
  assert.equal(lyricRows[1].content, 'Pavitra Aatma Basata Hai-2');
  assert.equal(lyricRows[2].content, 'Deh To Meree Hai, Svabhaav Usaka Hai -2');
  assert.equal(lyricRows[3].content, 'Kaaya Meree Hai, Jindagaanee Usakee Hai (2)');
  assert.equal(lyricRows[4].content, 'Har Shabd Usaka Hai x2');
});

test('Chordex Row Structure - Lyrics + Lead detection (no fake chords)', () => {
  const leadData = {
    title: 'Lead Detection Test',
    sections: [
      {
        id: 'sec-1',
        name: 'Chorus',
        type: 'chorus',
        lines: [
          {
            id: 'l-1',
            lyrics: 'Main Nahin, Main Nahin,',
            lead: 'c   d    e   f',
            chords: []
          }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(leadData);
  const rows = converted.sections[0].rows;

  assert.equal(rows.length, 3, 'Must produce standard 3-layer rows: chords, lyrics, lead');
  assert.equal(rows[0].type, 'chords');
  assert.equal(rows[0].content, '', 'Must be blank when no chords exist (no fake chords)');
  assert.equal(rows[1].type, 'lyrics');
  assert.equal(rows[1].content, 'Main Nahin, Main Nahin,');
  assert.equal(rows[2].type, 'lead');
  assert.equal(rows[2].content, 'c   d    e   f');
});

test('Chordex Row Structure - Chords + Lyrics + Lead detected', () => {
  const fullRowData = {
    title: 'Full Row Structure Test',
    sections: [
      {
        id: 'sec-1',
        name: 'Chorus',
        type: 'chorus',
        lines: [
          {
            id: 'l-1',
            lyrics: 'Main Nahin, Main Nahin,',
            lead: 'c   d    e   f',
            chords: [
              { chord: 'C', position: 0 },
              { chord: 'G', position: 9 }
            ]
          }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(fullRowData);
  const rows = converted.sections[0].rows;

  assert.equal(rows.length, 3);
  assert.equal(rows[0].type, 'chords');
  assert.ok(rows[0].content.includes('C'));
  assert.ok(rows[0].content.includes('G'));
  assert.equal(rows[1].type, 'lyrics');
  assert.equal(rows[1].content, 'Main Nahin, Main Nahin,');
  assert.equal(rows[2].type, 'lead');
  assert.equal(rows[2].content, 'c   d    e   f');
});

test('Chordex Real-World Test - "Main Nahin" song structure parsing and conversion', () => {
  const mainNahinData = {
    title: 'Main Nahin, Main Nahin',
    artist: 'Traditional Hindi Worship',
    originalKey: 'C',
    sections: [
      {
        id: 'sec-1',
        name: 'Chorus',
        type: 'chorus',
        lines: [
          { id: 'l1', lyrics: 'Main Nahin, Main Nahin,', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 12 }] },
          { id: 'l2', lyrics: 'Mujhamen Jeesas Jeeta Hai', chords: [{ chord: 'Am', position: 0 }, { chord: 'F', position: 14 }] },
          { id: 'l3', lyrics: 'Is Mittee Ke Bartan Mein,', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 12 }] },
          { id: 'l4', lyrics: 'Pavitra Aatma Basata Hai-2', chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 14 }, { chord: 'C', position: 24 }] }
        ]
      },
      {
        id: 'sec-2',
        name: 'Verse 1',
        type: 'verse',
        lines: [
          { id: 'l5', lyrics: 'Dil To Mera Hai,', chords: [{ chord: 'C', position: 0 }] },
          { id: 'l6', lyrics: 'Par Pyaar Usaka Hai', chords: [{ chord: 'G', position: 0 }] },
          { id: 'l7', lyrics: 'Deh To Meree Hai, Svabhaav Usaka Hai -2', chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 18 }] },
          { id: 'l8', lyrics: 'Svabhaav Usaka Hai', chords: [{ chord: 'C', position: 0 }] },
          { id: 'l9', lyrics: '(Mein Nahin, Main Nahin...)', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 16 }] }
        ]
      },
      {
        id: 'sec-3',
        name: 'Verse 2',
        type: 'verse',
        lines: [
          { id: 'l10', lyrics: 'Haath Hain Mere Hai, Par Sparsh Usaka Hai', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 20 }] },
          { id: 'l11', lyrics: 'Jubaan Meree Hai, Har Shabd Usaka Hai-2', chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 18 }] },
          { id: 'l12', lyrics: 'Har Shabd Usaka Hai', chords: [{ chord: 'C', position: 0 }] },
          { id: 'l13', lyrics: '(Mein Nahin, Mein Nahin...)', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 16 }] }
        ]
      },
      {
        id: 'sec-4',
        name: 'Verse 3',
        type: 'verse',
        lines: [
          { id: 'l14', lyrics: 'Man To Mera Hai, Kalpanaen Usakee Hai', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 18 }] },
          { id: 'l15', lyrics: 'Kaaya Meree Hai, Jindagaanee Usakee Hai-2', chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 19 }] },
          { id: 'l16', lyrics: 'Jindagaanee Usakee Hai', chords: [{ chord: 'C', position: 0 }] },
          { id: 'l17', lyrics: 'Mein Nahin, Mein Nahin..', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 12 }] }
        ]
      }
    ]
  };

  const converted = convertChordexToChordician(mainNahinData);
  assert.equal(converted.sections.length, 4, 'Song must have 4 logical musical sections (Chorus + 3 Verses with refrains)');

  // Section 1: Chorus with 4 lines
  assert.equal(converted.sections[0].name, 'Chorus');
  const sec1Lyrics = converted.sections[0].rows.filter(r => r.type === 'lyrics');
  assert.equal(sec1Lyrics.length, 4, 'Chorus must contain 4 grouped lyric lines');
  assert.equal(sec1Lyrics[3].content, 'Pavitra Aatma Basata Hai-2');

  // Section 2: Verse 1 with 5 lines
  assert.equal(converted.sections[1].name, 'Verse 1');
  const sec2Lyrics = converted.sections[1].rows.filter(r => r.type === 'lyrics');
  assert.equal(sec2Lyrics.length, 5, 'Verse 1 must contain 5 grouped lyric lines including repeat and refrain tag');
  assert.equal(sec2Lyrics[2].content, 'Deh To Meree Hai, Svabhaav Usaka Hai -2');
  assert.equal(sec2Lyrics[4].content, '(Mein Nahin, Main Nahin...)');

  // Section 3: Verse 2 with 4 lines
  assert.equal(converted.sections[2].name, 'Verse 2');
  const sec3Lyrics = converted.sections[2].rows.filter(r => r.type === 'lyrics');
  assert.equal(sec3Lyrics.length, 4);
  assert.equal(sec3Lyrics[1].content, 'Jubaan Meree Hai, Har Shabd Usaka Hai-2');

  // Section 4: Verse 3 with 4 lines
  assert.equal(converted.sections[3].name, 'Verse 3');
  const sec4Lyrics = converted.sections[3].rows.filter(r => r.type === 'lyrics');
  assert.equal(sec4Lyrics.length, 4);
  assert.equal(sec4Lyrics[1].content, 'Kaaya Meree Hai, Jindagaanee Usakee Hai-2');
  assert.equal(sec4Lyrics[3].content, 'Mein Nahin, Mein Nahin..');
});
