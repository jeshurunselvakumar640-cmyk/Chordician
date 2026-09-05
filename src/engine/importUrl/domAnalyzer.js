/**
 * DOM Analyzer for Cheerio-based Webpage Cleaning and Song Container Scoring.
 */

import * as cheerio from 'cheerio';
import { isChord, isChordLine } from '../core/chordDetector.js';
import { isLyricText, isSectionHeader } from '../core/lyricDetector.js';

/**
 * Strips strictly non-content noise elements, ads, navigation, and transpose buttons from the Cheerio DOM.
 * @param {cheerio.CheerioAPI} $
 */
export function cleanDom($) {
  $('br, hr').replaceWith('\n');

  $(
    'script:not([type="application/ld+json"]), style, noscript, iframe, svg, img, picture, ' +
    'audio, video, nav, footer, form, input, button, select, dialog, ' +
    '.ad, .ads, .advertisement, .cookie, .cookie-banner, .cookie-consent, ' +
    '.social-share, .comments-area, #comments, .sidebar, #sidebar, ' +
    '.breadcrumb, .breadcrumbs, .menu, .navigation, #wpadminbar, ' +
    '.transpose, .transpose-keys, .key-selector, .keys-list, .pitch-list, #transpose, ' +
    '.transpose-controls, .chord-switcher, .scale-list, .c-transpose, .transpose-bar, ' +
    '.key-changer, .chords-controls, .song-meta-box, .song-toolbar, .key-buttons, .scale-selector, ' +
    '.related-posts, .related-songs, .related-articles, .related_posts, .yarpp-related, ' +
    '.interactive-editor, .chordpro-editor, .account-menu, .user-favorites, .user-profile, ' +
    '.widget, .widget-area, .author-bio, .post-author, .post-navigation, .entry-meta, .meta-info'
  ).remove();

  formatInlineChordElements($);
}

/**
 * Converts inline HTML chord elements into standard bracketed notation [Chord]
 * @param {cheerio.CheerioAPI} $
 */
export function formatInlineChordElements($) {
  // Ruby tags
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
        $el.remove();
      }
    });
  }

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
 * Evaluates candidate song containers and selects the highest scoring content block.
 * @param {cheerio.CheerioAPI} $
 * @returns {string}
 */
export function findBestSongContainer($) {
  const candidateSelectors = [
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
        const score = scoreSongContainerText(text);

        if (score > bestScore) {
          bestScore = score;
          bestText = text;
        }
      }
    }
  }

  if (bestScore >= 10 && bestText.trim().length > 30) {
    return bestText;
  }

  return getNodeFormattedText($('body'), $);
}

/**
 * Scores a text block based on song features.
 * @param {string} text
 * @returns {number}
 */
export function scoreSongContainerText(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (trimmed.length < 20) return 0;

  let score = 0;
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length >= 4 && lines.length <= 150) {
    score += Math.min(lines.length * 2, 30);
  } else if (lines.length > 150) {
    score += 10;
  }

  let chordLines = 0;
  let bracketedCount = 0;
  let sectionCount = 0;
  let lyricCount = 0;

  for (const line of lines) {
    if (isChordLine(line)) chordLines++;
    if (/\[[A-G][#b]?[^\]\s]*\]/.test(line)) bracketedCount++;
    if (isSectionHeader(line)) sectionCount++;
    if (isLyricText(line) && line.length >= 8 && line.length <= 100) lyricCount++;
  }

  score += chordLines * 8;
  score += bracketedCount * 4;
  score += sectionCount * 10;
  score += Math.min(lyricCount, 25);

  if (/^(?:Cookie|Privacy|Terms|Copyright|All rights reserved|Menu|Navigation)\b/im.test(trimmed)) {
    score -= 15;
  }

  return score;
}

/**
 * Formats text from a Cheerio node while preserving block structure and line breaks.
 * @param {cheerio.Cheerio<any>} $el
 * @param {cheerio.CheerioAPI} $
 * @returns {string}
 */
export function getNodeFormattedText($el, $) {
  if (!$el || $el.length === 0) return '';

  const $clone = $el.clone();
  $clone.find('br, hr').replaceWith('\n');

  $clone.find('p, div, li, tr, blockquote, section, article, h1, h2, h3, h4, h5, h6, pre').each((_, elem) => {
    $(elem).prepend('\n').append('\n');
  });

  return $clone.text();
}
