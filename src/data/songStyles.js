/**
 * Chordician Style Database
 * Complete mapping of Church Style Numbers -> Keyboard Style Numbers
 * across 15 musical categories.
 */

export const STYLE_CATEGORIES = [
  'Indian',
  'Pop & Rock',
  '16 Beat',
  'Ballad',
  'Dance',
  'Disco',
  'Swing & Jazz',
  'R&B',
  'Country',
  'Latin',
  'Ballroom',
  'Trad / World',
  'Waltz',
  'Children',
  'Pianist'
];

export const SONG_STYLES = [
  // --- Indian ---
  { id: 'style_090', category: 'Indian', name: 'BollyMix 1', churchStyleNumber: '090', keyboardStyleNumber: '193' },
  { id: 'style_091', category: 'Indian', name: 'BollyMix 2', churchStyleNumber: '091', keyboardStyleNumber: '193' },
  { id: 'style_092', category: 'Indian', name: 'IndianPop', churchStyleNumber: '092', keyboardStyleNumber: '194' },
  { id: 'style_093', category: 'Indian', name: 'Bhangra', churchStyleNumber: '093', keyboardStyleNumber: '197' },
  { id: 'style_094', category: 'Indian', name: 'Boliyan', churchStyleNumber: '094', keyboardStyleNumber: null },
  { id: 'style_095', category: 'Indian', name: 'Goan Pop', churchStyleNumber: '095', keyboardStyleNumber: null },
  { id: 'style_096', category: 'Indian', name: 'Dandiya', churchStyleNumber: '096', keyboardStyleNumber: '200' },
  { id: 'style_097', category: 'Indian', name: 'Rajasthan', churchStyleNumber: '097', keyboardStyleNumber: '199' },
  { id: 'style_098', category: 'Indian', name: 'Qawwali', churchStyleNumber: '098', keyboardStyleNumber: '201' },
  { id: 'style_099', category: 'Indian', name: 'Bhajan', churchStyleNumber: '099', keyboardStyleNumber: '192' },
  { id: 'style_100', category: 'Indian', name: 'Tamil', churchStyleNumber: '100', keyboardStyleNumber: null },
  { id: 'style_101', category: 'Indian', name: 'Kerala', churchStyleNumber: '101', keyboardStyleNumber: '198' },

  // --- Pop & Rock ---
  { id: 'style_001', category: 'Pop & Rock', name: '8BeatModern', churchStyleNumber: '001', keyboardStyleNumber: '101' },
  { id: 'style_002', category: 'Pop & Rock', name: 'Cool8Beat', churchStyleNumber: '002', keyboardStyleNumber: null },
  { id: 'style_003', category: 'Pop & Rock', name: "60'sGuitarPop", churchStyleNumber: '003', keyboardStyleNumber: '102' },
  { id: 'style_004', category: 'Pop & Rock', name: '8BeatAdria', churchStyleNumber: '004', keyboardStyleNumber: null },
  { id: 'style_005', category: 'Pop & Rock', name: "60's8Beat", churchStyleNumber: '005', keyboardStyleNumber: '103' },
  { id: 'style_006', category: 'Pop & Rock', name: 'BubblegumPop', churchStyleNumber: '006', keyboardStyleNumber: null },
  { id: 'style_007', category: 'Pop & Rock', name: 'BritPopSwing', churchStyleNumber: '007', keyboardStyleNumber: null },
  { id: 'style_008', category: 'Pop & Rock', name: '8Beat', churchStyleNumber: '008', keyboardStyleNumber: '104' },
  { id: 'style_009', category: 'Pop & Rock', name: 'OffBeat', churchStyleNumber: '009', keyboardStyleNumber: '105' },
  { id: 'style_010', category: 'Pop & Rock', name: "60'sRock", churchStyleNumber: '010', keyboardStyleNumber: '106' },
  { id: 'style_011', category: 'Pop & Rock', name: 'HardRock', churchStyleNumber: '011', keyboardStyleNumber: '107' },
  { id: 'style_012', category: 'Pop & Rock', name: 'RockShuffle', churchStyleNumber: '012', keyboardStyleNumber: '108' },
  { id: 'style_013', category: 'Pop & Rock', name: '8BeatRock', churchStyleNumber: '013', keyboardStyleNumber: '109' },

  // --- 16 Beat ---
  { id: 'style_014', category: '16 Beat', name: '16Beat', churchStyleNumber: '014', keyboardStyleNumber: '110' },
  { id: 'style_015', category: '16 Beat', name: 'PopShuffle 1', churchStyleNumber: '015', keyboardStyleNumber: '111' },
  { id: 'style_016', category: '16 Beat', name: 'PopShuffle 2', churchStyleNumber: '016', keyboardStyleNumber: '111' },
  { id: 'style_017', category: '16 Beat', name: 'GuitarPop', churchStyleNumber: '017', keyboardStyleNumber: '112' },
  { id: 'style_018', category: '16 Beat', name: '16BeatUptempo', churchStyleNumber: '018', keyboardStyleNumber: '113' },
  { id: 'style_019', category: '16 Beat', name: 'KoolShuffle', churchStyleNumber: '019', keyboardStyleNumber: '114' },
  { id: 'style_020', category: '16 Beat', name: 'JazzRock', churchStyleNumber: '020', keyboardStyleNumber: null },
  { id: 'style_021', category: '16 Beat', name: 'HipHopLight', churchStyleNumber: '021', keyboardStyleNumber: '115' },

  // --- Ballad ---
  { id: 'style_022', category: 'Ballad', name: 'PianoBallad', churchStyleNumber: '022', keyboardStyleNumber: '116' },
  { id: 'style_023', category: 'Ballad', name: 'LoveSong', churchStyleNumber: '023', keyboardStyleNumber: null },
  { id: 'style_024', category: 'Ballad', name: '6/8ModernEP', churchStyleNumber: '024', keyboardStyleNumber: '117' },
  { id: 'style_025', category: 'Ballad', name: '6/8SlowRock', churchStyleNumber: '025', keyboardStyleNumber: '118' },
  { id: 'style_026', category: 'Ballad', name: '6/8OrchBallad', churchStyleNumber: '026', keyboardStyleNumber: null },
  { id: 'style_027', category: 'Ballad', name: 'OrganBallad', churchStyleNumber: '027', keyboardStyleNumber: '119' },
  { id: 'style_028', category: 'Ballad', name: 'PopBallad', churchStyleNumber: '028', keyboardStyleNumber: '120' },
  { id: 'style_029', category: 'Ballad', name: '16BeatBallad 1', churchStyleNumber: '029', keyboardStyleNumber: '121' },
  { id: 'style_030', category: 'Ballad', name: '16BeatBallad 2', churchStyleNumber: '030', keyboardStyleNumber: '121' },

  // --- Dance ---
  { id: 'style_031', category: 'Dance', name: 'EuroTrance', churchStyleNumber: '031', keyboardStyleNumber: '122' },
  { id: 'style_032', category: 'Dance', name: 'Ibiza', churchStyleNumber: '032', keyboardStyleNumber: '123' },
  { id: 'style_033', category: 'Dance', name: 'DreamDance', churchStyleNumber: '033', keyboardStyleNumber: null },
  { id: 'style_034', category: 'Dance', name: 'NewHipHop', churchStyleNumber: '034', keyboardStyleNumber: null },
  { id: 'style_035', category: 'Dance', name: 'PopR&B', churchStyleNumber: '035', keyboardStyleNumber: null },
  { id: 'style_036', category: 'Dance', name: 'TrancePop', churchStyleNumber: '036', keyboardStyleNumber: null },
  { id: 'style_037', category: 'Dance', name: 'ChartPop', churchStyleNumber: '037', keyboardStyleNumber: null },
  { id: 'style_038', category: 'Dance', name: 'HouseMusik', churchStyleNumber: '038', keyboardStyleNumber: null },
  { id: 'style_039', category: 'Dance', name: 'SwingHouse', churchStyleNumber: '039', keyboardStyleNumber: '124' },
  { id: 'style_040', category: 'Dance', name: 'TechnoPolis', churchStyleNumber: '040', keyboardStyleNumber: null },
  { id: 'style_041', category: 'Dance', name: 'Clubdance', churchStyleNumber: '041', keyboardStyleNumber: '125' },
  { id: 'style_042', category: 'Dance', name: 'ClubLatin', churchStyleNumber: '042', keyboardStyleNumber: '126' },
  { id: 'style_043', category: 'Dance', name: 'Garage 1', churchStyleNumber: '043', keyboardStyleNumber: '127' },
  { id: 'style_044', category: 'Dance', name: 'Garage 2', churchStyleNumber: '044', keyboardStyleNumber: '127' },
  { id: 'style_045', category: 'Dance', name: 'TechnoParty', churchStyleNumber: '045', keyboardStyleNumber: '128' },
  { id: 'style_046', category: 'Dance', name: 'UKPop', churchStyleNumber: '046', keyboardStyleNumber: null },
  { id: 'style_047', category: 'Dance', name: 'HipHopGroove', churchStyleNumber: '047', keyboardStyleNumber: '129' },
  { id: 'style_048', category: 'Dance', name: 'HipShuffle', churchStyleNumber: '048', keyboardStyleNumber: null },
  { id: 'style_049', category: 'Dance', name: 'HipHopPop', churchStyleNumber: '049', keyboardStyleNumber: null },

  // --- Disco ---
  { id: 'style_050', category: 'Disco', name: '70sDisco 1', churchStyleNumber: '050', keyboardStyleNumber: '130' },
  { id: 'style_051', category: 'Disco', name: '70sDisco 2', churchStyleNumber: '051', keyboardStyleNumber: '130' },
  { id: 'style_052', category: 'Disco', name: 'LatinDisco', churchStyleNumber: '052', keyboardStyleNumber: '131' },
  { id: 'style_053', category: 'Disco', name: 'DiscoPhilly', churchStyleNumber: '053', keyboardStyleNumber: null },
  { id: 'style_054', category: 'Disco', name: 'SaturdayNight', churchStyleNumber: '054', keyboardStyleNumber: '132' },
  { id: 'style_055', category: 'Disco', name: 'DiscoChocolate', churchStyleNumber: '055', keyboardStyleNumber: null },
  { id: 'style_056', category: 'Disco', name: 'DiscoHands', churchStyleNumber: '056', keyboardStyleNumber: '133' },

  // --- Swing & Jazz ---
  { id: 'style_057', category: 'Swing & Jazz', name: 'BigBandFast', churchStyleNumber: '057', keyboardStyleNumber: '134' },
  { id: 'style_058', category: 'Swing & Jazz', name: 'BigBandMedium', churchStyleNumber: '058', keyboardStyleNumber: null },
  { id: 'style_059', category: 'Swing & Jazz', name: 'BigBandBallad', churchStyleNumber: '059', keyboardStyleNumber: null },
  { id: 'style_060', category: 'Swing & Jazz', name: 'BigBandShuffle', churchStyleNumber: '060', keyboardStyleNumber: null },
  { id: 'style_061', category: 'Swing & Jazz', name: 'JazzClub', churchStyleNumber: '061', keyboardStyleNumber: '136' },
  { id: 'style_062', category: 'Swing & Jazz', name: 'Swing1', churchStyleNumber: '062', keyboardStyleNumber: '137' },
  { id: 'style_063', category: 'Swing & Jazz', name: 'Swing2', churchStyleNumber: '063', keyboardStyleNumber: '138' },
  { id: 'style_064', category: 'Swing & Jazz', name: 'OrchestraSwing', churchStyleNumber: '064', keyboardStyleNumber: null },
  { id: 'style_065', category: 'Swing & Jazz', name: 'Five/Four', churchStyleNumber: '065', keyboardStyleNumber: '139' },
  { id: 'style_066', category: 'Swing & Jazz', name: 'JazzBallad', churchStyleNumber: '066', keyboardStyleNumber: '135' },
  { id: 'style_067', category: 'Swing & Jazz', name: 'Dixieland', churchStyleNumber: '067', keyboardStyleNumber: '140' },
  { id: 'style_068', category: 'Swing & Jazz', name: 'Ragtime', churchStyleNumber: '068', keyboardStyleNumber: '141' },
  { id: 'style_069', category: 'Swing & Jazz', name: 'AfroCuban', churchStyleNumber: '069', keyboardStyleNumber: null },
  { id: 'style_070', category: 'Swing & Jazz', name: 'Charleston', churchStyleNumber: '070', keyboardStyleNumber: null },

  // --- R&B ---
  { id: 'style_071', category: 'R&B', name: 'Soul', churchStyleNumber: '071', keyboardStyleNumber: '142' },
  { id: 'style_072', category: 'R&B', name: 'DetroitPop', churchStyleNumber: '072', keyboardStyleNumber: '143' },
  { id: 'style_073', category: 'R&B', name: 'Rock&Roll', churchStyleNumber: '073', keyboardStyleNumber: '146' },
  { id: 'style_074', category: 'R&B', name: '6/8Soul', churchStyleNumber: '074', keyboardStyleNumber: '144' },
  { id: 'style_075', category: 'R&B', name: 'ModernR&B', churchStyleNumber: '075', keyboardStyleNumber: null },
  { id: 'style_076', category: 'R&B', name: 'CrocoTwist', churchStyleNumber: '076', keyboardStyleNumber: '145' },
  { id: 'style_077', category: 'R&B', name: 'Rock&Roll (077)', churchStyleNumber: '077', keyboardStyleNumber: '146' },
  { id: 'style_078', category: 'R&B', name: 'DetroitPop (078)', churchStyleNumber: '078', keyboardStyleNumber: '143' },
  { id: 'style_079', category: 'R&B', name: 'BoogieWoogie', churchStyleNumber: '079', keyboardStyleNumber: null },
  { id: 'style_080', category: 'R&B', name: 'ComboBoogie', churchStyleNumber: '080', keyboardStyleNumber: '147' },
  { id: 'style_081', category: 'R&B', name: '6/8Blues', churchStyleNumber: '081', keyboardStyleNumber: '148' },

  // --- Country ---
  { id: 'style_082', category: 'Country', name: 'Country8Beat', churchStyleNumber: '082', keyboardStyleNumber: null },
  { id: 'style_083', category: 'Country', name: 'CountryPop', churchStyleNumber: '083', keyboardStyleNumber: '149' },
  { id: 'style_084', category: 'Country', name: 'CountrySwing', churchStyleNumber: '084', keyboardStyleNumber: '150' },
  { id: 'style_085', category: 'Country', name: 'CountryBallad', churchStyleNumber: '085', keyboardStyleNumber: null },
  { id: 'style_086', category: 'Country', name: 'Country2/4', churchStyleNumber: '086', keyboardStyleNumber: '151' },
  { id: 'style_087', category: 'Country', name: 'CowboyBoogie', churchStyleNumber: '087', keyboardStyleNumber: null },
  { id: 'style_088', category: 'Country', name: 'CountryShuffle', churchStyleNumber: '088', keyboardStyleNumber: null },
  { id: 'style_089', category: 'Country', name: 'Bluegrass', churchStyleNumber: '089', keyboardStyleNumber: '152' },

  // --- Latin ---
  { id: 'style_102', category: 'Latin', name: 'BrazilianSamba', churchStyleNumber: '102', keyboardStyleNumber: '177' },
  { id: 'style_103', category: 'Latin', name: 'BossaNova 1', churchStyleNumber: '103', keyboardStyleNumber: '178' },
  { id: 'style_104', category: 'Latin', name: 'BossaNova 2', churchStyleNumber: '104', keyboardStyleNumber: '178' },
  { id: 'style_105', category: 'Latin', name: 'Tijuana', churchStyleNumber: '105', keyboardStyleNumber: '185' },
  { id: 'style_106', category: 'Latin', name: 'LatinDisco', churchStyleNumber: '106', keyboardStyleNumber: '131' },
  { id: 'style_107', category: 'Latin', name: 'Mambo', churchStyleNumber: '107', keyboardStyleNumber: '181' },
  { id: 'style_108', category: 'Latin', name: 'Salsa', churchStyleNumber: '108', keyboardStyleNumber: '182' },
  { id: 'style_109', category: 'Latin', name: 'Beguine', churchStyleNumber: '109', keyboardStyleNumber: '183' },
  { id: 'style_110', category: 'Latin', name: 'GuitarRumba', churchStyleNumber: '110', keyboardStyleNumber: null },
  { id: 'style_111', category: 'Latin', name: 'RumbaFlamenco', churchStyleNumber: '111', keyboardStyleNumber: null },
  { id: 'style_112', category: 'Latin', name: 'RumbaIsland', churchStyleNumber: '112', keyboardStyleNumber: null },
  { id: 'style_113', category: 'Latin', name: 'Reggae', churchStyleNumber: '113', keyboardStyleNumber: '184' },

  // --- Ballroom ---
  { id: 'style_114', category: 'Ballroom', name: 'VienneseWaltz', churchStyleNumber: '114', keyboardStyleNumber: '153' },
  { id: 'style_115', category: 'Ballroom', name: 'EnglishWaltz', churchStyleNumber: '115', keyboardStyleNumber: '154' },
  { id: 'style_116', category: 'Ballroom', name: 'Slowfox', churchStyleNumber: '116', keyboardStyleNumber: '155' },
  { id: 'style_117', category: 'Ballroom', name: 'Foxtrot', churchStyleNumber: '117', keyboardStyleNumber: '156' },
  { id: 'style_118', category: 'Ballroom', name: 'Quickstep', churchStyleNumber: '118', keyboardStyleNumber: '157' },
  { id: 'style_119', category: 'Ballroom', name: 'Tango', churchStyleNumber: '119', keyboardStyleNumber: '158' },
  { id: 'style_120', category: 'Ballroom', name: 'Pasodoble', churchStyleNumber: '120', keyboardStyleNumber: '159' },
  { id: 'style_121', category: 'Ballroom', name: 'Samba', churchStyleNumber: '121', keyboardStyleNumber: '160' },
  { id: 'style_122', category: 'Ballroom', name: 'ChaChaCha', churchStyleNumber: '122', keyboardStyleNumber: '161' },
  { id: 'style_123', category: 'Ballroom', name: 'Rumba', churchStyleNumber: '123', keyboardStyleNumber: '162' },
  { id: 'style_124', category: 'Ballroom', name: 'Jive', churchStyleNumber: '124', keyboardStyleNumber: '163' },

  // --- Trad / World ---
  { id: 'style_125', category: 'Trad / World', name: 'USMarch', churchStyleNumber: '125', keyboardStyleNumber: '164' },
  { id: 'style_126', category: 'Trad / World', name: '6/8March', churchStyleNumber: '126', keyboardStyleNumber: '165' },
  { id: 'style_127', category: 'Trad / World', name: 'GermanMarch', churchStyleNumber: '127', keyboardStyleNumber: null },
  { id: 'style_128', category: 'Trad / World', name: 'PolkaPop', churchStyleNumber: '128', keyboardStyleNumber: '166' },
  { id: 'style_129', category: 'Trad / World', name: 'OberPolka', churchStyleNumber: '129', keyboardStyleNumber: null },
  { id: 'style_130', category: 'Trad / World', name: 'Tarantella', churchStyleNumber: '130', keyboardStyleNumber: '167' },
  { id: 'style_131', category: 'Trad / World', name: 'Showtune', churchStyleNumber: '131', keyboardStyleNumber: '168' },
  { id: 'style_132', category: 'Trad / World', name: 'ChristmasSwing', churchStyleNumber: '132', keyboardStyleNumber: '169' },
  { id: 'style_133', category: 'Trad / World', name: 'ChristmasWaltz', churchStyleNumber: '133', keyboardStyleNumber: '170' },
  { id: 'style_134', category: 'Trad / World', name: 'ScottishReel', churchStyleNumber: '134', keyboardStyleNumber: '171' },
  { id: 'style_135', category: 'Trad / World', name: 'Hawaiian', churchStyleNumber: '135', keyboardStyleNumber: null },

  // --- Waltz ---
  { id: 'style_136', category: 'Waltz', name: 'ItalianWaltz', churchStyleNumber: '136', keyboardStyleNumber: null },
  { id: 'style_137', category: 'Waltz', name: 'MariachiWaltz', churchStyleNumber: '137', keyboardStyleNumber: null },
  { id: 'style_138', category: 'Waltz', name: 'GuitarSerenade', churchStyleNumber: '138', keyboardStyleNumber: null },
  { id: 'style_139', category: 'Waltz', name: 'SwingWaltz', churchStyleNumber: '139', keyboardStyleNumber: '173' },
  { id: 'style_140', category: 'Waltz', name: 'JazzWaltz 1', churchStyleNumber: '140', keyboardStyleNumber: '174' },
  { id: 'style_141', category: 'Waltz', name: 'JazzWaltz 2', churchStyleNumber: '141', keyboardStyleNumber: '174' },
  { id: 'style_142', category: 'Waltz', name: 'CountryWaltz', churchStyleNumber: '142', keyboardStyleNumber: '175' },
  { id: 'style_143', category: 'Waltz', name: 'OberWaltzer', churchStyleNumber: '143', keyboardStyleNumber: null },
  { id: 'style_144', category: 'Waltz', name: 'Musette', churchStyleNumber: '144', keyboardStyleNumber: '176' },

  // --- Children ---
  { id: 'style_145', category: 'Children', name: 'Learning2/4', churchStyleNumber: '145', keyboardStyleNumber: null },
  { id: 'style_146', category: 'Children', name: 'Learning4/4', churchStyleNumber: '146', keyboardStyleNumber: null },
  { id: 'style_147', category: 'Children', name: 'Learning6/8', churchStyleNumber: '147', keyboardStyleNumber: null },
  { id: 'style_148', category: 'Children', name: 'Fun 3/4', churchStyleNumber: '148', keyboardStyleNumber: null },
  { id: 'style_149', category: 'Children', name: 'Fun 4/4', churchStyleNumber: '149', keyboardStyleNumber: null },

  // --- Pianist ---
  { id: 'style_150', category: 'Pianist', name: 'Stride', churchStyleNumber: '150', keyboardStyleNumber: '207' },
  { id: 'style_151', category: 'Pianist', name: 'PianoBlues1', churchStyleNumber: '151', keyboardStyleNumber: null },
  { id: 'style_152', category: 'Pianist', name: 'PianoBlues2', churchStyleNumber: '152', keyboardStyleNumber: null },
  { id: 'style_153', category: 'Pianist', name: 'PianoRag', churchStyleNumber: '153', keyboardStyleNumber: null },
  { id: 'style_154', category: 'Pianist', name: 'PianoRock&Roll', churchStyleNumber: '154', keyboardStyleNumber: null },
  { id: 'style_155', category: 'Pianist', name: 'PianoBoogie', churchStyleNumber: '155', keyboardStyleNumber: null },
  { id: 'style_156', category: 'Pianist', name: 'PianoJazzWaltz', churchStyleNumber: '156', keyboardStyleNumber: null },
  { id: 'style_157', category: 'Pianist', name: 'PianoJazzBld', churchStyleNumber: '157', keyboardStyleNumber: null },
  { id: 'style_158', category: 'Pianist', name: 'Arpeggio', churchStyleNumber: '158', keyboardStyleNumber: '209' },
  { id: 'style_159', category: 'Pianist', name: 'Musical', churchStyleNumber: '159', keyboardStyleNumber: null },
  { id: 'style_160', category: 'Pianist', name: 'SlowRock', churchStyleNumber: '160', keyboardStyleNumber: '211' },
  { id: 'style_161', category: 'Pianist', name: '8BeatPianoBallad', churchStyleNumber: '161', keyboardStyleNumber: '212' },
  { id: 'style_162', category: 'Pianist', name: 'PianoSwing', churchStyleNumber: '162', keyboardStyleNumber: '208' }
];

