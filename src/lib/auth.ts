
// WARNING: This is an insecure, demonstration-only authentication system.
// Do NOT use this in a production environment. Passwords are stored in plaintext.

export interface User {
  email: string;
  name: string;
  address: string;
  company?: string;
  gender: "Laki-laki" | "Perempuan";
  whatsapp: string;
  phone: string;
}

export type UpdateUserData = Omit<User, 'email' | 'gender'>;
export type SignupData = User & { password: string };
type StoredUser = SignupData;

const USERS_KEY = 'screenwise_users';
const SESSION_KEY = 'screenwise_session';

const getStoredUsers = (): StoredUser[] => {
  if (typeof window === 'undefined') return [];
  const usersRaw = localStorage.getItem(USERS_KEY);
  return usersRaw ? JSON.parse(usersRaw) : [];
};

const setStoredUsers = (users: StoredUser[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const localAuth = {
  createDefaultAdmin: () => {
    const users = getStoredUsers();
    const adminExists = users.some(u => u.email === 'admin@screenwise.com');
    if (!adminExists) {
      users.push({ 
        email: 'admin@screenwise.com', 
        password: 'rahasia',
        name: 'Admin',
        address: 'Kantor Pusat',
        gender: 'Laki-laki',
        whatsapp: '0',
        phone: '0'
      });
      setStoredUsers(users);
    }
  },
  
  signup: (data: SignupData): User | null => {
    const users = getStoredUsers();
    const userExists = users.some(u => u.email === data.email);
    if (userExists) {
      return null; // Pengguna sudah ada
    }
    
    users.push(data);
    setStoredUsers(users);
    
    // Langsung login setelah daftar
    const { password, ...userWithoutPassword } = data;
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },

  login: (email: string, password: string): User | null => {
    const users = getStoredUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
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
  },

  updateUser: (email: string, data: UpdateUserData): User | null => {
      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.email === email);
      if (userIndex === -1) {
          return null;
      }
      
      // Update data pengguna di array
      const currentUser = users[userIndex];
      users[userIndex] = { ...currentUser, ...data };
      setStoredUsers(users);

      // Update data sesi
      const sessionUser = localAuth.getSession();
      if(sessionUser && sessionUser.email === email) {
          const updatedSessionUser = { ...sessionUser, ...data};
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSessionUser));
          return updatedSessionUser;
      }
      
      const { password, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
  },

  changePassword: (email: string, oldPassword: string, newPassword: string): boolean => {
      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.email === email);
      if (userIndex === -1) {
          return false;
      }

      if(users[userIndex].password !== oldPassword) {
          return false; // Kata sandi lama tidak cocok
      }

      users[userIndex].password = newPassword;
      setStoredUsers(users);
      return true;
  }
};
