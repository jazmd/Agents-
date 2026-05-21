import { NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { rateLimit, ipFrom } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limit = rateLimit(`export:${ipFrom(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const [profile, subscription, state, progress, activity] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('user_state').select('*').eq('user_id', user.id).single(),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id),
    supabase.from('daily_activity').select('*').eq('user_id', user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    profile: profile.data ?? null,
    subscription: subscription.data ?? null,
    state: state.data ?? null,
    lesson_progress: progress.data ?? [],
    daily_activity: activity.data ?? [],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="tickra-export-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  });
}
