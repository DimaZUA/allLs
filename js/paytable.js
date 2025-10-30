var finalDate;
function calculateDefaultDays() {
  var defaultDay = finalDate.getDate();
  var selectedMonth = document.getElementById("monthSelect").value.split("-");
  var selectedYear = parseInt(selectedMonth[0], 10);
  var selectedMonthNum = parseInt(selectedMonth[1], 10);
  var currentYear = finalDate.getFullYear();
  var currentMonth = finalDate.getMonth() + 1; // JS месяцы с 0

  var fromDay, toDay;
  if (
    selectedYear < currentYear ||
    (selectedYear === currentYear && selectedMonthNum < currentMonth)
  ) {
    // Если выбранный месяц меньше текущего -> берем 1 и последний день
    fromDay = 1;
    toDay = 31;
  } else {
    // Обычное вычисление (если месяц совпадает с текущим)
    if (defaultDay < 7) {
      fromDay = 1;
      toDay = defaultDay;
    } else {
      toDay = Math.floor((defaultDay - 1) / 7) * 7;
      fromDay = toDay - 6;
    }
  }
  document.getElementById("fromDay").value = 1;
  document.getElementById("toDay").value = 31;
}
function populateMonthSelector() {
  var monthSelect = document.getElementById("monthSelect");
  var uniqueMonths = {};

  for (var lsKey in oplat) {
    if (oplat.hasOwnProperty(lsKey)) {
      var userPayments = oplat[lsKey];
      for (var year in userPayments) {
        for (var month in userPayments[year]) {
          uniqueMonths[year + "-" + month] = true;
        }
      }
    }
  }

  var monthsArray = Object.keys(uniqueMonths);

  // ⭐ Нормализуем и сортируем даты
  monthsArray.sort(function(a, b) {
    var [yA, mA] = a.split("-");
    var [yB, mB] = b.split("-");

    mA = mA.padStart(2, "0");
    mB = mB.padStart(2, "0");

    return new Date(yA + "-" + mA + "-01") - new Date(yB + "-" + mB + "-01");
  });

  var today = finalDate.getDate();
  var indexToSelect = monthsArray.length - 1; // последний месяц

  // ⭐ Если сегодня ≤10 → выбираем предпоследний, если есть
  if (today <= 10 && monthsArray.length > 1) {
    indexToSelect = monthsArray.length - 2;
  }

  // Заполняем селектор
  for (var i = 0; i < monthsArray.length; i++) {
    var item = monthsArray[i];
    var [year, month] = item.split("-");
    var mm = month.padStart(2, "0");

    var option = document.createElement("option");
    option.value = year + "-" + mm;
    option.textContent =
      new Date(year + "-" + mm + "-01").toLocaleString("ru", { month: "long" }) +
      " " + year;

    if (i === indexToSelect) option.selected = true;

    monthSelect.appendChild(option);
  }
}

