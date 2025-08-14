
'use server';

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export type SignupData = Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin' | 'passwordHash'> & { password?: string };
export type User = Omit<PrismaUser, 'passwordHash'>;

export async function signup(data: SignupData): Promise<{ error?: string }> {
    try {
        const userExists = await prisma.user.findUnique({ where: { email: data.email }});
        if (userExists) {
            return { error: "Email sudah terdaftar." };
        }

        if (!data.password) {
            return { error: "Kata sandi diperlukan." };
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

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
                isAdmin: false, // Explicitly set isAdmin to false for signup
            }
        });

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        await createSession(userWithoutPassword);
        
    } catch (e: any) {
        console.error("Signup error:", e);
        return { error: e.message || "Terjadi kesalahan saat pendaftaran." };
    }
    redirect('/dashboard');
}

export async function login(email: string, password: string): Promise<{ error?: string }> {
    try {
        const user = await prisma.user.findUnique({ where: { email }});
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const { passwordHash, ...userWithoutPassword } = user;
            await createSession(userWithoutPassword);
        } else {
             return { error: "Email atau kata sandi salah." };
        }
    } catch (e: any) {
        console.error("Login error:", e);
        return { error: e.message || "Terjadi kesalahan saat login." };
    }
    const session = await getSession();
    if(session?.user.isAdmin){
        redirect('/admin');
    } else {
        redirect('/dashboard');
    }
}

export async function logout() {
    await deleteSession();
    redirect('/login');
}


export async function updateUser(userId: number, data: Partial<Omit<User, 'id' | 'email' | 'isAdmin'>>): Promise<{ user: User | null, error?: string }> {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: data,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        // Re-create session with updated user data
        await createSession(userWithoutPassword);
        return { user: userWithoutPassword };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { user: null, error: "Gagal memperbarui pengguna." };
    }
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return { success: false, error: "Pengguna tidak ditemukan." };
        }
        
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return { success: false, error: "Kata sandi lama Anda salah." };
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message || "Terjadi kesalahan saat mengubah kata sandi." };
    }
}

export async function getAllUniversities(): Promise<string[]> {
    try {
        const users = await prisma.user.findMany({
            where: { university: { not: null } },
            select: { university: true },
            distinct: ['university']
        });
        // @ts-ignore
        return users.map(u => u.university).filter(Boolean);
    } catch (e: any) {
        console.error("Failed to fetch universities:", e);
        return [];
    }
}
