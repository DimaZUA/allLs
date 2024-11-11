function getMinMaxDate() {
    let minDate = null;
    const currentDate = new Date();

    [nach, oplat].forEach(data => {
        for (const accountId in data) {
            const years = Object.keys(data[accountId]);
            if (years.length === 0) continue;

            const firstYear = years[0];
            const months = Object.keys(data[accountId][firstYear]);
            if (months.length === 0) continue;

            const firstMonth = months[0] - 1;
            const date = new Date(firstYear, firstMonth);

            if (!minDate || date < minDate) {
                minDate = date;
            }
        }
    });

    return { minDate, maxDate: currentDate };
}

function setDefaultDates() {
    const { minDate, maxDate } = getMinMaxDate();
    document.getElementById('start-date').min = formatDate(minDate);
    document.getElementById('start-date').max = formatDate(maxDate);
    document.getElementById('end-date').min = formatDate(minDate);
    document.getElementById('end-date').max = formatDate(maxDate);

    const currentDate = new Date();
    const presets = document.getElementById('preset-select');

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const currentMonthIndex = currentDate.getMonth();
    const currentMonthName = `${monthNames[currentMonthIndex]} ${currentDate.getFullYear()}`;
    const previousMonthDate = new Date(currentDate.getFullYear(), currentMonthIndex - 1, 1);
    const previousMonthName = `${monthNames[previousMonthDate.getMonth()]} ${previousMonthDate.getFullYear()}`;
    const twoMonthsAgoDate = new Date(currentDate.getFullYear(), currentMonthIndex - 2, 1);
    const twoMonthsAgoName = `${monthNames[twoMonthsAgoDate.getMonth()]} ${twoMonthsAgoDate.getFullYear()}`;

    presets.innerHTML = `
        <option value="current-month">${currentMonthName}</option>
        <option value="previous-month">${previousMonthName}</option>
        <option value="two-months-ago">${twoMonthsAgoName}</option>
        <option value="current-quarter">Текущий квартал</option>
        <option value="previous-quarter">Предыдущий квартал</option>
        <option value="current-year">Этот год</option>
        <option value="previous-year">Прошлый год</option>
        <option value="custom">Произвольный период</option>
    `;

    applyPreset();
}

function applyPreset() {
    const preset = document.getElementById('preset-select').value;
    const currentDate = new Date();
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');

    if (preset === 'current-month') {
        startDate.value = endDate.value = formatDate(currentDate);
    } else if (preset === 'previous-month') {
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        startDate.value = endDate.value = formatDate(previousMonth);
    } else if (preset === 'two-months-ago') {
        const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
        startDate.value = endDate.value = formatDate(twoMonthsAgo);
    } else if (preset === 'current-quarter') {
        const startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
        startDate.value = formatDate(new Date(currentDate.getFullYear(), startMonth, 1));
        endDate.value = formatDate(currentDate);
    } else if (preset === 'previous-quarter') {
        const startMonth = Math.floor((currentDate.getMonth() - 3) / 3) * 3;
        startDate.value = formatDate(new Date(currentDate.getFullYear(), startMonth, 1));
        endDate.value = formatDate(new Date(currentDate.getFullYear(), startMonth + 2, 1));
    } else if (preset === 'current-year') {
        startDate.value = `${currentDate.getFullYear()}-01`;
        endDate.value = formatDate(currentDate);
    } else if (preset === 'previous-year') {
        startDate.value = `${currentDate.getFullYear() - 1}-01`;
        endDate.value = `${currentDate.getFullYear() - 1}-12`;
    }
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}


function calculateInitialDebit(accountId, start) {
    let debit = 0;

    // Учитываем все оплаты, сделанные до start
    if (oplat[accountId]) {
        for (const year in oplat[accountId]) {
            for (const month in oplat[accountId][year]) {
                let date = new Date(year, month - 1);
                date.setHours(0, 0, 0, 0);
                if (date < start) {
                    oplat[accountId][year][month].forEach(payment => {
                        debit -= payment.sum;
                    });
                }
            }
        }
    }

    // Считаем только начисления до start
    for (const year in nach[accountId]) {
        for (const month in nach[accountId][year]) {
            let date = new Date(year, month - 1);
            date.setHours(0, 0, 0, 0);
            if (date < start) {
                for (const serviceId in nach[accountId][year][month]) {
                    debit += nach[accountId][year][month][serviceId];
                }
            }
        }
    }

    return debit;
}