function generatePayTable() {
  var selectedMonth = document.getElementById("monthSelect").value.split("-");
  var year = parseInt(selectedMonth[0], 10);
  var month = parseInt(selectedMonth[1], 10);

  // Значения "С" и "По"
  var fromDayInput = document.getElementById("fromDay").value;
  var toDayInput = document.getElementById("toDay").value;
  var fromDay = fromDayInput ? parseInt(fromDayInput, 10) : 1; // Если не указано, с первого числа
  var maxDay = new Date(year, month, 0).getDate();
  var toDay = toDayInput ? Math.min(parseInt(toDayInput, 10), maxDay) : maxDay; // Если не указано, до конца месяца

  var tbody = document.getElementById("paytable").querySelector("tbody");
  tbody.innerHTML = "";
  var paymentsArray = [];
  for (var lsKey in oplat) {
    if (oplat.hasOwnProperty(lsKey)) {
      var userPayments = oplat[lsKey];
      var userInfo = ls[lsKey];
      if (userPayments[year] && userPayments[year][month]) {
        var payments = userPayments[year][month];
        for (var i = 0; i < payments.length; i++) {
          var payment = payments[i];
          var day = parseInt(payment.date.split(".")[0], 10);
          if (
            day >= Math.min(fromDay, toDay) &&
            day <= Math.max(fromDay, toDay)
          ) {
            paymentsArray.push({
              date: payment.date,
              kv: userInfo.kv,
              sum: payment.sum,
              kvit: payment.kvit,
              nazn: payment.nazn
            });
          }
        }
      }
    }
  }

  // Сортировка по дате и номеру квартиры
  paymentsArray.sort(function (a, b) {
    var dateA = new Date(a.date.split(".").reverse().join("-"));
    var dateB = new Date(b.date.split(".").reverse().join("-"));
    if (fromDay > toDay) return dateB - dateA; // Обратная сортировка
    //if (dateA - dateB !== 0) return dateA - dateB;
    return parseInt(a.kv, 10) - parseInt(b.kv, 10);
  });

  // Генерация таблицы
  var isLastColumnHidden =
    document.querySelector("#paytable th:nth-child(4)").style.display ===
    "none";
  for (var i = 0; i < paymentsArray.length; i++) {
    var payment = paymentsArray[i];
    var row = document.createElement("tr");
    if (payment.kv == 0) {
      row.style.backgroundColor = "lightpink";
    }
    row.innerHTML =
      "<td>" +
      payment.kv +
      "</td>" +
      "<td>" +
      payment.date +
      "</td>" +
      "<td>" +
      payment.sum.toFixed(2) +
      "</td>" +
      "<td" +
      (isLastColumnHidden ? ' style="display: none;"' : "") +
      ">" +
      highlightApartmentNumber(payment.nazn, payment.kv) +
      "</td>";
    tbody.appendChild(row);
  }
}
function initPayTable() {
document.getElementById("maincontainer").innerHTML =
  '<div id="org" align="right"></div>' +
  '<div id="filter-container">' +
    '<div class="column">' +
      '<label>Месяц:' +
        '<select id="monthSelect"></select>' +
      '</label>' +
    '</div>' +
    '<div class="column">' +
      '<label>С:' +
        '<input type="number" id="fromDay" min="1" max="31">' +
      '</label>' +
    '</div>' +
    '<div class="column">' +
      '<label>По:' +
        '<input type="number" id="toDay" min="1" max="31">' +
      '</label>' +
    '</div>' +
      buttons +
    '</div>' +
  '</div>' +
  '<div id="table-container">' +
    '<table id="paytable" class="paytable">' +
      '<thead>' +
        '<tr><td colspan="4">' +
          '<div style="text-align: center; font-family: Arial, sans-serif; font-size: 1rem;">' +
            '<strong>🔔 Шановні мешканці!</strong><br><br>' +
            'При здійсненні оплати квартплати' +
            '<strong style="color: red;"><br>обов’язково вказуйте особовий рахунок та номер квартири</strong> ' +
            'у призначенні платежу.<br><br>' +
            'Це необхідно для своєчасного та правильного зарахування коштів на вашу квартиру.<br><br>' +
            '✅ Приклад правильного заповнення призначення платежу (для квартири № 300):<br>' +
            '<span style="font-family: Courier New, monospace; background-color: #f2f2f2; padding: 4px 6px; border-radius: 4px; display: inline-block;">' +
             '<span style="font-weight: bold;">ОР:300. Іванов Іван Іванович. ' + adr + ' кв.300</span>'+
            '</span><br><br>' +
            'Дякуємо за розуміння та своєчасну сплату!' +
          '</div>' +
        '</td></tr>' +
        '<tr>' +
          '<th>Кв.</th>' +
          '<th>Дата</th>' +
          '<th>Сума</th>' +
          '<th>Призначення платежу</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody></tbody>' +
    '</table>' +
  '</div>' +
  '<div id="datetime"></div>';

  document.getElementById("datetime").innerHTML =
    "<br>Данные указаны по состоянию на <br>" +
    dt +
    " (" +
    timeAgo(dt) +
    " назад.)";
  finalDate = new Date(
    dt.split(" ")[0].split(".").reverse().join("-") + "T" + dt.split(" ")[1]
  );
  populateMonthSelector();
  calculateDefaultDays();
  generatePayTable();

  // Добавляем обработчик клика для заголовков таблицы
  var ths = document.getElementById("paytable").querySelectorAll("th");
for (var i = 0; i < ths.length; i++) {
  ths[i].addEventListener("click", function () {
    sortPayTable(this);
  });
}

  document
    .querySelector("#monthSelect")
    .addEventListener("change", generatePayTable);
  document
    .querySelector("#fromDay")
    .addEventListener("change", generatePayTable);
  document.querySelector("#toDay").addEventListener("change", generatePayTable);
  document
    .querySelector("#fromDay")
    .addEventListener("input", generatePayTable);
  document.querySelector("#toDay").addEventListener("input", generatePayTable);
}
function highlightApartmentNumber(paymentNazn, apartmentNumber) {
  if (!paymentNazn) return "";
  var pattern = "\\b" + apartmentNumber + "\\b";
  var regex = new RegExp(pattern, "g");
  var highlightedText = paymentNazn.replace(
    regex,
    '<strong style="color: #ff0000;">' + apartmentNumber + "</strong>"
  );

  // Если номер квартиры не 0 и не найден в тексте, добавить предупреждение
  if (apartmentNumber != 0 && !regex.test(paymentNazn)) {
    highlightedText +=
      ' <strong style="color: #ff0000;">Квартира не вказана</strong>';
  }
  return highlightedText;
}

// Функция для переключения полноэкранного режима
function toggleFullscreen(element, isFullscreen) {
  if (!isFullscreen) {
    // Включаем полноэкранный режим
    if (element.requestFullscreen) {
      element.requestFullscreen()["catch"](function (err) {
        console.error(
          "Ошибка при включении полноэкранного режима: " + err.message
        );
      });
    } else if (element.mozRequestFullScreen) {
      // Для Firefox
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      // Для Chrome, Safari, Opera
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      // Для IE/Edge
      element.msRequestFullscreen();
    } else {
      console.warn("Полноэкранный режим не поддерживается этим браузером.");
    }
  } else {
    // Выходим из полноэкранного режима
    if (document.exitFullscreen) {
      document.exitFullscreen()["catch"](function (err) {
        console.error(
          "Ошибка при выходе из полноэкранного режима: " + err.message
        );
      });
    } else if (document.mozCancelFullScreen) {
      // Для Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      // Для Chrome, Safari, Opera
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      // Для IE/Edge
      document.msExitFullscreen();
    } else {
      console.warn(
        "Выход из полноэкранного режима не поддерживается этим браузером."
      );
    }
  }
}


function sortPayTable(header) {
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
    var cellA =
      rowA.cells[index].getAttribute("v") || rowA.cells[index].textContent;
    var cellB =
      rowB.cells[index].getAttribute("v") || rowB.cells[index].textContent;

    // Преобразуем строки в числа, если возможно
    var valA = parseFloat(cellA.replace(/\s/g, "").replace(",", "."));
    var valB = parseFloat(cellB.replace(/\s/g, "").replace(",", "."));

    // Если значение не является числом, то оно будет равно NaN
    // В таком случае, используем сам текст
    if (isNaN(valA)) valA = cellA;
    if (isNaN(valB)) valB = cellB;

    // Сортировка с учетом числовых значений или текста
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
    //tbody.appendChild(row);
  });
}