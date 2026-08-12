const sql = require("../../SITE_UT/db.js");

async function main() {
  await sql`alter table public.outgoing_documents add column if not exists account_id text not null default ''`;
  console.log("outgoing_documents.account_id ready");
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
