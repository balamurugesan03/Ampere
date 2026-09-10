import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getStoredToken, setAuthToken } from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.user.role === 'admin') {
            setUser(data.user);
          } else {
            setAuthToken(null);
          }
        } catch {
          setAuthToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }
    setAuthToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
