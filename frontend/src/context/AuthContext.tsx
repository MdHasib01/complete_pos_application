import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then((res) => {
        setUser(res.user);
        setPermissions(res.permissions || []);
      })
      .catch(() => {
        tokenStore.clear();
        setUser(null);
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res.token) tokenStore.set(res.token);
      setUser(res.user);
      setPermissions(res.permissions || []);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await api.register(email, password);
      if (res.token) tokenStore.set(res.token);
      setUser(res.user);
      setPermissions(res.permissions || []);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network/logout errors — clear locally regardless
    }
    tokenStore.clear();
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission: string) => permissions.includes(permission);

  return (
    <AuthContext.Provider
      value={{ user, permissions, loading, hasPermission, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
