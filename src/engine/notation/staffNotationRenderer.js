/**
 * Scalable Western Vocal Lead Sheet & Rhythm SVG Renderer for Chordician
 *
 * Renders complete 3-layer Western Vocal Lead Sheets:
 * Layer 1: Chord Symbols (above staff, e.g., C, G/B, Am7, F#m7b5)
 * Layer 2: Vocal Melody & Rhythm (whole, half, quarter, eighth, sixteenth notes,
 *          beams, dotted notes, ties, rests, accidentals, ledger lines on 5-line staff)
 * Layer 3: Lyrics (beneath staff with dynamic vertical clearance avoiding ledger lines)
 * + Optional Note Name labels (under noteheads)
 *
 * Fully matches the Chordician PDF Export visual identity and branding:
 * - Letterhead branding with Chordician 🎹 logo gradient, tagline & author
 * - Watermark "CHORDICIAN" centered at -32deg
 * - Song metadata card with Key, Style, Beat & Vocal Lead Sheet badges
 * - Section banners with dashed dividers
 * - Standalone, self-contained SVG & high-DPI Canvas PNG export
 *
 * Zero external npm dependencies. Pure JavaScript + SVG.
 */

import { extractLeadSheetSectionsFromSong } from './leadPitchParser.js';

// SVG Path definition for standard Treble G-Clef
const TREBLE_CLEF_PATH =
  'M 12.5 48 C 10.8 48 9.5 46.8 9.5 45.2 C 9.5 43.8 10.6 42.6 12 42.6 C 13.4 42.6 14.5 43.7 14.5 45.1 C 14.5 47.1 12.8 48 12.5 48 Z ' +
  'M 12.8 41.5 C 10.2 41.5 8 39.2 8 36.4 C 8 33.5 10.5 30.8 13.6 28.6 C 16.5 26.6 19.5 24 20.8 20.5 C 21.8 17.7 21.5 14.5 20.2 12.2 C 18.8 9.8 16.5 8.2 14.2 8.2 C 11.2 8.2 8.8 10.5 8.8 13.8 C 8.8 15.6 9.8 17.2 11.4 18 C 12.6 18.6 13.8 18.4 14.5 17.4 C 15.1 16.5 14.8 15.2 13.8 14.6 C 13.1 14.2 12.6 13.5 12.6 12.8 C 12.6 11.8 13.4 11 14.4 11 C 15.8 11 17.2 12.2 17.8 13.8 C 18.8 16.2 18.5 19.2 17.2 21.8 C 15.6 25 12.5 27.8 9.5 30.2 C 6 33 3.5 36.5 3.5 40.8 C 3.5 46.2 7.8 50.8 13.2 50.8 C 16.8 50.8 20.5 48.8 22.8 45.5 C 24.6 42.8 25.4 39.5 25.4 36.2 C 25.4 29.8 21.2 24.6 16.4 21.4 L 16.4 20.2 C 18.6 22 21 24.2 22.6 26.8 C 24.8 30.5 26 34.5 26 38.6 C 26 44.5 21.8 49.5 16 50.5 L 16 54.5 C 16 57 14.5 59 12 59 C 9.5 59 7.8 57.2 7.8 55 C 7.8 53.2 9.2 51.8 11 51.8 C 12.6 51.8 13.8 53 13.8 54.4 C 13.8 55.4 13.2 56.2 12.2 56.2 C 11.6 56.2 11.2 55.8 11.2 55.2 C 11.2 54.8 11.5 54.5 11.8 54.5 C 12.2 54.5 12.5 54.8 12.5 55.2 L 13.8 55.2 C 13.8 52.8 15.8 51.5 15.8 49.2 L 15.8 10.5 C 15.8 7.5 14.8 5 13.2 5 C 11.8 5 10.8 6.5 10.8 8.2 C 10.8 9.5 11.5 10.5 12.5 10.8 L 13.5 10.8 L 13.5 41.5 Z';

/**
 * Calculates the exact vertical pixel coordinate for a note on the staff.
 *
 * Staff configuration:
 * - Line 5 (Top line, F5): offset = 10 -> staffTopY
 * - Line 4 (D5): offset = 8 -> staffTopY + 10
 * - Line 3 (Middle line, B4): offset = 6 -> staffTopY + 20
 * - Line 2 (G4): offset = 4 -> staffTopY + 30
 * - Line 1 (Bottom line, E4): offset = 2 -> staffTopY + 40
 * - Middle C (C4): offset = 0 -> staffTopY + 50 (1 ledger line below)
 *
 * @param {number} diatonicOffset - diatonic steps relative to C4 (C4 = 0)
 * @param {number} staffTopY - Y coordinate of staff line 5
 * @param {number} lineSpacing - distance between staff lines (default 10)
 * @returns {number} note Y coordinate
 */
export function getNoteY(diatonicOffset, staffTopY, lineSpacing = 10) {
  const stepHeight = lineSpacing / 2; // 5px per diatonic step
  return staffTopY + (10 - diatonicOffset) * stepHeight;
}

/**
 * Generates SVG markup for a sharp (#) symbol at specific coordinates.
 */
