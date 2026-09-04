import * as cheerio from 'cheerio';
import { isChordLine, parseInlineBracketedChords } from './chordParser.js';

/**
 * Extracts clean song metadata (title, artist, key) and structured raw content from webpage HTML.
 */
export function extractSongFromHtml(html, sourceUrl = '') {
  if (!html || typeof html !== 'string') {
    throw new Error('Empty HTML content provided.');
  }

  const $ = cheerio.load(html);

  // 1. Extract Metadata from JSON-LD, OpenGraph, Meta tags, and Headers
  const metadata = extractMetadata($, sourceUrl);

  // 2. Strip noise elements
  $(
    'script, style, noscript, iframe, nav, footer, header, aside, form, input, button, select, ' +
    '.ad, .ads, .advertisement, .cookie, .cookie-banner, .cookie-consent, .social-share, ' +
    '.comments, .comment-section, .sidebar, .related, .related-songs, .related-posts, .yarpp-related, ' +
    '.jp-relatedposts, .site-header, .site-footer, .transposer, .chords-transposer, .keys-list, ' +
    '.breadcrumb, .breadcrumbs, .menu, .navigation, svg, img, picture, audio, video'
  ).remove();

  // 3. Find Song Content Container
  let songContent = extractSongContainerText($, html);

  // 4. Post-process to remove unrelated footer / related songs / chromatic scales
  songContent = cleanExtractedSongText(songContent);

  if (!songContent || songContent.trim().length === 0) {
    throw new Error('No readable song lyrics or chord structure could be found on this webpage.');
  }

  return {
    title: metadata.title,
    artist: metadata.artist,
    originalKey: metadata.originalKey,
    rawText: songContent
  };
}

/**
 * Post-processes raw text to strip trailing related songs, chromatic note scales, and UI labels.
 */
