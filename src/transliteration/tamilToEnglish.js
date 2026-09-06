/**
 * Tamil -> English Phonetic Transliteration Engine for Chordician / Chordex.
 *
 * Designed specifically for Hindi, Marathi, and worship song lyrics written
 * phonetically in Tamil script. Prioritizes natural worship song pronunciation
 * over academic Tamil transliteration.
 *
 * Priority order:
 * 1. Exact Phrase Dictionary
 * 2. Exact Word Dictionary
 * 3. Phonetic Pattern Rules (Longest match first)
 * 4. Character-by-character Fallback with Virama / Inherent Vowel logic
 * 5. Pronunciation Cleanup & Capitalization
 */

import exactWordMap from './exactWordMap.json' with { type: 'json' };
import phraseMap from './phraseMap.json' with { type: 'json' };
import patternMap from './patterns.json' with { type: 'json' };

// Tamil Unicode Range regex
const TAMIL_CHAR_REGEX = /[\u0B80-\u0BFF]/;
const TAMIL_BLOCK_REGEX = /[\u0B80-\u0BFF]+/g;

// Tamil independent vowels & special characters
const INDEPENDENT_VOWELS = {
  '\u0B83': 'h',   // ஃ (Aytham)
  '\u0B85': 'a',   // அ
  '\u0B86': 'aa',  // ஆ
  '\u0B87': 'i',   // இ
  '\u0B88': 'ee',  // ஈ
  '\u0B89': 'u',   // உ
  '\u0B8A': 'oo',  // ஊ
  '\u0B8E': 'e',   // எ
  '\u0B8F': 'e',   // ஏ
  '\u0B90': 'ai',  // ஐ
  '\u0B92': 'o',   // ஒ
  '\u0B93': 'o',   // ஓ
  '\u0B94': 'au'   // ஔ
};

// Tamil dependent vowel signs
const DEPENDENT_VOWELS = {
  '\u0BBE': 'aa',  // ா
  '\u0BBF': 'i',   // ி
  '\u0BC0': 'ee',  // ீ
  '\u0BC1': 'u',   // ு
  '\u0BC2': 'oo',  // ூ
  '\u0BC6': 'e',   // ெ
  '\u0BC7': 'e',   // ே
  '\u0BC8': 'ai',  // ை
  '\u0BCA': 'o',   // ொ
  '\u0BCB': 'o',   // ோ
  '\u0BCC': 'au'   // ௌ
};

const PULLI = '\u0BCD'; // ் (Virama)

// Tamil fallback consonants
const CONSONANTS = {
  '\u0B95': 'k',   // க
  '\u0B99': 'ng',  // ங
  '\u0B9A': 's',   // ச
  '\u0B9E': 'ny',  // ஞ
  '\u0B9F': 't',   // ட
  '\u0BA3': 'n',   // ண
  '\u0BA4': 'th',  // த
  '\u0BA8': 'n',   // ந
  '\u0BA9': 'n',   // ன
  '\u0BAA': 'p',   // ப
  '\u0BAE': 'm',   // ம
  '\u0BAF': 'y',   // ய
  '\u0BB0': 'r',   // ர
  '\u0BB1': 'r',   // ற
  '\u0BB2': 'l',   // ல
  '\u0BB3': 'l',   // ள
  '\u0BB4': 'zh',  // ழ
  '\u0BB5': 'v',   // வ
  '\u0B9C': 'j',   // ஜ
  '\u0BB6': 'sh',  // ஶ
  '\u0BB7': 'sh',  // ஷ
  '\u0BB8': 's',   // ஸ
  '\u0BB9': 'h',   // ஹ
  '\u0B95\u0BCD\u0BB7': 'ksh' // க்ஷ
};

