import * as cheerio from 'cheerio';
import { extractFromDom } from '../../src/engine/importUrl/siteAdapters/index.js';
import { extractSongContent } from '../../src/engine/importUrl/songContentExtractor.js';
import { parseSmartPaste } from '../../src/engine/smartPaste/smartPasteParser.js';

/**
 * Unified HTML Song Parser for backend & serverless execution.
 * Executes the exact same canonical reconstruction pipeline using Smart Paster.
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

  // Pass directly into Smart Paster for dual-inspection chord extraction & formatting!
  const smartPasteResult = parseSmartPaste(cleanRawText, {
    title: extracted.title,
    artist: extracted.artist,
    originalKey: extracted.originalKey,
    sourceUrl
  });

  if (!smartPasteResult.success || !smartPasteResult.song) {
    throw new Error(smartPasteResult.error || 'Failed to parse song chords from webpage.');
  }

  const song = smartPasteResult.song;
  const warnings = [...(smartPasteResult.warnings || [])];

  const totalChords = (song.sections || []).reduce((acc, sec) => {
    return acc + (sec.rows || []).filter(r => r.type === 'chords' && r.content.trim().length > 0).length;
  }, 0);

  if (totalChords === 0) {
    warnings.push('No chords could be confidently detected on this page. Only lyrics were extracted.');
  }

  return {
    song,
    warnings
  };
}
