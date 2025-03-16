let bankTableAbortController = new AbortController();

function initBankTable() {
    // Вставка контейнера с фильтрами и таблицей
document.getElementById('maincontainer').innerHTML =
    '<div id="filter-container">' +
        '<div class="column">' +
            '<label>С:' +
                '<input type="date" id="fromDate">' +
            '</label>' +
            '<label>По:' +
                '<input type="date" id="toDate">' +
            '</label>' +
        '</div>' +
        
        '<div class="column">' +
            '<label>За:' +
                '<select id="monthSelect"></select>' +
            '</label>' +
            '<label>Тип:' +
                '<select id="typeSelect">' +
                    '<option value="all">Всё</option>' +
                    '<option value="allNoSobst">Всё без собственников</option>' +
                    '<option value="income">Поступления все</option>' +
                    '<option value="incomeNoSobst">Поступления без собственников</option>' +
                    '<option value="expense">Расходы все</option>' +
                    '<option value="expenseZP">Зарплата, налоги, подотчет</option>' +
                    '<option value="expenseCom">Платежи поставщикам</option>' +
                    '<option value="expensenoZPnoCom">Прочие расходы</option>' +
                '</select>' +
            '</label>' +
        '</div>' +

        '<!-- Обертка для текстового фильтра и кнопки -->' +
        '<div class="full-span" style="display: flex; align-items: center; gap: 10px;">' +
            '<input type="text" id="textFilter" placeholder="Введите текст для фильтрации" style="flex: 1; min-width: 200px;">' +
            '<button id="xls" onclick="exportTableToExcel()" ' +
                'style="background-color: #4CAF50; color: white; padding: 10px 20px; font-size: 16px; border: none; cursor: pointer; display: flex; align-items: center;">' +
                '<img src="https://upload.wikimedia.org/wikipedia/commons/8/8d/Microsoft_Excel_Logo_%282013-2019%29.svg" ' +
                'alt="Excel Icon" style="width: 20px; height: 20px; margin-right: 10px;">' +
                'Скачать в Excel' +
            '</button>' +
        '</div>' +

    '</div>' +

    '<div id="table-container">' +
        '<table id="banktable" class="banktable">' +
            '<thead>' +
                '<tr>' +
                    '<th>Дата</th>' +
                    '<th>Сумма</th>' +
                    '<th>За</th>' +
                    '<th>Контрагент</th>' +
                    '<th>За что</th>' +
                    '<th>Назначение платежа</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody></tbody>' +
        '</table>' +
    '</div>';


    // Добавление обработчиков событий для фильтров
    document.querySelector("#fromDate").addEventListener("change", debouncedGenerateBankTable);
    document.querySelector("#toDate").addEventListener("change", debouncedGenerateBankTable);
    document.querySelector("#fromDate").addEventListener("change", payedMonthSelector);
    document.querySelector("#toDate").addEventListener("change", payedMonthSelector);
    document.querySelector("#monthSelect").addEventListener("change", generateBankTable);
    document.querySelector("#typeSelect").addEventListener("change", generateBankTable);
    document.querySelector("#textFilter").addEventListener("input", debouncedGenerateBankTable);
    setInitialDates();
    // Инициализация месяца и отображение данных
    payedMonthSelector();
   generateBankTable();
}

function setInitialDates () {
    // Конечная дата - это значение переменной dt
    var dtDate = new Date(dt.split(' ')[0].split('.').reverse().join('-') + 'T' + dt.split(' ')[1]);
    var endDate = dtDate;

    // Начальная дата зависит от текущего числа
    var today = new Date();
    var startDate;

    // Проверка, если сегодня больше 10-го числа, то начальная дата - 1-е число текущего месяца
    if (today.getDate() > 10) {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);  // 1-е число текущего месяца
    } else {
        // Если сегодня 10-е число или меньше, то начальная дата - 1-е число предыдущего месяца
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);  // 1-е число предыдущего месяца
    }
    // Устанавливаем начальную и конечную дату в элементы управления
    document.getElementById('fromDate').value = formatDate(startDate,"yyyy-mm-dd");
    document.getElementById('toDate').value = formatDate(endDate,"yyyy-mm-dd");
    document.getElementById('typeSelect').value = 'allNoSobst'
}


