-- schema_v2_addendum.sql
-- Supabase/Postgres migration for schema v2 addendum

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists team_assignments_history (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id),
  team_name text not null,
  effective_from date not null
);

insert into team_assignments_history (owner_id, team_name, effective_from)
select id, 'C', '2026-09-28' from profiles where name = '진한'
on conflict do nothing;

create table if not exists leave_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  name text not null,
  hours_credit numeric not null
);

insert into leave_codes (code, name, hours_credit) values
  ('J', 'J코드(근무일 연차사용)', 12),
  ('GENERAL', '일반연차', 8)
on conflict do nothing;

alter table events add column if not exists leave_code_id uuid references leave_codes(id);

create table if not exists salary_config (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id),
  base_pay numeric,
  meal_allowance numeric,
  self_design_support numeric,
  job_environment_allowance numeric,
  shift_allowance_rate numeric default 0.08,
  performance_pay_rate numeric default 0.3333,
  management_bonus_rate numeric default 1.0,
  night_hourly_rate numeric,
  effective_from date not null
);

alter table accounts add column if not exists current_balance numeric default 0;

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id),
  entry_date date not null,
  entry_type text not null,
  title text,
  content text,
  equipment_tag text,
  image_paths jsonb default '[]',
  is_important boolean default false,
  search_vector tsvector generated always as (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))) stored,
  created_at timestamptz default now()
);

create index if not exists journal_search_idx on journal_entries using gin(search_vector);
