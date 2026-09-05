/**
 * Site Adapter Dispatcher.
 */

import { extractWithGenericAdapter } from './genericAdapter.js';
import { extractWithTamilChristianSongsAdapter } from './tamilChristianSongsAdapter.js';
import { extractWithWorshipTogetherAdapter } from './worshipTogetherAdapter.js';

/**
 * @param {string} url
 */
export function getSiteAdapter(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('tamilchristiansongs') || hostname.includes('gospelchords') || hostname.includes('tamilchristianlyrics')) {
      return extractWithTamilChristianSongsAdapter;
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
