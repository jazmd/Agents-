import { NextResponse } from 'next/server';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { clearDemoSession } from '@/lib/demo/session';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  if (hasSupabaseEnv()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    clearDemoSession();
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url), { status: 303 });
}
