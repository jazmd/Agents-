'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

function makeCode(seed: string): string {
  // First 8 chars of a stable hash-ish derivation.
  const s = (seed + Math.random().toString(36)).replace(/[^a-z0-9]/gi, '').toUpperCase();
  return s.slice(0, 8);
}

export async function ensureReferralCode(locale: string) {
  if (!hasSupabaseEnv()) return { ok: false as const };
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false as const };

  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code, uses')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) return { ok: true as const, code: existing.code as string, uses: existing.uses as number };

  // Generate up to 5 candidates; retry on unique-constraint collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode(user.id + attempt);
    const { error } = await supabase
      .from('referral_codes')
      .insert({ user_id: user.id, code });
    if (!error) {
      revalidatePath(`/${locale}/refer`);
      return { ok: true as const, code, uses: 0 };
    }
  }
  return { ok: false as const };
}
