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
function generateTable() {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const start = new Date(document.getElementById("start-date").value);
  const end = new Date(document.getElementById("end-date").value);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Последний день предыдущего месяца
  end.setHours(23, 59, 59, 999);

  const displayMode = document.getElementById("display-mode").value;
  const filterValue = document.getElementById("record-filter").value;
  let serviceFilterId = null;
  if (displayMode.startsWith("service-")) {
    serviceFilterId = displayMode.split("-")[1];
  }

  // 1️⃣ Сохраняем текущий порядок квартир
  let prevOrder = [];
  const existingTable = document.querySelector("table");
  if (existingTable) {
    const tbodyPrev = existingTable.querySelector("tbody");
    prevOrder = Array.from(tbodyPrev.rows)
      .filter(row => row.cells.length > 0)
      .map(row => row.cells[0].textContent.trim());
  }

  // 2️⃣ Собираем список услуг с начислениями в период
  const servicesWithCharges = new Set();
  for (const accountId in nach) {
    for (const year in nach[accountId]) {
      for (const month in nach[accountId][year]) {
        const date = new Date(year, month - 1, 1, 12);
        if (date >= start && date <= end) {
          Object.keys(nach[accountId][year][month]).forEach(sid =>
            servicesWithCharges.add(sid)
          );
        }
      }
    }
  }

  // 3️⃣ Создаём таблицу и заголовок
  const table = document.createElement("table");
  table.classList.add("main");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  let headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">П.І. по Б.</th><th onclick="sortTable(this)">Борг почтковий</th>';

  if (displayMode === "summarized") {
    for (const serviceId of servicesWithCharges) {
      headerRow += `<th onclick="sortTable(this)">${us[serviceId]}</th>`;
    }
    headerRow += '<th onclick="sortTable(this)">Оплати</th><th onclick="sortTable(this)">Борг кінцевий</th></tr>';
  } else {
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();

      if (displayMode === "detailed" || displayMode === "charges-only") {
        headerRow += `<th onclick="sortTable(this)">Нараховано ${m}-${y}</th>`;
      }
      if (displayMode === "detailed" || displayMode === "payments-only") {
        headerRow += `<th onclick="sortTable(this)">Сплчено ${m}-${y}</th>`;
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    headerRow += '<th onclick="sortTable(this)">Борг кінцевий</th></tr>';
  }
  thead.innerHTML = headerRow;

  // 4️⃣ Основные данные
  let totalStartDebt = 0,
      totalEndDebt = 0,
      totalCharges = {},
      totalPayments = {};

  for (const accountId in nach) {
    let debitStart = calculateInitialDebit(accountId, start);
    totalStartDebt += debitStart;

    const payments = calculatePayments(accountId, start, end);
    const totalCharge = calculateCharges(accountId, start, end, false);
    const lastMonthCharges = calculateCharges(accountId, start, end, true);
    let debitEnd = debitStart + totalCharge - payments;

    // Фильтрация записей
    if (
      (filterValue === "paid-or-low-debt" && !(payments > 0 || debitEnd < lastMonthCharges * 3)) ||
      (filterValue === "paid" && payments === 0) ||
      (filterValue === "overpaid" && debitEnd > 0) ||
      (filterValue === "debtors" && (payments > 0 || debitEnd <= lastMonthCharges * 3))
    ) continue;

    const row = document.createElement("tr");
    row.appendChild(generateLsCell(accountId));
    row.innerHTML += `<td>${ls[accountId].fio}</td>`;
    row.innerHTML += `<td>${debitStart.toFixedWithComma()}</td>`;

    if (displayMode === "summarized") {
      const chargesByService = {};
      let paymentsSum = 0;
      let paymentsArr = [];

      for (const year in nach[accountId]) {
        for (const month in nach[accountId][year]) {
          const date = new Date(year, month - 1, 1, 12);
          if (date >= start && date <= end) {
            for (const serviceId in nach[accountId][year][month]) {
              chargesByService[serviceId] = (chargesByService[serviceId] || 0) + nach[accountId][year][month][serviceId];
              totalCharges[serviceId] = (totalCharges[serviceId] || 0) + nach[accountId][year][month][serviceId];
            }

            if (oplat[accountId] && oplat[accountId][year] && oplat[accountId][year][month]) {
              paymentsArr.push(...oplat[accountId][year][month]);
              oplat[accountId][year][month].forEach(p => {
                paymentsSum += p.sum;
                totalPayments[month] = (totalPayments[month] || 0) + p.sum;
              });
            }
          }
        }
      }

      for (const serviceId of servicesWithCharges) {
        row.innerHTML += `<td>${(chargesByService[serviceId] || 0).toFixedWithComma()}</td>`;
      }
      row.appendChild(generatePaymentCell(paymentsArr));
      debitEnd = debitStart + Object.values(chargesByService).reduce((sum, val) => sum + val, 0) - paymentsSum;
      totalEndDebt += debitEnd;
      row.innerHTML += `<td>${debitEnd.toFixedWithComma()}</td>`;
    } else {
      let _debitEnd = debitStart;
      let currentDateIter = new Date(start);
      while (currentDateIter <= end) {
        const m = currentDateIter.getMonth() + 1;
        const y = currentDateIter.getFullYear();
        let charges = 0, chargesAll = 0;

        if (nach[accountId] && nach[accountId][y] && nach[accountId][y][m]) {
          chargesAll = Object.values(nach[accountId][y][m]).reduce((sum, val) => sum + val, 0);
          totalCharges[`${y}-${m}`] = (totalCharges[`${y}-${m}`] || 0) + chargesAll;

          charges = serviceFilterId ? (nach[accountId][y][m][serviceFilterId] || 0) : chargesAll;
        }

        let paymentsMonth = [];
        let paymentsSum = 0;
        if (!serviceFilterId && oplat[accountId] && oplat[accountId][y] && oplat[accountId][y][m]) {
          paymentsMonth = oplat[accountId][y][m];
          paymentsSum = paymentsMonth.reduce((sum, p) => sum + p.sum, 0);
          totalPayments[`${y}-${m}`] = (totalPayments[`${y}-${m}`] || 0) + paymentsSum;
        }

        if (displayMode !== "payments-only") row.innerHTML += `<td v="${charges}">${!charges ? "–" : charges.toFixedWithComma()}</td>`;
        if (!serviceFilterId && displayMode !== "charges-only") row.appendChild(generatePaymentCell(paymentsMonth));
        _debitEnd += chargesAll - paymentsSum;

        currentDateIter.setMonth(currentDateIter.getMonth() + 1);
      }
      totalEndDebt += _debitEnd;
      row.innerHTML += `<td>${_debitEnd.toFixedWithComma()}</td>`;
    }

    tbody.appendChild(row);
  }

  // 5️⃣ Итоговая строка
  const footerRow = document.createElement("tr");
  footerRow.classList.add("itog");
  footerRow.innerHTML = `<td colspan=2>Ітого</td><td>${totalStartDebt.toFixedWithComma()}</td>`;

  if (displayMode === "summarized") {
    for (const serviceId of servicesWithCharges) {
      footerRow.innerHTML += `<td>${(totalCharges[serviceId] || 0).toFixedWithComma()}</td>`;
    }
    footerRow.innerHTML += `<td>${Object.values(totalPayments).reduce((sum, val) => sum + val, 0).toFixedWithComma()}</td><td>${totalEndDebt.toFixedWithComma()}</td>`;
  } else {
    let currentDateIter = new Date(start);
    while (currentDateIter <= end) {
      const m = currentDateIter.getMonth() + 1;
      const y = currentDateIter.getFullYear();
      const key = `${y}-${m}`;
      let chargeTotal = serviceFilterId
        ? Object.keys(nach).reduce((sum, accId) => sum + (nach[accId][y]?.[m]?.[serviceFilterId] || 0), 0)
        : totalCharges[key] || 0;
      let paymentTotal = totalPayments[key] || 0;

      if (displayMode === "charges-only") footerRow.innerHTML += `<td>${chargeTotal.toFixedWithComma()}</td>`;
      else if (displayMode === "payments-only") footerRow.innerHTML += `<td>${paymentTotal.toFixedWithComma()}</td>`;
      else footerRow.innerHTML += `<td>${chargeTotal.toFixedWithComma()}</td><td>${paymentTotal.toFixedWithComma()}</td>`;

      currentDateIter.setMonth(currentDateIter.getMonth() + 1);
    }
    footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td>`;
  }

  tbody.appendChild(footerRow);

  // 6️⃣ Восстанавливаем порядок строк по сохранённым квартирам
  if (prevOrder.length) {
    const rows = Array.from(tbody.rows).filter(row => row.cells.length > 0);
    rows.sort((a, b) => prevOrder.indexOf(a.cells[0].textContent.trim()) - prevOrder.indexOf(b.cells[0].textContent.trim()));
    rows.forEach(row => tbody.appendChild(row));
  }

  // 7️⃣ Клонируем заголовок для прокрутки
  Array.from(thead.querySelectorAll("tr")).forEach(row => {
    const clone = row.cloneNode(true);
    clone.classList.add("header-row-clone");
    tbody.appendChild(clone);
  });

  tableContainer.appendChild(table);

  // 8️⃣ Инициализация постеров и красок
  initPosters();
  doRed();

  // 9️⃣ Сохраняем параметры
  setParam("start", document.getElementById("start-date").value);
  setParam("end", document.getElementById("end-date").value);
  setParam("displayMode", displayMode);
  setParam("preset", document.getElementById("preset-select").value);
}
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
    let cellA = rowA.cells[index].getAttribute("v") || rowA.cells[index].textContent;
    let cellB = rowB.cells[index].getAttribute("v") || rowB.cells[index].textContent;

    // Преобразуем "-" в 0
    if (cellA.trim() === "-") cellA = "0";
    if (cellB.trim() === "-") cellB = "0";

    let valA = parseFloat(cellA.replace(/\s/g, "").replace(",", "."));
    let valB = parseFloat(cellB.replace(/\s/g, "").replace(",", "."));

    // Если не число — сравниваем как строки
    if (isNaN(valA)) valA = cellA;
    if (isNaN(valB)) valB = cellB;

    return isAsc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
  });

  // Добавляем отсортированные строки обратно в tbody
  rows.forEach(row => tbody.appendChild(row));

  // Клонируем строки заголовка и добавляем их в конец tbody
  const headerRowsClone = Array.from(table.querySelectorAll("thead tr")).map(row => {
    const clone = row.cloneNode(true);
    clone.classList.add("header-row-clone");
    return clone;
  });

  headerRowsClone.forEach(row => tbody.appendChild(row));
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

  if (event === "start" || event === "end") {
    if (isMonth(startDate) && isMonth(endDate)) presetSelect.value = "current-month";
    if (isMonth(startDate, -1) && isMonth(endDate, -1)) presetSelect.value = "previous-month";
    if (isMonth(startDate, -2) && isMonth(endDate, -2)) presetSelect.value = "two-months-ago";
  }

  // Показать или скрыть поля "С" и "По"
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

  for (const row of table.rows) {
    const cells = row.cells;
    let visualIndex = 0;
    const totalVisualCols = getTotalVisualColumns(row);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);

      // Обработка третьего визуального столбца (индекс 2)
      if (visualIndex <= 2 && visualIndex + colspan > 2) {
        const value = parseFloat(cell.textContent);
        if (value > 0) cell.classList.add("red");
      }

      // Обработка остальных ячеек между 4 и предпоследним (визуально)
      for (let v = 3; v < totalVisualCols - 1; v++) {
        if (visualIndex <= v && visualIndex + colspan > v) {
          const value = parseFloat(cell.textContent);
          if (value < 0) cell.classList.add("red");
        }
      }

      visualIndex += colspan;
    }

    // Последний визуальный столбец — самый правый cell
    const lastCell = cells[cells.length - 1];
    const lastValue = parseFloat(lastCell.textContent);
    if (lastValue > 0) lastCell.classList.add("red");
  }
}

// Подсчёт количества визуальных колонок
const getTotalVisualColumns = (row) =>
  Array.from(row.cells).reduce(
    (sum, cell) => sum + parseInt(cell.getAttribute("colspan") || "1", 10),
    0
  );

