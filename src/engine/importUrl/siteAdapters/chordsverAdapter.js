/**
 * Site Adapter for chordsver.com
 */

import { cleanDom, findBestSongContainer, getNodeFormattedText } from '../domAnalyzer.js';
import { sanitizeChordsverContent } from '../../../../server/services/internetSanitizer.js';

export function extractWithChordsverAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('h1.entry-title, h1.post-title, h1, h2').first().text().trim();
  title = title
    .replace(/\s*(?:[-–—|:]\s*)?(?:Lyrics\s*&\s*Chords|Chords|Lyrics|Tabs).*$/i, '')
    .trim();

  let artist = $('.artist, .artist-name, .entry-author').first().text().trim();
  if (!artist) {
    const byMatch = $('body').text().match(/by\s+([A-Za-z\s.]{3,30})/i);
    if (byMatch) artist = byMatch[1].trim();
  }

  let originalKey = null;
  const keyMatch = $('body').text().match(/\bKEY\s*:\s*([A-G][#b]?m?)/i);
  if (keyMatch) {
    originalKey = keyMatch[1].toUpperCase();
  }

  let rawText = '';
  const mainContainer = $('.chord-sheet, .song-content, .entry-content, article, #content, main').first();
  if (mainContainer.length > 0) {
    rawText = getNodeFormattedText(mainContainer, $);
  } else {
    rawText = findBestSongContainer($);
  }

  rawText = sanitizeChordsverContent(rawText);

  return {
    title: title || 'Chordsver Song',
    artist: artist || '',
    originalKey,
    rawText,
    source: 'chordsver'
  };
}
