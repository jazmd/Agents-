'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

type LearnerLevel = 'novice' | 'intermediate' | 'advanced';

export async function persistLevel(level: LearnerLevel, locale: 'en' | 'fr') {
  if (!hasSupabaseEnv()) return { ok: false, reason: 'env' };

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, reason: 'unauthenticated' };

  await supabase
    .from('profiles')
    .update({ level, updated_at: new Date().toISOString() })
    .eq('id', data.user.id);

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}
