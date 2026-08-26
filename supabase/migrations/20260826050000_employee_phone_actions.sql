alter table public.employees
  add column if not exists phone_action text not null default 'both';

alter table public.employees
  drop constraint if exists employees_phone_action_check;

alter table public.employees
  add constraint employees_phone_action_check
  check (phone_action in ('call', 'whatsapp', 'both'));

comment on column public.employees.phone_action is
  'Public profile phone actions selected by the administrator: call, WhatsApp, or both.';