// Функция для заполнения селектора месяцев
function payedMonthSelector() {
    // Получаем начальную и конечную дату из выбранных значений
    var fromDate = new Date(document.getElementById('fromDate').value);
    var toDate = new Date(document.getElementById('toDate').value);

        // Конвертируем начальную и конечную даты в год и месяц для сравнения
    var fromYear = fromDate.getFullYear();
    var toYear = toDate.getFullYear();
    var fromMonth = fromDate.getMonth(); // Месяц от 0 до 11
    var toMonth = toDate.getMonth(); // Месяц от 0 до 11
    
    // Собираем все месяцы из данных plat
    var months = new Set();

    // Перебираем все записи в plat
    for (var year in plat) {
var yearInt = parseInt(year);

        // Если год вне диапазона, пропускаем его
        if (yearInt < fromYear || yearInt > toYear) {
            continue;
        }

        for (var month in plat[year]) {
            var monthInt = parseInt(month) - 1; // Преобразуем месяц к 0-индексации

            // Если месяц вне диапазона, пропускаем его
            if (yearInt === fromYear && monthInt < fromMonth || yearInt === toYear && monthInt > toMonth) {
                continue;
            }
            // Перебираем все записи для месяца
            for (var i = 0; i < plat[year][month].length; i++) {
                var payment = plat[year][month][i];

                // Проверяем, если "ЗаКакойМесяцЭтотПлатеж" существует и находится в выбранном диапазоне
                var paymentMonth = payment[8]; // За какой месяц этот платеж

                if (paymentMonth) {
                    // Добавляем в Set (он автоматически исключает дубли)
                    months.add(paymentMonth);
                }
            }
        }
    }

    // Преобразуем Set в массив и сортируем по убыванию
    months = Array.from(months).sort((a, b) => b - a);

    // Заполняем выпадающий список месяцами
    var monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = ''; // Очищаем предыдущие значения
        var option = document.createElement('option');
        option.value = 0;
        option.textContent = "(Любой месяц)";
        monthSelect.appendChild(option);

    // Добавляем опции в select
    months.forEach(function(month) {
        var option = document.createElement('option');
        option.value = month;
        option.textContent = formatDate(convertToDate(month),'mmmm yyyy');
        monthSelect.appendChild(option);
    });
}

// Асинхронная версия generateBankTable с отменой предыдущего вызова
async function generateBankTable() {
    bankTableAbortController.abort(); // Отменяем предыдущий вызов
    bankTableAbortController = new AbortController();
    const signal = bankTableAbortController.signal;

    try {
        console.log("Выполняем generateBankTable...");
    // Получаем значения из элементов управления
    var fromDate = new Date(document.getElementById('fromDate').value);
    var toDate = new Date(document.getElementById('toDate').value);
    var selectedMonth = document.getElementById('monthSelect').value;
    var filterText = document.getElementById('textFilter').value.toLowerCase(); // Текст для фильтрации
    var selectedType = document.getElementById('typeSelect').value; // Получаем выбранный тип из выпадающего списка

        // Конвертируем начальную и конечную даты в год и месяц для сравнения
    var fromYear = fromDate.getFullYear();
    var toYear = toDate.getFullYear();
    var fromMonth = fromDate.getMonth(); // Месяц от 0 до 11
    var toMonth = toDate.getMonth(); // Месяц от 0 до 11


    // Очищаем таблицу перед заполнением
    var tableBody = document.getElementById('banktable').querySelector('tbody');
    tableBody.innerHTML = '';



// Создаем контейнер для итогов, если его нет
var summaryContainer = document.getElementById('summary-container');
if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.id = 'summary-container';
    summaryContainer.style.fontWeight = 'bold';
    summaryContainer.style.marginBottom = '10px';
    document.getElementById('table-container').prepend(summaryContainer);
}

// Вычисляем остаток на начало, остаток на конец, всего получено и всего оплачено
var balanceStart = 0;
var balanceEnd = 0;
var totalReceivedAmount = 0;
var totalPaidAmount = 0;
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(0, 0, 0, 0);
for (var year in plat) {
    var yearInt = parseInt(year);
    for (var month in plat[year]) {
        var monthInt = parseInt(month) - 1;
        for (var i = 0; i < plat[year][month].length; i++) {
            var payment = plat[year][month][i];
            var date = new Date(year, month - 1, payment[0]);
            date.setHours(0, 0, 0, 0);
            var amount = payment[1];
            var isExpense = /^31\d*/.test(payment[6]);
            if (/^31\d*/.test(payment[7]) && isExpense) continue;
            if (date < fromDate) {
                balanceStart += isExpense ? -amount : amount;
            }
            if (date <= toDate && date >= fromDate) {  // Убедимся, что дата в пределах периода
                balanceEnd += isExpense ? -amount : amount;
                if (isExpense) {
                    totalPaidAmount += amount;
                } else {
                    totalReceivedAmount += amount;
                }
            }
        }
    }
}
balanceEnd+=balanceStart;

// Обновляем контейнер с итогами
// Преобразуем fromDate и toDate в формат, например, "ДД.ММ.ГГГГ"
var fromDateFormatted = fromDate.toLocaleDateString('ru-RU');
var toDatePlusOne = new Date(toDate);
toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);

