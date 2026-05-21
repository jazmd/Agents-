import 'server-only';
import { createSupabaseServerClient, hasSupabaseEnv } from './supabase/server';

/**
 * Returns true when the visitor is an authenticated admin.
 * Two sources are accepted:
 *  - row in public.admin_users with role in ('admin','readonly')
 *  - email present in the ADMIN_EMAILS env var (comma-separated bootstrap)
 */
export async function isAdmin(): Promise<{ admin: boolean; email: string | null }> {
  if (!hasSupabaseEnv()) return { admin: false, email: null };

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { admin: false, email: null };

  const bootstrap = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && bootstrap.includes(user.email.toLowerCase())) {
    return { admin: true, email: user.email };
  }

  const { data: row } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return { admin: Boolean(row), email: user.email ?? null };
}
