'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const XP_PER_LESSON = 60;
const XP_PER_LEVEL = 1000;

export async function completeLesson(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const score = Number(formData.get('score') || 0);
  const locale = String(formData.get('locale') || 'en');
  const minutes = Number(formData.get('minutes') || 8);

  if (!slug) return { ok: false, error: 'missing slug' };

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: 'unauthenticated' };

  const today = new Date().toISOString().slice(0, 10);

  // 1) mark lesson done
  await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_slug: slug,
      status: 'done',
      score,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_slug' },
  );

  // 2) record daily activity (additive)
  const { data: existingActivity } = await supabase
    .from('daily_activity')
    .select('minutes, xp_gained')
    .eq('user_id', user.id)
    .eq('day', today)
    .maybeSingle();

  await supabase.from('daily_activity').upsert(
    {
      user_id: user.id,
      day: today,
      minutes: (existingActivity?.minutes ?? 0) + minutes,
      xp_gained: (existingActivity?.xp_gained ?? 0) + XP_PER_LESSON,
    },
    { onConflict: 'user_id,day' },
  );

  // 3) update streak + xp in user_state
  const { data: state } = await supabase
    .from('user_state')
    .select('*')
    .eq('user_id', user.id)
    .single();

  let streak = state?.streak_current ?? 0;
  const last = state?.last_active_day ?? null;
  if (last !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    streak = last === y ? streak + 1 : 1;
  }
  const best = Math.max(streak, state?.streak_best ?? 0);
  const xp = (state?.xp ?? 0) + XP_PER_LESSON;
  const levelIndex = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);

  await supabase
    .from('user_state')
    .update({
      xp,
      level_index: levelIndex,
      streak_current: streak,
      streak_best: best,
      last_active_day: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  // 4) seed a spaced-repetition review (idempotent: skip if already scheduled)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await supabase.from('lesson_reviews').upsert(
    {
      user_id: user.id,
      lesson_slug: slug,
      next_due: tomorrow.toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_slug', ignoreDuplicates: true },
  );

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/lesson/${slug}`);
  revalidatePath(`/${locale}/reviews`);

  return { ok: true, xpAwarded: XP_PER_LESSON, streak, level: levelIndex };
}

export async function gradeReview(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const grade = Number(formData.get('grade') || 0);
  const locale = String(formData.get('locale') || 'en');
  if (!slug) return { ok: false, error: 'missing slug' };

  const { nextSm2, DEFAULT_SM2 } = await import('@/lib/sm2');
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: 'unauthenticated' };

  const { data: existing } = await supabase
    .from('lesson_reviews')
    .select('ease, interval_days, repetitions')
    .eq('user_id', user.id)
    .eq('lesson_slug', slug)
    .maybeSingle();

  const prev = existing
    ? {
        ease: Number(existing.ease ?? DEFAULT_SM2.ease),
        intervalDays: Number(existing.interval_days ?? DEFAULT_SM2.intervalDays),
        repetitions: Number(existing.repetitions ?? DEFAULT_SM2.repetitions),
      }
    : DEFAULT_SM2;

  const next = nextSm2(prev, grade);

  await supabase.from('lesson_reviews').upsert(
    {
      user_id: user.id,
      lesson_slug: slug,
      ease: next.ease,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      next_due: next.nextDueAt.toISOString().slice(0, 10),
      last_grade: grade,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_slug' },
  );

  revalidatePath(`/${locale}/reviews`);
  return { ok: true, intervalDays: next.intervalDays, nextDue: next.nextDueAt.toISOString().slice(0, 10) };
}

export async function loseLife() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false };

  const { data: state } = await supabase
    .from('user_state')
    .select('lives')
    .eq('user_id', userData.user.id)
    .single();

  const next = Math.max(0, (state?.lives ?? 3) - 1);
  await supabase.from('user_state').update({ lives: next }).eq('user_id', userData.user.id);
  return { ok: true, lives: next };
}
