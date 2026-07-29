// src/utils/api.ts
// All HTTP calls to the backend go through this file.
// It automatically attaches the JWT token to every request.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Token helpers ─────────────────────────────────────────────────────────
// The JWT is stored in localStorage so it survives page refreshes.

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: { id: number; email: string };
}

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ user: { id: number; email: string; created_at: string } }>('/api/auth/me'),
};

// ─── Checklists API ────────────────────────────────────────────────────────

export interface ApiTask {
  id: number;
  title: string;
  completed: boolean;
}

export interface ApiCategory {
  id: number;
  category: string;
  tasks: ApiTask[];
}

export interface ApiChecklist {
  id: number;
  title: string;
  rawInput: string;
  createdAt: string;
  updatedAt: string;
  categories: ApiCategory[];
}

export interface ChecklistSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export const checklistApi = {
  list: () =>
    request<{ checklists: ChecklistSummary[] }>('/api/checklists'),

  create: (payload: {
    title: string;
    rawInput: string;
    categories: { category: string; tasks: { title: string; completed: boolean }[] }[];
  }) =>
    request<ApiChecklist>('/api/checklists', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  get: (id: number) =>
    request<ApiChecklist>(`/api/checklists/${id}`),

  updateTitle: (id: number, title: string) =>
    request<{ message: string }>(`/api/checklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/checklists/${id}`, { method: 'DELETE' }),

  toggleTask: (checklistId: number, taskId: number) =>
    request<{ id: number; completed: boolean }>(
      `/api/checklists/${checklistId}/tasks/${taskId}`,
      { method: 'PATCH' }
    ),
};
