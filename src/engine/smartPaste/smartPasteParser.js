/**
 * Smart Paste Parser.
 * High-level service for parsing raw pasted chord and lyric text from WhatsApp, PDFs, notes, or websites.
 */

import { parseSong } from '../core/songParser.js';
import { normalizeToChordicianSong } from '../normalizer/songNormalizer.js';
import { evaluateConfidence } from '../confidence/confidenceScorer.js';

/**
 * Parses pasted chord and lyric text into a validated Chordician song model.
 * @param {string} rawText
 * @param {Object} [metadata={}]
 * @returns {{
 *   success: boolean,
 *   song: import('../core/types.js').ChordicianSong | null,
 *   confidence: number,
 *   warnings: string[],
 *   error?: string,
 *   debug?: Record<string, any>
 * }}
 */
export function parseSmartPaste(rawText, metadata = {}) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      success: false,
      song: null,
      confidence: 0,
      warnings: [],
      error: 'Please enter or paste chord sheet text to analyze.'
    };
  }

  try {
    const parsed = parseSong(rawText, {
      ...metadata,
      inputType: 'smart_paste'
    });

    const confidenceEval = evaluateConfidence(parsed);
    parsed.confidence = confidenceEval.confidence;
    parsed.warnings = confidenceEval.warnings;

    const chordicianSong = normalizeToChordicianSong(parsed, 'Smart Paste / Direct Input');

    return {
      success: true,
      song: chordicianSong,
      confidence: confidenceEval.confidence,
      warnings: confidenceEval.warnings,
      debug: {
        inputType: 'smart_paste',
        detectedChords: parsed.debug?.detectedChords || 0,
        detectedLyrics: parsed.debug?.detectedLyrics || 0,
        sections: chordicianSong.sections.length,
        confidence: confidenceEval.confidence
      }
    };
  } catch (err) {
    console.error('[Smart Paste Engine Error]:', err);
    return {
      success: false,
      song: null,
      confidence: 0,
      warnings: [],
      error: err.message || 'Failed to parse song text. Please check your chord sheet format.'
    };
  }
}
