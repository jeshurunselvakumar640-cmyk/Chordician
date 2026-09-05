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

  // 4. Strip strictly non-content noise elements, sidebars, and widgets
  $(
    'script:not([type="application/ld+json"]), style, noscript, iframe, svg, img, picture, ' +
    'audio, video, nav, footer, form, input, button, select, dialog, aside, [role="complementary"], ' +
    '.ad, .ads, .advertisement, .cookie, .cookie-banner, .cookie-consent, ' +
    '.social-share, .comments-area, #comments, .sidebar, #sidebar, .drawer, ' +
    '.breadcrumb, .breadcrumbs, .menu, .navigation, #wpadminbar, ' +
    '.transpose, .transpose-keys, .key-selector, .keys-list, .pitch-list, #transpose, ' +
    '.transpose-controls, .chord-switcher, .scale-list, .c-transpose, .transpose-bar, ' +
    '.key-changer, .chords-controls, .song-meta-box, .song-toolbar, .key-buttons, .scale-selector, ' +
    '.related-posts, .related-songs, .related-articles, .related_posts, .yarpp-related, ' +
    '.interactive-editor, .chordpro-editor, .account-menu, .user-favorites, .user-profile, ' +
    '.widget, .widget-area, .author-bio, .post-author, .post-navigation, .entry-meta, .meta-info, ' +
    '.popular-posts, .popular-songs, .recent-posts, .recent-songs, .song-sidebar, .songs-list'
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
 * so chords inside <span>, <b>, <td>, <ruby>, <sup> elements are preserved without losing alignment.
 */
function formatInlineChordElements($) {
  // A. Ruby tags: <ruby>word<rt>Chord</rt></ruby> -> [Chord]word
  $('ruby').each((_, el) => {
    const $ruby = $(el);
    const chord = $ruby.find('rt').text().trim();
    $ruby.find('rt, rp').remove();
    const lyric = $ruby.text().trim();
    if (chord && isChord(chord, true)) {
      $ruby.replaceWith(`[${chord}]${lyric}`);
    } else {
      $ruby.replaceWith(lyric);
    }
  });

  // B. Elements with chord data attributes or class names
  const chordSelectors = [
    '[data-chord]', '[data-name="chord"]', '[data-c]',
    'span[class*="chord"]', 'span[class*="crd"]', 'span.c', 'b[class*="chord"]',
    'i[class*="chord"]', 'strong[class*="chord"]', 'font[class*="chord"]',
    '.chord-name', '.chord-pro', '.ug-chord', 'sup', 'rt'
  ];

  for (const selector of chordSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const chordText = ($el.attr('data-chord') || $el.text() || '').trim();
      if (chordText && chordText.length <= 14 && isChord(chordText, true)) {
        $el.replaceWith(`[${chordText}]`);
      } else {
        // Remove empty marker spans so they don't produce []
        $el.remove();
      }
    });
  }

  // Unwrap chord helper wrappers
  $('.chord-anchor, .chord-stack').each((_, el) => {
    $(el).replaceWith($(el).html() || '');
  });

  // C. Any standalone leaf inline element whose text is strictly a valid chord
  $('span, b, strong, i, em, font, sup').each((_, el) => {
    const $el = $(el);
    if ($el.children().length === 0) {
      const text = $el.text().trim();
      if (text && text.length <= 12 && isChord(text, true)) {
        $el.replaceWith(`[${text}]`);
      } else if (!text || text.length === 0) {
        $el.remove();
      }
    }
  });
}

/**
 * Evaluates candidate song containers and selects the highest quality content block.
 */
