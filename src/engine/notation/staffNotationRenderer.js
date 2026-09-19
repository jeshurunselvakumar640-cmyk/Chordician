/**
 * Scalable Western Staff Notation SVG Renderer for Chordician Lead Notes
 *
 * Renders pure vector Western sheet music matching the Chordician PDF export
 * template and visual branding language:
 * - Letterhead branding with Chordician 🎹 logo gradient, tagline & author
 * - Watermark "CHORDICIAN" centered at -32deg
 * - Song metadata card with Key, Style, Beat & Tempo badges
 * - Section banners with dashed dividers
 * - 5-line staff, Treble G-clef, angled noteheads, stems, accidentals & ledger lines
 * - Note names beneath notes (toggleable)
 * - Footer with (c) Jeshurun Selvakumar & chordician.vercel.app
 *
 * Zero external npm dependencies. Pure JavaScript + SVG.
 */

import { extractLeadSectionsFromSong } from './leadPitchParser.js';

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

  // Below staff: Line 1 is at offset 2 (E4).
  // Middle C (C4) is offset 0 (staffTopY + 50).
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
    for (let offset = 12; offset <= topNeeded; offset -= 2) {
      const lineY = getNoteY(offset, staffTopY, lineSpacing);
      ledgerLines.push(
        `<line x1="${x - halfWidth}" y1="${lineY}" x2="${x + halfWidth}" y2="${lineY}" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />`
      );
    }
  }

  return ledgerLines.join('\n');
}

