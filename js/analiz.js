function generateAnaliz(start, end) {
  // === 1. Список месяцев ===
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const result = [];

  // Вспомогательная функция для расчета дебета (внутри generateAnaliz)
  function calculateCurrentDebitLocal(accountId, date) {
    let totalNach = 0;
    let totalOplat = 0;
    for (const y in nach[accountId]) {
      for (const m in nach[accountId][y]) {
        if (new Date(y, m - 1) <= date) {
          totalNach += Object.values(nach[accountId][y][m]).reduce((a, b) => a + b, 0);
          totalOplat += (oplat[accountId]?.[y]?.[m] || []).reduce((s, p) => s + p.sum, 0);
        }
      }
    }
    return totalNach - totalOplat;
  }

  // === 2. Формирование строк данных ===
  months.forEach(monthDate => {
    let row = {
      month: `${String(monthDate.getMonth() + 1).padStart(2, '0')}.${monthDate.getFullYear()}`,
      totalCharged: 0,
      totalPaid: 0,
      overpayCharged: 0,
      overpayPaid: 0,
      overpayDebtEnd: 0,
      debtorCharged: 0,
      debtorPaid: 0,
      debtorCount: 0,
      totalCount: 0,
      totaldebitStart: 0,
      debtors: new Set(),
      details: {} // Кэш возраста для траектории
    };

    Object.keys(ls).forEach(accountId => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;

      // Расчет баланса
      const debitEnd = calculateCurrentDebitLocal(accountId, monthDate);
      const chargesThisMonth = Object.values(nach[accountId]?.[year]?.[month] || {}).reduce((s, v) => s + v, 0);
      const paymentsThisMonth = (oplat[accountId]?.[year]?.[month] || []).reduce((s, p) => s + p.sum, 0);
      const debitStart = debitEnd - chargesThisMonth + paymentsThisMonth;

      row.totaldebitStart += debitStart;
      row.totalCharged += chargesThisMonth;
      row.totalPaid += paymentsThisMonth;
      row.totalCount++;

      // Считаем возраст долга (из внешнего table.js)
      const age = calculateDebtMonthsFromCache(accountId, debitEnd, monthDate);
      row.details[accountId] = age; 

      if (debitEnd <= 0) {
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      } else if (age > 3) {
        row.debtorCharged += debitStart;
        row.debtorPaid += paymentsThisMonth;
        row.debtorCount++;
        row.debtors.add(accountId);
      }
    });

    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
    row.debtorPercent = row.totalCharged ? (row.debtorPaid / row.totalCharged) * 100 : 0;
    row.debtorPercentCount = row.totalCount ? (row.debtorCount / row.totalCount) * 100 : 0;

    result.push(row);
  });

  // --- ВНУТРЕННИЕ ФУНКЦИИ ОБРАБОТКИ ---

  function getTrajectoryData(splitIndex) {
    const trajectory = [];
    Object.keys(ls).forEach(accountId => {
      let history = result.map((m, idx) => ({
        isDebtor: m.details[accountId] > 3,
        age: m.details[accountId],
        date: months[idx]
      }));

      let filtered = history.map(h => ({...h}));
      for (let i = 1; i < filtered.length; i++) {
        if (filtered[i].isDebtor !== filtered[i-1].isDebtor) {
          let status = filtered[i].isDebtor;
          let dur = 0;
          for (let j = i; j < filtered.length; j++) {
            if (filtered[j].isDebtor === status) dur++; else break;
          }
          if (dur <= 3 && (i + dur < filtered.length)) {
            for (let k = i; k < i + dur; k++) filtered[k].isDebtor = !status;
          }
        }
      }

      for (let i = 1; i < filtered.length; i++) {
        if (filtered[i].isDebtor !== filtered[i-1].isDebtor) {
          const curr = filtered[i];
          const isFinal = filtered.slice(i).every(h => h.isDebtor === curr.isDebtor);
          let cat = curr.isDebtor ? (isFinal ? "Новий стабільний боржник" : "Тимчасовий боржник") 
                                  : (isFinal ? "Виправлений (стабільний)" : "Тимчасово виправлений");
          trajectory.push({
            kv: ls[accountId].kv, fio: ls[accountId].fio, category: cat,
            month: `${String(curr.date.getMonth()+1).padStart(2,'0')}.${curr.date.getFullYear()}`,
            age: curr.age.toFixed(1), period: i < splitIndex ? 1 : 2, rawDate: curr.date
          });
        }
      }
    });
    return trajectory;
  }

  function renderTrajectoryTable(trajectory) {
    const container = document.createElement("div");
    container.className = "trajectory-container";
    container.innerHTML = `<h3 style="margin-top:25px;">Журнал міграції заборгованості (подія > 3 міс.)</h3>`;
    const table = document.createElement("table");
    table.className = "analiz-table trajectory-table";
    table.innerHTML = `<thead><tr><th>Кв</th><th>ПІБ</th><th>Категорія</th><th>Місяць</th><th>Вік</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = trajectory.map(item => `
      <tr style="border-left: 4px solid ${item.period === 1 ? '#ccc' : '#006400'}">
        <td>${item.kv}</td><td>${item.fio}</td>
        <td><span class="badge ${item.category.includes('боржник') ? 'red' : 'green'}">${item.category}</span></td>
        <td>${item.month}</td><td>${item.age}</td>
      </tr>`).join('');
    container.appendChild(table);
    return container;
  }

  // Основная функция рендеринга и управления
  return renderAnalizUI(result, getTrajectoryData, renderTrajectoryTable);
}

function renderAnalizUI(data, getTrajectoryData, renderTrajectoryTable) {
  const COLS = {
    month: { title: "Місяць", type: "text", isValue: false, visible: true },
    totalCharged: { title: "Нараховано", type: "number", isValue: true, visible: true },
    totalPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    percentPaid: { title: "% оплати", type: "percent", isValue: true, visible: true },
    overpayPaid: { title: "Сплачено", type: "number", isValue: true, visible: false },
    overpayDebtEnd: { title: "Переплата", type: "number", isValue: true, visible: true },
    overpayPercent: { title: "% переплати", type: "percent", isValue: true, visible: false },
    debtorPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    debtorPercent: { title: "% оплати", type: "percent", isValue: true, visible: true },
    debtorCount: { title: "К-сть", type: "int", isValue: true, visible: true },
    debtorPercentCount: { title: "% кв", type: "percent", isValue: true, visible: false }
  };

  const COL_GROUPS = [
    { title: "Всього по будинку", class: "th-total", cols: ["totalCharged","totalPaid","percentPaid"] },
    { title: "Переплатники", class: "th-overpay", cols: ["overpayPaid","overpayDebtEnd","overpayPercent"] },
    { title: "Боржники", class: "th-debtor", cols: ["debtorPaid","debtorPercent","debtorCount","debtorPercentCount"] }
  ];

  const fmt = (type, val) => (type === "number" || type === "int") ? Math.round(val) : (type === "percent") ? val.toFixed(1) : val;
  const orderedCols = Object.keys(COLS).filter(c => COLS[c].visible);

  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.className = "analiz-table";
  
  // Шапка
  const thead = document.createElement("thead");
  const tr1 = document.createElement("tr");
  const thMonth = document.createElement("th"); thMonth.rowSpan = 2; thMonth.textContent = "Місяць"; tr1.appendChild(thMonth);
  COL_GROUPS.forEach(gr => {
    const vis = gr.cols.filter(c => COLS[c].visible);
    if (vis.length) {
      const th = document.createElement("th"); th.className = gr.class; th.colSpan = vis.length; th.textContent = gr.title; tr1.appendChild(th);
    }
  });
  const tr2 = document.createElement("tr");
  COL_GROUPS.forEach(gr => {
    gr.cols.forEach(col => {
      if (COLS[col].visible) {
        const th = document.createElement("th"); th.className = gr.class; th.textContent = COLS[col].title; tr2.appendChild(th);
      }
    });
  });
  thead.append(tr1, tr2); table.appendChild(thead);

  // Тело
  const tbody = document.createElement("tbody");
  const rows = data.map(r => {
    const tr = document.createElement("tr");
    orderedCols.forEach(col => {
      const td = document.createElement("td");
      td.className = col.startsWith("total") ? "td-total" : col.startsWith("overpay") ? "td-overpay" : col.startsWith("debtor") ? "td-debtor" : "";
      td.textContent = fmt(COLS[col].type, r[col]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    return tr;
  });

  const topSummary = document.createElement("tr"); topSummary.className = "summary-row top-summary";
  const spacer = document.createElement("tr"); spacer.className = "spacer"; spacer.style.height = "10px";
  const bottomSummary = document.createElement("tr"); bottomSummary.className = "summary-row bottom-summary";

  // Функция ОБНОВЛЕНИЯ (вместо updateSummaries)
  const updateSummaries = (splitIndex) => {
    const topData = data.slice(0, splitIndex);
    const bottomData = data.slice(splitIndex);
    const sum = (arr, f) => arr.reduce((a, r) => a + (r[f] || 0), 0);

    const calc = (arr) => {
      const tCount = sum(arr, "totalCount");
      return {
        rowCount: arr.length,
        totalCharged: sum(arr, "totalCharged"),
        totalPaid: sum(arr, "totalPaid"),
        percentPaid: tCount ? (sum(arr, "totalPaid") / sum(arr, "totalCharged")) * 100 : 0,
        overpayDebtEnd: sum(arr, "overpayDebtEnd"),
        debtorPaid: sum(arr, "debtorPaid"),
        debtorPercent: sum(arr, "totalCharged") ? (sum(arr, "debtorPaid") / sum(arr, "totalCharged")) * 100 : 0,
        debtorCount: sum(arr, "debtorCount")
      };
    };

    const topS = calc(topData), botS = calc(bottomData);

    const fillRow = (tr, S) => {
      tr.innerHTML = `<td style="font-weight:bold">Середнє (${S.rowCount} міс.):</td>`;
      orderedCols.slice(1).forEach(col => {
        const td = document.createElement("td");
        let val = S[col];
        if (COLS[col].type === "number" || COLS[col].type === "int") val = S.rowCount ? val / S.rowCount : 0;
        td.textContent = fmt(COLS[col].type, val);
        tr.appendChild(td);
      });
    };

    const ref = rows[splitIndex - 1];
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();
    if (ref) { ref.after(topSummary); topSummary.after(spacer); }
    fillRow(topSummary, topS); fillRow(bottomSummary, botS);

    // Траектория
    if (!wrapper._trajBox) {
      wrapper._trajBox = document.createElement("div");
      wrapper.appendChild(wrapper._trajBox);
    }
    wrapper._trajBox.innerHTML = "";
    const trajData = getTrajectoryData(splitIndex);
    wrapper._trajBox.appendChild(renderTrajectoryTable(trajData));
    
    if (window.initPosters) initPosters();
  };

  tbody.appendChild(bottomSummary); table.appendChild(tbody); wrapper.appendChild(table);

  // Инициализация ползунка
  let splitIndex = data.length > 1 ? (data.findIndex(r => r.month.startsWith("12.")) + 1 || Math.round(data.length/2)) : data.length;
  
  // DRAG LOGIC
  let isDragging = false, startY = 0, startIndex = 0;
  topSummary.style.cursor = "ns-resize";
  topSummary.onmousedown = e => { isDragging = true; startY = e.clientY; startIndex = splitIndex; document.body.style.userSelect = "none"; };
  document.onmousemove = e => {
    if (!isDragging) return;
    const delta = Math.round((e.clientY - startY) / (rows[0].offsetHeight || 25));
    const next = Math.min(Math.max(1, startIndex + delta), rows.length);
    if (next !== splitIndex) { splitIndex = next; updateSummaries(splitIndex); }
  };
  document.onmouseup = () => { isDragging = false; document.body.style.userSelect = ""; };

  // ПЕРВЫЙ ЗАПУСК
  setTimeout(() => updateSummaries(splitIndex), 0);

  return wrapper;
}