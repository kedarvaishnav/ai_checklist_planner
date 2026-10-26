// src/utils/api.js
// All HTTP calls to the backend go through this file.
// It automatically attaches the JWT token to every request.

import { getToken, setToken, clearToken } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Token helpers & Auth Expired Callback ──────────────────────────────────
export { getToken, setToken, clearToken };
export const removeToken = clearToken;

let onAuthExpiredCallback = null;

export function registerAuthExpiredHandler(callback) {
  onAuthExpiredCallback = callback;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function request(path, options = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    await clearToken();
    if (typeof onAuthExpiredCallback === 'function') {
      onAuthExpiredCallback();
    }
    window.dispatchEvent(new CustomEvent('auth:expired'));
    if (window.location.pathname !== '/auth' && !window.location.hash.includes('/auth')) {
      window.location.href = '/auth';
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid or expired token');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  register: (email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request('/api/auth/me'),
};

// ─── Checklists API ────────────────────────────────────────────────────────

export function generateChecklist(text) {
  return request('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export const checklistApi = {
  list: () =>
    request('/api/checklists'),

  create: (payload) =>
    request('/api/checklists', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  get: (id) =>
    request(`/api/checklists/${id}`),

  updateTitle: (id, title) =>
    request(`/api/checklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),

  delete: (id) =>
    request(`/api/checklists/${id}`, { method: 'DELETE' }),

  toggleTask: (checklistId, taskId, completed) =>
    request(
      `/api/checklists/${checklistId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }
    ),

  addCategory: (checklistId, name) =>
    request(`/api/checklists/${checklistId}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateCategory: (checklistId, categoryId, name) =>
    request(`/api/checklists/${checklistId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteCategory: (checklistId, categoryId) =>
    request(`/api/checklists/${checklistId}/categories/${categoryId}`, {
      method: 'DELETE',
    }),

  addTask: (checklistId, categoryId, title) =>
    request(`/api/checklists/${checklistId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ categoryId: Number(categoryId), title }),
    }),

  updateTask: (checklistId, taskId, updates) =>
    request(`/api/checklists/${checklistId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteTask: (checklistId, taskId) =>
    request(`/api/checklists/${checklistId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  generate: generateChecklist,
};

