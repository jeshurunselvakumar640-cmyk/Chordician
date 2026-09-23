import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppMode } from '../context/AppModeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getLyricalTranslation } from './i18n/translations';
import {
  getInitialLyricalSongs,
  saveLyricalSongs,
  fetchCloudLyricalSongs,
  saveLyricalSongToCloud,
  deleteLyricalSongFromCloud,
  getInitialLyricalFavorites,
  saveLyricalFavorites
} from './data/lyricalSongs';

// Lyrical Page Components
import LyricalHome from './pages/LyricalHome';
import LyricalThisSunday from './pages/LyricalThisSunday';
import LyricalCommunion from './pages/LyricalCommunion';
import LyricalLists from './pages/LyricalLists';
import LyricalSettings from './pages/LyricalSettings';
import LyricalSongView from './pages/LyricalSongView';

// Navigation & Modal Shells
import LyricalHeader from './components/LyricalHeader';
import LyricalSidebar from './components/LyricalSidebar';
import LyricalBottomNav from './components/LyricalBottomNav';
import LyricalAddModal from './components/LyricalAddModal';
import LyricalUrlImportModal from './components/LyricalUrlImportModal';
import LyricalSimpleEditorModal from './components/LyricalSimpleEditorModal';
import LyricalDeleteConfirmModal from './components/LyricalDeleteConfirmModal';

