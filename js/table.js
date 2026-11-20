// ===================== 📅 Работа с датами =====================

// Определяет минимальную дату (по начислениям и оплатам) и текущую дату.
function tableWildcardSearchRegex(pattern) {
  const text = String(pattern || "").trim();
  if (!text) return null;
  if (text.length > 1 && text.startsWith("/") && text.endsWith("/")) {
    try {
      return new RegExp(text.slice(1, -1), "i");
    } catch (_err) {}
  }
  const parts = text.split("|").map(part => part.trim()).filter(Boolean);
  const source = (parts.length ? parts : [text]).map(part => {
    let out = "";
    for (let i = 0; i < part.length; i++) {
      const ch = part[i];
      if (ch === "*" || /\s/.test(ch)) {
        out += ".*";
        while (i + 1 < part.length && (part[i + 1] === "*" || /\s/.test(part[i + 1]))) i++;
        continue;
      }
      if (ch === "?") {
        out += ".";
        continue;
      }
      if (ch === "[") {
        const end = part.indexOf("]", i + 1);
        if (end > i + 1) {
          const body = part.slice(i + 1, end).replace(/[\\\]\^-]/g, "\\$&");
          out += `[${body}]`;
          i = end;
          continue;
        }
      }
      out += ch.replace(/[\\^$+?.(){}[\]]/g, "\\$&");
    }
    return out;
  }).join("|");
  return new RegExp(source, "i");
}

function tableMatchesWildcardSearch(value, pattern) {
  const re = tableWildcardSearchRegex(pattern);
  return !re || re.test(String(value || ""));
}

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
  const displayMode = document.getElementById("display-mode");

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
  const hasPresetParam = !!getParam("preset");
  const hasStartParam = !!getParam("start");
  const hasEndParam = !!getParam("end");

  if (hasPresetParam) presets.value = getParam("preset");
  if (hasEndParam) endInput.value = getParam("end");
  if (hasStartParam) startInput.value = getParam("start");

  // === Устанавливаем значения по умолчанию, если параметров нет ===
  if (!hasPresetParam && !hasStartParam && !hasEndParam) {
    const today = new Date();

    // Предыдущий месяц
    const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const year = prev.getFullYear();
    const month = prev.getMonth() + 1;

    // Конец — предыдущий месяц
    endInput.value = `${year}-${String(month).padStart(2, "0")}`;

    // Начало — январь того же года
    startInput.value = `${year}-01`;

    // Вручную ставим пресет custom
    presets.value = "custom";
  } else {
    applyPreset();
  }
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