/**
 * Returns all available styles for a specific category
 */
export function getStylesByCategory(category) {
  if (!category) return SONG_STYLES;
  return SONG_STYLES.filter((s) => s.category.toLowerCase() === category.toLowerCase());
}

/**
 * Format the secondary numeric text for a style
 * e.g. "Church 090 • Keyboard 193" or "Church 095"
 */
export function formatStyleCode(style) {
  if (!style) return '';
  const parts = [];
  if (style.churchStyleNumber) {
    parts.push(`Church ${style.churchStyleNumber}`);
  }
  if (style.keyboardStyleNumber) {
    parts.push(`Keyboard ${style.keyboardStyleNumber}`);
  }
  return parts.join(' • ');
}

/**
 * Search across styles by name, category, church code, or keyboard code
 */
export function searchStyles(query) {
  if (!query || !query.trim()) return SONG_STYLES;
  
  const q = query.trim().toLowerCase();
  
  return SONG_STYLES.filter((style) => {
    const nameMatch = style.name.toLowerCase().includes(q);
    const categoryMatch = style.category.toLowerCase().includes(q);
    const churchMatch = style.churchStyleNumber && style.churchStyleNumber.toLowerCase().includes(q);
    const keyboardMatch = style.keyboardStyleNumber && style.keyboardStyleNumber.toLowerCase().includes(q);
    
    // Also allow searching composite "090/193"
    const compositeMatch = style.churchStyleNumber && style.keyboardStyleNumber &&
      `${style.churchStyleNumber}/${style.keyboardStyleNumber}`.includes(q);

    return nameMatch || categoryMatch || churchMatch || keyboardMatch || compositeMatch;
  });
}

