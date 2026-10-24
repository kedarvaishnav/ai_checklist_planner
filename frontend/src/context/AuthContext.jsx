// src/context/AuthContext.jsx
// Provides the logged-in user to every component in the app.
// Wrap your app in <AuthProvider> and use the useAuth() hook anywhere.

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, registerAuthExpiredHandler } from '../utils/api';
import { getToken, setToken, clearToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register callback with api.js so 401s clear user state
  useEffect(() => {
    registerAuthExpiredHandler(() => {
      setUser(null);
    });
  }, []);

  // Listen for auth:expired events triggered by 401 API responses
  useEffect(() => {
    const handleExpired = async () => {
      await clearToken();
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // On first render, try to restore the session from the stored token
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await getToken();
        if (!token) {
          if (active) setUser(null);
          return;
        }
        const { user } = await authApi.me();
        if (active) setUser(user);
      } catch {
        await clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    await setToken(token);
    setUser(user);
  };

  const register = async (email, password) => {
    const { token, user } = await authApi.register(email, password);
    await setToken(token);
    setUser(user);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — throws if used outside AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
