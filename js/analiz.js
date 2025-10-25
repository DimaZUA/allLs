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
      totaldebitStart: 0,
      totalCharged: 0,
      totalPaid: 0,

      overpayCharged: 0,
      overpayPaid: 0,
      overpayDebtEnd: 0,

      debtorCharged: 0,
      debtorPaid: 0,
      debtorCount: 0,
      totalCount: 0,

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
        if (debitStart+chargesThisMonth>paymentsThisMonth){
        	row.overpayPaid += paymentsThisMonth;
        }else{
        	row.overpayPaid += debitStart+chargesThisMonth>0?debitStart+chargesThisMonth:0;
        	row.debtorPaid  += paymentsThisMonth-(debitStart+chargesThisMonth>0?debitStart+chargesThisMonth:0)
        }
        row.overpayDebtEnd += debitEnd;
      } else {
        //const monthsOfDebt = calculateDebtMonths(chargesHistory, debitEnd);
        //if (monthsOfDebt >= 4) {
          row.debtorCharged += debitStart;
          row.debtorPaid += paymentsThisMonth;
          row.debtorCount++;
        //}
      }
    });

    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPayPercent = row.totalCharged ? (row.overpayPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
    row.debtorPayPercent = row.totalCharged ? (row.debtorPaid / row.totalCharged) * 100 : 0;
    row.debtorPercent = row.debtorCharged ? (row.debtorPaid / row.debtorCharged) * 100 : 0;
    row.debtorPercentCount = row.totalCount ? (row.debtorCount / row.totalCount) * 100 : 0;

    result.push(row);
  });

  return renderAnalizTable(result); // возвращаем массив объектов с понятными полями
}

function renderAnalizTable(data) {
  const wrapper = document.createElement("div");

  // === Надпись над ползунком ===
  const label = document.createElement("div");
  label.style.textAlign = "center";
  label.style.marginBottom = "5px";
  label.style.fontWeight = "bold";
  wrapper.appendChild(label);

  // === Ползунок ===
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 1;
  slider.max = data.length;
  slider.value = data.length;
  slider.style.width = "100%";
  slider.style.marginBottom = "10px";
  wrapper.appendChild(slider);

  // === Таблица ===
  const table = document.createElement("table");
  table.classList.add("analiz-table");

//      <th class="th-overpay">Нараховано</th>

//      <th class="th-debtor">Підлягае сплаті</th>
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
      <th class="th-overpay">% оплати</th>
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

//      <td class="td-overpay">${Math.round(row.overpayCharged)}</td>


//      <td class="td-debtor">${Math.round(row.debtorCharged)}</td>
  // === Создаем строки таблицы ===
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td class="td-total">${Math.round(row.totalCharged)}</td>
      <td class="td-total">${Math.round(row.totalPaid)}</td>
      <td class="td-total">${row.percentPaid.toFixed(1)}%</td>

      <td class="td-overpay">${Math.round(row.overpayPaid)}</td>
      <td class="td-overpay">${row.overpayPayPercent.toFixed(1)}%</td>
      <td class="td-overpay">${Math.round(row.overpayDebtEnd)}</td>
      <td class="td-overpay">${row.overpayPercent.toFixed(1)}%</td>


      <td class="td-debtor">${Math.round(row.debtorPaid)}</td>
      <td class="td-debtor">${row.debtorPayPercent.toFixed(1)}%</td>
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
        overpayPercent: avg('overpayPercent') ,
        overpayPayPercent: sum('totalCharged') ? 0 : (sum('overpayPaid')/sum('totalCharged'))*100 ,


        debtorCharged: sum('debtorCharged'),
        debtorPaid: sum('debtorPaid'),
        debtorPercent: sum('debtorCharged') ? (sum('debtorPaid') / sum('debtorCharged')) * 100 : 0,
        debtorPayPercent: sum('totalCharged') ? (sum('debtorPaid') / sum('totalCharged')) * 100 : 0,
        debtorCount,
        debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,

        rowCount: partData.length
      };
    };
//        <td class="summary-overpay">${Math.round(summary.overpayCharged / summary.rowCount)}</td>


