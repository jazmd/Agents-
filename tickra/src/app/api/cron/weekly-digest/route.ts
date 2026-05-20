import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { isCronAuthorized } from '@/lib/cron/auth';
import { sendWeeklyDigestEmail, emailReady } from '@/lib/email/send';
import { isLocale } from '@/lib/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ProfileRow = {
  id: string;
  full_name: string | null;
  locale: 'en' | 'fr' | string;
};

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!emailReady()) {
    return NextResponse.json({ ok: false, reason: 'email not configured' }, { status: 200 });
  }

  const admin = createSupabaseServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceISO = since.toISOString().slice(0, 10);

  // 1) fetch active learners with activity in the last 7 days
  const { data: activity } = await admin
    .from('daily_activity')
    .select('user_id, minutes')
    .gte('day', sinceISO);

  if (!activity || activity.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no activity' });
  }

  // aggregate minutes per user
  const minutesByUser = new Map<string, number>();
  for (const row of activity) {
    minutesByUser.set(row.user_id, (minutesByUser.get(row.user_id) ?? 0) + row.minutes);
  }
  const userIds = [...minutesByUser.keys()];

  // 2) fetch lessons completed in the same window
  const { data: progress } = await admin
    .from('lesson_progress')
    .select('user_id, lesson_slug, completed_at')
    .in('user_id', userIds)
    .gte('completed_at', since.toISOString())
    .eq('status', 'done');

  const lessonsByUser = new Map<string, number>();
  for (const row of progress ?? []) {
    lessonsByUser.set(row.user_id, (lessonsByUser.get(row.user_id) ?? 0) + 1);
  }

  // 3) fetch profile + email for those users
  const { data: states } = await admin
    .from('user_state')
    .select('user_id, streak_current')
    .in('user_id', userIds);
  const streakByUser = new Map<string, number>(
    (states ?? []).map((s) => [s.user_id, s.streak_current ?? 0]),
  );

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, locale')
    .in('id', userIds);
  const profilesById = new Map<string, ProfileRow>(
    ((profiles as ProfileRow[]) ?? []).map((p) => [p.id, p]),
  );

  // Vercel/Supabase doesn't expose auth.users via PostgREST. Use admin API.
  const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const u of usersList?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  let sent = 0;
  let failed = 0;
  for (const userId of userIds) {
    const email = emailById.get(userId);
    if (!email) continue;
    const profile = profilesById.get(userId);
    const locale = isLocale(profile?.locale) ? profile.locale : 'en';
    const res = await sendWeeklyDigestEmail({
      to: email,
      locale,
      fullName: profile?.full_name ?? null,
      minutes: minutesByUser.get(userId) ?? 0,
      lessonsDone: lessonsByUser.get(userId) ?? 0,
      streak: streakByUser.get(userId) ?? 0,
    });
    if (res.ok) sent++;
    else failed++;
  }

  return NextResponse.json({ ok: true, sent, failed, total: userIds.length });
}
