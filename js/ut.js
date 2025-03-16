//var host='https://dimazua.github.io/allLs/data/';
host = 'data/';
var monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь","янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
function initPosters() {
  var sidebar = document.querySelector('.sidebar'); // Предположим, что у панели есть класс 'sidebar'

  document.querySelectorAll('.poster').forEach(function (cell) {
    var tooltip = cell.querySelector('.descr');
    var hideTimeout;
    cell.addEventListener('mouseenter', function (event) {
      if (!isCursorOverSidebar(event, sidebar)) {
        clearTimeout(hideTimeout);
        tooltip.style.display = 'block';
        positionTooltip(event, tooltip);
      }
    });
    cell.addEventListener('mousemove', function (event) {
      if (!isCursorOverSidebar(event, sidebar)) {
        tooltip.style.display = 'block';
        positionTooltip(event, tooltip);
      } else {
        tooltip.style.display = 'none'; // Прячем подсказку, если над панелью
      }
    });
    cell.addEventListener('mouseleave', function () {
      hideTimeout = setTimeout(function () {
        return tooltip.style.display = 'none';
      }, 200);
    });
  });
}

// Функция для проверки, находится ли курсор над боковой панелью
function isCursorOverSidebar(event, sidebar) {
  if (!sidebar) return false;
  var _sidebar$getBoundingC = sidebar.getBoundingClientRect(),
    left = _sidebar$getBoundingC.left,
    top = _sidebar$getBoundingC.top,
    right = _sidebar$getBoundingC.right,
    bottom = _sidebar$getBoundingC.bottom;
  return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
}
function positionTooltip(event, tooltip) {
  var mouseX = event.clientX,
    mouseY = event.clientY;
  var tooltipWidth = tooltip.offsetWidth,
    tooltipHeight = tooltip.offsetHeight;
  var _window = window,
    windowWidth = _window.innerWidth,
    windowHeight = _window.innerHeight;
  var tooltipX = mouseX + 10; // Отступ справа от курсора
  var tooltipY = mouseY + 10; // Отступ снизу от курсора

  // Проверка, чтобы подсказка не выходила за правый край окна
  if (tooltipX + tooltipWidth > windowWidth) {
    tooltipX = mouseX - tooltipWidth - 10; // Перемещаем подсказку влево
  }

  // Проверка, чтобы подсказка не выходила за левый край окна
  if (tooltipX < 0) {
    tooltipX = 10; // Ограничиваем минимальным отступом
  }

  // Проверка, чтобы подсказка не выходила за нижний край окна
  if (tooltipY + tooltipHeight > windowHeight) {
    tooltipY = mouseY - tooltipHeight - 10; // Перемещаем подсказку вверх
  }

  // Проверка, чтобы подсказка не выходила за верхний край окна
  if (tooltipY < 0) {
    tooltipY = 10; // Ограничиваем минимальным отступом
  }

  // Устанавливаем позицию подсказки
  tooltip.style.left = "".concat(tooltipX, "px");
  tooltip.style.top = "".concat(tooltipY, "px");
}
Number.prototype.toFixedWithComma = function () {
  var decimals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(this);
};
function loadScriptFromHtml(scriptName, callback) {
  var preloader = document.getElementById('preloader');
  var hasLoaded = false; // Флаг для отслеживания успешной загрузки
  var preloaderTimeout;

  // Показываем прелоадер, если загрузка длится больше 1.5 секунд
  preloaderTimeout = setTimeout(function () {
    preloader.style.display = 'flex';
  }, 1500);

  // Функция загрузки скрипта
  function loadScript() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = host + scriptName; // Формируем путь

      script.async = true;
      script.onload = function () {
        return resolve();
      }; // Успешная загрузка
      script.onerror = function () {
        return reject();
      }; // Ошибка загрузки

      document.head.appendChild(script);
    });
  }

  // Загружаем скрипт
  loadScript().then(function () {
    if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

    console.log("\u0421\u043A\u0440\u0438\u043F\u0442 ".concat(scriptName, " \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u0441 \u0445\u043E\u0441\u0442\u0430: ").concat(host));
    clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если загрузка успешна
    preloader.style.display = 'none'; // Скрываем прелоадер

    hasLoaded = true; // Устанавливаем флаг успешной загрузки

    if (callback) callback(); // Вызов коллбэка, если он был передан
  }).catch(function (error) {
    console.error('Ошибка при загрузке скрипта:', error);
    console.error('Сообщение ошибки:', error.message);
    console.error('Стек вызовов:', error.stack);
    clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если произошла ошибка
    preloader.style.display = 'none'; // Скрываем прелоадер
  });
}
;
// Функция для выбора правильной формы слова в зависимости от числа
function okon(number, form1, form2, form3) {
  var lastDigit = number % 10;
  var lastTwoDigits = number % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return form2; // Если заканчивается на 1 (кроме 11)
  } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return form3; // Если заканчивается на 2, 3 или 4 (кроме 12, 13, 14)
  } else {
    return form1; // Все остальные случаи (0, 5, 6, 7, 8, 9 и т.д.)
  }
}

