//var host='https://dimazua.github.io/allLs/data/';
function waitHtml2Canvas() {
    return new Promise(resolve => {
        if (typeof html2canvas === "function") {
            resolve();
            return;
        }

        // ждём появления html2canvas
        const interval = setInterval(() => {
            if (typeof html2canvas === "function") {
                clearInterval(interval);
                resolve();
            }
        }, 30);
    });
}

async function initButtons() {
    // 1. ждем библиотеку
    await waitHtml2Canvas();

    // 2. проверяем canvas
    const canvasOK = await testCanvasReady();
    console.log("canvasOK:", canvasOK);

    // 3. формируем переменную buttons
    buttons = buildButtonsHtml(canvasOK);
}

function testCanvasReady() {
    return new Promise(resolve => {
        const test = document.createElement("div");
        test.style.width = "30px";
        test.style.height = "15px";
        test.style.position = "absolute";
        test.style.left = "-9999px";
        test.innerText = "t";
        document.body.appendChild(test);

        html2canvas(test, { scale: 1 })
            .then(canvas => {
                document.body.removeChild(test);
                resolve(canvas instanceof HTMLCanvasElement);
            })
            .catch(() => {
                document.body.removeChild(test);
                resolve(false);
            });
    });
}


let CAN_SHARE_IMAGE = canShareImageFiles();

function canShareImageFiles() {
    if (!isMobile()) return false;
    if (!navigator.share || !navigator.canShare) return false;

    try {
        const testFile = new File(
            [new Blob(["x"], { type: "text/plain" })],
            "test.txt",
            { type: "text/plain" }
        );

        return navigator.canShare({ files: [testFile] });
    } catch (e) {
        return false;
    }
}



function buildButtonsHtml(canvasOK) {
    let thirdButton = "";

    if (canvasOK) {
        if (isMobile() && CAN_SHARE_IMAGE) {
            thirdButton =
                '  <button onclick="captureAndShare()" class="xls-button" title="Поделиться">\n' +
                '    <img src="img/share.png" class="xls-icon">\n' +
                '  </button>\n';
        } else {
            thirdButton =
                '  <button onclick="captureAndCopy()" class="xls-button" title="Скриншот">\n' +
                '    <img src="img/screenshot.png" class="xls-icon">\n' +
                '  </button>\n';
        }
    }

    return (
        '\n<div class="buttons-container">\n' +
        '  <button onclick="exportTableToExcel(\'download\')" class="xls-button" title="Скачать в Excel">\n' +
        '    <img src="img/xlsdownload.png" class="xls-icon">\n' +
        '  </button>\n' +
        '  <button onclick="exportTableToExcel(\'clipboard\')" class="xls-button" title="Копировать">\n' +
        '    <img src="img/copy.svg" class="xls-icon">\n' +
        '  </button>\n' +
        thirdButton +
        '</div>\n'
    );
}



var buttons='';
initButtons();

host = "data/";
var monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек"
];
// ================================================
// УСТОЙЧИВАЯ ФУНКЦИЯ ПОЗИЦИОНИРОВАНИЯ TOOLTIP
// ================================================
function safePositionTooltip(event, tooltip) {
  const p = event.touches ? event.touches[0] : event;
  if (!p || p.clientX == null || p.clientY == null) return;

  const mouseX = p.clientX;
  const mouseY = p.clientY;

  requestAnimationFrame(() => {
    const rect = tooltip.getBoundingClientRect();
    const tw = rect.width;
    const th = rect.height;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const offset = 14; // используем только для “право+низ”

    let x, y;

    // --------------------------
    // 1. Определяем горизонталь
    // --------------------------
    const fitsRight = mouseX + tw < vw;
    if (fitsRight) {
      x = mouseX;                 // без смещения
    } else {
      x = mouseX - tw;            // слева
    }

    // --------------------------
    // 2. Определяем вертикаль
    // --------------------------
    const fitsBottom = mouseY + th < vh;
    if (fitsBottom) {
      y = mouseY;                 // без смещения
    } else {
      y = mouseY - th;            // сверху
    }

    // ----------------------------------------------
    // 3. Если мы в правом-нижнем секторе → смещаем
    // ----------------------------------------------
    if (fitsRight && fitsBottom) {
      x += offset;
      y += offset;
    }

    // ----------------------------------------------
    // 4. Страховка от выхода за края
    // ----------------------------------------------
    x = Math.max(4, Math.min(x, vw - tw - 4));
    y = Math.max(4, Math.min(y, vh - th - 4));

    tooltip.style.left = x + "px";
    tooltip.style.top  = y + "px";
  });
}






// ================================================
// ОСНОВНАЯ ФУНКЦИЯ
// ================================================
function initPosters() {
  const sidebar = document.querySelector(".sidebar");
  const HOVER_DELAY = 700;
  const LONGPRESS_DELAY = 750;

const isTouch =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0;

  document.querySelectorAll(".poster").forEach(cell => {

    const tooltip = cell.querySelector(".descr");
    if (!tooltip) return;

    tooltip.addEventListener("click", e => e.stopPropagation());
    tooltip.addEventListener("mousedown", e => e.stopPropagation());

    let hoverTimer = null;
    let longPressTimer = null;
    let longPressFired = false;

    // =============================
    // DESKTOP MODE
    // =============================
    if (!isTouch) {

      cell.addEventListener("mouseenter", e => {
        if (isCursorOverSidebar(e, sidebar)) return;

        hoverTimer = setTimeout(() => {
          tooltip.style.display = "block";
          safePositionTooltip(e, tooltip);
          cell.style.cursor = "default";
        }, HOVER_DELAY);
      });

      cell.addEventListener("mousemove", e => {
        if (tooltip.style.display === "block") {
          //safePositionTooltip(e, tooltip);
        }
      });

      cell.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        tooltip.style.display = "none";
        cell.style.cursor = "help";
      });

      return;
    }


    // =============================
    // TOUCH MODE
    // =============================

    // TAP + LONG PRESS
    cell.addEventListener("touchstart", e => {
      longPressFired = false;

      longPressTimer = setTimeout(() => {
        longPressFired = true;
        cell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }, LONGPRESS_DELAY);

      tooltip.style.display = "block";
      cell.style.cursor = "default";
      // безопасное позиционирование
      safePositionTooltip(e, tooltip);

    }, { passive: true });



    cell.addEventListener("touchmove", () => {
      clearTimeout(longPressTimer);
    }, { passive: true });



    cell.addEventListener("touchend", () => {
      clearTimeout(longPressTimer);

      if (longPressFired) {
        tooltip.style.display = "none";
        cell.style.cursor = "help";
      }
    }, { passive: true });



    // TAP OUTSIDE
    document.addEventListener("touchstart", e => {
      if (!cell.contains(e.target)) {
        tooltip.style.display = "none";
        cell.style.cursor = "help";
      }
    }, { passive: true });

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
  return (
    event.clientX >= left &&
    event.clientX <= right &&
    event.clientY >= top &&
    event.clientY <= bottom
  );
}


