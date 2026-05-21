-- ============================================================================
-- Tickra — Supabase schema
-- Run this in the Supabase SQL editor in order. Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles — one row per authenticated user
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  locale        text not null default 'en' check (locale in ('en','fr')),
  level         text not null default 'novice' check (level in ('novice','intermediate','advanced')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. subscriptions — current entitlement, mirrored from Stripe via webhook
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  plan                 text not null check (plan in ('free','pro','lifetime')),
  stripe_customer_id   text,
  stripe_subscription_id text,
  status               text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at           timestamptz not null default now()
);

-- Seed every new profile with a free subscription row
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
after insert on public.profiles
for each row execute function public.handle_new_profile();

-- ----------------------------------------------------------------------------
-- 3. lesson_progress — one row per (user, lesson) attempt completion
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_slug  text not null,
  status       text not null default 'in_progress' check (status in ('in_progress','done')),
  score        integer,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

-- ----------------------------------------------------------------------------
-- 4. daily_activity — minutes practised per day; powers streak + activity chart
-- ----------------------------------------------------------------------------
create table if not exists public.daily_activity (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  day       date not null,
  minutes   integer not null default 0,
  xp_gained integer not null default 0,
  primary key (user_id, day)
);

-- ----------------------------------------------------------------------------
-- 5. user_state — denormalised running totals (read-fast)
-- ----------------------------------------------------------------------------
create table if not exists public.user_state (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  xp             integer not null default 0,
  level_index    integer not null default 1,
  streak_current integer not null default 0,
  streak_best    integer not null default 0,
  lives          integer not null default 3,
  lives_refilled_at timestamptz,
  freeze_tokens  integer not null default 1,
  last_active_day date,
  updated_at     timestamptz not null default now()
);

create or replace function public.handle_new_profile_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_state (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_state_created on public.profiles;
create trigger on_profile_state_created
after insert on public.profiles
for each row execute function public.handle_new_profile_state();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.daily_activity  enable row level security;
alter table public.user_state      enable row level security;

-- Helper: only the user can read/update their own rows
create policy if not exists "own profile read"
  on public.profiles for select using (auth.uid() = id);
create policy if not exists "own profile update"
  on public.profiles for update using (auth.uid() = id);

create policy if not exists "own subscription read"
  on public.subscriptions for select using (auth.uid() = user_id);

create policy if not exists "own progress read"
  on public.lesson_progress for select using (auth.uid() = user_id);
create policy if not exists "own progress write"
  on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own activity read"
  on public.daily_activity for select using (auth.uid() = user_id);
create policy if not exists "own activity write"
  on public.daily_activity for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own state read"
  on public.user_state for select using (auth.uid() = user_id);
create policy if not exists "own state write"
  on public.user_state for update using (auth.uid() = user_id);

-- subscriptions writes are restricted to service role only (webhook)
-- (no policy means no client access; service role bypasses RLS)

-- ----------------------------------------------------------------------------
-- 7. journal_entries — decision journal (Phase 13)
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  symbol      text,
  setup       text,
  thesis      text not null,
  invalidation text,
  target      text,
  emotion     text check (emotion in ('calm','fomo','revenge','tired','other') or emotion is null),
  outcome     text check (outcome in ('open','win','loss','breakeven') or outcome is null) default 'open',
  outcome_notes text,
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);
create index if not exists journal_entries_user_id_created_at_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;
create policy if not exists "own journal read"  on public.journal_entries for select using (auth.uid() = user_id);
create policy if not exists "own journal write" on public.journal_entries for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. lesson_reviews — SM-2 spaced repetition (Phase 13)
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_reviews (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_slug  text not null,
  ease         numeric(4,2) not null default 2.50, -- SM-2 ease factor (min 1.30)
  interval_days integer not null default 1,
  repetitions  integer not null default 0,
  next_due     date not null default current_date,
  last_grade   integer,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
create index if not exists lesson_reviews_user_id_next_due_idx
  on public.lesson_reviews (user_id, next_due);

alter table public.lesson_reviews enable row level security;
create policy if not exists "own reviews read"  on public.lesson_reviews for select using (auth.uid() = user_id);
create policy if not exists "own reviews write" on public.lesson_reviews for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 9. lesson_bookmarks — user-flagged lessons (Phase 14)
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_bookmarks (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_slug text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.lesson_bookmarks enable row level security;
create policy if not exists "own bookmarks read"  on public.lesson_bookmarks for select using (auth.uid() = user_id);
create policy if not exists "own bookmarks write" on public.lesson_bookmarks for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 10. lesson_notes — free-form per-lesson notes (Phase 14)
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_notes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_slug text not null,
  body        text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.lesson_notes enable row level security;
create policy if not exists "own notes read"  on public.lesson_notes for select using (auth.uid() = user_id);
create policy if not exists "own notes write" on public.lesson_notes for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 11. achievements — per-user unlocked badges (Phase 15)
-- ----------------------------------------------------------------------------
create table if not exists public.achievements (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  badge_id     text not null,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.achievements enable row level security;
create policy if not exists "own achievements read" on public.achievements for select using (auth.uid() = user_id);
create policy if not exists "own achievements write" on public.achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 12. leaderboard view — top 100 by XP (Phase 15)
-- ----------------------------------------------------------------------------
create or replace view public.leaderboard as
select
  s.user_id,
  coalesce(nullif(trim(p.full_name), ''), 'Anonymous') as display_name,
  s.xp,
  s.level_index,
  s.streak_current,
  s.streak_best
from public.user_state s
join public.profiles p on p.id = s.user_id
order by s.xp desc, s.streak_best desc
limit 100;
grant select on public.leaderboard to anon, authenticated;
