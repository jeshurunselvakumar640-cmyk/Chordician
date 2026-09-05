import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatMainStyleHighlight } from '../data/songStyles.js';
import { transposeSong } from './transposer.js';
import { getSongById } from '../firebase/songs.js';

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
 * Formats a single row into text representation according to its row type
 * (supporting standard typed rows, strings, and composite chord/lyric objects).
 *
 * @param {Object|string} row
 * @returns {string}
 */
export function formatRowAsText(row) {
  if (!row) return '';

  if (typeof row === 'string') {
    return row;
  }

  // Composite object with chords array: { chords: [{ chord, position }], lyrics: "..." }
  if (row.chords && Array.isArray(row.chords) && row.chords.length > 0) {
    const sortedChords = [...row.chords].sort((a, b) => (a.position || 0) - (b.position || 0));
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

    const cleanLyrics = (row.lyrics || '').trimEnd();
    return cleanLyrics ? `${chordLine}\n${cleanLyrics}` : chordLine;
  }

  const { type = 'chords', displayContent, content } = row;
  const rawText = displayContent !== undefined ? displayContent : (content !== undefined ? content : row.lyrics);
  const text = Array.isArray(rawText) ? rawText.join('   ') : String(rawText || '').trimEnd();

  switch (type) {
    case 'chords':
      return text;
    case 'lyrics':
      return text;
    case 'lead':
      return text ? `[LEAD: ${text}]` : '';
    case 'bass':
      return text ? `[BASS: ${text}]` : '';
    case 'notes':
      return text ? `[NOTE: ${text}]` : '';
    default:
      return text;
  }
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
    const secTitle = sec.name || 'Section';
    const rowLines = (sec.rows || [])
      .map(row => formatRowAsText(row))
      .filter(line => line !== null && line !== undefined && line !== '');
    
    return `${secTitle}\n${rowLines.join('\n')}`;
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

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard writeText failed, trying fallback...', err);
    }
  }

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
 * Triggers native Web Share API on supported devices, falls back to copy.
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
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed, copying to clipboard instead:', err);
        const copied = await copyTextToClipboard(text);
        return { shared: false, copied };
      }
      return { shared: false, copied: false };
    }
  }

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
    header.style.marginBottom = '18px';

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
      secBox.style.marginBottom = '8px';

      if (section.name) {
        const secHeader = document.createElement('div');
        secHeader.style.fontSize = '12px';
        secHeader.style.fontWeight = '800';
        secHeader.style.color = '#4338ca';
        secHeader.style.textTransform = 'uppercase';
        secHeader.style.letterSpacing = '0.06em';
        secHeader.style.marginBottom = '8px';
        secHeader.style.paddingBottom = '4px';
        secHeader.style.borderBottom = '1px dashed #cbd5e1';
        secHeader.innerText = section.name;
        secBox.appendChild(secHeader);
      }

      (section.rows || []).forEach((row) => {
        const rowEl = document.createElement('div');
        rowEl.style.marginBottom = '4px';
        rowEl.style.lineHeight = '1.45';

        // Check if composite row format
        if (row.chords && Array.isArray(row.chords) && row.chords.length > 0) {
          const chordLine = document.createElement('div');
          chordLine.style.fontFamily = '"JetBrains Mono", Consolas, Menlo, monospace';
          chordLine.style.fontSize = '13px';
          chordLine.style.fontWeight = '800';
          chordLine.style.color = '#4f46e5';
          chordLine.style.whiteSpace = 'pre-wrap';
          chordLine.style.minHeight = '18px';
          chordLine.style.lineHeight = '1.3';

          const sorted = [...row.chords].sort((a, b) => (a.position || 0) - (b.position || 0));
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

          if (row.lyrics) {
            const lyricLine = document.createElement('div');
            lyricLine.style.fontSize = '14px';
            lyricLine.style.fontWeight = '500';
            lyricLine.style.color = '#1e293b';
            lyricLine.style.whiteSpace = 'pre-wrap';
            lyricLine.style.wordBreak = 'break-word';
            lyricLine.style.marginBottom = '8px';
            lyricLine.innerText = row.lyrics;
            rowEl.appendChild(lyricLine);
          }

          secBox.appendChild(rowEl);
          return;
        }

        // Standard typed row
        const { type = 'chords', displayContent, content } = row;
        const rawText = displayContent !== undefined ? displayContent : (content !== undefined ? content : row.lyrics);
        const text = Array.isArray(rawText) ? rawText.join('   ') : String(rawText || '');

        if (!text.trim() && type !== 'lyrics') {
          return;
        }

        if (type === 'chords') {
          const chordLine = document.createElement('div');
          chordLine.style.fontFamily = '"JetBrains Mono", Consolas, Menlo, monospace';
          chordLine.style.fontSize = '13px';
          chordLine.style.fontWeight = '800';
          chordLine.style.color = '#4f46e5';
          chordLine.style.whiteSpace = 'pre-wrap';
          chordLine.style.minHeight = '18px';
          chordLine.style.lineHeight = '1.3';
          chordLine.innerText = text;
          rowEl.appendChild(chordLine);
        } else if (type === 'lyrics') {
          const lyricLine = document.createElement('div');
          lyricLine.style.fontSize = '14px';
          lyricLine.style.fontWeight = '500';
          lyricLine.style.color = '#1e293b';
          lyricLine.style.whiteSpace = 'pre-wrap';
          lyricLine.style.wordBreak = 'break-word';
          lyricLine.style.lineHeight = '1.45';
          lyricLine.style.marginBottom = '8px';
          lyricLine.innerText = text || '\u00A0';
          rowEl.appendChild(lyricLine);
        } else if (type === 'lead') {
          const leadWrap = document.createElement('div');
          leadWrap.style.display = 'flex';
          leadWrap.style.alignItems = 'center';
          leadWrap.style.gap = '8px';
          leadWrap.style.marginBottom = '6px';
          leadWrap.innerHTML = `
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #fef3c7; color: #b45309;">LEAD</span>
            <span style="font-family: monospace; font-size: 12.5px; font-weight: 700; color: #b45309;">${text}</span>
          `;
          rowEl.appendChild(leadWrap);
        } else if (type === 'bass') {
          const bassWrap = document.createElement('div');
          bassWrap.style.display = 'flex';
          bassWrap.style.alignItems = 'center';
          bassWrap.style.gap = '8px';
          bassWrap.style.marginBottom = '6px';
          bassWrap.innerHTML = `
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1;">BASS</span>
            <span style="font-family: monospace; font-size: 12.5px; font-weight: 700; color: #0369a1;">${text}</span>
          `;
          rowEl.appendChild(bassWrap);
        } else if (type === 'notes') {
          const notesLine = document.createElement('div');
          notesLine.style.fontSize = '12px';
          notesLine.style.fontStyle = 'italic';
          notesLine.style.color = '#64748b';
          notesLine.style.marginBottom = '6px';
          notesLine.innerText = text;
          rowEl.appendChild(notesLine);
        } else {
          const customLine = document.createElement('div');
          customLine.style.fontSize = '13px';
          customLine.style.color = '#334155';
          customLine.style.marginBottom = '6px';
          customLine.innerText = text;
          rowEl.appendChild(customLine);
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
 * Automatically fetches full song data with sections from Firestore if sections are missing!
 *
 * @param {Array<Object>|Object} songs Single song or Array of songs
 * @param {Object} [options]
 * @param {string} [options.filename]
 * @param {string} [options.documentSubtitle]
 * @param {function} [options.onProgress]
 * @returns {Promise<jsPDF>}
 */
export async function exportSongsToPDF(songs, options = {}) {
  const rawList = Array.isArray(songs) ? songs.filter(Boolean) : [songs].filter(Boolean);
  if (rawList.length === 0) {
    throw new Error('No songs provided for PDF export');
  }

  // Ensure full sections are loaded for every song
  const songList = [];
  for (let i = 0; i < rawList.length; i++) {
    const s = rawList[i];
    if (s.sections && s.sections.length > 0) {
      songList.push(s);
    } else if (s.id) {
      try {
        const res = await getSongById(s.id);
        if (res?.data) {
          songList.push({ ...s, ...res.data });
        } else {
          songList.push(s);
        }
      } catch {
        songList.push(s);
      }
    } else {
      songList.push(s);
    }
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
    let isFirstPageOfPdf = true;

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

      // Target page height in canvas pixel coordinate system (standard A4 ratio)
      const pageHeightInCanvas = Math.floor(canvas.width * (pdfHeight / pdfWidth));

      // Determine how many pages this song needs
      const songPagesCount = Math.max(1, Math.ceil(canvas.height / pageHeightInCanvas));

      for (let p = 0; p < songPagesCount; p++) {
        if (isFirstPageOfPdf) {
          isFirstPageOfPdf = false;
        } else {
          // Add a new page for every subsequent slice/song, guaranteeing next song starts on next page!
          pdf.addPage('a4', 'portrait');
        }

        if (songPagesCount === 1) {
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const renderedHeightPt = Math.min(pdfHeight, (canvas.height / canvas.width) * pdfWidth);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, renderedHeightPt, undefined, 'FAST');
        } else {
          // Multi-page song: slice the canvas into page-sized blocks
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = pageHeightInCanvas;
          const ctx = sliceCanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

          const srcY = p * pageHeightInCanvas;
          const srcH = Math.min(pageHeightInCanvas, canvas.height - srcY);

          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(sliceData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
      }
    }

    // Stamp clean uniform branding footer on all pages in the PDF document
    const totalPdfPages = pdf.getNumberOfPages();
    for (let pNum = 1; pNum <= totalPdfPages; pNum++) {
      pdf.setPage(pNum);

      // Clean footer band at bottom
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pdfHeight - 26, pdfWidth, 26, 'F');

      pdf.setDrawColor(226, 232, 240); // #e2e8f0
      pdf.setLineWidth(0.75);
      pdf.line(36, pdfHeight - 24, pdfWidth - 36, pdfHeight - 24);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139); // #64748b

      pdf.text('© Jeshurun Selvakumar', 40, pdfHeight - 10, { align: 'left' });
      pdf.text(`Page ${pNum} of ${totalPdfPages}`, pdfWidth - 40, pdfHeight - 10, { align: 'right' });
    }

    pdf.save(filename);
    return pdf;
  } finally {
    if (renderRoot && renderRoot.parentNode) {
      renderRoot.parentNode.removeChild(renderRoot);
    }
  }
}
