function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function addStuff(accountId) {
  var accountData = nach[accountId]; // Данные для указанного accountId
  var paymentData = oplat[accountId] || {}; // Данные оплат для указанного accountId
  var container = document.getElementById('din'); // Контейнер для таблицы
  container.innerHTML = ''; // Очищаем контейнер перед добавлением новой таблицы
  document.getElementById('fio').textContent = ls[accountId].fio;
  if (!accountData) {
    container.innerHTML = "<p>\u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F ID ".concat(accountId, " \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B.</p>");
    return;
  }
  var cumulativeBalance = 0;
  var currentMonth = new Date().getMonth(); // Текущий месяц
  var currentYear = new Date().getFullYear();
  var lastYearToggle; // Переменная для хранения чекбокса последнего года
  var lastRow;
  var _loop = function _loop() {
    var yearDiv = document.createElement('div');
    var balanceDiv = document.createElement('div');
    var yearToggle = document.createElement('input');
    var yearLabel = document.createElement('label');
    var yearContent = document.createElement('div');

    // Настройка чекбокса для разворачивания/сворачивания
    yearToggle.className = 'toggle-box';
    yearToggle.id = "block-".concat(year);
    yearToggle.type = 'checkbox';
    yearLabel.setAttribute('for', "block-".concat(year));
    yearLabel.innerHTML = "<div>".concat(year, "</div>");
    yearContent.className = 'box';
    if (cumulativeBalance !== 0) {
      // Текст в зависимости от значения cumulativeBalance
      var balanceText = cumulativeBalance > 0 ? '⚠️ Вхідний борг на початок року' : '✅ Вхідна переплата на початок року';

      // Создаем элемент для блока с информацией
      var _balanceDiv = document.createElement('div');
      _balanceDiv.className = 'balance-info';

      // Создаем span для числа
      var balanceValue = document.createElement('span');
      balanceValue.textContent = "".concat(cumulativeBalance.toFixedWithComma());

      // Если число положительное, делаем его красным
      if (cumulativeBalance > 0) {
        balanceValue.classList.add("red"); // Красный цвет для положительного значения
      } else {
        balanceValue.classList.add('green'); // Зеленый цвет для отрицательного значения
      }

      // Добавляем текст и число в блок
      _balanceDiv.textContent = "".concat(balanceText, ": ");
      _balanceDiv.appendChild(balanceValue);
      balanceValue = document.createElement('span');
      balanceValue.textContent = ' грн.';
      _balanceDiv.appendChild(balanceValue);

      // Вставляем блок с информацией перед таблицей
      yearContent.appendChild(_balanceDiv);
    }
    var table = document.createElement('table');
    table.id = 'main';
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Определение уникальных услуг для текущего года
    var services = new Set();
    for (var month in accountData[year]) {
      for (var serviceId in accountData[year][month]) {
        services.add(serviceId);
      }
    }

    // Заголовок таблицы
    var headerRow = document.createElement('tr');
    headerRow.innerHTML = "<td rowspan=\"2\" align=\"CENTER\">\u041C\u0435\u0441\u044F\u0446</td>\n             <td colspan=\"".concat(services.size, "\" align=\"CENTER\">\u041D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043E \u0437\u0430 \u043C\u0435\u0441\u044F\u0446</td>\n             <td rowspan=\"2\" align=\"CENTER\">\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0432 \u043C\u0435\u0441\u044F\u0446\u0435</td>\n             <td rowspan=\"2\" align=\"CENTER\">\u0414\u043E\u043B\u0433(+) \u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430(-) \u043D\u0430 \u043A\u043E\u043D\u0435\u0446 \u043C\u0435\u0441\u044F\u0446\u0430</td>");
    thead.appendChild(headerRow);

    // Второй ряд заголовка с названиями услуг
    var servicesRow = document.createElement('tr');
    services.forEach(function (serviceId) {
      var serviceName = us[serviceId] || "\u0423\u0441\u043B\u0443\u0433\u0430 ".concat(serviceId);
      var serviceHeader = document.createElement('td');
      serviceHeader.setAttribute('align', 'CENTER');
      serviceHeader.textContent = serviceName;
      servicesRow.appendChild(serviceHeader);
    });
    thead.appendChild(servicesRow);

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
      var row = document.createElement('tr');
      row.innerHTML = "<td align=\"LEFT\">".concat(getMonthName(_month), " ").concat(year, "</td>");
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
        var cell = document.createElement('td');
        cell.textContent = charge != 0 ? charge.toFixedWithComma() : '';
        row.appendChild(cell);
      });
      var cur = _month == currentMonth + 1 && year == currentYear;
      // Получаем данные оплат за текущий месяц
      var monthlyPayments = ((_paymentData$year = paymentData[year]) === null || _paymentData$year === void 0 ? void 0 : _paymentData$year[_month]) || [];
      var totalPayments = createPaymentCell(row, monthlyPayments);
      if (!cur) {
        cumulativeBalance += monthlyChargesTotal - totalPayments;
        // Сохраняем суммы для итогов
        services.forEach(function (serviceId) {
          totalChargesByService[serviceId] = (totalChargesByService[serviceId] || 0) + rowCharges[serviceId];
        });
        totalPaymentsForYear += totalPayments;
      }
      // Добавляем ячейку с долгом/переплатой
      var balanceCell = document.createElement('td');
      if (cur) {
        balanceCell.textContent = (cumulativeBalance + monthlyChargesTotal - totalPayments).toFixedWithComma();
        if (cumulativeBalance + monthlyChargesTotal - totalPayments > 0) balanceCell.classList.add("red");else balanceCell.classList.add("green");
      } else {
        balanceCell.textContent = cumulativeBalance.toFixedWithComma();
        if (cumulativeBalance > 0) balanceCell.classList.add("red");else balanceCell.classList.add("green");
      }
      row.appendChild(balanceCell);
      if (cur) {
        row.classList.add('grey');
        lastRow = row;
      } else {
        tbody.appendChild(row);
      }
    };
    for (var _month in accountData[year]) {
      _loop2();
    }

    // Итоги по году
    if (services.size > 1) {
      // Если несколько услуг
      var totalRow = document.createElement('tr');
      totalRow.classList.add('itog');
      totalRow.innerHTML = "<td rowspan=\"2\" align=\"CENTER\">\u0418\u0442\u043E\u0433\u043E \u0437\u0430 ".concat(year, " \u0433\u043E\u0434</td>");

      // Итог по каждой услуге
      services.forEach(function (serviceId) {
        var chargeTotal = totalChargesByService[serviceId] || 0;
        var totalCell = document.createElement('td');
        totalCell.textContent = chargeTotal.toFixedWithComma();
        totalRow.appendChild(totalCell);
      });

      // Общая сумма оплаченных денег
      var totalPaymentsCell = document.createElement('td');
      totalPaymentsCell.rowSpan = 2;
      totalPaymentsCell.textContent = totalPaymentsForYear.toFixedWithComma();
      totalRow.appendChild(totalPaymentsCell);

      // Общий долг/переплата на конец года
      var finalBalanceCell = document.createElement('td');
      finalBalanceCell.rowSpan = 2;
      if (cumulativeBalance > 0) finalBalanceCell.classList.add("red");else finalBalanceCell.classList.add("green");
      finalBalanceCell.textContent = cumulativeBalance.toFixedWithComma();
      totalRow.appendChild(finalBalanceCell);
      tbody.appendChild(totalRow);

      // Ряд с итогами по всем услугам
      var chargesSummaryRow = document.createElement('tr');
      chargesSummaryRow.classList.add('itog');
      var totalChargeForAllServices = Object.values(totalChargesByService).reduce(function (sum, value) {
        return sum + value;
      }, 0);
      chargesSummaryRow.innerHTML = "<td colspan=\"".concat(services.size, "\" ALIGN=\"center\">\u0412\u0441\u0435\u0433\u043E \u043D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u043E: ").concat(totalChargeForAllServices.toFixedWithComma(), "</td>");
      tbody.appendChild(chargesSummaryRow);
    } else {
      // Если одна услуга
      var _totalRow = document.createElement('tr');
      _totalRow.classList.add('itog');
      _totalRow.innerHTML = "<td align=\"LEFT\">\u0418\u0442\u043E\u0433\u043E \u0437\u0430 ".concat(year, " \u0433\u043E\u0434</td>");

      // Итог начислений по единственной услуге
      var totalChargeForOneService = Object.values(totalChargesByService)[0] || 0; // Получаем сумму для единственной услуги
      _totalRow.innerHTML += "<td>".concat(totalChargeForOneService.toFixedWithComma(), "</td>");

      // Итог по оплатам
      var totalPaymentsForOneService = 0;
      for (var _month2 in paymentData[year]) {
        var monthlyPayments = paymentData[year][_month2] || [];
        var monthPaymentsSum = monthlyPayments.reduce(function (sum, payment) {
          return sum + payment.sum;
        }, 0);
        totalPaymentsForOneService += monthPaymentsSum;
      }
      _totalRow.innerHTML += "<td>".concat(totalPaymentsForOneService.toFixedWithComma(), "</td>");

      // Общий долг/переплата на конец года
      _totalRow.innerHTML += "<td class=\"".concat(cumulativeBalance > 0 ? 'red' : 'green', "\">").concat(cumulativeBalance.toFixedWithComma(), "</td>");
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
  document.getElementById('datetime').innerHTML = "<br><div>\n                \u041B\u0421: ".concat(curLS.ls, "<br>  <!-- \u041B\u0438\u0446\u0435\u0432\u043E\u0439 \u0441\u0447\u0435\u0442 -->\n                \u0424\u0418\u041E: ").concat(curLS.fio, "<br>  <!-- \u0424\u0418\u041E -->\n                ").concat(curLS.pl ? "\u041F\u043B\u043E\u0449\u0430\u0434\u044C: ".concat(curLS.pl, " \u043C\xB2<br>") : '', "  <!-- \u041F\u043B\u043E\u0449\u0430\u0434\u044C -->\n                ").concat(curLS.pers ? "\u0416\u0438\u043B\u044C\u0446\u043E\u0432: ".concat(curLS.pers, "<br>") : '', "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u043B\u044C\u0446\u043E\u0432 -->\n                ").concat(curLS.komn ? "\u041A\u043E\u043C\u043D\u0430\u0442: ".concat(curLS.komn, "<br>") : '', "  <!-- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043C\u043D\u0430\u0442 -->\n                ").concat(curLS.et ? "\u042D\u0442\u0430\u0436: ".concat(curLS.et, "<br>") : '', "  <!-- \u042D\u0442\u0430\u0436 -->\n                ").concat(curLS.pod ? "\u041F\u043E\u0434\u0435\u0437\u0434: ".concat(curLS.pod, "<br>") : '', "  <!-- \u041F\u043E\u0434\u044A\u0435\u0437\u0434 -->\n                ").concat(curLS.lgota ? "\u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A: ".concat(curLS.lgota, "<br>") : '', "  <!-- \u041B\u044C\u0433\u043E\u0442\u043D\u0438\u043A -->\n                ").concat(curLS.tel ? "\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ".concat(curLS.tel, "<br>") : '', "  <!-- \u0422\u0435\u043B\u0435\u0444\u043E\u043D -->\n                ").concat(curLS.note ? "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435: ".concat(curLS.note, "<br>") : '', "  <!-- \u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435 -->\n                ").concat(curLS.email ? "e-mail: ".concat(curLS.email, "<br>") : '', "  <!-- Email -->\n            <br>\u0414\u0430\u043D\u043D\u044B\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E \u043D\u0430 <br>").concat(dt, " (").concat(timeAgo(dt), "\u043D\u0430\u0437\u0430\u0434.)\n        </div>");
  lastRow.scrollIntoView({
    behavior: 'smooth',
    block: 'end'
  });
  initPosters();
  setParam('kv', ls[accountId].kv);
}
function createPaymentCell(row, monthlyPayments) {
  var totalPayments = monthlyPayments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var paymentCell = document.createElement('td');
  if (monthlyPayments.length === 1) {
    paymentCell.className = 'poster'; // Добавляем класс оформления
    // Одна оплата — отображаем простую строку
    var payment = monthlyPayments[0];
    paymentCell.innerHTML = "".concat(totalPayments.toFixedWithComma(), "\n            <div class=\"descr\">\n                <div class=\"big\">\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ").concat(payment.date, " \u0447\u0435\u0440\u0435\u0437 ").concat(b[payment.yur]).concat(payment.kvit ? "<br>\u041A\u0432\u0456\u0442\u0430\u043D\u0446\u0456\u044F: ".concat(payment.kvit) : '', " ").concat(payment.nazn ? "<br>\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F: ".concat(payment.nazn) : '', " </div>\n            </div>\n        ");
  } else if (monthlyPayments.length > 1) {
    paymentCell.className = 'poster'; // Добавляем класс оформления
    // Несколько оплат — отображаем таблицу с деталями
    // Определяем, есть ли хотя бы одна запись для квитанции или назначения
    var hasKvit = monthlyPayments.some(function (payment) {
      return payment.kvit;
    });
    var hasNazn = monthlyPayments.some(function (payment) {
      return payment.nazn;
    });

    // Настраиваем строку заголовка таблицы
    var headerRow = "\n    <tr>\n        <th>\u0414\u0430\u0442\u0430</th>\n        <th>\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E \u0447\u0435\u0440\u0435\u0437</th>\n        ".concat(hasKvit ? '<th>Квитанция</th>' : '', "\n        <th>\u0421\u0443\u043C\u043C\u0430</th>\n        ").concat(hasNazn ? '<th>Призначення</th>' : '', "\n    </tr>\n");

    // Формируем строки с данными платежей
    var tableRows = monthlyPayments.map(function (payment) {
      return "\n    <tr>\n        <td class=\"big\">".concat(payment.date, "</td>\n        <td>").concat(b[payment.yur], "</td>\n        ").concat(hasKvit ? "<td>".concat(payment.kvit || '', "</td>") : '', "\n        <td class=\"big\">").concat(payment.sum.toFixedWithComma(), "</td>\n        ").concat(hasNazn ? "<td>".concat(payment.nazn || '', "</td>") : '', "\n    </tr>\n");
    }).join('');

    // Устанавливаем содержимое ячейки оплаты

    paymentCell.innerHTML = "".concat(totalPayments.toFixedWithComma(), "\n    <div class=\"descr\">\n        <table class=\"subtable\">\n            <tbody>\n                ").concat(headerRow, "\n                ").concat(tableRows, "\n            </tbody>\n        </table>\n    </div>\n        ");
  }
  row.appendChild(paymentCell);
  return totalPayments;
}
function initLS() {
  document.getElementById('maincontainer').innerHTML = "\n    <div id=header><TABLE WIDTH=100%><TR><TD ALIGN=RIGHT><B>\u0410\u0434\u0440\u0435\u0441:</B></TD><TD class='big' ALIGN=LEFT><U><I><a id='adr'>adr</a><select class='big' id='number'></select></TD>\n    <td rowsplan=2><DIV id='org' ALIGN=RIGHT><td>\n    </TR><TR><TD ALIGN=RIGHT><B>\u0424.\u0418.\u041E.:</B></TD><TD ALIGN=LEFT><U><I><div class='big' id='fio'></U></I></TD></div></TR></TABLE></DIV><DIV id='din'></div><DIV id='datetime'></div>\n    ";
  document.getElementById('number').addEventListener('change', function () {
    addStuff(this.value);
  });
  document.getElementById('adr').textContent = adr + ' / ';
  document.getElementById('org').textContent = org;
  document.title = org + ' ' + adr;
  Object.entries(ls).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      index = _ref2[0],
      value = _ref2[1];
    var option = document.createElement('option');
    option.value = index;
    option.textContent = value.kv;
    document.getElementById('number').appendChild(option);
  });
  var ind = getParam('kv');
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
  document.getElementById('number').value = ind;
}
;