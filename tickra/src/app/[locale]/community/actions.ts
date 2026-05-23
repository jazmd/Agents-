'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { isLocale } from '@/lib/i18n/config';
import { FORUM_CATEGORIES, slugify, type ForumCategory } from '@/lib/forum/types';

function ipFromHeaders(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? 'unknown';
}

export async function createThread(formData: FormData) {
  const locale = String(formData.get('locale') || 'en');
  if (!hasSupabaseEnv()) redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community`)}`);

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community/new`)}`);

  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const category = String(formData.get('category') || 'general') as ForumCategory;

  if (title.length < 4 || body.length < 8 || !FORUM_CATEGORIES.includes(category)) {
    redirect(`/${locale}/community/new?error=invalid`);
  }
  if (!isLocale(locale)) redirect(`/en/community`);

  const limit = rateLimit(`forum-thread:${user.id}:${ipFromHeaders()}`, {
    limit: 5,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    redirect(`/${locale}/community/new?error=rate_limit`);
  }

  const base = slugify(title) || 'thread';
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const { error, data } = await supabase
    .from('forum_threads')
    .insert({ user_id: user.id, category, locale, slug, title, body })
    .select('slug')
    .single();
  if (error) redirect(`/${locale}/community/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/${locale}/community`);
  redirect(`/${locale}/community/${data?.slug ?? slug}`);
}

export async function createReply(formData: FormData) {
  const locale = String(formData.get('locale') || 'en');
  const threadId = String(formData.get('thread_id') || '');
  const slug = String(formData.get('slug') || '');
  const body = String(formData.get('body') || '').trim();

  if (!hasSupabaseEnv()) redirect(`/${locale}/signin`);

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community/${slug}`)}`);

  if (body.length < 4 || !threadId) {
    redirect(`/${locale}/community/${slug}?error=invalid`);
  }

  const limit = rateLimit(`forum-reply:${user.id}:${ipFromHeaders()}`, {
    limit: 30,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    redirect(`/${locale}/community/${slug}?error=rate_limit`);
  }

  const { error } = await supabase
    .from('forum_replies')
    .insert({ thread_id: threadId, user_id: user.id, body });
  if (error) {
    redirect(`/${locale}/community/${slug}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/community/${slug}`);
  redirect(`/${locale}/community/${slug}#latest`);
}
