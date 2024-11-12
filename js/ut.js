  //const host='https://dimazua.github.io/allLs/data/';
host='data/';
function initPosters() {
    const sidebar = document.querySelector('.sidebar'); // Предположим, что у панели есть класс 'sidebar'

    document.querySelectorAll('.poster').forEach(cell => {
        const tooltip = cell.querySelector('.descr');
        let hideTimeout;

        cell.addEventListener('mouseenter', function(event) {
            if (!isCursorOverSidebar(event, sidebar)) {
                clearTimeout(hideTimeout);
                tooltip.style.display = 'block';
                positionTooltip(event, tooltip);
            }
        });

        cell.addEventListener('mousemove', function(event) {
            if (!isCursorOverSidebar(event, sidebar)) {
                positionTooltip(event, tooltip);
            } else {
                tooltip.style.display = 'none'; // Прячем подсказку, если над панелью
            }
        });

        cell.addEventListener('mouseleave', function() {
            hideTimeout = setTimeout(() => tooltip.style.display = 'none', 200);
        });
    });
}

// Функция для проверки, находится ли курсор над боковой панелью
function isCursorOverSidebar(event, sidebar) {
    if (!sidebar) return false;
    const { left, top, right, bottom } = sidebar.getBoundingClientRect();
    return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
}

function positionTooltip(event, tooltip) {
    const { clientX: mouseX, clientY: mouseY } = event;
    const { offsetWidth: tooltipWidth, offsetHeight: tooltipHeight } = tooltip;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

    let tooltipX = mouseX + 10;
    let tooltipY = mouseY + 10;

    if (tooltipX + tooltipWidth > windowWidth) {
        tooltipX = mouseX - tooltipWidth - 10;
    }
    if (tooltipX < 0) {
        tooltipX = 10;
    }
    if (tooltipY + tooltipHeight > windowHeight) {
        tooltipY = mouseY - tooltipHeight - 10;
    }
    if (tooltipY < 0) {
        tooltipY = 10;
    }

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
}


// Функция для проверки, находится ли курсор над боковой панелью
function isCursorOverSidebar(event, sidebar) {
    if (!sidebar) return false;
    const { left, top, right, bottom } = sidebar.getBoundingClientRect();
    return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
}


Number.prototype.toFixedWithComma = function (decimals = 2) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(this);
};

function loadScriptFromHtml(scriptName, callback) {
    const preloader = document.getElementById('preloader');

    let hasLoaded = false; // Флаг для отслеживания успешной загрузки
    let preloaderTimeout;

    // Показываем прелоадер, если загрузка длится больше 1.5 секунд
    preloaderTimeout = setTimeout(() => {
        preloader.style.display = 'flex';
    }, 1500);

    // Функция загрузки скрипта
    function loadScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = host + scriptName; // Формируем путь

            script.async = true;

            script.onload = () => resolve();  // Успешная загрузка
            script.onerror = () => reject();  // Ошибка загрузки

            document.head.appendChild(script);
        });
    }

    // Загружаем скрипт
    loadScript()
        .then(() => {
            if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

            console.log(`Скрипт ${scriptName} успешно загружен с хоста: ${host}`);
            clearTimeout(preloaderTimeout);  // Останавливаем прелоадер, если загрузка успешна
            preloader.style.display = 'none'; // Скрываем прелоадер

            hasLoaded = true; // Устанавливаем флаг успешной загрузки

            if (callback) callback();  // Вызов коллбэка, если он был передан
        })
	.catch((error) => {
            console.error('Ошибка при загрузке скрипта:', error);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек вызовов:', error.stack);
            clearTimeout(preloaderTimeout);  // Останавливаем прелоадер, если произошла ошибка
            preloader.style.display = 'none'; // Скрываем прелоадер
        });
};
// Функция для выбора правильной формы слова в зависимости от числа
function okon(number, form1, form2, form3) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return form2;  // Если заканчивается на 1 (кроме 11)
    } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
        return form3;  // Если заканчивается на 2, 3 или 4 (кроме 12, 13, 14)
    } else {
        return form1;  // Все остальные случаи (0, 5, 6, 7, 8, 9 и т.д.)
    }
}

// Функция для вычисления времени "сколько времени назад"
function timeAgo(dateString) {
    const now = new Date(); // Текущая дата и время
    const pastDate = new Date(dateString.replace(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6')); // Преобразуем строку в формат ISO 8601

    const diffInMs = now - pastDate; // Разница в миллисекундах
    const diffInSeconds = Math.floor(diffInMs / 1000); // Переводим в секунды
    const diffInMinutes = Math.floor(diffInSeconds / 60); // Переводим в минуты
    const diffInHours = Math.floor(diffInMinutes / 60); // Переводим в часы
    const diffInDays = Math.floor(diffInHours / 24); // Переводим в дни

    let result = '';

    // Используем функцию okon для выбора правильных окончаний
    if (diffInDays > 0) {
        result += `${diffInDays} ${okon(diffInDays, 'дней', 'день', 'дня')} `;
    }

    if (diffInHours % 24 > 0) {
        result += `${diffInHours % 24} ${okon(diffInHours % 24, 'часов', 'час', 'часа')} `;
    }

    if (diffInMinutes % 60 > 0) {
        result += `${diffInMinutes % 60} ${okon(diffInMinutes % 60, 'минут', 'минута', 'минуты')} `;
    }

    return result || 'Менее минуты назад';
}


function setParam(paramName, paramValue) {
    // Извлекаем параметры URL
    const urlParams = new URLSearchParams(window.location.search);

    // Удаляем старый параметр, если он существует
    urlParams.delete(paramName);

    // Добавляем новый параметр
    urlParams.append(paramName, paramValue);

    // Формируем новый URL
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

    // Обновляем адресную строку
    history.replaceState(null, '', newUrl);

    // Сохраняем параметр в localStorage с ключом 'last_paramName'
    localStorage.setItem(`last_${paramName}`, paramValue);

}

function getParam(paramName) {
    // Извлекаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);

    // Проверяем, есть ли параметр в URL
    if (urlParams.has(paramName)) {
        return urlParams.get(paramName);  // Если параметр найден в URL, возвращаем его значение
    }

    // Если параметр не найден в URL, пытаемся найти его в localStorage
    const storedValue = localStorage.getItem(`last_${paramName}`);
    if (storedValue) {
        return storedValue;  // Возвращаем значение из localStorage
    }

    // Если параметр не найден ни в URL, ни в localStorage, возвращаем null
    return null;
}
// Функция для преобразования номера месяца в название
function getMonthName(month) {
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    return monthNames[month - 1];
}
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
