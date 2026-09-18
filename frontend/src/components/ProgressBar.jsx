export default function ProgressBar({ completed, total, percentage }) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-display text-sm text-ink-soft tracking-wide">
          {completed} of {total} done
        </span>
        <span className="font-mono text-2xl font-medium text-ink">
          {percentage}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-paper-dark border border-line overflow-hidden">
        <div
          className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
