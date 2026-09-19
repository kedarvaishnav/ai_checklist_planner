// src/pages/ChecklistPage.jsx
// Shows a single checklist with all its categories and tasks.
// Toggling a task calls the backend API and updates the UI optimistically.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { checklistApi } from '../utils/api';
import CategorySection from '../components/CategorySection';
import ProgressBar from '../components/ProgressBar';
import { calculateProgress } from '../utils/parser';

export default function ChecklistPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (!id) return;
    checklistApi
      .get(parseInt(id, 10))
      .then((data) => {
        setChecklist(data);
        setTitleInput(data.title);
      })
      .catch((err) => {
        if (
          err.message?.toLowerCase().includes('token') ||
          err.message?.toLowerCase().includes('expired') ||
          err.message?.toLowerCase().includes('authorization') ||
          err.message?.includes('401')
        ) {
          navigate('/auth', { replace: true });
          return;
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Optimistic toggle: update UI immediately, then sync with backend
  const handleToggleTask = async (categoryId, taskId) => {
    if (!checklist) return;

    // Optimistic update
    setChecklist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                tasks: cat.tasks.map((t) =>
                  t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
              }
            : cat
        ),
      };
    });

    try {
      await checklistApi.toggleTask(checklist.id, taskId);
    } catch (err) {
      if (
        err.message?.toLowerCase().includes('token') ||
        err.message?.toLowerCase().includes('expired') ||
        err.message?.toLowerCase().includes('authorization') ||
        err.message?.includes('401')
      ) {
        navigate('/auth', { replace: true });
        return;
      }
      // Revert on failure
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  tasks: cat.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                }
              : cat
          ),
        };
      });
    }
  };

  const handleSaveTitle = async () => {
    if (!checklist || !titleInput.trim()) return;
    try {
      await checklistApi.updateTitle(checklist.id, titleInput.trim());
      setChecklist((prev) => prev ? { ...prev, title: titleInput.trim() } : prev);
      setEditingTitle(false);
    } catch (err) {
      if (
        err.message?.toLowerCase().includes('token') ||
        err.message?.toLowerCase().includes('expired') ||
        err.message?.toLowerCase().includes('authorization') ||
        err.message?.includes('401')
      ) {
        navigate('/auth', { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-ink-soft">Loading…</p>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-terracotta mb-4">{error || 'Checklist not found'}</p>
          <button onClick={() => navigate('/')} className="font-display text-sage hover:underline">
            ← Back to my checklists
          </button>
        </div>
      </div>
    );
  }

  // Convert backend types to the shape our components expect
  const categories = checklist.categories.map((cat) => ({
    id: String(cat.id),
    category: cat.category,
    tasks: cat.tasks.map((t) => ({
      id: String(t.id),
      title: t.title,
      completed: t.completed,
    })),
  }));

  const progress = calculateProgress(categories);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line bg-paper-dark/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <button
            onClick={() => navigate('/')}
            className="font-mono text-xs text-ink-soft hover:text-ink transition-colors mb-4 inline-block"
          >
            ← My checklists
          </button>

          {editingTitle ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
                className="font-display text-3xl font-semibold text-ink bg-transparent border-b-2 border-sage focus:outline-none flex-1"
              />
              <button onClick={handleSaveTitle} className="font-display text-sm text-sage hover:underline">
                Save
              </button>
              <button onClick={() => setEditingTitle(false)} className="font-display text-sm text-ink-soft hover:underline">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
                {checklist.title}
              </h1>
              <button
                onClick={() => setEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs text-ink-soft hover:text-ink"
              >
                edit
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Checklist */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 pb-16">
        <div className="mb-8 rounded-2xl border border-line bg-paper-dark/60 p-5 sm:p-6">
          <ProgressBar {...progress} />
        </div>
        <div className="flex flex-col gap-5">
          {categories.map((category, index) => (
            <CategorySection
              key={category.id}
              category={category}
              index={index}
              onToggleTask={(taskId) => {
                const catId = checklist.categories[index].id;
                handleToggleTask(catId, parseInt(taskId, 10));
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
