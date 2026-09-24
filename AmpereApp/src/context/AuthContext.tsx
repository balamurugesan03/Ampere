import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';
import type { User } from '../api/types';

const TOKEN_KEY = 'ampere_token';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, referralCode: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<Pick<User, 'name' | 'phone' | 'notificationsEnabled'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          try {
            const { data } = await api.get('/auth/me');
            setUser(data.user);
          } catch (err: any) {
            // Only drop the session when the server rejects the token, not on a network blip.
            if (err?.response?.status === 401) {
              await AsyncStorage.removeItem(TOKEN_KEY);
              setAuthToken(null);
            }
          }
        }
      } catch {
        // Storage failure: continue as signed out rather than hanging on the spinner.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applySession = async (token: string, sessionUser: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(sessionUser);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await applySession(data.token, data.user);
  };

  const signup = async (name: string, email: string, password: string, referralCode: string, phone?: string) => {
    const { data } = await api.post('/auth/signup', { name, email, password, phone, referralCode });
    await applySession(data.token, data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  };

  const updateUser = async (patch: Partial<Pick<User, 'name' | 'phone' | 'notificationsEnabled'>>) => {
    const { data } = await api.put('/auth/me', patch);
    setUser(data.user);
  };

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, updateUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
