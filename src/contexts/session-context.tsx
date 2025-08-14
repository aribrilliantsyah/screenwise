
'use client';

import type { User } from '@prisma/client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SafeUser = Omit<User, 'passwordHash'>;
type Session = { user: SafeUser } | null;

interface SessionContextType {
  session: Session;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  session: Session;
}

export function SessionProvider({ children, session: initialSession }: SessionProviderProps) {
  const [session, setSession] = useState<Session>(initialSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(initialSession);
    setLoading(false);
  }, [initialSession]);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
