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

-- ----------------------------------------------------------------------------
-- 13. admin_users — operator allow-list (Phase 16)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role    text not null default 'admin' check (role in ('admin','readonly')),
  added_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy if not exists "admin read self" on public.admin_users for select using (auth.uid() = user_id);

-- Aggregated operator view. Reading it does not bypass per-table RLS, so we
-- expose only counts (no PII). Only admins are authorised at the application
-- layer via /admin route guards.
create or replace view public.admin_overview as
select
  (select count(*) from public.profiles)::integer as profiles_count,
  (select count(*) from public.subscriptions where plan in ('pro','lifetime'))::integer as paying_count,
  (select count(*) from public.subscriptions where plan = 'pro' and status = 'active')::integer as active_pro,
  (select count(*) from public.subscriptions where plan = 'lifetime')::integer as lifetime_count,
  (select count(*) from public.lesson_progress where status = 'done')::integer as lessons_completed,
  (select count(*) from public.daily_activity where day = current_date)::integer as active_today,
  (select coalesce(sum(minutes), 0) from public.daily_activity where day >= current_date - 6)::integer as minutes_last_7d;
grant select on public.admin_overview to authenticated;

-- ----------------------------------------------------------------------------
-- 14. referrals — invite codes + referred users (Phase 18)
-- ----------------------------------------------------------------------------
create table if not exists public.referral_codes (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  code       text not null unique,
  uses       integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
create policy if not exists "own referral read"  on public.referral_codes for select using (auth.uid() = user_id);
create policy if not exists "own referral write" on public.referral_codes for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public lookup is granted via a security-definer RPC below.

create table if not exists public.referral_redemptions (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id  uuid not null references public.profiles(id) on delete cascade,
  code        text not null,
  redeemed_at timestamptz not null default now(),
  unique (referee_id)
);
alter table public.referral_redemptions enable row level security;
create policy if not exists "own redemption read"
  on public.referral_redemptions for select
  using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- Public referral-code resolver (no PII exposure).
create or replace function public.referral_referrer_for(code_in text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.referral_codes where code = code_in limit 1;
$$;
grant execute on function public.referral_referrer_for(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 15. forum_threads + forum_replies (Phase 26)
-- ----------------------------------------------------------------------------
create table if not exists public.forum_threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category    text not null check (category in ('general','patterns','risk','brokers','strategies','beginners')),
  locale      text not null default 'en' check (locale in ('en','fr')),
  slug        text not null unique,
  title       text not null check (char_length(title) between 4 and 140),
  body        text not null check (char_length(body) between 8 and 4000),
  pinned      boolean not null default false,
  locked      boolean not null default false,
  reply_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists forum_threads_category_idx on public.forum_threads (category, created_at desc);
create index if not exists forum_threads_locale_idx   on public.forum_threads (locale, created_at desc);

create table if not exists public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.forum_threads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 4 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_thread_id_idx on public.forum_replies (thread_id, created_at);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

-- read: everyone authenticated; anon can read too (community-facing)
create policy if not exists "threads readable to all" on public.forum_threads for select using (true);
create policy if not exists "replies readable to all" on public.forum_replies for select using (true);

-- write: only the author, never on locked threads
create policy if not exists "own thread insert" on public.forum_threads for insert with check (auth.uid() = user_id);
create policy if not exists "own thread update" on public.forum_threads for update using (auth.uid() = user_id and locked = false) with check (auth.uid() = user_id);
create policy if not exists "own thread delete" on public.forum_threads for delete using (auth.uid() = user_id);

create policy if not exists "own reply insert" on public.forum_replies for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.forum_threads t where t.id = thread_id and t.locked = false)
);
create policy if not exists "own reply update" on public.forum_replies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "own reply delete" on public.forum_replies for delete using (auth.uid() = user_id);

-- Trigger: keep reply_count in sync on threads.
create or replace function public.bump_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.forum_threads set reply_count = reply_count + 1, updated_at = now() where id = new.thread_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.forum_threads set reply_count = greatest(reply_count - 1, 0) where id = old.thread_id;
    return old;
  end if;
  return null;
end;
$$;
drop trigger if exists on_forum_reply_insert on public.forum_replies;
create trigger on_forum_reply_insert after insert on public.forum_replies for each row execute function public.bump_reply_count();
drop trigger if exists on_forum_reply_delete on public.forum_replies;
create trigger on_forum_reply_delete after delete on public.forum_replies for each row execute function public.bump_reply_count();

-- ----------------------------------------------------------------------------
-- 16. paper_accounts + paper_positions (Phase 27)
-- ----------------------------------------------------------------------------
create table if not exists public.paper_accounts (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  starting_balance numeric(14,2) not null default 10000.00,
  balance          numeric(14,2) not null default 10000.00,
  realised_pnl     numeric(14,2) not null default 0.00,
  updated_at       timestamptz not null default now()
);
alter table public.paper_accounts enable row level security;
create policy if not exists "own paper account read"  on public.paper_accounts for select using (auth.uid() = user_id);
create policy if not exists "own paper account write" on public.paper_accounts for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.paper_positions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  symbol       text not null,
  side         text not null check (side in ('long','short')),
  qty          numeric(14,4) not null check (qty > 0),
  entry_price  numeric(14,4) not null check (entry_price > 0),
  exit_price   numeric(14,4),
  status       text not null default 'open' check (status in ('open','closed')),
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  pnl          numeric(14,2) not null default 0.00
);
create index if not exists paper_positions_user_status_idx on public.paper_positions (user_id, status, opened_at desc);

alter table public.paper_positions enable row level security;
create policy if not exists "own positions read"  on public.paper_positions for select using (auth.uid() = user_id);
create policy if not exists "own positions write" on public.paper_positions for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_profile_paper()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.paper_accounts (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_profile_paper_created on public.profiles;
create trigger on_profile_paper_created after insert on public.profiles for each row execute function public.handle_new_profile_paper();
