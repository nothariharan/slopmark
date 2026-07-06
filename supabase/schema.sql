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
  round(avg(cost_usd)::numeric, 6) as avg_cost_usd
from eval_runs
group by model_slug, domain;
