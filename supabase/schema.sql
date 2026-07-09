create table if not exists tasks (
  id text primary key,
  domain text not null,
  prompt text not null,
  verifier jsonb not null,
  source text not null default 'seed',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id),
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists user_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  game_type text not null,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, game_type)
);

create table if not exists custom_suites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name text not null,
  description text,
  tasks jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references tasks(id),
  user_id uuid references users(id),
  domain text not null,
  model_slug text not null,
  output text not null,
  passed boolean not null,
  score numeric not null,
  details text not null,
  latency_ms integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric not null default 0,
  harness_version text not null default 'v0',
  task_pool_version text not null default 'unknown',
  created_at timestamptz not null default now()
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references eval_runs(id),
  task_id text not null,
  domain text not null,
  model_slug text not null,
  prompt text not null,
  output text not null,
  auto_score numeric default 0,
  vote_sum numeric default 0,
  vote_count integer default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists eval_runs_domain_model_idx on eval_runs (domain, model_slug);
create index if not exists eval_runs_created_idx on eval_runs (created_at desc);
create index if not exists eval_runs_user_idx on eval_runs (user_id);

create or replace view model_leaderboard as
select
  model_slug,
  domain,
  count(*)::int as runs,
  round(avg(case when passed then 1 else 0 end)::numeric, 4) as pass_rate,
  round(avg(score)::numeric, 2) as avg_score,
  round(avg(latency_ms)::numeric, 0) as avg_latency_ms,
  round(avg(cost_usd)::numeric, 6) as avg_cost_usd,
  round(avg(output_tokens)::numeric, 0) as avg_output_tokens
from eval_runs
group by model_slug, domain;

-- benchmark challenges (persisted sessions)
create table if not exists challenges (
  slug text primary key,
  title text not null,
  subtitle text not null,
  description text not null,
  harness_mode text not null default 'zero_context',
  manifest_json jsonb not null,
  status text not null default 'complete',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists challenge_runs (
  id uuid primary key default gen_random_uuid(),
  challenge_slug text not null references challenges(slug) on delete cascade,
  task_id text not null,
  task_label text not null,
  task_category text not null,
  task_prompt text not null,
  model_slug text not null,
  model_label text not null,
  output text not null,
  passed boolean not null,
  score numeric not null,
  details text not null,
  latency_ms integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists challenge_runs_slug_idx on challenge_runs (challenge_slug);
create index if not exists challenge_runs_model_idx on challenge_runs (challenge_slug, model_slug);

-- row level security
alter table eval_runs enable row level security;
alter table custom_suites enable row level security;
alter table user_scores enable row level security;
alter table review_queue enable row level security;

-- public read on aggregated leaderboard view is via service role api routes
create policy "users read own runs"
  on eval_runs for select
  using (auth.uid() = user_id);

create policy "users insert own runs"
  on eval_runs for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "users manage own suites"
  on custom_suites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "public read public suites"
  on custom_suites for select
  using (is_public = true or auth.uid() = user_id);

create policy "users read own scores"
  on user_scores for select
  using (auth.uid() = user_id);

create policy "service role full access eval_runs"
  on eval_runs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
