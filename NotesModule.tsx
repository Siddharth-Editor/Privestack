import React, { useState } from 'react';
import { FileText, Plus, Pin, Trash2, Edit3, Search, X, Check, Calendar, Tag } from 'lucide-react';
import { NoteItem } from '../../types/vault';

interface NotesModuleProps {
  notes: NoteItem[];
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
}

const CATEGORIES = ['Security', 'Personal', 'Financial', 'Emergency', 'Work', 'General'];

export const NotesModule: React.FC<NotesModuleProps> = ({
  notes,
  onSaveNote,
  onDeleteNote,
}) => {
  const [editingNote, setEditingNote] = useState<Partial<NoteItem> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter notes
  const filteredNotes = notes
    .filter(n => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      // Pinned notes first, then latest updated
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const handleStartCreate = () => {
    setEditingNote({
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      category: 'Security',
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.title?.trim()) return;

    const fullNote: NoteItem = {
      id: editingNote.id || `note-${Date.now()}`,
      title: editingNote.title.trim(),
      content: editingNote.content || '',
      category: editingNote.category || 'General',
      pinned: !!editingNote.pinned,
      createdAt: editingNote.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveNote(fullNote);
    setEditingNote(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Encrypted Secret Notes
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {notes.length} notes encrypted with local zero-knowledge storage
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Secret Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-white/5 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List / Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
          <FileText className="w-12 h-12 mx-auto text-zinc-500 mb-2 opacity-50" />
          <p className="text-sm text-zinc-400">
            {searchQuery ? 'No notes matched your search query.' : 'No secret notes saved yet.'}
          </p>
          <button
            onClick={handleStartCreate}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-600"
          >
            Create Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="p-5 rounded-2xl border transition-all duration-200 hover:border-emerald-500/40 relative flex flex-col justify-between group shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              {/* Note Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {note.category}
                    </span>
                    {note.pinned && (
                      <span className="flex items-center space-x-0.5 text-[10px] font-semibold text-amber-400">
                        <Pin className="w-3 h-3 fill-amber-400" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                      title="Edit Note"
                      aria-label={`Edit ${note.title}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(note.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Note"
                      aria-label={`Delete ${note.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors mb-2">
                  {note.title}
                </h3>

                <p className="text-xs text-zinc-300/80 whitespace-pre-wrap line-clamp-4 font-mono leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* Note Footer */}
              <div className="pt-4 mt-4 border-t flex items-center justify-between text-[11px] text-zinc-500 font-mono" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </span>
                <span>{note.content.length} characters</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative animate-in fade-in duration-150"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {notes.some(n => n.id === editingNote.id) ? 'Edit Secret Note' : 'New Secret Note'}
                </h3>
              </div>
              <button
                onClick={() => setEditingNote(null)}
                className="text-zinc-400 hover:text-white"
                aria-label="Close edit note modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                  Note Title
                </label>
                <input
                  type="text"
                  value={editingNote.title || ''}
                  onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="e.g. Master Keyphrase, Door Combination, Bank PIN"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  autoFocus
                />
              </div>

              {/* Category & Pin Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                    Category
                  </label>
                  <select
                    value={editingNote.category || 'Security'}
                    onChange={e => setEditingNote({ ...editingNote, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-zinc-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-zinc-300">
                    <input
                      type="checkbox"
                      checked={!!editingNote.pinned}
                      onChange={e => setEditingNote({ ...editingNote, pinned: e.target.checked })}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>Pin to top of vault</span>
                  </label>
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-zinc-300">
                  Secret Content
                </label>
                <textarea
                  rows={8}
                  value={editingNote.content || ''}
                  onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Type confidential notes, recovery seed words, codes, or private information here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-black/20 focus:outline-none focus:border-emerald-500 text-xs font-mono leading-relaxed resize-y"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Form buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editingNote.title?.trim()}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 transition-colors shadow-md"
                >
                  Save Encrypted Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 p-6 space-y-4 shadow-2xl bg-zinc-950">
            <h3 className="text-base font-bold text-white">Delete Note?</h3>
            <p className="text-xs text-zinc-300">Permanently delete this secret note from your vault? This cannot be undone.</p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteNote(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
