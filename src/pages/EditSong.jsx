import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SongEditor from '../components/SongEditor/SongEditor';
import { getSongById, updateSong } from '../firebase/songs';
import { useToast } from '../context/ToastContext';
import { SongDetailsSkeleton } from '../components/UI/SkeletonLoader';

export default function EditSong({ onSongUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSong() {
      if (!id) return;
      setIsLoading(true);
      const res = await getSongById(id);
      if (!isMounted) return;

      if (res.error) {
        showToast(res.error, 'error');
        navigate('/songs');
      } else if (res.data) {
        setSong(res.data);
      }
      setIsLoading(false);
    }

    loadSong();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, showToast]);

  const handleSave = async (updatedData) => {
    setIsSubmitting(true);
    const res = await updateSong(id, {
      ...updatedData,
      favorite: song.favorite ?? false
    });
    setIsSubmitting(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`"${updatedData.title}" updated successfully!`, 'success');
      if (onSongUpdated) {
        onSongUpdated();
      }
      navigate(`/songs/${id}`);
    }
  };

  if (isLoading) {
    return <SongDetailsSkeleton />;
  }

  if (!song) {
    return null;
  }

  return (
    <div className="edit-song-page">
      <SongEditor
        initialSong={song}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        isEdit={true}
      />
    </div>
  );
}
