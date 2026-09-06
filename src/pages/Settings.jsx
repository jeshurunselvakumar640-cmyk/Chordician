import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Database,
  Check,
  Sliders,
  Piano,
  Activity,
  AlertTriangle,
  RefreshCw,
  Lock,
  Download,
  Smartphone,
  Monitor,
  Crown,
  User,
  LogIn,
  LogOut,
  Eye,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePWA } from '../context/PWAContext.jsx';
import { useDeviceMode } from '../context/DeviceModeContext.jsx';
import { useAuth, OWNER_DEFAULT_NAME } from '../context/AuthContext.jsx';
import ContactModal from '../components/Modal/ContactModal.jsx';
import { addSong, runFirebaseDiagnostics } from '../firebase/songs.js';
import { firebaseConfig } from '../firebase/config.js';
import { DEMO_PRESETS } from '../services/aiSongParser.js';

export default function Settings({ onSongAdded }) {
  const { theme, setTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const { canInstall, isStandalone, installApp } = usePWA();
  const { isDesktopMode, setDesktopMode } = useDeviceMode();
  const { currentUser, userProfile, isOwner, canEdit, logout, openAuthModal } = useAuth();

  const [isSeeding, setIsSeeding] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Diagnostics state
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState(null);

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

  const displayName = userProfile?.displayName || currentUser?.displayName || (isOwner ? OWNER_DEFAULT_NAME : 'Musician');

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">
          Manage your account permissions, appearance, database configurations, and test Firebase connectivity.
        </p>
      </div>

      {/* Account & Permissions Section */}
      <div className="card settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
            {isOwner ? (
              <Crown size={20} style={{ color: '#f59e0b' }} />
            ) : (
              <User size={20} style={{ color: 'var(--color-primary)' }} />
            )}
            Account & Permissions
          </h2>

          <div>
            {currentUser ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  await logout();
                  showToast('Signed out successfully', 'info');
                }}
                style={{ color: '#ef4444' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openAuthModal('login')}
              >
                <LogIn size={14} />
                <span>Sign In as Owner</span>
              </button>
            )}
          </div>
        </div>

        <div className="settings-db-info-list" style={{ marginTop: '16px' }}>
          <div className="settings-db-row">
            <span className="settings-db-label">Status:</span>
            <span className="settings-db-status">
              {currentUser ? '✓ Authenticated' : '👁️ View-Only Guest'}
            </span>
          </div>

          {currentUser && (
            <>
              <div className="settings-db-row">
                <span className="settings-db-label">Account Name:</span>
                <strong className="settings-db-val">{displayName}</strong>
              </div>
              <div className="settings-db-row">
                <span className="settings-db-label">Email:</span>
                <strong className="font-mono-input settings-db-val">{currentUser.email}</strong>
              </div>
            </>
          )}

          <div className="settings-db-row">
            <span className="settings-db-label">Access Level:</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: isOwner ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                color: isOwner ? '#f59e0b' : 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              {isOwner ? (
                <>
                  <Crown size={14} />
                  <span>👑 Full Owner Access (Add, Edit, Import, Delete)</span>
                </>
              ) : (
                <>
                  <Eye size={14} />
                  <span>👁️ View-Only Mode (All notes & chord sheets viewable)</span>
                </>
              )}
            </span>
          </div>
        </div>
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
            <strong className="font-mono-input settings-db-val">{firebaseConfig.projectId}</strong>
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

        {/* Sample Seed Button (Only for Owner) */}
        {canEdit && (
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
        )}
      </div>

      {/* PWA & App Installation */}
      <div className="card settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
            <Smartphone size={20} style={{ color: 'var(--color-primary)' }} />
            Progressive Web App (PWA)
          </h2>
          {canInstall && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={installApp}
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}
        </div>

        <div className="settings-db-info-list" style={{ marginTop: '16px' }}>
          <div className="settings-db-row">
            <span className="settings-db-label">App Name:</span>
            <strong className="settings-db-val">Chordician</strong>
          </div>
          <div className="settings-db-row">
            <span className="settings-db-label">Tagline:</span>
            <span className="settings-db-val" style={{ color: 'var(--text-muted)' }}>Every Chord, For Him</span>
          </div>
          <div className="settings-db-row">
            <span className="settings-db-label">Display Mode:</span>
            <span className="settings-db-status" style={{ color: isStandalone ? 'var(--color-success)' : 'var(--text-muted)' }}>
              {isStandalone ? '✓ Standalone App' : 'Browser Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile & Viewport Layout Options */}
      <div className="card settings-card">
        <h2 className="settings-section-title">
          <Monitor size={20} style={{ color: 'var(--color-primary)' }} />
          Layout & Viewport Mode
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', marginBottom: '16px' }}>
          Choose whether mobile devices use the touch-optimized mobile interface or simulate the full desktop widescreen layout.
        </p>

        <div className="settings-theme-grid">
          <div
            onClick={() => {
              setDesktopMode(false);
              showToast('Switched to Mobile Touch Mode', 'info');
            }}
            className={`settings-theme-option ${!isDesktopMode ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Smartphone size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="settings-theme-name">Mobile Touch Mode (Default)</div>
                <div className="settings-theme-desc">Touch-friendly bottom bar & responsive flow</div>
              </div>
            </div>
            {!isDesktopMode && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>

          <div
            onClick={() => {
              setDesktopMode(true);
              showToast('Switched to Full Desktop Mode', 'info');
            }}
            className={`settings-theme-option ${isDesktopMode ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="settings-theme-info">
              <Monitor size={20} style={{ color: '#10b981' }} />
              <div>
                <div className="settings-theme-name">Desktop Mode for Mobile</div>
                <div className="settings-theme-desc">Full widescreen sidebar & wide chord charts</div>
              </div>
            </div>
            {isDesktopMode && <Check size={18} style={{ color: 'var(--color-primary)' }} />}
          </div>
        </div>
      </div>

      {/* Contact Jeshurun & Song Requests */}
      <div className="card settings-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="settings-section-title" style={{ marginBottom: '4px' }}>
              <Mail size={20} style={{ color: 'var(--color-primary)' }} />
              Contact Jeshurun & Song Requests
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
              Need a new song added to Chordician? Have suggestions or need assistance? Reach out directly.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsContactOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <MessageSquare size={16} />
            <span>Contact Jeshurun</span>
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        initialType="Song Request"
      />
    </div>
  );
}
