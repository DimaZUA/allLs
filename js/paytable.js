var finalDate;
function calculateDefaultDays() {
    var defaultDay = finalDate.getDate();
    var fromDay, toDay;
    if (defaultDay < 7) {
        fromDay = 1;
        toDay = defaultDay;
    } else {
        toDay = Math.floor((defaultDay - 1) / 7) * 7;
        fromDay = toDay - 6;
    }
    document.getElementById('fromDay').value = fromDay;
    document.getElementById('toDay').value = toDay;
}

function populateMonthSelector() {
    var monthSelect = document.getElementById('monthSelect');
    var uniqueMonths = {};

    // Собираем уникальные годы и месяцы из oplat
    for (var lsKey in oplat) {
        if (oplat.hasOwnProperty(lsKey)) {
            var userPayments = oplat[lsKey];
            for (var year in userPayments) {
                if (userPayments.hasOwnProperty(year)) {
                    for (var month in userPayments[year]) {
                        if (userPayments[year].hasOwnProperty(month)) {
                            uniqueMonths[year + '-' + month] = true;
                        }
                    }
                }
            }
        }
    }

    // Сортируем месяцы и заполняем селектор
    var monthsArray = [];
    for (var key in uniqueMonths) {
        monthsArray.push(key);
    }

    monthsArray.sort(function (a, b) {
        var dateA = new Date(a.split('-').join('-'));
        var dateB = new Date(b.split('-').join('-'));
        return dateA.getTime() - dateB.getTime();
    });
    var currentYear = finalDate.getFullYear();
    var currentMonth = finalDate.getMonth() + 1; // Месяцы в JavaScript начинаются с 0

    var latestValidMonth = ''; // Переменная для хранения самого позднего доступного месяца

    for (var i = 0; i < monthsArray.length; i++) {
        var item = monthsArray[i];
        var year = item.split('-')[0];
        var month = item.split('-')[1];
        // Определяем, если месяц еще не превышает текущий
        if (year < currentYear || (year == currentYear && month <= currentMonth)) {
            latestValidMonth = item;
            console.log(year+'  '+ month);
        }
        var option = document.createElement('option');
        option.value = item;
        option.textContent = new Date(0, month - 1).toLocaleString('ru', { month: 'long' }) + ' ' + year;

        monthSelect.appendChild(option);        
        // Выбираем последний допустимый месяц
        if (item === latestValidMonth) {
            option.selected = true;
        }

    }
}