//        <td class="summary-debtor">${Math.round(summary.debtorCharged / summary.rowCount)}</td>
    const fillRow = (tr, summary) => {
      tr.innerHTML = `
        <td>В середньому:</td>
        <td class="summary-total">${Math.round(summary.totalCharged / summary.rowCount)}</td>
        <td class="summary-total">${Math.round(summary.totalPaid / summary.rowCount)}</td>
        <td class="summary-total">${summary.percentPaid.toFixed(1)}%</td>

        <td class="summary-overpay">${Math.round(summary.overpayPaid / summary.rowCount)}</td>
        <td class="summary-overpay">${Math.round(summary.overpayPaid / summary.totalCharged*1000)/10}%</td>
        <td class="summary-overpay">${Math.round(summary.overpayDebtEnd / summary.rowCount)}</td>
        <td class="summary-overpay">${summary.overpayPercent.toFixed(1)}%</td>



        <td class="summary-debtor">${Math.round(summary.debtorPaid / summary.rowCount)}</td>
        <td class="summary-debtor">${summary.debtorPayPercent.toFixed(1)}%</td>
        <td class="summary-debtor">${Math.round(summary.debtorCount / summary.rowCount)}/${Math.round(summary.debtorPercentCount)}%</td>
      `;
    };

    // вставляем topSummary после splitIndex-1
    const refNode = rows[splitIndex - 1] || null;
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();
    if (refNode) {
      refNode.after(topSummary);
      topSummary.after(spacer);
    }

    fillRow(topSummary, calcSummary(topData));
    fillRow(bottomSummary, calcSummary(bottomData));
// === Если верхняя строка итого в самом низу — скрываем нижнюю
if (splitIndex === data.length) {
  bottomSummary.style.display = "none";
} else {
  bottomSummary.style.display = "";
}

    const currentRow = data[splitIndex - 1];
    if (currentRow) label.textContent = `${currentRow.month} р.`;
  }

  slider.addEventListener('input', () => {
    updateSummaries(parseInt(slider.value));
  });

  // === Определяем значение по умолчанию для ползунка ===
  let defaultIndex = rows.length; // по умолчанию последний месяц

  if (data.length > 1) {
    // Находим все декабри (месяц == 12)
    const decemberIndexes = data
      .map((r, i) => ({i, isDecember: r.month.startsWith("12.")}))
      .filter(x => x.isDecember)
      .map(x => x.i + 1); // +1 потому что slider нумерация с 1

    if (decemberIndexes.length > 0) {
      // Берем последний декабрь
      defaultIndex = decemberIndexes[decemberIndexes.length - 1];
    } else {
      // Если декабрей нет — середина таблицы
      defaultIndex = Math.round(data.length / 2);
    }
  }

  // Устанавливаем ползунок и вызываем обновление
  slider.value = defaultIndex;
  updateSummaries(defaultIndex);



  
  
  
  
  
  
  // === Поддержка перетаскивания строки итого ===
  let isDragging = false;
  let startY = 0;
  let startIndex = 0;

  topSummary.style.cursor = "default"; // курсор вверх-вниз
  topSummary.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
    startIndex = parseInt(slider.value);
    topSummary.style.background = "#eef"; // визуальный эффект
    document.body.style.userSelect = "none"; // отключаем выделение текста
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dy = e.clientY - startY;

    // Определяем, на сколько строк перемещаем
    const rowHeight = rows[0].offsetHeight || 25;
    let delta = Math.round(dy / rowHeight);

    let newIndex = Math.min(Math.max(1, startIndex + delta), rows.length);
    if (newIndex !== parseInt(slider.value)) {
      slider.value = newIndex;
      updateSummaries(newIndex);
    }
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    topSummary.style.background = ""; // убираем подсветку
    document.body.style.userSelect = ""; // возвращаем выделение текста
  });
  
  return wrapper;
}


