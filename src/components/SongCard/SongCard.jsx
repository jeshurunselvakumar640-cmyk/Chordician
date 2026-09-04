import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, BookOpen, Edit2, Trash2, Music, Sliders } from 'lucide-react';
import KeyBadge from '../UI/KeyBadge';
import { formatMainStyleHighlight } from '../../data/songStyles.js';

export default function SongCard({
  song,
  viewMode = 'grid',
  onToggleFavorite,
  onDeleteRequest
}) {
  const navigate = useNavigate();
  const { id, title, artist, originalKey, category, style, favorite, sections = [], updatedAt } = song;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(id, !!favorite);
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteRequest) {
      onDeleteRequest(song);
    }
  };

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  if (viewMode === 'list') {
    return (
      <div className="song-list-item" onClick={() => navigate(`/songs/${id}`)} role="button" tabIndex={0}>
        <div className="song-list-main-info">
          <button
            type="button"
            className={`btn-icon-favorite song-card-fav-btn ${favorite ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
            <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
          </button>

          <div className="song-list-text-group">
            <div className="song-list-title-row">
              <h4 className="song-list-title">{title}</h4>
              <KeyBadge songKey={originalKey || 'C'} />
            </div>
            <p className="song-list-subtitle">
              {artist || 'Unknown Artist'} • {category || 'General'}
              {style?.name && ` • Style: ${formatMainStyleHighlight(style)}`}
            </p>
          </div>
        </div>

        <div className="song-list-actions">
          {formattedDate && (
            <span className="song-card-date hide-mobile">
              {formattedDate}
            </span>
          )}

          <Link
            to={`/songs/${id}`}
            className="btn btn-secondary btn-sm"
            onClick={(e) => e.stopPropagation()}
            title="Open songbook"
          >
            <BookOpen size={14} />
            <span className="hide-extra-small">Open</span>
          </Link>

          <Link
            to={`/songs/${id}/edit`}
            className="btn btn-ghost btn-sm"
            onClick={(e) => e.stopPropagation()}
            title="Edit song"
            aria-label="Edit song"
          >
            <Edit2 size={15} />
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-sm text-danger"
            onClick={handleDeleteClick}
            title="Delete song"
            aria-label="Delete song"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="song-card" onClick={() => navigate(`/songs/${id}`)} role="button" tabIndex={0}>
      <div className="song-card-header">
        <div className="song-title-group">
          <h3 className="song-card-title">{title}</h3>
          <p className="song-card-artist">{artist || 'Unknown Artist'}</p>
        </div>

        <button
          type="button"
          className={`btn-icon-favorite song-card-fav-btn ${favorite ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label="Toggle favorite"
        >
          <Heart size={22} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="song-card-badges">
        <KeyBadge songKey={originalKey || 'C'} />
        {category && (
          <span
            className={`badge badge-category ${
              category.toLowerCase() === 'tamil' ? 'badge-lang-tamil' :
              category.toLowerCase() === 'hindi' ? 'badge-lang-hindi' :
              category.toLowerCase() === 'english' ? 'badge-lang-english' : ''
            }`}
          >
            {category.toLowerCase() === 'tamil' ? '🇮🇳 Tamil' :
             category.toLowerCase() === 'hindi' ? '🇮🇳 Hindi' :
             category.toLowerCase() === 'english' ? '🌐 English' : category}
          </span>
        )}
        {style?.name && (
          <span className="badge badge-style" title={`Style: ${style.category} → ${style.name}`}>
            <Sliders size={11} />
            {formatMainStyleHighlight(style)}
          </span>
        )}
        <span className="badge badge-section-count">
          <Music size={12} />
          {sections.length} {sections.length === 1 ? 'section' : 'sections'}
        </span>
      </div>

      <div className="song-card-footer">
        <span className="song-card-date">
          {formattedDate ? `Updated ${formattedDate}` : 'Recently added'}
        </span>

        <div className="song-card-action-group">
          <Link
            to={`/songs/${id}/edit`}
            className="btn btn-ghost btn-sm"
            onClick={(e) => e.stopPropagation()}
            title="Edit song"
            aria-label="Edit song"
          >
            <Edit2 size={15} />
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-sm text-danger"
            onClick={handleDeleteClick}
            title="Delete song"
            aria-label="Delete song"
          >
            <Trash2 size={15} />
          </button>

          <Link
            to={`/songs/${id}`}
            className="btn btn-primary btn-sm song-play-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <BookOpen size={14} />
            Play
          </Link>
        </div>
      </div>
    </div>
  );
}