function getRecentPaymentsMonths() {
  const input = document.getElementById("recent-payments-inline");
  const rawValue = input?.value ?? getParam("recentMonths") ?? "3";
  const parsed = parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function normalizeRecentPaymentsMonths(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

function applyRecentPaymentsMonths(value) {
  const normalized = normalizeRecentPaymentsMonths(value);
  setParam("recentMonths", String(normalized));
  generateTable();
  return false;
}

function handleRecentPaymentsWheel(event) {
  event.preventDefault();
  event.stopPropagation();

  const input = document.getElementById("recent-payments-inline");
  if (!input) return false;

  const current = normalizeRecentPaymentsMonths(input.value);
  const next = event.deltaY < 0 ? current + 1 : Math.max(1, current - 1);
  input.value = String(next);
  return applyRecentPaymentsMonths(next);
}

function handleRecentPaymentsChange(event) {
  event.stopPropagation();
  const input = event.target;
  input.value = String(normalizeRecentPaymentsMonths(input.value));
  return applyRecentPaymentsMonths(input.value);
}

function handleRecentPaymentsKeydown(event) {
  event.stopPropagation();
  if (event.key === "Enter") {
    return handleRecentPaymentsChange(event);
  }
  return true;
}

function sumPaymentsInRange(accountId, rangeStart, rangeEnd) {
  let total = 0;
  const paymentsByYear = oplat[accountId] || {};

  for (const year in paymentsByYear) {
    for (const month in paymentsByYear[year]) {
      const date = new Date(year, month - 1, 1, 12);
      if (date < rangeStart || date > rangeEnd) continue;

      const paymentsArr = paymentsByYear[year][month] || [];
      total += paymentsArr.reduce((sum, payment) => sum + payment.sum, 0);
    }
  }

  return total;
}

function sortTable(header) {
  const table = header.closest("table");
  const tbody = table.querySelector("tbody");

  // Удаляем старые клоны итогов и нижний заголовок
  tbody.querySelectorAll(".header-row-clone, .footer-header-clone").forEach(row => row.remove());

  const rows = Array.from(tbody.rows);
  const isAsc = header.classList.contains("sorted-asc");
  const index = Array.from(header.parentNode.children).indexOf(header);

  // Снимаем классы сортировки со всех верхних и нижних заголовков
  table.querySelectorAll("th").forEach(th =>
    th.classList.remove("sorted-asc", "sorted-desc")
  );
  header.classList.add(isAsc ? "sorted-desc" : "sorted-asc");

  // Находим строку итогов
  const itogRow = rows.find(r => r.classList.contains("itog"));
  // Фильтруем строки для сортировки
  const sortableRows = rows.filter(r => !r.classList.contains("itog") && !r.classList.contains("list-group-row"));

  // Сортировка строк
  sortableRows.sort((rowA, rowB) => {
    const cellA = rowA.cells[index];
    const cellB = rowB.cells[index];

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

  // Перестраиваем tbody
  tbody.innerHTML = "";

  // Клонируем строку итогов в верх
  if (itogRow) {
    const clone = itogRow.cloneNode(true);
    clone.classList.add("header-row-clone");
    tbody.appendChild(clone);
  }

  // Добавляем отсортированные строки
  sortableRows.forEach(row => tbody.appendChild(row));

  // Возвращаем оригинальную строку итогов в самый низ
  if (itogRow) tbody.appendChild(itogRow);
  arrangeAppendixGroups(table);

  // Клонируем верхний заголовок внизу (нижний заголовок)
  const theadRow = table.querySelector("thead tr");
  if (theadRow) {
    const footerClone = theadRow.cloneNode(true);
    footerClone.classList.add("footer-header-clone");

    const recentHeaderClone = footerClone.querySelector("#recent-payments-header");
    if (recentHeaderClone) {
      recentHeaderClone.removeAttribute("id");
      const recentInputClone = recentHeaderClone.querySelector("#recent-payments-inline");
      if (recentInputClone) {
        const recentMonths = getRecentPaymentsMonths();
        recentHeaderClone.textContent = `Оплати за ост. ${recentMonths} міс.`;
      }
    }

    // Повесим на клон обработчики сортировки
    footerClone.querySelectorAll("th").forEach((th, idx) => {
      th.onclick = () => {
        // Вызов sortTable с соответствующим верхним заголовком
        const originalHeader = theadRow.children[idx];
        sortTable(originalHeader);
      };
    });

    tbody.appendChild(footerClone);
  }
}



function calculateDebtMonthsFromCache(accountId, debtEnd, endDate) {
    if (!nach[accountId]) return 0;

    const EPS = 0.004;
    let remaining = debtEnd;
    let months = 0;

    let currentYear = endDate.getFullYear();
    let currentMonth = endDate.getMonth() + 1;

    // 1. Собираем все имеющиеся в кэше месяцы
    const years = Object.keys(nach[accountId]).map(Number).sort((a, b) => a - b);
    const allMonths = [];
    for (const y of years) {
        for (let m = 1; m <= 12; m++) {
            if (nach[accountId][y] && nach[accountId][y][m]) {
                allMonths.push({ year: y, month: m });
            }
        }
    }

    // 2. Определяем первые 3 "живых" месяца для исключения кодов 10/13
    const firstThreeMonths = [];
    for (const { year: y, month: m } of allMonths) {
        const monthCharges = nach[accountId][y][m];
        const monthSum = Object.values(monthCharges).reduce((s, v) => s + v, 0);
        if (monthSum > EPS) {
            firstThreeMonths.push({ year: y, month: m });
            if (firstThreeMonths.length >= 3) break;
        }
    }
    const firstThreeSet = new Set(firstThreeMonths.map(x => x.year + "-" + x.month));

    // 3. Находим точку начала реальной истории и сумму для прогноза
    let firstRealMonthKey = null; 
    let earliestNonZeroSum = 0;

    for (const { year: y, month: m } of allMonths) {
        let monthCharges = { ...nach[accountId][y][m] };
        if (firstThreeSet.has(y + "-" + m)) {
            delete monthCharges[13];
            delete monthCharges[10];
        }
        const monthSum = Object.values(monthCharges).reduce((a, b) => a + b, 0);

        if (monthSum > EPS) {
            if (!firstRealMonthKey) {
                firstRealMonthKey = `${y}-${m}`; // Первый месяц, когда начали реально работать
                earliestNonZeroSum = monthSum;
            }
        }
    }

    // --- ДОЛГ ---
    if (remaining > EPS) {
        while (remaining > EPS) {
            const currentKey = `${currentYear}-${currentMonth}`;
            let hasDataInCache = !!(nach[accountId][currentYear] && nach[accountId][currentYear][currentMonth]);

            // Проверка на технические нули: если мы ушли вглубь до начала реальной работы
            if (firstRealMonthKey) {
                const [fYear, fMonth] = firstRealMonthKey.split('-').map(Number);
                if (currentYear < fYear || (currentYear === fYear && currentMonth < fMonth)) {
                    hasDataInCache = false; // Всё, что раньше первого реального месяца — не история
                }
            }

            if (hasDataInCache) {
                let monthCharges = { ...nach[accountId][currentYear][currentMonth] };
                if (firstThreeSet.has(currentKey)) {
                    delete monthCharges[13];
                    delete monthCharges[10];
                }
                const monthSum = Object.values(monthCharges).reduce((a, b) => a + b, 0);

                // Если начисление положительное и оно больше остатка долга — берем долю месяца
                if (monthSum > EPS && remaining < monthSum) {
                    months += remaining / monthSum;
                    remaining = 0;
                } else {
                    // Отрицательные суммы увеличивают долг, 0 не меняет, но оба дают +1 месяц
                    remaining -= monthSum;
                    months += 1;
                }
            } else {
                // Если история в кэше кончилась (или дошли до тех. нулей), а долг остался
                if (earliestNonZeroSum > EPS) {
                    months += remaining / earliestNonZeroSum;
                } else {
                    months += 1; // Костыль на случай полного отсутствия начислений
                }
                remaining = 0;
            }

            // Уходим назад в историю
            currentMonth -= 1;
            if (currentMonth < 1) {
                currentYear -= 1;
                currentMonth = 12;
                if (currentYear < years[0] && remaining > EPS) {
                    // Если вышли за границы самого раннего года в кэше — на след. итерации сработает прогноз
                    continue; 
                } else if (currentYear < years[0]) {
                    break;
                }
            }
        }
        return +months.toFixed(1);
    }

    // --- ПЕРЕПЛАТА ---
    if (remaining < -EPS) {
        remaining = -remaining;
        let lastNonZeroSum = 0;

        // Ищем последнюю известную сумму начисления для прогноза переплаты
        for (const y of years) {
            for (let m = 1; m <= 12; m++) {
                if (nach[accountId][y] && nach[accountId][y][m]) {
                    const monthSum = Object.values(nach[accountId][y][m]).reduce((a, b) => a + b, 0);
                    if (monthSum > EPS) lastNonZeroSum = monthSum;
                }
            }
        }

        while (remaining > EPS) {
            let monthSum = 0;
            if (nach[accountId][currentYear] && nach[accountId][currentYear][currentMonth]) {
                monthSum = Object.values(nach[accountId][currentYear][currentMonth]).reduce((a, b) => a + b, 0);
            }

            if (monthSum > EPS) {
                if (remaining >= monthSum) {
                    remaining -= monthSum;
                    months += 1;
                } else {
                    months += remaining / monthSum;
                    remaining = 0;
                }
            } else if (lastNonZeroSum > EPS) {
                months += remaining / lastNonZeroSum;
                remaining = 0;
            } else {
                months += 1;
                remaining = 0;
            }

            currentMonth += 1;
            if (currentMonth > 12) {
                currentYear += 1;
                currentMonth = 1;
            }
        }
        return -parseFloat(months.toFixed(1));
    }

    return 0;
}

/**
 * Дані особових рахунків за період (без DOM).
 * Використовується в «Перелік» і в згенерованих звітах.
 * Повертає масив рядків з боргами, нарахуваннями, оплатами, місяцями боргу.
 */
function collectAccountsPeriodData(start, end, dataSources) {
  const srcLs = (dataSources && dataSources.ls) || ls;
  const srcNach = (dataSources && dataSources.nach) || nach;
  const srcOplat = (dataSources && dataSources.oplat) || oplat;
  const rows = [];

  const prevNach = typeof nach !== "undefined" ? nach : null;
  const prevOplat = typeof oplat !== "undefined" ? oplat : null;
  // Тимчасово підставляємо джерела для calculateInitialDebit / calculateDebtMonthsFromCache
  nach = srcNach;
  oplat = srcOplat;

  try {
    for (const accountId in srcNach) {
      if (!Object.prototype.hasOwnProperty.call(srcNach, accountId)) continue;
      const meta = srcLs[accountId] || {};

      let chargesSum = 0;
      let paymentsSum = 0;
      const payments = [];
      const monthCharges = [];

      for (const year in srcNach[accountId]) {
        for (const month in srcNach[accountId][year]) {
          const date = new Date(year, month - 1, 1, 12);
          if (date < start || date > end) continue;

          const byService = srcNach[accountId][year][month] || {};
          const cSum = Object.values(byService).reduce((s, v) => s + (Number(v) || 0), 0);
          const payArr = (srcOplat[accountId] && srcOplat[accountId][year] && srcOplat[accountId][year][month]) || [];
          const pSum = payArr.reduce((s, p) => s + (Number(p.sum) || 0), 0);

          chargesSum += cSum;
          paymentsSum += pSum;
          monthCharges.push({ year: Number(year), month: Number(month), chargesSum: cSum, paymentsSum: pSum });
          payArr.forEach(p => payments.push({ ...p, year: Number(year), month: Number(month) }));
        }
      }

      // Оплати в періоді, навіть якщо не було нарахувань у тому місяці
      if (srcOplat[accountId]) {
        for (const year in srcOplat[accountId]) {
          for (const month in srcOplat[accountId][year]) {
            const date = new Date(year, month - 1, 1, 12);
            if (date < start || date > end) continue;
            const already = monthCharges.some(m => m.year === Number(year) && m.month === Number(month));
            if (already) continue;
            const payArr = srcOplat[accountId][year][month] || [];
            const pSum = payArr.reduce((s, p) => s + (Number(p.sum) || 0), 0);
            paymentsSum += pSum;
            payArr.forEach(p => payments.push({ ...p, year: Number(year), month: Number(month) }));
          }
        }
      }

      const debitStart = calculateInitialDebit(accountId, start);
      const startDebtAnchor = new Date(start.getFullYear(), start.getMonth(), 0, 12);
      const startDebtMonths = calculateDebtMonthsFromCache(accountId, debitStart, startDebtAnchor);
      const debitEnd = debitStart + chargesSum - paymentsSum;
      const debtMonths = calculateDebtMonthsFromCache(accountId, debitEnd, end);

      rows.push({
        accountId,
        kv: meta.kv,
        fio: meta.fio || "",
        pl: Number(meta.pl) || 0,
        pers: Number(meta.pers) || 0,
        pod: meta.pod,
        et: meta.et,
        ls: meta.ls,
        debitStart,
        debitEnd,
        debtChange: debitEnd - debitStart,
        startDebtMonths,
        debtMonths,
        chargesSum,
        paymentsSum,
        payments,
        monthCharges
      });
    }

    // Рахунки лише з оплатами без записів у nach
    for (const accountId in srcOplat) {
      if (srcNach[accountId]) continue;
      if (!Object.prototype.hasOwnProperty.call(srcOplat, accountId)) continue;
      const meta = srcLs[accountId] || {};
      let paymentsSum = 0;
      const payments = [];
      for (const year in srcOplat[accountId]) {
        for (const month in srcOplat[accountId][year]) {
          const date = new Date(year, month - 1, 1, 12);
          if (date < start || date > end) continue;
          const payArr = srcOplat[accountId][year][month] || [];
          paymentsSum += payArr.reduce((s, p) => s + (Number(p.sum) || 0), 0);
          payArr.forEach(p => payments.push({ ...p, year: Number(year), month: Number(month) }));
        }
      }
      if (!payments.length && paymentsSum === 0) continue;
      const debitStart = calculateInitialDebit(accountId, start);
      const startDebtAnchor = new Date(start.getFullYear(), start.getMonth(), 0, 12);
      const startDebtMonths = calculateDebtMonthsFromCache(accountId, debitStart, startDebtAnchor);
      const debitEnd = debitStart - paymentsSum;
      const debtMonths = calculateDebtMonthsFromCache(accountId, debitEnd, end);
      rows.push({
        accountId,
        kv: meta.kv,
        fio: meta.fio || "",
        pl: Number(meta.pl) || 0,
        pers: Number(meta.pers) || 0,
        pod: meta.pod,
        et: meta.et,
        ls: meta.ls,
        debitStart,
        debitEnd,
        debtChange: debitEnd - debitStart,
        startDebtMonths,
        debtMonths,
        chargesSum: 0,
        paymentsSum,
        payments,
        monthCharges: []
      });
    }
  } finally {
    if (prevNach !== null) nach = prevNach;
    if (prevOplat !== null) oplat = prevOplat;
  }

  rows.sort((a, b) => {
    const ka = parseInt(String(a.kv).match(/\d+/)?.[0] || "0", 10);
    const kb = parseInt(String(b.kv).match(/\d+/)?.[0] || "0", 10);
    if (ka !== kb) return ka - kb;
    return String(a.kv).localeCompare(String(b.kv), "uk");
  });

  return rows;
}

function listTableDetailsExpanded(mode, group) {
  try { return getParam("list_" + mode + "_" + group + "Expanded") === "1"; }
  catch (_) { return false; }
}

function toggleListTableDetails(group) {
  const mode = document.getElementById("display-mode").value;
  try {
    setParam("list_" + mode + "_" + group + "Expanded", listTableDetailsExpanded(mode, group) ? "0" : "1");
  } catch (error) { console.warn("Не вдалося зберегти стан таблиці", error); }
  generateTable();
}

function appendixDebtThreshold() {
  const value = getParam("appendixDebtThreshold");
  const threshold = value === null ? 3 : Number(value);
  return [0, 3, 6, 12, 24].includes(threshold) ? threshold : 3;
}

function arrangeAppendixGroups(table) {
  if (table.dataset.listAppendix !== "1") return;
  const body = table.tBodies[0];
  body.querySelectorAll(".list-group-row").forEach(row => row.remove());
  const rows = [...body.rows].filter(row => row.dataset.debtGroup !== undefined && !row.classList.contains("header-row-clone"));
  const footer = body.querySelector("tr.itog:not(.header-row-clone)");
  const threshold = Number(table.dataset.debtThreshold);
  for (const group of ["0", "1"]) {
    const items = rows.filter(row => row.dataset.debtGroup === group);
    if (!items.length) continue;
    const visible = items.filter(row => row.dataset.hiddenByFilter !== "1").length;
    const heading = document.createElement("tr");
    heading.className = "list-group-row";
    const cell = document.createElement("td");
    cell.colSpan = table.tHead.rows[0].cells.length;
    cell.textContent = (group === "1" ? `Борг понад ${threshold} місяців` : `Борг до ${threshold} місяців включно / без боргу та переплата`) + ` (${visible} рах.)`;
    heading.appendChild(cell);
    if (!visible) { heading.style.display = "none"; heading.dataset.hiddenByFilter = "1"; }
    body.insertBefore(heading, footer);
    items.forEach(row => body.insertBefore(row, footer));
  }
}

function generateTable() {
  const isTouch=isMobile();
  const tableContainer = document.getElementById("table-container");

  const start = new Date(document.getElementById("start-date").value);
  const end = new Date(document.getElementById("end-date").value);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  const displayMode = document.getElementById("display-mode").value;
  const appendix = displayMode === "analiz-appendix";
  const byServices = displayMode === "summarized" || appendix;
  const debtThreshold = appendix ? appendixDebtThreshold() : 3;
  const recentPaymentsMonths = getRecentPaymentsMonths();
  const recentPaymentsStart = new Date(end.getFullYear(), end.getMonth() - recentPaymentsMonths + 1, 1, 12);
  const previousFilters = new Map();
  const previousTable = tableContainer.querySelector("table.main");
  if (previousTable) {
    const inputs = previousTable.querySelectorAll("thead .filter-row input");
    [...previousTable.tHead.rows[0].cells].forEach((cell, index) => {
      if (inputs[index]?.value) previousFilters.set(cell.dataset.columnKey || String(index), inputs[index].value);
    });
  }
  tableContainer.innerHTML = "";
  //const filterValue = document.getElementById("record-filter").value;
  setParam("displayMode", displayMode);
  setParam("recentMonths", String(recentPaymentsMonths));
  if (displayMode === "analiz") {
  	tableContainer.appendChild(generateAnaliz(start,end));
  	initPosters();
  	return;
  }
  if (displayMode === "analiz1") {
  	tableContainer.appendChild(generateAnaliz1(start,end));
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
          Object.entries(nach[accountId][year][month]).forEach(([sid, value]) => {
            if (Math.abs(Number(value) || 0) > 0.005) servicesWithCharges.add(sid);
          });
        }
      }
    }
  }
// --- Сортировка услуг по номеру ---
const sortedArray = Array.from(servicesWithCharges)
  .map(Number)
  .sort((a, b) => a - b);
servicesWithCharges.clear();
sortedArray.forEach(id => servicesWithCharges.add(id));

  const table = document.createElement("table");
  table.classList.add("main");
  if (appendix) { table.dataset.listAppendix = "1"; table.dataset.debtThreshold = String(debtThreshold); }
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);

  // Заголовок
  let headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">П.І. по Б.</th><th onclick="sortTable(this)">Площа</th><th onclick="sortTable(this)">Мешк</th><th onclick="sortTable(this)">Борг початковий</th><th onclick="sortTable(this)">Міся-ців боргу на початок</th>';

  if (appendix) headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">П.І. по Б.</th><th onclick="sortTable(this)">Борг початковий</th><th onclick="sortTable(this)">Міся-ців боргу на початок</th>';
  const periodMonths = [];
  for (let date = new Date(start.getFullYear(), start.getMonth(), 1, 12); date <= end; date.setMonth(date.getMonth() + 1)) {
    periodMonths.push({ year: date.getFullYear(), month: date.getMonth() + 1, key: `${date.getFullYear()}-${date.getMonth() + 1}` });
  }
  const chargesExpanded = !appendix && listTableDetailsExpanded(displayMode, "charges");
  const paymentsExpanded = listTableDetailsExpanded(displayMode, "payments");
  const hasCharges = displayMode !== "payments-only";
  const hasPayments = byServices || displayMode === "detailed" || displayMode === "payments-only";
  const periodColumns = [];
  if (hasCharges) {
    if (chargesExpanded) {
      if (displayMode === "summarized") {
        for (const serviceId of servicesWithCharges) {
          periodColumns.push({ key: "service-" + serviceId, title: (typeof usKr !== "undefined" && usKr[serviceId]) || us[serviceId] || `Послуга ${serviceId}`, kind: "service", serviceId, group: "charges", detail: true });
        }
      } else periodMonths.forEach(item => periodColumns.push({ key: "charged-" + item.key, title: `Нараховано ${String(item.month).padStart(2,"0")}.${item.year}`, kind: "monthCharge", monthKey: item.key, group: "charges", detail: true }));
    }
    periodColumns.push({ key: "totalCharged", title: "Всього нараховано", kind: "chargesTotal", group: appendix ? null : "charges" });
    if (appendix) periodColumns.push(
      { key: "annual3", title: "3% річних", kind: "service", serviceId: 17 },
      { key: "compensation", title: "Компенсація", kind: "service", serviceId: 12 }
    );
  }
  if (hasPayments) {
    if (!byServices && paymentsExpanded) periodMonths.forEach(item => periodColumns.push({ key: "paid-" + item.key, title: `Сплачено ${String(item.month).padStart(2,"0")}.${item.year}`, kind: "monthPayment", monthKey: item.key, group: "payments", detail: true }));
    periodColumns.push({ key: "totalPaid", title: "Всього сплачено", kind: "paymentsTotal", group: !byServices ? "payments" : null });
  }
  if (byServices) periodColumns.push({ key: "recentPaid", title: "", kind: "recent" });
  thead.innerHTML = headerRow + '</tr>';
  const heading = thead.rows[0];
  [...heading.cells].forEach((cell, index) => { cell.dataset.columnKey = "base-" + (appendix ? [0, 1, 4, 5][index] : index); });
  if (appendix) {
    const th = heading.cells[3];
    const select = document.createElement("select");
    select.className = "analiz-debt-threshold";
    select.setAttribute("aria-label", "Поріг місяців боргу");
    for (const value of [0, 3, 6, 12, 24]) {
      const option = document.createElement("option");
      option.value = String(value); option.textContent = String(value); option.selected = value === debtThreshold;
      select.appendChild(option);
    }
    select.setAttribute("onclick", "event.stopPropagation()");
    select.setAttribute("onmousedown", "event.stopPropagation()");
    select.setAttribute("onchange", "setParam('appendixDebtThreshold',this.value);generateTable()");
    th.append(document.createElement("br"), "Поріг: ", select, " міс.");
    th.dataset.excelText = "Місяців боргу на початок · поріг " + debtThreshold + " міс.";
  }
  periodColumns.forEach(column => {
    const th = document.createElement("th");
    th.dataset.columnKey = column.key;
    th.textContent = column.title;
    if (column.group) {
      const expanded = column.group === "charges" ? chargesExpanded : paymentsExpanded;
      th.className = column.detail ? "list-detail-column" : "list-total-column";
      th.setAttribute("onclick", `toggleListTableDetails('${column.group}')`);
      th.setAttribute("onkeydown", "if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}");
      th.tabIndex = 0;
      th.setAttribute("role", "button");
      th.setAttribute("aria-expanded", String(expanded));
      th.title = expanded ? "Згорнути подробиці" : "Показати подробиці";
    } else th.setAttribute("onclick", "sortTable(this)");
    if (column.kind === "recent") {
      th.id = "recent-payments-header";
      th.setAttribute("onwheel", "return handleRecentPaymentsWheel(event)");
      th.innerHTML = `<span class="recent-payments-screen">Оплати за ост. <input id="recent-payments-inline" type="number" min="1" step="1" value="${recentPaymentsMonths}" style="width:3.5em" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" onwheel="return handleRecentPaymentsWheel(event)" onchange="return handleRecentPaymentsChange(event)" onblur="return handleRecentPaymentsChange(event)" onkeydown="return handleRecentPaymentsKeydown(event)"> міс.</span><span class="recent-payments-print" style="display:none">Оплати за ост. ${recentPaymentsMonths} міс.</span>`;
    }
    heading.appendChild(th);
  });
  for (const [key, title] of [["endDebt", "Борг кінцевий"], ["debtMonths", "Міся-ців боргу"]]) {
    const th = document.createElement("th");
    th.dataset.columnKey = key;
    th.textContent = title;
    th.setAttribute("onclick", "sortTable(this)");
    heading.appendChild(th);
  }
  const columnTotals = periodColumns.map(() => 0);

  // ===== Добавляем строку фильтров =====
  const headerCells = thead.querySelectorAll("th");
  const filterRow = document.createElement("tr");
  filterRow.classList.add("filter-row");

  headerCells.forEach((th, colIndex) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Фільтр…";
    input.style.width = "95%";
    input.style.boxSizing = "border-box";
    input.value = previousFilters.get(th.dataset.columnKey || String(colIndex)) || "";
    input.addEventListener("input", applyColumnFilter);
    td.appendChild(input);
    filterRow.appendChild(td);
  });
  thead.appendChild(filterRow);

  // Данные
  let totalStartDebt = 0,
      totalEndDebt = 0,
      totalStartDebtMonths = 0,
      totalDebtMonths = 0,
      rowCount = 0;

  // Match analiz.js: payment-only accounts also belong to the appendix.
  for (const accountId of (appendix ? Object.keys(ls) : Object.keys(nach))) {
    const monthData = [];
    let totalChargesSumFull = 0;
    let totalPaymentsSumFull = 0;

    for (const item of periodMonths) {
      const chargesByService = nach[accountId]?.[item.year]?.[item.month] || {};
      const chargesSum = Object.values(chargesByService).reduce((sum, value) => sum + (Number(value) || 0), 0);
      const paymentsArr = oplat[accountId]?.[item.year]?.[item.month] || [];
      const paymentsSum = paymentsArr.reduce((sum, payment) => sum + (Number(payment.sum) || 0), 0);
      monthData.push({ key: item.key, date: new Date(item.year, item.month - 1, 1, 12), chargesByService, chargesSum, paymentsArr, paymentsSum });
      totalChargesSumFull += chargesSum;
      totalPaymentsSumFull += paymentsSum;
    }

    const debitStart = calculateInitialDebit(accountId, start);
    // "На початок періоду" должно начинать отсчет с предыдущего месяца,
    // иначе первый шаг ошибочно съедает начисление самого стартового месяца.
    const startDebtAnchor = new Date(start.getFullYear(), start.getMonth(), 0, 12);
    const startDebtMonths = calculateDebtMonthsFromCache(accountId, debitStart, startDebtAnchor);
    const debitEnd = debitStart + totalChargesSumFull - totalPaymentsSumFull;
    const debtMonths = calculateDebtMonthsFromCache(accountId, debitEnd, end);


    const row = document.createElement("tr");
    row.setAttribute("data-kv", ls[accountId].kv);

function addRowHandler(row) {
  const handleAction = () => {
    const kv = row.dataset.kv; // используем row напрямую
    const homeCode = getParam("homeCode");
    if (!homeCode) return console.warn("homeCode не найден");

    const actionLink = Array.from(
      document.querySelectorAll(`.menu-item[data-code="${homeCode}"] ul span`)
    ).find(span => span.textContent.trim() === "Особові рахунки");

    if (!actionLink) {
      console.warn('Не найден пункт меню "Особові рахунки" для', homeCode);
      return;
    }

    setParam("kv", kv);
    handleMenuClick(homeCode, "accounts", actionLink);
  };

  if (!isTouch) {
    // обычный клик для мыши
    row.addEventListener("click", handleAction);
  } else {
    // longPress для touch
    let pressTimer;

    const start = () => {
      pressTimer = setTimeout(() => {
        handleAction();
      }, 1000); // длительное удержание (мс)
    };

    const cancel = () => clearTimeout(pressTimer);

    row.addEventListener("touchstart", start, { passive: true });
    row.addEventListener("touchend", cancel, { passive: true });
    row.addEventListener("touchmove", cancel, { passive: true });
    row.addEventListener("touchcancel", cancel, { passive: true });
  }
}

addRowHandler(row);    
    
    if (appendix) row.dataset.debtGroup = debitStart > 0.005 && startDebtMonths > debtThreshold ? "1" : "0";
    row.appendChild(generateLsCell(accountId));
    row.innerHTML += `<td>${ls[accountId].fio}</td>`;
    if (!appendix) {
      row.innerHTML += `<td>${ls[accountId].pl||0}</td>`;
      row.innerHTML += `<td>${ls[accountId].pers||0}</td>`;
    }
    row.innerHTML += `<td>${debitStart.toFixedWithComma()}</td>`;
    row.innerHTML += `<td>${startDebtMonths}</td>`;
    totalStartDebt += debitStart;
    totalStartDebtMonths += startDebtMonths;

    const recentPaymentsSum = byServices ? sumPaymentsInRange(accountId, recentPaymentsStart, end) : 0;
    const chargesFor = month => appendix ? Object.entries(month.chargesByService).reduce((sum, [id, value]) => sum + ([12,17].includes(Number(id)) ? 0 : Number(value) || 0), 0) : serviceFilterId !== null ? (Number(month.chargesByService[serviceFilterId]) || 0) : month.chargesSum;
    const periodCharged = monthData.reduce((sum, month) => sum + chargesFor(month), 0);
    const allPayments = monthData.flatMap(month => month.paymentsArr);
    periodColumns.forEach((column, index) => {
      const month = column.monthKey ? monthData.find(item => item.key === column.monthKey) : null;
      let value = 0;
      let payments = null;
      if (column.kind === "service") value = monthData.reduce((sum, month) => sum + (Number(month.chargesByService[column.serviceId]) || 0), 0);
      if (column.kind === "monthCharge") value = chargesFor(month);
      if (column.kind === "monthPayment") { value = month.paymentsSum; payments = month.paymentsArr; }
      if (column.kind === "chargesTotal") value = periodCharged;
      if (column.kind === "paymentsTotal") { value = totalPaymentsSumFull; payments = allPayments; }
      if (column.kind === "recent") value = recentPaymentsSum;
      const cell = payments ? generatePaymentCell(payments) : document.createElement("td");
      if (!payments) cell.textContent = Math.abs(value) > 0.005 ? value.toFixedWithComma() : "–";
      cell.dataset.listNumber = String(value);
      cell.setAttribute("v", value);
      if (column.detail) cell.classList.add("list-detail-column");
      else if (column.group || column.kind === "paymentsTotal") cell.classList.add("list-total-column");
      row.appendChild(cell);
      columnTotals[index] += value;
    });
    totalEndDebt += debitEnd;
    totalDebtMonths += debtMonths;
    rowCount++;
    row.innerHTML += `<td>${debitEnd.toFixedWithComma()}</td><td>${debtMonths}</td>`;

    tbody.appendChild(row);
  }

  // Итоговая строка
  const footerRow = document.createElement("tr");
