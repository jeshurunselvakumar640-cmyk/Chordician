/**
 * Generic DOM Site Adapter.
 */

import { cleanDom, findBestSongContainer } from '../domAnalyzer.js';

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 * @returns {{ title: string, artist: string, originalKey?: string, rawText: string }}
 */
export function extractWithGenericAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('meta[property="og:title"]').attr('content') ||
              $('meta[name="twitter:title"]').attr('content') ||
              $('h1').first().text().trim() ||
              $('title').text().trim() || 'Imported Song';

  let artist = $('meta[property="music:musician"]').attr('content') ||
               $('meta[name="author"]').attr('content') ||
               $('.artist, .song-artist, .author').first().text().trim() || '';

  title = title.replace(
    /\s*(?:[|\-–—:]\s*)?(?:Chords|Lyrics|Tabs|Chord Chart|Sheet Music|Guitar Tabs|Ukulele Chords|Piano Chords|Worship Chords|Worship Together|Ultimate Guitar|E-Chords|Cifra Club|Tabs4Acoustic|Chordify).*$/i,
    ''
  ).trim();

  let originalKey;
  const pageText = $('body').text();
  const keyMatch = pageText.match(/\b(?:Key|Scale)(?:\s*:\s*|\s+of\s+)([A-G][#b]?(?:m|maj|min)?)\b/i);
  if (keyMatch) {
    originalKey = keyMatch[1].toUpperCase();
  }

  const rawText = findBestSongContainer($);

  return {
    title: title || 'Imported Song',
    artist: artist || '',
    originalKey,
    rawText
  };
}
