import { parseSong } from '../../src/engine/core/songParser.js';
import { normalizeToChordicianSong } from '../../src/engine/normalizer/songNormalizer.js';
import { evaluateConfidence } from '../../src/engine/confidence/confidenceScorer.js';

/**
 * Normalizes extracted raw text into the official Chordician song data model
 * using the unified song parsing engine.
 */
export function normalizeSongData({ title, artist, originalKey, rawText }, sourceUrl = '') {
  const parsed = parseSong(rawText, {
    title,
    artist,
    originalKey,
    inputType: sourceUrl ? 'url_import' : 'smart_paste'
  });

  const confidenceEval = evaluateConfidence(parsed);
  parsed.confidence = confidenceEval.confidence;
  parsed.warnings = confidenceEval.warnings;

  return normalizeToChordicianSong(parsed, sourceUrl);
}
