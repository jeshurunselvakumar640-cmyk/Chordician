import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transposeNote,
  transposeChord,
  transposeChordLine,
  transposeNoteLine,
  transposeNoteWithOctave,
  calculateSemitoneDistance,
  semitoneToNoteName
} from '../../services/transposer.js';
import { NOTE_TO_SEMITONE } from '../../utils/musicConstants.js';

describe('Transpose Note Spelling & Key-Aware Audit Engine (Part B)', () => {
  describe('1. E -> D Major Transposition (-2 Semitones)', () => {
    const semitoneDelta = -2;
    const targetKey = 'D';

    it('1.1. F# transposes to E in key D (NOT D##)', () => {
      const transposed = transposeNote('F#', semitoneDelta, targetKey);
      assert.equal(transposed, 'E', 'F# transposed by -2 in Key D must be spelled as E, not D##');
    });

    it('1.2. Complete diatonic scale transposition for E -> D', () => {
      const eScale = ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'];
      const expectedInD = ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'];

      eScale.forEach((note, idx) => {
        const result = transposeNote(note, semitoneDelta, targetKey);
        assert.equal(result, expectedInD[idx], `Note ${note} in E -> ${expectedInD[idx]} in D`);
      });
    });

    it('1.3. Reverse transformation: D -> E (+2 Semitones)', () => {
      const dScale = ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'];
      const expectedInE = ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'];
      const reverseDelta = 2;
      const reverseKey = 'E';

      dScale.forEach((note, idx) => {
        const result = transposeNote(note, reverseDelta, reverseKey);
        assert.equal(result, expectedInE[idx], `Note ${note} in D -> ${expectedInE[idx]} in E`);
      });
    });
  });

  describe('2. Lead Note Octave & Apostrophe Preservation during Transpose', () => {
    it('2.1. Preserves numeric octaves: F#2, F#3, F#4 in E -> D', () => {
      assert.equal(transposeNoteWithOctave('F#2', -2, 'D'), 'E2');
      assert.equal(transposeNoteWithOctave('F#3', -2, 'D'), 'E3');
      assert.equal(transposeNoteWithOctave('F#4', -2, 'D'), 'E4');
    });

    it('2.2. Preserves apostrophe octaves: f#\', f#\'\', f#2 in E -> D', () => {
      assert.equal(transposeNoteLine("f#'", -2, 'D'), "e'");
      assert.equal(transposeNoteLine("f#''", -2, 'D'), "e''");
      assert.equal(transposeNoteLine("f#2", -2, 'D'), "e2");
      assert.equal(transposeNoteLine("f#", -2, 'D'), "e");
    });

    it('2.3. Full lead melody line transposition preserves spacing and barlines', () => {
      const leadLine = "f# g# a b c#' | d' c#' b a";
      const transposed = transposeNoteLine(leadLine, -2, 'D');
      assert.equal(transposed, "e f# g a b' | c' b' a g");
    });
  });

  describe('3. Chord Qualities & Slash Chords Transposition', () => {
    it('3.1. Complex chord qualities preserved: F#m7 in E -> Em7 in D', () => {
      assert.equal(transposeChord('F#m7', -2, 'D'), 'Em7');
      assert.equal(transposeChord('C#m7', -2, 'D'), 'Bm7');
      assert.equal(transposeChord('G#m7', -2, 'D'), 'F#m7');
      assert.equal(transposeChord('Emaj7', -2, 'D'), 'Dmaj7');
      assert.equal(transposeChord('B7', -2, 'D'), 'A7');
      assert.equal(transposeChord('Asus4', -2, 'D'), 'Gsus4');
      assert.equal(transposeChord('D#dim', -2, 'D'), 'C#dim');
    });

    it('3.2. Slash chords: F#m7/C# in E -> Em7/B in D', () => {
      assert.equal(transposeChord('F#m7/C#', -2, 'D'), 'Em7/B');
      assert.equal(transposeChord('E/G#', -2, 'D'), 'D/F#');
      assert.equal(transposeChord('A/C#', -2, 'D'), 'G/B');
    });

    it('3.3. Full chord line preservation', () => {
      const chordLine = "E     F#m7   G#m7    A   B7";
      const transposed = transposeChordLine(chordLine, -2, 'D');
      assert.equal(transposed, "D     Em7   F#m7    G   A7");
    });
  });

  describe('4. Destination Key Spelling Preferences (Flats vs Sharps)', () => {
    it('4.1. F Major prefers Bb (not A#)', () => {
      // C in F -> C (delta 0), D in F -> D, etc. Transposing G (semitone 7) by +3 -> semitone 10 (Bb in Key F)
      assert.equal(transposeNote('G', 3, 'F'), 'Bb');
      assert.equal(transposeChord('Gm7', 3, 'F'), 'Bbm7');
    });

    it('4.2. Bb Major prefers Bb and Eb (not A# and D#)', () => {
      // Note C + 3 semitones in Key Bb -> Eb
      assert.equal(transposeNote('C', 3, 'Bb'), 'Eb');
      // Note G + 3 semitones in Key Bb -> Bb
      assert.equal(transposeNote('G', 3, 'Bb'), 'Bb');
    });

    it('4.3. G Major prefers F# (not Gb)', () => {
      // Note E + 2 semitones in Key G -> F#
      assert.equal(transposeNote('E', 2, 'G'), 'F#');
    });

    it('4.4. Eb Major prefers Eb, Ab, Bb', () => {
      assert.equal(transposeNote('C', 3, 'Eb'), 'Eb');
      assert.equal(transposeNote('F', 3, 'Eb'), 'Ab');
      assert.equal(transposeNote('G', 3, 'Eb'), 'Bb');
    });
  });

  describe('5. Double Accidental Handling in NOTE_TO_SEMITONE Lookup', () => {
    it('5.1. D## parses to semitone 4 and transposes cleanly to E', () => {
      assert.equal(NOTE_TO_SEMITONE['D##'], 4);
      // D## with delta 0 in key D -> E
      assert.equal(transposeNote('D##', 0, 'D'), 'E');
      // D## with delta +2 in key D -> F#
      assert.equal(transposeNote('D##', 2, 'D'), 'F#');
    });

    it('5.2. Double sharps and flats lookup integrity', () => {
      assert.equal(NOTE_TO_SEMITONE['C##'], 2); // D
      assert.equal(NOTE_TO_SEMITONE['F##'], 7); // G
      assert.equal(NOTE_TO_SEMITONE['G##'], 9); // A
      assert.equal(NOTE_TO_SEMITONE['Abb'], 7); // G
      assert.equal(NOTE_TO_SEMITONE['Bbb'], 9); // A
    });
  });

  describe('6. 12-Pitch Class Transposition Matrix', () => {
    it('6.1. All 12 chromatic intervals from C produce correct pitch classes', () => {
      const root = 'C';
      for (let delta = 1; delta < 12; delta++) {
        const transposed = transposeNote(root, delta, 'C');
        const semitone = NOTE_TO_SEMITONE[transposed];
        assert.equal(semitone, delta, `C transposed by +${delta} semitones must have pitch class ${delta}`);
      }
    });

    it('6.2. Negative transposition intervals (-1 to -11) produce exact pitch classes', () => {
      const root = 'C';
      for (let delta = -1; delta > -12; delta--) {
        const transposed = transposeNote(root, delta, 'C');
        const expectedSemitone = (12 + delta) % 12;
        const semitone = NOTE_TO_SEMITONE[transposed];
        assert.equal(semitone, expectedSemitone, `C transposed by ${delta} must have pitch class ${expectedSemitone}`);
      }
    });
  });

  describe('7. Canonical Enharmonic Spelling & ±1 Regression Suite', () => {
    const CANONICAL_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const FORBIDDEN_THEORETICAL = ['B#', 'E#', 'Fb', 'Cb', 'F##', 'G##', 'A##', 'C##', 'D##', 'E##', 'B##', 'Abb', 'Bbb', 'Cbb', 'Dbb', 'Ebb'];

    it('7.1. Complete 12-root ±1 transposition matrix', () => {
      const expectedMinus1 = {
        'C': 'B', 'C#': 'C', 'D': 'C#', 'D#': 'D',
        'E': 'D#', 'F': 'E', 'F#': 'F', 'G': 'F#',
        'G#': 'G', 'A': 'G#', 'A#': 'A', 'B': 'A#'
      };

      const expectedPlus1 = {
        'C': 'C#', 'C#': 'D', 'D': 'D#', 'D#': 'E',
        'E': 'F', 'F': 'F#', 'F#': 'G', 'G': 'G#',
        'G#': 'A', 'A': 'A#', 'A#': 'B', 'B': 'C'
      };

      CANONICAL_ROOTS.forEach((root) => {
        assert.equal(transposeNote(root, -1), expectedMinus1[root], `${root} - 1 must equal ${expectedMinus1[root]}`);
        assert.equal(transposeNote(root, 1), expectedPlus1[root], `${root} + 1 must equal ${expectedPlus1[root]}`);
      });
    });

    it('7.2. Critical bug cases (G# -1 = G, C# -1 = C, F# -1 = F, E +1 = F, B +1 = C, F -1 = E)', () => {
      assert.equal(transposeNote('G#', -1), 'G', 'G# - 1 must produce G (never F##)');
      assert.equal(transposeNote('C#', -1), 'C', 'C# - 1 must produce C (never B#)');
      assert.equal(transposeNote('F#', -1), 'F', 'F# - 1 must produce F (never E#)');
      assert.equal(transposeNote('E', 1), 'F', 'E + 1 must produce F (never E#)');
      assert.equal(transposeNote('B', 1), 'C', 'B + 1 must produce C (never B#)');
      assert.equal(transposeNote('F', -1), 'E', 'F - 1 must produce E (never Fb)');
    });

    it('7.3. Complete -12 through +12 matrix across all 12 roots produces only canonical notes', () => {
      for (const root of CANONICAL_ROOTS) {
        for (let delta = -12; delta <= 12; delta++) {
          const res = transposeNote(root, delta);
          assert.ok(
            CANONICAL_ROOTS.includes(res),
            `Transposing ${root} by ${delta} produced "${res}", which is not in canonical sharp scale`
          );
          assert.ok(
            !FORBIDDEN_THEORETICAL.includes(res),
            `Transposing ${root} by ${delta} produced forbidden theoretical spelling "${res}"`
          );
          assert.ok(!res.includes('##') && !res.includes('bb'), `Accidental duplication found: ${res}`);
        }
      }
    });

    it('7.4. Flat inputs preserve standard chromatic transposition (Db, Eb, Gb, Ab, Bb)', () => {
      const flatCases = [
        { note: 'Db', minus1: 'C', plus1: 'D' },
        { note: 'Eb', minus1: 'D', plus1: 'E' },
        { note: 'Gb', minus1: 'F', plus1: 'G' },
        { note: 'Ab', minus1: 'G', plus1: 'A' },
        { note: 'Bb', minus1: 'A', plus1: 'B' }
      ];

      for (const { note, minus1, plus1 } of flatCases) {
        assert.equal(transposeNote(note, -1), minus1, `${note} - 1 must equal ${minus1}`);
        assert.equal(transposeNote(note, 1), plus1, `${note} + 1 must equal ${plus1}`);
      }
    });

    it('7.5. Chord qualities preserved across all variations on G# and C# roots', () => {
      const qualities = ['m', 'maj', 'maj7', '7', 'm7', 'sus2', 'sus4', 'dim', 'aug', 'add9'];

      for (const q of qualities) {
        assert.equal(transposeChord(`G#${q}`, -1), `G${q}`, `G#${q} - 1 must become G${q}`);
        assert.equal(transposeChord(`C#${q}`, -1), `C${q}`, `C#${q} - 1 must become C${q}`);
      }
    });

    it('7.6. Slash chords transpose root and bass independently without token splitting', () => {
      assert.equal(transposeChord('A/C#', -1), 'G#/C', 'A/C# - 1 must become G#/C');
      assert.equal(transposeChord('C#/G#', -1), 'C/G', 'C#/G# - 1 must become C/G');
      assert.equal(transposeChord('F#/C#', -1), 'F/C', 'F#/C# - 1 must become F/C');
      assert.equal(transposeChord('Bb/F', -1), 'A/E', 'Bb/F - 1 must become A/E');
      // B# bass note normalizes to pitch 0 (C) and transposes by -1 -> pitch 11 (B)
      assert.equal(transposeChord('G#/B#', -1), 'G/B', 'G#/B# - 1 must become G/B');
    });

    it('7.7. Full chord line multi-chord regression preserves spacing and prevents backtracking', () => {
      assert.equal(
        transposeChordLine('C#   G#   F#', -1),
        'C   G   F',
        'C#   G#   F# - 1 must transpose all chords cleanly to C   G   F'
      );
      assert.equal(
        transposeChordLine('G#m  G#7  G#maj7  C#m  C#7', -1),
        'Gm  G7  Gmaj7  Cm  C7',
        'Chord line with suffixes must transpose all roots without leaking double accidentals'
      );
      assert.equal(
        transposeChordLine('| C# | G#m | A/C# |', -1),
        '| C | Gm | G#/C |',
        'Barlines and delimiters must remain intact'
      );
      assert.equal(
        transposeChordLine('[C#] (G#7)', -1),
        '[C] (G7)',
        'Brackets and parentheses must be preserved'
      );
    });

    it('7.8. Round-trip and ±12 octave shift integrity', () => {
      for (const root of CANONICAL_ROOTS) {
        const roundTrip1 = transposeNote(transposeNote(root, 1), -1);
        const roundTrip2 = transposeNote(transposeNote(root, -1), 1);
        const shiftPlus12 = transposeNote(root, 12);
        const shiftMinus12 = transposeNote(root, -12);

        assert.equal(roundTrip1, root, `Round-trip (+1, -1) on ${root} must return ${root}`);
        assert.equal(roundTrip2, root, `Round-trip (-1, +1) on ${root} must return ${root}`);
        assert.equal(shiftPlus12, root, `+12 shift on ${root} must return ${root}`);
        assert.equal(shiftMinus12, root, `-12 shift on ${root} must return ${root}`);
      }
    });
  });
});
