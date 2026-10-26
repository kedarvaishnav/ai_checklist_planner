import { useState } from 'react';
import TaskItem from './TaskItem';

export default function CategorySection({
  category,
  index,
  onToggleTask,
  onRenameCategory,
  onDeleteCategory,
  onAddTask,
  onRenameTask,
  onDeleteTask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.category);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const total = category.tasks.length;
  const completed = category.tasks.filter((t) => t.completed).length;

  const handleSaveCategory = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed !== category.category) {
      onRenameCategory?.(category.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelCategory = () => {
    setEditName(category.category);
    setIsEditing(false);
  };

  const handleDeleteCategory = () => {
    const isConfirmed =
      (typeof window !== 'undefined' && (window.__CONFIRM__ || new URLSearchParams(window.location.search).has('skip_confirm')))
        ? true
        : window.confirm(`Delete category "${category.category}" and all its tasks?`);
    if (isConfirmed) {
      onDeleteCategory?.(category.id);
    }
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    onAddTask?.(category.id, trimmed);
    setNewTaskTitle('');
  };

  return (
    <section className="rounded-2xl border border-line bg-white/60 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-paper-dark/70 px-4 py-3">
        {isEditing ? (
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCategory();
                if (e.key === 'Escape') handleCancelCategory();
              }}
              maxLength={200}
              autoFocus
              className="flex-1 min-w-0 rounded-lg border border-line bg-white px-2.5 py-1 font-display text-base font-medium text-ink focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={!editName.trim()}
                className="rounded-full bg-sage px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-paper hover:bg-sage/90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelCategory}
                className="rounded-full border border-line bg-white/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-ink-soft shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="font-display text-lg font-medium text-ink break-words line-clamp-2">
                {category.category}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditName(category.category);
                  setIsEditing(true);
                }}
                aria-label={`Rename category: ${category.category}`}
                className="rounded-full border border-line bg-white/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft hover:border-sage hover:text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                aria-label={`Delete category: ${category.category}`}
                className="rounded-full border border-line bg-white/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-terracotta hover:border-terracotta hover:bg-terracotta/10"
              >
                Delete
              </button>
              <span className="font-mono text-xs text-ink-soft whitespace-nowrap ml-1">
                {completed}/{total}
              </span>
            </div>
          </div>
        )}
      </header>

      <ul className="flex flex-col gap-1 p-2">
        {category.tasks.length === 0 ? (
          <li className="px-3 py-4 text-center font-body text-xs text-ink-soft/70">
            No tasks yet in this category.
          </li>
        ) : (
          category.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggleTask?.(task.id)}
              onRename={(taskId, newTitle) => onRenameTask?.(taskId, newTitle)}
              onDelete={(taskId) => onDeleteTask?.(taskId)}
            />
          ))
        )}
      </ul>

      {/* Add Task Input Form */}
      <form
        onSubmit={handleAddTaskSubmit}
        className="border-t border-line/60 bg-paper-dark/30 p-2.5 flex items-center gap-2"
      >
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="+ Add a task to this category..."
          maxLength={300}
          className="flex-1 min-w-0 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-body text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-sage"
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="shrink-0 rounded-xl bg-sage px-3.5 py-1.5 font-display text-xs font-medium text-paper transition-all hover:bg-sage/90 disabled:opacity-40"
        >
          Add task
        </button>
      </form>
    </section>
  );
}
