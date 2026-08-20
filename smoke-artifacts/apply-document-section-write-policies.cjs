const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`alter table public.outgoing_documents enable row level security`;
    await tx`drop policy if exists outgoing_documents_insert_board on public.outgoing_documents`;
    await tx`drop policy if exists outgoing_documents_update_board on public.outgoing_documents`;
    await tx`drop policy if exists outgoing_documents_delete_board on public.outgoing_documents`;
    await tx`
      create policy outgoing_documents_insert_board on public.outgoing_documents
      for insert to authenticated
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'outgoing_documents'
            and uds.enabled = true
        )
      )
    `;
    await tx`
      create policy outgoing_documents_update_board on public.outgoing_documents
      for update to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'outgoing_documents'
            and uds.enabled = true
        )
      )
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'outgoing_documents'
            and uds.enabled = true
        )
      )
    `;
    await tx`
      create policy outgoing_documents_delete_board on public.outgoing_documents
      for delete to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'outgoing_documents'
            and uds.enabled = true
        )
      )
    `;

    await tx`alter table public.meeting_protocols enable row level security`;
    await tx`drop policy if exists meeting_protocols_insert_board on public.meeting_protocols`;
    await tx`drop policy if exists meeting_protocols_update_board on public.meeting_protocols`;
    await tx`drop policy if exists meeting_protocols_delete_board on public.meeting_protocols`;
    await tx`
      create policy meeting_protocols_insert_board on public.meeting_protocols
      for insert to authenticated
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'meeting_protocols'
            and uds.enabled = true
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
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'meeting_protocols'
            and uds.enabled = true
        )
      )
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = meeting_protocols.home_code
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'meeting_protocols'
            and uds.enabled = true
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
        )
        and exists (
          select 1 from public.user_document_sections uds
          where uds.user_id = auth.uid()
            and uds.section = 'meeting_protocols'
            and uds.enabled = true
        )
      )
    `;
  });

  console.log("document section write policies updated");
}

main().then(() => sql.end()).catch(err => {
  console.error(err);
  sql.end().finally(() => process.exit(1));
});
