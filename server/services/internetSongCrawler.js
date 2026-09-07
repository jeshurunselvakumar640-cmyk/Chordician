import { safeFetchHtml } from './urlFetcher.js';
import { sanitizeInternetSongContent, isValidChordSheetContent } from './internetSanitizer.js';

/**
 * Hard Domain Allowlist - strictly allowed sites for Internet Import.
 * General search engines (Google, Bing, Yahoo, etc.) and outside sites are STRICTLY FORBIDDEN.
 */
export const ALLOWED_INTERNET_SOURCES = [
  {
    id: 'chordsver',
    name: 'Chordsver',
    domain: 'chordsver.com',
    baseUrl: 'https://chordsver.com',
    priority: 1
  },
  {
    id: 'thegodsmusic',
    name: 'The Gods Music',
    domain: 'thegodsmusic.com',
    baseUrl: 'https://thegodsmusic.com',
    priority: 2
  },
  {
    id: 'tamilchristiansongs',
    name: 'Tamil Christian Songs',
    domain: 'tamilchristiansongs.in',
    baseUrl: 'https://tamilchristiansongs.in',
    priority: 3
  },
  {
    id: 'churchspot',
    name: 'Churchspot',
    domain: 'churchspot.com',
    baseUrl: 'https://churchspot.com',
    priority: 4
  },
  {
    id: 'songsofpraise',
    name: 'Songs of Praise',
    domain: 'songsofpraise.in',
    baseUrl: 'https://songsofpraise.in',
    priority: 5
  },
  {
    id: 'yeshukegeet',
    name: 'Yeshu Ke Geet',
    domain: 'yeshukegeet.com',
    baseUrl: 'https://www.yeshukegeet.com',
    priority: 6
  }
];

/**
 * Checks if a hostname or URL belongs to the allowed 6 sources.
 * @param {string} urlOrHostname
 * @returns {boolean}
 */
export function isAllowedInternetSource(urlOrHostname) {
  if (!urlOrHostname || typeof urlOrHostname !== 'string') return false;

  let host = urlOrHostname.toLowerCase();
  try {
    if (host.startsWith('http://') || host.startsWith('https://')) {
      host = new URL(host).hostname.toLowerCase();
    }
  } catch (e) {
    // If not a full URL, continue with string check
  }

  // Remove www.
  host = host.replace(/^www\./, '');

  return ALLOWED_INTERNET_SOURCES.some((s) => s.domain === host || host.endsWith('.' + s.domain));
}

/**
 * Calculates letter similarity ratio (0.0 to 1.0) between query and candidate title.
 */
