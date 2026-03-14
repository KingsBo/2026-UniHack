-- Kestrel Database Schema
-- Supabase-compatible PostgreSQL migration
-- Creates all tables, indexes, RLS policies, triggers, and vault integration

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists "pgcrypto";

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
-- App-level profile linked to Supabase auth.users.
-- One row per authenticated user. user_id references auth.users(id).
-- ============================================================================

create table public.users (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique references auth.users(id) on delete cascade,
  email      text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_user_id on public.users(user_id);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: connected_github_accounts
-- Stores GitHub OAuth connection metadata. The actual access token is stored
-- in Supabase Vault (pgsodium encryption). Only vault_secret_id is stored here.
-- ============================================================================

create table public.connected_github_accounts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  github_user_id  bigint      not null,
  github_username text        not null,
  vault_secret_id uuid        not null,
  token_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, github_user_id)
);

create index idx_github_accounts_user_id on public.connected_github_accounts(user_id);

create trigger trg_github_accounts_updated_at
  before update on public.connected_github_accounts
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: repositories
-- Tracked GitHub repositories. Each belongs to a connected GitHub account.
-- ============================================================================

create table public.repositories (
  id                uuid        primary key default gen_random_uuid(),
  github_account_id uuid        not null references public.connected_github_accounts(id) on delete cascade,
  github_repo_id    bigint      not null,
  name              text        not null,
  full_name         text        not null,
  url               text        not null,
  default_branch    text        not null default 'main',
  is_private        boolean     not null default false,
  language          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(github_account_id, github_repo_id)
);

create index idx_repositories_github_account_id on public.repositories(github_account_id);

create trigger trg_repositories_updated_at
  before update on public.repositories
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: scans
-- Records each scan session. A single scan runs multiple tools in parallel.
-- ============================================================================

create table public.scans (
  id             uuid        primary key default gen_random_uuid(),
  repository_id  uuid        not null references public.repositories(id) on delete cascade,
  user_id        uuid        not null references public.users(id) on delete cascade,
  status         text        not null default 'pending'
                              check (status in ('pending', 'running', 'completed', 'failed')),
  tools_run      text[]      not null default '{}',
  branch         text,
  commit_sha     text,
  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    integer,
  error_message  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_scans_repository_id on public.scans(repository_id);
create index idx_scans_user_id on public.scans(user_id);
create index idx_scans_status on public.scans(status);

create trigger trg_scans_updated_at
  before update on public.scans
  for each row execute function public.update_updated_at();

-- ============================================================================
-- Table: scan_results
-- Individual findings from a scan. Supports both gitleaks and trivy findings
-- using nullable columns for tool-specific fields.
-- ============================================================================

create table public.scan_results (
  id               uuid        primary key default gen_random_uuid(),
  scan_id          uuid        not null references public.scans(id) on delete cascade,
  tool_name        text        not null check (tool_name in ('gitleaks', 'trivy')),
  severity         text        not null default 'medium'
                                check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title            text        not null,
  description      text,
  file_path        text        not null,
  line_number      integer,
  rule_id          text,

  -- gitleaks-specific fields
  snippet          text,
  commit_sha       text,
  author           text,
  fingerprint      text,

  -- trivy-specific fields
  pkg_name         text,
  installed_version text,
  fixed_version    text,
  cve_id           text,
  primary_url      text,

  created_at       timestamptz not null default now()
);

create index idx_scan_results_scan_id on public.scan_results(scan_id);
create index idx_scan_results_severity on public.scan_results(severity);
create index idx_scan_results_tool_name on public.scan_results(tool_name);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

alter table public.users enable row level security;
alter table public.connected_github_accounts enable row level security;
alter table public.repositories enable row level security;
alter table public.scans enable row level security;
alter table public.scan_results enable row level security;

-- ---- users ----

create policy "users_select_own"
  on public.users for select
  using (user_id = auth.uid());

create policy "users_insert_own"
  on public.users for insert
  with check (user_id = auth.uid());

create policy "users_update_own"
  on public.users for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- connected_github_accounts ----

create policy "github_accounts_select_own"
  on public.connected_github_accounts for select
  using (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

create policy "github_accounts_insert_own"
  on public.connected_github_accounts for insert
  with check (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

create policy "github_accounts_update_own"
  on public.connected_github_accounts for update
  using (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  )
  with check (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

create policy "github_accounts_delete_own"
  on public.connected_github_accounts for delete
  using (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

-- ---- repositories ----

create policy "repositories_select_own"
  on public.repositories for select
  using (
    github_account_id in (
      select ga.id from public.connected_github_accounts ga
      join public.users u on ga.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

create policy "repositories_insert_own"
  on public.repositories for insert
  with check (
    github_account_id in (
      select ga.id from public.connected_github_accounts ga
      join public.users u on ga.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

create policy "repositories_update_own"
  on public.repositories for update
  using (
    github_account_id in (
      select ga.id from public.connected_github_accounts ga
      join public.users u on ga.user_id = u.id
      where u.user_id = auth.uid()
    )
  )
  with check (
    github_account_id in (
      select ga.id from public.connected_github_accounts ga
      join public.users u on ga.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

create policy "repositories_delete_own"
  on public.repositories for delete
  using (
    github_account_id in (
      select ga.id from public.connected_github_accounts ga
      join public.users u on ga.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

-- ---- scans ----

create policy "scans_select_own"
  on public.scans for select
  using (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

create policy "scans_insert_own"
  on public.scans for insert
  with check (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

create policy "scans_update_own"
  on public.scans for update
  using (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  )
  with check (
    user_id in (
      select id from public.users where user_id = auth.uid()
    )
  );

-- ---- scan_results ----

create policy "scan_results_select_own"
  on public.scan_results for select
  using (
    scan_id in (
      select s.id from public.scans s
      join public.users u on s.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

create policy "scan_results_insert_own"
  on public.scan_results for insert
  with check (
    scan_id in (
      select s.id from public.scans s
      join public.users u on s.user_id = u.id
      where u.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Auto-create user profile on signup via database trigger
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (user_id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
