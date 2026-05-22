-- Kestrel MVP Schema (greenfield)
-- Standalone PostgreSQL DDL for a fresh database (e.g. GCP Cloud SQL).
-- Does not assume existing tables or prior migrations.
--
-- Usage (example):
--   psql "host=... user=postgres dbname=kestrel" -f 002_mvp_schema.sql
--
-- Requires: PostgreSQL 14+ (uses EXECUTE FUNCTION for triggers).

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- Clean slate (safe on empty DB; allows re-running during setup)
-- ============================================================================

drop table if exists public.scan_results cascade;
drop table if exists public.scans cascade;
drop table if exists public.repositories cascade;
drop table if exists public.users cascade;

drop function if exists public.enforce_scan_limit() cascade;
drop function if exists public.update_updated_at() cascade;

-- ============================================================================
-- Helper: auto-update updated_at timestamp
-- ============================================================================

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- Table: users
-- ============================================================================

create table public.users (
  id              uuid        primary key default gen_random_uuid(),
  github_id       bigint      not null unique,
  github_username text        not null,
  email           text,
  avatar_url      text,
  scan_limit      integer     not null default 3 check (scan_limit > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: repositories
-- ============================================================================

create table public.repositories (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  github_repo_id  bigint      not null,
  name            text        not null,
  full_name       text        not null,
  url             text        not null,
  default_branch  text        not null default 'main',
  is_private      boolean     not null default false,
  language        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, github_repo_id)
);

create index idx_repositories_user_id on public.repositories(user_id);

create trigger trg_repositories_updated_at
  before update on public.repositories
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: scans
-- ============================================================================

create table public.scans (
  id             uuid        primary key default gen_random_uuid(),
  repository_id  uuid        not null references public.repositories(id) on delete cascade,
  user_id        uuid        not null references public.users(id) on delete cascade,
  status         text        not null default 'pending'
                             check (status in ('pending', 'running', 'completed', 'failed')),
  tools_run      text[]      not null default '{}',
  branch         text,
  finding_count  integer     not null default 0,
  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    integer,
  error_message  text,
  ai_summary     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_scans_repository_id on public.scans(repository_id);
create index idx_scans_user_id on public.scans(user_id);
create index idx_scans_status on public.scans(status);

create trigger trg_scans_updated_at
  before update on public.scans
  for each row execute function public.update_updated_at();

-- Enforce per-user scan limit on insert (matches app DEFAULT_SCAN_LIMIT = 3)
create or replace function public.enforce_scan_limit()
returns trigger as $$
declare
  limit_count integer;
  scan_count  integer;
begin
  select coalesce(scan_limit, 3) into limit_count
  from public.users
  where id = new.user_id;

  select count(*) into scan_count
  from public.scans
  where user_id = new.user_id;

  if scan_count >= limit_count then
    raise exception 'Scan limit reached';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_scans_enforce_limit
  before insert on public.scans
  for each row execute function public.enforce_scan_limit();

-- ============================================================================
-- Table: scan_results
-- ============================================================================

create table public.scan_results (
  id                uuid        primary key default gen_random_uuid(),
  scan_id           uuid        not null references public.scans(id) on delete cascade,
  tool_name         text        not null check (tool_name in ('gitleaks', 'trivy')),
  severity          text        not null default 'medium'
                                check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title             text        not null,
  description       text,
  file_path         text        not null,
  line_number       integer,
  rule_id           text,

  -- gitleaks-specific
  snippet           text,
  commit_sha        text,
  author            text,
  fingerprint       text,

  -- trivy-specific
  pkg_name          text,
  installed_version text,
  fixed_version     text,
  cve_id            text,
  primary_url       text,

  created_at        timestamptz not null default now()
);

create index idx_scan_results_scan_id on public.scan_results(scan_id);
create index idx_scan_results_severity on public.scan_results(severity);
create index idx_scan_results_tool_name on public.scan_results(tool_name);

-- ============================================================================
-- Grants (optional — uncomment and set your application DB user)
-- ============================================================================
--
-- grant usage on schema public to kestrel_app;
-- grant select, insert, update, delete on all tables in schema public to kestrel_app;
-- alter default privileges in schema public
--   grant select, insert, update, delete on tables to kestrel_app;
