import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${url.origin}/en/signin?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${url.origin}${next.startsWith('/') ? next : '/' + next}`);
}
