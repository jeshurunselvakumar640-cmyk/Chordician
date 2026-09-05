import React from 'react';
import SectionViewer from './SectionViewer';
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
    </div>
  );
}