// Tamil multi-character consonant clusters (ordered by length descending)
const CONSONANT_CLUSTERS = [
  ['\u0B83\u0BAA', 'f'],  // ஃப (f sound)
  ['\u0B83', 'h'],       // ஃ
  ['\u0B95\u0BCD\u0BB7', 'ksh'], // க்ஷ
  ['\u0BB7\u0BCD\u0BB0', 'shr'], // ஷ்ர
  ['\u0BAA\u0BCD\u0BB0', 'pr'],  // ப்ர
  ['\u0B95\u0BCD\u0BB0', 'kr'],  // க்ர
  ['\u0BA4\u0BCD\u0BB0', 'tr'],  // த்ர
  ['\u0BAA\u0BCD\u0BAF', 'py'],  // ப்ய
  ['\u0B95\u0BCD\u0BAF', 'ky'],  // க்ய
  ['\u0BA4\u0BCD\u0BAF', 'ty'],  // த்ய
  ['\u0BA4\u0BCD\u0BB5', 'tv'],  // த்வ
  ['\u0BB8\u0BCD\u0BB5', 'sw'],  // ஸ்வ
  ['\u0BB8\u0BCD\u0BA4', 'sth'], // ஸ்த
  ['\u0BB8\u0BCD\u0BAA', 'sp'],  // ஸ்ப
  ['\u0BB8\u0BCD\u0B95', 'sk'],  // ஸ்க
  ['\u0BB8\u0BCD\u0BAE', 'sm'],  // ஸ்ம
  ['\u0B9A\u0BCD\u0B9A', 'ch'],  // ச்ச
  ['\u0B99\u0BCD\u0B95', 'ng'],  // ங்க
  ['\u0B9E\u0BCD\u0B9A', 'nj'],  // ஞ்ச
  ['\u0BA3\u0BCD\u0B9F', 'nd'],  // ண்ட
  ['\u0BA8\u0BCD\u0BA4', 'ndh'], // ந்த
  ['\u0BAE\u0BCD\u0BAA', 'mb'],  // ம்ப
  ['\u0BA4\u0BCD\u0BA4', 'tth'], // த்த
  ['\u0BB1\u0BCD\u0BB1', 'tra'], // ற்ற
  ['\u0B9F\u0BCD\u0BB0', 'dr']   // ட்ர
];

// Words that must always preserve Title Case
const CAPITALIZED_WORDS = new Set([
  'Yeshu',
  'Yeshuvai',
  'Yeshuve',
  'Prabhu',
  'Khuda',
  'Masih',
  'Hallelujah',
  'Amen',
  'Shaitaan',
  'Pavitra',
  'Aatma',
  'Paavan',
  'Karthar',
  'Devan',
  'Raja'
]);

// Sort phrase dictionary by length descending to match longest phrases first
const sortedPhraseEntries = Object.entries(phraseMap).sort(
  (a, b) => b[0].length - a[0].length
);

/**
 * Check whether a string contains any Tamil Unicode characters.
 * @param {string} text
 * @returns {boolean}
 */
export function hasTamilScript(text) {
  if (typeof text !== 'string') return false;
  return TAMIL_CHAR_REGEX.test(text);
}

/**
 * Transliterates a single Tamil word token into English phonetics.
 * @param {string} word - A single word or sub-word containing Tamil characters.
 * @returns {string} - Transliterated word.
 */
export function transliterateTamilWord(word) {
  if (!word || !hasTamilScript(word)) {
    return word;
  }

  // 1. Exact Word Dictionary Check (highest priority)
  if (exactWordMap[word]) {
    return exactWordMap[word];
  }

  // Check normalized form
  const normalized = word.normalize('NFC');
  if (exactWordMap[normalized]) {
    return exactWordMap[normalized];
  }

  // 2. Character-by-character / Cluster-by-cluster Fallback
  let output = '';
  const len = normalized.length;
  let i = 0;

  while (i < len) {
    // Check consonant clusters first (longest match)
    let clusterMatched = false;
    for (const [clusterTamil, clusterRom] of CONSONANT_CLUSTERS) {
      if (normalized.startsWith(clusterTamil, i)) {
        const clusterLen = clusterTamil.length;
        const nextChar = i + clusterLen < len ? normalized[i + clusterLen] : null;

        if (nextChar === PULLI) {
          // Virama on cluster
          output += clusterRom;
          i += clusterLen + 1;
        } else if (nextChar && DEPENDENT_VOWELS[nextChar]) {
          // Cluster with dependent vowel sign
          output += clusterRom + DEPENDENT_VOWELS[nextChar];
          i += clusterLen + 1;
        } else {
          // Cluster with default inherent vowel
          output += clusterRom + 'a';
          i += clusterLen;
        }
        clusterMatched = true;
        break;
      }
    }

    if (clusterMatched) {
      continue;
    }

    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : null;

    // Check independent vowel
    if (INDEPENDENT_VOWELS[char]) {
      output += INDEPENDENT_VOWELS[char];
      i++;
      continue;
    }

    // Check single consonant
    if (CONSONANTS[char]) {
      const cons = CONSONANTS[char];

      if (nextChar === PULLI) {
        // Virama/Pulli: Consonant with no vowel
        output += cons;
        i += 2;
        continue;
      }

      if (nextChar && DEPENDENT_VOWELS[nextChar]) {
        // Consonant with dependent vowel sign
        output += cons + DEPENDENT_VOWELS[nextChar];
        i += 2;
        continue;
      }

      // Default inherent vowel 'a'
      output += cons + 'a';
      i++;
      continue;
    }

    // Standalone dependent vowel (rare fallback)
    if (DEPENDENT_VOWELS[char]) {
      output += DEPENDENT_VOWELS[char];
      i++;
      continue;
    }

    // Non-Tamil characters (English letters, punctuation, etc.)
    output += char;
    i++;
  }

  // 3. Pronunciation cleanup
  output = cleanPronunciation(output);

  return output;
}

