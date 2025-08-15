'use server';

import bcrypt from 'bcryptjs';
import { User } from '@/lib/db';
import type { User as UserType } from '@/lib/db';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { literal, Op, WhereOptions } from 'sequelize';

// Types
export type SignupData = Omit<UserType, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin' | 'passwordHash'> & { 
  password?: string;
};

export type SafeUser = Omit<UserType, 'passwordHash'>;

export type AuthResult = {
  success: boolean;
  error?: string;
};

export type LoginResult = AuthResult & {
  isAdmin?: boolean;
};

export type UpdateUserResult = {
  user: SafeUser | null;
  error?: string;
};

// Constants
const SALT_ROUNDS = 10;
const ERROR_MESSAGES = {
  EMAIL_EXISTS: "Email sudah terdaftar.",
  PASSWORD_REQUIRED: "Kata sandi diperlukan.",
  INVALID_CREDENTIALS: "Email atau kata sandi salah.",
  USER_NOT_FOUND: "Pengguna tidak ditemukan atau data tidak valid.",
  WRONG_OLD_PASSWORD: "Kata sandi lama Anda salah.",
  SIGNUP_ERROR: "Terjadi kesalahan saat pendaftaran.",
  LOGIN_ERROR: "Terjadi kesalahan saat login.",
  UPDATE_ERROR: "Gagal memperbarui pengguna.",
  PASSWORD_CHANGE_ERROR: "Terjadi kesalahan saat mengubah kata sandi.",
  USER_NOT_FOUND_AFTER_UPDATE: "User not found after update.",
} as const;

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const excludePassword = (user: any): SafeUser => {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword as SafeUser;
};

const logLoginAttempt = (email: string, success: boolean, message?: string): void => {
  console.log(`\n[LOGIN ${success ? 'SUCCESS' : 'FAILED'}]`);
  console.log(`Email: ${email}`);
  if (message) {
    console.log(`Message: ${message}`);
  }
};

// Main functions
export async function signup(data: SignupData): Promise<AuthResult> {
  try {
    // Check if user already exists
    let existingUser: any = await User.findOne({ 
      where: { email: data.email } 
    });
    
    if (existingUser?.dataValues) {
      return { 
        success: false, 
        error: ERROR_MESSAGES.EMAIL_EXISTS 
      };
    }

    // Validate password
    if (!data.password) {
      return { 
        success: false, 
        error: ERROR_MESSAGES.PASSWORD_REQUIRED 
      };
    }

    // Hash password and create user
    const passwordHash = await hashPassword(data.password);
    
    let newUser: any = await User.create({
      email: data.email,
      passwordHash: passwordHash, // Corrected field name
      name: data.name,
      address: data.address,
      gender: data.gender,
      whatsapp: data.whatsapp,
      phone: data.phone,
      photo: data.photo,
      university: data.university,
      isAdmin: false,
    });
    
    newUser = newUser?.dataValues;
    
    // Create session with safe user data
    const safeUser = excludePassword(newUser);
    await createSession(safeUser);

    return { success: true };
    
  } catch (error) {
    console.error("Signup error:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.SIGNUP_ERROR;
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  console.log(`\n[LOGIN ATTEMPT] Email: ${email}`);
  
  try {
    // Find user by email
    let user: any = await User.findOne({ 
      where: { email } 
    });

    user = user?.dataValues;
    
    if (!user || !user.passwordHash) {
      logLoginAttempt(email, false, "User not found or no password hash");
      return { 
        success: false, 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      };
    }

    console.log(`[LOGIN] User found: ${user.email}`);

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    console.log(`[LOGIN] Password match result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      logLoginAttempt(email, false, "Invalid password");
      return { 
        success: false, 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      };
    }
    
    // Create session with safe user data
    const safeUser = excludePassword(user);
    await createSession(safeUser);

    logLoginAttempt(email, true, `Session created for ${user.email}`);
    
    return { 
      success: true, 
      isAdmin: user.isAdmin 
    };

  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.LOGIN_ERROR;
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}

export async function updateUser(
  userId: number, 
  data: Partial<Omit<SafeUser, 'id' | 'email' | 'isAdmin'>>
): Promise<UpdateUserResult> {
  try {
    // Update user data
    await User.update(data, { 
      where: { id: userId } 
    });
    
    // Fetch updated user
    let updatedUser: any = await User.findByPk(userId);
    updatedUser = updatedUser?.dataValues;

    if (!updatedUser) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND_AFTER_UPDATE);
    }

    // Create session with updated safe user data
    const safeUser = excludePassword(updatedUser);
    await createSession(safeUser);
    
    return { user: safeUser };
    
  } catch (error) {
    console.error("Failed to update user:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.UPDATE_ERROR;
    
    return { 
      user: null, 
      error: errorMessage 
    };
  }
}

export async function changePassword(
  userId: number, 
  oldPassword: string, 
  newPassword: string
): Promise<AuthResult> {
  try {
    // Find user
    let user: any = await User.findByPk(userId);
    user = user?.dataValues;
    
    if (!user || !user.passwordHash) {
      return { 
        success: false, 
        error: ERROR_MESSAGES.USER_NOT_FOUND 
      };
    }
    
    // Verify old password
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    
    if (!isOldPasswordValid) {
      return { 
        success: false, 
        error: ERROR_MESSAGES.WRONG_OLD_PASSWORD 
      };
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    
    await User.update(
      { passwordHash: newPasswordHash }, 
      { where: { id: userId } }
    );
    
    return { success: true };
    
  } catch (error) {
    console.error("Password change error:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : ERROR_MESSAGES.PASSWORD_CHANGE_ERROR;
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export async function getAllUniversities(): Promise<string[]> {
  try {
    const whereCondition: WhereOptions = {
        [Op.and]: [
            { university: { [Op.ne]: null } },
            { university: { [Op.ne]: '' } },
            literal("TRIM(university) != ''")
        ]
    };

    let users: any[] = await User.findAll({
      attributes: ['university'],
      where: whereCondition,
      group: ['university'],
      raw: true, // Use raw: true to get plain objects
    });
    
    return users
      .map((user: any) => user?.university)
      .filter((university: string) => Boolean(university));
      
  } catch (error) {
    console.error("Failed to fetch universities:", error);
    return [];
  }
}