function generatePayTable() {
    var selectedMonth = document.getElementById('monthSelect').value.split('-');
    var year = parseInt(selectedMonth[0], 10);
    var month = parseInt(selectedMonth[1], 10);

    // Значения "С" и "По"
    var fromDayInput = document.getElementById('fromDay').value;
    var toDayInput = document.getElementById('toDay').value;

    var fromDay = fromDayInput ? parseInt(fromDayInput, 10) : 1; // Если не указано, с первого числа
    var maxDay = new Date(year, month, 0).getDate();
    var toDay = toDayInput ? Math.min(parseInt(toDayInput, 10), maxDay) : maxDay; // Если не указано, до конца месяца

    var tbody = document.getElementById('paytable').querySelector('tbody');
    tbody.innerHTML = '';

    var paymentsArray = [];

    for (var lsKey in oplat) {
        if (oplat.hasOwnProperty(lsKey)) {
            var userPayments = oplat[lsKey];
            var userInfo = ls[lsKey];

            if (userPayments[year] && userPayments[year][month]) {
                var payments = userPayments[year][month];
                for (var i = 0; i < payments.length; i++) {
                    var payment = payments[i];
                    var day = parseInt(payment.date.split('.')[0], 10);
                    if (day >= Math.min(fromDay, toDay) && day <= Math.max(fromDay, toDay)) {
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
        var dateA = new Date(a.date.split('.').reverse().join('-'));
        var dateB = new Date(b.date.split('.').reverse().join('-'));
        if (fromDay > toDay) return dateB - dateA; // Обратная сортировка
        if (dateA - dateB !== 0) return dateA - dateB;
        return parseInt(a.kv, 10) - parseInt(b.kv, 10);
    });


    // Генерация таблицы
    var isLastColumnHidden = document.querySelector('#paytable th:nth-child(4)').style.display === 'none';
    for (var i = 0; i < paymentsArray.length; i++) {
        var payment = paymentsArray[i];
        var row = document.createElement('tr');
        row.innerHTML = '<td>' + payment.date + '</td>' +
            '<td>' + payment.kv + '</td>' +
            '<td>' + payment.sum.toFixed(2) + '</td>' +
            '<td' + (isLastColumnHidden?' style="display: none;"':'') + '>' + highlightApartmentNumber(payment.nazn, payment.kv) + '</td>';
        tbody.appendChild(row);
    }
}

function initPayTable() {
    document.getElementById('maincontainer').innerHTML =
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
        '<div class="column button-column">' +
        '<button onclick="generatePayTable()">Показать данные</button>' +
        '</div>' +
        '<div class="full-span">' +
        'Щелчок по заголовку таблицы - отображение/скрытие назначений платежей' +
        '</div>' +
        '</div>' +
        '<div id="table-container">' +
        '<table id="paytable" class="paytable">' +
        '<thead>' +
        '<tr>' +
        '<th>Дата</th>' +
        '<th>Кв.</th>' +
        '<th>Сумма</th>' +
        '<th>Назначение платежа</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '<div id="datetime"></div>';

    document.getElementById('datetime').innerHTML =
        '<br>Данные указаны по состоянию на <br>' + dt + ' (' + timeAgo(dt) + ' назад.)';
    
    finalDate = new Date(dt.split(' ')[0].split('.').reverse().join('-') + 'T' + dt.split(' ')[1]);
    populateMonthSelector();
    calculateDefaultDays();
    generatePayTable();

    // Добавляем обработчик клика для заголовков таблицы
    var ths = document.getElementById('paytable').querySelectorAll('th');
    for (var i = 0; i < ths.length; i++) {
        ths[i].addEventListener('click', toggleNaznColumn);
    }
}


function highlightApartmentNumber(paymentNazn, apartmentNumber) {
    // Ручная проверка, чтобы убедиться, что номер квартиры не является частью другого числа
    if (!paymentNazn) return '';
    var pattern = '\\b' + apartmentNumber + '\\b';
    var regex = new RegExp(pattern, 'g');
    return paymentNazn.replace(regex, '<strong style="color: #ff0000;">' + apartmentNumber + '</strong>');
}

function toggleNaznColumn() {
    var columnIndex = 3; // Индекс столбца "Назначение платежа" (начиная с 0)
    var table = document.getElementById('paytable');
    var rows = table.querySelectorAll('tr');
    var filterContainer = document.getElementById('filter-container');
    var tableContainer = document.getElementById('table-container');
    var fullscreenTextId = "fullscreen-text";

    // Проверяем, находится ли таблица уже в полноэкранном режиме
    var isFullscreen = !!document.fullscreenElement;
// Получаем данные для заголовка
var fromDay = document.getElementById('fromDay').value;
var toDay = document.getElementById('toDay').value;
var selectedMonth = document.getElementById('monthSelect').value.split('-');
var year = selectedMonth[0];
var month = selectedMonth[1];
var monthName = new Date(year, month - 1).toLocaleString('uk', { month: 'long' });

// Формируем текст
var headerText = `${org}<br>Платежі співвласників<br>з ${fromDay} по ${toDay} ${monthName} ${year}`;
    // Переключаем видимость третьего столбца
    for (var i = 0; i < rows.length; i++) {
        var cell = rows[i].cells[columnIndex];
        if (cell) {
        	if (cell.style.display === 'none'){
        		cell.style.display='';
        	}else{
        		cell.style.display='none';
        	}
        }
    }

    if (!isFullscreen) {
        // Включаем полноэкранный режим
        tableContainer.requestFullscreen().catch(err => {
            console.error(`Ошибка при включении полноэкранного режима: ${err.message}`);
        });

        // Скрываем filter-container
        filterContainer.style.display = "none";

        // Добавляем текст над таблицей
        var fullscreenText = document.createElement('div');
        fullscreenText.id = fullscreenTextId;
        fullscreenText.style.textAlign = "center";
        tableContainer.style.textAlign = "center";
        fullscreenText.style.fontSize = "18px";
        fullscreenText.style.fontWeight = "bold";
        fullscreenText.innerHTML = headerText;
        tableContainer.prepend(fullscreenText);
        tableContainer.style.overflow = "auto";
    } else {
        // Выходим из полноэкранного режима
        document.exitFullscreen().catch(err => {
            console.error(`Ошибка при выходе из полноэкранного режима: ${err.message}`);
        });

        // Отображаем filter-container
        filterContainer.style.display = "";

        // Удаляем текст над таблицей
        var fullscreenText = document.getElementById(fullscreenTextId);
        if (fullscreenText) {
            fullscreenText.remove();
        }
    tableContainer.style.overflow = "";
    }
}
