/**
 * Core phonetic rules, character tables, and special script preferences
 * for the Lyrical Transliteration Engine.
 */

// Tamil Unicode Tables
export const TAMIL_VOWELS = {
  '\u0B85': 'a',   // அ
  '\u0B86': 'aa',  // ஆ
  '\u0B87': 'i',   // இ
  '\u0B88': 'ee',  // ஈ
  '\u0B89': 'u',   // உ
  '\u0B8A': 'oo',  // ஊ
  '\u0B8E': 'e',   // எ
  '\u0B8F': 'ae',  // ஏ
  '\u0B90': 'ai',  // ஐ
  '\u0B92': 'o',   // ஒ
  '\u0B93': 'oo',  // ஓ
  '\u0B94': 'au',  // ஔ
  '\u0B83': 'ah'   // ஃ (Aytham)
};

export const TAMIL_VOWEL_SIGNS = {
  '\u0BBE': 'aa',  // ா
  '\u0BBF': 'i',   // ி
  '\u0BC0': 'ee',  // ீ
  '\u0BC1': 'u',   // ு
  '\u0BC2': 'oo',  // ூ
  '\u0BC6': 'e',   // ெ
  '\u0BC7': 'ae',  // ே
  '\u0BC8': 'ai',  // ை
  '\u0BCA': 'o',   // ொ
  '\u0BCB': 'oo',  // ோ
  '\u0BCC': 'au'   // ௌ
};

export const TAMIL_PULLI = '\u0BCD'; // ் (Virama)

export const TAMIL_CONSONANTS = {
  '\u0B95': 'k',   // க
  '\u0B99': 'ng',  // ங
  '\u0B9A': 'ch',  // ச
  '\u0B9E': 'nj',  // ஞ
  '\u0B9F': 't',   // ட
  '\u0BA3': 'n',   // ண
  '\u0BA4': 'th',  // த
  '\u0BA8': 'n',   // ந
  '\u0BAA': 'p',   // ப
  '\u0BAE': 'm',   // ம
  '\u0BAF': 'y',   // ய
  '\u0BB0': 'r',   // ர
  '\u0BB2': 'l',   // ல
  '\u0BB5': 'v',   // வ
  '\u0BB4': 'zh',  // ழ
  '\u0BB3': 'l',   // ள
  '\u0BB1': 'r',   // ற
  '\u0BA9': 'n',   // ன
  '\u0B9C': 'j',   // ஜ (Grantha)
  '\u0BB7': 'sh',  // ஷ (Grantha)
  '\u0BB8': 's',   // ஸ (Grantha)
  '\u0BB9': 'h'    // ஹ (Grantha)
};

// Devanagari Unicode Tables
export const DEVANAGARI_VOWELS = {
  '\u0905': 'a',   // अ
  '\u0906': 'aa',  // आ
  '\u0907': 'i',   // इ
  '\u0908': 'ee',  // ई
  '\u0909': 'u',   // उ
  '\u090A': 'oo',  // ऊ
  '\u090F': 'e',   // ए
  '\u0910': 'ai',  // ऐ
  '\u0913': 'o',   // ओ
  '\u0914': 'au'   // औ
};

export const DEVANAGARI_MATRAS = {
  '\u093E': 'aa',  // ा
  '\u093F': 'i',   // ि
  '\u0940': 'ee',  // ी
  '\u0941': 'u',   // ु
  '\u0942': 'oo',  // ू
  '\u0947': 'e',   // े
  '\u0948': 'ai',  // ै
  '\u094B': 'o',   // ो
  '\u094C': 'au',  // ौ
  '\u0902': 'n',   // ं (Anusvara)
  '\u0901': 'n'    // ँ (Chandrabindu)
};

export const DEVANAGARI_VIRAMA = '\u094D'; // ्

export const DEVANAGARI_CONSONANTS = {
  '\u0915': 'k',   // क
  '\u0916': 'kh',  // ख
  '\u0917': 'g',   // ग
  '\u0918': 'gh',  // घ
  '\u0919': 'ng',  // ङ
  '\u091A': 'ch',  // च
  '\u091B': 'chh', // छ
  '\u091C': 'j',   // ज
  '\u091D': 'jh',  // झ
  '\u091E': 'nj',  // ञ
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
  '\u0933': 'l',   // ळ (Marathi)
  '\u0935': 'v',   // व
  '\u0936': 'sh',  // श
  '\u0937': 'sh',  // ष
  '\u0938': 's',   // स
  '\u0939': 'h',   // ह
  '\u0958': 'q',   // क़
  '\u0959': 'kh',  // ख़
  '\u095A': 'gh',  // ग़
  '\u095B': 'z',   // ज़
  '\u095C': 'd',   // ड़
  '\u095D': 'dh',  // ढ़
  '\u095E': 'f'    // फ़
};