/**
 * Find exact style matching category and name or church number
 */
export function findStyle(category, name) {
  if (!name) return null;
  const lowerName = name.toLowerCase().trim();
  const lowerCat = category ? category.toLowerCase().trim() : null;

  return SONG_STYLES.find((s) => {
    const matchesName = s.name.toLowerCase() === lowerName;
    const matchesCat = lowerCat ? s.category.toLowerCase() === lowerCat : true;
    return matchesName && matchesCat;
  }) || null;
}

/**
 * Resolves a full style object from a partial style, string, or existing style object
 */
export function resolveFullStyle(style) {
  if (!style) return null;
  if (typeof style === 'string') {
    const found = findStyle(null, style);
    return found || { id: 'custom', name: style, category: 'General', churchStyleNumber: null, keyboardStyleNumber: null };
  }
  if (style.churchStyleNumber || style.keyboardStyleNumber) {
    return style;
  }
  if (style.name) {
    const found = findStyle(style.category, style.name);
    if (found) return { ...found, ...style, churchStyleNumber: found.churchStyleNumber, keyboardStyleNumber: found.keyboardStyleNumber };
  }
  return style;
}

/**
 * Returns the numeric style code e.g. "142/175", "090/193", "094", etc.
 */
export function getStyleNumberCode(style) {
  const s = resolveFullStyle(style);
  if (!s) return '';
  if (s.churchStyleNumber && s.keyboardStyleNumber) {
    return `${s.churchStyleNumber}/${s.keyboardStyleNumber}`;
  }
  if (s.churchStyleNumber) {
    return `${s.churchStyleNumber}`;
  }
  if (s.keyboardStyleNumber) {
    return `${s.keyboardStyleNumber}`;
  }
  return '';
}

/**
 * Format the highlighted main style string for prominent display
 * e.g. "142/175 CountryWaltz" or "142/175CntryWlz"
 */
export function formatMainStyleHighlight(style, format = 'standard') {
  const s = resolveFullStyle(style);
  if (!s) return '';
  
  const numCode = getStyleNumberCode(s);
  const name = s.name || '';

  if (format === 'compact') {
    const compactName = name.replace(/\s+/g, '');
    return numCode ? `${numCode}${compactName}` : compactName;
  }

  return numCode ? `${numCode} ${name}` : name;
}

