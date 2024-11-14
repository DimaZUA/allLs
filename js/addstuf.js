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
    let currentMonth = new Date().getMonth(); // Текущий месяц
    let currentYear = new Date().getFullYear();
    let lastYearToggle; // Переменная для хранения чекбокса последнего года
    let lastRow;
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
                balanceValue.classList.add("red"); // Красный цвет для положительного значения
            } else {
                balanceValue.classList.add('green'); // Зеленый цвет для отрицательного значения
            }

            // Добавляем текст и число в блок
            balanceDiv.textContent = `${balanceText}: `;
            balanceDiv.appendChild(balanceValue);
            balanceValue = document.createElement('span');
            balanceValue.textContent = ' грн.';
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
        headerRow.innerHTML =
            `<td rowspan="2" align="CENTER">Месяц</td>
             <td colspan="${services.size}" align="CENTER">Начислено за месяц</td>
             <td rowspan="2" align="CENTER">Оплачено в месяце</td>
             <td rowspan="2" align="CENTER">Долг(+) Переплата(-) на конец месяца</td>`;
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

        // Переменные для итоговых сумм по году
        let totalChargesByService = {};
        let totalPaymentsByService = {};
        let totalChargeForYear = 0;
        let totalPaymentsForYear = 0;
        // Заполнение таблицы данными по месяцам
        for (const month in accountData[year]) {
        
			 // Пропускаем текущий месяц

            const transactions = accountData[year][month];
            const row = document.createElement('tr');
            row.innerHTML = `<td align="LEFT">${getMonthName(month)} ${year}</td>`;

            let rowCharges = {};
            let monthlyChargesTotal = 0;

            services.forEach(serviceId => {
                const charge = transactions[serviceId] || 0;
                rowCharges[serviceId] = charge;
                monthlyChargesTotal += charge;
            });

            // Добавляем начисления по каждой услуге в строку
            services.forEach(serviceId => {
                const charge = rowCharges[serviceId].toFixed(2);
                const cell = document.createElement('td');
                cell.setAttribute('v', charge);
                row.appendChild(cell);
            });
            const cur=(month == currentMonth+1 && year==currentYear);
            // Получаем данные оплат за текущий месяц
            const monthlyPayments = paymentData[year]?.[month] || [];
            const totalPayments = createPaymentCell(row, monthlyPayments);
            if (!cur){
            cumulativeBalance += monthlyChargesTotal - totalPayments;
            // Сохраняем суммы для итогов
            services.forEach(serviceId => {
                totalChargesByService[serviceId] = (totalChargesByService[serviceId] || 0) + rowCharges[serviceId];
            });
            totalPaymentsForYear += totalPayments;
             }
            // Добавляем ячейку с долгом/переплатой
            const balanceCell = document.createElement('td');
            if (cur){
            	balanceCell.setAttribute('v', (cumulativeBalance+monthlyChargesTotal - totalPayments).toFixed(2));
            	if (cumulativeBalance+monthlyChargesTotal - totalPayments>0) balanceCell.classList.add("red"); else balanceCell.classList.add("green");

            }else{
            	balanceCell.setAttribute('v', cumulativeBalance.toFixed(2));
            	if (cumulativeBalance>0) balanceCell.classList.add("red"); else balanceCell.classList.add("green");
            }
            row.appendChild(balanceCell);

            if (cur) 
            {
            	row.classList.add('grey');
            	lastRow=row;
            }else{
            	tbody.appendChild(row);
            }

        }

        // Итоги по году
