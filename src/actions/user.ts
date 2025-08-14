
'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User as PrismaUser } from '@prisma/client';

export type SignupData = Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin'> & { password?: string };
export type User = Omit<PrismaUser, 'passwordHash'>;

export async function signup(data: SignupData): Promise<{ user: User | null, error?: string }> {
    try {
        const userExists = await prisma.user.findUnique({ where: { email: data.email }});
        if (userExists) {
            return { user: null, error: "Email sudah terdaftar." };
        }

        if (!data.password) {
            return { user: null, error: "Kata sandi diperlukan." };
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
                isAdmin: false,
            }
        });

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return { user: userWithoutPassword };
    } catch (e: any) {
        return { user: null, error: e.message || "Terjadi kesalahan saat pendaftaran." };
    }
}

export async function login(email: string, password: string): Promise<{ user: User | null, error?: string }> {
    try {
        const user = await prisma.user.findUnique({ where: { email }});
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const { passwordHash, ...userWithoutPassword } = user;
            return { user: userWithoutPassword };
        }
        return { user: null, error: "Email atau kata sandi salah." };
    } catch (e: any) {
        return { user: null, error: e.message || "Terjadi kesalahan saat login." };
    }
}

export async function updateUser(userId: number, data: Partial<User>): Promise<{ user: User | null, error?: string }> {
    try {
        const { id, email, ...updateData } = data; // email and id cannot be updated here
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
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
    const users = await prisma.user.findMany({
        where: { university: { not: null } },
        select: { university: true },
        distinct: ['university']
    });
    // @ts-ignore
    return users.map(u => u.university).filter(Boolean);
}
