const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`
      create table if not exists public.user_document_sections (
        user_id uuid not null references auth.users(id) on delete cascade,
        section text not null check (section in ('reports', 'outgoing_documents', 'meeting_protocols')),
        enabled boolean not null default false,
        updated_at timestamptz not null default now(),
        primary key (user_id, section)
      )
    `;
    await tx`alter table public.user_document_sections enable row level security`;
    await tx`drop policy if exists user_document_sections_select_own on public.user_document_sections`;
    await tx`
      create policy user_document_sections_select_own on public.user_document_sections
      for select
      using (auth.uid() = user_id)
    `;
    await tx`create index if not exists user_document_sections_user_idx on public.user_document_sections (user_id, section)`;
  });
  const rows = await sql`select count(*)::int as count from public.user_document_sections`;
  console.log(`user_document_sections ready, rows: ${rows[0].count}`);
}

main().then(() => sql.end()).catch(err => {
  console.error(err);
  sql.end().finally(() => process.exit(1));
});