Number.prototype.toFixedWithComma = function () {
  var decimals =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(this);
};
function loadScriptFromHtml(scriptName, callback) {
  var preloader = document.getElementById("preloader");
  var hasLoaded = false; // Флаг для отслеживания успешной загрузки
  var preloaderTimeout;

  // Показываем прелоадер, если загрузка длится больше 1.5 секунд
  preloaderTimeout = setTimeout(function () {
    preloader.style.display = "flex";
  }, 1500);

  // Функция загрузки скрипта
  function loadScript() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.type = "text/javascript";
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
  loadScript()
    .then(function () {
      if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

      console.log(`Скрипт ${scriptName} успешно загружен с хоста: ${host}`);
      clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если загрузка успешна
      preloader.style.display = "none"; // Скрываем прелоадер

      hasLoaded = true; // Устанавливаем флаг успешной загрузки

      if (callback) callback(); // Вызов коллбэка, если он был передан
    })
    ["catch"](function (error) {
      console.error("Ошибка при загрузке скрипта:", error);
      console.error("Сообщение ошибки:", error.message);
      console.error("Стек вызовов:", error.stack);
      clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если произошла ошибка
      preloader.style.display = "none"; // Скрываем прелоадер
    });
}
// Функция для выбора правильной формы слова в зависимости от числа
function okon(number, form1, form2, form3) {
  var lastDigit = number % 10;
  var lastTwoDigits = number % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return form2; // Если заканчивается на 1 (кроме 11)
  } else if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 10 || lastTwoDigits >= 20)
  ) {
    return form3; // Если заканчивается на 2, 3 или 4 (кроме 12, 13, 14)
  } else {
    return form1; // Все остальные случаи (0, 5, 6, 7, 8, 9 и т.д.)
  }
}

// Функция для вычисления времени "сколько времени назад"
function timeAgo(dateString) {
  var now = new Date(); // Текущая дата и время
var iso = dateString.replace(
  /(\d{2})\.(\d{2})\.(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2})/,
  (m, d, mo, y, h, mi, s) =>
    `${y}-${mo}-${d}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${s.padStart(2, "0")}`
);

var pastDate = new Date(iso);

// Преобразуем строку в формат ISO 8601

  var diffInMs = now - pastDate; // Разница в миллисекундах
  var diffInSeconds = Math.floor(diffInMs / 1000); // Переводим в секунды
  var diffInMinutes = Math.floor(diffInSeconds / 60); // Переводим в минуты
  var diffInHours = Math.floor(diffInMinutes / 60); // Переводим в часы
  var diffInDays = Math.floor(diffInHours / 24); // Переводим в дни

  var result = "";

  // Используем функцию okon для выбора правильных окончаний
  if (diffInDays > 0) {
    result += `${diffInDays} ${okon(diffInDays, "днів", "день", "дні")} `;
  }
  if (diffInHours % 24 > 0) {
    result += `${diffInHours % 24} ${okon(diffInHours % 24, "годин", "годину", "години")} `;
  }
  if (diffInMinutes % 60 > 0) {
    result += `${diffInMinutes % 60} ${okon(diffInMinutes % 60, "хвилин", "хвилина", "хвилини")} `;
  }
  return result || "Меньш хвилини";
}
function setParam(paramName, paramValue) {
  // Извлекаем параметры URL
  var urlParams = new URLSearchParams(window.location.search);

  // Удаляем старый параметр, если он существует
  urlParams["delete"](paramName);

  // Добавляем новый параметр
  urlParams.append(paramName, paramValue);

  var newUrl = `${window.location.pathname}?${urlParams.toString()}`;

  // Обновляем адресную строку
  history.replaceState(null, "", newUrl);

  localStorage.setItem(`last_${paramName}`, paramValue);
}
function getParam(paramName) {
  var urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has(paramName)) {
    return urlParams.get(paramName);
  }

  var storedValue = localStorage.getItem("last_" + paramName);
  if (storedValue) {
    return storedValue;
  }

  return null;
}

// Функция для преобразования номера месяца в название
function getMonthName(month) {
  var monthNames = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень"
  ];
  return monthNames[month - 1];
}
function formatDate(date, format = "YYYY-MM-DD") {

  if (!(date instanceof Date)) {
    date = new Date(date);
    if (isNaN(date)) return ""; // защита от мусора
  }

  const day = String(date.getDate());
  const month = String(date.getMonth() + 1);
  const year = date.getFullYear();
  const yearShort = String(year).slice(-2);

  return format
    .replace(/dd/g, day.padStart(2, "0"))
    .replace(/d/g, day)
    .replace(/mmmm/g, monthNames[month - 1])
    .replace(/mmm/g, monthNames[month * 1 + 11])
    .replace(/mm/g, month.padStart(2, "0"))
    .replace(/m/g, month)
    .replace(/yyyy/g, year)
    .replace(/yy/g, yearShort)
    .replace(/y/g, yearShort)
    .replace(/DD/g, day.padStart(2, "0"))
    .replace(/D/g, day)
    .replace(/MMMM/g, monthNames[month - 1])
    .replace(/MMM/g, monthNames[month * 1 + 11])
    .replace(/MM/g, month.padStart(2, "0"))
    .replace(/M/g, month)
    .replace(/YYYY/g, year)
    .replace(/YY/g, yearShort)
    .replace(/Y/g, yearShort);
}

