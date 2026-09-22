import React from 'react';
import { X, ClipboardList, Globe, Sparkles, ArrowRight, Edit3 } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalAddModal({ isOpen, onClose, onSelectImportUrl, onSelectAddManual }) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content lyrical-add-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="lyrical-modal-icon-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t.addModalTitle}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {t.addModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label={t.closeBtn}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Option 1: Add Song Manually */}
          <div
            className="lyrical-action-card active-action"
            onClick={() => {
              if (onSelectAddManual) {
                onSelectAddManual();
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onSelectAddManual) onSelectAddManual();
              }
            }}
          >
            <div className="lyrical-action-icon-wrap" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Edit3 size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.96rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                {t.addSongManually || 'Add Song Manually'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
                Type or paste lyrics directly into the editor.
              </span>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--color-primary)', alignSelf: 'center' }} />
          </div>

          {/* Option 2: Import from URL (ENABLED) */}
          <div
            className="lyrical-action-card active-action"
            onClick={() => {
              if (onSelectImportUrl) {
                onSelectImportUrl();
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onSelectImportUrl) onSelectImportUrl();
              }
            }}
          >
            <div className="lyrical-action-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Globe size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.96rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                {t.importUrlTitle}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
                {t.importUrlDesc}
              </span>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--color-primary)', alignSelf: 'center' }} />
          </div>

          {/* Option 2: Smart Paste (Preview only for future step) */}
          <div
            className="lyrical-action-card disabled-option"
            style={{ opacity: 0.7, cursor: 'not-allowed' }}
            title={t.smartPasteComingSoon}
          >
            <div className="lyrical-action-icon-wrap" style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-dim)' }}>
              <ClipboardList size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <strong style={{ fontSize: '0.96rem', color: 'var(--text-muted)' }}>
                  {t.smartPasteTitle}
                </strong>
                <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'var(--bg-surface)', color: 'var(--text-dim)' }}>
                  Next Step
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4, display: 'block' }}>
                {t.smartPasteDesc}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
