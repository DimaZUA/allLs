function addStuff(accountId) {
    const accountData = nach[accountId]; // Данные для указанного accountId
    const paymentData = oplat[accountId] || {}; // Данные оплат для указанного accountId
    const container = document.getElementById('din'); // Контейнер для таблицы
    container.innerHTML = ''; // Очищаем контейнер перед добавлением новой таблицы
    document.getElementById('fio').textContent = ls[accountId].fio;
    if (!accountData) {
        container.innerHTML = `<p>Данные для ID ${accountId} не найдены.</p>`;
        return;
    }

    let cumulativeBalance = 0;

// Добавляем оплату за те месяцы и годы, которые отсутствуют в начислениях
for (const year in paymentData) {
    if (!accountData[year]) {
        // Если год отсутствует в начислениях, добавляем все оплаты за этот год
        for (const month in paymentData[year]) {
            const monthlyPayments = paymentData[year][month] || [];
            // Суммируем все платежи за этот месяц
            const totalPayments = monthlyPayments.reduce((sum, payment) => sum + payment.sum, 0);
            cumulativeBalance -= totalPayments; // Учитываем оплату как уменьшение долга (или увеличение переплаты)
        }
    } else {
        // Если год есть в начислениях, проверяем каждый месяц
        for (const month in paymentData[year]) {
            if (!accountData[year][month]) {
                // Если месяц отсутствует в начислениях, добавляем оплату только за этот месяц
                const monthlyPayments = paymentData[year][month] || [];
                // Суммируем все платежи за этот месяц
                const totalPayments = monthlyPayments.reduce((sum, payment) => sum + payment.sum, 0);
                cumulativeBalance -= totalPayments; // Учитываем оплату как уменьшение долга (или увеличение переплаты)
            }
        }
    }
}
    
    let lastYearToggle; // Переменная для хранения чекбокса последнего года

    for (const year in accountData) {
        const yearDiv = document.createElement('div');
        const balanceDiv = document.createElement('div');
        const yearToggle = document.createElement('input');
        const yearLabel = document.createElement('label');
        const yearContent = document.createElement('div');

        // Настройка чекбокса для разворачивания/сворачивания
        yearToggle.className = 'toggle-box';
        yearToggle.id = `block-${year}`;
        yearToggle.type = 'checkbox';
        yearLabel.setAttribute('for', `block-${year}`);
        yearLabel.innerHTML = `<div>${year}</div>`;

        yearContent.className = 'box';
if (cumulativeBalance !== 0) {
    // Текст в зависимости от значения cumulativeBalance
    const balanceText = cumulativeBalance > 0
        ? '⚠️ Вхідний борг на початок року'
        : '✅ Вхідна переплата на початок року';

    // Создаем элемент для блока с информацией
    const balanceDiv = document.createElement('div');
    balanceDiv.className = 'balance-info';

    // Создаем span для числа
    let balanceValue = document.createElement('span');
    balanceValue.textContent = `${cumulativeBalance.toFixed(2)}`;

    // Если число положительное, делаем его красным
    if (cumulativeBalance > 0) {
        balanceValue.style.color = 'red'; // Красный цвет для положительного значения
    } else {
        balanceValue.style.color = 'green'; // Зеленый цвет для отрицательного значения
    }

    // Добавляем текст и число в блок
    balanceDiv.textContent = `${balanceText}: `;
    balanceDiv.appendChild(balanceValue);
    balanceValue=document.createElement('span');
    balanceValue.textContent=' грн.';
    balanceDiv.appendChild(balanceValue);
    // Вставляем блок с информацией перед таблицей
    yearContent.appendChild(balanceDiv);
}


        const table = document.createElement('table');
        table.id = 'main';

        const tbody = document.createElement('tbody');

        // Определение уникальных услуг для текущего года
        const services = new Set();
        for (const month in accountData[year]) {
            for (const serviceId in accountData[year][month]) {
                services.add(serviceId);
            }
        }

        // Заголовок таблицы
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td rowspan="2" align="CENTER">Месяц</td>
            <td colspan="${services.size}" align="CENTER">Начислено за месяц</td>
            <td rowspan="2" align="CENTER">Оплачено в месяце</td>
            <td rowspan="2" align="CENTER">Долг(+) Переплата(-) на конец месяца</td>
        `;
        tbody.appendChild(headerRow);

        // Второй ряд заголовка с названиями услуг
        const servicesRow = document.createElement('tr');
        services.forEach(serviceId => {
            const serviceName = us[serviceId] || `Услуга ${serviceId}`;
            const serviceHeader = document.createElement('td');
            serviceHeader.setAttribute('align', 'CENTER');
            serviceHeader.textContent = serviceName;
            servicesRow.appendChild(serviceHeader);
        });
        tbody.appendChild(servicesRow);


        // Заполнение таблицы данными по месяцам
        for (const month in accountData[year]) {
            const transactions = accountData[year][month];
            const row = document.createElement('tr');
            row.innerHTML = `<td align="LEFT">${getMonthName(month)} ${year}</td>`;

            let rowCharges = {};

            services.forEach(serviceId => {
                const charge = transactions[serviceId] || 0;
                rowCharges[serviceId] = charge;
            });

            // Добавляем начисления по каждой услуге в строку
            services.forEach(serviceId => {
                const charge = rowCharges[serviceId].toFixed(2);
                const cell = document.createElement('td');
                cell.setAttribute('v', charge);
                row.appendChild(cell);
            });

            // Получаем данные оплат за текущий месяц
            const monthlyPayments = paymentData[year]?.[month] || [];
            const totalPayments = createPaymentCell(row, monthlyPayments);

            cumulativeBalance += Object.values(rowCharges).reduce((sum, charge) => sum + charge, 0) - totalPayments;

            // Добавляем ячейку с долгом/переплатой
            const balanceCell = document.createElement('td');
            balanceCell.setAttribute('v', cumulativeBalance.toFixed(2));
            row.appendChild(balanceCell);

            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        yearContent.appendChild(table);
        yearDiv.appendChild(yearToggle);
        yearDiv.appendChild(yearLabel);
        yearDiv.appendChild(yearContent);
        container.appendChild(yearDiv);
        lastYearToggle = yearToggle; // Сохраняем чекбокс последнего года
    }

    // Устанавливаем последний год открытым
    if (lastYearToggle) {
        lastYearToggle.checked = true;
    }
    initPosters();
    setParam('kv', ls[accountId].kv);
}


// Функция для преобразования номера месяца в название
function getMonthName(month) {
    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    return monthNames[month - 1];
}

function createPaymentCell(row, monthlyPayments) {
    const totalPayments = monthlyPayments.reduce((sum, payment) => sum + payment.sum, 0);
    const paymentCell = document.createElement('td');
    if (monthlyPayments.length === 1) {
        paymentCell.className = 'poster'; // Добавляем класс оформления
        // Одна оплата — отображаем простую строку
        const payment = monthlyPayments[0];
        paymentCell.setAttribute('v', totalPayments.toFixed(2));
        paymentCell.innerHTML = `
            <div class="descr">
                <div class="big">Оплачено ${payment.date} через ${b[payment.yur]}${payment.kvit ? `<br>Квітанція: ${payment.kvit}` : ''} ${payment.nazn ? `<br>Призначення: ${payment.nazn}` : ''} </div>
            </div>
        `;
    } else if (monthlyPayments.length > 1) {
        paymentCell.className = 'poster'; // Добавляем класс оформления
        // Несколько оплат — отображаем таблицу с деталями
// Определяем, есть ли хотя бы одна запись для квитанции или назначения
const hasKvit = monthlyPayments.some(payment => payment.kvit);
const hasNazn = monthlyPayments.some(payment => payment.nazn);

// Настраиваем строку заголовка таблицы
let headerRow = `
    <tr>
        <th>Дата</th>
        <th>Оплачено через</th>
        ${hasKvit ? '<th>Квитанция</th>' : ''}
        <th>Сумма</th>
        ${hasNazn ? '<th>Призначення</th>' : ''}
    </tr>
`;

// Формируем строки с данными платежей
const tableRows = monthlyPayments.map(payment => `
    <tr>
        <td class="big">${payment.date}</td>
        <td>${b[payment.yur]}</td>
        ${hasKvit ? `<td>${payment.kvit || ''}</td>` : ''}
        <td class="big">${payment.sum.toFixed(2)}</td>
        ${hasNazn ? `<td>${payment.nazn || ''}</td>` : ''}
    </tr>
`).join('');

// Устанавливаем содержимое ячейки оплаты
paymentCell.setAttribute('v', totalPayments.toFixed(2));
paymentCell.innerHTML = `
    <div class="descr">
        <table class="subtable">
            <tbody>
                ${headerRow}
                ${tableRows}
            </tbody>
        </table>
    </div>
        `;
    }

    row.appendChild(paymentCell);
    return totalPayments;
}
function initLS() {
    document.getElementById('maincontainer').innerHTML=`
    <DIV id='org' ALIGN=RIGHT></DIV><DIV id='ls' ALIGN=CENTER class='big bold'></DIV><TABLE WIDTH=100%><TR><TD ALIGN=RIGHT><B>Адрес:</B></TD><TD class='big' ALIGN=LEFT><U><I><a id='adr'>adr</a><select class='big' id='number'></select></TD></TR><TR><TD ALIGN=RIGHT><B>Ф.И.О.:</B></TD><TD ALIGN=LEFT><U><I><div class='big' id='fio'></U></I></TD></div></TR></TABLE><DIV id='din'></div><DIV id='datetime'></div>
    `;
    document.getElementById('number').addEventListener('change', function() {
        addStuff(this.value)});

    document.getElementById('adr').textContent = adr + ' / ';
    document.getElementById('org').textContent = org;
    document.title = org +' ' +adr;
    Object.entries(ls).forEach(([index, value]) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = value.kv;
        document.getElementById('number').appendChild(option);
    });
    let ind=getParam('kv');
    if (!ind) {
        ind = Object.keys(ls)[1];
    } else {
        ind = Object.keys(ls).find(key => ls[key].kv === ind || ls[key].ls === ind);
        if (ind === undefined) {
            ind = Object.keys(ls)[1];
        }
    }
    addStuff(ind);
    document.getElementById('number').value = ind;
document.getElementById('datetime').innerHTML = `
    <br>Данные указаны по состоянию на <br>${dt} (${timeAgo(dt)}назад.)
`;
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
    history.pushState(null, '', newUrl);

    // Сохраняем параметр в localStorage с ключом 'last_paramName'
    localStorage.setItem(`last_${paramName}`, paramValue);

    console.log(`Updated URL: ${newUrl}`);
    console.log(`Stored in localStorage: last_${paramName} = ${paramValue}`);
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