function fillMissingDates(nach) {
  for (var id in nach) {
    var years = [];
    for (var key in nach[id]) {
      if (nach[id].hasOwnProperty(key)) {
        years.push(Number(key));
      }
    }
    years.sort(function (a, b) {
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
      var maxMonth = year === maxYear ? lastMonth : 12;
      for (var month = 1; month <= maxMonth; month++) {
        if (!nach[id][year][month]) {
          nach[id][year][month] = {
            1: 0
          };
        }
      }
    }

    // Убедиться, что ключи отсортированы
    var sortedNach = {};
    var sortedYears = Object.keys(nach[id]).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < sortedYears.length; i++) {
      var year = sortedYears[i];
      sortedNach[year] = {};
      var sortedMonths = Object.keys(nach[id][year]).sort(function (a, b) {
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
  monthOffset = typeof monthOffset === "undefined" ? 0 : monthOffset;
  var currentDate = new Date();

  // Получаем первый день текущего месяца
  var currentMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  // Если monthOffset не равен 0, сдвигаем текущий месяц на нужное количество месяцев
  var targetMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + monthOffset,
    1
  );

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
  return new Date(year, month - 1, 1); // Возвращаем 1-е число месяца
}

// Дебаунс-функция для уменьшения количества вызовов
function debounce(func, delay) {
  var timeoutId;
  return function () {
    var _this = this;
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      return func.apply(_this, args);
    }, delay);
  };
}
function showMessage(text, type = "inf", duration = 15000) {
  let container = document.getElementById("message-container");

  // === СОЗДАЁМ КОНТЕЙНЕР ===
  if (!container) {
    container = document.createElement("div");
    container.id = "message-container";

    container.style.position = "fixed";
    container.style.right = "20px";
    container.style.bottom = "20px";
    container.style.display = "flex";
    container.style.flexDirection = "column-reverse";
    container.style.gap = "8px";
    container.style.maxWidth = "360px";
    container.style.zIndex = "9999";
    container.style.pointerEvents = "none";

    document.body.appendChild(container);

    // === АВТО-АДАПТАЦИЯ ПОД МОБИЛЬНУЮ КЛАВИАТУРУ ===
    initToastKeyboardSafeArea(container);
  }

  // === СООБЩЕНИЕ ===
  const msg = document.createElement("div");
  msg.textContent = text;

  msg.style.position = "relative"; // нужно для крестика
  msg.style.padding = "10px 28px 10px 14px"; // отступ справа под крестик
  msg.style.borderRadius = "6px";
  msg.style.color = "#fff";
  msg.style.fontSize = "14px";
  msg.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  msg.style.maxWidth = "360px";

  msg.style.opacity = "0";
  msg.style.transform = "translateY(10px)";
  msg.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  msg.style.pointerEvents = "auto"; // внутри тоста можно кликать

  // === ТИПЫ ===
  const colors = {
    inf:  "#333",
    suc:  "#2e7d32",
    warn: "#ed6c02",
    err:  "#d32f2f"
  };

  msg.style.background = colors[type] || colors.inf;

  // === КРЕСТИК ЗАКРЫТИЯ ===
  const close = document.createElement("span");
  close.textContent = "×";
  close.style.position = "absolute";
  close.style.top = "6px";
  close.style.right = "8px";
  close.style.cursor = "pointer";
  close.style.fontSize = "16px";
  close.style.lineHeight = "1";
  close.style.opacity = "0.8";
  close.style.userSelect = "none";

  close.onmouseenter = () => close.style.opacity = "1";
  close.onmouseleave = () => close.style.opacity = "0.8";
  close.onclick = () => hide();

  msg.appendChild(close);

  // === ДОБАВЛЯЕМ ===
  container.appendChild(msg);

  // Анимация появления
  requestAnimationFrame(() => {
    msg.style.opacity = "1";
    msg.style.transform = "translateY(0)";
  });

  let timer = setTimeout(hide, duration);

  // === ФУНКЦИЯ СКРЫТИЯ ===
  function hide() {
    clearTimeout(timer);
    msg.style.opacity = "0";
    msg.style.transform = "translateY(10px)";

    msg.addEventListener(
      "transitionend",
      () => {
        msg.remove();

        // если тостов больше нет — удаляем контейнер
        if (!container.children.length) {
          container.remove();
        }
      },
      { once: true }
    );
  }
}



// ======================================================
// ДИНАМИЧЕСКИЙ ПОДЪЁМ СООБЩЕНИЙ НАД МОБИЛЬНОЙ КЛАВИАТУРОЙ
// ======================================================
function initToastKeyboardSafeArea(container) {
  if (!window.visualViewport) return;

  const viewport = window.visualViewport;

  function adjust() {
    if (!container) return;

    // вычисляем нижний "врез" клавиатуры
    const bottomInset = Math.max(
      20,
      (window.innerHeight - viewport.height - viewport.offsetTop) + 20
    );

    container.style.bottom = bottomInset + "px";
    container.style.right = "20px";
  }

  viewport.addEventListener("resize", adjust);
  viewport.addEventListener("scroll", adjust);

  adjust(); // на случай, если клавиатура уже открыта
}




function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      // Показываем сообщение "Ключ скопирован"
      showMessage("Ключ скопирован в буфер обмена!");
    })
    ["catch"](function (err) {
      console.error("Ошибка при копировании: ", err);
    });
}
// Функция для форматирования чисел (с двумя знаками после запятой)
var formatNumber = function formatNumber(num) {
  return num.toFixed(2).replace(/\.00$/, "") * 1;
};



