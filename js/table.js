// ===================== 📅 Работа с датами =====================

// Определяет минимальную дату (по начислениям и оплатам) и текущую дату.
function getMinMaxDate() {
  let minDate = null;
  const currentDate = new Date();

  [nach, oplat].forEach(data => {
    for (const accountId in data) {
      const years = Object.keys(data[accountId]);
      if (years.length === 0) continue;

      const firstYear = years[0];
      const months = Object.keys(data[accountId][firstYear]);
      if (months.length === 0) continue;

      const firstMonth = months[0] - 1; // Месяцы — с 0
      const date = new Date(firstYear, firstMonth);

      if (!minDate || date < minDate) {
        minDate = date;
      }
    }
  });

  return { minDate, maxDate: currentDate };
}

// Устанавливает диапазон выбора дат и заполняет список пресетов.
function setDefaultDates() {
  const { minDate, maxDate } = getMinMaxDate();

  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const presets = document.getElementById("preset-select");

  startInput.min = formatDate(minDate, "yyyy-mm");
  startInput.max = formatDate(maxDate, "yyyy-mm");
  endInput.min = formatDate(minDate, "yyyy-mm");
  endInput.max = formatDate(maxDate, "yyyy-mm");

  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();

  const currentMonthName = `${monthNames[currentMonthIndex]} ${currentDate.getFullYear()}`;
  const previousMonthDate = new Date(currentDate.getFullYear(), currentMonthIndex - 1, 1);
  const previousMonthName = `${monthNames[previousMonthDate.getMonth()]} ${previousMonthDate.getFullYear()}`;
  const twoMonthsAgoDate = new Date(currentDate.getFullYear(), currentMonthIndex - 2, 1);
  const twoMonthsAgoName = `${monthNames[twoMonthsAgoDate.getMonth()]} ${twoMonthsAgoDate.getFullYear()}`;

  presets.innerHTML = `
    <option value="current-month">${currentMonthName}</option>
    <option value="previous-month">${previousMonthName}</option>
    <option value="two-months-ago">${twoMonthsAgoName}</option>
    <option value="current-quarter">Текущий квартал</option>
    <option value="previous-quarter">Предыдущий квартал</option>
    <option value="current-year">Этот год</option>
    <option value="previous-year">Прошлый год</option>
    <option value="custom">Произвольный период</option>
  `;

  // Восстанавливаем значения из параметров, если есть
  if (getParam("preset")) presets.value = getParam("preset");
  if (getParam("end")) endInput.value = getParam("end");
  if (getParam("start")) startInput.value = getParam("start");

  applyPreset();
}

// Применяет выбранный пресет к полям дат.
function applyPreset() {
  const preset = document.getElementById("preset-select").value;
  const currentDate = new Date();
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");

  switch (preset) {
    case "current-month":
      startInput.value = endInput.value = formatDate(currentDate, "yyyy-mm");
      break;

    case "previous-month": {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      startInput.value = endInput.value = formatDate(d, "yyyy-mm");
      break;
    }

    case "two-months-ago": {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      startInput.value = endInput.value = formatDate(d, "yyyy-mm");
      break;
    }

    case "current-quarter": {
      const startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      startInput.value = formatDate(new Date(currentDate.getFullYear(), startMonth, 1), "yyyy-mm");
      endInput.value = formatDate(currentDate, "yyyy-mm");
      break;
    }

    case "previous-quarter": {
      const startMonth = Math.floor((currentDate.getMonth() - 3) / 3) * 3;
      startInput.value = formatDate(new Date(currentDate.getFullYear(), startMonth, 1), "yyyy-mm");
      endInput.value = formatDate(new Date(currentDate.getFullYear(), startMonth + 2, 1), "yyyy-mm");
      break;
    }

    case "current-year":
      startInput.value = `${currentDate.getFullYear()}-01`;
      endInput.value = formatDate(currentDate, "yyyy-mm");
      break;

    case "previous-year":
      startInput.value = `${currentDate.getFullYear() - 1}-01`;
      endInput.value = `${currentDate.getFullYear() - 1}-12`;
      break;
  }
}

