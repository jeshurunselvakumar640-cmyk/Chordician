import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatMainStyleHighlight } from '../data/songStyles.js';
import { transposeSong } from './transposer.js';

/**
 * Formats only the song details into text:
 * Title
 * Style: [Style]
 * Scale: [Key]
 * Beat: [TimeSignature]
 * (Tempo / Notes if available)
 *
 * @param {Object} song
 * @param {string} [activeKey]
 * @returns {string}
 */
export function formatSongDetailsText(song, activeKey) {
  if (!song) return '';
  const key = activeKey || song.originalKey || 'C';
  const styleText = formatMainStyleHighlight(song.style) || (song.style?.name ? song.style.name : 'Standard');
  const beat = song.timeSignature || '4/4';

  const lines = [
    song.title,
    ...(song.artist ? [`Artist: ${song.artist}`] : []),
    `Style: ${styleText}`,
    `Scale: ${key}`,
    `Beat: ${beat}`
  ];

  if (song.tempo) {
    lines.push(`Tempo: ${song.tempo} BPM`);
  }
  if (song.notes) {
    lines.push(`Notes: ${song.notes}`);
  }

  return lines.join('\n');
}

/**
 * Aligns chords above a lyric line for plain text representation.
 * @param {Array<{ chord: string, position: number }>} chords
 * @param {string} lyrics
 * @returns {string} Two lines: chords line then lyrics line
 */
export function formatRowAsText(chords = [], lyrics = '') {
  const cleanLyrics = (lyrics || '').trimEnd();
  if (!chords || chords.length === 0) {
    return cleanLyrics;
  }

  // Sort chords by position
  const sortedChords = [...chords].sort((a, b) => a.position - b.position);

  // Build chord line buffer
  let chordLine = '';
  for (const item of sortedChords) {
    const chordStr = item.chord || '';
    const pos = Math.max(0, item.position || 0);

    if (chordLine.length < pos) {
      chordLine += ' '.repeat(pos - chordLine.length);
    } else if (chordLine.length > pos && chordLine.length > 0) {
      chordLine += ' ';
    }
    chordLine += chordStr;
  }

  if (!cleanLyrics) {
    return chordLine;
  }

  return `${chordLine}\n${cleanLyrics}`;
}

/**
 * Formats full song notes into text with details header followed by
 * structured sections with chords placed above lyrics.
 *
 * @param {Object} song
 * @param {string} [activeKey]
 * @returns {string}
 */
export function formatFullNotesText(song, activeKey) {
  if (!song) return '';
  const currentSong = activeKey && activeKey !== song.originalKey
    ? transposeSong(song, activeKey)
    : song;

  const header = formatSongDetailsText(song, activeKey);
  const sections = currentSong.sections || [];

  if (sections.length === 0) {
    return header;
  }

  const formattedSections = sections.map((sec) => {
    const secTitle = sec.name ? `[${sec.name}]` : '';
    const rows = (sec.rows || []).map(row => formatRowAsText(row.chords, row.lyrics)).join('\n');
    return secTitle ? `${secTitle}\n${rows}` : rows;
  }).join('\n\n');

  return `${header}\n\n${formattedSections}`;
}

/**
 * Copies plain text to user clipboard with safety fallback.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Try modern navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard writeText failed, trying fallback...', err);
    }
  }

  // Fallback using textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Triggers native Web Share API on supported devices (e.g. mobile WhatsApp/Telegram/Messages),
 * falls back to clipboard copy if share API is unavailable or rejected.
 *
 * @param {string} title
 * @param {string} text
 * @returns {Promise<{ shared: boolean, copied: boolean }>}
 */