// Функция для получения месяца и года в формате ММ.ГГГГ
function getMonthYear(actionCode) {
  let year = "";
  let month = "";
  let ls="";
    if (actionCode === "accounts") {
const yearToggles = document.querySelectorAll(".toggle-box");

// Находим первый открытый (checked)
let firstOpenYear = null;
for (let toggle of yearToggles) {
  if (toggle.checked) {
    // id у тебя в формате "block-2023"
    firstOpenYear = toggle.id.slice(-2);
    break; // остановимся на первом
  }
}
     ls=firstOpenYear + "_кв." + document.getElementById('number').value;
  } else if (actionCode === "list") {
    const monthInput = document.getElementById("end-date");
    const dateValue = monthInput?.value;
    if (dateValue) {
      [year, month] = dateValue.split("-");
    }
  } else if (actionCode === "payments") {
    const selectMonth = document.getElementById("monthSelect");
    const selectedOption = selectMonth?.value;
    if (selectedOption) {
      [year, month] = selectedOption.split("-");
    }
  } else if (actionCode === "bank") {
    const dateInput = document.getElementById("toDate");
    const dateValue = dateInput?.value;
    if (dateValue) {
      year = dateValue.split("-")[0];
      month = dateValue.split("-")[1];
    }
  }

  if (year && month) {
    return year.slice(-2) + "_" + month.padStart(2, "0"); // YY_MM
  }
    if (year) {
    return year.slice(-2); // YY
  }
    if (ls) {
    return ls;
  }


  return "";
}


// Функция для генерации имени файла
function generateFileName(home, actionCode) {
  var name = home.org3+'_';

  // Добавляем код действия в имя файла
  var actionSuffix = "";
  if (actionCode === "list") {
    actionSuffix = "_ЛС";
  } else if (actionCode === "payments") {
    actionSuffix = "_оплаты";
  } else if (actionCode === "bank") {
    actionSuffix = "_банк";
  }

  // Получаем месяц и год в нужном формате
  var monthYear = getMonthYear(actionCode);
  return `${name}${monthYear}${actionSuffix}.xlsx`;
}
function isElementVisible(el) {
  while (el) {
    var style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return false;
    }
    el = el.parentElement;
  }
  return true;
}
function parseCellValue2(value) {
if (value === null || value === undefined || value.toString().trim() === ""||value==0) {
    return null; // Именно null скажет ExcelJS, что ячейка пустая
  }
  var trimmedValue = value.replace(/\u00A0/g, " ").trim();

  // Списки месяцев
  var monthNamesUA = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень"
  ];
  var monthNamesRU = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ];
  var monthShortRU = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек"
  ];

  // Проверка на формат "Месяц Год"
  var monthYearPattern =
    /^([\u0404\u0406\u0407\u0410-\u044F\u0454\u0456\u0457\u1C80-\u1C83\u1C85\u1C86]+)[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]([0-9]{4})$/i;
  var match = trimmedValue.match(monthYearPattern);
  if (match) {
    var monthName = match[1].toLowerCase(); // Делаем регистр независимым
    var year = parseInt(match[2], 10);

    // Ищем месяц в списках
    var monthIndex = monthNamesUA.findIndex(function (m) {
      return m.toLowerCase() === monthName;
    });
    if (monthIndex === -1) {
      monthIndex = monthNamesRU.findIndex(function (m) {
        return m.toLowerCase() === monthName;
      });
    }
    if (monthIndex === -1) {
      monthIndex = monthShortRU.findIndex(function (m) {
        return m.toLowerCase() === monthName;
      });
    }
    if (monthIndex !== -1) {
      // Создаём дату в UTC
      return new Date(Date.UTC(year, monthIndex, 1));
    }
  }

  // Если это "0,00" или "0.00", возвращаем null
  if (
    trimmedValue === "0,00" ||
    trimmedValue === "0.00" ||
    trimmedValue === "0" ||
    trimmedValue === "0.0" ||
    trimmedValue === "0,0"
  ) {
    return 0;
  }

  // Проверка на числа
  var numberPattern = /^[+-]?\d{1,3}([ \u00A0\d]*)?([.,]\d+)?$/;
// Разрешаем начинаться с 0, если после него идет запятая или точка
var startsWithZeroValid = trimmedValue.startsWith("0") ? /^0[.,]/.test(trimmedValue) : true;

