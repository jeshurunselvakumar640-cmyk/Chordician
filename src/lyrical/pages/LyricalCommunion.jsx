import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import LyricalSongItem from '../components/LyricalSongItem';

export default function LyricalCommunion({
  songs = [],
  favorites = [],
  onToggleFavorite,
  onEditSong,
  onDeleteSong
}) {
  const navigate = useNavigate();
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  const communionSongs = songs.filter((s) => s.isCommunion);

  return (
    <div className="lyrical-page lyrical-communion-page">
      <div className="lyrical-page-header">
        <div className="lyrical-page-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <Wine size={14} />
          <span>{t.navCommunion}</span>
        </div>
        <h1 className="lyrical-page-title">{t.communionTitle}</h1>
        <p className="lyrical-page-subtitle">{t.communionSubtitle}</p>
      </div>

      {communionSongs.length > 0 ? (
        <div className="lyrical-songs-list" role="feed" aria-label={t.communionTitle}>
          {communionSongs.map((song) => (
            <LyricalSongItem
              key={song.id}
              song={song}
              isFavorite={favorites.includes(song.id)}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEditSong}
              onDelete={onDeleteSong}
              onClick={(s) => navigate(`/song/${s.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="lyrical-card lyrical-empty-card">
          <div className="lyrical-empty-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Wine size={32} />
          </div>
          <h2 className="lyrical-empty-title">{t.communionEmptyTitle || t.communionPlaceholderTitle}</h2>
          <p className="lyrical-empty-desc">{t.communionEmptyDesc || t.communionPlaceholderDesc}</p>
        </div>
      )}
    </div>
  );
}
