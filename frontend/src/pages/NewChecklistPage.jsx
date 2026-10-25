// src/pages/NewChecklistPage.jsx
// Supports both "Paste ChatGPT plan" (local parse) and "Generate from text" (AI generation).

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseChecklist } from '../utils/parser';
import { checklistApi, generateChecklist } from '../utils/api';
import CopyPromptButton from '../components/CopyPromptButton';
import { CHECKLIST_PROMPT } from '../utils/prompt';
import { usePendingCapture } from '../extension/pendingCapture';

export default function NewChecklistPage() {
  const navigate = useNavigate();

  // Mode: 'paste' (existing flow) or 'generate' (AI flow)
  const [mode, setMode] = useState('paste');

  // Shared title
  const [title, setTitle] = useState('');

  // Paste flow state
  const [pasteInput, setPasteInput] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState('');

  // AI generate flow state
  const [aiText, setAiText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [aiError, setAiError] = useState('');
  const [previewCategories, setPreviewCategories] = useState(null);
  const [savingPreview, setSavingPreview] = useState(false);

  const slowTimerRef = useRef(null);

  const capture = usePendingCapture();
  const [sourceUrl, setSourceUrl] = useState('');
  const [restrictedNotice, setRestrictedNotice] = useState(false);

  useEffect(() => {
    if (import.meta.env.MODE === 'extension') {
      if (capture.text) {
        setMode('generate');
        setAiText(capture.text);
        setSourceUrl(capture.url);
        setRestrictedNotice(false);
      } else if (capture.url && !capture.text) {
        setMode('generate');
        setSourceUrl(capture.url);
        setRestrictedNotice(true);
      }
    }
  }, [capture.text, capture.url]);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  // ─── 1. Paste & Parse Flow (Untouched behavior) ──────────────────────────
  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pasteInput.trim()) return;

    setPasteLoading(true);
    setPasteError('');

    try {
      const categories = parseChecklist(pasteInput);

      if (categories.length === 0) {
        setPasteError('Could not find any categories or tasks. Make sure your plan uses "-" or "*" for tasks.');
        return;
      }

      const checklist = await checklistApi.create({
        title: title.trim() || 'My Checklist',
        rawInput: pasteInput,
        categories: categories.map((cat) => ({
          category: cat.category,
          tasks: cat.tasks.map((t) => ({ title: t.title, completed: t.completed })),
        })),
      });

      navigate(`/checklist/${checklist.id}`);
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
      setPasteError(err instanceof Error ? err.message : 'Failed to save checklist');
    } finally {
      setPasteLoading(false);
    }
  };

  // ─── 2. AI Generation Flow ────────────────────────────────────────────────
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (aiText.trim().length < 20) {
      setAiError('Please enter at least 20 characters to generate a checklist.');
      return;
    }

    setGenerating(true);
    setSlowNotice(false);
    setAiError('');
    setPreviewCategories(null);

    // Show notice after 8 seconds of waiting (free server cold-start)
    slowTimerRef.current = setTimeout(() => {
      setSlowNotice(true);
    }, 8000);

    try {
      const data = await generateChecklist(aiText.trim());
      setPreviewCategories(data.categories || []);
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
      setAiError(err instanceof Error ? err.message : 'Failed to generate checklist');
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setGenerating(false);
      setSlowNotice(false);
    }
  };

  const handleSavePreview = async () => {
    if (!previewCategories || previewCategories.length === 0) return;

    setSavingPreview(true);
    setAiError('');

    try {
      const checklist = await checklistApi.create({
        title: title.trim() || 'My Generated Checklist',
        rawInput: aiText,
        categories: previewCategories,
      });

      navigate(`/checklist/${checklist.id}`);
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
      setAiError(err instanceof Error ? err.message : 'Failed to save checklist');
    } finally {
      setSavingPreview(false);
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
            Create an actionable checklist by pasting a formatted plan or generating one directly from text with AI.
          </p>

          {/* Mode Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`rounded-full px-4 py-2 font-display text-sm font-medium transition-colors ${
                mode === 'paste'
                  ? 'bg-sage text-paper shadow-sm'
                  : 'bg-white/70 border border-line text-ink-soft hover:text-ink'
              }`}
            >
              Paste ChatGPT plan
            </button>
            <button
              type="button"
              onClick={() => setMode('generate')}
              className={`rounded-full px-4 py-2 font-display text-sm font-medium transition-colors ${
                mode === 'generate'
                  ? 'bg-sage text-paper shadow-sm'
                  : 'bg-white/70 border border-line text-ink-soft hover:text-ink'
              }`}
            >
              Generate from text (AI)
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        {/* Title Field (shared) */}
        <div className="mb-6">
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

        {/* ─── Mode 1: Paste and Parse ─── */}
        {mode === 'paste' && (
          <form onSubmit={handlePasteSubmit} className="flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-white/50 p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-ink-soft">ChatGPT prompt template</span>
                <CopyPromptButton />
              </div>
              <details className="group">
                <summary className="cursor-pointer font-mono text-xs text-ink-soft hover:text-ink transition-colors">
                  View prompt text
                </summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-white/70 p-4 font-mono text-xs text-ink-soft leading-relaxed">
                  {CHECKLIST_PROMPT}
                </pre>
              </details>
            </div>

            <div>
              <label htmlFor="plan-input" className="font-display text-lg font-medium text-ink block mb-2">
                Paste your plan
              </label>
              <textarea
                id="plan-input"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="Paste ChatGPT output here..."
                rows={10}
                className="w-full rounded-2xl border border-line bg-white/70 p-4 font-body text-base text-ink placeholder:text-ink-soft/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-sage resize-y"
              />
            </div>

            {pasteError && (
              <p className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-3 font-body text-sm text-terracotta">
                {pasteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!pasteInput.trim() || pasteLoading}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {pasteLoading ? 'Saving…' : 'Generate & save checklist'}
              </button>
            </div>
          </form>
        )}

        {/* ─── Mode 2: Generate from text (AI) ─── */}
        {mode === 'generate' && (
          <div className="flex flex-col gap-6">
            {!previewCategories ? (
              <form onSubmit={handleAiGenerate} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="ai-text-input" className="font-display text-lg font-medium text-ink block mb-2">
                    Enter or paste text to convert into a checklist
                  </label>
                  {sourceUrl && (
                    <p className="font-mono text-xs text-ink-soft mb-2 truncate">
                      Source: {sourceUrl}
                    </p>
                  )}
                  {restrictedNotice && (
                    <p className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 font-body text-sm text-amber-900 mb-3">
                      This page cannot be read. Select text and try again.
                    </p>
                  )}
                  <p className="font-body text-sm text-ink-soft mb-3">
                    Paste raw notes, a blog post, an article, or instructions (minimum 20 characters).
                  </p>
                  <textarea
                    id="ai-text-input"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="e.g. Here is our launch plan: First we need to finish the marketing website and write documentation. Next, run automated tests and verify payments. Finally, announce on Twitter and email our newsletter subscribers..."
                    rows={8}
                    className="w-full rounded-2xl border border-line bg-white/70 p-4 font-body text-base text-ink placeholder:text-ink-soft/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-sage resize-y"
                  />
                </div>

                {slowNotice && (
                  <p className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 font-body text-sm text-amber-900">
                    The server or AI model may be waking up, please wait a moment…
                  </p>
                )}

                {aiError && (
                  <p className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-3 font-body text-sm text-terracotta">
                    {aiError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={aiText.trim().length < 20 || generating}
                    className="inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Generating checklist…' : 'Generate with AI'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink">
                      Checklist Preview
                    </h2>
                    <p className="font-body text-sm text-ink-soft mt-1">
                      Review the generated tasks below. Click &quot;Save checklist&quot; to save to your account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewCategories(null)}
                    className="font-mono text-xs text-ink-soft hover:text-ink transition-colors underline"
                  >
                    Discard &amp; regenerate
                  </button>
                </div>

                {/* Preview Cards */}
                <div className="flex flex-col gap-4">
                  {previewCategories.map((cat, catIdx) => (
                    <div
                      key={catIdx}
                      className="rounded-2xl border border-line bg-white/70 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-line bg-paper-dark/60 px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs text-ink-soft">
                            {String(catIdx + 1).padStart(2, '0')}
                          </span>
                          <h3 className="font-display text-lg font-medium text-ink">
                            {cat.category}
                          </h3>
                        </div>
                        <span className="font-mono text-xs text-ink-soft">
                          {cat.tasks?.length || 0} tasks
                        </span>
                      </div>
                      <ul className="divide-y divide-line/40 px-3 py-1">
                        {cat.tasks?.map((task, tIdx) => (
                          <li
                            key={tIdx}
                            className="flex items-start gap-3 px-3 py-2.5 text-sm text-ink font-body"
                          >
                            <span className="mt-1 h-3.5 w-3.5 rounded border border-line bg-paper flex-shrink-0" />
                            <span>{task.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {aiError && (
                  <p className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-3 font-body text-sm text-terracotta">
                    {aiError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePreview}
                    disabled={savingPreview}
                    className="inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40"
                  >
                    {savingPreview ? 'Saving…' : 'Save checklist'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewCategories(null)}
                    disabled={savingPreview}
                    className="rounded-full border border-line px-5 py-2.5 font-display text-sm font-medium text-ink-soft hover:bg-paper-dark transition-colors"
                  >
                    Back to edit text
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
