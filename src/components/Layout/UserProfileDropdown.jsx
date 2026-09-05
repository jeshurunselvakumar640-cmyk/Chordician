import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Crown,
  LogOut,
  LogIn,
  Shield,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth, OWNER_DEFAULT_NAME } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function UserProfileDropdown() {
  const {
    currentUser,
    userProfile,
    isOwner,
    logout,
    openAuthModal
  } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const res = await logout();
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Signed out. Switched to View-Only mode.', 'info', 3000);
    }
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || (isOwner ? OWNER_DEFAULT_NAME : 'Musician');
  const email = currentUser?.email || '';

  // Get 2 initials
  const initials = isOwner
    ? 'JS'
    : (displayName || 'U')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

  return (
    <div className="user-profile-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="user-profile-badge-btn"
        title={currentUser ? `${displayName} (${isOwner ? 'Owner' : 'Viewer'})` : 'Account / Sign In'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '20px',
          border: isOwner
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid var(--color-border)',
          background: isOwner
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))'
            : 'var(--color-surface)',
          cursor: 'pointer',
          color: 'var(--color-text)',
          transition: 'all 0.2s ease'
        }}
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: isOwner
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : currentUser
              ? 'linear-gradient(135deg, var(--color-primary), #8b5cf6)'
              : 'var(--color-surface-subtle)',
            color: isOwner || currentUser ? '#ffffff' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          {isOwner ? <Crown size={14} /> : currentUser ? initials : <User size={15} />}
        </div>

        <span
          className="hide-mobile"
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {isOwner ? 'Owner' : currentUser ? (displayName || 'Viewer') : 'Sign In'}
        </span>

        <ChevronDown size={13} style={{ color: 'var(--color-text-muted)', opacity: 0.7 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="user-profile-dropdown-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            zIndex: 1000,
            animation: 'dropdownFadeIn 0.15s ease-out'
          }}
        >
          {currentUser ? (
            <>
              {/* User Info Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: '10px'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isOwner
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}
                >
                  {isOwner ? <Crown size={20} /> : initials}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }}
                  >
                    {email}
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isOwner
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(99, 102, 241, 0.1)',
                  color: isOwner ? '#f59e0b' : 'var(--color-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}
              >
                {isOwner ? (
                  <>
                    <Crown size={14} />
                    <span>👑 Owner (Full Edit Access)</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>👁️ Viewer (View-Only Mode)</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal('login');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      justifyContent: 'flex-start',
                      fontSize: '0.82rem',
                      color: '#f59e0b'
                    }}
                  >
                    <Crown size={15} /> Sign in as Owner
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontSize: '0.82rem',
                    color: '#ef4444'
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Logged In State */}
              <div style={{ padding: '4px 0 8px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-subtle)',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}
                >
                  <Eye size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                  View-Only Mode
                </div>
                <p style={{ margin: '4px 0 10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  All visitors can view chords, lyrics, transpose keys, and export PDF.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal('login');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    fontWeight: 600
                  }}
                >
                  <LogIn size={15} /> Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal('signup');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  Create Account
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
