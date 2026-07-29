import type { Task } from '../types/checklist';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.completed}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-paper-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2"
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
          className={`flex-1 font-body text-base transition-colors ${
            task.completed ? 'text-ink-soft line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </span>
      </button>
    </li>
  );
}
