var lastFileData = {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null;

function generateTable() {
  const existingTable = document.querySelector("table");
  let prevOrder = 0;

  // 1️⃣ Сохраняем текущий порядок квартир
  if (existingTable) {
    const tbody = existingTable.querySelector("tbody");
    prevOrder = Array.from(tbody.rows)
      .filter(row => row.cells.length > 0)
      .map(row => row.cells[0].textContent.trim());
  }

  const start = new Date(document.getElementById("start-date").value);
  const end = new Date(document.getElementById("end-date").value);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  const displayMode = document.getElementById("display-mode").value;
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("main");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);

  const servicesWithCharges = new Set();
  const filterValue = document.getElementById("record-filter").value;

  let serviceFilterId = null;
  if (displayMode.startsWith("service-")) {
    serviceFilterId = displayMode.split("-")[1];
  }

  // Собираем список услуг с начислениями
  for (const accountId in nach) {
    for (const year in nach[accountId]) {
      for (const month in nach[accountId][year]) {
        const date = new Date(year, month - 1, 1, 12);
        if (date >= start && date <= end) {
          for (const serviceId in nach[accountId][year][month]) {
            servicesWithCharges.add(serviceId);
          }
        }
      }
    }
  }

  // Создание заголовка
  let headerRow = `
    <tr>
      <th onclick="sortTable(this)">Квартира</th>
      <th onclick="sortTable(this)">П.І. по Б.</th>
      <th onclick="sortTable(this)">Борг початковий</th>
  `;

  if (displayMode === "summarized") {
    for (const serviceId of servicesWithCharges) {
      headerRow += `<th onclick="sortTable(this)">${us[serviceId]}</th>`;
    }
    headerRow += `
      <th onclick="sortTable(this)">Оплати</th>
      <th onclick="sortTable(this)">Борг кінцевий</th></tr>
    `;
  } else if (serviceFilterId !== null) {
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();
      headerRow += `<th onclick="sortTable(this)">Нараховано ${m}-${y}</th>`;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    headerRow += `<th onclick="sortTable(this)">Борг кінцевий</th></tr>`;
  } else {
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();

      if (["detailed", "charges-only"].includes(displayMode))
        headerRow += `<th onclick="sortTable(this)">Нараховано ${m}-${y}</th>`;

      if (["detailed", "payments-only"].includes(displayMode))
        headerRow += `<th onclick="sortTable(this)">Сплачено ${m}-${y}</th>`;

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    headerRow += `<th onclick="sortTable(this)">Борг кінцевий</th></tr>`;
  }

  thead.innerHTML = headerRow;

  let totalStartDebt = 0;
  let totalEndDebt = 0;
  const totalCharges = {};
  const totalPayments = {};

  // 🔁 Основной цикл по лицевым счетам
  for (const accountId in nach) {
    const debitStart = calculateInitialDebit(accountId, start);
    const payments = calculatePayments(accountId, start, end);
    const totalCharge = calculateCharges(accountId, start, end, false);
    const lastMonthCharges = calculateCharges(accountId, start, end, true);
    const debitEnd = debitStart + totalCharge - payments;

    // Фильтрация
    if (filterValue === "paid-or-low-debt" && !(payments > 0 || debitEnd < lastMonthCharges * 3)) continue;
    if (filterValue === "paid" && payments === 0) continue;
    if (filterValue === "overpaid" && debitEnd > 0) continue;
    if (filterValue === "debtors" && (payments > 0 || debitEnd <= lastMonthCharges * 3)) continue;

    totalStartDebt += debitStart;

    const row = document.createElement("tr");
    row.append(generateLsCell(accountId));
    row.innerHTML += `<td>${ls[accountId].fio}</td>`;
    row.innerHTML += `<td>${debitStart.toFixedWithComma()}</td>`;

    if (displayMode === "summarized") {
      const chargesByService = {};
      let paymentsSum = 0;
      const allPayments = [];

      for (const year in nach[accountId]) {
        for (const month in nach[accountId][year]) {
          const date = new Date(year, month - 1, 1, 12);
          if (date < start || date > end) continue;

          for (const serviceId in nach[accountId][year][month]) {
            const value = nach[accountId][year][month][serviceId];
            chargesByService[serviceId] = (chargesByService[serviceId] || 0) + value;
            totalCharges[serviceId] = (totalCharges[serviceId] || 0) + value;
          }

          const monthPayments = oplat?.[accountId]?.[year]?.[month] || [];
          allPayments.push(...monthPayments);
          monthPayments.forEach(p => {
            paymentsSum += p.sum;
            totalPayments[month] = (totalPayments[month] || 0) + p.sum;
          });
        }
      }

      for (const serviceId of servicesWithCharges) {
        const charge = chargesByService[serviceId] || 0;
        row.innerHTML += `<td>${charge.toFixedWithComma()}</td>`;
      }

      row.append(generatePaymentCell(allPayments));

      const debitEndRow =
        debitStart +
        Object.values(chargesByService).reduce((sum, val) => sum + val, 0) -
        paymentsSum;

      totalEndDebt += debitEndRow;
      row.innerHTML += `<td>${debitEndRow.toFixedWithComma()}</td>`;
    } else {
      let debitEndRow = debitStart;
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth() + 1;

        let charges = 0;
        let chargesAll = 0;

        if (nach[accountId]?.[y]?.[m]) {
          chargesAll = Object.values(nach[accountId][y][m]).reduce((sum, v) => sum + v, 0);
          totalCharges[`${y}-${m}`] = (totalCharges[`${y}-${m}`] || 0) + chargesAll;

          charges = serviceFilterId !== null ? (nach[accountId][y][m][serviceFilterId] || 0) : chargesAll;
        }

        const paymentsArr = oplat?.[accountId]?.[y]?.[m] || [];
        const paymentsSum = paymentsArr.reduce((sum, p) => sum + p.sum, 0);
        totalPayments[`${y}-${m}`] = (totalPayments[`${y}-${m}`] || 0) + paymentsSum;

        if (displayMode !== "payments-only")
          row.innerHTML += `<td v="${charges}">${charges ? charges.toFixedWithComma() : "–"}</td>`;

        if (serviceFilterId === null && displayMode !== "charges-only")
          row.append(generatePaymentCell(paymentsArr));

        debitEndRow += chargesAll - paymentsSum;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      totalEndDebt += debitEndRow;
      row.innerHTML += `<td>${debitEndRow.toFixedWithComma()}</td>`;
    }

    tbody.append(row);
  }

  // 🔚 Итоговая строка
  const footerRow = document.createElement("tr");
  footerRow.classList.add("itog");
  footerRow.innerHTML = `<td colspan=2>Итого</td><td>${totalStartDebt.toFixedWithComma()}</td>`;

  if (displayMode === "summarized") {
    for (const serviceId of servicesWithCharges) {
      footerRow.innerHTML += `<td>${(totalCharges[serviceId] || 0).toFixedWithComma()}</td>`;
    }

    footerRow.innerHTML += `<td>${Object.values(totalPayments).reduce((a, b) => a + b, 0).toFixedWithComma()}</td>`;
    footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td>`;
  } else {
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth() + 1;
      const key = `${y}-${m}`;

      let chargeTotal = 0;
      if (serviceFilterId !== null) {
        for (const accId in nach) {
          if (nach[accId]?.[y]?.[m]?.[serviceFilterId])
            chargeTotal += nach[accId][y][m][serviceFilterId];
        }
      } else {
        chargeTotal = totalCharges[key] || 0;
      }

      const paymentTotal = totalPayments[key] || 0;

      if (displayMode === "charges-only")
        footerRow.innerHTML += `<td>${chargeTotal.toFixedWithComma()}</td>`;
      else if (displayMode === "payments-only")
        footerRow.innerHTML += `<td>${paymentTotal.toFixedWithComma()}</td>`;
      else if (displayMode === "detailed")
        footerRow.innerHTML += `<td>${chargeTotal.toFixedWithComma()}</td><td>${paymentTotal.toFixedWithComma()}</td>`;
      else if (displayMode.startsWith("service-"))
        footerRow.innerHTML += `<td>${chargeTotal.toFixedWithComma()}</td>`;

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td>`;
  }

  // Восстановление порядка квартир
  if (prevOrder) {
    const rows = Array.from(tbody.rows).filter(row => row.cells.length > 0);
    rows.sort(
      (a, b) =>
        prevOrder.indexOf(a.cells[0].textContent.trim()) -
        prevOrder.indexOf(b.cells[0].textContent.trim())
    );
    rows.forEach(r => tbody.appendChild(r));
  }

  thead.appendChild(footerRow);

  // Копия шапки в конец
  Array.from(thead.querySelectorAll("tr")).forEach(row => {
    const clone = row.cloneNode(true);
    clone.classList.add("header-row-clone");
    tbody.append(clone);
  });

  tableContainer.appendChild(table);
  initPosters();
  doRed();

  setParam("start", document.getElementById("start-date").value);
  setParam("end", document.getElementById("end-date").value);
  setParam("displayMode", displayMode);
  setParam("preset", document.getElementById("preset-select").value);
}


