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

    originalParentHeader =
      (_document$getElementB = document.getElementById("header")) === null ||
      _document$getElementB === void 0
        ? void 0
        : _document$getElementB.parentElement;
    originalSiblings = _toConsumableArray(body.children);

    // Получаем элементы с классом "balance-info" и с id="header"
    //var balanceInfo = document.querySelector(".balance-info");
    var header = document.getElementById("header");
    var settingsModal = document.getElementById("settings-modal");
    // Скрываем всё, кроме таблицы, элементов с классом "balance-info" и с id="header"
    originalSiblings.forEach(function (el) {
      if (el !== table && el !== header && el !== settingsModal) {
        el.style.display = "none";
      }
    });

document.querySelectorAll("button").forEach(function (btn) {
  btn.style.display = "none";
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
    //if (balanceInfo) wrapper.appendChild(balanceInfo); // Добавляем элемент с классом "balance-info"
    wrapper.appendChild(table);
    body.appendChild(wrapper);
    showMessage("Для возврата щелкните мышью по заголовку таблицы");
setTimeout(() => {
  document.addEventListener("click", handleOutsideClick);
}, 0);

    isTableFocused = true;
  } 
}

function handleOutsideClick(event) {
  //var table = event.target.closest("table"); // Находим ближайшую таблицу

var tables = document.querySelectorAll('table#main');
var table = null;

tables.forEach(function(t) {
  if (!table && t.offsetParent !== null) { // таблица видимая
    table = t;
  }
});


  if (!table) return;
  var body = document.body;

  if (isTableFocused){
    var _document$getElementB2;
    var settingsModal = document.getElementById("settings-modal");

    // Восстанавливаем элементы
    originalSiblings.forEach(function (el) {
      if (el !== settingsModal) return (el.style.display = "");
    });
// Показываем все button внутри таблицы
document.querySelectorAll("button").forEach(function (btn) {
   btn.style.display = "";
});
document.getElementById("message").style.display='none';
    // Возвращаем таблицу и элементы обратно в их исходные родительские элементы
    if (originalParentTable) originalParentTable.appendChild(table);
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
  document.removeEventListener("click", handleOutsideClick);

  }
}

