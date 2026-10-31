const ANALIZ_DEBT_THRESHOLDS = [0, 3, 6, 12, 24];
const ANALIZ_DEFAULT_DEBT_THRESHOLD = 3;
const ANALIZ_EXPANDED_CHARGES = { totalCharged: false, debtorCharged: false };

function generateAnaliz(start, end) {
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const result = months.map(monthDate => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    const monthEnd = new Date(year, month, 0, 12);
    const startDebtAnchor = new Date(year, month - 1, 0, 12);
    const row = {
      month: `${String(month).padStart(2, "0")}.${year}`,
      totalCharged: 0,
      chargedByService: {},
      totalPaid: 0,
      overpayCharged: 0,
      overpayPaid: 0,
      overpayDebtEnd: 0,
      totalCount: 0,
      totaldebitStart: 0,
      debtors: new Set(),
      details: {}
    };

    Object.keys(ls).forEach(accountId => {
      const accountNach = nach[accountId] || {};
      const accountOplat = oplat[accountId] || {};
      const debitStart = typeof calculateInitialDebit === "function"
        ? calculateInitialDebit(accountId, monthDate)
        : calculateAnalizInitialDebit(accountId, monthDate);
      const chargedByService = Object.fromEntries(Object.entries(accountNach?.[year]?.[month] || {}).map(([id, value]) => [id, Number(value) || 0]));
      Object.entries(chargedByService).forEach(([id, value]) => { row.chargedByService[id] = (row.chargedByService[id] || 0) + value; });
      const chargesThisMonth = Object.values(chargedByService).reduce((s, v) => s + (Number(v) || 0), 0);
      const paymentsThisMonth = (accountOplat?.[year]?.[month] || []).reduce((s, p) => s + (Number(p.sum) || 0), 0);
      const debitEnd = debitStart + chargesThisMonth - paymentsThisMonth;
      const startDebtMonths = calculateDebtMonthsFromCache(accountId, debitStart, startDebtAnchor);
      const debtMonths = calculateDebtMonthsFromCache(accountId, debitEnd, monthEnd);

      row.totaldebitStart += debitStart;
      row.totalCharged += chargesThisMonth;
      row.totalPaid += paymentsThisMonth;
      row.totalCount++;
      row.details[accountId] = {
        age: startDebtMonths,
        debt: debitStart,
        endAge: debtMonths,
        endDebt: debitEnd,
        charged: chargesThisMonth,
        chargedByService,
        paid: paymentsThisMonth
      };

      if (debitEnd <= 0) {
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      }
    });

    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
    return row;
  });

  applyAnalizDebtThreshold(result, ANALIZ_DEFAULT_DEBT_THRESHOLD);
  return renderAnalizTable(result, months, ANALIZ_DEFAULT_DEBT_THRESHOLD);
}