// Форматируем новую дату
var toDateFormatted = toDatePlusOne.toLocaleDateString('ru-RU');

summaryContainer.innerHTML = `
    <div style="display: flex; gap: 20px;">
        <div>
            Остаток на (${fromDateFormatted}): <span>${balanceStart.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> грн<br>
            Остаток на (${toDateFormatted}): <span>${balanceEnd.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> грн
        </div>
        <div>
            Всего получено: <span class="green">${totalReceivedAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> грн<br>
            Всего оплачено: <span class="red">${totalPaidAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> грн
        </div>
    </div>
`;


 // Инициализируем переменные для подсчета
    var totalReceivedAmount = 0;
    var totalPaidAmount = 0;
    var totalReceivedCount = 0;
    var totalPaidCount = 0;
    // Перебираем все записи в платах
    for (var year in plat) {
var yearInt = parseInt(year);

        // Если год вне диапазона, пропускаем его
        if (yearInt < fromYear || yearInt > toYear) {
            continue;
        }
        for (var month in plat[year]) {
            var monthInt = parseInt(month) - 1; // Преобразуем месяц к 0-индексации

            // Если месяц вне диапазона, пропускаем его
            if (yearInt === fromYear && monthInt < fromMonth || yearInt === toYear && monthInt > toMonth) {
                continue;
            }
            // Перебираем все записи для месяца
            for (var i = 0; i < plat[year][month].length; i++) {
                var payment = plat[year][month][i];
                var kt=payment[6];
                var dt=payment[7];
                var paymentMonth = payment[8]; // За какой месяц этот платеж
                if (selectedMonth>1&&paymentMonth != selectedMonth) continue;
                if (filterText){
                   // Получаем данные для фильтрации
                   var paymentText = payment[5] ? payment[5].toLowerCase() : ''; // Назначение платежа
                   var contargent = kto[payment[2]]; // Назначение (по кодам)
                   var paymentType = what[payment[3]]; // "За что"
                   var regex = new RegExp(filterText.replace(/[\*\s]+/g, '.*'), 'i'); 
                   if (!regex.test(paymentText) && !regex.test(contargent) && !regex.test(paymentType)) {
		    continue;
		   }

                }

                // Фильтрация по типу
                var shouldInclude = false;
                switch (selectedType) {
                    case "all":
                        shouldInclude = true;
                        break;
                    case "allNoSobst":
                        if (kt!=377) shouldInclude = true;
                        break;
                    case "income":
                        if (/^311\d*/.test(dt)) shouldInclude = true; // Поступления
                        break;
                    case "incomeNoSobst":
                        if (/^311\d*/.test(dt) && kt!=377) shouldInclude = true; // Поступления без собственников
                        break;
                    case "expense":
                        if (/^311\d*/.test(kt)) shouldInclude = true; // Расходы
                        break;
                    case "expenseZP":
                        if (/^311\d*/.test(kt) && (/^6[456]\d+/.test(dt)||dt==372||/^3[01]\d+/.test(dt))) shouldInclude = true; // Зарплата, налоги, подотчет
                        break;
                    case "expenseCom":
                        if (/^311\d*/.test(kt) && /^63\d+/.test(dt)) shouldInclude = true; // Зарплата, налоги, подотчет
                        break;
                    case "expensenoZPnoCom":
                        if (/^311\d*/.test(kt) && !/^63\d+/.test(dt) && !(/^6[456]\d+/.test(dt)||dt==372||/^311\d*/.test(dt))) shouldInclude = true; // Прочие расходы
                        break;
                }
                    if (!shouldInclude) continue;
                    var date = new Date(year, month - 1, payment[0]); // Создаем дату по году, месяцу и дню
                    fromDate.setHours(0, 0, 0, 0);
                    date.setHours(0, 0, 0, 0);
                    toDate.setHours(0, 0, 0, 0);
                    if (date >= fromDate && date <= toDate) {
                        // Проверяем, попадает ли дата в выбранный диапазон
                        
                        // Преобразуем данные для строки таблицы
                        var row = document.createElement('tr');

                        // Дата
                        var dateCell = document.createElement('td');
                        dateCell.textContent = formatDate(date,"d.mm.yy");
                        row.appendChild(dateCell);

                        // Сумма
                        var amountCell = document.createElement('td');
                        if (/^31\d+/.test(kt)) {
                        	amountCell.classList.add('red');
                        totalPaidAmount += payment[1];  // Добавляем к сумме оплаченных
                        totalPaidCount++;  
                        amountCell.textContent = (-payment[1]).toFixedWithComma();
                        }
                        if (/^31\d+/.test(dt)) {
                        	amountCell.classList.add('green');
                       totalReceivedAmount += payment[1];  // Добавляем к сумме полученных
                        totalReceivedCount++;  
                        amountCell.textContent = payment[1].toFixedWithComma();
                        }

                        row.appendChild(amountCell);

                        // За
                        var forMonthCell = document.createElement('td');
                        if (paymentMonth) forMonthCell.textContent = formatDate(convertToDate(paymentMonth),'mmm yy');
                        row.appendChild(forMonthCell);

                        // Контрагент
                        var counterpartyCell = document.createElement('td');
                        counterpartyCell.textContent = getCounterpartyName(payment[2]);
                        row.appendChild(counterpartyCell);

                        // За что
                        var purposeCell = document.createElement('td');
                        purposeCell.textContent = getPurpose(payment[3]);
                        row.appendChild(purposeCell);

                        // Назначение платежа
                        var paymentPurposeCell = document.createElement('td');
                        paymentPurposeCell.textContent = payment[5] || '-'; // Если назначение пустое, показываем '-'
                        row.appendChild(paymentPurposeCell);

                        // Добавляем строку в таблицу
                        tableBody.appendChild(row);
                    }
                
            }
        }
    }