// === Инициализация monthData ===
let monthData = {};


var chartInstance = null;

function parseCellValue(text) {
  if (!text) return 0;
  text = text.trim().replace(/[^0-9,.\-]+/g, "").replace(",", ".");
  return text === "-" || text === "" ? 0 : parseFloat(text);
}

function createDebetChart() {
  var displayMode = document.getElementById("display-mode").value;
  var rows = document.querySelectorAll("#table-container > .main > tbody > tr");
  var rowDataList = [];

  rows.forEach(function (row) {
    var columns = Array.from(row.querySelectorAll("td")).filter(td => !td.closest("table.subtable"));
    if (columns.length > 0) {
      var totalPaymentsForMonth = parseCellValue(columns[columns.length - 2].textContent);
      var totalChargesForMonth = 0;

      if (displayMode === "summarized") {
        for (var i = 2; i < columns.length - 2; i++) {
          totalChargesForMonth += parseCellValue(columns[i].textContent);
        }
      } else {
        totalChargesForMonth = parseCellValue(columns[columns.length - 3].textContent);
      }

      rowDataList.push({
        apartmentNumber: columns[0].textContent.trim(),
        totalCharges: totalChargesForMonth,
        totalPayments: totalPaymentsForMonth,
        totalDebt: parseCellValue(columns[columns.length - 1].textContent)
      });
    }
  });

  console.log(rowDataList);
}
function sortTable(header) {
  const table = header.closest("table");
  const tbody = table.querySelector("tbody");

  // Удаляем все строки с классом "header-row-clone"
  tbody.querySelectorAll(".header-row-clone").forEach(row => row.remove());

  const rows = Array.from(tbody.rows);
  const isAsc = header.classList.contains("sorted-asc");
  const index = Array.from(header.parentNode.children).indexOf(header);

  // Убираем классы сортировки с других заголовков
  header.parentNode.querySelectorAll("th").forEach(th =>
    th.classList.remove("sorted-asc", "sorted-desc")
  );
  header.classList.add(isAsc ? "sorted-desc" : "sorted-asc");

  // Сортируем строки
rows.sort((rowA, rowB) => {
  const cellA = rowA.cells[index];
  const cellB = rowB.cells[index];

  // Пропускаем строки без ячейки
  if (!cellA && !cellB) return 0;
  if (!cellA) return 1; 
  if (!cellB) return -1;

  let valA = cellA.getAttribute("v");
  let valB = cellB.getAttribute("v");

  if (valA == null) valA = cellA.textContent.trim().replace(/\s/g, "").replace(",", ".");
  if (valB == null) valB = cellB.textContent.trim().replace(/\s/g, "").replace(",", ".");

  valA = parseFloat(valA === "-" ? "0" : valA);
  valB = parseFloat(valB === "-" ? "0" : valB);

  if (isNaN(valA)) valA = cellA.textContent.trim();
  if (isNaN(valB)) valB = cellB.textContent.trim();

  if (valA < valB) return isAsc ? -1 : 1;
  if (valA > valB) return isAsc ? 1 : -1;
  return 0;
});


  // Добавляем отсортированные строки обратно в tbody
  rows.forEach(row => tbody.appendChild(row));

  // Клонируем строки заголовка и добавляем их в конец tbody
  Array.from(table.querySelectorAll("thead tr")).forEach(row => {
    const clone = row.cloneNode(true);
    clone.classList.add("header-row-clone");
    tbody.appendChild(clone);
  });
}

