
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
  
  useEffect(() => {
    // This effect ensures that if the server-provided session changes (e.g., on re-login),
    // the client-side state is updated to match.
    setSession(initialSession);
  }, [initialSession]);

  // We don't need a loading state that blocks the UI here. 
  // The session is provided by the server initially, so there's no client-side fetching to wait for.
  // The `loading` property can be used by individual components if they trigger an async action.
  return (
    <SessionContext.Provider value={{ session, loading: !initialSession && typeof window !== 'undefined' }}>
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
