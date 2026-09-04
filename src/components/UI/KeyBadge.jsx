import React from 'react';

export default function KeyBadge({ songKey = 'C', className = '' }) {
  return (
    <span className={`badge badge-key ${className}`}>
      Key: {songKey}
    </span>
  );
}
