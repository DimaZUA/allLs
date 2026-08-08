const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const sql = require("../../SITE_UT/db.js");

const siteDir = path.resolve(__dirname, "..");
const xlsxPath = path.join(siteDir, "Письма.xlsx");
const xmlPath = path.join(siteDir, "тПисьма.xml");

function xmlDecode(value) {
  return String(value == null ? "" : value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function readXmlTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "u");
  const match = block.match(re);
  return match ? xmlDecode(match[1]) : "";
}

function normalizeDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10) || null;
}

function readXmlRows() {
  if (!fs.existsSync(xmlPath)) return null;
  const xml = fs.readFileSync(xmlPath, "utf8");
  const rows = [];
  const re = /<тПисьма>([\s\S]*?)<\/тПисьма>/gu;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const block = match[1];
    rows.push({
      legacy_code: readXmlTag(block, "КодПисьма").trim() || null,
      profile: readXmlTag(block, "Профиль").trim() || null,
      summary: readXmlTag(block, "Содержание"),
      doc_date: normalizeDate(readXmlTag(block, "Дата")),
      doc_number: readXmlTag(block, "Номер").trim(),
      recipient: readXmlTag(block, "Кому"),
      body: readXmlTag(block, "Текст")
    });
  }
  return rows;
}

function findPython() {
  const candidates = [
    process.env.PYTHON,
    "C:\\Users\\Dima.DEM\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
    "python"
  ].filter(Boolean);
  for (const p of candidates) {
  const r = spawnSync(p, ["-c", "import openpyxl, json; print('ok')"], {
    encoding: "utf8",
    env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
  });
    if (r.status === 0) return p;
  }
  throw new Error("Python with openpyxl was not found");
}

function readWorkbook() {
  if (!fs.existsSync(xlsxPath)) throw new Error(`Missing workbook: ${xlsxPath}`);
  const py = findPython();
  const code = String.raw`
import openpyxl, json, sys, datetime
p = sys.argv[1]
wb = openpyxl.load_workbook(p, data_only=True)
ws = wb.worksheets[0]
rows = list(ws.iter_rows(values_only=True))
headers = [str(x) if x is not None else "" for x in rows[0]]
out = []
for r in rows[1:]:
    if not any(c is not None and str(c).strip() for c in r):
        continue
    d = dict(zip(headers, r))
    val = d.get("Дата")
    if isinstance(val, datetime.datetime) or isinstance(val, datetime.date):
        doc_date = val.strftime("%Y-%m-%d")
    elif val:
        doc_date = str(val)[:10]
    else:
        doc_date = None
    out.append({
        "legacy_code": str(d.get("КодПисьма") or "").strip() or None,
        "home_code": str(d.get("КодДома") or "").strip(),
        "summary": str(d.get("Содержание") or ""),
        "doc_date": doc_date,
        "doc_number": str(d.get("Номер") or "").strip(),
        "recipient": str(d.get("Кому") or ""),
        "body": str(d.get("Текст") or "")
    })
print(json.dumps(out, ensure_ascii=False))
`;
  const r = spawnSync(py, ["-c", code, xlsxPath], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "Workbook read failed");
  return JSON.parse(r.stdout);
}

async function main() {
  const xmlRows = readXmlRows();
  let rows = xmlRows || readWorkbook();
  rows = rows.filter(r => r.legacy_code);
  await sql.begin(async tx => {
    await tx`create extension if not exists pgcrypto`;
    await tx`
      create table if not exists public.outgoing_documents (
        id uuid primary key default gen_random_uuid(),
        home_code text not null,
        doc_date date,
        doc_number text,
        recipient text not null default '',
        summary text not null default '',
        body text not null default '',
        signature_text text,
        is_draft boolean not null default false,
        legacy_code text unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await tx`alter table public.outgoing_documents add column if not exists signature_text text`;
    await tx`alter table public.outgoing_documents add column if not exists is_draft boolean not null default false`;
    await tx`create index if not exists outgoing_documents_home_date_idx on public.outgoing_documents (home_code, doc_date desc, doc_number)`;
    await tx`create index if not exists outgoing_documents_draft_updated_idx on public.outgoing_documents (is_draft, updated_at)`;
    await tx`
      create or replace function public.set_outgoing_documents_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$
    `;
    await tx`drop trigger if exists trg_outgoing_documents_updated_at on public.outgoing_documents`;
    await tx`
      create trigger trg_outgoing_documents_updated_at
      before update on public.outgoing_documents
      for each row execute function public.set_outgoing_documents_updated_at()
    `;
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
    await tx`alter table public.outgoing_documents enable row level security`;
    await tx`drop policy if exists outgoing_documents_select_access on public.outgoing_documents`;
    await tx`drop policy if exists outgoing_documents_insert_board on public.outgoing_documents`;
    await tx`drop policy if exists outgoing_documents_update_board on public.outgoing_documents`;
    await tx`drop policy if exists outgoing_documents_delete_board on public.outgoing_documents`;
    await tx`
      create policy outgoing_documents_select_access on public.outgoing_documents
      for select to authenticated
      using (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
        )
      )
    `;
    await tx`
      create policy outgoing_documents_insert_board on public.outgoing_documents
      for insert to authenticated
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
            and uh.role in ('Правление', 'Администратор')
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
            and uh.role in ('Правление', 'Администратор')
        )
      )
      with check (
        exists (
          select 1 from public.user_homes uh
          where uh.user_id = auth.uid()
            and uh.home_code::text = outgoing_documents.home_code
            and uh.role in ('Правление', 'Администратор')
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
            and uh.role in ('Правление', 'Администратор')
        )
      )
    `;
    await tx`grant select, insert, update, delete on public.outgoing_documents to authenticated`;
    if (rows.length) {
      if (xmlRows) {
        const textRows = rows
          .filter(row => row && row.legacy_code != null)
          .map(row => ({
            legacy_code: String(row.legacy_code),
            body: row.body == null ? "" : String(row.body)
          }));
        await tx`
          update public.outgoing_documents as od
          set body = data.body,
              updated_at = now()
          from jsonb_to_recordset(${tx.json(textRows)}::jsonb) as data(legacy_code text, body text)
          where od.legacy_code = data.legacy_code
        `;
        return;
      }
      const existing = await tx`select legacy_code, home_code from public.outgoing_documents where legacy_code is not null`;
      const homeByLegacy = new Map(existing.map(row => [String(row.legacy_code), String(row.home_code)]));
      rows = rows.map(row => ({
        ...row,
        home_code: row.home_code || homeByLegacy.get(String(row.legacy_code)) || null
      })).filter(row => row.home_code);
      await tx`
        insert into public.outgoing_documents
          ${tx(rows, "legacy_code", "home_code", "summary", "doc_date", "doc_number", "recipient", "body")}
        on conflict (legacy_code) do update set
          home_code = excluded.home_code,
          summary = excluded.summary,
          doc_date = excluded.doc_date,
          doc_number = excluded.doc_number,
          recipient = excluded.recipient,
          body = excluded.body,
          updated_at = now()
      `;
    }
  });
  const count = await sql`select count(*)::int as count from public.outgoing_documents`;
  console.log(`outgoing_documents ready, source: ${xmlRows ? "тПисьма.xml" : "Письма.xlsx"}, imported rows: ${rows.length}, table rows: ${count[0].count}`);
  await sql.end({ timeout: 5 });
}

main().catch(async err => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch (_) {}
  process.exit(1);
});