function calculateDebtMonthsFromCache(monthData, debtEnd, endDate) {
  if (!monthData || monthData.length === 0) return 0;

  // Обрезаем endDate если он позже текущего месяца
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (endDate > currentMonth) endDate = currentMonth;

  // Сортируем по дате
  monthData.sort((a, b) => a.date - b.date);

  let remainingDebt = debtEnd;
  let months = 0;

  // --- Переплата ---
  if (debtEnd < 0) {
    const lastNonZero = [...monthData].reverse().find(c => c.chargesSum > 0);
    if (!lastNonZero) return 0;
    const result = -(Math.abs(debtEnd) / lastNonZero.chargesSum);
    return +result.toFixed(1);
  }

  let currentDate = new Date(endDate);
  currentDate.setHours(12);

  const firstDate = monthData[0].date;

  while (remainingDebt > 0) {
    if (!(currentDate instanceof Date) || isNaN(currentDate)) break;

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const chargeObj = monthData.find(c => c.date.getFullYear() === y && c.date.getMonth() + 1 === m);
    const sum = chargeObj ? chargeObj.chargesSum : 0;

    if (sum > 0) {
      if (remainingDebt >= sum) {
        remainingDebt -= sum;
        months += 1;
      } else {
        months += remainingDebt / sum;
        remainingDebt = 0;
      }
    }

    currentDate.setMonth(currentDate.getMonth() - 1);

    if (currentDate < firstDate) {
      if (remainingDebt > 0) {
        const firstNonZero = monthData.find(c => c.chargesSum > 0);
        if (firstNonZero) {
          months += remainingDebt / firstNonZero.chargesSum;
        }
      }
      break;
    }
  }

  return +months.toFixed(1);
}