if (numberPattern.test(trimmedValue) && trimmedValue !== "0" && startsWithZeroValid) {
     var normalizedNumber = trimmedValue
      .replace(/[\s\u00A0]+/g, "")
      .replace(",", ".");
    var parsedNumber = parseFloat(normalizedNumber);
    if (!isNaN(parsedNumber)) return parsedNumber;
  }

  // Проверка на дату в формате DD.MM.YYYY
  var datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/;
  match = trimmedValue.match(datePattern);
  if (match) {
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10) - 1; // Месяцы начинаются с 0 (январь = 0)
    var _year3 = parseInt(match[3], 10);

    // Если год двухзначный, добавляем 2000
    if (_year3 < 100) {
      _year3 += 2000;
    }

    // Проверяем, что день существует в месяце (например, 31 февраля — это ошибка)
    var _date = new Date(_year3, month, day);

    // Если дата невалидна (например, 31 февраля), создаём некорректную дату
    if (
      _date.getDate() === day &&
      _date.getMonth() === month &&
      _date.getFullYear() === _year3
    ) {
      // Преобразуем в UTC
      return new Date(Date.UTC(_year3, month, day));
    }
  }
  // Проверка на дату с помощью конструктора Date (например, для форматов MM/DD/YYYY)
  var date = new Date(trimmedValue);
  if (!isNaN(date.getTime())) {
    // Преобразуем обычную дату в UTC и возвращаем
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
  }

  // Если это не дата и не число, возвращаем исходное значение
  return value;
}
function handleHeaders(tableCopy, ws) {
  var thead = tableCopy.querySelector("thead");
  if (thead) {
    var headerRows = Array.from(thead.querySelectorAll("tr"));

    // Определяем, с какой строки начинать новый заголовок
    var startRowIndex = ws.rowCount + 1;

    // Добавляем пустую строку перед новым заголовком, если это не первая таблица
    if (ws.rowCount > 0) {
      ws.addRow([]);
      startRowIndex++;
    }

    // Массив для отслеживания занятых ячеек по колонкам
    var occupiedCells = [];
    headerRows.forEach(function (row, rowIndex) {
      var cells = Array.from(row.querySelectorAll("td, th"));
      var currentColIndex = 0; // Индекс текущей колонки

      cells.forEach(function (cell) {
        // Пропускаем занятые ячейки
        while (
          occupiedCells[rowIndex] &&
          occupiedCells[rowIndex][currentColIndex]
        ) {
          currentColIndex++;
        }
        var colspan = parseInt(cell.getAttribute("colspan")) || 1;
        var rowspan = parseInt(cell.getAttribute("rowspan")) || 1;

        // Записываем значение в Excel
        var cellValue = cell.innerText.trim();
        var excelCell = ws.getCell(
          startRowIndex + rowIndex,
          currentColIndex + 1
        );
        excelCell.value = cellValue;

        // Отмечаем занятые ячейки
        for (var i = 0; i < colspan; i++) {
          if (!occupiedCells[rowIndex]) {
            occupiedCells[rowIndex] = [];
          }
          occupiedCells[rowIndex][currentColIndex + i] = true;
        }
        if (rowspan > 1) {
          for (var _i = 1; _i < rowspan; _i++) {
            if (!occupiedCells[rowIndex + _i]) {
              occupiedCells[rowIndex + _i] = [];
            }
            occupiedCells[rowIndex + _i][currentColIndex] = true;
          }
        }

        // Объединяем ячейки, если есть colspan и rowspan
        if (colspan > 1) {
          ws.mergeCells(
            startRowIndex + rowIndex,
            currentColIndex + 1,
            startRowIndex + rowIndex,
            currentColIndex + colspan
          );
        }
        if (rowspan > 1) {
          ws.mergeCells(
            startRowIndex + rowIndex,
            currentColIndex + 1,
            startRowIndex + rowIndex + rowspan - 1,
            currentColIndex + 1
          );
        }

        // Двигаемся к следующей колонке
        currentColIndex++;
      });
    });
  }
}
async function exportTableToExcel(action = "download") {
    const mainContainer = document.getElementById("maincontainer");

    if (!mainContainer) {
        showMessage("Контейнер с id='maincontainer' не найден","err");
        return;
    }

    // Находим все видимые таблицы
    const tableSelectors = "#banktable, #paytable, .main, #main, .analiz-table";
    const allTables = [...mainContainer.querySelectorAll(tableSelectors)];

    const tables = allTables.filter(el => {
        let node = el;
        while (node) {
            const style = getComputedStyle(node);
            if (style.display === "none" ||
                style.visibility === "hidden" ||
                style.opacity === "0") {
                return false;
            }
            node = node.parentElement;
        }
        return true;
    });

    if (tables.length === 0) {
        showMessage("Нет видимых таблиц","warn");
        return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    // Обрабатываем таблицы
    for (const table of tables) {
        // Копия таблицы
        const tableCopy = table.cloneNode(true);
        tableCopy.querySelectorAll("tr[data-hidden-by-filter='1']").forEach(tr => tr.remove());

        // Удаляем .descr
        tableCopy.querySelectorAll(".descr").forEach(el => el.remove());

        // Обработка заголовков
        handleHeaders(tableCopy, ws);

        // Обработка данных
        handleRows(tableCopy, ws);
    }

    // === Скачивание файла ===
    if (action === "download") {
        const buffer = await wb.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        // имя файла
        const homeCode = getParam("homeCode");
        const actionCode = getParam("actionCode");
        const home = homes.find(h => h.code === homeCode);
        const fileName = generateFileName(home, actionCode);

        link.download = fileName;
        link.click();

        showMessage(`Файл ${fileName} сохранён в папку Загрузки`);
        return;
    }

    // === Копирование в буфер обмена ===
    if (action === "clipboard") {
        let clipboardData = "";
        const rows = ws.getRows(1, ws.rowCount);

        for (const row of rows) {
            const rowData = [];

            row.eachCell((cell, colNumber) => {
                if (cell.isMerged) {
                    if (rowData[colNumber - 1] === undefined) {
                        rowData[colNumber - 1] = parseCellValue1(cell.text);
                    }
                } else {
                    rowData[colNumber - 1] = parseCellValue1(cell.text || "");
                }
            });

            clipboardData += rowData.join("\t") + "\n";
        }

        try {
            await navigator.clipboard.writeText(clipboardData);
            showMessage("Данные скопированы в буфер обмена!");
        } catch (e) {
            showMessage("Не удалось скопировать данные в буфер обмена.","err");
        }
    }
}

function handleRows(tableCopy, ws) {
  var tbody = tableCopy.querySelector("tbody");
  if (tbody) {
  var rows = Array.from(tbody.querySelectorAll("tr")).filter(row => row.dataset.hiddenByFilter !== "1");


    var colorIndex = 0; // Индекс для смены цветов
    var colors = [
      "FFFF99",
      "99FF99",
      "99CCFF",
      "FF9999",
      "CC99FF",
      "FFCC99",
      "CCCCCC"
    ]; // Набор цветов
    var rowIndex = 0;
    rows.forEach(function (row) {
      var rowData = []; // Данные текущей строки
      var nextRowDataArray = []; // Данные всех следующих строк .paysubtable

      // Перебираем все ячейки в строке
      var cells = Array.from(row.querySelectorAll("td"));
      cells.forEach(function (cell, cellIndex) {
        var paysubtable = cell.querySelector(".paysubtable"); // Находим .paysubtable в ячейке

        if (paysubtable) {
          var nestedRows = paysubtable.querySelectorAll("tr");
          if (nestedRows.length > 0) {
            // Добавляем первую строку вложенной таблицы в текущую строку
            var firstNestedRow = nestedRows[0];
            var firstNestedCells = firstNestedRow.querySelectorAll("td");
            rowData.push(firstNestedCells[1].innerText.trim());

            // Запоминаем индекс столбца, куда вставили значение
            var paySubtableColumnIndex = rowData.length - 1;

            // Обрабатываем все строки кроме первой
            nestedRows.forEach(function (nestedRow, nestedRowIndex) {
              if (nestedRowIndex > 0) {
                var nestedCells = nestedRow.querySelectorAll("td");
                var nextRowData = Array(rowData.length).fill(null); // Заполняем пустыми ячейками
                nextRowData[paySubtableColumnIndex] =
                  nestedCells[1].innerText.trim();
                nextRowDataArray.push(nextRowData);
              }
            });
          }
        } else {
          if (cell.closest(".paysubtable") == null) {
            rowData.push(cell.innerText.trim());
          }
        }
      });
      if (rowData.length) {
        // Обрабатываем основную строку
        var excelRow = rowData.map(function (cell) {
          return parseCellValue2(cell);
        });
        ws.addRow(excelRow);
        rowIndex++;

        // Обрабатываем все строки из nextRowDataArray
        nextRowDataArray.forEach(function (nextRowData) {
          var excelNextRowData = nextRowData.map(function (cell) {
            return parseCellValue2(cell);
          });
          ws.addRow(excelNextRowData);
          rowIndex++;
        });
      }
    });
  }
}
function parseCellValue1(value) {
  // Если значение является числом и не равно 0, пропускаем дальнейшую обработку
  if (typeof value === "number") {
    return value.toString().replace(".", ","); // Заменяем точку на запятую для чисел
  }

  // Проверяем, является ли значение числом (и не 0) для строковых значений
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    return value.replace(".", ","); // Заменяем точку на запятую только для чисел
  }

  // Проверка, является ли значение валидной датой
  var trimmedValue = value.trim();
  var date = new Date(trimmedValue);

  // Проверка на валидную дату
  if (!isNaN(date.getTime()) && isNaN(parseFloat(trimmedValue))) {
    var currentYear = new Date().getFullYear();
    var minYear = 2000;
    var maxYear = currentYear + 10;

    // Проверяем, что год в пределах от 2000 до текущего года + 10
    if (date.getUTCFullYear() >= minYear && date.getUTCFullYear() <= maxYear) {
      // Преобразуем в UTC и форматируем в DD.MM.YYYY
      var day = String(date.getUTCDate()).padStart(2, "0"); // Делаем день двузначным
      var month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0, поэтому +1
      var year = date.getUTCFullYear();

      // Возвращаем дату в формате DD.MM.YYYY
      return `${day}.${month}.${year}`;
    }
  }

  // Если не дата или дата вне диапазона, возвращаем исходное значение
  return value;
}


