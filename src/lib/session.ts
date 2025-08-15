'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { SafeUser } from '@/actions/user';

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-for-development';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: { user: SafeUser; expires: Date }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 1 hari
    .sign(key);
}

export async function decrypt(input: string): Promise<{ user: SafeUser } | null> {
  if (!input) return null;
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as { user: SafeUser };
  } catch (error) {
    console.error('Failed to decrypt session:', error);
    return null;
  }
}

export async function createSession(user: SafeUser) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies(); // ⬅️ wajib await
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<{ user: SafeUser } | null> {
  const cookieStore = await cookies(); // ⬅️ wajib await
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  return decrypt(sessionCookie);
}

export async function deleteSession() {
  const cookieStore = await cookies(); // ⬅️ wajib await
  cookieStore.delete('session');
}
