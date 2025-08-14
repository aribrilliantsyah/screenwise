
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { localAuth, type User, type SignupData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
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
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const loggedInUser = await localAuth.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    const newUser = await localAuth.signup(data);
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
  
  const isAdmin = user?.isAdmin || false;

  const value = { user, setUser, isAdmin, loading, login, signup, logout };

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
