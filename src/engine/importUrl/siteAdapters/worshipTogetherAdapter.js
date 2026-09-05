/**
 * Site Adapter for Worship Together & similar standard chord chart platforms.
 */

import { cleanDom, getNodeFormattedText } from '../domAnalyzer.js';

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 */
export function extractWithWorshipTogetherAdapter($, sourceUrl) {
  cleanDom($);

  const title = $('h1.song-title, .song-details h1, h1').first().text().trim();
  const artist = $('.artist-name, .song-artist, .author').first().text().trim();

  const container = $('.chord-pro, .chord-sheet, .song-content, pre').first();
  const rawText = getNodeFormattedText(container.length ? container : $('body'), $);

  return {
    title: title || 'Worship Song',
    artist: artist || '',
    rawText
  };
}
