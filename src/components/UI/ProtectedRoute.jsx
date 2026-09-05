import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Crown, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, title = 'Owner Access Required' }) {
  const { canEdit, openAuthModal, loading } = useAuth();

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Checking permissions...</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div
        className="card"
        style={{
          maxWidth: '560px',
          margin: '40px auto',
          textAlign: 'center',
          padding: '40px 24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#f59e0b'
          }}
        >
          <Crown size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
          {title}
        </h2>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
          This area is reserved for the Owner account to create, edit, or import songs. All song notes and chord sheets across Chordician remain freely accessible in <strong>View-Only mode</strong>.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/songs" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Browse Songbook</span>
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openAuthModal('login')}
          >
            <LogIn size={16} />
            <span>Sign In as Owner</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
