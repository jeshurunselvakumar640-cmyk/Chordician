/**
 * Site Adapter for Indian & Tamil Christian Chord sites (e.g. tamilchristiansongs.in, gospelchords.in).
 */

import { cleanDom, getNodeFormattedText, findBestSongContainer } from '../domAnalyzer.js';

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 */
export function extractWithTamilChristianSongsAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('h1.entry-title, h1.post-title, h1').first().text().trim();
  title = title.replace(/\s*(?:[-–—|:]\s*)?(?:Chords|Lyrics|Song|Tabs|Guitar|Keyboard|Piano|கீர்த்தனை|பாடல்).*$/i, '').trim();

  let artist = $('.entry-author, .author, .composer, [rel="author"]').first().text().trim();
  if (!artist && $('body').text().includes('Berchmans')) {
    artist = 'Fr. S.J. Berchmans';
  } else if (!artist && $('body').text().includes('Gersson')) {
    artist = 'Gersson Edinbaro';
  }

  // Detect Key
  let originalKey = null;
  const keyBtn = $('.key-selector .active, [data-key], .chord-key, .song-key').first().text().trim();
  if (keyBtn && /^[A-G][#b]?$/i.test(keyBtn)) {
    originalKey = keyBtn.toUpperCase();
  } else {
    const pageText = $('body').text();
    const keyMatch = pageText.match(/\b(?:Key|Scale)(?:\s*:\s*|\s+of\s+)([A-G][#b]?(?:m|maj|min)?)\b/i);
    if (keyMatch) originalKey = keyMatch[1].toUpperCase();
  }

  // Prioritize dedicated chord displays
  const rawText = findBestSongContainer($);

  return {
    title: title || 'Tamil Christian Song',
    artist: artist || '',
    originalKey,
    rawText
  };
}
