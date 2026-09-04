import * as cheerio from 'cheerio';
import { isChord, isChordLine, parseInlineBracketedChords } from './chordParser.js';

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

  // 2. Format chord elements before cleaning so inline spans/tags retain chord markers
  formatInlineChordElements($);

  // 3. Convert line-break elements to newlines
  $('br, hr').replaceWith('\n');

  // 4. Strip strictly non-content noise elements
  $(
    'script:not([type="application/ld+json"]), style, noscript, iframe, svg, img, picture, ' +
    'audio, video, nav, footer, form, input, button, select, dialog, ' +
    '.ad, .ads, .advertisement, .cookie, .cookie-banner, .cookie-consent, ' +
    '.social-share, .comments-area, #comments, .sidebar, #sidebar, ' +
    '.breadcrumb, .breadcrumbs, .menu, .navigation, #wpadminbar'
  ).remove();

  // 5. Smart Song Content Container Detection with Scoring
  let songContent = extractBestSongContainerText($, html);

  // 6. Post-process to remove unrelated social headers, chromatic scales, and noise
  songContent = cleanExtractedSongText(songContent);

  // 7. Fallback to full body text if specific container was too empty
  if (!songContent || songContent.trim().length < 15) {
    const rawBody = getNodeFormattedText($('body'), $);
    songContent = cleanExtractedSongText(rawBody);
  }

  if (!songContent || songContent.trim().length === 0) {
    throw new Error('No readable song lyrics or chord structure could be found on this webpage. Please paste the song text directly into the editor or try another URL.');
  }

  return {
    title: metadata.title,
    artist: metadata.artist,
    originalKey: metadata.originalKey,
    rawText: songContent
  };
}

/**
 * Converts inline HTML chord elements into standard bracketed notation [Chord]
 * so chords inside <span>, <b>, <td> elements are preserved without losing alignment.
 */
function formatInlineChordElements($) {
  const chordSelectors = [
    'span.chord', 'span.c', 'span.chords', 'span.crd',
    'span[data-chord]', 'span[data-name="chord"]',
    'b.chord', 'i.chord', 'strong.chord', 'font.chord',
    '.chord-name', '.chord-pro'
  ];

  for (const selector of chordSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const chordText = ($el.attr('data-chord') || $el.text() || '').trim();
      if (chordText && chordText.length <= 12 && isChord(chordText, true)) {
        $el.replaceWith(` [${chordText}] `);
      }
    });
  }
}

/**
 * Evaluates candidate song containers and selects the highest quality content block.
 */
function extractBestSongContainerText($, html) {
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
    '.post-content',
    '.post_content',
    '.post-entry',
    '.article-content',
    '#content',
    '.content',
    'main',
    'article'
  ];

  let bestText = '';
  let bestScore = -1;

  for (const selector of candidateSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        const el = elements.eq(i);
        const text = getNodeFormattedText(el, $);
        const score = scoreSongContent(text);

        if (score > bestScore) {
          bestScore = score;
          bestText = text;
        }
      }
    }
  }

  // If a candidate scored well (> 10), return it
  if (bestScore >= 10 && bestText.trim().length > 30) {
    return bestText;
  }

  // Otherwise return formatted body text
  return getNodeFormattedText($('body'), $);
}

/**
 * Scores a text block based on song characteristics (chord presence, line count, section headers, lyric poetry).
 */
