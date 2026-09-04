import React from 'react';
import RowViewer from './RowViewer';

export default function SectionViewer({ section }) {
  const { name = 'Section', rows = [] } = section;

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
            <RowViewer key={row.id || index} row={row} />
          ))
        )}
      </div>
    </div>
  );
}
