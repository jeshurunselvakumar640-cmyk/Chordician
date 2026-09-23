import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Edit2,
  Trash2,
  Maximize2,
  Play,
  Printer,
  Music,
  Sliders,
  Clock,
  Gauge,
  FileText,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Share2,
  Eye,
  Crown,
  Wine,
  Mail,
  FileMusic
} from 'lucide-react';
import { getSongById } from '../firebase/songs.js';
import { transposeSong } from '../services/transposer.js';
import { formatStyleCode, formatMainStyleHighlight, resolveFullStyle, getStyleNumberCode } from '../data/songStyles.js';
import { useToast } from '../context/ToastContext.jsx';
import { useThisSunday } from '../context/ThisSundayContext.jsx';
import { useCommunion } from '../context/CommunionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAppMode } from '../context/AppModeContext.jsx';
import KeyBadge from '../components/UI/KeyBadge';
import TransposeBar from '../components/Transposer/TransposeBar';
import SongViewer from '../components/SongView/SongViewer';
import PerformanceModal from '../components/Modal/PerformanceModal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import ShareModal from '../components/Modal/ShareModal';
import ContactModal from '../components/Modal/ContactModal';
import NotationModal from '../components/Notation/NotationModal';
import { getLeadNoteCount } from '../engine/notation/leadPitchParser.js';
import ErrorBoundary from '../components/UI/ErrorBoundary';
import { SongDetailsSkeleton } from '../components/UI/SkeletonLoader';

