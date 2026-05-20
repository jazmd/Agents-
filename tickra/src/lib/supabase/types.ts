export type Plan = 'free' | 'pro' | 'lifetime';
export type LearnerLevel = 'novice' | 'intermediate' | 'advanced';

export type Profile = {
  id: string;
  full_name: string | null;
  locale: 'en' | 'fr';
  level: LearnerLevel;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  user_id: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

export type UserState = {
  user_id: string;
  xp: number;
  level_index: number;
  streak_current: number;
  streak_best: number;
  lives: number;
  lives_refilled_at: string | null;
  freeze_tokens: number;
  last_active_day: string | null;
  updated_at: string;
};

export type LessonProgress = {
  user_id: string;
  lesson_slug: string;
  status: 'in_progress' | 'done';
  score: number | null;
  completed_at: string | null;
  updated_at: string;
};

export type DailyActivity = {
  user_id: string;
  day: string;
  minutes: number;
  xp_gained: number;
};
