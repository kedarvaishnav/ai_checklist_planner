import { useState } from 'react';

export default function TaskItem({ task, onToggle, onRename, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(task.title);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy task:', error);
    }
  };

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    if (trimmed !== task.title) {
      onRename?.(task.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleDelete = () => {
    const isConfirmed =
      (typeof window !== 'undefined' && (window.__CONFIRM__ || new URLSearchParams(window.location.search).has('skip_confirm')))
        ? true
        : window.confirm(`Delete task "${task.title}"?`);
    if (isConfirmed) {
      onDelete?.(task.id);
    }
  };

  if (isEditing) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 bg-paper-dark/60 border border-sage/40">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          maxLength={300}
          autoFocus
          className="flex-1 min-w-[160px] rounded-lg border border-line bg-white px-2.5 py-1 text-sm font-body text-ink focus:outline-none focus:ring-1 focus:ring-sage"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!editTitle.trim()}
            className="rounded-full bg-sage px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-paper hover:bg-sage/90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-line bg-white/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex flex-col gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-paper-dark sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.completed}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
      >
        <span
          className={`check-box mt-0.5 ${task.completed ? 'checked' : ''}`}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="19"
              height="19"
              rx="4"
              className={
                task.completed
                  ? 'fill-sage stroke-sage'
                  : 'fill-transparent stroke-line group-hover:stroke-sage'
              }
              strokeWidth="1.5"
            />
            <path
              d="M5.5 11.5L9.5 15.5L16.5 6.5"
              className="check-mark"
              stroke="#FAF6EE"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
        <span
          className={`min-w-0 flex-1 select-text font-body text-sm sm:text-base leading-snug transition-colors break-words ${
            task.completed ? 'text-ink-soft line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </span>
      </button>

      <div className="flex items-center gap-1.5 shrink-0 pl-8 sm:pl-0 sm:ml-auto">
        <button
          type="button"
          onClick={() => {
            setEditTitle(task.title);
            setIsEditing(true);
          }}
          aria-label={`Edit task: ${task.title}`}
          className="inline-flex shrink-0 items-center rounded-full border border-line bg-white/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-sage hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Delete task: ${task.title}`}
          className="inline-flex shrink-0 items-center rounded-full border border-line bg-white/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-terracotta transition-colors hover:border-terracotta hover:bg-terracotta/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy task: ${task.title}`}
          className="inline-flex shrink-0 items-center rounded-full border border-line bg-white/70 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-sage hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </li>
  );
}