const totalPl = Object.values(ls)
  .reduce((sum, item) => sum + (item.pl || 0), 0);
const totalPers = Object.values(ls)
  .reduce((sum, item) => sum + (item.pers || 0), 0);

  footerRow.classList.add("itog");
  footerRow.innerHTML = `<td>${rowCount}</td><td>Разом</td><td>${totalPl.toFixedWithComma()}</td><td>${totalPers}</td><td>${totalStartDebt.toFixedWithComma()}</td><td>${rowCount ? (totalStartDebtMonths / rowCount).toFixed(1) : "–"}</td>`;

  if (appendix) { footerRow.cells[3].remove(); footerRow.cells[2].remove(); }
  periodColumns.forEach((column, index) => {
    const cell = document.createElement("td");
    const value = columnTotals[index];
    cell.dataset.listNumber = String(value);
    cell.textContent = Math.abs(value) > 0.005 ? value.toFixedWithComma() : "–";
    if (column.detail) cell.classList.add("list-detail-column");
    else if (column.group || column.kind === "paymentsTotal") cell.classList.add("list-total-column");
    footerRow.appendChild(cell);
  });
  footerRow.innerHTML += `<td>${totalEndDebt.toFixedWithComma()}</td><td>${rowCount ? (totalDebtMonths / rowCount).toFixed(1) : "–"}</td>`;

  tbody.appendChild(footerRow);

  // Клонируем заголовок
