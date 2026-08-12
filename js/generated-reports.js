// generated-reports.js
// Логіка відображення та генерації звітів, що будуються на льоту

(function () {
  "use strict";

  const REPORT_TYPES = [
    { id: "payments", title: "Реєстр платежів співвласників", fileRu: "Реестр_платежів", tabular: true },
    { id: "accountsPods", title: "Особові рахунки (по підʼїздах)", fileRu: "ОР по підїздаї", tabular: true },
    { id: "accountsDebt", title: "Особові рахунки (за боргом)", fileRu: "ОР по боргу", tabular: true },
    { id: "debtorsList", title: "Список боржників", fileRu: "Список боржників", tabular: true },
    { id: "accountsOverpay", title: "Особові рахунки з переплатою", fileRu: "ОР з переплатою", tabular: true },
    { id: "debtsPoster", title: "Борги співвласників (об'ява)", fileRu: "Борг будинку", tabular: false },
    { id: "podPoster", title: "Борги підʼїзду (об'ява)", fileRu: "Підїзд", tabular: false }
  ];

  const MONTHS_UA_UPPER = [
    "СІЧЕНЬ", "ЛЮТИЙ", "БЕРЕЗЕНЬ", "КВІТЕНЬ", "ТРАВЕНЬ", "ЧЕРВЕНЬ",
    "ЛИПЕНЬ", "СЕРПЕНЬ", "ВЕРЕСЕНЬ", "ЖОВТЕНЬ", "ЛИСТОПАД", "ГРУДЕНЬ"
  ];
  const MONTHS_UA_FULL = [
    "січень", "лютий", "березень", "квітень", "травень", "червень",
    "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"
  ];
  const MONTHS_UA_SHORT = [
    "січ", "лют", "бер", "квіт", "трав", "черв",
    "лип", "серп", "вер", "жовт", "лист", "груд"
  ];
  const MONTHS_UA_GEN = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
  ];
  const ROMAN = ["I", "II", "III", "IV"];
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  const EPS = 0.005;
  let grState = {
    selectedCodes: [],
    allHomes: false,
    selectedTypeIds: ["payments"],
    allTypes: false,
    compact: false,
    lastPages: [],
    lastMeta: null
  };

  // ===================== helpers =====================

  function money(v) {
    const n = Number(v) || 0;
    if (typeof n.toFixedWithComma === "function") return n.toFixedWithComma();
    return n.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function moneySigned(v) {
    const n = Number(v) || 0;
    const abs = money(Math.abs(n));
    if (n < -EPS) return "−" + abs;
    return abs;
  }

  function excelNumberAttr(v) {
    const n = Number(v) || 0;
    return `data-gr-number="${String(n)}"`;
  }

  function amountCell(v, html, className) {
    const cls = ["gr-amount-cell", className || ""].filter(Boolean).join(" ");
    return `<td class="${cls}" ${excelNumberAttr(v)}>${html == null ? money(v) : html}</td>`;
  }

  function amountSpan(v, html, className) {
    const cls = ["gr-amount", className || ""].filter(Boolean).join(" ");
    return `<span class="${cls}" ${excelNumberAttr(v)}>${html == null ? money(v) : html}</span>`;
  }

  function apartmentHtml(kv) {
    return `<span class="gr-apt-no">${escapeHtml(kv)}</span>`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatHeaderAddress(str) {
    return String(str ?? "")
      .replace(/\s+(?=р[-\u2011]н(?:[\s,.;:]|$))/giu, "\u00a0")
      .replace(/(^|[\s,.;:])(проїзд)\s+/giu, "$1$2\u00a0")
      .replace(/-/g, "\u2011");
  }

  function parseKvNum(kv) {
    const m = String(kv ?? "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function monthStart(year, month) {
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
  }

  function monthEnd(year, month) {
    return new Date(year, month, 0, 12);
  }

  function ymKey(year, month) {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  function parseYm(value) {
    const [y, m] = String(value || "").split("-").map(Number);
    if (!y || !m) return null;
    return { year: y, month: m };
  }

  function listMonthsInRange(fromYm, toYm) {
    const res = [];
    let y = fromYm.year;
    let m = fromYm.month;
    while (y < toYm.year || (y === toYm.year && m <= toYm.month)) {
      res.push({ year: y, month: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return res;
  }

  function describePeriod(fromYm, toYm) {
    const sameYear = fromYm.year === toYm.year;
    const sameMonth = sameYear && fromYm.month === toYm.month;
    const fm = fromYm.month;
    const tm = toYm.month;

    if (sameMonth) {
      return {
        kind: "month",
        file: `${MONTHS_UA_SHORT[fm - 1]} ${fromYm.year}`,
        header: `${MONTHS_UA_UPPER[fm - 1]} ${fromYm.year} р.`,
        subtitle: `за ${MONTHS_UA_FULL[fm - 1]} ${fromYm.year} року`
      };
    }

    if (sameYear && fm === 1 && tm === 12) {
      return {
        kind: "year",
        file: String(fromYm.year),
        header: `${fromYm.year} рік`,
        subtitle: `за ${fromYm.year} рік`
      };
    }

    if (sameYear) {
      const quarters = { "1-3": 1, "4-6": 2, "7-9": 3, "10-12": 4 };
      const qKey = `${fm}-${tm}`;
      if (quarters[qKey]) {
        const r = ROMAN[quarters[qKey] - 1];
        return {
          kind: "quarter",
          file: `${r} кв ${fromYm.year}`,
          header: `${r} квартал ${fromYm.year}`,
          subtitle: `за ${r} квартал ${fromYm.year} року`
        };
      }
      if (fm === 1 && tm === 6) {
        return {
          kind: "half",
          file: `I пг ${fromYm.year}`,
          header: `I півріччя ${fromYm.year}`,
          subtitle: `за I півріччя ${fromYm.year} року`
        };
      }
      if (fm === 7 && tm === 12) {
        return {
          kind: "half",
          file: `II пг ${fromYm.year}`,
          header: `II півріччя ${fromYm.year}`,
          subtitle: `за II півріччя ${fromYm.year} року`
        };
      }
      return {
        kind: "rangeSameYear",
        file: `${MONTHS_UA_SHORT[fm - 1]}-${MONTHS_UA_SHORT[tm - 1]} ${fromYm.year}`,
        header: `${MONTHS_UA_FULL[fm - 1]}-${MONTHS_UA_FULL[tm - 1]} ${fromYm.year}`,
        subtitle: `за ${MONTHS_UA_FULL[fm - 1]}-${MONTHS_UA_FULL[tm - 1]} ${fromYm.year} року`
      };
    }

    // cross-year
    if (fm === 1 && tm === 12) {
      return {
        kind: "years",
        file: `${fromYm.year}-${toYm.year}`,
        header: `${fromYm.year}-${toYm.year} роки`,
        subtitle: `за ${fromYm.year}-${toYm.year} роки`
      };
    }

    return {
      kind: "rangeCross",
      file: `${MONTHS_UA_SHORT[fm - 1]} ${fromYm.year}-${MONTHS_UA_SHORT[tm - 1]} ${toYm.year}`,
      header: `${MONTHS_UA_FULL[fm - 1]} ${fromYm.year} — ${MONTHS_UA_FULL[tm - 1]} ${toYm.year}`,
      subtitle: `за період ${MONTHS_UA_FULL[fm - 1]} ${fromYm.year} — ${MONTHS_UA_FULL[tm - 1]} ${toYm.year}`
    };
  }

  function periodLabel(fromYm, toYm) {
    return describePeriod(fromYm, toYm).header;
  }

  function periodSubtitle(fromYm, toYm) {
    return describePeriod(fromYm, toYm).subtitle;
  }

  function periodFilePart(fromYm, toYm) {
    return describePeriod(fromYm, toYm).file;
  }

  function russianHomesWord(n) {
    const abs = Math.abs(n) % 100;
    const d = abs % 10;
    if (abs > 10 && abs < 20) return "домов";
    if (d === 1) return "Дом";
    if (d >= 2 && d <= 4) return "Дома";
    return "домов";
  }

  function homesFilePrefix(codes) {
    const list = availableHomes();
    const selected = (codes || []).map(c => list.find(h => String(h.code) === String(c))).filter(Boolean);
    if (!selected.length) return "Звіт";
    if (grState.allHomes || (list.length > 1 && selected.length === list.length)) return "ВСЕ";
    if (selected.length === 1) {
      return String(selected[0].org3 || selected[0].name || selected[0].code).trim() || "Дім";
    }
    return `${selected.length} ${russianHomesWord(selected.length)}`;
  }

  function sanitizeFilePart(text) {
    return String(text || "")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildDownloadBaseName(typeId, fromYm, toYm, codes) {
    const type = typeId === "__MULTI__"
      ? { fileRu: "Звіти" }
      : REPORT_TYPES.find(t => t.id === typeId);
    const parts = [
      sanitizeFilePart(homesFilePrefix(codes)),
      sanitizeFilePart(periodFilePart(fromYm, toYm)),
      sanitizeFilePart((type && type.fileRu) || typeId)
    ];
    return parts.join("_");
  }

  function mmToPx(mm) {
    return (mm * 96) / 25.4;
  }

  function shortDate(d) {
    const day = d.getDate();
    return `${day} ${MONTHS_UA_GEN[d.getMonth()]} ${d.getFullYear()} р.`;
  }

  function endOfMonthLabel(year, month) {
    const last = new Date(year, month, 0).getDate();
    return `${String(last).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
  }

  function startOfMonthLabel(year, month) {
    return `01.${String(month).padStart(2, "0")}.${String(year).slice(-2)}`;
  }

  function startOfMonthLabelFull(year, month) {
    return `01.${String(month).padStart(2, "0")}.${year}`;
  }

  function endOfMonthLabelShort(year, month) {
    const last = new Date(year, month, 0).getDate();
    return `${String(last).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(year).slice(-2)}`;
  }

  function defaultPeriod() {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth() + 1;
    if (now.getDate() <= 10) {
      m -= 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
    }
    const v = ymKey(y, m);
    return { from: v, to: v };
  }

  function splitIntoColumns(items, cols) {
    const n = Math.max(1, cols | 0);
    const out = Array.from({ length: n }, () => []);
    items.forEach((item, i) => out[i % n].push(item));
    // redistribute by chunk for better visual balance
    const size = Math.ceil(items.length / n);
    const balanced = Array.from({ length: n }, () => []);
    items.forEach((item, i) => {
      const col = Math.min(n - 1, Math.floor(i / size));
      balanced[col].push(item);
    });
    return balanced;
  }

  function splitIntoWeightedColumns(items, cols, weightFn) {
    const n = Math.max(1, cols | 0);
    const source = items || [];
    const result = [];
    const weights = source.map(item => Math.max(0.1, Number(weightFn(item)) || 1));
    let index = 0;
    let remainingWeight = weights.reduce((sum, v) => sum + v, 0);

    for (let col = 0; col < n; col += 1) {
      const remainingCols = n - col;
      const chunk = [];
      let chunkWeight = 0;
      if (remainingCols === 1) {
        result.push(source.slice(index));
        index = source.length;
        break;
      }
      const target = remainingWeight / remainingCols;
      while (index < source.length) {
        const itemWeight = weights[index];
        const itemsAfter = source.length - index - 1;
        if (chunk.length && chunkWeight + itemWeight > target && itemsAfter >= remainingCols - 1) break;
        chunk.push(source[index]);
        chunkWeight += itemWeight;
        index += 1;
        if (source.length - index <= remainingCols - 1) break;
      }
      result.push(chunk);
      remainingWeight -= chunkWeight;
    }

    while (result.length < n) result.push([]);
    return result;
  }

  function debtGridHtml(debtors, cols) {
    if (!debtors.length) return `<div class="gr-muted">Немає квартир із боргом понад 6 місяців.</div>`;
    const columns = splitIntoColumns(debtors, cols).filter(col => col.length);
    return `<div class="gr-debt-grid">${columns.map(col => {
      const rows = col.map(d =>
        `<div class="gr-debt-pill"><span class="gr-debt-kv">${apartmentHtml(d.kv)}</span><span class="gr-debt-amt" ${excelNumberAttr(d.amount)}>${money(d.amount)}</span></div>`
      ).join("");
      return `<div class="gr-debt-col"><div class="gr-debt-list">${rows}</div></div>`;
    }).join("")}</div>`;
  }

  function debtGridBlocks(debtors, cols, rowsPerBlock) {
    const blocks = [];
    const size = Math.max(cols, (rowsPerBlock | 0) || cols * 4);
    for (let i = 0; i < debtors.length; i += size) {
      blocks.push(debtGridHtml(debtors.slice(i, i + size), cols));
    }
    if (!blocks.length) blocks.push(debtGridHtml([], cols));
    return blocks;
  }

  function podDebtGridHtml(debtors, cols) {
    if (!debtors.length) return `<div class="gr-muted">Немає квартир із боргом понад 6 місяців.</div>`;
    const columns = splitIntoColumns(debtors, cols).filter(col => col.length);
    return `<div class="gr-debt-grid">${columns.map(col => {
      const rows = col.map(d =>
        `<div class="gr-debt-pill"><span class="gr-debt-kv">${apartmentHtml(d.kv)}</span><span class="gr-debt-amt" ${excelNumberAttr(d.amount)}>${money(d.amount)}</span></div>`
      ).join("");
      return `<div class="gr-debt-col"><div class="gr-debt-list">${rows}</div></div>`;
    }).join("")}</div>`;
  }

  function podDebtGridBlocks(debtors, cols, rowsPerBlock) {
    const blocks = [];
    const size = Math.max(cols, (rowsPerBlock | 0) || cols * 4);
    for (let i = 0; i < debtors.length; i += size) {
      blocks.push(podDebtGridHtml(debtors.slice(i, i + size), cols));
    }
    if (!blocks.length) blocks.push(podDebtGridHtml([], cols));
    return blocks;
  }

  function collectPayments(oplatSrc, lsSrc, start, end) {
    const list = [];
    for (const accountId in oplatSrc) {
      const meta = lsSrc[accountId] || {};
      for (const year in oplatSrc[accountId]) {
        for (const month in oplatSrc[accountId][year]) {
          const date = new Date(year, month - 1, 1, 12);
          if (date < start || date > end) continue;
          const arr = oplatSrc[accountId][year][month] || [];
          arr.forEach(p => {
            list.push({
              accountId,
              kv: meta.kv,
              fio: meta.fio || "",
              date: p.date || "",
              sum: Number(p.sum) || 0,
              kvit: p.kvit || "",
              nazn: p.nazn || ""
            });
          });
        }
      }
    }
    list.sort((a, b) => {
      const ka = parseKvNum(a.kv);
      const kb = parseKvNum(b.kv);
      if (ka !== kb) return ka - kb;
      const da = a.date.split(".").reverse().join("-");
      const db = b.date.split(".").reverse().join("-");
      return da.localeCompare(db);
    });
    return list;
  }

  function groupPaymentsByApartment(payments) {
    const map = new Map();
    payments.forEach(p => {
      const key = String(p.kv);
      if (!map.has(key)) {
        map.set(key, { kv: p.kv, fio: p.fio, payments: [], total: 0 });
      }
      const g = map.get(key);
      g.payments.push(p);
      g.total += p.sum;
      if (!g.fio && p.fio) g.fio = p.fio;
    });
    return Array.from(map.values());
  }

  function collectPlatSpendingRows(platSrc, whatSrc, year, month) {
    const rows = Array.isArray(platSrc?.[year]?.[month]) ? platSrc[year][month] : [];
    const byPurpose = new Map();
    rows.forEach(payment => {
      if (!Array.isArray(payment)) return;
      const credit = String(payment[6] || "");
      const debit = String(payment[7] || "");
      if (!/^31\d*/.test(credit)) return;
      if (/^31\d*/.test(debit)) return;
      const amount = Number(payment[1]);
      if (!Number.isFinite(amount) || Math.abs(amount) <= EPS) return;
      const purposeCode = String(payment[3] == null ? "" : payment[3]);
      const name = String((whatSrc && whatSrc[purposeCode]) || "").trim() || `Послуга ${purposeCode || "без коду"}`;
      const key = purposeCode || name;
      const item = byPurpose.get(key) || { id: key, name, amount: 0 };
      item.amount += Math.abs(amount);
      byPurpose.set(key, item);
    });
    const resultRows = [...byPurpose.values()];
    return {
      rows: resultRows,
      total: resultRows.reduce((sum, r) => sum + Math.abs(r.amount), 0)
    };
  }

  function collectSpendingRows(rawSpending, year, month, options) {
    const payload = typeof parseSpendingPayload === "function"
      ? parseSpendingPayload(rawSpending)
      : { dict: {}, data: {} };
    const entries = typeof getSpendingMonthEntries === "function"
      ? getSpendingMonthEntries(payload.data, year, month)
      : [];
    const rows = [];
    let total = 0;
    entries.forEach(entry => {
      if (!Array.isArray(entry) || entry.length < 2) return;
      const idKey = String(entry[0] == null ? "" : entry[0]);
      const amount = Number(entry[1]);
      if (!Number.isFinite(amount)) return;
      const name = String(payload.dict[idKey] || "").trim() || `Категорія ${idKey}`;
      let suffix = "";
      if (typeof decodeStoredMonth === "function") {
        const posted = decodeStoredMonth(entry[2]);
        if (posted && posted.month && posted.month !== Number(month) && posted.month > 1) {
          const short = typeof spendingMonthShortLabel === "function"
            ? spendingMonthShortLabel(posted.month)
            : String(posted.month);
          suffix = ` за ${short}`;
        }
      }
      rows.push({ id: idKey, name: name + suffix, amount });
      total += amount;
    });
    if (!rows.length && options && options.plat) {
      return collectPlatSpendingRows(options.plat, options.what, year, month);
    }
    return { rows, total: Math.abs(total) };
  }

  function averageMonthlySpending(rawSpending, months, options) {
    const totals = [];
    months.forEach(({ year, month }) => {
      const { total } = collectSpendingRows(rawSpending, year, month, options);
      if (total > EPS) totals.push(total);
    });
    if (!totals.length) return 0;
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  function prepareHomeNach(home) {
    if (typeof fillMissingDates === "function") fillMissingDates(home.nach);
  }

  function sumAccountTargetCharges(srcNach, accountId, start, end) {
    let total = 0;
    const byYear = srcNach && srcNach[accountId];
    if (!byYear) return total;
    for (const year in byYear) {
      for (const month in byYear[year]) {
        const date = new Date(year, month - 1, 1, 12);
        if (date < start || date > end) continue;
        const byService = byYear[year][month] || {};
        total += Number(byService[10] || byService["10"] || 0) || 0;
      }
    }
    return total;
  }

  function collectTargetContributionNotes(home, fromYm, toYm) {
    const rows = Array.isArray(window.tarifs)
      ? window.tarifs
      : (window.tarifs && typeof window.tarifs === "object" ? Object.values(window.tarifs) : []);
    const fromKey = fromYm.year * 12 + fromYm.month;
    const toKey = toYm.year * 12 + toYm.month;
    const notes = [];
    rows.forEach(row => {
      if (!row || typeof row !== "object") return;
      if (String(row.us || "").trim() !== "10") return;
      const year = Number(row.year);
      const month = Number(row.month);
      const key = year * 12 + month;
      if (!Number.isFinite(key) || key < fromKey || key > toKey) return;
      const rawNote = String(row.note || "").trim().replace(/\s+/g, " ");
      const note = rawNote || "цільовий внесок";
      const amount = Number(row.tarif);
      const amountText = Number.isFinite(amount) && amount > 0 ? ` в розмірі ${money(amount)} грн` : "";
      const label = `${MONTHS_UA_FULL[month - 1] || String(month)} ${year} р.: ${note}${amountText}`;
      if (!notes.includes(label)) notes.push(label);
    });
    return notes;
  }

  function buildHomeSnapshot(home, homeMeta, fromYm, toYm) {
    const start = monthStart(fromYm.year, fromYm.month);
    const end = monthEnd(toYm.year, toYm.month);
    prepareHomeNach(home);
    const accounts = collectAccountsPeriodData(start, end, {
      ls: home.ls,
      nach: home.nach,
      oplat: home.oplat
    }).map(a => ({
      ...a,
      targetChargesSum: sumAccountTargetCharges(home.nach, a.accountId, start, end),
      regularChargesSum: a.chargesSum - sumAccountTargetCharges(home.nach, a.accountId, start, end),
      tel: (home.ls && home.ls[a.accountId] && home.ls[a.accountId].tel) || "",
      email: (home.ls && home.ls[a.accountId] && home.ls[a.accountId].email) || "",
      note: (home.ls && home.ls[a.accountId] && home.ls[a.accountId].note) || ""
    }));
    const payments = collectPayments(home.oplat || {}, home.ls || {}, start, end);
    const months = listMonthsInRange(fromYm, toYm);
    const spendingByMonth = months.map(m => ({
      ...m,
      ...collectSpendingRows(home.spending, m.year, m.month, { plat: home.plat, what: home.what })
    }));
    const avgSpend = averageMonthlySpending(home.spending, months, { plat: home.plat, what: home.what });

    const positiveDebt = accounts.filter(a => a.debitEnd > EPS);
    const overpay = accounts.filter(a => a.debitEnd < -EPS);
    const longDebt = accounts.filter(a => a.debitEnd > EPS && a.debtMonths > 3);
    const totalPositiveDebt = positiveDebt.reduce((s, a) => s + a.debitEnd, 0);
    const totalArea = accounts.reduce((s, a) => s + (a.pl || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + p.sum, 0);
    const totalCharges = accounts.reduce((s, a) => s + a.chargesSum, 0);
    const netDebt = accounts.reduce((s, a) => s + a.debitEnd, 0);

    return {
      homeCode: homeMeta.code,
      homeName: home.org || homeMeta.name || "",
      org3: homeMeta.org3 || home.org3 || "",
      address: homeMeta.adr || homeMeta.address || home.adr || home.adrfull || home.adrlong || "",
      edrpou: home.code || home.okpo || homeMeta.okpo || homeMeta.code || "",
      fromYm,
      toYm,
      start,
      end,
      accounts,
      payments,
      paymentGroups: groupPaymentsByApartment(payments),
      spendingByMonth,
      targetContributionNotes: collectTargetContributionNotes(home, fromYm, toYm),
      avgSpend,
      stats: {
        apartments: accounts.length,
        totalArea,
        payers: groupPaymentsByApartment(payments).length,
        paymentCount: payments.length,
        totalPaid,
        totalCharges,
        netDebt,
        totalPositiveDebt,
        debtors: positiveDebt.length,
        overpayCount: overpay.length,
        longDebtCount: longDebt.length,
        debtRatio: avgSpend > EPS ? totalPositiveDebt / avgSpend : 0
      }
    };
  }

  // ===================== renderers =====================

  function renderPageChrome(snap, title, subtitleHtml, continued) {
    const cont = continued ? `<span class="gr-continued">(продовження)</span>` : "";
    const brandName = snap.homeName || snap.homeCode || "";
    const details = [
      snap.address ? `<div>${escapeHtml(formatHeaderAddress(snap.address))}</div>` : "",
      snap.edrpou ? `<div>Код ЄДРПОУ: ${escapeHtml(snap.edrpou)}</div>` : ""
    ].filter(Boolean).join("");
    const period = periodLabel(snap.fromYm, snap.toYm);
    return `
      <div class="gr-report-head ${continued ? "gr-report-head-compact" : ""}">
        <div class="gr-report-brand">
          <img class="gr-report-logo" src="img/logo.png" alt="">
          <div>
            <div class="gr-report-org">${escapeHtml(brandName)}</div>
            ${continued ? "" : `<div class="gr-report-details">${details}</div>`}
          </div>
        </div>
        <div class="gr-report-titlebox">
          <h1 class="gr-title">${escapeHtml(title)}</h1>
          <div class="gr-report-period">${cont}${cont ? `<span class="gr-report-period-gap"></span>` : ""}<span>${escapeHtml(period)}</span></div>
        </div>
      </div>
      ${continued ? "" : (subtitleHtml || "")}
    `;
  }

  function renderFooter(pageIndex, pageCount) {
    return `
      <div class="gr-footer">
        <span>${escapeHtml(shortDate(new Date()))}</span>
        <span>Облік житлово-комунальних послуг</span>
        <span class="gr-page-num">Сторінка ${pageIndex} з ${pageCount}</span>
      </div>
    `;
  }

  function wrapSheet(topHtml, bodyHtml, footerHtml, className, attrs) {
    const attrStr = attrs
      ? Object.entries(attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join("")
      : "";
    return `
      <div class="gr-sheet-wrap">
        <section class="gr-sheet ${className || ""}"${attrStr}>
          <div class="gr-sheet-inner">
            <div class="gr-sheet-top">${topHtml || ""}</div>
            <div class="gr-sheet-body">${bodyHtml || ""}</div>
            ${footerHtml || ""}
          </div>
        </section>
      </div>
    `;
  }

  function singleHomeFilePrefix(homeMeta) {
    return sanitizeFilePart(String((homeMeta && (homeMeta.org3 || homeMeta.name || homeMeta.code)) || "Дім").trim()) || "Дім";
  }

  function sheetNameFromSnap(snap) {
    return [
      singleHomeFilePrefix({
        org3: snap.org3,
        name: snap.homeName,
        code: snap.homeCode
      }),
      sanitizeFilePart(periodFilePart(snap.fromYm, snap.toYm))
    ].join("_");
  }

  function uniqueExcelSheetName(base, used) {
    let name = String(base || "Аркуш").replace(/[\\/*?:\[\]]/g, " ").trim();
    if (name.length > 31) name = name.slice(0, 31).trim();
    if (!name) name = "Аркуш";
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      return name;
    }
    let i = 2;
    while (i < 1000) {
      const suffix = ` ${i}`;
      const cut = Math.max(1, 31 - suffix.length);
      const candidate = `${name.slice(0, cut).trim()}${suffix}`;
      if (!used.has(candidate.toLowerCase())) {
        used.add(candidate.toLowerCase());
        return candidate;
      }
      i += 1;
    }
    const fallback = `Аркуш ${used.size + 1}`;
    used.add(fallback.toLowerCase());
    return fallback;
  }

  function excelCellValueFromElement(el) {
    const numberEl = el && (el.hasAttribute("data-gr-number") ? el : el.querySelector("[data-gr-number]"));
    if (numberEl) {
      const n = Number(numberEl.getAttribute("data-gr-number"));
      if (Number.isFinite(n)) return n;
    }
    return el ? el.innerText.replace(/\s+/g, " ").trim() : "";
  }

  function paymentBlockHtml(g) {
    const head = `<div class="gr-pay-apt"><span class="gr-pay-fio">${escapeHtml(g.fio)}</span></div>`;
    const lines = g.payments.map((p, idx) =>
      `<div class="gr-pay-line">${idx === 0 ? apartmentHtml(g.kv) : "<span></span>"}<span class="gr-pay-date">${escapeHtml(p.date)}</span>${amountSpan(p.sum, money(p.sum), "gr-pay-sum")}</div>`
    ).join("");
    const total = g.payments.length > 1
      ? `<div class="gr-pay-total"><span></span><span class="gr-pay-date">Разом</span>${amountSpan(g.total, money(g.total), "gr-pay-sum")}</div>`
      : "";
    return `<div class="gr-pay-block">${head}${lines}${total}</div>`;
  }

  function estimatePaymentGroupWeight(g) {
    const nameLines = Math.max(1, Math.ceil(String(g.fio || "").length / 31));
    const paymentCount = Array.isArray(g.payments) ? g.payments.length : 0;
    const weight = nameLines + paymentCount + (paymentCount > 1 ? 1 : 0) + 0.7;
    return grState.compact ? weight * 0.78 : weight;
  }

  function payGridHtml(groups) {
    const cols = splitIntoWeightedColumns(groups, 3, estimatePaymentGroupWeight);
    return `<div class="gr-pay-grid">${cols.map(col =>
      `<div class="gr-pay-col">${col.map(paymentBlockHtml).join("")}</div>`
    ).join("")}</div>`;
  }

  function paymentsSummaryHtml(snap, options) {
    const opts = options || {};
    const groups = snap.paymentGroups;
    const pays = snap.payments;
    const amounts = pays.map(p => p.sum);
    const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const maxP = amounts.length ? Math.max(...amounts) : 0;
    const minP = amounts.length ? Math.min(...amounts) : 0;
    const allKvs = new Set(snap.accounts.map(a => String(a.kv)));
    const paidKvs = new Set(groups.map(g => String(g.kv)));
    const withoutPay = [...allKvs].filter(k => !paidKvs.has(k)).length;
    const multi = groups.filter(g => g.payments.length >= 2).length;
    return `
      <div class="gr-kpi-row">
        <div class="gr-kpi"><div class="gr-kpi-label">Надійшло платежів</div><div class="gr-kpi-value">${snap.stats.paymentCount} платежі</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Платників</div><div class="gr-kpi-value">${snap.stats.payers} квартир</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Загальна сума</div><div class="gr-kpi-value">${money(snap.stats.totalPaid)} грн</div></div>
      </div>
      ${opts.hideDetails ? "" : `<div class="gr-stat-boxes">
        <div class="gr-stat-box">
          <div class="gr-stat-box-title">СТАТИСТИКА ПО ПЛАТЕЖАХ</div>
          <div class="gr-dotted"><span>Платників</span><span>${snap.stats.payers} квартир</span></div>
          <div class="gr-dotted"><span>Платежів</span><span>${snap.stats.paymentCount}</span></div>
          <div class="gr-dotted"><span>Квартир без платежів</span><span>${withoutPay}</span></div>
          <div class="gr-dotted"><span>Квартир з 2+ платежами</span><span>${multi}</span></div>
        </div>
        <div class="gr-stat-box">
          <div class="gr-stat-box-title">ФІНАНСОВІ ПОКАЗНИКИ</div>
          <div class="gr-dotted"><span>Загальна сума</span><span>${money(snap.stats.totalPaid)} грн</span></div>
          <div class="gr-dotted"><span>Середній платіж</span><span>${money(avg)} грн</span></div>
          <div class="gr-dotted"><span>Найбільший платіж</span><span>${money(maxP)} грн</span></div>
          <div class="gr-dotted"><span>Найменший платіж</span><span>${money(minP)} грн</span></div>
        </div>
      </div>`}
    `;
  }

  function createMeasureHost() {
    let host = document.getElementById("gr-measure-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "gr-measure-host";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }
    host.classList.toggle("gr-compact-output", !!grState.compact);
    host.innerHTML = "";
    return host;
  }

  function measureSheetOverflow(topHtml, bodyHtml) {
    const host = createMeasureHost();
    host.innerHTML = wrapSheet(topHtml, bodyHtml, renderFooter(1, 1), "");
    const body = host.querySelector(".gr-sheet-body");
    const ok = body ? body.scrollHeight <= body.clientHeight + 2 : true;
    host.innerHTML = "";
    return { ok };
  }

  const imageDataUrlCache = new Map();

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  }

  async function imageSrcToDataUrl(src) {
    const url = new URL(src, document.baseURI).href;
    if (url.startsWith("data:")) return url;
    if (imageDataUrlCache.has(url)) return imageDataUrlCache.get(url);
    const promise = fetch(url, { cache: "force-cache" })
      .then(resp => {
        if (!resp.ok) throw new Error(`Image load failed: ${resp.status}`);
        return resp.blob();
      })
      .then(blobToDataUrl);
    imageDataUrlCache.set(url, promise);
    return promise;
  }

  async function prepareImagesForCanvas(root, options) {
    const dropImages = !!(options && options.dropImages);
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(imgs.map(async img => {
      if (dropImages) {
        img.setAttribute("data-html2canvas-ignore", "true");
        return;
      }
      const src = img.currentSrc || img.getAttribute("src");
      if (!src) return;
      try {
        img.src = await imageSrcToDataUrl(src);
        img.removeAttribute("srcset");
        img.crossOrigin = "anonymous";
      } catch (err) {
        console.warn("Не вдалося підготувати зображення для PDF", src, err);
        img.setAttribute("data-html2canvas-ignore", "true");
      }
    }));
  }

  async function captureSheetCanvas(sheetEl, options) {
    const host = document.createElement("div");
    host.className = "gr-pdf-capture-host";
    host.setAttribute("aria-hidden", "true");
    const clone = sheetEl.cloneNode(true);
    await prepareImagesForCanvas(clone, options);
    host.appendChild(clone);
    document.body.appendChild(host);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        logging: false
      });
    } finally {
      host.remove();
    }
  }

  async function captureSheetDataUrl(sheetEl, type, quality) {
    let canvas = await captureSheetCanvas(sheetEl);
    try {
      return canvas.toDataURL(type, quality);
    } catch (err) {
      if (!(err && err.name === "SecurityError")) throw err;
      console.warn("Canvas заблоковано через зовнішнє зображення, повторюю PDF-захоплення без картинок", err);
      canvas = await captureSheetCanvas(sheetEl, { dropImages: true });
      return canvas.toDataURL(type, quality);
    }
  }

  function packGroupsIntoPages(snap, title) {
    function buildPages(hideDetails) {
      const groups = snap.paymentGroups.slice();
      const subtitle = "";
      const pages = [];
      let offset = 0;
      let pageNo = 0;

      if (!groups.length) {
        return pages;
      }

      while (offset < groups.length) {
        const isFirst = pageNo === 0;
        const top = renderPageChrome(snap, title, subtitle, !isFirst);
        const prefix = isFirst ? paymentsSummaryHtml(snap, { hideDetails }) : "";
        let low = 1;
        let high = groups.length - offset;
        let best = 1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const chunk = groups.slice(offset, offset + mid);
          const body = prefix + payGridHtml(chunk);
          if (measureSheetOverflow(top, body).ok) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        if (best < 1) best = 1;
        if (isFirst && !measureSheetOverflow(top, prefix + payGridHtml(groups.slice(offset, offset + best))).ok) {
          if (prefix && measureSheetOverflow(top, prefix).ok && !measureSheetOverflow(top, prefix + payGridHtml(groups.slice(offset, offset + 1))).ok) {
            pages.push({ top, body: prefix });
            pageNo += 1;
            continue;
          }
        }

        const chunk = groups.slice(offset, offset + best);
        pages.push({ top, body: prefix + payGridHtml(chunk) });
        offset += best;
        pageNo += 1;
        if (pageNo > 200) break;
      }
      return pages;
    }

    const fullPages = buildPages(false);
    const compactPages = buildPages(true);
    return compactPages.length < fullPages.length ? compactPages : fullPages;
  }

  function packTableRowsIntoPages(snap, title, subtitleHtml, theadHtml, rowHtmlList, afterFirstHtml, options) {
    const opts = options || {};
    const pages = [];
    let offset = 0;
    let pageNo = 0;
    const firstPrefixHtml = opts.firstPrefixHtml || "";
    const suffixMode = opts.suffixMode || "last";
    const skipOrphanSuffix = !!opts.skipOrphanSuffix;
    const tableClass = opts.tableClass || "";
    const autoDropBlocks = opts.autoDropBlocks !== false && !opts._packingWithoutBlocks;
    const makeTable = (rowsHtml) =>
      `<table class="gr-table ${escapeHtml(tableClass)}"><thead>${theadHtml}</thead><tbody>${rowsHtml}</tbody></table>`;

    if (!rowHtmlList.length) {
      pages.push({
        top: renderPageChrome(snap, title, subtitleHtml, false),
        body: firstPrefixHtml + makeTable("") + (afterFirstHtml || "")
      });
      return pages;
    }

    while (offset < rowHtmlList.length) {
      const isFirst = pageNo === 0;
      const top = renderPageChrome(snap, title, subtitleHtml, !isFirst);
      const prefix = isFirst ? firstPrefixHtml : "";
      const suffix = suffixMode === "first" && isFirst ? (afterFirstHtml || "") : "";
      let low = 1;
      let high = rowHtmlList.length - offset;
      let best = 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const rowsHtml = rowHtmlList.slice(offset, offset + mid).join("");
        if (measureSheetOverflow(top, prefix + makeTable(rowsHtml) + suffix).ok) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (best < 1) best = 1;
      if (
        best > 1 &&
        offset + best < rowHtmlList.length &&
        /class=["'][^"']*\bgr-(?:group|pod)-head\b/.test(rowHtmlList[offset + best - 1])
      ) {
        best -= 1;
      }
      let rowsHtml = rowHtmlList.slice(offset, offset + best).join("");
      if (!measureSheetOverflow(top, prefix + makeTable(rowsHtml) + suffix).ok && best > 1) {
        best -= 1;
        rowsHtml = rowHtmlList.slice(offset, offset + best).join("");
      }
      pages.push({ top, body: prefix + makeTable(rowsHtml) + suffix });
      offset += best;
      pageNo += 1;
      if (pageNo > 300) break;
    }

    if (afterFirstHtml && suffixMode !== "first") {
      const last = pages[pages.length - 1];
      if (last && measureSheetOverflow(last.top, last.body + afterFirstHtml).ok) {
        last.body += afterFirstHtml;
      } else if (!skipOrphanSuffix && !autoDropBlocks) {
        pages.push({
          top: renderPageChrome(snap, title, subtitleHtml, true),
          body: afterFirstHtml
        });
      }
    }
    if (autoDropBlocks && firstPrefixHtml && rowHtmlList.length) {
      const withoutPrefix = packTableRowsIntoPages(snap, title, subtitleHtml, theadHtml, rowHtmlList, afterFirstHtml, Object.assign({}, opts, {
        firstPrefixHtml: "",
        _packingWithoutBlocks: true
      }));
      if (withoutPrefix.length < pages.length) return withoutPrefix;
    }
    return pages;
  }

  function renderPageActionsHtml(pageIndex) {
    return `
      <div class="gr-page-actions no-print">
        <button type="button" class="gr-page-action" data-gr-copy-page="${pageIndex}" title="Копіювати сторінку як картинку">
          <img src="img/screenshot.png" alt="">
        </button>
        <button type="button" class="gr-page-action" data-gr-share-page="${pageIndex}" title="Поділитися сторінкою">
          <img src="img/share.png" alt="">
        </button>
      </div>
    `;
  }

  function pagesToSheetsHtml(pages, snap) {
    const total = pages.length || 1;
    const sheetName = snap ? sheetNameFromSnap(snap) : "";
    return pages.map((p, i) => {
      const sheet = wrapSheet(
        p.top,
        p.body,
        renderFooter(i + 1, total),
        p.className || "",
        sheetName ? { "data-gr-sheet": sheetName } : null
      );
      return sheet.replace(/\s*<\/div>\s*$/, `${renderPageActionsHtml(i)}\n      </div>`);
    }).join("");
  }

  function renderPaymentsReport(snap) {
    return pagesToSheetsHtml(packGroupsIntoPages(snap, "РЕЄСТР ПЛАТЕЖІВ СПІВВЛАСНИКІВ"), snap);
  }

  function debtClass(v) {
    //if (v > EPS) return "gr-neg";
    //if (v < -EPS) return "gr-pos";
    return "";
  }

  function changeHtml(v) {
    const n = Number(v) || 0;
    if (Math.abs(n) < EPS) return `<span>0,00</span>`;
    if (n > 0) return `<span class="gr-neg">▲ ${money(n)}</span>`;
    return `<span class="gr-pos">▼ ${money(Math.abs(n))}</span>`;
  }

  function formatDebtMonths(months) {
    const rounded = Math.round((Number(months) || 0) * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return text.replace(".", ",");
  }

  function monthsDebtHtml(months, debt) {
    if (debt < -EPS) {
      return `<span class="gr-pos">${formatDebtMonths(months)}</span>`;
    }
    if (debt <= EPS) return `<span class="gr-muted">—</span>`;
    const m = Number(months) || 0;
    if (m > 3) return `<span class="gr-neg">${formatDebtMonths(m)}</span>`;
    return formatDebtMonths(m);
  }

  function hasToken(text, token) {
    return String(text || "").toLowerCase().includes(String(token || "").toLowerCase());
  }

  function cleanAccountNote(note) {
    return String(note || "")
      .replace(/ЕРЦ\s*ЛС\s*:\s*\[\d*\]/giu, " ")
      .replace(/NoDolg/gi, " ")
      .replace(/NoKvit/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAccountReportActivity(a) {
    return Math.abs(a.debitStart) > EPS ||
      Math.abs(a.debitEnd) > EPS ||
      Math.abs(a.chargesSum) > EPS ||
      Math.abs(a.paymentsSum) > EPS;
  }

  function hasTargetContributions(accounts) {
    return (accounts || []).some(a => Math.abs(a.targetChargesSum || 0) > EPS);
  }

  function targetNotesHtml(snap) {
    const notes = (snap && snap.targetContributionNotes) || [];
    if (!notes.length) return "";
    return `<div class="gr-target-notes">
      <strong>Цільові внески:</strong>
      ${notes.map(note => `<div>${escapeHtml(note)}</div>`).join("")}
    </div>`;
  }

  function renderAccountsDebtReport(snap) {
    const sortByDebtDesc = (a, b) => b.debitEnd - a.debitEnd;
    const accounts = snap.accounts.filter(hasAccountReportActivity);
    if (!accounts.length) return "";
    const showTarget = hasTargetContributions(accounts);
    const tableCols = showTarget ? 9 : 8;
    const over12Debt = accounts.filter(a => a.debitEnd > EPS && a.debtMonths > 12)
      .sort(sortByDebtDesc);
    const longDebt = accounts.filter(a => a.debitEnd > EPS && a.debtMonths > 3 && a.debtMonths <= 12)
      .sort(sortByDebtDesc);
    const shortDebt = accounts.filter(a => a.debitEnd > EPS && a.debtMonths <= 3)
      .sort(sortByDebtDesc);
    const over = accounts.filter(a => a.debitEnd < -EPS)
      .sort((a, b) => a.debitEnd - b.debitEnd);
    const debtOver12Pct = snap.stats.apartments
      ? ((over12Debt.length / snap.stats.apartments) * 100).toFixed(1).replace(".", ",")
      : "0";
    const debtOver3Pct = snap.stats.apartments
      ? ((longDebt.length / snap.stats.apartments) * 100).toFixed(1).replace(".", ",")
      : "0";
    const shortDebtPct = snap.stats.apartments
      ? ((shortDebt.length / snap.stats.apartments) * 100).toFixed(1).replace(".", ",")
      : "0";
    const overPct = snap.stats.apartments
      ? ((over.length / snap.stats.apartments) * 100).toFixed(1).replace(".", ",")
      : "0";

    const endLbl = endOfMonthLabel(snap.toYm.year, snap.toYm.month);
    const startLbl = startOfMonthLabel(snap.fromYm.year, snap.fromYm.month);
    const formulaStartLbl = startOfMonthLabelFull(snap.fromYm.year, snap.fromYm.month);
    const formulaEndLbl = endOfMonthLabel(snap.toYm.year, snap.toYm.month);
    const endShort = endOfMonthLabelShort(snap.toYm.year, snap.toYm.month);

    function accountRow(a, idx) {
      const paid = a.paymentsSum > EPS
        ? amountSpan(a.paymentsSum, money(a.paymentsSum), "gr-pos")
        : `<span class="gr-neg">—</span>`;
      return `<tr class="${idx % 2 ? "gr-zebra" : ""}">
        <td>${apartmentHtml(a.kv)}</td>
        <td>${escapeHtml(a.fio)}</td>
        <td>${a.pers || 0} / ${String(a.pl).replace(".", ",")}</td>
        ${amountCell(a.debitStart, moneySigned(a.debitStart), debtClass(a.debitStart))}
        ${amountCell(a.regularChargesSum)}
        ${showTarget ? amountCell(a.targetChargesSum) : ""}
        ${a.paymentsSum > EPS ? amountCell(a.paymentsSum, paid, "gr-pos") : `<td class="gr-amount-cell"><span class="gr-neg">—</span></td>`}
        ${amountCell(a.debitEnd, moneySigned(a.debitEnd), debtClass(a.debitEnd))}
        <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
      </tr>`;
    }

    function groupRows(title, items, tone) {
      if (!items.length) return [];
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      const rows = [
        `<tr class="gr-group-head gr-tone-${tone}"><td colspan="${tableCols}">${escapeHtml(title)} (${items.length} квартир)</td></tr>`
      ];
      items.forEach((a, idx) => rows.push(accountRow(a, idx)));
      rows.push(`<tr class="gr-group-total">
        <td colspan="3">Разом по групі (${items.length}):</td>
        ${amountCell(sum(a => a.debitStart), moneySigned(sum(a => a.debitStart)))}
        ${amountCell(sum(a => a.regularChargesSum))}
        ${showTarget ? amountCell(sum(a => a.targetChargesSum)) : ""}
        ${amountCell(sum(a => a.paymentsSum), money(sum(a => a.paymentsSum)), "gr-pos")}
        ${amountCell(sum(a => a.debitEnd), moneySigned(sum(a => a.debitEnd)), debtClass(sum(a => a.debitEnd)))}
        <td></td>
      </tr>`);
      return rows;
    }

    const sumAll = (fn) => accounts.reduce((s, a) => s + fn(a), 0);
    const totalDebtChange = sumAll(a => a.debtChange);
    const rowHtmlList = [
      ...groupRows("БОРГ ПОНАД 12 МІСЯЦІВ", over12Debt, "danger"),
      ...groupRows("БОРГ ПОНАД 3 МІСЯЦІ", longDebt, "warn"),
      ...groupRows("СПІВВЛАСНИКИ З БОРГОМ ДО 3 МІСЯЦІВ", shortDebt, "neutral"),
      ...groupRows("ПЕРЕПЛАТА", over, "ok"),
      `<tr class="gr-grand-total">
        <td colspan="3">Всього по будинку:</td>
        ${amountCell(sumAll(a => a.debitStart), moneySigned(sumAll(a => a.debitStart)))}
        ${amountCell(sumAll(a => a.regularChargesSum))}
        ${showTarget ? amountCell(sumAll(a => a.targetChargesSum)) : ""}
        ${amountCell(sumAll(a => a.paymentsSum))}
        ${amountCell(sumAll(a => a.debitEnd), moneySigned(sumAll(a => a.debitEnd)))}
        <td></td>
      </tr>`
    ];

    const thead = `<tr>
      <th>№ кв.</th><th>П.І.Б. власника</th><th>Осіб / Площа, м²</th>
      <th>Борг на ${escapeHtml(startLbl)}</th><th>Нараховано</th>${showTarget ? "<th>Цільові внески</th>" : ""}<th>Сплачено</th>
      <th>Борг на ${escapeHtml(endShort)}</th><th>Місяців боргу</th>
    </tr>`;

    const kpi = `
      <div class="gr-debt-summary gr-debt-summary-compact">
        <div class="gr-debt-summary-strip">
          <div><span>Всього квартир</span><strong>${snap.stats.apartments}</strong></div>
          <div><span>Загальна площа</span><strong>${money(snap.stats.totalArea)} м²</strong></div>
          <div><span>Борг (сальдо) на ${escapeHtml(endLbl)}</span><strong class="${debtClass(snap.stats.netDebt)}">${moneySigned(snap.stats.netDebt)}</strong></div>
        </div>
        <div class="gr-debt-summary-cards">
          <div class="gr-debt-summary-card gr-debt-tone-danger">
            <div class="gr-kpi-label">Борг понад 12 міс.</div>
            <div class="gr-kpi-value gr-neg">${over12Debt.length} <span>(${debtOver12Pct}%)</span></div>
            <div class="gr-kpi-foot">${money(over12Debt.reduce((s, a) => s + a.debitEnd, 0))} грн</div>
          </div>
          <div class="gr-debt-summary-card gr-debt-tone-warn">
            <div class="gr-kpi-label">Борг 3-12 міс.</div>
            <div class="gr-kpi-value gr-neg">${longDebt.length} <span>(${debtOver3Pct}%)</span></div>
            <div class="gr-kpi-foot">${money(longDebt.reduce((s, a) => s + a.debitEnd, 0))} грн</div>
          </div>
          <div class="gr-debt-summary-card gr-debt-tone-neutral">
            <div class="gr-kpi-label">Борг до 3 міс.</div>
            <div class="gr-kpi-value">${shortDebt.length} <span>(${shortDebtPct}%)</span></div>
            <div class="gr-kpi-foot">${money(shortDebt.reduce((s, a) => s + a.debitEnd, 0))} грн</div>
          </div>
          <div class="gr-debt-summary-card gr-debt-tone-ok">
            <div class="gr-kpi-label">Переплата</div>
            <div class="gr-kpi-value gr-pos">${over.length} <span>(${overPct}%)</span></div>
            <div class="gr-kpi-foot">${money(Math.abs(over.reduce((s, a) => s + a.debitEnd, 0)))} грн</div>
          </div>
        </div>
      </div>`;

    const subtitle = `<div class="gr-subtitle gr-subtitle-accent">відсортовано за боргом (від більшого боргу до переплати)</div>`;
    const pages = packTableRowsIntoPages(snap, "ОСОБОВІ РАХУНКИ СПІВВЛАСНИКІВ", subtitle, thead, rowHtmlList, targetNotesHtml(snap), {
      firstPrefixHtml: kpi,
      suffixMode: "last",
      tableClass: "gr-accounts-table"
    });
    return pagesToSheetsHtml(pages, snap);
  }

  function renderDebtorsListReport(snap) {
    const sortByKv = (a, b) => {
      const ka = parseKvNum(a.kv);
      const kb = parseKvNum(b.kv);
      if (ka !== kb) return ka - kb;
      return String(a.kv).localeCompare(String(b.kv), "uk");
    };
    const eligible = snap.accounts.filter(a =>
      a.debitEnd > EPS &&
      a.debtMonths > 3 &&
      !hasToken(a.note, "NoDolg")
    );
    if (!eligible.length) return "";
    const over12Debt = eligible.filter(a => a.debtMonths > 12).sort(sortByKv);
    const longDebt = eligible.filter(a => a.debtMonths > 3 && a.debtMonths <= 12).sort(sortByKv);
    const sumEligible = (fn) => eligible.reduce((s, a) => s + fn(a), 0);
    const totalDebtStart = sumEligible(a => a.debitStart);
    const totalDebtEnd = sumEligible(a => a.debitEnd);
    const debtDelta = totalDebtEnd - totalDebtStart;
    const deltaClass = debtDelta > EPS ? "gr-neg" : (debtDelta < -EPS ? "gr-pos" : "");
    const deltaLabel = debtDelta > EPS ? "Зріс" : (debtDelta < -EPS ? "Зменшився" : "Без змін");
    const deltaPeriodLabel = snap.fromYm.year === snap.toYm.year && snap.fromYm.month === snap.toYm.month
      ? "за місяць"
      : "за період";

    function detailRow(a) {
      const note = cleanAccountNote(a.note);
      const parts = [
        a.tel ? `<span>Тел.: ${escapeHtml(a.tel)}</span>` : "",
        a.email ? `<span>Email: ${escapeHtml(a.email)}</span>` : "",
        hasToken(a.note, "NoKvit") ? `<span class="gr-badge">Без паперової квитанції</span>` : ""
      ].filter(Boolean).join(`<span class="gr-dot">•</span>`);
      const metaHtml = parts ? `<div class="gr-debtor-meta">${parts}</div>` : "";
      const noteHtml = note ? `<div class="gr-debtor-note">${escapeHtml(note)}</div>` : "";
      if (!metaHtml && !noteHtml) return "";
      return `<tr class="gr-debtor-detail"><td colspan="6"><div class="gr-debtor-extra">${noteHtml}${metaHtml}</div></td></tr>`;
    }

    function accountRows(a, idx) {
      return `<tr class="${idx % 2 ? "gr-zebra" : ""}">
        <td>${apartmentHtml(a.kv)}</td>
        <td>${escapeHtml(a.fio)}</td>
        ${amountCell(a.chargesSum)}
        ${a.paymentsSum > EPS ? amountCell(a.paymentsSum, money(a.paymentsSum), "gr-pos") : `<td class="gr-amount-cell">—</td>`}
        ${amountCell(a.debitEnd, moneySigned(a.debitEnd), `gr-debtors-debt ${debtClass(a.debitEnd)}`)}
        <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
      </tr>${detailRow(a)}`;
    }

    function groupRows(title, items, tone) {
      if (!items.length) return [];
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      const rows = [
        `<tr class="gr-group-head gr-tone-${tone}"><td colspan="6">${escapeHtml(title)} (${items.length} квартир)</td></tr>`
      ];
      items.forEach((a, idx) => rows.push(accountRows(a, idx)));
      rows.push(`<tr class="gr-group-total">
        <td colspan="2">Разом по групі:</td>
        ${amountCell(sum(a => a.chargesSum))}
        ${amountCell(sum(a => a.paymentsSum), money(sum(a => a.paymentsSum)), "gr-pos")}
        ${amountCell(sum(a => a.debitEnd), moneySigned(sum(a => a.debitEnd)), `gr-debtors-debt ${debtClass(sum(a => a.debitEnd))}`)}
        <td></td>
      </tr>`);
      return rows;
    }

    const endShort = endOfMonthLabelShort(snap.toYm.year, snap.toYm.month);
    const rowHtmlList = [
      ...groupRows("БОРГ ПОНАД 12 МІСЯЦІВ", over12Debt, "danger"),
      ...groupRows("БОРГ ПОНАД 3 МІСЯЦІ", longDebt, "warn")
    ];
    const thead = `<tr>
      <th>Кв.</th><th>П.І.Б. власника</th><th>Нараховано</th><th>Сплачено</th>
      <th>Борг на ${escapeHtml(endShort)}</th><th>Місяців</th>
    </tr>`;
    const subtitle = `<div class="gr-subtitle gr-subtitle-accent">рахунки з боргом понад 3 місяці</div>`;
    const summaryHtml = `<div class="gr-kpi-row gr-kpi-row-5 gr-debtors-kpi">
      <div class="gr-kpi"><div class="gr-kpi-label">Боржників у звіті</div><div class="gr-kpi-value gr-neg">${eligible.length} квартир</div></div>
      <div class="gr-kpi"><div class="gr-kpi-label">Борг понад 12 міс.</div><div class="gr-kpi-value gr-neg">${money(over12Debt.reduce((s, a) => s + a.debitEnd, 0))} грн</div></div>
      <div class="gr-kpi"><div class="gr-kpi-label">Борг 3-12 міс.</div><div class="gr-kpi-value gr-neg">${money(longDebt.reduce((s, a) => s + a.debitEnd, 0))} грн</div></div>
      <div class="gr-kpi"><div class="gr-kpi-label">Борг на ${escapeHtml(endShort)}</div><div class="gr-kpi-value gr-neg">${money(totalDebtEnd)} грн</div></div>
      <div class="gr-kpi"><div class="gr-kpi-label">${deltaLabel} ${deltaPeriodLabel}</div><div class="gr-kpi-value ${deltaClass}">${moneySigned(debtDelta)} грн</div></div>
    </div>`;
    const pages = packTableRowsIntoPages(snap, "СПИСОК БОРЖНИКІВ", subtitle, thead, rowHtmlList, "", {
      firstPrefixHtml: summaryHtml,
      suffixMode: "last",
      tableClass: "gr-debtors-table"
    });
    return pagesToSheetsHtml(pages, snap);
  }

  function renderAccountsPodsReport(snap) {
    const byPod = new Map();
    const activeAccounts = snap.accounts.filter(hasAccountReportActivity);
    if (!activeAccounts.length) return "";
    const showTarget = hasTargetContributions(activeAccounts);
    const tableCols = showTarget ? 9 : 8;
    activeAccounts.forEach(a => {
      const pod = a.pod == null || a.pod === "" ? "—" : String(a.pod);
      if (!byPod.has(pod)) byPod.set(pod, []);
      byPod.get(pod).push(a);
    });
    const pods = [...byPod.keys()].sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b), "uk");
    });

    const startLbl = startOfMonthLabel(snap.fromYm.year, snap.fromYm.month);
    const endShort = endOfMonthLabelShort(snap.toYm.year, snap.toYm.month);
    const formulaStartLbl = startOfMonthLabelFull(snap.fromYm.year, snap.fromYm.month);
    const formulaEndLbl = endOfMonthLabel(snap.toYm.year, snap.toYm.month);
    const rowHtmlList = [];

    pods.forEach(pod => {
      const items = byPod.get(pod).slice().sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));
      rowHtmlList.push(`<tr class="gr-pod-head"><td colspan="${tableCols}">ПІДʼЇЗД ${escapeHtml(pod)} (${items.length} квартир)</td></tr>`);
      items.forEach((a, idx) => {
        const paid = a.paymentsSum > EPS
          ? amountSpan(a.paymentsSum, money(a.paymentsSum), "gr-pos")
          : `<span class="gr-neg">—</span>`;
        rowHtmlList.push(`<tr class="${idx % 2 ? "gr-zebra" : ""}">
          <td>${apartmentHtml(a.kv)}</td>
          <td>${escapeHtml(a.fio)}</td>
          <td>${a.pers || 0} / ${String(a.pl).replace(".", ",")}</td>
          ${amountCell(a.debitStart, moneySigned(a.debitStart), debtClass(a.debitStart))}
          ${amountCell(a.regularChargesSum)}
          ${showTarget ? amountCell(a.targetChargesSum) : ""}
          ${a.paymentsSum > EPS ? amountCell(a.paymentsSum, paid, "gr-pos") : `<td class="gr-amount-cell"><span class="gr-neg">—</span></td>`}
          ${amountCell(a.debitEnd, moneySigned(a.debitEnd), debtClass(a.debitEnd))}
          <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
        </tr>`);
      });
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      rowHtmlList.push(`<tr class="gr-group-total">
        <td colspan="2">Разом по підʼїзду ${escapeHtml(pod)}:</td>
        ${amountCell(sum(a => a.pl))}
        ${amountCell(sum(a => a.debitStart), moneySigned(sum(a => a.debitStart)))}
        ${amountCell(sum(a => a.regularChargesSum))}
        ${showTarget ? amountCell(sum(a => a.targetChargesSum)) : ""}
        ${amountCell(sum(a => a.paymentsSum), money(sum(a => a.paymentsSum)), "gr-pos")}
        ${amountCell(sum(a => a.debitEnd), moneySigned(sum(a => a.debitEnd)))}
        <td></td>
      </tr>`);
    });

    const thead = `<tr>
      <th>№ кв.</th><th>П.І.Б. власника</th><th>Осіб / Площа м²</th>
      <th>Було на ${escapeHtml(startLbl)}</th><th>Нараховано</th>${showTarget ? "<th>Цільові внески</th>" : ""}<th>Сплачено</th>
      <th>Стало на ${escapeHtml(endShort)}</th><th>Місяців боргу</th>
    </tr>`;

    const after = `
      <div class="gr-formula-row">
        <div class="gr-formula-card"><div class="gr-kpi-label">Борг на ${escapeHtml(formulaStartLbl)}</div><div class="gr-kpi-value ${debtClass(activeAccounts.reduce((s, a) => s + a.debitStart, 0))}">${moneySigned(activeAccounts.reduce((s, a) => s + a.debitStart, 0))}</div></div>
        <div class="gr-formula-op">+</div>
        <div class="gr-formula-card"><div class="gr-kpi-label">Нараховано</div><div class="gr-kpi-value">${money(activeAccounts.reduce((s, a) => s + a.regularChargesSum, 0))}</div></div>
        ${showTarget ? `<div class="gr-formula-op">+</div><div class="gr-formula-card"><div class="gr-kpi-label">Цільові внески</div><div class="gr-kpi-value">${money(activeAccounts.reduce((s, a) => s + a.targetChargesSum, 0))}</div></div>` : ""}
        <div class="gr-formula-op">−</div>
        <div class="gr-formula-card"><div class="gr-kpi-label">Сплачено</div><div class="gr-kpi-value gr-pos">${money(activeAccounts.reduce((s, a) => s + a.paymentsSum, 0))}</div></div>
        <div class="gr-formula-op">=</div>
        <div class="gr-formula-card"><div class="gr-kpi-label">Борг на ${escapeHtml(formulaEndLbl)}</div><div class="gr-kpi-value ${debtClass(activeAccounts.reduce((s, a) => s + a.debitEnd, 0))}">${moneySigned(activeAccounts.reduce((s, a) => s + a.debitEnd, 0))}</div></div>
      </div>
      ${targetNotesHtml(snap)}`;

    const subtitle = `<div class="gr-subtitle">по підʼїздах та квартирах у порядку зростання номерів</div>`;
    return pagesToSheetsHtml(
      packTableRowsIntoPages(snap, "РЕЄСТР ОСОБОВИХ РАХУНКІВ", subtitle, thead, rowHtmlList, after, {
        skipOrphanSuffix: true,
        tableClass: "gr-accounts-table"
      }),
      snap
    );
  }

  function renderAccountsOverpayReport(snap) {
    const items = snap.accounts
      .filter(a => a.debitEnd <= EPS && (a.debitEnd < -EPS || hasAccountReportActivity(a)))
      .sort((a, b) => {
        const ka = parseKvNum(a.kv);
        const kb = parseKvNum(b.kv);
        if (ka !== kb) return ka - kb;
        return String(a.kv).localeCompare(String(b.kv), "uk");
    });
    const startLbl = startOfMonthLabel(snap.fromYm.year, snap.fromYm.month);
    const formulaStartLbl = startOfMonthLabelFull(snap.fromYm.year, snap.fromYm.month);
    const formulaEndLbl = endOfMonthLabel(snap.toYm.year, snap.toYm.month);
    const endShort = endOfMonthLabelShort(snap.toYm.year, snap.toYm.month);
    const overpayOnly = items.filter(a => a.debitEnd < -EPS);
    if (!overpayOnly.length) return "";
    const zeroDebt = items.filter(a => Math.abs(a.debitEnd) <= EPS);
    const overpayTotal = overpayOnly.reduce((sum, a) => sum + Math.abs(a.debitEnd), 0);

    const rowHtmlList = items.map((a, idx) => {
      const paid = a.paymentsSum > EPS
        ? amountSpan(a.paymentsSum, money(a.paymentsSum), "gr-pos")
        : `<span class="gr-muted">—</span>`;
      return `<tr class="${idx % 2 ? "gr-zebra" : ""}">
        <td>${apartmentHtml(a.kv)}</td>
        <td>${escapeHtml(a.fio)}</td>
        <td>${a.pers || 0} / ${String(a.pl).replace(".", ",")}</td>
        ${amountCell(a.debitStart, moneySigned(a.debitStart), debtClass(a.debitStart))}
        ${amountCell(a.chargesSum)}
        ${a.paymentsSum > EPS ? amountCell(a.paymentsSum, paid, "gr-pos") : `<td class="gr-amount-cell"><span class="gr-muted">—</span></td>`}
        ${amountCell(a.debitEnd, moneySigned(a.debitEnd), debtClass(a.debitEnd))}
        <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
      </tr>`;
    });

    if (items.length) {
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      rowHtmlList.push(`<tr class="gr-grand-total">
        <td colspan="3">Всього:</td>
        ${amountCell(sum(a => a.debitStart), moneySigned(sum(a => a.debitStart)))}
        ${amountCell(sum(a => a.chargesSum))}
        ${amountCell(sum(a => a.paymentsSum))}
        ${amountCell(sum(a => a.debitEnd), moneySigned(sum(a => a.debitEnd)))}
        <td></td>
      </tr>`);
    }

    const thead = `<tr>
      <th>№ кв.</th><th>П.І.Б. власника</th><th>Осіб / Площа м²</th>
      <th>Було на ${escapeHtml(startLbl)}</th><th>Нараховано</th><th>Сплачено</th>
      <th>Стало на ${escapeHtml(endShort)}</th><th>Місяців боргу</th>
    </tr>`;

    const kpi = `
      <div class="gr-kpi-row gr-kpi-row-5">
        <div class="gr-kpi"><div class="gr-kpi-label">Всього квартир</div><div class="gr-kpi-value">${snap.stats.apartments}</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">У звіті</div><div class="gr-kpi-value gr-pos">${items.length} квартир</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">З переплатою</div><div class="gr-kpi-value gr-pos">${overpayOnly.length} квартир</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Без боргу</div><div class="gr-kpi-value">${zeroDebt.length} квартир</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Сума переплат</div><div class="gr-kpi-value gr-pos">${money(overpayTotal)} грн</div></div>
      </div>`;

    const after = `
      <div class="gr-thanks-box">
        Дякуємо співвласникам за підтримку та своєчасну оплату внесків на утримання будинку.
        Ваша участь допомагає забезпечувати стабільну роботу будинку, виконувати необхідні роботи
        та підтримувати спільне майно у належному стані.
      </div>`;

    const subtitle = `<div class="gr-subtitle">квартири з переплатою або нульовим боргом, відсортовано за номерами квартир</div>`;
    return pagesToSheetsHtml(
      packTableRowsIntoPages(snap, "ОСОБОВІ РАХУНКИ З ПЕРЕПЛАТОЮ", subtitle, thead, rowHtmlList, after, {
        firstPrefixHtml: kpi,
        suffixMode: "last",
        tableClass: "gr-accounts-table"
      }),
      snap
    );
  }

  function renderSpendingList(spendingRows, total, fromYm, toYm, options) {
    const opts = options || {};
    if (!spendingRows.length) return "";
    const desc = describePeriod(fromYm, toYm);
    const title = desc.kind === "month"
      ? `ВИТРАТИ БУДИНКУ ЗА ${MONTHS_UA_UPPER[fromYm.month - 1]} ${fromYm.year} р.`
      : `ВИТРАТИ БУДИНКУ ЗА ${desc.header}`;
    const totalLabel = desc.kind === "month"
      ? `РАЗОМ ВИТРАТИ ЗА ${MONTHS_UA_UPPER[fromYm.month - 1]} ${fromYm.year} р.:`
      : `РАЗОМ ВИТРАТИ ЗА ${desc.header}:`;
    const cols = opts.columns === 2 ? 2 : 1;
    const renderLine = (r) =>
      `<div class="gr-spend-line"><span class="gr-spend-icon">●</span><span class="gr-spend-name">${escapeHtml(r.name)}</span><span class="gr-spend-sum">${money(Math.abs(r.amount))} грн.</span></div>`;
    const columns = splitIntoColumns(spendingRows, cols);
    const lines = columns.map(col => `<div class="gr-spend-col">${col.map(renderLine).join("")}</div>`).join("");
    return `
      <div class="gr-spend-block ${cols === 2 ? "gr-spend-block-2col" : ""}">
        <div class="gr-section-title">${title}</div>
        <div class="gr-spend-cols">${lines}</div>
        ${opts.hideTotal ? "" : `<div class="gr-spend-total"><span>${totalLabel}</span> <strong>${money(total)} грн</strong></div>`}
      </div>
    `;
  }

  function aggregateSmallSpending(rows, maxRows) {
    if (rows.length <= maxRows || maxRows < 2) return rows.slice();
    const otherCount = rows.length - (maxRows - 1);
    const otherIndexes = new Set(
      rows
        .map((r, index) => ({ index, amount: Math.abs(r.amount) }))
        .sort((a, b) => a.amount - b.amount || a.index - b.index)
        .slice(0, otherCount)
        .map(item => item.index)
    );
    const visible = rows.filter((_, index) => !otherIndexes.has(index));
    const other = rows.reduce((sum, r, index) => otherIndexes.has(index) ? sum + Math.abs(r.amount) : sum, 0);
    if (other > EPS) visible.push({ name: "Інші витрати", amount: other });
    return visible;
  }

  function renderCallout() {
    return `<div class="gr-callout">
        <div class="gr-callout-mark">!</div>
        <div class="gr-callout-text">
          <div class="gr-callout-main">Просимо власників квартир погасити заборгованість або звернутися до правління для узгодження графіка її погашення.</div>
          <div class="gr-callout-small">Вчасна сплата внесків – запорука безпечного та комфортного життя у нашому будинку!</div>
          <div class="gr-callout-strong">ДЯКУЄМО ВСІМ СПІВВЛАСНИКАМ, ЯКІ СВОЄЧАСНО СПЛАЧУЮТЬ ВНЕСКИ!</div>
        </div>
      </div>`;
  }

  function fitPosterPage(snap, title, blocksFactory, spend) {
    const hasSpending = !!(spend && spend.rows && spend.rows.length);
    const hasDebtBlock = !!blocksFactory({ checkOnly: true });
    if (!hasSpending && !hasDebtBlock) return "";
    const top = renderPageChrome(snap, title, "", false);
    const baseRows = hasSpending ? spend.rows.slice() : [];
    const spendingHtml = (attempt) => hasSpending ? renderSpendingList(attempt.rows, spend.total, snap.fromYm, snap.toYm, attempt) : "";
    const calloutHtml = (attempt) => hasDebtBlock && !attempt.hideCallout ? renderCallout() : "";
    const attempts = [
      { columns: 1, hideCallout: false, hideTotal: false, rows: baseRows },
      { columns: 2, hideCallout: false, hideTotal: false, rows: baseRows },
      { columns: 2, hideCallout: true, hideTotal: false, rows: baseRows },
      { columns: 2, hideCallout: true, hideTotal: true, rows: baseRows }
    ];
    for (const attempt of attempts) {
      const body = blocksFactory(attempt)
        + spendingHtml(attempt)
        + calloutHtml(attempt);
      if (measureSheetOverflow(top, body).ok) return pagesToSheetsHtml([{ top, body, className: "gr-sheet-poster" }], snap);
    }
    for (let maxRows = Math.max(1, baseRows.length - 1); maxRows >= 1 && hasSpending; maxRows -= 1) {
      const attempt = { columns: 2, hideCallout: true, hideTotal: true, rows: aggregateSmallSpending(baseRows, maxRows) };
      const body = blocksFactory(attempt) + spendingHtml(attempt);
      if (measureSheetOverflow(top, body).ok || maxRows === 1) {
        return pagesToSheetsHtml([{ top, body, className: "gr-sheet-poster" }], snap);
      }
    }
    return pagesToSheetsHtml([{ top, body: blocksFactory({ hideCallout: true }) + spendingHtml({ rows: baseRows, hideTotal: true }), className: "gr-sheet-poster" }], snap);
  }

  function normalizeSpendingNameForMerge(name, shouldNormalize) {
    const text = String(name || "").trim();
    if (!shouldNormalize) return text;
    return text.replace(/\s+за\s+\S{3,4}$/u, "").trim();
  }

  function mergeSpending(spendingByMonth) {
    const map = new Map();
    let total = 0;
    const normalizeNames = (spendingByMonth || []).length > 1;
    spendingByMonth.forEach(m => {
      (m.rows || []).forEach(r => {
        const key = normalizeSpendingNameForMerge(r.name, normalizeNames);
        map.set(key, (map.get(key) || 0) + Math.abs(r.amount));
        total += Math.abs(r.amount);
      });
    });
    return {
      rows: [...map.entries()].map(([name, amount]) => ({ name, amount })),
      total
    };
  }

  function packPosterPages(snap, title, bodyBlocks) {
    const top = renderPageChrome(snap, title, "", false);
    const body = bodyBlocks.join("");
    return pagesToSheetsHtml([{ top, body, className: "gr-sheet-poster" }], snap);
  }

  function renderDebtsPoster(snap) {
    const debtors = snap.accounts
      .filter(a => a.debitEnd > EPS && a.debtMonths > 6 && !String(a.note || "").toLowerCase().includes("nodolg"))
      .sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv))
      .map(a => ({ kv: a.kv, amount: a.debitEnd }));
    const ratio = snap.stats.debtRatio;
    const ratioText = ratio > 0
      ? `це майже <strong><u>${ratio.toFixed(1).replace(".", ",")}</u></strong> місяці поточних витрат будинку!`
      : "";
    const spend = mergeSpending(snap.spendingByMonth);

    return fitPosterPage(snap, "БОРГИ СПІВВЛАСНИКІВ", (opts) => {
      if (!debtors.length) return "";
      if (opts && opts.checkOnly) return true;
      return `
      <div class="gr-poster-amount">${money(snap.stats.totalPositiveDebt)} <span>грн</span></div>
      <div class="gr-poster-ratio">${ratioText}</div>
      <div class="gr-black-bar">КВАРТИРИ ІЗ ЗАБОРГОВАНІСТЮ ПОНАД 6 МІСЯЦІВ</div>
      ${debtGridHtml(debtors, 5)}
    `;
    }, spend);
  }

  function renderPodPosters(snap) {
    const byPod = new Map();
    snap.accounts.forEach(a => {
      const pod = a.pod == null || a.pod === "" ? null : String(a.pod);
      if (pod == null) return;
      if (!byPod.has(pod)) byPod.set(pod, []);
      byPod.get(pod).push(a);
    });
    const pods = [...byPod.keys()].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const spend = mergeSpending(snap.spendingByMonth);

    return pods.map(pod => {
      const items = byPod.get(pod);
      const podDebt = items.filter(a => a.debitEnd > EPS).reduce((sum, a) => sum + a.debitEnd, 0);
      const longDebt = items
        .filter(a => a.debitEnd > EPS && a.debtMonths > 6 && !String(a.note || "").toLowerCase().includes("nodolg"))
        .sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv))
        .map(a => ({ kv: a.kv, amount: a.debitEnd }));
      const ratio = snap.avgSpend > EPS ? podDebt / snap.avgSpend : 0;
      const title = `ПІДʼЇЗД №${pod}`;
      return fitPosterPage(snap, title, (opts) => {
        if (!longDebt.length) return "";
        if (opts && opts.checkOnly) return true;
        return `
        <div class="gr-poster-caption">ЗАБОРГОВАНІСТЬ СПІВВЛАСНИКІВ ПІДʼЇЗДУ</div>
        <div class="gr-poster-amount">${money(podDebt)} <span>грн</span></div>
        <div class="gr-poster-ratio">${ratio > 0 ? `це майже <strong><u>${ratio.toFixed(1).replace(".", ",")}</u></strong> місяці поточних витрат будинку` : ""}</div>
        <div class="gr-black-bar">КВАРТИРИ ПІДʼЇЗДУ ІЗ ЗАБОРГОВАНІСТЮ ПОНАД 6 МІСЯЦІВ</div>
        ${podDebtGridHtml(longDebt, 5)}
        <div class="gr-building-debt">Загальна заборгованість будинку: <strong>${money(snap.stats.totalPositiveDebt)} грн</strong></div>
      `;
      }, spend);
    }).join("");
  }

  function renderReportHtml(typeId, snap) {
    switch (typeId) {
      case "payments": return renderPaymentsReport(snap);
      case "accountsDebt": return renderAccountsDebtReport(snap);
      case "debtorsList": return renderDebtorsListReport(snap);
      case "accountsPods": return renderAccountsPodsReport(snap);
      case "accountsOverpay": return renderAccountsOverpayReport(snap);
      case "debtsPoster": return renderDebtsPoster(snap);
      case "podPoster": return renderPodPosters(snap);
      default: return `<div class="gr-error">Невідомий тип звіту</div>`;
    }
  }

  // ===================== UI =====================

  function availableHomes() {
    return Array.isArray(homes) ? homes.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "uk")) : [];
  }

  function selectedHomeCodes() {
    const list = availableHomes();
    if (list.length <= 1) return list.map(h => h.code);
    if (grState.allHomes) return list.map(h => h.code);
    return grState.selectedCodes.slice();
  }

  function selectedReportTypeIds() {
    if (grState.allTypes) return REPORT_TYPES.map(t => t.id);
    return grState.selectedTypeIds.slice();
  }

  function isTabular(typeId) {
    return !!(REPORT_TYPES.find(t => t.id === typeId) || {}).tabular;
  }

  function activeReportHomeCode() {
    const list = availableHomes();
    const currentHomeCode = String(
      (typeof getParam === "function" && getParam("homeCode") !== "globalReports" ? getParam("homeCode") : "")
      || (typeof activeHomeCode !== "undefined" && activeHomeCode !== "globalReports" ? activeHomeCode : "")
      || localStorage.getItem("last_homeCode")
      || ""
    );
    const currentHome = list.find(h => String(h.code) === currentHomeCode);
    return currentHome ? currentHome.code : (list[0] && list[0].code);
  }

  function updateSeparateVisibility() {
    const from = parseYm(document.getElementById("gr-from")?.value);
    const to = parseYm(document.getElementById("gr-to")?.value);
    const wrap = document.getElementById("gr-separate-wrap");
    if (!wrap || !from || !to) return;
    const multi = !(from.year === to.year && from.month === to.month);
    wrap.style.display = multi ? "" : "none";
    if (!multi) {
      const cb = document.getElementById("gr-separate");
      if (cb) cb.checked = false;
    }
  }

  function updateExcelVisibility() {
    const typeIds = selectedReportTypeIds();
    const btn = document.getElementById("gr-excel");
    if (btn) btn.style.display = typeIds.length && typeIds.every(isTabular) ? "" : "none";
  }

  function renderHomePicker(list) {
    if (typeof renderMultiHomePicker === "function") {
      return renderMultiHomePicker({
        id: "gr-home-picker",
        homes: list,
        selectedCodes: grState.selectedCodes,
        allSelected: grState.allHomes,
        label: "Будинки",
        placeholder: "Оберіть будинок…",
        allLabel: "(Всі)",
        searchPlaceholder: "Пошук будинку…"
      });
    }
    if (list.length <= 1) return "";
    const selectedLabel = grState.allHomes
      ? "(Всі)"
      : (grState.selectedCodes.length
        ? list.filter(h => grState.selectedCodes.includes(h.code)).map(h => h.name).join(", ")
        : "Оберіть будинок…");

    return `
      <div class="gr-field gr-home-field">
        <label>Будинки</label>
        <div class="gr-combo" id="gr-combo">
          <button type="button" class="gr-combo-toggle" id="gr-combo-toggle">${escapeHtml(selectedLabel)}</button>
          <div class="gr-combo-panel" id="gr-combo-panel" hidden>
            <input type="search" class="gr-combo-search" id="gr-combo-search" placeholder="Пошук будинку…" autocomplete="off">
            <div class="gr-combo-list" id="gr-combo-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  function fillHomeList(filterText) {
    const listEl = document.getElementById("gr-combo-list");
    if (!listEl) return;
    const q = String(filterText || "").trim().toLowerCase();
    const list = availableHomes().filter(h => !q || String(h.name).toLowerCase().includes(q));
    const items = [
      { code: "__ALL__", name: "(Всі)", checked: grState.allHomes }
    ].concat(list.map(h => ({
      code: h.code,
      name: h.name,
      checked: !grState.allHomes && grState.selectedCodes.includes(h.code)
    })));

    listEl.innerHTML = items.map(item => `
      <label class="gr-combo-item">
        <input type="checkbox" data-code="${escapeHtml(item.code)}" ${item.checked ? "checked" : ""}>
        <span>${escapeHtml(item.name)}</span>
      </label>
    `).join("");
  }

  function syncHomeToggleLabel() {
    const btn = document.getElementById("gr-combo-toggle");
    if (!btn) return;
    const list = availableHomes();
    if (grState.allHomes) {
      btn.textContent = "(Всі)";
      return;
    }
    const names = list.filter(h => grState.selectedCodes.includes(h.code)).map(h => h.name);
    btn.textContent = names.length ? names.join(", ") : "Оберіть будинок…";
  }

  function bindHomePicker() {
    if (typeof bindMultiHomePicker === "function") {
      bindMultiHomePicker({
        id: "gr-home-picker",
        getHomes: availableHomes,
        getSelection: () => ({
          selectedCodes: grState.selectedCodes,
          allSelected: grState.allHomes
        }),
        setSelection: (selectedCodes, allSelected) => {
          grState.allHomes = !!allSelected;
          grState.selectedCodes = allSelected ? [] : selectedCodes.slice();
        },
        placeholder: "Оберіть будинок…",
        allLabel: "(Всі)",
        searchPlaceholder: "Пошук будинку…"
      });
      return;
    }
    const combo = document.getElementById("gr-combo");
    if (!combo) return;
    const toggle = document.getElementById("gr-combo-toggle");
    const panel = document.getElementById("gr-combo-panel");
    const search = document.getElementById("gr-combo-search");

    toggle.addEventListener("click", () => {
      const open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        fillHomeList(search.value);
        search.focus();
      } else {
        panel.setAttribute("hidden", "");
      }
    });

    search.addEventListener("input", () => fillHomeList(search.value));

    document.getElementById("gr-combo-list").addEventListener("change", (e) => {
      const input = e.target.closest("input[data-code]");
      if (!input) return;
      const code = input.getAttribute("data-code");
      if (code === "__ALL__") {
        grState.allHomes = !!input.checked;
        if (grState.allHomes) grState.selectedCodes = [];
      } else {
        grState.allHomes = false;
        const home = availableHomes().find(h => String(h.code) === String(code));
        const realCode = home ? home.code : code;
        if (input.checked) {
          if (!grState.selectedCodes.some(c => String(c) === String(realCode))) {
            grState.selectedCodes.push(realCode);
          }
        } else {
          grState.selectedCodes = grState.selectedCodes.filter(c => String(c) !== String(realCode));
        }
      }
      fillHomeList(search.value);
      syncHomeToggleLabel();
    });

    document.addEventListener("click", function onDoc(e) {
      if (!document.getElementById("gr-combo")) {
        document.removeEventListener("click", onDoc);
        return;
      }
      if (!e.target.closest("#gr-combo")) {
        panel.setAttribute("hidden", "");
      }
    });
  }

  function setProgress(done, total, text) {
    const wrap = document.getElementById("gr-progress");
    const bar = document.getElementById("gr-progress-bar");
    const label = document.getElementById("gr-progress-label");
    if (!wrap || !bar || !label) return;
    wrap.hidden = false;
    const pct = total ? Math.round((done / total) * 100) : 0;
    bar.style.width = pct + "%";
    label.textContent = text || `${done} / ${total}`;
  }

  function hideProgress() {
    const wrap = document.getElementById("gr-progress");
    if (wrap) wrap.hidden = true;
  }

  async function loadHomeForReport(homeCode) {
    window.homeData = window.homeData || {};
    let home = window.homeData[homeCode];
    if (!home || (typeof isHomeDataFresh === "function" && !isHomeDataFresh(home))) {
      home = await fetchHomeData(homeCode);
    }
    applyHomeDataToGlobals(homeCode, home);
    if (typeof fillMissingDates === "function") fillMissingDates(home.nach);
    return home;
  }

  async function copyReportPageImage(pageIndex) {
    const page = grState.lastPages[pageIndex];
    if (!page) return;
    if (typeof html2canvas !== "function") {
      showMessage("Бібліотека html2canvas не завантажена", "err", 4000);
      return;
    }
    const canvas = await captureSheetCanvas(page);
    if (!navigator.clipboard || !window.ClipboardItem || !canvas.toBlob) {
      const a = document.createElement("a");
      a.download = `report-page-${pageIndex + 1}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      showMessage("Буфер недоступний, файл збережено", "warn", 4000);
      return;
    }
    canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => showMessage("Сторінку скопійовано як картинку", "ok", 2500))
        .catch(() => showMessage("Не вдалося скопіювати сторінку", "warn", 4000));
    }, "image/png");
  }

  function renderReportPicker() {
    const selectedLabel = grState.allTypes
      ? "(Всі)"
      : (grState.selectedTypeIds.length
        ? REPORT_TYPES.filter(t => grState.selectedTypeIds.includes(t.id)).map(t => t.title).join(", ")
        : "Оберіть звіт…");

    return `
      <div class="gr-field gr-report-field">
        <label>Звіти</label>
        <div class="gr-combo" id="gr-report-combo">
          <button type="button" class="gr-combo-toggle" id="gr-report-toggle">${escapeHtml(selectedLabel)}</button>
          <div class="gr-combo-panel" id="gr-report-panel" hidden>
            <input type="search" class="gr-combo-search" id="gr-report-search" placeholder="Пошук звіту…" autocomplete="off">
            <div class="gr-combo-list" id="gr-report-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  function fillReportList(filterText) {
    const listEl = document.getElementById("gr-report-list");
    if (!listEl) return;
    const q = String(filterText || "").trim().toLowerCase();
    const reports = REPORT_TYPES.filter(t => !q || String(t.title).toLowerCase().includes(q));
    const items = [
      { id: "__ALL__", title: "(Всі)", checked: grState.allTypes }
    ].concat(reports.map(t => ({
      id: t.id,
      title: t.title,
      checked: !grState.allTypes && grState.selectedTypeIds.includes(t.id)
    })));

    listEl.innerHTML = items.map(item => `
      <label class="gr-combo-item">
        <input type="checkbox" data-report-id="${escapeHtml(item.id)}" ${item.checked ? "checked" : ""}>
        <span>${escapeHtml(item.title)}</span>
      </label>
    `).join("");
  }

  function syncReportToggleLabel() {
    const btn = document.getElementById("gr-report-toggle");
    if (!btn) return;
    if (grState.allTypes) {
      btn.textContent = "(Всі)";
      return;
    }
    const names = REPORT_TYPES.filter(t => grState.selectedTypeIds.includes(t.id)).map(t => t.title);
    btn.textContent = names.length ? names.join(", ") : "Оберіть звіт…";
  }

  function bindReportPicker() {
    const combo = document.getElementById("gr-report-combo");
    if (!combo) return;
    const toggle = document.getElementById("gr-report-toggle");
    const panel = document.getElementById("gr-report-panel");
    const search = document.getElementById("gr-report-search");

    toggle.addEventListener("click", () => {
      const open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        fillReportList(search.value);
        search.focus();
      } else {
        panel.setAttribute("hidden", "");
      }
    });

    search.addEventListener("input", () => fillReportList(search.value));

    document.getElementById("gr-report-list").addEventListener("change", (e) => {
      const input = e.target.closest("input[data-report-id]");
      if (!input) return;
      const id = input.getAttribute("data-report-id");
      if (id === "__ALL__") {
        grState.allTypes = !!input.checked;
        if (grState.allTypes) grState.selectedTypeIds = [];
      } else {
        grState.allTypes = false;
        if (input.checked) {
          if (!grState.selectedTypeIds.includes(id)) grState.selectedTypeIds.push(id);
        } else {
          grState.selectedTypeIds = grState.selectedTypeIds.filter(v => v !== id);
        }
      }
      fillReportList(search.value);
      syncReportToggleLabel();
      updateExcelVisibility();
    });

    document.addEventListener("click", function onDoc(e) {
      if (!document.getElementById("gr-report-combo")) {
        document.removeEventListener("click", onDoc);
        return;
      }
      if (!e.target.closest("#gr-report-combo")) {
        panel.setAttribute("hidden", "");
      }
    });
  }

  async function shareReportPageImage(pageIndex) {
    const page = grState.lastPages[pageIndex];
    if (!page) return;
    if (typeof html2canvas !== "function") {
      showMessage("Бібліотека html2canvas не завантажена", "err", 4000);
      return;
    }
    const canvas = await captureSheetCanvas(page);
    canvas.toBlob(async blob => {
      const file = new File([blob], `report-page-${pageIndex + 1}.png`, { type: "image/png" });
      if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
        await copyReportPageImage(pageIndex);
        return;
      }
      try {
        await navigator.share({ title: "Звіт", files: [file] });
      } catch (err) {
        console.warn(err);
      }
    }, "image/png");
  }

  function bindPageActions(container) {
    if (container.dataset.grPageActionsBound === "1") return;
    container.dataset.grPageActionsBound = "1";
    container.addEventListener("click", (e) => {
      const copy = e.target.closest("[data-gr-copy-page]");
      const share = e.target.closest("[data-gr-share-page]");
      if (!copy && !share) return;
      const btn = copy || share;
      const index = Number(btn.getAttribute(copy ? "data-gr-copy-page" : "data-gr-share-page"));
      if (!Number.isFinite(index)) return;
      if (copy) copyReportPageImage(index);
      else shareReportPageImage(index);
    });
  }

  function renumberSheets(container) {
    const sheets = [...container.querySelectorAll(".gr-sheet")];
    sheets.forEach((sheet, i) => {
      const wrap = sheet.closest(".gr-sheet-wrap");
      const copy = wrap && wrap.querySelector("[data-gr-copy-page]");
      const share = wrap && wrap.querySelector("[data-gr-share-page]");
      if (copy) copy.setAttribute("data-gr-copy-page", String(i));
      if (share) share.setAttribute("data-gr-share-page", String(i));
    });
    return sheets;
  }

  async function generateReports() {
    const typeIds = selectedReportTypeIds();
    const from = parseYm(document.getElementById("gr-from").value);
    const to = parseYm(document.getElementById("gr-to").value);
    const separate = !!document.getElementById("gr-separate")?.checked;
    grState.compact = !!document.getElementById("gr-compact")?.checked;
    const out = document.getElementById("gr-output");
    const codes = selectedHomeCodes();

    if (!from || !to) {
      showMessage("Оберіть період", "warn", 4000);
      return;
    }
    if (from.year > to.year || (from.year === to.year && from.month > to.month)) {
      showMessage("Початковий місяць пізніше кінцевого", "warn", 4000);
      return;
    }
    if (!codes.length) {
      showMessage("Оберіть хоча б один будинок", "warn", 4000);
      return;
    }
    if (!typeIds.length) {
      showMessage("Оберіть хоча б один звіт", "warn", 4000);
      return;
    }

    const months = listMonthsInRange(from, to);
    const jobs = [];
    codes.forEach(code => {
      typeIds.forEach(typeId => {
        if (separate && months.length > 1) {
          months.forEach(m => jobs.push({ typeId, code, fromYm: m, toYm: m }));
        } else {
          jobs.push({ typeId, code, fromYm: from, toYm: to });
        }
      });
    });

    out.classList.toggle("gr-compact-output", grState.compact);
    out.innerHTML = "";
    document.getElementById("gr-actions").hidden = true;
    setProgress(0, jobs.length, "Підготовка…");

    const htmlParts = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const homeMeta = availableHomes().find(h => String(h.code) === String(job.code)) || { code: job.code, name: String(job.code) };
      const typeTitle = REPORT_TYPES.find(t => t.id === job.typeId)?.title || job.typeId;
      setProgress(i, jobs.length, `${homeMeta.name}: ${typeTitle} (${i + 1}/${jobs.length})…`);
      try {
        const home = await loadHomeForReport(job.code);
        // org3 з меню-об'єкта, якщо є
        if (!homeMeta.org3 && home.org3) homeMeta.org3 = home.org3;
        const snap = buildHomeSnapshot(home, homeMeta, job.fromYm, job.toYm);
        htmlParts.push(renderReportHtml(job.typeId, snap));
      } catch (err) {
        console.error(err);
        htmlParts.push(wrapSheet(
          `<div class="gr-title">Помилка</div>`,
          `<div class="gr-error">Помилка завантаження ${escapeHtml(homeMeta.name)}: ${escapeHtml(err.message || err)}</div>`,
          renderFooter(1, 1)
        ));
      }
      await new Promise(r => setTimeout(r, 0));
    }

    out.innerHTML = htmlParts.join("") || `<div class="gr-empty">Немає даних для звіту</div>`;
    const sheets = renumberSheets(out);
    bindPageActions(out);
    grState.lastPages = sheets;
    grState.lastMeta = { typeId: typeIds.length === 1 ? typeIds[0] : "__MULTI__", typeIds, from, to, separate, compact: grState.compact, codes };
    document.getElementById("gr-actions").hidden = !sheets.length;
    updateExcelVisibility();
    setProgress(jobs.length, jobs.length, "Готово");
    setTimeout(hideProgress, 800);
  }

  async function downloadPdf() {
    const pages = grState.lastPages;
    if (!pages.length) return;
    if (typeof html2canvas !== "function" || !window.jspdf?.jsPDF) {
      showMessage("Бібліотеки PDF не завантажені", "err", 5000);
      return;
    }
    setProgress(0, pages.length, "PDF…");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    for (let i = 0; i < pages.length; i++) {
      setProgress(i, pages.length, `PDF ${i + 1}/${pages.length}`);
      const img = await captureSheetDataUrl(pages[i], "image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
      setProgress(i + 1, pages.length, `PDF ${i + 1}/${pages.length}`);
      await new Promise(r => setTimeout(r, 0));
    }

    const meta = grState.lastMeta || {};
    const name = `${buildDownloadBaseName(meta.typeId, meta.from, meta.to, meta.codes)}.pdf`;
    pdf.save(name);
    hideProgress();
  }

  async function downloadExcel() {
    if (!grState.lastMeta || !(grState.lastMeta.typeIds || [grState.lastMeta.typeId]).every(isTabular)) return;
    if (typeof ExcelJS === "undefined") {
      showMessage("ExcelJS не завантажено", "err", 4000);
      return;
    }
    const wb = new ExcelJS.Workbook();
    const pages = document.querySelectorAll("#gr-output .gr-sheet");
    const usedNames = new Set();
    pages.forEach((page) => {
      const table = page.querySelector("table.gr-table");
      const baseName = page.getAttribute("data-gr-sheet")
        || [
            homesFilePrefix(grState.lastMeta.codes),
            periodFilePart(grState.lastMeta.from, grState.lastMeta.to)
          ].join("_")
        || "Аркуш";
      const ws = wb.addWorksheet(uniqueExcelSheetName(baseName, usedNames));
      if (table) {
        const rows = [...table.querySelectorAll("tr")];
        rows.forEach(tr => {
          const domCells = [...tr.children];
          const row = ws.addRow(domCells.map(excelCellValueFromElement));
          domCells.forEach((td, idx) => {
            const cell = row.getCell(idx + 1);
            if (td.hasAttribute("data-gr-number") || td.querySelector("[data-gr-number]")) {
              cell.numFmt = "#,##0.00";
              cell.alignment = { horizontal: "right" };
            }
          });
        });
      } else {
        const blocks = [...page.querySelectorAll(".gr-pay-block")];
        ws.addRow(["Кв.", "П.І.Б.", "Дата", "Сума"]);
        blocks.forEach(block => {
          const head = block.querySelector(".gr-pay-apt");
          const fio = head?.querySelector(".gr-pay-fio")?.textContent || "";
          const blockKv = block.querySelector(".gr-pay-line .gr-apt-no")?.textContent || "";
          block.querySelectorAll(".gr-pay-line").forEach(line => {
            const kv = line.querySelector(".gr-apt-no")?.textContent || blockKv;
            const date = line.querySelector(".gr-pay-date")?.textContent || "";
            const sumEl = line.querySelector(".gr-pay-sum");
            const row = ws.addRow([kv, fio, date, excelCellValueFromElement(sumEl)]);
            row.getCell(4).numFmt = "#,##0.00";
            row.getCell(4).alignment = { horizontal: "right" };
          });
        });
      }
      ws.columns.forEach(col => {
        let max = 10;
        col.eachCell({ includeEmpty: true }, cell => {
          max = Math.max(max, String(cell.value || "").length + 2);
        });
        col.width = Math.min(40, max);
      });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const meta = grState.lastMeta;
    const name = `${buildDownloadBaseName(meta.typeId, meta.from, meta.to, meta.codes)}.xlsx`;
    if (typeof saveAs === "function") saveAs(blob, name);
    else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
    }
  }

  function printReports() {
    document.body.classList.add("gr-printing");
    const pageStyle = document.createElement("style");
    pageStyle.id = "gr-print-page-style";
    pageStyle.textContent = "@page { margin: 0; }";
    document.head.appendChild(pageStyle);
    window.print();
    setTimeout(() => {
      document.body.classList.remove("gr-printing");
      pageStyle.remove();
    }, 500);
  }

  window.renderGeneratedReportOnly = async function renderGeneratedReportOnly(options) {
    document.body.classList.add("files-mode");
    const opts = options || {};
    const typeId = opts.typeId || opts.report || opts.reportId || "payments";
    const code = opts.homeCode || activeReportHomeCode();
    const def = defaultPeriod();
    const from = typeof opts.from === "string" ? parseYm(opts.from) : (opts.from || parseYm(opts.month) || parseYm(document.getElementById("gr-from")?.value) || parseYm(def.from));
    const to = typeof opts.to === "string" ? parseYm(opts.to) : (opts.to || parseYm(opts.month) || from);
    const compact = !!opts.compact;
    grState.selectedTypeIds = [typeId];
    grState.allTypes = false;
    const container = document.getElementById("maincontainer");
    if (!container) return;
    container.innerHTML = `
      <div class="gr-app gr-single-report-app">
        <div class="gr-toolbar no-print">
          <div class="gr-actions" id="gr-actions">
            <button type="button" class="gr-btn" id="gr-print">Друк</button>
            <button type="button" class="gr-btn" id="gr-pdf">PDF</button>
            <button type="button" class="gr-btn" id="gr-excel">Excel</button>
          </div>
          <div class="gr-progress" id="gr-progress" hidden>
            <div class="gr-progress-track"><div class="gr-progress-bar" id="gr-progress-bar"></div></div>
            <div class="gr-progress-label" id="gr-progress-label"></div>
          </div>
        </div>
        <div id="gr-output" class="gr-output ${compact ? "gr-compact-output" : ""}"></div>
      </div>
    `;
    document.getElementById("gr-print").addEventListener("click", printReports);
    document.getElementById("gr-pdf").addEventListener("click", downloadPdf);
    document.getElementById("gr-excel").addEventListener("click", downloadExcel);
    updateExcelVisibility();
    const out = document.getElementById("gr-output");
    try {
      setProgress(0, 1, "Підготовка…");
      const homeMeta = availableHomes().find(h => String(h.code) === String(code)) || { code, name: String(code) };
      const home = await loadHomeForReport(code);
      if (!homeMeta.org3 && home.org3) homeMeta.org3 = home.org3;
      const snap = buildHomeSnapshot(home, homeMeta, from, to);
      out.innerHTML = renderReportHtml(typeId, snap) || `<div class="gr-empty">Немає даних для звіту</div>`;
      const sheets = renumberSheets(out);
      bindPageActions(out);
      grState.lastPages = sheets;
      grState.lastMeta = { typeId, typeIds: [typeId], from, to, separate: false, compact, codes: [code] };
      hideProgress();
      document.getElementById("gr-actions").hidden = false;
      updateExcelVisibility();
    } catch (err) {
      console.error(err);
      hideProgress();
      out.innerHTML = `<div class="gr-error">Помилка завантаження звіту: ${escapeHtml(err.message || err)}</div>`;
    }
  };

  window.renderGlobalReports = function renderGlobalReports() {
    document.body.classList.add("files-mode");
    const list = availableHomes();
    const currentHomeCode = String(
      (typeof getParam === "function" && getParam("homeCode") !== "globalReports" ? getParam("homeCode") : "")
      || (typeof activeHomeCode !== "undefined" && activeHomeCode !== "globalReports" ? activeHomeCode : "")
      || localStorage.getItem("last_homeCode")
      || ""
    );
    const currentHome = list.find(h => String(h.code) === currentHomeCode);
    grState.selectedCodes = currentHome ? [currentHome.code] : (list.length ? [list[0].code] : []);
    grState.allHomes = false;
    grState.selectedTypeIds = grState.selectedTypeIds.length ? grState.selectedTypeIds : ["payments"];
    grState.allTypes = false;
    grState.lastPages = [];
    const def = defaultPeriod();

    const container = document.getElementById("maincontainer");
    container.innerHTML = `
      <div class="gr-app">
        <div class="gr-toolbar no-print">
          <div class="gr-toolbar-grid">
            ${renderHomePicker(list)}
            ${renderReportPicker()}
            <div class="gr-field">
              <label for="gr-from">З</label>
              <input type="month" id="gr-from" value="${def.from}">
            </div>
            <div class="gr-field">
              <label for="gr-to">По</label>
              <input type="month" id="gr-to" value="${def.to}">
            </div>
            <div class="gr-field gr-check-field" id="gr-separate-wrap" style="display:none">
              <label class="gr-check">
                <input type="checkbox" id="gr-separate">
                <span>Окремий звіт за кожен місяць</span>
              </label>
            </div>
            <div class="gr-field gr-check-field">
              <label class="gr-check">
                <input type="checkbox" id="gr-compact">
                <span>Компактно</span>
              </label>
            </div>
          </div>
          <div class="gr-progress" id="gr-progress" hidden>
            <div class="gr-progress-track"><div class="gr-progress-bar" id="gr-progress-bar"></div></div>
            <div class="gr-progress-label" id="gr-progress-label"></div>
          </div>
          <div class="gr-actions" id="gr-actions">
            <button type="button" class="gr-btn" id="gr-print">Друк</button>
            <button type="button" class="gr-btn" id="gr-pdf">PDF</button>
            <button type="button" class="gr-btn" id="gr-excel">Excel</button>
            <button type="button" class="gr-btn gr-btn-primary gr-generate-secondary" id="gr-generate">Сформувати</button>
          </div>
        </div>
        <div id="gr-output" class="gr-output"></div>
      </div>
    `;

    bindHomePicker();
    bindReportPicker();
    document.getElementById("gr-from").addEventListener("change", updateSeparateVisibility);
    document.getElementById("gr-to").addEventListener("change", updateSeparateVisibility);
    document.getElementById("gr-generate").addEventListener("click", generateReports);
    document.getElementById("gr-print").addEventListener("click", printReports);
    document.getElementById("gr-pdf").addEventListener("click", downloadPdf);
    document.getElementById("gr-excel").addEventListener("click", downloadExcel);
    updateSeparateVisibility();
    updateExcelVisibility();
  };
})();
