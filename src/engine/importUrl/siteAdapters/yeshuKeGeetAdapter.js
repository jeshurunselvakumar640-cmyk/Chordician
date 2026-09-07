/**
 * Site Adapter for yeshukegeet.com
 */

import { cleanDom, findBestSongContainer, getNodeFormattedText } from '../domAnalyzer.js';
import { sanitizeYeshuKeGeetContent } from '../../../../server/services/internetSanitizer.js';

export function extractWithYeshuKeGeetAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('h1.entry-title, h1').first().text().trim();
  title = title
    .replace(/\s*(?:[-–—|:]\s*)?(?:Easy\s+Guitar\s+Chords|Chords|Lyrics|Strumming).*$/i, '')
    .trim();

  let artist = $('.entry-author, .author').first().text().trim();

  let originalKey = null;
  const keyMatch = $('body').text().match(/\b(?:Key|Scale)\s*:\s*([A-G][#b]?m?)/i);
  if (keyMatch) {
    originalKey = keyMatch[1].toUpperCase();
  }

  let rawText = '';
  const mainContainer = $('.entry-content, .post-content, article, #content, main').first();
  if (mainContainer.length > 0) {
    rawText = getNodeFormattedText(mainContainer, $);
  } else {
    rawText = findBestSongContainer($);
  }

  rawText = sanitizeYeshuKeGeetContent(rawText);

  return {
    title: title || 'Yeshu Ke Geet Song',
    artist: artist || '',
    originalKey,
    rawText,
    source: 'yeshukegeet'
  };
}
