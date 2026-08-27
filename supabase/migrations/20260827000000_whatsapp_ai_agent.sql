create extension if not exists vector with schema extensions;

create table if not exists public.bot_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  company_name text not null default 'Vinicius Group',
  whatsapp_number text not null default '',
  greeting_message text not null default 'Hello, I would like to learn more about Vinicius Group.',
  system_prompt text not null default 'You are the Vinicius Group assistant. Answer clearly and professionally using only the approved company knowledge provided. If the answer is not in the knowledge, say you do not have that information and suggest contacting the company.',
  updated_at timestamptz not null default now()
);

insert into public.bot_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.bot_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('website', 'document', 'text')),
  name text not null,
  source_url text,
  storage_path text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_knowledge_chunks (
  id bigint generated always as identity primary key,
  source_id uuid not null references public.bot_knowledge_sources(id) on delete cascade,
  content text not null,
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists bot_knowledge_chunks_embedding_idx
  on public.bot_knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

create table if not exists public.whatsapp_messages (
  message_id text primary key,
  contact_number text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_rate_limits (
  source text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

create or replace function public.check_bot_rate_limit(source text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  insert into public.bot_rate_limits as limits (source, request_count, window_started_at)
  values (source, 1, now())
  on conflict (source) do update set
    request_count = case when limits.window_started_at < now() - interval '15 minutes' then 1 else limits.request_count + 1 end,
    window_started_at = case when limits.window_started_at < now() - interval '15 minutes' then now() else limits.window_started_at end
  returning request_count <= 20 into allowed;
  return allowed;
end;
$$;

create or replace function public.set_bot_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists bot_settings_updated_at on public.bot_settings;
create trigger bot_settings_updated_at before update on public.bot_settings
for each row execute function public.set_bot_updated_at();
drop trigger if exists bot_sources_updated_at on public.bot_knowledge_sources;
create trigger bot_sources_updated_at before update on public.bot_knowledge_sources
for each row execute function public.set_bot_updated_at();

create or replace function public.match_bot_knowledge(
  query_embedding extensions.vector(1536),
  match_threshold double precision default 0.2,
  match_count integer default 6
)
returns table (content text, similarity double precision)
language sql stable security definer set search_path = '' as $$
  select chunks.content,
    1 - (chunks.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.bot_knowledge_chunks as chunks
  where 1 - (chunks.embedding operator(extensions.<=>) query_embedding) > match_threshold
  order by chunks.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 12);
$$;

alter table public.bot_settings enable row level security;
alter table public.bot_knowledge_sources enable row level security;
alter table public.bot_knowledge_chunks enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.bot_rate_limits enable row level security;

drop policy if exists "Public can read enabled bot settings" on public.bot_settings;
create policy "Public can read enabled bot settings" on public.bot_settings
for select using (enabled);
drop policy if exists "Admins manage bot settings" on public.bot_settings;
create policy "Admins manage bot settings" on public.bot_settings
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins manage bot sources" on public.bot_knowledge_sources;
create policy "Admins manage bot sources" on public.bot_knowledge_sources
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke all on public.bot_knowledge_chunks from anon, authenticated;
revoke all on public.whatsapp_messages from anon, authenticated;
revoke all on public.bot_rate_limits from anon, authenticated;
revoke execute on function public.check_bot_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_bot_rate_limit(text) to service_role;
revoke execute on function public.match_bot_knowledge(extensions.vector, double precision, integer) from public, anon, authenticated;
grant execute on function public.match_bot_knowledge(extensions.vector, double precision, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bot-knowledge', 'bot-knowledge', false, 8388608, array['application/pdf','text/plain','text/markdown'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