// Функция для вычисления времени "сколько времени назад"
function timeAgo(dateString) {
  var now = new Date(); // Текущая дата и время
  var pastDate = new Date(dateString.replace(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6')); // Преобразуем строку в формат ISO 8601

  var diffInMs = now - pastDate; // Разница в миллисекундах
  var diffInSeconds = Math.floor(diffInMs / 1000); // Переводим в секунды
  var diffInMinutes = Math.floor(diffInSeconds / 60); // Переводим в минуты
  var diffInHours = Math.floor(diffInMinutes / 60); // Переводим в часы
  var diffInDays = Math.floor(diffInHours / 24); // Переводим в дни

  var result = '';

  // Используем функцию okon для выбора правильных окончаний
  if (diffInDays > 0) {
    result += "".concat(diffInDays, " ").concat(okon(diffInDays, 'дней', 'день', 'дня'), " ");
  }
  if (diffInHours % 24 > 0) {
    result += "".concat(diffInHours % 24, " ").concat(okon(diffInHours % 24, 'часов', 'час', 'часа'), " ");
  }
  if (diffInMinutes % 60 > 0) {
    result += "".concat(diffInMinutes % 60, " ").concat(okon(diffInMinutes % 60, 'минут', 'минута', 'минуты'), " ");
  }
  return result || 'Менее минуты назад';
}
function setParam(paramName, paramValue) {
  // Извлекаем параметры URL
  var urlParams = new URLSearchParams(window.location.search);

  // Удаляем старый параметр, если он существует
  urlParams.delete(paramName);

  // Добавляем новый параметр
  urlParams.append(paramName, paramValue);

  // Формируем новый URL
  var newUrl = "".concat(window.location.pathname, "?").concat(urlParams.toString());

  // Обновляем адресную строку
  history.replaceState(null, '', newUrl);

  // Сохраняем параметр в localStorage с ключом 'last_paramName'
  localStorage.setItem("last_".concat(paramName), paramValue);
}
function getParam(paramName) {
  // Проверяем поддержку URLSearchParams
  if (typeof URLSearchParams === 'function') {
    // Извлекаем параметры из URL
    var urlParams = new URLSearchParams(window.location.search);

    // Проверяем, есть ли параметр в URL
    if (urlParams.has(paramName)) {
      return urlParams.get(paramName); // Если параметр найден в URL, возвращаем его значение
    }
  } else {
    // Если URLSearchParams не поддерживается, используем альтернативу
    var query = window.location.search.substring(1); // Убираем "?" в начале строки
    var params = query.split('&'); // Разбиваем строку на пары ключ-значение
    for (var i = 0; i < params.length; i++) {
      var pair = params[i].split('=');
      if (decodeURIComponent(pair[0]) === paramName) {
        return decodeURIComponent(pair[1]); // Возвращаем значение параметра
      }
    }
  }

  // Если параметр не найден в URL, пытаемся найти его в localStorage
  var storedValue = localStorage.getItem("last_" + paramName);
  if (storedValue) {
    return storedValue; // Возвращаем значение из localStorage
  }

  // Если параметр не найден ни в URL, ни в localStorage, возвращаем null
  return null;
}

// Функция для преобразования номера месяца в название
function getMonthName(month) {
 var monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
  return monthNames[month - 1];
}

function formatDate(date, format) {
    if (!format) format="YYYY-MM-DD"
    var day = String(date.getDate());
    var month = String(date.getMonth() + 1);
    var year = date.getFullYear();
    var yearShort = String(year).slice(-2);  // Последние две цифры года

    // Заменяем в строке формата соответствующие компоненты
    return format
        .replace('dd', day.padStart(2, '0'))  // Двузначный день
        .replace('d', day)  // Одиночный день
        .replace('mmmm', monthNames[month-1])
        .replace('mmm', monthNames[month*1+11])
        .replace('mm', month.padStart(2, '0'))
        .replace('m', month)
        .replace('yyyy', year)
        .replace('yy', yearShort)
        .replace('y', yearShort)
        .replace('DD', day.padStart(2, '0'))  // Двузначный день
        .replace('D', day)  // Одиночный день
        .replace('MMMM', monthNames[month-1])
        .replace('MMM', monthNames[month*1+11])
        .replace('MM', month.padStart(2, '0'))
        .replace('M', month)
        .replace('YYYY', year)
        .replace('YY', yearShort)
        .replace('Y', yearShort)
}

function fillMissingDates(nach) {
  for (var id in nach) {
    var years = [];
    for (var key in nach[id]) {
      if (nach[id].hasOwnProperty(key)) {
        years.push(Number(key));
      }
    }
    years.sort(function(a, b) {
      return a - b;
    });
    var minYear = years[0];
    var maxYear = years[years.length - 1];
    
    // Найти последний заполненный месяц в последнем году
    var lastYearMonths = [];
    for (var monthKey in nach[id][maxYear]) {
      if (nach[id][maxYear].hasOwnProperty(monthKey)) {
        lastYearMonths.push(Number(monthKey));
      }
    }
    var lastMonth = Math.max.apply(null, lastYearMonths);

    // Пройтись по всем годам от минимального до последнего года
    for (var year = minYear; year <= maxYear; year++) {
      if (!nach[id][year]) {
        nach[id][year] = {};
      }

      // Пройтись по всем месяцам от 1 до 12
      var maxMonth = (year === maxYear) ? lastMonth : 12;
      for (var month = 1; month <= maxMonth; month++) {
        if (!nach[id][year][month]) {
          nach[id][year][month] = { 1: 0 };
        }
      }
    }

    // Убедиться, что ключи отсортированы
    var sortedNach = {};
    var sortedYears = Object.keys(nach[id]).sort(function(a, b) {
      return a - b;
    });
    for (var i = 0; i < sortedYears.length; i++) {
      var year = sortedYears[i];
      sortedNach[year] = {};
      var sortedMonths = Object.keys(nach[id][year]).sort(function(a, b) {
        return a - b;
      });
      for (var j = 0; j < sortedMonths.length; j++) {
        var month = sortedMonths[j];
        sortedNach[year][month] = nach[id][year][month];
      }
    }
    nach[id] = sortedNach;
  }
}


function isMonth(sdat, monthOffset) {
  monthOffset = (typeof monthOffset === 'undefined') ? 0 : monthOffset;
    var currentDate = new Date();

    // Получаем первый день текущего месяца
    var currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Если monthOffset не равен 0, сдвигаем текущий месяц на нужное количество месяцев
    var targetMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);

    // Преобразуем sdat в первый день месяца той же даты
    var sdatStartOfMonth = new Date(sdat.getFullYear(), sdat.getMonth(), 1);

    // Проверяем, совпадает ли месяц и год с учетом сдвига
    return sdatStartOfMonth.getTime() === targetMonthStart.getTime();
}


// Функция для преобразования числа Год*12 + Месяц в дату (1-е число месяца)
function convertToDate(monthNumber) {
    if (!monthNumber) return 0;
    var year = Math.floor(monthNumber / 12); // Получаем год
    var month = monthNumber % 12; // Получаем месяц (от 0 до 11, поэтому добавим 1 для правильной даты)
    if (month === 0) {
        year -= 1;
        month = 12; // Январь следующего года
    }
    return new Date(year, month-1, 1); // Возвращаем 1-е число месяца
}

// Дебаунс-функция для уменьшения количества вызовов
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function showMessage(messageText) {
    let messageElement = document.getElementById('message');
    messageElement.textContent = messageText; // Устанавливаем текст сообщения
    messageElement.style.display = 'block';   // Показываем сообщение
    
    // Через 3 секунды скрываем сообщение
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Показываем сообщение "Ключ скопирован"
        showMessage('Ключ скопирован в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка при копировании: ', err);
    });
}
    // Функция для форматирования чисел (с двумя знаками после запятой)
    const formatNumber = (num) => {
      return num.toFixed(2).replace(/\.00$/, "")*1;
    };

