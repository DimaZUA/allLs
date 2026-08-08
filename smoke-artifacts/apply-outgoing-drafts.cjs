const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`alter table public.outgoing_documents add column if not exists is_draft boolean not null default false`;
    await tx`create index if not exists outgoing_documents_draft_updated_idx on public.outgoing_documents (is_draft, updated_at)`;
    await tx`
      create or replace function public.cleanup_old_outgoing_document_drafts()
      returns integer
      language plpgsql
      security definer
      set search_path = public
      as $$
      declare
        deleted_count integer;
      begin
        delete from public.outgoing_documents
        where is_draft = true
          and updated_at < now() - interval '30 days';
        get diagnostics deleted_count = row_count;
        return deleted_count;
      end;
      $$
    `;
    await tx`grant execute on function public.cleanup_old_outgoing_document_drafts() to authenticated`;
    await tx`select public.cleanup_old_outgoing_document_drafts()`;
  });
  const columns = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'outgoing_documents'
      and column_name in ('is_draft', 'updated_at')
    order by column_name
  `;
  console.log(JSON.stringify(columns, null, 2));
  await sql.end({ timeout: 5 });
}

main().catch(async err => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch (_) {}
  process.exit(1);
});
