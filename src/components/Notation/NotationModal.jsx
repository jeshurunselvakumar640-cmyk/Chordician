import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  FileText,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { renderSongNotationToSVG, generatePNGDataUrlFromSVG } from '../../engine/notation/staffNotationRenderer.js';
import { getLeadNoteCount } from '../../engine/notation/leadPitchParser.js';

export default function NotationModal({
  song,
  onClose
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const contentRef = useRef(null);

  // Close on Escape key and handle zoom key shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(2.5, prev + 0.15));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel(prev => Math.max(0.5, prev - 0.15));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock background body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const noteCount = useMemo(() => getLeadNoteCount(song), [song]);

  // Generate scalable SVG
  const notationData = useMemo(() => {
    if (!song) return { svg: '', width: 800, height: 400 };
    return renderSongNotationToSVG(song, {
      width: 800,
      showNoteNames
    });
  }, [song, showNoteNames]);

  // Download SVG file
  const handleDownloadSVG = () => {
    try {
      const blob = new Blob([notationData.svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeTitle = (song?.title || 'Vocal_Lead_Sheet').replace(/[^a-zA-Z0-9_\u0B80-\u0BFF\u0900-\u097F-]/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_Vocal_Lead_Sheet.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  };

  // Download high-res PNG file
  const handleDownloadPNG = async () => {
    if (isDownloadingPNG || !song) return;
    setIsDownloadingPNG(true);
    try {
      const highRes = renderSongNotationToSVG(song, {
        width: 1200,
        showNoteNames
      });
      const pngUrl = await generatePNGDataUrlFromSVG(highRes.svg, 2);
      const safeTitle = (song.title || 'Vocal_Lead_Sheet').replace(/[^a-zA-Z0-9_\u0B80-\u0BFF\u0900-\u097F-]/g, '_');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${safeTitle}_Vocal_Lead_Sheet.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate PNG notation:', err);
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  // Print sheet music
  const handlePrint = () => {
    window.print();
  };

  if (!song) return null;

  const songKey = song.activeKey || song.key || song.originalKey;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="notation-modal-dialog"
        style={{
          width: '95%',
          maxWidth: '1100px',
          height: '92vh',
          margin: 'auto',
          backgroundColor: '#111827',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>
                {song.title}
              </h2>
              {songKey && (
                <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                  Key {songKey}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
              Western Vocal Lead Sheet • Chords, Melody & Lyrics ({noteCount} Lead Notes)
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Note Names Toggle */}
            <button
              type="button"
              className={`btn btn-sm ${showNoteNames ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowNoteNames(!showNoteNames)}
              title="Toggle educational note name labels under noteheads"
            >
              <Tag size={14} />
              <span>Note Names: {showNoteNames ? 'ON' : 'OFF'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="btn-group" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-md, 8px)', padding: '2px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
                title="Zoom out (-)"
                style={{ padding: '4px 8px' }}
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0 6px', color: '#e5e7eb', minWidth: '42px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.15))}
                title="Zoom in (+)"
                style={{ padding: '4px 8px' }}
              >
                <ZoomIn size={15} />
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setZoomLevel(1)}
                  title="Reset zoom (0)"
                  style={{ padding: '4px 8px' }}
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>

            {/* Export Buttons */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadSVG}
              title="Download standalone SVG vector file"
            >
              <FileText size={14} />
              <span>SVG</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadPNG}
              disabled={isDownloadingPNG}
              title="Download high-resolution PNG image"
            >
              <ImageIcon size={14} />
              <span>{isDownloadingPNG ? 'Rendering...' : 'PNG'}</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handlePrint}
              title="Print vocal lead sheet"
            >
              <Printer size={15} />
            </button>

            {/* Close Modal */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              title="Close modal (Esc)"
              style={{ color: '#ef4444', marginLeft: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '30px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0b0f19'
          }}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              borderRadius: 'var(--radius-md, 8px)',
              overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: notationData.svg }}
          />
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '10px 24px',
          borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.78rem',
          color: '#9ca3af'
        }}>
          <div>
            Press <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>+</kbd> / <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>-</kbd> to zoom, <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>Esc</kbd> to close.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Lead notation: <code style={{ color: '#818cf8' }}>'</code> = octave higher, <code style={{ color: '#818cf8' }}>2</code> = octave lower (PSR-F51 / PSR-I425)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