const headerOnly = thead.querySelector("tr:not(.filter-row)");
if (headerOnly) {
  const clone = headerOnly.cloneNode(true);
  clone.classList.add("header-row-clone");
  tbody.appendChild(clone);
}


  tableContainer.appendChild(table);
  arrangeAppendixGroups(table);
  if ([...previousFilters.values()].some(Boolean)) applyColumnFilter();

  initPosters();
  doRed();

  // Сохраняем параметры
  setParam("start", document.getElementById("start-date").value);
  setParam("end", document.getElementById("end-date").value);
  setParam("preset", document.getElementById("preset-select").value);
}


// ======= ФУНКЦИЯ ФИЛЬТРАЦИИ =======
function applyColumnFilter() {
  const table = document.querySelector("#table-container table.main");
  if (!table) return;

  // Используем > для выбора только прямых потомков tbody (основных строк)
const rows = Array.from(table.tBodies[0].children).filter(row => 
  !row.classList.contains("itog") && 
  !row.classList.contains("header-row-clone") &&
  !row.classList.contains("filter-row") &&
  !row.classList.contains("footer-header-clone") &&
  !row.classList.contains("list-group-row")
);
  const filterInputs = Array.from(
    table.querySelectorAll("thead .filter-row input")
  );

  const filters = filterInputs.map(inp => inp.value.trim());

  console.clear();
  console.log("=== APPLY COLUMN FILTER ===");
  console.log("Filters:", filters);

  rows.forEach((row, rowIndex) => {
    const cells = Array.from(row.children).filter(el => el.tagName === "TD");
    let visible = true;

    filters.forEach((filter, colIndex) => {
      if (!filter || !visible) return;

      const cell = cells[colIndex];

      console.log(
        `[row ${rowIndex}] col ${colIndex}`,
        {
          filter,
          cellExists: !!cell,
          cellText: cell?.textContent?.trim(),
          cellsCount: cells.length
        }
      );

      if (!cell) {
        visible = false;
        return;
      }

      const text = cell.textContent.trim();

      if (colIndex === 0) {
        const value = parseInt(text.replace(/\s+/g, ""), 10);
        if (!matchNumberFilter(value, filter, true)) visible = false;

      } else if (colIndex === 1) {
        if (!tableMatchesWildcardSearch(text, filter)) visible = false;

      } else {
const normalized = cell.dataset.listNumber ?? text.replace(/[\s\u00A0]+/g, "").replace(",", ".");

// если пусто — считаем это нулём
const num = normalized === "" ? 0 : parseFloat(normalized);

        console.log(
          `   parsed num =`,
          num,
          ` from `,
          `"${normalized}"`
        );

        if (isNaN(num)) {
          visible = false;
          return;
        }

        if (!matchNumberFilter(num, filter)) visible = false;
      }
    });

    row.dataset.hiddenByFilter = visible ? "0" : "1";
    row.style.display = visible ? "" : "none";

  });

  updateTotals(table);
  arrangeAppendixGroups(table);
}

