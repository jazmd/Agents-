import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    throw new Error('Supabase env vars are not configured');
  }
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Setting cookies in Server Components is a no-op; middleware handles
            // refresh, and Route Handlers / Server Actions can write freely.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}

export function createSupabaseServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase service-role env vars are not configured');
  }
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookies: { get: () => undefined, set: () => undefined, remove: () => undefined },
  });
}
