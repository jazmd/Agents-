import 'server-only';
import { hasSupabaseEnv, createSupabaseServerClient } from '@/lib/supabase/server';
import { readDemoSession, type DemoPlan } from './session';

export type Identity = {
  source: 'supabase' | 'demo';
  email: string;
  fullName: string;
  plan: DemoPlan;
  emailConfirmed: boolean;
};

/**
 * Single entry point used by every page that needs to know "who is signed in
 * and what can they access". Falls back to a cookie-based demo session when
 * Supabase env vars are unset — so the site is fully usable out of the box.
 */
export async function getIdentity(): Promise<Identity | null> {
  if (hasSupabaseEnv()) {
    try {
      const sb = createSupabaseServerClient();
      const { data } = await sb.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const { data: sub } = await sb
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();
      const plan = ((sub?.plan as DemoPlan | undefined) ?? 'free') as DemoPlan;
      const { data: profile } = await sb
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      return {
        source: 'supabase',
        email: user.email ?? '',
        fullName: (profile?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'You',
        plan,
        emailConfirmed: Boolean(user.email_confirmed_at),
      };
    } catch {
      return null;
    }
  }

  const demo = readDemoSession();
  if (!demo) return null;
  return {
    source: 'demo',
    email: demo.email,
    fullName: demo.fullName,
    plan: demo.plan,
    emailConfirmed: true,
  };
}

export function isPaidPlan(plan: DemoPlan): boolean {
  return plan === 'pro' || plan === 'lifetime';
}
