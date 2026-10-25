import { useState, useEffect, useCallback } from 'react';

const isExtension = import.meta.env?.MODE === 'extension';

export function usePendingCapture() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const clear = useCallback(async () => {
    setText('');
    setUrl('');
    if (isExtension && typeof chrome !== 'undefined' && chrome.storage?.session) {
      try {
        await chrome.storage.session.remove(['pendingText', 'pendingUrl']);
      } catch {
        // Storage remove error ignored
      }
    }
  }, []);

  useEffect(() => {
    if (!isExtension || typeof chrome === 'undefined' || !chrome.storage?.session) {
      return;
    }

    // Read on mount
    chrome.storage.session
      .get(['pendingText', 'pendingUrl'])
      .then((data) => {
        if (data) {
          if (typeof data.pendingText === 'string') setText(data.pendingText);
          if (typeof data.pendingUrl === 'string') setUrl(data.pendingUrl);
        }
      })
      .catch(() => {});

    // Listen for new captures arriving while the side panel is already open
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'session') {
        if (changes.pendingText) {
          setText(changes.pendingText.newValue || '');
        }
        if (changes.pendingUrl) {
          setUrl(changes.pendingUrl.newValue || '');
        }
      }
    };

    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  return { text, url, clear };
}