/**
 * Renders Western musical staff notation for a song into a complete, standalone,
 * branded SVG string that mirrors the Chordician PDF export visual language.
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

  const sections = extractLeadSectionsFromSong(song);
  const songTitle = (song && song.title) ? String(song.title).trim() : 'Musical Notation';
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
  const noteSpacing = 38;
  const availableWidth = width - (paddingX * 2);
  const clefWidth = 44;
  const usableWidth = availableWidth - clefWidth;

  // Exact PDF Export Design Colors
  const bgColor = '#ffffff';
  const titleColor = '#0f172a';
  const textMuted = '#64748b';
  const brandPrimary = '#4f46e5';
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
      <text x="${paddingX + 34}" y="${currentY + 24}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="600" fill="#6366f1" letter-spacing="0.03em">YOUR CHORDS. YOUR KEY.</text>
      
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
  const cardInnerWidth = availableWidth - (cardPadding * 2);

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

  // Metadata Badges Row (Scale / Key, Beat, Style, Notation)
  let badgeCursorX = paddingX + cardPadding;
  const badgeY = metaCardContentY;
  const badgeHeight = 22;

  // Scale Badge
  const scaleText = `Scale: ${songKey}`;
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

  // Lead Notes Badge
  const notationBadgeWidth = 110;
  cardSvg.push(`
    <rect x="${badgeCursorX}" y="${badgeY}" width="${notationBadgeWidth}" height="${badgeHeight}" rx="6" fill="#ecfdf5" />
    <text x="${badgeCursorX + notationBadgeWidth / 2}" y="${badgeY + 15}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#047857">${totalNotes} Lead Notes</text>
  `);

  const cardHeight = (badgeY + badgeHeight + 14) - cardY;

  svgElements.push(`
    <g class="meta-card">
      <rect x="${paddingX}" y="${cardY}" width="${availableWidth}" height="${cardHeight}" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      ${cardSvg.join('\n')}
    </g>
  `);

  currentY += cardHeight + 20;

  // 4. Sectional Western Staff Notation
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

      currentY += 32;

      // Wrap notes into systems (measures)
      const maxNotesPerSystem = Math.max(6, Math.floor(usableWidth / noteSpacing));
      const systems = [];
      let currentSystem = [];

      section.items.forEach((item) => {
        currentSystem.push(item);
        if (item.type === 'note' && currentSystem.filter(i => i.type === 'note').length >= maxNotesPerSystem) {
          systems.push(currentSystem);
          currentSystem = [];
        }
      });
      if (currentSystem.length > 0) {
        systems.push(currentSystem);
      }

      // Render each system on 5-line staff
      systems.forEach((systemItems, sysIdx) => {
        const staffTopY = currentY + 28;
        const startX = paddingX;
        const endX = width - paddingX;

        svgElements.push(`<g class="staff-system" id="sec_${sIdx}_sys_${sysIdx}">`);

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

        // Render Notes & Barlines across the system
        let noteCursorX = startX + clefWidth + 14;
        const itemsToRender = systemItems.filter(it => it.type === 'note' || it.type === 'barline');
        const dynamicSpacing = itemsToRender.length > 1
          ? Math.min(noteSpacing, (usableWidth - 30) / Math.max(1, itemsToRender.length))
          : noteSpacing;

        systemItems.forEach((item) => {
          if (item.type === 'barline') {
            svgElements.push(
              `<line x1="${noteCursorX}" y1="${staffTopY}" x2="${noteCursorX}" y2="${staffTopY + staffHeight}" stroke="#1e1b4b}" stroke-width="1.8" />`
            );
            noteCursorX += 18;
            return;
          }

          if (item.type === 'rest') {
            svgElements.push(
              `<rect x="${noteCursorX - 4}" y="${staffTopY + 16}" width="8" height="6" fill="#1e1b4b" rx="1" />`
            );
            noteCursorX += dynamicSpacing;
            return;
          }

          if (item.type === 'note') {
            const noteY = getNoteY(item.diatonicOffset, staffTopY, lineSpacing);
            const stemPointsUp = item.diatonicOffset < 6; // Below middle line B4 -> stem points up
            const stemLength = 28;

            // 1. Ledger lines
            const ledgerLinesSvg = renderLedgerLines(noteCursorX, item.diatonicOffset, staffTopY, lineSpacing, staffLineColor);
            if (ledgerLinesSvg) {
              svgElements.push(`<g class="ledger-lines">${ledgerLinesSvg}</g>`);
            }

            // 2. Accidental Glyph (# or b)
            if (item.accidental === '#') {
              svgElements.push(renderSharpGlyph(noteCursorX, noteY, accidentalColor));
            } else if (item.accidental === 'b') {
              svgElements.push(renderFlatGlyph(noteCursorX, noteY, accidentalColor));
            }

            // 3. Notehead
            svgElements.push(
              `<ellipse cx="${noteCursorX}" cy="${noteY}" rx="5.8" ry="4.2" transform="rotate(-25 ${noteCursorX} ${noteY})" fill="${noteColor}" />`
            );

            // 4. Stem
            if (stemPointsUp) {
              const stemX = noteCursorX + 5.2;
              svgElements.push(
                `<line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${noteY - stemLength}" stroke="${noteColor}" stroke-width="1.5" stroke-linecap="round" />`
              );
            } else {
              const stemX = noteCursorX - 5.2;
              svgElements.push(
                `<line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${noteY + stemLength}" stroke="${noteColor}" stroke-width="1.5" stroke-linecap="round" />`
              );
            }

            // 5. Note Name Label beneath notehead
            if (showNoteNames) {
              const labelY = staffTopY + staffHeight + 34;
              svgElements.push(`
                <text x="${noteCursorX}" y="${labelY}" text-anchor="middle" font-family="ui-monospace, Consolas, Menlo, monospace" font-size="11" font-weight="600" fill="${textMuted}">
                  ${escapeXml(item.scientificPitch || item.displayNote)}
                </text>
              `);
            }

            noteCursorX += dynamicSpacing;
          }
        });

        svgElements.push('</g>'); // Close staff-system

        currentY += staffHeight + (showNoteNames ? 64 : 48);
      });

      currentY += 16;
    });
  }

  // 5. Footer Branding (Matching PDF export: © Jeshurun Selvakumar on left, Chordician on right)
  currentY += 10;
  svgElements.push(`
    <g class="footer-branding">
      <line x1="${paddingX}" y1="${currentY}" x2="${width - paddingX}" y2="${currentY}" stroke="#e2e8f0" stroke-width="1" />
      <text x="${paddingX}" y="${currentY + 20}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">© Jeshurun Selvakumar</text>
      <text x="${width - paddingX}" y="${currentY + 20}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">Western Staff Notation • chordician.vercel.app</text>
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
