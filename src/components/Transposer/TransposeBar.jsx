import React from 'react';
import { Minus, Plus, RotateCcw, Sliders } from 'lucide-react';
import { ALL_KEYS } from '../../utils/musicConstants.js';
import { stepKey } from '../../services/transposer.js';

export default function TransposeBar({
  originalKey = 'C',
  activeKey = 'C',
  semitoneDelta = 0,
  onChangeKey,
  compact = false,
  sticky = false
}) {
  const isTransposed = (semitoneDelta % 12) !== 0 || originalKey !== activeKey;

  const handleStepDown = () => {
    const next = stepKey(activeKey, -1);
    onChangeKey(next);
  };

  const handleStepUp = () => {
    const next = stepKey(activeKey, 1);
    onChangeKey(next);
  };

  const handleReset = () => {
    onChangeKey(originalKey);
  };

  return (
    <div className={`transposer-bar ${compact ? 'transposer-compact' : ''} ${sticky ? 'transposer-sticky' : ''}`}>
      <div className="transposer-info">
        <Sliders size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span className="transposer-label">Transpose</span>
        {!compact && (
          <span className="transposer-orig-badge">
            (Orig: <strong>{originalKey}</strong>)
          </span>
        )}
      </div>

      <div className="transposer-controls">
        <button
          type="button"
          className="transposer-btn"
          onClick={handleStepDown}
          title="Transpose down 1 semitone"
          aria-label="Step down 1 semitone"
        >
          <Minus size={18} />
        </button>

        <div className="transposer-display">
          <select
            className="form-select font-mono-input transposer-select"
            value={activeKey}
            onChange={(e) => onChangeKey(e.target.value)}
            aria-label="Select musical key"
          >
            {ALL_KEYS.map((k) => (
              <option key={k} value={k} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                Key of {k}
              </option>
            ))}
          </select>

          {semitoneDelta !== 0 && (
            <span className="transposer-delta">
              {semitoneDelta > 0 ? `+${semitoneDelta}` : semitoneDelta}st
            </span>
          )}
        </div>

        <button
          type="button"
          className="transposer-btn"
          onClick={handleStepUp}
          title="Transpose up 1 semitone"
          aria-label="Step up 1 semitone"
        >
          <Plus size={18} />
        </button>

        {isTransposed && (
          <button
            type="button"
            className="btn btn-secondary btn-sm transposer-reset-btn"
            onClick={handleReset}
            title="Reset to original key"
          >
            <RotateCcw size={14} />
            <span className="hide-extra-small">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
