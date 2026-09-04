import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import SongCard from '../components/SongCard/SongCard';
import EmptyState from '../components/UI/EmptyState';
import { SongCardSkeleton } from '../components/UI/SkeletonLoader';

export default function Recent({
  songs = [],
  isLoading = false,
  onToggleFavorite,
  onDeleteRequest
}) {
  const recentSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [songs]);

  return (
    <div className="recent-page">
      <div className="recent-page-header">
        <div className="recent-icon-badge">
          <Clock size={20} />
        </div>
        <div>
          <h1 className="recent-title">Recently Added Songs</h1>
          <p className="recent-subtitle">
            All songs sorted chronologically by date added
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="songs-grid">
          {[1, 2, 3, 4].map((i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : recentSongs.length === 0 ? (
        <EmptyState
          type="songs"
          title="No songs added yet"
          description="Create your first song or import from a screenshot to populate your library."
          actionText="+ Add Song"
          actionLink="/add-song"
        />
      ) : (
        <div className="songs-grid">
          {recentSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              viewMode="grid"
              onToggleFavorite={onToggleFavorite}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