function generateTable() {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const start = new Date(document.getElementById("start-date").value);
  const end = new Date(document.getElementById("end-date").value);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  const displayMode = document.getElementById("display-mode").value;
  const filterValue = document.getElementById("record-filter").value;
  if (displayMode === "analiz") {
  	tableContainer.appendChild(generateAnaliz(start,end));
  	return;
  }
  let serviceFilterId = null;
  if (displayMode.startsWith("service-")) {
    serviceFilterId = displayMode.split("-")[1];
  }

  // Список услуг с начислениями
  const servicesWithCharges = new Set();
  for (const accountId in nach) {
    for (const year in nach[accountId]) {
      for (const month in nach[accountId][year]) {
        const date = new Date(year, month - 1, 1, 12);
        if (date >= start && date <= end) {
          Object.keys(nach[accountId][year][month]).forEach(sid => servicesWithCharges.add(sid));
        }
      }
    }
  }

  const table = document.createElement("table");
  table.classList.add("main");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  // Заголовок
  let headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">П.І. по Б.</th><th onclick="sortTable(this)">Борг початковий</th>';

  if (displayMode === "summarized") {
    for (const serviceId of servicesWithCharges) {
      headerRow += `<th onclick="sortTable(this)">${us[serviceId]}</th>`;
    }
    headerRow += '<th onclick="sortTable(this)">Оплати</th><th onclick="sortTable(this)">Борг кінцевий</th><th onclick="sortTable(this)">Місців боргу</th></tr>';
  } else {
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();
      if (displayMode === "detailed" || displayMode === "charges-only" || displayMode.startsWith("service-")) {
        headerRow += `<th onclick="sortTable(this)">Нараховано ${m}-${y}</th>`;
      }
      if (displayMode === "detailed" || displayMode === "payments-only") {
        headerRow += `<th onclick="sortTable(this)">Сплачено ${m}-${y}</th>`;
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    headerRow += '<th onclick="sortTable(this)">Борг кінцевий</th><th onclick="sortTable(this)">Місців боргу</th></tr>';
  }
  thead.innerHTML = headerRow;

  // Данные
  let totalStartDebt = 0,
      totalEndDebt = 0,
      totalCharges = {},
      totalPayments = {},
      totalDebtMonths = 0,
      rowCount = 0;

  for (const accountId in nach) {
    const monthData = [];
    let totalChargesSum = 0;      // для отображения в таблице
    let totalPaymentsSum = 0;     // для отображения в таблице
    let totalChargesSumFull = 0;  // для расчета конечного долга
    let totalPaymentsSumFull = 0; // для расчета конечного долга

    for (const year in nach[accountId]) {
      for (const month in nach[accountId][year]) {
        const date = new Date(year, month - 1, 1, 12);
        if (date < start || date > end) continue;

        const chargesByService = { ...nach[accountId][year][month] };
        const chargesSum = Object.values(chargesByService).reduce((s, v) => s + v, 0);

        const paymentsArr = oplat[accountId]?.[year]?.[month] || [];
        const paymentsSum = paymentsArr.reduce((s, p) => s + p.sum, 0);

        monthData.push({
          date,
          chargesByService,
          chargesSum,
          paymentsArr,
          paymentsSum
        });

        totalChargesSum += chargesSum;
        totalPaymentsSum += paymentsSum;
        totalChargesSumFull += chargesSum;
        totalPaymentsSumFull += paymentsSum;
      }
    }

    const debitStart = calculateInitialDebit(accountId, start);
    const debitEnd = debitStart + totalChargesSumFull - totalPaymentsSumFull;
    const debtMonths = calculateDebtMonthsFromCache(monthData, debitEnd, end);

    // Фильтр
    if ((filterValue === "paid-or-low-debt" && !(totalPaymentsSum > 0 || debitEnd < totalChargesSum * 3)) ||
        (filterValue === "paid" && totalPaymentsSum === 0) ||
        (filterValue === "overpaid" && debitEnd > 0) ||
        (filterValue === "debtors" && (totalPaymentsSum > 0 || debitEnd <= totalChargesSum * 3))) continue;

    const row = document.createElement("tr");
    row.appendChild(generateLsCell(accountId));
    row.innerHTML += `<td>${ls[accountId].fio}</td>`;
    row.innerHTML += `<td>${debitStart.toFixedWithComma()}</td>`;
    totalStartDebt += debitStart;

    if (displayMode === "summarized") {
      for (const serviceId of servicesWithCharges) {
        const chargesByServiceSum = monthData.reduce((s, m) => s + (m.chargesByService[serviceId] || 0), 0);
        row.innerHTML += `<td>${chargesByServiceSum.toFixedWithComma()}</td>`;
        totalCharges[serviceId] = (totalCharges[serviceId] || 0) + chargesByServiceSum;
      }
      const paymentsSumRow = monthData.reduce((s, m) => s + m.paymentsSum, 0);
      row.innerHTML += `<td>${paymentsSumRow.toFixedWithComma()}</td>`;
      row.innerHTML += `<td>${debitEnd.toFixedWithComma()}</td>`; // всегда один и тот же долг
      row.innerHTML += `<td>${debtMonths}</td>`;
      totalEndDebt += debitEnd;
      rowCount++;
    } else {
      // Отображение детально или по услуге
      monthData.forEach(m => {
        let chargesAll;
        if (displayMode.startsWith("service-")) {
          chargesAll = m.chargesByService[serviceFilterId] || 0;
        } else {
          chargesAll = m.chargesSum;
        }

        if (displayMode !== "payments-only") {
          row.innerHTML += `<td>${!chargesAll ? "–" : chargesAll.toFixedWithComma()}</td>`;
        }

        if (displayMode !== "charges-only" && !displayMode.startsWith("service-")) {
          row.appendChild(generatePaymentCell(m.paymentsArr));
        }

        const monthKey = `${m.date.getFullYear()}-${m.date.getMonth() + 1}`;
        totalCharges[monthKey] = (totalCharges[monthKey] || 0) + chargesAll;
        totalPayments[monthKey] = (totalPayments[monthKey] || 0) + m.paymentsSum;
      });

      totalEndDebt += debitEnd; // всегда используем один и тот же долг
      totalDebtMonths += debtMonths;
      rowCount++;
      row.innerHTML += `<td>${debitEnd.toFixedWithComma()}</td>`; // всегда один и тот же долг
      row.innerHTML += `<td>${debtMonths}</td>`;
    }

    tbody.appendChild(row);
  }

// Итоговая строка
const footerRow = document.createElement("tr");
footerRow.classList.add("itog");
footerRow.innerHTML = `<td colspan=2>Ітого</td><td>${totalStartDebt.toFixedWithComma()}</td>`;

if (displayMode === "summarized") {
  for (const serviceId of servicesWithCharges) {
    footerRow.innerHTML += `<td>${(totalCharges[serviceId] || 0).toFixedWithComma()}</td>`;
  }
  const totalPaymentsSumAll = Object.values(totalPayments).reduce((a, b) => a + b, 0);
  footerRow.innerHTML += `<td>${totalPaymentsSumAll.toFixedWithComma()}</td>`;
  footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td>`; // всегда один и тот же долг
  footerRow.innerHTML += `<td>${rowCount ? (totalDebtMonths / rowCount).toFixed(1) : "–"}</td>`;
} else {
  const monthKeys = Object.keys(totalCharges).sort();

  monthKeys.forEach(k => {
    if (displayMode !== "payments-only") {
      const charges = totalCharges[k] || 0;
      footerRow.innerHTML += `<td>${charges ? charges.toFixedWithComma() : "–"}</td>`;
    }
    if (displayMode !== "charges-only" && !displayMode.startsWith("service-")) {
      const payments = totalPayments[k] || 0;
      footerRow.innerHTML += `<td>${payments ? payments.toFixedWithComma() : "–"}</td>`;
    }
  });

  footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td>`; // всегда один и тот же долг
  footerRow.innerHTML += `<td>${rowCount ? (totalDebtMonths / rowCount).toFixed(1) : "–"}</td>`;
}

tbody.appendChild(footerRow);

  // Клонируем заголовок
  Array.from(thead.querySelectorAll("tr")).forEach(r => {
    const clone = r.cloneNode(true);
    clone.classList.add("header-row-clone");
    tbody.appendChild(clone);
  });

  tableContainer.appendChild(table);

  initPosters();
  doRed();

  // Сохраняем параметры
  setParam("start", document.getElementById("start-date").value);
  setParam("end", document.getElementById("end-date").value);
  setParam("displayMode", displayMode);
  setParam("preset", document.getElementById("preset-select").value);
}



function generatePaymentCell(payments) {
  const totalPayment = payments.reduce((sum, payment) => sum + payment.sum, 0);
  const paymentCell = document.createElement("td");
  
  if (payments.length === 1) {
    const payment = payments[0];
    paymentCell.classList.add("poster");
    
    if (payment.date) {
      paymentCell.innerHTML = `
        ${totalPayment.toFixedWithComma()}
        <div class="descr">
          <div>
            Оплачено ${payment.date} через ${b[payment.yur] || "неизвестный банк"}<br>
            ${payment.kvit ? `Квитанция: ${payment.kvit}<br>` : ""}
            ${payment.nazn ? `Призначення: ${payment.nazn}` : ""}
          </div>
        </div>
      `;
    }
  } else if (payments.length > 0) {
    paymentCell.classList.add("poster");
    
    let hasKvit = payments.some(p => p.kvit && p.kvit.length > 0);
    let hasNazn = payments.some(p => p.nazn && p.nazn.length > 0);

    const paymentRows = payments.map(payment => `
      <tr>
        <td>${payment.date}</td>
        <td>${b[payment.yur] || "неизвестный банк"}</td>
        <td>${payment.sum.toFixedWithComma()}</td>
        ${hasKvit ? `<td>${payment.kvit || ""}</td>` : ""}
        ${hasNazn ? `<td>${payment.nazn || ""}</td>` : ""}
      </tr>
    `).join("");

    paymentCell.innerHTML = `
      ${totalPayment.toFixedWithComma()}
      <div class="descr">
        <table class="subtable">
          <tbody>
            <tr>
              <th>Дата</th>
              <th>Оплачено через</th>
              <th>Сумма</th>
              ${hasKvit ? "<th>Квітанція</th>" : ""}
              ${hasNazn ? "<th>Призначення</th>" : ""}
            </tr>
            ${paymentRows}
          </tbody>
        </table>
      </div>
    `;
  }

  return paymentCell;
}

function handlePeriodChange(event) {
  const presetSelect = document.getElementById("preset-select");
  const startLabel = document.getElementById("start-label");
  const endLabel = document.getElementById("end-label");
  const presetLabel = document.getElementById("preset-label");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  const startDate = new Date(`${startDateInput.value}-01`);
  const endDate = new Date(`${endDateInput.value}-01`);

  const minDate = new Date(2000, 0, 1); // 01.01.2000
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1, 1); // первое число следующего месяца

  // Если даты не в допустимом диапазоне — не строим таблицу
  if (startDate < minDate || endDate > maxDate) {
    console.warn("Дата вне диапазона (01.01.2000 — начало следующего месяца).");
    return;
  }

  // Обработка предустановок (presets)
  if (event === "start" || event === "end") {
    if (isMonth(startDate) && isMonth(endDate)) presetSelect.value = "current-month";
    if (isMonth(startDate, -1) && isMonth(endDate, -1)) presetSelect.value = "previous-month";
    if (isMonth(startDate, -2) && isMonth(endDate, -2)) presetSelect.value = "two-months-ago";
  }

  // Переключаем видимость блоков
  if (presetSelect.value === "custom") {
    startLabel.style.display = "flex";
    endLabel.style.display = "flex";
    presetLabel.style.display = "none";

    if (startDate <= endDate) generateTable();
  } else {
    startLabel.style.display = "none";
    endLabel.style.display = "none";
    presetLabel.style.display = "flex";
    generateTable();
  }
}


