/**
 * Site Adapter for churchspot.com
 */

import { cleanDom, findBestSongContainer, getNodeFormattedText } from '../domAnalyzer.js';
import { sanitizeChurchspotContent } from '../../../../server/services/internetSanitizer.js';

export function extractWithChurchspotAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('h1.entry-title, h1.post-title, h1').first().text().trim();
  title = title
    .replace(/\s*(?:[-–—|:]\s*)?(?:Chords|Lyrics|Tabs).*$/i, '')
    .trim();

  let artist = $('.artist, .entry-author').first().text().trim();

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

  rawText = sanitizeChurchspotContent(rawText);

  return {
    title: title || 'Churchspot Song',
    artist: artist || '',
    originalKey,
    rawText,
    source: 'churchspot'
  };
}
