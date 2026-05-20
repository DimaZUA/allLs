begin;

create table if not exists public.resident_visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  home_code text not null,
  account_id text not null,
  kv text null,
  fio text null,
  token text not null,
  source text not null default 'resident_web'
);

create index if not exists resident_visits_visited_at_idx
  on public.resident_visits (visited_at desc);

create index if not exists resident_visits_home_account_idx
  on public.resident_visits (home_code, account_id, visited_at desc);

create or replace function public.resident_visit_log(
  p_token text,
  p_source text default 'resident_web'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  j_payload jsonb;
  v_home_code text;
  v_account_id text;
  j_ls jsonb;
  j_ls_item jsonb;
  v_kv text;
  v_fio text;
begin
  if coalesce(btrim(p_token), '') = '' then
    raise exception 'Token is required';
  end if;

  -- Validate token and resolve account.
  j_payload := resident_get_ls(p_token);
  v_home_code := coalesce(j_payload ->> 'home_code', '');
  v_account_id := coalesce(j_payload ->> 'account_id', '');
  if v_home_code = '' or v_account_id = '' then
    raise exception 'Invalid token payload';
  end if;

  j_ls := coalesce(j_payload -> 'ls', '{}'::jsonb);
  j_ls_item := j_ls -> v_account_id;
  v_kv := coalesce(j_ls_item ->> 'kv', '');
  v_fio := coalesce(j_ls_item ->> 'fio', '');

  insert into public.resident_visits (
    home_code,
    account_id,
    kv,
    fio,
    token,
    source
  )
  values (
    v_home_code,
    v_account_id,
    nullif(v_kv, ''),
    nullif(v_fio, ''),
    upper(btrim(p_token)),
    coalesce(nullif(btrim(p_source), ''), 'resident_web')
  );

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.resident_visit_log(text, text) to anon;
grant execute on function public.resident_visit_log(text, text) to authenticated;
grant execute on function public.resident_visit_log(text, text) to service_role;

commit;

