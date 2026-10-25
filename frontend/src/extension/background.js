chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.contextMenus.create({
    id: 'generate-checklist',
    title: 'Generate checklist',
    contexts: ['selection', 'page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'generate-checklist') return;
  // Order matters: open the side panel synchronously first before any await so the user gesture is not lost
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
  savePendingCapture(info, tab);
});

async function savePendingCapture(info, tab) {
  let pendingText = '';
  const pendingUrl = tab?.url || '';

  if (info.selectionText) {
    pendingText = info.selectionText;
  } else if (tab?.id) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body?.innerText || '',
      });
      if (results && results[0] && typeof results[0].result === 'string') {
        pendingText = results[0].result;
      }
    } catch {
      // Restricted pages (e.g. chrome://) cannot be read; leave pendingText empty
      pendingText = '';
    }
  }

  pendingText = (pendingText || '').slice(0, 20000);

  if (chrome.storage?.session) {
    await chrome.storage.session.set({
      pendingText,
      pendingUrl,
    });
  }
}
