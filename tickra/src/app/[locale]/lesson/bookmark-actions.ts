'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

export async function toggleBookmark(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const locale = String(formData.get('locale') || 'en');
  if (!slug || !hasSupabaseEnv()) return { ok: false };

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false };

  const { data: existing } = await supabase
    .from('lesson_bookmarks')
    .select('lesson_slug')
    .eq('user_id', user.id)
    .eq('lesson_slug', slug)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('lesson_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_slug', slug);
  } else {
    await supabase.from('lesson_bookmarks').insert({ user_id: user.id, lesson_slug: slug });
  }

  revalidatePath(`/${locale}/lesson/${slug}`);
  revalidatePath(`/${locale}/dashboard`);
  return { ok: true, saved: !existing };
}

export async function saveLessonNote(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const body = String(formData.get('body') || '');
  const locale = String(formData.get('locale') || 'en');
  if (!slug || !hasSupabaseEnv()) return { ok: false };

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false };

  await supabase.from('lesson_notes').upsert(
    {
      user_id: user.id,
      lesson_slug: slug,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_slug' },
  );

  revalidatePath(`/${locale}/lesson/${slug}`);
  return { ok: true };
}
