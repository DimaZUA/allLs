//var host='https://dimazua.github.io/allLs/data/';
const buttons=`
<div class="buttons-container">
  <button onclick="exportTableToExcel('download')" class="xls-button" title="Скачать в Excel">
    <img src="img/xlsdownload.png" alt="Excel Icon" class="xls-icon">
  </button>
  <button onclick="exportTableToExcel('clipboard')" class="xls-button" title="Копировать">
    <img src="img/copy.svg" alt="Copy Icon" class="xls-icon">
  </button>
  <button onclick="captureAndCopy()" class="xls-button" title="Скриншот таблицы">
    <img src="img/screenshot.png" alt="Screenshot Icon" class="xls-icon">
  </button>
</div>
`;
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


// Функция для извлечения скрытого текста из <div class="descr">
function extractHiddenText(td) {
    const hiddenDiv = td.querySelector('.descr');
    if (!hiddenDiv) return '';

    let text = '';

    // Если внутри есть просто текст
    if (hiddenDiv.textContent.trim()) {
        text += hiddenDiv.textContent.trim();
    }

    // Если внутри есть таблица
    const subTable = hiddenDiv.querySelector('.subtable');
    if (subTable) {
        const rows = Array.from(subTable.querySelectorAll('tr'));
        text += '\n\n' + rows.map(row => {
            const cols = Array.from(row.querySelectorAll('th, td')).map(cell => cell.innerText.trim());
            return cols.join(' | ');
        }).join('\n');
    }

    return text.trim();
}

// Функция для получения месяца и года в формате ММ.ГГГГ
function getMonthYear(actionCode) {
    let monthYear = "";

    if (actionCode === 'list') {
        const monthInput = document.getElementById("end-date");
        const dateValue = monthInput.value;
        if (dateValue) {
            const [year, month] = dateValue.split("-");
            monthYear = `${month.padStart(2, '0')}.${year}`;
        }
    } else if (actionCode === 'payments') {
        const selectMonth = document.getElementById("monthSelect");
        const selectedOption = selectMonth.value;
        if (selectedOption) {
            const [year, month] = selectedOption.split("-");
            monthYear = `${month.padStart(2, '0')}.${year}`;
        }
    } else if (actionCode === 'bank') {
        const dateInput = document.getElementById("toDate");
        const dateValue = dateInput.value;
        if (dateValue) {
            const month = dateValue.split("-")[1];
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
    const match = name.match(/"([^"]+)"/);

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

    return `${name}${actionSuffix}${monthYear}.xlsx`;
}

function isElementVisible(el) {
    while (el) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        el = el.parentElement;
    }
    return true;
}