function initTable() {
  // Собираем уникальные коды услуг из nach
  const serviceIds = new Set();

  for (const orgId in nach) {
    if (!nach.hasOwnProperty(orgId)) continue;
    const years = nach[orgId];
    for (const year in years) {
      if (!years.hasOwnProperty(year)) continue;
      const months = years[year];
      for (const month in months) {
        if (!months.hasOwnProperty(month)) continue;
        const days = months[month];
        for (const day in days) {
          if (!days.hasOwnProperty(day)) continue;
          serviceIds.add(Number(day));
        }
      }
    }
  }

  // Формируем опции для display-mode
  let displayOptions = `
    <option value="summarized">По услугам</option>
    <option value="detailed">По месяцам</option>
    <option value="charges-only">По месяцам (начислено)</option>
    <option value="payments-only">По месяцам (оплаты)</option>
  `;

  serviceIds.forEach((serviceId) => {
    if (us[serviceId]) {
      displayOptions += `<option value="service-${serviceId}">${us[serviceId]}</option>`;
    }
  });
  displayOptions +='<option value="analiz">Анализ</option>';
  const mainHTML = `
    <div id="org" align="right"></div>
    <div id="filter-container">
      <!-- Первая колонка: выбор периода и отображения -->
      <div class="column">
        <label id="preset-label">
          Выберите период:
          <select id="preset-select" onchange="applyPreset()">
            <!-- Эти опции обновляются в setDefaultDates() -->
          </select>
        </label>
        <label id="start-label" style="display: none;">
          С:
          <input type="month" id="start-date">
        </label>
        <label id="end-label" style="display: none;">
          По:
          <input type="month" id="end-date">
        </label>
      </div>

      <!-- Вторая колонка: даты -->
      <div class="column">
        <label>
          Отображение:
          <select id="display-mode">
            ${displayOptions}
          </select>
        </label>
      </div>

      <!-- Третья колонка: фильтр -->
      <div class="column">
        <label>
          Фильтр:
          <select id="record-filter">
            <option value="all">Показать всё</option>
            <option value="paid-or-low-debt">Оплативших или без долгов</option>
            <option value="paid">Оплативших</option>
            <option value="overpaid">С переплатой</option>
            <option value="debtors">Должники</option>
          </select>
        </label>
        ${buttons}
      </div>
    </div>

    <div id="table-container"></div>
    <div id="datetime"></div>
  `;

  document.getElementById("maincontainer").innerHTML = mainHTML;

  setDefaultDates();
  handlePeriodChange();

  // Привязываем события
  const presetSelect = document.getElementById("preset-select");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const recordFilter = document.getElementById("record-filter");
  const displayMode = document.getElementById("display-mode");

  presetSelect.addEventListener("change", handlePeriodChange);
  startDateInput.addEventListener("change", () => handlePeriodChange("start"));
  endDateInput.addEventListener("change", () => handlePeriodChange("end"));
  recordFilter.addEventListener("change", generateTable);
  displayMode.addEventListener("change", generateTable);

  if (getParam("displayMode")) displayMode.value = getParam("displayMode");



  generateTable();
}

