// src/utils/tokenStorage.js
// Universal token storage abstraction for both web and Chrome extension builds.

const isExtension = import.meta.env?.MODE === 'extension';

export async function getToken() {
  if (isExtension && typeof chrome !== 'undefined' && chrome.storage?.local) {
    const data = await chrome.storage.local.get(['token']);
    return data.token || null;
  }
  return localStorage.getItem('token');
}

export async function setToken(token) {
  if (isExtension && typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ token });
    return;
  }
  localStorage.setItem('token', token);
}

export async function clearToken() {
  if (isExtension && typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.remove(['token']);
    return;
  }
  localStorage.removeItem('token');
}
