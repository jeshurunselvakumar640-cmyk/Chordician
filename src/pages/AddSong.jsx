import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SongEditor from '../components/SongEditor/SongEditor';
import DuplicateSongModal from '../components/Modal/DuplicateSongModal';
import { addSong, getSongs } from '../firebase/songs';
import { useToast } from '../context/ToastContext';
import { triggerNewSongNotification } from '../services/fcmService';
import { findPotentialDuplicateSong } from '../utils/duplicateDetection';

export default function AddSong({ onSongAdded, songs = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSongs, setLocalSongs] = useState(songs);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [pendingSong, setPendingSong] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Keep local songs updated with props or fetch fallback if empty
  useEffect(() => {
    if (Array.isArray(songs) && songs.length > 0) {
      setLocalSongs(songs);
    } else {
      getSongs().then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalSongs(data);
        }
      }).catch(() => {});
    }
  }, [songs]);

  // If redirected from AI import with prefilled song
  const prefilledSong = location.state?.prefilledSong || null;

  // Normal existing save pipeline
  const executeSave = async (songData) => {
    setIsSubmitting(true);
    const res = await addSong(songData);
    setIsSubmitting(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else if (res.id) {
      showToast(`"${songData.title}" added to your songbook!`, 'success');
      
      // Asynchronously trigger push notification for new song (non-blocking)
      triggerNewSongNotification(res.id).catch(() => {});

      if (onSongAdded) {
        onSongAdded();
      }
      navigate(`/songs/${res.id}`);
    }
  };

  // Intercept save to perform duplicate check
  const handleSave = async (songData) => {
    const duplicateResult = findPotentialDuplicateSong(songData, localSongs, 0.95);

    if (duplicateResult.isDuplicate && duplicateResult.matchedSong) {
      setPendingSong(songData);
      setDuplicateInfo(duplicateResult);
      setIsDuplicateModalOpen(true);
      return;
    }

    await executeSave(songData);
  };

  // Handler when user confirms "Add Anyway" in modal
  const handleConfirmAddAnyway = async () => {
    if (!pendingSong) return;
    setIsDuplicateModalOpen(false);
    await executeSave(pendingSong);
  };

  // Handler to view existing song from modal
  const handleViewExisting = (matchedSong) => {
    setIsDuplicateModalOpen(false);
    if (matchedSong?.id) {
      navigate(`/songs/${matchedSong.id}`);
    }
  };

  // Handler to cancel modal and return to editor
  const handleCancelDuplicate = () => {
    setIsDuplicateModalOpen(false);
    setPendingSong(null);
    setDuplicateInfo(null);
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

      {/* Duplicate Song Confirmation Modal */}
      <DuplicateSongModal
        isOpen={isDuplicateModalOpen}
        matchedSong={duplicateInfo?.matchedSong}
        newSong={pendingSong}
        matchPercentage={duplicateInfo?.matchPercentage || 95}
        matchLabel={duplicateInfo?.matchLabel}
        onViewExisting={handleViewExisting}
        onConfirmAddAnyway={handleConfirmAddAnyway}
        onCancel={handleCancelDuplicate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