function doRed() {
  const table = document.querySelector(".main");
  if (!table) return;

  for (const row of table.rows) {
    const cells = row.cells;
    if (!cells.length) continue;

    let visualIndex = 0;
    const totalVisualCols = getTotalVisualColumns(row);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);

      // 1️⃣ Третий визуальный столбец (индекс 2) — начальный долг
      if (visualIndex <= 2 && visualIndex + colspan > 2) {
        const value = parseFloat(cell.textContent);
        if (value > 0) cell.classList.add("red");
      }

      // 2️⃣ Столбцы между 4 и предпоследним визуальным — отрицательные суммы
      for (let v = 3; v < totalVisualCols - 1; v++) {
        if (visualIndex <= v && visualIndex + colspan > v) {
          const value = parseFloat(cell.textContent);
          if (value < 0) cell.classList.add("red");
        }
      }

      visualIndex += colspan;
    }

    // 3️⃣ Последний визуальный столбец — количество месяцев долга
    const lastCell = cells[cells.length - 1];
    const lastValue = parseFloat(lastCell.textContent);
    if (!isNaN(lastValue) && lastValue >= 4) {
      lastCell.classList.add("red");

      // Предпоследний столбец (сумма или итог)
      if (cells.length > 1) {
        const prevCell = cells[cells.length - 2];
        prevCell.classList.add("red");
      }
    }
  }
}


