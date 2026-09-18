// src/context/AuthContext.jsx
// Provides the logged-in user to every component in the app.
// Wrap your app in <AuthProvider> and use the useAuth() hook anywhere.

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getToken, setToken, removeToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first render, try to restore the session from the stored token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => removeToken()) // token invalid/expired — clear it
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    setToken(token);
    setUser(user);
  };

  const register = async (email, password) => {
    const { token, user } = await authApi.register(email, password);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    removeToken();
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
