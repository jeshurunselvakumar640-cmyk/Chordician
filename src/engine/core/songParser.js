/**
 * Core Song Parser Pipeline.
 * Orchestrates tokenization, chord detection, line pairing, section grouping, and metadata extraction.
 */

import { analyzeLines } from './lineAnalyzer.js';
import { tokenizeLine } from './tokenizer.js';
import { pairChordLineWithLyric } from './positionMapper.js';

/**
 * Parses raw chord and lyric text into a structured ParsedSong object.
 * @param {string} rawText
 * @param {Object} [options={}]
 * @returns {import('./types.js').ParsedSong}
 */
export function parseSong(rawText, options = {}) {
  const lines = (rawText || '').split(/\r?\n/);
  const classifiedLines = analyzeLines(lines);

  let detectedTitle = options.title || '';
  let detectedArtist = options.artist || '';
  let detectedKey = options.originalKey || '';
  let detectedTimeSig = options.timeSignature || '4/4';
  let detectedTempo = options.tempo || null;

  const sections = [];
  let currentSection = {
    id: 'sec_1',
    name: 'Verse 1',
    lines: []
  };

  let pendingChordLine = null;
  let totalChordsFound = 0;
  let totalLyricsFound = 0;

  for (let i = 0; i < classifiedLines.length; i++) {
    const item = classifiedLines[i];

    // Extract inline metadata if found
    if (item.type === 'METADATA_KEY' && item.metaValue && !detectedKey) {
      detectedKey = item.metaValue;
      continue;
    }
    if (item.type === 'METADATA_TIME' && item.metaValue && !options.timeSignature) {
      detectedTimeSig = item.metaValue;
      continue;
    }
    if (item.type === 'METADATA_TEMPO' && item.metaValue && !options.tempo) {
      detectedTempo = parseInt(item.metaValue, 10);
      continue;
    }
    if (item.type === 'METADATA_HEADER' && item.metaValue && (!detectedTitle || detectedTitle === 'Imported Song')) {
      detectedTitle = item.metaValue;
      continue;
    }

    // Skip transpose ladders, empty lines, or isolated metadata
    if (item.type === 'TRANSPOSE_LADDER' || item.type === 'METADATA_KEY' || item.type === 'METADATA_TIME' || item.type === 'METADATA_TEMPO' || item.type === 'METADATA_HEADER') {
      continue;
    }

    if (item.type === 'EMPTY') {
      if (pendingChordLine !== null) {
        const paired = pairChordLineWithLyric(pendingChordLine, '');
        currentSection.lines.push({
          lyrics: '',
          chords: paired.chords,
          rawChordLine: pendingChordLine,
          type: 'chords_only'
        });
        totalChordsFound += paired.chords.length;
        pendingChordLine = null;
      }
      continue;
    }

    // Handle Section Header
    if (item.type === 'SECTION_HEADER') {
      if (pendingChordLine !== null) {
        const paired = pairChordLineWithLyric(pendingChordLine, '');
        currentSection.lines.push({
          lyrics: '',
          chords: paired.chords,
          rawChordLine: pendingChordLine,
          type: 'chords_only'
        });
        totalChordsFound += paired.chords.length;
        pendingChordLine = null;
      }

      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        id: `sec_${sections.length + 1}`,
        name: item.sectionName || `Section ${sections.length + 1}`,
        lines: []
      };
      continue;
    }

    // Handle Pending Chord Line + Next Line Pairing
    if (pendingChordLine !== null) {
      if (item.type === 'CHORD_LINE') {
        const paired = pairChordLineWithLyric(pendingChordLine, '');
        currentSection.lines.push({
          lyrics: '',
          chords: paired.chords,
          rawChordLine: pendingChordLine,
          type: 'chords_only'
        });
        totalChordsFound += paired.chords.length;
        pendingChordLine = item.raw;
      } else {
        const paired = pairChordLineWithLyric(pendingChordLine, item.raw);
        currentSection.lines.push({
          lyrics: paired.lyrics,
          chords: paired.chords,
          rawChordLine: pendingChordLine,
          type: 'lyric_with_chords'
        });
        totalChordsFound += paired.chords.length;
        if (paired.lyrics) totalLyricsFound++;
        pendingChordLine = null;
      }
      continue;
    }

    // Check if current line is a standalone chord line
    if (item.type === 'CHORD_LINE') {
      pendingChordLine = item.raw;
      continue;
    }

    // Handle Inline Bracketed Chords or Attached Chords Line
    const tokenized = tokenizeLine(item.raw);
    if (tokenized.chords.length > 0) {
      currentSection.lines.push({
        lyrics: tokenized.lyrics,
        chords: tokenized.chords,
        type: tokenized.lyrics ? 'lyric_with_chords' : 'chords_only'
      });
      totalChordsFound += tokenized.chords.length;
      if (tokenized.lyrics) totalLyricsFound++;
      continue;
    }

    // Otherwise it's a plain lyric line
    currentSection.lines.push({
      lyrics: item.trimmed,
      chords: [],
      type: 'lyrics_only'
    });
    totalLyricsFound++;
  }

  // Flush any final pending chord line
  if (pendingChordLine !== null) {
    const paired = pairChordLineWithLyric(pendingChordLine, '');
    currentSection.lines.push({
      lyrics: '',
      chords: paired.chords,
      rawChordLine: pendingChordLine,
      type: 'chords_only'
    });
    totalChordsFound += paired.chords.length;
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // Fallback section if empty
  if (sections.length === 0) {
    sections.push({
      id: 'sec_1',
      name: 'Verse 1',
      lines: [
        {
          lyrics: '',
          chords: [{ chord: 'C', position: 0, confidence: 1.0 }],
          rawChordLine: 'C   F   G   C',
          type: 'chords_only'
        }
      ]
    });
  }

  return {
    title: detectedTitle || 'Imported Song',
    artist: detectedArtist || '',
    originalKey: detectedKey || 'C',
    category: options.category || 'Worship',
    timeSignature: detectedTimeSig || '4/4',
    tempo: detectedTempo,
    sections,
    confidence: 0.95,
    warnings: [],
    debug: {
      inputType: options.inputType || 'smart_paste',
      detectedChords: totalChordsFound,
      detectedLyrics: totalLyricsFound,
      sections: sections.length,
      confidence: 0.95
    }
  };
}
