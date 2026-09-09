import React, { memo } from 'react';
import RowViewer from './RowViewer';

function SectionViewer({ section }) {
  if (!section) return null;
  const name = typeof section === 'string' ? section : (section.name || 'Section');

  let rows = Array.isArray(section.rows) ? section.rows : [];

  // Fallback for lines format if rows is empty
  if (rows.length === 0 && Array.isArray(section.lines) && section.lines.length > 0) {
    rows = [];
    section.lines.forEach((line, lIdx) => {
      if (!line) return;
      const lineChords = Array.isArray(line.chords)
        ? line.chords.map(c => (typeof c === 'string' ? c : c?.chord || '')).filter(Boolean).join('   ')
        : (line.rawChordLine || line.chords || '');
      const lineLyrics = line.lyrics !== undefined ? line.lyrics : (typeof line === 'string' ? line : '');

      if (lineChords) {
        rows.push({ id: `r_l_${lIdx}_c`, type: 'chords', content: lineChords, displayContent: lineChords });
      }
      if (lineLyrics) {
        rows.push({ id: `r_l_${lIdx}_l`, type: 'lyrics', content: lineLyrics, displayContent: lineLyrics });
      }
    });
  }

  return (
    <div className="song-section-card">
      <div className="section-header">
        <h4 className="section-title">{name}</h4>
      </div>

      <div className="section-rows-container">
        {rows.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem', fontStyle: 'italic' }}>
            Empty section
          </div>
        ) : (
          rows.map((row, index) => (
            <RowViewer key={(row && row.id) || index} row={row} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(SectionViewer);
