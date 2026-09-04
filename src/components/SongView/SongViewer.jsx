import React from 'react';
import SectionViewer from './SectionViewer';
import { Music, Clock, Gauge, FileText, Sliders, Disc3 } from 'lucide-react';
import {
  formatStyleCode,
  formatMainStyleHighlight,
  getStyleNumberCode,
  resolveFullStyle
} from '../../data/songStyles.js';

export default function SongViewer({ transposedSong }) {
  if (!transposedSong) return null;

  const {
    sections = [],
    tempo,
    timeSignature,
    style,
    notes: performanceNotes
  } = transposedSong;

  const fullStyle = resolveFullStyle(style);
  const styleNumberCode = getStyleNumberCode(fullStyle);
  const styleHighlightCode = formatMainStyleHighlight(fullStyle);
  const styleCompactCode = formatMainStyleHighlight(fullStyle, 'compact');
  const styleCodeBreakdown = formatStyleCode(fullStyle);

  const hasOtherMeta = Boolean(tempo || timeSignature || performanceNotes);

  return (
    <div className="song-viewer">
      {/* Top Prominent Main Style Highlight Banner */}
      {fullStyle && (
        <div className="card song-main-style-highlight-card">
          <div className="song-main-style-inner">
            <div className="song-main-style-left">
              <div className="song-main-style-icon-wrapper">
                <Sliders size={22} className="song-main-style-icon" />
              </div>
              <div className="song-main-style-text-group">
                <div className="song-main-style-badge-row">
                  <span className="main-style-pill-tag">MAIN STYLE</span>
                  {fullStyle.category && (
                    <span className="main-style-category-pill">{fullStyle.category}</span>
                  )}
                </div>
                <div className="song-main-style-title-row">
                  {styleNumberCode && (
                    <span className="song-main-style-number-badge" title={`Style Number: ${styleNumberCode}`}>
                      {styleNumberCode}
                    </span>
                  )}
                  <span className="song-main-style-name">
                    {fullStyle.name}
                  </span>
                  <span className="song-main-style-compact-badge" title="Preset Code">
                    {styleCompactCode}
                  </span>
                </div>
              </div>
            </div>

            {styleCodeBreakdown && (
              <div className="song-main-style-right">
                <div className="song-main-style-details">
                  <span className="song-main-style-details-text">
                    {styleCodeBreakdown}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Performance Metadata (Tempo, Time Signature, Performance Notes) */}
      {hasOtherMeta && (
        <div className="card song-meta-summary-card">
          <div className="song-meta-summary-content">
            {tempo && (
              <div className="song-meta-item">
                <Gauge size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Tempo: <strong>{tempo} BPM</strong></span>
              </div>
            )}
            {timeSignature && (
              <div className="song-meta-item">
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Time: <strong>{timeSignature}</strong></span>
              </div>
            )}
            {performanceNotes && (
              <div className="song-meta-item full-width-meta">
                <FileText size={16} style={{ color: 'var(--color-accent-note)', flexShrink: 0 }} />
                <span><em>{performanceNotes}</em></span>
              </div>
            )}
          </div>
        </div>
      )}

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

