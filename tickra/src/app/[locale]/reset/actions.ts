'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function ipFromHeaders(): string {
  const h = headers();
  return (h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? 'unknown');
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const locale = String(formData.get('locale') || 'en');

  if (!email) redirect(`/${locale}/reset`);

  // 5 reset requests per IP per 10 minutes
  const ip = ipFromHeaders();
  const limit = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    redirect(`/${locale}/reset?error=rate_limit`);
  }

  if (hasSupabaseEnv()) {
    const supabase = createSupabaseServerClient();
    // Always respond with the same UX whether the email exists or not.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/${locale}/reset/confirm`,
    });
  }

  redirect(`/${locale}/reset?sent=1`);
}

export async function confirmPasswordReset(formData: FormData) {
  const password = String(formData.get('password') || '');
  const locale = String(formData.get('locale') || 'en');

  if (password.length < 8) redirect(`/${locale}/reset/confirm?error=invalid`);

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/${locale}/reset/confirm?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/signin?reset=1`);
}