export async function shareViaWebAPI(title, text) {
  if (navigator?.share) {
    try {
      await navigator.share({
        title: title || 'Chordician Song',
        text: text
      });
      return { shared: true, copied: false };
    } catch (err) {
      // User cancelled or share failed
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed, copying to clipboard instead:', err);
        const copied = await copyTextToClipboard(text);
        return { shared: false, copied };
      }
      return { shared: false, copied: false };
    }
  }

  // Fallback to copy
  const copied = await copyTextToClipboard(text);
  return { shared: false, copied };
}

/**
 * Downloads a text file (.txt) directly in the browser.
 * @param {string} filename
 * @param {string} text
 */
export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds an off-screen HTML element container formatted for PDF rendering.
 * Supports Tamil, English, and Hindi Unicode text with exact chord positioning.
 *
 * @param {Array<Object>} songList List of song objects
 * @param {Object} [options]
 * @param {string} [options.documentTitle]
 * @returns {HTMLDivElement}
 */
function createPDFRenderElement(songList = [], options = {}) {
  const container = document.createElement('div');
  container.id = 'chordician-pdf-render-root';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", "Latha", Helvetica, Arial, sans-serif';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.boxSizing = 'border-box';

  songList.forEach((song, sIndex) => {
    const key = song.activeKey || song.originalKey || 'C';
    const currentSong = song.activeKey && song.activeKey !== song.originalKey
      ? transposeSong(song, song.activeKey)
      : song;

    const styleText = formatMainStyleHighlight(currentSong.style) || (currentSong.style?.name || 'Standard');
    const beat = currentSong.timeSignature || '4/4';

    const songPage = document.createElement('div');
    songPage.className = 'pdf-song-page';
    songPage.style.padding = '36px 40px 48px 40px';
    songPage.style.boxSizing = 'border-box';
    songPage.style.minHeight = '1120px'; // standard A4 height at 96 DPI
    songPage.style.position = 'relative';
    songPage.style.display = 'flex';
    songPage.style.flexDirection = 'column';
    songPage.style.justifyContent = 'space-between';

    if (sIndex > 0) {
      songPage.style.pageBreakBefore = 'always';
    }

    // --- Main Content Top Wrapper ---
    const contentWrap = document.createElement('div');

    // --- Header Branding ---
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.borderBottom = '2px solid #6366f1';
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '20px';

    const brandLeft = document.createElement('div');
    brandLeft.style.display = 'flex';
    brandLeft.style.alignItems = 'center';
    brandLeft.style.gap = '8px';

    const logoIcon = document.createElement('div');
    logoIcon.style.width = '24px';
    logoIcon.style.height = '24px';
    logoIcon.style.borderRadius = '6px';
    logoIcon.style.background = 'linear-gradient(135deg, #6366f1, #a855f7)';
    logoIcon.style.display = 'flex';
    logoIcon.style.alignItems = 'center';
    logoIcon.style.justifyContent = 'center';
    logoIcon.style.color = '#ffffff';
    logoIcon.style.fontWeight = 'bold';
    logoIcon.style.fontSize = '14px';
    logoIcon.innerHTML = '🎹';

    const brandText = document.createElement('div');
    brandText.innerHTML = `
      <span style="font-size: 16px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.02em;">Chordician</span>
      <span style="font-size: 11px; color: #6b7280; margin-left: 6px;">Your chords. Your key.</span>
    `;

    brandLeft.appendChild(logoIcon);
    brandLeft.appendChild(brandText);

    const brandRight = document.createElement('div');
    brandRight.style.fontSize = '11px';
    brandRight.style.color = '#6b7280';
    brandRight.style.fontWeight = '500';
    brandRight.innerText = options.documentSubtitle || 'Worship Songbook';

    header.appendChild(brandLeft);
    header.appendChild(brandRight);
    contentWrap.appendChild(header);

    // --- Song Title & Metadata Banner ---
    const metaCard = document.createElement('div');
    metaCard.style.background = '#f8fafc';
    metaCard.style.border = '1px solid #e2e8f0';
    metaCard.style.borderRadius = '10px';
    metaCard.style.padding = '14px 18px';
    metaCard.style.marginBottom = '20px';

    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'baseline';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.flexWrap = 'wrap';
    titleRow.style.gap = '8px';

    const titleEl = document.createElement('h1');
    titleEl.style.fontSize = '22px';
    titleEl.style.fontWeight = '800';
    titleEl.style.color = '#0f172a';
    titleEl.style.margin = '0';
    titleEl.style.letterSpacing = '-0.02em';
    titleEl.innerText = currentSong.title;

    const artistEl = document.createElement('span');
    artistEl.style.fontSize = '12px';
    artistEl.style.color = '#64748b';
    artistEl.style.fontWeight = '500';
    artistEl.innerText = currentSong.artist ? `Artist: ${currentSong.artist}` : '';

    titleRow.appendChild(titleEl);
    if (currentSong.artist) titleRow.appendChild(artistEl);
    metaCard.appendChild(titleRow);

    // Metadata Badges Row
    const badgesRow = document.createElement('div');
    badgesRow.style.display = 'flex';
    badgesRow.style.alignItems = 'center';
    badgesRow.style.gap = '8px';
    badgesRow.style.marginTop = '10px';
    badgesRow.style.flexWrap = 'wrap';

    const createBadge = (label, value, bg = '#e0e7ff', text = '#4338ca') => {
      const b = document.createElement('span');
      b.style.display = 'inline-flex';
      b.style.alignItems = 'center';
      b.style.gap = '4px';
      b.style.padding = '3px 10px';
      b.style.borderRadius = '6px';
      b.style.fontSize = '11px';
      b.style.fontWeight = '700';
      b.style.background = bg;
      b.style.color = text;
      b.innerHTML = `${label}: <span style="font-weight: 800;">${value}</span>`;
      return b;
    };

    badgesRow.appendChild(createBadge('Scale', key, '#e0e7ff', '#4338ca'));
    badgesRow.appendChild(createBadge('Style', styleText, '#f3e8ff', '#7e22ce'));
    badgesRow.appendChild(createBadge('Beat', beat, '#f1f5f9', '#334155'));
    if (currentSong.tempo) {
      badgesRow.appendChild(createBadge('Tempo', `${currentSong.tempo} BPM`, '#fef3c7', '#b45309'));
    }
    if (currentSong.category) {
      badgesRow.appendChild(createBadge('Category', currentSong.category, '#ecfdf5', '#047857'));
    }

    metaCard.appendChild(badgesRow);

    if (currentSong.notes) {
      const notesEl = document.createElement('div');
      notesEl.style.fontSize = '11px';
      notesEl.style.color = '#64748b';
      notesEl.style.marginTop = '8px';
      notesEl.style.fontStyle = 'italic';
      notesEl.innerText = `Notes: ${currentSong.notes}`;
      metaCard.appendChild(notesEl);
    }

    contentWrap.appendChild(metaCard);

    // --- Structured Sections (Chords & Lyrics) ---
    const sectionsContainer = document.createElement('div');
    sectionsContainer.style.display = 'flex';
    sectionsContainer.style.flexDirection = 'column';
    sectionsContainer.style.gap = '16px';

    (currentSong.sections || []).forEach((section) => {
      const secBox = document.createElement('div');
      secBox.style.marginBottom = '6px';

      if (section.name) {
        const secHeader = document.createElement('div');
        secHeader.style.fontSize = '12px';
        secHeader.style.fontWeight = '800';
        secHeader.style.color = '#6366f1';
        secHeader.style.textTransform = 'uppercase';
        secHeader.style.letterSpacing = '0.06em';
        secHeader.style.marginBottom = '6px';
        secHeader.style.paddingBottom = '2px';
        secHeader.style.borderBottom = '1px dashed #e2e8f0';
        secHeader.innerText = section.name;
        secBox.appendChild(secHeader);
      }

      (section.rows || []).forEach((row) => {
        const rowEl = document.createElement('div');
        rowEl.style.marginBottom = '8px';
        rowEl.style.lineHeight = '1.45';

        // Chords line
        if (row.chords && row.chords.length > 0) {
          const chordLine = document.createElement('div');
          chordLine.style.fontFamily = '"JetBrains Mono", Consolas, Menlo, monospace';
          chordLine.style.fontSize = '12.5px';
          chordLine.style.fontWeight = '800';
          chordLine.style.color = '#4f46e5';
          chordLine.style.whiteSpace = 'pre';
          chordLine.style.minHeight = '16px';

          // Build chord string preserving positions
          const sorted = [...row.chords].sort((a, b) => a.position - b.position);
          let str = '';
          for (const item of sorted) {
            const ch = item.chord || '';
            const pos = Math.max(0, item.position || 0);
            if (str.length < pos) {
              str += ' '.repeat(pos - str.length);
            } else if (str.length > pos && str.length > 0) {
              str += ' ';
            }
            str += ch;
          }
          chordLine.innerText = str;
          rowEl.appendChild(chordLine);
        }

        // Lyrics line
        if (row.lyrics) {
          const lyricLine = document.createElement('div');
          lyricLine.style.fontSize = '13.5px';
          lyricLine.style.fontWeight = '500';
          lyricLine.style.color = '#1e293b';
          lyricLine.style.whiteSpace = 'pre-wrap';
          lyricLine.style.wordBreak = 'break-word';
          lyricLine.innerText = row.lyrics;
          rowEl.appendChild(lyricLine);
        }

        secBox.appendChild(rowEl);
      });

      sectionsContainer.appendChild(secBox);
    });

    contentWrap.appendChild(sectionsContainer);
    songPage.appendChild(contentWrap);

    // --- Footer Branding ---
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.borderTop = '1px solid #e2e8f0';
    footer.style.paddingTop = '12px';
    footer.style.marginTop = '24px';
    footer.style.fontSize = '11px';
    footer.style.color = '#64748b';

    const footerLeft = document.createElement('span');
    footerLeft.style.fontWeight = '600';
    footerLeft.innerText = '© Jeshurun Selvakumar';

    const footerRight = document.createElement('span');
    footerRight.style.fontWeight = '600';
    footerRight.innerText = `Page ${sIndex + 1} of ${songList.length}`;

    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);
    songPage.appendChild(footer);

    container.appendChild(songPage);
  });

  return container;
}

