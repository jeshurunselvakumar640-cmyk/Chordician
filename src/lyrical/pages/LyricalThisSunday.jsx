import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import { fetchLyricalSundaySetlist } from '../data/lyricalSunday';
import LyricalSongItem from '../components/LyricalSongItem';

export default function LyricalThisSunday({
  songs = [],
  favorites = [],
  onToggleFavorite,
  onEditSong,
  onDeleteSong
}) {
  const navigate = useNavigate();
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchLyricalSundaySetlist()
      .then((res) => {
        if (isMounted && res.data) {
          setSetlist(res.data);
        }
      })
      .catch((err) => {
        console.warn('[Lyrical Sunday Setlist Fetch Error]:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map setlist song IDs or objects to available songs in library
  const sundaySongs = React.useMemo(() => {
    if (!setlist || !Array.isArray(setlist.songs) || setlist.songs.length === 0) {
      return [];
    }

    return setlist.songs.map((item) => {
      if (typeof item === 'string') {
        const found = songs.find((s) => s.id === item || s.chordicianSongId === item);
        return found || { id: item, title: 'Worship Song', artist: '' };
      }
      return item;
    });
  }, [setlist, songs]);

  return (
    <div className="lyrical-page">
      <div className="lyrical-page-header">
        <div className="lyrical-page-badge" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', borderColor: 'rgba(234, 88, 12, 0.25)' }}>
          <CalendarDays size={14} />
          <span>{t.navThisSunday}</span>
        </div>
        <h1 className="lyrical-page-title">{setlist?.serviceTitle || t.sundayTitle}</h1>
        <p className="lyrical-page-subtitle">
          {setlist?.date ? `${setlist.date} • ${t.sundaySubtitle}` : t.sundaySubtitle}
        </p>
      </div>

      {sundaySongs.length > 0 ? (
        <div className="lyrical-songs-list" role="feed" aria-label={t.sundayTitle}>
          {sundaySongs.map((song) => (
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
          <div className="lyrical-empty-icon-wrap" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' }}>
            <CalendarDays size={32} />
          </div>
          <h2 className="lyrical-empty-title">{t.sundayEmptyTitle || t.sundayPlaceholderTitle}</h2>
          <p className="lyrical-empty-desc">{t.sundayEmptyDesc || t.sundayPlaceholderDesc}</p>
        </div>
      )}
    </div>
  );
}
