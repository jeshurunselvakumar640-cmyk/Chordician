import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  splitLinkedLine,
  mergeLinkedLines,
  buildChordLineFromList,
  extractLeadNotesFromLine,
  buildLeadLineFromList,
  normalizeSectionRows,
  normalizeSongSectionsForEditor
} from '../../utils/linkedChordEditorHelper.js';

describe('Interactive Song Editor: 3-Layer Synchronization (v4.2)', () => {
  // 1. Chords + lyrics + lead — split middle
  it('1. Chords + lyrics + lead — split in middle with exact synchronization', () => {
    const chordLine = 'C       G       Am';
    const lyricLine = 'Hallelujah my Lord';
    const leadLine =  'E4      G4      A4';
    const splitIndex = 10; // "Hallelujah| my Lord"

    const res = splitLinkedLine(chordLine, lyricLine, splitIndex, leadLine);

    assert.strictEqual(res.line1.lyrics, 'Hallelujah');
    assert.strictEqual(res.line2.lyrics, ' my Lord');

    // Chords: 'C       G' in line1, 'Am' shifted in line2
    assert.strictEqual(res.line1.chords, 'C       G');
    assert.ok(res.line2.chords.includes('Am'));

    // Lead notes: E4 (at 0), G4 (at 8) in line1; A4 (at 16 -> pos 6) in line2
    assert.ok(res.line1.lead.includes('E4') && res.line1.lead.includes('G4'));
    assert.ok(res.line2.lead.includes('A4'));
    assert.strictEqual(res.line2.lead.indexOf('A4'), 6);
  });

  // 2. Split at beginning
  it('2. Split at beginning (splitIndex = 0)', () => {
    const chordLine = 'C       G';
    const lyricLine = 'Amazing grace';
    const leadLine  = 'C4      E4';

    const res = splitLinkedLine(chordLine, lyricLine, 0, leadLine);

    assert.strictEqual(res.line1.lyrics, '');
    assert.strictEqual(res.line2.lyrics, 'Amazing grace');
    assert.strictEqual(res.line1.chords, '');
    assert.strictEqual(res.line2.chords, 'C       G');
    assert.strictEqual(res.line1.lead, '');
    assert.strictEqual(res.line2.lead, 'C4      E4');
  });

  // 3. Split at end
  it('3. Split at end (splitIndex = length)', () => {
    const chordLine = 'C       G';
    const lyricLine = 'Amazing grace';
    const leadLine  = 'C4      E4';

    const res = splitLinkedLine(chordLine, lyricLine, lyricLine.length, leadLine);

    assert.strictEqual(res.line1.lyrics, 'Amazing grace');
    assert.strictEqual(res.line2.lyrics, '');
    assert.strictEqual(res.line1.chords, 'C       G');
    assert.strictEqual(res.line2.chords, '');
    assert.strictEqual(res.line1.lead, 'C4      E4');
    assert.strictEqual(res.line2.lead, '');
  });

  // 4. Merge
  it('4. Merge two lines with chords, lyrics, and lead on Backspace', () => {
    const line1 = {
      chords: 'C       F',
      lyrics: 'Amazing grace ',
      lead:   'C4      F4'
    };
    const line2 = {
      chords: 'G       C',
      lyrics: 'how sweet the sound',
      lead:   'G4      C5'
    };

    const merged = mergeLinkedLines(line1, line2);

    assert.strictEqual(merged.mergeOffset, 14);
    assert.strictEqual(merged.lyrics, 'Amazing grace how sweet the sound');

    // Chords should contain all 4 chords with correct relative offsets
    assert.ok(merged.chords.startsWith('C'));
    assert.ok(merged.chords.includes('F'));
    assert.ok(merged.chords.includes('G'));
    assert.ok(merged.chords.includes('C'));

    // Lead should contain all 4 notes
    assert.ok(merged.lead.includes('C4'));
    assert.ok(merged.lead.includes('F4'));
    assert.ok(merged.lead.includes('G4'));
    assert.ok(merged.lead.includes('C5'));
  });

  // 5. Lead only on first half
  it('5. Lead content only on the first half', () => {
    const chordLine = 'D       A       G';
    const lyricLine = 'The Lord is my Shepherd';
    const leadLine  = 'D4      A4';
    const splitIndex = 12; // "The Lord is |my Shepherd"

    const res = splitLinkedLine(chordLine, lyricLine, splitIndex, leadLine);

    assert.strictEqual(res.line1.lyrics, 'The Lord is ');
    assert.strictEqual(res.line2.lyrics, 'my Shepherd');
    assert.strictEqual(res.line1.lead, 'D4      A4');
    assert.strictEqual(res.line2.lead, '');
  });

  // 6. Lead only on second half
  it('6. Lead content only on the second half', () => {
    const chordLine = 'D               G';
    const lyricLine = 'The Lord is my Shepherd';
    const leadLine  = '                G4 B4';
    const splitIndex = 12;

    const res = splitLinkedLine(chordLine, lyricLine, splitIndex, leadLine);

    assert.strictEqual(res.line1.lyrics, 'The Lord is ');
    assert.strictEqual(res.line2.lyrics, 'my Shepherd');
    assert.strictEqual(res.line1.lead, '');
    assert.ok(res.line2.lead.includes('G4') && res.line2.lead.includes('B4'));
  });

  // 7. No lead (chords + lyrics pair)
  it('7. No lead content (returns null lead without phantom data)', () => {
    const chordLine = 'Em      C       G';
    const lyricLine = 'Great is Your love';

    const res = splitLinkedLine(chordLine, lyricLine, 8, null);

    assert.strictEqual(res.line1.lead, null);
    assert.strictEqual(res.line2.lead, null);
    assert.strictEqual(res.line1.lyrics, 'Great is');
    assert.strictEqual(res.line2.lyrics, ' Your love');

    const merged = mergeLinkedLines(
      { chords: res.line1.chords, lyrics: res.line1.lyrics, lead: null },
      { chords: res.line2.chords, lyrics: res.line2.lyrics, lead: null }
    );
    assert.strictEqual(merged.lead, null);
    assert.strictEqual(merged.lyrics, 'Great is Your love');
  });

  // 8. Multiple consecutive linked triplets
  it('8. Multiple consecutive linked triplets preserve order and isolation', () => {
    const rows = [
      { id: 'c1', type: 'chords', content: 'C       G' },
      { id: 'l1', type: 'lyrics', content: 'Line 1 lyrics here' },
      { id: 'ld1', type: 'lead', content: 'C4      G4' },
      { id: 'c2', type: 'chords', content: 'Am      F' },
      { id: 'l2', type: 'lyrics', content: 'Line 2 lyrics here' },
      { id: 'ld2', type: 'lead', content: 'A4      F4' }
    ];

    // Split Line 1 at index 7 ("Line 1 |lyrics here")
    const splitRes = splitLinkedLine(rows[0].content, rows[1].content, 7, rows[2].content);

    const newRows = [
      { ...rows[0], content: splitRes.line1.chords },
      { ...rows[1], content: splitRes.line1.lyrics },
      { ...rows[2], content: splitRes.line1.lead },
      { id: 'c1_b', type: 'chords', content: splitRes.line2.chords },
      { id: 'l1_b', type: 'lyrics', content: splitRes.line2.lyrics },
      { id: 'ld1_b', type: 'lead', content: splitRes.line2.lead },
      rows[3],
      rows[4],
      rows[5]
    ];

    assert.strictEqual(newRows.length, 9);
    // Unrelated Line 2 triplet is completely untouched
    assert.strictEqual(newRows[6].id, 'c2');
    assert.strictEqual(newRows[7].id, 'l2');
    assert.strictEqual(newRows[8].id, 'ld2');
    assert.strictEqual(newRows[6].content, 'Am      F');
    assert.strictEqual(newRows[7].content, 'Line 2 lyrics here');
    assert.strictEqual(newRows[8].content, 'A4      F4');
  });

  // 9. Unicode / Tamil / Hindi lyrics with chords and lead
  it('9. Unicode / Tamil / Hindi non-ASCII lyrics maintain character-level sync', () => {
    // Tamil: "இயேசுவின் பின்னால் நான் செல்வேன்" (31 characters)
    const tamilLyrics = 'இயேசுவின் பின்னால் நான் செல்வேன்';
    const chords = 'F            Bb          C';
    const lead   = 'F4           D4          E4';

    // Split at index 19 ("இயேசுவின் பின்னால் |நான் செல்வேன்")
    const splitIndex = 19;
    const splitRes = splitLinkedLine(chords, tamilLyrics, splitIndex, lead);

    assert.strictEqual(splitRes.line1.lyrics, 'இயேசுவின் பின்னால் ');
    assert.strictEqual(splitRes.line2.lyrics, 'நான் செல்வேன்');

    // Chords and lead before index 18 are in line1, after in line2
    assert.ok(splitRes.line1.chords.includes('F') && splitRes.line1.chords.includes('Bb'));
    assert.ok(splitRes.line2.chords.includes('C'));
    assert.ok(splitRes.line1.lead.includes('F4') && splitRes.line1.lead.includes('D4'));
    assert.ok(splitRes.line2.lead.includes('E4'));

    // Hindi: "येशु मसीह का नाम"
    const hindiLyrics = 'येशु मसीह का नाम';
    const hindiChords = 'C     G    Am';
    const hindiLead   = 'C4    B3   A3';
    const hindiSplit = splitLinkedLine(hindiChords, hindiLyrics, 10, hindiLead);
    assert.strictEqual(hindiSplit.line1.lyrics, 'येशु मसीह ');
    assert.strictEqual(hindiSplit.line2.lyrics, 'का नाम');
  });

  // 10. Split -> merge round trip
  it('10. Split -> Merge round trip recovers original content and alignment', () => {
    const originalChords = 'C       F       G       C';
    const originalLyrics = 'Amazing grace how sweet the sound';
    const originalLead   = 'E4      A4      B4      C5';

    // Split at index 14 ("Amazing grace |how sweet the sound")
    const split = splitLinkedLine(originalChords, originalLyrics, 14, originalLead);

    // Merge back
    const merged = mergeLinkedLines(
      { chords: split.line1.chords, lyrics: split.line1.lyrics, lead: split.line1.lead },
      { chords: split.line2.chords, lyrics: split.line2.lyrics, lead: split.line2.lead }
    );

    assert.strictEqual(merged.lyrics, originalLyrics);
    assert.strictEqual(merged.chords.trim(), originalChords.trim());
    assert.strictEqual(merged.lead.trim(), originalLead.trim());
    assert.strictEqual(merged.mergeOffset, 14);
  });
});

