import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LANGUAGE_KEY = 'chordician_language';
const APP_MODE_KEY = 'chordician_app_mode';

export const SUPPORTED_LANGUAGES = [
  { id: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { id: 'english', label: 'English', nativeLabel: 'English' },
  { id: 'hindi', label: 'Hindi', nativeLabel: 'हिन्दी' }
];

export const APP_MODES = [
  { id: 'chordician', title: 'Chordician', subtitle: 'Piano Notes' },
  { id: 'lyrical', title: 'Lyrical', subtitle: 'Lyrics' }
];

const AppModeContext = createContext({
  language: 'english',
  appMode: 'chordician',
  isSetupComplete: true,
  setLanguage: () => {},
  setAppMode: () => {},
  completeSetup: () => {},
  resetSetup: () => {}
});

export function AppModeProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || 'english';
    } catch {
      return 'english';
    }
  });

  const [appMode, setAppModeState] = useState(() => {
    try {
      return localStorage.getItem(APP_MODE_KEY) || 'chordician';
    } catch {
      return 'chordician';
    }
  });

  // Handle browser back / forward navigation between Lyrical and Chordician modes
  useEffect(() => {
    const handlePopState = (event) => {
      const path = window.location.pathname;
      if (path.startsWith('/song/') || event.state?.fromLyrical) {
        setAppModeState('lyrical');
        try {
          localStorage.setItem(APP_MODE_KEY, 'lyrical');
        } catch {}
      } else if (path.startsWith('/songs') || path.startsWith('/lead-notes') || path.startsWith('/custom-notes')) {
        setAppModeState('chordician');
        try {
          localStorage.setItem(APP_MODE_KEY, 'chordician');
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isSetupComplete, setIsSetupComplete] = useState(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_KEY);
      const savedMode = localStorage.getItem(APP_MODE_KEY);
      return Boolean(savedLang && savedMode);
    } catch {
      return true;
    }
  });

  const setLanguage = useCallback((newLang) => {
    if (['tamil', 'english', 'hindi'].includes(newLang)) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(LANGUAGE_KEY, newLang);
      } catch (e) {
        console.warn('Could not save language to localStorage:', e);
      }
    }
  }, []);

  const setAppMode = useCallback((newMode) => {
    if (['chordician', 'lyrical'].includes(newMode)) {
      setAppModeState(newMode);
      try {
        localStorage.setItem(APP_MODE_KEY, newMode);
      } catch (e) {
        console.warn('Could not save app mode to localStorage:', e);
      }
    }
  }, []);

  const completeSetup = useCallback((selectedLang, selectedMode) => {
    const finalLang = ['tamil', 'english', 'hindi'].includes(selectedLang) ? selectedLang : 'english';
    const finalMode = ['chordician', 'lyrical'].includes(selectedMode) ? selectedMode : 'chordician';

    setLanguageState(finalLang);
    setAppModeState(finalMode);
    setIsSetupComplete(true);

    try {
      localStorage.setItem(LANGUAGE_KEY, finalLang);
      localStorage.setItem(APP_MODE_KEY, finalMode);
    } catch (e) {
      console.warn('Could not save setup preferences to localStorage:', e);
    }
  }, []);

  const resetSetup = useCallback(() => {
    setIsSetupComplete(false);
    try {
      localStorage.removeItem(LANGUAGE_KEY);
      localStorage.removeItem(APP_MODE_KEY);
    } catch (e) {
      console.warn('Could not remove setup preferences from localStorage:', e);
    }
  }, []);

  return (
    <AppModeContext.Provider
      value={{
        language,
        appMode,
        isSetupComplete,
        setLanguage,
        setAppMode,
        completeSetup,
        resetSetup
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
