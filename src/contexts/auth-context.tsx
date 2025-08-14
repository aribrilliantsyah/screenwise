
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Prisma } from '@prisma/client';
import { login as loginAction, signup as signupAction, type SignupData } from '@/actions/user';

// Re-export this for use in other client components
export type { SignupData };

// Omit password hash for client-side safety.
export type SafeUser = Omit<User, 'passwordHash'>;

const SESSION_KEY = 'screenwise_session';

interface AuthContextType {
  user: SafeUser | null;
  setUser: React.Dispatch<React.SetStateAction<SafeUser | null>>;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean, error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean, error?: string }>;
  logout: () => void;
  setSession: (user: SafeUser) => void;
  getSession: () => SafeUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const getSession = useCallback((): SafeUser | null => {
    if (typeof window === 'undefined') return null;
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    try {
        return sessionRaw ? JSON.parse(sessionRaw) : null;
    } catch {
        return null;
    }
  }, []);

  const setSession = useCallback((user: SafeUser) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setUser(user);
  }, []);

  useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setLoading(false);
  }, [getSession]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean, error?: string }> => {
    const result = await loginAction({ email, password: pass });
    if (result.user) {
      setSession(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [setSession]);

  const signup = useCallback(async (data: SignupData): Promise<{ success: boolean, error?: string }> => {
    const result = await signupAction(data);
    if (result.user) {
      setSession(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [setSession]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
    }
    setUser(null);
    router.push('/login');
  }, [router]);
  
  const isAdmin = user?.isAdmin || false;

  const value = { user, setUser, isAdmin, loading, login, signup, logout, setSession, getSession };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
