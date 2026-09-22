/**
 * Lyrical Dedicated URL Importer Service
 * Extracts clean song title, artist, original lyrics, and language from public URLs.
 * Pure text extraction with zero chord-parser dependency and zero automatic translation.
 */

import * as cheerio from 'cheerio';
import { fetchHtml } from '../../engine/importUrl/htmlFetcher.js';

// Boundary regex matching section delimiters that mark the end of the original lyrics
const BOUNDARY_CUTOFF_REGEX = /^(?:related(?:\s+(?:songs?|posts?|lyrics?))?|recent\s+posts?|popular\s+songs?|trending(?:\s+songs?)?|you\s+may\s+also\s+like|more\s+songs?|categories?|tags?|share(?:\s+this)?|comments?|leave\s+a\s+(?:comment|reply)|disclaimer|lyrics\s+in\s+english|english\s+lyrics|tanglish(?:\s+lyrics)?|romanized(?:\s+lyrics)?|transliterat(?:ion|ed)(?:\s+lyrics)?|song\s+meaning|english\s+meaning|meaning\s+of|translation|machine\s+translated|english\s+translation|blog\s+archive|about\s+me|followers|subscribe|explore|god\s+bless\s+you\s+all|தமிழ்|tamil|hindi|english|marathi|telugu|malayalam|வார்த்தைகள்|பொருள்|விளக்கம்|अर्थ|भावार्थ)[\s:.\-–—]*$/i;

// Header and metadata noise line regex to discard
const HEADER_NOISE_LINE_REGEX = /^(?:chords?|chord\s*sheet|lead\s*sheet|piano\s*notes?|lyrics?|tamil\s+lyrics?|hindi\s+lyrics?|english\s+lyrics?|marathi\s+lyrics?|telugu\s+lyrics?|malayalam\s+lyrics?|original\s+lyrics?|song\s+lyrics?|christian\s+song|worship\s+song|song\s*no\.?\s*\d*|track\s*no\.?\s*\d*|key\s*[:\-]\s*[A-G][b#]?m?|scale\s*[:\-]\s*[A-G][b#]?m?|tempo\s*[:\-]\s*\d+|bpm\s*[:\-]\s*\d+|strumming\s*[:\-]|beat\s*[:\-]|rhythm\s*[:\-]|capo\s*[:\-]|time\s+signature\s*[:\-]|\(?(?:chords?|lyrics?|lead\s*sheet)\)?|ppt|powerpoint|mp3\s+download|free\s+download)$/i;

// Noise tags and selectors to completely strip from DOM before extraction
const NOISE_TAGS_SELECTOR = [
  'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'button', 'input', 'select', 'textarea', 'form',
  'nav', 'header', 'footer', 'aside', '.navbar', '.site-header', '.site-footer', '.sidebar', '.widget', '.menu', '#menu', '.navigation', '.pagination',
  '.ad', '.ads', '.advertisement', '.adsbygoogle', '.banner', '.social', '.share', '.sharing', '.share-buttons', '.comments', '#comments', '.comment-respond', '.disclaimer', '.copyright',
  '.related', '.related-posts', '.related-songs', '.recent-posts', '.trending', '.popular-posts', '.tags', '.entry-tags', '.post-tags', '.post-categories', '.meta', '.post-meta',
  '.top-artists', '.languages-list', '.explore-section', '.sidebar-meta', '.video-credits', '.by-artist', '.singer', '.artist',
  '[style*="display:none"]', '[style*="display: none"]', '[hidden]', '.hidden', '.sr-only'
].join(', ');

/**
 * Validates URL format on the client before network dispatch.
 */
export function validateLyricalUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Please enter a webpage URL.' };
  }

  let trimmed = urlString.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a webpage URL.' };
  }

  // Reject unsupported protocols like ftp:, file:, javascript:, data:
  if (/^[a-z0-9+.-]+:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Only http:// and https:// URLs are supported.' };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are supported.' };
    }

    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname.toLowerCase())) {
      return { valid: false, error: 'Cannot import from local machine addresses.' };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Please enter a valid complete URL.' };
  }
}

