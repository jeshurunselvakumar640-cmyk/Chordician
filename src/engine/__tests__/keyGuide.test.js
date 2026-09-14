import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MAJOR_KEY_FAMILIES,
  MINOR_KEY_FAMILIES,
  ALL_KEY_FAMILIES,
  getKeyGuideData
} from '../../data/keyChordFamilies.js';
import { getChordNotes } from '../../utils/chordNotesCalculator.js';

describe('Key Guide & Chord Family Reference (v4.1)', () => {
  it('Dataset integrity: Exactly 24 key families (12 Major, 12 Minor)', () => {
    assert.strictEqual(MAJOR_KEY_FAMILIES.length, 12, 'Must have 12 major keys');
    assert.strictEqual(MINOR_KEY_FAMILIES.length, 12, 'Must have 12 minor keys');
    assert.strictEqual(ALL_KEY_FAMILIES.length, 24, 'Must have 24 total keys');

    for (const kf of ALL_KEY_FAMILIES) {
      assert.ok(kf.key, 'Key name must be defined');
      assert.ok(Array.isArray(kf.scale) && kf.scale.length === 7, `${kf.key} must have a 7-note scale`);
      assert.ok(Array.isArray(kf.core) && kf.core.length === 3, `${kf.key} must have 3 core chords`);
      const rel = kf.mode === 'minor' ? (kf.relativeMajor || kf.relative) : kf.relative;
      assert.ok(Array.isArray(rel) && rel.length === 3, `${kf.key} must have 3 relative chords`);
      assert.ok(kf.dim, `${kf.key} must have a diminished chord`);
      assert.ok(Array.isArray(kf.allChords) && kf.allChords.length === 7, `${kf.key} must have 7 diatonic allChords`);
    }
  });

  it('C Major: Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('C');
    assert.ok(data);
    assert.strictEqual(data.label, 'C Major');
    assert.strictEqual(data.scaleFormatted, 'C · D · E · F · G · A · B');
    assert.deepStrictEqual(data.scale, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'C', notes: 'C · E · G' },
      { chord: 'F', notes: 'F · A · C' },
      { chord: 'G', notes: 'G · B · D' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'Dm', notes: 'D · F · A' },
      { chord: 'Em', notes: 'E · G · B' },
      { chord: 'Am', notes: 'A · C · E' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'Bdim', notes: 'B · D · F' });
    assert.strictEqual(data.allChordsFormatted, 'C · Dm · Em · F · G · Am · Bdim');
  });

  it('G Major: Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('G');
    assert.ok(data);
    assert.strictEqual(data.label, 'G Major');
    assert.strictEqual(data.scaleFormatted, 'G · A · B · C · D · E · F#');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'G', notes: 'G · B · D' },
      { chord: 'C', notes: 'C · E · G' },
      { chord: 'D', notes: 'D · F# · A' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'Am', notes: 'A · C · E' },
      { chord: 'Bm', notes: 'B · D · F#' },
      { chord: 'Em', notes: 'E · G · B' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'F#dim', notes: 'F# · A · C' });
    assert.strictEqual(data.allChordsFormatted, 'G · Am · Bm · C · D · Em · F#dim');
  });

  it('D Major: Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('D');
    assert.ok(data);
    assert.strictEqual(data.label, 'D Major');
    assert.strictEqual(data.scaleFormatted, 'D · E · F# · G · A · B · C#');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'D', notes: 'D · F# · A' },
      { chord: 'G', notes: 'G · B · D' },
      { chord: 'A', notes: 'A · C# · E' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'Em', notes: 'E · G · B' },
      { chord: 'F#m', notes: 'F# · A · C#' },
      { chord: 'Bm', notes: 'B · D · F#' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'C#dim', notes: 'C# · E · G' });
    assert.strictEqual(data.allChordsFormatted, 'D · Em · F#m · G · A · Bm · C#dim');
  });

  it('F Major: Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('F');
    assert.ok(data);
    assert.strictEqual(data.label, 'F Major');
    assert.strictEqual(data.scaleFormatted, 'F · G · A · Bb · C · D · E');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'F', notes: 'F · A · C' },
      { chord: 'Bb', notes: 'Bb · D · F' },
      { chord: 'C', notes: 'C · E · G' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'Gm', notes: 'G · Bb · D' },
      { chord: 'Am', notes: 'A · C · E' },
      { chord: 'Dm', notes: 'D · F · A' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'Edim', notes: 'E · G · Bb' });
    assert.strictEqual(data.allChordsFormatted, 'F · Gm · Am · Bb · C · Dm · Edim');
  });

  it('Bb Major: Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('Bb');
    assert.ok(data);
    assert.strictEqual(data.label, 'Bb Major');
    assert.strictEqual(data.scaleFormatted, 'Bb · C · D · Eb · F · G · A');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'Bb', notes: 'Bb · D · F' },
      { chord: 'Eb', notes: 'Eb · G · Bb' },
      { chord: 'F', notes: 'F · A · C' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'Cm', notes: 'C · Eb · G' },
      { chord: 'Dm', notes: 'D · F · A' },
      { chord: 'Gm', notes: 'G · Bb · D' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'Adim', notes: 'A · C · Eb' });
    assert.strictEqual(data.allChordsFormatted, 'Bb · Cm · Dm · Eb · F · Gm · Adim');
  });

  it('Am (A Minor): Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('Am');
    assert.ok(data);
    assert.strictEqual(data.label, 'A Minor');
    assert.strictEqual(data.scaleFormatted, 'A · B · C · D · E · F · G');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'Am', notes: 'A · C · E' },
      { chord: 'Dm', notes: 'D · F · A' },
      { chord: 'Em', notes: 'E · G · B' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'C', notes: 'C · E · G' },
      { chord: 'F', notes: 'F · A · C' },
      { chord: 'G', notes: 'G · B · D' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'Bdim', notes: 'B · D · F' });
    assert.strictEqual(data.allChordsFormatted, 'Am · Bdim · C · Dm · Em · F · G');
  });

  it('Em (E Minor): Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('Em');
    assert.ok(data);
    assert.strictEqual(data.label, 'E Minor');
    assert.strictEqual(data.scaleFormatted, 'E · F# · G · A · B · C · D');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'Em', notes: 'E · G · B' },
      { chord: 'Am', notes: 'A · C · E' },
      { chord: 'Bm', notes: 'B · D · F#' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'G', notes: 'G · B · D' },
      { chord: 'C', notes: 'C · E · G' },
      { chord: 'D', notes: 'D · F# · A' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'F#dim', notes: 'F# · A · C' });
    assert.strictEqual(data.allChordsFormatted, 'Em · F#dim · G · Am · Bm · C · D');
  });

  it('Dm (D Minor): Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('Dm');
    assert.ok(data);
    assert.strictEqual(data.label, 'D Minor');
    assert.strictEqual(data.scaleFormatted, 'D · E · F · G · A · Bb · C');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'Dm', notes: 'D · F · A' },
      { chord: 'Gm', notes: 'G · Bb · D' },
      { chord: 'Am', notes: 'A · C · E' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'F', notes: 'F · A · C' },
      { chord: 'Bb', notes: 'Bb · D · F' },
      { chord: 'C', notes: 'C · E · G' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'Edim', notes: 'E · G · Bb' });
    assert.strictEqual(data.allChordsFormatted, 'Dm · Edim · F · Gm · Am · Bb · C');
  });

  it('G#m (G# Minor): Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('G#m');
    assert.ok(data);
    assert.strictEqual(data.label, 'G# Minor');
    assert.strictEqual(data.scaleFormatted, 'G# · A# · B · C# · D# · E · F#');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'G#m', notes: 'G# · B · D#' },
      { chord: 'C#m', notes: 'C# · E · G#' },
      { chord: 'D#m', notes: 'D# · F# · A#' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'B', notes: 'B · D# · F#' },
      { chord: 'E', notes: 'E · G# · B' },
      { chord: 'F#', notes: 'F# · A# · C#' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'A#dim', notes: 'A# · C# · E' });
    assert.strictEqual(data.allChordsFormatted, 'G#m · A#dim · B · C#m · D#m · E · F#');
  });

  it('Bm (B Minor): Scale, Core, Relative, Diminished, and All Chords with Triads', () => {
    const data = getKeyGuideData('Bm');
    assert.ok(data);
    assert.strictEqual(data.label, 'B Minor');
    assert.strictEqual(data.scaleFormatted, 'B · C# · D · E · F# · G · A');

    assert.deepStrictEqual(data.coreChords, [
      { chord: 'Bm', notes: 'B · D · F#' },
      { chord: 'Em', notes: 'E · G · B' },
      { chord: 'F#m', notes: 'F# · A · C#' }
    ]);

    assert.deepStrictEqual(data.relativeChords, [
      { chord: 'D', notes: 'D · F# · A' },
      { chord: 'G', notes: 'G · B · D' },
      { chord: 'A', notes: 'A · C# · E' }
    ]);

    assert.deepStrictEqual(data.dimChord, { chord: 'C#dim', notes: 'C# · E · G' });
    assert.strictEqual(data.allChordsFormatted, 'Bm · C#dim · D · Em · F#m · G · A');
  });

  it('Handles edge cases and null/invalid keys gracefully', () => {
    assert.strictEqual(getKeyGuideData(null), null);
    assert.strictEqual(getKeyGuideData(''), null);
    assert.strictEqual(getKeyGuideData(123), null);
    assert.strictEqual(getKeyGuideData('InvalidKey'), null);
  });
});