function generateTable() {
    let start = new Date(document.getElementById('start-date').value);
    let end = new Date(document.getElementById('end-date').value);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Последний день предыдущего месяца
    // Устанавливаем время на 23:59:59.999
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    const displayMode = document.getElementById('display-mode').value;
    const tableContainer = document.getElementById('table-container');
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    table.classList.add('main');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);

    let servicesWithCharges = new Set();

    // Собираем список услуг с начислениями в заданный период
    for (const accountId in nach) {
        for (const year in nach[accountId]) {
            for (const month in nach[accountId][year]) {
                const date = new Date(year, month - 1, 1, 12);
                if (date >= start && date <= end) {
                    for (const serviceId in nach[accountId][year][month]) {
                        servicesWithCharges.add(serviceId);
                    }
                }
            }
        }
    }

    // Создание заголовка
    let headerRow = '<tr><th onclick="sortTable(this)">Квартира</th><th onclick="sortTable(this)">Дебет на начало</th>';
    if (displayMode === 'summarized') {
        Array.from(servicesWithCharges).forEach(serviceId => {
            headerRow += `<th onclick="sortTable(this)">${us[serviceId]}</th>`;
        });
        headerRow += '<th onclick="sortTable(this)">Оплаты</th><th onclick="sortTable(this)">Долг на конец</th></tr>';
    } else {
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            headerRow += `<th onclick="sortTable(this)">Начислено ${month}/${year}</th><th onclick="sortTable(this)">Оплачено ${month}/${year}</th>`;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        headerRow += '<th onclick="sortTable(this)">Долг на конец</th></tr>';
    }
    thead.innerHTML = headerRow;

    let totalStartDebt = 0;
    let totalEndDebt = 0;
    const totalCharges = {};
    const totalPayments = {};

    for (const accountId in nach) {
        let debitStart = calculateInitialDebit(accountId, start);
        totalStartDebt += debitStart;

        const row = document.createElement('tr');
        row.innerHTML = `<td>${ls[accountId].kv}</td><td v="${debitStart.toFixed(2)}"></td>`;

        if (displayMode === 'summarized') {
            const chargesByService = {};
            let paymentsSum = 0;
            let payments = [];
            for (const year in nach[accountId]) {
                for (const month in nach[accountId][year]) {
                    const date = new Date(year, month - 1,1,12);
                    if (date >= start && date <= end) {
                        for (const serviceId in nach[accountId][year][month]) {
                            chargesByService[serviceId] = (chargesByService[serviceId] || 0) + nach[accountId][year][month][serviceId];
                            totalCharges[serviceId] = (totalCharges[serviceId] || 0) + nach[accountId][year][month][serviceId];
                        }
                        if (oplat[accountId] && oplat[accountId][year] && oplat[accountId][year][month]) {
                            oplat[accountId][year][month].forEach(payment => {
                                paymentsSum += payment.sum;
                                payments.push(...oplat[accountId][year][month]);  
                                totalPayments[month] = (totalPayments[month] || 0) + payment.sum;
                            });
                        }
                    }
                }
            }
            Array.from(servicesWithCharges).forEach(serviceId => {
                const charge = chargesByService[serviceId] || 0;
                row.innerHTML += `<td v="${charge.toFixed(2)}"></td>`;
            });
            row.appendChild(generatePaymentCell(payments));
            const debitEnd = debitStart + Object.values(chargesByService).reduce((sum, charge) => sum + charge, 0) - paymentsSum;
            totalEndDebt += debitEnd;
            row.innerHTML += `<td v="${debitEnd.toFixed(2)}"></td>`;
        } else {
            let debitEnd = debitStart;
            let currentDate = new Date(start);
            while (currentDate <= end) {
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                
                // Суммируем начисления
                let charges = 0;
                if (nach[accountId][year] && nach[accountId][year][month]) {
                    charges = Object.values(nach[accountId][year][month]).reduce((sum, val) => sum + val, 0);
                    totalCharges[`${year}-${month}`] = (totalCharges[`${year}-${month}`] || 0) + charges;
                }
                
                // Суммируем оплаты
                let payments = [];
                if (oplat[accountId] && oplat[accountId][year] && oplat[accountId][year][month]) {
                    payments = oplat[accountId][year][month];
                    totalPayments[`${year}-${month}`] = (totalPayments[`${year}-${month}`] || 0) + payments.reduce((sum, payment) => sum + payment.sum, 0);
                }

                // Отображаем начисления и оплаты в ячейках
                row.innerHTML += `<td v="${charges.toFixed(2)}"></td>`;
                row.appendChild(generatePaymentCell(payments));
                
                // Обновляем долг на конец месяца
                debitEnd += charges - payments.reduce((sum, payment) => sum + payment.sum, 0);
                
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            totalEndDebt += debitEnd;
            row.innerHTML += `<td v="${debitEnd.toFixed(2)}"></td>`;
        }

        tbody.appendChild(row);
    }

    const footerRow = document.createElement('tr');
        footerRow.classList.add('itog');
    footerRow.innerHTML = `<td>Итого</td><td v="${totalStartDebt.toFixed(2)}"></td>`;
    if (displayMode === 'summarized') {
        Array.from(servicesWithCharges).forEach(serviceId => {
            const serviceTotal = totalCharges[serviceId] || 0;
            footerRow.innerHTML += `<td v="${serviceTotal.toFixed(2)}"></td>`;
        });
        footerRow.innerHTML += `<td v="${Object.values(totalPayments).reduce((sum, val) => sum + val, 0).toFixed(2)}"></td><td v="${totalEndDebt.toFixed(2)}"></td>`;
    } else {
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const chargeTotal = totalCharges[`${year}-${month}`] || 0;
            const paymentTotal = totalPayments[`${year}-${month}`] || 0;
            footerRow.innerHTML += `<td v="${chargeTotal.toFixed(2)}"></td><td v="${paymentTotal.toFixed(2)}"></td>`;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        footerRow.innerHTML += `<td v="${totalEndDebt.toFixed(2)}"></td>`;
    }
    
    thead.appendChild(footerRow);
    const headerRows = thead.querySelectorAll('tr'); // Получаем все строки <tr>
    const headerRowsClone = Array.from(headerRows).map(row => row.cloneNode(true)); 
    headerRowsClone.forEach(row => {
	  row.classList.add('header-row-clone');
	  tbody.appendChild(row);
	  });
    tableContainer.appendChild(table);

initPosters();


}



