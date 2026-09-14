import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getKeyGuideData } from '../../data/keyChordFamilies.js';

export default function KeyGuide({ selectedKey }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!selectedKey) return null;

  const guideData = getKeyGuideData(selectedKey);
  if (!guideData) return null;

  return (
    <div className="card key-guide-card" id="key-guide-container">
      {/* Header & Toggle */}
      <button
        type="button"
        className="key-guide-header-btn"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="key-guide-content"
      >
        <div className="key-guide-header-title">
          <span className="key-guide-icon" aria-hidden="true">🎼</span>
          <span className="key-guide-title-text">{guideData.label} — Key Guide</span>
        </div>
        <div className="key-guide-toggle-icon">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="key-guide-body" id="key-guide-content">
          {/* Scale Section */}
          <div className="key-guide-section">
            <div className="key-guide-section-heading">Scale</div>
            <div className="key-guide-scale-row">
              {guideData.scale.map((note, idx) => (
                <React.Fragment key={`${note}-${idx}`}>
                  <span className="key-guide-scale-note">{note}</span>
                  {idx < guideData.scale.length - 1 && (
                    <span className="key-guide-dot" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Core, Relative, and Diminished Chord Groups */}
          <div className="key-guide-groups-grid">
            {/* Core Chords */}
            <div className="key-guide-group-col">
              <div className="key-guide-section-heading">Core Chords</div>
              <table className="key-guide-table">
                <thead>
                  <tr>
                    <th scope="col">Chord</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {guideData.coreChords.map(({ chord, notes }) => (
                    <tr key={chord}>
                      <td className="key-guide-chord-cell">
                        <span className="key-guide-chord-badge">{chord}</span>
                      </td>
                      <td className="key-guide-notes-cell">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Relative Chords */}
            <div className="key-guide-group-col">
              <div className="key-guide-section-heading">Relative Chords</div>
              <table className="key-guide-table">
                <thead>
                  <tr>
                    <th scope="col">Chord</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {guideData.relativeChords.map(({ chord, notes }) => (
                    <tr key={chord}>
                      <td className="key-guide-chord-cell">
                        <span className="key-guide-chord-badge">{chord}</span>
                      </td>
                      <td className="key-guide-notes-cell">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diminished Chord */}
            {guideData.dimChord && (
              <div className="key-guide-group-col">
                <div className="key-guide-section-heading">Diminished</div>
                <table className="key-guide-table">
                  <thead>
                    <tr>
                      <th scope="col">Chord</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="key-guide-chord-cell">
                        <span className="key-guide-chord-badge key-guide-dim-badge">
                          {guideData.dimChord.chord}
                        </span>
                      </td>
                      <td className="key-guide-notes-cell">{guideData.dimChord.notes}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Chords Section */}
          <div className="key-guide-section key-guide-all-chords-section">
            <div className="key-guide-section-heading">All Chords</div>
            <div className="key-guide-all-chords-row">
              {guideData.allChords.map((chord, idx) => (
                <React.Fragment key={`${chord}-${idx}`}>
                  <span className="key-guide-all-chord-badge">{chord}</span>
                  {idx < guideData.allChords.length - 1 && (
                    <span className="key-guide-dot" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
