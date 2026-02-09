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

  // === 2. Формирование строк данных (основной расчет) ===
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
      details: {} // Кэш возраста долга для каждой квартиры в этом месяце
    };

    Object.keys(ls).forEach(accountId => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;

      const debitEnd = calculateCurrentDebitLocal(accountId, monthDate);
      const chargesThisMonth = Object.values(nach[accountId]?.[year]?.[month] || {}).reduce((s, v) => s + v, 0);
      const paymentsThisMonth = (oplat[accountId]?.[year]?.[month] || []).reduce((s, p) => s + p.sum, 0);
      const debitStart = debitEnd - chargesThisMonth + paymentsThisMonth;

      // Считаем возраст (функция из table.js)
      const age = calculateDebtMonthsFromCache(accountId, debitEnd, monthDate);
      row.details[accountId] = age; 

      row.totaldebitStart += debitStart;
      row.totalCharged += chargesThisMonth;
      row.totalPaid += paymentsThisMonth;
      row.totalCount++;

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

  // --- ВНУТРЕННИЕ ФУНКЦИИ ОБРАБОТКИ ТРАЕКТОРИИ ---

  function getTrajectoryData(splitIndex) {
    const trajectory = [];
    Object.keys(ls).forEach(accountId => {
      let history = result.map((m, idx) => ({
        isDebtor: m.details[accountId] > 3,
        age: m.details[accountId],
        date: months[idx]
      }));

      // Фильтр "шума" (дребезг 3 месяца)
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

      // Поиск точек перехода
      for (let i = 1; i < filtered.length; i++) {
        if (filtered[i].isDebtor !== filtered[i-1].isDebtor) {
          const curr = filtered[i];
          const isFinal = filtered.slice(i).every(h => h.isDebtor === curr.isDebtor);
          let cat = curr.isDebtor ? (isFinal ? "Новий стабільний боржник" : "Тимчасовий боржник") 
                                  : (isFinal ? "Виправлений (стабільний)" : "Тимчасово виправлений");
          trajectory.push({
            kv: parseInt(ls[accountId].kv), 
            fio: ls[accountId].fio, 
            category: cat,
            month: `${String(curr.date.getMonth()+1).padStart(2,'0')}.${curr.date.getFullYear()}`,
            age: parseFloat(curr.age.toFixed(1)), 
            period: i < splitIndex ? 1 : 2, 
            rawDate: curr.date
          });
        }
      }
    });
    return trajectory;
  }

  function renderTrajectoryTable(trajectory) {
    const container = document.createElement("div");
    container.className = "trajectory-container";
    container.innerHTML = `<h3 style="margin: 25px 0 10px 0;">Журнал міграції заборгованості (без "шуму" < 3 міс.)</h3>`;
    
    const table = document.createElement("table");
    table.className = "analiz-table trajectory-table";
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th data-sort="period" style="cursor:pointer">Період ↕</th>
        <th data-sort="kv" style="cursor:pointer">Кв ↕</th>
        <th data-sort="fio" style="cursor:pointer">ПІБ ↕</th>
        <th data-sort="category" style="cursor:pointer">Категорія ↕</th>
        <th data-sort="rawDate" style="cursor:pointer">Місяць ↕</th>
        <th data-sort="age" style="cursor:pointer">Вік ↕</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    let currentData = [...trajectory];
    let sortConfig = { field: 'rawDate', asc: true };

    function fillTbody() {
      tbody.innerHTML = currentData.map(item => `
        <tr style="border-left: 4px solid ${item.period === 1 ? '#ccc' : '#006400'}">
          <td style="text-align:center"><b>${item.period}</b></td>
          <td>${item.kv}</td>
          <td>${item.fio}</td>
          <td><span class="badge ${item.category.includes('боржник') ? 'red' : 'green'}">${item.category}</span></td>
          <td>${item.month}</td>
          <td>${item.age}</td>
        </tr>`).join('');
    }

    thead.onclick = (e) => {
      const field = e.target.getAttribute('data-sort');
      if (!field) return;
      sortConfig.asc = (sortConfig.field === field) ? !sortConfig.asc : true;
      sortConfig.field = field;
      currentData.sort((a, b) => {
        let valA = a[field], valB = b[field];
        if (typeof valA === 'string') return sortConfig.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortConfig.asc ? valA - valB : valB - valA;
      });
      fillTbody();
    };

    fillTbody();
    container.appendChild(table);
    return container;
  }

  // --- ВЫЗОВ ОСНОВНОГО ИНТЕРФЕЙСА ---
  return renderAnalizUI(result, getTrajectoryData, renderTrajectoryTable);
}

