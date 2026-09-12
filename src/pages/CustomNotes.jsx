import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Save,
  Trash2,
  Copy,
  Check,
  Download,
  Plus,
  Calendar,
  Clock,
  Search,
  Edit3,
  Sparkles,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'chordician_saved_custom_notes';
const DRAFT_KEY = 'chordician_custom_notes_draft';
const DRAFT_TITLE_KEY = 'chordician_custom_notes_draft_title';

/**
 * Formats a Date object or timestamp into a friendly date & time string.
 * Example: "12 Sep 2026, 06:15 PM"
 */
function formatNoteDate(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString();
  
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CustomNotes() {
  const { showToast } = useToast();
  const textareaRef = useRef(null);

  // Editor state
  const [noteTitle, setNoteTitle] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_TITLE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [noteContent, setNoteContent] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) || '';
    } catch {
      return '';
    }
  });

  // Track currently editing note ID (null = new note)
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Saved notes state
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI helpers
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [copiedEditorText, setCopiedEditorText] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Auto-save draft as user types
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, noteContent);
      localStorage.setItem(DRAFT_TITLE_KEY, noteTitle);
    } catch {}
  }, [noteContent, noteTitle]);

  // Persist saved notes
  const persistSavedNotes = (notesList) => {
    setSavedNotes(notesList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesList));
    } catch (err) {
      console.warn('Failed to persist notes to localStorage:', err);
    }
  };

  // Live content stats
  const stats = useMemo(() => {
    const text = noteContent.trim();
    const chars = noteContent.length;
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const lines = noteContent ? noteContent.split('\n').length : 0;
    return { chars, words, lines };
  }, [noteContent]);

  // Save Note with Date
  const handleSaveNote = () => {
    const content = noteContent.trim();
    if (!content && !noteTitle.trim()) {
      showToast('Please type some notes before saving.', 'warning', 3000);
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    const now = new Date();
    const formattedDate = formatNoteDate(now);
    const resolvedTitle =
      noteTitle.trim() ||
      content.split('\n')[0].replace(/^[#\s*-]+/, '').trim().slice(0, 60) ||
      'Untitled Note';

    if (editingNoteId) {
      // Update existing note
      const updatedNotes = savedNotes.map((note) => {
        if (note.id === editingNoteId) {
          return {
            ...note,
            title: resolvedTitle,
            content: noteContent,
            date: formattedDate,
            updatedAt: now.getTime()
          };
        }
        return note;
      });
      persistSavedNotes(updatedNotes);
      showToast(`Note updated with date: ${formattedDate}`, 'success', 3500);
    } else {
      // Create new note
      const newNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: resolvedTitle,
        content: noteContent,
        date: formattedDate,
        createdAt: now.getTime(),
        updatedAt: now.getTime()
      };
      persistSavedNotes([newNote, ...savedNotes]);
      showToast(`Note saved with date: ${formattedDate}`, 'success', 3500);
    }

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 2000);
  };

  // Start fresh note
  const handleNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_TITLE_KEY);
    } catch {}
    if (textareaRef.current) textareaRef.current.focus();
    showToast('New blank note ready', 'info', 2000);
  };

  // Load a saved note into editor
  const handleLoadNote = (note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (textareaRef.current) textareaRef.current.focus();
    showToast(`Loaded "${note.title}" into editor`, 'info', 2500);
  };

  // Delete saved note
  const handleDeleteNote = (noteId, e) => {
    e.stopPropagation();
    const noteToDelete = savedNotes.find((n) => n.id === noteId);
    const updated = savedNotes.filter((n) => n.id !== noteId);
    persistSavedNotes(updated);

    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }

    showToast(`Deleted "${noteToDelete?.title || 'Note'}"`, 'info', 2500);
  };

  // Copy text from editor
  const handleCopyEditor = async () => {
    if (!noteContent) return;
    try {
      await navigator.clipboard.writeText(
        noteTitle ? `${noteTitle}\n\n${noteContent}` : noteContent
      );
      setCopiedEditorText(true);
      showToast('Note copied to clipboard!', 'info', 2000);
      setTimeout(() => setCopiedEditorText(false), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Copy specific saved note
  const handleCopyNote = async (note, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        note.title ? `${note.title}\n\n${note.content}` : note.content
      );
      setCopiedNoteId(note.id);
      showToast('Note copied to clipboard!', 'info', 2000);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Download note as .txt file
  const handleDownloadNote = (title, content, date, e) => {
    if (e) e.stopPropagation();
    const safeTitle = (title || 'chordician_note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${safeTitle}_${date.replace(/[^a-z0-9]/gi, '_')}.txt`;
    const textData = `${title ? title + '\n' : ''}Saved: ${date}\n\n${content}`;

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'info', 2500);
  };

  // Filter saved notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return savedNotes;
    const q = searchQuery.toLowerCase();
    return savedNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.date && n.date.toLowerCase().includes(q))
    );
  }, [savedNotes, searchQuery]);

  return (
    <div className="custom-notes-page">
      {/* Top Header */}
      <div className="custom-notes-header">
        <div className="custom-notes-title-group">
          <div className="custom-notes-icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="custom-notes-title">Custom Notes</h1>
            <p className="custom-notes-subtitle">
              Type your personal chords, service setlists, rehearsal transitions, or reminders and save with date.
            </p>
          </div>
        </div>

        <div className="custom-notes-header-actions">
          <Link
            to="/chord-guide"
            className="btn btn-ghost btn-sm"
            title="Open Piano & Scale Reference Guide"
          >
            <BookOpen size={15} />
            <span>Chords & Scales Guide</span>
          </Link>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNewNote}
            title="Start a new blank note"
          >
            <Plus size={15} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Editor Card (Typing Tab Area) */}
      <div className="card custom-notes-editor-card">
        {/* Editor Title & Status Bar */}
        <div className="custom-notes-editor-top">
          <div className="custom-notes-status-badge">
            {editingNoteId ? (
              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={13} /> Editing Saved Note
              </span>
            ) : (
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} /> Scratchpad
              </span>
            )}
          </div>

          <div className="custom-notes-live-stats">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.chars} chars</span>
            <span>•</span>
            <span>{stats.lines} lines</span>
          </div>
        </div>

        {/* Title Input */}
        <div className="custom-notes-input-wrapper">
          <input
            type="text"
            className="custom-notes-title-input"
            placeholder="Note Title (e.g., Sunday Worship Transition Chords, Easter Rehearsal)..."
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            maxLength={150}
          />
        </div>

        {/* Main Textarea */}
        <div className="custom-notes-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="custom-notes-textarea font-mono-input"
            placeholder={`Type your custom notes here...\n\nExample:\n• Song 1: Ennai Nadathum Deva (Key: C -> Chorus transition on Am)\n• Song 2: Aaraathanai Umakkae (Key: D)\n• Reminder: Pianist soft pad on C during opening prayer`}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={12}
            spellCheck="false"
          />
        </div>

        {/* Bottom Toolbar & Save with Date Action */}
        <div className="custom-notes-editor-toolbar">
          <div className="custom-notes-left-actions">
            <button
              type="button"
              className="btn btn-primary custom-notes-save-btn"
              onClick={handleSaveNote}
              title="Save this note with current date & time"
            >
              {isSavedSuccess ? <Check size={18} /> : <Save size={18} />}
              <span>{isSavedSuccess ? 'Saved with Date!' : editingNoteId ? 'Update with Date' : 'Save with Date'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyEditor}
              disabled={!noteContent.trim()}
              title="Copy all note text to clipboard"
            >
              {copiedEditorText ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedEditorText ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDownloadNote(noteTitle, noteContent, formatNoteDate(new Date()))}
              disabled={!noteContent.trim()}
              title="Download note as .txt file"
            >
              <Download size={15} />
              <span>Download</span>
            </button>
          </div>

          <div className="custom-notes-right-actions">
            {(noteContent || noteTitle) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={handleNewNote}
                title="Clear current editor"
              >
                <RotateCcw size={15} />
                <span>Clear Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Notes History Section */}
      <div className="custom-notes-history-section">
        <div className="custom-notes-history-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="custom-notes-section-title">
              Saved Notes
            </h2>
            <span className="badge badge-secondary" style={{ fontSize: '0.82rem' }}>
              {savedNotes.length}
            </span>
          </div>

          {savedNotes.length > 0 && (
            <div className="custom-notes-search-wrapper">
              <Search size={16} className="custom-notes-search-icon" />
              <input
                type="text"
                className="custom-notes-search-input"
                placeholder="Search saved notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Saved Notes Grid / List */}
        {savedNotes.length === 0 ? (
          <div className="card custom-notes-empty-state">
            <FileText size={40} className="text-muted" style={{ opacity: 0.4, marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              No saved notes yet
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
              Type your custom notes in the scratchpad above and click <strong>"Save with Date"</strong>. Your notes will be saved and date-stamped here.
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="card custom-notes-empty-state">
            <Search size={32} className="text-muted" style={{ opacity: 0.4, marginBottom: '10px' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              No notes found matching "<strong>{searchQuery}</strong>".
            </p>
          </div>
        ) : (
          <div className="custom-notes-grid">
            {filteredNotes.map((note) => {
              const isSelected = editingNoteId === note.id;
              return (
                <div
                  key={note.id}
                  className={`card custom-note-card ${isSelected ? 'active-editing' : ''}`}
                  onClick={() => handleLoadNote(note)}
                >
                  {/* Note Card Header */}
                  <div className="custom-note-card-header">
                    <div className="custom-note-date-badge">
                      <Calendar size={13} />
                      <span>{note.date || 'Saved Note'}</span>
                    </div>

                    <div className="custom-note-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon-xs"
                        onClick={(e) => handleCopyNote(note, e)}
                        title="Copy note"
                        aria-label="Copy note"
                      >
                        {copiedNoteId === note.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-icon-xs"
                        onClick={(e) => handleDownloadNote(note.title, note.content, note.date, e)}
                        title="Download note as .txt"
                        aria-label="Download note"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-icon-xs text-danger"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3 className="custom-note-card-title">
                    {note.title || 'Untitled Note'}
                  </h3>

                  {/* Note Content Preview */}
                  <div className="custom-note-card-content font-mono-input">
                    {note.content}
                  </div>

                  {/* Note Footer */}
                  <div className="custom-note-card-footer">
                    <span className="custom-note-click-hint">
                      <Edit3 size={13} /> Click to edit in scratchpad
                    </span>
                    <span className="custom-note-length">
                      {note.content.length} chars
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