function calculateTitleSimilarity(query, title) {
  const q = String(query || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
  const t = String(title || '').toLowerCase().replace(/[^a-z0-9]/gi, '');

  if (!q || !t) return 0;
  if (q === t) return 1.0;
  if (t.includes(q)) return 0.95;
  if (q.includes(t)) return 0.90;

  // Levenshtein distance on clean strings
  const m = q.length;
  const n = t.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = q[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }

  const dist = d[m][n];
  const maxLen = Math.max(m, n);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Generates URL-friendly slug variants from a song title.
 */
function generateSlugVariants(query) {
  const clean = String(query || '').toLowerCase().trim();
  const slugHyphen = clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const slugUnderscore = clean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const slugCompact = clean.replace(/[^a-z0-9]/g, '');

  const variants = [slugHyphen];
  if (!variants.includes(`${slugHyphen}-chords`)) variants.push(`${slugHyphen}-chords`);
  if (!variants.includes(`${slugHyphen}-keyboard-chords`)) variants.push(`${slugHyphen}-keyboard-chords`);
  if (!variants.includes(`${slugHyphen}-lyrics-chords`)) variants.push(`${slugHyphen}-lyrics-chords`);
  if (slugUnderscore !== slugHyphen && !variants.includes(slugUnderscore)) variants.push(slugUnderscore);
  if (slugCompact !== slugHyphen && !variants.includes(slugCompact)) variants.push(slugCompact);

  return variants;
}

/**
 * Extracts links and anchor text from search results HTML.
 */
function extractLinksFromHtml(html, baseDomainUrl) {
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();

    if (!rawHref || !text || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;

    try {
      const fullUrl = new URL(rawHref, baseDomainUrl).toString();
      if (isAllowedInternetSource(fullUrl)) {
        links.push({
          url: fullUrl,
          title: text
        });
      }
    } catch (e) {
      // Ignore invalid URL formatting
    }
  }

  return links;
}

/**
 * Searches a specific allowlisted source for a song.
 *
 * @param {Object} source - The source config object
 * @param {string} query - User search query
 * @returns {Promise<{ rawContent: string, sourceUrl: string, title: string, artist: string, key: string } | null>}
 */
async function searchSingleSource(source, query) {
  console.log(`[Internet Crawler] Checking Source ${source.priority}: ${source.name} (${source.domain})...`);
  const encodedQuery = encodeURIComponent(query.trim());
  const slugs = generateSlugVariants(query);

  const candidateUrls = [];

  // 1. Domain-specific search endpoint URLs
  if (source.id === 'chordsver') {
    candidateUrls.push(`https://chordsver.com/search?q=${encodedQuery}`);
    candidateUrls.push(`https://chordsver.com/?s=${encodedQuery}`);
    for (const s of slugs) {
      candidateUrls.push(`https://chordsver.com/chords/${s}`);
      candidateUrls.push(`https://chordsver.com/${s}`);
    }
  } else if (source.id === 'thegodsmusic') {
    candidateUrls.push(`https://thegodsmusic.com/?s=${encodedQuery}`);
    for (const s of slugs) {
      candidateUrls.push(`https://thegodsmusic.com/chords/${s}`);
      candidateUrls.push(`https://thegodsmusic.com/${s}`);
    }
  } else if (source.id === 'tamilchristiansongs') {
    candidateUrls.push(`https://tamilchristiansongs.in/?s=${encodedQuery}`);
    for (const s of slugs) {
      candidateUrls.push(`https://tamilchristiansongs.in/tamil/chords/${s}`);
      candidateUrls.push(`https://tamilchristiansongs.in/chords/${s}`);
      candidateUrls.push(`https://tamilchristiansongs.in/${s}`);
    }
  } else if (source.id === 'churchspot') {
    candidateUrls.push(`https://churchspot.com/search-results/?other=&album=&key=&time=&skeyword=${encodedQuery}&submit=SEARCH`);
    candidateUrls.push(`https://churchspot.com/?s=${encodedQuery}`);
    for (const s of slugs) {
      candidateUrls.push(`https://churchspot.com/${s}`);
    }
  } else if (source.id === 'songsofpraise') {
    candidateUrls.push(`https://songsofpraise.in/search.php?q=${encodedQuery}`);
    candidateUrls.push(`https://songsofpraise.in/songlist.php?song_lang=hindi&q=${encodedQuery}`);
    for (const s of slugs) {
      candidateUrls.push(`https://songsofpraise.in/song/${s}`);
    }
  } else if (source.id === 'yeshukegeet') {
    candidateUrls.push(`https://www.yeshukegeet.com/?s=${encodedQuery}`);
    candidateUrls.push(`https://www.yeshukegeet.com/blog`);
    for (const s of slugs) {
      candidateUrls.push(`https://www.yeshukegeet.com/${s}`);
    }
  }

  // 2. Iterate through candidate URLs for this source
  for (const targetUrl of candidateUrls) {
    try {
      // Re-verify allowlist on targetUrl
      if (!isAllowedInternetSource(targetUrl)) {
        console.warn(`[Internet Crawler] Skipping disallowed URL: ${targetUrl}`);
        continue;
      }

      console.log(`[Internet Crawler] Trying URL: ${targetUrl}`);
      const fetchRes = await safeFetchHtml(targetUrl);
      if (!fetchRes || !fetchRes.html) continue;

      // Verify domain didn't redirect to an unauthorized third party
      if (!isAllowedInternetSource(fetchRes.finalUrl)) {
        console.warn(`[Internet Crawler] Redirected to unapproved domain: ${fetchRes.finalUrl}`);
        continue;
      }

      // If page is a search results page containing links, find the best matching link
      const links = extractLinksFromHtml(fetchRes.html, targetUrl);
      let bestLink = null;
      let highestSimilarity = 0;

      for (const link of links) {
        // Skip generic navigational links
        if (/^(?:Home|About|Contact|Privacy|Terms|Chords|Songs|Categories|Tags|Login|Register)$/i.test(link.title)) {
          continue;
        }

        const sim = calculateTitleSimilarity(query, link.title);
        if (sim >= 0.55 && sim > highestSimilarity) {
          highestSimilarity = sim;
          bestLink = link;
        }
      }

      let songHtml = fetchRes.html;
      let finalSongUrl = fetchRes.finalUrl;
      let songTitle = query;

      if (bestLink && highestSimilarity >= 0.55 && bestLink.url !== targetUrl) {
        console.log(`[Internet Crawler] Found matching song link on ${source.name}: "${bestLink.title}" (${(highestSimilarity * 100).toFixed(0)}% match) -> ${bestLink.url}`);
        const songFetch = await safeFetchHtml(bestLink.url);
        if (songFetch && songFetch.html && isAllowedInternetSource(songFetch.finalUrl)) {
          songHtml = songFetch.html;
          finalSongUrl = songFetch.finalUrl;
          songTitle = bestLink.title;
        }
      }

      // 3. Sanitize and extract content
      const sanitized = sanitizeInternetSongContent(songHtml, source.domain);

      // 4. Validate viable chord/lyric sheet
      if (sanitized && isValidChordSheetContent(sanitized)) {
        console.log(`[Internet Crawler] ✓ Successfully extracted viable chord sheet from ${source.name} (${sanitized.split('\n').length} lines)!`);

        // Extract key if present
        let extractedKey = 'C';
        const keyMatch = sanitized.match(/\bKEY\s*:\s*([A-G][#b]?m?)/i) || songHtml.match(/\b(?:Key|Scale)\s*:\s*([A-G][#b]?m?)/i);
        if (keyMatch) extractedKey = keyMatch[1];

        // Extract artist if mentioned
        let extractedArtist = 'Unknown';
        const artistMatch = songHtml.match(/(?:by|Artist|Songwriter)\s*[:–-]?\s*([A-Za-z\s.]{3,30})/i);
        if (artistMatch && !/^(?:Admin|Unknown|Chords|Home)$/i.test(artistMatch[1].trim())) {
          extractedArtist = artistMatch[1].trim();
        }

        return {
          rawContent: sanitized,
          sourceUrl: finalSongUrl,
          sourceName: source.name,
          sourceDomain: source.domain,
          title: songTitle.replace(/\s*-\s*Chords.*$/i, '').replace(/\s*\(.*?\)/g, '').trim(),
          artist: extractedArtist,
          key: extractedKey
        };
      }
    } catch (err) {
      console.log(`[Internet Crawler] Source ${source.name} attempt failed (${err.code || err.message}). Moving to next attempt...`);
    }
  }

  return null;
}

/**
 * Searches across the 6 allowlisted sources in strict priority order (1 -> 2 -> 3 -> 4 -> 5 -> 6).
 * Proceeds to next source ONLY if current source returns 404, fails, or has no valid chord content.
 *
 * @param {string} query - The song title search query
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<{ success: boolean, sourceName?: string, sourceUrl?: string, rawContent?: string, title?: string, artist?: string, key?: string, error?: string, code?: string }>}
 */
export async function searchSongAcrossInternet(query, onProgress = null) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      success: false,
      error: 'Please enter a song title to search.',
      code: 'EMPTY_QUERY'
    };
  }

  const cleanQuery = query.trim();
  console.log(`\n[Internet Crawler] === Starting Internet Song Search for: "${cleanQuery}" ===`);

  // Iterate strictly through sources 1 to 6
  for (const source of ALLOWED_INTERNET_SOURCES) {
    if (typeof onProgress === 'function') {
      onProgress(source.name, source.domain, source.priority);
    }

    try {
      const result = await searchSingleSource(source, cleanQuery);
      if (result && result.rawContent) {
        console.log(`[Internet Crawler] === FOUND MATCH on Source #${source.priority} (${source.name}) ===\n`);
        return {
          success: true,
          ...result
        };
      }
    } catch (sourceErr) {
      console.warn(`[Internet Crawler] Source ${source.name} failed:`, sourceErr.message);
    }
  }

  console.log(`[Internet Crawler] === Song "${cleanQuery}" was not found across all 6 allowlisted sources ===\n`);

  return {
    success: false,
    error: 'Song not found in selected sources. You can paste the chords directly using Smart Paste.',
    code: 'SONG_NOT_FOUND'
  };
}
