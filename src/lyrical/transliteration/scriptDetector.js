/**
 * Deterministic script detection for Lyrical.
 * Identifies the dominant script used in the lyric content.
 */

export function detectLyricScript(text = '') {
  if (!text || typeof text !== 'string') {
    return 'Unknown';
  }

  // Count script occurrences
  const tamilCount = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  if (tamilCount > 10 || (tamilCount > 0 && tamilCount >= devanagariCount && tamilCount >= latinCount * 0.2)) {
    return 'Tamil';
  }

  if (devanagariCount > 10 || (devanagariCount > 0 && devanagariCount >= tamilCount && devanagariCount >= latinCount * 0.2)) {
    return 'Devanagari';
  }

  if (latinCount > 10) {
    return 'Roman';
  }

  if (tamilCount > 0) return 'Tamil';
  if (devanagariCount > 0) return 'Devanagari';
  if (latinCount > 0) return 'Roman';

  return 'Unknown';
}
