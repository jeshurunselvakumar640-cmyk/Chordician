import React, { useState } from 'react';
import { ALL_KEYS, COMMON_CHORD_QUALITIES } from '../../utils/musicConstants.js';

export default function ChordHelper({ rowType, onInsert }) {
  const [selectedRoot, setSelectedRoot] = useState('C');

  if (rowType === 'chords') {
    return (
      <div className="chord-helper-panel">
        <div className="chord-helper-header">
          <span className="chord-helper-label">Quick Chords:</span>
          <span className="chord-helper-hint">Root + Quality</span>
        </div>

        {/* Roots */}
        <div className="chord-helper-roots-grid">
          {ALL_KEYS.map((root) => (
            <button
              key={root}
              type="button"
              className={`btn btn-sm chord-root-chip ${selectedRoot === root ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedRoot(root)}
            >
              {root}
            </button>
          ))}
        </div>

        {/* Qualities */}
        <div className="chord-helper-qualities-grid">
          {COMMON_CHORD_QUALITIES.map((quality) => {
            const fullChord = `${selectedRoot}${quality}`;
            return (
              <button
                key={quality}
                type="button"
                className="btn btn-secondary btn-sm font-mono-input chord-quality-chip"
                onClick={() => onInsert(fullChord + ' ')}
                title={`Insert ${fullChord}`}
              >
                {quality ? `${selectedRoot}${quality}` : `${selectedRoot}`}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (rowType === 'lead' || rowType === 'bass') {
    const defaultOctave = rowType === 'bass' ? 2 : 4;
    const [octave, setOctave] = useState(defaultOctave);

    const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    return (
      <div className="chord-helper-panel">
        <div className="chord-helper-header">
          <span className="chord-helper-label">
            Quick {rowType === 'bass' ? 'Bass' : 'Lead'} Note:
          </span>
          <div className="chord-octave-selector">
            <span className="chord-octave-label">Octave:</span>
            {[1, 2, 3, 4, 5, 6].map((oct) => (
              <button
                key={oct}
                type="button"
                className={`btn btn-sm octave-chip ${octave === oct ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setOctave(oct)}
              >
                {oct}
              </button>
            ))}
          </div>
        </div>

        <div className="chord-helper-notes-grid">
          {notes.map((n) => {
            const fullNote = `${n}${octave}`;
            return (
              <button
                key={n}
                type="button"
                className="btn btn-secondary btn-sm font-mono-input note-chip"
                onClick={() => onInsert(fullNote + ' ')}
              >
                {fullNote}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
