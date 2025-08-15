
'use server';

import bcrypt from 'bcryptjs';
import { User } from '@/lib/db';
import type { User as UserType } from '@/lib/db';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Op } from 'sequelize';


export type SignupData = Omit<UserType, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin' | 'passwordHash'> & { password?: string };
export type SafeUser = Omit<UserType, 'passwordHash'>;

export async function signup(data: SignupData): Promise<{ success: boolean; error?: string }> {
    try {
        const userExists = await User.findOne({ where: { email: data.email }});
        if (userExists) {
            return { success: false, error: "Email sudah terdaftar." };
        }

        if (!data.password) {
            return { success: false, error: "Kata sandi diperlukan." };
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        
        const newUser = await User.create({
            email: data.email,
            passwordHash, // Corrected from paswordHash
            name: data.name,
            address: data.address,
            gender: data.gender,
            whatsapp: data.whatsapp,
            phone: data.phone,
            photo: data.photo,
            university: data.university,
            isAdmin: false, 
        });
        
        const { passwordHash: _, ...userWithoutPassword } = newUser.get({ plain: true });
        await createSession(userWithoutPassword);
        return { success: true };
        
    } catch (e: any) {
        console.error("Signup error:", e);
        return { success: false, error: e.message || "Terjadi kesalahan saat pendaftaran." };
    }
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string, isAdmin?: boolean }> {
    console.log(`\n[LOGIN ATTEMPT]`);
    console.log(`Email: ${email}`);
    try {
        const user = await User.findOne({ where: { email }});
        
        if (!user || !user.passwordHash) {
            console.log(`[LOGIN FAILED] User not found or no password hash for email: ${email}`);
            return { success: false, error: "Email atau kata sandi salah." };
        }

        console.log(`[LOGIN] User found: ${user.email}`);
        console.log(`[LOGIN] Stored passwordHash: ${user.passwordHash}`);

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        console.log(`[LOGIN] Password match result: ${isMatch}`);

        if (!isMatch) {
            return { success: false, error: "Email atau kata sandi salah." };
        }
        
        const { passwordHash, ...userWithoutPassword } = user.get({ plain: true });
        await createSession(userWithoutPassword);

        console.log(`[LOGIN SUCCESS] Session created for ${user.email}`);
        return { success: true, isAdmin: user.isAdmin };

    } catch (e: any) {
        console.error("[LOGIN ERROR]", e);
        return { success: false, error: e.message || "Terjadi kesalahan saat login." };
    }
}

export async function logout() {
    await deleteSession();
    redirect('/login');
}


export async function updateUser(userId: number, data: Partial<Omit<SafeUser, 'id' | 'email' | 'isAdmin'>>): Promise<{ user: SafeUser | null, error?: string }> {
    try {
        await User.update(data, { where: { id: userId } });
        const updatedUser = await User.findByPk(userId);

        if (!updatedUser) {
            throw new Error("User not found after update.");
        }

        const { passwordHash, ...userWithoutPassword } = updatedUser.get({ plain: true });
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
        const user = await User.findByPk(userId);
        if (!user || !user.passwordHash) {
            return { success: false, error: "Pengguna tidak ditemukan atau data tidak valid." };
        }
        
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return { success: false, error: "Kata sandi lama Anda salah." };
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        await User.update({ passwordHash: newPasswordHash }, { where: { id: userId }});
        
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message || "Terjadi kesalahan saat mengubah kata sandi." };
    }
}

export async function getAllUniversities(): Promise<string[]> {
    try {
        const users = await User.findAll({
            attributes: ['university'],
            where: { university: { [Op.ne]: null } },
            group: ['university']
        });
        // @ts-ignore
        return users.map(u => u.university).filter(Boolean);
    } catch (e: any) {
        console.error("Failed to fetch universities:", e);
        return [];
    }
}
