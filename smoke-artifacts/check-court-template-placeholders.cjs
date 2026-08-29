const sql = require("../../SITE_UT/db.js");

async function main() {
  const rows = await sql`
    select home_code, legacy_code, doc_number, body
    from public.outgoing_documents
    where is_template = true
      and legacy_code like '%court_claim%'
    order by home_code, legacy_code
  `;
  const leftovers = [];
  rows.forEach(row => {
    const matches = String(row.body || "").match(/\[[^\]]+\]/g);
    if (matches && matches.length) {
      leftovers.push({
        home_code: row.home_code,
        legacy_code: row.legacy_code,
        doc_number: row.doc_number,
        placeholders: Array.from(new Set(matches))
      });
    }
  });
  console.log(`checked templates: ${rows.length}`);
  console.log(`templates with bracket placeholders: ${leftovers.length}`);
  if (leftovers.length) console.log(JSON.stringify(leftovers.slice(0, 20), null, 2));
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
