import React from 'react';
import { Heart, Wine, Edit3, Trash2 } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalSongItem({
  song,
  isFavorite = false,
  onToggleFavorite,
  onEdit,
  onDelete,
  onClick
}) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  const artistName = song.artist || song.singer || t.singerLabel;
  const isCommunion = Boolean(song.isCommunion);

  const secondaryTitleText = Array.isArray(song.secondaryTitles) && song.secondaryTitles.length > 0
    ? song.secondaryTitles.filter(Boolean).join(', ')
    : (song.secondaryTitle || '').trim();

  return (
    <div
      className={`lyrical-song-item ${isCommunion ? 'is-communion' : ''}`}
      onClick={() => onClick && onClick(song)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick(song);
        }
      }}
      aria-label={`${song.title}${secondaryTitleText ? ` (${secondaryTitleText})` : ''} - ${artistName} (${song.language})`}
    >
      <div className="lyrical-song-item-main">
        <div className="lyrical-song-title-row">
          <h3 className="lyrical-song-title">
            <span>{song.title}</span>
            {secondaryTitleText && (
              <span className="lyrical-song-secondary-title">({secondaryTitleText})</span>
            )}
          </h3>
          {isCommunion && (
            <span className="lyrical-communion-badge" title={t.navCommunion}>
              <Wine size={12} />
              <span>{t.navCommunion}</span>
            </span>
          )}
        </div>

        <div className="lyrical-song-meta-row">
          <span className="lyrical-song-artist">{artistName}</span>
          <span className="lyrical-song-dot">•</span>
          <span className="lyrical-song-lang">{song.language}</span>
        </div>
      </div>

      <div className="lyrical-song-item-actions" onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <button
            type="button"
            className="lyrical-song-action-btn lyrical-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(song);
            }}
            aria-label={t.editSong || 'Edit Song'}
            title={t.editSong || 'Edit Song'}
          >
            <Edit3 size={17} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="lyrical-song-action-btn lyrical-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(song);
            }}
            aria-label={t.deleteSong || 'Delete Song'}
            title={t.deleteSong || 'Delete Song'}
          >
            <Trash2 size={17} />
          </button>
        )}

        <button
          type="button"
          className={`lyrical-song-fav-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(song.id);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={19}
            className={isFavorite ? 'heart-filled' : 'heart-outline'}
            fill={isFavorite ? '#ef4444' : 'none'}
            color={isFavorite ? '#ef4444' : 'currentColor'}
          />
        </button>
      </div>
    </div>
  );
}