function calculateAnalizInitialDebit(accountId, monthDate) {
  let chargesBefore = 0;
  let paymentsBefore = 0;
  const accountNach = nach[accountId] || {};
  const accountOplat = oplat[accountId] || {};

  for (const y in accountNach) {
    for (const m in accountNach[y]) {
      const d = new Date(Number(y), Number(m) - 1, 1);
      if (d < monthDate) chargesBefore += Object.values(accountNach[y][m] || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    }
  }
  for (const y in accountOplat) {
    for (const m in accountOplat[y]) {
      const d = new Date(Number(y), Number(m) - 1, 1);
      if (d < monthDate) paymentsBefore += (accountOplat[y][m] || []).reduce((s, p) => s + (Number(p.sum) || 0), 0);
    }
  }
  return chargesBefore - paymentsBefore;
}

function applyAnalizDebtThreshold(data, debtThreshold) {
  data.forEach(row => {
    row.debtorCharged = 0;
    row.debtorChargedByService = {};
    row.debtorPaid = 0;
    row.debtorCount = 0;
    row.debtors = new Set();
    Object.keys(row.details).forEach(accountId => {
      const item = row.details[accountId];
      if (item.debt > 0.005 && item.age > debtThreshold) {
        row.debtorCharged += item.charged;
        Object.entries(item.chargedByService || {}).forEach(([id, value]) => {
          row.debtorChargedByService[id] = (row.debtorChargedByService[id] || 0) + value;
        });
        row.debtorPaid += item.paid;
        row.debtorCount++;
        row.debtors.add(accountId);
      }
    });
    row.debtorPercent = row.debtorCharged ? (row.debtorPaid / row.debtorCharged) * 100 : 0;
    row.debtorPercentCount = row.totalCount ? (row.debtorCount / row.totalCount) * 100 : 0;
  });
}

function renderAnalizTable(data, monthsList, initialDebtThreshold) {
  const COLS = {
    month: { title: "Місяць", type: "text", isValue: false, visible: true },
    totalCharged: { title: "Нараховано", type: "number", isValue: true, visible: true },
    totalPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    percentPaid: { title: "% оплати", type: "percent", isValue: true, visible: true },
    overpayPaid: { title: "Сплачено", type: "number", isValue: true, visible: false },
    overpayDebtEnd: { title: "Переплата", type: "number", isValue: true, visible: true },
    overpayPercent: { title: "% переплати", type: "percent", isValue: true, visible: false },
    debtorCharged: { title: "Нараховано", type: "number", isValue: true, visible: true },
    debtorPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    debtorPercent: { title: "% оплати", type: "percent", isValue: true, visible: true },
    debtorCount: { title: "Кількість", type: "int", isValue: true, visible: true },
    debtorPercentCount: { title: "% кв", type: "percent", isValue: true, visible: false }
  };
  const COL_GROUPS = [
    { title: "Всього по будинку", class: "th-total", cols: ["totalCharged", "totalPaid", "percentPaid"] },
    { title: "Переплатники", class: "th-overpay", cols: ["overpayPaid", "overpayDebtEnd", "overpayPercent"] },
    { title: "Борг понад", class: "th-debtor", cols: ["debtorCharged", "debtorPaid", "debtorPercent", "debtorCount", "debtorPercentCount"], debtor: true }
  ];
  const expandedCharges = ANALIZ_EXPANDED_CHARGES;
  let orderedCols = [];
  const serviceColumns = new Set();
  const doubleSummaryCols = new Set(["totalCharged", "totalPaid", "overpayDebtEnd", "debtorCharged", "debtorPaid"]);
  function refreshColumns() {
    serviceColumns.forEach(key => { delete COLS[key]; doubleSummaryCols.delete(key); });
    serviceColumns.clear();
    COL_GROUPS.forEach(group => {
      const base = group.debtor ? "debtorCharged" : "totalCharged";
      group.cols = group.cols.filter(key => !key.includes("Service:"));
      if (!group.cols.includes(base)) return;
      COLS[base].title = expandedCharges[base] ? "Всього нараховано" : "Нараховано";
      if (!expandedCharges[base]) return;
      const ids = new Set();
      data.forEach(row => Object.entries(row.details).forEach(([accountId, item]) => {
        if (group.debtor && !row.debtors.has(accountId)) return;
        Object.entries(item.chargedByService || {}).forEach(([id, value]) => {
          if (Math.abs(value) > 0.005) ids.add(id);
        });
      }));
      const keys = [...ids].sort((a,b) => Number(a) - Number(b)).map(id => {
        const key = (group.debtor ? "debtor" : "total") + "Service:" + id;
        COLS[key] = { title: (typeof usKr !== "undefined" && usKr[id]) || (typeof us !== "undefined" && us[id]) || `Послуга ${id}`, type: "number", isValue: true, visible: true };
        serviceColumns.add(key);
        doubleSummaryCols.add(key);
        data.forEach(row => { row[key] = (group.debtor ? row.debtorChargedByService : row.chargedByService)?.[id] || 0; });
        return key;
      });
      group.cols.splice(group.cols.indexOf(base), 0, ...keys);
    });
    orderedCols = ["month", ...COL_GROUPS.flatMap(group => group.cols)].filter(key => COLS[key].visible);
  }
  const fmt = (type, val) => {
    const n = Number(val) || 0;
    if (type === "number" || type === "int") return Math.round(n).toLocaleString("uk-UA");
    if (type === "percent") return n.toFixed(1).replace(".", ",");
    return val;
  };

  let debtThreshold = Number(initialDebtThreshold) || ANALIZ_DEFAULT_DEBT_THRESHOLD;
  let splitIndexes = data.flatMap((row, index) => row.month.startsWith("12.") ? [index + 1] : []);
  let activeSplit = 0;
  let selectedPeriod = "last";
  let migrationView = "status";
  let dragState = null;
  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.className = "analiz-table analiz-main-table";
  const colgroup = document.createElement("colgroup");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const normalizeSplits = splits => [...new Set(splits.map(v => Math.round(Number(v) || 0)).filter(v => v >= 1 && v <= data.length))].sort((a, b) => a - b);
  const emphasisClass = col => {
    if (serviceColumns.has(col)) return " analiz-charge-detail";
    if (["totalCharged", "totalPaid", "percentPaid", "debtorCharged", "debtorPaid", "debtorPercent"].includes(col)) {
      const base = col.startsWith("total") || col === "percentPaid" ? "totalCharged" : "debtorCharged";
      return " analiz-primary" + (col === base && expandedCharges[base] ? " analiz-charge-boundary" : "");
    }
    return "";
  };
  const columnClass = (col, summaryCell) => {
    const prefix = summaryCell ? "summary" : "td";
    if (col.startsWith("total")) return `${prefix}-total${emphasisClass(col)}`;
    if (col.startsWith("overpay")) return `${prefix}-overpay`;
    if (col.startsWith("debtor")) return `${prefix}-debtor${emphasisClass(col)}`;
    return "";
  };
  const sumField = (arr, field) => arr.reduce((a, r) => a + (Number(r[field]) || 0), 0);
  const summary = arr => {
    const dIDs = new Set();
    arr.forEach(r => r.debtors.forEach(id => dIDs.add(id)));
    const totalCharged = sumField(arr, "totalCharged");
    const debtorCharged = sumField(arr, "debtorCharged");
    const totalCount = sumField(arr, "totalCount");
    const debtorCount = sumField(arr, "debtorCount");
    return {
      ...Object.fromEntries([...serviceColumns].map(key => [key, sumField(arr, key)])),
      rowCount: arr.length,
      totalCharged,
      totalPaid: sumField(arr, "totalPaid"),
      percentPaid: totalCharged ? (sumField(arr, "totalPaid") / totalCharged) * 100 : 0,
      overpayPaid: sumField(arr, "overpayPaid"),
      overpayDebtEnd: sumField(arr, "overpayDebtEnd"),
      overpayPercent: arr.length ? arr.reduce((a, r) => a + (Number(r.overpayPercent) || 0), 0) / arr.length : 0,
      debtorCharged,
      debtorPaid: sumField(arr, "debtorPaid"),
      debtorPercent: debtorCharged ? (sumField(arr, "debtorPaid") / debtorCharged) * 100 : 0,
      debtorCount,
      debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,
      debtors: dIDs
    };
  };
  const comparableSummaryValue = (S, col) => {
    const type = COLS[col].type;
    if (doubleSummaryCols.has(col)) return S.rowCount ? (Number(S[col]) || 0) / S.rowCount : 0;
    if (type === "number" || type === "int") return S.rowCount ? (Number(S[col]) || 0) / S.rowCount : 0;
    return Number(S[col]) || 0;
  };
  const isChargeColumn = col => col === "totalCharged" || col === "debtorCharged" || serviceColumns.has(col);
  const displayValue = (col, value) => isChargeColumn(col) && Math.abs(Number(value) || 0) < 0.005 ? "—" : fmt(COLS[col].type, value);
  const summaryValueHtml = (col, S) => {
    const type = COLS[col].type;
    const sumValue = Number(S[col]) || 0;
    const avgValue = S.rowCount ? sumValue / S.rowCount : 0;
    if (doubleSummaryCols.has(col)) return `<div class="summary-dual"><span>${displayValue(col, sumValue)}</span><strong>${displayValue(col, avgValue)}</strong></div>`;
    const value = (type === "number" || type === "int") ? avgValue : sumValue;
    return fmt(type, value);
  };

  function buildHeader() {
    colgroup.innerHTML = "";
    let tableWidth = 0;
    orderedCols.forEach(key => {
      const type = COLS[key].type;
      const values = data.map(row => Number(row[key]) || 0);
      const maxLength = Math.max(0, ...values.map(value => fmt(type, value).length),
        fmt(type, values.reduce((sum, value) => sum + Math.abs(value), 0)).length);
      const width = key === "month" ? 100 : type === "percent" || type === "int" ? 82 : Math.max(96, maxLength * 10 + 16);
      const col = document.createElement("col");
      col.style.width = `${width}px`;
      colgroup.appendChild(col);
      tableWidth += width;
    });
    table.style.width = `${tableWidth}px`;
    thead.innerHTML = "";
    const tr1 = document.createElement("tr");
    const thMonth = document.createElement("th");
    thMonth.rowSpan = 2;
    thMonth.textContent = "Місяць";
    tr1.appendChild(thMonth);
    COL_GROUPS.forEach(gr => {
      const vis = gr.cols.filter(c => COLS[c].visible);
      if (!vis.length) return;
      const th = document.createElement("th");
      th.className = gr.class;
      th.colSpan = vis.length;
      if (gr.debtor) {
        th.dataset.excelText = `Борг понад ${debtThreshold} місяців`;
        const label = document.createElement("span");
        label.textContent = "Борг понад ";
        const select = document.createElement("select");
        select.className = "analiz-debt-threshold";
        ANALIZ_DEBT_THRESHOLDS.forEach(value => {
          const option = document.createElement("option");
          option.value = String(value);
          option.textContent = String(value);
          option.selected = value === debtThreshold;
          select.appendChild(option);
        });
        const suffix = document.createElement("span");
        suffix.textContent = " місяців";
        select.onmousedown = e => e.stopPropagation();
        select.onchange = () => {
          debtThreshold = Number(select.value);
          applyAnalizDebtThreshold(data, debtThreshold);
          redraw();
        };
        th.append(label, select, suffix);
      } else {
        th.textContent = gr.title;
      }
      tr1.appendChild(th);
    });
    const tr2 = document.createElement("tr");
    COL_GROUPS.forEach(gr => gr.cols.forEach(col => {
      if (!COLS[col].visible) return;
      const th = document.createElement("th");
      th.className = gr.class + emphasisClass(col);
      th.textContent = COLS[col].title;
      const chargeToggle = serviceColumns.has(col)
        ? (col.startsWith("debtor") ? "debtorCharged" : "totalCharged")
        : (Object.prototype.hasOwnProperty.call(expandedCharges, col) ? col : null);
      if (chargeToggle) {
        th.style.cursor = "pointer";
        th.tabIndex = 0;
        th.setAttribute("role", "button");
        th.setAttribute("aria-expanded", String(expandedCharges[chargeToggle]));
        th.title = expandedCharges[chargeToggle] ? "Згорнути нарахування за послугами" : "Розгорнути нарахування за послугами";
        const toggle = () => { expandedCharges[chargeToggle] = !expandedCharges[chargeToggle]; redraw(); };
        th.onclick = toggle;
        th.onkeydown = event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
        };
      }
      tr2.appendChild(th);
    }));
    thead.append(tr1, tr2);
  }

  function makeSummaryRow(S, label, splitIndex, className) {
    const tr = document.createElement("tr");
    tr.className = `summary-row ${className || ""}`.trim();
    tr.dataset.splitIndex = String(splitIndex);
    const first = document.createElement("td");
    first.textContent = label;
    tr.appendChild(first);
    orderedCols.slice(1).forEach(col => {
      const td = document.createElement("td");
      td.className = columnClass(col, true);
      td.innerHTML = summaryValueHtml(col, S);
      if (isChargeColumn(col) && Math.abs(Number(S[col]) || 0) < 0.005) td.dataset.analizChargeZero = "1";
      tr.appendChild(td);
    });
    tr.onmousedown = e => {
      if (e.button !== 0) return;
      dragState = { kind: "split", from: splitIndex, startY: e.clientY, startIndex: splitIndex };
      activeSplit = splitIndex;
      document.body.style.userSelect = "none";
      e.preventDefault();
    };
    return tr;
  }

  function makeSpacer() {
    const tr = document.createElement("tr");
    tr.className = "spacer";
    const td = document.createElement("td");
    td.colSpan = orderedCols.length;
    tr.appendChild(td);
    return tr;
  }

  function makeCompareRow(topS, bottomS) {
    const compareCols = orderedCols.filter(c => c !== "month" && COLS[c].isValue);
    const rowCmp = document.createElement("tr");
    rowCmp.className = "compare-row";
    const tdLabel = document.createElement("td");
    tdLabel.innerHTML = `<div><span style="color:gray;">Було</span><br><span style="color:green;">Стало</span></div>`;
    rowCmp.appendChild(tdLabel);
    compareCols.forEach(col => {
      const td = document.createElement("td");
      td.className = emphasisClass(col).trim();
      td.style.height = "60px";
      td.style.verticalAlign = "bottom";
      const v1 = comparableSummaryValue(topS, col);
      const v2 = comparableSummaryValue(bottomS, col);
      const maxV = Math.max(Math.abs(v1), Math.abs(v2), 1);
      const h1 = (Math.abs(v1) / maxV) * 60;
      const h2 = (Math.abs(v2) / maxV) * 60;
      const posBetter = ["totalPaid", "percentPaid", "debtorPaid", "debtorPercent"].includes(col);
      let color = "#808080";
      if (v1 !== v2) color = posBetter ? (v2 > v1 ? "#006400" : "#8B0000") : (v2 < v1 ? "#006400" : "#8B0000");
      td.innerHTML = `<div style="display:flex; gap:4px; align-items:flex-end; justify-content:center; height:60px;">
        <div style="width:30px; height:${h1}px; background:gray; border-radius:2px;"></div>
        <div style="width:30px; height:${h2}px; background:${color}; border-radius:2px;"></div>
      </div>`;
      rowCmp.appendChild(td);
    });
    return rowCmp;
  }

  function redraw() {
    refreshColumns();
    buildHeader();
    splitIndexes = normalizeSplits(splitIndexes);
    activeSplit = splitIndexes.filter(index => index < data.length).pop() || 0;
    tbody.innerHTML = "";
    const splitSet = new Set(splitIndexes);
    let segmentStart = 0;
    let activeTopSummary = null;
    let activeBottomSummary = null;
    data.forEach((r, index) => {
      const tr = document.createElement("tr");
      orderedCols.forEach(col => {
        const td = document.createElement("td");
        td.className = columnClass(col, false);
        td.textContent = displayValue(col, r[col]);
        if (isChargeColumn(col) && Math.abs(Number(r[col]) || 0) < 0.005) td.dataset.analizChargeZero = "1";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      const boundary = index + 1;
      if (splitSet.has(boundary)) {
        const part = data.slice(segmentStart, boundary);
        const S = summary(part);
        tbody.appendChild(makeSummaryRow(S, `В середньому (${S.rowCount} міс.):`, boundary, boundary === data.length ? "top-summary bottom-split" : "top-summary"));
        if (boundary === activeSplit) {
          activeTopSummary = S;
          activeBottomSummary = summary(data.slice(boundary));
        }
        segmentStart = boundary;
        if (boundary < data.length) tbody.appendChild(makeSpacer());
      }
    });

    if (!splitSet.has(data.length)) {
      const lastSplit = splitIndexes.length ? splitIndexes[splitIndexes.length - 1] : 0;
      const totalS = summary(data.slice(lastSplit));
      const totalRow = makeSummaryRow(totalS, `В середньому (${totalS.rowCount} міс.):`, data.length, "bottom-summary");
      totalRow.onmousedown = e => {
        if (e.button !== 0) return;
        dragState = { kind: "new", startY: e.clientY, startIndex: data.length };
        document.body.style.userSelect = "none";
        e.preventDefault();
      };
      tbody.appendChild(totalRow);
    }
    if (activeSplit < data.length && activeTopSummary && activeBottomSummary) tbody.appendChild(makeCompareRow(activeTopSummary, activeBottomSummary));
    updateDebtInfo(activeSplit);
  }

  function setSplit(from, next) {
    next = Math.min(Math.max(1, next), data.length);
    splitIndexes = from === null ? [...splitIndexes, next] : splitIndexes.map(v => v === from ? next : v);
    splitIndexes = normalizeSplits(splitIndexes);
    activeSplit = next;
    redraw();
  }

  function updateDebtInfo(splitIndex) {
    const boundaries = [0, ...splitIndexes.filter(index => index < data.length), data.length];
    const periods = boundaries.slice(1).map((end, index) => ({ start: boundaries[index], end }));
    if (!data.length) return;
    const periodIndex = selectedPeriod === "all" ? -1
      : selectedPeriod === "last" ? periods.length - 1
      : Math.min(Number(selectedPeriod), periods.length - 1);
    const period = periodIndex < 0 ? { start: 0, end: data.length } : periods[periodIndex];
    splitIndex = period.start;
    if (!wrapper._debtInfo) {
      wrapper._debtInfo = document.createElement("div");
      wrapper.appendChild(wrapper._debtInfo);
    }
    wrapper._debtInfo.innerHTML = "";
    const debtorsAtEnd = row => new Set(Object.entries(row?.details || {})
      .filter(([, item]) => item.endDebt > 0.005 && item.endAge > debtThreshold)
      .map(([accountId]) => accountId));
    const wasD = splitIndex > 0 ? debtorsAtEnd(data[splitIndex - 1]) : new Set(
      Object.entries(data[0]?.details || {})
        .filter(([, item]) => item.debt > 0.005 && item.age > debtThreshold)
        .map(([accountId]) => accountId));
    const nowD = debtorsAtEnd(data[period.end - 1]);
    const still = [...wasD].filter(x => nowD.has(x));
    const paidOff = [...wasD].filter(x => !nowD.has(x));
    const added = [...nowD].filter(x => !wasD.has(x));
    const addPoster = (title, list, color) => {
      const p = document.createElement("div");
      p.className = "poster";
      p.style.cssText = `display:inline-block; margin:6px 12px 6px 0; padding:6px 10px; border:1px solid #aaa; border-radius:6px; background:#fafafa; font-weight:bold; color:${color};`;
      p.textContent = `${title}: ${list.length}`;
      const d = document.createElement("div");
      d.className = "descr";
      d.innerHTML = list.map(acc => `кв.${ls[acc].kv} ${ls[acc].fio}`).join("<br>");
      if (list.length) p.appendChild(d);
      wrapper._debtInfo.appendChild(p);
    };
    addPoster("Нові боржники", added, "#8B0000");
    addPoster("Погасили борг", paidOff, "#006400");
    addPoster("Залишились боржникми", still, "#444");

    const topS = summary(data.slice(0, splitIndex));
    const bottomS = summary(data.slice(splitIndex, period.end));
    const avgChBot = bottomS.rowCount ? bottomS.totalCharged / bottomS.rowCount : 0;
    const dPay = (bottomS.percentPaid - topS.percentPaid) * avgChBot / 100;
    const dDebt = (bottomS.debtorPercent - topS.debtorPercent) * avgChBot / 100;
    const textBlock = document.createElement("div");
    textBlock.style.cssText = "margin-top:15px; font-size:18px;";
    textBlock.innerHTML = `<span style="font-size:12px; color:gray;">Відносні показники:</span><br>
      ${dPay >= 0 ? "Зростання" : "Зменшення"} платежів: <span class="${dPay >= 0 ? "green" : "red"}">${Math.abs(dPay).toFixed(0)} грн</span><br>
      ${dDebt >= 0 ? "Зростання" : "Зменшення"} погашення боргів: <span class="${dDebt >= 0 ? "green" : "red"}">${Math.abs(dDebt).toFixed(0)} грн</span>`;
    wrapper._debtInfo.appendChild(textBlock);
    const label = document.createElement("label");
    label.style.cssText = "display:block; margin:20px 0 12px; text-align:center;";
    const hasPeriodChoice = periods.length > 1;
    label.textContent = hasPeriodChoice ? "Період: " : "";
    const select = document.createElement("select");
    select.className = "analiz-migration-period";
    const periodLabel = ({ start, end }) => {
      const first = data[start].month;
      const last = data[end - 1].month;
      const year = first.slice(3);
      return first === `01.${year}` && last === `12.${year}`
        ? `${year} рік` : `${first}–${last}`;
    };
    periods.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = periodLabel(item);
      option.selected = index === periodIndex;
      select.appendChild(option);
    });
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = `Весь інтервал: ${data[0].month}–${data[data.length - 1].month}`;
    allOption.selected = periodIndex < 0;
    select.appendChild(allOption);
    select.onchange = () => {
      selectedPeriod = select.value === "all" ? "all"
        : Number(select.value) === periods.length - 1 ? "last" : select.value;
      updateDebtInfo(activeSplit);
    };
    if (hasPeriodChoice) label.appendChild(select);
    const viewLabel = document.createElement("span");
    viewLabel.textContent = " Тип таблиці: ";
    viewLabel.style.marginLeft = hasPeriodChoice ? "16px" : "0";
    const viewSelect = document.createElement("select");
    viewSelect.setAttribute("aria-label", "Тип таблиці");
    [["status", "Статуси боржників"], ["details", "Нарахування та оплати"]].forEach(([value, title]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = title;
      option.selected = migrationView === value;
      viewSelect.appendChild(option);
    });
    viewSelect.onchange = () => {
      migrationView = viewSelect.value;
      migrationSort = { col: "diff", desc: true };
      updateDebtInfo(activeSplit);
    };
    label.append(viewLabel, viewSelect);
    wrapper._debtInfo.appendChild(label);
    wrapper._debtInfo.appendChild(renderMigrationTable(0, data.slice(period.start, period.end), monthsList.slice(period.start, period.end), debtThreshold, migrationView));
    initPosters();
  }

  table.append(colgroup, thead, tbody);
  wrapper.appendChild(table);
  redraw();

  document.addEventListener("mousemove", e => {
    if (!dragState) return;
    const firstRow = tbody.querySelector("tr:not(.summary-row):not(.spacer):not(.compare-row)");
    const rowHeight = firstRow?.offsetHeight || 25;
    const delta = Math.round((e.clientY - dragState.startY) / rowHeight);
    const next = Math.min(Math.max(1, dragState.startIndex + delta), data.length);
    if (dragState.kind === "new") {
      if (next < data.length) {
        setSplit(null, next);
        dragState = { kind: "split", from: next, startY: e.clientY, startIndex: next };
      }
    } else if (next !== dragState.from) {
      const prev = dragState.from;
      setSplit(prev, next);
      dragState.from = next;
      dragState.startY = e.clientY;
      dragState.startIndex = next;
    }
  });
  document.addEventListener("mouseup", () => {
    dragState = null;
    document.body.style.userSelect = "";
  });

  return wrapper;
}

