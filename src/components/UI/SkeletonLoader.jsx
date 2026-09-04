import React from 'react';

export function SongCardSkeleton() {
  return (
    <div className="song-card">
      <div className="song-card-header">
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '22px', width: '70%', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ height: '16px', width: '45%' }}></div>
        </div>
        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
        <div className="skeleton" style={{ height: '22px', width: '60px', borderRadius: '999px' }}></div>
        <div className="skeleton" style={{ height: '22px', width: '80px', borderRadius: '999px' }}></div>
      </div>
      <div className="song-card-footer">
        <div className="skeleton" style={{ height: '14px', width: '90px' }}></div>
        <div className="skeleton" style={{ height: '28px', width: '64px', borderRadius: '6px' }}></div>
      </div>
    </div>
  );
}

export function SongDetailsSkeleton() {
  return (
    <div className="song-viewer">
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '36px', width: '60%', marginBottom: '12px' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '35%', marginBottom: '20px' }}></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton" style={{ height: '28px', width: '90px', borderRadius: '999px' }}></div>
          <div className="skeleton" style={{ height: '28px', width: '100px', borderRadius: '999px' }}></div>
        </div>
      </div>
      <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '12px', marginBottom: '24px' }}></div>
      <div className="card" style={{ padding: '30px' }}>
        <div className="skeleton" style={{ height: '20px', width: '120px', marginBottom: '24px' }}></div>
        <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '12px' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '90%', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '24px', width: '75%', marginBottom: '12px' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '85%' }}></div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat-card">
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '10px' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: '26px', width: '50px', marginBottom: '6px' }}></div>
            <div className="skeleton" style={{ height: '14px', width: '80px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