/**
 * Detects language script from text (Tamil, Hindi, Marathi, English).
 */
export function detectLyricalLanguage(text = '', title = '', meta = '') {
  const combined = `${title} ${meta} ${text}`;

  // Tamil Unicode Range: \u0B80 - \u0BFF
  const tamilMatches = combined.match(/[\u0B80-\u0BFF]/g) || [];
  if (tamilMatches.length > 15) {
    return 'Tamil';
  }

  // Devanagari Unicode Range: \u0900 - \u097F
  const devanagariMatches = combined.match(/[\u0900-\u097F]/g) || [];
  if (devanagariMatches.length > 15) {
    // Check for Marathi-specific vocabulary/context
    if (/\b(?:marathi|मराठी)\b/i.test(combined) || /आम्ही|खायाला|पियाला|दिले|रायाला|मानतो|माफी|येशूला|झालो|आहे|गेले|पाहिले/.test(combined)) {
      return 'Marathi';
    }
    return 'Hindi';
  }

  // Telugu Unicode Range: \u0C00 - \u0C7F
  const teluguMatches = combined.match(/[\u0C00-\u0C7F]/g) || [];
  if (teluguMatches.length > 15) {
    return 'Telugu';
  }

  // Malayalam Unicode Range: \u0D00 - \u0D7F
  const malayalamMatches = combined.match(/[\u0D00-\u0D7F]/g) || [];
  if (malayalamMatches.length > 15) {
    return 'Malayalam';
  }

  return 'English';
}

/**
 * Cleans web titles by extracting clean song title and removing website branding/noise.
 */
export function extractCleanTitle(rawTitle = '', documentTitle = '', ogTitle = '') {
  let candidate = (ogTitle || rawTitle || documentTitle || '').trim();

  // Decode basic HTML entities
  candidate = candidate
    .replace(/<[^>]*>/g, '')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\|/g, '-')
    .trim();

  // If candidate contains an Indic script portion, extract and prioritize it
  const indicPartMatch = candidate.match(/([\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F][\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s,.-]+)/);
  if (indicPartMatch && indicPartMatch[1].trim().length > 3) {
    let cleanIndic = indicPartMatch[1]
      .replace(/Song No\s*\d+/i, '')
      .replace(/\s*[-–|:]?\s*(?:Lyrics|Chords|PPT).*$/i, '')
      .replace(/[\s,.:\-–—]+$/, '')
      .trim();
    if (cleanIndic.length > 3) {
      return cleanIndic;
    }
  }

  // Strip common website names & SEO suffixes
  candidate = candidate
    .replace(/\s*[-–]\s*(?:Tamil Christian Songs|ChristSquare|YESHU KE GEET|Mizpha\.com|Mizpha|Hymnary\.org|Christian Songs|Worship Lyrics|Worship).*$/gi, '')
    .replace(/\s*[-–|:]?\s*(?:Lyrics in Tamil and English|Lyrics in English|Song Lyrics|Marathi Lyrics|Tamil Lyrics|Hindi Lyrics|Lyrics|Chords PPT|Chords|PPT|Song No\s*\d+).*$/gi, '')
    .replace(/\s*\(?(?:Chords|Lyrics|Song Lyrics|Chord Chart|Song No\s*\d+)\)?$/gi, '')
    .trim();

  // Remove trailing "Song No 763", punctuation, etc.
  candidate = candidate
    .replace(/Song No\s*\d+/gi, '')
    .replace(/[\s,.:\-–—]+$/, '')
    .trim();

  return candidate || 'Imported Song';
}

/**
 * Extracts explicit artist/singer name from DOM or structured text.
 */