function addStuff(accountId) {
  var accountData = nach[accountId] || {}; // Данные для указанного accountId
  var paymentData = oplat[accountId] || {}; // Данные оплат для указанного accountId

  for (const paymentYear in paymentData) {
        if (!accountData[paymentYear]) {
            accountData[paymentYear] = {};
        }
        for (const paymentMonth in paymentData[paymentYear]) {
            if (!accountData[paymentYear][paymentMonth]) {
                accountData[paymentYear][paymentMonth] = { 1: 0 };
            }
        }
    }  
  const link=homes.find(h => h.code == getParam('homeCode'))?.token ?? "";
  const adrLink=document.getElementById("adr")
  const currentKv=ls[accountId].kv;
if (link && currentKv && currentKv > 0) {
  adrLink.href = `https://next.privat24.ua/payments/form/%7B%22token%22:%22${link}%22,%22personalAccount%22:%22${currentKv}%22%7D`;
  adrLink.target = "_blank";       // открывать в новой вкладке
  adrLink.rel = "noopener noreferrer"; // безопасное открытие
} else {
  adrLink.removeAttribute("href");
  adrLink.removeAttribute("target");
  adrLink.removeAttribute("rel");
}

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
const servicesCount = [...services].filter(n => n !== "7").length;

headerRow.innerHTML = `
  <td rowspan="2" align="center" class="clickable">Місяць</td>
  <td colspan="${servicesCount}" align="center" class="clickable">
    Нараховано за місяць
  </td>
  <td rowspan="2" align="center" class="clickable">
    Оплачено в місяці<br>(число, сума, період)
  </td>
  <td rowspan="2" align="center" class="clickable">
    Борг(+) Переплата(-) на кінець місяця
  </td>
`;

    // Добавляем обработчик кликов к заголовкам
    //Array.from(headerRow.children).forEach(function (header, index) {
    //  header.addEventListener("click", handleHeaderClick);
    //});
    thead.appendChild(headerRow);

    // Второй ряд заголовка с названиями услуг
    var servicesRow = document.createElement("tr");
    services.forEach(function (serviceId) {
      if (serviceId != 7) {
      	var serviceName = us[serviceId] || `Услуга ${serviceId}`;
        var serviceHeader = document.createElement("td");
        serviceHeader.setAttribute("align", "CENTER");
        serviceHeader.textContent = serviceName;
        serviceHeader.classList.add("clickable"); // Добавляем класс

        // Навешиваем обработчик клика
        //serviceHeader.addEventListener("click", handleHeaderClick);
        servicesRow.appendChild(serviceHeader);
      }
    });
    thead.appendChild(servicesRow); // Добавляем строку с услугами в заголовок


if (cumulativeBalance !== 0) {
  var balanceRow = document.createElement("tr");
  var balanceCell = document.createElement("td");

  // colspan зависит от количества колонок: 1 (месяц) + n (услуги) + 1 (оплата) + 1 (баланс)
  var colSpan = 3 + [...services].filter(n => n !== "7").length;
  balanceCell.colSpan = colSpan;
  balanceCell.className = "balance-info";

  var balanceText =
    cumulativeBalance > 0
      ? "⚠️ Вхідний борг на початок року"
      : "✅ Вхідна переплата на початок року";

  var balanceValue = document.createElement("span");
  balanceValue.textContent = cumulativeBalance.toFixedWithComma();
  balanceValue.classList.add(cumulativeBalance > 0 ? "red" : "green");

  balanceCell.innerHTML = `${balanceText}: `;
  balanceCell.appendChild(balanceValue);
  //balanceCell.append(" грн.");
  balanceRow.appendChild(balanceCell);
  //balanceRow.appendChild(balanceValue);
  tbody.appendChild(balanceRow);
}




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
        if (serviceId == 13){
        const val = nachnote?.[accountId]?.[year]?.[_month]?.[13];

        const noteText = Array.isArray(val)
	  ? val.join('\n')
	  : (val ?? '');

        if (noteText) {
          //console.log(noteText);
          cell.className = "poster"; // Добавляем класс оформления
          cell.innerHTML = "".concat(
            charge.toFixedWithComma(),
            '<div class="descr">' + noteText.replace(/\n/g, '<br>') + '</div>'
          );
        }
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
totalRow.innerHTML =`<td rowspan="2" align="center">Разом за ${year} рік</td>`;

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
const servicesCount = Array.from(services).filter(n => n !== "7").length;


chargesSummaryRow.innerHTML =
  `<td colspan="${servicesCount}" align="center">
     Усього нараховано: ${totalChargeForAllServices.toFixedWithComma()}
   </td>`;

      tbody.appendChild(chargesSummaryRow);
    } else {
      var _Object$values$;
      // Если одна услуга
      var _totalRow = document.createElement("tr");
      _totalRow.classList.add("itog");
_totalRow.innerHTML =
  `<td align="left">Разом за ${year} рік</td>`;


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
    yearContent.dataset.id = "block-" + year;

yearsBar.appendChild(yearToggle);
yearsBar.appendChild(yearLabel);

yearContent.classList.add("year-table");
container.appendChild(yearContent);

    lastYearToggle = yearToggle; // Сохраняем чекбокс последнего года
  };
var yearsBar = document.createElement("div");
yearsBar.id = "years-bar";
container.appendChild(yearsBar);

  for (var year in accountData) {
    _loop();
  }
if (lastYearToggle) {
    lastYearToggle.checked = true;

    const id = lastYearToggle.id;
    const table = document.querySelector(`.year-table[data-id="${id}"]`);
    if (table) {
        table.classList.add("active");
    }

    // (опционально) подсветка кнопки года
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
        label.classList.add("active");
    }
}

  var curLS = ls[accountId];
container = document.getElementById("datetime");
container.style.cursor = "pointer";

const content = `
  <span class="original">
    <br>
    <div>
      ОР: ${curLS.ls}<br>
      П.І.Б.: ${curLS.fio}<br>
      ${curLS.pl ? `Площа: ${curLS.pl} м²<br>` : ""}
      ${curLS.pers ? `Мешканців: ${curLS.pers}<br>` : ""}
      ${curLS.komn ? `Кімнат: ${curLS.komn}<br>` : ""}
      ${curLS.et ? `Поверх: ${curLS.et}<br>` : ""}
      ${curLS.pod ? `Під'їзд: ${curLS.pod}<br>` : ""}
      ${curLS.lgota ? `Пільговик: ${curLS.lgota}<br>` : ""}
      ${curLS.tel ? `Телефон: ${curLS.tel}<br>` : ""}
      ${curLS.note ? `Примітка: ${curLS.note.replace(/\n/g, "<br>")}<br>` : ""}
      ${curLS.email ? `e-mail: ${curLS.email}<br>` : ""}
      <br>Дані вказані станом на <br>${dt} (${timeAgo(dt)} тому.)
    </div>
  </span>
  <span class="hover-text">Повідомити про зміні</span>
