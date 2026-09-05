import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Crown,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useAuth, OWNER_EMAIL } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    signup,
    resetPassword
  } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(null);

  // Clear messages and reset fields when modal opens/mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage(null);
      setResetSuccessMessage(null);
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const isOwnerEmail = email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.error) {
      // If user not found and it's the owner attempting first-time login, offer signup or show clear error
      if (res.error.includes('Invalid email or password') && isOwnerEmail) {
        setErrorMessage('Account not found with this password. If this is your first time, you can also click "Create Account" below to register this Owner ID.');
      } else {
        setErrorMessage(res.error);
      }
    } else {
      const isOwner = (res.user?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
      showToast(
        isOwner
          ? '👑 Welcome back, Jeshurun! Full Owner editing access unlocked.'
          : '✓ Signed in successfully as Viewer.',
        'success',
        4000
      );
      closeAuthModal();
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide an email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await signup(email, password, displayName);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      const isOwner = (res.user?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
      showToast(
        isOwner
          ? '👑 Owner Account Registered! You now have full editing permissions.'
          : '✓ Account created successfully.',
        'success',
        4000
      );
      closeAuthModal();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive the password reset link.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResetSuccessMessage(null);

    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setResetSuccessMessage(`Password reset link sent to ${email.trim()}. Please check your inbox or spam folder.`);
      showToast(`Password reset link sent to ${email.trim()}`, 'info', 4000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div
        className="modal-content auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              {authModalMode === 'forgot' ? (
                <KeyRound size={20} />
              ) : isOwnerEmail ? (
                <Crown size={20} style={{ color: '#f59e0b' }} />
              ) : (
                <Lock size={18} />
              )}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                {authModalMode === 'login' && 'Sign In'}
                {authModalMode === 'signup' && 'Create Account'}
                {authModalMode === 'forgot' && 'Reset Password'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {authModalMode === 'login' && 'Sign in to manage your song library & notes'}
                {authModalMode === 'signup' && 'Register an account for Chordician'}
                {authModalMode === 'forgot' && "Enter your email and we'll send a recovery link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeAuthModal}
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs (Login / Signup) */}
        {authModalMode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              padding: '4px',
              margin: '12px 18px 0',
              background: 'var(--color-surface-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: authModalMode === 'login' ? 'var(--color-surface)' : 'transparent',
                color: authModalMode === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: authModalMode === 'login' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('signup');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: authModalMode === 'signup' ? 'var(--color-surface)' : 'transparent',
                color: authModalMode === 'signup' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: authModalMode === 'signup' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Body / Forms */}
        <div className="modal-body" style={{ padding: '18px' }}>
          {/* Error Message Box */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                marginBottom: '14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.85rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Reset Success Message Box */}
          {resetSuccessMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                marginBottom: '14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.85rem'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{resetSuccessMessage}</div>
            </div>
          )}

          {/* Owner Account Hint Badge */}
          {isOwnerEmail && authModalMode !== 'forgot' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                marginBottom: '12px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <Crown size={14} />
              <span>Owner Account Identified — Grants Full Edit & Manage Permissions</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleSignIn}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jeshurunselvakumar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 0 }}>
                    <Lock size={14} /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('forgot');
                      setErrorMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Full Name / Display Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isOwnerEmail ? 'Jeshurun Selvakumar (Owner)' : 'e.g. John Doe'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} /> Password (min. 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {authModalMode === 'forgot' && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Account Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jeshurunselvakumar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setErrorMessage(null);
                    setResetSuccessMessage(null);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Note */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 18px',
            background: 'var(--color-surface-subtle)',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }}
        >
          <span>🔒 Secured via Firebase Authentication. All visitors have full View-Only access to chord sheets.</span>
        </div>
      </div>
    </div>
  );
}