let migrationSort = { col: "diff", desc: true };

function renderMigrationTable(splitIndex, resultData, fullMonths, debtThreshold, view = "status") {
  const detailed = view === "details";
  const container = document.createElement("div");
  const wasMonth = resultData[splitIndex - 1]?.month;
  let dateWas = resultData[0]?.month || "початок";
  if (wasMonth) {
    const [month, year] = wasMonth.split(".").map(Number);
    const nextMonth = new Date(year, month, 1);
    dateWas = `${String(nextMonth.getMonth() + 1).padStart(2, "0")}.${nextMonth.getFullYear()}`;
  }
  const dateNow = resultData[resultData.length - 1]?.month || "кінець";
  container.innerHTML = `<h3 style="margin-top:25px; text-align:center;">Результати роботи з боржниками</h3>`;
  const table = document.createElement("table");
  table.className = "analiz-table trajectory-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width:50px" data-sort="kv">Кв</th>
        <th style="width:200px" data-sort="fio">ПІБ</th>
        ${detailed ? "" : '<th style="width:140px" data-sort="status">Статус</th>'}
        <th data-sort="ageWas" data-excel-text="${detailed ? 'Місяців боргу ' : ''}на початок ${dateWas}">${detailed ? 'Місяців боргу<br>' : ''}на початок ${dateWas}</th>
        ${detailed ? '<th data-sort="charged">Нараховано</th><th data-sort="paid">Сплачено</th>' : ''}
        <th data-sort="ageNow" data-excel-text="${detailed ? 'Місяців боргу ' : ''}на кінець ${dateNow}">${detailed ? 'Місяців боргу<br>' : ''}на кінець ${dateNow}</th>
        <th style="width:80px" data-sort="diff">Зміна (міс)</th>
        ${detailed ? '<th data-sort="debtNow">Сума боргу на кінець періоду</th>' : ''}
      </tr>
    </thead>
    <tbody></tbody>`;
  const tbody = table.querySelector("tbody");
  const summary = [];
  Object.keys(ls).forEach(accId => {
    // The split month's closing balance is the next month's opening balance.
    const wasDetails = (splitIndex > 0 ? resultData[splitIndex - 1] : resultData[0])?.details[accId];
    const nowDetails = resultData[resultData.length - 1]?.details[accId];
    const dataWas = splitIndex > 0
      ? { age: wasDetails?.endAge || 0, debt: wasDetails?.endDebt || 0 }
      : { age: wasDetails?.age || 0, debt: wasDetails?.debt || 0 };
    const dataNow = { age: nowDetails?.endAge || 0, debt: nowDetails?.endDebt || 0 };
    const isWas = dataWas.debt > 0.005 && dataWas.age > debtThreshold;
    const isNow = dataNow.debt > 0.005 && dataNow.age > debtThreshold;
    if (!isWas && !isNow) return;
    let status = "", badgeClass = "";
    if (isWas && !isNow) {
      status = "ПОГАШЕННЯ";
      badgeClass = "green";
    } else if (!isWas && isNow) {
      status = "НОВИЙ боржник";
      badgeClass = "red";
    } else {
      status = "БОРЖНИК";
      badgeClass = "badge-gray";
    }
    summary.push({
      accountId: accId,
      kv: parseInt(ls[accId].kv, 10),
      fio: ls[accId].fio,
      status,
      badgeClass,
      ageWas: dataWas.age,
      debtWas: dataWas.debt,
      ageNow: dataNow.age,
      debtNow: dataNow.debt,
      charged: resultData.slice(splitIndex).reduce((sum, row) => sum + (row.details[accId]?.charged || 0), 0),
      paid: resultData.slice(splitIndex).reduce((sum, row) => sum + (row.details[accId]?.paid || 0), 0),
      diff: dataNow.age - dataWas.age
    });
  });
  const draw = () => {
    const sorted = [...summary].sort((a, b) => {
      const vA = a[migrationSort.col], vB = b[migrationSort.col];
      if (typeof vA === "string") return migrationSort.desc ? vB.localeCompare(vA) : vA.localeCompare(vB);
      if (vA < vB) return migrationSort.desc ? 1 : -1;
      if (vA > vB) return migrationSort.desc ? -1 : 1;
      return 0;
    });
    tbody.innerHTML = sorted.map(item => `
      <tr data-account-id="${item.accountId}">
        <td style="text-align:center">${item.kv}</td>
        <td>${item.fio}</td>
        ${detailed ? '' : `<td><span class="badge ${item.badgeClass}">${item.status}</span></td>`}
        <td style="text-align:right">${item.ageWas.toFixed(1)}${detailed ? '' : ` <small style="color:gray;">(${Math.round(item.debtWas)})</small>`}</td>
        ${detailed ? `<td style="text-align:right">${Math.round(item.charged).toLocaleString('uk-UA')}</td><td style="text-align:right">${Math.round(item.paid).toLocaleString('uk-UA')}</td>` : ''}
        <td style="text-align:right">${item.ageNow.toFixed(1)}${detailed ? '' : ` <small style="color:gray;">(${Math.round(item.debtNow)})</small>`}</td>
        <td style="text-align:right" class="${item.diff > 0 ? "red" : "green"}">${item.diff > 0 ? "+" : ""}${item.diff.toFixed(1)}</td>
        ${detailed ? `<td style="text-align:right">${Math.round(item.debtNow).toLocaleString('uk-UA')}</td>` : ''}
      </tr>`).join("");
  };
  table.querySelector("thead").onclick = e => {
    const th = e.target.closest("th");
    if (!th || !th.dataset.sort) return;
    const col = th.dataset.sort;
    migrationSort.desc = migrationSort.col === col ? !migrationSort.desc : true;
    migrationSort.col = col;
    draw();
  };
  tbody.onclick = e => {
    const tr = e.target.closest("tr");
    if (tr && tr.dataset.accountId) goToAccount(tr.dataset.accountId);
  };
  draw();
  container.appendChild(table);
  return container;
}