function renderSharpGlyph(x, y, color = '#db2777') {
  return `
    <g class="notation-accidental sharp" transform="translate(${x - 12}, ${y - 8}) scale(0.85)" stroke="${color}">
      <line x1="4" y1="0" x2="4" y2="18" stroke-width="1.2" stroke-linecap="round" />
      <line x1="9" y1="0" x2="9" y2="18" stroke-width="1.2" stroke-linecap="round" />
      <line x1="1" y1="6" x2="12" y2="4" stroke-width="2.2" stroke-linecap="round" />
      <line x1="1" y1="12" x2="12" y2="10" stroke-width="2.2" stroke-linecap="round" />
    </g>
  `;
}

/**
 * Generates SVG markup for a flat (b) symbol at specific coordinates.
 */
function renderFlatGlyph(x, y, color = '#db2777') {
  return `
    <g class="notation-accidental flat" transform="translate(${x - 11}, ${y - 12}) scale(0.85)" stroke="${color}">
      <line x1="3" y1="0" x2="3" y2="18" stroke-width="1.3" stroke-linecap="round" />
      <path d="M 3 8 C 5 6 9 7 9 11 C 9 15 5 15.5 3 13" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  `;
}

/**
 * Generates SVG ledger lines for notes outside the 5-line staff.
 */
function renderLedgerLines(x, diatonicOffset, staffTopY, lineSpacing = 10, color = '#475569') {
  const ledgerLines = [];
  const halfWidth = 11;

  // Below staff: Line 1 is at offset 2 (E4). Middle C is offset 0.
  if (diatonicOffset <= 0) {
    const bottomNeeded = diatonicOffset % 2 === 0 ? diatonicOffset : diatonicOffset + 1;
    for (let offset = 0; offset >= bottomNeeded; offset -= 2) {
      const lineY = getNoteY(offset, staffTopY, lineSpacing);
      ledgerLines.push(
        `<line x1="${x - halfWidth}" y1="${lineY}" x2="${x + halfWidth}" y2="${lineY}" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />`
      );
    }
  }

  // Above staff: Line 5 is at offset 10 (F5).
  if (diatonicOffset >= 12) {
    const topNeeded = diatonicOffset % 2 === 0 ? diatonicOffset : diatonicOffset - 1;
    for (let offset = 12; offset <= topNeeded; offset += 2) {
      const lineY = getNoteY(offset, staffTopY, lineSpacing);
      ledgerLines.push(
        `<line x1="${x - halfWidth}" y1="${lineY}" x2="${x + halfWidth}" y2="${lineY}" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />`
      );
    }
  }

  return ledgerLines.join('\n');
}

/**
 * Generates SVG markup for authentic Western rests.
 */
function renderRestGlyph(x, duration, staffTopY, color = '#1e1b4b') {
  const lineSpacing = 10;
  switch (duration) {
    case 'whole':
      // Whole rest: hangs down from line 4 (staffTopY + 10)
      return `<g class="notation-rest whole-rest"><rect x="${x - 6}" y="${staffTopY + lineSpacing}" width="12" height="6" fill="${color}" /></g>`;
    case 'half':
      // Half rest: sits on line 3 (staffTopY + 20)
      return `<g class="notation-rest half-rest"><rect x="${x - 6}" y="${staffTopY + (2 * lineSpacing) - 6}" width="12" height="6" fill="${color}" /></g>`;
    case 'eighth':
      // Eighth rest: diagonal hook on middle lines
      return `<g class="notation-rest eighth-rest" stroke="${color}" fill="${color}" transform="translate(${x - 4}, ${staffTopY + 10})"><circle cx="2" cy="4" r="2.5" /><path d="M 2 4 Q 8 6 4 18" fill="none" stroke-width="1.8" stroke-linecap="round" /></g>`;
    case 'sixteenth':
      // Sixteenth rest: double hook
      return `<g class="notation-rest sixteenth-rest" stroke="${color}" fill="${color}" transform="translate(${x - 4}, ${staffTopY + 8})"><circle cx="2" cy="4" r="2" /><circle cx="2" cy="10" r="2" /><path d="M 2 4 Q 8 6 3 20" fill="none" stroke-width="1.8" stroke-linecap="round" /><path d="M 2 10 Q 8 12 3 20" fill="none" stroke-width="1.6" stroke-linecap="round" /></g>`;
    case 'quarter':
    default:
      // Quarter rest: classic squiggly lightning path
      return `<g class="notation-rest quarter-rest"><path d="M ${x - 3} ${staffTopY + 8} L ${x + 4} ${staffTopY + 15} L ${x - 4} ${staffTopY + 22} Q ${x + 5} ${staffTopY + 26} ${x - 2} ${staffTopY + 34} Q ${x - 6} ${staffTopY + 31} ${x - 1} ${staffTopY + 27} Z" fill="${color}" /></g>`;
  }
}

/**
 * Estimates the rendered pixel width of a text string at a given font size.
 * Handles Tamil/Indic script characters, uppercase/lowercase Latin, numbers, and punctuation.
 */
export function estimateTextWidth(text, fontSize = 13) {
  if (!text) return 0;
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x0900 && code <= 0x0D7F) || code > 0x2000) {
      width += fontSize * 0.88;
    } else if (/[A-Z]/.test(text[i])) {
      width += fontSize * 0.68;
    } else if (/[ilj|!:,.'`]/.test(text[i])) {
      width += fontSize * 0.35;
    } else {
      width += fontSize * 0.58;
    }
  }
  return Math.max(10, width);
}

