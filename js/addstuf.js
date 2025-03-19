function _toConsumableArray(r) {
  return (
    _arrayWithoutHoles(r) ||
    _iterableToArray(r) ||
    _unsupportedIterableToArray2(r) ||
    _nonIterableSpread()
  );
}
function _nonIterableSpread() {
  throw new TypeError(
    "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}
function _unsupportedIterableToArray2(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray2(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return (
      "Object" === t && r.constructor && (t = r.constructor.name),
      "Map" === t || "Set" === t
        ? Array.from(r)
        : "Arguments" === t ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
        ? _arrayLikeToArray2(r, a)
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
  if (Array.isArray(r)) return _arrayLikeToArray2(r);
}
function _arrayLikeToArray2(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _slicedToArray(r, e) {
  return (
    _arrayWithHoles(r) ||
    _iterableToArrayLimit(r, e) ||
    _unsupportedIterableToArray(r, e) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
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
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit(r, l) {
  var t =
    null == r
      ? null
      : ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (((i = (t = t.call(r)).next), 0 === l)) {
        if (Object(t) !== t) return;
        f = !1;
      } else
        for (
          ;
          !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
          f = !0
        );
    } catch (r) {
      (o = !0), (n = r);
    } finally {
      try {
        if (!f && null != t["return"] && ((u = t["return"]()), Object(u) !== u))
          return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
var isTableFocused = false; // Флаг состояния таблицы
var originalParentTable = null; // Оригинальный родитель для таблицы
var originalParentBalanceInfo = null; // Оригинальный родитель для элемента с классом "balance-info"
var originalParentHeader = null; // Оригинальный родитель для элемента с id="header"
var originalSiblings = []; // Сохраняем другие элементы страницы

function handleHeaderClick(event) {
  var table = event.target.closest("table"); // Находим ближайшую таблицу
  if (!table) return;
  var body = document.body;
  if (!isTableFocused) {
    var _document$querySelect, _document$getElementB;
    // Сохраняем оригинальные родительские элементы и соседние элементы
    originalParentTable = table.parentElement;
    originalParentBalanceInfo =
      (_document$querySelect = document.querySelector(".balance-info")) ===
        null || _document$querySelect === void 0
        ? void 0
        : _document$querySelect.parentElement;
    originalParentHeader =
      (_document$getElementB = document.getElementById("header")) === null ||
      _document$getElementB === void 0
        ? void 0
        : _document$getElementB.parentElement;
    originalSiblings = _toConsumableArray(body.children);

    // Получаем элементы с классом "balance-info" и с id="header"
    var balanceInfo = document.querySelector(".balance-info");
    var header = document.getElementById("header");

    // Скрываем всё, кроме таблицы, элементов с классом "balance-info" и с id="header"
    originalSiblings.forEach(function (el) {
      if (el !== table && el !== balanceInfo && el !== header) {
        el.style.display = "none";
      }
    });

    // Создаём обёртку для центрирования
    var wrapper = document.createElement("div");
    wrapper.id = "tableWrapper";

    // Применяем стили обёртки
    Object.assign(wrapper.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "white",
      boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
      padding: "20px",
      borderRadius: "10px",
      maxWidth: "80vw",
      // Устанавливаем максимальную ширину
      maxHeight: "100vh",
      overflow: "auto"
    });

    // Вставляем таблицу в обёртку
    if (header) wrapper.appendChild(header); // Добавляем элемент с id="header"
    if (balanceInfo) wrapper.appendChild(balanceInfo); // Добавляем элемент с классом "balance-info"
    wrapper.appendChild(table);
    body.appendChild(wrapper);
    isTableFocused = true;
    showMessage("Для возврата щелкните мышью по заголовку таблицы");
  } else {
    var _document$getElementB2;
    // Восстанавливаем элементы
    originalSiblings.forEach(function (el) {
      return (el.style.display = "");
    });

    // Возвращаем таблицу и элементы обратно в их исходные родительские элементы
    if (originalParentTable) originalParentTable.appendChild(table);
    if (originalParentBalanceInfo)
      originalParentBalanceInfo.appendChild(
        document.querySelector(".balance-info")
      );
    if (originalParentHeader)
      originalParentHeader.insertBefore(
        document.getElementById("header"),
        originalParentHeader.firstChild
      );

    // Удаляем обёртку
    (_document$getElementB2 = document.getElementById("tableWrapper")) ===
      null ||
      _document$getElementB2 === void 0 ||
      _document$getElementB2.remove();
    isTableFocused = false;
  }
}
function addStuff(accountId) {
  var accountData = nach[accountId]; // Данные для указанного accountId
  var paymentData = oplat[accountId] || {}; // Данные оплат для указанного accountId
  var container = document.getElementById("din"); // Контейнер для таблицы
  container.innerHTML = ""; // Очищаем контейнер перед добавлением новой таблицы
  document.getElementById("fio").textContent = ls[accountId].fio;
  if (!accountData) {
    container.innerHTML = "<p>Дані для ID " + accountId + " не знайдено.</p>";
    return;
  }
  var cumulativeBalance = 0;
  var currentMonth = new Date().getMonth(); // Текущий месяц
  var currentYear = new Date().getFullYear();
  var lastYearToggle; // Переменная для хранения чекбокса последнего года
  var lastRow;
  var _loop = function _loop() {
    var yearDiv = document.createElement("div");
    var balanceDiv = document.createElement("div");
    var yearToggle = document.createElement("input");
    var yearLabel = document.createElement("label");
    var yearContent = document.createElement("div");

    // Настройка чекбокса для разворачивания/сворачивания
    yearToggle.className = "toggle-box";
    yearToggle.id = "block-".concat(year);
    yearToggle.type = "checkbox";
    yearLabel.setAttribute("for", "block-".concat(year));
    yearLabel.innerHTML = "<div>".concat(year, "</div>");
    yearContent.className = "box";
    if (cumulativeBalance !== 0) {
      // Текст в зависимости от значения cumulativeBalance
      var balanceText =
        cumulativeBalance > 0
          ? "⚠️ Вхідний борг на початок року"
          : "✅ Вхідна переплата на початок року";

      // Создаем элемент для блока с информацией
      var _balanceDiv = document.createElement("div");
      _balanceDiv.className = "balance-info";

      // Создаем span для числа
      var balanceValue = document.createElement("span");
      balanceValue.textContent = "".concat(
        cumulativeBalance.toFixedWithComma()
      );

      // Если число положительное, делаем его красным
      if (cumulativeBalance > 0) {
        balanceValue.classList.add("red"); // Красный цвет для положительного значения
      } else {
        balanceValue.classList.add("green"); // Зеленый цвет для отрицательного значения
      }

      // Добавляем текст и число в блок
      _balanceDiv.textContent = "".concat(balanceText, ": ");
      _balanceDiv.appendChild(balanceValue);
      balanceValue = document.createElement("span");
      balanceValue.textContent = " грн.";
      _balanceDiv.appendChild(balanceValue);

      // Вставляем блок с информацией перед таблицей
      yearContent.appendChild(_balanceDiv);
    }
    var table = document.createElement("table");
    table.id = "main";
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");

    // Определение уникальных услуг для текущего года
    var services = new Set();
    for (var month in accountData[year]) {
      for (var serviceId in accountData[year][month]) {
        services.add(serviceId);
      }
    }

    // Заголовок таблицы
    var headerRow = document.createElement("tr");
    headerRow.innerHTML =
      '\n    <td rowspan="2" align="CENTER" class="clickable">\u041C\u0456\u0441\u044F\u0446\u044C</td>\n    <td colspan="'.concat(
        _toConsumableArray(services).filter(function (n) {
          return n !== "7";
        }).length,
        '" align="CENTER" class="clickable">\u041D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E \u0437\u0430 \u043C\u0456\u0441\u044F\u0446\u044C</td>\n    <td rowspan="2" align="CENTER" class="clickable">\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0432 \u043C\u0456\u0441\u044F\u0446\u0456</td>\n    <td rowspan="2" align="CENTER" class="clickable">\u0411\u043E\u0440\u0433(+) \u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430(-) \u043D\u0430 \u043A\u0456\u043D\u0435\u0446\u044C \u043C\u0456\u0441\u044F\u0446\u044F</td>\n'
      );

    // Добавляем обработчик кликов к заголовкам
    Array.from(headerRow.children).forEach(function (header, index) {
      header.addEventListener("click", handleHeaderClick);
    });
    thead.appendChild(headerRow);

    // Второй ряд заголовка с названиями услуг
    var servicesRow = document.createElement("tr");
    services.forEach(function (serviceId) {
      if (serviceId != 7) {
        var serviceName =
          us[serviceId] ||
          "\u0423\u0441\u043B\u0443\u0433\u0430 ".concat(serviceId);
        var serviceHeader = document.createElement("td");
        serviceHeader.setAttribute("align", "CENTER");
        serviceHeader.textContent = serviceName;
        serviceHeader.classList.add("clickable"); // Добавляем класс

        // Навешиваем обработчик клика
        serviceHeader.addEventListener("click", handleHeaderClick);
        servicesRow.appendChild(serviceHeader);
      }
    });
    thead.appendChild(servicesRow); // Добавляем строку с услугами в заголовок

    // Переменные для итоговых сумм по году
    var totalChargesByService = {};
    var totalPaymentsByService = {};
    var totalChargeForYear = 0;
    var totalPaymentsForYear = 0;
    // Заполнение таблицы данными по месяцам
    var _loop2 = function _loop2() {
      var _paymentData$year;
      // Пропускаем текущий месяц

      var transactions = accountData[year][_month];
      var row = document.createElement("tr");
      row.innerHTML = '<td align="LEFT">'
        .concat(getMonthName(_month), " ")
        .concat(year, "</td>");
      var rowCharges = {};
      var monthlyChargesTotal = 0;
      services.forEach(function (serviceId) {
        var charge = transactions[serviceId] || 0;
        rowCharges[serviceId] = charge;
        monthlyChargesTotal += charge;
      });

      // Добавляем начисления по каждой услуге в строку
      services.forEach(function (serviceId) {
        var charge = rowCharges[serviceId];
        var cell = document.createElement("td");
        if (serviceId == 1 && rowCharges[7]) charge += rowCharges[7];
        cell.textContent = charge != 0 ? charge.toFixedWithComma() : "";
        if (serviceId == 1 && rowCharges[7]) {
          cell.className = "poster"; // Добавляем класс оформления
          cell.innerHTML = "".concat(
            charge.toFixedWithComma(),
            '<div class="descr">Утримання будинку:' +
              rowCharges[1].toFixedWithComma() +
              " грн.<br>Вивіз ТПВ:" +
              rowCharges[7].toFixedWithComma() +
              " грн.</div>"
          );
        }
        if (serviceId != 7) row.appendChild(cell);
      });
      var cur = _month == currentMonth + 1 && year == currentYear;
      // Получаем данные оплат за текущий месяц
      var monthlyPayments =
        ((_paymentData$year = paymentData[year]) === null ||
        _paymentData$year === void 0
          ? void 0
          : _paymentData$year[_month]) || [];
      var totalPayments = createPaymentCell(row, monthlyPayments, accountId);
      if (!cur) {
        cumulativeBalance += monthlyChargesTotal - totalPayments;
        // Сохраняем суммы для итогов
        services.forEach(function (serviceId) {
          totalChargesByService[serviceId] =
            (totalChargesByService[serviceId] || 0) + rowCharges[serviceId];
        });
        totalPaymentsForYear += totalPayments;
      }

      // Добавляем ячейку с долгом/переплатой
      var balanceCell = document.createElement("td");
      if (cur) {
        balanceCell.textContent = (
          cumulativeBalance +
          monthlyChargesTotal -
          totalPayments
        ).toFixedWithComma();
        if (cumulativeBalance + monthlyChargesTotal - totalPayments > 0)
          balanceCell.classList.add("red");
        else balanceCell.classList.add("green");
      } else {
        balanceCell.textContent = cumulativeBalance.toFixedWithComma();
        if (cumulativeBalance > 0) balanceCell.classList.add("red");
        else balanceCell.classList.add("green");
      }
      row.appendChild(balanceCell);
      if (cur) {
        row.classList.add("grey");
        lastRow = row;
      } else {
        tbody.appendChild(row);
      }
    };
    for (var _month in accountData[year]) {
      _loop2();
    }
    // Итоги по году
    if (
      _toConsumableArray(services).filter(function (n) {
        return n !== "7";
      }).length > 1
    ) {
      // Если несколько услуг
      var totalRow = document.createElement("tr");
      totalRow.classList.add("itog");
      totalRow.innerHTML =
        '<td rowspan="2" align="CENTER">\u041F\u0456\u0434\u0441\u0443\u043C\u043E\u043A \u0437\u0430 '.concat(
          year,
          " \u0440\u0456\u043A</td>"
        );

      // Итог по каждой услуге
      services.forEach(function (serviceId) {
        var chargeTotal = totalChargesByService[serviceId] || 0;
        if (serviceId == 1) chargeTotal += totalChargesByService[7] || 0;
        var totalCell = document.createElement("td");
        totalCell.textContent = chargeTotal.toFixedWithComma();
        if (serviceId != 7) totalRow.appendChild(totalCell);
      });

      // Общая сумма оплаченных денег
      var totalPaymentsCell = document.createElement("td");
      totalPaymentsCell.rowSpan = 2;
      totalPaymentsCell.textContent = totalPaymentsForYear.toFixedWithComma();
      totalRow.appendChild(totalPaymentsCell);

      // Общий долг/переплата на конец года
      var finalBalanceCell = document.createElement("td");
      finalBalanceCell.rowSpan = 2;
      if (cumulativeBalance > 0) finalBalanceCell.classList.add("red");
      else finalBalanceCell.classList.add("green");
      finalBalanceCell.textContent = cumulativeBalance.toFixedWithComma();
      totalRow.appendChild(finalBalanceCell);
      tbody.appendChild(totalRow);

      // Ряд с итогами по всем услугам
      var chargesSummaryRow = document.createElement("tr");
      chargesSummaryRow.classList.add("itog");
      var totalChargeForAllServices = Object.values(
        totalChargesByService
      ).reduce(function (sum, value) {
        return sum + value;
      }, 0);
      chargesSummaryRow.innerHTML = '<td colspan="'
        .concat(
          _toConsumableArray(services).filter(function (n) {
            return n !== "7";
          }).length,
          '" ALIGN="center">\u0423\u0441\u044C\u043E\u0433\u043E \u043D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E: '
        )
        .concat(totalChargeForAllServices.toFixedWithComma(), "</td>");
      tbody.appendChild(chargesSummaryRow);
    } else {
      var _Object$values$;
      // Если одна услуга
      var _totalRow = document.createElement("tr");
      _totalRow.classList.add("itog");
      _totalRow.innerHTML =
        '<td align="LEFT">\u041F\u0456\u0434\u0441\u0443\u043C\u043E\u043A \u0437\u0430 '.concat(
          year,
          " \u0440\u0456\u043A</td>"
        );

      // Итог начислений по единственной услуге
      var totalChargeForOneService =
        Object.values(totalChargesByService)[0] || 0; // Получаем сумму для единственной услуги
      totalChargeForOneService +=
        (_Object$values$ = Object.values(totalChargesByService)[1]) !== null &&
        _Object$values$ !== void 0
          ? _Object$values$
          : 0;
      _totalRow.innerHTML += "<td>".concat(
        totalChargeForOneService.toFixedWithComma(),
        "</td>"
      );

      // Итог по оплатам (без учета текущего месяца текущего года)
      var totalPaymentsForOneService = 0;
      for (var _month2 in paymentData[year]) {
        if (!(year == currentYear && _month2 == currentMonth + 1)) {
          // Исключаем только текущий месяц текущего года
          var monthlyPayments = paymentData[year][_month2] || [];
          var monthPaymentsSum = monthlyPayments.reduce(function (
            sum,
            payment
          ) {
            return sum + payment.sum;
          },
          0);
          totalPaymentsForOneService += monthPaymentsSum;
        }
      }
      _totalRow.innerHTML += "<td>".concat(
        totalPaymentsForOneService.toFixedWithComma(),
        "</td>"
      );

      // Общий долг/переплата на конец года
      _totalRow.innerHTML += '<td class="'
        .concat(cumulativeBalance > 0 ? "red" : "green", '">')
        .concat(cumulativeBalance.toFixedWithComma(), "</td>");
      tbody.appendChild(_totalRow);
    }
    if (lastRow) tbody.appendChild(lastRow);
    table.appendChild(thead);
    table.appendChild(tbody);
    yearContent.appendChild(table);
    yearDiv.appendChild(yearToggle);
    yearDiv.appendChild(yearLabel);
    yearDiv.appendChild(yearContent);
    container.appendChild(yearDiv);
    lastYearToggle = yearToggle; // Сохраняем чекбокс последнего года
  };
  for (var year in accountData) {
    _loop();
  }
  if (lastYearToggle) {
    lastYearToggle.checked = true;
  }
  var curLS = ls[accountId];
  document.getElementById("datetime").innerHTML =
    "<br><div>\n                \u041E\u0420: "
      .concat(
        curLS.ls,
        "<br>  <!-- \u041E\u0441\u043E\u0431\u043E\u0432\u0438\u0439 \u0440\u0430\u0445\u0443\u043D\u043E\u043A -->\n                \u041F.\u0406.\u0411.: "
      )
      .concat(
        curLS.fio,
        "<br>  <!-- \u041F\u0440\u0456\u0437\u0432\u0438\u0449\u0435, \u0456\u043C'\u044F, \u0431\u0430\u0442\u044C\u043A\u043E\u0432\u0456 -->\n                "
      )
      .concat(
        curLS.pl
          ? "\u041F\u043B\u043E\u0449\u0430: ".concat(
              curLS.pl,
              " \u043C\xB2<br>"
            )
          : "",
        "  <!-- \u041F\u043B\u043E\u0449\u0430 -->\n                "
      )
      .concat(
        curLS.pers
          ? "\u0416\u0438\u0442\u0435\u043B\u0456\u0432: ".concat(
              curLS.pers,
              "<br>"
            )
          : "",
        "  <!-- \u041A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u0436\u0438\u0442\u0435\u043B\u0456\u0432 -->\n                "
      )
      .concat(
        curLS.komn
          ? "\u041A\u0456\u043C\u043D\u0430\u0442: ".concat(curLS.komn, "<br>")
          : "",
        "  <!-- \u041A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u043A\u0456\u043C\u043D\u0430\u0442 -->\n                "
      )
      .concat(
        curLS.et
          ? "\u041F\u043E\u0432\u0435\u0440\u0445: ".concat(curLS.et, "<br>")
          : "",
        "  <!-- \u041F\u043E\u0432\u0435\u0440\u0445 -->\n                "
      )
      .concat(
        curLS.pod
          ? "\u041F\u0456\u0434'\u0457\u0437\u0434: ".concat(curLS.pod, "<br>")
          : "",
        "  <!-- \u041F\u0456\u0434'\u0457\u0437\u0434 -->\n                "
      )
      .concat(
        curLS.lgota
          ? "\u041F\u0456\u043B\u044C\u0433\u043E\u0432\u0438\u043A: ".concat(
              curLS.lgota,
              "<br>"
            )
          : "",
        "  <!-- \u041F\u0456\u043B\u044C\u0433\u043E\u0432\u0438\u043A -->\n                "
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
          ? "\u041F\u0440\u0438\u043C\u0456\u0442\u043A\u0430: ".concat(
              curLS.note,
              "<br>"
            )
          : "",
        "  <!-- \u041F\u0440\u0438\u043C\u0456\u0442\u043A\u0430 -->\n                "
      )
      .concat(
        curLS.email ? "e-mail: ".concat(curLS.email, "<br>") : "",
        "  <!-- Email -->\n            <br>\u0414\u0430\u043D\u0456 \u0432\u043A\u0430\u0437\u0430\u043D\u0456 \u0441\u0442\u0430\u043D\u043E\u043C \u043D\u0430 <br>"
      )
      .concat(dt, " (")
      .concat(timeAgo(dt), "\u0442\u043E\u043C\u0443.)\n        </div>");
  lastRow.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });
  initPosters();
  setParam("kv", ls[accountId].kv);
}
function createPaymentCell(row, monthlyPayments, accountId) {
  var paymentCell = document.createElement("td");
  var totalPayments = monthlyPayments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var charges = nach[accountId] || {};
  var payments = oplat[accountId] || {};
  function getMonthsForPayment(paymentSum, paymentDate, accountId) {
    var paymentDateParts = paymentDate.split(".");
    var day = Number(paymentDateParts[0]);
    var month = Number(paymentDateParts[1]);
    var year = Number(paymentDateParts[2]);
    if (!nach[accountId]) return "";
    var paidMonths = [];
    var remainingSum = 0;
    var years = [];
    for (var key in nach[accountId]) {
      if (nach[accountId].hasOwnProperty(key)) {
        years.push(key);
      }
    }
    years.sort(function (a, b) {
      return a - b;
    });

    // Подсчет уже оплаченных начислений до paymentDate
    if (oplat[accountId]) {
      for (var y in oplat[accountId]) {
        for (var m in oplat[accountId][y]) {
          var payments = oplat[accountId][y][m];
          for (var i = 0; i < payments.length; i++) {
            var payment = payments[i];
            var paymentDateParts = payment.date.split(".");
            var pDay = Number(paymentDateParts[0]);
            var pMonth = Number(paymentDateParts[1]);
            var pYear = Number(paymentDateParts[2]);
            if (
              pYear < year ||
              (pYear === year && pMonth < month) ||
              (pYear === year && pMonth === month && pDay < day)
            ) {
              remainingSum += payment.sum;
            }
          }
        }
      }
    }
    var start = null;
    var end = null;
    var totalCharge = 0;
    for (var _i = 0, _years = years; _i < _years.length; _i++) {
      var y = _years[_i];
      var shortYear = y.slice(-2);
      var months = [];
      for (var key in nach[accountId][y]) {
        if (nach[accountId][y].hasOwnProperty(key)) {
          months.push(key);
        }
      }
      months.sort(function (a, b) {
        return a - b;
      });
      for (var _i2 = 0, _months = months; _i2 < _months.length; _i2++) {
        var m = _months[_i2];
        var charges = Object.values(nach[accountId][y][m]);
        var monthCharge = 0;
        for (var i = 0; i < charges.length; i++) {
          monthCharge += charges[i];
        }
        remainingSum -= monthCharge;
        totalCharge += monthCharge;
        if (remainingSum < -0.01 && !start) {
          start = m.padStart(2, "0") + "." + shortYear;
        }
        if (monthCharge > 0 && remainingSum + paymentSum < 0.01) {
          end = m.padStart(2, "0") + "." + shortYear;
          return start === end ? start : start + "-" + end;
        }
      }
    }
    end = "...";
    return start === end ? start : start + "-" + end;
  }

  // Формируем строки с данными платежей
  var tableRows = monthlyPayments
    .map(function (payment) {
      var formattedDate = payment.date.split(".")[0]; // Преобразуем дату в формат D
      var formattedSum = payment.sum.toFixed(2).replace(".", ","); // Преобразуем сумму в формат 0.00
      var paymentMonths = getMonthsForPayment(
        payment.sum,
        payment.date,
        accountId
      );
      return (
        "<tr>" +
        '<td class="big">' +
        formattedDate +
        "</td>" +
        '<td class="big">' +
        formattedSum +
        "</td>" +
        "<td>" +
        paymentMonths +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  // Устанавливаем содержимое ячейки оплаты
  paymentCell.innerHTML =
    "<div>" +
    '<table class="paysubtable">' +
    "<tbody>" +
    tableRows +
    "</tbody>" +
    "</table>" +
    "</div>";
  row.appendChild(paymentCell);
  return totalPayments;
}
function createPaymentCell_old(row, monthlyPayments) {
  var totalPayments = monthlyPayments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var paymentCell = document.createElement("td");
  if (monthlyPayments.length === 1) {
    paymentCell.className = "poster"; // Добавляем класс оформления
    // Одна оплата — отображаем простую строку
    var payment = monthlyPayments[0];
    paymentCell.innerHTML = ""
      .concat(
        totalPayments.toFixedWithComma(),
        '\n            <div class="descr">\n                <div class="big">\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E '
      )
      .concat(payment.date, " \u0447\u0435\u0440\u0435\u0437 ")
      .concat(b[payment.yur])
      .concat(
        payment.kvit
          ? "<br>\u041A\u0432\u0456\u0442\u0430\u043D\u0446\u0456\u044F: ".concat(
              payment.kvit
            )
          : "",
        " "
      )
      .concat(
        payment.nazn
          ? "<br>\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F: ".concat(
              payment.nazn
            )
          : "",
        " </div>\n            </div>\n        "
      );
  } else if (monthlyPayments.length > 1) {
    paymentCell.className = "poster"; // Добавляем класс оформления
    // Несколько оплат — отображаем таблицу с деталями
    // Определяем, есть ли хотя бы одна запись для квитанции или назначения
    var hasKvit = monthlyPayments.some(function (payment) {
      return payment.kvit;
    });
    var hasNazn = monthlyPayments.some(function (payment) {
      return payment.nazn;
    });

    // Настраиваем строку заголовка таблицы
    var headerRow =
      "\n    <tr>\n        <th>\u0414\u0430\u0442\u0430</th>\n        <th>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0447\u0435\u0440\u0435\u0437</th>\n        "
        .concat(
          hasKvit
            ? "<th>\u041A\u0432\u0456\u0442\u0430\u043D\u0446\u0456\u044F</th>"
            : "",
          "\n        <th>\u0421\u0443\u043C\u0430</th>\n        "
        )
        .concat(
          hasNazn
            ? "<th>\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F</th>"
            : "",
          "\n    </tr>\n"
        );
    // Формируем строки с данными платежей
    var tableRows = monthlyPayments
      .map(function (payment) {
        return '\n    <tr>\n        <td class="big">'
          .concat(payment.date, "</td>\n        <td>")
          .concat(b[payment.yur], "</td>\n        ")
          .concat(
            hasKvit ? "<td>".concat(payment.kvit || "", "</td>") : "",
            '\n        <td class="big">'
          )
          .concat(payment.sum.toFixedWithComma(), "</td>\n        ")
          .concat(
            hasNazn ? "<td>".concat(payment.nazn || "", "</td>") : "",
            "\n    </tr>\n"
          );
      })
      .join("");

    // Устанавливаем содержимое ячейки оплаты

    paymentCell.innerHTML = ""
      .concat(
        totalPayments.toFixedWithComma(),
        '\n    <div class="descr">\n        <table class="subtable">\n            <tbody>\n                '
      )
      .concat(headerRow, "\n                ")
      .concat(
        tableRows,
        "\n            </tbody>\n        </table>\n    </div>\n        "
      );
  }
  row.appendChild(paymentCell);
  return totalPayments;
}
function initLS() {
  document.getElementById("maincontainer").innerHTML =
    '\n    <div id="header">\n        <table width="100%">\n            <tr>\n                <td align="right"><b>\u0410\u0434\u0440\u0435\u0441\u0430:</b></td>\n                <td class="big" align="left"><u><i><a id="adr">adr</a></i></u><select class="big" id="number"></select></td>\n                <td rowspan="2"> '.concat(
      buttons,
      '\n                </td>\n                <td rowspan="2"><div id="org" align="right"></div></td>\n\n\n            </tr>\n            <tr>\n                <td align="right"><b>\u041F.\u0406.\u0411.:</b></td>\n                <td align="left"><u><i><div class="big" id="fio"></div></i></u></td>\n            </tr>\n        </table>\n    </div>\n    <div id="din"></div>\n    <div id="datetime"></div>\n'
    );
  document.getElementById("number").addEventListener("change", function () {
    addStuff(this.value);
  });
  document.getElementById("adr").textContent = adr + " / ";
  document.getElementById("org").textContent = org;
  document.title = org + " " + adr;
  Object.entries(ls).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      index = _ref2[0],
      value = _ref2[1];
    var option = document.createElement("option");
    option.value = index;
    option.textContent = value.kv;
    document.getElementById("number").appendChild(option);
  });
  var ind = getParam("kv");
  if (!ind) {
    ind = Object.keys(ls)[1];
  } else {
    ind = Object.keys(ls).find(function (key) {
      return ls[key].kv === ind || ls[key].ls === ind;
    });
    if (ind === undefined) {
      ind = Object.keys(ls)[1];
    }
  }
  addStuff(ind);
  document.getElementById("number").value = ind;
}