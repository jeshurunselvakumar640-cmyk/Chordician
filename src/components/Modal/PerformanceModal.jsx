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

function getFormattedScale(keyStr) {
  if (!keyStr) return 'C';
  const cleanKey = String(keyStr).trim();
  
  if (/minor/i.test(cleanKey)) {
    const root = cleanKey.replace(/\s*minor/i, '').trim();
    return root.endsWith('m') ? root : `${root}m`;
  }
  
  if (/major/i.test(cleanKey)) {
    const root = cleanKey.replace(/\s*major/i, '').trim();
    return root;
  }
  
  return cleanKey;
}

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
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

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
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  const hasSetlist = Array.isArray(setlistSongs) && setlistSongs.length > 1;
  const canGoNext = hasSetlist && currentIndex < setlistSongs.length - 1;
  const canGoPrev = hasSetlist && currentIndex > 0;

  const title = transposedSong?.title || '';
  const artist = transposedSong?.artist || '';
  const activeKey = transposedSong?.activeKey || transposedSong?.key || '';
  const originalKey = transposedSong?.key || transposedSong?.originalKey || '';
  const tempo = transposedSong?.tempo;
  const timeSignature = transposedSong?.timeSignature;
  const style = transposedSong?.style;
  const sections = transposedSong?.sections || [];

  const formattedScale = useMemo(() => {
    return getFormattedScale(activeKey || originalKey || 'C');
  }, [activeKey, originalKey]);

  const compactControlText = useMemo(() => {
    const numCode = getStyleNumberCode(style);
    return numCode ? `${numCode} ${formattedScale}` : formattedScale;
  }, [style, formattedScale]);

  // Keyboard Navigation: Esc to close, Arrow keys for font size & setlist navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is interacting with form controls or inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        onNextSong();
      } else if (e.key === 'ArrowLeft' && canGoPrev) {
        onPrevSong();
      } else if (e.key === ' ') {
        // Spacebar toggles autoscroll
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, canGoNext, canGoPrev, onNextSong, onPrevSong]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Measure heights of rendered section elements to optimize 2-column balancing
  useEffect(() => {
    if (!isOpen || !contentContainerRef.current) return;

    // Small delay to ensure DOM layout has computed fonts & styles
    const timer = setTimeout(() => {
      if (!contentContainerRef.current) return;
      const sectionElements = contentContainerRef.current.querySelectorAll('.section-viewer-card');
      const heights = Array.from(sectionElements).map((el) => el.getBoundingClientRect().height);
      setMeasuredHeights(heights);
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, transposedSong?.id, fontSize, viewportSize.width]);

  // Handle Scroll to auto-hide toolbar when scrolling down, auto-show when scrolling up
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;

    const handleScroll = () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(() => {
        const currentScrollTop = container.scrollTop;
        const delta = currentScrollTop - lastScrollTopRef.current;

        if (isScrolling) {
          // Keep toolbar visible during auto-scroll so user can pause or adjust speed
          setIsToolbarVisible(true);
        } else if (currentScrollTop < 50) {
          setIsToolbarVisible(true);
        } else if (delta > 25 && isToolbarVisible) {
          setIsToolbarVisible(false);
        } else if (delta < -15 && !isToolbarVisible) {
          setIsToolbarVisible(true);
        }

        lastScrollTopRef.current = currentScrollTop;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [isOpen, isToolbarVisible, isScrolling]);

  // Smooth Auto-Scroll Handler
  useEffect(() => {
    if (!isScrolling || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    // If near the bottom when user starts scrolling, rewind to top
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
      container.scrollTop = 0;
    }

    let scrollPos = container.scrollTop;
    let lastTime = performance.now();

    const scrollStep = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (deltaTime > 0 && container) {
        // Sync scrollPos if user manually scrolled (wheel, drag, touch)
        if (Math.abs(container.scrollTop - scrollPos) > 4) {
          scrollPos = container.scrollTop;
        }

        // Calculate smooth speed in pixels per frame based on speed setting
        const speedMultiplier = scrollSpeed * 0.6;
        scrollPos += (speedMultiplier * deltaTime) / 16.667;
        container.scrollTop = scrollPos;

        // Auto stop at the very bottom
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

  // Mobile & Desktop Songbook Pointer Swipe Gesture Engine (Identical to SongDetails.jsx)
  const swipeContainerRef = useRef(null);
  const swipeTrackRef = useRef(null);
  const swipeHintRef = useRef(null);
  const swipeHintTextRef = useRef(null);

  const pointerStateRef = useRef({
    isTracking: false,
    isSwiping: false,
    isVerticalScroll: false,
    startX: 0,
    startY: 0,
    currentDx: 0,
    startTime: 0,
    pointerId: null,
    viewportWidth: 360,
    rafId: null,
    isNavigating: false,
    navTimeoutId: null
  });

  // Reset swipe track position when song changes
  useEffect(() => {
    const state = pointerStateRef.current;
    state.isNavigating = false;
    state.isTracking = false;
    state.isSwiping = false;
    if (state.navTimeoutId) clearTimeout(state.navTimeoutId);
    if (state.rafId) cancelAnimationFrame(state.rafId);

    if (swipeTrackRef.current) {
      swipeTrackRef.current.style.transition = 'none';
      swipeTrackRef.current.style.transform = 'translate3d(0, 0, 0)';
      swipeTrackRef.current.style.opacity = '1';
      swipeTrackRef.current.classList.remove('is-dragging');
    }
    if (swipeHintRef.current) {
      swipeHintRef.current.style.opacity = '0';
      swipeHintRef.current.style.transform = 'translateX(-50%) translateY(-8px) scale(0.95)';
    }
  }, [transposedSong?.id, title, currentIndex]);

  // Clean up animation frame / timers on unmount
  useEffect(() => {
    return () => {
      const state = pointerStateRef.current;
      if (state.navTimeoutId) clearTimeout(state.navTimeoutId);
      if (state.rafId) cancelAnimationFrame(state.rafId);
    };
  }, []);

  const nextSongItem = hasSetlist && currentIndex < setlistSongs.length - 1 ? setlistSongs[currentIndex + 1] : null;
  const prevSongItem = hasSetlist && currentIndex > 0 ? setlistSongs[currentIndex - 1] : null;

  const handlePointerDown = (e) => {
    const state = pointerStateRef.current;
    if (state.isNavigating) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target;
    if (
      target &&
      (target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('.perf-control-group') ||
        target.closest('.perf-toolbar-right'))
    ) {
      return;
    }
    state.isTracking = true;
    state.isSwiping = false;
    state.isVerticalScroll = false;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.currentDx = 0;
    state.startTime = Date.now();
    state.pointerId = e.pointerId;
    state.viewportWidth = window.innerWidth || 360;
  };

  const handlePointerMove = (e) => {
    const state = pointerStateRef.current;
    if (!state.isTracking || state.isVerticalScroll || state.isNavigating) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    // Immediately yield to native vertical scrolling if vertical movement dominates
    if (Math.abs(dy) > Math.abs(dx)) {
      state.isVerticalScroll = true;
      state.isTracking = false;
      return;
    }

    if (!state.isSwiping) {
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 15) {
        // Yield to card horizontal scrolling if card can scroll horizontally in swipe direction
        const sectionCard = e.target && e.target.closest('.song-section-card');
        if (sectionCard && sectionCard.scrollWidth > sectionCard.clientWidth + 5) {
          const canScrollRight = sectionCard.scrollLeft < (sectionCard.scrollWidth - sectionCard.clientWidth - 4);
          const canScrollLeft = sectionCard.scrollLeft > 4;
          if ((dx < 0 && canScrollRight) || (dx > 0 && canScrollLeft)) {
            state.isVerticalScroll = true;
            state.isTracking = false;
            return;
          }
        }

        state.isSwiping = true;
        try {
          if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        } catch {}
      }
    }

    if (state.isSwiping && swipeTrackRef.current) {
      let offset = dx;
      if (dx > 0 && !canGoPrev) {
        offset = dx * 0.22;
      } else if (dx < 0 && !canGoNext) {
        offset = dx * 0.22;
      }
      state.currentDx = offset;

      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(() => {
        if (!state.isTracking || !swipeTrackRef.current) return;
        swipeTrackRef.current.style.transition = 'none';
        swipeTrackRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
        swipeTrackRef.current.classList.add('is-dragging');

        if (swipeHintRef.current && swipeHintTextRef.current) {
          if (Math.abs(offset) > 18) {
            swipeHintRef.current.style.opacity = '1';
            swipeHintRef.current.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            if (offset < 0) {
              swipeHintTextRef.current.textContent = canGoNext
                ? (nextSongItem?.title ? `Next: ${nextSongItem.title}` : 'Next Song')
                : 'Last Song';
            } else {
              swipeHintTextRef.current.textContent = canGoPrev
                ? (prevSongItem?.title ? `Previous: ${prevSongItem.title}` : 'Previous Song')
                : 'First Song';
            }
          } else {
            swipeHintRef.current.style.opacity = '0';
            swipeHintRef.current.style.transform = 'translateX(-50%) translateY(-8px) scale(0.95)';
          }
        }
      });
    }
  };

  const handlePointerUpOrCancel = (e) => {
    const state = pointerStateRef.current;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    if (!state.isTracking) return;
    state.isTracking = false;

    try {
      if (e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (swipeHintRef.current) {
      swipeHintRef.current.style.opacity = '0';
      swipeHintRef.current.style.transform = 'translateX(-50%) translateY(-8px) scale(0.95)';
    }

    if (state.isSwiping && swipeTrackRef.current) {
      swipeTrackRef.current.classList.remove('is-dragging');
      const deltaTime = Math.max(1, Date.now() - state.startTime);
      const velocity = Math.abs(state.currentDx) / deltaTime;
      const distanceThreshold = state.viewportWidth * 0.22;
      const isFastFlick = velocity > 0.45 && Math.abs(state.currentDx) > 35;
      const isDistanceMet = Math.abs(state.currentDx) > distanceThreshold;

      if ((isDistanceMet || isFastFlick) && !state.isNavigating) {
        if (state.currentDx < 0 && canGoNext) {
          state.isNavigating = true;
          state.isTracking = false;
          state.isSwiping = false;
          state.currentDx = 0;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          if (state.navTimeoutId) clearTimeout(state.navTimeoutId);

          swipeTrackRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
          swipeTrackRef.current.style.transform = 'translate3d(-100vw, 0, 0)';
          swipeTrackRef.current.style.opacity = '0.3';
          onNextSong();

          state.navTimeoutId = setTimeout(() => {
            state.isNavigating = false;
            if (swipeTrackRef.current) {
              swipeTrackRef.current.style.transition = 'none';
              swipeTrackRef.current.style.transform = 'translate3d(0, 0, 0)';
              swipeTrackRef.current.style.opacity = '1';
            }
          }, 350);
          return;
        } else if (state.currentDx > 0 && canGoPrev) {
          state.isNavigating = true;
          state.isTracking = false;
          state.isSwiping = false;
          state.currentDx = 0;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          if (state.navTimeoutId) clearTimeout(state.navTimeoutId);

          swipeTrackRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
          swipeTrackRef.current.style.transform = 'translate3d(100vw, 0, 0)';
          swipeTrackRef.current.style.opacity = '0.3';
          onPrevSong();

          state.navTimeoutId = setTimeout(() => {
            state.isNavigating = false;
            if (swipeTrackRef.current) {
              swipeTrackRef.current.style.transition = 'none';
              swipeTrackRef.current.style.transform = 'translate3d(0, 0, 0)';
              swipeTrackRef.current.style.opacity = '1';
            }
          }, 350);
          return;
        }
      }

      // Snap back smoothly
      swipeTrackRef.current.style.transition = 'transform 200ms cubic-bezier(0.2, 0, 0, 1), opacity 200ms ease';
      swipeTrackRef.current.style.transform = 'translate3d(0, 0, 0)';
      swipeTrackRef.current.style.opacity = '1';
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

    // Calculate section height estimates if DOM measurement not finished yet
    const getEstimate = (sec) => {
      const lineCount = (sec.content || '').split('\n').filter(Boolean).length;
      return 40 + Math.max(1, lineCount) * 44;
    };

    const sectionHeights = sections.map((sec, i) => measuredHeights[i] || getEstimate(sec));
    const totalH = sectionHeights.reduce((sum, h) => sum + h, 0);

    // Find partition index that minimizes column height difference
    let bestSplit = 1;
    let minDiff = Infinity;
    let currentLeftSum = 0;

    for (let i = 0; i < sections.length - 1; i++) {
      currentLeftSum += sectionHeights[i];
      const rightSum = totalH - currentLeftSum;
      const diff = Math.abs(currentLeftSum - rightSum);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = i + 1;
      }
    }

    const c1 = sections.slice(0, bestSplit);
    const c2 = sections.slice(bestSplit);

    // Dual column requires desktop viewport (> 860px) and sufficient total content
    const dualEligible = viewportSize.width >= 860 && totalH > 380;

    return {
      col1Sections: c1,
      col2Sections: c2,
      canUseDual: dualEligible,
      totalMeasuredHeight: totalH
    };
  }, [sections, measuredHeights, viewportSize.width]);

  // Determine effective layout mode based on preference & eligibility
  const effectiveLayout = useMemo(() => {
    if (layoutPreference === 'single') return 'single';
    if (layoutPreference === 'dual') return canUseDual ? 'dual' : 'single';
    if (isScrolling) return 'single'; // Continuous vertical scroll while auto-scrolling

    // Auto mode: Use dual column on widescreen if eligible and content fits screen nicely
    if (canUseDual) {
      const availableHeight = viewportSize.height - 120;
      const halfHeight = totalMeasuredHeight / 2;

      // If split column height fits viewport reasonably well, use dual column
      if (halfHeight <= availableHeight * 1.25) {
        return 'dual';
      }
    }

    return 'single';
  }, [viewportSize, canUseDual, layoutPreference, totalMeasuredHeight, isScrolling]);

  if (!isOpen || !transposedSong) return null;

  const resolvedStyle = resolveFullStyle(style);
  const styleName = resolvedStyle?.name || (typeof style === 'string' ? style : style?.name) || '';
  const styleNumber = getStyleNumberCode(style);

  return (
    <div
      className="performance-overlay"
      ref={scrollContainerRef}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-medium) transparent',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <style>{`
        .performance-overlay::-webkit-scrollbar {
          width: 8px;
        }
        .performance-overlay::-webkit-scrollbar-track {
          background: transparent;
        }
        .performance-overlay::-webkit-scrollbar-thumb {
          background: var(--border-medium);
          border-radius: 4px;
        }
        .performance-overlay::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary);
        }
        .perf-toolbar-edge-hitbox {
          right: 18px !important;
        }
        .perf-collapsed-trigger-wrapper {
          right: 20px !important;
        }
        .performance-overlay .song-swipe-viewport {
          overflow: visible !important;
          flex-shrink: 0 !important;
          min-height: max-content !important;
        }
      `}</style>
      {/* Top Edge Touch/Click Hitbox to restore toolbar when hidden */}
      {!isToolbarVisible && (
        <div
          className="perf-toolbar-edge-hitbox"
          onClick={() => setIsToolbarVisible(true)}
          title="Click to reveal toolbar"
          aria-label="Reveal toolbar"
        />
      )}

      {/* Collapsed Top-Right Dedicated Trigger OR Full Sticky Toolbar */}
      {isDetailsCollapsed ? (
        <div className="perf-collapsed-trigger-wrapper">
          <button
            type="button"
            className="perf-compact-details-btn"
            onClick={() => setIsDetailsCollapsed(false)}
            title="Expand Song Details"
            aria-label="Expand Song Details"
          >
            {compactControlText}
          </button>
        </div>
      ) : (
        <div
          className={`performance-toolbar ${!isToolbarVisible ? 'is-collapsed' : ''}`}
          ref={toolbarRef}
        >
          {/* Full Details Panel (Visible when NOT collapsed) */}
          <div className="perf-details-panel">
            <div className="perf-details-main">
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

              {styleName && (
                <div
                  className="perf-style-highlight-box"
                  title={`Style: ${resolvedStyle?.category ? resolvedStyle.category + ' → ' : ''}${styleName} (${formatStyleCode(resolvedStyle || style)}) • Style number is according to Yamaha PSR I425 & Yamaha PSR F51`}
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
            </div>

            <button
              type="button"
              className="perf-details-collapse-btn"
              onClick={() => setIsDetailsCollapsed(true)}
              title="Collapse Song Details"
              aria-label="Collapse Song Details"
            >
              <X size={14} />
            </button>
          </div>

          {/* Center: Transpose & Font & Layout & Auto-Scroll Controls */}
          <div className="perf-toolbar-controls">
            {/* Key Transpose Control */}
            <div className="perf-control-group">
              <TransposeBar
                originalKey={originalKey}
                activeKey={activeKey}
                onChangeKey={onChangeKey}
                size="sm"
              />
            </div>

            {/* Scalable Typography Font Control */}
            <div className="perf-control-group" title="Adjust lyrics & chords font size">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const sizes = ['small', 'normal', 'large', 'xlarge'];
                  const idx = sizes.indexOf(fontSize);
                  if (idx > 0) setFontSize(sizes[idx - 1]);
                }}
                disabled={fontSize === 'small'}
                title="Decrease font size"
              >
                <Minus size={13} />
              </button>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0 4px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)'
                }}
              >
                Font: {fontSize}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const sizes = ['small', 'normal', 'large', 'xlarge'];
                  const idx = sizes.indexOf(fontSize);
                  if (idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
                }}
                disabled={fontSize === 'xlarge'}
                title="Increase font size"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Layout Preference Selector (Auto / Single / Dual Column) */}
            <div className="perf-control-group" title="Presentation layout preference">
              <button
                type="button"
                className={`btn btn-sm ${layoutPreference === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSetLayoutPreference('auto')}
                title="Auto: Select optimal layout based on screen width"
              >
                Auto
              </button>
              <button
                type="button"
                className={`btn btn-sm ${layoutPreference === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSetLayoutPreference('single')}
                title="Single Column: Vertical continuous scroll"
              >
                1-Col
              </button>
              <button
                type="button"
                className={`btn btn-sm ${layoutPreference === 'dual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSetLayoutPreference('dual')}
                disabled={!canUseDual && layoutPreference !== 'dual'}
                title={canUseDual ? 'Dual Column: 2-Column presentation mode' : 'Dual column requires wider screen (> 860px)'}
              >
                2-Col
              </button>
            </div>

            {/* Auto-Scroll Toggle & Speed Controller */}
            <div className="perf-control-group">
              <button
                type="button"
                className={`btn btn-sm ${isScrolling ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsScrolling(!isScrolling)}
                title={isScrolling ? 'Pause Auto-Scroll (Space)' : 'Start Auto-Scroll (Space)'}
              >
                {isScrolling ? <Pause size={14} /> : <Play size={14} />}
                <span>{isScrolling ? 'Pause' : 'Scroll'}</span>
              </button>

              {isScrolling && (
                <div className="perf-speed-controls">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setScrollSpeed((s) => Math.max(1, s - 1))}
                    disabled={scrollSpeed <= 1}
                    title="Slower scroll speed"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="perf-speed-label">{scrollSpeed}x</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setScrollSpeed((s) => Math.min(5, s + 1))}
                    disabled={scrollSpeed >= 5}
                    title="Faster scroll speed"
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
      )}

      {/* Main Performance Sheet Viewport with Swipe Gesture Track */}
      <div
        className="song-swipe-viewport"
        ref={swipeContainerRef}
        style={{
          overflow: 'visible',
          flexShrink: 0,
          minHeight: 'max-content'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      >
        <div className="song-swipe-hint-badge" ref={swipeHintRef} aria-hidden="true">
          <span ref={swipeHintTextRef} />
        </div>

        <div className="song-swipe-track" ref={swipeTrackRef}>
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

            {/* Keyboard Style Reference Note */}
            <div
              style={{
                marginTop: '28px',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                opacity: 0.85,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div>🎹 Note: Style number is according to <strong>Yamaha PSR I425</strong> & <strong>Yamaha PSR F51</strong>.</div>
              <div>Leads with ( ' ) are higher octave and leads with 2 are lower octave and while using transpose it may change.</div>
            </div>
          </div>
        </div>
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
