/**
 * Site Adapter for thegodsmusic.com
 * Extracts clean song title, metadata, and raw chord/lyric block.
 */

import { cleanDom, findBestSongContainer, getNodeFormattedText } from '../domAnalyzer.js';
import { extractRelevantSongBlock, removeWebsiteNoise } from '../urlContentPreprocessor.js';

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 * @returns {{ title: string, artist: string, originalKey?: string, rawText: string, source: string }}
 */
export function extractWithTheGodsMusicAdapter($, sourceUrl) {
  cleanDom($);

  // 1. Title Extraction
  let title = $('h1.entry-title, h1.post-title, h1, h2').first().text().trim();
  title = title
    .replace(/\s*(?:[-–—|:]\s*)?(?:Keyboard\s+Chords|Guitar\s+Chords|Piano\s+Chords|Chords\s+In\s+English|Chords\s+In\s+Tamil|Chords|Lyrics|Tabs).*$/i, '')
    .trim();

  if (!title) {
    title = 'The Gods Music Song';
  }

  // 2. Artist Extraction
  let artist = $('.entry-author, .author, .artist, [rel="author"]').first().text().trim();

  // 3. Key Detection
  let originalKey = null;
  const pageText = $('body').text();
  const keyMatch = pageText.match(/\b(?:Key|Scale)(?:\s*:\s*|\s+of\s+)([A-G][#b]?(?:m|maj|min)?)\b/i);
  if (keyMatch) {
    originalKey = keyMatch[1].toUpperCase();
  }

  // 4. Raw text extraction from main content
  let rawText = '';
  const mainContainer = $('.entry-content, .post-content, article, #content, main').first();
  if (mainContainer.length > 0) {
    rawText = getNodeFormattedText(mainContainer, $);
  } else {
    rawText = findBestSongContainer($);
  }

  // Clean using thegodsmusic block isolation and noise removal
  rawText = extractRelevantSongBlock(rawText, 'thegodsmusic');
  rawText = removeWebsiteNoise(rawText);

  return {
    title,
    artist: artist || '',
    originalKey,
    rawText,
    source: 'thegodsmusic'
  };
}