function scoreSongContent(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length < 20) return 0;

  let score = 0;
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Line count scoring (3 to 80 lines is typical song size)
  if (lines.length >= 4 && lines.length <= 150) {
    score += Math.min(lines.length * 2, 30);
  } else if (lines.length > 150) {
    score += 10; // Might contain whole page
  }

  let chordLineCount = 0;
  let bracketedChordCount = 0;
  let sectionHeaderCount = 0;
  let lyricLineCount = 0;

  for (const line of lines) {
    // Check for chord line
    if (isChordLine(line)) {
      chordLineCount++;
    }

    // Check for bracketed chords e.g. [Dm] or (G)
    const bracketed = parseInlineBracketedChords(line);
    if (bracketed.chords.length > 0) {
      bracketedChordCount += bracketed.chords.length;
    }

    // Check for section headers (English + Tamil + Hindi)
    if (/^(?:\[?(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|சரணம்|பல்லவி|அனுபல்லவி|Stanza|Refrain)\b)/i.test(line)) {
      sectionHeaderCount++;
    }

    // Normal lyric line length
    if (line.length >= 10 && line.length <= 90) {
      lyricLineCount++;
    }
  }

  score += chordLineCount * 8;
  score += bracketedChordCount * 4;
  score += sectionHeaderCount * 10;
  score += Math.min(lyricLineCount, 25);

  // Penalize navigation / UI heavy blocks
  if (/^(?:Cookie|Privacy|Terms|Copyright|All rights reserved|Menu|Navigation)\b/im.test(trimmed)) {
    score -= 15;
  }

  return score;
}

/**
 * Post-processes raw text to strip trailing related songs, chromatic note scales, and UI labels.
 */
function cleanExtractedSongText(text) {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  let validSongLinesFound = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If empty line, preserve spacing
    if (!trimmed) {
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    // If we have already gathered a substantial song (>= 6 lines) and hit an obvious footer/comment header, stop reading
    if (validSongLinesFound >= 6) {
      if (/^(?:Leave a Reply|Comments|Recent Posts|You May Also Like|Related Posts|Popular Songs|Footer Navigation)\b/i.test(trimmed)) {
        break;
      }
    }

    // Skip isolated social sharing lines
    if (/^(?:Share this:|Share on (?:Facebook|Twitter|WhatsApp|Pinterest)|Like this:|Tweet|Pin it|Email this)\b/i.test(trimmed)) {
      continue;
    }

    // Skip breadcrumb lines (e.g. "Home > Songs > Tamil Christian Songs")
    if (/^(?:Home|Songs|Lyrics)\s*[>»/]\s*/i.test(trimmed)) {
      continue;
    }

    // Skip chromatic note scales (e.g. "A♭AA♯B♭BCC♯D♭DD♯E♭EFF♯G♭GG♯" or "A Bb B C C# D Eb E F F# G Ab")
    if (/^[A-G][#b♭♯\sA-G]+$/i.test(trimmed) && trimmed.length > 15 && !trimmed.includes(' ')) {
      continue;
    }
    if (/^(?:[A-G][#b♭♯]?\s+){6,}[A-G][#b♭♯]?$/i.test(trimmed)) {
      continue;
    }

    // Skip standalone single UI words
    if (/^(?:Lyrics|Chords|Bible|Share|Related|Print|Transpose|Download|Guitar|Keyboard|Piano|Tamil|English|Search|Menu|Home)$/i.test(trimmed)) {
      continue;
    }

    cleanLines.push(line);
    validSongLinesFound++;
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

  // E. Check for Key in HTML text (e.g. "Key: G" or "Key of C" or "Scale: Dm")
  const pageText = $('body').text();
  const keyMatch = pageText.match(/\b(?:Key|Scale)(?:\s*:\s*|\s+of\s+)([A-G][#b]?(?:m|maj|min)?)\b/i);
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
 * Reads text from a Cheerio node while preserving block structure and whitespace.
 */
function getNodeFormattedText($el, $) {
  if (!$el || $el.length === 0) return '';

  // If node is a <pre>, directly return text with full whitespace
  if ($el.is('pre') || $el.find('pre').length > 0) {
    return $el.text();
  }

  // Clone so modifications don't corrupt parent DOM
  const $clone = $el.clone();
  $clone.find('p, div, li, tr, blockquote, section, article, h1, h2, h3, h4, h5, h6').append('\n');

  return $clone.text();
}
