// src/pages/AuthPage.jsx
// Combined login + register page.
// Switches between the two modes with a tab toggle.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage mb-2">
            AI Checklist Planner
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-line overflow-hidden mb-6">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 font-display text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-sage text-paper'
                  : 'bg-paper text-ink-soft hover:bg-paper-dark'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-body text-sm text-ink-soft mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 font-body text-base text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink-soft mb-1" htmlFor="password">
              Password {mode === 'register' && <span className="text-ink-soft/60">(min 8 chars)</span>}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 font-body text-base text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-terracotta/10 border border-terracotta/20 px-4 py-3 font-body text-sm text-terracotta">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-sage py-3 font-display text-base font-medium text-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