// Глобальная функция рендеринга (вынесена из generateAnaliz)
function renderAnalizUI(data, getTrajectoryData, renderTrajectoryTable) {
  const COLS = {
    month: { title: "Місяць", type: "text", visible: true },
    totalCharged: { title: "Нараховано", type: "number", visible: true },
    totalPaid: { title: "Сплачено", type: "number", visible: true },
    percentPaid: { title: "% оплати", type: "percent", visible: true },
    overpayDebtEnd: { title: "Переплата", type: "number", visible: true },
    debtorPaid: { title: "Сплачено", type: "number", visible: true },
    debtorPercent: { title: "% оплати", type: "percent", visible: true },
    debtorCount: { title: "К-сть", type: "int", visible: true }
  };

  const fmt = (type, val) => (type === "number" || type === "int") ? Math.round(val) : (type === "percent") ? val.toFixed(1) : val;
  const orderedCols = Object.keys(COLS).filter(c => COLS[c].visible);

  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.className = "analiz-table";
  
  const thead = document.createElement("thead");
  const trH = document.createElement("tr");
  orderedCols.forEach(c => { const th = document.createElement("th"); th.textContent = COLS[c].title; trH.appendChild(th); });
  thead.appendChild(trH); table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = data.map(r => {
    const tr = document.createElement("tr");
    orderedCols.forEach(col => {
      const td = document.createElement("td");
      td.textContent = fmt(COLS[col].type, r[col]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    return tr;
  });

  const topSummary = document.createElement("tr"); topSummary.className = "summary-row top-summary";
  const bottomSummary = document.createElement("tr"); bottomSummary.className = "summary-row bottom-summary";

  const updateSummaries = (splitIndex) => {
    const topData = data.slice(0, splitIndex);
    const bottomData = data.slice(splitIndex);
    const sum = (arr, f) => arr.reduce((a, r) => a + (r[f] || 0), 0);

    const calc = (arr) => ({
      rowCount: arr.length,
      totalCharged: sum(arr, "totalCharged"),
      totalPaid: sum(arr, "totalPaid"),
      debtorPaid: sum(arr, "debtorPaid"),
      debtorCount: sum(arr, "debtorCount"),
      percentPaid: sum(arr, "totalCharged") ? (sum(arr, "totalPaid") / sum(arr, "totalCharged")) * 100 : 0
    });

    const fill = (tr, S) => {
      tr.innerHTML = `<td style="font-weight:bold">Середнє (${S.rowCount} міс)</td>`;
      orderedCols.slice(1).forEach(col => {
        const td = document.createElement("td");
        let val = S[col] || 0;
        if (COLS[col].type === "number" || COLS[col].type === "int") val = S.rowCount ? val / S.rowCount : 0;
        td.textContent = fmt(COLS[col].type, val);
        tr.appendChild(td);
      });
    };

    if (topSummary.parentNode) topSummary.remove();
    if (rows[splitIndex - 1]) rows[splitIndex - 1].after(topSummary);
    fill(topSummary, calc(topData));
    fill(bottomSummary, calc(bottomData));

    if (!wrapper._trajBox) {
      wrapper._trajBox = document.createElement("div");
      wrapper.appendChild(wrapper._trajBox);
    }
    wrapper._trajBox.innerHTML = "";
    wrapper._trajBox.appendChild(renderTrajectoryTable(getTrajectoryData(splitIndex)));
    if (window.initPosters) initPosters();
  };

  tbody.appendChild(bottomSummary); table.appendChild(tbody); wrapper.appendChild(table);

  let splitIndex = data.length > 1 ? (data.findIndex(r => r.month.startsWith("12.")) + 1 || Math.round(data.length/2)) : data.length;
  
  // Drag logic
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

  setTimeout(() => updateSummaries(splitIndex), 0);
  return wrapper;
}