// src/pages/ChecklistPage.jsx
// Shows a single checklist with all its categories and tasks.
// Supports manual editing: add category, rename/delete category, add task, rename/delete task.

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
  const [actionError, setActionError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

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

  const handleAuthOrError = (err, fallbackMsg) => {
    if (
      err.message?.toLowerCase().includes('token') ||
      err.message?.toLowerCase().includes('expired') ||
      err.message?.toLowerCase().includes('authorization') ||
      err.message?.includes('401')
    ) {
      navigate('/auth', { replace: true });
      return;
    }
    setActionError(err.message || fallbackMsg);
  };

  // Optimistic toggle: update UI immediately, then sync with backend
  const handleToggleTask = async (categoryId, taskId) => {
    if (!checklist) return;

    let targetCompleted = false;
    for (const cat of checklist.categories) {
      if (Number(cat.id) === Number(categoryId)) {
        const found = (cat.tasks || []).find((t) => Number(t.id) === Number(taskId));
        if (found) targetCompleted = !found.completed;
        break;
      }
    }

    // Optimistic update
    setChecklist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          Number(cat.id) === Number(categoryId)
            ? {
                ...cat,
                tasks: (cat.tasks || []).map((t) =>
                  Number(t.id) === Number(taskId) ? { ...t, completed: targetCompleted } : t
                ),
              }
            : cat
        ),
      };
    });

    try {
      await checklistApi.toggleTask(checklist.id, taskId, targetCompleted);
    } catch (err) {
      handleAuthOrError(err, 'Failed to update task');
      // Revert on failure
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) =>
            Number(cat.id) === Number(categoryId)
              ? {
                  ...cat,
                  tasks: (cat.tasks || []).map((t) =>
                    Number(t.id) === Number(taskId) ? { ...t, completed: !targetCompleted } : t
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
      setChecklist((prev) => (prev ? { ...prev, title: titleInput.trim() } : prev));
      setEditingTitle(false);
    } catch (err) {
      handleAuthOrError(err, 'Failed to update title');
    }
  };

  // Add category
  const handleAddCategory = async (e) => {
    e?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!checklist || !trimmed) return;
    setActionError('');
    setAddingCategory(true);
    try {
      const created = await checklistApi.addCategory(checklist.id, trimmed);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: [
            ...prev.categories,
            {
              id: created.id,
              category: created.name,
              name: created.name,
              position: created.position,
              tasks: [],
            },
          ],
        };
      });
      setNewCategoryName('');
    } catch (err) {
      handleAuthOrError(err, 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  // Rename category
  const handleRenameCategory = async (categoryId, newName) => {
    if (!checklist) return;
    setActionError('');
    try {
      const updated = await checklistApi.updateCategory(checklist.id, categoryId, newName);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) =>
            Number(cat.id) === Number(categoryId)
              ? { ...cat, category: updated.name, name: updated.name }
              : cat
          ),
        };
      });
    } catch (err) {
      handleAuthOrError(err, 'Failed to rename category');
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!checklist) return;
    setActionError('');
    try {
      await checklistApi.deleteCategory(checklist.id, categoryId);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.filter((cat) => Number(cat.id) !== Number(categoryId)),
        };
      });
    } catch (err) {
      handleAuthOrError(err, 'Failed to delete category');
    }
  };

  // Add task to category
  const handleAddTask = async (categoryId, title) => {
    if (!checklist) return;
    setActionError('');
    try {
      const created = await checklistApi.addTask(checklist.id, categoryId, title);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) =>
            Number(cat.id) === Number(categoryId)
              ? {
                  ...cat,
                  tasks: [
                    ...(cat.tasks || []),
                    {
                      id: created.id,
                      title: created.title,
                      completed: created.completed,
                      position: created.position,
                    },
                  ],
                }
              : cat
          ),
        };
      });
    } catch (err) {
      handleAuthOrError(err, 'Failed to add task');
    }
  };

  // Rename task
  const handleRenameTask = async (taskId, newTitle) => {
    if (!checklist) return;
    setActionError('');
    try {
      const updated = await checklistApi.updateTask(checklist.id, taskId, { title: newTitle });
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            tasks: (cat.tasks || []).map((t) =>
              Number(t.id) === Number(taskId)
                ? { ...t, title: updated.title, completed: updated.completed }
                : t
            ),
          })),
        };
      });
    } catch (err) {
      handleAuthOrError(err, 'Failed to rename task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!checklist) return;
    setActionError('');
    try {
      await checklistApi.deleteTask(checklist.id, taskId);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            tasks: (cat.tasks || []).filter((t) => Number(t.id) !== Number(taskId)),
          })),
        };
      });
    } catch (err) {
      handleAuthOrError(err, 'Failed to delete task');
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
  const categories = (checklist.categories || []).map((cat) => ({
    id: String(cat.id),
    category: cat.category || cat.name,
    tasks: (cat.tasks || []).map((t) => ({
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                autoFocus
                className="font-display text-2xl sm:text-3xl font-semibold text-ink bg-transparent border-b-2 border-sage focus:outline-none flex-1 min-w-0"
              />
              <button onClick={handleSaveTitle} className="font-display text-sm text-sage hover:underline">
                Save
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="font-display text-sm text-ink-soft hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <h1 className="font-display text-2xl sm:text-4xl font-semibold text-ink break-words">
                {checklist.title}
              </h1>
              <button
                onClick={() => setEditingTitle(true)}
                className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs text-ink-soft hover:text-ink"
              >
                edit
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-16">
        {/* Error notification banner */}
        {actionError && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-rust/10 border border-terracotta/40 px-4 py-3 font-body text-sm text-terracotta">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError('')}
              className="ml-3 font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-line bg-paper-dark/60 p-4 sm:p-6">
          <ProgressBar {...progress} />
        </div>

        {/* Categories List */}
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-paper-dark/30 p-8 text-center mb-6">
            <p className="font-display text-lg font-medium text-ink mb-1">No categories yet</p>
            <p className="font-body text-sm text-ink-soft">
              Add your first category below to start building your checklist.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mb-8">
            {categories.map((category, index) => (
              <CategorySection
                key={category.id}
                category={category}
                index={index}
                onToggleTask={(taskId) => {
                  const catId = checklist.categories[index].id;
                  handleToggleTask(catId, parseInt(taskId, 10));
                }}
                onRenameCategory={(catId, newName) => handleRenameCategory(catId, newName)}
                onDeleteCategory={(catId) => handleDeleteCategory(catId)}
                onAddTask={(catId, taskTitle) => handleAddTask(catId, taskTitle)}
                onRenameTask={(taskId, newTitle) => handleRenameTask(taskId, newTitle)}
                onDeleteTask={(taskId) => handleDeleteTask(taskId)}
              />
            ))}
          </div>
        )}

        {/* Add New Category Box */}
        <div className="rounded-2xl border border-line bg-white/70 p-4 sm:p-5 shadow-sm">
          <h3 className="font-display text-base font-medium text-ink mb-2">
            Add a category
          </h3>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Planning & Setup"
              maxLength={200}
              className="flex-1 min-w-0 rounded-xl border border-line bg-white px-3.5 py-2 font-body text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-sage"
            />
            <button
              type="submit"
              disabled={addingCategory || !newCategoryName.trim()}
              className="shrink-0 rounded-xl bg-sage px-4 py-2 font-display text-sm font-medium text-paper transition-all hover:bg-sage/90 disabled:opacity-40"
            >
              {addingCategory ? 'Adding…' : 'Add category'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
