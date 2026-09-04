import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Songs from './pages/Songs';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import SongDetails from './pages/SongDetails';
import AddSong from './pages/AddSong';
import EditSong from './pages/EditSong';
import ImportSong from './pages/ImportSong';
import Settings from './pages/Settings';
import ConfirmModal from './components/Modal/ConfirmModal';
import { getSongs, deleteSong, toggleFavoriteSong } from './firebase/songs';

function AppContent() {
  const { showToast } = useToast();

  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [songToDelete, setSongToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch songs from Firestore
  const fetchAllSongs = useCallback(async () => {
    setIsLoading(true);
    const res = await getSongs();
    if (res.error) {
      setFirestoreError(res.error);
      showToast(res.error, 'error');
    } else {
      setFirestoreError(null);
      setSongs(res.data || []);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchAllSongs();
  }, [fetchAllSongs]);

  // Handle Favorite Toggle
  const handleToggleFavorite = async (songId, currentStatus) => {
    // Optimistic UI update
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, favorite: !currentStatus } : s))
    );

    const res = await toggleFavoriteSong(songId, currentStatus);
    if (res.error) {
      // Revert optimistic update on failure
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, favorite: currentStatus } : s))
      );
      showToast(res.error, 'error');
    } else {
      showToast(
        !currentStatus ? 'Added to favorites' : 'Removed from favorites',
        'info',
        2000
      );
    }
  };

  // Handle Delete Confirmation from List/Grid Cards
  const handleDeleteRequest = (song) => {
    setSongToDelete(song);
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);

    const res = await deleteSong(songToDelete.id);
    setIsDeleting(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`"${songToDelete.title}" deleted from library`, 'info');
      setSongs((prev) => prev.filter((s) => s.id !== songToDelete.id));
      setSongToDelete(null);
    }
  };

  // Direct delete from SongDetails page
  const handleDeleteSongDirect = async (songId) => {
    const res = await deleteSong(songId);
    if (res.error) {
      showToast(res.error, 'error');
      return false;
    }
    showToast('Song deleted successfully', 'info');
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    return true;
  };

  return (
    <>
      <Routes>
        <Route
          element={
            <Layout
              songs={songs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              firestoreError={firestoreError}
              onRetryFirestore={fetchAllSongs}
            />
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                songs={songs}
                isLoading={isLoading}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={handleDeleteRequest}
              />
            }
          />
          <Route
            path="/songs"
            element={
              <Songs
                songs={songs}
                isLoading={isLoading}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={handleDeleteRequest}
              />
            }
          />
          <Route
            path="/favorites"
            element={
              <Favorites
                songs={songs}
                isLoading={isLoading}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={handleDeleteRequest}
              />
            }
          />
          <Route
            path="/recent"
            element={
              <Recent
                songs={songs}
                isLoading={isLoading}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={handleDeleteRequest}
              />
            }
          />
          <Route
            path="/songs/:id"
            element={
              <SongDetails
                cachedSongs={songs}
                onToggleFavorite={handleToggleFavorite}
                onDeleteSong={handleDeleteSongDirect}
              />
            }
          />
          <Route
            path="/songs/:id/edit"
            element={<EditSong onSongUpdated={fetchAllSongs} />}
          />
          <Route
            path="/add-song"
            element={<AddSong onSongAdded={fetchAllSongs} />}
          />
          <Route path="/import" element={<ImportSong />} />
          <Route
            path="/settings"
            element={<Settings onSongAdded={fetchAllSongs} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* App-wide Delete Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(songToDelete)}
        title={`Delete "${songToDelete?.title}"?`}
        message="This will permanently delete this song and its chords from your Firestore database. This action cannot be undone."
        confirmText="Delete Song"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSongToDelete(null)}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
