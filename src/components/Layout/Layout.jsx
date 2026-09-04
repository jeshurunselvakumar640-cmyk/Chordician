import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({
  songs = [],
  searchQuery = '',
  onSearchChange,
  firestoreError = null,
  onRetryFirestore
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedRule, setCopiedRule] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const totalSongs = songs.length;
  const favoriteCount = songs.filter((s) => s.favorite).length;

  const ruleSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /songs/{songId} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ruleSnippet);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2500);
  };

  const handleRetry = async () => {
    if (!onRetryFirestore) return;
    setIsRetrying(true);
    await onRetryFirestore();
    setIsRetrying(false);
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar & Mobile Off-canvas Drawer */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        totalSongs={totalSongs}
        favoriteCount={favoriteCount}
      />

      <div className="main-wrapper">
        <Header
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Firestore Permission Guidance Banner if database rules are locked */}
        {firestoreError && (
          <div style={{
            margin: '16px 20px 0 20px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--color-danger)', fontSize: '0.92rem' }}>
                  Firestore Permission Denied on '/songs'
                </strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Publish the Firestore Security Rule in Firebase Console (Project: <code style={{ color: 'var(--text-main)', fontWeight: 700 }}>pianonotes-1bd94</code>) to enable cloud sync.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                title="Copy Firestore Rule"
              >
                {copiedRule ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedRule ? 'Rule Copied!' : 'Copy Rule'}</span>
              </button>
              <a
                href="https://console.firebase.google.com/project/pianonotes-1bd94/firestore/rules"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                <ExternalLink size={14} />
                <span>Open Firebase Console</span>
              </a>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRetry}
                disabled={isRetrying}
                title="Retry connecting to Firestore"
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
              </button>
            </div>
          </div>
        )}

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        totalSongs={totalSongs}
        favoriteCount={favoriteCount}
      />
    </div>
  );
}