export default function LyricalApp() {
  const navigate = useNavigate();
  const { language } = useAppMode();
  const { currentUser, isOwner } = useAuth();
  const { showToast } = useToast();
  const t = getLyricalTranslation(language);

  const [songs, setSongs] = useState(() => getInitialLyricalSongs());
  const [favorites, setFavorites] = useState(() => getInitialLyricalFavorites());

  // Fetch and synchronize cloud library in background on load
  useEffect(() => {
    let isMounted = true;
    fetchCloudLyricalSongs().then((synced) => {
      if (isMounted && Array.isArray(synced)) {
        setSongs(synced);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Navigation & Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportUrlOpen, setIsImportUrlOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialData, setEditorInitialData] = useState(null);
  const [deleteTargetSong, setDeleteTargetSong] = useState(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Local Favorites Toggle
  const handleToggleFavorite = (songId) => {
    setFavorites((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      saveLyricalFavorites(next);
      return next;
    });
  };

  // URL Import Modal Dispatch
  const handleOpenImportUrl = () => {
    setIsAddOpen(false);
    setIsImportUrlOpen(true);
  };

  // On URL extraction success -> open Simple Lyrical Editor
  const handleImportSuccess = (extractedSongData) => {
    setIsImportUrlOpen(false);
    setEditorInitialData(extractedSongData);
    setIsEditorOpen(true);
  };

  // On editing an existing song
  const handleEditSong = (song) => {
    setEditorInitialData(song);
    setIsEditorOpen(true);
  };

  // On requesting song deletion
  const handleDeletePrompt = (song) => {
    setDeleteTargetSong(song);
  };

  // On confirming song deletion
  const handleConfirmDelete = async (songId) => {
    setSongs((prev) => {
      const updated = prev.filter((s) => s.id !== songId);
      saveLyricalSongs(updated);
      return updated;
    });

    let idToken = null;
    if (currentUser && isOwner && typeof currentUser.getIdToken === 'function') {
      try {
        idToken = await currentUser.getIdToken();
      } catch (tokenErr) {
        console.warn('[Lyrical Auth] Failed to acquire ID token for delete:', tokenErr);
      }
    }
    deleteLyricalSongFromCloud(songId, idToken).catch(() => {});

    setFavorites((prev) => {
      if (prev.includes(songId)) {
        const nextFavs = prev.filter((id) => id !== songId);
        saveLyricalFavorites(nextFavs);
        return nextFavs;
      }
      return prev;
    });

    if (showToast) {
      showToast(t.songDeletedToast || 'Song deleted from Lyrical library', 'info', 2500);
    }

    setDeleteTargetSong(null);

    // If currently viewing the deleted song, safely navigate back to library home
    if (typeof window !== 'undefined' && window.location.pathname.includes(songId)) {
      navigate('/');
    }
  };

  // On saving reviewed song in Simple Editor
  const handleSaveSong = async (newSong) => {
    let idToken = null;
    if (currentUser && isOwner && typeof currentUser.getIdToken === 'function') {
      try {
        idToken = await currentUser.getIdToken();
      } catch (tokenErr) {
        console.warn('[Lyrical Auth] Failed to acquire ID token for save:', tokenErr);
      }
    }

    const cloudResult = await saveLyricalSongToCloud(newSong, idToken);
    const finalSong = (cloudResult && cloudResult.song) ? cloudResult.song : newSong;

    setSongs((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === finalSong.id);
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = finalSong;
      } else {
        updated = [finalSong, ...prev];
      }
      saveLyricalSongs(updated);
      return updated;
    });

    if (showToast) {
      if (cloudResult && cloudResult.success && !cloudResult.localOnly) {
        showToast(t.songSavedToast || 'Song saved to Lyrical cloud library!', 'success', 2500);
      } else if (cloudResult && cloudResult.localOnly) {
        showToast('Saved locally. Log in as Owner in Chordician to publish to cloud.', 'info', 3500);
      } else {
        showToast(cloudResult?.error || 'Failed to save song to cloud', 'error', 3000);
      }
    }

    setIsEditorOpen(false);
    navigate(`/song/${finalSong.id}`);
  };

  // Derived distinct artists and their song counts
  const artistsList = useMemo(() => {
    const artistCounts = songs.reduce((acc, s) => {
      const name = (s.artist || s.singer || '').trim();
      if (name) {
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(artistCounts)
      .map(([name, songCount]) => ({ name, songCount }))
      .sort((a, b) => b.songCount - a.songCount || a.name.localeCompare(b.name));
  }, [songs]);

  return (
    <div className="app-container lyrical-app-container">
      {/* Desktop Sidebar & Mobile Off-canvas Drawer */}
      <LyricalSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        artists={artistsList}
        selectedArtist={selectedArtist}
        onSelectArtist={(artist) => setSelectedArtist(artist)}
        onOpenAddManual={() => {
          setEditorInitialData(null);
          setIsEditorOpen(true);
        }}
        onOpenImportUrl={() => setIsImportUrlOpen(true)}
      />

      <div className="main-wrapper lyrical-main-wrapper">
        {/* Lyrical Top Header */}
        <LyricalHeader
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Main Page Content */}
        <main className="main-content lyrical-main-content">
          <Routes>
            <Route
              path="/"
              element={
                <LyricalHome
                  songs={songs}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenAddModal={() => setIsAddOpen(true)}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeletePrompt}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedArtist={selectedArtist}
                  onClearArtist={() => setSelectedArtist(null)}
                />
              }
            />
            <Route
              path="/song/:songId"
              element={
                <LyricalSongView
                  songs={songs}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeletePrompt}
                />
              }
            />
            <Route
              path="/songs/:songId"
              element={
                <LyricalSongView
                  songs={songs}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeletePrompt}
                />
              }
            />
            <Route
              path="/this-sunday"
              element={
                <LyricalThisSunday
                  songs={songs}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeletePrompt}
                />
              }
            />
            <Route
              path="/communion"
              element={
                <LyricalCommunion
                  songs={songs}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeletePrompt}
                />
              }
            />
            <Route path="/lists" element={<LyricalLists />} />
            <Route path="/settings" element={<LyricalSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Lyrical Bottom Navigation (5 items on mobile: Home | This Sunday | + | Lists | Settings) */}
      <LyricalBottomNav onAddClick={() => setIsAddOpen(true)} />

      {/* 1. Central Plus Button Modal */}
      <LyricalAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSelectImportUrl={handleOpenImportUrl}
        onSelectAddManual={() => {
          setIsAddOpen(false);
          setEditorInitialData(null);
          setIsEditorOpen(true);
        }}
      />

      {/* 2. Import from URL Modal */}
      <LyricalUrlImportModal
        isOpen={isImportUrlOpen}
        onClose={() => setIsImportUrlOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* 3. Simple Lyrical Text Editor Modal */}
      <LyricalSimpleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialData={editorInitialData}
        onSaveSong={handleSaveSong}
        onBackToImport={() => {
          setIsEditorOpen(false);
          setIsImportUrlOpen(true);
        }}
      />

      {/* 4. Delete Song Confirmation Modal */}
      <LyricalDeleteConfirmModal
        isOpen={Boolean(deleteTargetSong)}
        onClose={() => setDeleteTargetSong(null)}
        song={deleteTargetSong}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