async function exportTableToExcel() {
    const mainContainer = document.getElementById("maincontainer");

    if (!mainContainer) {
        showMessage("Контейнер с id='maincontainer' не найден");
        return;
    }

    // Ищем таблицу с id "banktable", "paytable" или "main"
const tables = Array.from(mainContainer.querySelectorAll("#banktable, #paytable, .main, #main"))
    .filter(table => window.getComputedStyle(table).display !== 'none');

const table = tables.length > 0 ? tables[0] : null;

    if (!table) {
        showMessage("Таблица не найдена");
        return;
    }

    function filterRows(rows) {
        return rows.filter(row => {
            const rowClasses = row.className.split(' ');
            return !rowClasses.includes('clone') && !rowClasses.includes('itog');
        });
    }

    let rowsData = [];
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    if (thead) {
        const headers = Array.from(thead.querySelectorAll('th')).map(th => th.innerText.trim());
        rowsData.push(headers);
    }

    if (tbody) {
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const filteredRows = filterRows(rows);
        filteredRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText);
            rowsData.push(cells);
        });
    }

    if (rowsData.length <= 1) {
        showMessage("Нет данных");
        return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    // Функция для определения типа данных
    function parseCellValue(value) {
        let trimmedValue = value.replace(/\u00A0/g, ' ').trim(); // Заменяем &nbsp; на обычный пробел

        // Если значение "0,00" или "0.00", делаем ячейку пустой
        if (trimmedValue === "0,00" || trimmedValue === "0.00") {
            return null;
        }

        // Регулярное выражение для чисел (учитывает пробелы, запятые, точки)
        const numberPattern = /^[+-]?\d{1,3}([ \u00A0\d]*)?([.,]\d+)?$/;

        if (numberPattern.test(trimmedValue) && !trimmedValue.startsWith('0') && trimmedValue !== "0") {
            // Убираем все пробелы (включая неразрывные) и заменяем запятую на точку
            let normalizedNumber = trimmedValue.replace(/[\s\u00A0]+/g, '').replace(',', '.');

            let parsedNumber = parseFloat(normalizedNumber);

            if (!isNaN(parsedNumber)) {
                return parsedNumber;
            }
        }

        // Проверяем, является ли значение датой
        const date = new Date(trimmedValue);
        if (!isNaN(date.getTime())) {
            return date;
        }

        return value;
    }

    rowsData.forEach(row => {
        const excelRow = row.map(cell => parseCellValue(cell));
        ws.addRow(excelRow);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

// Получаем код дома и код действия
const homeCode = getParam("homeCode"); // возвращает код дома
const actionCode = getParam("actionCode"); // возвращает код действия

// Находим дом с нужным кодом
const home = homes.find(home => home.code === homeCode);
    
    
    const fileName = generateFileName(home, actionCode);
    link.download = fileName;
    link.click();

    showMessage(`Файл ${fileName} сохранен в папку Загрузки`);



function getMonthYear(actionCode) {
    let monthYear = "";

    if (actionCode === 'list') {
        const monthInput = document.getElementById("end-date");
        const dateValue = monthInput.value; // например, "2023-07"
        if (dateValue) {
            const [year, month] = dateValue.split("-");
            monthYear = `${month.padStart(2, '0')}.${year}`;
        }
    } else if (actionCode === 'payments') {
        const selectMonth = document.getElementById("monthSelect");
        const selectedOption = selectMonth.value; // например, "2021-7"
        if (selectedOption) {
            const [year, month] = selectedOption.split("-");
            monthYear = `${month.padStart(2, '0')}.${year}`;
        }
    } else if (actionCode === 'bank') {
        const dateInput = document.getElementById("toDate");
        const dateValue = dateInput.value; // например, "2023-07-15"
        if (dateValue) {
            const month = dateValue.split("-")[1]; // Получаем только месяц
            const year = dateValue.split("-")[0];
            monthYear = `${month.padStart(2, '0')}.${year}`;
        }
    }

    return monthYear;
}

// Функция для генерации имени файла
function generateFileName(home, actionCode) {
    let name = home.name;

    // Проверяем наличие текста в кавычках
    const match = name.match(/"([^"]+)"/); // ищем текст в кавычках

    if (match) {
        // Если текст в кавычках есть, берем первые три буквы из него
        name = match[1].substring(0, 3);
    } else {
        // Иначе убираем "ЖК" или "ОСББ" и пробелы в начале
        name = name.replace(/^(ЖК|ОСББ)\s*/i, '').substring(0, 3);
    }

    // Добавляем код действия в имя файла
    let actionSuffix = "";
    if (actionCode === 'list') {
        actionSuffix = "_ЛС_";
    } else if (actionCode === 'payments') {
        actionSuffix = "_оплаты_";
    } else if (actionCode === 'bank') {
        actionSuffix = "_банк_";
    }

    // Получаем месяц и год в нужном формате
    const monthYear = getMonthYear(actionCode);

    return `${name}${actionSuffix}${monthYear}.xlsx`; // имя файла с расширением .xlsx
}

}