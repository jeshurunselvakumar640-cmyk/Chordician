import React, { useEffect } from 'react';
import { AlertTriangle, X, ExternalLink, PlusCircle, CheckCircle2, Music } from 'lucide-react';
import KeyBadge from '../UI/KeyBadge';

export default function DuplicateSongModal({
  isOpen,
  matchedSong,
  newSong,
  matchPercentage,
  matchLabel,
  onViewExisting,
  onConfirmAddAnyway,
  onCancel,
  isSubmitting = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !matchedSong || !newSong) return null;

  return (
    <div className="modal-backdrop" onClick={!isSubmitting ? onCancel : undefined}>
      <div
        className="modal-content duplicate-song-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-modal-title"
        style={{ maxWidth: '580px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#eab308'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 id="duplicate-modal-title" className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Duplicate Song Detected
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Are you adding this song?
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Explanation */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            A song with a very similar title or subtitle already exists in your songbook (<strong>{matchPercentage}% match</strong>).
          </p>
        </div>

        {/* Existing vs New Song Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Existing Song Card */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)'
                }}
              >
                Existing in Songbook
              </span>
              <span
                className="badge badge-warning"
                style={{ fontSize: '0.76rem', fontWeight: 600 }}
              >
                {matchPercentage}% Match ({matchLabel || 'Similar Title'})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                  {matchedSong.title || 'Untitled Song'}
                </h4>
                {matchedSong.secondaryTitle && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
                    {matchedSong.secondaryTitle}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {matchedSong.artist && <span>{matchedSong.artist}</span>}
                  {matchedSong.category && (
                    <>
                      <span>•</span>
                      <span>{matchedSong.category}</span>
                    </>
                  )}
                </div>
              </div>

              {matchedSong.originalKey && (
                <div style={{ flexShrink: 0 }}>
                  <KeyBadge songKey={matchedSong.originalKey} size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* New Candidate Song Card */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-primary-light, rgba(99, 102, 241, 0.08))',
              border: '1px solid var(--border-focus, rgba(99, 102, 241, 0.3))',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-primary)'
                }}
              >
                New Song Being Added
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                  {newSong.title || 'Untitled Song'}
                </h4>
                {newSong.secondaryTitle && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
                    {newSong.secondaryTitle}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {newSong.artist && <span>{newSong.artist}</span>}
                  {newSong.category && (
                    <>
                      <span>•</span>
                      <span>{newSong.category}</span>
                    </>
                  )}
                </div>
              </div>

              {newSong.originalKey && (
                <div style={{ flexShrink: 0 }}>
                  <KeyBadge songKey={newSong.originalKey} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          className="modal-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onViewExisting(matchedSong)}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={15} />
            <span>View Existing Song</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirmAddAnyway}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={15} />
            <span>{isSubmitting ? 'Adding...' : 'Add Anyway'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
