import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileDown,
  Search,
  Sparkles,
  Piano,
  Layers,
  Music,
  Check
} from 'lucide-react';
import { generateChordReferencePDF } from '../services/chordSheetPdfGenerator.js';
import { useToast } from '../context/ToastContext.jsx';
import { MAJOR_SCALES, MINOR_SCALES } from '../utils/chordNotesCalculator.js';

export default function NotesGuide() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setExportStatus('Generating PDF...');
    try {
      await generateChordReferencePDF((status) => setExportStatus(status));
      showToast('Chordician Reference PDF downloaded successfully!', 'success', 2500);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExportingPDF(false);
      setExportStatus('');
    }
  };

  const sections = [
    {
      id: 'major',
      title: '1. Major Chords',
      formula: '1–3–5',
      description: 'The foundation of harmonic music. Built from root, major 3rd (4 semitones), and perfect 5th (7 semitones).',
      data: [
        { chord: 'C', notes: 'C–E–G' },
        { chord: 'C♯ / D♭', notes: 'C♯–F–G♯ / D♭–F–A♭' },
        { chord: 'D', notes: 'D–F♯–A' },
        { chord: 'D♯ / E♭', notes: 'D♯–G–A♯ / E♭–G–B♭' },
        { chord: 'E', notes: 'E–G♯–B' },
        { chord: 'F', notes: 'F–A–C' },
        { chord: 'F♯ / G♭', notes: 'F♯–A♯–C♯ / G♭–B♭–D♭' },
        { chord: 'G', notes: 'G–B–D' },
        { chord: 'G♯ / A♭', notes: 'G♯–C–D♯ / A♭–C–E♭' },
        { chord: 'A', notes: 'A–C♯–E' },
        { chord: 'A♯ / B♭', notes: 'A♯–D–F / B♭–D–F' },
        { chord: 'B', notes: 'B–D♯–F♯' }
      ]
    },
    {
      id: 'minor',
      title: '2. Minor Chords',
      formula: '1–♭3–5',
      description: 'Slightly melancholic, reflective sound. Lower the 3rd by half a step.',
      data: [
        { chord: 'Cm', notes: 'C–E♭–G' },
        { chord: 'C♯m', notes: 'C♯–E–G♯' },
        { chord: 'Dm', notes: 'D–F–A' },
        { chord: 'D♯m / E♭m', notes: 'D♯–F♯–A♯ / E♭–G♭–B♭' },
        { chord: 'Em', notes: 'E–G–B' },
        { chord: 'Fm', notes: 'F–A♭–C' },
        { chord: 'F♯m', notes: 'F♯–A–C♯' },
        { chord: 'Gm', notes: 'G–B♭–D' },
        { chord: 'G♯m / A♭m', notes: 'G♯–B–D♯ / A♭–C♭–E♭' },
        { chord: 'Am', notes: 'A–C–E' },
        { chord: 'A♯m / B♭m', notes: 'A♯–C♯–F / B♭–D♭–F' },
        { chord: 'Bm', notes: 'B–D–F♯' }
      ]
    },
    {
      id: 'dom7',
      title: '3. Dominant 7th Chords',
      formula: '1–3–5–♭7',
      description: 'Rich blues and gospel sound with a minor 7th on top of a major triad.',
      data: [
        { chord: 'C7', notes: 'C–E–G–B♭' },
        { chord: 'C♯7', notes: 'C♯–F–G♯–B' },
        { chord: 'D7', notes: 'D–F♯–A–C' },
        { chord: 'D♯7 / E♭7', notes: 'D♯–G–A♯–C♯ / E♭–G–B♭–D♭' },
        { chord: 'E7', notes: 'E–G♯–B–D' },
        { chord: 'F7', notes: 'F–A–C–E♭' },
        { chord: 'F♯7', notes: 'F♯–A♯–C♯–E' },
        { chord: 'G7', notes: 'G–B–D–F' },
        { chord: 'G♯7 / A♭7', notes: 'G♯–C–D♯–F♯ / A♭–C–E♭–G♭' },
        { chord: 'A7', notes: 'A–C♯–E–G' },
        { chord: 'A♯7 / B♭7', notes: 'A♯–D–F–G♯ / B♭–D–F–A♭' },
        { chord: 'B7', notes: 'B–D♯–F♯–A' }
      ]
    },
    {
      id: 'maj7',
      title: '4. Major 7th Chords',
      formula: '1–3–5–7',
      description: 'Lush, warm, and cinematic modern worship chord voicing.',
      data: [
        { chord: 'Cmaj7', notes: 'C–E–G–B' },
        { chord: 'C♯maj7', notes: 'C♯–F–G♯–C' },
        { chord: 'Dmaj7', notes: 'D–F♯–A–C♯' },
        { chord: 'E♭maj7', notes: 'E♭–G–B♭–D' },
        { chord: 'Emaj7', notes: 'E–G♯–B–D♯' },
        { chord: 'Fmaj7', notes: 'F–A–C–E' },
        { chord: 'F♯maj7', notes: 'F♯–A♯–C♯–F' },
        { chord: 'Gmaj7', notes: 'G–B–D–F♯' },
        { chord: 'A♭maj7', notes: 'A♭–C–E♭–G' },
        { chord: 'Amaj7', notes: 'A–C♯–E–G♯' },
        { chord: 'B♭maj7', notes: 'B♭–D–F–A' },
        { chord: 'Bmaj7', notes: 'B–D♯–F♯–A♯' }
      ]
    },
    {
      id: 'm7',
      title: '5. Minor 7th Chords',
      formula: '1–♭3–5–♭7',
      description: 'Smooth, soulful minor chords commonly used in contemporary ballads.',
      data: [
        { chord: 'Cm7', notes: 'C–E♭–G–B♭' },
        { chord: 'C♯m7', notes: 'C♯–E–G♯–B' },
        { chord: 'Dm7', notes: 'D–F–A–C' },
        { chord: 'D♯m7 / E♭m7', notes: 'D♯–F♯–A♯–C♯ / E♭–G♭–B♭–D♭' },
        { chord: 'Em7', notes: 'E–G–B–D' },
        { chord: 'Fm7', notes: 'F–A♭–C–E♭' },
        { chord: 'F♯m7', notes: 'F♯–A–C♯–E' },
        { chord: 'Gm7', notes: 'G–B♭–D–F' },
        { chord: 'G♯m7', notes: 'G♯–B–D♯–F♯' },
        { chord: 'Am7', notes: 'A–C–E–G' },
        { chord: 'B♭m7', notes: 'B♭–D♭–F–A♭' },
        { chord: 'Bm7', notes: 'B–D–F♯–A' }
      ]
    },
    {
      id: 'dim',
      title: '6. Diminished Chords',
      formula: '1–♭3–♭5',
      description: 'Tense, dramatic passing chords leading toward resolutions.',
      data: [
        { chord: 'Cdim', notes: 'C–E♭–G♭' },
        { chord: 'C♯dim', notes: 'C♯–E–G' },
        { chord: 'Ddim', notes: 'D–F–A♭' },
        { chord: 'D♯dim', notes: 'D♯–F♯–A' },
        { chord: 'Edim', notes: 'E–G–B♭' },
        { chord: 'Fdim', notes: 'F–A♭–B' },
        { chord: 'F♯dim', notes: 'F♯–A–C' },
        { chord: 'Gdim', notes: 'G–B♭–D♭' },
        { chord: 'G♯dim', notes: 'G♯–B–D' },
        { chord: 'Adim', notes: 'A–C–E♭' },
        { chord: 'A♯dim', notes: 'A♯–C♯–E' },
        { chord: 'Bdim', notes: 'B–D–F' }
      ]
    },
    {
      id: 'aug',
      title: '7. Augmented Chords',
      formula: '1–3–♯5',
      description: 'Mysterious, ascending sound creating strong tension.',
      data: [
        { chord: 'Caug', notes: 'C–E–G♯' },
        { chord: 'C♯aug', notes: 'C♯–F–A' },
        { chord: 'Daug', notes: 'D–F♯–A♯' },
        { chord: 'D♯aug', notes: 'D♯–G–B' },
        { chord: 'Eaug', notes: 'E–G♯–C' },
        { chord: 'Faug', notes: 'F–A–C♯' },
        { chord: 'F♯aug', notes: 'F♯–A♯–D' },
        { chord: 'Gaug', notes: 'G–B–D♯' },
        { chord: 'G♯aug', notes: 'G♯–C–E' },
        { chord: 'Aaug', notes: 'A–C♯–F' },
        { chord: 'A♯aug', notes: 'A♯–D–F♯' },
        { chord: 'Baug', notes: 'B–D♯–G' }
      ]
    },
    {
      id: 'sus',
      title: '8. Suspended Chords (Sus2 & Sus4)',
      formula: 'Sus2: 1–2–5 | Sus4: 1–4–5',
      description: 'Open, unresolved sound replacing the 3rd with either 2nd or 4th.',
      data: [
        { chord: 'Csus2 / Csus4', notes: 'C–D–G / C–F–G' },
        { chord: 'Dsus2 / Dsus4', notes: 'D–E–A / D–G–A' },
        { chord: 'Esus2 / Esus4', notes: 'E–F♯–B / E–A–B' },
        { chord: 'Fsus2 / Fsus4', notes: 'F–G–C / F–B♭–C' },
        { chord: 'Gsus2 / Gsus4', notes: 'G–A–D / G–C–D' },
        { chord: 'Asus2 / Asus4', notes: 'A–B–E / A–D–E' },
        { chord: 'Bsus2 / Bsus4', notes: 'B–C♯–F♯ / B–E–F♯' }
      ]
    },
    {
      id: 'power5',
      title: '9. Power / 5th Chords',
      formula: '1–5',
      description: 'Root + 5th only. Neither major nor minor, great for powerful acoustic/rock accents.',
      data: [
        { chord: 'C5 / C♯5', notes: 'C–G / C♯–G♯' },
        { chord: 'D5 / D♯5', notes: 'D–A / D♯–A♯' },
        { chord: 'E5', notes: 'E–B' },
        { chord: 'F5 / F♯5', notes: 'F–C / F♯–C♯' },
        { chord: 'G5 / G♯5', notes: 'G–D / G♯–D♯' },
        { chord: 'A5 / A♯5', notes: 'A–E / A♯–F' },
        { chord: 'B5', notes: 'B–F♯' }
      ]
    },
    {
      id: 'sixth',
      title: '10. 6th & Minor 6th Chords',
      formula: 'Major 6: 1–3–5–6 | Minor 6: 1–♭3–5–6',
      description: 'Classic jazz, vintage hymn, and warm country voicing.',
      data: [
        { chord: 'C6 / Cm6', notes: 'C–E–G–A / C–E♭–G–A' },
        { chord: 'D6 / Dm6', notes: 'D–F♯–A–B / D–F–A–B' },
        { chord: 'E6 / Em6', notes: 'E–G♯–B–C♯ / E–G–B–C♯' },
        { chord: 'F6 / Fm6', notes: 'F–A–C–D / F–A♭–C–D' },
        { chord: 'G6 / Gm6', notes: 'G–B–D–E / G–B♭–D–E' },
        { chord: 'A6 / Am6', notes: 'A–C♯–E–F♯ / A–C–E–F♯' },
        { chord: 'B6 / Bm6', notes: 'B–D♯–F♯–G♯ / B–D–F♯–G♯' }
      ]
    },
    {
      id: 'add9',
      title: '11. Add9 & Minor Add9',
      formula: 'Major Add9: 1–3–5–9 | Minor Add9: 1–♭3–5–9',
      description: 'The signature modern worship piano sound without the 7th.',
      data: [
        { chord: 'Cadd9 / Cmadd9', notes: 'C–E–G–D / C–E♭–G–D' },
        { chord: 'Dadd9 / Dmadd9', notes: 'D–F♯–A–E / D–F–A–E' },
        { chord: 'Eadd9 / Emadd9', notes: 'E–G♯–B–F♯ / E–G–B–F♯' },
        { chord: 'Fadd9 / Fmadd9', notes: 'F–A–C–G / F–A♭–C–G' },
        { chord: 'Gadd9 / Gmadd9', notes: 'G–B–D–A / G–B♭–D–A' },
        { chord: 'Aadd9 / Amadd9', notes: 'A–C♯–E–B / A–C–E–B' },
        { chord: 'Badd9 / Bmadd9', notes: 'B–D♯–F♯–C♯ / B–D–F♯–C♯' }
      ]
    },
    {
      id: 'extensions',
      title: '12–14. 9th, 11th & 13th Extended Chords',
      formula: '9th: 1–3–5–♭7–9 | 11th: +11 | 13th: +13',
      description: 'Rich, full jazz and gospel chord colorations.',
      data: [
        { chord: 'C9 / Cmaj9 / Cm9', notes: 'C–E–G–B♭–D / C–E–G–B–D / C–E♭–G–B♭–D' },
        { chord: 'D9 / Dmaj9 / Dm9', notes: 'D–F♯–A–C–E / D–F♯–A–C♯–E / D–F–A–C–E' },
        { chord: 'G9 / Gmaj9 / Gm9', notes: 'G–B–D–F–A / G–B–D–F♯–A / G–B♭–D–F–A' },
        { chord: 'C11 / Cmaj11 / Cm11', notes: 'C–E–G–B♭–D–F / C–E–G–B–D–F / C–E♭–G–B♭–D–F' },
        { chord: 'C13 / Cmaj13 / Cm13', notes: 'C–E–G–B♭–D–F–A / C–E–G–B–D–F–A / C–E♭–G–B♭–D–F–A' }
      ]
    },
    {
      id: 'halfdim',
      title: '15. Half-Diminished (m7♭5)',
      formula: '1–♭3–♭5–♭7',
      description: 'Crucial iiø chord in minor ii–V–i progressions.',
      data: [
        { chord: 'Cm7♭5', notes: 'C–E♭–G♭–B♭' },
        { chord: 'C♯m7♭5', notes: 'C♯–E–G–B' },
        { chord: 'Dm7♭5', notes: 'D–F–A♭–C' },
        { chord: 'Em7♭5', notes: 'E–G–B♭–D' },
        { chord: 'F♯m7♭5', notes: 'F♯–A–C–E' },
        { chord: 'Am7♭5', notes: 'A–C–E♭–G' },
        { chord: 'Bm7♭5', notes: 'B–D–F–A' }
      ]
    },
    {
      id: 'slash',
      title: '16–17. Slash Chords & Bass Inversions',
      formula: 'Chord / Bass Note',
      description: 'Left-hand bass inversion under right-hand chord triad on keyboard.',
      data: [
        { chord: 'C/E', notes: 'E bass + C–E–G (1st inversion)' },
        { chord: 'C/G', notes: 'G bass + C–E–G (2nd inversion)' },
        { chord: 'G/B', notes: 'B bass + G–B–D (1st inversion)' },
        { chord: 'Dm/F', notes: 'F bass + D–F–A' },
        { chord: 'Am/C', notes: 'C bass + A–C–E' },
        { chord: 'F/A', notes: 'A bass + F–A–C' }
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sections;
    return sections.filter((sec) => {
      if (sec.title.toLowerCase().includes(q) || sec.formula.toLowerCase().includes(q)) return true;
      return sec.data.some((d) => d.chord.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q));
    });
  }, [searchQuery, sections]);

  return (
    <div className="notes-guide-page">
      {/* Header */}
      <div className="notes-guide-header">
        <div className="notes-guide-title-group">
          <div className="notes-guide-icon-badge">
            <Piano size={22} />
          </div>
          <div>
            <h1 className="notes-guide-title">Piano Chord & Scale Reference</h1>
            <p className="notes-guide-subtitle">
              Comprehensive chord formulas, component notes, and complete chromatic scale reference.
            </p>
          </div>
        </div>

        <div className="notes-guide-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
          >
            <FileDown size={16} />
            <span>{isExportingPDF ? (exportStatus || 'Generating PDF...') : 'Download Reference PDF'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="card notes-search-card">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search chords (e.g. Cmaj7, Sus4, F#m, Diminished, Add9)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Chord Reference Cards Grid */}
      <div className="notes-guide-grid">
        {filteredSections.map((sec) => (
          <div key={sec.id} className="card notes-section-card">
            <div className="notes-section-header">
              <div>
                <h2 className="notes-section-title">{sec.title}</h2>
                <span className="notes-formula-badge font-mono-input">{sec.formula}</span>
              </div>
            </div>
            <p className="notes-section-desc">{sec.description}</p>
            <div className="notes-chords-table">
              {sec.data.map((item, idx) => (
                <div key={idx} className="notes-chord-row">
                  <span className="notes-chord-symbol">{item.chord}</span>
                  <span className="notes-chord-notes font-mono-input">{item.notes}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scale Reference Tables */}
      <div className="notes-scales-wrapper">
        <div className="card notes-scale-table-card">
          <div className="notes-section-header">
            <h2 className="notes-section-title">Major Scales Reference</h2>
            <span className="notes-formula-badge font-mono-input">1–2–3–4–5–6–7</span>
          </div>
          <div className="notes-scale-table">
            {Object.entries(MAJOR_SCALES).map(([key, notes]) => (
              <div key={key} className="notes-scale-row">
                <span className="notes-scale-name">{key} Major</span>
                <span className="notes-scale-notes-list font-mono-input">
                  {notes.join('  ')}  {key}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card notes-scale-table-card">
          <div className="notes-section-header">
            <h2 className="notes-section-title">Natural Minor Scales Reference</h2>
            <span className="notes-formula-badge font-mono-input">1–2–♭3–4–5–♭6–♭7</span>
          </div>
          <div className="notes-scale-table">
            {Object.entries(MINOR_SCALES).map(([key, notes]) => (
              <div key={key} className="notes-scale-row">
                <span className="notes-scale-name">{key} Minor</span>
                <span className="notes-scale-notes-list font-mono-input">
                  {notes.join('  ')}  {key}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
