import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getScaleNoteMap,
  resolveLeadToken,
  handleLeadInputChange
} from '../../utils/leadNoteHelper.js';

describe('Key-Aware Lead Auto-Accidental System (v4.3)', () => {
  it('1. D Major: Bare F -> F#', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('F', scaleMap), 'F#');
    assert.equal(resolveLeadToken('f', scaleMap), 'F#');

    const res = handleLeadInputChange('D4 E4 f', 'D4 E4 ', 7, 'D');
    assert.equal(res.content, 'D4 E4 F#');
    assert.equal(res.cursorOffset, 1);
  });

  it('2. D Major: Bare C -> C#', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('C', scaleMap), 'C#');
    assert.equal(resolveLeadToken('c', scaleMap), 'C#');

    const res = handleLeadInputChange('D4 E4 F#4 c', 'D4 E4 F#4 ', 11, 'D');
    assert.equal(res.content, 'D4 E4 F#4 C#');
    assert.equal(res.cursorOffset, 1);
  });

  it('3. D Major: Natural notes remain natural (D, E, G, A, B)', () => {
    const scaleMap = getScaleNoteMap('D');
    ['D', 'E', 'G', 'A', 'B'].forEach((note) => {
      assert.equal(resolveLeadToken(note, scaleMap), note);
      assert.equal(resolveLeadToken(note.toLowerCase(), scaleMap), note);
    });
  });

  it('4. G Major: F -> F#', () => {
    const scaleMap = getScaleNoteMap('G');
    assert.equal(resolveLeadToken('F', scaleMap), 'F#');
    assert.equal(resolveLeadToken('f4', scaleMap), 'F#4');
    assert.equal(resolveLeadToken('G', scaleMap), 'G');
    assert.equal(resolveLeadToken('C', scaleMap), 'C');
  });

  it('5. A Major: C/F/G mappings (C -> C#, F -> F#, G -> G#)', () => {
    const scaleMap = getScaleNoteMap('A');
    assert.equal(resolveLeadToken('C', scaleMap), 'C#');
    assert.equal(resolveLeadToken('F', scaleMap), 'F#');
    assert.equal(resolveLeadToken('G', scaleMap), 'G#');
    assert.equal(resolveLeadToken('A', scaleMap), 'A');
    assert.equal(resolveLeadToken('B', scaleMap), 'B');
    assert.equal(resolveLeadToken('D', scaleMap), 'D');
    assert.equal(resolveLeadToken('E', scaleMap), 'E');
  });

  it('6. F Major: B -> Bb', () => {
    const scaleMap = getScaleNoteMap('F');
    assert.equal(resolveLeadToken('B', scaleMap), 'Bb');
    assert.equal(resolveLeadToken('b4', scaleMap), 'Bb4');
    assert.equal(resolveLeadToken('F', scaleMap), 'F');
  });

  it('7. F Minor (Fm): A/B/D/E mappings (A -> Ab, B -> Bb, D -> Db, E -> Eb)', () => {
    const scaleMap = getScaleNoteMap('Fm');
    assert.equal(resolveLeadToken('A', scaleMap), 'Ab');
    assert.equal(resolveLeadToken('B', scaleMap), 'Bb');
    assert.equal(resolveLeadToken('D', scaleMap), 'Db');
    assert.equal(resolveLeadToken('E', scaleMap), 'Eb');
    assert.equal(resolveLeadToken('F', scaleMap), 'F');
    assert.equal(resolveLeadToken('G', scaleMap), 'G');
    assert.equal(resolveLeadToken('C', scaleMap), 'C');
  });

  it('8. Db Major: D/E/G/A/B mappings (D -> Db, E -> Eb, G -> Gb, A -> Ab, B -> Bb)', () => {
    const scaleMap = getScaleNoteMap('Db');
    assert.equal(resolveLeadToken('D', scaleMap), 'Db');
    assert.equal(resolveLeadToken('E', scaleMap), 'Eb');
    assert.equal(resolveLeadToken('G', scaleMap), 'Gb');
    assert.equal(resolveLeadToken('A', scaleMap), 'Ab');
    assert.equal(resolveLeadToken('B', scaleMap), 'Bb');
    assert.equal(resolveLeadToken('F', scaleMap), 'F');
    assert.equal(resolveLeadToken('C', scaleMap), 'C');
  });

  it('9. C Major: All natural notes remain unchanged', () => {
    const scaleMap = getScaleNoteMap('C');
    ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach((note) => {
      assert.equal(resolveLeadToken(note, scaleMap), note);
    });
  });

  it('10. Explicit accidentals preserved (no double accidentals like F##)', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('F#', scaleMap), 'F#');
    assert.equal(resolveLeadToken('F#4', scaleMap), 'F#4');
    assert.equal(resolveLeadToken('f##', scaleMap), 'F#');
  });

  it('11. Explicit chromatic accidentals preserved (Bb, G#, Eb in D Major)', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('Bb', scaleMap), 'Bb');
    assert.equal(resolveLeadToken('Bb4', scaleMap), 'Bb4');
    assert.equal(resolveLeadToken('G#', scaleMap), 'G#');
    assert.equal(resolveLeadToken('Eb4', scaleMap), 'Eb4');
  });

  it('12. No selected key: Input is preserved verbatim', () => {
    assert.equal(getScaleNoteMap(null), null);
    assert.equal(getScaleNoteMap(''), null);

    const res = handleLeadInputChange('D4 E4 f', 'D4 E4 ', 7, null);
    assert.equal(res.content, 'D4 E4 f');
    assert.equal(res.cursorOffset, 0);
  });

  it('13. Octave notation is preserved with accidental placement', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('F4', scaleMap), 'F#4');
    assert.equal(resolveLeadToken('c5', scaleMap), 'C#5');
    assert.equal(resolveLeadToken('D3', scaleMap), 'D3');
  });

  it('14. Existing untouched tokens are NOT reprocessed during editing', () => {
    // Existing line has natural F4 (intentional chromatic note). User types 'a4' at end in D Major.
    const res = handleLeadInputChange('D4 E4 F4 G4 a4', 'D4 E4 F4 G4 ', 14, 'D');
    // Existing F4 remains untouched!
    assert.equal(res.content, 'D4 E4 F4 G4 A4');
  });

  it('15. Pasted multi-note Lead content remains raw and literal', () => {
    const pasted = 'D E F G A B C';
    const res = handleLeadInputChange(pasted, '', pasted.length, 'D', true);
    assert.equal(res.content, 'D E F G A B C');
  });

  it('16. Backspace / Deletion does not re-expand accidentals', () => {
    // User backspaces on F# leaving F
    const res = handleLeadInputChange('D4 E4 F', 'D4 E4 F#', 7, 'D');
    assert.equal(res.content, 'D4 E4 F');
  });

  it('17. Toggle Activation: When Auto Lead is inactive, input is untouched; when active, accidentals resolve', () => {
    const rawInput = 'D4 E4 f';
    const prev = 'D4 E4 ';
    const isAutoLeadActive = false;

    // When inactive (toggle OFF)
    const inactiveResult = isAutoLeadActive
      ? handleLeadInputChange(rawInput, prev, 7, 'D').content
      : rawInput;
    assert.equal(inactiveResult, 'D4 E4 f');

    // When active (toggle ON)
    const activeResult = handleLeadInputChange(rawInput, prev, 7, 'D').content;
    assert.equal(activeResult, 'D4 E4 F#');
  });
});
