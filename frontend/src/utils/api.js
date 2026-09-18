// src/utils/api.js
// All HTTP calls to the backend go through this file.
// It automatically attaches the JWT token to every request.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Token helpers ─────────────────────────────────────────────────────────
// The JWT is stored in localStorage so it survives page refreshes.

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

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

  toggleTask: (checklistId, taskId) =>
    request(
      `/api/checklists/${checklistId}/tasks/${taskId}`,
      { method: 'PATCH' }
    ),
};
