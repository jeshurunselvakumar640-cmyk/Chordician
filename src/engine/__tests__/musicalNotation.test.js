import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLeadTokenToPitch,
  parseLeadLine,
  calculateDiatonicOffset,
  extractLeadSectionsFromSong,
  extractLeadSheetSectionsFromSong,
  extractPositionedChords,
  getLeadNoteCount
} from '../notation/leadPitchParser.js';
import {
  renderSongNotationToSVG,
  getNoteY,
  parseLyricTokens,
  estimateTextWidth
} from '../notation/staffNotationRenderer.js';

describe('Vocal Lead Sheet & Musical Notation Engine', () => {
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

  describe('4. 3-Layer Vocal Lead Sheet Extraction (Chords, Melody, Lyrics)', () => {
    it('4.1. Extracts synchronized phrases with chords, melody notes, and lyrics', () => {
      const song = {
        title: 'Vocal Lead Song',
        key: 'D',
        sections: [
          {
            name: 'Verse 1',
            rows: [
              { type: 'chords', content: 'D      G      A' },
              { type: 'lead', content: "d f# a c' | d' a f#" },
              { type: 'lyrics', content: 'Je - sus en - na - me' }
            ]
          }
        ]
      };

      const sections = extractLeadSheetSectionsFromSong(song);
      assert.equal(sections.length, 1);
      assert.equal(sections[0].name, 'Verse 1');
      assert.equal(sections[0].phrases.length, 1);

      const phrase = sections[0].phrases[0];
      assert.equal(phrase.items.filter(i => i.type === 'note').length, 7);
      assert.equal(phrase.items.filter(i => i.type === 'barline').length, 1);
      assert.equal(phrase.chords.length, 3);
      assert.equal(phrase.chords[0].chord, 'D');
      assert.equal(phrase.chords[1].chord, 'G');
      assert.equal(phrase.chords[2].chord, 'A');
      assert.equal(phrase.lyrics, 'Je - sus en - na - me');
    });

    it('4.2. Preserves multiple phrases and section order without mutating original song', () => {
      const song = {
        title: 'Multi Section Song',
        sections: [
          {
            name: 'Verse 1',
            rows: [
              { type: 'chords', content: 'C   G' },
              { type: 'lead', content: 'c e g' },
              { type: 'lyrics', content: 'First line' }
            ]
          },
          {
            name: 'Chorus',
            rows: [
              { type: 'chords', content: 'Am   F' },
              { type: 'lead', content: "a' c'' f'" },
              { type: 'lyrics', content: 'Sing praise' }
            ]
          },
          {
            name: 'Verse 1',
            rows: [
              { type: 'chords', content: 'C   G' },
              { type: 'lead', content: 'c e g' },
              { type: 'lyrics', content: 'Repeat line' }
            ]
          }
        ]
      };

      const originalSnapshot = JSON.stringify(song);
      const sections = extractLeadSheetSectionsFromSong(song);

      assert.equal(sections.length, 3);
      assert.equal(sections[0].name, 'Verse 1');
      assert.equal(sections[1].name, 'Chorus');
      assert.equal(sections[2].name, 'Verse 1'); // Repeated sections preserved
      assert.equal(JSON.stringify(song), originalSnapshot, 'Original song object must not be mutated');
    });

    it('4.3. Positioned chords parser preserves chord qualities and slash chords', () => {
      const chordsStr = "Dm7   G7/B   Cmaj7   F#m7b5   C/E";
      const chords = extractPositionedChords(chordsStr);
      assert.equal(chords.length, 5);
      assert.equal(chords[0].chord, 'Dm7');
      assert.equal(chords[1].chord, 'G7/B');
      assert.equal(chords[2].chord, 'Cmaj7');
      assert.equal(chords[3].chord, 'F#m7b5');
      assert.equal(chords[4].chord, 'C/E');
    });

    it('4.4. Song without lead returns 0 notes and empty section list', () => {
      const songNoLead = {
        title: 'Chords Only Song',
        sections: [
          {
            name: 'Verse',
            rows: [
              { type: 'chords', content: 'G  C  D' },
              { type: 'lyrics', content: 'No lead row' }
            ]
          }
        ]
      };

      const sections = extractLeadSheetSectionsFromSong(songNoLead);
      assert.equal(sections.length, 0);
      assert.equal(getLeadNoteCount(songNoLead), 0);
    });
  });

  describe('5. Western Vocal Lead Sheet SVG Generation', () => {
    it('5.1. Generates valid branded SVG with Chords (Layer 1), Staff Melody (Layer 2), and Lyrics (Layer 3)', () => {
      const song = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        timeSignature: '3/4',
        sections: [
          {
            name: 'Intro',
            rows: [
              { type: 'chords', content: 'G       C       D7' },
              { type: 'lead', content: "d' g' b' d'' | c'' a' f#'" },
              { type: 'lyrics', content: 'A - ma - zing grace how sweet' }
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

      // Layer 1: Chords
      assert.ok(svg.includes('D7') || svg.includes('C'), 'Should include chord symbols above staff');

      // Layer 2: Staff Melody
      assert.ok(svg.includes('treble-clef'), 'Should include treble clef');
      assert.ok(svg.includes('<ellipse'), 'Should include noteheads');
      assert.ok(svg.includes('stroke-width="1.5"'), 'Should include stems');
      assert.ok(svg.includes('sharp'), 'Should include sharp accidental for F#');

      // Layer 3: Lyrics
      assert.ok(svg.includes('grace') || svg.includes('zing') || svg.includes('sweet'), 'Should include lyrics beneath staff');

      assert.equal(noteCount, 7);
    });

    it('5.2. Future song support: in-memory song object produces 3 layers dynamically', () => {
      const futureSong = {
        id: 'future_lead_sheet_1',
        title: 'New Lead Sheet Song',
        key: 'A',
        sections: [
          {
            name: 'Chorus',
            rows: [
              { type: 'chords', content: 'A   E' },
              { type: 'lead', content: "a c# e a'" },
              { type: 'lyrics', content: 'Ho - ly Lord' }
            ]
          }
        ]
      };

      const res = renderSongNotationToSVG(futureSong);
      assert.ok(res.svg.includes('New Lead Sheet Song'));
      assert.ok(res.svg.includes('Scale:'));
      assert.ok(res.svg.includes('A')); // Chord A
      assert.ok(res.svg.includes('Ho') || res.svg.includes('Lord')); // Lyrics
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

  describe('6. Rhythm Notation Model & Parsing', () => {
    it('6.1. Supports all duration types: whole, half, quarter, eighth, sixteenth', () => {
      const wholeNote = parseLeadTokenToPitch("c':1");
      assert.equal(wholeNote.duration, 'whole');
      assert.equal(wholeNote.beatValue, 4.0);

      const halfNote = parseLeadTokenToPitch("e':2");
      assert.equal(halfNote.duration, 'half');
      assert.equal(halfNote.beatValue, 2.0);

      const quarterNote = parseLeadTokenToPitch("g':4");
      assert.equal(quarterNote.duration, 'quarter');
      assert.equal(quarterNote.beatValue, 1.0);

      const defaultQuarter = parseLeadTokenToPitch("a'");
      assert.equal(defaultQuarter.duration, 'quarter');
      assert.equal(defaultQuarter.beatValue, 1.0);

      const eighthNote = parseLeadTokenToPitch("b':8");
      assert.equal(eighthNote.duration, 'eighth');
      assert.equal(eighthNote.beatValue, 0.5);

      const sixteenthNote = parseLeadTokenToPitch("c'':16");
      assert.equal(sixteenthNote.duration, 'sixteenth');
      assert.equal(sixteenthNote.beatValue, 0.25);
    });

    it('6.2. Supports letter-based duration aliases (:w, :h, :q, :e, :s)', () => {
      assert.equal(parseLeadTokenToPitch("d':w").duration, 'whole');
      assert.equal(parseLeadTokenToPitch("d':h").duration, 'half');
      assert.equal(parseLeadTokenToPitch("d':q").duration, 'quarter');
      assert.equal(parseLeadTokenToPitch("d':e").duration, 'eighth');
      assert.equal(parseLeadTokenToPitch("d':s").duration, 'sixteenth');
    });

    it('6.3. Augmentation dots: dotted quarter (:4.) and dotted eighth (:8.)', () => {
      const dottedQuarter = parseLeadTokenToPitch("g':4.");
      assert.equal(dottedQuarter.duration, 'quarter');
      assert.equal(dottedQuarter.dotted, true);
      assert.equal(dottedQuarter.beatValue, 1.5);

      const dottedEighth = parseLeadTokenToPitch("a':8.");
      assert.equal(dottedEighth.duration, 'eighth');
      assert.equal(dottedEighth.dotted, true);
      assert.equal(dottedEighth.beatValue, 0.75);

      const dottedHalf = parseLeadTokenToPitch("c':2.");
      assert.equal(dottedHalf.duration, 'half');
      assert.equal(dottedHalf.dotted, true);
      assert.equal(dottedHalf.beatValue, 3.0);
    });

    it('6.4. Ties: A4 quarter tie -> A4 eighth preserves tieStart and tieEnd across identical pitches', () => {
      const line = "a'~ a':8";
      const items = parseLeadLine(line);
      assert.equal(items.length, 2);
      assert.equal(items[0].scientificPitch, 'A4');
      assert.equal(items[0].tieStart, true);
      assert.equal(items[1].scientificPitch, 'A4');
      assert.equal(items[1].tieEnd, true);
    });

    it('6.5. Rests: whole, half, quarter, eighth, sixteenth rests', () => {
      const qRest = parseLeadTokenToPitch('-');
      assert.equal(qRest.type, 'rest');
      assert.equal(qRest.duration, 'quarter');

      const eRest = parseLeadTokenToPitch('-:8');
      assert.equal(eRest.type, 'rest');
      assert.equal(eRest.duration, 'eighth');

      const sRest = parseLeadTokenToPitch('-:16');
      assert.equal(sRest.type, 'rest');
      assert.equal(sRest.duration, 'sixteenth');

      const hRest = parseLeadTokenToPitch('-:2');
      assert.equal(hRest.type, 'rest');
      assert.equal(hRest.duration, 'half');

      const wRest = parseLeadTokenToPitch('-:1');
      assert.equal(wRest.type, 'rest');
      assert.equal(wRest.duration, 'whole');
    });
  });

  describe('7. Beaming & Grouping Engine', () => {
    it('7.1. Consecutive eighth notes are beamed together', () => {
      const song = {
        title: 'Beaming Test',
        key: 'C',
        sections: [
          {
            name: 'Melody',
            rows: [
              { type: 'lead', content: "c':8 d':8 e':8 f':8" }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(song);
      // Contains primary beam line connecting stems
      assert.ok(svg.includes('stroke-width="3.6"'), 'Should render primary beam line for consecutive eighth notes');
    });

    it('7.2. Consecutive sixteenth notes include two beam lines', () => {
      const song = {
        title: 'Sixteenth Beaming Test',
        key: 'C',
        sections: [
          {
            name: 'Melody',
            rows: [
              { type: 'lead', content: "c':16 d':16 e':16 f':16" }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(song);
      assert.ok(svg.includes('stroke-width="3.6"'), 'Primary beam');
      assert.ok(svg.includes('stroke-width="2.6"'), 'Secondary beam for sixteenth notes');
    });

    it('7.3. Beams stop cleanly at barlines and rests', () => {
      const song = {
        title: 'Beam Boundary Test',
        key: 'C',
        sections: [
          {
            name: 'Melody',
            rows: [
              { type: 'lead', content: "c':8 d':8 | e':8 f':8 -:4 g':8 a':8" }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(song);
      assert.ok(svg.includes('stroke-width="3.6"'));
      assert.ok(svg.includes('rest'), 'Includes rest in system');
    });
  });

  describe('8. Dynamic Lyric Vertical Clearance & No-Overlap Integrity', () => {
    it('8.1. System with deep low notes (C2, A2, C3) pushes lyrics safely below lowest ledger lines', () => {
      const songWithLowNotes = {
        title: 'Low Notes Clearance Song',
        key: 'C',
        sections: [
          {
            name: 'Low System',
            rows: [
              { type: 'chords', content: 'C        Am' },
              { type: 'lead', content: 'c2 e2 g2 c3' },
              { type: 'lyrics', content: 'Deep deep low voice' }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(songWithLowNotes);
      assert.ok(svg.includes('Deep'), 'Should render lyrics');
      assert.ok(svg.includes('ledger-lines'), 'Should render ledger lines for octave 2 notes');

      // Diatonic offset of C2 is -14. NoteY = staffTopY + (10 - (-14)) * 5 = staffTopY + 120
      // Lowest ledger line is at offset -14.
      // Lyrics must be placed safely below note/ledger line + note names
      const match = svg.match(/<text x="[^"]*" y="([^"]*)"[^>]*>Deep<\/text>/);
      assert.ok(match, 'Lyric text element must exist');
      const lyricY = parseFloat(match[1]);
      // Staff starts after header card (~180-220px). C2 ledger line is at ~300-340px.
      // Lyric Y must be well below staff top + 120px
      assert.ok(lyricY > 250, `Lyric Y (${lyricY}) must have ample clearance below low octave notes`);
    });

    it('8.2. High notes requiring upper ledger lines (A5, C6) render ledger lines without clipping', () => {
      const highSong = {
        title: 'High Soprano Song',
        key: 'G',
        sections: [
          {
            name: 'Chorus',
            rows: [
              { type: 'chords', content: 'G       C' },
              { type: 'lead', content: "g' b' d'' f#'' | g'' a'' c'''" },
              { type: 'lyrics', content: 'High soaring notes praise' }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(highSong);
      assert.ok(svg.includes('ledger-lines'), 'Must render upper ledger lines for A5, C6');
      assert.ok(svg.includes('soaring'));
    });

    it('8.3. Lyric tokenization handles hyphenated syllables and natural sentences cleanly', () => {
      const hyphenated = parseLyricTokens('Je - sus en - na - me');
      assert.deepEqual(hyphenated, ['Je-', 'sus', 'en-', 'na-', 'me']);

      const sentence = parseLyricTokens('En meetpar uyirodirukkayil enakkenna bayam');
      assert.deepEqual(sentence, ['En', 'meetpar', 'uyirodirukkayil', 'enakkenna', 'bayam']);

      const tamil = parseLyricTokens('இயேசுவே என் நேசரே');
      assert.deepEqual(tamil, ['இயேசுவே', 'என்', 'நேசரே']);

      assert.ok(estimateTextWidth('uyirodirukkayil', 13) > 80);
      assert.ok(estimateTextWidth('இயேசுவே', 13) > 50);
    });

    it('8.4. Multi-system song renders lyrics without overlap and with clear spacing gaps', () => {
      const multiSystemSong = {
        title: 'En Meetpar Uyirodirukkayil',
        key: 'D',
        sections: [
          {
            name: 'Pallavi',
            rows: [
              { type: 'chords', content: 'D            G          A          D' },
              { type: 'lead', content: "d f# a c' | b a g f# | e f# g a | d' c' b a | f# e d" },
              { type: 'lyrics', content: 'En meetpar uyirodirukkayil enakkenna bayam en nenjil' }
            ]
          }
        ]
      };

      const { svg } = renderSongNotationToSVG(multiSystemSong);
      assert.ok(svg.includes('En'));
      assert.ok(svg.includes('meetpar'));
      assert.ok(svg.includes('uyirodirukkayil'));
      assert.ok(svg.includes('enakkenna'));
      assert.ok(svg.includes('bayam'));
      assert.ok(svg.includes('nenjil'));

      // Extract all lyric text elements in system 1
      const lyricMatches = [...svg.matchAll(/<text x="([^"]*)" y="([^"]*)"[^>]*font-size="13"[^>]*>([^<]+)<\/text>/g)];
      assert.ok(lyricMatches.length >= 6, 'Must render lyric words');

      // Group by Y coordinate (system)
      const systemLyrics = {};
      lyricMatches.forEach(m => {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        const word = m[3];
        if (!systemLyrics[y]) systemLyrics[y] = [];
        systemLyrics[y].push({ x, word });
      });

      // For every system, verify words are sorted horizontally and have at least 10px center distance
      Object.entries(systemLyrics).forEach(([y, words]) => {
        for (let i = 1; i < words.length; i++) {
          const prev = words[i - 1];
          const curr = words[i];
          assert.ok(curr.x > prev.x, `Word "${curr.word}" (x=${curr.x}) must be to the right of "${prev.word}" (x=${prev.x})`);
          assert.ok(curr.x - prev.x >= 25, `Words "${prev.word}" and "${curr.word}" must have adequate separation (got ${curr.x - prev.x}px)`);
        }
      });
    });

    it('8.5. Song data immutability: Original song, Lead, chords, lyrics are NEVER mutated', () => {
      const originalSong = {
        id: 'test_immutable_song',
        title: 'Unchanged Song',
        artist: 'Author',
        key: 'D',
        sections: [
          {
            name: 'Verse 1',
            rows: [
              { type: 'chords', content: 'D      G      A' },
              { type: 'lead', content: "d:4 f#:4. a:8 c':2" },
              { type: 'lyrics', content: 'Never change this' }
            ]
          }
        ]
      };

      const clone = JSON.parse(JSON.stringify(originalSong));
      const res1 = renderSongNotationToSVG(originalSong);
      const res2 = renderSongNotationToSVG(originalSong);

      assert.deepEqual(originalSong, clone, 'Song object must remain completely unmodified');
      assert.equal(res1.svg, res2.svg, 'Renderer must be purely deterministic and read-only');
    });
  });
});
