import * as cheerio from 'cheerio';
import { extractFromDom } from '../../src/engine/importUrl/siteAdapters/index.js';
import { extractSongContent } from '../../src/engine/importUrl/songContentExtractor.js';
import { parseSong } from '../../src/engine/core/songParser.js';
import { normalizeToChordicianSong } from '../../src/engine/normalizer/songNormalizer.js';
import { evaluateConfidence } from '../../src/engine/confidence/confidenceScorer.js';

/**
 * Unified HTML Song Parser for backend & serverless execution.
 * Executes the exact same canonical reconstruction pipeline as the engine.
 */
export async function parseHtmlToSong(html, sourceUrl = '') {
  if (!html || typeof html !== 'string') {
    throw new Error('Empty HTML content provided.');
  }

  const $ = cheerio.load(html);
  const extracted = extractFromDom($, sourceUrl);

  const cleanRawText = extractSongContent(extracted.rawText || '', {
    metadata: extracted,
    sourceUrl
  });

  if (!cleanRawText || cleanRawText.trim().length < 15) {
    throw new Error('No readable song lyrics or chord structure could be found on this webpage. Please paste the song text directly into the editor or try another URL.');
  }

  const parsed = parseSong(cleanRawText, {
    title: extracted.title,
    artist: extracted.artist,
    originalKey: extracted.originalKey,
    inputType: 'url_import'
  });

  const confidenceEval = evaluateConfidence(parsed);
  parsed.confidence = confidenceEval.confidence;
  parsed.warnings = confidenceEval.warnings;

  const song = normalizeToChordicianSong(parsed, sourceUrl);

  const totalChords = (song.sections || []).reduce((acc, sec) => {
    return acc + (sec.rows || []).filter(r => r.type === 'chords' && r.content.trim().length > 0).length;
  }, 0);

  const warnings = [...(confidenceEval.warnings || [])];
  if (totalChords === 0) {
    warnings.push('No chords could be confidently detected on this page. Only lyrics were extracted.');
  }

  return {
    song,
    warnings
  };
}