/**
 * Clean up English phonetic pronunciation artifacts.
 * @param {string} str
 * @returns {string}
 */
function cleanPronunciation(str) {
  let res = str;

  // Fix repetitive vowel combinations
  res = res.replaceAll('aaaa', 'aa');
  res = res.replaceAll('aaa', 'aa');
  res = res.replaceAll('eee', 'ee');
  res = res.replaceAll('ooo', 'oo');

  // Fix doubled sh -> sh (e.g. shsh -> sh)
  res = res.replaceAll('shsh', 'sh');
  // Fix doubled thth -> tth
  res = res.replaceAll('thth', 'tth');
  // Fix doubled chch -> chch (or ch)
  res = res.replaceAll('chchch', 'chch');

  return res;
}

/**
 * Capitalize first letter of a word while preserving rest of case.
 * @param {string} word
 * @returns {string}
 */
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Transliterates a full line of text, preserving chords, punctuation,
 * brackets, repetition markers, indentation, and formatting.
 * @param {string} line
 * @returns {string}
 */
export function transliterateTamilLine(line) {
  if (typeof line !== 'string' || !hasTamilScript(line)) {
    return line;
  }

  // Preserve chords in brackets like [C], [Am7], [F#m]
  // We can tokenize by bracketed chords first
  const bracketParts = line.split(/(\[[^\]]+\])/);

  return bracketParts
    .map((part) => {
      // If bracketed chord or marker, keep untouched
      if (part.startsWith('[') && part.endsWith(']')) {
        return part;
      }

      // 1. Apply multi-word phrase replacements on this segment
      let processed = part;
      for (const [tamilPhrase, engPhrase] of sortedPhraseEntries) {
        if (processed.includes(tamilPhrase)) {
          processed = processed.replaceAll(tamilPhrase, engPhrase);
        }
      }

      if (!hasTamilScript(processed)) {
        return processed;
      }

      // 2. Tokenize by words and non-word separators (whitespace, punctuation, repetition markers)
      // We capture Tamil word blocks separately
      return processed.replace(TAMIL_BLOCK_REGEX, (tamilWord) => {
        const transliterated = transliterateTamilWord(tamilWord);

        // Check if this word should be capitalized based on sacred names
        for (const capWord of CAPITALIZED_WORDS) {
          if (transliterated.toLowerCase() === capWord.toLowerCase()) {
            return capWord;
          }
        }

        return transliterated;
      });
    })
    .join('');
}

/**
 * Transliterate any text string (multi-line, single line, or paragraph)
 * from Tamil script into natural English/Roman phonetic text.
 * @param {string} text
 * @returns {string}
 */
export function transliterateTamilToEnglish(text) {
  if (typeof text !== 'string' || !hasTamilScript(text)) {
    return text;
  }

  // Split by lines to preserve exact line breaks (\r\n or \n)
  const lines = text.split(/(\r?\n)/);

  return lines
    .map((line) => {
      // If it's a newline delimiter, return as-is
      if (line === '\n' || line === '\r\n' || line === '\r') {
        return line;
      }
      return transliterateTamilLine(line);
    })
    .join('');
}

/**
 * Transliterates a song record in-memory.
 * Only modifies `type === 'lyrics'` rows containing Tamil text in `sections`.
 * Leaves title, artist, key, chords, lead notes, metadata, IDs, etc. completely untouched.
 *
 * @param {object} song - The song record
 * @returns {{ song: object, modified: boolean }}
 */
export function transliterateSongRecord(song) {
  if (!song) return { song, modified: false };

  let modified = false;

  // Deep clone sections so original object is not mutated directly
  const newSections = (song.sections || []).map((section) => {
    let sectionChanged = false;

    const newRows = (section.rows || []).map((row) => {
      // ONLY transliterate rows of type 'lyrics' that contain Tamil characters
      if (row.type === 'lyrics' && typeof row.content === 'string' && hasTamilScript(row.content)) {
        const transliteratedContent = transliterateTamilToEnglish(row.content);
        if (transliteratedContent !== row.content) {
          sectionChanged = true;
          modified = true;
          return {
            ...row,
            content: transliteratedContent
          };
        }
      }
      return row;
    });

    if (sectionChanged) {
      return {
        ...section,
        rows: newRows
      };
    }
    return section;
  });

  if (!modified) {
    return { song, modified: false };
  }

  return {
    song: {
      ...song,
      sections: newSections
    },
    modified: true
  };
}
