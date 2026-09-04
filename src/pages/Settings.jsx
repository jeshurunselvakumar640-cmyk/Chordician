import React, { useState } from 'react';
import {
  Sun,
  Moon,
  ShieldCheck,
  Database,
  Check,
  Copy,
  Sliders,
  Piano,
  Activity,
  AlertTriangle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { addSong, runFirebaseDiagnostics } from '../firebase/songs.js';
import { DEMO_PRESETS } from '../services/aiSongParser.js';

export default function Settings({ onSongAdded }) {
  const { theme, setTheme, isDark } = useTheme();
  const { showToast } = useToast();

  const [copiedRules, setCopiedRules] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Diagnostics state
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState(null);

  const securityRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chordician Songbook Root Collection
    match /songs/{songId} {
      allow read, write: if true;
    }
  }
}`;

  const authenticatedRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // If Firebase Auth is enabled in Firebase Console
    match /songs/{songId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const handleCopyRules = (textToCopy = securityRulesText) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedRules(true);
    showToast('Firestore Security Rules copied to clipboard!', 'info');
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const result = await runFirebaseDiagnostics();
      setDiagResult(result);
      if (result.testReadStatus === 'success') {
        showToast('✓ Firestore connection test passed!', 'success');
      } else {
        showToast(`Firestore test failed: ${result.errorCode}`, 'error');
      }
    } catch (err) {
      showToast('Diagnostic execution failed', 'error');
    } finally {
      setIsRunningDiag(false);
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    let count = 0;
    for (const preset of DEMO_PRESETS) {
      if (preset.chordexJson) {
        const res = await addSong(preset.chordexJson);
        if (res.id) count++;
      }
    }
    setIsSeeding(false);
    if (count > 0) {
      showToast(`Added ${count} sample songs to your Firestore library!`, 'success');
      if (onSongAdded) onSongAdded();
    } else {
      showToast('Failed to seed sample songs.', 'error');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">
          Customize your Chordician experience, view database configurations, and test Firebase connectivity.
        </p>
      </div>

      {/* Theme & Appearance */}
      <div className="card settings-card">
        <h2 className="settings-section-title">
          <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
          Appearance
        </h2>

        <div className="settings-theme-grid">
          <div
            onClick={() => setTheme('dark')}
            className={`settings-theme-option dark-theme-option ${isDark ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Moon size={20} className="text-amber-400" />
              <div>
                <div className="settings-theme-name">Dark Theme</div>
                <div className="settings-theme-desc">Deep navy night mode</div>
              </div>
            </div>
            {isDark && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>

          <div
            onClick={() => setTheme('light')}
            className={`settings-theme-option light-theme-option ${!isDark ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Sun size={20} className="text-amber-500" />
              <div>
                <div className="settings-theme-name">Light Theme</div>
                <div className="settings-theme-desc">Clean crisp daylight</div>
              </div>
            </div>
            {!isDark && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>
        </div>
      </div>

      {/* Database & Firebase Status */}
      <div className="card settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
            <Database size={20} style={{ color: 'var(--color-primary)' }} />
            Firebase Integration & Diagnostics
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRunDiagnostics}
            disabled={isRunningDiag}
          >
            {isRunningDiag ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
            <span>{isRunningDiag ? 'Testing...' : 'Run Diagnostics'}</span>
          </button>
        </div>

        <div className="settings-db-info-list" style={{ marginTop: '16px' }}>
          <div className="settings-db-row">
            <span className="settings-db-label">Project ID:</span>
            <strong className="font-mono-input settings-db-val">pianonotes-1bd94</strong>
          </div>
          <div className="settings-db-row">
            <span className="settings-db-label">Firestore Path:</span>
            <strong className="font-mono-input settings-db-val">/songs</strong>
          </div>
          <div className="settings-db-row">
            <span className="settings-db-label">Auth Readiness:</span>
            <span className="settings-db-status">
              <Lock size={14} /> Active
            </span>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        {diagResult && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            backgroundColor: diagResult.testReadStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${diagResult.testReadStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
              {diagResult.testReadStatus === 'success' ? (
                <>
                  <Check size={18} className="text-success" />
                  <span style={{ color: 'var(--color-success)' }}>Firestore Read & Write: Healthy ({diagResult.docsCount} songs loaded)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-danger" />
                  <span style={{ color: 'var(--color-danger)' }}>Firestore Error: {diagResult.errorCode}</span>
                </>
              )}
            </div>
            {diagResult.errorMessage && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                {diagResult.errorMessage}
              </p>
            )}
          </div>
        )}

        {/* Sample Seed Button */}
        <div className="settings-seed-box">
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Sample Song Library</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Populate Firestore with sample hymn, jazz, and ballad chord sheets.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSeedSamples}
            disabled={isSeeding}
          >
            <Piano size={16} />
            <span>{isSeeding ? 'Seeding...' : 'Add Sample Songs'}</span>
          </button>
        </div>
      </div>

      {/* Security Rules Reference */}
      <div className="card settings-card">
        <div className="settings-rules-header">
          <h2 className="settings-section-title">
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            Firestore Security Rules Configuration
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleCopyRules(securityRulesText)}
          >
            {copiedRules ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedRules ? 'Copied' : 'Copy Rules'}</span>
          </button>
        </div>

        <p className="settings-rules-desc">
          To allow Chordician to read and write songs in your Firestore database (Project: <strong className="font-mono-input">pianonotes-1bd94</strong>), paste these rules into your <strong>Firebase Console &gt; Firestore Database &gt; Rules</strong> tab:
        </p>

        <pre className="settings-rules-pre">
          {securityRulesText}
        </pre>
      </div>
    </div>
  );
}

