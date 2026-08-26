create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  job_title text not null check (char_length(job_title) between 1 and 120),
  department text,
  email text,
  phone text,
  phone_action text not null default 'both' check (phone_action in ('call', 'whatsapp', 'both')),
  website text,
  address text,
  linkedin_url text,
  bio text check (char_length(bio) <= 600),
  photo_url text,
  -- Internal permanent profile identifier. Administrators never enter this value.
  slug text not null unique default ('profile-' || encode(extensions.gen_random_bytes(10), 'hex'))
    check (slug ~ '^profile-[a-f0-9]{20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_active_slug_idx on public.employees (slug) where active;
create index if not exists employees_search_idx on public.employees using gin
  (to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(job_title,'') || ' ' || coalesce(department,'')));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
revoke all on table public.employees from anon, authenticated;
grant select on table public.employees to anon;
grant select, insert, update on table public.employees to authenticated;

drop policy if exists "Public reads active employees" on public.employees;
create policy "Public reads active employees" on public.employees for select to anon using (active);
drop policy if exists "Admins read all employees" on public.employees;
create policy "Admins read all employees" on public.employees for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins create employees" on public.employees;
create policy "Admins create employees" on public.employees for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins update employees" on public.employees;
create policy "Admins update employees" on public.employees for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists private.login_attempts (
  source_hash text not null,
  attempted_at timestamptz not null default now(),
  successful boolean not null default false
);
create index if not exists login_attempts_source_time_idx on private.login_attempts (source_hash, attempted_at desc);
revoke all on schema private from public, anon, authenticated;
revoke all on table private.login_attempts from public, anon, authenticated;

create or replace function public.check_login_rate_limit(source text, was_successful boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare source_key text; failure_count integer;
begin
  source_key := encode(extensions.digest(source, 'sha256'), 'hex');
  delete from private.login_attempts where attempted_at < now() - interval '24 hours';
  if was_successful then
    delete from private.login_attempts where source_hash = source_key;
    return true;
  end if;
  select count(*) into failure_count from private.login_attempts
    where source_hash = source_key and not successful and attempted_at > now() - interval '15 minutes';
  if failure_count >= 5 then return false; end if;
  insert into private.login_attempts(source_hash, successful) values (source_key, false);
  return true;
end $$;
revoke all on function public.check_login_rate_limit(text, boolean) from public, anon, authenticated;
grant execute on function public.check_login_rate_limit(text, boolean) to service_role;

comment on table public.employees is 'Public employee vCards managed by authenticated admins.';
