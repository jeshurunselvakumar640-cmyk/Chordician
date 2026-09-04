/**
 * LocalStorage management for non-critical user preferences
 */

const THEME_KEY = 'chordician_theme';
const VIEW_PREF_KEY = 'chordician_view_mode';
const FONT_SIZE_KEY = 'chordician_font_size';

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to store theme preference', e);
  }
}

export function getStoredViewMode() {
  try {
    return localStorage.getItem(VIEW_PREF_KEY) || 'grid';
  } catch {
    return 'grid';
  }
}

export function setStoredViewMode(mode) {
  try {
    localStorage.setItem(VIEW_PREF_KEY, mode);
  } catch (e) {
    console.error('Failed to store view mode', e);
  }
}

export function getStoredFontSize() {
  try {
    return localStorage.getItem(FONT_SIZE_KEY) || 'normal';
  } catch {
    return 'normal';
  }
}

export function setStoredFontSize(size) {
  try {
    localStorage.setItem(FONT_SIZE_KEY, size);
  } catch (e) {
    console.error('Failed to store font size', e);
  }
}
