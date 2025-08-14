// This file is new
'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-key-for-development';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: { user: SafeUser; expires: Date }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Set expiration time to 1 day
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
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours
  const session = await encrypt({ user, expires });

  cookies().set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function getSession(): Promise<{ user: SafeUser } | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  return decrypt(sessionCookie);
}

export async function deleteSession() {
  cookies().delete('session');
}