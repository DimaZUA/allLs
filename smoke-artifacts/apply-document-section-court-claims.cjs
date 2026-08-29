const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql.begin(async tx => {
    await tx`
      alter table public.user_document_sections
      drop constraint if exists user_document_sections_section_check
    `;
    await tx`
      alter table public.user_document_sections
      add constraint user_document_sections_section_check
      check (section in ('reports', 'outgoing_documents', 'meeting_protocols', 'court_claims'))
    `;
  });
  console.log("user_document_sections court_claims ready");
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
