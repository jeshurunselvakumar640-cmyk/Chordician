/**
 * Confidence Scorer & Warnings Generator for the Parsing Engine.
 */

/**
 * Evaluates the confidence score (0.0 to 1.0) and generates user-facing warnings for a parsed song.
 * @param {import('../core/types.js').ParsedSong} parsed
 * @returns {{ confidence: number, warnings: string[] }}
 */
export function evaluateConfidence(parsed) {
  const warnings = [];
  let score = 1.0;

  const totalSections = parsed.sections?.length || 0;
  let totalLines = 0;
  let totalChords = 0;
  let totalLyrics = 0;

  for (const sec of parsed.sections || []) {
    for (const line of sec.lines || []) {
      totalLines++;
      if (line.chords && line.chords.length > 0) {
        totalChords += line.chords.length;
      }
      if (line.lyrics && line.lyrics.trim().length > 0) {
        totalLyrics++;
      }
    }
  }

  // Penalty if no chords detected
  if (totalChords === 0) {
    score -= 0.35;
    warnings.push('No musical chords could be confidently detected. Only lyrics were extracted.');
  }

  // Penalty if no lyrics detected
  if (totalLyrics === 0 && totalChords > 0) {
    score -= 0.15;
    warnings.push('Only chords were detected with no lyric text.');
  }

  // Penalty if only 1 generic section was created for a long song
  if (totalSections === 1 && totalLines > 16) {
    score -= 0.1;
    warnings.push('No explicit section markers (Verse/Chorus) were found. Grouped into a single section.');
  }

  const finalConfidence = Math.max(0.1, Math.min(1.0, Math.round(score * 100) / 100));

  return {
    confidence: finalConfidence,
    warnings
  };
}
