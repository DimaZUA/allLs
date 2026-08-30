process.env.NODE_PATH = 'C:\\Dem\\Kvplat\\kvplat2024\\Files\\UT\\node_modules';
require('module').Module._initPaths();

const sql = require("../../SITE_UT/db.js");

const MINFIN_LIVING_WAGE_URL = "https://index.minfin.com.ua/labour/wagemin/";

function parseMinfinLivingWageHtml(html) {
  const rows = [];
  const rowRe = /<tr[\s\S]*?<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(String(html || "")))) {
    const row = rowMatch[0].replace(/<script[\s\S]*?<\/script>/gi, "");
    const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(m =>
      m[1]
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    const dateCell = cells.find(cell => /\d{2}\.\d{2}\.\d{4}/.test(cell));
    if (!dateCell) continue;
    const dateMatch = dateCell.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) continue;
    const amounts = cells
      .filter(cell => cell !== dateCell)
      .map(cell => Number(String(cell).replace(",", ".").replace(/[^\d.-]/g, "")))
      .filter(num => Number.isFinite(num) && num > 0);
    if (amounts.length < 4) continue;
    rows.push({
      effective_date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
      year: Number(dateMatch[3]),
      general_amount: amounts[0],
      children_under_6_amount: amounts[1] || null,
      children_6_18_amount: amounts[2] || null,
      able_bodied_amount: amounts[3] || null,
      disabled_amount: amounts[4] || null
    });
  }
  return rows.sort((a, b) => String(a.effective_date).localeCompare(String(b.effective_date)));
}

async function ensureTable() {
  await sql.begin(async tx => {
    await tx`
      create table if not exists public.living_wage_minimums (
        effective_date date primary key,
        year integer not null,
        general_amount numeric not null check (general_amount > 0),
        children_under_6_amount numeric,
        children_6_18_amount numeric,
        able_bodied_amount numeric not null check (able_bodied_amount > 0),
        disabled_amount numeric,
        source text not null default 'minfin',
        loaded_at timestamptz not null default now()
      )
    `;
    await tx`alter table public.living_wage_minimums enable row level security`;
    await tx`grant select on public.living_wage_minimums to authenticated`;
    await tx`drop policy if exists living_wage_minimums_select_authenticated on public.living_wage_minimums`;
    await tx`
      create policy living_wage_minimums_select_authenticated on public.living_wage_minimums
      for select to authenticated
      using (true)
    `;
  });
}

async function main() {
  await ensureTable();
  const response = await fetch(MINFIN_LIVING_WAGE_URL);
  if (!response.ok) throw new Error(`Minfin HTTP ${response.status}`);
  const rows = parseMinfinLivingWageHtml(await response.text());
  if (!rows.length) throw new Error("living wage rows not found");
  await sql`
    insert into public.living_wage_minimums (
      effective_date,
      year,
      general_amount,
      children_under_6_amount,
      children_6_18_amount,
      able_bodied_amount,
      disabled_amount,
      source,
      loaded_at
    )
    select
      effective_date::date,
      year,
      general_amount,
      children_under_6_amount,
      children_6_18_amount,
      able_bodied_amount,
      disabled_amount,
      'minfin',
      now()
    from jsonb_to_recordset(${sql.json(rows)}::jsonb) as x(
      effective_date text,
      year integer,
      general_amount numeric,
      children_under_6_amount numeric,
      children_6_18_amount numeric,
      able_bodied_amount numeric,
      disabled_amount numeric
    )
    on conflict (effective_date) do update set
      year = excluded.year,
      general_amount = excluded.general_amount,
      children_under_6_amount = excluded.children_under_6_amount,
      children_6_18_amount = excluded.children_6_18_amount,
      able_bodied_amount = excluded.able_bodied_amount,
      disabled_amount = excluded.disabled_amount,
      source = excluded.source,
      loaded_at = excluded.loaded_at
  `;
  console.log(`living wage minimums loaded: ${rows.length}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
