import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Music } from 'lucide-react';
import { searchSongsWithFuzzy } from '../../utils/fuzzySearch.js';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search by title, artist, category...',
  autoFocus = false,
  songs = [],
  onSelectSong
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Compute top matching song suggestions (title & scale only)
  const suggestions = useMemo(() => {
    const q = String(value || '').trim();
    if (!q || !Array.isArray(songs) || songs.length === 0) {
      return [];
    }
    const { results } = searchSongsWithFuzzy(songs, q);
    return (results || []).slice(0, 6);
  }, [value, songs]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (song) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    if (typeof onSelectSong === 'function') {
      onSelectSong(song);
    } else if (song && song.id) {
      navigate(`/songs/${song.id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    setIsOpen(Boolean(newVal.trim()));
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    if (String(value || '').trim() && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="search-container" ref={containerRef}>
      <Search size={16} className="search-icon" />
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        aria-label="Search songs"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-autocomplete="list"
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search query"
        >
          <X size={14} />
        </button>
      )}

      {/* Google / Antigravity Style Attached Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="search-suggestions-dropdown" role="listbox">
          {suggestions.map((song, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={song.id || index}
                role="option"
                aria-selected={isSelected}
                className={`search-suggestion-item ${isSelected ? 'active' : ''}`}
                onMouseDown={(e) => {
                  // Prevent input blur before click triggers
                  e.preventDefault();
                  handleSelect(song);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-suggestion-left">
                  <Music size={14} className="suggestion-item-icon" />
                  <div className="suggestion-title-group">
                    <span className="suggestion-title">{song.title}</span>
                    {song.secondaryTitle && (
                      <span className="suggestion-secondary-title">({song.secondaryTitle})</span>
                    )}
                  </div>
                </div>
                <div className="search-suggestion-right">
                  <span className="suggestion-key-badge">
                    Key: {song.originalKey || 'C'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
