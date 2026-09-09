import React from 'react';
import { AlertTriangle, RefreshCw, Home, Music } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="card error-boundary-card"
          style={{
            maxWidth: '680px',
            margin: '40px auto',
            padding: '32px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            {this.props.title || 'Something went wrong displaying this page'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
            {this.props.message ||
              'An unexpected error occurred while rendering the chord sheet or song data. You can try refreshing the page or returning to the library.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              <span>Reload Page</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                this.handleReset();
                if (window.location.pathname !== '/songs') {
                  window.location.href = '/songs';
                }
              }}
            >
              <Music size={16} />
              <span>All Songs</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                this.handleReset();
                window.location.href = '/';
              }}
            >
              <Home size={16} />
              <span>Home</span>
            </button>
          </div>

          {this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Technical Details
              </summary>
              <pre style={{ fontSize: '0.78rem', color: 'var(--color-danger)', overflowX: 'auto', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