function parseCellValue(value) {
    let trimmedValue = value.replace(/\u00A0/g, ' ').trim();

    // Списки месяцев
    const monthNamesUA = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
                          "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    
    const monthNamesRU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                          "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    
    const monthShortRU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн",
                          "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

    // Проверка на формат "Месяц Год"
    const monthYearPattern = /^([А-ЯІЇЄа-яієї]+)\s(\d{4})$/iu;
    let match = trimmedValue.match(monthYearPattern);

    if (match) {
        let monthName = match[1].toLowerCase(); // Делаем регистр независимым
        let year = parseInt(match[2], 10);

        // Ищем месяц в списках
        let monthIndex = monthNamesUA.findIndex(m => m.toLowerCase() === monthName);
        if (monthIndex === -1) {
            monthIndex = monthNamesRU.findIndex(m => m.toLowerCase() === monthName);
        }
        if (monthIndex === -1) {
            monthIndex = monthShortRU.findIndex(m => m.toLowerCase() === monthName);
        }

        if (monthIndex !== -1) {
            // Создаём дату в UTC
            return new Date(Date.UTC(year, monthIndex, 1));
        }
    }

    // Если это "0,00" или "0.00", возвращаем null
    if (trimmedValue === "0,00" || trimmedValue === "0.00"  || trimmedValue === "0"  || trimmedValue === "0.0" || trimmedValue === "0,0") {
        return 0;
    }

    // Проверка на числа
    const numberPattern = /^[+-]?\d{1,3}([ \u00A0\d]*)?([.,]\d+)?$/;

    if (numberPattern.test(trimmedValue) && !trimmedValue.startsWith('0') && trimmedValue !== "0") {
        let normalizedNumber = trimmedValue.replace(/[\s\u00A0]+/g, '').replace(',', '.');
        let parsedNumber = parseFloat(normalizedNumber);
        if (!isNaN(parsedNumber)) return parsedNumber;
    }

    // Проверка на дату в формате DD.MM.YYYY
const datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/;
match = trimmedValue.match(datePattern);

if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1;  // Месяцы начинаются с 0 (январь = 0)
    let year = parseInt(match[3], 10);

    // Если год двухзначный, добавляем 2000
    if (year < 100) {
        year += 2000;
    }

    // Проверяем, что день существует в месяце (например, 31 февраля — это ошибка)
    let date = new Date(year, month, day);

    // Если дата невалидна (например, 31 февраля), создаём некорректную дату
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        // Преобразуем в UTC
        return new Date(Date.UTC(year, month, day));
    }
}
    // Проверка на дату с помощью конструктора Date (например, для форматов MM/DD/YYYY)
    const date = new Date(trimmedValue);

    if (!isNaN(date.getTime())) {
        // Преобразуем обычную дату в UTC и возвращаем
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    }

    // Если это не дата и не число, возвращаем исходное значение
    return value;
}





function handleHeaders(tableCopy, ws) {
    const thead = tableCopy.querySelector('thead');
    if (thead) {
        const headerRows = Array.from(thead.querySelectorAll('tr'));

        // Определяем, с какой строки начинать новый заголовок
        let startRowIndex = ws.rowCount + 1; 

        // Добавляем пустую строку перед новым заголовком, если это не первая таблица
        if (ws.rowCount > 0) {
            ws.addRow([]);
            startRowIndex++;
        }

        // Массив для отслеживания занятых ячеек по колонкам
        const occupiedCells = [];

        headerRows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('td, th'));

            let currentColIndex = 0; // Индекс текущей колонки

            cells.forEach((cell) => {
                // Пропускаем занятые ячейки
                while (occupiedCells[rowIndex] && occupiedCells[rowIndex][currentColIndex]) {
                    currentColIndex++;
                }

                const colspan = parseInt(cell.getAttribute('colspan')) || 1;
                const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;

                // Записываем значение в Excel
                const cellValue = cell.innerText.trim();
                const excelCell = ws.getCell(startRowIndex + rowIndex, currentColIndex + 1);
                excelCell.value = cellValue;

                // Отмечаем занятые ячейки
                for (let i = 0; i < colspan; i++) {
                    if (!occupiedCells[rowIndex]) {
                        occupiedCells[rowIndex] = [];
                    }
                    occupiedCells[rowIndex][currentColIndex + i] = true;
                }

                if (rowspan > 1) {
                    for (let i = 1; i < rowspan; i++) {
                        if (!occupiedCells[rowIndex + i]) {
                            occupiedCells[rowIndex + i] = [];
                        }
                        occupiedCells[rowIndex + i][currentColIndex] = true;
                    }
                }

                // Объединяем ячейки, если есть colspan и rowspan
                if (colspan > 1) {
                    ws.mergeCells(startRowIndex + rowIndex, currentColIndex + 1, startRowIndex + rowIndex, currentColIndex + colspan);
                }
                if (rowspan > 1) {
                    ws.mergeCells(startRowIndex + rowIndex, currentColIndex + 1, startRowIndex + rowIndex + rowspan - 1, currentColIndex + 1);
                }

                // Двигаемся к следующей колонке
                currentColIndex++;
            });
        });
    }
}


