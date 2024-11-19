//const host='https://dimazua.github.io/allLs/data/';
host = 'data/';
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
  var monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  return monthNames[month - 1];
}
function formatDate(date) {
  return "".concat(date.getFullYear(), "-").concat(String(date.getMonth() + 1).padStart(2, '0'));
}