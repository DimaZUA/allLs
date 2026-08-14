const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`create extension if not exists pgcrypto`;
    await tx`
      create table if not exists public.meeting_protocols (
        id uuid primary key default gen_random_uuid(),
        home_code text not null,
        protocol_date date,
        protocol_number text,
        meeting_type text not null default 'general',
        vote_basis text not null default 'apartment',
        meeting_format text not null default 'in_person',
        meeting_initiator text not null default 'board',
        present_count text not null default '',
        present_area text not null default '',
        title text not null default '',
        location text not null default '',
        chair text not null default '',
        secretary text not null default '',
        notes text not null default '',
        placeholder_values jsonb not null default '{}'::jsonb,
        agenda jsonb not null default '[]'::jsonb,
        participants jsonb not null default '[]'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await tx`alter table public.meeting_protocols add column if not exists participants jsonb not null default '[]'::jsonb`;
    await tx`alter table public.meeting_protocols add column if not exists meeting_format text not null default 'in_person'`;
    await tx`alter table public.meeting_protocols add column if not exists meeting_initiator text not null default 'board'`;
    await tx`alter table public.meeting_protocols add column if not exists present_count text not null default ''`;
    await tx`alter table public.meeting_protocols add column if not exists present_area text not null default ''`;
    await tx`alter table public.meeting_protocols add column if not exists placeholder_values jsonb not null default '{}'::jsonb`;
    await tx`create index if not exists meeting_protocols_home_date_idx on public.meeting_protocols (home_code, protocol_date desc, protocol_number)`;
    await tx`
      create or replace function public.set_meeting_protocols_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$
    `;
    await tx`drop trigger if exists trg_meeting_protocols_updated_at on public.meeting_protocols`;
    await tx`
      create trigger trg_meeting_protocols_updated_at
      before update on public.meeting_protocols
      for each row execute function public.set_meeting_protocols_updated_at()
    `;
    await tx`alter table public.meeting_protocols enable row level security`;
    await tx`drop policy if exists meeting_protocols_select_access on public.meeting_protocols`;
    await tx`drop policy if exists meeting_protocols_insert_board on public.meeting_protocols`;
    await tx`drop policy if exists meeting_protocols_update_board on public.meeting_protocols`;
    await tx`drop policy if exists meeting_protocols_delete_board on public.meeting_protocols`;
    await tx`
      create policy meeting_protocols_select_access on public.meeting_protocols
      for select to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
        )
      )
    `;
    await tx`
      create policy meeting_protocols_insert_board on public.meeting_protocols
      for insert to authenticated
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
            and uh.role in ('Правление', 'Администратор')
        )
      )
    `;
    await tx`
      create policy meeting_protocols_update_board on public.meeting_protocols
      for update to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
            and uh.role in ('Правление', 'Администратор')
        )
      )
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
            and uh.role in ('Правление', 'Администратор')
        )
      )
    `;
    await tx`
      create policy meeting_protocols_delete_board on public.meeting_protocols
      for delete to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
            and uh.role in ('Правление', 'Администратор')
        )
      )
    `;
    await tx`grant select, insert, update, delete on public.meeting_protocols to authenticated`;
  });
  const count = await sql`select count(*)::int as count from public.meeting_protocols`;
  console.log(`meeting_protocols ready, rows: ${count[0].count}`);
  await sql.end({ timeout: 5 });
}

main().catch(async err => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch (_) {}
  process.exit(1);
});
