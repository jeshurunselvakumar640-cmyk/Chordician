/**
 * Site Adapter for songsofpraise.in
 */

import { cleanDom, findBestSongContainer, getNodeFormattedText } from '../domAnalyzer.js';
import { sanitizeSongsOfPraiseContent } from '../../../../server/services/internetSanitizer.js';

export function extractWithSongsOfPraiseAdapter($, sourceUrl) {
  cleanDom($);

  let title = $('h1, h2.song-title').first().text().trim();
  title = title
    .replace(/^Lyrics\s*&\s*Chords\s+of\s+/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();

  let artist = $('.artist, .composer').first().text().trim();

  let originalKey = null;
  const keyMatch = $('body').text().match(/\b(?:Original\s+Scale|Key)\s*[:–-]?\s*([A-G][#b]?(?:\s*(?:Major|Minor|m))?)/i);
  if (keyMatch) {
    originalKey = keyMatch[1].replace(/\s*Major/i, '').replace(/\s*Minor/i, 'm').trim();
  }

  let rawText = '';
  const mainContainer = $('.song-content, .lyrics, .entry-content, article, #content, main').first();
  if (mainContainer.length > 0) {
    rawText = getNodeFormattedText(mainContainer, $);
  } else {
    rawText = findBestSongContainer($);
  }

  rawText = sanitizeSongsOfPraiseContent(rawText);

  return {
    title: title || 'Songs of Praise Song',
    artist: artist || '',
    originalKey,
    rawText,
    source: 'songsofpraise'
  };
}
