import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Check,
  Music,
  Sliders,
  Sparkles,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import {
  STYLE_CATEGORIES,
  SONG_STYLES,
  getStylesByCategory,
  searchStyles,
  formatStyleCode
} from '../../data/songStyles.js';

export default function StyleSelectorModal({
  isOpen,
  onClose,
  selectedStyle,
  onSelectStyle
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Indian');
  const searchInputRef = useRef(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Set active category to currently selected style's category if opening modal
  useEffect(() => {
    if (isOpen && selectedStyle?.category) {
      setActiveCategory(selectedStyle.category);
    }
  }, [isOpen, selectedStyle]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered styles based on search or category
  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return searchStyles(searchQuery);
  }, [isSearching, searchQuery]);

  const categoryStyles = useMemo(() => {
    return getStylesByCategory(activeCategory);
  }, [activeCategory]);

  if (!isOpen) return null;

  const handleSelect = (style) => {
    onSelectStyle(style);
    onClose();
  };

  const handleClear = () => {
    onSelectStyle(null);
    onClose();
  };

  const isCurrentSelection = (style) => {
    if (!selectedStyle || !style) return false;
    return (
      selectedStyle.name === style.name &&
      selectedStyle.category === style.category &&
      selectedStyle.churchStyleNumber === style.churchStyleNumber
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container style-selector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header style-selector-header">
          <div className="style-selector-title-group">
            <div className="style-selector-icon-badge">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="modal-title">Select Musical Style</h2>
              <p className="modal-subtitle">
                Choose a keyboard / church style for rhythm and accompaniment
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close style selector"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Field */}
        <div className="style-search-wrapper">
          <div className="style-search-box">
            <Search size={18} className="style-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="style-search-input"
              placeholder="Search by style name, category, or code (e.g. Dandiya, 193, 090)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="style-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="style-selector-body">
          {isSearching ? (
            /* Search Results View */
            <div className="style-search-results">
              <div className="style-results-header">
                <span className="style-results-count">
                  {searchResults.length} {searchResults.length === 1 ? 'style' : 'styles'} found for "{searchQuery}"
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="style-empty-state">
                  <Music size={36} className="style-empty-icon" />
                  <p className="style-empty-title">No matching styles found</p>
                  <p className="style-empty-sub">
                    Try searching with another keyword or code (e.g., "Ballad", "001", "111")
                  </p>
                </div>
              ) : (
                <div className="style-cards-grid">
                  {searchResults.map((style) => {
                    const isSelected = isCurrentSelection(style);
                    return (
                      <button
                        key={style.id || `${style.category}_${style.name}_${style.churchStyleNumber}`}
                        type="button"
                        className={`style-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelect(style)}
                      >
                        <div className="style-card-content">
                          <div className="style-card-name-row">
                            <span className="style-card-name">{style.name}</span>
                            <span className="style-card-category-badge">{style.category}</span>
                          </div>
                          <span className="style-card-code">
                            {formatStyleCode(style)}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="style-card-check">
                            <Check size={18} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Category Navigation + Style List View */
            <div className="style-category-layout">
              {/* Category Sidebar / Tabs */}
              <div className="style-category-nav" role="tablist">
                {STYLE_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  const catStyles = getStylesByCategory(cat);
                  const hasSelection = selectedStyle?.category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`style-category-tab ${isActive ? 'active' : ''} ${hasSelection ? 'has-selected' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      <span className="style-category-tab-name">{cat}</span>
                      <span className="style-category-tab-count">{catStyles.length}</span>
                      {hasSelection && <span className="style-category-dot" />}
                    </button>
                  );
                })}
              </div>

              {/* Styles in Active Category */}
              <div className="style-category-content">
                <div className="style-category-header">
                  <h3 className="style-category-active-title">
                    {activeCategory}
                  </h3>
                  <span className="style-category-active-count">
                    {categoryStyles.length} styles available
                  </span>
                </div>

                <div className="style-cards-grid">
                  {categoryStyles.map((style) => {
                    const isSelected = isCurrentSelection(style);
                    return (
                      <button
                        key={style.id || `${style.category}_${style.name}_${style.churchStyleNumber}`}
                        type="button"
                        className={`style-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelect(style)}
                      >
                        <div className="style-card-content">
                          <span className="style-card-name">{style.name}</span>
                          <span className="style-card-code">
                            {formatStyleCode(style)}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="style-card-check">
                            <Check size={18} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer style-selector-footer">
          <div className="style-footer-selected-info">
            {selectedStyle ? (
              <div className="style-current-tag">
                <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
                <span>
                  Selected: <strong>{selectedStyle.category} → {selectedStyle.name}</strong> ({formatStyleCode(selectedStyle)})
                </span>
              </div>
            ) : (
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                No style currently selected
              </span>
            )}
          </div>

          <div className="style-footer-actions">
            {selectedStyle && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClear}
                title="Remove selected style"
              >
                <RotateCcw size={15} />
                <span>Clear Style</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