function extractBestSongContainerText($, html) {
  const candidateSelectors = [
    '#chord-display-en',
    '#chord-display-ta',
    '#tab-english',
    '#tab-tamil',
    '#tab-merged',
    '.chord-content',
    '.chord-tab-panel',
    '.chord-sheet',
    '.chordpro-content',
    '.song-chords',
    '.chords-container',
    '.js-tab-content',
    '.tab-content',
    '.song-content',
    '.song-lyrics',
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
    'article',
    'pre'
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
    // If a high-priority chord display container scored well, return immediately
    if (bestScore >= 12 && bestText.trim().length > 30) {
      return bestText;
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

  // Line count scoring (3 to 150 lines is typical song size)
  if (lines.length >= 4 && lines.length <= 150) {
    score += Math.min(lines.length * 2, 30);
  } else if (lines.length > 150) {
    score += 10;
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
 * Removes emojis from text strings
 */
export function removeEmojis(str) {
  if (!str) return '';
  return str.replace(
    /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
    ''
  );
}

const SINGLE_NOTE_REGEX = /^[A-G][#b♭♯]?(?:m|maj|min|dim|aug|sus[24]?|add9|7)?$/i;
const TIME_SIG_REGEX = /^(?:[1-9]|1[0-2])\/(?:2|4|8|16)$/;
const INSTRUMENT_TAB_HEADER_REGEX =
  /^(?:.+?\s+)?(?:Chords|Lyrics|Tabs|Song|Chord Chart|Sheet Music)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i;
const FOOTER_UI_STOP_REGEX =
  /^(?:Your Account|Your Favourites|Your favorites|Interactive chord editor|Click a word|ChordPro source|Edit chords|Version history|Restricted \(copyright\)|Top Artists|Chords Z|Top Songs|Popular Songs|All Artists|Browse by|A B C D E F G|HIJKLMNOPQRSTUVWXYZ|Leave a Reply|Comments|Recent Posts|You May Also Like|Related Posts|Popular Songs|Footer Navigation|Similar Songs|Next Post|Previous Post|Tags:|Categories:|Copyright\s*©|All rights reserved)\b/i;

/**
 * Post-processes raw text to strip trailing related songs, chromatic note scales, emojis, transpose ladders, and UI labels.
 */
export function cleanExtractedSongText(text, metadata = {}) {
  if (!text) return '';

  const rawLines = text.split(/\r?\n/);
  const processed = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const noEmoji = removeEmojis(raw);
    const noBrackets = noEmoji.replace(/\[\s*\]|\(\s*\)/g, '');
    const trimmed = noBrackets.trim();
    processed.push({ raw: noBrackets, trimmed });
  }

  // Detect transpose note ladders (runs of >= 3 consecutive single note lines)
  const isLadder = new Array(processed.length).fill(false);
  let runStart = -1;
  let runCount = 0;

  for (let i = 0; i < processed.length; i++) {
    const { trimmed } = processed[i];
    if (trimmed && SINGLE_NOTE_REGEX.test(trimmed)) {
      if (runStart === -1) runStart = i;
      runCount++;
    } else if (!trimmed && runStart !== -1) {
      continue;
    } else {
      if (runCount >= 3) {
        for (let j = runStart; j < i; j++) {
          if (processed[j].trimmed && SINGLE_NOTE_REGEX.test(processed[j].trimmed)) {
            isLadder[j] = true;
          }
        }
      }
      runStart = -1;
      runCount = 0;
    }
  }
  if (runCount >= 3) {
    for (let j = runStart; j < processed.length; j++) {
      if (processed[j].trimmed && SINGLE_NOTE_REGEX.test(processed[j].trimmed)) {
        isLadder[j] = true;
      }
    }
  }

  const cleanLines = [];
  let validSongLinesFound = 0;

  for (let i = 0; i < processed.length; i++) {
    const { raw, trimmed } = processed[i];

    if (isLadder[i]) {
      continue;
    }

    if (!trimmed) {
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] !== '') {
        cleanLines.push('');
      }
      continue;
    }

    if (validSongLinesFound >= 8) {
      if (/^(?:Leave a Reply|Comments|Recent Posts|You May Also Like|Related Posts|Popular Songs|Footer Navigation|Similar Songs|Next Post|Previous Post|Tags:|Categories:|Copyright\s*©|All rights reserved)\b/i.test(trimmed)) {
        break;
      }
    }

    if (FOOTER_UI_STOP_REGEX.test(trimmed)) {
      continue;
    }

    if (INSTRUMENT_TAB_HEADER_REGEX.test(trimmed)) {
      const cleanTitle = trimmed.replace(/\s*(?:[-–—|:]\s*)?(?:Chords|Lyrics|Tabs|Song|Chord Chart|Sheet Music)(?:\s+(?:for\s+)?(?:Keyboard|Guitar|Piano|Ukulele|Bass|and|,|\s+)+)*$/i, '').trim();
      if ((!metadata.title || metadata.title === 'Imported Song') && cleanTitle) {
        metadata.title = cleanTitle;
      }
      continue;
    }

    if (/^(?:Share this:|Share on|Like this:|Tweet|Pin it|Email this|Follow us on|Join our (?:WhatsApp|Telegram) group|Subscribe to our (?:YouTube|channel)|Join (?:WhatsApp|Telegram)|Click here for|Download (?:PDF|Chords|Audio)|Listen on (?:Spotify|Apple Music|Amazon))\b/i.test(trimmed)) {
      continue;
    }

    if (/^(?:Standard Tuning|Tuning|Capo|Key of the song|Tempo|BPM|Strumming Pattern)\s*[:|-]/i.test(trimmed)) {
      continue;
    }
    if (/^[eEaAdDgGbB]\s*\|\s*[-0-9pbrh\/~|\s]+$/i.test(trimmed)) {
      continue;
    }

    if (/^(?:Home|Songs|Lyrics|Chords)\s*[>»/|]\s*/i.test(trimmed)) {
      continue;
    }

    if (/^[A-G][#b♭♯\sA-G]+$/i.test(trimmed) && trimmed.length > 15 && !trimmed.includes(' ')) {
      continue;
    }
    if (/^(?:[A-G][#b♭♯]?\s+){5,}[A-G][#b♭♯]?$/i.test(trimmed)) {
      continue;
    }

    if (TIME_SIG_REGEX.test(trimmed)) {
      if (!metadata.timeSignature) metadata.timeSignature = trimmed;
      continue;
    }

    if (validSongLinesFound === 0 && SINGLE_NOTE_REGEX.test(trimmed)) {
      if (!metadata.originalKey) metadata.originalKey = trimmed.toUpperCase();
      continue;
    }

    if (/^(?:Lyrics|Chords|Bible|Share|Related|Print|Transpose|Download|Guitar|Keyboard|Piano|Tamil|English|Hindi|Search|Menu|Home|About|Contact|Privacy|Terms|DMCA)$/i.test(trimmed)) {
      continue;
    }

    cleanLines.push(raw);
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
  let cleanTitle = removeEmojis((title || '').trim());
  let cleanArtist = removeEmojis((artist || '').trim());

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
 * Reads text from a Cheerio node while preserving block structure and newlines.
 */
function getNodeFormattedText($el, $) {
  if (!$el || $el.length === 0) return '';

  const $clone = $el.clone();
  $clone.find('br, hr').replaceWith('\n');

  $clone.find('p, div, li, tr, blockquote, section, article, h1, h2, h3, h4, h5, h6, pre').each((_, elem) => {
    $(elem).prepend('\n').append('\n');
  });

  return $clone.text();
}