// ===================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====================
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}




 function nocache(url) {
    return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
}

async function loadHomeRoles() {
  // 1. Текущий пользователь
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    console.error('User not authorized');
    return null;
  }

  // 2. Запрос только из user_homes
  const { data, error } = await client
    .from('user_homes')
    .select('home_code, role')
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to load user_homes:', error);
    return null;
  }

  // 3. Преобразование в объект { home_code: role }
  const homeRoles = {};

  for (const row of data) {
    homeRoles[row.home_code] = row.role;
  }

  return homeRoles;
}




function captureAndCopyOld() {
  console.log("Начинаем выполнение captureAndCopy");

  const mainContainer = document.getElementById("maincontainer");
  if (!mainContainer) {
    console.warn("maincontainer не найден");
    return;
  }

  // === ищем видимую таблицу ===
  const tables = Array.from(
    mainContainer.querySelectorAll("#banktable, #paytable, .main, #main")
  ).filter(el => {
    let cur = el;
    while (cur) {
      const cs = window.getComputedStyle(cur);
      if (
        cs.display === "none" ||
        cs.visibility === "hidden" ||
        cs.opacity === "0"
      ) {
        return false;
      }
      cur = cur.parentElement;
    }
    return true;
  });

  if (!tables.length) {
    console.warn("Нет таблиц для обработки");
    showMessage("Нет таблиц для обработки","warn")
    return;
  }

  const originalTable = tables[0];
  console.log("Найдена основная таблица", originalTable);

  // =========================================================
  // 1. СОЗДАЁМ ИЗОЛИРОВАННЫЙ WRAPPER (вне экрана)
  // =========================================================
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "-100000px";
  wrapper.style.background = "#fff";
  wrapper.style.margin = "0";
  wrapper.style.padding = "0";
  wrapper.style.display = "inline-block";

  // =========================================================
  // 2. ДОБАВЛЯЕМ ЗАГОЛОВОК (адрес + квартира + ФИО)
  // =========================================================
  if (getParam("actionCode") === "accounts") {
    const address = document.getElementById("adr")?.innerText || "";
    const sel = document.getElementById("number");
    const apartment =
      sel?.options?.[sel.selectedIndex]?.text || "";
    const fio = document.getElementById("fio")?.innerText || "";

    const title = document.createElement("div");
    title.textContent = `${address} ${apartment}, ${fio}`;
    title.style.fontWeight = "600";
    title.style.fontSize = "16px";
    title.style.margin = "0 0 6px 0";
    title.style.padding = "0";

    wrapper.appendChild(title);

    // временно скрываем label в оригинале
    document.querySelectorAll("label").forEach(l => {
      l.style.display = "none";
    });
  }

  // =========================================================
  // 3. КЛОНИРУЕМ ТАБЛИЦУ
  // =========================================================
const clone = originalTable.cloneNode(true);

// --- убираем sticky у THEAD ---
const thead = clone.querySelector("thead");
const tbody = clone.querySelector("tbody");

if (thead) {
  thead.style.display = "table-header-group";
  thead.style.position = "static";
  thead.style.top = "auto";

  thead.querySelectorAll("*").forEach(el => {
    el.style.position = "static";
    el.style.top = "auto";
  });
}

if (tbody) {
  tbody.style.display = "table-row-group";
}

// =========================================================
// УДАЛЯЕМ tr.grey И СОХРАНЯЕМ ЕГО
// =========================================================
let greyRow = null;

if (tbody) {
  const foundGrey = tbody.querySelector("tr.grey");
  if (foundGrey) {
    greyRow = foundGrey;   // сохраняем ссылку
    foundGrey.remove();   // удаляем из таблицы
  }
}


// =========================================================
// 4. НОРМАЛИЗАЦИЯ ИТОГОВ
//    переносим в tfoot ТОЛЬКО если итоги реально внизу
// =========================================================
const cloneTbody = clone.querySelector("tbody");

if (cloneTbody) {
  const rows = Array.from(cloneTbody.children);

  // индекс первой строки itog
  const firstItogIndex = rows.findIndex(r =>
    r.classList.contains("itog")
  );

  if (firstItogIndex !== -1) {
    // есть ли строки данных после итогов
    const hasRowsAfterItog = rows
      .slice(firstItogIndex + 1)
      .some(r => !r.classList.contains("itog"));

    // переносим ТОЛЬКО если итоги в самом низу
    if (!hasRowsAfterItog) {
      let cloneTfoot = clone.querySelector("tfoot");
      if (!cloneTfoot) {
        cloneTfoot = document.createElement("tfoot");
        clone.appendChild(cloneTfoot);
      }

      rows
        .slice(firstItogIndex)
        .forEach(tr => cloneTfoot.appendChild(tr));
    }
  }
}



  // =========================================================
  // 5. FLATTEN ROWSPAN В TFOOT (html2canvas)
  // =========================================================
  const tfoot = clone.querySelector("tfoot");

  if (tfoot) {
    const rows = Array.from(tfoot.querySelectorAll("tr"));

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const cells = Array.from(row.children);

      cells.forEach((cell, idx) => {
        const rs = parseInt(cell.getAttribute("rowspan") || "1", 10);
        if (rs > 1) {
          cell.removeAttribute("rowspan");

          for (let k = 1; k < rs; k++) {
            const target = rows[r + k];
            if (!target) continue;

            const filler = document.createElement("td");
            filler.innerHTML = "&nbsp;";
            filler.style.border = cell.style.border;
            filler.style.padding = cell.style.padding;
            filler.style.textAlign = cell.style.textAlign;

            target.insertBefore(
              filler,
              target.children[idx] || null
            );
          }
        }
      });
    }
  }

