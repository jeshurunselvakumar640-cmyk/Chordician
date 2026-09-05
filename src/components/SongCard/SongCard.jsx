import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  BookOpen,
  Edit2,
  Trash2,
  Music,
  Sliders,
  CalendarDays,
  Share2,
  CheckSquare,
  Square
} from 'lucide-react';
import KeyBadge from '../UI/KeyBadge';
import ShareModal from '../Modal/ShareModal';
import { formatMainStyleHighlight } from '../../data/songStyles.js';
import { useThisSunday } from '../../context/ThisSundayContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function SongCard({
  song,
  viewMode = 'grid',
  onToggleFavorite,
  onDeleteRequest,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isInThisSunday, toggleSong } = useThisSunday();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { id, title, artist, originalKey, category, style, favorite, sections = [], updatedAt } = song;

  const isSunday = isInThisSunday(id);

  const handleSundayToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleSong(id);
    showToast(
      added ? `Added "${title}" to This Sunday` : `Removed "${title}" from This Sunday`,
      added ? 'success' : 'info'
    );
  };

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

  const handleCardClick = (e) => {
    // If the click happened on a child button or checkbox, let the child handle it
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    if (isSelectionMode) {
      if (onToggleSelect) onToggleSelect(id);
    } else {
      navigate(`/songs/${id}`);
    }
  };

  const handleCheckboxClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSelect) onToggleSelect(id);
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`song-list-item ${isSelectionMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        <div className="song-list-main-info">
          {isSelectionMode ? (
            <button
              type="button"
              className={`song-card-select-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={handleCheckboxClick}
              title={isSelected ? 'Deselect song' : 'Select song'}
              aria-label={isSelected ? 'Deselect song' : 'Select song'}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)'
              }}
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-primary" />
              ) : (
                <Square size={20} className="text-muted" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className={`btn-icon-favorite song-card-fav-btn ${favorite ? 'favorited' : ''}`}
              onClick={handleFavoriteClick}
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Toggle favorite"
            >
              <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          )}

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

          {!isSelectionMode && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${isSunday ? 'btn-primary' : 'btn-ghost'}`}
                onClick={handleSundayToggle}
                title={isSunday ? 'In This Sunday setlist (click to remove)' : 'Add to This Sunday setlist'}
                aria-label="Toggle This Sunday"
                style={{ padding: '6px 10px' }}
              >
                <CalendarDays size={14} />
                <span className="hide-extra-small">{isSunday ? 'Sunday' : '+ Sunday'}</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(true);
                }}
                title="Share song details, chords, or PDF"
                aria-label="Share song"
              >
                <Share2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/songs/${id}`);
                }}
                title="Open songbook"
              >
                <BookOpen size={14} />
                <span className="hide-extra-small">Open</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/songs/${id}/edit`);
                }}
                title="Edit song"
                aria-label="Edit song"
              >
                <Edit2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={handleDeleteClick}
                title="Delete song"
                aria-label="Delete song"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>

        {/* Share Modal for List Mode */}
        {isShareOpen && (
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            song={song}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`song-card ${isSelectionMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      style={{
        position: 'relative'
      }}
    >
      <div className="song-card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
          {isSelectionMode && (
            <button
              type="button"
              className={`song-card-select-checkbox ${isSelected ? 'checked' : ''}`}
              onClick={handleCheckboxClick}
              title={isSelected ? 'Deselect song' : 'Select song'}
              aria-label={isSelected ? 'Deselect song' : 'Select song'}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)'
              }}
            >
              {isSelected ? (
                <CheckSquare size={22} className="text-primary" />
              ) : (
                <Square size={22} className="text-muted" />
              )}
            </button>
          )}

          <div className="song-title-group">
            <h3 className="song-card-title">{title}</h3>
            <p className="song-card-artist">{artist || 'Unknown Artist'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className={`btn btn-icon-sm ${isSunday ? 'btn-primary' : 'btn-ghost'}`}
            onClick={handleSundayToggle}
            title={isSunday ? 'In This Sunday setlist (click to remove)' : 'Add to This Sunday setlist'}
            aria-label="Toggle This Sunday"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <CalendarDays size={16} />
          </button>

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
          {isSelectionMode ? (
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: '600',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)'
              }}
            >
              {isSelected ? '✓ Selected' : 'Click to select'}
            </span>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(true);
                }}
                title="Share song details, chords, or PDF"
                aria-label="Share song"
              >
                <Share2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/songs/${id}/edit`);
                }}
                title="Edit song"
                aria-label="Edit song"
              >
                <Edit2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={handleDeleteClick}
                title="Delete song"
                aria-label="Delete song"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm song-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/songs/${id}`);
                }}
              >
                <BookOpen size={14} />
                <span>Play</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Share Modal for Grid Mode */}
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          song={song}
        />
      )}
    </div>
  );
}
