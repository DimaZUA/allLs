function _createForOfIteratorHelper(r, e) {
  var t =
    ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
  if (!t) {
    if (
      Array.isArray(r) ||
      (t = _unsupportedIterableToArray(r)) ||
      (e && r && "number" == typeof r.length)
    ) {
      t && (r = t);
      var _n = 0,
        F = function F() {};
      return {
        s: F,
        n: function n() {
          return _n >= r.length
            ? {
                done: !0
              }
            : {
                done: !1,
                value: r[_n++]
              };
        },
        e: function e(r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError(
      "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
    );
  }
  var o,
    a = !0,
    u = !1;
  return {
    s: function s() {
      t = t.call(r);
    },
    n: function n() {
      var r = t.next();
      return (a = r.done), r;
    },
    e: function e(r) {
      (u = !0), (o = r);
    },
    f: function f() {
      try {
        a || null == t["return"] || t["return"]();
      } finally {
        if (u) throw o;
      }
    }
  };
}
function _toConsumableArray(r) {
  return (
    _arrayWithoutHoles(r) ||
    _iterableToArray(r) ||
    _unsupportedIterableToArray(r) ||
    _nonIterableSpread()
  );
}
function _nonIterableSpread() {
  throw new TypeError(
    "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return (
      "Object" === t && r.constructor && (t = r.constructor.name),
      "Map" === t || "Set" === t
        ? Array.from(r)
        : "Arguments" === t ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
        ? _arrayLikeToArray(r, a)
        : void 0
    );
  }
}
function _iterableToArray(r) {
  if (
    ("undefined" != typeof Symbol && null != r[Symbol.iterator]) ||
    null != r["@@iterator"]
  )
    return Array.from(r);
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
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
  document.getElementById("start-date").min = formatDate(minDate, "yyyy-mm");
  document.getElementById("start-date").max = formatDate(maxDate, "yyyy-mm");
  document.getElementById("end-date").min = formatDate(minDate, "yyyy-mm");
  document.getElementById("end-date").max = formatDate(maxDate, "yyyy-mm");
  var currentDate = new Date();
  var presets = document.getElementById("preset-select");
  var currentMonthIndex = currentDate.getMonth();
  var currentMonthName = ""
    .concat(monthNames[currentMonthIndex], " ")
    .concat(currentDate.getFullYear());
  var previousMonthDate = new Date(
    currentDate.getFullYear(),
    currentMonthIndex - 1,
    1
  );
  var previousMonthName = ""
    .concat(monthNames[previousMonthDate.getMonth()], " ")
    .concat(previousMonthDate.getFullYear());
  var twoMonthsAgoDate = new Date(
    currentDate.getFullYear(),
    currentMonthIndex - 2,
    1
  );
  var twoMonthsAgoName = ""
    .concat(monthNames[twoMonthsAgoDate.getMonth()], " ")
    .concat(twoMonthsAgoDate.getFullYear());
  presets.innerHTML = '\n        <option value="current-month">'
    .concat(
      currentMonthName,
      '</option>\n        <option value="previous-month">'
    )
    .concat(
      previousMonthName,
      '</option>\n        <option value="two-months-ago">'
    )
    .concat(
      twoMonthsAgoName,
      '</option>\n        <option value="current-quarter">\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B</option>\n        <option value="previous-quarter">\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B</option>\n        <option value="current-year">\u042D\u0442\u043E\u0442 \u0433\u043E\u0434</option>\n        <option value="previous-year">\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434</option>\n        <option value="custom">\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434</option>\n    '
    );
  if (getParam("preset")) presets.value = getParam("preset");
  if (getParam("end"))
    document.getElementById("end-date").value = getParam("end");
  if (getParam("start"))
    document.getElementById("start-date").value = getParam("start");
  applyPreset();
}
function applyPreset() {
  var preset = document.getElementById("preset-select").value;
  var currentDate = new Date();
  var startDate = document.getElementById("start-date");
  var endDate = document.getElementById("end-date");
  if (preset === "current-month") {
    startDate.value = endDate.value = formatDate(currentDate, "yyyy-mm");
  } else if (preset === "previous-month") {
    var previousMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    startDate.value = endDate.value = formatDate(previousMonth, "yyyy-mm");
  } else if (preset === "two-months-ago") {
    var twoMonthsAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    );
    startDate.value = endDate.value = formatDate(twoMonthsAgo, "yyyy-mm");
  } else if (preset === "current-quarter") {
    var startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    startDate.value = formatDate(
      new Date(currentDate.getFullYear(), startMonth, 1),
      "yyyy-mm"
    );
    endDate.value = formatDate(currentDate, "yyyy-mm");
  } else if (preset === "previous-quarter") {
    var _startMonth = Math.floor((currentDate.getMonth() - 3) / 3) * 3;
    startDate.value = formatDate(
      new Date(currentDate.getFullYear(), _startMonth, 1),
      "yyyy-mm"
    );
    endDate.value = formatDate(
      new Date(currentDate.getFullYear(), _startMonth + 2, 1),
      "yyyy-mm"
    );
  } else if (preset === "current-year") {
    startDate.value = "".concat(currentDate.getFullYear(), "-01");
    endDate.value = formatDate(currentDate, "yyyy-mm");
  } else if (preset === "previous-year") {
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
  var start = new Date(document.getElementById("start-date").value);
  var end = new Date(document.getElementById("end-date").value);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Последний день предыдущего месяца
  // Устанавливаем время на 23:59:59.999
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  var displayMode = document.getElementById("display-mode").value;
  var tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";
  var table = document.createElement("table");
  table.classList.add("main");
  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  var servicesWithCharges = new Set();
  var filterValue = document.getElementById("record-filter").value;
  var serviceFilterId = null;
  if (displayMode.startsWith("service-")) {
    serviceFilterId = displayMode.split("-")[1];
  }

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
  var headerRow =
    '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">ФИО</th><th onclick="sortTable(this)">Дебет на начало</th>';
  if (displayMode === "summarized") {
    Array.from(servicesWithCharges).forEach(function (serviceId) {
      headerRow += '<th onclick="sortTable(this)">'.concat(
        us[serviceId],
        "</th>"
      );
    });
    headerRow +=
      '<th onclick="sortTable(this)">Оплаты</th><th onclick="sortTable(this)">Долг на конец</th></tr>';
 } else if (serviceFilterId !== null) {
  var currentDate = new Date(start);
  while (currentDate <= end) {
    var m = currentDate.getMonth() + 1;
    var y = currentDate.getFullYear();
    headerRow +=
      '<th onclick="sortTable(this)">Начислено ' + m + "-" + y + '</th>';
      // Оплаты можно не показывать или показать пустые колонки, здесь не показываем
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  headerRow += '<th onclick="sortTable(this)">Долг на конец</th></tr>';
  } else {
    var currentDate = new Date(start);
    while (currentDate <= end) {
      var _month2 = currentDate.getMonth() + 1;
      var _year2 = currentDate.getFullYear();
    if (displayMode === "detailed" || displayMode === "charges-only") {
      headerRow += `<th onclick="sortTable(this)">Начислено ${_month2}-${_year2}</th>`;
    }

    if (displayMode === "detailed" || displayMode === "payments-only") {
      headerRow += `<th onclick="sortTable(this)">Оплачено ${_month2}-${_year2}</th>`;
    }
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
    var row = document.createElement("tr");
    row.appendChild(generateLsCell(_accountId));
    row.innerHTML += "<td>".concat(ls[_accountId].fio, "</td>");
    row.innerHTML += "<td>".concat(debitStart.toFixedWithComma(), "</td>");
    if (displayMode === "summarized") {
      var chargesByService = {};
      var paymentsSum = 0;
      var payments = [];
      for (var _year4 in nach[_accountId]) {
        var _loop2 = function _loop2(_month4) {
          var date = new Date(_year4, _month4 - 1, 1, 12);
          if (date >= start && date <= end) {
            for (var _serviceId in nach[_accountId][_year4][_month4]) {
              chargesByService[_serviceId] =
                (chargesByService[_serviceId] || 0) +
                nach[_accountId][_year4][_month4][_serviceId];
              totalCharges[_serviceId] =
                (totalCharges[_serviceId] || 0) +
                nach[_accountId][_year4][_month4][_serviceId];
            }
            if (
              oplat[_accountId] &&
              oplat[_accountId][_year4] &&
              oplat[_accountId][_year4][_month4]
            ) {
              payments.push.apply(
                payments,
                _toConsumableArray(oplat[_accountId][_year4][_month4])
              );
              oplat[_accountId][_year4][_month4].forEach(function (payment) {
                paymentsSum += payment.sum;
                totalPayments[_month4] =
                  (totalPayments[_month4] || 0) + payment.sum;
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
      var debitEnd =
        debitStart +
        Object.values(chargesByService).reduce(function (sum, charge) {
          return sum + charge;
        }, 0) -
        paymentsSum;
      totalEndDebt += debitEnd;
      row.innerHTML += "<td>".concat(debitEnd.toFixedWithComma(), "</td>");
    } else {
      var _debitEnd = debitStart;
      var _currentDate2 = new Date(start);
while (_currentDate2 <= end) {
  var m = _currentDate2.getMonth() + 1;
  var y = _currentDate2.getFullYear();

  // Суммируем начисления по услуге или по всем услугам
  var charges = 0;
  if (nach[_accountId] && nach[_accountId][y] && nach[_accountId][y][m]) {
    if (serviceFilterId !== null) {
      charges = nach[_accountId][y][m][serviceFilterId] || 0;
    } else {
      charges = Object.values(nach[_accountId][y][m]).reduce(function (sum, val) {
        return sum + val;
      }, 0);
    }
    totalCharges[`${y}-${m}`] = (totalCharges[`${y}-${m}`] || 0) + charges;
  }

  // Оплаты (если serviceFilterId !== null, не показываем оплаты)
  var payments = [];
  var paymentsSum = 0;
  if (
    serviceFilterId === null && displayMode != "charges-only" &&
    oplat[_accountId] &&
    oplat[_accountId][y] &&
    oplat[_accountId][y][m]
  ) {
    payments = oplat[_accountId][y][m];
    var monthPaymentsSum = payments.reduce(function (sum, payment) {
      return sum + payment.sum;
    }, 0);
    paymentsSum = monthPaymentsSum;
    totalPayments[`${y}-${m}`] = (totalPayments[`${y}-${m}`] || 0) + monthPaymentsSum;
  }

  // Выводим начисления
  if (displayMode != "payments-only") 
  row.innerHTML += `<td v="${charges}">${!charges ? "–" : charges.toFixedWithComma()}</td>`;



  // Вывод оплат, если не фильтруем по услуге
  if (serviceFilterId === null && displayMode != "charges-only") {
    row.appendChild(generatePaymentCell(payments));
  }

  // Обновляем долг
  _debitEnd += charges - paymentsSum;

  _currentDate2.setMonth(_currentDate2.getMonth() + 1);
}

      totalEndDebt += _debitEnd;
      row.innerHTML += "<td>".concat(_debitEnd.toFixedWithComma(), "</td>");
    }
    tbody.appendChild(row);
  };
  for (var _accountId in nach) {
    var debitStart = calculateInitialDebit(_accountId, start);
    var payments = calculatePayments(_accountId, start, end);
    // Все начисления за период
    var totalCharge = calculateCharges(_accountId, start, end, false);

    // Только начисления за последний месяц
    var lastMonthCharges = calculateCharges(_accountId, start, end, true);
    var debitEnd = debitStart + totalCharge - payments;

    // Фильтрация записей
    if (
      filterValue === "paid-or-low-debt" &&
      !(payments > 0 || debitEnd < lastMonthCharges * 3)
    )
      continue;
    if (filterValue === "paid" && payments === 0) continue;
    if (filterValue === "overpaid" && debitEnd > 0) continue;
    if (
      filterValue === "debtors" &&
      (payments > 0 || debitEnd <= lastMonthCharges * 3)
    )
      continue;

    //console.log(
    //    (ls[_accountId] && ls[_accountId].kv || "Неизвестно") + ": ",
    //    debitStart.toFixed(2) + "  ",
    //    totalCharges.toFixed(2) + "  ",
    //    payments.toFixed(2) + "  ",
    //    debitEnd.toFixed(2) + "  ",
    //    lastMonthCharges.toFixed(2)
    //);

    _loop();
  }
  function calculatePayments(accountId, start, end) {
    var totalPayments = 0;
    if (oplat[accountId]) {
      for (var year in oplat[accountId]) {
        for (var month in oplat[accountId][year]) {
          var date = new Date(year, month - 1);
          if (date >= start && date <= end) {
            oplat[accountId][year][month].forEach(function (payment) {
              totalPayments += payment.sum;
            });
          }
        }
      }
    }
    return totalPayments;
  }
  function calculateCharges(accountId, start, end, lastMonthOnly) {
    var totalCharges = 0;
    var lastMonthCharges = 0;
    var lastMonthKey = null;
    if (nach[accountId]) {
      for (var year in nach[accountId]) {
        for (var month in nach[accountId][year]) {
          var date = new Date(year, month - 1);
          if (date >= start && date <= end) {
            for (var serviceId in nach[accountId][year][month]) {
              totalCharges += nach[accountId][year][month][serviceId];
            }
            // Запоминаем начисления последнего месяца
            if (!lastMonthKey || date > lastMonthKey) {
              lastMonthKey = date;
              lastMonthCharges = 0; // Сбрасываем для нового последнего месяца
              for (var _serviceId in nach[accountId][year][month]) {
                lastMonthCharges += nach[accountId][year][month][_serviceId];
              }
            }
          }
        }
      }
    }
    return lastMonthOnly ? lastMonthCharges : totalCharges;
  }
  var footerRow = document.createElement("tr");
  footerRow.classList.add("itog");
  footerRow.innerHTML = "<td colspan=2>\u0418\u0442\u043E\u0433\u043E</td><td>".concat(
    totalStartDebt.toFixedWithComma(),
    "</td>"
  );
  if (displayMode === "summarized") {
    Array.from(servicesWithCharges).forEach(function (serviceId) {
      var serviceTotal = totalCharges[serviceId] || 0;
      footerRow.innerHTML += "<td>".concat(
        serviceTotal.toFixedWithComma(),
        "</td>"
      );
    });
    footerRow.innerHTML += "<td>"
      .concat(
        Object.values(totalPayments)
          .reduce(function (sum, val) {
            return sum + val;
          }, 0)
          .toFixedWithComma(),
        "</td><td>"
      )
      .concat(totalEndDebt.toFixedWithComma(), "</td>");
} else {
  var _currentDate = new Date(start);
  while (_currentDate <= end) {
    var _month3 = _currentDate.getMonth() + 1;
    var _year3 = _currentDate.getFullYear();
    var key = "".concat(_year3, "-").concat(_month3);
    var chargeTotal = totalCharges[key] || 0;
    var paymentTotal = totalPayments[key] || 0;

    if (displayMode === "charges-only") {
      footerRow.innerHTML += "<td>".concat(chargeTotal.toFixedWithComma(), "</td>");
    } else if (displayMode === "payments-only") {
      footerRow.innerHTML += "<td>".concat(paymentTotal.toFixedWithComma(), "</td>");
    } else if (displayMode === "detailed") {
      footerRow.innerHTML += "<td>"
        .concat(chargeTotal.toFixedWithComma(), "</td><td>")
        .concat(paymentTotal.toFixedWithComma(), "</td>");
    } else if (displayMode.startsWith("service-")) {
      // В этом режиме показываются только начисления по услуге
      footerRow.innerHTML += "<td>".concat(chargeTotal.toFixedWithComma(), "</td>");
    }

    _currentDate.setMonth(_currentDate.getMonth() + 1);
  }

  footerRow.innerHTML += "<td>".concat(
    totalEndDebt.toFixedWithComma(),
    "</td>"
  );
}

  thead.appendChild(footerRow);
  var headerRows = thead.querySelectorAll("tr"); // Получаем все строки <tr>
  var headerRowsClone = Array.from(headerRows).map(function (row) {
    return row.cloneNode(true);
  });
  headerRowsClone.forEach(function (row) {
    row.classList.add("header-row-clone");
    tbody.appendChild(row);
  });
  tableContainer.appendChild(table);
  initPosters();
  doRed();
  setParam("start", document.getElementById("start-date").value);
  setParam("end", document.getElementById("end-date").value);
  setParam("displayMode", displayMode);
  setParam("preset", document.getElementById("preset-select").value);
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
  var displayMode = document.getElementById("display-mode").value; // Получаем режим отображения со страницы
  var rows = document.querySelectorAll("#table-container > .main > tbody > tr"); // Находим все строки таблицы

  var rowDataList = []; // Массив для хранения данных по каждой строке

  rows.forEach(function (row) {
    var columns = row.querySelectorAll("td:not(.subtable td)");
    if (columns.length > 0) {
      var totalPaymentsForMonth = parseFloat(
        columns[columns.length - 2].textContent
          .trim()
          .replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
          .replace(",", ".") // Заменяем запятую на точку
      );
      var totalChargesForMonth;
      if (displayMode === "summarized") {
        // В режиме "summarized" находим сумму по всем услугам за последний месяц
        totalChargesForMonth = 0;
        for (var i = 2; i < columns.length - 2; i++) {
          if (!columns[i].querySelector("table")) {
            totalChargesForMonth += parseFloat(
              columns[i].textContent
                .trim()
                .replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
                .replace(",", ".") // Заменяем запятую на точку
            );
          }
        }
      } else {
        // В режиме "detailed" просто берём значение из соответствующего столбца
        totalChargesForMonth = parseFloat(
          columns[columns.length - 3].textContent
            .trim()
            .replace(/[^0-9,.\-]+/g, "") // Убираем все символы, кроме цифр, запятой, точки и минуса
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
function sortTable(header) {
  var table = header.closest("table");
  var tbody = table.querySelector("tbody");

  // Удаляем все строки с классом "header-row-clone"
  var cloneRows = tbody.querySelectorAll(".header-row-clone");
  cloneRows.forEach(function (row) {
    return row.remove();
  });
  var rows = Array.from(tbody.rows);
  var isAsc = header.classList.contains("sorted-asc");
  var index = Array.from(header.parentNode.children).indexOf(header);

  // Убираем классы сортировки с других заголовков
  header.parentNode.querySelectorAll("th").forEach(function (th) {
    return th.classList.remove("sorted-asc", "sorted-desc");
  });
  header.classList.add(isAsc ? "sorted-desc" : "sorted-asc");

  // Сортируем строки
rows.sort(function (rowA, rowB) {
  var cellA = rowA.cells[index].getAttribute("v") || rowA.cells[index].textContent;
  var cellB = rowB.cells[index].getAttribute("v") || rowB.cells[index].textContent;

  // Преобразуем "-" в 0
  if (cellA.trim() === "-") cellA = "0";
  if (cellB.trim() === "-") cellB = "0";

  var valA = parseFloat(cellA.replace(/\s/g, "").replace(",", "."));
  var valB = parseFloat(cellB.replace(/\s/g, "").replace(",", "."));

  // Если не число — сравниваем как строки
  if (isNaN(valA)) valA = cellA;
  if (isNaN(valB)) valB = cellB;

  return isAsc ? (valA < valB ? 1 : -1) : valA > valB ? 1 : -1;
});

  // Добавляем отсортированные строки обратно в tbody
  rows.forEach(function (row) {
    return tbody.appendChild(row);
  });
  var thead = table.querySelector("thead");
  var headerRows = thead.querySelectorAll("tr"); // Получаем все строки <tr>
  var headerRowsClone = Array.from(headerRows).map(function (row) {
    return row.cloneNode(true);
  });
  headerRowsClone.forEach(function (row) {
    row.classList.add("header-row-clone");
    tbody.appendChild(row);
  });
}
function generateLsCell(accountId) {
  var curLS = ls[accountId];
  var lsCell = document.createElement("td");
  lsCell.classList.add("poster");

  // Формируем контент для ячейки
  lsCell.innerHTML = "\n        "
    .concat(
      curLS.kv,
      ' <!-- \u041D\u043E\u043C\u0435\u0440 \u043A\u0432\u0430\u0440\u0442\u0438\u0440\u044B -->\n        <div class="descr">\n            <div>\n                \u041B\u0421: '
    )
    .concat(
      curLS.ls,
      "<br>  <!-- \u041B\u0438\u0446\u0435\u0432\u043E\u0439 \u0441\u0447\u0435\u0442 -->\n                \u0424\u0418\u041E: "
    )
    .concat(curLS.fio, "<br>  <!-- \u0424\u0418\u041E -->\n                ")
    .concat(
      curLS.pl
        ? "\u041F\u043B\u043E\u0449\u0430\u0434\u044C: ".concat(
            curLS.pl,
            " \u043C\xB2<br>"
          )
        : "",
      "  <!-- \u041F\u043B\u043E\u0449\u0430\u0434\u044C -->\n                "
    )
    .concat(
      curLS.pers
        ? "\u0416\u0438\u043B\u044C\u0446\u043E\u0432: ".concat(
            curLS.pers,
            "<br>"
          )
        : "",
      "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u043B\u044C\u0446\u043E\u0432 -->\n                "
    )
    .concat(
      curLS.komn
        ? "\u041A\u043E\u043C\u043D\u0430\u0442: ".concat(curLS.komn, "<br>")
        : "",
      "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043C\u043D\u0430\u0442 -->\n                "
    )
    .concat(
      curLS.et ? "\u042D\u0442\u0430\u0436: ".concat(curLS.et, "<br>") : "",
      "  <!-- \u042D\u0442\u0430\u0436 -->\n                "
    )
    .concat(
      curLS.pod
        ? "\u041F\u043E\u0434\u0435\u0437\u0434: ".concat(curLS.pod, "<br>")
        : "",
      "  <!-- \u041F\u043E\u0434\u044A\u0435\u0437\u0434 -->\n                "
    )
    .concat(
      curLS.lgota
        ? "\u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A: ".concat(
            curLS.lgota,
            "<br>"
          )
        : "",
      "  <!-- \u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A -->\n                "
    )
    .concat(
      curLS.tel
        ? "\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ".concat(
            curLS.tel,
            "<br>"
          )
        : "",
      "  <!-- \u0422\u0435\u043B\u0435\u0444\u043E\u043D -->\n                "
    )
    .concat(
      curLS.note
        ? "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435: ".concat(
            curLS.note,
            "<br>"
          )
        : "",
      "  <!-- \u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435 -->\n                "
    )
    .concat(
      curLS.email ? "e-mail: ".concat(curLS.email, "<br>") : "",
      "  <!-- Email -->\n            </div>\n        </div>\n    "
    );
  return lsCell;
}
function generatePaymentCell(payments) {
  var totalPayment = payments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var paymentCell = document.createElement("td");
  if (payments.length === 1) {
    var payment = payments[0];
    paymentCell.classList.add("poster");
    if (payment.date) {
      paymentCell.innerHTML = ""
        .concat(
          totalPayment.toFixedWithComma(),
          '\n                <div class="descr">\n                    <div>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E '
        )
        .concat(payment.date, " \u0447\u0435\u0440\u0435\u0437 ")
        .concat(
          b[payment.yur] || "неизвестный банк",
          "<br>\n                    "
        )
        .concat(
          payment.kvit
            ? "\u041A\u0432\u0456\u0442\u0430\u043D\u0446\u0456\u044F: ".concat(
                payment.kvit,
                "<br>"
              )
            : "",
          "\n                    "
        )
        .concat(
          payment.nazn
            ? "\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F: ".concat(
                payment.nazn
              )
            : "",
          "\n                    </div>\n                </div>\n            "
        );
    }
  } else if (payments.length > 0) {
    paymentCell.classList.add("poster");
    var hasKvit = false; // Флаг для проверки наличия payment.kvit
    var hasNazn = false; // Флаг для проверки наличия payment.nazn

    // Первый проход для определения наличия payment.kvit и payment.nazn
    payments.forEach(function (payment) {
      if (payment.kvit > "") hasKvit = true; // Проверка на наличие квитанции
      if (payment.nazn > "") hasNazn = true; // Проверка на наличие призначення
    });
    var paymentRows = "";

    // Второй проход для создания строк таблицы
    payments.forEach(function (payment) {
      paymentRows += "\n            <tr>\n                <td>"
        .concat(payment.date, "</td>\n                <td>")
        .concat(
          b[payment.yur] || "неизвестный банк",
          "</td>\n                <td>"
        )
        .concat(payment.sum.toFixedWithComma(), "</td>\n                ")
        .concat(
          hasKvit ? "<td>".concat(payment.kvit || "", "</td>") : "",
          "\n                "
        )
        .concat(
          hasNazn ? "<td>".concat(payment.nazn || "", "</td>") : "",
          "\n            </tr>\n        "
        );
    });
    paymentCell.innerHTML = ""
      .concat(
        totalPayment.toFixedWithComma(),
        '\n        <div class="descr">\n            <table class="subtable">\n                <tbody>\n                    <tr>\n                        <th>\u0414\u0430\u0442\u0430</th>\n                        <th>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0447\u0435\u0440\u0435\u0437</th>\n                        <th>\u0421\u0443\u043C\u043C\u0430</th>\n                        '
      )
      .concat(hasKvit ? "<th>Квітанція</th>" : "", "\n                        ")
      .concat(
        hasNazn ? "<th>Призначення</th>" : "",
        "\n                    </tr>\n                    "
      )
      .concat(
        paymentRows,
        "\n                </tbody>\n            </table>\n        </div>\n    "
      );
  }
  return paymentCell;
}
function handlePeriodChange(event) {
  var presetSelect = document.getElementById("preset-select");
  var startLabel = document.getElementById("start-label");
  var endLabel = document.getElementById("end-label");
  var presetLabel = document.getElementById("preset-label");
  var startDateInput = document.getElementById("start-date");
  var endDateInput = document.getElementById("end-date");
  var startDate = new Date(startDateInput.value + "-01");
  var endDate = new Date(endDateInput.value + "-01");
  if (event == "start" || event == "end") {
    if (isMonth(startDate) && isMonth(endDate))
      presetSelect.value = "current-month";
    if (isMonth(startDate, -1) && isMonth(endDate, -1))
      presetSelect.value = "previous-month";
    if (isMonth(startDate, -2) && isMonth(endDate, -2))
      presetSelect.value = "two-months-ago";
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
  var serviceIds = new Set();

  for (var orgId in nach) {
    if (!nach.hasOwnProperty(orgId)) continue;
    var years = nach[orgId];
    for (var year in years) {
      if (!years.hasOwnProperty(year)) continue;
      var months = years[year];
      for (var month in months) {
        if (!months.hasOwnProperty(month)) continue;
        var days = months[month];
        for (var day in days) {
          if (!days.hasOwnProperty(day)) continue;
          // Здесь day — это код услуги (число)
          serviceIds.add(Number(day));
        }
      }
    }
  }

  // Формируем опции для display-mode: стандартные
  var displayOptions =
    '<option value="summarized">По услугам</option>' +
    '<option value="detailed">По месяцам</option>' +
    '<option value="charges-only">По месяцам (начислено)</option>' +
    '<option value="payments-only">По месяцам (оплаты)</option>';

  // Добавляем только те услуги, которые есть в nach
  serviceIds.forEach(function(serviceId) {
    if (us[serviceId]) {
      displayOptions +=
        '<option value="service-' + serviceId + '">' + us[serviceId] + "</option>";
    }
  });




  document.getElementById("maincontainer").innerHTML =
    '<div id="org" align="right"></div>' +
    '<div id="filter-container">' +
    "<!-- Первая колонка: выбор периода и отображения -->" +
    '<div class="column">' +
    '<label id="preset-label">' +
    "Выберите период:" +
    '<select id="preset-select" onchange="applyPreset()">' +
    "<!-- Эти опции обновляются в setDefaultDates() -->" +
    "</select>" +
    "</label>" +
    '<label id="start-label" style="display: none;">' +
    "С:" +
    '<input type="month" id="start-date" >' +
    "</label>" +
    '<label id="end-label" style="display: none;">' +
    "По:" +
    '<input type="month" id="end-date">' +
    "</label>" +
    "</div>" +
    "<!-- Вторая колонка: даты -->" +
    '<div class="column">' +
    "<label>" +
    "Отображение:" +
    '<select id="display-mode">' +
    displayOptions +
    "</select>" +
    "</label>" +
    "</div>" +
    "<!-- Третья колонка: фильтр -->" +
    '<div class="column">' +
    "<label>" +
    "Фильтр:" +
    '<select id="record-filter">' +
    '<option value="all">Показать всё</option>' +
    '<option value="paid-or-low-debt">Оплативших или без долгов</option>' +
    '<option value="paid">Оплативших</option>' +
    '<option value="overpaid">С переплатой</option>' +
    '<option value="debtors">Должники</option>' +
    "</select>" +
    "</label>" +
    buttons +
    "</div>" +
    "</div>" +
    '<div id="table-container"></div>' +
    '<div id="datetime"></div>';
  setDefaultDates();
  handlePeriodChange();
  document
    .getElementById("preset-select")
    .addEventListener("change", handlePeriodChange);
  document.getElementById("start-date").addEventListener("change", function () {
    handlePeriodChange("start");
  });
  document.getElementById("end-date").addEventListener("change", function () {
    handlePeriodChange("end");
  });
  document
    .getElementById("record-filter")
    .addEventListener("change", generateTable);
  document
    .getElementById("display-mode")
    .addEventListener("change", generateTable);
  if (getParam("displayMode"))
    document.getElementById("display-mode").value = getParam("displayMode");
  generateTable();
}
function doRed() {
  var table = document.querySelector(".main");
  for (var row of table.rows) {
    var cells = row.cells;
    var visualIndex = 0;

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var colspan = parseInt(cell.getAttribute("colspan") || "1");

      // Обработка третьего визуального столбца (индекс 2)
      if (visualIndex <= 2 && visualIndex + colspan > 2) {
        var value = parseFloat(cell.textContent);
        if (value > 0) cell.classList.add("red");
      }

      // Обработка остальных ячеек между 4 и предпоследним (визуально)
      for (var v = 3; v < getTotalVisualColumns(row) - 1; v++) {
        if (visualIndex <= v && visualIndex + colspan > v) {
          var value = parseFloat(cell.textContent);
          if (value < 0) cell.classList.add("red");
        }
      }

      visualIndex += colspan;
    }

    // Последний визуальный столбец — самый правый cell
    var lastCell = cells[cells.length - 1];
    var lastValue = parseFloat(lastCell.textContent);
    if (lastValue > 0) lastCell.classList.add("red");
  }
}

// Подсчёт количества визуальных колонок
function getTotalVisualColumns(row) {
  var total = 0;
  for (var cell of row.cells) {
    total += parseInt(cell.getAttribute("colspan") || "1");
  }
  return total;
}