export function extractCleanArtist($, rawHtml = '') {
  // 1. Look for explicit "Composed and Sung by", "Sung by", "Singer:" in text
  const textContent = $('body').text();
  const sungByMatch = textContent.match(/(?:Composed\s+and\s+Sung\s+by|Sung\s+by|Singer|பாடகர்|பாடியவர்|गायक)\s*[:\-]?\s*([A-Za-z\u0B80-\u0BFF\u0900-\u097F\s.]{2,40})/i);
  if (sungByMatch && sungByMatch[1]) {
    let artist = sungByMatch[1].replace(/\r?\n.*/g, '').replace(/<[^>]*>/g, '').trim();
    if (artist && !/^(admin|tamil|hindi|english|lyrics|website|mizpha|youtube|video)/i.test(artist)) {
      return artist;
    }
  }

  // 2. Structured artist classes
  const singerEl = $('.singer, .artist, .by-artist, .song-artist, [itemprop="byArtist"]').first().text();
  if (singerEl) {
    let cleaned = singerEl.replace(/^(by|singer|artist|பாடகர்|கலைஞர்|गायक)[:\s-]*/i, '').trim();
    if (cleaned && cleaned.length < 50 && !/^(admin|tamil christian songs|mizpha|christsquare)/i.test(cleaned)) {
      return cleaned;
    }
  }

  // 3. Meta author tag (ignore generic site names)
  const metaAuthor = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');
  if (metaAuthor && metaAuthor.trim().length < 50) {
    let cleaned = metaAuthor.trim();
    if (!/^(admin|tamil christian songs|christsquare|mizpha|yeshu ke geet|wordpress)/i.test(cleaned)) {
      return cleaned;
    }
  }

  return '';
}

const NON_LYRIC_SECTION_REGEX = /(?:song\s+meaning|english\s+meaning|meaning\s+of|translation|machine\s+translated|english\s+translation|related\s+(?:songs|posts|lyrics)|recent\s+posts|trending\s+songs|top\s+artists|languages|you\s+may\s+also\s+like|explore|god\s+bless\s+you\s+all|share\s+this|comments|leave\s+a\s+(?:comment|reply)|blog\s+archive|about\s+me|followers|subscribe|disclaimer|பொருள்|விளக்கம்|अर्थ|भावार्थ)/i;

/**
 * Cleans extracted raw lyric lines by stripping attached chords, tags, and boundary headers.
 */