function sortTable(header) {
    const table = header.closest('table');
    const tbody = table.querySelector('tbody');


    // Удаляем все строки с классом "header-row-clone"
    const cloneRows = tbody.querySelectorAll('.header-row-clone');
    cloneRows.forEach(row => row.remove());

    const rows = Array.from(tbody.rows);

    const isAsc = header.classList.contains('sorted-asc');
    const index = Array.from(header.parentNode.children).indexOf(header);

    // Убираем классы сортировки с других заголовков
    header.parentNode.querySelectorAll('th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
    header.classList.add(isAsc ? 'sorted-desc' : 'sorted-asc');

    // Сортируем строки
    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[index].getAttribute('v') || rowA.cells[index].textContent;
        const cellB = rowB.cells[index].getAttribute('v') || rowB.cells[index].textContent;
        const valA = parseFloat(cellA) || cellA;
        const valB = parseFloat(cellB) || cellB;

        return isAsc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
    });

    // Добавляем отсортированные строки обратно в tbody
    rows.forEach(row => tbody.appendChild(row));

    const thead = table.querySelector('thead');
    const headerRows = thead.querySelectorAll('tr'); // Получаем все строки <tr>
    const headerRowsClone = Array.from(headerRows).map(row => row.cloneNode(true)); 
    headerRowsClone.forEach(row => {
	  row.classList.add('header-row-clone');
	  tbody.appendChild(row);
	  });

}

