/**
 * Tamil-to-Tanglish (Romanized Tamil) Transliteration Utility.
 * Converts Tamil Unicode lyrics and titles into natural, phonetically accurate Tanglish.
 */

const COMMON_WORSHIP_WORDS = new Map([
  ['இயேசு', 'Yesu'],
  ['இயேசுவே', 'Yesuvae'],
  ['இயேசுவுக்கு', 'Yesuvukku'],
  ['ராஜா', 'Raja'],
  ['ராஜாவுக்கே', 'Rajavukke'],
  ['ராஜாவே', 'Rajavae'],
  ['தேவன்', 'Devan'],
  ['தேவனே', 'Devanae'],
  ['தேவமே', 'Devamae'],
  ['தகப்பனே', 'Thagappanae'],
  ['அப்பா', 'Appa'],
  ['பிதாவே', 'Pithaavae'],
  ['பரிசுத்தரே', 'Parisutharae'],
  ['கர்த்தர்', 'Karthar'],
  ['கர்த்தாவே', 'Karthavae'],
  ['கிறிஸ்து', 'Kiristhu'],
  ['நன்மைகள்', 'Nanmaigal'],
  ['நன்மை', 'Nanmai'],
  ['இஸ்ரவேல்', 'Isravel'],
  ['இஸ்ரவேலே', 'Isravelae'],
  ['எத்தனை', 'Ethanai'],
  ['பெலன்', 'Belan'],
  ['பெலனாக', 'Belanaaga'],
  ['பெலவீனன்', 'Belaveenan'],
  ['ஆராதிப்பேன்', 'Aaraathippaen'],
  ['ஆராதனை', 'Aaraadhanai'],
  ['கன்மலை', 'Kanmalai'],
  ['உதவி', 'Uthavi'],
  ['பயப்படாதே', 'Bayappadaadhae'],
  ['வழியும்', 'Vazhiyum'],
  ['சத்தியமும்', 'Sathiyamum'],
  ['ஜீவனும்', 'Jeevanum'],
  ['அழைத்தவரே', 'Azhaithavarae'],
  ['நன்றி', 'Nandri'],
  ['ஸ்தோத்திரம்', 'Sthothiram'],
  ['துதிப்பேன்', 'Thuthippane'],
  ['செய்தீர்', 'Seitheer'],
  ['சொல்வேன்', 'Solvaen'],
  ['தாழ்மையில்', 'Thaazhmaiyil'],
  ['நினைத்தீர்', 'Ninaitheer'],
  ['கால்கள்', 'Kaalgal'],
  ['தள்ளாட', 'Thallaada'],
  ['விடமாட்டார்', 'Vidamaattaar'],
  ['காக்கும்', 'Kaakkum'],
  ['உறங்கமாட்டார்', 'Urangamaattaar'],
  ['தூங்கமாட்டார்', 'Thoongamaattaar']
]);

const TAMIL_VOWELS = {
  '\u0B85': 'A',
  '\u0B86': 'Aa',
  '\u0B87': 'I',
  '\u0B88': 'Ee',
  '\u0B89': 'U',
  '\u0B8A': 'Oo',
  '\u0B8E': 'E',
  '\u0B8F': 'Ae',
  '\u0B90': 'Ai',
  '\u0B92': 'O',
  '\u0B93': 'Oo',
  '\u0B94': 'Au'
};

const TAMIL_CONSONANTS = {
  '\u0B95': 'k',
  '\u0B99': 'ng',
  '\u0B9A': 's',
  '\u0B9E': 'gn',
  '\u0B9F': 't',
  '\u0BA3': 'n',
  '\u0BA4': 'th',
  '\u0BA8': 'n',
  '\u0BA9': 'n',
  '\u0BAA': 'p',
  '\u0BAE': 'm',
  '\u0BAF': 'y',
  '\u0BB0': 'r',
  '\u0BB1': 'r',
  '\u0BB2': 'l',
  '\u0BB3': 'l',
  '\u0BB4': 'zh',
  '\u0BB5': 'v',
  '\u0B9C': 'j', // ஜ
  '\u0BB6': 'sh', // ஶ
  '\u0BB7': 'sh', // ஷ
  '\u0BB8': 's', // ஸ
  '\u0BB9': 'h' // ஹ
};

