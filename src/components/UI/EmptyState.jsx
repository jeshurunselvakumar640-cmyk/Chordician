import React from 'react';
import { Music, Plus, Search, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  type = 'songs',
  title,
  description,
  actionText,
  actionLink,
  onAction
}) {
  let defaultIcon = <Music size={32} />;
  let defaultTitle = 'Your songbook is empty';
  let defaultDesc = 'Add your first song and start building your personal piano library.';
  let defaultBtnText = '+ Add Song';
  let defaultLink = '/add-song';

  if (type === 'favorites') {
    defaultIcon = <Heart size={32} />;
    defaultTitle = 'No favorite songs yet';
    defaultDesc = 'Click the heart icon on any song card to pin your favorite arrangements here.';
    defaultBtnText = 'Browse All Songs';
    defaultLink = '/songs';
  } else if (type === 'search') {
    defaultIcon = <Search size={32} />;
    defaultTitle = 'No matching songs found';
    defaultDesc = 'Try adjusting your search terms or clearing your active filters.';
    defaultBtnText = 'Clear Filters';
    defaultLink = null;
  } else if (type === 'import') {
    defaultIcon = <Sparkles size={32} />;
    defaultTitle = 'No songs imported yet';
    defaultDesc = 'Upload a screenshot or photo of sheet music to analyze with AI vision.';
    defaultBtnText = 'Import Song';
    defaultLink = '/import';
  }

  const finalTitle = title || defaultTitle;
  const finalDesc = description || defaultDesc;
  const finalBtnText = actionText || defaultBtnText;

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {defaultIcon}
      </div>
      <h3 className="empty-state-title">{finalTitle}</h3>
      <p className="empty-state-desc">{finalDesc}</p>
      
      {actionLink ? (
        <Link to={actionLink} className="btn btn-primary">
          <Plus size={16} />
          {finalBtnText}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className="btn btn-secondary">
          {finalBtnText}
        </button>
      ) : null}
    </div>
  );
}