// =========================================================
// ЕСЛИ ЕСТЬ greyRow — ДОБАВЛЯЕМ ЕЁ В ОТДЕЛЬНУЮ ТАБЛИЦУ
// =========================================================

 
  // =========================================================
  // 6. ФИКСИРУЕМ ШИРИНУ
  // =========================================================
  clone.style.width = originalTable.scrollWidth + "px";
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.padding = "0";
  wrapper.appendChild(clone);


if (greyRow) {
const columnWidths = extractColumnWidths(clone);

if (columnWidths.length) {
  const cg = buildColGroup(columnWidths);
  clone.insertBefore(cg, clone.firstChild);
}

function extractColumnWidths(table) {
  const row =
    table.querySelector("tbody tr:not(.itog):not(.balance-info)");

  if (!row) return [];

  return Array.from(row.children).map(td =>
    td.getBoundingClientRect().width
  );
}

function buildColGroup(widths) {
  const colgroup = document.createElement("colgroup");

  widths.forEach(w => {
    const col = document.createElement("col");
    col.style.width = w + "px";
    colgroup.appendChild(col);
  });

  return colgroup;
}

 const greyTable = document.createElement("table");
  const greyTbody = document.createElement("tbody");

  greyTbody.appendChild(greyRow);
  greyTable.appendChild(greyTbody);

  greyTable.style.width = clone.style.width;
  greyTable.style.maxWidth = "none";
  greyTable.style.borderCollapse = "collapse";
  greyTable.style.marginTop = "6px";


  // colgroup — тот же самый
  if (columnWidths.length) {
    const cg = buildColGroup(columnWidths);
    greyTable.insertBefore(cg, greyTable.firstChild);
  }

  wrapper.appendChild(greyTable);
 }



  document.body.appendChild(wrapper);

  // =========================================================
  // 7. КОПИРУЕМ СТИЛИ И ВЫРАВНИВАНИЯ
  // =========================================================
  applyBordersAndAlign(originalTable, clone);

  // =========================================================
  // 8. RENDER → CLIPBOARD
  // =========================================================
  html2canvas(wrapper, {
    backgroundColor: "#ffffff",
    scale: window.devicePixelRatio || 2
  }).then(canvas => {

    document.body.removeChild(wrapper);

    const canClipboard =
      navigator.clipboard && window.ClipboardItem;

    if (canClipboard) {
      canvas.toBlob(blob => {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]).then(() => {
          showMessage("Скриншот таблицы скопирован в буфер обмена");
        }).catch(err => {
          console.error("Clipboard error", err);
          fallbackDownload(canvas);
          showMessage("Не удалось скопировать, файл сохранён", "warn");
        });
      });
    } else {
      fallbackDownload(canvas);
      showMessage("Буфер обмена недоступен, файл сохранён", "warn");
    }

    // возвращаем label
    setTimeout(() => {
      document.querySelectorAll("label").forEach(l => {
        l.style.display = "";
      });
    }, 300);
  });

  // =========================================================
  // helpers
  // =========================================================




  function fallbackDownload(canvas) {
    const a = document.createElement("a");
    a.download = "screenshot.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }
}



function renderTableToCanvas() {
  return new Promise((resolve, reject) => {
    var mainContainer = document.getElementById("maincontainer");

    var tables = Array.from(
      mainContainer.querySelectorAll("#banktable, #paytable, .main, #main")
    ).filter(function (el) {
      while (el) {
        var style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return false;
        }
        el = el.parentElement;
      }
      return true;
    });

    if (tables.length === 0) {
      reject("Нет таблиц для обработки");
      return;
    }

    var mainTable = tables[0];

    applyBorders(mainTable);

    mainTable.querySelectorAll("td[rowspan]").forEach(td => {
      td.style.position = "relative";
    });

    // ===== временный caption =====
    if (getParam("actionCode") == "accounts") {
      var address = document.getElementById("adr")?.innerText || "";
      var selectElement = document.getElementById("number");
      var apartmentNumber = selectElement ? selectElement.value.trim() : "";
      var fio = document.getElementById("fio")?.innerText || "";

      var caption = document.createElement("caption");
      caption.className = "tmp";
      caption.style.captionSide = "top";
      caption.style.textAlign = "center";
      caption.style.fontSize = "18px";
      caption.style.fontWeight = "600";
      caption.style.padding = "8px 0 10px";
      caption.style.lineHeight = "1.3";
      caption.innerText = address + " " + apartmentNumber + ", " + fio;

      mainTable.insertBefore(caption, mainTable.firstChild);
    }

    html2canvas(mainTable, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true
    }).then(canvas => {

console.log(
    "canvas px:",
    canvas.width,
    canvas.height,
    "CSS size:",
    canvas.style.width,
    canvas.style.height,
    "dpr:",
    window.devicePixelRatio
  );


      // очистка временных элементов
      document.querySelectorAll(".tmp").forEach(el => el.remove());
      resolve(canvas);
    }).catch(reject);
  });

