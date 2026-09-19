import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLeadTokenToPitch,
  parseLeadLine,
  calculateDiatonicOffset,
  extractLeadSectionsFromSong,
  getLeadNoteCount
} from '../notation/leadPitchParser.js';
import {
  renderSongNotationToSVG,
  getNoteY
} from '../notation/staffNotationRenderer.js';

describe('Musical Notation Engine (Part A)', () => {
  describe('1. Octave Conventions & Scientific Pitch Parsing', () => {
    it('1.1. Basic octave: c d e f g a b -> C3 D3 E3 F3 G3 A3 B3', () => {
      const tokens = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
      const expected = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'];

      tokens.forEach((tok, idx) => {
        const parsed = parseLeadTokenToPitch(tok);
        assert.ok(parsed, `Token "${tok}" should parse`);
        assert.equal(parsed.scientificPitch, expected[idx]);
        assert.equal(parsed.octave, 3);
        assert.equal(parsed.step, tok.toUpperCase());
        assert.equal(parsed.accidental, '');
      });
    });

    it('1.2. Upper octave with single apostrophe: c\' d\' e\' f\' g\' a\' b\' -> C4 D4 E4 F4 G4 A4 B4', () => {
      const tokens = ["c'", "d'", "e'", "f'", "g'", "a'", "b'"];
      const expected = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

      tokens.forEach((tok, idx) => {
        const parsed = parseLeadTokenToPitch(tok);
        assert.ok(parsed, `Token "${tok}" should parse`);
        assert.equal(parsed.scientificPitch, expected[idx]);
        assert.equal(parsed.octave, 4);
      });
    });

    it('1.3. Higher octave with double apostrophe: c\'\' d\'\' e\'\' -> C5 D5 E5', () => {
      const tokens = ["c''", "d''", "e''"];
      const expected = ['C5', 'D5', 'E5'];

      tokens.forEach((tok, idx) => {
        const parsed = parseLeadTokenToPitch(tok);
        assert.ok(parsed);
        assert.equal(parsed.scientificPitch, expected[idx]);
        assert.equal(parsed.octave, 5);
      });
    });

    it('1.4. Lower octave with explicit digits: c2 a2 b2 g2 -> C2 A2 B2 G2', () => {
      const tokens = ['c2', 'a2', 'b2', 'g2'];
      const expected = ['C2', 'A2', 'B2', 'G2'];

      tokens.forEach((tok, idx) => {
        const parsed = parseLeadTokenToPitch(tok);
        assert.ok(parsed);
        assert.equal(parsed.scientificPitch, expected[idx]);
        assert.equal(parsed.octave, 2);
      });
    });

    it('1.5. Explicit numeric octaves: c4 f4 a1 -> C4 F4 A1', () => {
      assert.equal(parseLeadTokenToPitch('c4').scientificPitch, 'C4');
      assert.equal(parseLeadTokenToPitch('f4').scientificPitch, 'F4');
      assert.equal(parseLeadTokenToPitch('a1').scientificPitch, 'A1');
    });

    it('1.6. Mixed sequence: c d e f g a b c\' d\' e\' c2 preserves each octave accurately', () => {
      const line = "c d e f g a b c' d' e' c2";
      const items = parseLeadLine(line);
      const pitches = items.map(it => it.scientificPitch);

      assert.deepEqual(pitches, [
        'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
        'C4', 'D4', 'E4', 'C2'
      ]);
    });
  });

  describe('2. Accidental Handling & Pitch Recognition', () => {
    it('2.1. Preserves sharps: f# -> F#3, f#\' -> F#4, c#2 -> C#2', () => {
      const fsharp3 = parseLeadTokenToPitch('f#');
      assert.equal(fsharp3.scientificPitch, 'F#3');
      assert.equal(fsharp3.step, 'F');
      assert.equal(fsharp3.accidental, '#');
      assert.equal(fsharp3.octave, 3);

      const fsharp4 = parseLeadTokenToPitch("f#'");
      assert.equal(fsharp4.scientificPitch, 'F#4');
      assert.equal(fsharp4.accidental, '#');
      assert.equal(fsharp4.octave, 4);

      const csharp2 = parseLeadTokenToPitch('c#2');
      assert.equal(csharp2.scientificPitch, 'C#2');
      assert.equal(csharp2.accidental, '#');
      assert.equal(csharp2.octave, 2);
    });

    it('2.2. Preserves flats: bb -> Bb3, eb\' -> Eb4, ab2 -> Ab2', () => {
      const bflat3 = parseLeadTokenToPitch('bb');
      assert.equal(bflat3.scientificPitch, 'Bb3');
      assert.equal(bflat3.step, 'B');
      assert.equal(bflat3.accidental, 'b');
      assert.equal(bflat3.octave, 3);

      const eflat4 = parseLeadTokenToPitch("eb'");
      assert.equal(eflat4.scientificPitch, 'Eb4');
      assert.equal(eflat4.accidental, 'b');
      assert.equal(eflat4.octave, 4);

      const aflat2 = parseLeadTokenToPitch('ab2');
      assert.equal(aflat2.scientificPitch, 'Ab2');
      assert.equal(aflat2.accidental, 'b');
      assert.equal(aflat2.octave, 2);
    });

    it('2.3. Unicode sharp and flat symbols: f♯ -> F#3, b♭ -> Bb3', () => {
      assert.equal(parseLeadTokenToPitch('f♯').scientificPitch, 'F#3');
      assert.equal(parseLeadTokenToPitch('b♭').scientificPitch, 'Bb3');
    });

    it('2.4. Barlines and pauses: "|" and "-" parsed cleanly', () => {
      const bar = parseLeadTokenToPitch('|');
      assert.equal(bar.type, 'barline');

      const rest = parseLeadTokenToPitch('-');
      assert.equal(rest.type, 'rest');
    });
  });

  describe('3. Staff Mathematics & Diatonic Coordinates', () => {
    it('3.1. Middle C (C4) has diatonic offset = 0', () => {
      assert.equal(calculateDiatonicOffset('C', 4), 0);
    });

    it('3.2. Treble staff line offsets (E4 to F5)', () => {
      assert.equal(calculateDiatonicOffset('E', 4), 2);  // Line 1 (Bottom line)
      assert.equal(calculateDiatonicOffset('G', 4), 4);  // Line 2
      assert.equal(calculateDiatonicOffset('B', 4), 6);  // Line 3 (Middle line)
      assert.equal(calculateDiatonicOffset('D', 5), 8);  // Line 4
      assert.equal(calculateDiatonicOffset('F', 5), 10); // Line 5 (Top line)
    });

    it('3.3. Lower octaves have exact negative offsets', () => {
      assert.equal(calculateDiatonicOffset('C', 3), -7);
      assert.equal(calculateDiatonicOffset('C', 2), -14);
      assert.equal(calculateDiatonicOffset('A', 3), -2);
    });

    it('3.4. getNoteY maps top line F5 (offset 10) to staffTopY', () => {
      const staffTopY = 50;
      const lineSpacing = 10;
      // F5 (offset 10): noteY = 50 + (10 - 10) * 5 = 50
      assert.equal(getNoteY(10, staffTopY, lineSpacing), 50);
      // B4 (offset 6): noteY = 50 + (10 - 6) * 5 = 70 (Middle line)
      assert.equal(getNoteY(6, staffTopY, lineSpacing), 70);
      // E4 (offset 2): noteY = 50 + (10 - 2) * 5 = 90 (Bottom line)
      assert.equal(getNoteY(2, staffTopY, lineSpacing), 90);
      // C4 (offset 0): noteY = 50 + (10 - 0) * 5 = 100 (Middle C ledger line)
      assert.equal(getNoteY(0, staffTopY, lineSpacing), 100);
    });
  });

  describe('4. Song Lead Extraction & Filtering', () => {
    it('4.1. Extracts lead from song.sections with rows', () => {
      const song = {
        title: 'Lead Test Song',
        key: 'D',
        sections: [
          {
            name: 'Verse 1',
            rows: [
              { type: 'chords', content: 'D  G  A' },
              { type: 'lead', content: "d f# a c' | d' a f#" },
              { type: 'lyrics', content: 'Testing verse lyrics' }
            ]
          }
        ]
      };

      const sections = extractLeadSectionsFromSong(song);
      assert.equal(sections.length, 1);
      assert.equal(sections[0].name, 'Verse 1');
      assert.equal(sections[0].items.filter(i => i.type === 'note').length, 7);
      assert.equal(sections[0].items.filter(i => i.type === 'barline').length, 1);
      assert.equal(getLeadNoteCount(song), 7);
    });

    it('4.2. Extracts lead from song.sections with lines', () => {
      const song = {
        title: 'Line Lead Song',
        sections: [
          {
            name: 'Chorus',
            lines: [
              { lead: 'G3 B3 D4 G4', lyrics: 'Sing praise' }
            ]
          }
        ]
      };

      const sections = extractLeadSectionsFromSong(song);
      assert.equal(sections.length, 1);
      assert.equal(sections[0].items.length, 4);
    });

    it('4.3. Extracts lead from flat song.rows', () => {
      const song = {
        title: 'Flat Song',
        rows: [
          { type: 'lead', content: "C4 E4 G4 C5" }
        ]
      };

      const sections = extractLeadSectionsFromSong(song);
      assert.equal(sections.length, 1);
      assert.equal(sections[0].items.length, 4);
    });

    it('4.4. Ignores songs without meaningful lead', () => {
      const songNoLead = {
        title: 'No Lead Song',
        sections: [
          {
            name: 'Verse',
            rows: [
              { type: 'chords', content: 'G  C  D' },
              { type: 'lyrics', content: 'No lead row here' }
            ]
          }
        ]
      };

      const sections = extractLeadSectionsFromSong(songNoLead);
      assert.equal(sections.length, 0);
      assert.equal(getLeadNoteCount(songNoLead), 0);
    });
  });

  describe('5. Western Staff SVG Generation (PDF Template Matching)', () => {
    it('5.1. Generates valid branded SVG matching PDF template layout', () => {
      const song = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        timeSignature: '3/4',
        sections: [
          {
            name: 'Intro',
            rows: [
              { type: 'lead', content: "d' g' b' d'' | c'' a' f#'" }
            ]
          }
        ]
      };

      const { svg, width, height, noteCount } = renderSongNotationToSVG(song, {
        showNoteNames: true,
        width: 800
      });

      assert.ok(svg.startsWith('<svg'), 'Should start with <svg root tag');
      assert.ok(svg.endsWith('</svg>'), 'Should end with </svg>');
      assert.ok(svg.includes('Amazing Grace'), 'Should include song title');
      assert.ok(svg.includes('John Newton'), 'Should include artist');
      assert.ok(svg.includes('Scale:'), 'Should include scale label');
      assert.ok(svg.includes('CHORDICIAN'), 'Should include PDF watermark');
      assert.ok(svg.includes('Chordician'), 'Should include brand header');
      assert.ok(svg.includes('built by'), 'Should include author letterhead branding');
      assert.ok(svg.includes('© Jeshurun Selvakumar'), 'Should include copyright footer');
      assert.ok(svg.includes('treble-clef'), 'Should include treble clef');
      assert.ok(svg.includes('<ellipse'), 'Should include noteheads');
      assert.ok(svg.includes('stroke-width="1.5"'), 'Should include stems');
      assert.ok(svg.includes('sharp'), 'Should include sharp accidental for F#');
      assert.equal(noteCount, 7);
    });

    it('5.2. Future song support: new in-memory song object automatically renders notation', () => {
      const futureSong = {
        id: 'future_song_123',
        title: 'New Future Song',
        key: 'A',
        sections: [
          {
            name: 'Melody',
            rows: [
              { type: 'lead', content: "a c# e a'" }
            ]
          }
        ]
      };

      const res = renderSongNotationToSVG(futureSong);
      assert.ok(res.svg.includes('New Future Song'));
      assert.ok(res.svg.includes('Scale:'));
      assert.equal(res.noteCount, 4);
    });

    it('5.3. Song without lead renders clear empty state without fake notation', () => {
      const songNoLead = {
        title: 'Empty Lead Song',
        key: 'E',
        sections: [
          {
            name: 'Verse 1',
            rows: [
              { type: 'lyrics', content: 'Just lyrics here' }
            ]
          }
        ]
      };

      const res = renderSongNotationToSVG(songNoLead);
      assert.ok(res.svg.includes('No Lead Notes available for this song'));
      assert.equal(res.noteCount, 0);
    });
  });
});
