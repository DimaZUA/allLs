-- Persistent resident tokens (short, random, stable per account).
-- Compatible with legacy rt tokens: resident_get_ls supports both formats.

begin;

create table if not exists public.resident_access_tokens (
  home_code text not null,
  account_id text not null,
  token text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  note text null,
  constraint resident_access_tokens_pkey primary key (home_code, account_id),
  constraint resident_access_tokens_token_key unique (token),
  constraint resident_access_tokens_token_len_chk check (char_length(token) >= 8)
);

create index if not exists resident_access_tokens_active_idx
  on public.resident_access_tokens (token)
  where revoked_at is null;

create or replace function public.resident_random_token(p_len integer default 12)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Crockford-like base32 without ambiguous chars.
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  out_token text := '';
  i integer;
  idx integer;
begin
  if p_len is null or p_len < 8 or p_len > 64 then
    raise exception 'Invalid token length: %', p_len;
  end if;

  bytes := extensions.gen_random_bytes(p_len);
  for i in 0..(p_len - 1) loop
    idx := get_byte(bytes, i) % length(chars);
    out_token := out_token || substr(chars, idx + 1, 1);
  end loop;

  return out_token;
end;
$$;

create or replace function public.resident_token_make(p_okpo text, p_account_id text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_home_code text := btrim(coalesce(p_okpo, ''));
  v_account_id text := btrim(coalesce(p_account_id, ''));
  v_token text;
  v_candidate text;
begin
  if v_home_code = '' or v_account_id = '' then
    raise exception 'p_okpo and p_account_id are required';
  end if;

  -- Guard: home must exist.
  if not exists (
    select 1
    from public.homes h
    where h.code = v_home_code
  ) then
    raise exception 'Home % not found', v_home_code;
  end if;

  -- Existing active token (stable forever until revoke).
  select t.token
    into v_token
  from public.resident_access_tokens t
  where t.home_code = v_home_code
    and t.account_id = v_account_id
    and t.revoked_at is null
  limit 1;

  if v_token is not null then
    return v_token;
  end if;

  -- Generate new unique token.
  loop
    v_candidate := public.resident_random_token(12);
    begin
      insert into public.resident_access_tokens (home_code, account_id, token)
      values (v_home_code, v_account_id, v_candidate);
      return v_candidate;
    exception
      when unique_violation then
        -- Either token collision or parallel insert for same account.
        select t.token
          into v_token
        from public.resident_access_tokens t
        where t.home_code = v_home_code
          and t.account_id = v_account_id
          and t.revoked_at is null
        limit 1;
        if v_token is not null then
          return v_token;
        end if;
        -- else: token collision, retry loop.
    end;
  end loop;
end;
$$;

create or replace function public.resident_get_ls(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parts text[];
  okpo_enc text;
  acc_enc text;
  sig text;
  payload text;
  sig_expected text;
  v_token_norm text;
  v_home_code text;
  v_account_id text;

  v_code text;
  v_name text;
  v_org text;
  v_adr text;
  v_dt text;
  v_us_text text;
  v_b_text text;
  v_what_text text;
  v_kto_text text;
  v_ls_text text;
  v_nach_text text;
  v_oplat_text text;
  v_nachnote_text text;
  v_plat_text text;
  v_allnach_text text;
  v_tarifs_text text;
  v_spending_text text;
  v_data_text text;

  j_us jsonb;
  j_b jsonb;
  j_what jsonb;
  j_kto jsonb;
  j_ls_all jsonb;
  j_nach_all jsonb;
  j_oplat_all jsonb;
  j_nachnote_all jsonb;
  j_plat jsonb;
  j_allnach jsonb;
  j_tarifs jsonb;
  j_spending jsonb;
  j_data jsonb;
  v_expenses_enabled boolean := false;

  j_ls_item jsonb;
  j_nach_item jsonb;
  j_oplat_item jsonb;
  j_nachnote_item jsonb;
  v_home_total_sqr numeric := 0;
begin
  if coalesce(btrim(p_token), '') = '' then
    raise exception 'Token is required';
  end if;

  v_token_norm := upper(btrim(p_token));

  -- New format: persistent random token from mapping table.
  select t.home_code, t.account_id
    into v_home_code, v_account_id
  from public.resident_access_tokens t
  where t.token = v_token_norm
    and t.revoked_at is null
  limit 1;

  -- Legacy format fallback: <base36(okpo)>.<base36(account_id)>.<hmac8>
  if v_home_code is null or v_account_id is null then
    parts := regexp_split_to_array(v_token_norm, '\.');
    if array_length(parts, 1) <> 3 then
      raise exception 'Invalid token format';
    end if;

    okpo_enc := parts[1];
    acc_enc := parts[2];
    sig := parts[3];
    payload := okpo_enc || '.' || acc_enc;

    sig_expected := upper(substr(
      encode(
        extensions.hmac(
          payload,
          resident_hmac_secret(),
          'sha256'
        ),
        'hex'
      ),
      1,
      8
    ));
    if sig <> sig_expected then
      raise exception 'Invalid token signature';
    end if;

    v_home_code := base36_decode(okpo_enc)::text;
    v_account_id := base36_decode(acc_enc)::text;
  end if;

  select
    code,
    name,
    org,
    adr,
    dt,
    us::text,
    b::text,
    what::text,
    kto::text,
    ls::text,
    nach::text,
    oplat::text,
    nachnote::text,
    plat::text,
    allnach::text,
    tarifs::text,
    spending::text,
    data::text
  into
    v_code,
    v_name,
    v_org,
    v_adr,
    v_dt,
    v_us_text,
    v_b_text,
    v_what_text,
    v_kto_text,
    v_ls_text,
    v_nach_text,
    v_oplat_text,
    v_nachnote_text,
    v_plat_text,
    v_allnach_text,
    v_tarifs_text,
    v_spending_text,
    v_data_text
  from public.homes
  where code = v_home_code
  limit 1;

  if not found then
    raise exception 'Home not found for token';
  end if;

  j_us := try_parse_jsonb(v_us_text);
  j_b := try_parse_jsonb(v_b_text);
  j_what := try_parse_jsonb(v_what_text);
  j_kto := try_parse_jsonb(v_kto_text);
  j_ls_all := try_parse_jsonb(v_ls_text);
  j_nach_all := try_parse_jsonb(v_nach_text);
  j_oplat_all := try_parse_jsonb(v_oplat_text);
  j_nachnote_all := try_parse_jsonb(v_nachnote_text);
  j_plat := try_parse_jsonb(v_plat_text);
  j_allnach := try_parse_jsonb(v_allnach_text);
  j_tarifs := try_parse_jsonb(v_tarifs_text);
  j_spending := try_parse_jsonb(v_spending_text);
  j_data := try_parse_jsonb(v_data_text);

  if j_us = '{}'::jsonb then j_us := coalesce(j_data -> 'us', '{}'::jsonb); end if;
  if j_b = '{}'::jsonb then j_b := coalesce(j_data -> 'b', '{}'::jsonb); end if;
  if j_what = '{}'::jsonb then j_what := coalesce(j_data -> 'what', '{}'::jsonb); end if;
  if j_kto = '{}'::jsonb then j_kto := coalesce(j_data -> 'kto', '{}'::jsonb); end if;
  if j_ls_all = '{}'::jsonb then j_ls_all := coalesce(j_data -> 'ls', '{}'::jsonb); end if;
  if j_nach_all = '{}'::jsonb then j_nach_all := coalesce(j_data -> 'nach', '{}'::jsonb); end if;
  if j_oplat_all = '{}'::jsonb then j_oplat_all := coalesce(j_data -> 'oplat', '{}'::jsonb); end if;
  if j_nachnote_all = '{}'::jsonb then j_nachnote_all := coalesce(j_data -> 'nachnote', '{}'::jsonb); end if;
  if j_plat = '{}'::jsonb then j_plat := coalesce(j_data -> 'plat', '{}'::jsonb); end if;
  if j_allnach = '{}'::jsonb then j_allnach := coalesce(j_data -> 'allnach', '{}'::jsonb); end if;
  if j_tarifs = '{}'::jsonb then j_tarifs := coalesce(j_data -> 'tarifs', '{}'::jsonb); end if;
  if j_spending = '{}'::jsonb then j_spending := coalesce(j_data -> 'spending', '{}'::jsonb); end if;

  -- Spending is returned to resident only when home.data.expenses = 1.
  v_expenses_enabled := coalesce(lower(trim(j_data ->> 'expenses')), '') in ('1', 'true', 't', 'yes', 'y');
  if not v_expenses_enabled then
    j_spending := '{}'::jsonb;
  end if;

  -- Sum of apartment areas for the whole house (resident-side calculations).
  with ls_items as (
    select value
    from jsonb_each(coalesce(j_ls_all, '{}'::jsonb))
  ),
  raw_vals as (
    select replace(
      regexp_replace(
        coalesce(
          case
            when jsonb_typeof(value) = 'object' and value ? 'pl' then value ->> 'pl'
            when jsonb_typeof(value) = 'object' and value ? 'sqr' then value ->> 'sqr'
            when jsonb_typeof(value) = 'object' and value ? 'SQR' then value ->> 'SQR'
            else ''
          end,
          ''
        ),
        '[^0-9,.\-]',
        '',
        'g'
      ),
      ',',
      '.'
    ) as txt
    from ls_items
  ),
  numeric_vals as (
    select
      case
        when txt ~ '^-?[0-9]+(?:\.[0-9]+)?$' then txt::numeric
        else null
      end as val
    from raw_vals
  )
  select coalesce(sum(val), 0)
    into v_home_total_sqr
  from numeric_vals;

  j_ls_item := j_ls_all -> v_account_id;
  if j_ls_item is null and jsonb_typeof(j_ls_all) = 'object' and (j_ls_all ? 'kv' or j_ls_all ? 'fio') then
    j_ls_item := j_ls_all;
  end if;
  if j_ls_item is null then
    raise exception 'Account not found for token';
  end if;

  j_nach_item := coalesce(j_nach_all -> v_account_id, '{}'::jsonb);
  if j_nach_item = '{}'::jsonb and jsonb_typeof(j_nach_all) = 'object' and jsonb_has_year_keys(j_nach_all) then
    j_nach_item := j_nach_all;
  end if;

  j_oplat_item := coalesce(j_oplat_all -> v_account_id, '{}'::jsonb);
  if j_oplat_item = '{}'::jsonb and jsonb_typeof(j_oplat_all) = 'object' and jsonb_has_year_keys(j_oplat_all) then
    j_oplat_item := j_oplat_all;
  end if;

  j_nachnote_item := coalesce(j_nachnote_all -> v_account_id, '{}'::jsonb);
  if j_nachnote_item = '{}'::jsonb and jsonb_typeof(j_nachnote_all) = 'object' and jsonb_has_year_keys(j_nachnote_all) then
    j_nachnote_item := j_nachnote_all;
  end if;

  return jsonb_build_object(
    'home_code', v_code,
    'name', coalesce(v_name, ''),
    'org', coalesce(v_org, ''),
    'adr', coalesce(v_adr, ''),
    'dt', coalesce(v_dt, ''),
    'account_id', v_account_id,
    'token', coalesce(j_data ->> 'token', ''),
    'home', coalesce(j_data, '{}'::jsonb),
    'us', coalesce(j_us, '{}'::jsonb),
    'b', coalesce(j_b, '{}'::jsonb),
    'what', coalesce(j_what, '{}'::jsonb),
    'kto', coalesce(j_kto, '{}'::jsonb),
    'ls', jsonb_build_object(v_account_id, j_ls_item),
    'nach', jsonb_build_object(v_account_id, coalesce(j_nach_item, '{}'::jsonb)),
    'oplat', jsonb_build_object(v_account_id, coalesce(j_oplat_item, '{}'::jsonb)),
    'nachnote', jsonb_build_object(v_account_id, coalesce(j_nachnote_item, '{}'::jsonb)),
    'plat', coalesce(j_plat, '{}'::jsonb),
    'allnach', coalesce(j_allnach, '{}'::jsonb),
    'tarifs', coalesce(j_tarifs, '{}'::jsonb),
    'spending', coalesce(j_spending, '{}'::jsonb),
    'contacts', coalesce(j_data ->> 'contacts', ''),
    'expenses', case when v_expenses_enabled then 1 else 0 end,
    'home_total_sqr', coalesce(v_home_total_sqr, 0)
  );
end;
$$;

revoke all on function public.resident_token_make(text, text) from public;
grant execute on function public.resident_token_make(text, text) to authenticated;
grant execute on function public.resident_token_make(text, text) to service_role;

commit;
