function initBankTable() {
    // Вставка контейнера с фильтрами и таблицей
    document.getElementById('maincontainer').innerHTML =
        '<div id="filter-container">' +
        '<div class="column">' +
        '<label>С:' +
        '<input type="date" id="fromDate">' +  // Для выбора даты "с"
        '</label><label>По:' +
        '<input type="date" id="toDate">' +  // Для выбора даты "по"
        '</label></div>' +
        '<div class="column">' +
        '<label>За:' +
        '<select id="monthSelect"></select>' +  // Выпадающий список для выбора месяца
        '</label>' +
        '<label>Тип:' +
        '<select id="typeSelect">' +
        '<option value="all">Все</option>' +
        '<option value="income">Поступления</option>' +
        '<option value="expense">Расходы</option>' +
        '</select>' +  // Выпадающий список для выбора типа (поступления, расходы, все)
        '</label></div>' +
        '<div class="full-span">' + // Изменили div на full-span для фильтра по тексту
        '<input type="text" id="textFilter" placeholder="Введите текст для фильтрации" style="width:90%;">' + // Поле для фильтрации по тексту на всю ширину
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
    document.querySelector("#fromDate").addEventListener("input", generateBankPayTable);
    document.querySelector("#toDate").addEventListener("input", generateBankPayTable);
    document.querySelector("#fromDate").addEventListener("input", populateMonthSelector);
    document.querySelector("#toDate").addEventListener("input", populateMonthSelector);
    document.querySelector("#monthSelect").addEventListener("change", generateBankPayTable);
    document.querySelector("#typeSelect").addEventListener("change", generateBankPayTable);
    document.querySelector("#textFilter").addEventListener("input", generateBankPayTable);
    setInitialDates();
    // Инициализация месяца и отображение данных
    populateMonthSelector();
    //generateBankPayTable();
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
function formatDate(date) {
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);  // Месяцы начинаются с 0, поэтому добавляем 1
    var year = date.getFullYear();
    return year + '-' + month + '-' + day;
}
    // Устанавливаем начальную и конечную дату в элементы управления
    document.getElementById('fromDate').value = formatDate(startDate);
    document.getElementById('toDate').value = formatDate(endDate);
}


function generateBankPayTable() {
return;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const selectedMonth = document.getElementById("monthSelect").value;
    const selectedType = document.getElementById("typeSelect").value;
    const textFilter = document.getElementById("textFilter").value.toLowerCase();

    // Пример данных (вы можете получить их из вашего источника)
    const payments = [
        { date: '2022-01-15', sum: 1000, purpose: 'Плата за услуги', recipient: 'Киевстар', for_what: 'Телефон', payment_purpose: 'Платеж по счету', type: 'expense' },
        { date: '2022-01-20', sum: 2000, purpose: 'Зарплата', recipient: 'Виплата зарплати', for_what: 'Зарплата', payment_purpose: 'Оплата труда', type: 'income' },
        // Другие записи...
    ];

    // Фильтрация по дате
    const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        const dateFilter = (!fromDate || paymentDate >= from) && (!toDate || paymentDate <= to);

        // Фильтрация по типу (поступления/расходы)
        const typeFilter = selectedType === 'all' || payment.type === selectedType;

        // Фильтрация по тексту
        const textFilterApplied = payment.purpose.toLowerCase().includes(textFilter) || 
                                  payment.recipient.toLowerCase().includes(textFilter) ||
                                  payment.for_what.toLowerCase().includes(textFilter) ||
                                  payment.payment_purpose.toLowerCase().includes(textFilter);

        return dateFilter && typeFilter && textFilterApplied;
    });

    // Заполнение таблицы
    const tbody = document.querySelector("#paytable tbody");
    tbody.innerHTML = filteredPayments.map(payment => 
        `<tr>
            <td>${payment.date}</td>
            <td>${payment.sum}</td>
            <td>${payment.purpose}</td>
            <td>${payment.recipient}</td>
            <td>${payment.for_what}</td>
            <td>${payment.payment_purpose}</td>
        </tr>`
    ).join('');
}

function populateMonthSelector() {
    // Получаем начальную и конечную дату из выбранных значений
    var fromDate = new Date(document.getElementById('fromDate').value);
    var toDate = new Date(document.getElementById('toDate').value);
    
    // Собираем все месяцы из данных plat
    var months = new Set();

    // Перебираем все записи в plat
    for (var year in plat) {
        for (var month in plat[year]) {
            // Перебираем все записи для месяца
            for (var i = 0; i < plat[year][month].length; i++) {
                var payment = plat[year][month][i];

                // Проверяем, если "ЗаКакойМесяцЭтотПлатеж" существует и находится в выбранном диапазоне
                var paymentMonth = payment[8]; // За какой месяц этот платеж
                if (paymentMonth ) 
                var s=1;
                if (paymentMonth && isWithinRange(paymentMonth, fromDate, toDate)) {
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

    // Добавляем опции в select
    months.forEach(function(month) {
        var option = document.createElement('option');
        option.value = month;
        option.textContent = 'Месяц ' + month;
        monthSelect.appendChild(option);
    });
}

// Функция для проверки, находится ли месяц в выбранном диапазоне
function isWithinRange(month, fromDate, toDate) {
    var startMonth = fromDate.getMonth() + 1; // Месяц в fromDate (1-12)
    var endMonth = toDate.getMonth() + 1; // Месяц в toDate (1-12)

    // Проверяем, если месяц находится в пределах от startMonth до endMonth
    return month >= startMonth && month <= endMonth;
}
