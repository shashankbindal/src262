import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on first mount while we check session

  /* ── Bootstrap: verify existing session on mount ───────────────────────── */
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /* ── Actions ────────────────────────────────────────────────────────────── */
  const login = useCallback(async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    return res;
  }, []);

  const register = useCallback(async (payload) => {
    return api.post('/auth/register', payload);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    sessionStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
    return res.data;
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
