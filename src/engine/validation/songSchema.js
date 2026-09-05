/**
 * Zod validation schemas for Chordician Parsing Engine.
 */

import { z } from 'zod';

export const ParsedChordSchema = z.object({
  chord: z.string().min(1).max(20),
  position: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).default(1.0)
});

export const ParsedLineSchema = z.object({
  lyrics: z.string(),
  chords: z.array(ParsedChordSchema).default([]),
  rawChordLine: z.string().optional(),
  type: z.enum(['lyric_with_chords', 'chords_only', 'lyrics_only', 'section_header']).optional()
});

export const ParsedSectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.string().optional(),
  lines: z.array(ParsedLineSchema).default([])
});

export const ParsedSongSchema = z.object({
  title: z.string().optional(),
  artist: z.string().optional(),
  originalKey: z.string().optional(),
  category: z.string().optional(),
  timeSignature: z.string().optional(),
  tempo: z.number().nullable().optional(),
  sections: z.array(ParsedSectionSchema).min(1),
  confidence: z.number().min(0).max(1).default(0.95),
  warnings: z.array(z.string()).default([]),
  debug: z.record(z.any()).optional()
});

export const ChordicianRowSchema = z.object({
  id: z.string(),
  type: z.enum(['chords', 'lyrics', 'lead', 'bass', 'notes', 'custom']),
  content: z.string()
});

export const ChordicianSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  rows: z.array(ChordicianRowSchema)
});

export const ChordicianSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().default(''),
  originalKey: z.string().default('C'),
  category: z.string().default('Worship'),
  style: z
    .object({
      category: z.string(),
      name: z.string(),
      churchStyleNumber: z.string().optional(),
      keyboardStyleNumber: z.string().nullable().optional()
    })
    .nullable()
    .optional(),
  tempo: z.number().nullable().optional(),
  timeSignature: z.string().default('4/4'),
  notes: z.string().optional(),
  sections: z.array(ChordicianSectionSchema).min(1),
  _chordexMeta: z.record(z.any()).optional()
});
