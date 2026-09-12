import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PWAProvider } from './context/PWAContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThisSundayProvider } from './context/ThisSundayContext';
import { CommunionProvider } from './context/CommunionContext';
import { AuthProvider } from './context/AuthContext';
import { DeviceModeProvider } from './context/DeviceModeContext';
import Layout from './components/Layout/Layout';
import ReloadPrompt from './components/UI/ReloadPrompt';
import ConfirmModal from './components/Modal/ConfirmModal';
import AuthModal from './components/Modal/AuthModal';
import ProtectedRoute from './components/UI/ProtectedRoute';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { SongCardSkeleton } from './components/UI/SkeletonLoader';
import { getSongs, deleteSong, toggleFavoriteSong } from './firebase/songs';
import { initNotificationOnboarding, setupForegroundNotificationListener } from './services/fcmService';

// Lazy-load page components for optimal bundle splitting & rapid first contentful paint
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ThisSunday = lazy(() => import('./pages/ThisSunday'));
const CommunionSongs = lazy(() => import('./pages/CommunionSongs'));
const Songs = lazy(() => import('./pages/Songs'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Recent = lazy(() => import('./pages/Recent'));
const SongDetails = lazy(() => import('./pages/SongDetails'));
const AddSong = lazy(() => import('./pages/AddSong'));
const EditSong = lazy(() => import('./pages/EditSong'));
const ImportSong = lazy(() => import('./pages/ImportSong'));
const Settings = lazy(() => import('./pages/Settings'));
const NotesGuide = lazy(() => import('./pages/NotesGuide'));
const CustomNotes = lazy(() => import('./pages/CustomNotes'));

function PageFallback() {
  return (
    <div style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <SongCardSkeleton />
        <SongCardSkeleton />
        <SongCardSkeleton />
      </div>
    </div>
  );
}

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

  // Automatic Notification Onboarding & Real-time Broadcast Listener
  useEffect(() => {
    initNotificationOnboarding().catch(() => {});

    const unsubscribe = setupForegroundNotificationListener(({ body, songTitle }) => {
      showToast(body || `Hey Musician! new song ${songTitle || 'New Song'} is added`, 'info', 6000);
      fetchAllSongs();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchAllSongs, showToast]);

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
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              element={
                <Layout
                  songs={songs}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  firestoreError={firestoreError}
                  onRetryFirestore={fetchAllSongs}
                  onRefresh={fetchAllSongs}
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
              path="/this-sunday"
              element={
                <ThisSunday
                  songs={songs}
                  isLoading={isLoading}
                />
              }
            />
            <Route
              path="/communion"
              element={
                <CommunionSongs
                  songs={songs}
                  isLoading={isLoading}
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
              path="/song/:id"
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
              element={
                <ProtectedRoute title="Edit Song">
                  <EditSong onSongUpdated={fetchAllSongs} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/song/:id/edit"
              element={
                <ProtectedRoute title="Edit Song">
                  <EditSong onSongUpdated={fetchAllSongs} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-song"
              element={
                <ProtectedRoute title="Add New Song">
                  <AddSong onSongAdded={fetchAllSongs} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute title="AI & Web Song Import">
                  <ImportSong />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={<Settings onSongAdded={fetchAllSongs} />}
            />
            <Route
              path="/notes"
              element={<CustomNotes />}
            />
            <Route
              path="/custom-notes"
              element={<CustomNotes />}
            />
            <Route
              path="/chord-guide"
              element={<NotesGuide />}
            />
            <Route
              path="/notes-guide"
              element={<NotesGuide />}
            />
            <Route
              path="/chord-sheet"
              element={<Navigate to="/chord-guide" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>

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

      {/* User Authentication Modal (Sign In, Sign Up, Forgot Password) */}
      <AuthModal />

      {/* PWA Update & Status Notifications */}
      <ReloadPrompt />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DeviceModeProvider>
        <PWAProvider>
          <ToastProvider>
            <AuthProvider>
              <ThisSundayProvider>
                <CommunionProvider>
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </CommunionProvider>
              </ThisSundayProvider>
            </AuthProvider>
          </ToastProvider>
        </PWAProvider>
      </DeviceModeProvider>
    </ThemeProvider>
  );
}
