import 'server-only';
import { createSupabaseServerClient } from './server';
import type { Profile, Subscription, UserState, LessonProgress, DailyActivity } from './types';

export type DashboardData = {
  profile: Profile;
  subscription: Subscription;
  state: UserState;
  progress: LessonProgress[];
  activity: DailyActivity[];
};

export async function getAuthedUser() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [profileRes, subRes, stateRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('user_state').select('*').eq('user_id', user.id).single(),
    supabase.from('lesson_progress').select('*').eq('user_id', user.id),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  const activityRes = await supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('day', since.toISOString().slice(0, 10))
    .order('day', { ascending: true });

  if (!profileRes.data || !subRes.data || !stateRes.data) return null;

  return {
    profile: profileRes.data as Profile,
    subscription: subRes.data as Subscription,
    state: stateRes.data as UserState,
    progress: (progressRes.data ?? []) as LessonProgress[],
    activity: (activityRes.data ?? []) as DailyActivity[],
  };
}

export async function getSubscription(): Promise<Subscription | null> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();
  return (data ?? null) as Subscription | null;
}

export function isProEntitlement(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.plan === 'pro' || sub.plan === 'lifetime';
}