// Подсчёт количества визуальных колонок
const getTotalVisualColumns = (row) =>
  Array.from(row.cells).reduce(
    (sum, cell) => sum + parseInt(cell.getAttribute("colspan") || "1", 10),
    0
  );
 
function generateServiceSummaryCell(accountId, chargesByService, totalAmount) {
  const cell = document.createElement("td");
  cell.classList.add("poster");

  // Контент ячейки — сумма начислений
  cell.textContent = totalAmount.toFixedWithComma();

  // Создаём внутренний div для Poster
  const descrDiv = document.createElement("div");
  descrDiv.classList.add("descr");

  // Формируем список услуг
  let html = "<ul style='margin:0;padding:0;list-style:none'>";
  for (const serviceId in chargesByService) {
    html += `<li>${us[serviceId]}: ${chargesByService[serviceId].toFixedWithComma()}</li>`;
  }
  html += "</ul>";

  descrDiv.innerHTML = html;
  cell.appendChild(descrDiv);

  // Обработка hover для показа Poster/tooltip
  cell.addEventListener("mouseenter", () => {
    descrDiv.style.display = "block";
  });
  cell.addEventListener("mouseleave", () => {
    descrDiv.style.display = "none";
  });

  return cell;
}

// ===================== 📊 Начальный дебет =====================
function calculateInitialDebit(accountId, start) {
  let debit = 0;

  // Учитываем все оплаты, сделанные до start
  if (oplat[accountId]) {
    for (const year of Object.keys(oplat[accountId])) {
      for (const month of Object.keys(oplat[accountId][year])) {
        const date = new Date(year, month - 1);
        date.setHours(0, 0, 0, 0);
        if (date < start) {
          oplat[accountId][year][month].forEach(payment => {
            debit -= payment.sum;
          });
        }
      }
    }
  }

  // Считаем только начисления до start
  if (nach[accountId]) {
    for (const year of Object.keys(nach[accountId])) {
      for (const month of Object.keys(nach[accountId][year])) {
        const date = new Date(year, month - 1);
        date.setHours(0, 0, 0, 0);
        if (date < start) {
          for (const serviceId of Object.keys(nach[accountId][year][month])) {
            debit += nach[accountId][year][month][serviceId];
          }
        }
      }
    }
  }

  return debit;
}
function generateLsCell(accountId) {
  const curLS = ls[accountId];
  const lsCell = document.createElement("td");
  lsCell.classList.add("poster");

  lsCell.innerHTML = `
    ${curLS.kv} <!-- Номер квартиры -->
    <div class="descr">
      <div>
        ЛС: ${curLS.ls}<br> <!-- Лицевой счет -->
        ФИО: ${curLS.fio}<br> <!-- ФИО -->
        ${curLS.pl ? `Площадь: ${curLS.pl} м²<br>` : ""} <!-- Площадь -->
        ${curLS.pers ? `Жильцов: ${curLS.pers}<br>` : ""} <!-- Количество жильцов -->
        ${curLS.komn ? `Комнат: ${curLS.komn}<br>` : ""} <!-- Количество комнат -->
        ${curLS.et ? `Этаж: ${curLS.et}<br>` : ""} <!-- Этаж -->
        ${curLS.pod ? `Подъезд: ${curLS.pod}<br>` : ""} <!-- Подъезд -->
        ${curLS.lgota ? `Льготник: ${curLS.lgota}<br>` : ""} <!-- Льготник -->
        ${curLS.tel ? `Телефон: ${curLS.tel}<br>` : ""} <!-- Телефон -->
        ${curLS.note ? `Примечание: ${curLS.note}<br>` : ""} <!-- Примечание -->
        ${curLS.email ? `e-mail: ${curLS.email}<br>` : ""} <!-- Email -->
      </div>
    </div>
  `;

  return lsCell;
}








