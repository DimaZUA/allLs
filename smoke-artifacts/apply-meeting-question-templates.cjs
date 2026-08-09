const fs = require("fs");
const path = require("path");
const sql = require("../../SITE_UT/db.js");

const seedPath = path.join(__dirname, "meeting-question-templates.seed.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

async function main() {
  await sql.begin(async tx => {
    await tx`
      create table if not exists public.meeting_question_templates (
        id text primary key,
        label text not null default '',
        types jsonb not null default '[]'::jsonb,
        subject text not null default '',
        speaker text not null default '',
        discussion text not null default '',
        decision text not null default '',
        sort_order integer not null default 1000,
        is_active boolean not null default true,
        extra_fields jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await tx`
      create or replace function public.set_meeting_question_templates_updated_at()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$
    `;
    await tx`drop trigger if exists trg_meeting_question_templates_updated_at on public.meeting_question_templates`;
    await tx`
      create trigger trg_meeting_question_templates_updated_at
      before update on public.meeting_question_templates
      for each row execute function public.set_meeting_question_templates_updated_at()
    `;
    await tx`alter table public.meeting_question_templates enable row level security`;
    await tx`drop policy if exists meeting_question_templates_select on public.meeting_question_templates`;
    await tx`
      create policy meeting_question_templates_select on public.meeting_question_templates
      for select to authenticated
      using (true)
    `;
    await tx`grant select on public.meeting_question_templates to authenticated`;
  });

  for (const row of seed) {
    await sql`
      insert into public.meeting_question_templates (
        id, label, types, subject, speaker, discussion, decision,
        sort_order, is_active, extra_fields
      )
      values (
        ${row.id},
        ${row.label || ""},
        ${sql.json(row.types || [])},
        ${row.subject || ""},
        ${row.speaker || ""},
        ${row.discussion || ""},
        ${row.decision || ""},
        ${Number(row.sort_order) || 1000},
        ${row.is_active !== false},
        ${sql.json(row.extra_fields || {})}
      )
      on conflict (id) do nothing
    `;
  }

  const count = await sql`select count(*)::int as count from public.meeting_question_templates`;
  console.log(`meeting_question_templates ready, rows: ${count[0].count}`);
  await sql.end({ timeout: 5 });
}

main().catch(async err => {
  console.error(err);
  try { await sql.end({ timeout: 5 }); } catch (_) {}
  process.exit(1);
});
