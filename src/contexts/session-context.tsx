
'use client';

import type { User } from '@prisma/client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SafeUser = Omit<User, 'passwordHash'>;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This effect ensures that if the server-provided session changes (e.g., on re-login),
    // the client-side state is updated to match.
    setSession(initialSession);
  }, [initialSession]);


  // We don't need a loading state that blocks the UI here. 
  // The session is provided by the server initially, so there's no client-side fetching to wait for.
  // The `loading` property can be used by individual components if they trigger an async action.
  return (
    <SessionContext.Provider value={{ session, loading: false }}>
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