describe('Standard Editor Row Order: Chords -> Lyrics -> Lead (v4.5)', () => {
  // Test 1: Lyrics only
  it('1. Normalizes lyrics-only lines to [blank chords, lyrics, blank lead]', () => {
    const input = [
      { id: 'l1', type: 'lyrics', content: 'Main Nahin, Main Nahin,' },
      { id: 'l2', type: 'lyrics', content: 'Mujhamen Jeesas Jeeta Hai' }
    ];

    const normalized = normalizeSectionRows(input);
    assert.strictEqual(normalized.length, 6, '2 lyric lines * 3 rows = 6 rows');

    // Line 1 trio
    assert.strictEqual(normalized[0].type, 'chords');
    assert.strictEqual(normalized[0].content, '');
    assert.strictEqual(normalized[1].type, 'lyrics');
    assert.strictEqual(normalized[1].content, 'Main Nahin, Main Nahin,');
    assert.strictEqual(normalized[2].type, 'lead');
    assert.strictEqual(normalized[2].content, '');

    // Line 2 trio
    assert.strictEqual(normalized[3].type, 'chords');
    assert.strictEqual(normalized[3].content, '');
    assert.strictEqual(normalized[4].type, 'lyrics');
    assert.strictEqual(normalized[4].content, 'Mujhamen Jeesas Jeeta Hai');
    assert.strictEqual(normalized[5].type, 'lead');
    assert.strictEqual(normalized[5].content, '');
  });

  // Test 2: Chords + lyrics
  it('2. Normalizes chords + lyrics lines to [chords, lyrics, blank lead]', () => {
    const input = [
      { id: 'c1', type: 'chords', content: 'C        G' },
      { id: 'l1', type: 'lyrics', content: 'Main Nahin, Main Nahin,' }
    ];

    const normalized = normalizeSectionRows(input);
    assert.strictEqual(normalized.length, 3);
    assert.strictEqual(normalized[0].type, 'chords');
    assert.strictEqual(normalized[0].content, 'C        G');
    assert.strictEqual(normalized[1].type, 'lyrics');
    assert.strictEqual(normalized[1].content, 'Main Nahin, Main Nahin,');
    assert.strictEqual(normalized[2].type, 'lead');
    assert.strictEqual(normalized[2].content, '');
  });

  // Test 3: Lyrics + lead
  it('3. Normalizes lyrics + lead lines to [blank chords, lyrics, lead]', () => {
    const input = [
      { id: 'l1', type: 'lyrics', content: 'Main Nahin, Main Nahin,' },
      { id: 'ld1', type: 'lead', content: 'c   d    e   f' }
    ];

    const normalized = normalizeSectionRows(input);
    assert.strictEqual(normalized.length, 3);
    assert.strictEqual(normalized[0].type, 'chords');
    assert.strictEqual(normalized[0].content, '');
    assert.strictEqual(normalized[1].type, 'lyrics');
    assert.strictEqual(normalized[1].content, 'Main Nahin, Main Nahin,');
    assert.strictEqual(normalized[2].type, 'lead');
    assert.strictEqual(normalized[2].content, 'c   d    e   f');
  });

  // Test 4: Chords + lyrics + lead
  it('4. Preserves full chords + lyrics + lead lines as [chords, lyrics, lead]', () => {
    const input = [
      { id: 'c1', type: 'chords', content: 'C        G' },
      { id: 'l1', type: 'lyrics', content: 'Main Nahin, Main Nahin,' },
      { id: 'ld1', type: 'lead', content: 'c   d    e   f' }
    ];

    const normalized = normalizeSectionRows(input);
    assert.strictEqual(normalized.length, 3);
    assert.strictEqual(normalized[0].type, 'chords');
    assert.strictEqual(normalized[0].content, 'C        G');
    assert.strictEqual(normalized[1].type, 'lyrics');
    assert.strictEqual(normalized[1].content, 'Main Nahin, Main Nahin,');
    assert.strictEqual(normalized[2].type, 'lead');
    assert.strictEqual(normalized[2].content, 'c   d    e   f');
  });

  // Test 5: Existing lead content preserved unchanged
  it('5. Existing Lead notes content is preserved byte-for-byte unchanged', () => {
    const leadString = "EE   AAA   AC#'   BA BG:4";
    const input = [
      { id: 'l1', type: 'lyrics', content: 'Maravaamal Ninaiththeeraiyaa' },
      { id: 'ld1', type: 'lead', content: leadString }
    ];

    const normalized = normalizeSectionRows(input);
    const leadRow = normalized.find(r => r.type === 'lead');
    assert.strictEqual(leadRow.content, leadString);
  });

  // Test 6: Existing chord qualities preserved unchanged
  it('6. Existing chord qualities (G#m, C#m, F#7, Bb, D/F#) preserved unchanged', () => {
    const chordString = 'G#m      C#m      F#7      Bb      D/F#';
    const input = [
      { id: 'c1', type: 'chords', content: chordString },
      { id: 'l1', type: 'lyrics', content: 'Holy Holy Lord God Almighty' }
    ];

    const normalized = normalizeSectionRows(input);
    const chordRow = normalized.find(r => r.type === 'chords');
    assert.strictEqual(chordRow.content, chordString);
  });

  // Test 7: Existing lyrics preserved unchanged
  it('7. Existing lyrics text and repeat markers are preserved unchanged', () => {
    const lyricString = 'Pavitra Aatma Basata Hai-2 (x2)';
    const input = [
      { id: 'l1', type: 'lyrics', content: lyricString }
    ];

    const normalized = normalizeSectionRows(input);
    const lyricRow = normalized.find(r => r.type === 'lyrics');
    assert.strictEqual(lyricRow.content, lyricString);
  });

  // Test 8: Multiple sections normalized independently
  it('8. Multiple sections normalize independently to standard row order', () => {
    const sections = [
      {
        id: 'sec1',
        name: 'Chorus',
        rows: [
          { id: 'l1', type: 'lyrics', content: 'Chorus line 1' }
        ]
      },
      {
        id: 'sec2',
        name: 'Verse 1',
        rows: [
          { id: 'c2', type: 'chords', content: 'D      A' },
          { id: 'l2', type: 'lyrics', content: 'Verse line 1' }
        ]
      }
    ];

    const normalized = normalizeSongSectionsForEditor(sections);
    assert.strictEqual(normalized.length, 2);

    // Section 1 has 3 rows: chords (blank), lyrics, lead (blank)
    assert.strictEqual(normalized[0].rows.length, 3);
    assert.strictEqual(normalized[0].rows[0].type, 'chords');
    assert.strictEqual(normalized[0].rows[0].content, '');
    assert.strictEqual(normalized[0].rows[1].type, 'lyrics');
    assert.strictEqual(normalized[0].rows[1].content, 'Chorus line 1');
    assert.strictEqual(normalized[0].rows[2].type, 'lead');
    assert.strictEqual(normalized[0].rows[2].content, '');

    // Section 2 has 3 rows: chords, lyrics, lead (blank)
    assert.strictEqual(normalized[1].rows.length, 3);
    assert.strictEqual(normalized[1].rows[0].type, 'chords');
    assert.strictEqual(normalized[1].rows[0].content, 'D      A');
    assert.strictEqual(normalized[1].rows[1].type, 'lyrics');
    assert.strictEqual(normalized[1].rows[1].content, 'Verse line 1');
    assert.strictEqual(normalized[1].rows[2].type, 'lead');
    assert.strictEqual(normalized[1].rows[2].content, '');
  });
});
