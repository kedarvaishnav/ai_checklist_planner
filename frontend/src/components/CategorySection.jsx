import TaskItem from './TaskItem';

export default function CategorySection({ category, index, onToggleTask }) {
  const total = category.tasks.length;
  const completed = category.tasks.filter((t) => t.completed).length;

  return (
    <section className="rounded-2xl border border-line bg-white/60 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-paper-dark/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-soft">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="font-display text-xl font-medium text-ink">
            {category.category}
          </h2>
        </div>
        <span className="font-mono text-xs text-ink-soft whitespace-nowrap">
          {completed}/{total}
        </span>
      </header>
      <ul className="flex flex-col gap-1 p-2">
        {category.tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => onToggleTask(task.id)} />
        ))}
      </ul>
    </section>
  );
}