// === форматирование чисел ===
Number.prototype.toFixedWithComma = function() {
  return this.toLocaleString('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2});
}


function parseNumber(str) {
  if (!str) return 0;
  // убираем пробелы, заменяем запятую на точку
  return parseFloat(str.replace(/\s/g,'').replace(',', '.')) || 0;
}


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

      if (debitEnd < 0) {
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      } else {
        const monthsOfDebt = calculateDebtMonths(chargesHistory, debitEnd);
        if (monthsOfDebt >= 4) {
          row.debtorCharged += debitStart;
          row.debtorPaid += paymentsThisMonth;
          row.debtorCount++;
        }
      }
    });

    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
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
//      <th class="th-overpay">Сплачено</th>

//      <th class="th-debtor">Підлягае сплаті</th>
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th rowspan="2">Місяць</th>
      <th colspan="3" class="th-total">Всього по будинку</th>
      <th colspan="2" class="th-overpay">Переплатники</th>
      <th colspan="3" class="th-debtor">Боржники</th>
    </tr>
    <tr>
      <th class="th-total">Нараховано</th>
      <th class="th-total">Сплачено</th>
      <th class="th-total">% оплати</th>

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
//      <td class="td-overpay">${Math.round(row.overpayPaid)}</td>

//      <td class="td-debtor">${Math.round(row.debtorCharged)}</td>
  // === Создаем строки таблицы ===
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td class="td-total">${Math.round(row.totalCharged)}</td>
      <td class="td-total">${Math.round(row.totalPaid)}</td>
      <td class="td-total">${row.percentPaid.toFixed(1)}%</td>

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
        debtorPercent: sum('debtorCharged') ? (sum('debtorPaid') / sum('debtorCharged')) * 100 : 0,
        debtorCount,
        debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,

        rowCount: partData.length
      };
    };
//        <td class="summary-overpay">${Math.round(summary.overpayCharged / summary.rowCount)}</td>
//        <td class="summary-overpay">${Math.round(summary.overpayPaid / summary.rowCount)}</td>

//        <td class="summary-debtor">${Math.round(summary.debtorCharged / summary.rowCount)}</td>
    const fillRow = (tr, summary) => {
      tr.innerHTML = `
        <td>Ітого</td>
        <td class="summary-total">${Math.round(summary.totalCharged / summary.rowCount)}</td>
        <td class="summary-total">${Math.round(summary.totalPaid / summary.rowCount)}</td>
        <td class="summary-total">${summary.percentPaid.toFixed(1)}%</td>

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

    const currentRow = data[splitIndex - 1];
    if (currentRow) label.textContent = `${currentRow.month} р.`;
  }

  slider.addEventListener('input', () => {
    updateSummaries(parseInt(slider.value));
  });

  updateSummaries(rows.length);

  return wrapper;
}
