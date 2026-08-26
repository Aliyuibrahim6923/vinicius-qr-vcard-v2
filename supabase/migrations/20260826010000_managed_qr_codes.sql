create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{8,32}$'),
  name text not null check (char_length(name) between 1 and 120),
  category text,
  active boolean not null default true,
  destination_type text not null check (destination_type in ('employee_profile', 'employee_vcard', 'external')),
  employee_id uuid references public.employees(id) on delete restrict,
  destination_url text check (destination_url is null or destination_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qr_destination_shape check (
    (destination_type in ('employee_profile', 'employee_vcard') and employee_id is not null and destination_url is null)
    or (destination_type = 'external' and employee_id is null and destination_url is not null)
  )
);

create index if not exists qr_codes_active_code_idx on public.qr_codes (code) where active;
create index if not exists qr_codes_employee_idx on public.qr_codes (employee_id) where employee_id is not null;
create index if not exists qr_codes_search_idx on public.qr_codes using gin
  (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(category, '')));

drop trigger if exists qr_codes_set_updated_at on public.qr_codes;
create trigger qr_codes_set_updated_at before update on public.qr_codes
for each row execute function public.set_updated_at();

create or replace function public.prevent_qr_code_change() returns trigger language plpgsql as $$
begin
  if new.code <> old.code then raise exception 'A managed QR code cannot be changed'; end if;
  return new;
end $$;
drop trigger if exists qr_codes_code_is_permanent on public.qr_codes;
create trigger qr_codes_code_is_permanent before update on public.qr_codes
for each row execute function public.prevent_qr_code_change();

alter table public.qr_codes enable row level security;
revoke all on table public.qr_codes from anon, authenticated;
grant select on table public.qr_codes to anon;
grant select, insert, update on table public.qr_codes to authenticated;

drop policy if exists "Public resolves active QR codes" on public.qr_codes;
create policy "Public resolves active QR codes" on public.qr_codes for select to anon using (active);
drop policy if exists "Admins read all QR codes" on public.qr_codes;
create policy "Admins read all QR codes" on public.qr_codes for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins create QR codes" on public.qr_codes;
create policy "Admins create QR codes" on public.qr_codes for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins update QR codes" on public.qr_codes;
create policy "Admins update QR codes" on public.qr_codes for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

comment on table public.qr_codes is 'Permanent managed QR URLs and their mutable destinations.';
