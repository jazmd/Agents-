import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(`/${locale}`, request.url), { status: 303 });
}
