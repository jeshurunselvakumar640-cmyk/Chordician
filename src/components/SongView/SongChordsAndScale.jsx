import React, { useMemo } from 'react';
import { Music, Layers, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { extractSongUniqueChords, getChordNotes, getScaleNotes } from '../../utils/chordNotesCalculator.js';

export default function SongChordsAndScale({ transposedSong }) {
  if (!transposedSong) return null;

  // Extract all unique chords present in this song (using currently active transposed keys)
  const uniqueChords = useMemo(() => {
    return extractSongUniqueChords(transposedSong);
  }, [transposedSong]);

  // Current active key of the song
  const activeKey = transposedSong.originalKey || transposedSong.key || 'C';
  const scaleInfo = useMemo(() => {
    return getScaleNotes(activeKey);
  }, [activeKey]);

  // Computed chord notes
  const chordBreakdowns = useMemo(() => {
    return uniqueChords.map((chord) => {
      const info = getChordNotes(chord);
      return {
        chord,
        formatted: info.formatted || info.notes,
        root: info.root,
        bass: info.bass
      };
    });
  }, [uniqueChords]);

  return (
    <div className="song-chords-scale-container" id="song-chords-and-scale">
      <div className="song-chords-scale-header">
        <div className="song-chords-scale-title-group">
          <Music size={18} className="song-chords-scale-icon" />
          <h3 className="song-chords-scale-title">Chords & Scale</h3>
        </div>
        <Link to="/notes" className="btn btn-ghost btn-sm song-chords-guide-link" title="Open Full Chord Sheet & Reference Guide">
          <BookOpen size={14} />
          <span>Full Reference Sheet</span>
        </Link>
      </div>

      <div className="song-chords-scale-content">
        {/* Scale Section */}
        <div className="song-scale-card">
          <div className="song-scale-header">
            <span className="song-scale-tag">Scale</span>
            <span className="song-scale-label">{scaleInfo.label}:</span>
          </div>
          <div className="song-scale-notes font-mono-input">
            {scaleInfo.formatted}
          </div>
        </div>

        {/* Chords Section */}
        {chordBreakdowns.length > 0 ? (
          <div className="song-chords-card">
            <div className="song-chords-header">
              <span className="song-chords-tag">Chords Used ({chordBreakdowns.length})</span>
            </div>
            <div className="song-chords-list">
              {chordBreakdowns.map(({ chord, formatted }) => (
                <div key={chord} className="song-chord-item">
                  <span className="song-chord-name">{chord}:</span>
                  <span className="song-chord-notes font-mono-input">{formatted}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="song-chords-card song-chords-empty">
            <span>No harmonic chords detected in this sheet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
