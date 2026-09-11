import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Music } from 'lucide-react';
import { searchSongsWithFuzzy } from '../../utils/fuzzySearch.js';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search by title, artist, category...',
  autoFocus = false,
  songs = [],
  onSelectSong,
  showSuggestions = true
}) {
  const navigate = useNavigate();
  const [localValue, setLocalValue] = useState(value || '');
  const [debouncedQuery, setDebouncedQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastTypedValueRef = useRef(value || '');
  const lastEmittedValueRef = useRef(value || '');

  // Synchronize local input state ONLY when external value prop changes legitimately
  // (e.g. Clear Search button, URL parameter navigation, or programmatic reset).
  // Stale parent prop echoes are prevented from overwriting active user typing.
  useEffect(() => {
    const incomingValue = value || '';
    // If incoming value matches what the user typed or what was emitted, treat as an echo and ignore.
    if (incomingValue === lastTypedValueRef.current || incomingValue === lastEmittedValueRef.current) {
      return;
    }
    // Legitimate external change (e.g. reset filters, URL navigation)
    lastTypedValueRef.current = incomingValue;
    lastEmittedValueRef.current = incomingValue;
    setLocalValue(incomingValue);
    setDebouncedQuery(incomingValue);
  }, [value]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Compute top matching song suggestions (title & scale only) lazily ONLY when suggestions are active & dropdown is open
  const suggestions = useMemo(() => {
    if (!showSuggestions || !isOpen) {
      return [];
    }
    const q = String(debouncedQuery || '').trim();
    if (!q || !Array.isArray(songs) || songs.length === 0) {
      return [];
    }
    const { results } = searchSongsWithFuzzy(songs, q);
    return (results || []).slice(0, 6);
  }, [debouncedQuery, songs, showSuggestions, isOpen]);

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
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
      } else if (e.key === 'Enter') {
        // Flush any pending debounce immediately on enter
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        lastEmittedValueRef.current = localValue;
        setDebouncedQuery(localValue);
        if (onChange) onChange(localValue);
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
      } else {
        // Flush pending search
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        lastEmittedValueRef.current = localValue;
        setDebouncedQuery(localValue);
        if (onChange) onChange(localValue);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    lastTypedValueRef.current = newVal;
    // 0ms immediate synchronous DOM update for buttery-smooth mobile typing
    setLocalValue(newVal);
    setSelectedIndex(-1);

    if (!newVal.trim()) {
      setIsOpen(false);
      setDebouncedQuery('');
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      lastEmittedValueRef.current = '';
      if (onChange) onChange('');
      return;
    }

    if (showSuggestions) {
      setIsOpen(true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      lastEmittedValueRef.current = newVal;
      setDebouncedQuery(newVal);
      if (onChange) onChange(newVal);
    }, 150);
  };

  const handleFocus = () => {
    if (showSuggestions && String(localValue || '').trim() && (debouncedQuery || '').trim()) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    lastTypedValueRef.current = '';
    lastEmittedValueRef.current = '';
    setLocalValue('');
    setDebouncedQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onChange) onChange('');
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
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label="Search songs"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-autocomplete="list"
      />
      {localValue && (
        <button
          type="button"
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search query"
        >
          <X size={14} />
        </button>
      )}

      {/* Attached Suggestions Dropdown */}
      {showSuggestions && isOpen && suggestions.length > 0 && (
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
