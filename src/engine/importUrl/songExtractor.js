/**
 * Song Extractor for Import from URL pipeline.
 */

import * as cheerio from 'cheerio';
import { validateUrl } from './urlSecurity.js';
import { fetchHtml } from './htmlFetcher.js';
import { extractFromDom } from './siteAdapters/index.js';
import { extractSongContent } from './songContentExtractor.js';
import { parseSmartPaste } from '../smartPaste/smartPasteParser.js';

/**
 * Extracts, parses, and normalizes a song from a webpage URL using Smart Paster.
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

    // Apply isolated song content extraction layer to filter out all website noise & align lines
    const cleanRawText = extractSongContent(extracted.rawText || '', { sourceUrl: finalUrl });

    if (!cleanRawText || cleanRawText.trim().length < 15) {
      return {
        success: false,
        song: null,
        confidence: 0,
        warnings: [],
        error: 'No readable song lyrics or chord structure could be found on this webpage. Please paste the song text directly via Smart Paste.',
        code: 'EMPTY_CONTENT'
      };
    }

    // Pass the restructured clean content directly to Smart Paster for high-precision chord extraction
    const smartPasteResult = parseSmartPaste(cleanRawText, {
      title: extracted.title,
      artist: extracted.artist,
      originalKey: extracted.originalKey,
      sourceUrl: finalUrl
    });

    if (!smartPasteResult.success || !smartPasteResult.song) {
      return {
        success: false,
        song: null,
        confidence: 0,
        warnings: smartPasteResult.warnings || [],
        error: smartPasteResult.error || 'Failed to parse song chords from webpage.',
        code: 'PARSER_FAILED'
      };
    }

    return {
      success: true,
      song: smartPasteResult.song,
      confidence: smartPasteResult.confidence,
      warnings: smartPasteResult.warnings,
      sourceUrl: finalUrl,
      debug: {
        inputType: 'url_import_via_smart_paste',
        detectedChords: smartPasteResult.debug?.detectedChords || 0,
        detectedLyrics: smartPasteResult.debug?.detectedLyrics || 0,
        sections: smartPasteResult.song.sections.length,
        confidence: smartPasteResult.confidence
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
