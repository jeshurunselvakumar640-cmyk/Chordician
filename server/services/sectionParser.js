/**
 * Section detection and normalization for song structures.
 */

const SECTION_KEYWORD_REGEX = /^(?:\[|\(|)?\s*(Verse(?:\s*\d+)?|Chorus(?:\s*\d+)?|Bridge(?:\s*\d+)?|Intro(?:\s*\d+)?|Outro(?:\s*\d+)?|Pre-Chorus(?:\s*\d+)?|Interlude(?:\s*\d+)?|Ending|Refrain|Tag|Hook|Instrumental|Solo|Pallavi|Anupallavi|Charanam(?:\s*\d+)?)\s*(?::|-)?\s*(?:\]|\)|)?$/i;

/**
 * Checks if a given text line represents a section heading.
 */
export function isSectionHeader(line) {
  if (!line || typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 50) return false;

  return SECTION_KEYWORD_REGEX.test(trimmed);
}

/**
 * Cleans and standardizes section name (e.g. "[Verse 1]:" -> "Verse 1")
 */
export function cleanSectionName(line) {
  if (!line || typeof line !== 'string') return 'Section 1';
  const trimmed = line.trim();

  const match = trimmed.match(/^(?:\[|\(|)?\s*(Verse(?:\s*\d+)?|Chorus(?:\s*\d+)?|Bridge(?:\s*\d+)?|Intro(?:\s*\d+)?|Outro(?:\s*\d+)?|Pre-Chorus(?:\s*\d+)?|Interlude(?:\s*\d+)?|Ending|Refrain|Tag|Hook|Instrumental|Solo|Pallavi|Anupallavi|Charanam(?:\s*\d+)?)\s*(?::|-)?\s*(?:\]|\)|)?$/i);

  if (match && match[1]) {
    // Capitalize first letter of each word
    return match[1].replace(/\b\w/g, c => c.toUpperCase());
  }

  return trimmed.replace(/^[\[({:\s]+|[\])}:\s]+$/g, '') || 'Section';
}

/**
 * Categorizes a section name into standard section types (verse, chorus, bridge, intro, outro, etc.)
 */
export function inferSectionType(sectionName) {
  if (!sectionName) return 'verse';
  const lower = sectionName.toLowerCase();

  if (lower.includes('chorus') || lower.includes('refrain') || lower.includes('hook') || lower.includes('pallavi')) return 'chorus';
  if (lower.includes('bridge') || lower.includes('anupallavi')) return 'bridge';
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('outro') || lower.includes('ending')) return 'outro';
  if (lower.includes('pre-chorus')) return 'pre-chorus';
  if (lower.includes('interlude') || lower.includes('instrumental') || lower.includes('solo')) return 'interlude';

  return 'verse';
}
