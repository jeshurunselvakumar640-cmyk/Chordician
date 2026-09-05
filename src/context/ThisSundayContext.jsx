import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getThisSundayData,
  saveThisSundayData,
  addSongToThisSunday,
  removeSongFromThisSunday,
  toggleSongInThisSunday,
  isSongInThisSunday,
  reorderThisSunday,
  setThisSundayDate,
  clearThisSunday,
  getAdjacentSongs,
  getUpcomingSunday,
  formatServiceDate,
  getDaysUntil,
  getDaysUntilNumber,
  isDateExpired
} from '../services/thisSundayService.js';

const ThisSundayContext = createContext(null);

export function ThisSundayProvider({ children }) {
  const [data, setData] = useState(() => getThisSundayData());

  const reloadData = useCallback(() => {
    setData(getThisSundayData());
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
      if (e.key === 'chordician_this_sunday_setlist') {
        reloadData();
      }
    };

    window.addEventListener('chordician:this-sunday-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('chordician:this-sunday-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [reloadData]);

  const handleAddSong = useCallback((songId) => {
    const updated = addSongToThisSunday(songId);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleRemoveSong = useCallback((songId) => {
    const updated = removeSongFromThisSunday(songId);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleToggleSong = useCallback((songId) => {
    const isAdded = toggleSongInThisSunday(songId);
    reloadData();
    return isAdded;
  }, [reloadData]);

  const handleReorder = useCallback((fromIndex, toIndex) => {
    const updated = reorderThisSunday(fromIndex, toIndex);
    reloadData();
    return updated;
  }, [reloadData]);

  const handleSetDate = useCallback((dateStr) => {
    setThisSundayDate(dateStr);
    reloadData();
  }, [reloadData]);

  const handleClear = useCallback(() => {
    clearThisSunday();
    reloadData();
  }, [reloadData]);

  const value = {
    serviceDate: data.serviceDate,
    songIds: data.songIds,
    notes: data.notes,
    count: data.songIds.length,
    isExpired: data.isExpired,
    addSong: handleAddSong,
    removeSong: handleRemoveSong,
    toggleSong: handleToggleSong,
    isSongInSetlist: (id) => data.songIds.includes(id),
    isInThisSunday: (id) => data.songIds.includes(id),
    reorderSongs: handleReorder,
    setDate: handleSetDate,
    clearSetlist: handleClear,
    reload: reloadData,
    getAdjacentSongs: (currentSongId, allSongs) => getAdjacentSongs(currentSongId, allSongs),
    getUpcomingSunday,
    formatServiceDate,
    getDaysUntil,
    getDaysUntilNumber,
    isDateExpired
  };

  return (
    <ThisSundayContext.Provider value={value}>
      {children}
    </ThisSundayContext.Provider>
  );
}

export function useThisSunday() {
  const context = useContext(ThisSundayContext);
  if (!context) {
    throw new Error('useThisSunday must be used within a ThisSundayProvider');
  }
  return context;
}