function generateAnaliz1(start, end) {
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
        if (monthsOfDebt > 3.5) {
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

  return renderAnalizTable1(result); // возвращаем массив объектов с понятными полями
}

function renderAnalizTable1(data) {
  const wrapper = document.createElement("div");

  // === Надпись над ползунком ===
  const label = document.createElement("div");
  label.style.textAlign = "center";
  label.style.marginBottom = "5px";
  label.style.fontWeight = "bold";
  wrapper.appendChild(label);

  // === Ползунок ===
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 1;
  slider.max = data.length;
  slider.value = data.length;
  slider.style.width = "100%";
  slider.style.marginBottom = "10px";
  wrapper.appendChild(slider);

  // === Таблица ===
  const table = document.createElement("table");
  table.classList.add("analiz-table");

//      <th class="th-overpay">Нараховано</th>

//      <th class="th-debtor">Підлягае сплаті</th>
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

//      <td class="td-overpay">${Math.round(row.overpayCharged)}</td>


//      <td class="td-debtor">${Math.round(row.debtorCharged)}</td>
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
        overpayPercent: avg('overpayPercent') ,


        debtorCharged: sum('debtorCharged'),
        debtorPaid: sum('debtorPaid'),
        debtorPercent: sum('totalCharged') ? (sum('debtorPaid') / sum('totalCharged')) * 100 : 0,
        debtorCount,
        debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,

        rowCount: partData.length
      };
    };
//        <td class="summary-overpay">${Math.round(summary.overpayCharged / summary.rowCount)}</td>


//        <td class="summary-debtor">${Math.round(summary.debtorCharged / summary.rowCount)}</td>
    const fillRow = (tr, summary) => {
      tr.innerHTML = `
        <td>В середньому:</td>
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

    // вставляем topSummary после splitIndex-1
    const refNode = rows[splitIndex - 1] || null;
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();
    if (refNode) {
      refNode.after(topSummary);
      topSummary.after(spacer);
    }

    fillRow(topSummary, calcSummary(topData));
    fillRow(bottomSummary, calcSummary(bottomData));
// === Если верхняя строка итого в самом низу — скрываем нижнюю
if (splitIndex === data.length) {
  bottomSummary.style.display = "none";
} else {
  bottomSummary.style.display = "";
}

    const currentRow = data[splitIndex - 1];
    if (currentRow) label.textContent = `${currentRow.month} р.`;
  }

  slider.addEventListener('input', () => {
    updateSummaries(parseInt(slider.value));
  });

  // === Определяем значение по умолчанию для ползунка ===
  let defaultIndex = rows.length; // по умолчанию последний месяц

  if (data.length > 1) {
    // Находим все декабри (месяц == 12)
    const decemberIndexes = data
      .map((r, i) => ({i, isDecember: r.month.startsWith("12.")}))
      .filter(x => x.isDecember)
      .map(x => x.i + 1); // +1 потому что slider нумерация с 1

    if (decemberIndexes.length > 0) {
      // Берем последний декабрь
      defaultIndex = decemberIndexes[decemberIndexes.length - 1];
    } else {
      // Если декабрей нет — середина таблицы
      defaultIndex = Math.round(data.length / 2);
    }
  }

  // Устанавливаем ползунок и вызываем обновление
  slider.value = defaultIndex;
  updateSummaries(defaultIndex);
 
  
  
  
  // === Поддержка перетаскивания строки итого ===
  let isDragging = false;
  let startY = 0;
  let startIndex = 0;

  topSummary.style.cursor = "default"; // курсор вверх-вниз
  topSummary.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
    startIndex = parseInt(slider.value);
    topSummary.style.background = "#eef"; // визуальный эффект
    document.body.style.userSelect = "none"; // отключаем выделение текста
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dy = e.clientY - startY;

    // Определяем, на сколько строк перемещаем
    const rowHeight = rows[0].offsetHeight || 25;
    let delta = Math.round(dy / rowHeight);

    let newIndex = Math.min(Math.max(1, startIndex + delta), rows.length);
    if (newIndex !== parseInt(slider.value)) {
      slider.value = newIndex;
      updateSummaries(newIndex);
    }
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    topSummary.style.background = ""; // убираем подсветку
    document.body.style.userSelect = ""; // возвращаем выделение текста
  });
  
  return wrapper;
}
