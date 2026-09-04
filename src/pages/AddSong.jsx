import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SongEditor from '../components/SongEditor/SongEditor';
import { addSong } from '../firebase/songs';
import { useToast } from '../context/ToastContext';

export default function AddSong({ onSongAdded }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // If redirected from AI import with prefilled song
  const prefilledSong = location.state?.prefilledSong || null;

  const handleSave = async (songData) => {
    setIsSubmitting(true);
    const res = await addSong(songData);
    setIsSubmitting(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else if (res.id) {
      showToast(`"${songData.title}" added to your songbook!`, 'success');
      if (onSongAdded) {
        onSongAdded();
      }
      navigate(`/songs/${res.id}`);
    }
  };

  return (
    <div className="add-song-page">
      {prefilledSong && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.92rem',
          color: 'var(--text-main)'
        }}>
          ✨ <strong>{prefilledSong?.notes?.includes('URL') ? 'Web URL Import' : 'AI Vision Import'}:</strong> Song structure extracted successfully. Please review chords, notes, and lyrics below before saving to Firestore.
        </div>
      )}

      <SongEditor
        initialSong={prefilledSong}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        isEdit={false}
      />
    </div>
  );
}
