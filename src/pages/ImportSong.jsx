import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Music,
  Check,
  RotateCcw,
  ExternalLink,
  Sliders,
  ClipboardPaste
} from 'lucide-react';
import { parseSongFromImage, DEMO_PRESETS } from '../services/aiSongParser.js';
import {
  importSongFromUrl,
  restructureSongTextWithChordexAI,
  SAMPLE_URL_PRESETS,
  SAMPLE_TEXT_PRESETS,
  validateClientUrl
} from '../services/urlSongParser.js';
import { useToast } from '../context/ToastContext.jsx';
import SectionViewer from '../components/SongView/SectionViewer';
import KeyBadge from '../components/UI/KeyBadge';

export default function ImportSong() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Import Tab: 'url' | 'paste' | 'image'
  const [activeTab, setActiveTab] = useState('url');

  // URL Import State
  const [urlInput, setUrlInput] = useState('');
  const [selectedUrlPreset, setSelectedUrlPreset] = useState(null);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [urlLoadingStep, setUrlLoadingStep] = useState(1);

  // Smart Paste Text State
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textArtist, setTextArtist] = useState('');
  const [selectedTextPreset, setSelectedTextPreset] = useState(null);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [pasteLoadingStep, setPasteLoadingStep] = useState(1);
  const [pasteLoadingMessage, setPasteLoadingMessage] = useState('Reading chord and lyric input...');

  // Image / Vision Import State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImagePreset, setSelectedImagePreset] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Universal Analysis Result & Preview State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showReview, setShowReview] = useState(true); // Default preview expanded

  // --- Handlers for URL Import ---
  const handleAnalyzeUrl = async (targetUrlParam = null) => {
    const targetUrl = (typeof targetUrlParam === 'string' ? targetUrlParam : urlInput).trim();
    if (!targetUrl) {
      showToast('Please enter a webpage URL or pick a sample.', 'warning');
      return;
    }

    const validation = validateClientUrl(targetUrl);
    if (!validation.valid) {
      showToast(validation.error, 'warning');
      return;
    }

    setIsAnalyzingUrl(true);
    setUrlLoadingStep(1);
    setAnalysisResult(null);

    // Multi-stage progressive loading steps for thorough, deep AI reconstruction
    const t1 = setTimeout(() => setUrlLoadingStep(2), 1500);
    const t2 = setTimeout(() => setUrlLoadingStep(3), 3500);
    const t3 = setTimeout(() => setUrlLoadingStep(4), 6000);

    try {
      const res = await importSongFromUrl(targetUrl);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsAnalyzingUrl(false);

      if (res.success && res.song) {
        setAnalysisResult({
          sourceType: 'url',
          sourceUrl: res.sourceUrl || targetUrl,
          song: res.song,
          warnings: res.warnings || []
        });
        showToast('✓ Webpage analyzed and chords reconstructed!', 'success');
      } else {
        showToast(res.error || 'Failed to extract song from this webpage.', 'error');
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error(err);
      setIsAnalyzingUrl(false);
      showToast(err.message || 'An error occurred during URL import.', 'error');
    }
  };

  const handleUrlPaste = (e) => {
    const pastedText = e.clipboardData?.getData('text');
    if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://') || pastedText.includes('.'))) {
      const cleaned = pastedText.trim();
      setUrlInput(cleaned);
      setSelectedUrlPreset(null);
      showToast('URL pasted! Initiating Chordex AI extraction...', 'info');
      setTimeout(() => {
        handleAnalyzeUrl(cleaned);
      }, 120);
    }
  };

  const handlePasteClipboardUrl = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const cleaned = text.trim();
          setUrlInput(cleaned);
          setSelectedUrlPreset(null);
          showToast('URL pasted from clipboard! Analyzing...', 'info');
          handleAnalyzeUrl(cleaned);
        } else {
          showToast('Clipboard is empty or contains no text.', 'warning');
        }
      } else {
        showToast('Please press Ctrl+V inside the box to paste your URL.', 'info');
      }
    } catch {
      showToast('Please press Ctrl+V inside the box to paste your URL.', 'info');
    }
  };

  const handleSelectUrlPreset = (preset) => {
    setSelectedUrlPreset(preset.id);
    setUrlInput(preset.url);
    setAnalysisResult(null);
  };

  // --- Handlers for Smart Paste Text Import ---
  const handleAnalyzeText = async () => {
    const rawContent = textInput.trim();
    if (!rawContent && !selectedTextPreset) {
      showToast('Please paste song chords/lyrics text or pick a sample.', 'warning');
      return;
    }

    setIsAnalyzingText(true);
    setPasteLoadingStep(1);
    setPasteLoadingMessage('Reading and preprocessing chords & lyrics...');
    setAnalysisResult(null);

    // Timers for multi-step progress feedback during reconstruction
    const timer1 = setTimeout(() => {
      setPasteLoadingStep(2);
      setPasteLoadingMessage('Scanning chord patterns & separating attached syllables...');
    }, 500);

    const timer2 = setTimeout(() => {
      setPasteLoadingStep(3);
      setPasteLoadingMessage('Chordex AI reconstructing stanzas, chords & alignments...');
    }, 1300);

    const timer3 = setTimeout(() => {
      setPasteLoadingStep(4);
      setPasteLoadingMessage('Formatting musical sections and preparing song sheet...');
    }, 2200);

    try {
      const res = await restructureSongTextWithChordexAI(
        rawContent,
        { title: textTitle, artist: textArtist },
        selectedTextPreset
      );
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzingText(false);

      if (res.success && res.song) {
        setAnalysisResult({
          sourceType: 'paste',
          sourceUrl: 'Smart Paste / Clipboard',
          song: res.song,
          warnings: res.warnings || []
        });
        showToast('✓ Chords and lyrics reconstructed with Chordex AI!', 'success');
      } else {
        showToast(res.error || 'Failed to restructure song text.', 'error');
      }
    } catch (err) {
      console.error(err);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzingText(false);
      showToast(err.message || 'An error occurred during text analysis.', 'error');
    }
  };

  const handleSelectTextPreset = (preset) => {
    setSelectedTextPreset(preset.id);
    setTextInput(preset.rawText);
    setTextTitle(preset.title.split(' (')[0]);
    setAnalysisResult(null);
  };

  // --- Handlers for Image / Vision Import ---
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, WEBP).', 'warning');
      return;
    }

    setImageFile(file);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setSelectedImagePreset(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview && !selectedImagePreset) {
      showToast('Please select or upload an image to analyze.', 'warning');
      return;
    }

    setIsAnalyzingImage(true);
    setAnalysisResult(null);

    try {
      const res = await parseSongFromImage(imageFile || imagePreview, selectedImagePreset);
      setIsAnalyzingImage(false);

      if (res.success && res.song) {
        setAnalysisResult({
          sourceType: 'image',
          sourceUrl: 'Screenshot Upload',
          chordexData: res.chordexData,
          song: res.song,
          warnings: []
        });
        showToast('✓ Chordex AI image analysis complete!', 'success');
      } else {
        showToast(res.error || 'AI analysis failed. Please try a clearer screenshot.', 'error');
      }
    } catch (err) {
      console.error(err);
      setIsAnalyzingImage(false);
      showToast(err.message || 'An error occurred during AI analysis.', 'error');
    }
  };

  // --- Common Handlers ---
  const handleImportToEditor = () => {
    if (!analysisResult?.song) return;
    navigate('/add-song', { state: { prefilledSong: analysisResult.song } });
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setUrlInput('');
    setSelectedUrlPreset(null);
    setTextInput('');
    setTextTitle('');
    setTextArtist('');
    setSelectedTextPreset(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedImagePreset(null);
  };

  const handleDownloadJSON = () => {
    if (!analysisResult?.song) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysisResult.song, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${analysisResult.song.title || 'imported_song'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Song JSON downloaded', 'info');
  };

  return (
    <div className="import-song-page">
      {/* Top Header */}
      <div className="import-header">
        <div className="import-header-icon">
          {activeTab === 'url' ? <Globe size={28} /> : activeTab === 'paste' ? <ClipboardPaste size={28} /> : <Sparkles size={28} />}
        </div>
        <h1 className="import-title">
          {activeTab === 'url'
            ? 'Import from Webpage URL'
            : activeTab === 'paste'
            ? 'Smart Paste & Chord Restructuring'
            : 'Chordex AI Vision Import'}
        </h1>
        <p className="import-subtitle">
          {activeTab === 'url'
            ? 'Paste any webpage containing song lyrics and chords. Chordician will safely extract the music, align chord positions, and prepare it for your editor.'
            : activeTab === 'paste'
            ? 'Paste messy chord-and-lyrics text from WhatsApp, websites, PDFs, or notes. Chordex AI will intelligently separate attached chords, align them above lyrics, and format sections.'
            : 'Import chords & lyrics from screenshot photos using Google Gemini Vision. Chords are visually positioned above their corresponding lyric lines.'}
        </p>
      </div>

      {/* Segmented Tab Bar */}
      {!analysisResult && (
        <div className="import-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'url'}
            className={`import-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => { setActiveTab('url'); setAnalysisResult(null); }}
          >
            <Globe size={18} />
            <span>Import from URL</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'paste'}
            className={`import-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => { setActiveTab('paste'); setAnalysisResult(null); }}
          >
            <ClipboardPaste size={18} />
            <span>Smart Paste</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'image'}
            className={`import-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => { setActiveTab('image'); setAnalysisResult(null); }}
          >
            <Sparkles size={18} />
            <span>AI Vision (Screenshot)</span>
          </button>
        </div>
      )}

      {/* --- TAB 1: IMPORT FROM URL --- */}
      {activeTab === 'url' && !analysisResult && (
        <div className="card import-card import-card-url">
          <div className="import-section-header">
            <div className="import-section-icon-badge">
              <Globe size={22} />
            </div>
            <div>
              <h2 className="import-section-title">
                Enter Webpage URL
              </h2>
              <p className="import-section-subtitle">
                Paste any link containing song lyrics and chords (worship charts, blogs, tabs).
              </p>
            </div>
          </div>

          <div className="url-input-container-premium">
            <div className="url-input-box-glow">
              <div className="url-input-icon-glow">
                <Globe size={20} />
              </div>
              <input
                type="url"
                className="url-input-field-premium"
                placeholder="https://tamilchristiansongs.in/tamil/chords/maravaamal-ninaiththeeraiyaa/"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setSelectedUrlPreset(null);
                }}
                onPaste={handleUrlPaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAnalyzingUrl) {
                    e.preventDefault();
                    handleAnalyzeUrl();
                  }
                }}
                disabled={isAnalyzingUrl}
              />
              <div className="url-input-actions-inside">
                {!urlInput && (
                  <button
                    type="button"
                    className="url-paste-quick-btn"
                    onClick={handlePasteClipboardUrl}
                    title="Paste URL from Clipboard (Ctrl+V)"
                    disabled={isAnalyzingUrl}
                  >
                    <ClipboardPaste size={14} />
                    <span>Paste</span>
                    <span className="url-paste-kbd">Ctrl+V</span>
                  </button>
                )}
                {urlInput && (
                  <button
                    type="button"
                    className="url-input-clear-btn"
                    onClick={() => { setUrlInput(''); setSelectedUrlPreset(null); }}
                    aria-label="Clear URL"
                    disabled={isAnalyzingUrl}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="url-submit-btn-premium"
                onClick={() => handleAnalyzeUrl()}
                disabled={isAnalyzingUrl || (!urlInput.trim() && !selectedUrlPreset)}
              >
                {isAnalyzingUrl ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Analyze URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Supported Sites & Formats Ribbon */}
            <div className="url-supported-platforms-bar">
              <span className="url-supported-label">Supported:</span>
              <span className="url-platform-chip">✝️ Tamil & Hindi Worship</span>
              <span className="url-platform-chip">🎵 Ultimate Guitar</span>
              <span className="url-platform-chip">🎼 Hymnary & PraiseCharts</span>
              <span className="url-platform-chip">🎸 Chordify & Web Tabs</span>
              <span className="url-platform-chip">🌐 Any Chord Blog</span>
            </div>
          </div>

          {/* Active URL Loading Status Card with Progressive Steps */}
          {isAnalyzingUrl && (
            <div className="url-import-loading-card">
              <div className="url-loading-header">
                <div className="url-loading-orbit">
                  <Globe size={26} className="url-loading-globe-icon" />
                  <div className="url-loading-sparkle">
                    <Sparkles size={14} />
                  </div>
                  <div className="url-loading-spinner-ring"></div>
                </div>
                <div className="url-loading-title-group">
                  <div className="url-loading-badge-row">
                    <span className="badge badge-primary">CHORDEX AI URL PARSER</span>
                    <span className="url-loading-step-tag">Step {urlLoadingStep} of 4</span>
                  </div>
                  <h3 className="url-loading-main-title">
                    {urlLoadingStep === 1 && 'Connecting & Fetching Webpage...'}
                    {urlLoadingStep === 2 && 'Scanning & Extracting Lyric & Chord Blocks...'}
                    {urlLoadingStep === 3 && 'Restructuring Chord Alignment with Chordex AI...'}
                    {urlLoadingStep >= 4 && 'Synthesizing Song Structure & Key...'}
                  </h3>
                  <p className="url-loading-target-url" title={urlInput}>
                    <ExternalLink size={12} />
                    <span>{urlInput || 'Selected sample chord sheet'}</span>
                  </p>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="url-progress-bar-track">
                <div
                  className="url-progress-bar-fill"
                  style={{ width: `${Math.min(100, urlLoadingStep * 25)}%` }}
                ></div>
              </div>

              {/* Multi-Step Indicator */}
              <div className="url-steps-grid">
                <div className={`url-step-item ${urlLoadingStep >= 1 ? (urlLoadingStep > 1 ? 'completed' : 'active') : ''}`}>
                  <div className="url-step-bullet">
                    {urlLoadingStep > 1 ? <Check size={12} /> : urlLoadingStep === 1 ? <Loader2 size={12} className="animate-spin" /> : '1'}
                  </div>
                  <div className="url-step-text">
                    <span className="url-step-name">Fetch Webpage</span>
                    <span className="url-step-sub">Connecting to URL</span>
                  </div>
                </div>

                <div className={`url-step-item ${urlLoadingStep >= 2 ? (urlLoadingStep > 2 ? 'completed' : 'active') : ''}`}>
                  <div className="url-step-bullet">
                    {urlLoadingStep > 2 ? <Check size={12} /> : urlLoadingStep === 2 ? <Loader2 size={12} className="animate-spin" /> : '2'}
                  </div>
                  <div className="url-step-text">
                    <span className="url-step-name">Extract Chords</span>
                    <span className="url-step-sub">Scanning text blocks</span>
                  </div>
                </div>

                <div className={`url-step-item ${urlLoadingStep >= 3 ? (urlLoadingStep > 3 ? 'completed' : 'active') : ''}`}>
                  <div className="url-step-bullet">
                    {urlLoadingStep > 3 ? <Check size={12} /> : urlLoadingStep === 3 ? <Loader2 size={12} className="animate-spin" /> : '3'}
                  </div>
                  <div className="url-step-text">
                    <span className="url-step-name">Chordex AI</span>
                    <span className="url-step-sub">Aligning chords</span>
                  </div>
                </div>

                <div className={`url-step-item ${urlLoadingStep >= 4 ? 'active' : ''}`}>
                  <div className="url-step-bullet">
                    {urlLoadingStep >= 4 ? <Loader2 size={12} className="animate-spin" /> : '4'}
                  </div>
                  <div className="url-step-text">
                    <span className="url-step-name">Build Song</span>
                    <span className="url-step-sub">Ready for review</span>
                  </div>
                </div>
              </div>

              {/* Shimmer Skeleton Preview */}
              <div className="url-loading-skeleton-preview">
                <div className="skeleton-chord-row">
                  <div className="skeleton-pill" style={{ width: '65px' }}></div>
                  <div className="skeleton-pill" style={{ width: '45px' }}></div>
                  <div className="skeleton-pill" style={{ width: '55px' }}></div>
                </div>
                <div className="skeleton-lyric-row">
                  <div className="skeleton-line" style={{ width: '85%' }}></div>
                </div>
                <div className="skeleton-chord-row" style={{ marginTop: '8px' }}>
                  <div className="skeleton-pill" style={{ width: '50px' }}></div>
                  <div className="skeleton-pill" style={{ width: '70px' }}></div>
                </div>
                <div className="skeleton-lyric-row">
                  <div className="skeleton-line" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Sample URL Presets */}
          <div className="import-preset-section">
            <label className="form-label">
              Or test with sample chord chart URLs:
            </label>
            <div className="import-preset-grid">
              {SAMPLE_URL_PRESETS.map((preset) => {
                const isSelected = selectedUrlPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectUrlPreset(preset)}
                    className={`import-preset-card ${isSelected ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="import-preset-card-header">
                      <strong className="import-preset-name">
                        {preset.title}
                      </strong>
                      {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />}
                    </div>
                    <p className="import-preset-desc">
                      {preset.description}
                    </p>
                    <span className="import-preset-url-badge">
                      <ExternalLink size={12} />
                      {new URL(preset.url).hostname}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SMART PASTE TEXT --- */}
      {activeTab === 'paste' && !analysisResult && (
        <div className="card import-card">
          <div className="import-section-header">
            <h2 className="import-section-title">
              <ClipboardPaste size={20} style={{ color: 'var(--color-primary)' }} />
              Paste Chords & Lyrics Text
            </h2>
            <p className="import-section-subtitle">
              Paste raw chords sheet text. Chordex AI separates attached chords (e.g. <code>DmMaravaamal</code>), reconstructs horizontal alignments, and detects sections.
            </p>
          </div>

          <div className="smart-paste-wrapper">
            <textarea
              className="smart-paste-textarea"
              rows={8}
              placeholder={`Paste your song text here. Examples:\n\nDmMaravaamal NinaiththeeraiyaaAmA#Manathaara NanCRi Solvaen-2\nor\n[Dm]Maravaamal [Am]Ninaiththeeraiyaa [A#]Manathaara [C]Nanri Solvaen\nor\nDm                   Am\nMaravaamal Ninaiththeeraiyaa`}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setSelectedTextPreset(null);
              }}
              disabled={isAnalyzingText}
            />

            <div className="smart-paste-meta-row">
              <div>
                <label className="form-label" htmlFor="paste-title">Song Title (Optional)</label>
                <input
                  id="paste-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maravaamal Ninaiththeeraiyaa"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  disabled={isAnalyzingText}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="paste-artist">Artist (Optional)</label>
                <input
                  id="paste-artist"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fr. Berchmans"
                  value={textArtist}
                  onChange={(e) => setTextArtist(e.target.value)}
                  disabled={isAnalyzingText}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzingText || (!textInput.trim() && !selectedTextPreset)}
                >
                  {isAnalyzingText ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Reconstructing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Restructure with Chordex</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart Paste Dynamic Step Progress & Skeleton Loading Indicator */}
            {isAnalyzingText && (
              <div className="url-loading-indicator" style={{ marginTop: '20px' }}>
                <div className="url-loading-header">
                  <div className="url-loading-spinner-wrap">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="url-loading-info">
                    <h4 className="url-loading-title">Reconstructing Chords & Lyrics</h4>
                    <p className="url-loading-desc">{pasteLoadingMessage}</p>
                  </div>
                  <span className="badge badge-primary url-loading-badge">
                    Step {pasteLoadingStep} of 4
                  </span>
                </div>

                {/* Progress Track */}
                <div className="url-steps-track">
                  <div className={`url-step-item ${pasteLoadingStep >= 1 ? (pasteLoadingStep > 1 ? 'completed' : 'active') : ''}`}>
                    <div className="url-step-bullet">
                      {pasteLoadingStep > 1 ? <Check size={12} /> : <Loader2 size={12} className="animate-spin" />}
                    </div>
                    <div className="url-step-text">
                      <span className="url-step-name">Read Text</span>
                      <span className="url-step-sub">Pasted stream</span>
                    </div>
                  </div>

                  <div className={`url-step-item ${pasteLoadingStep >= 2 ? (pasteLoadingStep > 2 ? 'completed' : 'active') : ''}`}>
                    <div className="url-step-bullet">
                      {pasteLoadingStep > 2 ? <Check size={12} /> : pasteLoadingStep === 2 ? <Loader2 size={12} className="animate-spin" /> : '2'}
                    </div>
                    <div className="url-step-text">
                      <span className="url-step-name">Detect Chords</span>
                      <span className="url-step-sub">Attached letters</span>
                    </div>
                  </div>

                  <div className={`url-step-item ${pasteLoadingStep >= 3 ? (pasteLoadingStep > 3 ? 'completed' : 'active') : ''}`}>
                    <div className="url-step-bullet">
                      {pasteLoadingStep > 3 ? <Check size={12} /> : pasteLoadingStep === 3 ? <Loader2 size={12} className="animate-spin" /> : '3'}
                    </div>
                    <div className="url-step-text">
                      <span className="url-step-name">Chordex AI</span>
                      <span className="url-step-sub">Aligning lyrics</span>
                    </div>
                  </div>

                  <div className={`url-step-item ${pasteLoadingStep >= 4 ? 'active' : ''}`}>
                    <div className="url-step-bullet">
                      {pasteLoadingStep >= 4 ? <Loader2 size={12} className="animate-spin" /> : '4'}
                    </div>
                    <div className="url-step-text">
                      <span className="url-step-name">Build Song</span>
                      <span className="url-step-sub">Sections & rows</span>
                    </div>
                  </div>
                </div>

                {/* Shimmer Skeleton Preview */}
                <div className="url-loading-skeleton-preview">
                  <div className="skeleton-chord-row">
                    <div className="skeleton-pill" style={{ width: '60px' }}></div>
                    <div className="skeleton-pill" style={{ width: '45px' }}></div>
                    <div className="skeleton-pill" style={{ width: '55px' }}></div>
                    <div className="skeleton-pill" style={{ width: '40px' }}></div>
                  </div>
                  <div className="skeleton-lyric-row">
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                  </div>
                  <div className="skeleton-chord-row" style={{ marginTop: '10px' }}>
                    <div className="skeleton-pill" style={{ width: '50px' }}></div>
                    <div className="skeleton-pill" style={{ width: '65px' }}></div>
                    <div className="skeleton-pill" style={{ width: '40px' }}></div>
                  </div>
                  <div className="skeleton-lyric-row">
                    <div className="skeleton-line" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sample Text Presets */}
          <div className="import-preset-section" style={{ marginTop: '24px' }}>
            <label className="form-label">
              Or test with sample raw chord sheets:
            </label>
            <div className="import-preset-grid">
              {SAMPLE_TEXT_PRESETS.map((preset) => {
                const isSelected = selectedTextPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectTextPreset(preset)}
                    className={`import-preset-card ${isSelected ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="import-preset-card-header">
                      <strong className="import-preset-name">
                        {preset.title}
                      </strong>
                      {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />}
                    </div>
                    <p className="import-preset-desc">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CHORDEX AI VISION (IMAGE) --- */}
      {activeTab === 'image' && !analysisResult && (
        <div className="card import-dropzone-card">
          {!imagePreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`import-dropzone ${isDragging ? 'is-dragging' : ''}`}
              onClick={() => document.getElementById('image-upload-input').click()}
              role="button"
              tabIndex={0}
            >
              <input
                id="image-upload-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <UploadCloud size={46} className="import-upload-icon" />
              <h3 className="import-dropzone-title">
                Upload Chord Sheet Screenshot
              </h3>
              <p className="import-dropzone-subtitle">
                Supports PNG, JPG, JPEG, WEBP or camera photos
              </p>
              <button type="button" className="btn btn-secondary import-browse-btn">
                <ImageIcon size={16} />
                Choose Image File
              </button>
            </div>
          ) : (
            <div className="import-preview-wrapper">
              <img
                src={imagePreview}
                alt="Chord sheet preview"
                className="import-preview-img"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm import-remove-btn"
                onClick={handleRemoveImage}
                title="Remove image"
              >
                <X size={16} />
                Change Image
              </button>
            </div>
          )}

          {/* Preset Sample Selector */}
          <div className="import-preset-section">
            <label className="form-label">
              Or test with sample screenshot charts:
            </label>
            <div className="import-preset-grid">
              {DEMO_PRESETS.map((preset) => {
                const isSelected = selectedImagePreset === preset.id && !imagePreview;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedImagePreset(preset.id);
                      setImagePreview(null);
                      setImageFile(null);
                      setAnalysisResult(null);
                    }}
                    className={`import-preset-card ${isSelected ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="import-preset-card-header">
                      <strong className="import-preset-name">
                        {preset.name}
                      </strong>
                      {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--color-primary)' }} />}
                    </div>
                    <p className="import-preset-desc">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="import-action-bar">
            <button
              type="button"
              className="btn btn-primary btn-lg import-submit-btn"
              onClick={handleAnalyzeImage}
              disabled={isAnalyzingImage || (!imagePreview && !selectedImagePreset)}
            >
              {isAnalyzingImage ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Analyzing with Gemini Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Analyze with Chordex</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- UNIVERSAL IMPORT PREVIEW --- */}
      {analysisResult && (
        <div className="card import-preview-card" style={{ animation: 'modalFadeIn var(--transition-normal)' }}>
          {/* Header */}
          <div className="import-preview-header">
            <div className="import-preview-title-col">
              <div className="import-preview-success-badge">
                <Check size={20} />
              </div>
              <div>
                <div className="import-preview-badge-row">
                  <span className="import-source-badge">
                    {analysisResult.sourceType === 'url' ? (
                      <>
                        <Globe size={13} /> Webpage Import
                      </>
                    ) : analysisResult.sourceType === 'paste' ? (
                      <>
                        <ClipboardPaste size={13} /> Smart Paste
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> Chordex AI Vision
                      </>
                    )}
                  </span>
                  <KeyBadge songKey={analysisResult.song.originalKey || 'C'} />
                  {analysisResult.song.style?.name && (
                    <span className="badge badge-style">
                      <Sliders size={11} />
                      {analysisResult.song.style.name}
                    </span>
                  )}
                </div>
                <h2 className="import-preview-song-title">
                  {analysisResult.song.title}
                </h2>
                <p className="import-preview-artist">
                  {analysisResult.song.artist || 'Unknown Artist'}
                  {analysisResult.sourceUrl && analysisResult.sourceType === 'url' && (
                    <span className="import-preview-url-tag">
                      • {(() => {
                        try { return new URL(analysisResult.sourceUrl).hostname; } catch { return analysisResult.sourceUrl; }
                      })()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="import-preview-header-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
                title="Import another song"
              >
                <RotateCcw size={15} />
                <span>Import Another</span>
              </button>
            </div>
          </div>

          {/* Statistics summary */}
          <div className="import-stats-grid">
            <div className="import-stat-item">
              <span className="import-stat-label">Sections</span>
              <strong className="import-stat-value">{analysisResult.song.sections?.length || 0}</strong>
            </div>
            <div className="import-stat-item">
              <span className="import-stat-label">Total Rows</span>
              <strong className="import-stat-value">
                {analysisResult.song.sections?.reduce((acc, s) => acc + (s.rows?.length || 0), 0) || 0}
              </strong>
            </div>
            <div className="import-stat-item">
              <span className="import-stat-label">Chord Rows</span>
              <strong className="import-stat-value">
                {analysisResult.song.sections?.reduce((acc, s) =>
                  acc + (s.rows?.filter(r => r.type === 'chords' && r.content.trim())?.length || 0), 0) || 0}
              </strong>
            </div>
          </div>

          {/* Warnings Banner if any */}
          {analysisResult.warnings?.length > 0 && (
            <div className="import-warning-banner">
              <AlertTriangle size={18} className="text-warning flex-shrink-0" />
              <div>
                <strong>Notice:</strong> {analysisResult.warnings.join(' ')}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="import-bottom-actions">
            <div className="import-left-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowReview(!showReview)}
              >
                {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{showReview ? 'Hide Chord Chart' : 'Review Chord Chart'}</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDownloadJSON}
                title="Export raw JSON"
              >
                <Download size={15} />
                <span className="hide-extra-small">Export JSON</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg import-to-editor-btn"
              onClick={handleImportToEditor}
            >
              <span>Import into Editor</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Live Section Viewer Preview */}
          {showReview && (
            <div className="import-sheet-preview">
              <div className="import-sheet-preview-title">
                <Music size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Reconstructed Chord Sheet Preview</span>
              </div>
              <div className="import-sections-list">
                {analysisResult.song.sections.map((section, idx) => (
                  <SectionViewer key={section.id || idx} section={section} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