/**
 * Generates a high-quality PDF containing one or more songs with Chordician branding header,
 * (c) Jeshurun Selvakumar footer, and page numbers.
 *
 * @param {Array<Object>|Object} songs Single song or Array of songs
 * @param {Object} [options]
 * @param {string} [options.filename]
 * @param {string} [options.documentSubtitle]
 * @param {function} [options.onProgress]
 * @returns {Promise<jsPDF>}
 */
export async function exportSongsToPDF(songs, options = {}) {
  const songList = Array.isArray(songs) ? songs.filter(Boolean) : [songs].filter(Boolean);
  if (songList.length === 0) {
    throw new Error('No songs provided for PDF export');
  }

  const filename = options.filename || (
    songList.length === 1
      ? `${songList[0].title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Chords.pdf`
      : `Chordician_Songbook_${songList.length}_Songs.pdf`
  );

  const renderRoot = createPDFRenderElement(songList, options);
  document.body.appendChild(renderRoot);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pageElements = renderRoot.querySelectorAll('.pdf-song-page');

    for (let i = 0; i < pageElements.length; i++) {
      if (options.onProgress) {
        options.onProgress(i + 1, pageElements.length);
      }

      const pageEl = pageElements[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x high-resolution rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    pdf.save(filename);
    return pdf;
  } finally {
    if (renderRoot && renderRoot.parentNode) {
      renderRoot.parentNode.removeChild(renderRoot);
    }
  }
}