function updateTotals(table) {
  const footer = table.querySelector("tbody tr.itog:not(.header-row-clone)");
  if (!footer) return;

const visibleRows = [...table.tBodies[0].rows]
  .filter(tr =>
    tr.style.display !== "none" &&
    !tr.classList.contains("itog") &&
    !tr.classList.contains("header-row-clone") &&
    !tr.classList.contains("footer-header-clone") &&
    !tr.classList.contains("list-group-row")
  );

  const colCount = footer.cells.length;
  const totals = Array(colCount).fill(0);

  footer.cells[0].textContent = String(visibleRows.length);
  footer.cells[1].textContent = "Разом";

  if (!visibleRows.length) {
    for (let colIndex = 2; colIndex < colCount; colIndex++) {
      footer.cells[colIndex].textContent = "–";
      if (footer.cells[colIndex].dataset.listNumber !== undefined) footer.cells[colIndex].dataset.listNumber = "0";
    }
    return;
  }

  visibleRows.forEach(row => {
    for (let colIndex = 2; colIndex < colCount; colIndex++) { // начиная с 3-го столбца (индекс 2)
      const text = row.cells[colIndex]?.dataset.listNumber ?? row.cells[colIndex]?.textContent.replace(",", ".").replace(/[\s\u00A0]+/g, "");
      const val = parseFloat(text);
      if (!isNaN(val)) totals[colIndex] += val;
    }
  });

  const avgColumns = new Set([...table.tHead.rows[0].cells].map((cell, index) => cell.dataset.columnKey === "base-5" || cell.dataset.columnKey === "debtMonths" ? index : -1).filter(index => index >= 0));

  for (let colIndex = 2; colIndex < colCount; colIndex++) {
    if (!isNaN(totals[colIndex])) {
      if (footer.cells[colIndex].dataset.listNumber !== undefined) footer.cells[colIndex].dataset.listNumber = String(totals[colIndex]);
      if (avgColumns.has(colIndex)) {
        footer.cells[colIndex].textContent = (totals[colIndex] / visibleRows.length).toFixed(1);
      } else {
        footer.cells[colIndex].textContent = totals[colIndex].toFixedWithComma();
      }
    }
  }
}


