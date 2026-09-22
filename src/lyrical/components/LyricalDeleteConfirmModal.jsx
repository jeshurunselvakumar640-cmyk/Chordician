import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalDeleteConfirmModal({
  isOpen,
  onClose,
  song,
  onConfirmDelete
}) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  if (!isOpen || !song) return null;

  const titleText = song.title || '';
  const descText = (t.deleteModalDesc || 'Are you sure you want to delete "{title}"? This action cannot be undone.')
    .replace('{title}', titleText);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content lyrical-delete-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '92%' }}
      >
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="lyrical-modal-icon-badge"
              style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444' }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>
              {t.deleteModalTitle || 'Delete Song?'}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label={t.closeBtn || 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '12px 20px 20px 20px' }}>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {descText}
          </p>
        </div>

        <div
          className="modal-footer"
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t.cancelBtn || 'Cancel'}
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm lyrical-delete-confirm-btn"
            onClick={() => {
              if (onConfirmDelete) onConfirmDelete(song.id);
              onClose();
            }}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={16} />
            <span>{t.deleteConfirmBtn || 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