async function exportTableToExcel(action = 'download') {
    const mainContainer = document.getElementById("maincontainer");

    if (!mainContainer) {
        showMessage("Контейнер с id='maincontainer' не найден");
        return;
    }

    // Ищем все видимые таблицы
    const tables = Array.from(mainContainer.querySelectorAll("#banktable, #paytable, .main, #main"))
        .filter(el => {
            while (el) {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    return false;
                }
                el = el.parentElement;
            }
            return true;
        });

    if (tables.length === 0) {
        showMessage("Нет видимых таблиц");
        return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    // Обрабатываем таблицы
    tables.forEach((table) => {
        // Создаем копию таблицы, чтобы не модифицировать оригинальную
        const tableCopy = table.cloneNode(true);

        // Удаляем все элементы .descr из копии
        const descrElements = tableCopy.querySelectorAll('.descr');
        descrElements.forEach(el => el.remove());

        // Обработка заголовков таблицы с учетом colspan и rowspan
        handleHeaders(tableCopy, ws);

        // Извлекаем данные из строк таблицы
        handleRows(tableCopy, ws);
    });
if (action === 'download') {
    // Генерация и сохранение файла Excel
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // Получаем код дома и код действия
    const homeCode = getParam("homeCode");
    const actionCode = getParam("actionCode");
    const home = homes.find(home => home.code === homeCode);

    const fileName = generateFileName(home, actionCode);
    link.download = fileName;
    link.click();

    showMessage(`Файл ${fileName} сохранен в папку Загрузки`);
}else if (action === 'clipboard') {
    // Копирование данных в буфер обмена
    let clipboardData = "";

    // Получаем данные из строк рабочего листа (ws)
    const rows = ws.getRows(1, ws.rowCount); // Получаем все строки из листа

    rows.forEach(row => {
        const rowData = [];
        
        // Проходим по каждой ячейке в строке
row.eachCell((cell, colNumber) => {
    // Проверяем, является ли ячейка объединенной
    if (cell.isMerged) {
        // Для объединенных ячеек добавляем пустые значения в остальные ячейки объединенной области
        if (rowData[colNumber - 1] === undefined) {
            rowData[colNumber - 1] = parseCellValue1(cell.text);
        }
    } else {
        rowData[colNumber - 1] = parseCellValue1(cell.text || ""); // Добавляем обработанное значение ячейки
    }
});

        // Формируем строку для буфера обмена
        clipboardData += rowData.join("\t") + "\n"; // Разделение ячеек табуляцией
    });

    try {
        await navigator.clipboard.writeText(clipboardData);
        showMessage("Данные скопированы в буфер обмена!");
    } catch (err) {
        showMessage("Не удалось скопировать данные в буфер обмена.");
    }
}
}


