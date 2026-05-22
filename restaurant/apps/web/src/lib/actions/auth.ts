'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from '../auth';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().min(4).max(30).optional().or(z.literal('')),
});

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone') || '',
  });
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }
  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: 'Diese E-Mail ist bereits registriert.' };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'CUSTOMER' | 'ADMIN',
  });
  await setSessionCookie(token);
  return { ok: true };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { ok: false, error: 'Invalid input' };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { ok: false, error: 'Falsche E-Mail oder Passwort.' };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Falsche E-Mail oder Passwort.' };

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'CUSTOMER' | 'ADMIN',
  });
  await setSessionCookie(token);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}
