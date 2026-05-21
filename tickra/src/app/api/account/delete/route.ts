import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { rateLimit, ipFrom } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 3 deletion attempts per IP per hour — covers retries, blocks brute attempts.
  const limit = rateLimit(`delete:${ipFrom(req)}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  if (user.email?.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return NextResponse.json({ error: 'email_mismatch' }, { status: 403 });
  }

  const admin = createSupabaseServiceClient();
  // Profile cascade (ON DELETE CASCADE on profiles) wipes all related tables.
  // Then nuke the auth user itself with the service role.
  const { error: profileErr } = await admin.from('profiles').delete().eq('id', user.id);
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
