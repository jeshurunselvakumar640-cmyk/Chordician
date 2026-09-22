import React from 'react';
import { ListMusic, Plus, FolderPlus } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalLists() {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  return (
    <div className="lyrical-page">
      <div className="lyrical-page-header">
        <div className="lyrical-page-badge" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.25)' }}>
          <ListMusic size={14} />
          <span>{t.navLists}</span>
        </div>
        <h1 className="lyrical-page-title">{t.listsTitle}</h1>
        <p className="lyrical-page-subtitle">{t.listsSubtitle}</p>
      </div>

      <div className="lyrical-card lyrical-empty-card">
        <div className="lyrical-empty-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
          <FolderPlus size={32} />
        </div>
        <h2 className="lyrical-empty-title">{t.listsPlaceholderTitle}</h2>
        <p className="lyrical-empty-desc">{t.listsPlaceholderDesc}</p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: '8px' }}
        >
          <Plus size={16} />
          <span>{t.createListBtn}</span>
        </button>
      </div>
    </div>
  );
}
