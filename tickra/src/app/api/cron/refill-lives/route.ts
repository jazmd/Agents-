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

    const [{ data: freeRows }, { data: paidRows }] = await Promise.all([
      admin.from('subscriptions').select('user_id').eq('plan', 'free'),
      admin.from('subscriptions').select('user_id').in('plan', ['pro', 'lifetime']),
    ]);

    const freeIds = (freeRows ?? []).map((r) => r.user_id);
    const paidIds = (paidRows ?? []).map((r) => r.user_id);

    let refilledFree = 0;
    let refilledPaid = 0;

    if (freeIds.length > 0) {
      const { count } = await admin
        .from('user_state')
        .update({ lives: FREE_LIVES, lives_refilled_at: now }, { count: 'exact' })
        .lt('lives', FREE_LIVES)
        .in('user_id', freeIds);
      refilledFree = count ?? 0;
    }

    if (paidIds.length > 0) {
      const { count } = await admin
        .from('user_state')
        .update({ lives: UNLIMITED, lives_refilled_at: now }, { count: 'exact' })
        .in('user_id', paidIds);
      refilledPaid = count ?? 0;
    }

    return NextResponse.json({
      ok: true,
      refilled_free: refilledFree,
      refilled_paid: refilledPaid,
      at: now,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'failed' },
      { status: 500 },
    );
  }
}
