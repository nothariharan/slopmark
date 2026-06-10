create extension if not exists "pgcrypto";

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  provider text not null,
  cost_input double precision not null default 0,
  cost_output double precision not null default 0,
  elo integer not null default 1000,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  domain text not null,
  difficulty text default 'medium',
  source text not null default 'seed',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id),
  prompt_text text not null,
  model_a uuid not null references models(id),
  model_b uuid not null references models(id),
  winner text check (winner in ('a', 'b', 'tie')),
  vote_cast boolean not null default false,
  latency_a integer,
  latency_b integer,
  tokens_a integer,
  tokens_b integer,
  cost_a double precision,
  cost_b double precision,
  created_at timestamptz not null default now()
);

create table if not exists elo_history (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id),
  battle_id uuid references battles(id),
  elo integer not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_battles_created_at on battles(created_at desc);
create index if not exists idx_prompts_approved on prompts(approved);
