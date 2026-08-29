const fs = require("fs");
const path = require("path");
const sql = require("../../SITE_UT/db.js");

const OSBB_PATH = "C:/Users/Dima.DEM/.codex/attachments/f054d3ae-eb6e-4748-b687-0efa3a2119b6/pasted-text.txt";
const COOP_PATH = "C:/Users/Dima.DEM/.codex/attachments/98f76ad5-5a89-464b-9799-8439e130b5a5/pasted-text.txt";

function readText(filePath) {
  return fs.readFileSync(path.normalize(filePath), "utf8").replace(/\r\n/g, "\n");
}

function normalizeCourtTemplate(text) {
  let out = String(text || "").replace(/\r\n/g, "\n");
  out = out.replace(/\*\*До\s+\[НАЗВА СУДУ\]\*\*/gi, "**До ____________________**");
  out = out
    .replace(/Об’єднання співвласників багатоквартирного будинку «\{org\}»/g, "{org}")
    .replace(/ОСББ «\{org\}»/g, "{org}")
    .replace(/Житловий кооператив «\{org\}»/g, "{org}")
    .replace(/Житлового кооперативу «\{org\}»/g, "{org}");
  out = out.replace(/\{adr\},\s*кв\.\s*\{kv\}/g, "{flatAddress}");
  out = out
    .replace(/\[ДАТА ПОЧАТКУ\]/gi, "{дата початку}")
    .replace(/\[ДАТА ЗАКІНЧЕННЯ\]/gi, "{дата закінчення}")
    .replace(/\[ДАТА РОЗРАХУНКУ\]/gi, "{дата розрахунку}")
    .replace(/\[ДАТА\]/gi, "{дата}")
    .replace(/\[СУМА ОСНОВНОЇ ЗАБОРГОВАНОСТІ\]/gi, "{сума основної заборгованості}")
    .replace(/\[СУМА ЗАБОРГОВАНОСТІ ЗА ТПВ\]/gi, "{сума заборгованості за тпв}")
    .replace(/\[СУМА ІНФЛЯЦІЙНИХ ВТРАТ\]/gi, "{сума інфляційних втрат}")
    .replace(/\[СУМА 3 % РІЧНИХ\]/gi, "{сума 3 % річних}")
    .replace(/\[СУМА\]/gi, "{сума}");
  out = out
    .replace(/\[АДРЕСА ОСББ\]/gi, "{адреса осбб}")
    .replace(/\[АДРЕСА КООПЕРАТИВУ\]/gi, "{адреса кооперативу}")
    .replace(/\[ТЕЛЕФОН\]/gi, "{телефон}")
    .replace(/\[E-MAIL\]/gi, "{e-mail}")
    .replace(/\[ПІБ\]/gi, "{головаFull}");
  out = out.replace(
    /відомості про наявність електронного кабінету:\s*\[___\]/gi,
    "відомості про наявність електронного кабінету: наявний"
  );
  out = out
    .replace(/^РНОКПП:\s*\[ЗА НАЯВНОСТІ\]\s*\n?/gim, "")
    .replace(/^дата народження:\s*\[ЗА НАЯВНОСТІ\]\s*\n?/gim, "")
    .replace(/^зареєстроване місце проживання:\s*\[ЗА НАЯВНОСТІ\]\s*\n?/gim, "");
  out = out.replace(
    /Рішенням загальних зборів ОСББ «\{org\}», оформленим протоколом № \*\*\[НОМЕР ПРОТОКОЛУ\]\*\* від \*\*\[ДАТА ПРОТОКОЛУ\]\*\*, затверджено розмір внесків та платежів співвласників\./gi,
    "Рішенням загальних зборів {org}, оформленим протоколом № **__________** від **__________**, затверджено розмір внесків та платежів співвласників."
  );
  out = out.replace(
    /Рішенням загальних зборів ОСББ «\{org\}», оформленим протоколом № \*\*\[НОМЕР ПРОТОКОЛУ\]\*\* від \*\*\[ДАТА ПРОТОКОЛУ\]\*\*, затверджено розмір платежу співвласників за вивезення побутових відходів\./gi,
    "Рішенням загальних зборів {org}, оформленим протоколом № **__________** від **__________**, затверджено розмір платежу співвласників за вивезення побутових відходів."
  );
  out = out.replace(
    /Рішенням загальних зборів Житлового кооперативу «\{org\}», оформленим протоколом № \*\*\[НОМЕР ПРОТОКОЛУ\]\*\* від \*\*\[ДАТА ПРОТОКОЛУ\]\*\*, затверджено розміри внесків та платежів на утримання та експлуатацію багатоквартирного будинку і прибудинкової території\./gi,
    "Рішенням загальних зборів {org}, оформленим протоколом № **__________** від **__________**, затверджено розміри внесків та платежів на утримання та експлуатацію багатоквартирного будинку і прибудинкової території."
  );
  out = out.replace(
    /Розмір платежу за вивезення побутових відходів затверджено рішенням загальних зборів Житлового кооперативу «\{org\}», оформленим протоколом № \*\*\[НОМЕР ПРОТОКОЛУ\]\*\* від \*\*\[ДАТА ПРОТОКОЛУ\]\*\*\./gi,
    "Розмір платежу за вивезення побутових відходів затверджено рішенням загальних зборів {org}, оформленим протоколом № **__________** від **__________**."
  );
  out = out.replace(
    /^При зверненні до суду [^\n]*судовий збір[^\n]*\n?/gim,
    ""
  );
  out = out
    .replace(/^\d+\.\s+\*\*Стягнути з \{fio\}[\s\S]*?судовий збір[\s\S]*?\*\*\s*$/gim, "")
    .replace(/^\d+\.\s+Документ, що підтверджує сплату судового збору\.\s*$/gim, "");
  out = out.replace(
    /\*\s+заборгованість[\s\S]*?\*\*Усього до стягнення за основними вимогами:\s*\[___\]\s*грн\.?\*\*/i,
    "{tozrahunokBorgu}"
  );
  out = out.replace(
    /# ПРОШУ СУД:\s*[\s\S]*?(?=\n## Додатки:)/i,
    "# ПРОШУ СУД:\n\n{courtClaimsRequests}\n\n"
  );
  out = out.replace(/\[[^\]]+\]/g, "");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function orgKind(value) {
  const text = String(value || "").trim().toUpperCase();
  if (text.startsWith("ОСББ")) return "osbb";
  if (text.startsWith("ЖБК") || text.startsWith("ЖК")) return "coop";
  return "coop";
}

