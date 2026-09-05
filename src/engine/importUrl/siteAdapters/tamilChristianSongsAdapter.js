/**
 * Site Adapter for Indian & Tamil Christian Chord sites (e.g. tamilchristiansongs.in, gospelchords.in).
 */

import { cleanDom, getNodeFormattedText } from '../domAnalyzer.js';

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 */
export function extractWithTamilChristianSongsAdapter($, sourceUrl) {
  $(
    '.transpose-box, .key-changer, .wp-block-table, .social-icons, .related-posts, ' +
    '.yarpp-related, .entry-meta, .post-meta, .comments-area'
  ).remove();

  cleanDom($);

  let title = $('h1.entry-title, h1.post-title, h1').first().text().trim();
  title = title.replace(/\s*(?:Chords|Lyrics|Song|Tabs|கீர்த்தனை|பாடல்).*$/i, '').trim();

  let artist = $('.entry-author, .author, .composer').first().text().trim();

  const container = $('.entry-content, .post-content, article, #content').first();
  const rawText = getNodeFormattedText(container.length ? container : $('body'), $);

  return {
    title: title || 'Tamil Christian Song',
    artist: artist || '',
    rawText
  };
}
