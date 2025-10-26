function generateAnaliz(start, end) {
  // Список месяцев
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const result = [];

  // Вспомогательная функция для подсчёта месяцев долга
  function calculateDebtMonths(chargesHistory, debtEnd) {
    let debt = debtEnd;
    let months = 0;

    for (let i = chargesHistory.length - 1; i >= 0; i--) {
      const charge = chargesHistory[i];
      if (charge <= 0) continue;

      if (debt >= charge) {
        debt -= charge;
        months += 1;
      } else {
        months += debt / charge;
        debt = 0;
        break;
      }
    }

    // Если долг остался после всех месяцев
    if (debt > 0) {
      const firstNonZero = chargesHistory.find(c => c > 0);
      if (firstNonZero) months += debt / firstNonZero;
    }

    return months;
  }

  months.forEach(monthDate => {
    let row = {
      month: `${String(monthDate.getMonth() + 1).padStart(2,'0')}.${monthDate.getFullYear()}`,
      totalCharged: 0,
      totalPaid: 0,
      overpayCharged: 0,
      overpayPaid: 0,
      overpayDebtEnd: 0,
      debtorCharged: 0,
      debtorPaid: 0,
      debtorCount: 0,
      totalCount: 0,
      totaldebitStart: 0
    };

    Object.keys(nach).forEach(accountId => {
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

      if (debitEnd <= 0) {
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      } else {
        const monthsOfDebt = calculateDebtMonths(chargesHistory, debitEnd);
        if (monthsOfDebt > 3) {
          row.debtorCharged += debitStart;
          row.debtorPaid += paymentsThisMonth;
          row.debtorCount++;
        }
      }
    });

    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
    row.debtorPercent = row.totalCharged ? (row.debtorPaid / row.totalCharged) * 100 : 0;
    row.debtorPercentCount = row.totalCount ? (row.debtorCount / row.totalCount) * 100 : 0;

    result.push(row);
  });

  return renderAnalizTable(result); // возвращаем массив объектов с понятными полями
}

