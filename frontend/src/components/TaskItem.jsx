import { useState } from 'react';

export default function TaskItem({ task, onToggle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(task.title);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy task:', error);
    }
  };

  return (
    <li className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-paper-dark">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.completed}
        className="group flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
      >
        <span
          className={`check-box ${task.completed ? 'checked' : ''}`}
          aria-hidden="true"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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
          className={`min-w-0 flex-1 select-text font-body text-base transition-colors ${
            task.completed ? 'text-ink-soft line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </span>
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy task: ${task.title}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-white/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-sage hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </li>
  );
}
