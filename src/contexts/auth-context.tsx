"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { localAuth, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => boolean;
  signup: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Coba ambil sesi pengguna saat aplikasi dimuat
    const sessionUser = localAuth.getSession();
    if (sessionUser) {
      setUser(sessionUser);
    }
    // Buat pengguna admin default jika belum ada
    localAuth.createDefaultAdmin();
    setLoading(false);
  }, []);

  const login = (email: string, pass: string): boolean => {
    const loggedInUser = localAuth.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const signup = (email: string, pass: string): boolean => {
    const newUser = localAuth.signup(email, pass);
    if (newUser) {
      setUser(newUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localAuth.logout();
    setUser(null);
    router.push('/login');
  };
  
  const isAdmin = user?.email === 'admin@screenwise.com';

  const value = { user, isAdmin, loading, login, signup, logout };

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