/**
 * Tokenizes a lyrics string into clean syllable/word tokens.
 * Handles hyphenated syllables (e.g. "Je - sus en - na - me" -> ["Je-", "sus", "en-", "na-", "me"]).
 */
export function parseLyricTokens(lyricsStr) {
  if (!lyricsStr || typeof lyricsStr !== 'string') return [];
  const rawTokens = lyricsStr.trim().split(/\s+/).filter(Boolean);
  const result = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i];
    if (tok === '-' || tok === '—' || tok === '–') {
      if (result.length > 0 && !result[result.length - 1].endsWith('-')) {
        result[result.length - 1] += '-';
      }
    } else {
      result.push(tok);
    }
  }
  return result;
}

/**
 * Calculates the lowest Y coordinate for any note/ledger line/stem in a system.
 * Guarantees lyrics are positioned strictly below all notation with safe vertical clearance.
 */
function calculateLowestNotationY(systemItems, staffTopY, lineSpacing = 10, showNoteNames = true) {
  let lowestY = staffTopY + 40; // Default bottom line of staff (E4)

  systemItems.forEach((item) => {
    if (item.type === 'note') {
      const noteY = getNoteY(item.diatonicOffset, staffTopY, lineSpacing);
      const stemPointsUp = item.diatonicOffset < 6;
      const stemLength = 28;

      // Notehead bottom
      lowestY = Math.max(lowestY, noteY + 5);

      // Down stem bottom
      if (!stemPointsUp && item.duration !== 'whole') {
        lowestY = Math.max(lowestY, noteY + stemLength);
      }

      // Ledger lines bottom
      if (item.diatonicOffset <= 0) {
        const bottomLedgerOffset = item.diatonicOffset % 2 === 0 ? item.diatonicOffset : item.diatonicOffset + 1;
        const lowestLedgerY = getNoteY(bottomLedgerOffset, staffTopY, lineSpacing);
        lowestY = Math.max(lowestY, lowestLedgerY + 6);
      }
    } else if (item.type === 'rest') {
      lowestY = Math.max(lowestY, staffTopY + 36);
    }
  });

  if (showNoteNames) {
    lowestY += 16;
  }

  return lowestY;
}

/**
 * Renders a full Vocal Lead Sheet (Chords + Rhythmic Staff Melody + Lyrics) for a song
 * into a standalone, branded SVG string matching the Chordician PDF export template.
 *
 * @param {Object} song - Chordician song object
 * @param {Object} [options={}] - Rendering options
 * @param {boolean} [options.showNoteNames=true] - Display note labels under noteheads
 * @param {number} [options.width=800] - Canvas width in px (standard A4 printable aspect)
 * @returns {{ svg: string, width: number, height: number, sectionCount: number, noteCount: number }}
 */
