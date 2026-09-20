const ANALIZ_DEBT_THRESHOLDS = [0, 3, 6, 12, 24];
const ANALIZ_DEFAULT_DEBT_THRESHOLD = 3;

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
      const chargesThisMonth = Object.values(accountNach?.[year]?.[month] || {}).reduce((s, v) => s + (Number(v) || 0), 0);
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
    row.debtorPaid = 0;
    row.debtorCount = 0;
    row.debtors = new Set();
    Object.keys(row.details).forEach(accountId => {
      const item = row.details[accountId];
      if (item.debt > 0.005 && item.age > debtThreshold) {
        row.debtorCharged += item.charged;
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
  const orderedCols = [
    "month", "totalCharged", "totalPaid", "percentPaid", "overpayPaid", "overpayDebtEnd", "overpayPercent",
    "debtorCharged", "debtorPaid", "debtorPercent", "debtorCount", "debtorPercentCount"
  ].filter(c => COLS[c].visible);
  const doubleSummaryCols = new Set(["totalCharged", "totalPaid", "overpayDebtEnd", "debtorCharged", "debtorPaid"]);
  const fmt = (type, val) => {
    const n = Number(val) || 0;
    if (type === "number" || type === "int") return Math.round(n).toLocaleString("uk-UA");
    if (type === "percent") return n.toFixed(1).replace(".", ",");
    return val;
  };

  let debtThreshold = Number(initialDebtThreshold) || ANALIZ_DEFAULT_DEBT_THRESHOLD;
  let splitIndexes = data.length > 1 ? [data.findIndex(r => r.month.startsWith("12.")) + 1 || Math.round(data.length / 2)] : [data.length];
  let activeSplit = splitIndexes[0] || data.length;
  let dragState = null;
  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.className = "analiz-table";
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const normalizeSplits = splits => [...new Set(splits.map(v => Math.round(Number(v) || 0)).filter(v => v >= 1 && v <= data.length))].sort((a, b) => a - b);
  const columnClass = (col, summaryCell) => {
    const prefix = summaryCell ? "summary" : "td";
    if (col.startsWith("total")) return `${prefix}-total`;
    if (col.startsWith("overpay")) return `${prefix}-overpay`;
    if (col.startsWith("debtor")) return `${prefix}-debtor`;
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
  const summaryValueHtml = (col, S) => {
    const type = COLS[col].type;
    const sumValue = Number(S[col]) || 0;
    const avgValue = S.rowCount ? sumValue / S.rowCount : 0;
    if (doubleSummaryCols.has(col)) return `<div class="summary-dual"><span>${fmt(type, sumValue)}</span><strong>${fmt(type, avgValue)}</strong></div>`;
    const value = (type === "number" || type === "int") ? avgValue : sumValue;
    return fmt(type, value);
  };

  function buildHeader() {
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
      th.className = gr.class;
      th.textContent = COLS[col].title;
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
    splitIndexes = normalizeSplits(splitIndexes);
    activeSplit = Math.min(Math.max(activeSplit, 1), data.length);
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
        td.textContent = fmt(COLS[col].type, r[col]);
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
    if (!wrapper._debtInfo) {
      wrapper._debtInfo = document.createElement("div");
      wrapper.appendChild(wrapper._debtInfo);
    }
    wrapper._debtInfo.innerHTML = "";
    const wasD = data[splitIndex - 1]?.debtors || new Set();
    const nowD = data[data.length - 1]?.debtors || new Set();
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
    const bottomS = summary(data.slice(splitIndex));
    const avgChBot = bottomS.rowCount ? bottomS.totalCharged / bottomS.rowCount : 0;
    const dPay = (bottomS.percentPaid - topS.percentPaid) * avgChBot / 100;
    const dDebt = (bottomS.debtorPercent - topS.debtorPercent) * avgChBot / 100;
    const textBlock = document.createElement("div");
    textBlock.style.cssText = "margin-top:15px; font-size:18px;";
    textBlock.innerHTML = `<span style="font-size:12px; color:gray;">Відносні показники:</span><br>
      ${dPay >= 0 ? "Зростання" : "Зменшення"} платежів: <span class="${dPay >= 0 ? "green" : "red"}">${Math.abs(dPay).toFixed(0)} грн</span><br>
      ${dDebt >= 0 ? "Зростання" : "Зменшення"} погашення боргів: <span class="${dDebt >= 0 ? "green" : "red"}">${Math.abs(dDebt).toFixed(0)} грн</span>`;
    wrapper._debtInfo.appendChild(textBlock);
    wrapper._debtInfo.appendChild(renderMigrationTable(splitIndex, data, monthsList, debtThreshold));
    initPosters();
  }

  buildHeader();
  table.append(thead, tbody);
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

function renderMigrationTable(splitIndex, resultData, fullMonths, debtThreshold) {
  const container = document.createElement("div");
  const dateWas = resultData[splitIndex - 1]?.month || "початок";
  const dateNow = resultData[resultData.length - 1]?.month || "кінець";
  container.innerHTML = `<h3 style="margin-top:25px; text-align:center;">Результати роботи з боржниками</h3>`;
  const table = document.createElement("table");
  table.className = "analiz-table trajectory-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width:50px" data-sort="kv">Кв</th>
        <th style="width:200px" data-sort="fio">ПІБ</th>
        <th style="width:140px" data-sort="status">Статус</th>
        <th data-sort="ageWas" data-excel-text="станом на ${dateWas}">станом на ${dateWas}</th>
        <th data-sort="ageNow" data-excel-text="станом на ${dateNow}">станом на ${dateNow}</th>
        <th style="width:80px" data-sort="diff">Зміна (міс)</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  const tbody = table.querySelector("tbody");
  const summary = [];
  Object.keys(ls).forEach(accId => {
    const dataWas = resultData[splitIndex - 1]?.details[accId] || { age: 0, debt: 0 };
    const dataNow = resultData[resultData.length - 1]?.details[accId] || { age: 0, debt: 0 };
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
        <td><span class="badge ${item.badgeClass}">${item.status}</span></td>
        <td style="text-align:right">${item.ageWas.toFixed(1)} <small style="color:gray;">(${Math.round(item.debtWas)})</small></td>
        <td style="text-align:right">${item.ageNow.toFixed(1)} <small style="color:gray;">(${Math.round(item.debtNow)})</small></td>
        <td style="text-align:right" class="${item.diff > 0 ? "red" : "green"}">${item.diff > 0 ? "+" : ""}${item.diff.toFixed(1)}</td>
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
