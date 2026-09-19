import React from 'react';
import SectionViewer from './SectionViewer';
import SongChordsAndScale from './SongChordsAndScale';
import { Music } from 'lucide-react';

export default function SongViewer({ transposedSong, zoomLevel = 100 }) {
  if (!transposedSong) return null;

  const { sections = [] } = transposedSong;
  const zoomScale = zoomLevel / 100;

  return (
    <div
      className="song-viewer"
      style={{
        '--songbook-zoom': zoomScale,
        '--song-zoom': zoomScale
      }}
    >
      {/* Lyrics & Chords Sections */}
      {sections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Music size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p>This song does not have any sections or chords yet.</p>
        </div>
      ) : (
        sections.map((section, index) => (
          <SectionViewer key={section.id || index} section={section} />
        ))
      )}

      {/* Dynamic Chords and Scale Notes Breakdown */}
      <SongChordsAndScale transposedSong={transposedSong} />

      {/* Keyboard Style Reference Note */}
      <div
        className="song-style-reference-note"
        style={{
          marginTop: '20px',
          padding: '10px 16px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          lineHeight: '1.4'
        }}
      >
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎹</span>
        <span>
          <strong>Note:</strong> Style number is according to <strong>Yamaha PSR I425</strong> & <strong>Yamaha PSR F51</strong>.
        </span>
      </div>
    </div>
  );
}


