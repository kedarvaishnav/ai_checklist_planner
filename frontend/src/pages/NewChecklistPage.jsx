// src/pages/NewChecklistPage.jsx
// The main "paste your plan → generate checklist" page.
// Saves to the backend instead of localStorage.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseChecklist } from '../utils/parser';
import { checklistApi } from '../utils/api';
import CopyPromptButton from '../components/CopyPromptButton';
import { CHECKLIST_PROMPT } from '../utils/prompt';

export default function NewChecklistPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Parse locally (same logic as original app)
      const categories = parseChecklist(input);

      if (categories.length === 0) {
        setError('Could not find any categories or tasks. Make sure your plan uses "-" or "*" for tasks.');
        return;
      }

      // Save to backend
      const checklist = await checklistApi.create({
        title: title.trim() || 'My Checklist',
        rawInput: input,
        categories: categories.map((cat) => ({
          category: cat.category,
          tasks: cat.tasks.map((t) => ({ title: t.title, completed: t.completed })),
        })),
      });

      // Go straight to the checklist view
      navigate(`/checklist/${checklist.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line bg-paper-dark/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
          <button
            onClick={() => navigate('/')}
            className="font-mono text-xs text-ink-soft hover:text-ink transition-colors mb-4 inline-block"
          >
            ← My checklists
          </button>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage mb-3">
            Plan · Paste · Check off
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-tight">
            New Checklist
          </h1>
          <p className="mt-4 max-w-xl font-body text-ink-soft text-base sm:text-lg leading-relaxed">
            Ask ChatGPT for a plan using the prompt below, paste the result in,
            and turn it into a checklist you can actually work through.
          </p>
          <div className="mt-6">
            <CopyPromptButton />
          </div>
          <details className="mt-4 group">
            <summary className="cursor-pointer font-mono text-xs text-ink-soft hover:text-ink transition-colors">
              View prompt text
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-white/70 p-4 font-mono text-xs text-ink-soft leading-relaxed">
              {CHECKLIST_PROMPT}
            </pre>
          </details>
        </div>
      </header>

      {/* Input area */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div>
            <label htmlFor="checklist-title" className="font-display text-lg font-medium text-ink block mb-2">
              Checklist title
            </label>
            <input
              id="checklist-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Launch my SaaS product"
              className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 font-body text-base text-ink placeholder:text-ink-soft/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

          <div>
            <label htmlFor="plan-input" className="font-display text-lg font-medium text-ink block mb-2">
              Paste your plan
            </label>
            <textarea
              id="plan-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste ChatGPT output here..."
              rows={10}
              className="w-full rounded-2xl border border-line bg-white/70 p-4 font-body text-base text-ink placeholder:text-ink-soft/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-sage resize-y"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-3 font-body text-sm text-terracotta">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Generate & save checklist'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
