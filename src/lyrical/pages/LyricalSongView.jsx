import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Wine, Music, FileText, Edit3, Trash2 } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import { resolveLyricsForTab } from '../data/lyricalSongs';

export default function LyricalSongView({
  songs = [],
  favorites = [],
  onToggleFavorite,
  onEditSong,
  onDeleteSong
}) {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { language, setAppMode } = useAppMode();
  const t = getLyricalTranslation(language);

  // Default selected tab is ALWAYS Tamil on opening any song
  const [activeTab, setActiveTab] = useState('tamil');

  // Reset tab to Tamil and scroll to top whenever a new song is opened
  useEffect(() => {
    setActiveTab('tamil');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [songId]);

  const song = songs.find((s) => String(s.id) === String(songId));
  const isFavorite = song ? favorites.includes(song.id) : false;

  // Not Found fallback
  if (!song) {
    return (
      <div className="lyrical-page lyrical-song-view-page">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/')}
          style={{ alignSelf: 'flex-start', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>{t.backToLibrary || t.navHome}</span>
        </button>

        <div className="lyrical-card lyrical-empty-card">
          <h2 className="lyrical-empty-title">{t.noSongsFound}</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            {t.navHome}
          </button>
        </div>
      </div>
    );
  }

  const isCommunion = Boolean(song.isCommunion);
  const artistName = song.artist || song.singer || t.singerLabel;
  const displayedLyrics = resolveLyricsForTab(song, activeTab);

  const secondaryTitleText = Array.isArray(song.secondaryTitles) && song.secondaryTitles.length > 0
    ? song.secondaryTitles.filter(Boolean).join(', ')
    : (song.secondaryTitle || '').trim();

  // Floating Piano Button Action: Open linked Chordician song
  const handleOpenChordician = () => {
    if (song.chordicianSongId) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('chordician_return_to_lyrical', String(song.id));
        } catch {}
        window.history.pushState(
          { fromLyrical: true, lyricalSongId: song.id },
          '',
          `/songs/${song.chordicianSongId}?fromLyrical=true&lyricalSongId=${encodeURIComponent(song.id)}`
        );
      }
      if (setAppMode) {
        setAppMode('chordician');
      }
    }
  };

  return (
    <div className={`lyrical-page lyrical-song-view-page ${isCommunion ? 'is-communion-view' : ''}`}>
      {/* Top Navigation Bar with Back button, Edit, Delete, and favorite toggle */}
      <div className="lyrical-view-top-bar">
        <button
          type="button"
          className="btn btn-secondary btn-sm lyrical-back-btn"
          onClick={() => navigate(-1)}
          aria-label={t.backBtn}
          title={t.backBtn}
        >
          <ArrowLeft size={16} />
          <span>{t.backBtn}</span>
        </button>

        <div className="lyrical-view-top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onEditSong && (
            <button
              type="button"
              className="btn btn-secondary btn-sm lyrical-edit-action-btn"
              onClick={() => onEditSong(song)}
              aria-label={t.editSong || 'Edit Song'}
              title={t.editSong || 'Edit Song'}
            >
              <Edit3 size={15} />
              <span>{t.editSong || 'Edit'}</span>
            </button>
          )}

          {onDeleteSong && (
            <button
              type="button"
              className="btn btn-secondary btn-sm lyrical-delete-action-btn"
              onClick={() => onDeleteSong(song)}
              aria-label={t.deleteSong || 'Delete Song'}
              title={t.deleteSong || 'Delete Song'}
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={15} />
              <span>{t.deleteSong || 'Delete'}</span>
            </button>
          )}

          <button
            type="button"
            className={`btn btn-secondary btn-sm lyrical-fav-action-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={() => onToggleFavorite && onToggleFavorite(song.id)}
            aria-label={isFavorite ? t.favorited : t.favorite}
            title={isFavorite ? t.favorited : t.favorite}
          >
            <Heart
              size={16}
              fill={isFavorite ? '#ef4444' : 'none'}
              color={isFavorite ? '#ef4444' : 'currentColor'}
            />
            <span>{isFavorite ? t.favorited : t.favorite}</span>
          </button>
        </div>
      </div>

      {/* Song Header (Title + Artist + Communion Badge) */}
      <div className={`lyrical-card lyrical-viewer-header-card ${isCommunion ? 'is-communion' : ''}`}>
        <div className="lyrical-song-title-row">
          <h1 className="lyrical-viewer-title">
            <span>{song.title}</span>
            {secondaryTitleText && (
              <span className="lyrical-viewer-secondary-title">({secondaryTitleText})</span>
            )}
          </h1>
          {isCommunion && (
            <span className="lyrical-communion-badge" title={t.navCommunion}>
              <Wine size={13} />
              <span>{t.navCommunion}</span>
            </span>
          )}
        </div>

        <p className="lyrical-viewer-artist">{artistName}</p>

        {/* 3 Transliteration Language Tabs: Tamil | English | Hindi */}
        <div className="lyrical-viewer-tabs" role="tablist" aria-label="Lyric Script Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tamil'}
            className={`lyrical-viewer-tab ${activeTab === 'tamil' ? 'active' : ''}`}
            onClick={() => setActiveTab('tamil')}
          >
            {t.tabTamil}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'english'}
            className={`lyrical-viewer-tab ${activeTab === 'english' ? 'active' : ''}`}
            onClick={() => setActiveTab('english')}
          >
            {t.tabEnglish}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hindi'}
            className={`lyrical-viewer-tab ${activeTab === 'hindi' ? 'active' : ''}`}
            onClick={() => setActiveTab('hindi')}
          >
            {t.tabHindi}
          </button>
        </div>
      </div>

      {/* Actual Lyrics Display */}
      {displayedLyrics ? (
        <div className="lyrical-viewer-lyrics-card">
          <div className="lyrical-viewer-lyrics-content">
            {displayedLyrics}
          </div>
        </div>
      ) : (
        /* Graceful Missing Transliteration State */
        <div className="lyrical-viewer-empty-tab-card">
          <div className="lyrical-empty-icon-wrap" style={{ width: '44px', height: '44px' }}>
            <FileText size={22} />
          </div>
          <p className="lyrical-viewer-empty-tab-msg">
            {t.lyricsNotAvailable}
          </p>
        </div>
      )}

      {/* Floating Circular Piano-Notes Button (Only visible if linked chordicianSongId exists) */}
      {song.chordicianSongId ? (
        <button
          type="button"
          className="lyrical-floating-piano-btn"
          onClick={handleOpenChordician}
          aria-label={t.openPianoNotes}
          title={t.openPianoNotes}
        >
          <Music size={22} />
        </button>
      ) : null}
    </div>
  );
}