`;

container.innerHTML = content;

initPosters();
setParam("kv", ls[accountId].kv);

//lastRow.scrollIntoView({ behavior: "smooth", block: "end" });

container.addEventListener("click", function () {
  handleChangeRequest(accountId);
});

  updateStickyTop(); 
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
if (monthlyPayments.length === 0) {
  // Если оплат нет — вставляем непустое содержимое, чтобы Excel не смещал колонки
  paymentCell.innerHTML = "&nbsp;";
} else {
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
}

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
paymentCell.innerHTML = `
  ${totalPayments.toFixedWithComma()}
  <div class="descr">
    <div class="big">
      Оплачено ${payment.date} через ${b[payment.yur]}
      ${payment.kvit ? `<br>Квітанція: ${payment.kvit}` : ``}
      ${payment.nazn ? `<br>Призначення: ${payment.nazn}` : ``}
    </div>
  </div>
`;
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
var headerRow = `
  <tr>
    <th>Дата</th>
    <th>Оплачено через</th>
    ${hasKvit ? `<th>Квітанція</th>` : ``}
    <th>Сума</th>
    ${hasNazn ? `<th>Призначення</th>` : ``}
  </tr>
`;
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
document.getElementById("maincontainer").innerHTML = `
  <div id="header">
    <table width="100%">
      <tr>
        <td align="right"><b>Адреса:</b></td>
        <td class="big" align="left">
          <u><i><a id="adr">adr</a></i></u>
          <select class="big" id="number"></select>
        </td>
        <td rowspan="2">${buttons}</td>
        <td rowspan="2"><div id="org" align="right"></div></td>
      </tr>
      <tr>
        <td align="right"><b>П.І.Б.:</b></td>
        <td align="left">
          <u><i><div class="big" id="fio"></div></i></u>
        </td>
      </tr>
    </table>
  </div>
  <div id="din"></div>
  <div id="datetime"></div>
`;
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


// script.js
function handleChangeRequest(accountId) {
  const data = ls[accountId] || {};

  const existingModal = document.getElementById('changeModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'changeModal';
  modal.className = 'modal-overlay';

  // Закрытие при клике за пределами модалки
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const container = document.createElement('div');
  container.className = 'modal-container';

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

// Локальный формат YYYY-MM-DD
const firstOfMonthStr = firstOfMonth.getFullYear() + '-' +
                        String(firstOfMonth.getMonth() + 1).padStart(2, '0') + '-' +
                        String(firstOfMonth.getDate()).padStart(2, '0');


  const monthStr = today.toISOString().slice(0,7);

  // ===== Блок 1 =====
  const block1 = document.createElement('div');
  block1.className = 'modal-section modal-block-1';
  block1.innerHTML = `
    <h4>Основні дані</h4>
    <div>Станом на</div>
    <div>${today.toLocaleDateString()}</div>
    <div><input type="date" name="effectiveDate" value="${firstOfMonthStr}"></div>

    <div>П.І. по Б.</div>
    <div>${data.fio || ''}</div>
    <div><input type="text" name="fio" value="${data.fio || ''}"></div>

    <div>Площа</div>
    <div>${data.pl || ''}</div>
    <div><input type="number" name="pl" value="${data.pl || ''}" step="0.01"></div>

    <div>Мешканців</div>
    <div>${data.pers || ''}</div>
    <div><input type="number" name="pers" value="${data.pers || ''}"></div>
  `;

  // ===== Блок 2 =====
  const block2 = document.createElement('div');
  block2.className = 'modal-section modal-block-2';
  block2.innerHTML = `
    <h4>Корекція(списаня) по особовому рахунку</h4>
    <label>Місяць: <input type="month" name="correctionMonth" value="${monthStr}"></label>
    <label>Сума: <input type="number" name="correctionAmount" step="1" value=""></label>
    <label id="correctionTextLabel">Підстава для зміни боргу: <input type="text" name="correctionText"></label>
  `;
  block2.querySelector('input[name="correctionAmount"]').addEventListener('input', function() {
    const label = block2.querySelector('#correctionTextLabel');
    if (this.value && parseFloat(this.value) < 0) {
      label.innerHTML = 'Підстава для збільшення боргу: <input type="text" name="correctionText">';
    } else {
      label.innerHTML = 'Підстава для зменшення боргу: <input type="text" name="correctionText">';
    }
  });

  // ===== Блок 3 =====
  const block3 = document.createElement('div');
  block3.className = 'modal-section modal-block-3';
  block3.innerHTML = `
    <h4>Контактні дані</h4>
    <div><span class="label">Підїзд:</span><input type="number" name="pod" value="${data.pod || ''}"></div>
    <div><span class="label">Поверх:</span><input type="number" name="et" value="${data.et || ''}"></div>
    <div><span class="label">Електронна адреса:</span><input type="text" name="email" value="${data.email || ''}"></div>
    <div><span class="label">Номер телефону:</span><input type="text" name="tel" value="${data.tel || ''}"></div>
    <div id="noteField"><span class="label">Примітка:</span><textarea name="note">${data.note || ''}</textarea></div>
  `;

  container.appendChild(block1);
  container.appendChild(block2);
  container.appendChild(block3);

// Кнопки
const btnContainer = document.createElement('div');
btnContainer.style.marginTop = '15px';
btnContainer.style.display = 'flex';
btnContainer.style.justifyContent = 'space-between'; // две слева, одна справа
btnContainer.style.width = '100%';

btnContainer.innerHTML = `
  <div>
    <button type="submit" id="saveChanges">Повідомити про зміни</button>
    <button type="button" id="closeModal">Закрити</button>
  </div>
  <div>
    <button type="button" id="showHistoryBtn">Історія запитів</button>
  </div>