// ======= ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Сравнение числовых фильтров =======
function matchNumberFilter(value, filter, allowMulti = false) {
  if (isNaN(value)) return false;
  if (!filter) return true;

  filter = filter.replace(/\s+/g, "");

  const parts = allowMulti
    ? filter.replace(",", ";").split(";") // для первого столбца: множественные фильтры
    : [filter.replace(",", ".")];         // для остальных: запятая = десятичный разделитель

  return parts.some(part => {
    if (!part) return false;
    const subparts = allowMulti ? part.split(",") : [part];

    return subparts.some(p => {
      if (!p) return false;
      let m;

      // >= и <=
      if ((m = p.match(/^>=(\-?\d+(?:\.\d+)?)$/))) return value >= parseFloat(m[1]);
      if ((m = p.match(/^<=(\-?\d+(?:\.\d+)?)$/))) return value <= parseFloat(m[1]);

      // строго > и <
      if ((m = p.match(/^>(\-?\d+(?:\.\d+)?)$/))) return value > parseFloat(m[1]);
      if ((m = p.match(/^<(\-?\d+(?:\.\d+)?)$/))) return value < parseFloat(m[1]);

      // не равно: <>, !=, ≠
      if ((m = p.match(/^((?:<>|!=|≠))(\-?\d+(?:\.\d+)?)$/))) {
        return value !== parseFloat(m[2]);
      }

      // диапазон X-Y (включительно)
      if ((m = p.match(/^(-?\d+(?:\.\d+)?)[-–](-?\d+(?:\.\d+)?)$/))) {
        const a = parseFloat(m[1]);
        const b = parseFloat(m[2]);
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        return value >= min && value <= max;
      }

      // одиночное число
      const num = parseFloat(p);
      return !isNaN(num) && value === num;
    });
  });
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
  displayOptions +='<option value="analiz">Анализ</option><option value="analiz-appendix">Анализ (Додаток)</option>';
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
        <!-- <label>
          Фильтр:
          <select id="record-filter">
            <option value="all">Показать всё</option>
            <option value="paid-or-low-debt">Оплативших или без долгов</option>
            <option value="paid">Оплативших</option>
            <option value="overpaid">С переплатой</option>
            <option value="debtors">Должники</option>
          </select>
        </label>-->
        ${buttons}
      </div>
    </div>

    <div id="table-container"></div>
    <div id="datetime"></div>
  `;

  document.getElementById("maincontainer").innerHTML = mainHTML;

  setDefaultDates();
  

  // Привязываем события
  const presetSelect = document.getElementById("preset-select");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
//  const recordFilter = document.getElementById("record-filter");
  const displayMode = document.getElementById("display-mode");
  if (getParam("displayMode")) displayMode.value = getParam("displayMode");
  handlePeriodChange();
  presetSelect.addEventListener("change", handlePeriodChange);
  startDateInput.addEventListener("change", () => handlePeriodChange("start"));
  endDateInput.addEventListener("change", () => handlePeriodChange("end"));
  //recordFilter.addEventListener("change", generateTable);
  displayMode.addEventListener("change", generateTable);


  
}

function doRed() {
  const table = document.querySelector(".main");
  if (!table) return;

  const openingDebtColumn = [...table.tHead.rows[0].cells].findIndex(cell => cell.dataset.columnKey === "base-4");
  const openingIndex = openingDebtColumn >= 0 ? openingDebtColumn : 4;
  for (const row of table.rows) {
    const cells = row.cells;
    if (!cells.length) continue;

    let visualIndex = 0;
    const totalVisualCols = getTotalVisualColumns(row);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);

      // 1️⃣ Третий визуальный столбец (индекс 2) — начальный долг
      if (visualIndex <= openingIndex && visualIndex + colspan > openingIndex) {
        const value = parseFloat(cell.textContent);
        if (value > 0) cell.classList.add("red");
      }

      // 2️⃣ Столбцы между 4 и предпоследним визуальным — отрицательные суммы
      for (let v = 2; v < totalVisualCols - 2; v++) {
        if (visualIndex!==openingIndex && visualIndex <= v && visualIndex + colspan > v) {
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
  //функция не используется
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
        Ос.рах: ${curLS.ls}<br> <!-- Лицевой счет -->
        Власник: ${curLS.fio}<br> <!-- ФИО -->
        ${curLS.pl ? `Площа: ${curLS.pl} м²<br>` : ""} <!-- Площадь -->
        ${curLS.pers ? `Мешканців: ${curLS.pers}<br>` : ""} <!-- Количество жильцов -->
        ${curLS.komn ? `Кімнат: ${curLS.komn}<br>` : ""} <!-- Количество комнат -->
        ${curLS.et ? `Поверх: ${curLS.et}<br>` : ""} <!-- Этаж -->
        ${curLS.pod ? `Під'їзд: ${curLS.pod}<br>` : ""} <!-- Подъезд -->
        ${curLS.lgota ? `Пільга: ${curLS.lgota}<br>` : ""} <!-- Льготник -->
        ${curLS.tel ? `Телефон: ${curLS.tel}<br>` : ""} <!-- Телефон -->
        ${curLS.note ? `Примітка: ${curLS.note}<br>` : ""} <!-- Примечание -->
        ${curLS.email ? `e-mail: ${curLS.email}<br>` : ""} <!-- Email -->
      </div>
    </div>
  `;

  return lsCell;
}








// Форматирование чисел задаётся в ut.js; здесь оставлен только резервный вариант для автономного подключения.
if (typeof Number.prototype.toFixedWithComma !== "function") {
  Number.prototype.toFixedWithComma = function(decimals = 2) {
    return this.toLocaleString("uk-UA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
}


function parseNumber(str) {
  if (!str) return 0;
  // убираем пробелы, заменяем запятую на точку
  return parseFloat(str.replace(/\s/g,'').replace(',', '.')) || 0;
}


