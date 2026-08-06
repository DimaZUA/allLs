// generated-reports.js
// Логіка відображення та генерації звітів, що будуються на льоту

(function () {
  "use strict";

  const REPORT_TYPES = [
    { id: "payments", title: "Реєстр платежів співвласників", fileRu: "Реестр_платежей", tabular: true },
    { id: "accountsDebt", title: "Особові рахунки (за боргом)", fileRu: "Особовые_счета_по_долгу", tabular: true },
    { id: "accountsPods", title: "Реєстр лицевих рахунків (по підʼїздах)", fileRu: "Реестр_лицевых_счетов", tabular: true },
    { id: "debtsPoster", title: "Борги співвласників (плакат)", fileRu: "Долги_совладельцев", tabular: false },
    { id: "podPoster", title: "Підʼїзд №N (плакат)", fileRu: "Подъезд", tabular: false }
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
  const MONTHS_UA_LOC = [
    "січні", "лютому", "березні", "квітні", "травні", "червні",
    "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
  ];
  const ROMAN = ["I", "II", "III", "IV"];
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  const EPS = 0.005;
  let grState = {
    selectedCodes: [],
    allHomes: false,
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

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseKvNum(kv) {
    const m = String(kv ?? "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function monthStart(year, month) {
    return new Date(year, month - 1, 1, 12);
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
        subtitle: `за ${MONTHS_UA_LOC[fm - 1]} ${fromYm.year} року`
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
    const type = REPORT_TYPES.find(t => t.id === typeId);
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

  // ===================== data builders =====================

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

  function collectSpendingRows(rawSpending, year, month) {
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
    return { rows, total: Math.abs(total) };
  }

  function averageMonthlySpending(rawSpending, months) {
    const totals = [];
    months.forEach(({ year, month }) => {
      const { total } = collectSpendingRows(rawSpending, year, month);
      if (total > EPS) totals.push(total);
    });
    if (!totals.length) return 0;
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  function prepareHomeNach(home) {
    if (typeof fillMissingDates === "function") fillMissingDates(home.nach);
  }

  function buildHomeSnapshot(home, homeMeta, fromYm, toYm) {
    const start = monthStart(fromYm.year, fromYm.month);
    const end = monthEnd(toYm.year, toYm.month);
    prepareHomeNach(home);
    const accounts = collectAccountsPeriodData(start, end, {
      ls: home.ls,
      nach: home.nach,
      oplat: home.oplat
    });
    const payments = collectPayments(home.oplat || {}, home.ls || {}, start, end);
    const months = listMonthsInRange(fromYm, toYm);
    const spendingByMonth = months.map(m => ({
      ...m,
      ...collectSpendingRows(home.spending, m.year, m.month)
    }));
    const avgSpend = averageMonthlySpending(home.spending, months);

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
      homeName: homeMeta.name || home.org || "",
      org3: homeMeta.org3 || home.org3 || "",
      fromYm,
      toYm,
      start,
      end,
      accounts,
      payments,
      paymentGroups: groupPaymentsByApartment(payments),
      spendingByMonth,
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
    const cont = continued ? ` <span class="gr-continued">(продовження)</span>` : "";
    return `
      <div class="gr-topbar">
        <span class="gr-home-name">${escapeHtml(snap.homeName)}</span>
        <span class="gr-period-label">${escapeHtml(periodLabel(snap.fromYm, snap.toYm))}</span>
      </div>
      <h1 class="gr-title">${escapeHtml(title)}${cont}</h1>
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
      <section class="gr-sheet ${className || ""}"${attrStr}>
        <div class="gr-sheet-inner">
          <div class="gr-sheet-top">${topHtml || ""}</div>
          <div class="gr-sheet-body">${bodyHtml || ""}</div>
          ${footerHtml || ""}
        </div>
      </section>
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

  function paymentBlockHtml(g) {
    const head = `<div class="gr-pay-apt"><strong>${escapeHtml(g.kv)}</strong> <strong>${escapeHtml(g.fio)}</strong></div>`;
    const lines = g.payments.map(p =>
      `<div class="gr-pay-line"><span class="gr-pay-date">${escapeHtml(p.date)}</span><span class="gr-pay-sum">${money(p.sum)}</span></div>`
    ).join("");
    const total = g.payments.length > 1
      ? `<div class="gr-pay-total"><span class="gr-pay-date">Разом</span><span class="gr-pay-sum">${money(g.total)}</span></div>`
      : "";
    return `<div class="gr-pay-block">${head}${lines}${total}</div>`;
  }

  function payGridHtml(groups) {
    const cols = splitIntoColumns(groups, 3);
    return `<div class="gr-pay-grid">${cols.map(col =>
      `<div class="gr-pay-col">${col.map(paymentBlockHtml).join("")}</div>`
    ).join("")}</div>`;
  }

  function paymentsSummaryHtml(snap) {
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
      <div class="gr-stat-boxes">
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
      </div>
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
    host.innerHTML = "";
    return host;
  }

  function measureSheetOverflow(topHtml, bodyHtml) {
    const host = createMeasureHost();
    host.innerHTML = wrapSheet(topHtml, bodyHtml, renderFooter(1, 1), "gr-sheet-measure");
    const sheet = host.querySelector(".gr-sheet");
    const maxH = mmToPx(A4_HEIGHT_MM);
    // дає браузеру застосувати стилі перед вимірюванням
    const h = sheet.getBoundingClientRect().height || sheet.scrollHeight;
    const overflow = h - maxH;
    const ok = overflow <= 1.5;
    host.innerHTML = "";
    return { ok, overflow, maxH, h };
  }

  function packGroupsIntoPages(snap, title) {
    const groups = snap.paymentGroups.slice();
    const subtitle = `<div class="gr-subtitle">${escapeHtml(periodSubtitle(snap.fromYm, snap.toYm))}</div>`;
    const pages = [];
    let offset = 0;
    let pageNo = 0;

    if (!groups.length) {
      const top = renderPageChrome(snap, title, subtitle, false);
      const body = paymentsSummaryHtml(snap) + `<div class="gr-muted">Немає платежів за період.</div>`;
      pages.push({ top, body });
      return pages;
    }

    while (offset < groups.length) {
      const isFirst = pageNo === 0;
      const top = renderPageChrome(snap, title, subtitle, !isFirst);
      const prefix = isFirst ? paymentsSummaryHtml(snap) : "";
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

      // якщо навіть 1 група не влазить на першу сторінку з summary — summary окремо, групи далі
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

  function packTableRowsIntoPages(snap, title, subtitleHtml, theadHtml, rowHtmlList, afterFirstHtml) {
    const pages = [];
    let offset = 0;
    let pageNo = 0;
    const makeTable = (rowsHtml) =>
      `<table class="gr-table"><thead>${theadHtml}</thead><tbody>${rowsHtml}</tbody></table>`;

    if (!rowHtmlList.length) {
      pages.push({
        top: renderPageChrome(snap, title, subtitleHtml, false),
        body: makeTable("") + (afterFirstHtml || "")
      });
      return pages;
    }

    while (offset < rowHtmlList.length) {
      const isFirst = pageNo === 0;
      const top = renderPageChrome(snap, title, subtitleHtml, !isFirst);
      const suffix = isFirst ? (afterFirstHtml || "") : "";
      let low = 1;
      let high = rowHtmlList.length - offset;
      let best = 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const rowsHtml = rowHtmlList.slice(offset, offset + mid).join("");
        if (measureSheetOverflow(top, makeTable(rowsHtml) + suffix).ok) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (best < 1) best = 1;
      // якщо суфікс (легенда) не влазить разом з рядками — перенести суфікс на останню сторінку окремо
      const rowsHtml = rowHtmlList.slice(offset, offset + best).join("");
      const withSuffix = makeTable(rowsHtml) + suffix;
      if (suffix && !measureSheetOverflow(top, withSuffix).ok && measureSheetOverflow(top, makeTable(rowsHtml)).ok) {
        pages.push({ top, body: makeTable(rowsHtml) });
        offset += best;
        pageNo += 1;
        if (offset >= rowHtmlList.length) {
          pages.push({
            top: renderPageChrome(snap, title, subtitleHtml, true),
            body: suffix
          });
        }
        continue;
      }
      pages.push({ top, body: withSuffix });
      offset += best;
      pageNo += 1;
      if (pageNo > 300) break;
    }
    return pages;
  }

  function pagesToSheetsHtml(pages, snap) {
    const total = pages.length || 1;
    const sheetName = snap ? sheetNameFromSnap(snap) : "";
    return pages.map((p, i) =>
      wrapSheet(
        p.top,
        p.body,
        renderFooter(i + 1, total),
        p.className || "",
        sheetName ? { "data-gr-sheet": sheetName } : null
      )
    ).join("");
  }

  function renderPaymentsReport(snap) {
    return pagesToSheetsHtml(packGroupsIntoPages(snap, "РЕЄСТР ПЛАТЕЖІВ СПІВВЛАСНИКІВ"), snap);
  }

  function debtClass(v) {
    if (v > EPS) return "gr-neg";
    if (v < -EPS) return "gr-pos";
    return "";
  }

  function changeHtml(v) {
    const n = Number(v) || 0;
    if (Math.abs(n) < EPS) return `<span class="gr-muted">0,00</span>`;
    if (n > 0) return `<span class="gr-neg">▲ ${money(n)}</span>`;
    return `<span class="gr-pos">▼ ${money(Math.abs(n))}</span>`;
  }

  function monthsDebtHtml(months, debt) {
    if (debt < -EPS) {
      return `<span class="gr-pos">${Number(months).toFixed(1)}</span>`;
    }
    if (debt <= EPS) return `<span class="gr-muted">—</span>`;
    const m = Number(months) || 0;
    if (m > 3) return `<span class="gr-neg">${m.toFixed(1)}+</span>`;
    return String(m.toFixed(1));
  }

  function renderAccountsDebtReport(snap) {
    const longDebt = snap.accounts.filter(a => a.debitEnd > EPS && a.debtMonths > 3)
      .sort((a, b) => b.debitEnd - a.debitEnd);
    const shortDebt = snap.accounts.filter(a => a.debitEnd > EPS && a.debtMonths <= 3)
      .sort((a, b) => b.debitEnd - a.debitEnd);
    const over = snap.accounts.filter(a => a.debitEnd < -EPS)
      .sort((a, b) => a.debitEnd - b.debitEnd);

    const endLbl = endOfMonthLabel(snap.toYm.year, snap.toYm.month);
    const startLbl = startOfMonthLabel(snap.fromYm.year, snap.fromYm.month);
    const endShort = endOfMonthLabelShort(snap.toYm.year, snap.toYm.month);
    const debtorsPct = snap.stats.apartments
      ? ((snap.stats.debtors / snap.stats.apartments) * 100).toFixed(1).replace(".", ",")
      : "0";

    function accountRow(a, idx) {
      const paid = a.paymentsSum > EPS
        ? `<span class="gr-pos">${money(a.paymentsSum)}</span>`
        : `<span class="gr-neg">—</span>`;
      return `<tr class="${idx % 2 ? "gr-zebra" : ""}">
        <td>${escapeHtml(a.kv)}</td>
        <td>${escapeHtml(a.fio)}</td>
        <td>${a.pers || 0} / ${String(a.pl).replace(".", ",")}</td>
        <td class="${debtClass(a.debitStart)}">${moneySigned(a.debitStart)}</td>
        <td>${money(a.chargesSum)}</td>
        <td>${paid}</td>
        <td class="${debtClass(a.debitEnd)}">${moneySigned(a.debitEnd)}</td>
        <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
        <td>${changeHtml(a.debtChange)}</td>
      </tr>`;
    }

    function groupRows(title, items, tone) {
      if (!items.length) return [];
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      const rows = [
        `<tr class="gr-group-head gr-tone-${tone}"><td colspan="9">${escapeHtml(title)} (${items.length} квартир)</td></tr>`
      ];
      items.forEach((a, idx) => rows.push(accountRow(a, idx)));
      rows.push(`<tr class="gr-group-total">
        <td colspan="3">Разом по групі (${items.length}):</td>
        <td>${moneySigned(sum(a => a.debitStart))}</td>
        <td>${money(sum(a => a.chargesSum))}</td>
        <td class="gr-pos">${money(sum(a => a.paymentsSum))}</td>
        <td class="${debtClass(sum(a => a.debitEnd))}">${moneySigned(sum(a => a.debitEnd))}</td>
        <td></td>
        <td>${changeHtml(sum(a => a.debtChange))}</td>
      </tr>`);
      return rows;
    }

    const sumAll = (fn) => snap.accounts.reduce((s, a) => s + fn(a), 0);
    const rowHtmlList = [
      ...groupRows("БОРГ ПОНАД 3 МІСЯЦІ", longDebt, "danger"),
      ...groupRows("БОРГ ДО 4 МІСЯЦІВ", shortDebt, "warn"),
      ...groupRows("ПЕРЕПЛАТА", over, "ok"),
      `<tr class="gr-grand-total">
        <td colspan="3">Всього по будинку:</td>
        <td>${moneySigned(sumAll(a => a.debitStart))}</td>
        <td>${money(sumAll(a => a.chargesSum))}</td>
        <td>${money(sumAll(a => a.paymentsSum))}</td>
        <td>${moneySigned(sumAll(a => a.debitEnd))}</td>
        <td></td>
        <td>${changeHtml(sumAll(a => a.debtChange))}</td>
      </tr>`
    ];

    const thead = `<tr>
      <th>№ кв.</th><th>П.І.Б. власника</th><th>Осіб / Площа, м²</th>
      <th>Борг на ${escapeHtml(startLbl)}</th><th>Нараховано</th><th>Сплачено</th>
      <th>Борг на ${escapeHtml(endShort)}</th><th>Місяців боргу</th><th>Зміна боргу</th>
    </tr>`;

    const kpi = `
      <div class="gr-kpi-row gr-kpi-row-5">
        <div class="gr-kpi"><div class="gr-kpi-label">Всього квартир: ${snap.stats.apartments}</div><div class="gr-kpi-value">Загальна площа: ${money(snap.stats.totalArea)} м²</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Загальний борг на ${escapeHtml(endLbl)}</div><div class="gr-kpi-value gr-neg">${money(snap.stats.totalPositiveDebt)} грн</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Боржників (борг &gt; 0)</div><div class="gr-kpi-value gr-neg">${snap.stats.debtors} (${debtorsPct}%)</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Борг понад 3 міс.</div><div class="gr-kpi-value gr-neg">${snap.stats.longDebtCount} квартир</div></div>
        <div class="gr-kpi"><div class="gr-kpi-label">Переплата</div><div class="gr-kpi-value gr-pos">${snap.stats.overpayCount} квартир</div></div>
      </div>`;

    const notes = `
      <div class="gr-notes-row">
        <div class="gr-note-box">
          <strong>Умовні позначення</strong>
          <div><span class="gr-pos">зелений</span> — оплата / покращення / переплата</div>
          <div><span class="gr-neg">червоний</span> — борг / погіршення</div>
          <div>▲ збільшення боргу, ▼ зменшення боргу</div>
        </div>
        <div class="gr-note-box">
          <strong>Примітки</strong>
          <div>Борг — на кінець обраного періоду.</div>
          <div>«Місяців боргу» — оцінка за методикою Переліку.</div>
          <div>м² — квадратні метри площі квартири.</div>
        </div>
      </div>`;

    // KPI на першій сторінці: додаємо як «фіктивний» префікс через окремий pack
    const subtitle = `<div class="gr-subtitle gr-subtitle-accent">відсортовано за боргом (від більшого боргу до переплати)</div>`;
    const pages = packTableRowsIntoPages(snap, "ОСОБОВІ РАХУНКИ СПІВВЛАСНИКІВ", subtitle, thead, rowHtmlList, notes);
    if (pages[0]) pages[0].body = kpi + pages[0].body;
    // якщо KPI зламав вмістимість — перепакуємо з урахуванням KPI у measure через повторний прохід
    if (pages[0] && !measureSheetOverflow(pages[0].top, pages[0].body).ok) {
      const pages2 = packTableRowsIntoPages(
        snap,
        "ОСОБОВІ РАХУНКИ СПІВВЛАСНИКІВ",
        subtitle,
        thead,
        rowHtmlList,
        notes
      );
      // перша сторінка лише KPI, далі таблиця
      const top0 = renderPageChrome(snap, "ОСОБОВІ РАХУНКИ СПІВВЛАСНИКІВ", subtitle, false);
      return pagesToSheetsHtml([{ top: top0, body: kpi }, ...pages2.map((p, i) => ({
        ...p,
        top: renderPageChrome(snap, "ОСОБОВІ РАХУНКИ СПІВВЛАСНИКІВ", subtitle, true)
      }))], snap);
    }
    return pagesToSheetsHtml(pages, snap);
  }

  function renderAccountsPodsReport(snap) {
    const byPod = new Map();
    snap.accounts.forEach(a => {
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
    const rowHtmlList = [];

    pods.forEach(pod => {
      const items = byPod.get(pod).slice().sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));
      rowHtmlList.push(`<tr class="gr-pod-head"><td colspan="8">ПІДʼЇЗД ${escapeHtml(pod)} (${items.length} квартир)</td></tr>`);
      items.forEach((a, idx) => {
        const paid = a.paymentsSum > EPS
          ? `<span class="gr-pos">${money(a.paymentsSum)}</span>`
          : `<span class="gr-neg">—</span>`;
        rowHtmlList.push(`<tr class="${idx % 2 ? "gr-zebra" : ""}">
          <td>${escapeHtml(a.kv)}</td>
          <td>${escapeHtml(a.fio)}</td>
          <td>${a.pers || 0} / ${String(a.pl).replace(".", ",")}</td>
          <td class="${debtClass(a.debitStart)}">${moneySigned(a.debitStart)}</td>
          <td>${money(a.chargesSum)}</td>
          <td>${paid}</td>
          <td class="${debtClass(a.debitEnd)}">${moneySigned(a.debitEnd)}</td>
          <td>${monthsDebtHtml(a.debtMonths, a.debitEnd)}</td>
        </tr>`);
      });
      const sum = (fn) => items.reduce((s, a) => s + fn(a), 0);
      rowHtmlList.push(`<tr class="gr-group-total">
        <td colspan="2">Разом по підʼїзду ${escapeHtml(pod)}:</td>
        <td>${money(sum(a => a.pl))}</td>
        <td>${moneySigned(sum(a => a.debitStart))}</td>
        <td>${money(sum(a => a.chargesSum))}</td>
        <td class="gr-pos">${money(sum(a => a.paymentsSum))}</td>
        <td>${moneySigned(sum(a => a.debitEnd))}</td>
        <td></td>
      </tr>`);
    });

    const thead = `<tr>
      <th>№ кв.</th><th>П.І.Б. власника</th><th>Осіб / Площа м²</th>
      <th>Було на ${escapeHtml(startLbl)}</th><th>Нараховано</th><th>Сплачено</th>
      <th>Стало на ${escapeHtml(endShort)}</th><th>Місяців боргу</th>
    </tr>`;

    const after = `
      <div class="gr-formula-row">
        <div class="gr-formula-card"><div class="gr-kpi-label">Нараховано</div><div class="gr-kpi-value">${money(snap.stats.totalCharges)}</div></div>
        <div class="gr-formula-op">−</div>
        <div class="gr-formula-card"><div class="gr-kpi-label">Сплачено</div><div class="gr-kpi-value gr-pos">${money(snap.stats.totalPaid)}</div></div>
        <div class="gr-formula-op">=</div>
        <div class="gr-formula-card"><div class="gr-kpi-label">Борг (сальдо)</div><div class="gr-kpi-value ${debtClass(snap.stats.netDebt)}">${moneySigned(snap.stats.netDebt)}</div></div>
      </div>
      <div class="gr-note-box" style="margin-top:10px">
        <strong>Умовні позначення:</strong>
        <span class="gr-neg">—</span> оплата відсутня;
        <span class="gr-neg">+</span> борг більше 3 місяців
      </div>`;

    const subtitle = `<div class="gr-subtitle">по підʼїздах та квартирах у порядку зростання номерів</div>`;
    return pagesToSheetsHtml(
      packTableRowsIntoPages(snap, "РЕЄСТР ЛИЦЕВИХ РАХУНКІВ", subtitle, thead, rowHtmlList, after),
      snap
    );
  }

  function renderSpendingList(spendingRows, total, fromYm, toYm) {
    const desc = describePeriod(fromYm, toYm);
    const title = desc.kind === "month"
      ? `ВИТРАТИ БУДИНКУ У ${MONTHS_UA_UPPER[fromYm.month - 1]} ${fromYm.year} р.`
      : `ВИТРАТИ БУДИНКУ ЗА ${desc.header}`;
    const lines = spendingRows.map(r =>
      `<div class="gr-spend-line"><span class="gr-spend-icon">●</span><span class="gr-spend-name">${escapeHtml(r.name)}</span><span class="gr-spend-dots"></span><span class="gr-spend-sum">${money(Math.abs(r.amount))} грн</span></div>`
    ).join("");
    return `
      <div class="gr-spend-block">
        <div class="gr-section-title">${title}</div>
        ${lines || `<div class="gr-muted">Немає витрат за обраний період.</div>`}
        <div class="gr-spend-total">РАЗОМ ВИТРАТИ: <strong>${money(total)} грн</strong></div>
      </div>
    `;
  }

  function mergeSpending(spendingByMonth) {
    const map = new Map();
    let total = 0;
    spendingByMonth.forEach(m => {
      (m.rows || []).forEach(r => {
        const key = r.name;
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
    const pages = [];
    let i = 0;
    while (i < bodyBlocks.length) {
      const isFirst = pages.length === 0;
      const pageTop = renderPageChrome(snap, title, "", !isFirst);
      let low = 1;
      let high = bodyBlocks.length - i;
      let best = 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const body = bodyBlocks.slice(i, i + mid).join("");
        if (measureSheetOverflow(pageTop, body).ok) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (best < 1) best = 1;
      pages.push({ top: pageTop, body: bodyBlocks.slice(i, i + best).join("") });
      i += best;
      if (pages.length > 50) break;
    }
    if (!pages.length) pages.push({ top, body: "" });
    return pagesToSheetsHtml(pages, snap);
  }

  function renderDebtsPoster(snap) {
    const debtors = snap.accounts
      .filter(a => a.debitEnd > EPS && a.debtMonths > 3)
      .sort((a, b) => b.debitEnd - a.debitEnd)
      .map(a => ({ kv: a.kv, amount: a.debitEnd }));
    const cols = splitIntoColumns(debtors, 4);
    const ratio = snap.stats.debtRatio;
    const ratioText = ratio > 0
      ? `це майже <strong><u>${ratio.toFixed(1).replace(".", ",")}</u></strong> місяці поточних витрат будинку!`
      : "";
    const spend = mergeSpending(snap.spendingByMonth);
    const colHtml = cols.map(col => {
      const rows = col.map(d =>
        `<div class="gr-debt-row"><span class="gr-debt-kv">${escapeHtml(d.kv)}</span><span>${money(d.amount)}</span></div>`
      ).join("");
      return `<div class="gr-debt-col">${rows}</div>`;
    }).join("");

    const blocks = [
      `<div class="gr-poster-amount">${money(snap.stats.totalPositiveDebt)} грн</div>`,
      `<div class="gr-poster-ratio">${ratioText}</div>`,
      `<div class="gr-black-bar">КВАРТИРИ ІЗ ЗАБОРГОВАНІСТЮ ПОНАД 3 МІСЯЦІ</div>`,
      `<div class="gr-debt-grid">${colHtml || `<div class="gr-muted">Немає квартир із боргом понад 3 місяці.</div>`}</div>`,
      renderSpendingList(spend.rows, spend.total, snap.fromYm, snap.toYm),
      `<div class="gr-callout">
        <div class="gr-callout-mark">!</div>
        <div>
          <p>Просимо власників квартир погасити заборгованість або звернутися до правління для узгодження графіка її погашення. Вчасна сплата внесків – запорука безпечного та комфортного життя у нашому будинку!</p>
          <p><strong>ДЯКУЄМО ВСІМ СПІВВЛАСНИКАМ, ЯКІ СВОЄЧАСНО СПЛАЧУЮТЬ ВНЕСКИ!</strong></p>
        </div>
      </div>`
    ];
    return packPosterPages(snap, "БОРГИ СПІВВЛАСНИКІВ", blocks);
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
      const podDebt = items.filter(a => a.debitEnd > EPS).reduce((s, a) => s + a.debitEnd, 0);
      const longDebt = items
        .filter(a => a.debitEnd > EPS && a.debtMonths > 3)
        .sort((a, b) => b.debitEnd - a.debitEnd)
        .map(a => ({ kv: a.kv, amount: a.debitEnd }));
      const cols = splitIntoColumns(longDebt, 4);
      const ratio = snap.avgSpend > EPS ? podDebt / snap.avgSpend : 0;
      const colHtml = cols.map(col => {
        const rows = col.map(d =>
          `<div class="gr-debt-row"><span class="gr-debt-kv">${escapeHtml(d.kv)}</span><span>${money(d.amount)}</span></div>`
        ).join("");
        return `<div class="gr-debt-col"><div class="gr-debt-col-head"><span>КВ.</span><span>БОРГ, грн</span></div>${rows}</div>`;
      }).join("");

      const title = `ПІДʼЇЗД №${pod}`;
      const blocks = [
        `<div class="gr-poster-caption">ЗАБОРГОВАНІСТЬ СПІВВЛАСНИКІВ ПІДʼЇЗДУ</div>`,
        `<div class="gr-poster-amount">${money(podDebt)} грн</div>`,
        `<div class="gr-poster-ratio">${ratio > 0 ? `це майже <strong><u>${ratio.toFixed(1).replace(".", ",")}</u></strong> місяці поточних витрат будинку` : ""}</div>`,
        `<div class="gr-black-bar">КВАРТИРИ ПІДʼЇЗДУ ІЗ ЗАБОРГОВАНІСТЮ ПОНАД 3 МІСЯЦІ</div>`,
        `<div class="gr-debt-grid">${colHtml || `<div class="gr-muted">Немає квартир із боргом понад 3 місяці.</div>`}</div>`,
        `<div class="gr-building-debt">Загальна заборгованість будинку: <strong>${money(snap.stats.totalPositiveDebt)} грн</strong></div>`,
        renderSpendingList(spend.rows, spend.total, snap.fromYm, snap.toYm),
        `<div class="gr-callout">
          <div class="gr-callout-mark">!</div>
          <div>
            <p>Просимо власників квартир погасити заборгованість або звернутися до правління для узгодження графіка її погашення. Вчасна сплата внесків – запорука безпечного та комфортного життя у нашому будинку!</p>
            <p><strong>ДЯКУЄМО ВСІМ СПІВВЛАСНИКАМ, ЯКІ СВОЄЧАСНО СПЛАЧУЮТЬ ВНЕСКИ!</strong></p>
          </div>
        </div>`
      ];
      return packPosterPages(snap, title, blocks);
    }).join("");
  }

  function renderReportHtml(typeId, snap) {
    switch (typeId) {
      case "payments": return renderPaymentsReport(snap);
      case "accountsDebt": return renderAccountsDebtReport(snap);
      case "accountsPods": return renderAccountsPodsReport(snap);
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

  function isTabular(typeId) {
    return !!(REPORT_TYPES.find(t => t.id === typeId) || {}).tabular;
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
    const typeId = document.getElementById("gr-type")?.value;
    const btn = document.getElementById("gr-excel");
    if (btn) btn.style.display = isTabular(typeId) ? "" : "none";
  }

  function renderHomePicker(list) {
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

  function renumberSheets(container) {
    const sheets = [...container.querySelectorAll(".gr-sheet")];
    const total = sheets.length || 1;
    sheets.forEach((sheet, i) => {
      const el = sheet.querySelector(".gr-page-num");
      if (el) el.textContent = `Сторінка ${i + 1} з ${total}`;
    });
    return sheets;
  }

  async function generateReports() {
    const typeId = document.getElementById("gr-type").value;
    const from = parseYm(document.getElementById("gr-from").value);
    const to = parseYm(document.getElementById("gr-to").value);
    const separate = !!document.getElementById("gr-separate")?.checked;
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

    const months = listMonthsInRange(from, to);
    const jobs = [];
    codes.forEach(code => {
      if (separate && months.length > 1) {
        months.forEach(m => jobs.push({ code, fromYm: m, toYm: m }));
      } else {
        jobs.push({ code, fromYm: from, toYm: to });
      }
    });

    out.innerHTML = "";
    document.getElementById("gr-actions").hidden = true;
    setProgress(0, jobs.length, "Підготовка…");

    const htmlParts = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const homeMeta = availableHomes().find(h => String(h.code) === String(job.code)) || { code: job.code, name: String(job.code) };
      setProgress(i, jobs.length, `${homeMeta.name} (${i + 1}/${jobs.length})…`);
      try {
        const home = await loadHomeForReport(job.code);
        // org3 з меню-об'єкта, якщо є
        if (!homeMeta.org3 && home.org3) homeMeta.org3 = home.org3;
        const snap = buildHomeSnapshot(home, homeMeta, job.fromYm, job.toYm);
        htmlParts.push(renderReportHtml(typeId, snap));
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
    grState.lastPages = sheets;
    grState.lastMeta = { typeId, from, to, separate, codes };
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
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: Math.round(mmToPx(A4_WIDTH_MM)),
        windowWidth: Math.round(mmToPx(A4_WIDTH_MM))
      });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      // одна HTML-сторінка = одна PDF-сторінка без стискання вмісту кількох сторінок в одну
      pdf.addImage(img, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    }

    const meta = grState.lastMeta || {};
    const name = `${buildDownloadBaseName(meta.typeId, meta.from, meta.to, meta.codes)}.pdf`;
    pdf.save(name);
    hideProgress();
  }

  async function downloadExcel() {
    if (!grState.lastMeta || !isTabular(grState.lastMeta.typeId)) return;
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
          const cells = [...tr.children].map(td => td.innerText.replace(/\s+/g, " ").trim());
          ws.addRow(cells);
        });
      } else {
        const blocks = [...page.querySelectorAll(".gr-pay-block")];
        ws.addRow(["Кв.", "П.І.Б.", "Дата", "Сума"]);
        blocks.forEach(block => {
          const head = block.querySelector(".gr-pay-apt");
          const strongs = head ? [...head.querySelectorAll("strong")] : [];
          const kv = strongs[0]?.textContent || "";
          const fio = strongs[1]?.textContent || "";
          block.querySelectorAll(".gr-pay-line").forEach(line => {
            const date = line.querySelector(".gr-pay-date")?.textContent || "";
            const sum = line.querySelector(".gr-pay-sum")?.textContent || "";
            ws.addRow([kv, fio, date, sum]);
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
    window.print();
    setTimeout(() => document.body.classList.remove("gr-printing"), 500);
  }

  window.renderGlobalReports = function renderGlobalReports() {
    document.body.classList.remove("files-mode");
    const list = availableHomes();
    grState.selectedCodes = list.length === 1 ? [list[0].code] : [];
    grState.allHomes = false;
    grState.lastPages = [];
    const def = defaultPeriod();

    const typeOptions = REPORT_TYPES.map(t =>
      `<option value="${t.id}">${escapeHtml(t.title)}</option>`
    ).join("");

    const container = document.getElementById("maincontainer");
    container.innerHTML = `
      <div class="gr-app">
        <div class="gr-toolbar no-print">
          <div class="gr-toolbar-grid">
            ${renderHomePicker(list)}
            <div class="gr-field">
              <label for="gr-type">Звіт</label>
              <select id="gr-type">${typeOptions}</select>
            </div>
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
            <div class="gr-field gr-actions-field">
              <button type="button" class="gr-btn gr-btn-primary" id="gr-generate">Сформувати</button>
            </div>
          </div>
          <div class="gr-progress" id="gr-progress" hidden>
            <div class="gr-progress-track"><div class="gr-progress-bar" id="gr-progress-bar"></div></div>
            <div class="gr-progress-label" id="gr-progress-label"></div>
          </div>
          <div class="gr-actions" id="gr-actions" hidden>
            <button type="button" class="gr-btn" id="gr-print">Друк</button>
            <button type="button" class="gr-btn" id="gr-pdf">PDF</button>
            <button type="button" class="gr-btn" id="gr-excel">Excel</button>
          </div>
        </div>
        <div id="gr-output" class="gr-output"></div>
      </div>
    `;

    bindHomePicker();
    document.getElementById("gr-from").addEventListener("change", updateSeparateVisibility);
    document.getElementById("gr-to").addEventListener("change", updateSeparateVisibility);
    document.getElementById("gr-type").addEventListener("change", updateExcelVisibility);
    document.getElementById("gr-generate").addEventListener("click", generateReports);
    document.getElementById("gr-print").addEventListener("click", printReports);
    document.getElementById("gr-pdf").addEventListener("click", downloadPdf);
    document.getElementById("gr-excel").addEventListener("click", downloadExcel);
    updateSeparateVisibility();
    updateExcelVisibility();
  };
})();
