begin;

alter table if exists public.resident_access_tokens enable row level security;
alter table if exists public.resident_visits enable row level security;

commit;