if (services.size > 1) {
    // Если несколько услуг
    const totalRow = document.createElement('tr');
    totalRow.classList.add('itog'); 
    totalRow.innerHTML = `<td rowspan="2" align="CENTER">Итого за ${year} год</td>`;

    // Итог по каждой услуге
    services.forEach(serviceId => {
        const chargeTotal = totalChargesByService[serviceId] || 0;
        const totalCell = document.createElement('td');
        totalCell.setAttribute('v', chargeTotal.toFixed(2));  
        totalRow.appendChild(totalCell);
    });

    // Общая сумма оплаченных денег
    const totalPaymentsCell = document.createElement('td');
    totalPaymentsCell.rowSpan = 2;
    totalPaymentsCell.setAttribute('v', totalPaymentsForYear.toFixed(2));
    totalRow.appendChild(totalPaymentsCell);

    // Общий долг/переплата на конец года
    const finalBalanceCell = document.createElement('td');
    finalBalanceCell.rowSpan = 2;
    if (cumulativeBalance>0) finalBalanceCell.classList.add("red"); else finalBalanceCell.classList.add("green");
    finalBalanceCell.setAttribute('v', cumulativeBalance.toFixed(2));
    totalRow.appendChild(finalBalanceCell);
    tbody.appendChild(totalRow);

    // Ряд с итогами по всем услугам
    const chargesSummaryRow = document.createElement('tr');
    chargesSummaryRow.classList.add('itog'); 
    const totalChargeForAllServices = Object.values(totalChargesByService).reduce((sum, value) => sum + value, 0);
    chargesSummaryRow.innerHTML = `<td colspan="${services.size}" v="${totalChargeForAllServices.toFixed(2)}"></td>`;
    tbody.appendChild(chargesSummaryRow);

} else {
    // Если одна услуга
    const totalRow = document.createElement('tr');
    totalRow.classList.add('itog'); 
    totalRow.innerHTML = `<td align="LEFT">Итого за ${year} год</td>`;

    // Итог начислений по единственной услуге
    const totalChargeForOneService = Object.values(totalChargesByService)[0] || 0; // Получаем сумму для единственной услуги
    totalRow.innerHTML += `<td v="${totalChargeForOneService.toFixed(2)}"></td>`;

    // Итог по оплатам
    let totalPaymentsForOneService = 0;
    for (const month in paymentData[year]) {
        const monthlyPayments = paymentData[year][month] || [];
        const monthPaymentsSum = monthlyPayments.reduce((sum, payment) => sum + payment.sum, 0);
        totalPaymentsForOneService += monthPaymentsSum;
    }

    totalRow.innerHTML += `<td v="${totalPaymentsForOneService.toFixed(2)}"></td>`;

    // Общий долг/переплата на конец года
    totalRow.innerHTML += `<td class="${cumulativeBalance > 0 ? 'red' : 'green'}" v="${cumulativeBalance.toFixed(2)}"></td>`;


    tbody.appendChild(totalRow);
}
 if (lastRow) tbody.appendChild(lastRow);

        table.appendChild(tbody);
        yearContent.appendChild(table);
        yearDiv.appendChild(yearToggle);
        yearDiv.appendChild(yearLabel);
        yearDiv.appendChild(yearContent);
        container.appendChild(yearDiv);
        lastYearToggle = yearToggle; // Сохраняем чекбокс последнего года
    }
    if (lastYearToggle) {
        lastYearToggle.checked = true;
    }

    const curLS = ls[accountId];
    document.getElementById('datetime').innerHTML =
        `<br><div>
                ЛС: ${curLS.ls}<br>  <!-- Лицевой счет -->
                ФИО: ${curLS.fio}<br>  <!-- ФИО -->
                ${curLS.pl ? `Площадь: ${curLS.pl} м²<br>` : ''}  <!-- Площадь -->
                ${curLS.pers ? `Жильцов: ${curLS.pers}<br>` : ''}  <!-- Количество жильцов -->
                ${curLS.komn ? `Комнат: ${curLS.komn}<br>` : ''}  <!-- Количество комнат -->
                ${curLS.et ? `Этаж: ${curLS.et}<br>` : ''}  <!-- Этаж -->
                ${curLS.pod ? `Подезд: ${curLS.pod}<br>` : ''}  <!-- Подъезд -->
                ${curLS.lgota ? `Льготник: ${curLS.lgota}<br>` : ''}  <!-- Льготник -->
                ${curLS.tel ? `Телефон: ${curLS.tel}<br>` : ''}  <!-- Телефон -->
                ${curLS.note ? `Примечание: ${curLS.note}<br>` : ''}  <!-- Примечание -->
                ${curLS.email ? `e-mail: ${curLS.email}<br>` : ''}  <!-- Email -->
            <br>Данные указаны по состоянию на <br>${dt} (${timeAgo(dt)}назад.)
        </div>`;
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
        initPosters();
        setParam('kv', ls[accountId].kv);
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
    <div id=header><TABLE WIDTH=100%><TR><TD ALIGN=RIGHT><B>Адрес:</B></TD><TD class='big' ALIGN=LEFT><U><I><a id='adr'>adr</a><select class='big' id='number'></select></TD>
    <td rowsplan=2><DIV id='org' ALIGN=RIGHT><td>
    </TR><TR><TD ALIGN=RIGHT><B>Ф.И.О.:</B></TD><TD ALIGN=LEFT><U><I><div class='big' id='fio'></U></I></TD></div></TR></TABLE></DIV><DIV id='din'></div><DIV id='datetime'></div>
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

};
