/**
 * Hindi / Devanagari -> English Phonetic Transliteration Engine for Chordician.
 * Optimized for worship lyrics and natural phonetic Romanization.
 */

// Devanagari Unicode Range
const DEVANAGARI_CHAR_REGEX = /[\u0900-\u097F]/;
const DEVANAGARI_BLOCK_REGEX = /[\u0900-\u097F]+/g;

// Independent vowels
const INDEPENDENT_VOWELS = {
  '\u0905': 'a',   // अ
  '\u0906': 'aa',  // आ
  '\u0907': 'i',   // इ
  '\u0908': 'ee',  // ई
  '\u0909': 'u',   // उ
  '\u090A': 'oo',  // ऊ
  '\u090B': 'ri',  // ऋ
  '\u090F': 'e',   // ए
  '\u0910': 'ai',  // ऐ
  '\u0913': 'o',   // ओ
  '\u0914': 'au'   // औ
};

// Dependent vowel signs (Matras)
const DEPENDENT_VOWELS = {
  '\u093E': 'aa',  // ा
  '\u093F': 'i',   // ि
  '\u0940': 'ee',  // ी
  '\u0941': 'u',   // ु
  '\u0942': 'oo',  // ू
  '\u0943': 'ri',  // ृ
  '\u0947': 'e',   // े
  '\u0948': 'ai',  // ै
  '\u094B': 'o',   // ो
  '\u094C': 'au'   // ौ
};

const VIRAMA = '\u094D'; // ् (Halant)
const ANUSVARA = '\u0902'; // ं (Anusvara)
const CANDRABINDU = '\u0901'; // ँ
const VISARGA = '\u0903'; // ः
const NUKTA = '\u093C'; // ़

// Consonants
const CONSONANTS = {
  '\u0915': 'k',   // क
  '\u0916': 'kh',  // ख
  '\u0917': 'g',   // ग
  '\u0918': 'gh',  // घ
  '\u0919': 'ng',  // ङ
  '\u091A': 'ch',  // च
  '\u091B': 'chh', // छ
  '\u091C': 'j',   // ज
  '\u091D': 'jh',  // झ
  '\u091E': 'ny',  // ञ
  '\u091F': 't',   // ट
  '\u0920': 'th',  // ठ
  '\u0921': 'd',   // ड
  '\u0922': 'dh',  // ढ
  '\u0923': 'n',   // ण
  '\u0924': 't',   // त
  '\u0925': 'th',  // थ
  '\u0926': 'd',   // द
  '\u0927': 'dh',  // ध
  '\u0928': 'n',   // न
  '\u092A': 'p',   // प
  '\u092B': 'ph',  // फ
  '\u092C': 'b',   // ब
  '\u092D': 'bh',  // भ
  '\u092E': 'm',   // म
  '\u092F': 'y',   // य
  '\u0930': 'r',   // र
  '\u0932': 'l',   // ल
  '\u0933': 'l',   // ळ
  '\u0935': 'v',   // व
  '\u0936': 'sh',  // श
  '\u0937': 'sh',  // ष
  '\u0938': 's',   // स
  '\u0939': 'h'    // ह
};

// Nukta-modified consonants
const NUKTA_CONSONANTS = {
  '\u0915\u093C': 'q',   // क़
  '\u0916\u093C': 'kh',  // ख़
  '\u0917\u093C': 'gh',  // ग़
  '\u091C\u093C': 'z',   // ज़
  '\u0921\u093C': 'r',   // ड़
  '\u0922\u093C': 'rh',  // ढ़
  '\u092B\u093C': 'f'    // फ़
};

// Common Hindi Christian Worship Word Dictionary
const HINDI_WORD_MAP = {
  'यीशु': 'Yeshu',
  'येशु': 'Yeshu',
  'मसीह': 'Masih',
  'प्रभु': 'Prabhu',
  'खुदा': 'Khuda',
  'खुदावंद': 'Khudavand',
  'पवित्र': 'Pavitra',
  'आत्मा': 'Aatma',
  'परमेश्वर': 'Parmeshwar',
  'पिता': 'Pita',
  'आराधना': 'Aaradhana',
  'स्तुति': 'Stuti',
  'धन्यवाद': 'Dhanyavaad',
  'महिमा': 'Mahima',
  'राजा': 'Raja',
  'शांति': 'Shanti',
  'मुक्ति': 'Mukti',
  'उद्धार': 'Uddhaar',
  'क्रूस': 'Krus',
  'प्यार': 'Pyaar',
  'प्रेम': 'Prem',
  'जिंदगी': 'Zindagi',
  'जीवन': 'Jeevan',
  'सामर्थ': 'Saamarth',
  'विश्वास': 'Vishwas',
  'आशा': 'Aasha',
  'अनुग्रह': 'Anugrah',
  'दया': 'Daya',
  'कृपा': 'Kripa',
  'हाल्लेलूयाह': 'Hallelujah',
  'हाल्लेलूया': 'Hallelujah',
  'आमीन': 'Amen',
  'गाओ': 'Gaao',
  'गाएंगे': 'Gaaenge',
  'करो': 'Karo',
  'करेंगे': 'Karenge',
  'जय': 'Jai',
  'जयजयकार': 'Jaijaikaar',
  'तू': 'Tu',
  'तेरा': 'Tera',
  'तेरी': 'Teri',
  'तेरे': 'Tere',
  'मेरा': 'Mera',
  'मेरी': 'Meri',
  'मेरे': 'Mere',
  'हम': 'Hum',
  'हमारा': 'Hamaara',
  'हमारी': 'Hamaari',
  'हमारे': 'Hamaare',
  'नाम': 'Naam',
  'दिल': 'Dil',
  'रूह': 'Rooh',
  'आसमान': 'Aasmaan',
  'जमीन': 'Zameen',
  'संसार': 'Sansaar',
  'दुनिया': 'Duniya'
};

