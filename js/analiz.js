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

  // === 2. Функция подсчёта месяцев долга ===

  // === 3. Формирование строк данных ===
  months.forEach(monthDate => {
    let row = {
      month: `${String(monthDate.getMonth() + 1).padStart(2,'0')}.${monthDate.getFullYear()}`,
      totalCharged: 0, totalPaid: 0, overpayCharged: 0, overpayPaid: 0,
      overpayDebtEnd: 0, debtorCharged: 0, debtorPaid: 0, debtorCount: 0,
      totalCount: 0, totaldebitStart: 0,
      debtors: new Set(),
      details: {} // Для траектории
    };

    Object.keys(ls).forEach(accountId => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      let chargesBefore = 0, paymentsBefore = 0;
      const chargesHistory = [];

      for (const y in nach[accountId]) {
        for (const m in nach[accountId][y]) {
          const charge = Object.values(nach[accountId][y][m]).reduce((s,v)=>s+v,0);
          chargesHistory.push(charge);
          const d = new Date(y, m-1, 1);
          if (d < monthDate) {
            chargesBefore += charge;
            paymentsBefore += (oplat[accountId]?.[y]?.[m] || []).reduce((s,p)=>s+p.sum,0);
          }
        }
      }

      const debitStart = chargesBefore - paymentsBefore;
      const chargesThisMonth = Object.values(nach[accountId]?.[year]?.[month] || {}).reduce((s,v)=>s+v,0);
      const paymentsThisMonth = (oplat[accountId]?.[year]?.[month] || []).reduce((s,p)=>s+p.sum,0);
      const debitEnd = debitStart + chargesThisMonth - paymentsThisMonth;

      row.totaldebitStart += debitStart;
      row.totalCharged += chargesThisMonth;
      row.totalPaid += paymentsThisMonth;
      row.totalCount++;

      //const monthsOfDebt = calculateDebtMonthsFromCache(accountId, debitEnd, monthDate);
      //row.details[accountId] = monthsOfDebt; 
      
      const monthsOfDebt = calculateDebtMonthsFromCache(accountId, debitEnd, monthDate);
      // Теперь записываем объект, в котором есть и возраст, и сумма долга
      row.details[accountId] = { age: monthsOfDebt, debt: debitEnd };

      if (debitEnd <= 0) {
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      } else if (monthsOfDebt > 3) {
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

  return renderAnalizTable(result, months);
}

function renderAnalizTable(data, monthsList) {
  const COLS = {
    month: { title: "Місяць", type: "text", isValue: false, visible: true },
    totalCharged: { title: "Нараховано", type: "number", isValue: true, visible: true },
    totalPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    percentPaid: { title: "% оплати", type: "percent", isValue: true, visible: true },
    overpayPaid: { title: "Сплачено", type: "number", isValue: true, visible: false },
    overpayDebtEnd: { title: "Переплата", type: "number", isValue: true, visible: true },
    overpayPercent: { title: "% переплати", type: "percent", isValue: true, visible: false },
    debtorPaid: { title: "Сплачено", type: "number", isValue: true, visible: true },
    debtorPercent: { title: "% оплати", type: "percent", isValue: true, visible: false },
    debtorCount: { title: "К-сть", type: "int", isValue: true, visible: false },
    debtorPercentCount: { title: "% кв", type: "percent", isValue: true, visible: false }
  };

  const COL_GROUPS = [
    { title: "Всього по будинку", class: "th-total", cols: ["totalCharged","totalPaid","percentPaid"] },
    { title: "Переплатники", class: "th-overpay", cols: ["overpayPaid","overpayDebtEnd","overpayPercent"] },
    { title: "Боржники", class: "th-debtor", cols: ["debtorPaid","debtorPercent","debtorCount","debtorPercentCount"] }
  ];

  const fmt = (type, val) => (type === "number" || type === "int") ? Math.round(val) : (type === "percent") ? val.toFixed(1) : val;

  const orderedCols = ["month", "totalCharged","totalPaid","percentPaid", "overpayPaid","overpayDebtEnd","overpayPercent", "debtorPaid","debtorPercent","debtorCount","debtorPercentCount"].filter(c => COLS[c].visible);

  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.className = "analiz-table";

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
  COL_GROUPS.forEach(gr => gr.cols.forEach(col => {
    if (COLS[col].visible) {
      const th = document.createElement("th"); th.className = gr.class; th.textContent = COLS[col].title; tr2.appendChild(th);
    }
  }));
  thead.append(tr1, tr2); table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = data.map(r => {
    const tr = document.createElement("tr");
    orderedCols.forEach(col => {
      const td = document.createElement("td");
      td.className = col.startsWith("total") ? "td-total" : col.startsWith("overpay") ? "td-overpay" : col.startsWith("debtor") ? "td-debtor" : "";
      td.textContent = fmt(COLS[col].type, r[col]);
      tr.appendChild(td);
    });
    tbody.appendChild(tr); return tr;
  });

  const topSummary = document.createElement("tr"); topSummary.className = "summary-row top-summary";
  const spacer = document.createElement("tr"); spacer.className = "spacer"; spacer.style.height = "10px";
  const bottomSummary = document.createElement("tr"); bottomSummary.className = "summary-row bottom-summary";

  // === 10. Пересчет итогов и ГИСТОГРАММ ===
  function updateSummaries(splitIndex) {
    const topData = data.slice(0, splitIndex);
    const bottomData = data.slice(splitIndex);
    const sum = (arr, f) => arr.reduce((a, r) => a + (r[f] || 0), 0);
    const avg = (arr, f) => arr.length ? sum(arr, f) / arr.length : 0;

    function summary(arr) {
      const tCount = sum(arr, "totalCount"), dCount = sum(arr, "debtorCount");
      const dIDs = new Set();
      arr.forEach(r => r.debtors.forEach(id => dIDs.add(id)));
      return {
        rowCount: arr.length, totalCharged: sum(arr,"totalCharged"), totalPaid: sum(arr,"totalPaid"),
        percentPaid: tCount ? (sum(arr,"totalPaid") / sum(arr,"totalCharged")) * 100 : 0,
        overpayPaid: sum(arr,"overpayPaid"), overpayDebtEnd: sum(arr,"overpayDebtEnd"), overpayPercent: avg(arr,"overpayPercent"),
        debtorPaid: sum(arr,"debtorPaid"), debtorPercent: sum(arr,"totalCharged") ? (sum(arr,"debtorPaid") / sum(arr,"totalCharged")) * 100 : 0,
        debtorCount: dCount, debtorPercentCount: tCount ? (dCount / tCount) * 100 : 0, debtors: dIDs
      };
    }

    const topS = summary(topData), bottomS = summary(bottomData);

    function fill(tr, S) {
      tr.innerHTML = `<td>В середньому (${S.rowCount} міс.):</td>`;
      orderedCols.slice(1).forEach(col => {
        const td = document.createElement("td");
        let val = S[col];
        if (COLS[col].type === "number" || COLS[col].type === "int") val = S.rowCount ? val / S.rowCount : 0;
        td.className = col.startsWith("total") ? "summary-total" : col.startsWith("overpay") ? "summary-overpay" : "summary-debtor";
        td.textContent = fmt(COLS[col].type, val); tr.appendChild(td);
      });
    }

    const ref = rows[splitIndex - 1];
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();
    if (ref) { ref.after(topSummary); topSummary.after(spacer); }
    fill(topSummary, topS); fill(bottomSummary, bottomS);

    // === 11. ГИСТОГРАММА "Было / Стало" ===
    const oldCmp = table.querySelector(".compare-row");
    if (oldCmp) oldCmp.remove();

    if (splitIndex < data.length) {
      const compareCols = orderedCols.filter(c => c !== "month" && COLS[c].isValue);
      const rowCmp = document.createElement("tr");
      rowCmp.className = "compare-row";
      bottomSummary.after(rowCmp);

      const tdLabel = document.createElement("td");
      tdLabel.innerHTML = `<div><span style="color:gray;">Було</span><br><span style="color:green;">Стало</span></div>`;
      rowCmp.appendChild(tdLabel);

      compareCols.forEach(col => {
        const td = document.createElement("td");
        td.style.height = "60px"; td.style.verticalAlign = "bottom";
        const idx = orderedCols.indexOf(col);
        const parseVal = cell => cell ? parseFloat(cell.textContent.replace("%","").trim()) || 0 : 0;
        const v1 = parseVal(topSummary.cells[idx]), v2 = parseVal(bottomSummary.cells[idx]);
        const maxV = Math.max(Math.abs(v1), Math.abs(v2), 1);
        const h1 = (Math.abs(v1) / maxV) * 60, h2 = (Math.abs(v2) / maxV) * 60;
        
        let color = "#808080";
        const posBetter = ["totalCharged", "totalPaid", "percentPaid", "debtorPaid","debtorPercent"].includes(col);
        if (v1 !== v2) color = posBetter ? (v2 > v1 ? "#006400" : "#8B0000") : (v2 < v1 ? "#006400" : "#8B0000");

        td.innerHTML = `<div style="display:flex; gap:4px; align-items:flex-end; justify-content:center; height:60px;">
          <div style="width:30px; height:${h1}px; background:gray; border-radius:2px;"></div>
          <div style="width:30px; height:${h2}px; background:${color}; border-radius:2px;"></div>
        </div>`;
        rowCmp.appendChild(td);
      });
    }

    // === 13. ПОСТЕРЫ И ТЕКСТ ===
    if (!wrapper._debtInfo) { wrapper._debtInfo = document.createElement("div"); wrapper.appendChild(wrapper._debtInfo); }
    wrapper._debtInfo.innerHTML = "";

    const wasD = data[splitIndex - 1]?.debtors || new Set();
    const nowD = data[data.length - 1]?.debtors || new Set();
    const still = [...wasD].filter(x => nowD.has(x)), paidOff = [...wasD].filter(x => !nowD.has(x)), added = [...nowD].filter(x => !wasD.has(x));

    const addPoster = (title, list, color) => {
      const p = document.createElement("div");
      p.className = "poster";
      p.style.cssText = `display:inline-block; margin:6px 12px 6px 0; padding:6px 10px; border:1px solid #aaa; border-radius:6px; background:#fafafa; font-weight:bold; color:${color};`;
      p.textContent = `${title}: ${list.length}`;
      const d = document.createElement("div"); d.className = "descr";
      d.innerHTML = list.map(acc => `кв.${ls[acc].kv} ${ls[acc].fio}`).join('<br>');
      if (list.length) p.appendChild(d);
      wrapper._debtInfo.appendChild(p);
    };

    addPoster("Нові боржники", added, "#8B0000");
    addPoster("Погасили борг", paidOff, "#006400");
    addPoster("Залишились боржникми", still, "#444");

    const avgChBot = bottomS.rowCount ? bottomS.totalCharged / bottomS.rowCount : 0;
    const dPay = (bottomS.percentPaid - topS.percentPaid) * avgChBot / 100;
    const dDebt = (bottomS.debtorPercent - topS.debtorPercent) * avgChBot / 100;

    const textBlock = document.createElement("div");
    textBlock.style.cssText = "margin-top:15px; font-size:18px;";
    textBlock.innerHTML = `<span style="font-size:12px; color:gray;">Відносні показники:</span><br>
      ${dPay >= 0 ? 'Зростання' : 'Зменшення'} платежів: <span class="${dPay>=0?'green':'red'}">${Math.abs(dPay).toFixed(0)} грн</span><br>
      ${dDebt >= 0 ? 'Зростання' : 'Зменшення'} погашення боргів: <span class="${dDebt>=0?'green':'red'}">${Math.abs(dDebt).toFixed(0)} грн</span>`;
    wrapper._debtInfo.appendChild(textBlock);

    // Добавляем таблицу траектории (миграции)
    wrapper._debtInfo.appendChild(renderMigrationTable(splitIndex, data, monthsList));
    initPosters();
  }

  // Функция для таблицы миграции (которую мы обсуждали ранее)
// Выносим состояние сортировки во внешнюю переменную, чтобы она сохранялась при пересчете таблицы


let migrationSort = { col: 'diff', desc: true };

function renderMigrationTable(splitIndex, resultData, fullMonths) {
    const container = document.createElement("div");
    
    // Определяем даты для заголовков из данных основной таблицы
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
                <th data-sort="ageWas">станом на ${dateWas}</th>
                <th data-sort="ageNow">станом на ${dateNow}</th>
                <th style="width:80px" data-sort="diff">Зміна (міс)</th>
            </tr>
        </thead>
        <tbody></tbody>`;
    
    const tbody = table.querySelector("tbody");

    // 1. Собираем данные для итоговой таблицы
    const summary = [];
    Object.keys(ls).forEach(accId => {
        // Извлекаем объекты {age, debt} из сохраненных деталей
        const dataWas = resultData[splitIndex - 1]?.details[accId] || { age: 0, debt: 0 };
        const dataNow = resultData[resultData.length - 1]?.details[accId] || { age: 0, debt: 0 };
        
        const isWas = dataWas.age > 3;
        const isNow = dataNow.age > 3;

        // Нас интересуют только те, кто был или стал должником (>3 мес)
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
            kv: parseInt(ls[accId].kv),
            fio: ls[accId].fio,
            status: status,
            badgeClass: badgeClass,
            ageWas: dataWas.age,
            debtWas: dataWas.debt,
            ageNow: dataNow.age,
            debtNow: dataNow.debt,
            diff: dataNow.age - dataWas.age
        });
    });

    // 2. Функция внутренней отрисовки строк
    const draw = () => {
        const sorted = [...summary].sort((a, b) => {
            let vA = a[migrationSort.col], vB = b[migrationSort.col];
            if (typeof vA === 'string') {
                return migrationSort.desc ? vB.localeCompare(vA) : vA.localeCompare(vB);
            }
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
                <td style="text-align:right" class="${item.diff > 0 ? 'red' : 'green'}">
                    ${item.diff > 0 ? '+' : ''}${item.diff.toFixed(1)}
                </td>
            </tr>`).join('');
    };

    // 3. Обработчик клика по заголовкам (Сортировка)
    table.querySelector("thead").onclick = (e) => {
        const th = e.target.closest("th");
        if (!th || !th.dataset.sort) return;
        const col = th.dataset.sort;
        migrationSort.desc = (migrationSort.col === col) ? !migrationSort.desc : true;
        migrationSort.col = col;
        draw();
    };

    // 4. Обработчик клика по строке (Открыть счет)
    tbody.onclick = (e) => {
        const tr = e.target.closest("tr");
        if (tr && tr.dataset.accountId) {
            goToAccount(tr.dataset.accountId); // Твоя внешняя функция
        }
    };

    draw();
    container.appendChild(table);
    return container;
}

  tbody.appendChild(bottomSummary); table.appendChild(tbody); wrapper.appendChild(table);

  let splitIndex = data.length > 1 ? (data.findIndex(r => r.month.startsWith("12.")) + 1 || Math.round(data.length/2)) : data.length;
  updateSummaries(splitIndex);

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

  return wrapper;
}