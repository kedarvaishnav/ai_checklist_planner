// src/pages/MyChecklistsPage.jsx
// Shows all saved checklists for the logged-in user.
// From here they can open, delete, or create a new one.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checklistApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function MyChecklistsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checklistApi
      .list()
      .then(({ checklists }) => setChecklists(checklists))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this checklist? This cannot be undone.')) return;
    await checklistApi.delete(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line bg-paper-dark/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage mb-1">
              AI Checklist Planner
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink">My Checklists</h1>
            <p className="font-body text-sm text-ink-soft mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/new')}
              className="rounded-full bg-sage px-5 py-2.5 font-display text-sm font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5"
            >
              + New checklist
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-line px-5 py-2.5 font-display text-sm font-medium text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* List */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        {loading && (
          <p className="font-body text-ink-soft text-center py-10">Loading…</p>
        )}
        {error && (
          <p className="font-body text-terracotta text-center py-10">{error}</p>
        )}
        {!loading && checklists.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-lg text-ink-soft mb-4">No checklists yet.</p>
            <button
              onClick={() => navigate('/new')}
              className="rounded-full bg-sage px-6 py-3 font-display text-base font-medium text-paper shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              Create your first checklist
            </button>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {checklists.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/60 px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => navigate(`/checklist/${c.id}`)}
                className="text-left flex-1 min-w-0"
              >
                <p className="font-display text-lg font-medium text-ink truncate">{c.title}</p>
                <p className="font-mono text-xs text-ink-soft mt-0.5">
                  {new Date(c.updated_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="flex-shrink-0 rounded-lg px-3 py-2 font-body text-sm text-ink-soft transition-colors hover:text-terracotta hover:bg-terracotta/5"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
