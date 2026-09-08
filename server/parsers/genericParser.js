import { extractSongFromHtml } from '../services/htmlExtractor.js';
import { normalizeSongData } from '../services/songNormalizer.js';
import { analyzeSongTextWithChordexAI } from '../services/chordexTextAnalyzer.js';
import { parseSmartPaste } from '../../src/engine/smartPaste/smartPasteParser.js';

/**
 * HTML Song Parser powered by Chordex AI Intelligence.
 * Extracts webpage content and uses Gemini to reconstruct clean chord-above-lyrics formatting,
 * with direct fallback to Smart Paster.
 */
export async function parseHtmlToSong(html, sourceUrl = '') {
  const extracted = extractSongFromHtml(html, sourceUrl);

  let song = null;
  const warnings = [];

  // 1. Primary: Chordex AI reconstruction with Gemini if API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[Chordex AI] Running intelligent chord sheet reconstruction with Gemini...');
      song = await analyzeSongTextWithChordexAI(extracted.rawText, {
        title: extracted.title,
        artist: extracted.artist,
        originalKey: extracted.originalKey,
        sourceUrl
      });
    } catch (aiErr) {
      console.warn('[Chordex AI] AI text reconstruction error, falling back to Smart Paster:', aiErr.message);
      warnings.push('AI parsing encountered an issue; used Smart Paster fallback.');
    }
  }

  // 2. High-precision fallback: Smart Paster dual inspection engine
  if (!song) {
    const smartPasteResult = parseSmartPaste(extracted.rawText, {
      title: extracted.title,
      artist: extracted.artist,
      originalKey: extracted.originalKey,
      sourceUrl
    });

    if (smartPasteResult.success && smartPasteResult.song) {
      song = smartPasteResult.song;
      if (smartPasteResult.warnings) warnings.push(...smartPasteResult.warnings);
    } else {
      song = normalizeSongData(extracted, sourceUrl);
    }
  }

  const totalChords = (song.sections || []).reduce((acc, sec) => {
    return acc + (sec.rows || []).filter(r => r.type === 'chords' && r.content.trim().length > 0).length;
  }, 0);

  if (totalChords === 0) {
    warnings.push('No chords could be confidently detected on this page. Only lyrics were extracted.');
  }

  return {
    song,
    warnings
  };
}