// Добавляем строку с итогами
var totalsRow = document.createElement('tr');
var totalsLabelCell = document.createElement('td');
totalsLabelCell.colSpan = 6;

// Создаем строку с итогами
var totalsText = document.createElement('span');
totalsText.textContent = `Разом`;

if(totalPaidAmount||totalReceivedAmount){
if (totalReceivedAmount){
// Создаем элемент для суммы полученных платежей
totalsText.appendChild(document.createTextNode(` Отримано: ${totalReceivedCount} платежей на сумму `));
var receivedAmount = document.createElement('span');
receivedAmount.textContent = `${totalReceivedAmount.toFixed(2)} грн.`;
receivedAmount.style.fontWeight = 'bold';  // Жирный шрифт
receivedAmount.style.fontSize = '1.2em';  // Увеличенный размер шрифта
receivedAmount.classList.add('green');
totalsText.appendChild(receivedAmount);
}

if(totalPaidAmount){
// Добавляем разделитель
totalsText.appendChild(document.createTextNode(`  Сплачено: ${totalPaidCount} платежей на сумму `));
// Создаем элемент для суммы оплаченных платежей
var paidAmount = document.createElement('span');
paidAmount.textContent = `${totalPaidAmount.toFixed(2)} грн.`;
paidAmount.style.fontWeight = 'bold';  // Жирный шрифт
paidAmount.style.fontSize = '1.2em';  // Увеличенный размер шрифта
paidAmount.classList.add('red');
totalsText.appendChild(paidAmount);
}

// Добавляем финальный текст в ячейку
totalsLabelCell.appendChild(totalsText);

totalsRow.appendChild(totalsLabelCell);


    tableBody.appendChild(totalsRow);
    }

} catch (error) {
        if (error.name === "AbortError") {
            console.log("Обновление таблицы отменено");
        } else {
            console.error("Ошибка:", error);
        }
    }

}
// Дебаунс-версия для input (фильтр по тексту)
const debouncedGenerateBankTable = debounce(generateBankTable, 100);


// Функция для получения контрагента по коду
function getCounterpartyName(counterpartyCode) {
    // Здесь предполагается, что у вас есть объект 'kto' с соответствующими значениями
    return kto[counterpartyCode] || 'Неизвестно';
}

// Функция для получения назначения платежа по коду
function getPurpose(purposeCode) {
    // Здесь предполагается, что у вас есть объект 'what' с соответствующими значениями
    return what[purposeCode] || 'Неизвестно';
}