export default function SongDetails({
  cachedSongs = [],
  onToggleFavorite,
  onDeleteSong
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setAppMode } = useAppMode();
  const { showToast } = useToast();
  const { canEdit, canEditSong } = useAuth();

  const fromLyricalParam = searchParams.get('fromLyrical') === 'true' || Boolean(location.state?.fromLyrical);
  const lyricalSongId = searchParams.get('lyricalSongId') || location.state?.lyricalSongId || (typeof window !== 'undefined' ? sessionStorage.getItem('chordician_return_to_lyrical') : null);
  const isFromLyrical = Boolean(fromLyricalParam || (lyricalSongId && (typeof window !== 'undefined' && sessionStorage.getItem('chordician_return_to_lyrical'))));

  const handleBackNavigation = useCallback(() => {
    if (isFromLyrical && lyricalSongId) {
      try {
        sessionStorage.removeItem('chordician_return_to_lyrical');
      } catch {}
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', `/song/${lyricalSongId}`);
      }
      if (setAppMode) {
        setAppMode('lyrical');
      }
    } else {
      navigate('/songs');
    }
  }, [isFromLyrical, lyricalSongId, setAppMode, navigate]);

  const [song, setSong] = useState(() => {
    return (Array.isArray(cachedSongs) ? cachedSongs.find((s) => s && s.id === id) : null) || null;
  });
  const [isLoading, setIsLoading] = useState(!song);
  const [error, setError] = useState(null);

  const [activeKey, setActiveKey] = useState(song?.originalKey || 'C');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalTab, setShareModalTab] = useState('details');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isNotationModalOpen, setIsNotationModalOpen] = useState(false);

  // Zoom Level state for songbook view mode (persisted to localStorage)
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('chordician_songbook_zoom');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 60 && parsed <= 200) {
          return parsed;
        }
      }
    } catch (e) {}
    return 100;
  });

  const { 
    isInThisSunday, 
    toggleSong, 
    getAdjacentSongs, 
    serviceDate, 
    formatServiceDate 
  } = useThisSunday();

  const {
    isInCommunion,
    toggleSong: toggleCommunionSong
  } = useCommunion();

  const isSelectedForSunday = song ? isInThisSunday(song.id) : false;
  const isSelectedForCommunion = song ? isInCommunion(song.id) : false;
  const adjacentInfo = useMemo(() => {
    return id ? getAdjacentSongs(id, cachedSongs || []) : null;
  }, [id, getAdjacentSongs, cachedSongs]);
  const inSundaySetlist = Boolean(adjacentInfo && adjacentInfo.currentIndex !== -1);

  // General library navigation fallback when not in Sunday setlist
  const libraryIndex = useMemo(() => {
    return Array.isArray(cachedSongs) ? cachedSongs.findIndex((s) => s && s.id === id) : -1;
  }, [cachedSongs, id]);

  const nextSong = useMemo(() => {
    if (adjacentInfo?.nextSong) return adjacentInfo.nextSong;
    if (Array.isArray(cachedSongs) && libraryIndex >= 0 && libraryIndex < cachedSongs.length - 1) {
      return cachedSongs[libraryIndex + 1] || null;
    }
    return null;
  }, [adjacentInfo, libraryIndex, cachedSongs]);

  const prevSong = useMemo(() => {
    if (adjacentInfo?.prevSong) return adjacentInfo.prevSong;
    if (Array.isArray(cachedSongs) && libraryIndex > 0) {
      return cachedSongs[libraryIndex - 1] || null;
    }
    return null;
  }, [adjacentInfo, libraryIndex, cachedSongs]);

  const handleNextSong = useCallback(() => {
    if (nextSong) {
      navigate(`/songs/${nextSong.id}`);
      showToast(`Next: ${nextSong.title}`, 'info', 1200);
    } else {
      showToast('You have reached the last song', 'info', 1200);
    }
  }, [nextSong, navigate, showToast]);

  const handlePrevSong = useCallback(() => {
    if (prevSong) {
      navigate(`/songs/${prevSong.id}`);
      showToast(`Previous: ${prevSong.title}`, 'info', 1200);
    } else {
      showToast('You are at the first song', 'info', 1200);
    }
  }, [prevSong, navigate, showToast]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.min(160, prev + 10);
      try {
        localStorage.setItem('chordician_songbook_zoom', String(next));
      } catch (e) {}
      showToast(`Zoom: ${next}%`, 'info', 1000);
      return next;
    });
  }, [showToast]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(70, prev - 10);
      try {
        localStorage.setItem('chordician_songbook_zoom', String(next));
      } catch (e) {}
      showToast(`Zoom: ${next}%`, 'info', 1000);
      return next;
    });
  }, [showToast]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(100);
    try {
      localStorage.setItem('chordician_songbook_zoom', '100');
    } catch (e) {}
    showToast('Zoom reset to 100%', 'info', 1000);
  }, [showToast]);

  // Keyboard zoom shortcuts (+ to zoom in, - to zoom out, 0 to reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return;
      }
      if ((e.key === '=' || e.key === '+') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.key === '-' || e.key === '_') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        handlePrevSong();
      } else if (e.key === ']' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        handleNextSong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom, handleNextSong, handlePrevSong]);

  // Immediately hydrate from cachedSongs when id or cachedSongs changes
  useEffect(() => {
    if (!id || !Array.isArray(cachedSongs)) return;
    const cached = cachedSongs.find((s) => s && s.id === id);
    if (cached) {
      setSong(cached);
      setActiveKey(cached.originalKey || 'C');
      setIsLoading(false);
    }
  }, [id, cachedSongs]);

  // Fetch complete song data from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadSong() {
      if (!id) return;
      const hasCached = Array.isArray(cachedSongs) && cachedSongs.some((s) => s && s.id === id);
      if (!hasCached) {
        setIsLoading(true);
      }
      setError(null);

      const res = await getSongById(id);
      if (!isMounted) return;

      if (res.error) {
        setError(res.error);
        showToast(res.error, 'error');
      } else if (res.data) {
        const cached = Array.isArray(cachedSongs) ? cachedSongs.find((s) => s && s.id === id) : null;
        let fav = cached ? Boolean(cached.favorite) : Boolean(res.data.favorite);
        if (!fav) {
          try {
            const raw = localStorage.getItem('chordician_user_favorites');
            const favs = raw ? JSON.parse(raw) : [];
            if (Array.isArray(favs) && favs.includes(id)) {
              fav = true;
            }
          } catch {}
        }
        setSong({ ...res.data, favorite: fav });
        setActiveKey(res.data.originalKey || 'C');
      }
      setIsLoading(false);
    }

    loadSong();

    return () => {
      isMounted = false;
    };
  }, [id, cachedSongs, showToast]);

  // Keep activeKey in sync when song is first loaded
  useEffect(() => {
    if (song?.originalKey && !activeKey) {
      setActiveKey(song.originalKey);
    }
  }, [song, activeKey]);

  // Derive favorite status from cachedSongs, active song, or localStorage
  const isFavorite = useMemo(() => {
    if (Array.isArray(cachedSongs) && cachedSongs.length > 0) {
      const cached = cachedSongs.find((s) => s && s.id === id);
      if (cached && typeof cached.favorite === 'boolean') {
        return cached.favorite;
      }
    }
    if (song && typeof song.favorite === 'boolean') {
      return song.favorite;
    }
    try {
      const raw = localStorage.getItem('chordician_user_favorites');
      const favs = raw ? JSON.parse(raw) : [];
      if (Array.isArray(favs)) {
        return favs.includes(id);
      }
    } catch {}
    return false;
  }, [cachedSongs, id, song]);

  // Dynamically Transposed Song Model (Pure calculation - does not mutate original)
  const transposedSong = useMemo(() => {
    if (!song) return null;
    return transposeSong(song, activeKey || song.originalKey || 'C');
  }, [song, activeKey]);

  // Mobile Songbook Swipe Gesture (Physical finger tracking with transition lock & RAF)
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

  const [isHeartPopping, setIsHeartPopping] = useState(false);

  // Reset swipe track position and unlock gesture when route/song changes
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
  }, [id]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      const state = pointerStateRef.current;
      if (state.navTimeoutId) clearTimeout(state.navTimeoutId);
      if (state.rafId) cancelAnimationFrame(state.rafId);
    };
  }, []);

  const handlePointerDown = (e) => {
    const state = pointerStateRef.current;
    if (state.isNavigating) return; // Locked during active route transition
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target;
    if (target && (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('.modal-backdrop'))) {
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

    if (!state.isSwiping) {
      // Protect vertical scrolling
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dy) > 8) {
        state.isVerticalScroll = true;
        return;
      }
      // Activate horizontal swipe
      if (Math.abs(dx) > Math.abs(dy) * 1.35 && Math.abs(dx) > 10) {
        state.isSwiping = true;
        try {
          if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        } catch {}
      }
    }

    if (state.isSwiping && swipeTrackRef.current) {
      // Elastic resistance at boundaries
      let offset = dx;
      if (dx > 0 && !prevSong) {
        offset = dx * 0.22;
      } else if (dx < 0 && !nextSong) {
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
              swipeHintTextRef.current.textContent = nextSong ? `Next: ${nextSong.title}` : 'Last Song';
            } else {
              swipeHintTextRef.current.textContent = prevSong ? `Previous: ${prevSong.title}` : 'First Song';
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
        if (state.currentDx < 0 && nextSong) {
          state.isNavigating = true;
          state.isTracking = false;
          state.isSwiping = false;
          state.currentDx = 0;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          if (state.navTimeoutId) clearTimeout(state.navTimeoutId);

          swipeTrackRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
          swipeTrackRef.current.style.transform = 'translate3d(-100vw, 0, 0)';
          swipeTrackRef.current.style.opacity = '0.3';
          handleNextSong();

          // Safety unlock in case route doesn't unmount
          state.navTimeoutId = setTimeout(() => {
            state.isNavigating = false;
            if (swipeTrackRef.current) {
              swipeTrackRef.current.style.transition = 'none';
              swipeTrackRef.current.style.transform = 'translate3d(0, 0, 0)';
              swipeTrackRef.current.style.opacity = '1';
            }
          }, 350);
          return;
        } else if (state.currentDx > 0 && prevSong) {
          state.isNavigating = true;
          state.isTracking = false;
          state.isSwiping = false;
          state.currentDx = 0;
          if (state.rafId) cancelAnimationFrame(state.rafId);
          if (state.navTimeoutId) clearTimeout(state.navTimeoutId);

          swipeTrackRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
          swipeTrackRef.current.style.transform = 'translate3d(100vw, 0, 0)';
          swipeTrackRef.current.style.opacity = '0.3';
          handlePrevSong();

          // Safety unlock in case route doesn't unmount
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

  const handleFavoriteClick = async () => {
    if (!id) return;
    const newStatus = !isFavorite;
    setIsHeartPopping(true);
    setTimeout(() => setIsHeartPopping(false), 240);
    setSong((prev) => (prev ? { ...prev, favorite: newStatus } : prev));
    if (onToggleFavorite) {
      await onToggleFavorite(id, !newStatus);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!song) return;
    setIsDeleting(true);
    if (onDeleteSong) {
      const success = await onDeleteSong(song.id);
      if (success) {
        navigate('/songs');
      }
    }
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  const handlePrint = () => {
    setShareModalTab('pdf');
    setIsShareModalOpen(true);
  };

  if (isLoading) {
    return <SongDetailsSkeleton />;
  }

  if (error || !song) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Music size={48} style={{ margin: '0 auto 16px', color: 'var(--color-danger)' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Song Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          {error || 'The song you requested does not exist or has been removed.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBackNavigation}
          >
            <ArrowLeft size={16} />
            <span>{isFromLyrical ? 'Back to Lyrics' : 'Return to Songs Library'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsContactOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
              border: 'none'
            }}
          >
            <Mail size={16} />
            <span>Contact Jeshurun to Add Song</span>
          </button>
        </div>

        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          initialType="Song Request"
        />
      </div>
    );
  }

  const { title, secondaryTitle, artist, originalKey, category, style, favorite } = song;
  const isTransposed = activeKey !== originalKey;
  const userCanEdit = song && canEditSong ? canEditSong(song) : canEdit;

  const resolvedStyle = resolveFullStyle(style);
  const styleName = resolvedStyle?.name || (typeof style === 'string' ? style : style?.name) || '';
  const styleNumber = getStyleNumberCode(style);
  const creatorDisplayName = (song.createdByName || song.createdBy || 'Jeshurun Selvakumar').replace(/\s*\([Oo]wner\)/g, '').trim();

  return (
    <div className="song-details-page">
      {/* Top Navigation & Action Row */}
      <div className="song-details-top-bar">
        <button
          type="button"
          className="btn btn-secondary btn-icon-sm"
          onClick={handleBackNavigation}
          aria-label={isFromLyrical ? 'Back to Lyrics' : 'Back to song library'}
          title={isFromLyrical ? 'Back to Lyrics' : 'Back to song library'}
        >
          <ArrowLeft size={18} />
          <span className="hide-mobile">{isFromLyrical ? 'Back to Lyrics' : 'All Songs'}</span>
        </button>

        <div className="song-details-action-group">
          {/* This Sunday Setlist Quick Toggle */}
          <button
            type="button"
            className={`btn ${isSelectedForSunday ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              if (song) {
                const added = toggleSong(song.id);
                showToast(
                  added ? `Added "${song.title}" to This Sunday` : `Removed "${song.title}" from This Sunday`,
                  added ? 'success' : 'info'
                );
              }
            }}
            title={isSelectedForSunday ? 'In This Sunday setlist (click to remove)' : 'Add to This Sunday setlist'}
            aria-label="Toggle This Sunday"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <CalendarDays size={16} />
            <span className="hide-mobile">{isSelectedForSunday ? 'In This Sunday' : '+ This Sunday'}</span>
          </button>

          {/* Communion Songs Quick Toggle */}
          <button
            type="button"
            className={`btn ${isSelectedForCommunion ? 'btn-communion-active' : 'btn-secondary'}`}
            onClick={() => {
              if (song) {
                const added = toggleCommunionSong(song.id);
                showToast(
                  added ? `Added "${song.title}" to Communion Songs` : `Removed "${song.title}" from Communion Songs`,
                  added ? 'success' : 'info'
                );
              }
            }}
            title={isSelectedForCommunion ? 'In Communion Songs (click to remove)' : 'Add to Communion Songs'}
            aria-label="Toggle Communion"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <Wine size={16} />
            <span className="hide-mobile">{isSelectedForCommunion ? 'In Communion' : '+ Communion'}</span>
          </button>

          {/* Performance Mode (Highlighted for Pianist / Musician) */}
          <button
            type="button"
            className="btn btn-primary song-perf-trigger-btn"
            onClick={() => setIsPerformanceOpen(true)}
            title="Open distraction-free Performance Mode"
            aria-label="Play Mode"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <Play size={16} fill="currentColor" />
            <span className="hide-mobile">Play Mode</span>
          </button>

          <button
            type="button"
            className={`btn btn-secondary btn-icon-favorite ${isFavorite ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isHeartPopping ? 'heart-pop-active' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const currentLeadCount = getLeadNoteCount(transposedSong || song);
              if (currentLeadCount === 0) {
                showToast('No Lead Notes available for this song.', 'info', 3000);
              } else {
                setIsNotationModalOpen(true);
              }
            }}
            title="View Western musical staff notation for this song"
            aria-label="Musical Notation"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <FileMusic size={16} />
            <span className="hide-mobile">Musical Notation</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShareModalTab('details');
              setIsShareModalOpen(true);
            }}
            title="Share song details, chords, or export PDF"
            style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
          >
            <Share2 size={16} />
            <span className="hide-mobile">Share</span>
          </button>

          {userCanEdit ? (
            <>
              <Link
                to={`/songs/${id}/edit`}
                className="btn btn-secondary"
                title="Edit song structure"
                style={{ minWidth: '40px', minHeight: '40px', padding: '8px 12px' }}
              >
                <Edit2 size={16} />
                <span className="hide-mobile">Edit</span>
              </Link>

              <button
                type="button"
                className="btn btn-secondary hide-mobile"
                onClick={handlePrint}
                title="Print chord chart"
                style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
              >
                <Printer size={16} />
              </button>

              <button
                type="button"
                className="btn btn-ghost text-danger"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Delete this song"
                aria-label="Delete song"
                style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary hide-mobile"
              onClick={handlePrint}
              title="Print chord chart"
              style={{ minWidth: '40px', minHeight: '40px', padding: '8px' }}
            >
              <Printer size={16} />
            </button>
          )}
        </div>
      </div>

      {/* This Sunday Worship Setlist Flow Bar */}
      {inSundaySetlist && (
        <div 
          className="card this-sunday-flow-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CalendarDays size={13} />
              This Sunday
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Song <strong>{adjacentInfo.currentIndex + 1}</strong> of <strong>{adjacentInfo.total}</strong> ({formatServiceDate(serviceDate)})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrevSong}
              disabled={!adjacentInfo.prevSong}
              title={adjacentInfo.prevSong ? `Previous: ${adjacentInfo.prevSong.title}` : 'No previous song'}
            >
              <ChevronLeft size={16} />
              <span className="hide-mobile">Previous</span>
            </button>

            <Link
              to="/this-sunday"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              title="View full Sunday setlist"
            >
              View Setlist
            </Link>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNextSong}
              disabled={!adjacentInfo.nextSong}
              title={adjacentInfo.nextSong ? `Next: ${adjacentInfo.nextSong.title}` : 'No next song'}
            >
              <span className="hide-mobile">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Unified Modern Song Header Card */}
      <div className="card song-details-header-card">
        <div className="song-details-header-content">
          <div className="song-details-title-group">
            <h1 className="song-details-title">
              <span>{title}</span>
              {secondaryTitle && (
                <span className="song-details-secondary-title" style={{ fontSize: '0.78em', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '8px' }}>
                  ({secondaryTitle})
                </span>
              )}
            </h1>
            <div className="song-details-artist-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="song-details-artist">
                <User size={14} style={{ opacity: 0.7 }} />
                {artist || 'Unknown Artist'}
              </span>
              {creatorDisplayName && (
                <span className="song-details-creator-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>•</span>
                  <span>Added by: <strong style={{ color: 'var(--text-secondary)' }}>{creatorDisplayName}</strong></span>
                </span>
              )}
            </div>
          </div>

          <div className="song-details-badges-group">
            <span className="badge badge-key">
              Key: <strong>{originalKey || 'C'}</strong>
            </span>
            {isTransposed && (
              <span className="badge badge-key transposed-badge">
                Playing in: <strong>{activeKey || originalKey || 'C'}</strong>
              </span>
            )}
            {category && (
              <span
                className={`badge badge-category ${
                  typeof category === 'string' && category.toLowerCase() === 'tamil' ? 'badge-lang-tamil' :
                  typeof category === 'string' && category.toLowerCase() === 'hindi' ? 'badge-lang-hindi' :
                  typeof category === 'string' && category.toLowerCase() === 'english' ? 'badge-lang-english' : ''
                }`}
              >
                {typeof category === 'string' && category.toLowerCase() === 'tamil' ? '🇮🇳 Tamil' :
                 typeof category === 'string' && category.toLowerCase() === 'hindi' ? '🇮🇳 Hindi' :
                 typeof category === 'string' && category.toLowerCase() === 'english' ? '🌐 English' : String(category?.name || category)}
              </span>
            )}
            {styleName && (
              <div
                className="song-viewer-style-highlight"
                title={`Style: ${resolvedStyle?.category ? resolvedStyle.category + ' → ' : ''}${styleName} (${formatStyleCode(resolvedStyle || style)}) • Style number is according to Yamaha PSR I425 & Yamaha PSR F51`}
              >
                <div className="style-highlight-icon-box">
                  <Sliders size={14} />
                </div>
                <div className="style-highlight-content">
                  <div className="style-highlight-tag-row">
                    <span className="style-highlight-tag">STYLE</span>
                    {styleNumber && (
                      <span className="style-highlight-number">
                        {styleNumber.includes('/') ? styleNumber.replace('/', ' / ') : styleNumber}
                      </span>
                    )}
                  </div>
                  <div className="style-highlight-name">
                    {styleName}
                  </div>
                </div>
              </div>
            )}
            {song.tempo && (
              <span className="badge badge-meta" title={`Tempo: ${song.tempo} BPM`}>
                <Gauge size={12} />
                <span>{song.tempo} BPM</span>
              </span>
            )}
            {song.timeSignature && (
              <span className="badge badge-meta" title={`Time Signature: ${song.timeSignature}`}>
                <Clock size={12} />
                <span>{song.timeSignature}</span>
              </span>
            )}
            {song.notes && (
              <span className="badge badge-notes" title={`Performance Notes: ${song.notes}`}>
                <FileText size={12} />
                <span>{song.notes}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Transposition & Zoom Toolbar */}
      <div className="song-details-transposer-wrapper">
        <TransposeBar
          originalKey={originalKey || 'C'}
          activeKey={activeKey || originalKey || 'C'}
          semitoneDelta={transposedSong?.semitoneDelta || 0}
          onChangeKey={setActiveKey}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>

      {/* Structured Song Content (Piano Friendly Reading with Mobile Swipe Support) */}
      <ErrorBoundary
        title="Error Displaying Chord Sheet"
        message="An unexpected error occurred while rendering the chord sheet for this song."
      >
        <div
          className="song-swipe-viewport"
          ref={swipeContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
        >
          {/* Real-time Dynamic Swipe Navigation HUD Badge */}
          <div className="song-swipe-hint-badge" ref={swipeHintRef} aria-hidden="true">
            <span ref={swipeHintTextRef} />
          </div>

          <div className="song-swipe-track" ref={swipeTrackRef}>
            <SongViewer
              transposedSong={transposedSong}
              zoomLevel={zoomLevel}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* Performance Mode Modal (Supports Portrait & Landscape) */}
      {isPerformanceOpen && (
        <PerformanceModal
          isOpen={isPerformanceOpen}
          onClose={() => setIsPerformanceOpen(false)}
          transposedSong={transposedSong}
          onChangeKey={setActiveKey}
          setlistSongs={inSundaySetlist && adjacentInfo ? adjacentInfo.setlistSongs : (Array.isArray(cachedSongs) ? cachedSongs : [])}
          currentIndex={inSundaySetlist && adjacentInfo ? adjacentInfo.currentIndex : libraryIndex}
          onNextSong={handleNextSong}
          onPrevSong={handlePrevSong}
        />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          song={song}
          initialKey={activeKey || song?.originalKey || 'C'}
          initialTab={shareModalTab}
        />
      )}

      {/* Musical Staff Notation Modal */}
      {isNotationModalOpen && (
        <NotationModal
          song={transposedSong || song}
          onClose={() => setIsNotationModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title={`Delete "${title || 'Song'}"?`}
          message="This will permanently delete this song and its musical sections from your Firestore database. This action cannot be undone."
          confirmText="Delete Song"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Contact & Song Request Modal */}
      {isContactOpen && (
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          initialSongTitle={song?.title || ''}
          initialType="Song Request"
        />
      )}
    </div>
  );
}
