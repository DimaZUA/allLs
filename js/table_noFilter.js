﻿function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function getMinMaxDate() {
  var minDate = null;
  var currentDate = new Date();
  [nach, oplat].forEach(function (data) {
    for (var accountId in data) {
      var years = Object.keys(data[accountId]);
      if (years.length === 0) continue;
      var firstYear = years[0];
      var months = Object.keys(data[accountId][firstYear]);
      if (months.length === 0) continue;
      var firstMonth = months[0] - 1;
      var date = new Date(firstYear, firstMonth);
      if (!minDate || date < minDate) {
        minDate = date;
      }
    }
  });
  return {
    minDate: minDate,
    maxDate: currentDate
  };
}
function setDefaultDates() {
  var _getMinMaxDate = getMinMaxDate(),
    minDate = _getMinMaxDate.minDate,
    maxDate = _getMinMaxDate.maxDate;
  document.getElementById('start-date').min = formatDate(minDate);
  document.getElementById('start-date').max = formatDate(maxDate);
  document.getElementById('end-date').min = formatDate(minDate);
  document.getElementById('end-date').max = formatDate(maxDate);
  var currentDate = new Date();
  var presets = document.getElementById('preset-select');
  var monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var currentMonthIndex = currentDate.getMonth();
  var currentMonthName = "".concat(monthNames[currentMonthIndex], " ").concat(currentDate.getFullYear());
  var previousMonthDate = new Date(currentDate.getFullYear(), currentMonthIndex - 1, 1);
  var previousMonthName = "".concat(monthNames[previousMonthDate.getMonth()], " ").concat(previousMonthDate.getFullYear());
  var twoMonthsAgoDate = new Date(currentDate.getFullYear(), currentMonthIndex - 2, 1);
  var twoMonthsAgoName = "".concat(monthNames[twoMonthsAgoDate.getMonth()], " ").concat(twoMonthsAgoDate.getFullYear());
  presets.innerHTML = "\n        <option value=\"current-month\">".concat(currentMonthName, "</option>\n        <option value=\"previous-month\">").concat(previousMonthName, "</option>\n        <option value=\"two-months-ago\">").concat(twoMonthsAgoName, "</option>\n        <option value=\"current-quarter\">\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B</option>\n        <option value=\"previous-quarter\">\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B</option>\n        <option value=\"current-year\">\u042D\u0442\u043E\u0442 \u0433\u043E\u0434</option>\n        <option value=\"previous-year\">\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434</option>\n        <option value=\"custom\">\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434</option>\n    ");
  if (getParam('preset')) presets.value = getParam('preset');
  if (getParam('end')) document.getElementById('end-date').value = getParam('end');
  if (getParam('start')) document.getElementById('start-date').value = getParam('start');
  applyPreset();
}
function applyPreset() {
  var preset = document.getElementById('preset-select').value;
  var currentDate = new Date();
  var startDate = document.getElementById('start-date');
  var endDate = document.getElementById('end-date');
  if (preset === 'current-month') {
    startDate.value = endDate.value = formatDate(currentDate);
  } else if (preset === 'previous-month') {
    var previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    startDate.value = endDate.value = formatDate(previousMonth);
  } else if (preset === 'two-months-ago') {
    var twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
    startDate.value = endDate.value = formatDate(twoMonthsAgo);
  } else if (preset === 'current-quarter') {
    var startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    startDate.value = formatDate(new Date(currentDate.getFullYear(), startMonth, 1));
    endDate.value = formatDate(currentDate);
  } else if (preset === 'previous-quarter') {
    var _startMonth = Math.floor((currentDate.getMonth() - 3) / 3) * 3;
    startDate.value = formatDate(new Date(currentDate.getFullYear(), _startMonth, 1));
    endDate.value = formatDate(new Date(currentDate.getFullYear(), _startMonth + 2, 1));
  } else if (preset === 'current-year') {
    startDate.value = "".concat(currentDate.getFullYear(), "-01");
    endDate.value = formatDate(currentDate);
  } else if (preset === 'previous-year') {
    startDate.value = "".concat(currentDate.getFullYear() - 1, "-01");
    endDate.value = "".concat(currentDate.getFullYear() - 1, "-12");
  }
}
function calculateInitialDebit(accountId, start) {
  var debit = 0;

  // Учитываем все оплаты, сделанные до start
  if (oplat[accountId]) {
    for (var year in oplat[accountId]) {
      for (var month in oplat[accountId][year]) {
        var date = new Date(year, month - 1);
        date.setHours(0, 0, 0, 0);
        if (date < start) {
          oplat[accountId][year][month].forEach(function (payment) {
            debit -= payment.sum;
          });
        }
      }
    }
  }

  // Считаем только начисления до start
  for (var _year in nach[accountId]) {
    for (var _month in nach[accountId][_year]) {
      var _date = new Date(_year, _month - 1);
      _date.setHours(0, 0, 0, 0);
      if (_date < start) {
        for (var serviceId in nach[accountId][_year][_month]) {
          debit += nach[accountId][_year][_month][serviceId];
        }
      }
    }
  }
  return debit;
}
function generateTable() {
  var start = new Date(document.getElementById('start-date').value);
  var end = new Date(document.getElementById('end-date').value);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Последний день предыдущего месяца
  // Устанавливаем время на 23:59:59.999
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  var displayMode = document.getElementById('display-mode').value;
  var tableContainer = document.getElementById('table-container');
  tableContainer.innerHTML = '';
  var table = document.createElement('table');
  table.classList.add('main');
  var thead = document.createElement('thead');
  var tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  var servicesWithCharges = new Set();

  // Собираем список услуг с начислениями в заданный период
  for (var accountId in nach) {
    for (var year in nach[accountId]) {
      for (var month in nach[accountId][year]) {
        var date = new Date(year, month - 1, 1, 12);
        if (date >= start && date <= end) {
          for (var serviceId in nach[accountId][year][month]) {
            servicesWithCharges.add(serviceId);
          }
        }
      }
    }
  }

  // Создание заголовка
  var headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">Дебет на начало</th>';
  if (displayMode === 'summarized') {
    Array.from(servicesWithCharges).forEach(function (serviceId) {
      headerRow += "<th onclick=\"sortTable(this)\">".concat(us[serviceId], "</th>");
    });
    headerRow += '<th onclick="sortTable(this)">Оплаты</th><th onclick="sortTable(this)">Долг на конец</th></tr>';
  } else {
    var currentDate = new Date(start);
    while (currentDate <= end) {
      var _month2 = currentDate.getMonth() + 1;
      var _year2 = currentDate.getFullYear();
      headerRow += "<th onclick=\"sortTable(this)\">\u041D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043E ".concat(_month2, "/").concat(_year2, "</th><th onclick=\"sortTable(this)\">\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ").concat(_month2, "/").concat(_year2, "</th>");
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    headerRow += '<th onclick="sortTable(this)">Долг на конец</th></tr>';
  }
  thead.innerHTML = headerRow;
  var totalStartDebt = 0;
  var totalEndDebt = 0;
  var totalCharges = {};
  var totalPayments = {};
  var _loop = function _loop() {
    var debitStart = calculateInitialDebit(_accountId, start);
    totalStartDebt += debitStart;
    var row = document.createElement('tr');
    row.appendChild(generateLsCell(_accountId));
    row.innerHTML += "<td>".concat(debitStart.toFixedWithComma(), "</td>");
    if (displayMode === 'summarized') {
      var chargesByService = {};
      var paymentsSum = 0;
      var payments = [];
      for (var _year4 in nach[_accountId]) {
        var _loop2 = function _loop2(_month4) {
          var date = new Date(_year4, _month4 - 1, 1, 12);
          if (date >= start && date <= end) {
            for (var _serviceId in nach[_accountId][_year4][_month4]) {
              chargesByService[_serviceId] = (chargesByService[_serviceId] || 0) + nach[_accountId][_year4][_month4][_serviceId];
              totalCharges[_serviceId] = (totalCharges[_serviceId] || 0) + nach[_accountId][_year4][_month4][_serviceId];
            }
            if (oplat[_accountId] && oplat[_accountId][_year4] && oplat[_accountId][_year4][_month4]) {
              payments.push.apply(payments, _toConsumableArray(oplat[_accountId][_year4][_month4]));
              oplat[_accountId][_year4][_month4].forEach(function (payment) {
                paymentsSum += payment.sum;
                totalPayments[_month4] = (totalPayments[_month4] || 0) + payment.sum;
              });
            }
          }
        };
        for (var _month4 in nach[_accountId][_year4]) {
          _loop2(_month4);
        }
      }
      Array.from(servicesWithCharges).forEach(function (serviceId) {
        var charge = chargesByService[serviceId] || 0;
        row.innerHTML += "<td>".concat(charge.toFixedWithComma(), "</td>");
      });
      row.appendChild(generatePaymentCell(payments));
      var debitEnd = debitStart + Object.values(chargesByService).reduce(function (sum, charge) {
        return sum + charge;
      }, 0) - paymentsSum;
      totalEndDebt += debitEnd;
      row.innerHTML += "<td>".concat(debitEnd.toFixedWithComma(), "</td>");
    } else {
      var _debitEnd = debitStart;
      var _currentDate2 = new Date(start);
      while (_currentDate2 <= end) {
        var _month5 = _currentDate2.getMonth() + 1;
        var _year5 = _currentDate2.getFullYear();

        // Суммируем начисления
        var charges = 0;
        if (nach[_accountId][_year5] && nach[_accountId][_year5][_month5]) {
          charges = Object.values(nach[_accountId][_year5][_month5]).reduce(function (sum, val) {
            return sum + val;
          }, 0);
          totalCharges["".concat(_year5, "-").concat(_month5)] = (totalCharges["".concat(_year5, "-").concat(_month5)] || 0) + charges;
        }

        // Суммируем оплаты
        var _payments = [];
        if (oplat[_accountId] && oplat[_accountId][_year5] && oplat[_accountId][_year5][_month5]) {
          _payments = oplat[_accountId][_year5][_month5];
          totalPayments["".concat(_year5, "-").concat(_month5)] = (totalPayments["".concat(_year5, "-").concat(_month5)] || 0) + _payments.reduce(function (sum, payment) {
            return sum + payment.sum;
          }, 0);
        }

        // Отображаем начисления и оплаты в ячейках
        row.innerHTML += "<td>".concat(charges.toFixedWithComma(), "</td>");
        row.appendChild(generatePaymentCell(_payments));

        // Обновляем долг на конец месяца
        _debitEnd += charges - _payments.reduce(function (sum, payment) {
          return sum + payment.sum;
        }, 0);
        _currentDate2.setMonth(_currentDate2.getMonth() + 1);
      }
      totalEndDebt += _debitEnd;
      row.innerHTML += "<td>".concat(_debitEnd.toFixedWithComma(), "</td>");
    }
    tbody.appendChild(row);
  };
  for (var _accountId in nach) {
    _loop();
  }
  var footerRow = document.createElement('tr');
  footerRow.classList.add('itog');
  footerRow.innerHTML = "<td>\u0418\u0442\u043E\u0433\u043E</td><td>".concat(totalStartDebt.toFixedWithComma(), "</td>");
  if (displayMode === 'summarized') {
    Array.from(servicesWithCharges).forEach(function (serviceId) {
      var serviceTotal = totalCharges[serviceId] || 0;
      footerRow.innerHTML += "<td>".concat(serviceTotal.toFixedWithComma(), "</td>");
    });
    footerRow.innerHTML += "<td>".concat(Object.values(totalPayments).reduce(function (sum, val) {
      return sum + val;
    }, 0).toFixedWithComma(), "</td><td>").concat(totalEndDebt.toFixedWithComma(), "</td>");
  } else {
    var _currentDate = new Date(start);
    while (_currentDate <= end) {
      var _month3 = _currentDate.getMonth() + 1;
      var _year3 = _currentDate.getFullYear();
      var chargeTotal = totalCharges["".concat(_year3, "-").concat(_month3)] || 0;
      var paymentTotal = totalPayments["".concat(_year3, "-").concat(_month3)] || 0;
      footerRow.innerHTML += "<td>".concat(chargeTotal.toFixedWithComma(), "</td><td>").concat(paymentTotal.toFixedWithComma(), "</td>");
      _currentDate.setMonth(_currentDate.getMonth() + 1);
    }
    footerRow.innerHTML += "<td>".concat(totalEndDebt.toFixedWithComma(), "</td>");
  }
  thead.appendChild(footerRow);
  var headerRows = thead.querySelectorAll('tr'); // Получаем все строки <tr>
  var headerRowsClone = Array.from(headerRows).map(function (row) {
    return row.cloneNode(true);
  });
  headerRowsClone.forEach(function (row) {
    row.classList.add('header-row-clone');
    tbody.appendChild(row);
  });
  tableContainer.appendChild(table);
  initPosters();
  doRed();
  setParam('start', document.getElementById('start-date').value);
  setParam('end', document.getElementById('end-date').value);
  setParam('displayMode', displayMode);
  setParam('preset', document.getElementById('preset-select').value);
  /*    // Проверяем, что режим детализированный и месяцев больше 2
      if (displayMode !== 'detailed' || (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) <= 2) {
      	createDebetChart();
      }else{
      	createSummaryChart(totalCharges, totalPayments, nach, oplat, start, end, displayMode);
  
      }
  */
}
var chartInstance = null;
function createDebetChart() {
  var displayMode = document.getElementById('display-mode').value; // Получаем режим отображения со страницы
  var rows = document.querySelectorAll('#table-container > .main > tbody > tr'); // Находим все строки таблицы

  var rowDataList = []; // Массив для хранения данных по каждой строке

  rows.forEach(function (row) {
    var columns = row.querySelectorAll('td:not(.subtable td)');
    if (columns.length > 0) {
      var totalPaymentsForMonth = parseFloat(columns[columns.length - 2].textContent.trim().replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
      .replace(",", ".") // Заменяем запятую на точку
      );
      var totalChargesForMonth;
      if (displayMode === 'summarized') {
        // В режиме "summarized" находим сумму по всем услугам за последний месяц
        totalChargesForMonth = 0;
        for (var i = 2; i < columns.length - 2; i++) {
          if (!columns[i].querySelector('table')) {
            totalChargesForMonth += parseFloat(columns[i].textContent.trim().replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
            .replace(",", ".") // Заменяем запятую на точку
            );
          }
        }
      } else {
        // В режиме "detailed" просто берём значение из соответствующего столбца
        totalChargesForMonth = parseFloat(columns[columns.length - 3].textContent.trim().replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
        .replace(",", ".") // Заменяем запятую на точку
        );
      }
      var _rowData = {
        apartmentNumber: columns[0].textContent.trim(),
        // Номер квартиры
        totalCharges: totalChargesForMonth,
        // Суммарное начисление за последний месяц
        totalPayments: totalPaymentsForMonth,
        // Оплата за последний месяц
        totalDebt: columns[columns.length - 1].textContent.trim() // Итоговый долг по квартире (самый правый столбец)
      };
      rowDataList.push(_rowData); // Добавляем данные строки в общий список
    }
  });
  console.log(rowDataList); // Пример вывода всех данных}

  console.log(rowData); // Выводим данные для проверки
}
function createSummaryChart(totalCharges, totalPayments, nach, oplat, start, end, displayMode) {
  // Если график уже существует, уничтожаем его
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Массивы для хранения данных по месяцам
  var months = [];
  var chargesData = [];
  var paymentsData = [];
  var paymentPercentages = [];
  var currentDate = new Date(start);
  while (currentDate <= end) {
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    var monthKey = "".concat(year, "-").concat(month);
    var chargeTotal = totalCharges[monthKey] || 0;
    var paymentTotal = totalPayments[monthKey] || 0;
    months.push("".concat(month, "/").concat(year));
    chargesData.push(chargeTotal);
    paymentsData.push(paymentTotal);

    // Рассчитываем процент оплаты для текущего месяца
    var paymentPercentage = chargeTotal ? paymentTotal / chargeTotal * 100 : 0;
    paymentPercentages.push(paymentPercentage);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Создание графика
  var ctx = document.getElementById('summaryChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line',
    // Тип графика: линия
    data: {
      labels: months,
      datasets: [{
        label: 'Начисления',
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        data: chargesData,
        fill: false,
        yAxisID: 'y1'
      }, {
        label: 'Платежи',
        data: paymentsData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        yAxisID: 'y1'
      }, {
        label: 'Процент оплаты',
        data: paymentPercentages,
        borderColor: 'rgba(54, 162, 235, 1)',
        // Цвет линии процента
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        yAxisID: 'y2',
        borderDash: [5, 5]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y1: {
          type: 'linear',
          position: 'left',
          ticks: {
            beginAtZero: true
          },
          title: {
            display: true,
            text: 'Сумма (грн.)'
          }
        },
        y2: {
          type: 'linear',
          position: 'right',
          ticks: {
            beginAtZero: true,
            max: 100,
            stepSize: 10
          },
          title: {
            display: true,
            text: 'Процент оплаты (%)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function label(context) {
              var datasetLabel = context.dataset.label || '';
              var value = context.raw;
              if (datasetLabel === 'Процент оплаты') {
                return "".concat(datasetLabel, ": ").concat(value.toFixed(2), "%");
              }
              return "".concat(datasetLabel, ": ").concat(value.toFixedWithComma());
            }
          }
        }
      }
    }
  });
}
function sortTable(header) {
  var table = header.closest('table');
  var tbody = table.querySelector('tbody');

  // Удаляем все строки с классом "header-row-clone"
  var cloneRows = tbody.querySelectorAll('.header-row-clone');
  cloneRows.forEach(function (row) {
    return row.remove();
  });
  var rows = Array.from(tbody.rows);
  var isAsc = header.classList.contains('sorted-asc');
  var index = Array.from(header.parentNode.children).indexOf(header);

  // Убираем классы сортировки с других заголовков
  header.parentNode.querySelectorAll('th').forEach(function (th) {
    return th.classList.remove('sorted-asc', 'sorted-desc');
  });
  header.classList.add(isAsc ? 'sorted-desc' : 'sorted-asc');

  // Сортируем строки
  rows.sort(function (rowA, rowB) {
    var cellA = rowA.cells[index].getAttribute('v') || rowA.cells[index].textContent;
    var cellB = rowB.cells[index].getAttribute('v') || rowB.cells[index].textContent;
    var valA = parseFloat(cellA.replace(/\s/g, '').replace(',', '.')) || 0;
    var valB = parseFloat(cellB.replace(/\s/g, '').replace(',', '.')) || 0;
    return isAsc ? valA < valB ? 1 : -1 : valA > valB ? 1 : -1;
  });

  // Добавляем отсортированные строки обратно в tbody
  rows.forEach(function (row) {
    return tbody.appendChild(row);
  });
  var thead = table.querySelector('thead');
  var headerRows = thead.querySelectorAll('tr'); // Получаем все строки <tr>
  var headerRowsClone = Array.from(headerRows).map(function (row) {
    return row.cloneNode(true);
  });
  headerRowsClone.forEach(function (row) {
    row.classList.add('header-row-clone');
    tbody.appendChild(row);
  });
}
function generateLsCell(accountId) {
  var curLS = ls[accountId];
  var lsCell = document.createElement('td');
  lsCell.classList.add('poster');

  // Формируем контент для ячейки
  lsCell.innerHTML = "\n        ".concat(curLS.kv, " <!-- \u041D\u043E\u043C\u0435\u0440 \u043A\u0432\u0430\u0440\u0442\u0438\u0440\u044B -->\n        <div class=\"descr\">\n            <div>\n                \u041B\u0421: ").concat(curLS.ls, "<br>  <!-- \u041B\u0438\u0446\u0435\u0432\u043E\u0439 \u0441\u0447\u0435\u0442 -->\n                \u0424\u0418\u041E: ").concat(curLS.fio, "<br>  <!-- \u0424\u0418\u041E -->\n                ").concat(curLS.pl ? "\u041F\u043B\u043E\u0449\u0430\u0434\u044C: ".concat(curLS.pl, " \u043C\xB2<br>") : '', "  <!-- \u041F\u043B\u043E\u0449\u0430\u0434\u044C -->\n                ").concat(curLS.pers ? "\u0416\u0438\u043B\u044C\u0446\u043E\u0432: ".concat(curLS.pers, "<br>") : '', "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u043B\u044C\u0446\u043E\u0432 -->\n                ").concat(curLS.komn ? "\u041A\u043E\u043C\u043D\u0430\u0442: ".concat(curLS.komn, "<br>") : '', "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043C\u043D\u0430\u0442 -->\n                ").concat(curLS.et ? "\u042D\u0442\u0430\u0436: ".concat(curLS.et, "<br>") : '', "  <!-- \u042D\u0442\u0430\u0436 -->\n                ").concat(curLS.pod ? "\u041F\u043E\u0434\u0435\u0437\u0434: ".concat(curLS.pod, "<br>") : '', "  <!-- \u041F\u043E\u0434\u044A\u0435\u0437\u0434 -->\n                ").concat(curLS.lgota ? "\u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A: ".concat(curLS.lgota, "<br>") : '', "  <!-- \u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A -->\n                ").concat(curLS.tel ? "\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ".concat(curLS.tel, "<br>") : '', "  <!-- \u0422\u0435\u043B\u0435\u0444\u043E\u043D -->\n                ").concat(curLS.note ? "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435: ".concat(curLS.note, "<br>") : '', "  <!-- \u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435 -->\n                ").concat(curLS.email ? "e-mail: ".concat(curLS.email, "<br>") : '', "  <!-- Email -->\n            </div>\n        </div>\n    ");
  return lsCell;
}
function generatePaymentCell(payments) {
  var totalPayment = payments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var paymentCell = document.createElement('td');
  if (payments.length === 1) {
    var payment = payments[0];
    paymentCell.classList.add('poster');
    if (payment.date) {
      paymentCell.innerHTML = "".concat(totalPayment.toFixedWithComma(), "\n                <div class=\"descr\">\n                    <div>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ").concat(payment.date, " \u0447\u0435\u0440\u0435\u0437 ").concat(b[payment.yur] || 'неизвестный банк', "<br>\n                    ").concat(payment.kvit ? "\u041A\u0432\u0456\u0442\u0430\u043D\u0446\u0456\u044F: ".concat(payment.kvit, "<br>") : '', "\n                    ").concat(payment.nazn ? "\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F: ".concat(payment.nazn) : '', "\n                    </div>\n                </div>\n            ");
    }
  } else if (payments.length > 0) {
    paymentCell.classList.add('poster');
    var hasKvit = false; // Флаг для проверки наличия payment.kvit
    var hasNazn = false; // Флаг для проверки наличия payment.nazn

    // Первый проход для определения наличия payment.kvit и payment.nazn
    payments.forEach(function (payment) {
      if (payment.kvit > "") hasKvit = true; // Проверка на наличие квитанции
      if (payment.nazn > "") hasNazn = true; // Проверка на наличие призначення
    });
    var paymentRows = '';

    // Второй проход для создания строк таблицы
    payments.forEach(function (payment) {
      paymentRows += "\n            <tr>\n                <td>".concat(payment.date, "</td>\n                <td>").concat(b[payment.yur] || 'неизвестный банк', "</td>\n                <td>").concat(payment.sum.toFixedWithComma(), "</td>\n                ").concat(hasKvit ? "<td>".concat(payment.kvit || '', "</td>") : '', "\n                ").concat(hasNazn ? "<td>".concat(payment.nazn || '', "</td>") : '', "\n            </tr>\n        ");
    });
    paymentCell.innerHTML = "".concat(totalPayment.toFixedWithComma(), "\n        <div class=\"descr\">\n            <table class=\"subtable\">\n                <tbody>\n                    <tr>\n                        <th>\u0414\u0430\u0442\u0430</th>\n                        <th>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0447\u0435\u0440\u0435\u0437</th>\n                        <th>\u0421\u0443\u043C\u043C\u0430</th>\n                        ").concat(hasKvit ? '<th>Квітанція</th>' : '', "\n                        ").concat(hasNazn ? '<th>Призначення</th>' : '', "\n                    </tr>\n                    ").concat(paymentRows, "\n                </tbody>\n            </table>\n        </div>\n    ");
  }
  return paymentCell;
}
function handlePeriodChange() {
  var presetSelect = document.getElementById('preset-select');
  var startDateInput = document.getElementById('start-date');
  var endDateInput = document.getElementById('end-date');
  var displayModeSelect = document.getElementById('display-mode');
  var showDataButton = document.querySelector('button');

  // Скрыть или показать поля "С" и "По"
  if (presetSelect.value === 'custom') {
    startDateInput.disabled = false;
    endDateInput.disabled = false;
  } else {
    startDateInput.disabled = true;
    endDateInput.disabled = true;
  }

  // Скрыть или показать "Отображение" в зависимости от того, равны ли "С" и "По"
  /*    if (startDateInput.value !== "" && endDateInput.value !== "" && startDateInput.value !== endDateInput.value) {
          displayModeSelect.disabled = false;
      } else {
          displayModeSelect.disabled = true;
      }
  */
  // Включить или выключить кнопку "Показать данные" в зависимости от значений "С" и "По"
  // Преобразуем даты в объект Date для правильного сравнения
  var startDate = new Date(startDateInput.value + "-01"); // Преобразуем в дату
  var endDate = new Date(endDateInput.value + "-01"); // Преобразуем в дату

  if (startDate <= endDate) {
    showDataButton.disabled = false;
  } else {
    showDataButton.disabled = true;
  }
}
function initTable() {
document.getElementById('maincontainer').innerHTML = 
    '<div id="org" align="right"></div>' +
    '<div id="filter-container">' +
        '<!-- Первая колонка: выбор периода и отображения -->' +
        '<div class="column">' +
            '<label>' +
                'Выберите период:' +
                '<select id="preset-select" onchange="applyPreset()">' +
                    '<!-- Эти опции обновляются в setDefaultDates() -->' +
                '</select>' +
            '</label>' +
            '<label>' +
                'Отображение:' +
                '<select id="display-mode">' +
                    '<option value="summarized">По услугам</option>' +
                    '<option value="detailed">По месяцам</option>' +
                '</select>' +
            '</label>' +
        '</div>' +
        
        '<!-- Вторая колонка: даты -->' +
        '<div class="column">' +
            '<label>' +
                'С:' +
                '<input type="month" id="start-date">' +
            '</label>' +
            '<label>' +
                'По:' +
                '<input type="month" id="end-date">' +
            '</label>' +
        '</div>' +
        
        '<!-- Третья колонка: кнопка -->' +
        '<div class="column button-column">' +
            '<button id="show" onclick="generateTable()">Показать данные</button>' +
        '</div>' +
    '</div>' +
    '<div id="table-container">' +
        '<!-- Таблица с отчётом будет добавлена здесь -->' +
    '</div>' +
    '<div id="datetime"></div>';

  document.getElementById('datetime').innerHTML = "\n    <br>\u0414\u0430\u043D\u043D\u044B\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E \u043D\u0430 <br>".concat(dt, " (").concat(timeAgo(dt), "\u043D\u0430\u0437\u0430\u0434.)");
  setDefaultDates();
  handlePeriodChange();
  document.getElementById('preset-select').addEventListener('change', handlePeriodChange);
  document.getElementById('start-date').addEventListener('input', handlePeriodChange);
  document.getElementById('end-date').addEventListener('input', handlePeriodChange);
  if (getParam('displayMode')) document.getElementById('display-mode').value = getParam('displayMode');
  generateTable();
}
function doRed() {
  var table = document.querySelector('.main');
  var _iterator = _createForOfIteratorHelper(table.rows),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var row = _step.value;
      var cells = row.cells;

      // Второй столбец
      var secondCellValue = parseFloat(cells[1].textContent);
      if (secondCellValue > 0) {
        cells[1].classList.add('red');
      }

      // Последний столбец
      var lastCellValue = parseFloat(cells[cells.length - 1].textContent);
      if (lastCellValue > 0) {
        cells[cells.length - 1].classList.add('red');
      }

      // Столбцы между вторым и последним
      for (var i = 2; i < cells.length - 1; i++) {
        var cellValue = parseFloat(cells[i].textContent);
        if (cellValue < 0) {
          cells[i].classList.add('red');
        }
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}