`;

container.appendChild(btnContainer);


  modal.appendChild(container);
  document.body.appendChild(modal);
// Вешаем обработчик
document.getElementById('showHistoryBtn').addEventListener('click', () => {
  ShowHistory(accountId);
});


  function closeModal() {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
  }

document.getElementById('saveChanges').onclick = async function () {
  const inputs = container.querySelectorAll('input, textarea');

  const trackedFields = ['fio','pl','pers','note','tel','email','pod','et'];
  const keyFields = ['fio','pl','pers'];

  function norm(v) {
    if (v === undefined || v === null) return '';
    const s = String(v).trim().toLowerCase();
    if (s === '0') return '';
    return s;
  }

  const payload = {};
  let keyChanged = false;

  trackedFields.forEach(name => {
    const oldRaw = data[name] ?? '';
    const newRaw = container.querySelector(`[name="${name}"]`)?.value ?? '';

    const oldNorm = norm(oldRaw);
    const newNorm = norm(newRaw);

    if (oldNorm !== newNorm) {
      payload[name + '_old'] = oldRaw ?? '';
      payload[name + '_new'] = newRaw ?? '';

      if (keyFields.includes(name)) keyChanged = true;
    }
  });

  // Коррекция долга
  const correctionAmount = parseFloat(
    container.querySelector(`[name="correctionAmount"]`)?.value || 0
  );

  if (correctionAmount) {
    payload.correctionAmount = correctionAmount;
    payload.correctionMonth = container.querySelector(`[name="correctionMonth"]`)?.value || '';
    payload.correctionText = container.querySelector(`[name="correctionText"]`)?.value || '';
  }

  // Effective date only if key data changed
  if (keyChanged) {
    payload.effectiveDate = container.querySelector(`[name="effectiveDate"]`)?.value || '';
  }

  // Базовые поля
  payload.accountId = accountId;
  payload.address = adr + ', ' + (ls[accountId]?.kv || '');
  payload.homeCode = getParam("homeCode");
  payload.org = org;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name;
      const email = user.email || '';
      payload.sender = name ? `${name} (${email})` : email;
    }
  } catch {
    payload.sender = '';
  }

  if (Object.keys(payload).length <= 5) {
    //alert("Зміни відсутні");
    showMessage("Зміни відсутні","warn");
    //closeModal();
    return;
  }

  await sendCorrection(payload, accountId);

  console.log("Отправлено на почту:", payload);
  closeModal();
};



  document.getElementById('closeModal').onclick = closeModal;
}






// --- Отправка коррекции ---
async function sendCorrection(payload, accountId) {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    showMessage("Потрібно увійти в систему","err");
    return;
  }

  const senderName = user.user_metadata?.full_name || "";
  const senderEmail = user.email || "";
  const sender = senderName ? `${senderName} (${senderEmail})` : senderEmail;

  const finalData = {
    account_id: accountId,
    address: payload.address || "",
    home_code: payload.homeCode || "",
    org: payload.org || "",
    sender:sender || "",
    effective_date: payload.effectiveDate || null,
    fio_old: payload.fio_old || "",
    fio_new: payload.fio_new || "",
    pl_old: payload.pl_old || null,
    pl_new: payload.pl_new || null,
    pers_old: payload.pers_old || null,
    pers_new: payload.pers_new || null,
    pod_old: payload.pod_old || null,
    pod_new: payload.pod_new || null,
    et_old: payload.et_old || null,
    et_new: payload.et_new || null,
    email_old: payload.email_old || "",
    email_new: payload.email_new || "",
    tel_old: payload.tel_old || "",
    tel_new: payload.tel_new || "",
    note_old: payload.note_old || "",
    note_new: payload.note_new || "",
    correction_month: payload.correctionMonth ? new Date(payload.correctionMonth) : null,
    correction_amount: payload.correctionAmount || null,
    correction_text: payload.correctionText || "",
    submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: "очікує обробки"
  };

  const loader = showLoader("Відправка даних...");
  try {
    const { data: insertedData, error: insertError } = await client
      .from('corrections')
      .insert([finalData]);

    loader.close();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      showMessage("Помилка при відправці даних.","err");
      return;
    }

    showMessage("Дані відправлено успішно!");
    console.log("Inserted row:", insertedData);

    // --- Формируем изменения как строку для EmailJS ---
    const changes = [];
    if (finalData.effective_date) changes.push(`Дата змін: ${formatDate(finalData.effective_date,"DD.MM.YYYY")}`);
    if (finalData.fio_old !== finalData.fio_new) changes.push(`ФІО: ${finalData.fio_old} → ${finalData.fio_new}`);
    if (finalData.pl_old !== finalData.pl_new) changes.push(`Площа: ${finalData.pl_old} → ${finalData.pl_new}`);
    if (finalData.pers_old !== finalData.pers_new) changes.push(`Мешканців: ${finalData.pers_old} → ${finalData.pers_new}`);
    if (finalData.pod_old !== finalData.pod_new) changes.push(`Під’їзд: ${finalData.pod_old} → ${finalData.pod_new}`);
    if (finalData.et_old !== finalData.et_new) changes.push(`Поверх: ${finalData.et_old} → ${finalData.et_new}`);
    if (finalData.email_old !== finalData.email_new) changes.push(`Email: ${finalData.email_old} → ${finalData.email_new}`);
    if (finalData.tel_old !== finalData.tel_new) changes.push(`Телефон: ${finalData.tel_old} → ${finalData.tel_new}`);
    if (finalData.note_old !== finalData.note_new) changes.push(`Примітка: ${finalData.note_old} → ${finalData.note_new}`);
    const changesStr = changes.join("\r\n");

    // --- Отправка через EmailJS ---
const isOlderThan90 = d => {
    if (!d) return false;                     // не задано
    const dt = new Date(d);
    if (isNaN(dt)) return false;              // некорректная дата
    const days = (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
};

const uvaga =
    (typeof finalData !== "undefined" && isOlderThan90(finalData.effective_date))
        ? "УВАГА!!!"
        : "";

    try {
      const templateParams = {
        name: finalData.sender,
        sender: finalData.sender,
        subject: "Зміни по "+ payload.org,
        address: finalData.address,
        changes: changesStr || "—",
        correction: finalData.correction_amount ? formatDate(finalData.correction_month,"MM.YYYY")+"  "+finalData.correction_amount+" грн." : "—",
        correctionText: finalData.correction_text || "—",
        uvaga: uvaga
      };

      await emailjs.send("service_ed425wm", "template_vcrj80e", templateParams, "GieX-9pNBnKJ0Z2HK");
      console.log("Email sent successfully!");

    } catch (mailErr) {
      console.error("Mail sending error:", mailErr);
      alert("Не вдалося надіслати повідомлення на пошту.");
    }

  } catch (err) {
    loader.close();
    console.error("Помилка мережі:", err);
    showMessage("Не вдалося відправити дані.","err");
  }
}




function showLoader(message = "Завантаження...", cancelCallback) {
  let loaderModal = null;
  let timer = setTimeout(() => {
    loaderModal = document.createElement("div");
    loaderModal.className = "modal-overlay";
    loaderModal.style = `
      position:fixed;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.8);
      display:flex; justify-content:center; align-items:center;
      z-index:10000;
    `;
    loaderModal.innerHTML = `
      <div style="background:#fff; padding:30px 40px; border-radius:10px; text-align:center; position:relative;">
        <h3 style="margin-bottom:20px;">${message}</h3>
        <div id="spinner" style="margin:20px auto; width:50px; height:50px; border:6px solid #f3f3f3; border-top:6px solid #3498db; border-radius:50%; animation: spin 1s linear infinite;"></div>
        <button id="cancelBtn" style="margin-top:20px; padding:6px 12px; cursor:pointer;">Відмінити</button>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .modal-overlay * { font-family: sans-serif; }
      </style>
    `;
    document.body.appendChild(loaderModal);

    const cancelBtn = loaderModal.querySelector("#cancelBtn");
    cancelBtn.addEventListener("click", () => {
      if (cancelCallback) cancelCallback();
      loaderModal.remove();
    });
  }, 1000); // показываем только если прошло >1с

  return {
    close: () => {
      clearTimeout(timer);      // если запрос завершился раньше 1с, лоадер не покажется
      if (loaderModal) loaderModal.remove(); // если уже показался, удаляем
    },
    element: loaderModal
  };
}



// --- Получение истории из Supabase ---
async function ShowHistory(accountId) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return showMessage("Потрібно увійти в систему","warn");

  const senderName = user?.user_metadata?.full_name || "";
  const senderEmail = user?.email || "";
  const sender = senderName ? `${senderName} (${senderEmail})` : senderEmail;

  const loader = showLoader("Завантаження історії...");
  try {
const { data, error } = await client
  .from('corrections')
  .select('*')
  .eq('account_id', accountId)   // фильтр по accountId
  .order('submitted_at', { ascending: false });

    loader.close();

    if (error) {
      console.error(error);
      return showMessage("Помилка отримання історії","err");
    }

    if (!Array.isArray(data)) {
      console.error("Supabase returned data is not an array", data);
      return showMessage("Неправильний формат історії","err");
    }

    showHistoryModal(data, sender);

  } catch (err) {
    loader.close();
    console.error(err);
    showMessage("Помилка отримання історії","err");
  }
}

function showHistoryModal(data, sender) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.style = `
    position:fixed;
    top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.8);
    display:flex; justify-content:center; align-items:flex-start;
    padding-top:40px;
    overflow-y:auto;
    z-index:10000;
  `;

  const modalWindow = document.createElement("div");
  modalWindow.className = "modal-window";
  modalWindow.style = `
    background:#fff;
    max-width:650px;
    width:90%;
    padding:20px;
    border-radius:10px;
    position:relative;
  `;

  const title = document.createElement("h3");
  title.textContent = "Історія запитів на зміну";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style = `
    position:absolute;
    top:15px;
    right:15px;
    cursor:pointer;
    background:transparent;
    border:none;
    font-size:18px;
  `;
  closeBtn.addEventListener("click", () => modal.remove());

  const list = document.createElement("div");
  list.id = "historyList";
  list.style.marginTop = "20px";

  modalWindow.appendChild(title);
  modalWindow.appendChild(closeBtn);
  modalWindow.appendChild(list);
  modal.appendChild(modalWindow);
  document.body.appendChild(modal);

  if (!data || data.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Запитів ще не було.";
    list.appendChild(emptyMsg);
    return;
  }

  data.forEach(row => {
    const item = document.createElement("div");
    item.style = `
      border:1px solid #ccc;
      border-radius:6px;
      margin-bottom:10px;
      padding:10px;
      background:#fff;
      position:relative;
    `;

    // Крестик для удаления, только если статус "очікує обробки"
    if (row.status?.includes("очікує") && row.sender==sender) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✖";
      deleteBtn.style = `
        position:absolute;
        top:5px;
        right:5px;
        cursor:pointer;
        background:transparent;
        border:none;
        font-size:16px;
        color:red;
      `;
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Видалити запис?")) return;
        try {
          const { error } = await client
            .from('corrections')
            .delete()
            .eq('id', row.id);

          if (error) {
            console.error(error);
            alert("Помилка видалення запису");
          } else {
            item.remove(); // убираем блок из модалки
          }
        } catch (err) {
          console.error(err);
          alert("Помилка мережі");
        }
      });
      item.appendChild(deleteBtn);
    }

    // Контейнер для содержимого
    const contentDiv = document.createElement("div");

    // Даты
    const dateEntry = row.submitted_at ? new Date(row.submitted_at) : null;
    const dateChange = row.effective_date ? new Date(row.effective_date) : null;
const dateDiv = document.createElement("div");
dateDiv.style.fontWeight = "bold";

const line1 = dateEntry ? row.sender+" "+dateEntry.toLocaleString("uk-UA") : "";
const line2 = dateChange ? "зміни з: "+dateChange.toLocaleDateString("uk-UA") : "";

dateDiv.innerHTML = [line1, line2].filter(x => x).join("<br>");
    contentDiv.appendChild(dateDiv);

// Замена символов на текст
if (row.status === "+") {
    row.status = "Зміни внесено";
} else if (row.status === "-") {
    row.status = "Відхилено";
}

// Цвет статуса
let statusColor = "#ffe79a"; // оранжевый по умолчанию
if (row.status?.toLowerCase().includes("внесено")) {
    statusColor = "#b6ffb3"; // зелёный
} else if (row.status?.toLowerCase().includes("відхилено")) {
    statusColor = "#ffb3b3"; // красный
}

    // Поля
    const fields = [
      { label: "ФІО", old: row.fio_old, new: row.fio_new },
      { label: "Площа", old: row.pl_old, new: row.pl_new },
      { label: "Мешканців", old: row.pers_old, new: row.pers_new },
      { label: "Під’їзд", old: row.pod_old, new: row.pod_new },
      { label: "Поверх", old: row.et_old, new: row.et_new },
      { label: "Email", old: row.email_old, new: row.email_new },
      { label: "Телефон", old: row.tel_old, new: row.tel_new },
      { label: "Примітка", old: row.note_old, new: row.note_new }
    ];

    fields.forEach(f => {
      if ((f.old || "") !== (f.new || "")) {
        const fDiv = document.createElement("div");
        fDiv.innerHTML = `${f.label}: <span style="color:#888">${f.old || "—"}</span> → <span style="background:#ffff99">${f.new || "—"}</span>`;
        contentDiv.appendChild(fDiv);
      }
    });

    // Коррекция
    if (row.correction_amount) {
      const corrDiv = document.createElement("div");
      corrDiv.innerHTML = `Корекція: ${row.correction_amount} за ${row.correction_month ? new Date(row.correction_month).toLocaleDateString("uk-UA", {
  month: "long",
  year: "numeric"
}) : ""}<br>Підстава: ${row.correction_text || ""}`;
      contentDiv.appendChild(corrDiv);
    }

    // Статус
    const statusDiv = document.createElement("div");
    statusDiv.className = "modal-status";
    statusDiv.style.background = statusColor;


    statusDiv.textContent = row.status;
    contentDiv.appendChild(statusDiv);

    item.appendChild(contentDiv);
    list.appendChild(item);
  });

  // Закрытие модалки по клику на фон
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

let headerResizeObserver = null;

function updateStickyTop() {
  const header = document.getElementById("header");
  if (!header) return;

  const rect = header.getBoundingClientRect();
  const stickyTop = Math.ceil(48 + rect.height);


  document.documentElement.style.setProperty(
    "--header-height",
    `${stickyTop}px`
  );

  // Подключаем ResizeObserver ТОЛЬКО ОДИН РАЗ
  if ("ResizeObserver" in window && !headerResizeObserver) {
    headerResizeObserver = new ResizeObserver(() => {
      updateStickyTop();
    });
    headerResizeObserver.observe(header);
  }
}

// fallback
window.addEventListener("load", updateStickyTop);
window.addEventListener("resize", updateStickyTop);
document.addEventListener("click", function (e) {
    const label = e.target.closest("label[for^='block-']");
    if (!label) return;

    const id = label.getAttribute("for");
    const table = document.querySelector(`.year-table[data-id="${id}"]`);
    if (!table) return;

    // переключаем только ЭТУ таблицу
    table.classList.toggle("active");

    // (опционально) подсветка активной кнопки
    label.classList.toggle("active", table.classList.contains("active"));
});


