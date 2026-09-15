/**
 * Key-Aware Lead Note Auto-Accidental Helper (v4.3)
 *
 * Provides real-time diatonic accidental resolution for manual Lead note typing
 * based on the active song key family from keyChordFamilies.js.
 */

import { getKeyGuideData } from '../data/keyChordFamilies.js';

/**
 * Extracts a map of base letter notes (A-G) to their diatonic scale pitch in the selected key.
 *
 * @param {string} selectedKey - e.g. "D", "G", "F", "Fm", "Db", "C"
 * @returns {Record<string, string>|null} e.g. { 'F': 'F#', 'C': 'C#', 'D': 'D', ... }
 */
export function getScaleNoteMap(selectedKey) {
  if (!selectedKey || typeof selectedKey !== 'string') return null;
  const guide = getKeyGuideData(selectedKey);
  if (!guide || !Array.isArray(guide.scale)) return null;

  const map = {};
  guide.scale.forEach((note) => {
    if (typeof note === 'string' && note.length > 0) {
      const base = note.charAt(0).toUpperCase();
      map[base] = note;
    }
  });
  return map;
}

/**
 * Resolves a single note token according to the key's diatonic scale map.
 *
 * Rules:
 * - If token already has an accidental (#, b, ♯, ♭), preserve it verbatim (e.g. 'F#' -> 'F#', 'Bb4' -> 'Bb4').
 * - If token is a bare natural note letter A-G (with optional octave digit 0-8), map base letter to key scale.
 * - Non-note tokens or unrecognized characters are returned unchanged.
 *
 * @param {string} token - e.g. "f", "F4", "c", "F#", "Bb", "g#4"
 * @param {Record<string, string>} scaleMap - mapping from getScaleNoteMap
 * @returns {string}
 */
export function resolveLeadToken(token, scaleMap) {
  if (!token || typeof token !== 'string' || !scaleMap) return token;

  // Clean duplicate accidentals if user redundantly types accidental after auto-accidental
  const cleanToken = token.replace(/##+|♯♯+/g, '#').replace(/bb+|♭♭+/g, 'b');

  const match = cleanToken.match(/^([A-Ga-g])([#b♯♭]?)([0-8]?)$/);
  if (!match) return cleanToken;

  const base = match[1].toUpperCase();
  const accidental = match[2];
  const octave = match[3] || '';

  // 1. Explicit accidental already present -> preserve verbatim
  if (accidental) {
    const cleanAcc = accidental === '♯' ? '#' : accidental === '♭' ? 'b' : accidental;
    return `${base}${cleanAcc}${octave}`;
  }

  // 2. Bare natural letter -> apply scale mapping
  const scaleNote = scaleMap[base];
  if (scaleNote) {
    return `${scaleNote}${octave}`;
  }

  return `${base}${octave}`;
}

/**
 * Transforms only the active note token at the cursor position during manual typing.
 *
 * Invariants:
 * - Only operates on manual keyboard entry (never on paste or import).
 * - Only modifies the active token at the cursor without reprocessing earlier/later notes.
 * - Deletion/Backspace leaves notes as-is without re-sharpening/re-flattening.
 *
 * @param {string} newValue - The new raw string from input onChange
 * @param {string} prevValue - The previous string before onChange
 * @param {number} cursorPosition - The current selectionStart in input
 * @param {string} selectedKey - The active song key (e.g. "D", "Fm")
 * @param {boolean} [isPaste=false] - Whether this change was caused by a paste
 * @returns {{ content: string, cursorOffset: number }}
 */
export function handleLeadInputChange(newValue, prevValue, cursorPosition, selectedKey, isPaste = false) {
  if (!selectedKey || isPaste || typeof newValue !== 'string') {
    return { content: newValue, cursorOffset: 0 };
  }

  // If deletion occurred (length decreased), do not auto-expand accidentals
  if (prevValue && newValue.length < prevValue.length) {
    return { content: newValue, cursorOffset: 0 };
  }

  const scaleMap = getScaleNoteMap(selectedKey);
  if (!scaleMap) {
    return { content: newValue, cursorOffset: 0 };
  }

  const pos = typeof cursorPosition === 'number' ? cursorPosition : newValue.length;

  // Find token boundaries around cursor
  const textBefore = newValue.slice(0, pos);
  const textAfter = newValue.slice(pos);

  const wordBeforeMatch = textBefore.match(/(\S+)$/);
  if (!wordBeforeMatch) {
    return { content: newValue, cursorOffset: 0 };
  }

  const tokenPrefix = wordBeforeMatch[1];
  const wordStart = pos - tokenPrefix.length;

  const wordAfterMatch = textAfter.match(/^(\S*)/);
  const tokenSuffix = wordAfterMatch ? wordAfterMatch[1] : '';
  const wordEnd = pos + tokenSuffix.length;

  const fullToken = newValue.slice(wordStart, wordEnd);
  const resolvedToken = resolveLeadToken(fullToken, scaleMap);

  if (resolvedToken === fullToken) {
    return { content: newValue, cursorOffset: 0 };
  }

  // Replace only the active token
  const updatedContent = newValue.slice(0, wordStart) + resolvedToken + newValue.slice(wordEnd);
  const lengthDiff = resolvedToken.length - fullToken.length;

  return {
    content: updatedContent,
    cursorOffset: lengthDiff
  };
}
