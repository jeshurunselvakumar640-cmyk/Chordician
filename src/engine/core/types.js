/**
 * @typedef {Object} ParsedChord
 * @property {string} chord
 * @property {number} position
 * @property {number} confidence
 */

/**
 * @typedef {Object} ParsedLine
 * @property {string} lyrics
 * @property {ParsedChord[]} chords
 * @property {string} [rawChordLine]
 * @property {'lyric_with_chords' | 'chords_only' | 'lyrics_only' | 'section_header'} [type]
 */

/**
 * @typedef {Object} ParsedSection
 * @property {string} [id]
 * @property {string} name
 * @property {string} [type]
 * @property {ParsedLine[]} lines
 */

/**
 * @typedef {Object} ParsedSong
 * @property {string} [title]
 * @property {string} [artist]
 * @property {string} [originalKey]
 * @property {string} [category]
 * @property {string} [timeSignature]
 * @property {number | null} [tempo]
 * @property {ParsedSection[]} sections
 * @property {number} confidence
 * @property {string[]} warnings
 * @property {Object} [debug]
 */

/**
 * @typedef {Object} ChordicianRow
 * @property {string} id
 * @property {'chords' | 'lyrics' | 'lead' | 'bass' | 'notes' | 'custom'} type
 * @property {string} content
 */

/**
 * @typedef {Object} ChordicianSection
 * @property {string} id
 * @property {string} name
 * @property {ChordicianRow[]} rows
 */

/**
 * @typedef {Object} ChordicianSong
 * @property {string} title
 * @property {string} artist
 * @property {string} originalKey
 * @property {string} category
 * @property {Object | null} [style]
 * @property {number | null} [tempo]
 * @property {string} timeSignature
 * @property {string} [notes]
 * @property {ChordicianSection[]} sections
 * @property {Object} [_chordexMeta]
 */

export const EngineTypes = {};
