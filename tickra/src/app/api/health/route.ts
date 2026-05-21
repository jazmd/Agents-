import { NextResponse } from 'next/server';
import { hasSupabaseEnv } from '@/lib/supabase/server';
import { hasEmailEnv } from '@/lib/email/client';
import { turnstileEnabled } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      build_id: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      region: process.env.VERCEL_REGION ?? 'local',
      checks: {
        supabase: hasSupabaseEnv(),
        email: hasEmailEnv(),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY),
        turnstile: turnstileEnabled(),
        sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: { 'cache-control': 'no-store' },
    },
  );
}