export function renderSongNotationToSVG(song, options = {}) {
  const {
    showNoteNames = true,
    width = 800
  } = options;

  const sections = extractLeadSheetSectionsFromSong(song);
  const songTitle = (song && song.title) ? String(song.title).trim() : 'Vocal Lead Sheet';
  const songKey = (song && (song.activeKey || song.key || song.originalKey)) ? String(song.activeKey || song.key || song.originalKey).trim() : 'C';
  const songArtist = (song && song.artist) ? String(song.artist).trim() : '';
  const songSubtitle = (song && song.secondaryTitle) ? String(song.secondaryTitle).trim() : '';
  const timeSignature = (song && song.timeSignature) ? String(song.timeSignature).trim() : '4/4';
  const tempo = (song && song.tempo) ? String(song.tempo).trim() : '';
  const styleName = (song && (typeof song.style === 'string' ? song.style : song.style?.name)) || '';

  // Calculate total note count
  let totalNotes = 0;
  for (const sec of sections) {
    for (const it of sec.items) {
      if (it.type === 'note') totalNotes += 1;
    }
  }

  // PDF Export Layout Design Constants
  const paddingX = 38;
  const lineSpacing = 10;
  const staffHeight = 4 * lineSpacing; // 40px
  const baseNoteSpacing = 42;
  const availableWidth = width - (paddingX * 2);
  const clefWidth = 44;
  const usableWidth = availableWidth - clefWidth;

  // Exact PDF Export Design Colors
  const bgColor = '#ffffff';
  const titleColor = '#0f172a';
  const textMuted = '#64748b';
  const chordColor = '#4f46e5';
  const lyricsColor = '#1e293b';
  const staffLineColor = '#475569';
  const noteColor = '#4f46e5';
  const accidentalColor = '#db2777';
  const sectionTitleColor = '#4338ca';

  let currentY = 34;
  const svgElements = [];

  // Gradient Definition for Brand Logo
  svgElements.push(`
    <defs>
      <linearGradient id="chordicianLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4f46e5" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
    </defs>
  `);

  // 1. Watermark: "CHORDICIAN" centered rotated -32deg
  svgElements.push(`
    <g class="pdf-watermark" pointer-events="none" user-select="none">
      <text x="${width / 2}" y="500" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="84" font-weight="900" fill="rgba(99, 102, 241, 0.04)" letter-spacing="0.16em" transform="rotate(-32 ${width / 2} 500)">CHORDICIAN</text>
    </g>
  `);

  // 2. Header Letterhead with Chordician Logo & Branding (Identical to PDF export)
  svgElements.push(`
    <g class="header-letterhead">
      <!-- Logo Box -->
      <rect x="${paddingX}" y="${currentY}" width="26" height="26" rx="6" fill="url(#chordicianLogoGrad)" />
      <text x="${paddingX + 13}" y="${currentY + 18}" text-anchor="middle" font-size="14" font-family="sans-serif">🎹</text>
      
      <!-- Brand Title & Tagline -->
      <text x="${paddingX + 34}" y="${currentY + 13}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#1e1b4b" letter-spacing="-0.02em">Chordician</text>
      <text x="${paddingX + 34}" y="${currentY + 24}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="600" fill="#6366f1" letter-spacing="0.03em">EVERY CHORD, FOR HIM.</text>
      
      <!-- Right Side Author & URL -->
      <text x="${width - paddingX}" y="${currentY + 13}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="600" fill="#64748b">
        built by <tspan fill="#4f46e5" font-weight="700">jeshurun</tspan>
      </text>
      <text x="${width - paddingX}" y="${currentY + 24}" text-anchor="end" font-family="monospace, Consolas, Courier" font-size="9" fill="#64748b">chordician.vercel.app</text>
      
      <!-- Letterhead Bottom Border -->
      <line x1="${paddingX}" y1="${currentY + 34}" x2="${width - paddingX}" y2="${currentY + 34}" stroke="#4f46e5" stroke-width="2" />
    </g>
  `);

  currentY += 46;

  // 3. Song Title & Metadata Banner Card
  const cardY = currentY;
  const cardPadding = 16;

  let metaCardContentY = cardY + 24;

  const cardSvg = [];
  cardSvg.push(`
    <!-- Title and Artist -->
    <text x="${paddingX + cardPadding}" y="${metaCardContentY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Tamil', sans-serif" font-size="22" font-weight="800" fill="${titleColor}" letter-spacing="-0.02em">
      ${escapeXml(songTitle)}
    </text>
  `);

  if (songArtist || songSubtitle) {
    const subtitleText = songArtist ? `Artist: ${songArtist}` : songSubtitle;
    cardSvg.push(`
      <text x="${width - paddingX - cardPadding}" y="${metaCardContentY}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="${textMuted}">
        ${escapeXml(subtitleText)}
      </text>
    `);
  }

  metaCardContentY += 18;

  // Metadata Badges Row (Scale / Key, Beat, Style, Vocal Lead Sheet)
  let badgeCursorX = paddingX + cardPadding;
  const badgeY = metaCardContentY;
  const badgeHeight = 22;

  // Scale Badge
  const scaleBadgeWidth = 80;
  cardSvg.push(`
    <rect x="${badgeCursorX}" y="${badgeY}" width="${scaleBadgeWidth}" height="${badgeHeight}" rx="6" fill="#e0e7ff" />
    <text x="${badgeCursorX + scaleBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#4338ca">Scale: <tspan font-weight="800">${escapeXml(songKey)}</tspan></text>
  `);
  badgeCursorX += scaleBadgeWidth + 8;

  // Beat Badge
  const beatBadgeWidth = 72;
  cardSvg.push(`
    <rect x="${badgeCursorX}" y="${badgeY}" width="${beatBadgeWidth}" height="${badgeHeight}" rx="6" fill="#f1f5f9" />
    <text x="${badgeCursorX + beatBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#334155">Beat: <tspan font-weight="800">${escapeXml(timeSignature)}</tspan></text>
  `);
  badgeCursorX += beatBadgeWidth + 8;

  // Style Badge (if available)
  if (styleName) {
    const styleBadgeWidth = Math.min(130, 50 + styleName.length * 6.5);
    cardSvg.push(`
      <rect x="${badgeCursorX}" y="${badgeY}" width="${styleBadgeWidth}" height="${badgeHeight}" rx="6" fill="#f3e8ff" />
      <text x="${badgeCursorX + styleBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#7e22ce">Style: <tspan font-weight="800">${escapeXml(styleName)}</tspan></text>
    `);
    badgeCursorX += styleBadgeWidth + 8;
  }

  // Tempo Badge (if available)
  if (tempo) {
    const tempoBadgeWidth = 84;
    cardSvg.push(`
      <rect x="${badgeCursorX}" y="${badgeY}" width="${tempoBadgeWidth}" height="${badgeHeight}" rx="6" fill="#fef3c7" />
      <text x="${badgeCursorX + tempoBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#b45309">Tempo: <tspan font-weight="800">${escapeXml(tempo)}</tspan></text>
    `);
    badgeCursorX += tempoBadgeWidth + 8;
  }

  // Vocal Lead Sheet Badge
  const notationBadgeWidth = 140;
  cardSvg.push(`
    <rect x="${badgeCursorX}" y="${badgeY}" width="${notationBadgeWidth}" height="${badgeHeight}" rx="6" fill="#ecfdf5" />
    <text x="${badgeCursorX + notationBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#047857">Vocal Lead Sheet (${totalNotes} Notes)</text>
  `);

  const cardHeight = (badgeY + badgeHeight + 14) - cardY;

  svgElements.push(`
    <g class="meta-card">
      <rect x="${paddingX}" y="${cardY}" width="${availableWidth}" height="${cardHeight}" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      ${cardSvg.join('\n')}
    </g>
  `);

  currentY += cardHeight + 20;

  // 4. Sectional 3-Layer Vocal Lead Sheet (Chords + Rhythmic Staff Melody + Lyrics)
  if (sections.length === 0) {
    svgElements.push(`
      <g class="notation-empty" transform="translate(0, ${currentY + 40})">
        <text x="${width / 2}" y="0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="${textMuted}">
          No Lead Notes available for this song.
        </text>
      </g>
    `);
    currentY += 100;
  } else {
    sections.forEach((section, sIdx) => {
      // Section Header (Matching PDF section styling: 12px bold #4338ca uppercase with dashed border)
      svgElements.push(`
        <g class="section-header" transform="translate(${paddingX}, ${currentY})">
          <text x="0" y="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="${sectionTitleColor}" letter-spacing="0.06em">
            ${escapeXml(section.name.toUpperCase())}
          </text>
          <line x1="0" y1="20" x2="${availableWidth}" y2="20" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 3" />
        </g>
      `);

      currentY += 34;

      const phrases = section.phrases || [];

      phrases.forEach((phrase, pIdx) => {
        const phraseItems = phrase.items || [];
        if (phraseItems.length === 0) return;

        // Wrap phrase items into readable systems (measures)
        // Standard 6 to 8 notes per system, or at barlines when system has at least 4 notes
        const maxNotesPerSystem = 7;
        const systems = [];
        let currentSystem = [];
        let currentNoteCountInSystem = 0;

        phraseItems.forEach((item) => {
          currentSystem.push(item);
          if (item.type === 'note') {
            currentNoteCountInSystem += 1;
          }
          if (
            (item.type === 'barline' && currentNoteCountInSystem >= 4) ||
            currentNoteCountInSystem >= maxNotesPerSystem
          ) {
            systems.push(currentSystem);
            currentSystem = [];
            currentNoteCountInSystem = 0;
          }
        });
        if (currentSystem.length > 0) {
          systems.push(currentSystem);
        }

        const phraseLyricTokens = parseLyricTokens(phrase.lyrics);
        let phraseLyricCursor = 0;
        const phraseChords = phrase.chords || [];

        systems.forEach((systemItems, sysIdx) => {
          const hasChordsInPhrase = phraseChords.length > 0 || Boolean(phrase.rawChords);
          const topChordOffset = hasChordsInPhrase ? 26 : 14;
          const staffTopY = currentY + topChordOffset;
          const startX = paddingX;
          const endX = width - paddingX;

          svgElements.push(`<g class="vocal-lead-system" id="sec_${sIdx}_p_${pIdx}_sys_${sysIdx}">`);

          // 5 Staff Lines
          for (let lineIdx = 0; lineIdx < 5; lineIdx++) {
            const lineY = staffTopY + (lineIdx * lineSpacing);
            svgElements.push(
              `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${staffLineColor}" stroke-width="1.3" />`
            );
          }

          // Start & End System Barlines
          svgElements.push(
            `<line x1="${startX}" y1="${staffTopY}" x2="${startX}" y2="${staffTopY + staffHeight}" stroke="${staffLineColor}" stroke-width="2" />`,
            `<line x1="${endX}" y1="${staffTopY}" x2="${endX}" y2="${staffTopY + staffHeight}" stroke="${staffLineColor}" stroke-width="2" />`
          );

          // Treble Clef Symbol
          svgElements.push(`
            <g class="treble-clef" fill="#1e1b4b" transform="translate(${startX + 8}, ${staffTopY - 14}) scale(1.1)">
              <path d="${TREBLE_CLEF_PATH}" />
            </g>
          `);

          // Calculate horizontal note positions proportionally according to rhythmic duration
          const noteItems = systemItems.filter(it => it.type === 'note');
          const totalRenderItems = systemItems.filter(it => it.type === 'note' || it.type === 'barline' || it.type === 'rest');
          const availableSysWidth = usableWidth - 30;

          // Distribute note spacing with rhythmic awareness and breathing room
          const dynamicSpacing = totalRenderItems.length > 1
            ? Math.max(48, Math.min(88, availableSysWidth / Math.max(1, totalRenderItems.length)))
            : 70;

          let noteCursorX = startX + clefWidth + 14;
          const noteRenderData = [];

          systemItems.forEach((item) => {
            if (item.type === 'barline') {
              noteRenderData.push({ item, x: noteCursorX });
              noteCursorX += 18;
            } else if (item.type === 'rest') {
              noteRenderData.push({ item, x: noteCursorX });
              noteCursorX += dynamicSpacing;
            } else if (item.type === 'note') {
              const noteY = getNoteY(item.diatonicOffset, staffTopY, lineSpacing);
              const stemPointsUp = item.diatonicOffset < 6;
              const stemLength = 28;
              const stemX = stemPointsUp ? noteCursorX + 5.2 : noteCursorX - 5.2;
              const stemTipY = stemPointsUp ? noteY - stemLength : noteY + stemLength;

              noteRenderData.push({
                item,
                x: noteCursorX,
                y: noteY,
                stemPointsUp,
                stemX,
                stemTipY
              });

              // Rhythmic duration expansion (whole notes get extra space, 16th gets compact)
              const durationMultiplier = item.duration === 'whole' ? 1.4 : (item.duration === 'half' ? 1.2 : (item.duration === 'sixteenth' ? 0.9 : 1.0));
              noteCursorX += dynamicSpacing * durationMultiplier;
            }
          });

          // --- LAYER 1: CHORD SYMBOLS (Above Staff) ---
          if (hasChordsInPhrase && noteRenderData.some(d => d.item.type === 'note')) {
            const chordY = staffTopY - 10;
            const chordsToRender = [];
            const renderedNotesOnly = noteRenderData.filter(d => d.item.type === 'note');

            if (phraseChords.length > 0) {
              phraseChords.forEach((cObj, cIdx) => {
                const chordText = cObj.chord || '';
                if (!chordText) return;
                let targetNoteIdx = 0;
                if (phraseChords.length === 1) {
                  targetNoteIdx = 0;
                } else if (cObj.position !== undefined && phrase.rawLead && phrase.rawLead.length > 0) {
                  const ratio = Math.max(0, Math.min(1, cObj.position / Math.max(1, phrase.rawLead.length)));
                  targetNoteIdx = Math.min(renderedNotesOnly.length - 1, Math.floor(ratio * renderedNotesOnly.length));
                } else {
                  targetNoteIdx = Math.min(renderedNotesOnly.length - 1, Math.floor((cIdx / phraseChords.length) * renderedNotesOnly.length));
                }
                const chordX = renderedNotesOnly[targetNoteIdx] ? renderedNotesOnly[targetNoteIdx].x : startX + clefWidth + 14;
                chordsToRender.push({ text: chordText, x: chordX });
              });
            } else if (phrase.rawChords) {
              const chordsList = phrase.rawChords.split(/\s+/).filter(Boolean);
              chordsList.forEach((chordText, cIdx) => {
                const targetNoteIdx = Math.min(renderedNotesOnly.length - 1, Math.floor((cIdx / Math.max(1, chordsList.length)) * renderedNotesOnly.length));
                const chordX = renderedNotesOnly[targetNoteIdx] ? renderedNotesOnly[targetNoteIdx].x : startX + clefWidth + 14;
                chordsToRender.push({ text: chordText, x: chordX });
              });
            }

            chordsToRender.forEach(({ text, x }) => {
              svgElements.push(`
                <text x="${x}" y="${chordY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="${chordColor}">
                  ${escapeXml(text)}
                </text>
              `);
            });
          }

          // --- BEAMING ENGINE FOR 8TH & 16TH NOTES ---
          // Identify groups of consecutive eighth / sixteenth notes to beam together
          const beamGroups = [];
          let currentBeamGroup = [];

          noteRenderData.forEach((data) => {
            if (data.item.type === 'note' && (data.item.duration === 'eighth' || data.item.duration === 'sixteenth')) {
              // Add to current beam group if stem directions match (or first note in group)
              if (currentBeamGroup.length === 0 || currentBeamGroup[0].stemPointsUp === data.stemPointsUp) {
                currentBeamGroup.push(data);
                // Group up to 2 or 4 notes (standard beat grouping)
                if (currentBeamGroup.length >= 4) {
                  beamGroups.push([...currentBeamGroup]);
                  currentBeamGroup = [];
                }
              } else {
                if (currentBeamGroup.length >= 2) beamGroups.push([...currentBeamGroup]);
                currentBeamGroup = [data];
              }
            } else {
              // Barline or rest stops beaming
              if (currentBeamGroup.length >= 2) {
                beamGroups.push([...currentBeamGroup]);
              }
              currentBeamGroup = [];
            }
          });
          if (currentBeamGroup.length >= 2) {
            beamGroups.push([...currentBeamGroup]);
          }

          // Render Beam Bars for groups
          const beamedNoteSet = new Set();
          beamGroups.forEach((group) => {
            if (group.length < 2) return;
            group.forEach(d => beamedNoteSet.add(d));

            const first = group[0];
            const last = group[group.length - 1];
            const beamThickness = 3.6;

            // Primary Beam
            svgElements.push(`
              <line x1="${first.stemX}" y1="${first.stemTipY}" x2="${last.stemX}" y2="${last.stemTipY}" stroke="${noteColor}" stroke-width="${beamThickness}" stroke-linecap="round" />
            `);

            // Secondary Beam for Sixteenth notes
            const isSixteenthGroup = group.some(d => d.item.duration === 'sixteenth');
            if (isSixteenthGroup) {
              const secOffset = first.stemPointsUp ? 4.5 : -4.5;
              svgElements.push(`
                <line x1="${first.stemX}" y1="${first.stemTipY + secOffset}" x2="${last.stemX}" y2="${last.stemTipY + secOffset}" stroke="${noteColor}" stroke-width="2.6" stroke-linecap="round" />
              `);
            }
          });

          // --- LAYER 2: VOCAL MELODY & RHYTHM NOTATION ---
          let noteIdxInSystem = 0;
          const renderedNotesOnly = noteRenderData.filter(d => d.item.type === 'note');

          noteRenderData.forEach((data, dIdx) => {
            const { item, x } = data;

            if (item.type === 'barline') {
              svgElements.push(
                `<line x1="${x}" y1="${staffTopY}" x2="${x}" y2="${staffTopY + staffHeight}" stroke="#1e1b4b" stroke-width="1.8" />`
              );
              return;
            }

            if (item.type === 'rest') {
              svgElements.push(renderRestGlyph(x, item.duration || 'quarter', staffTopY, '#1e1b4b'));
              if (item.dotted) {
                svgElements.push(`<circle cx="${x + 8}" cy="${staffTopY + 20}" r="2.2" fill="#1e1b4b" />`);
              }
              return;
            }

            if (item.type === 'note') {
              const { y: noteY, stemPointsUp, stemX, stemTipY } = data;
              const isBeamed = beamedNoteSet.has(data);

              // 1. Ledger lines
              const ledgerLinesSvg = renderLedgerLines(x, item.diatonicOffset, staffTopY, lineSpacing, staffLineColor);
              if (ledgerLinesSvg) {
                svgElements.push(`<g class="ledger-lines">${ledgerLinesSvg}</g>`);
              }

              // 2. Accidental Glyph (# or b)
              if (item.accidental === '#') {
                svgElements.push(renderSharpGlyph(x, noteY, accidentalColor));
              } else if (item.accidental === 'b') {
                svgElements.push(renderFlatGlyph(x, noteY, accidentalColor));
              }

              // 3. Notehead (Whole & Half notes have open hollow noteheads; Quarter/8th/16th are filled)
              const isOpenNotehead = item.duration === 'whole' || item.duration === 'half';
              if (isOpenNotehead) {
                svgElements.push(
                  `<ellipse cx="${x}" cy="${noteY}" rx="6.0" ry="4.3" transform="rotate(-25 ${x} ${noteY})" fill="none" stroke="${noteColor}" stroke-width="2.2" />`
                );
              } else {
                svgElements.push(
                  `<ellipse cx="${x}" cy="${noteY}" rx="5.8" ry="4.2" transform="rotate(-25 ${x} ${noteY})" fill="${noteColor}" />`
                );
              }

              // 4. Stem (Rendered for half, quarter, eighth, sixteenth; omitted for whole note)
              if (item.duration !== 'whole') {
                svgElements.push(
                  `<line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${stemTipY}" stroke="${noteColor}" stroke-width="1.5" stroke-linecap="round" />`
                );

                // Unbeamed Eighth / Sixteenth single flag
                if (!isBeamed) {
                  if (item.duration === 'eighth') {
                    if (stemPointsUp) {
                      svgElements.push(`<path d="M ${stemX} ${stemTipY} Q ${stemX + 8} ${stemTipY + 8} ${stemX + 4} ${stemTipY + 16}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`);
                    } else {
                      svgElements.push(`<path d="M ${stemX} ${stemTipY} Q ${stemX + 8} ${stemTipY - 8} ${stemX + 4} ${stemTipY - 16}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`);
                    }
                  } else if (item.duration === 'sixteenth') {
                    if (stemPointsUp) {
                      svgElements.push(
                        `<path d="M ${stemX} ${stemTipY} Q ${stemX + 8} ${stemTipY + 6} ${stemX + 4} ${stemTipY + 12}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`,
                        `<path d="M ${stemX} ${stemTipY + 6} Q ${stemX + 8} ${stemTipY + 12} ${stemX + 4} ${stemTipY + 18}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`
                      );
                    } else {
                      svgElements.push(
                        `<path d="M ${stemX} ${stemTipY} Q ${stemX + 8} ${stemTipY - 6} ${stemX + 4} ${stemTipY - 12}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`,
                        `<path d="M ${stemX} ${stemTipY - 6} Q ${stemX + 8} ${stemTipY - 12} ${stemX + 4} ${stemTipY - 18}" fill="none" stroke="${noteColor}" stroke-width="1.8" stroke-linecap="round" />`
                      );
                    }
                  }
                }
              }

              // 5. Augmentation Dot (Dotted notes)
              if (item.dotted) {
                // If note is on a line (even offset), shift dot up into space
                const dotYOffset = item.diatonicOffset % 2 === 0 ? -2.5 : 0;
                svgElements.push(
                  `<circle cx="${x + 9}" cy="${noteY + dotYOffset}" r="2.2" fill="${noteColor}" />`
                );
              }

              // 6. Ties (Curved connecting arc between identical pitches)
              if (item.tieStart && dIdx < noteRenderData.length - 1) {
                // Find next note in render data
                const nextNote = noteRenderData.slice(dIdx + 1).find(d => d.item.type === 'note');
                if (nextNote && nextNote.item.scientificPitch === item.scientificPitch) {
                  const tieArcOffset = stemPointsUp ? 10 : -10;
                  const tieY = noteY + (stemPointsUp ? 6 : -6);
                  const midX = (x + nextNote.x) / 2;
                  svgElements.push(`
                    <path d="M ${x + 4} ${tieY} Q ${midX} ${tieY + tieArcOffset} ${nextNote.x - 4} ${tieY}" fill="none" stroke="${noteColor}" stroke-width="1.6" stroke-linecap="round" />
                  `);
                }
              }

              // 7. Optional Note Name Label (e.g. C4, F#3)
              if (showNoteNames) {
                const labelY = staffTopY + staffHeight + 20;
                svgElements.push(`
                  <text x="${x}" y="${labelY}" text-anchor="middle" font-family="ui-monospace, Consolas, Menlo, monospace" font-size="10.5" font-weight="600" fill="${textMuted}">
                    ${escapeXml(item.scientificPitch || item.displayNote)}
                  </text>
                `);
              }

              noteIdxInSystem += 1;
            }
          });

          // --- LAYER 3: LYRICS WITH DYNAMIC VERTICAL CLEARANCE & COLLISION RESOLVER ---
          const lowestNotationY = calculateLowestNotationY(systemItems, staffTopY, lineSpacing, showNoteNames);
          const safeLyricsY = lowestNotationY + 20; // 20px clear margin ensuring 0 collision with ledger lines

          // Get the slice of lyric tokens corresponding to this system's notes
          const systemLyricTokens = phraseLyricTokens.slice(
            phraseLyricCursor,
            phraseLyricCursor + renderedNotesOnly.length
          );
          phraseLyricCursor += systemLyricTokens.length;

          // Build lyric positions targeted at note centers
          const lyricPositions = [];
          systemLyricTokens.forEach((word, nIdx) => {
            if (!word || nIdx >= renderedNotesOnly.length) return;
            const targetX = renderedNotesOnly[nIdx].x;
            const wordWidth = estimateTextWidth(word, 13);
            lyricPositions.push({
              word,
              x: targetX,
              width: wordWidth,
              noteX: targetX
            });
          });

          // Forward pass: ensure minimum whitespace gap between consecutive lyric words (no overlap)
          const minWordGap = 8;
          for (let i = 1; i < lyricPositions.length; i++) {
            const prev = lyricPositions[i - 1];
            const curr = lyricPositions[i];
            const minAllowedX = prev.x + (prev.width / 2) + (curr.width / 2) + minWordGap;
            if (curr.x < minAllowedX) {
              curr.x = minAllowedX;
            }
          }

          // Backward pass: ensure lyrics don't overflow right system boundary
          const maxRightX = width - paddingX - 12;
          if (lyricPositions.length > 0) {
            const last = lyricPositions[lyricPositions.length - 1];
            if (last.x + (last.width / 2) > maxRightX) {
              const shift = (last.x + (last.width / 2)) - maxRightX;
              for (let i = lyricPositions.length - 1; i >= 0; i--) {
                lyricPositions[i].x -= shift;
                if (i > 0) {
                  const prev = lyricPositions[i - 1];
                  const maxPrevX = lyricPositions[i].x - (lyricPositions[i].width / 2) - (prev.width / 2) - minWordGap;
                  if (prev.x > maxPrevX) {
                    prev.x = maxPrevX;
                  }
                }
              }
            }
          }

          // Render collision-free lyric tokens
          lyricPositions.forEach((pos) => {
            svgElements.push(
              `<text x="${pos.x.toFixed(1)}" y="${safeLyricsY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Tamil', sans-serif" font-size="13" font-weight="600" fill="${lyricsColor}">${escapeXml(pos.word)}</text>`
            );
          });

          // Fallback: If lyrics is a single phrase without separate tokens, render whole phrase smoothly
          if (phrase.lyrics && lyricPositions.length === 0 && sysIdx === 0 && renderedNotesOnly.length > 0) {
            const startLyricsX = renderedNotesOnly[0].x;
            svgElements.push(
              `<text x="${startLyricsX}" y="${safeLyricsY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Tamil', sans-serif" font-size="13" font-weight="600" fill="${lyricsColor}">${escapeXml(phrase.lyrics)}</text>`
            );
          }

          svgElements.push('</g>'); // Close vocal-lead-system

          // Dynamic system height advancement based on the calculated lowest notation + lyrics
          const hasLyricsInSystem = lyricPositions.length > 0 || Boolean(phrase.lyrics);
          currentY = safeLyricsY + (hasLyricsInSystem ? 24 : 12);
        });

        currentY += 12; // Gap between phrases
      });

      currentY += 14; // Gap between sections
    });
  }

  // 5. Footer Branding (Matching PDF export: © Jeshurun Selvakumar on left, Chordician on right)
  currentY += 10;
  svgElements.push(`
    <g class="footer-branding">
      <line x1="${paddingX}" y1="${currentY}" x2="${width - paddingX}" y2="${currentY}" stroke="#e2e8f0" stroke-width="1" />
      <text x="${paddingX}" y="${currentY + 20}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">© Jeshurun Selvakumar</text>
      <text x="${width - paddingX}" y="${currentY + 20}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">Western Vocal Lead Sheet • chordician.vercel.app</text>
    </g>
  `);

  const finalHeight = currentY + 36;

  const fullSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${finalHeight}" width="${width}" height="${finalHeight}" style="background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block;">
  <rect width="${width}" height="${finalHeight}" fill="${bgColor}" />
  ${svgElements.join('\n')}
</svg>`.trim();

  return {
    svg: fullSvg,
    width,
    height: finalHeight,
    sectionCount: sections.length,
    noteCount: totalNotes
  };
}

/**
 * Escapes special XML characters for safe SVG insertion.
 */
function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts an SVG string into a high-resolution PNG Data URL via browser Canvas.
 *
 * @param {string} svgString - Valid SVG markup
 * @param {number} [scale=2] - Resolution multiplier (2x for high DPI crisp export)
 * @returns {Promise<string>} PNG Data URL
 */
export function generatePNGDataUrlFromSVG(svgString, scale = 2) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('PNG export is only available in a browser environment'));
    }

    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth || 800;
        const naturalHeight = img.naturalHeight || 600;
        const canvas = document.createElement('canvas');
        canvas.width = naturalWidth * scale;
        canvas.height = naturalHeight * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          return reject(new Error('Canvas 2D context unavailable'));
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(blobUrl);
        const pngUrl = canvas.toDataURL('image/png');
        resolve(pngUrl);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error(`Failed to render SVG to image: ${err?.message || 'Unknown error'}`));
      };

      img.src = blobUrl;
    } catch (err) {
      reject(err);
    }
  });
}