function applyBorders(table) {
  // Устанавливаем стили для таблицы
  table.style.borderCollapse = "collapse";
  table.style.borderSpacing = "0";

  // Устанавливаем границы для всех ячеек
  table.querySelectorAll("td").forEach((td, index) => {
    td.style.border = "2px solid black";
    td.style.padding = "4px";

    // Если внутри есть вложенная таблица — просто логируем
    if (td.querySelector("table")) {
      console.log(
        `TD[${index}]: содержит вложенную таблицу, граница не применяется к вложенной`
      );
    }
  });
}

}
function captureAndCopy() {
  renderTableToCanvas()
    .then(canvas => {
      var supportsClipboard =
        navigator.clipboard &&
        window.ClipboardItem &&
        canvas.toBlob;

      if (!supportsClipboard) {
        fallbackDownload(canvas);
        showMessage("Буфер обмена недоступен, файл сохранён", "warn");
        return;
      }

      canvas.toBlob(blob => {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]).then(() => {
          showMessage("Скриншот таблицы скопирован в буфер обмена");
        }).catch(err => {
          console.error(err);
          fallbackDownload(canvas);
          showMessage("Не удалось скопировать, файл сохранён", "warn");
        });
      });
    })
    .catch(err => {
      console.warn(err);
      showMessage(err, "warn");
    });
}
function captureAndShare() {
  if (!isMobile() || !navigator.share || !navigator.canShare) {
    captureAndCopy();
    return;
  }

  renderTableToCanvas()
    .then(canvas => {
      canvas.toBlob(async blob => {
        var file = new File([blob], "table.png", { type: "image/png" });

        if (!navigator.canShare({ files: [file] })) {
          fallbackDownload(canvas);
          return;
        }

        try {
          await navigator.share({
            title: "Таблица",
            text: "Скриншот таблицы",
            files: [file]
          });
        } catch (e) {
          console.warn("Share cancelled", e);
        }
      });
    })
    .catch(err => {
      console.warn(err);
      showMessage(err, "warn");
    });
}
function fallbackDownload(canvas) {
  var link = document.createElement("a");
  link.download = "screenshot.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function analyzeTypicalApartments(debug = false) {

  function median(arr) {
    const a = arr.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function quantile(arr, q) {
    const a = arr.slice().sort((x, y) => x - y);
    const pos = (a.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return a[base + 1] !== undefined
      ? a[base] + rest * (a[base + 1] - a[base])
      : a[base];
  }

  function avg(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  // 1. Сбор площадей
  const areas = Object.values(ls)
    .map(o => o.pl)
    .filter(v => typeof v === 'number' && v > 0)
    .sort((a, b) => a - b);

  if (areas.length < 5) {
    if (debug) {
      console.warn('Недостаточно данных для анализа');
    }
    return { types: [], outliers: [] };
  }

  // 2. Разницы между соседними значениями
  const diffs = [];
  for (let i = 1; i < areas.length; i++) {
    diffs.push(areas[i] - areas[i - 1]);
  }

  // 3. Адаптивный допуск (режим "комнатность")
  const q1 = quantile(diffs, 0.25);
  const q3 = quantile(diffs, 0.75);
  const iqr = q3 - q1;

  const medianArea = median(areas);
  const minThreshold = medianArea * 0.035;

  const THRESHOLD = Math.max(iqr * 3, minThreshold);

  // 4. Кластеризация
  const clusters = [];
  let current = [areas[0]];

  for (let i = 1; i < areas.length; i++) {
    if (areas[i] - areas[i - 1] <= THRESHOLD) {
      current.push(areas[i]);
    } else {
      clusters.push(current);
      current = [areas[i]];
    }
  }
  clusters.push(current);

  // 5. Отсев нетиповых
  const MIN_CLUSTER_SIZE = Math.max(3, Math.round(areas.length * 0.05));

  const typical = clusters.filter(c => c.length >= MIN_CLUSTER_SIZE);
  const outliers = clusters.filter(c => c.length < MIN_CLUSTER_SIZE);

  // 6. Формирование результата
  const types = typical.map((c, i) => ({
    type: i + 1,
    count: c.length,
    avg: +avg(c).toFixed(2),
    min: +c[0].toFixed(2),
    max: +c[c.length - 1].toFixed(2)
  }));

  // 7. Debug-вывод
  if (debug) {
    console.group('Анализ типовых квартир по площади');

    console.log('Всего квартир:', areas.length);
    console.log('Автоматический допуск (м²):', THRESHOLD.toFixed(2));
    console.log('Минимальный размер типового кластера:', MIN_CLUSTER_SIZE);

    console.group('Типовые квартиры');
    types.forEach(t => {
      console.log(
        `Тип ${t.type}:`,
        `квартир = ${t.count},`,
        `средняя = ${t.avg} м²,`,
        `диапазон = ${t.min} – ${t.max}`
      );
    });
    console.groupEnd();

    if (outliers.length) {
      console.group('Нетиповые / выбросы');
      outliers.forEach(c => {
        console.log(
          `квартир = ${c.length},`,
          `площади =`, c.map(v => v.toFixed(2)).join(', ')
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  return {
    types,
    outliers
  };
}

