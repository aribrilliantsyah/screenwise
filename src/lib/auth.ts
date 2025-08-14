
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User as PrismaUser } from '@prisma/client';

// Re-export User type from Prisma, but omit password hash for client-side safety.
export type User = Omit<PrismaUser, 'passwordHash'>;

export type SignupData = Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin'> & { password?: string };

const SESSION_KEY = 'screenwise_session';

export const localAuth = {
  
  signup: async (data: SignupData): Promise<User | null> => {
    const userExists = await prisma.user.findUnique({ where: { email: data.email }});
    if (userExists) {
      return null; // User already exists
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password || 'password', salt);

    const newUser = await prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            name: data.name,
            address: data.address,
            gender: data.gender,
            whatsapp: data.whatsapp,
            phone: data.phone,
            photo: data.photo,
            university: data.university,
            isAdmin: false, // Default user is not an admin
        }
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
    }
    return userWithoutPassword;
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({ where: { email }});
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...userWithoutPassword } = user;
       if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
       }
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

  updateUser: async (userId: number, data: Partial<User>): Promise<User | null> => {
      try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        if (typeof window !== 'undefined') {
            const sessionUser = localAuth.getSession();
            if(sessionUser && sessionUser.id === userId) {
                const updatedSessionUser = { ...sessionUser, ...userWithoutPassword};
                localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSessionUser));
            }
        }
        return userWithoutPassword;
      } catch (error) {
        console.error("Failed to update user:", error);
        return null;
      }
  },

  changePassword: async (userId: number, oldPassword: string, newPassword: string): Promise<boolean> => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return false;
      
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) return false;

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);
      
      await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash }
      });
      return true;
  },
  
  getAllUniversities: async (): Promise<string[]> => {
    const users = await prisma.user.findMany({
        where: { university: { not: null } },
        select: { university: true },
        distinct: ['university']
    });
    // @ts-ignore
    return users.map(u => u.university).filter(Boolean);
  }
};
