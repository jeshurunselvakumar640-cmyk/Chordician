import React, { useState } from 'react';
import { Languages, Piano, FileText, Check, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react';
import { useAppMode, SUPPORTED_LANGUAGES } from '../../context/AppModeContext';

const TRANSLATIONS = {
  english: {
    chooseLanguageTitle: 'Choose your language',
    chooseLanguageSubtitle: 'Select your preferred language for the application interface.',
    chooseAppTitle: 'What do you want to use?',
    chooseAppSubtitle: 'You can always switch between modes anytime in Settings.',
    continueBtn: 'Continue',
    backBtn: 'Back',
    chordicianTitle: 'Chordician',
    chordicianSubtitle: 'Piano Notes',
    chordicianDesc: 'Chords, vocal lead notes, key transpose & PDF chord sheets for musicians.',
    lyricalTitle: 'Lyrical',
    lyricalSubtitle: 'Lyrics',
    lyricalDesc: 'Worship lyrics, multi-language song sheets, lists & services for vocalists and congregation.'
  },
  tamil: {
    chooseLanguageTitle: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    chooseLanguageSubtitle: 'பயன்பாட்டு இடைமுகத்திற்கு நீங்கள் விரும்பும் மொழியைத் தேர்ந்தெடுக்கவும்.',
    chooseAppTitle: 'நீங்கள் எதைப் பயன்படுத்த விரும்புகிறீர்கள்?',
    chooseAppSubtitle: 'அமைப்புகளில் எப்போது வேண்டுமானாலும் முறைகளை மாற்றிக்கொள்ளலாம்.',
    continueBtn: 'தொடரவும்',
    backBtn: 'பின்செல்',
    chordicianTitle: 'Chordician',
    chordicianSubtitle: 'பியானோ நோட்ஸ்',
    chordicianDesc: 'இசைக்கலைஞர்களுக்கான கார்டுகள், லீட் நோட்ஸ் மற்றும் டிரான்ஸ்போஸ்.',
    lyricalTitle: 'Lyrical',
    lyricalSubtitle: 'பாடல் வரிகள்',
    lyricalDesc: 'ஆராதனைப் பாடல் வரிகள், பல மொழிப் பாடல்கள் மற்றும் ஞாயிறு பட்டியல்கள்.'
  },
  hindi: {
    chooseLanguageTitle: 'अपनी भाषा चुनें',
    chooseLanguageSubtitle: 'ऐप इंटरफेस के लिए अपनी पसंदीदा भाषा चुनें।',
    chooseAppTitle: 'आप क्या उपयोग करना चाहते हैं?',
    chooseAppSubtitle: 'आप सेटिंग्स में कभी भी मोड बदल सकते हैं।',
    continueBtn: 'आगे बढ़ें',
    backBtn: 'पीछे जाएं',
    chordicianTitle: 'Chordician',
    chordicianSubtitle: 'पियानो नोट्स',
    chordicianDesc: 'संगीतकारों के लिए कॉर्ड्स, वोकल लीड नोट्स और ट्रांसपोज़।',
    lyricalTitle: 'Lyrical',
    lyricalSubtitle: 'गीत के बोल',
    lyricalDesc: 'गायकों और कलीसिया के लिए आराधना गीत के बोल और सूचियां।'
  }
};

export default function FirstLaunchFlow() {
  const { completeSetup } = useAppMode();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedAppMode, setSelectedAppMode] = useState(null);

  const currentT = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.english;

  const handleSelectLanguage = (langId) => {
    setSelectedLanguage(langId);
    setStep(2);
  };

  const handleSelectAppMode = (modeId) => {
    setSelectedAppMode(modeId);
    completeSetup(selectedLanguage, modeId);
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        {/* Step Indicator */}
        <div className="setup-step-indicator">
          <div className={`setup-step-dot ${step === 1 ? 'active' : 'completed'}`}>1</div>
          <div className="setup-step-line" />
          <div className={`setup-step-dot ${step === 2 ? 'active' : ''}`}>2</div>
        </div>

        {/* Step 1: Choose Language */}
        {step === 1 && (
          <div className="setup-step-content animate-fade-in">
            <div className="setup-header">
              <div className="setup-icon-badge">
                <Languages size={24} />
              </div>
              <h1 className="setup-title">Choose your language</h1>
              <p className="setup-subtitle">
                Select your preferred language for the application
              </p>
            </div>

            <div className="setup-options-grid">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`setup-option-card ${selectedLanguage === lang.id ? 'selected' : ''}`}
                  onClick={() => handleSelectLanguage(lang.id)}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-native">{lang.nativeLabel}</span>
                    <span className="setup-option-english">{lang.label}</span>
                  </div>
                  <div className="setup-option-action">
                    <ArrowRight size={18} className="setup-arrow-icon" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose What You Want To Use */}
        {step === 2 && (
          <div className="setup-step-content animate-fade-in">
            <button
              type="button"
              className="setup-back-btn"
              onClick={() => setStep(1)}
              aria-label="Back to language selection"
            >
              <ChevronLeft size={18} />
              <span>{currentT.backBtn}</span>
            </button>

            <div className="setup-header">
              <div className="setup-icon-badge setup-icon-sparkle">
                <Sparkles size={24} />
              </div>
              <h1 className="setup-title">{currentT.chooseAppTitle}</h1>
              <p className="setup-subtitle">{currentT.chooseAppSubtitle}</p>
            </div>

            <div className="setup-modes-grid">
              {/* Chordician (Piano Notes) Option */}
              <button
                type="button"
                className={`setup-mode-card ${selectedAppMode === 'chordician' ? 'selected' : ''}`}
                onClick={() => handleSelectAppMode('chordician')}
              >
                <div className="setup-mode-icon-wrapper setup-chordician-icon">
                  <Piano size={28} />
                </div>
                <div className="setup-mode-body">
                  <div className="setup-mode-header-row">
                    <h2 className="setup-mode-title">{currentT.chordicianTitle}</h2>
                    <span className="setup-mode-badge">{currentT.chordicianSubtitle}</span>
                  </div>
                  <p className="setup-mode-desc">{currentT.chordicianDesc}</p>
                </div>
              </button>

              {/* Lyrical (Lyrics) Option */}
              <button
                type="button"
                className={`setup-mode-card ${selectedAppMode === 'lyrical' ? 'selected' : ''}`}
                onClick={() => handleSelectAppMode('lyrical')}
              >
                <div className="setup-mode-icon-wrapper setup-lyrical-icon">
                  <FileText size={28} />
                </div>
                <div className="setup-mode-body">
                  <div className="setup-mode-header-row">
                    <h2 className="setup-mode-title">{currentT.lyricalTitle}</h2>
                    <span className="setup-mode-badge setup-lyrical-badge">{currentT.lyricalSubtitle}</span>
                  </div>
                  <p className="setup-mode-desc">{currentT.lyricalDesc}</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
