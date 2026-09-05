import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCommunionData,
  saveCommunionData,
  addSongToCommunion,
  removeSongFromCommunion,
  toggleSongInCommunion,
  isSongInCommunion,
  reorderCommunionSongs,
  clearCommunionSongs,
  getAdjacentCommunionSongs
} from '../services/communionService.js';

const CommunionContext = createContext(null);

export function CommunionProvider({ children }) {
  const [data, setData] = useState(() => getCommunionData());

  const reloadData = useCallback(() => {
    setData(getCommunionData());
  }, []);

  useEffect(() => {
    // Initial check
    reloadData();

    // Listen for custom update events across components
    const handleUpdate = () => {
      reloadData();
    };

    // Listen for storage events across tabs/windows
    const handleStorage = (e) => {
      if (e.key === 'chordician_communion_songs') {
        reloadData();
      }
    };

    window.addEventListener('chordician:communion-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('chordician:communion-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [reloadData]);

  const handleAddSong = useCallback((songId) => {
    const updated = addSongToCommunion(songId);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleRemoveSong = useCallback((songId) => {
    const updated = removeSongFromCommunion(songId);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleToggleSong = useCallback((songId) => {
    const isAdded = toggleSongInCommunion(songId);
    reloadData();
    return isAdded;
  }, [reloadData]);

  const handleReorder = useCallback((fromIndex, toIndex) => {
    const updated = reorderCommunionSongs(fromIndex, toIndex);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleClear = useCallback(() => {
    clearCommunionSongs();
    reloadData();
  }, [reloadData]);

  const value = {
    songIds: data.songIds,
    notes: data.notes,
    count: data.songIds.length,
    addSong: handleAddSong,
    removeSong: handleRemoveSong,
    toggleSong: handleToggleSong,
    isSongInCommunion: (id) => data.songIds.includes(id),
    isInCommunion: (id) => data.songIds.includes(id),
    reorderSongs: handleReorder,
    clearCommunion: handleClear,
    reload: reloadData,
    getAdjacentSongs: (currentSongId, allSongs) => getAdjacentCommunionSongs(currentSongId, allSongs)
  };

  return (
    <CommunionContext.Provider value={value}>
      {children}
    </CommunionContext.Provider>
  );
}

export function useCommunion() {
  const context = useContext(CommunionContext);
  if (!context) {
    throw new Error('useCommunion must be used within a CommunionProvider');
  }
  return context;
}
