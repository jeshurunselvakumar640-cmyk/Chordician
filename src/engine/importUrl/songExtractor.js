/**
 * Song Extractor for Import from URL pipeline.
 */

import * as cheerio from 'cheerio';
import { validateUrl } from './urlSecurity.js';
import { fetchHtml } from './htmlFetcher.js';
import { extractFromDom } from './siteAdapters/index.js';
import { parseSong } from '../core/songParser.js';
import { normalizeToChordicianSong } from '../normalizer/songNormalizer.js';
import { evaluateConfidence } from '../confidence/confidenceScorer.js';

/**
 * Extracts, parses, and normalizes a song from a webpage URL.
 * @param {string} targetUrl
 * @returns {Promise<{
 *   success: boolean,
 *   song: import('../core/types.js').ChordicianSong | null,
 *   confidence: number,
 *   warnings: string[],
 *   sourceUrl?: string,
 *   error?: string,
 *   code?: string,
 *   debug?: Record<string, any>
 * }>}
 */
export async function extractSongFromUrl(targetUrl) {
  const validation = validateUrl(targetUrl);
  if (!validation.valid) {
    return {
      success: false,
      song: null,
      confidence: 0,
      warnings: [],
      error: validation.error,
      code: validation.code
    };
  }

  try {
    const { html, finalUrl } = await fetchHtml(validation.url);

    const $ = cheerio.load(html);
    const extracted = extractFromDom($, finalUrl);

    if (!extracted.rawText || extracted.rawText.trim().length < 15) {
      return {
        success: false,
        song: null,
        confidence: 0,
        warnings: [],
        error: 'No readable song lyrics or chord structure could be found on this webpage. Please paste the song text directly via Smart Paste.',
        code: 'EMPTY_CONTENT'
      };
    }

    const parsed = parseSong(extracted.rawText, {
      title: extracted.title,
      artist: extracted.artist,
      originalKey: extracted.originalKey,
      inputType: 'url_import'
    });

    const confidenceEval = evaluateConfidence(parsed);
    parsed.confidence = confidenceEval.confidence;
    parsed.warnings = confidenceEval.warnings;

    const chordicianSong = normalizeToChordicianSong(parsed, finalUrl);

    return {
      success: true,
      song: chordicianSong,
      confidence: confidenceEval.confidence,
      warnings: confidenceEval.warnings,
      sourceUrl: finalUrl,
      debug: {
        inputType: 'url_import',
        detectedChords: parsed.debug?.detectedChords || 0,
        detectedLyrics: parsed.debug?.detectedLyrics || 0,
        sections: chordicianSong.sections.length,
        confidence: confidenceEval.confidence
      }
    };
  } catch (err) {
    console.error('[Import URL Engine Error]:', err.message || err);
    return {
      success: false,
      song: null,
      confidence: 0,
      warnings: [],
      error: err.message || 'Something went wrong while importing this URL. Please try again.',
      code: err.code || 'PARSER_FAILED'
    };
  }
}