function calculatePayments(accountId, start, end) {
  let totalPayments = 0;

  const account = oplat[accountId];
  if (!account) return 0;

  for (const [year, months] of Object.entries(account)) {
    for (const [month, payments] of Object.entries(months)) {
      const date = new Date(year, month - 1);
      if (date >= start && date <= end) {
        for (const { sum } of payments) {
          totalPayments += sum;
        }
      }
    }
  }

  return totalPayments;
}
/**
 * Посчитать начисления для лицевого счета за период.
 *
 * @param {string|number} accountId - id аккаунта в объекте `nach`
 * @param {Date} start - начало периода (включительно)
 * @param {Date} end - конец периода (включительно)
 * @param {boolean} lastMonthOnly - если true — вернуть начисления только за последний месяц в периоде
 * @returns {number} — сумма начислений (или начисления за последний месяц)
 */
const calculateCharges = (accountId, start, end, lastMonthOnly = false) => {
  let totalCharges = 0;
  let lastMonthCharges = 0;
  let lastMonthKey = null;

  const acc = nach?.[accountId];
  if (!acc) return lastMonthOnly ? 0 : 0;

  // Пробегаем по годам и месяцам в acc (как в исходном коде)
  for (const [yearStr, months] of Object.entries(acc)) {
    const year = Number(yearStr);

    for (const [monthStr, services] of Object.entries(months)) {
      const month = Number(monthStr); // 1..12, как у тебя в данных
      const date = new Date(year, month - 1); // первый день месяца, 00:00

      // Проверяем входит ли месяц в запрошенный период (включительно)
      if (date >= start && date <= end) {
        // Сумма всех услуг в этом месяце
        for (const v of Object.values(services)) {
          totalCharges += Number(v) || 0;
        }

        // Если это более поздний месяц — обновляем "последний месяц"
        if (!lastMonthKey || date > lastMonthKey) {
          lastMonthKey = date;
          lastMonthCharges = 0;
          for (const v of Object.values(services)) {
            lastMonthCharges += Number(v) || 0;
          }
        }
      }
    }
  }

  return lastMonthOnly ? lastMonthCharges : totalCharges;
};
