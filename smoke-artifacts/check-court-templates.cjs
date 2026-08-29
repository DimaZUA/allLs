const sql = require("../../SITE_UT/db.js");

async function main() {
  const rows = await sql`
    select home_code, legacy_code, doc_number, summary, is_template, length(body) as body_len
    from public.outgoing_documents
    where is_template = true
    order by home_code, legacy_code
  `;
  const byHome = new Map();
  rows.forEach(row => {
    const key = String(row.home_code || "");
    byHome.set(key, (byHome.get(key) || 0) + 1);
  });
  console.log(`templates: ${rows.length}`);
  console.log(`homes with templates: ${byHome.size}`);
  console.log(rows.slice(0, 20));
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
