import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { isCronAuthorized } from '@/lib/cron/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_LIVES = 3;
const UNLIMITED = 999;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const admin = createSupabaseServiceClient();
    const now = new Date().toISOString();

    // Free users (plan = 'free') get 3 lives back.
    const { count: freeCount } = await admin
      .from('user_state')
      .update({ lives: FREE_LIVES, lives_refilled_at: now }, { count: 'exact' })
      .lt('lives', FREE_LIVES)
      .in(
        'user_id',
        // sub-select is not native; instead we run two updates joined by
        // a small RPC. For simplicity we update everyone below 3 here and
        // separately bump pro/lifetime users up to UNLIMITED below.
        (
          await admin.from('subscriptions').select('user_id').eq('plan', 'free')
        ).data?.map((r) => r.user_id) ?? [],
      );

    const { count: proCount } = await admin
      .from('user_state')
      .update({ lives: UNLIMITED, lives_refilled_at: now }, { count: 'exact' })
      .in(
        'user_id',
        (
          await admin
            .from('subscriptions')
            .select('user_id')
            .in('plan', ['pro', 'lifetime'])
        ).data?.map((r) => r.user_id) ?? [],
      );

    return NextResponse.json({
      ok: true,
      refilled_free: freeCount ?? 0,
      refilled_pro: proCount ?? 0,
      at: now,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'failed' },
      { status: 500 },
    );
  }
}
