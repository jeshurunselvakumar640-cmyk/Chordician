import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Mail,
  Music,
  MessageSquare,
  Sparkles,
  Check,
  User,
  Heart
} from 'lucide-react';
import { useAuth, OWNER_DEFAULT_NAME } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { sendContactMessage } from '../../services/contactService.js';

export default function ContactModal({
  isOpen,
  onClose,
  initialSongTitle = '',
  initialType = 'Song Request'
}) {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState(initialType);
  const [songTitle, setSongTitle] = useState(initialSongTitle);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(userProfile?.displayName || currentUser?.displayName || '');
      setEmail(currentUser?.email || '');
      setSongTitle(initialSongTitle || '');
      setRequestType(initialSongTitle ? 'Song Request' : (initialType || 'Song Request'));
      setMessage('');
      setIsSent(false);
    }
  }, [isOpen, initialSongTitle, initialType, currentUser, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() && !email.trim() && !songTitle.trim() && !message.trim()) {
      showToast('Please enter a song title or message before sending.', 'warning');
      return;
    }

    setIsSending(true);
    const res = await sendContactMessage({
      name: name.trim() || 'Musician',
      email: email.trim(),
      subject: songTitle.trim()
        ? `[Chordician ${requestType}] ${songTitle.trim()}`
        : `[Chordician] ${requestType} from ${name.trim() || 'Musician'}`,
      songTitle: songTitle.trim(),
      message: message.trim(),
      type: requestType
    });

    setIsSending(false);

    if (res.success) {
      setIsSent(true);
      showToast('Message sent to Jeshurun successfully!', 'success', 3000);
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      showToast(res.error || 'Failed to send message. Please try again.', 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content contact-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>
                Contact Jeshurun
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Request a song, share feedback, or ask a question directly
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {isSent ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Check size={28} />
            </div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-main)' }}>
              Thank You!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '360px', margin: '0 auto' }}>
              Your message has been delivered to Jeshurun. We appreciate your song suggestion and feedback!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Type Selector Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              {[
                { type: 'Song Request', icon: <Music size={14} />, label: 'Song Request' },
                { type: 'Feedback', icon: <Sparkles size={14} />, label: 'Feedback' },
                { type: 'Question', icon: <MessageSquare size={14} />, label: 'Question' }
              ].map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  className={`btn btn-sm ${requestType === tab.type ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setRequestType(tab.type)}
                  style={{
                    flex: 1,
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Song Title (Especially for Song Requests) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                {requestType === 'Song Request' ? 'Song Title & Artist' : 'Subject'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={
                  requestType === 'Song Request'
                    ? 'e.g. Enna En Anantham, 10,000 Reasons, etc.'
                    : 'What would you like to discuss?'
                }
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                autoFocus={Boolean(!songTitle)}
              />
            </div>

            {/* Sender Name & Email Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. David"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Your Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Message / Details */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                {requestType === 'Song Request' ? 'Notes / YouTube link (Optional)' : 'Message Details'}
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={
                  requestType === 'Song Request'
                    ? 'Include preferred scale / key, YouTube link, or lyrics details...'
                    : 'Write your message or question here...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSending}
                style={{ minWidth: '130px' }}
              >
                <Send size={15} />
                <span>{isSending ? 'Sending...' : 'Send to Jeshurun'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
