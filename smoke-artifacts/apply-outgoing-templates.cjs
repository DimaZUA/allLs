const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql`alter table public.outgoing_documents add column if not exists is_template boolean not null default false`;
  await sql`create index if not exists outgoing_documents_template_idx on public.outgoing_documents (home_code, is_template, updated_at desc)`;
  console.log("outgoing_documents.is_template ready");
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
