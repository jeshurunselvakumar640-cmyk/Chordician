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
    assert.equal(res.content, 'D4 E4 F# ');
    assert.equal(res.cursorOffset, 2);
  });

  it('2. D Major: Bare C -> C#', () => {
    const scaleMap = getScaleNoteMap('D');
    assert.equal(resolveLeadToken('C', scaleMap), 'C#');
    assert.equal(resolveLeadToken('c', scaleMap), 'C#');

    const res = handleLeadInputChange('D4 E4 F#4 c', 'D4 E4 F#4 ', 11, 'D');
    assert.equal(res.content, 'D4 E4 F#4 C# ');
    assert.equal(res.cursorOffset, 2);
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
    assert.equal(res.content, 'D4 E4 F4 G4 A4 ');
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

  it('17. Smart Lead Toggle: When Smart Lead is inactive, input is untouched; when active, accidentals resolve', () => {
    const rawInput = 'D4 E4 f';
    const prev = 'D4 E4 ';
    const isSmartLeadActive = false;

    // When inactive (toggle OFF)
    const inactiveResult = isSmartLeadActive
      ? handleLeadInputChange(rawInput, prev, 7, 'D').content
      : rawInput;
    assert.equal(inactiveResult, 'D4 E4 f');

    // When active (toggle ON)
    const activeResult = handleLeadInputChange(rawInput, prev, 7, 'D').content;
    assert.equal(activeResult, 'D4 E4 F# ');
  });

  it('18. Smart Lead Preference Resolution: No preference defaults to ON, stored true/false respected', () => {
    const resolvePreference = (storedValue) => {
      if (storedValue === 'false') return false;
      if (storedValue === 'true') return true;
      return true; // Default ON
    };

    assert.equal(resolvePreference(null), true, 'No localStorage preference must default to ON (true)');
    assert.equal(resolvePreference(undefined), true, 'Undefined preference must default to ON (true)');
    assert.equal(resolvePreference('true'), true, 'Stored "true" must be ON');
    assert.equal(resolvePreference('false'), false, 'Stored "false" must be OFF');
  });

  it('19. Mobile/Manual Lead Typing Sequence in D Major (d -> D , f -> F# , a -> A , c -> C# )', () => {
    // 1. D key: 'd' -> 'D '
    let res = handleLeadInputChange('d', '', 1, 'D');
    assert.equal(res.content, 'D ');
    assert.equal(res.cursorOffset, 1);

    // 2. D key: next note 'f' typed after 'D ' -> 'D F# '
    res = handleLeadInputChange('D f', 'D ', 3, 'D');
    assert.equal(res.content, 'D F# ');
    assert.equal(res.cursorOffset, 2);

    // 3. D key: next note 'a' typed after 'D F# ' -> 'D F# A '
    res = handleLeadInputChange('D F# a', 'D F# ', 6, 'D');
    assert.equal(res.content, 'D F# A ');
    assert.equal(res.cursorOffset, 1);

    // 4. D key: next note 'c' typed after 'D F# A ' -> 'D F# A C# '
    res = handleLeadInputChange('D F# A c', 'D F# A ', 8, 'D');
    assert.equal(res.content, 'D F# A C# ');
    assert.equal(res.cursorOffset, 2);

    // Direct octave notes
    const resF4 = handleLeadInputChange('D E F4', 'D E ', 6, 'D');
    assert.equal(resF4.content, 'D E F#4 ');
    assert.equal(resF4.cursorOffset, 2);

    const resC5 = handleLeadInputChange('D E C5', 'D E ', 6, 'D');
    assert.equal(resC5.content, 'D E C#5 ');
    assert.equal(resC5.cursorOffset, 2);

    const resBb4 = handleLeadInputChange('D E Bb4', 'D E ', 7, 'D');
    assert.equal(resBb4.content, 'D E Bb4 ');
    assert.equal(resBb4.cursorOffset, 1);
  });

  it('20. Manual Space presses are preserved verbatim (d -> "D ", +Space -> "D  ", +Space -> "D   ")', () => {
    // 1. User types 'd' -> 'D ' (len 2, cursor at 2)
    const step1 = handleLeadInputChange('d', '', 1, 'D');
    assert.equal(step1.content, 'D ');
    assert.equal(step1.cursorOffset, 1);

    // 2. User presses Space -> raw input is 'D  ' (len 3, cursor at 3)
    const step2 = handleLeadInputChange('D  ', 'D ', 3, 'D');
    assert.equal(step2.content, 'D  ', 'Explicit user space must be preserved');
    assert.equal(step2.cursorOffset, 0, 'No cursor shift for normal space entry');

    // 3. User presses Space again -> raw input is 'D   ' (len 4, cursor at 4)
    const step3 = handleLeadInputChange('D   ', 'D  ', 4, 'D');
    assert.equal(step3.content, 'D   ', 'Consecutive user spaces must be preserved');
    assert.equal(step3.cursorOffset, 0);
  });

  it('21. Continuous sequence: "d f a c" naturally becomes "D F# A C# "', () => {
    let text = '';

    // Type 'd'
    let step = handleLeadInputChange(text + 'd', text, text.length + 1, 'D');
    text = step.content;
    assert.equal(text, 'D ');

    // Type 'f'
    step = handleLeadInputChange(text + 'f', text, text.length + 1, 'D');
    text = step.content;
    assert.equal(text, 'D F# ');

    // Type 'a'
    step = handleLeadInputChange(text + 'a', text, text.length + 1, 'D');
    text = step.content;
    assert.equal(text, 'D F# A ');

    // Type 'c'
    step = handleLeadInputChange(text + 'c', text, text.length + 1, 'D');
    text = step.content;
    assert.equal(text, 'D F# A C# ');
  });

  it('22. Typing a note immediately before existing text beginning with a space does not add double space', () => {
    // Current text: ' G4' (cursor at 0). User types 'f' before space -> raw input is 'f G4' (cursor at 1)
    const res = handleLeadInputChange('f G4', ' G4', 1, 'D');
    assert.equal(res.content, 'F# G4', 'Resolves f to F# without adding extra space because space already exists');
    assert.equal(res.cursorOffset, 1, 'Cursor shifts past # (len diff 1)');
  });
});
