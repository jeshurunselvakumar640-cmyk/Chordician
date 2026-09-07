/**
 * Site Adapter Dispatcher.
 */

import { extractWithGenericAdapter } from './genericAdapter.js';
import { extractWithTamilChristianSongsAdapter } from './tamilChristianSongsAdapter.js';
import { extractWithWorshipTogetherAdapter } from './worshipTogetherAdapter.js';
import { extractWithTheGodsMusicAdapter } from './theGodsMusicAdapter.js';
import { extractWithChordsverAdapter } from './chordsverAdapter.js';
import { extractWithChurchspotAdapter } from './churchspotAdapter.js';
import { extractWithSongsOfPraiseAdapter } from './songsOfPraiseAdapter.js';
import { extractWithYeshuKeGeetAdapter } from './yeshuKeGeetAdapter.js';

/**
 * @param {string} url
 */
export function getSiteAdapter(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('chordsver')) {
      return extractWithChordsverAdapter;
    }

    if (hostname.includes('thegodsmusic')) {
      return extractWithTheGodsMusicAdapter;
    }

    if (hostname.includes('tamilchristiansongs') || hostname.includes('gospelchords') || hostname.includes('tamilchristianlyrics')) {
      return extractWithTamilChristianSongsAdapter;
    }

    if (hostname.includes('churchspot')) {
      return extractWithChurchspotAdapter;
    }

    if (hostname.includes('songsofpraise')) {
      return extractWithSongsOfPraiseAdapter;
    }

    if (hostname.includes('yeshukegeet')) {
      return extractWithYeshuKeGeetAdapter;
    }

    if (hostname.includes('worshiptogether') || hostname.includes('worshipleader') || hostname.includes('essentialworship')) {
      return extractWithWorshipTogetherAdapter;
    }
  } catch {
    // Default to generic
  }

  return extractWithGenericAdapter;
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} sourceUrl
 */
export function extractFromDom($, sourceUrl) {
  const adapter = getSiteAdapter(sourceUrl);
  return adapter($, sourceUrl);
}

