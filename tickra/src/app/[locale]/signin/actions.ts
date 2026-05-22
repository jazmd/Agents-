'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/send';
import { isLocale } from '@/lib/i18n/config';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { writeDemoSession, clearDemoSession } from '@/lib/demo/session';

function ipFromHeaders(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? 'unknown';
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function deriveName(email: string): string {
  const local = email.split('@')[0] ?? 'You';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const locale = String(formData.get('locale') || 'en');
  const next = String(formData.get('next') || `/${locale}/dashboard`);

  if (!email || !password) {
    redirect(`/${locale}/signin?error=missing`);
  }

  const limit = rateLimit(`signin:${ipFromHeaders()}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    redirect(`/${locale}/signin?error=${encodeURIComponent('Too many attempts. Wait a few minutes.')}`);
  }

  // ── Demo fallback when Supabase is not configured ───────────────────────
  if (!hasSupabaseEnv()) {
    writeDemoSession({
      email,
      fullName: deriveName(email),
      plan: 'free',
      createdAt: new Date().toISOString(),
    });
    revalidatePath(`/${locale}`, 'layout');
    redirect(next);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/${locale}/signin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}`, 'layout');
  redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('full_name') || '').trim();
  const locale = String(formData.get('locale') || 'en');

  if (!email || password.length < 8) {
    redirect(`/${locale}/signup?error=invalid`);
  }

  const limit = rateLimit(`signup:${ipFromHeaders()}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    redirect(`/${locale}/signup?error=${encodeURIComponent('Too many attempts. Try again later.')}`);
  }

  const captcha = String(formData.get('cf-turnstile-response') || '');
  const ok = await verifyTurnstile(captcha, ipFromHeaders());
  if (!ok) {
    redirect(`/${locale}/signup?error=${encodeURIComponent('Captcha failed. Please retry.')}`);
  }

  // ── Demo fallback when Supabase is not configured ───────────────────────
  if (!hasSupabaseEnv()) {
    writeDemoSession({
      email,
      fullName: fullName || deriveName(email),
      plan: 'free',
      createdAt: new Date().toISOString(),
    });
    revalidatePath(`/${locale}`, 'layout');
    redirect(`/${locale}/dashboard`);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/${locale}/dashboard`,
      data: { full_name: fullName, locale },
    },
  });

  if (error) {
    redirect(`/${locale}/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Best-effort welcome email — never blocks the signup flow.
  if (isLocale(locale)) {
    try {
      await sendWelcomeEmail({ to: email, locale, fullName });
    } catch {
      // silent — email is non-critical to signup
    }
  }

  redirect(`/${locale}/signup?check=email`);
}

export async function signInWithProvider(provider: 'google' | 'apple', locale: string, next?: string) {
  if (!hasSupabaseEnv()) {
    // Demo mode — fake an OAuth round-trip by signing in directly.
    writeDemoSession({
      email: `${provider}-user@tickra.demo`,
      fullName: provider === 'google' ? 'Google User' : 'Apple User',
      plan: 'free',
      createdAt: new Date().toISOString(),
    });
    redirect(next || `/${locale}/dashboard`);
  }

  const supabase = createSupabaseServerClient();
  const target = next || `/${locale}/dashboard`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(target)}`,
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error || !data.url) {
    redirect(`/${locale}/signin?error=${encodeURIComponent(error?.message || 'oauth_failed')}`);
  }
  redirect(data.url);
}

export async function signOut(locale: string) {
  if (!hasSupabaseEnv()) {
    clearDemoSession();
    revalidatePath(`/${locale}`, 'layout');
    redirect(`/${locale}`);
  }
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath(`/${locale}`, 'layout');
  redirect(`/${locale}`);
}