function splitTpvSection(text) {
  const source = String(text || "").trim();
  const startRe = /^###\s+Заборгованість за вивезення побутових відходів\s*$/im;
  const startMatch = startRe.exec(source);
  if (!startMatch) return { main: source, tpv: "" };
  const before = source.slice(0, startMatch.index).trimEnd();
  const restStart = startMatch.index;
  const rest = source.slice(restStart);
  const nextRe = /\n###\s+Правові підстави[^\n]*\n/i;
  const nextMatch = nextRe.exec(rest);
  if (!nextMatch) return { main: `${before}\n\n{ТПВ}`.trim(), tpv: rest.trim() };
  const tpv = rest.slice(0, nextMatch.index).trim();
  const after = rest.slice(nextMatch.index).trimStart();
  return {
    main: `${before}\n\n{ТПВ}\n\n${after}`.trim(),
    tpv
  };
}

async function upsertTemplate(homeCode, legacyCode, docNumber, summary, body) {
  await sql`
    insert into public.outgoing_documents (
      home_code,
      doc_date,
      doc_number,
      recipient,
      summary,
      body,
      signature_text,
      account_id,
      is_draft,
      is_template,
      legacy_code
    )
    values (
      ${String(homeCode)},
      current_date,
      ${docNumber},
      '',
      ${summary},
      ${body},
      '',
      '',
      false,
      true,
      ${legacyCode}
    )
    on conflict (legacy_code) do update set
      home_code = excluded.home_code,
      doc_date = excluded.doc_date,
      doc_number = excluded.doc_number,
      recipient = excluded.recipient,
      summary = excluded.summary,
      body = excluded.body,
      signature_text = excluded.signature_text,
      account_id = excluded.account_id,
      is_draft = false,
      is_template = true
  `;
}

async function main() {
  const osbb = splitTpvSection(normalizeCourtTemplate(readText(OSBB_PATH)));
  const coop = splitTpvSection(normalizeCourtTemplate(readText(COOP_PATH)));
  const homes = await sql`
    select code, name, data->>'org' as org
    from public.homes
    order by code
  `;
  let saved = 0;
  for (const home of homes) {
    const kind = orgKind(home.org || home.name);
    const tpl = kind === "osbb" ? osbb : coop;
    const kindLabel = kind === "osbb" ? "ОСББ" : "ЖК";
    await upsertTemplate(
      home.code,
      `${home.code}:court_claim_${kind}_main`,
      `ИсковоеЗаявление${kindLabel}`,
      `ИсковоеЗаявление${kindLabel}`,
      tpl.main
    );
    saved += 1;
    if (tpl.tpv) {
      await upsertTemplate(
        home.code,
        `${home.code}:court_claim_${kind}_tpv`,
        `ИсковоеЗаявление${kindLabel}_ТПВ`,
        `ИсковоеЗаявление${kindLabel}_ТПВ`,
        tpl.tpv
      );
      saved += 1;
    }
  }
  console.log(`court claim templates saved: ${saved}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
