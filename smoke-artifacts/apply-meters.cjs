const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`create extension if not exists pgcrypto`;

    await tx`
      create table if not exists public.meters (
        id uuid primary key default gen_random_uuid(),
        home_code text not null,
        resource_type text not null check (resource_type in ('electricity', 'heat')),
        name text not null default '',
        meter_type text not null default '',
        meter_number text not null default '',
        eic_code text not null default '',
        operator_account text not null default '',
        contract_number text not null default '',
        contract_date date,
        measurement_type text not null default '',
        calculation_factor numeric not null default 1,
        min_consumption numeric,
        max_consumption numeric,
        heat_loss text not null default '',
        zones_count int not null default 1 check (zones_count between 1 and 3),
        connection_name text not null default '',
        object_name text not null default '',
        role text not null default 'billable',
        is_active boolean not null default true,
        sort_order int not null default 1000,
        note text not null default '',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;

    await tx`
      create table if not exists public.meter_channels (
        id uuid primary key default gen_random_uuid(),
        meter_id uuid not null references public.meters(id) on delete cascade,
        code text not null,
        label text not null default '',
        input_unit text not null default '',
        report_unit text not null default '',
        unit_factor numeric not null default 1,
        max_value numeric,
        is_reverse boolean not null default false,
        value_type text not null default 'number' check (value_type in ('number', 'text', 'date', 'time')),
        is_reading boolean not null default true,
        is_active boolean not null default true,
        sort_order int not null default 1000,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (meter_id, code)
      )
    `;

    await tx`alter table public.meter_channels add column if not exists is_reverse boolean not null default false`;

    await tx`
      create table if not exists public.meter_relations (
        id uuid primary key default gen_random_uuid(),
        parent_meter_id uuid not null references public.meters(id) on delete cascade,
        child_meter_id uuid not null references public.meters(id) on delete cascade,
        sign int not null default -1 check (sign in (-1, 1)),
        is_active boolean not null default true,
        note text not null default '',
        created_at timestamptz not null default now(),
        unique (parent_meter_id, child_meter_id)
      )
    `;

    await tx`
      create table if not exists public.meter_readings (
        id uuid primary key default gen_random_uuid(),
        meter_id uuid not null references public.meters(id) on delete cascade,
        reading_date date not null,
        report_month int not null,
        source text not null default 'manual',
        comment text not null default '',
        created_by uuid default auth.uid(),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (meter_id, reading_date)
      )
    `;

    await tx`
      create table if not exists public.meter_reading_values (
        id uuid primary key default gen_random_uuid(),
        reading_id uuid not null references public.meter_readings(id) on delete cascade,
        channel_id uuid not null references public.meter_channels(id) on delete cascade,
        current_value text not null default '',
        previous_value text not null default '',
        previous_manual boolean not null default false,
        delta_value numeric,
        report_value numeric,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (reading_id, channel_id)
      )
    `;

    await tx`create index if not exists meters_home_active_idx on public.meters (home_code, is_active, resource_type, sort_order)`;
    await tx`alter table public.meters add column if not exists min_consumption numeric`;
    await tx`alter table public.meters add column if not exists max_consumption numeric`;
    await tx`alter table public.meters add column if not exists heat_loss text not null default ''`;
    await tx`create index if not exists meter_channels_meter_idx on public.meter_channels (meter_id, is_active, sort_order)`;
    await tx`create index if not exists meter_relations_parent_idx on public.meter_relations (parent_meter_id, is_active)`;
    await tx`create index if not exists meter_relations_child_idx on public.meter_relations (child_meter_id, is_active)`;
    await tx`create index if not exists meter_readings_meter_month_idx on public.meter_readings (meter_id, report_month desc, reading_date desc)`;

    await tx`
      create or replace function public.set_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$
    `;
    for (const table of ["meters", "meter_channels", "meter_readings", "meter_reading_values"]) {
      await tx.unsafe(`drop trigger if exists trg_${table}_updated_at on public.${table}`);
      await tx.unsafe(`
        create trigger trg_${table}_updated_at
        before update on public.${table}
        for each row execute function public.set_updated_at()
      `);
    }

    for (const table of ["meters", "meter_channels", "meter_relations", "meter_readings", "meter_reading_values"]) {
      await tx.unsafe(`alter table public.${table} enable row level security`);
      await tx.unsafe(`grant select, insert, update, delete on public.${table} to authenticated`);
    }

    await tx`drop policy if exists meters_select_access on public.meters`;
    await tx`drop policy if exists meters_write_roles on public.meters`;
    await tx`
      create policy meters_select_access on public.meters
      for select to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meters.home_code
        )
      )
    `;
    await tx`
      create policy meters_write_roles on public.meters
      for all to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meters.home_code
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meters.home_code
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
    `;

    await tx`drop policy if exists meter_channels_select_access on public.meter_channels`;
    await tx`drop policy if exists meter_channels_write_roles on public.meter_channels`;
    await tx`
      create policy meter_channels_select_access on public.meter_channels
      for select to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_channels.meter_id
            and uh.user_id = auth.uid()
        )
      )
    `;
    await tx`
      create policy meter_channels_write_roles on public.meter_channels
      for all to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_channels.meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
      with check (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_channels.meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
    `;

    await tx`drop policy if exists meter_relations_select_access on public.meter_relations`;
    await tx`drop policy if exists meter_relations_write_roles on public.meter_relations`;
    await tx`
      create policy meter_relations_select_access on public.meter_relations
      for select to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_relations.parent_meter_id
            and uh.user_id = auth.uid()
        )
      )
    `;
    await tx`
      create policy meter_relations_write_roles on public.meter_relations
      for all to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_relations.parent_meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
      with check (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_relations.parent_meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
    `;

    await tx`drop policy if exists meter_readings_select_access on public.meter_readings`;
    await tx`drop policy if exists meter_readings_write_roles on public.meter_readings`;
    await tx`
      create policy meter_readings_select_access on public.meter_readings
      for select to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_readings.meter_id
            and uh.user_id = auth.uid()
        )
      )
    `;
    await tx`
      create policy meter_readings_write_roles on public.meter_readings
      for all to authenticated
      using (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_readings.meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
      with check (
        exists (
          select 1 from public.meters m
          join public.user_homes uh on uh.home_code::text = m.home_code
          where m.id = meter_readings.meter_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
    `;

    await tx`drop policy if exists meter_reading_values_select_access on public.meter_reading_values`;
    await tx`drop policy if exists meter_reading_values_write_roles on public.meter_reading_values`;
    await tx`
      create policy meter_reading_values_select_access on public.meter_reading_values
      for select to authenticated
      using (
        exists (
          select 1 from public.meter_readings r
          join public.meters m on m.id = r.meter_id
          join public.user_homes uh on uh.home_code::text = m.home_code
          where r.id = meter_reading_values.reading_id
            and uh.user_id = auth.uid()
        )
      )
    `;
    await tx`
      create policy meter_reading_values_write_roles on public.meter_reading_values
      for all to authenticated
      using (
        exists (
          select 1 from public.meter_readings r
          join public.meters m on m.id = r.meter_id
          join public.user_homes uh on uh.home_code::text = m.home_code
          where r.id = meter_reading_values.reading_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
      with check (
        exists (
          select 1 from public.meter_readings r
          join public.meters m on m.id = r.meter_id
          join public.user_homes uh on uh.home_code::text = m.home_code
          where r.id = meter_reading_values.reading_id
            and uh.user_id = auth.uid()
            and uh.role in ('Администратор', 'Бухгалтер', 'Председатель', 'Правление')
        )
      )
    `;
  });

  const meters = await sql`select count(*)::int as count from public.meters`;
  console.log(`meters ready, rows: ${meters[0].count}`);
  await sql.end({ timeout: 5 });
}

main().catch(async err => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch (_) {}
  process.exit(1);
});
