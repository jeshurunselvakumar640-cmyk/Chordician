import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Plus,
  Minus,
  Type,
  Music,
  Sliders
} from 'lucide-react';
import TransposeBar from '../Transposer/TransposeBar';
import SectionViewer from '../SongView/SectionViewer';
import { formatMainStyleHighlight, formatStyleCode } from '../../data/songStyles.js';

export default function PerformanceModal({
  isOpen,
  onClose,
  transposedSong,
  onChangeKey
}) {
  const [fontSize, setFontSize] = useState('large'); // 'small', 'normal', 'large', 'xlarge'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1 to 5

  const scrollContainerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  };

  // Keyboard Shortcuts (Esc to exit, Space to toggle auto-scroll)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll loop
  useEffect(() => {
    if (!isScrolling) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const scrollStep = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollTop += (scrollSpeed * 0.45);

        // Stop when reached bottom
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
          setIsScrolling(false);
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  if (!isOpen || !transposedSong) return null;

  const {
    title,
    artist,
    activeKey,
    originalKey,
    semitoneDelta = 0,
    sections = [],
    style,
    tempo,
    timeSignature
  } = transposedSong;

  return (
    <div className="performance-overlay" ref={scrollContainerRef}>
      {/* Performance Top Sticky Toolbar */}
      <div className="performance-toolbar">
        {/* Left: Title & Key Info */}
        <div className="perf-header-info">
          <div className="perf-title-row">
            <h2 className="perf-song-title">{title}</h2>
            {style?.name && (
              <span
                className="badge badge-style perf-style-badge"
                title={`Style: ${style.category || ''} → ${style.name} (${formatStyleCode(style)})`}
              >
                <Sliders size={11} />
                <span>{formatMainStyleHighlight(style)}</span>
              </span>
            )}
          </div>
          <span className="perf-song-subtitle">
            {artist ? `${artist} • ` : ''}Key: <strong style={{ color: 'var(--color-primary)' }}>{activeKey}</strong>
            {tempo && ` • ${tempo} BPM`}
            {timeSignature && ` • ${timeSignature}`}
          </span>
        </div>

        {/* Center: Transpose & Font & Auto-Scroll Controls */}
        <div className="perf-toolbar-controls">
          <TransposeBar
            originalKey={originalKey}
            activeKey={activeKey}
            semitoneDelta={semitoneDelta}
            onChangeKey={onChangeKey}
            compact={true}
          />

          {/* Font Size Selector */}
          <div className="perf-control-group perf-font-group">
            <Type size={15} style={{ margin: '0 2px', color: '#94a3b8' }} />
            {['small', 'normal', 'large', 'xlarge'].map((size) => (
              <button
                key={size}
                type="button"
                className={`btn btn-sm ${fontSize === size ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFontSize(size)}
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                aria-label={`Set font size to ${size}`}
              >
                {size === 'xlarge' ? 'XL' : size[0].toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auto-Scroll Controls */}
          <div className="perf-control-group perf-scroll-group">
            <button
              type="button"
              className={`btn btn-sm ${isScrolling ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsScrolling(!isScrolling)}
              title="Toggle auto-scroll (Space)"
            >
              {isScrolling ? <Pause size={14} /> : <Play size={14} />}
              <span className="perf-scroll-btn-text">{isScrolling ? 'Pause' : 'Scroll'}</span>
            </button>

            {isScrolling && (
              <div className="perf-speed-controls">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))}
                  disabled={scrollSpeed <= 1}
                  aria-label="Decrease scroll speed"
                >
                  <Minus size={12} />
                </button>
                <span className="perf-speed-label">{scrollSpeed}x</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setScrollSpeed(Math.min(5, scrollSpeed + 1))}
                  disabled={scrollSpeed >= 5}
                  aria-label="Increase scroll speed"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Tools (Fullscreen & Exit) */}
        <div className="perf-toolbar-right">
          <button
            type="button"
            className="btn btn-secondary btn-sm perf-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm perf-exit-btn"
            onClick={onClose}
            title="Exit Performance Mode (Esc)"
            aria-label="Exit performance mode"
          >
            <X size={16} />
            <span className="hide-extra-small">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Performance Sheet (Scalable Responsive Typography) */}
      <div className={`performance-content perf-font-${fontSize}`}>
        {sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <Music size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No musical sections to display.</p>
          </div>
        ) : (
          <div className="perf-sections-grid">
            {sections.map((section, index) => (
              <SectionViewer key={section.id || index} section={section} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
