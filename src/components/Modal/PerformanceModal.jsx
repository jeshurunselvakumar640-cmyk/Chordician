import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Sliders,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Columns
} from 'lucide-react';
import TransposeBar from '../Transposer/TransposeBar';
import SectionViewer from '../SongView/SectionViewer';
import { formatMainStyleHighlight, formatStyleCode, resolveFullStyle, getStyleNumberCode } from '../../data/songStyles.js';

export default function PerformanceModal({
  isOpen,
  onClose,
  transposedSong,
  onChangeKey,
  setlistSongs = [],
  currentIndex = 0,
  onNextSong,
  onPrevSong
}) {
  const [fontSize, setFontSize] = useState('large'); // 'small', 'normal', 'large', 'xlarge'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1 to 5

  // Layout preference: 'auto', 'single', 'dual'
  const [layoutPreference, setLayoutPreference] = useState(() => {
    try {
      return localStorage.getItem('chordician_perf_layout') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const handleSetLayoutPreference = (pref) => {
    setLayoutPreference(pref);
    try {
      localStorage.setItem('chordician_perf_layout', pref);
    } catch {}
  };

  const scrollContainerRef = useRef(null);
  const contentContainerRef = useRef(null);
  const toolbarRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [measuredHeights, setMeasuredHeights] = useState([]);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollRafRef = useRef(null);

  // Viewport tracking for responsive layout calculation
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (scrollContainerRef.current) {
        setViewportSize({
          width: scrollContainerRef.current.clientWidth || window.innerWidth,
          height: scrollContainerRef.current.clientHeight || window.innerHeight
        });
      } else {
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };

    updateSize();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && scrollContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(scrollContainerRef.current);
    } else {
      window.addEventListener('resize', updateSize);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', updateSize);
    };
  }, [isOpen]);

  // Scroll-aware Collapsing Toolbar (Hides on scroll down, reveals on scroll up or top)
  useEffect(() => {
    if (!isOpen) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    lastScrollTopRef.current = container.scrollTop || 0;
    setIsToolbarVisible(true);

    const handleScroll = () => {
      if (scrollRafRef.current) return;

      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        if (!container) return;
        const currentScrollTop = container.scrollTop;
        const prevScrollTop = lastScrollTopRef.current;
        const delta = currentScrollTop - prevScrollTop;

        // Force visible at the top
        if (currentScrollTop <= 15) {
          setIsToolbarVisible((prev) => (prev ? prev : true));
        } else if (delta > 8 && currentScrollTop > 40) {
          // Scrolling down -> collapse toolbar
          setIsToolbarVisible((prev) => (prev ? false : prev));
        } else if (delta < -8) {
          // Scrolling up -> reveal toolbar
          setIsToolbarVisible((prev) => (!prev ? true : prev));
        }

        lastScrollTopRef.current = currentScrollTop;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [isOpen]);

  // Extract song data
  const {
    title = '',
    artist = '',
    activeKey = 'C',
    originalKey = 'C',
    semitoneDelta = 0,
    sections = [],
    style,
    tempo,
    timeSignature
  } = transposedSong || {};

  // Measure actual rendered DOM section heights without triggering render loops
  useEffect(() => {
    if (!isOpen || !contentContainerRef.current) return;

    const measureSections = () => {
      const container = contentContainerRef.current;
      if (!container) return;
      const sectionEls = container.querySelectorAll('.song-section-card');
      if (sectionEls && sectionEls.length > 0) {
        const heights = Array.from(sectionEls).map((el) => el.getBoundingClientRect().height);
        setMeasuredHeights((prev) => {
          if (prev.length === heights.length && prev.every((h, i) => Math.abs(h - heights[i]) < 2)) {
            return prev; // Identical measurements within 2px tolerance, skip state update to prevent loop
          }
          return heights;
        });
      }
    };

    const raf = requestAnimationFrame(measureSections);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && contentContainerRef.current) {
      resizeObserver = new ResizeObserver(measureSections);
      resizeObserver.observe(contentContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isOpen, sections, fontSize, activeKey, semitoneDelta]);

  const hasSetlist = Array.isArray(setlistSongs) && setlistSongs.length > 1;
  const canGoPrev = hasSetlist && currentIndex > 0 && typeof onPrevSong === 'function';
  const canGoNext = hasSetlist && currentIndex < setlistSongs.length - 1 && typeof onNextSong === 'function';

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

  // Keyboard Shortcuts (Esc to exit, Space to toggle auto-scroll, [ / ] or Left/Right for song nav)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      } else if ((e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) && canGoPrev) {
        e.preventDefault();
        onPrevSong();
      } else if ((e.key === ']' || (e.altKey && e.key === 'ArrowRight')) && canGoNext) {
        e.preventDefault();
        onNextSong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, canGoPrev, canGoNext, onPrevSong, onNextSong]);

  // Auto-scroll loop (Mathematics and Speed Algorithm 100% Intact)
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

  // Touch Gesture Swipe Navigation in Performance Mode
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Must be predominantly horizontal swipe and fast (< 650ms)
    if (deltaTime < 650 && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
      const target = e.target;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target?.tagName) || target?.closest('button') || target?.closest('.perf-control-group')) {
        return;
      }

      if (deltaX < 0 && canGoNext) {
        // Swiped Left -> Next Song
        onNextSong();
      } else if (deltaX > 0 && canGoPrev) {
        // Swiped Right -> Previous Song
        onPrevSong();
      }
    }
  };

  // Section Partitioning for 2-Column Musical Presentation based on measured section heights
  const { col1Sections, col2Sections, canUseDual, totalMeasuredHeight } = useMemo(() => {
    if (!Array.isArray(sections) || sections.length === 0) {
      return { col1Sections: [], col2Sections: [], canUseDual: false, totalMeasuredHeight: 0 };
    }

    if (sections.length <= 1) {
      const h0 = measuredHeights[0] || 0;
      return {
        col1Sections: sections,
        col2Sections: [],
        canUseDual: false,
        totalMeasuredHeight: h0
      };
    }

    // Use actual measured DOM heights if available; fallback to row count weights on initial paint
    const weights = sections.map((section, idx) => {
      if (measuredHeights[idx] && measuredHeights[idx] > 0) {
        return measuredHeights[idx];
      }
      let count = 0;
      if (Array.isArray(section.rows) && section.rows.length > 0) {
        count = section.rows.length;
      } else if (Array.isArray(section.lines) && section.lines.length > 0) {
        count = section.lines.length * 2;
      } else {
        count = 4;
      }
      return (count + 2) * 28;
    });

    if (sections.length === 2) {
      return {
        col1Sections: [sections[0]],
        col2Sections: [sections[1]],
        canUseDual: true,
        totalMeasuredHeight: weights[0] + weights[1] + 12
      };
    }

    // Partition contiguous sections[0..k] and [k+1..N-1] minimizing imbalance
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let bestK = 0;
    let bestDiff = Infinity;
    let runningSum = 0;

    for (let k = 0; k < sections.length - 1; k++) {
      runningSum += weights[k];
      const rightSum = totalWeight - runningSum;
      const diff = Math.abs(runningSum - rightSum);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestK = k;
      }
    }

    return {
      col1Sections: sections.slice(0, bestK + 1),
      col2Sections: sections.slice(bestK + 1),
      canUseDual: true,
      totalMeasuredHeight: totalWeight + ((sections.length - 1) * 12)
    };
  }, [sections, measuredHeights]);

  // Layout Decision: single column vs dual column
  const effectiveLayout = useMemo(() => {
    const isNarrowScreen = viewportSize.width < 768;
    if (isNarrowScreen) {
      return 'single'; // Always single column on narrow mobile screens to maintain readability
    }

    if (!canUseDual) {
      return 'single';
    }

    if (layoutPreference === 'single') {
      return 'single';
    }
    if (layoutPreference === 'dual') {
      return 'dual';
    }

    // Auto mode: compare actual rendered content height vs available viewport height
    const toolbarHeight = toolbarRef.current?.offsetHeight || 60;
    const availableHeight = Math.max(250, viewportSize.height - toolbarHeight - 40);

    // If the song already fits completely on one screen in 1 column, keep single column
    if (totalMeasuredHeight > 0 && totalMeasuredHeight <= availableHeight) {
      return 'single';
    }

    // If 1 column overflows the screen, switch to 2 columns to maximize single-screen visibility
    if (totalMeasuredHeight > availableHeight) {
      return 'dual';
    }

    return 'single';
  }, [viewportSize, canUseDual, layoutPreference, totalMeasuredHeight]);

  if (!isOpen || !transposedSong) return null;

  const resolvedStyle = resolveFullStyle(style);
  const styleName = resolvedStyle?.name || (typeof style === 'string' ? style : style?.name) || '';
  const styleNumber = getStyleNumberCode(style);

  return (
    <div
      className="performance-overlay"
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Edge Touch/Click Hitbox to restore toolbar when hidden */}
      {!isToolbarVisible && (
        <div
          className="perf-toolbar-edge-hitbox"
          onClick={() => setIsToolbarVisible(true)}
          title="Click to reveal toolbar"
          aria-label="Reveal toolbar"
        />
      )}

      {/* Performance Top Sticky Toolbar */}
      <div
        className={`performance-toolbar ${!isToolbarVisible ? 'is-collapsed' : ''}`}
        ref={toolbarRef}
      >
        {/* Left: Title & Key Info */}
        <div className="perf-header-info">
          <div className="perf-title-row">
            <h2 className="perf-song-title">{title}</h2>
          </div>
          <span className="perf-song-subtitle">
            {artist ? `${artist} • ` : ''}Key: <strong style={{ color: 'var(--color-primary)' }}>{activeKey}</strong>
            {tempo && ` • ${tempo} BPM`}
            {timeSignature && ` • ${timeSignature}`}
          </span>
        </div>

        {/* Primary Style Highlight Box for Musician */}
        {styleName && (
          <div
            className="perf-style-highlight-box"
            title={`Style: ${resolvedStyle?.category ? resolvedStyle.category + ' → ' : ''}${styleName} (${formatStyleCode(resolvedStyle || style)})`}
          >
            <div className="perf-style-badge-icon">
              <Sliders size={15} />
            </div>
            <div className="perf-style-badge-body">
              <div className="perf-style-tag-row">
                <span className="perf-style-tag">STYLE</span>
                {styleNumber && (
                  <span className="perf-style-number">
                    {styleNumber.includes('/') ? styleNumber.replace('/', ' / ') : styleNumber}
                  </span>
                )}
              </div>
              <div className="perf-style-name">
                {styleName}
              </div>
            </div>
          </div>
        )}

        {/* Center: Transpose & Font & Layout & Auto-Scroll Controls */}
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
            <Type size={15} style={{ margin: '0 2px', color: 'var(--text-muted)' }} />
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

          {/* Smart Layout Selector (Auto / 1-Col / 2-Col) */}
          <div className="perf-control-group perf-layout-group">
            <Columns size={15} style={{ margin: '0 2px', color: 'var(--text-muted)' }} />
            {[
              { id: 'auto', label: 'Auto' },
              { id: 'single', label: '1-Col' },
              { id: 'dual', label: '2-Col' }
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`btn btn-sm ${layoutPreference === mode.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleSetLayoutPreference(mode.id)}
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                aria-label={`Set layout mode to ${mode.label}`}
                title={
                  mode.id === 'auto'
                    ? 'Auto: Smart fit 1 or 2 columns based on screen height'
                    : mode.id === 'single'
                    ? '1-Col: Force single vertical column'
                    : '2-Col: Force two side-by-side vertical columns'
                }
              >
                {mode.label}
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

          {/* Setlist Previous & Next Song Navigation */}
          {hasSetlist && (
            <div className="perf-control-group perf-setlist-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onPrevSong}
                disabled={!canGoPrev}
                title="Previous song in setlist (Keyboard: [ or Alt+Left)"
                aria-label="Previous song"
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={16} />
                <span className="hide-mobile">Prev</span>
              </button>

              <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 4px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                {currentIndex + 1}/{setlistSongs.length}
              </span>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onNextSong}
                disabled={!canGoNext}
                title="Next song in setlist (Keyboard: ] or Alt+Right)"
                aria-label="Next song"
                style={{ padding: '4px 8px' }}
              >
                <span className="hide-mobile">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
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

      {/* Main Performance Sheet (Scalable Responsive Typography & Smart Columns) */}
      <div
        className={`performance-content perf-font-${fontSize}`}
        ref={contentContainerRef}
        style={{ paddingBottom: hasSetlist ? '80px' : '40px' }}
      >
        {sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Music size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No musical sections to display.</p>
          </div>
        ) : effectiveLayout === 'dual' ? (
          <div className="perf-columns-dual">
            <div className="perf-column perf-column-left">
              {col1Sections.map((section, index) => (
                <SectionViewer key={section.id || `c1_${index}`} section={section} />
              ))}
            </div>
            <div className="perf-column perf-column-right">
              {col2Sections.map((section, index) => (
                <SectionViewer key={section.id || `c2_${index}`} section={section} />
              ))}
            </div>
          </div>
        ) : (
          <div className="perf-column perf-column-single">
            {sections.map((section, index) => (
              <SectionViewer key={section.id || index} section={section} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Setlist Navigator Bar */}
      {hasSetlist && (
        <div className="perf-floating-setlist-bar" style={{
          position: 'fixed',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '30px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 100,
          backdropFilter: 'blur(12px)'
        }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onPrevSong}
            disabled={!canGoPrev}
            style={{ borderRadius: '20px', padding: '5px 12px' }}
            title="Go to previous song in setlist"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            Song {currentIndex + 1} of {setlistSongs.length}
          </span>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNextSong}
            disabled={!canGoNext}
            style={{ borderRadius: '20px', padding: '5px 12px' }}
            title="Go to next song in setlist"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