const TAMIL_VOWEL_SIGNS = {
  '\u0BBE': 'aa',
  '\u0BBF': 'i',
  '\u0BC0': 'ee',
  '\u0BC1': 'u',
  '\u0BC2': 'oo',
  '\u0BC6': 'e',
  '\u0BC7': 'ae',
  '\u0BC8': 'ai',
  '\u0BCA': 'o',
  '\u0BCB': 'o',
  '\u0BCC': 'au'
};

/**
 * Transliterates a Tamil Unicode string to standard Tanglish (Romanized Tamil).
 * @param {string} text
 * @returns {string}
 */
export function transliterateTamilToTanglish(text) {
  if (!text || typeof text !== 'string') return '';

  const words = text.trim().split(/\s+/);
  const transliteratedWords = [];

  for (const word of words) {
    const cleanWord = word.replace(/^[^\u0B80-\u0BFF]+|[^\u0B80-\u0BFF]+$/g, '');

    // 1. Direct dictionary match for common liturgical words
    if (COMMON_WORSHIP_WORDS.has(cleanWord)) {
      transliteratedWords.push(COMMON_WORSHIP_WORDS.get(cleanWord));
      continue;
    }

    // 2. Compound word prefix separation (e.g. நன்மைகள்எனக்குச் -> Nanmaigal Enakkus)
    let matchedPrefix = null;
    for (const [key, val] of COMMON_WORSHIP_WORDS) {
      if (key.length >= 4 && cleanWord.startsWith(key) && cleanWord.length > key.length) {
        matchedPrefix = { key, val };
        break;
      }
    }

    if (matchedPrefix) {
      transliteratedWords.push(matchedPrefix.val);
      const remainder = cleanWord.substring(matchedPrefix.key.length);
      const remainderTrans = transliterateTamilToTanglish(remainder);
      if (remainderTrans) {
        transliteratedWords.push(remainderTrans);
      }
      continue;
    }

    // 3. Character-by-character phonetic transliteration
    let trans = '';
    let i = 0;
    const len = word.length;

    while (i < len) {
      const char = word[i];

      // Independent Vowel
      if (TAMIL_VOWELS[char]) {
        trans += TAMIL_VOWELS[char].toLowerCase();
        i++;
        continue;
      }

      // Consonant
      if (TAMIL_CONSONANTS[char]) {
        let base = TAMIL_CONSONANTS[char];
        const nextChar = i + 1 < len ? word[i + 1] : null;

        // Phonetic softening of 'k' to 'g' in plural suffixes like '-கள்'
        if (char === '\u0B95' && i > 0 && word.substring(i, i + 3) === 'கள்') {
          base = 'g';
        }

        // Virama (Pulli) removes inherent vowel 'a'
        if (nextChar === '\u0BCD') {
          trans += base;
          i += 2;
          continue;
        }

        // Vowel sign
        if (nextChar && TAMIL_VOWEL_SIGNS[nextChar]) {
          trans += base + TAMIL_VOWEL_SIGNS[nextChar];
          i += 2;
          continue;
        }

        // Default inherent vowel 'a'
        trans += base + 'a';
        i++;
        continue;
      }

      // Non-Tamil characters (Latin, punctuation, etc.)
      trans += char;
      i++;
    }

    // Title case the individual word
    const titleCased = trans.charAt(0).toUpperCase() + trans.slice(1);
    transliteratedWords.push(titleCased);
  }

  return transliteratedWords
    .join(' ')
    .replace(/\b[a-z]/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}