function renderAnalizTable(data) {
  const wrapper = document.createElement("div");

  // === Таблица ===
  const table = document.createElement("table");
  table.classList.add("analiz-table");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th rowspan="2">Місяць</th>
      <th colspan="3" class="th-total">Всього по будинку</th>
      <th colspan="3" class="th-overpay">Переплатники</th>
      <th colspan="3" class="th-debtor">Боржники</th>
    </tr>
    <tr>
      <th class="th-total">Нараховано</th>
      <th class="th-total">Сплачено</th>
      <th class="th-total">% оплати</th>

      <th class="th-overpay">Сплачено</th>
      <th class="th-overpay">Переплата</th>
      <th class="th-overpay">% переплати</th>

      <th class="th-debtor">Сплачено</th>
      <th class="th-debtor">% оплати</th>
      <th class="th-debtor">К-сть / %</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = [];

  // === Создаем строки таблицы ===
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td class="td-total">${Math.round(row.totalCharged)}</td>
      <td class="td-total">${Math.round(row.totalPaid)}</td>
      <td class="td-total">${row.percentPaid.toFixed(1)}%</td>

      <td class="td-overpay">${Math.round(row.overpayPaid)}</td>
      <td class="td-overpay">${Math.round(row.overpayDebtEnd)}</td>
      <td class="td-overpay">${row.overpayPercent.toFixed(1)}%</td>

      <td class="td-debtor">${Math.round(row.debtorPaid)}</td>
      <td class="td-debtor">${row.debtorPercent.toFixed(1)}%</td>
      <td class="td-debtor">${row.debtorCount}/${Math.round(row.debtorPercentCount)}%</td>
    `;
    tbody.appendChild(tr);
    rows.push(tr);
  });

  // === Итоговые строки ===
  const topSummary = document.createElement("tr");
  topSummary.classList.add("summary-row", "top-summary");

  const spacer = document.createElement("tr");
  spacer.classList.add("spacer");
  spacer.style.height = "10px";

  const bottomSummary = document.createElement("tr");
  bottomSummary.classList.add("summary-row", "bottom-summary");

  tbody.appendChild(bottomSummary);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // === Функция пересчета итогов ===
  function updateSummaries(splitIndex) {
    const topData = data.slice(0, splitIndex);
    const bottomData = data.slice(splitIndex);

    const calcSummary = (partData) => {
      const sum = (field) => partData.reduce((acc, r) => acc + r[field], 0);
      const avg = (field) => partData.length ? sum(field) / partData.length : 0;

      const totalCount = sum('totalCount');
      const debtorCount = sum('debtorCount');

      return {
        totalCharged: sum('totalCharged'),
        totalPaid: sum('totalPaid'),
        percentPaid: totalCount ? (sum('totalPaid') / sum('totalCharged')) * 100 : 0,

        overpayCharged: sum('overpayCharged'),
        overpayPaid: sum('overpayPaid'),
        overpayDebtEnd: sum('overpayDebtEnd'),
        overpayPercent: avg('overpayPercent'),

        debtorCharged: sum('debtorCharged'),
        debtorPaid: sum('debtorPaid'),
        debtorPercent: sum('totalCharged') ? (sum('debtorPaid') / sum('totalCharged')) * 100 : 0,
        debtorCount,
        debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,

        rowCount: partData.length
      };
    };

    const topSummaryData = calcSummary(topData);
    const bottomSummaryData = calcSummary(bottomData);

    const fillRow = (tr, summary) => {
      tr.innerHTML = `
        <td>В середньому за ${summary.rowCount} міс.:</td>
        <td class="summary-total">${Math.round(summary.totalCharged / summary.rowCount)}</td>
        <td class="summary-total">${Math.round(summary.totalPaid / summary.rowCount)}</td>
        <td class="summary-total">${summary.percentPaid.toFixed(1)}%</td>

        <td class="summary-overpay">${Math.round(summary.overpayPaid / summary.rowCount)}</td>
        <td class="summary-overpay">${Math.round(summary.overpayDebtEnd / summary.rowCount)}</td>
        <td class="summary-overpay">${summary.overpayPercent.toFixed(1)}%</td>

        <td class="summary-debtor">${Math.round(summary.debtorPaid / summary.rowCount)}</td>
        <td class="summary-debtor">${summary.debtorPercent.toFixed(1)}%</td>
        <td class="summary-debtor">${Math.round(summary.debtorCount / summary.rowCount)}/${Math.round(summary.debtorPercentCount)}%</td>
      `;
    };

    // Вставляем итоговые строки
    const refNode = rows[splitIndex - 1] || null;
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();
    if (refNode) {
      refNode.after(topSummary);
      topSummary.after(spacer);
    }

    fillRow(topSummary, topSummaryData);
    fillRow(bottomSummary, bottomSummaryData);

    // === Визуальная гистограмма "Было / Стало" ===
    if (table.querySelector(".compare-row")) {
      table.querySelector(".compare-row").remove();
    }

    if (splitIndex < data.length) {
      bottomSummary.style.display = "";

      const compareRow = document.createElement("tr");
      compareRow.classList.add("compare-row");
      bottomSummary.after(compareRow);

      const fields = [
        "totalCharged", "totalPaid", "percentPaid",
        "overpayPaid", "overpayDebtEnd", "overpayPercent",
        "debtorPaid", "debtorPercent", "debtorCount"
      ];

      // Первая ячейка — подпись
      const labelTd = document.createElement("td");
      labelTd.innerHTML = `
        <div>
          <span style="color:gray;">Было</span><br>
          <span style="color:green;">Стало</span>
        </div>
      `;
      compareRow.appendChild(labelTd);

      fields.forEach((f, idx) => {
        const td = document.createElement("td");
        td.style.height = "50px";
        td.style.verticalAlign = "bottom";
        td.style.padding = "4px";

        const topCell = topSummary.cells[idx + 1];
        const bottomCell = bottomSummary.cells[idx + 1];

        const parseVal = (cell) => {
          if (!cell) return 0;
          const text = cell.textContent.replace(",", ".").replace("%", "").trim();
          return parseFloat(text) || 0;
        };

        const topVal = parseVal(topCell);
        const bottomVal = parseVal(bottomCell);

        let maxVal;
        if (idx === 0 || idx === 1) { // начислено / оплачено
          const topOther = parseVal(topSummary.cells[1]);
          const bottomOther = parseVal(bottomSummary.cells[1]);
          const topPaid = parseVal(topSummary.cells[2]);
          const bottomPaid = parseVal(bottomSummary.cells[2]);
          maxVal = Math.max(topOther, bottomOther, topPaid, bottomPaid, 1);
        } else {
          maxVal = Math.max(Math.abs(topVal), Math.abs(bottomVal), 1);
        }

        const topHeight = (Math.abs(topVal) / maxVal) * 80;
        const bottomHeight = (Math.abs(bottomVal) / maxVal) * 80;

        // Цвет фона всей ячейки
        let bgColor = "#f9f9f9";
        if (idx > 0) {
          const isLast = idx === fields.length - 1;
          const better = isLast ? Math.abs(bottomVal) < Math.abs(topVal) : Math.abs(bottomVal) > Math.abs(topVal);
          bgColor = better ? "#b6f2b6" : "#f9b6b6";
        }
        td.style.background = bgColor;

        td.innerHTML = `
          <div style="display:flex; justify-content:center; align-items:flex-end; height:80px; gap:4px;">
            <div style="width:30px; height:${topHeight}px; background:gray; border-radius:5px;"></div>
            <div style="width:30px; height:${bottomHeight}px; background:green; border-radius:5px;"></div>
          </div>
        `;

        // === Горизонтальные гистограммы при наведении ===
        td.addEventListener("mouseenter", () => {
          const rowsAll = table.querySelectorAll("tbody tr");
          let maxCol = 1;
          rowsAll.forEach(tr => {
            const cell = tr.cells[idx + 1];
            if (!cell) return;
            const val = Math.abs(parseVal(cell));
            if (val > maxCol) maxCol = val;
          });

          rowsAll.forEach(tr => {
            const cell = tr.cells[idx + 1];
            if (!cell) return;
            const val = Math.abs(parseVal(cell));

            const overlay = document.createElement("div");
            overlay.classList.add("cell-bg");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.height = "100%";
            overlay.style.width = "0%";
            overlay.style.background = "rgba(100,200,255,0.3)";
            overlay.style.pointerEvents = "none";
            overlay.style.transition = "width 1s ease";

            cell.style.position = "relative";
            cell.appendChild(overlay);

            setTimeout(() => {
              overlay.style.width = (val / maxCol * 100) + "%";
            }, 10);

            // дрожание ячейки
            cell.style.animation = "shake 1s";
            cell.addEventListener("animationend", () => {
              cell.style.animation = "";
            });
          });
        });

        td.addEventListener("mouseleave", () => {
          const overlays = table.querySelectorAll(".cell-bg");
          overlays.forEach(o => o.remove());
        });

        compareRow.appendChild(td);
      });
    } else {
      bottomSummary.style.display = "none";
    }
  }

  // === Определяем значение по умолчанию ===
  let splitIndex = data.length;
  if (data.length > 1) {
    const decemberIndexes = data
      .map((r, i) => ({i, isDecember: r.month.startsWith("12.")}))
      .filter(x => x.isDecember)
      .map(x => x.i + 1);

    if (decemberIndexes.length > 0) {
      splitIndex = decemberIndexes[decemberIndexes.length - 1];
    } else {
      splitIndex = Math.round(data.length / 2);
    }
  }

  updateSummaries(splitIndex);

  // === Перетаскивание строки итога ===
  let isDragging = false;
  let startY = 0;
  let startIndex = 0;

  topSummary.style.cursor = "ns-resize";

  topSummary.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
    startIndex = splitIndex;
    topSummary.style.background = "#eef";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dy = e.clientY - startY;
    const rowHeight = rows[0].offsetHeight || 25;
    let delta = Math.round(dy / rowHeight);
    let newIndex = Math.min(Math.max(1, startIndex + delta), rows.length);
    if (newIndex !== splitIndex) {
      splitIndex = newIndex;
      updateSummaries(splitIndex);
    }
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    topSummary.style.background = "";
    document.body.style.userSelect = "";
  });

  return wrapper;
}
