import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { getLyricalTranslation } from '../i18n/translations';

export default function LyricalThisSunday() {
  const { language } = useAppMode();
  const t = getLyricalTranslation(language);

  return (
    <div className="lyrical-page">
      <div className="lyrical-page-header">
        <div className="lyrical-page-badge" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', borderColor: 'rgba(234, 88, 12, 0.25)' }}>
          <CalendarDays size={14} />
          <span>{t.navThisSunday}</span>
        </div>
        <h1 className="lyrical-page-title">{t.sundayTitle}</h1>
        <p className="lyrical-page-subtitle">{t.sundaySubtitle}</p>
      </div>

      <div className="lyrical-card lyrical-empty-card">
        <div className="lyrical-empty-icon-wrap" style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' }}>
          <CalendarDays size={32} />
        </div>
        <h2 className="lyrical-empty-title">{t.sundayEmptyTitle || t.sundayPlaceholderTitle}</h2>
        <p className="lyrical-empty-desc">{t.sundayEmptyDesc || t.sundayPlaceholderDesc}</p>
      </div>
    </div>
  );
}