function cleanExtractedSongText(text) {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const cleanLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If we hit Related songs / comments marker, stop reading further
    if (/^(?:Related(?:\s+Songs)?|You May Also Like|Leave a Reply|Comments|Share this:|Share on)\b/i.test(trimmed)) {
      break;
    }

    // Skip chromatic scales (e.g. "A♭AA♯B♭BCC♯D♭DD♯E♭EFF♯G♭GG♯" or "A Bb B C C# D Eb E F F# G Ab")
    if (/^[A-G][#b♭♯\sA-G]+$/i.test(trimmed) && trimmed.length > 15 && !trimmed.includes(' ')) {
      continue;
    }
    if (/^(?:[A-G][#b♭♯]?\s+){6,}[A-G][#b♭♯]?$/i.test(trimmed)) {
      continue;
    }

    // Skip standalone single UI words
    if (/^(?:Lyrics|Chords|Bible|Share|Related|Print|Transpose|Download|Guitar|Keyboard|Piano|Tamil|English)$/i.test(trimmed)) {
      continue;
    }

    cleanLines.push(line);
  }

  return cleanLines.join('\n').trim();
}

/**
 * Extract Title, Artist, Key from structured data and HTML headers
 */
function extractMetadata($, sourceUrl) {
  let title = '';
  let artist = '';
  let originalKey = null;

  // A. Check JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item.name && !title) title = item.name;
        if (item.headline && !title) title = item.headline;

        if (item.byArtist) {
          const by = item.byArtist;
          artist = typeof by === 'string' ? by : (by.name || '');
        } else if (item.author) {
          const auth = item.author;
          artist = typeof auth === 'string' ? auth : (auth.name || '');
        }
      }
    } catch {
      // Ignore invalid JSON-LD
    }
  });

  // B. Check Open Graph & Meta tags
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('meta[name="title"]').attr('content') || '';
  }

  if (!artist) {
    artist = $('meta[property="music:musician"]').attr('content') ||
             $('meta[property="og:music:musician"]').attr('content') ||
             $('meta[name="author"]').attr('content') || '';
  }

  // C. Check <h1> or <title>
  if (!title) {
    const h1 = $('h1').first().text().trim();
    if (h1 && h1.length < 120) {
      title = h1;
    }
  }

  if (!title) {
    title = $('title').text().trim();
  }

  // D. Check dedicated artist elements if still missing
  if (!artist) {
    const artistCandidate = $(
      '.artist, .song-artist, .author, .composer, [itemprop="byArtist"], [itemprop="author"]'
    ).first().text().trim();
    if (artistCandidate && artistCandidate.length < 80) {
      artist = artistCandidate;
    }
  }

  // E. Check for Key in HTML text (e.g. "Key: G" or "Key of C")
  const pageText = $('body').text();
  const keyMatch = pageText.match(/\bKey(?:\s*:\s*|\s+of\s+)([A-G][#b]?(?:m|maj|min)?)\b/i);
  if (keyMatch && keyMatch[1]) {
    originalKey = keyMatch[1].toUpperCase();
  }

  // F. Clean up Title & Artist
  const cleaned = cleanTitleAndArtist(title, artist, sourceUrl);
  title = cleaned.title;
  artist = cleaned.artist;

  return {
    title: title || 'Imported Song',
    artist: artist || '',
    originalKey
  };
}

/**
 * Strips common website suffixes from title (e.g. "Amazing Grace - Chords & Lyrics | Ultimate Guitar")
 */
function cleanTitleAndArtist(title, artist, sourceUrl) {
  let cleanTitle = (title || '').trim();
  let cleanArtist = (artist || '').trim();

  // Remove common title suffixes
  cleanTitle = cleanTitle.replace(
    /\s*(?:[|\-–—:]\s*)?(?:Chords|Lyrics|Tabs|Chord Chart|Sheet Music|Guitar Tabs|Ukulele Chords|Piano Chords|Worship Chords|Worship Together|Ultimate Guitar|E-Chords|Cifra Club|Tabs4Acoustic|Chordify).*$/i,
    ''
  ).trim();

  // If title is "Artist - Song Title" or "Song Title - Artist"
  if (cleanTitle.includes(' - ') || cleanTitle.includes(' – ')) {
    const parts = cleanTitle.split(/\s*[-–]\s*/);
    if (parts.length === 2) {
      if (!cleanArtist) {
        cleanArtist = parts[0].trim();
        cleanTitle = parts[1].trim();
      } else if (cleanArtist.toLowerCase() === parts[0].toLowerCase()) {
        cleanTitle = parts[1].trim();
      } else if (cleanArtist.toLowerCase() === parts[1].toLowerCase()) {
        cleanTitle = parts[0].trim();
      }
    }
  } else if (cleanTitle.toLowerCase().includes(' by ') && !cleanArtist) {
    const parts = cleanTitle.split(/\s+by\s+/i);
    if (parts.length === 2) {
      cleanTitle = parts[0].trim();
      cleanArtist = parts[1].trim();
    }
  }

  // If title matches domain name fallback
  if (sourceUrl) {
    try {
      const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
      if (cleanTitle.toLowerCase().includes(host.toLowerCase())) {
        cleanTitle = cleanTitle.replace(new RegExp(host, 'gi'), '').trim();
      }
    } catch {
      // Ignore
    }
  }

  return {
    title: cleanTitle || 'Imported Song',
    artist: cleanArtist || ''
  };
}

/**
 * Extracts text from the most specific song container while preserving line breaks and whitespace.
 */
function extractSongContainerText($, html) {
  // Convert <br> to newline inside all containers
  $('br').replaceWith('\n');

  // Candidate song containers in order of specificity
  const candidateSelectors = [
    'pre',
    '.js-tab-content',
    '.tab-content',
    '.crd',
    '.chord',
    '.chords',
    '.lyrics',
    '.song-lyrics',
    '.song-content',
    '.song-body',
    '#song-content',
    '#chords-body',
    'article.song',
    '.entry-content',
    'article',
    'main',
    '.content'
  ];

  for (const selector of candidateSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        const el = elements.eq(i);
        const text = getNodeFormattedText(el, $);
        if (hasChordLyricDensity(text)) {
          return text;
        }
      }
    }
  }

  // Fallback: entire body formatted text
  return getNodeFormattedText($('body'), $);
}

/**
 * Reads text from a Cheerio node while preserving block structure and whitespace.
 */
function getNodeFormattedText($el, $) {
  if (!$el || $el.length === 0) return '';

  // If node is a <pre>, directly return text with full whitespace
  if ($el.is('pre') || $el.find('pre').length > 0) {
    return $el.text();
  }

  // Replace/append newline to block elements cleanly
  $el.find('p, div, li, tr').append('\n');

  return $el.text();
}

/**
 * Checks if a text block contains recognizable chords and lyrics.
 */
function hasChordLyricDensity(text) {
  if (!text || text.length < 20) return false;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return false;

  let chordLineCount = 0;
  for (const line of lines) {
    if (isChordLine(line) || parseInlineBracketedChords(line).chords.length > 0) {
      chordLineCount++;
    }
  }

  return chordLineCount >= 1;
}
