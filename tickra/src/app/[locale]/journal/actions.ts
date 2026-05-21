'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

type Emotion = 'calm' | 'fomo' | 'revenge' | 'tired' | 'other';
const EMOTIONS: Emotion[] = ['calm', 'fomo', 'revenge', 'tired', 'other'];

export async function createJournalEntry(formData: FormData) {
  const locale = String(formData.get('locale') || 'en');
  if (!hasSupabaseEnv()) redirect(`/${locale}/signin`);

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/journal`)}`);

  const thesis = String(formData.get('thesis') || '').trim();
  if (!thesis) redirect(`/${locale}/journal?error=missing_thesis`);

  const emotionRaw = String(formData.get('emotion') || '');
  const emotion = (EMOTIONS as string[]).includes(emotionRaw) ? (emotionRaw as Emotion) : null;

  await supabase.from('journal_entries').insert({
    user_id: user.id,
    symbol: (String(formData.get('symbol') || '').trim() || null) as string | null,
    setup: (String(formData.get('setup') || '').trim() || null) as string | null,
    thesis,
    invalidation: (String(formData.get('invalidation') || '').trim() || null) as string | null,
    target: (String(formData.get('target') || '').trim() || null) as string | null,
    emotion,
    outcome: 'open',
  });

  revalidatePath(`/${locale}/journal`);
  redirect(`/${locale}/journal`);
}

export async function closeJournalEntry(formData: FormData) {
  const id = String(formData.get('id') || '');
  const outcome = String(formData.get('outcome') || 'open');
  const locale = String(formData.get('locale') || 'en');
  if (!id || !hasSupabaseEnv()) return;

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  await supabase
    .from('journal_entries')
    .update({
      outcome,
      closed_at: outcome === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userData.user.id);

  revalidatePath(`/${locale}/journal`);
}
