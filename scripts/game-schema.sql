create extension if not exists pgcrypto;

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists game_scores (
  id bigserial primary key,
  player_id uuid not null references game_players(id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_scores_player_created on game_scores(player_id, created_at);
create index if not exists idx_game_scores_created on game_scores(created_at);
