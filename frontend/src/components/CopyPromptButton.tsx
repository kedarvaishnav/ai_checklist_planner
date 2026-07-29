import { useState } from 'react';
import { CHECKLIST_PROMPT } from '../utils/prompt';

export default function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CHECKLIST_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2 active:translate-y-0"
    >
      {copied ? (
        <>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M5.5 11.5L9.5 15.5L16.5 6.5"
              stroke="#6B8F71"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Copied to clipboard
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="#FAF6EE" strokeWidth="1.8" />
            <path
              d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
              stroke="#FAF6EE"
              strokeWidth="1.8"
            />
          </svg>
          Copy prompt
        </>
      )}
    </button>
  );
}