function generatePaymentCell(payments) {
    const totalPayment = payments.reduce((sum, payment) => sum + payment.sum, 0);
    const paymentCell = document.createElement('td');
    paymentCell.setAttribute('v', totalPayment.toFixed(2));
if (payments.length === 1) {
        const payment = payments[0];
        paymentCell.classList.add('poster');
        if (payment.date) {
            paymentCell.innerHTML = `
                <div class="descr">
                    <div>Оплачено ${payment.date} через ${b[payment.yur] || 'неизвестный банк'}<br>
                    ${payment.kvit ? `Квітанція: ${payment.kvit}<br>` : ''}
                    ${payment.nazn ? `Призначення: ${payment.nazn}` : ''}
                    </div>
                </div>
            `;
        }
} else if (payments.length > 0) {
    paymentCell.classList.add('poster');
    let hasKvit = false;  // Флаг для проверки наличия payment.kvit
    let hasNazn = false;  // Флаг для проверки наличия payment.nazn

    // Первый проход для определения наличия payment.kvit и payment.nazn
    payments.forEach(payment => {
        if (payment.kvit > "") hasKvit = true;  // Проверка на наличие квитанции
        if (payment.nazn > "") hasNazn = true;  // Проверка на наличие призначення
    });

    let paymentRows = '';
    
    // Второй проход для создания строк таблицы
    payments.forEach(payment => {
        paymentRows += `
            <tr>
                <td>${payment.date}</td>
                <td>${b[payment.yur] || 'неизвестный банк'}</td>
                <td>${payment.sum.toFixed(2)}</td>
                ${hasKvit ? `<td>${payment.kvit||''}</td>` : ''}
                ${hasNazn ? `<td>${payment.nazn||''}</td>` : ''}
            </tr>
        `;
    });

    paymentCell.innerHTML = `
        <div class="descr">
            <table class="subtable">
                <tbody>
                    <tr>
                        <th>Дата</th>
                        <th>Оплачено через</th>
                        <th>Сумма</th>
                        ${hasKvit ? '<th>Квітанція</th>' : ''}
                        ${hasNazn ? '<th>Призначення</th>' : ''}
                    </tr>
                    ${paymentRows}
                </tbody>
            </table>
        </div>
    `;
}
    return paymentCell;
}


function handlePeriodChange() {
    const presetSelect = document.getElementById('preset-select');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const displayModeSelect = document.getElementById('display-mode');
    const showDataButton = document.querySelector('button');

    // Скрыть или показать поля "С" и "По"
    if (presetSelect.value === 'custom') {
        startDateInput.disabled = false;
        endDateInput.disabled = false;
    } else {
        startDateInput.disabled = true;
        endDateInput.disabled = true;
    }

    // Скрыть или показать "Отображение" в зависимости от того, равны ли "С" и "По"
/*    if (startDateInput.value !== "" && endDateInput.value !== "" && startDateInput.value !== endDateInput.value) {
        displayModeSelect.disabled = false;
    } else {
        displayModeSelect.disabled = true;
    }
*/
    // Включить или выключить кнопку "Показать данные" в зависимости от значений "С" и "По"
    // Преобразуем даты в объект Date для правильного сравнения
    const startDate = new Date(startDateInput.value + "-01"); // Преобразуем в дату
    const endDate = new Date(endDateInput.value + "-01"); // Преобразуем в дату

    if (startDate <= endDate) {
        showDataButton.disabled = false;
    } else {
        showDataButton.disabled = true;
    }
}

function initTable(){
    document.getElementById('maincontainer').innerHTML=`
    <DIV id='org' ALIGN=RIGHT>
    <div id="filter-container">
        <DIV><DIV><label>Выберите период:</label>
        <select id="preset-select" onchange="applyPreset()">
            <!-- Эти опции обновляются в setDefaultDates() -->
        </select></DIV>
        <DIV><label>Отображение:</label>
        <select id="display-mode">
            <option value="summarized">По услугам</option>
            <option value="detailed">По месяцам</option>
        </select></DIV></DIV>

        <DIV><DIV><label>С:</label>
        <input type="month" id="start-date"></DIV>
        <DIV><label>По:</label>
        <input type="month" id="end-date"></DIV></DIV>


        <button id="show" onclick="generateTable()">Показать данные</button>
    </div>

    <div id="table-container">
        <!-- Таблица с отчётом будет добавлена здесь -->
    </div>
</div><DIV id='datetime'></div>
    `;
document.getElementById('datetime').innerHTML = `
    <br>Данные указаны по состоянию на <br>${dt} (${timeAgo(dt)}назад.)`;
setDefaultDates();
handlePeriodChange();
    document.getElementById('preset-select').addEventListener('change', handlePeriodChange);
    document.getElementById('start-date').addEventListener('input', handlePeriodChange);
    document.getElementById('end-date').addEventListener('input', handlePeriodChange);
generateTable();
}