/**
 * Check whether a string contains any Devanagari/Hindi Unicode characters.
 * @param {string} text
 * @returns {boolean}
 */
export function hasHindiScript(text) {
  if (typeof text !== 'string') return false;
  return DEVANAGARI_CHAR_REGEX.test(text);
}

/**
 * Transliterates a single Hindi/Devanagari word token into English phonetics.
 * @param {string} word
 * @returns {string}
 */
export function transliterateHindiWord(word) {
  if (!word || !hasHindiScript(word)) {
    return word;
  }

  // 1. Exact Dictionary Match
  const normalized = word.normalize('NFC');
  if (HINDI_WORD_MAP[normalized]) {
    return HINDI_WORD_MAP[normalized];
  }

  // 2. Character-by-character phonetic parsing
  let output = '';
  const len = normalized.length;
  let i = 0;

  while (i < len) {
    // Check Nukta combinations (2 chars)
    if (i + 1 < len && normalized[i + 1] === NUKTA) {
      const nuktaPair = normalized.substring(i, i + 2);
      const cons = NUKTA_CONSONANTS[nuktaPair] || CONSONANTS[normalized[i]] || '';
      i += 2;

      const nextChar = i < len ? normalized[i] : null;
      if (nextChar === VIRAMA) {
        output += cons;
        i++;
      } else if (nextChar && DEPENDENT_VOWELS[nextChar]) {
        output += cons + DEPENDENT_VOWELS[nextChar];
        i++;
      } else {
        // Inherent 'a' if not at the very end of the word
        output += cons + (i < len ? 'a' : '');
      }
      continue;
    }

    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : null;

    // Independent Vowels
    if (INDEPENDENT_VOWELS[char]) {
      output += INDEPENDENT_VOWELS[char];
      i++;
      continue;
    }

    // Anusvara (ं) / Candrabindu (ँ)
    if (char === ANUSVARA || char === CANDRABINDU) {
      output += 'n';
      i++;
      continue;
    }

    // Visarga (ः)
    if (char === VISARGA) {
      output += 'h';
      i++;
      continue;
    }

    // Consonants
    if (CONSONANTS[char]) {
      const cons = CONSONANTS[char];

      if (nextChar === VIRAMA) {
        // Halant: consonant with no vowel
        output += cons;
        i += 2;
        continue;
      }

      if (nextChar && DEPENDENT_VOWELS[nextChar]) {
        // Consonant with vowel sign
        output += cons + DEPENDENT_VOWELS[nextChar];
        i += 2;
        continue;
      }

      // Default inherent vowel 'a' (Schwa deletion at word end in Hindi)
      const isWordEnd = i + 1 >= len;
      output += cons + (isWordEnd ? '' : 'a');
      i++;
      continue;
    }

    // Standalone Dependent Vowel (fallback)
    if (DEPENDENT_VOWELS[char]) {
      output += DEPENDENT_VOWELS[char];
      i++;
      continue;
    }

    // Pass through non-Hindi characters
    output += char;
    i++;
  }

  // Capitalize if first char was uppercase or sacred word
  return output;
}

/**
 * Transliterates a full line of Hindi text preserving bracketed chords and formatting.
 * @param {string} line
 * @returns {string}
 */
export function transliterateHindiLine(line) {
  if (typeof line !== 'string' || !hasHindiScript(line)) {
    return line;
  }

  const bracketParts = line.split(/(\[[^\]]+\])/);

  return bracketParts
    .map((part) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return part;
      }

      return part.replace(DEVANAGARI_BLOCK_REGEX, (hindiWord) => {
        return transliterateHindiWord(hindiWord);
      });
    })
    .join('');
}

/**
 * Transliterate any multi-line Hindi text to English phonetics.
 * @param {string} text
 * @returns {string}
 */
export function transliterateHindiToEnglish(text) {
  if (typeof text !== 'string' || !hasHindiScript(text)) {
    return text;
  }

  const lines = text.split(/(\r?\n)/);
  return lines
    .map((line) => {
      if (line === '\n' || line === '\r\n' || line === '\r') {
        return line;
      }
      return transliterateHindiLine(line);
    })
    .join('');
}
