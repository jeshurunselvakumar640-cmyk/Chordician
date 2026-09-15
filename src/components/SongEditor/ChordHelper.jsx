import React, { useState } from 'react';
import { MAJOR_KEYS, COMMON_CHORD_QUALITIES } from '../../utils/musicConstants.js';
import { getKeyGuideData } from '../../data/keyChordFamilies.js';

export default function ChordHelper({ rowType, onInsert, selectedKey }) {
  const [selectedRoot, setSelectedRoot] = useState('C');

  if (rowType === 'chords') {
    const guideData = selectedKey ? getKeyGuideData(selectedKey) : null;
    const keyChords = guideData?.allChords || [];

    return (
      <div className="chord-helper-panel">
        {/* Key-specific Diatonic Chords */}
        {keyChords.length > 0 && (
          <div className="chord-helper-key-group" style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="chord-helper-header" style={{ marginBottom: '6px' }}>
              <span className="chord-helper-label" style={{ color: 'var(--color-primary, #6366f1)', fontWeight: 700 }}>
                Key Chords ({selectedKey}):
              </span>
              <span className="chord-helper-hint">Diatonic scale chords</span>
            </div>
            <div className="chord-helper-roots-grid" style={{ flexWrap: 'wrap', gap: '6px' }}>
              {keyChords.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  className="btn btn-secondary btn-sm font-mono-input chord-root-chip"
                  onClick={() => onInsert(`${chord} `)}
                  title={`Insert ${chord}`}
                  style={{ fontWeight: 700, borderColor: 'rgba(99, 102, 241, 0.35)', background: 'rgba(99, 102, 241, 0.12)' }}
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chord-helper-header">
          <span className="chord-helper-label">Quick Chords:</span>
          <span className="chord-helper-hint">Root + Quality</span>
        </div>

        {/* Roots */}
        <div className="chord-helper-roots-grid">
          {MAJOR_KEYS.map((root) => (
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
