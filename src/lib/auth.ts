// WARNING: This is an insecure, demonstration-only authentication system.
// Do NOT use this in a production environment. Passwords are stored in plaintext.

export interface User {
  email: string;
}

const USERS_KEY = 'screenwise_users';
const SESSION_KEY = 'screenwise_session';

const getStoredUsers = (): (User & {password: string})[] => {
  if (typeof window === 'undefined') return [];
  const usersRaw = localStorage.getItem(USERS_KEY);
  return usersRaw ? JSON.parse(usersRaw) : [];
};

const setStoredUsers = (users: (User & {password: string})[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const localAuth = {
  createDefaultAdmin: () => {
    const users = getStoredUsers();
    const adminExists = users.some(u => u.email === 'admin@screenwise.com');
    if (!adminExists) {
      users.push({ email: 'admin@screenwise.com', password: 'rahasia' });
      setStoredUsers(users);
    }
  },
  
  signup: (email: string, password: string): User | null => {
    const users = getStoredUsers();
    const userExists = users.some(u => u.email === email);
    if (userExists) {
      return null; // Pengguna sudah ada
    }
    const newUser = { email, password };
    users.push(newUser);
    setStoredUsers(users);
    
    // Langsung login setelah daftar
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
    return { email };
  },

  login: (email: string, password: string): User | null => {
    const users = getStoredUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
      return { email };
    }
    return null;
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: (): User | null => {
    if (typeof window === 'undefined') return null;
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    return sessionRaw ? JSON.parse(sessionRaw) : null;
  }
};