export function cleanExtractedLyricLines(rawText, detectedLang) {
  if (!rawText) return '';

  let cleaned = rawText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    // Remove bracketed chord progressions: e.g. [Dm-C-Bdim-Em], [Dm-C-Em](x3), [C], [Am7/G], [D E A]
    .replace(/\[\s*(?:[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?[\s\-–—/]*)+\](?:\s*\(x?\d+\))?/gi, '')
    // Remove standalone Intro/Outro chord lines
    .replace(/#?INTRO\s*:?[^\n]*/gi, '')
    .replace(/#?OUTRO\s*:?[^\n]*/gi, '')
    // Remove tags like #Hook, #Pre-Chorus, #Chorus, #Verse 1, etc.
    .replace(/#(?:Hook|Pre-Chorus|Chorus|Verse\s*\d*|Bridge|Outro|Intro)\s*/gi, '')
    // Clean malformed bracketed chords
    .replace(/\[+\s*[A-G][b#]?[a-z0-9]*\s*\[*\]*/g, '');

  const isIndic = ['Tamil', 'Hindi', 'Marathi', 'Telugu', 'Malayalam'].includes(detectedLang);

  if (isIndic) {
    // Strip chords attached to Indic characters (e.g. FஆராதிAப்பேன் -> ஆராதிப்பேன், C7Bbநல்லவரே -> நல்லவரே)
    cleaned = cleaned.replace(/(?:^|\s|[^\w#])(?:[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?)+(?=[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F])/gu, ' ');
    cleaned = cleaned.replace(/([\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F])(?:[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?)+(?=[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\s]|$)/gu, '$1');
  } else {
    // Strip chords attached to Latin capital words (e.g. F#mKaalam -> Kaalam, BmUyarangalil -> Uyarangalil, AIdhu -> Idhu)
    cleaned = cleaned.replace(/(?:^|\s)(?:[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?)+(?=[A-Z][a-z]{2,})/g, ' ');
  }

  cleaned = cleaned.trim();

  const lines = cleaned.split(/\r?\n/);
  const finalLines = [];
  let prevBlank = false;
  let firstLyricLine = null;

  const CHORD_ONLY_REGEX = /^(\s*[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?\s*)+$/i;

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) {
      if (!prevBlank && finalLines.length > 0) {
        finalLines.push('');
        prevBlank = true;
      }
      continue;
    }

    // 1. Boundary Cutoff Check: Stop if we hit a boundary after lyrics started
    if (finalLines.length > 0 && BOUNDARY_CUTOFF_REGEX.test(trimmed)) {
      break;
    }

    // 2. Header and metadata noise line check
    if (HEADER_NOISE_LINE_REGEX.test(trimmed)) {
      continue;
    }
    if (CHORD_ONLY_REGEX.test(trimmed) && !/[a-z]{3,}/i.test(trimmed)) {
      continue;
    }
    if (/^[:\-–—\s()x0-9]+$/.test(trimmed)) {
      continue;
    }

    // 3. For Indic languages: Filter out Roman transliteration lines & detect duplicate song block restart
    if (isIndic) {
      const hasIndic = /[\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F]/.test(trimmed);
      const isPureRoman = !hasIndic && /[a-zA-Z]/.test(trimmed);

      const nonBlankCount = finalLines.filter(l => l.trim().length > 0).length;
      if (nonBlankCount >= 4) {
        // Section 2 restart detection (opening line repeats)
        if (firstLyricLine && trimmed.replace(/[\s()0-9x\-–—]+/g, '') === firstLyricLine.replace(/[\s()0-9x\-–—]+/g, '')) {
          break;
        }
        // Transliteration section cutoff (pure Roman lines appear after full Indic block)
        if (isPureRoman && !/^(?:chorus|verse|bridge|outro|intro|\(\d+\))$/i.test(trimmed)) {
          break;
        }
      }

      // Skip interleaved Roman phonetic line in Indic song
      if (isPureRoman) {
        continue;
      }
    }

    if (!firstLyricLine) {
      firstLyricLine = trimmed;
    }

    finalLines.push(trimmed);
    prevBlank = false;
  }

  // Remove trailing blank lines
  while (finalLines.length > 0 && !finalLines[finalLines.length - 1].trim()) {
    finalLines.pop();
  }

  return finalLines.join('\n').trim();
}

/**
 * Extracts clean, pure-text original lyrics block from DOM using boundary segmentation and script matching.
 */
export function extractOriginalLyricsFromCheerio($, html = '') {
  // 1. Remove noise elements and explicit chord nodes (keeping tab panels intact)
  const root = $('body').length > 0 ? $('body') : $.root();
  const clone = root.clone();
  clone.find(NOISE_TAGS_SELECTOR).remove();
  clone.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();

  const pageTitle = $('title').text() || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const bodyText = clone.text();
  let detectedLang = detectLyricalLanguage(bodyText, pageTitle, ogTitle);

  const hasTamil = /[\u0B80-\u0BFF]/.test(bodyText);
  const hasHindi = /[\u0900-\u097F]/.test(bodyText);

  // Helper to extract clean text from a container with newline preservation
  function extractContainerText(el, lang) {
    const $el = $(el).clone();
    $el.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();
    $el.find('br').replaceWith('\n');
    $el.find('p, div, [class*="chords-line"], [class*="line"]').each((_, item) => {
      $(item).append('\n');
    });
    return cleanExtractedLyricLines($el.text(), lang);
  }

  // Strategy A: Check tab panels for native script tab first
  if (detectedLang === 'Tamil' && hasTamil) {
    const tamilTab = clone.find('#tab-tamil, .tab-tamil, [data-tab="tamil"], [data-lang="tamil"]').first();
    if (tamilTab.length > 0) {
      const tabText = extractContainerText(tamilTab, 'Tamil');
      if (tabText.length > 30) {
        return { lyrics: tabText, language: 'Tamil', confidence: 'HIGH' };
      }
    }
  }

  if ((detectedLang === 'Hindi' || detectedLang === 'Marathi') && hasHindi) {
    const hindiTab = clone.find('#tab-hindi, .tab-hindi, #tab-marathi, [data-tab="hindi"]').first();
    if (hindiTab.length > 0) {
      const tabText = extractContainerText(hindiTab, detectedLang);
      if (tabText.length > 30) {
        return { lyrics: tabText, language: detectedLang, confidence: 'HIGH' };
      }
    }
  }

  // Strategy A2: If no native tab, check for English/Transliterated tab panel
  const englishTab = clone.find('#tab-english, .tab-english, [data-tab="english"]').first();
  if (englishTab.length > 0) {
    const tabText = extractContainerText(englishTab, 'English');
    if (tabText.length > 30) {
      const isActuallyTamil = /[\u0B80-\u0BFF]/.test(tabText);
      const isActuallyHindi = /[\u0900-\u097F]/.test(tabText);
      const finalLang = isActuallyTamil ? 'Tamil' : (isActuallyHindi ? (detectedLang || 'Hindi') : 'English');
      return { lyrics: tabText, language: finalLang, confidence: 'HIGH' };
    }
  }

  // Strategy B: Main content containers
  const containerSelectors = [
    '.entry-content',
    '.post-body',
    '.post-content',
    '.chords-sheet-wrap',
    '.chord-sheet',
    '.song-lyrics',
    '.lyrics',
    '#lyrics',
    'article',
    'main',
    '.content'
  ];

  let mainContainer = null;
  for (const selector of containerSelectors) {
    const el = clone.find(selector).first();
    if (el.length > 0 && el.text().trim().length > 30) {
      mainContainer = el;
      break;
    }
  }

  if (!mainContainer) {
    mainContainer = clone;
  }

  const collectedBlocks = [];
  let isCuttingOff = false;

  function processNode(node) {
    if (isCuttingOff) return;

    const $node = $(node);
    const tagName = node.tagName ? node.tagName.toLowerCase() : '';
    const nodeText = $node.text().trim();

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'].includes(tagName) || ($node.is('p, div') && $node.find('strong, b').length > 0) || BOUNDARY_CUTOFF_REGEX.test(nodeText)) {
      if (collectedBlocks.length > 0 && (NON_LYRIC_SECTION_REGEX.test(nodeText) || BOUNDARY_CUTOFF_REGEX.test(nodeText))) {
        isCuttingOff = true;
        return;
      }
    }

    if (tagName === 'pre' || tagName === 'code') {
      const text = $node.text().trim();
      if (text) {
        if (collectedBlocks.length > 0 && BOUNDARY_CUTOFF_REGEX.test(text)) {
          isCuttingOff = true;
          return;
        }
        collectedBlocks.push(text);
      }
      return;
    }

    if (['p', 'div', 'li', 'blockquote', 'section', 'article', 'font', 'span'].includes(tagName)) {
      const children = $node.children('p, div, blockquote, pre, section');
      if (children.length > 0) {
        children.each((_, child) => processNode(child));
        return;
      }

      const nodeClone = $node.clone();
      nodeClone.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();
      nodeClone.find('br').replaceWith('\n');
      const text = nodeClone.text().trim();

      if (collectedBlocks.length > 0 && (BOUNDARY_CUTOFF_REGEX.test(text) || NON_LYRIC_SECTION_REGEX.test(text))) {
        isCuttingOff = true;
        return;
      }

      if (text) {
        if (detectedLang === 'Tamil' && hasTamil) {
          if (/[\u0B80-\u0BFF]/.test(text)) {
            collectedBlocks.push(text);
          }
        } else if ((detectedLang === 'Hindi' || detectedLang === 'Marathi') && hasHindi) {
          if (/[\u0900-\u097F]/.test(text)) {
            collectedBlocks.push(text);
          }
        } else if (detectedLang === 'Telugu') {
          if (/[\u0C00-\u0C7F]/.test(text)) {
            collectedBlocks.push(text);
          }
        } else if (detectedLang === 'Malayalam') {
          if (/[\u0D00-\u0D7F]/.test(text)) {
            collectedBlocks.push(text);
          }
        } else {
          if (!NON_LYRIC_SECTION_REGEX.test(text)) {
            collectedBlocks.push(text);
          }
        }
      }
    }
  }

  const children = mainContainer.children('p, div, li, pre, blockquote, section, article');
  if (children.length > 0) {
    children.each((_, child) => {
      processNode(child);
    });
  } else {
    const containerClone = mainContainer.clone();
    containerClone.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();
    containerClone.find('br').replaceWith('\n');
    const fullText = containerClone.text().trim();
    if (fullText) {
      collectedBlocks.push(fullText);
    }
  }

  let finalLyrics = cleanExtractedLyricLines(collectedBlocks.join('\n\n'), detectedLang);

  // Strategy C (Fallback): If native filtering produced < 20 chars (e.g. transliterated song on native page)
  if (!finalLyrics || finalLyrics.length < 20) {
    const fallbackBlocks = [];
    isCuttingOff = false;

    function fallbackProcessNode(node) {
      if (isCuttingOff) return;
      const $node = $(node);
      const tagName = node.tagName ? node.tagName.toLowerCase() : '';
      const nodeText = $node.text().trim();

      if (NON_LYRIC_SECTION_REGEX.test(nodeText) && (nodeText.length < 80 || ['h1', 'h2', 'h3', 'h4'].includes(tagName))) {
        isCuttingOff = true;
        return;
      }

      if (tagName === 'pre' || tagName === 'code') {
        const text = $node.text().trim();
        if (text) fallbackBlocks.push(text);
        return;
      }

      if (['p', 'div', 'li', 'blockquote', 'section'].includes(tagName)) {
        const subChildren = $node.children('p, div, blockquote, pre');
        if (subChildren.length > 0) {
          subChildren.each((_, child) => fallbackProcessNode(child));
          return;
        }

        const cloneNode = $node.clone();
        cloneNode.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();
        cloneNode.find('br').replaceWith('\n');
        const text = cloneNode.text().trim();
        if (text && !NON_LYRIC_SECTION_REGEX.test(text)) {
          fallbackBlocks.push(text);
        }
      }
    }

    const fallbackChildren = mainContainer.children('p, div, li, pre, blockquote, section');
    if (fallbackChildren.length > 0) {
      fallbackChildren.each((_, child) => fallbackProcessNode(child));
    } else {
      const containerClone = mainContainer.clone();
      containerClone.find('.chord-anchor, .chord-stack, .chord-name, .chord, [data-chord]').remove();
      containerClone.find('br').replaceWith('\n');
      const text = containerClone.text().trim();
      if (text) fallbackBlocks.push(text);
    }

    finalLyrics = cleanExtractedLyricLines(fallbackBlocks.join('\n\n'), 'English');
  }

  const isActuallyTamil = /[\u0B80-\u0BFF]/.test(finalLyrics);
  const isActuallyHindi = /[\u0900-\u097F]/.test(finalLyrics);
  if (!isActuallyTamil && !isActuallyHindi && detectedLang !== 'English') {
    detectedLang = 'English';
  }

  let confidence = 'LOW';
  if (finalLyrics.length > 100) {
    confidence = 'HIGH';
  } else if (finalLyrics.length > 30) {
    confidence = 'MEDIUM';
  }

  return {
    lyrics: finalLyrics,
    language: detectedLang,
    confidence
  };
}

/**
 * Resilient multi-tier HTML fetcher dedicated for Lyrical.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function fetchLyricalHtml(targetUrl) {
  // 1. First Tier: Local Dev Server / Backend Proxy
  if (typeof window !== 'undefined' && window.location) {
    try {
      const devProxyUrl = `/api/proxy-html?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetchWithTimeout(devProxyUrl, {}, 5000);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 50) {
          return { html: text, finalUrl: targetUrl };
        }
      }
    } catch {
      // Continue to next tier
    }
  }

  // 2. Second Tier: Direct Fetch
  try {
    const res = await fetchWithTimeout(targetUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Chordician/1.0'
      }
    }, 4000);

    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 50) {
        return { html: text, finalUrl: res.url || targetUrl };
      }
    }
  } catch {
    // Blocked by CORS, proceed to proxy race
  }

  // 3. Third Tier: Multi-Proxy Race
  const proxyCandidates = [
    async () => {
      const res = await fetchWithTimeout(`https://cors.eu.org/${targetUrl}`, {}, 7000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error('Empty body');
      return { html: text, finalUrl: targetUrl };
    },
    async () => {
      const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, {}, 7000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || !json.contents || json.contents.length < 50) throw new Error('Empty contents');
      return { html: json.contents, finalUrl: targetUrl };
    },
    async () => {
      const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, {}, 7000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error('Empty body');
      return { html: text, finalUrl: targetUrl };
    },
    async () => {
      const res = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, {}, 7000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 50) throw new Error('Empty body');
      return { html: text, finalUrl: targetUrl };
    }
  ];

  try {
    const result = await Promise.any(proxyCandidates.map((fn) => fn()));
    if (result && result.html) {
      return result;
    }
  } catch (proxyErr) {
    console.warn('[Lyrical HTML Fetcher] Proxy race failed:', proxyErr);
  }

  throw new Error('Unable to connect to this webpage. Please check the URL and internet connection, or enter the lyrics manually.');
}

/**
 * Imports and parses a song from a public webpage URL for Lyrical.
 * @param {string} urlString
 * @returns {Promise<{
 *   success: boolean,
 *   song?: {
 *     title: string,
 *     artist: string,
 *     originalLyrics: string,
 *     originalLanguage: string,
 *     isCommunion: boolean,
 *     sourceUrl: string,
 *     confidence: 'HIGH' | 'MEDIUM' | 'LOW'
 *   },
 *   error?: string
 * }>}
 */
export async function importLyricalSongFromUrl(urlString) {
  const validation = validateLyricalUrl(urlString);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const { html, finalUrl } = await fetchLyricalHtml(validation.url);

    if (!html || html.trim().length < 50) {
      return {
        success: false,
        error: 'The webpage returned empty content. Please verify the URL.'
      };
    }

    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const h1Title = $('h1').first().text() || '';
    const docTitle = $('title').text() || '';

    const extractedTitle = extractCleanTitle(h1Title, docTitle, ogTitle);
    const extractedArtist = extractCleanArtist($, html);
    const { lyrics, language, confidence } = extractOriginalLyricsFromCheerio($, html);

    if (!lyrics || lyrics.length < 20) {
      return {
        success: false,
        error: 'No readable song lyrics could be extracted from this webpage. Please enter or paste the lyrics directly.'
      };
    }

    // Communion Detection
    const isCommunion = /திருவிருந்து|கர்த்தருடைய பந்தி|Lord's Supper|Communion|प्रभु भोज/i.test(`${extractedTitle} ${lyrics}`);

    return {
      success: true,
      song: {
        title: extractedTitle || 'Imported Song',
        artist: extractedArtist || 'Unknown Artist',
        originalLyrics: lyrics,
        originalLanguage: language,
        isCommunion: Boolean(isCommunion),
        sourceUrl: finalUrl,
        confidence
      }
    };
  } catch (err) {
    console.error('[Lyrical URL Import Error]:', err);
    return {
      success: false,
      error: err.message || 'Unable to connect to this webpage. Please check the URL and internet connection, or enter the lyrics manually.'
    };
  }
}