function handleRows(tableCopy, ws) {
    const tbody = tableCopy.querySelector('tbody');

    if (tbody) {
        const rows = Array.from(tbody.querySelectorAll('tr')); // Массив строк из tbody
        let colorIndex = 0; // Индекс для смены цветов
        const colors = ["FFFF99", "99FF99", "99CCFF", "FF9999", "CC99FF", "FFCC99", "CCCCCC"]; // Набор цветов
        let rowIndex=0;
        rows.forEach((row) => {
            let rowData = []; // Данные текущей строки
            let nextRowDataArray = []; // Данные всех следующих строк .paysubtable

            // Перебираем все ячейки в строке
            const cells = Array.from(row.querySelectorAll('td'));

            cells.forEach((cell, cellIndex) => {
                const paysubtable = cell.querySelector('.paysubtable'); // Находим .paysubtable в ячейке

                if (paysubtable) {
                    const nestedRows = paysubtable.querySelectorAll('tr');

                    if (nestedRows.length > 0) {
                        // Добавляем первую строку вложенной таблицы в текущую строку
                        const firstNestedRow = nestedRows[0];
                        const firstNestedCells = firstNestedRow.querySelectorAll('td');
                        rowData.push(firstNestedCells[1].innerText.trim());

                        // Запоминаем индекс столбца, куда вставили значение
                        const paySubtableColumnIndex = rowData.length - 1;

                        // Обрабатываем все строки кроме первой
                        nestedRows.forEach((nestedRow, nestedRowIndex) => {
                            if (nestedRowIndex > 0) {
                                const nestedCells = nestedRow.querySelectorAll('td');
                                const nextRowData = Array(rowData.length).fill(""); // Заполняем пустыми ячейками
                                nextRowData[paySubtableColumnIndex] = nestedCells[1].innerText.trim();
                                nextRowDataArray.push(nextRowData);
                            }
                        });
                    }
                } else {
                    if (cell.closest('.paysubtable') == null) {
                        rowData.push(cell.innerText.trim());
                    }
                }
            });

            if (rowData.length) {
                // Обрабатываем основную строку
                const excelRow = rowData.map(cell => parseCellValue(cell));
                ws.addRow(excelRow);
                rowIndex++;

                // Обрабатываем все строки из nextRowDataArray
                nextRowDataArray.forEach(nextRowData => {
                    const excelNextRowData = nextRowData.map(cell => parseCellValue(cell));
                    ws.addRow(excelNextRowData);
                    rowIndex++;
                });

            }
        });
    }
}

function parseCellValue1(value) {
    // Если значение является числом и не равно 0, пропускаем дальнейшую обработку
    if (typeof value === 'number') {
        return value.toString().replace('.', ','); // Заменяем точку на запятую для чисел
    }

    // Проверяем, является ли значение числом (и не 0) для строковых значений
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
        return value.replace('.', ','); // Заменяем точку на запятую только для чисел
    }

    // Проверка, является ли значение валидной датой
    const trimmedValue = value.trim();
    const date = new Date(trimmedValue);

    // Проверка на валидную дату
    if (!isNaN(date.getTime()) && isNaN(parseFloat(trimmedValue))) {
        const currentYear = new Date().getFullYear();
        const minYear = 2000;
        const maxYear = currentYear + 10;

        // Проверяем, что год в пределах от 2000 до текущего года + 10
        if (date.getUTCFullYear() >= minYear && date.getUTCFullYear() <= maxYear) {
            // Преобразуем в UTC и форматируем в DD.MM.YYYY
            const day = String(date.getUTCDate()).padStart(2, '0');  // Делаем день двузначным
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');  // Месяцы начинаются с 0, поэтому +1
            const year = date.getUTCFullYear();

            // Возвращаем дату в формате DD.MM.YYYY
            return `${day}.${month}.${year}`;
        }
    }

    // Если не дата или дата вне диапазона, возвращаем исходное значение
    return value;
}

function captureAndCopy() {
    const mainContainer = document.getElementById("maincontainer");
    const tables = Array.from(mainContainer.querySelectorAll("#banktable, #paytable, .main, #main"))
      .filter(el => {
        while (el) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          el = el.parentElement;
        }
        return true;
      });

    tables.forEach(table => {
      // Находим родительский элемент таблицы
      const parentElement = table.parentElement;

      // Создаем скриншот родительского элемента
      html2canvas(parentElement, {
        onrendered: function(canvas) {
          canvas.toBlob(blob => {
            // Проверяем поддержку Clipboard API
            if (navigator.clipboard && window.createImageBitmap) {
              navigator.clipboard.write([new ClipboardItem({
                'image/png': blob
              })]).then(() => {
                showMessage('Скриншот родительского элемента таблицы скопирован в буфер обмена');
              }).catch(err => {
                console.error('Ошибка при копировании в буфер обмена', err);
              });
            } else {
              showMessage('Ваш браузер не поддерживает эту функцию');
            }
          });
        }
      });
    });
}

