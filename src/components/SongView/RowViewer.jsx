import React from 'react';

/**
 * Intelligent whitespace compression for chords and note rows.
 * If a row has excessive spaces (runs of 4 or more spaces), it compresses them to 2-3 spaces
 * to fit smoothly on mobile screens without triggering horizontal sliders.
 */
function cleanRowText(rawText, type) {
  const text = Array.isArray(rawText) ? rawText.join('   ') : String(rawText || '');
  
  if (type === 'chords' || type === 'lead' || type === 'bass') {
    // Compress runs of 4 or more spaces into 3 spaces
    return text.replace(/ {4,}/g, '   ');
  }
  
  return text;
}

export default function RowViewer({ row }) {
  const { type = 'chords', displayContent, content } = row;
  const rawText = displayContent !== undefined ? displayContent : content;
  
  const text = cleanRowText(rawText, type);

  if (!text.trim() && type !== 'lyrics') {
    return null;
  }

  switch (type) {
    case 'chords':
      return (
        <div className="song-row-display row-chords-container">
          <div className="row-chords">{text}</div>
        </div>
      );

    case 'lyrics':
      return (
        <div className="song-row-display row-lyrics-container">
          <div className="row-lyrics">{text || '\u00A0'}</div>
        </div>
      );

    case 'lead':
      return (
        <div className="song-row-display row-lead-container">
          <div className="row-lead">
            <span className="row-type-indicator lead-indicator">LEAD</span>
            <span className="row-lead-text">{text}</span>
          </div>
        </div>
      );

    case 'bass':
      return (
        <div className="song-row-display row-bass-container">
          <div className="row-bass">
            <span className="row-type-indicator bass-indicator">BASS</span>
            <span className="row-bass-text">{text}</span>
          </div>
        </div>
      );

    case 'notes':
      return (
        <div className="song-row-display row-notes-container">
          <div className="row-notes">{text}</div>
        </div>
      );

    case 'custom':
    default:
      return (
        <div className="song-row-display row-custom-container">
          <div className="row-custom">{text}</div>
        </div>
      );
  }
}
