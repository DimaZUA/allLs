const sql = require("../../SITE_UT/db.js");

const MINFIN_INFLATION_URL = "https://index.minfin.com.ua/economy/index/inflation/";

function monthCode(year, month) {
  return Number(year) * 12 + Number(month);
}

function monthOffsetParts(date, offset) {
  const d = date || new Date();
  const shifted = new Date(d.getFullYear(), d.getMonth() + Number(offset || 0), 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

function controlMonth(date) {
  const now = date || new Date();
  return now.getDate() <= 10 ? monthOffsetParts(now, -2) : monthOffsetParts(now, -1);
}

function parseMinfinInflationHtml(html) {
  const map = new Map();
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
    const yearCell = cells.find(cell => /^\d{4}$/.test(cell));
    if (!yearCell) continue;
    const year = Number(yearCell);
    let month = 1;
    cells.forEach(cell => {
      const num = Number(String(cell).replace(",", ".").replace(/[^\d.-]/g, ""));
      if (month <= 12 && Number.isFinite(num) && num > 0 && num < 300 && cell !== String(year)) {
        map.set(monthCode(year, month), { year, month, rate: num / 100 });
        month += 1;
      }
    });
  }
  return Array.from(map.values()).sort((a, b) => monthCode(a.year, a.month) - monthCode(b.year, b.month));
}

async function ensureTable() {
  await sql.begin(async tx => {
    await tx`
      create table if not exists public.inflation_indices (
        month_code integer primary key,
        year integer not null,
        month integer not null check (month between 1 and 12),
        rate numeric not null check (rate > 0),
        source text not null default 'minfin',
        loaded_at timestamptz not null default now(),
        unique (year, month)
      )
    `;
    await tx`alter table public.inflation_indices enable row level security`;
    await tx`grant select on public.inflation_indices to authenticated`;
    await tx`drop policy if exists inflation_indices_select_authenticated on public.inflation_indices`;
    await tx`
      create policy inflation_indices_select_authenticated on public.inflation_indices
      for select to authenticated
      using (true)
    `;
  });
}

async function main() {
  await ensureTable();
  const target = controlMonth(new Date());
  const targetCode = monthCode(target.year, target.month);
  const existing = await sql`
    select month_code
    from public.inflation_indices
    where month_code = ${targetCode}
    limit 1
  `;
  if (existing.length) {
    console.log(`inflation index ${target.year}-${String(target.month).padStart(2, "0")} already loaded`);
    return;
  }
  const response = await fetch(MINFIN_INFLATION_URL);
  if (!response.ok) throw new Error(`Minfin HTTP ${response.status}`);
  const rows = parseMinfinInflationHtml(await response.text());
  if (!rows.some(row => monthCode(row.year, row.month) === targetCode)) {
    console.log(`Minfin has no ${target.year}-${String(target.month).padStart(2, "0")} value yet`);
    return;
  }
  for (const row of rows) {
    await sql`
      insert into public.inflation_indices (month_code, year, month, rate, source, loaded_at)
      values (${monthCode(row.year, row.month)}, ${row.year}, ${row.month}, ${row.rate}, 'minfin', now())
      on conflict (month_code) do update set
        year = excluded.year,
        month = excluded.month,
        rate = excluded.rate,
        source = excluded.source,
        loaded_at = excluded.loaded_at
    `;
  }
  console.log(`inflation indices loaded: ${rows.length}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
