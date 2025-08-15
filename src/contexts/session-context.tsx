
'use client';

import type { User as UserType } from '@/lib/db'; // Use Sequelize User type
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// This SafeUser should come from the user actions, but to avoid circular deps we define it here.
// It's the User model without the password hash.
type SafeUser = Omit<UserType, 'passwordHash'>;
export type Session = { user: SafeUser } | null;

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
