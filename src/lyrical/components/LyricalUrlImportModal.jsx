import React, { useState } from 'react';
import { Globe, X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';
import {
  importLyricalSongFromUrl,
  validateLyricalUrl
} from '../services/lyricalUrlImporter';

export default function LyricalUrlImportModal({
  isOpen,
  onClose,
  onImportSuccess
}) {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  const [urlString, setUrlString] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    setErrorMessage('');

    const validation = validateLyricalUrl(urlString);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setIsLoading(true);
    try {
      const result = await importLyricalSongFromUrl(validation.url);
      if (result.success && result.song) {
        onImportSuccess(result.song);
        onClose();
      } else {
        setErrorMessage(result.error || 'Failed to import lyrics from this URL.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred while importing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content lyrical-import-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="lyrical-modal-icon-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Globe size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t.importModalTitle}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {t.importModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label={t.closeBtn}
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Error Banner */}
          {errorMessage && (
            <div className="lyrical-import-error-banner" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', lineHeight: 1.4 }}>{errorMessage}</span>
            </div>
          )}

          {/* URL Input Form */}
          <div className="form-group">
            <label className="form-label" htmlFor="lyrical-url-input">
              <span>Webpage URL</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="lyrical-url-input"
                type="url"
                value={urlString}
                onChange={(e) => {
                  setUrlString(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={t.urlInputPlaceholder}
                className="form-input"
                disabled={isLoading}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleImport();
                  }
                }}
              />
              {urlString && !isLoading && (
                <button
                  type="button"
                  className="lyrical-search-clear-btn"
                  onClick={() => setUrlString('')}
                  aria-label="Clear URL"
                  style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleImport()}
            disabled={isLoading || !urlString.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{t.importingBtn}</span>
              </>
            ) : (
              <>
                <span>{t.importBtn}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
