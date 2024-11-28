        var finalDate;
        function calculateDefaultDays() {
            const defaultDay = finalDate.getDate();
            let fromDay, toDay;
            if (defaultDay < 5) {
                fromDay = 1;
                toDay = defaultDay;
            } else {
                toDay = Math.floor((defaultDay - 1) / 5) * 5;
                fromDay = toDay - 4;
            }
            document.getElementById('fromDay').value = fromDay;
            document.getElementById('toDay').value = toDay;
        }

        function populateMonthSelector() {
            const monthSelect = document.getElementById('monthSelect');
            const uniqueMonths = new Set();

            // Собираем уникальные годы и месяцы из oplat
            Object.keys(oplat).forEach(lsKey => {
                const userPayments = oplat[lsKey];
                Object.keys(userPayments).forEach(year => {
                    Object.keys(userPayments[year]).forEach(month => {
                        uniqueMonths.add(`${year}-${month}`);
                    });
                });
            });

            // Сортируем месяцы и заполняем селектор
            [...uniqueMonths]
                .sort((a, b) => new Date(a.split('-').join('-')).getTime() - new Date(b.split('-').join('-')).getTime())
                .forEach(item => {
                    const [year, month] = item.split('-');
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = `${new Date(0, month - 1).toLocaleString('ru', { month: 'long' })} ${year}`;
                    if (
                        parseInt(year) === finalDate.getFullYear() &&
                        parseInt(month) === finalDate.getMonth() + 1
                    ) {
                        option.selected = true;
                    }
                    monthSelect.appendChild(option);
                });
        }

        function generatePayTable() {
            const [year, month] = document.getElementById('monthSelect').value.split('-').map(Number);

            // Значения "С" и "По"
            const fromDayInput = document.getElementById('fromDay').value;
            const toDayInput = document.getElementById('toDay').value;

            const fromDay = fromDayInput ? parseInt(fromDayInput) : 1; // Если не указано, с первого числа
            const maxDay = new Date(year, month, 0).getDate();
            const toDay = toDayInput ? Math.min(parseInt(toDayInput), maxDay) : maxDay; // Если не указано, до конца месяца

            const tbody = document.getElementById('paytable').querySelector('tbody');
            tbody.innerHTML = '';

            const paymentsArray = [];

            Object.keys(oplat).forEach(lsKey => {
                const userPayments = oplat[lsKey];
                const userInfo = ls[lsKey];

                if (userPayments[year] && userPayments[year][month]) {
                    userPayments[year][month]
                        .filter(payment => {
                            const [day] = payment.date.split('.');
                            return parseInt(day) >= Math.min(fromDay, toDay) &&
                                   parseInt(day) <= Math.max(fromDay, toDay);
                        })
                        .forEach(payment => {
                            paymentsArray.push({
                                date: payment.date,
                                kv: userInfo.kv,
                                sum: payment.sum,
                                kvit: payment.kvit,
                                nazn: payment.nazn
                            });
                        });
                }
            });

            // Сортировка по дате и номеру квартиры
            paymentsArray.sort((a, b) => {
                const dateA = new Date(a.date.split('.').reverse().join('-'));
                const dateB = new Date(b.date.split('.').reverse().join('-'));
                if (fromDay > toDay) return dateB - dateA; // Обратная сортировка
                if (dateA - dateB !== 0) return dateA - dateB;
                return parseInt(a.kv) - parseInt(b.kv);
            });

            // Генерация таблицы
            paymentsArray.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.date}</td>
                    <td>${payment.kv}</td>
                    <td>${payment.sum.toFixedWithComma()}</td>
                    <td>${payment.kvit}</td>
                    <td>${highlightApartmentNumber(payment.nazn, payment.kv)}</td>
                `;
                tbody.appendChild(row);
            });
        }
        function initPayTable() {
document.getElementById('maincontainer').innerHTML = `
    <div id="org" align="right">
        <div id="filter-container">
    <div>
           <div align="left">
                Щелчок по заголовку таблицы - отображение/скрытие назначений платежей
            </div>
        <label>Месяц:
            <select id="monthSelect"></select>
        </label>
        <label>С:
            <input type="number" id="fromDay" min="1" max="31">
        </label>
        <label>По:
            <input type="number" id="toDay" min="1" max="31">
        </label>
        <button onclick="generatePayTable()">Генерировать таблицу</button> 
    </div>
        </div>

        <div id="table-container">
    <table id="paytable" class="main">
        <thead>
            <tr>
                <th>Дата</th>
                <th>Номер квартиры</th>
                <th>Сумма</th>
                <th>Номер квитанции</th>
                <th>Назначение платежа</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

        </div>
    </div>
    <div id="datetime"></div>
`;

document.getElementById('datetime').innerHTML = `
    <br>Данные указаны по состоянию на <br>${dt} (${timeAgo(dt)} назад.)
`;
        finalDate = new Date(dt.split(' ')[0].split('.').reverse().join('-') + 'T' + dt.split(' ')[1]);
          populateMonthSelector();
        calculateDefaultDays();
  generatePayTable();
// Добавляем обработчик клика для заголовков таблицы
document.getElementById('paytable').querySelectorAll('th').forEach(th => {
    th.addEventListener('click', toggleNaznColumn);
});
}

function toggleNaznColumn() {
    const columnIndex = 4; // Индекс столбца "Назначение платежа" (начиная с 0)
    const table = document.getElementById('paytable');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            cell.style.display = cell.style.display === 'none' ? '' : 'none';
        }
    });
}
function highlightApartmentNumber(paymentNazn, apartmentNumber) {
    // Создаем регулярное выражение для поиска номера квартиры
    const regex = new RegExp(`(?<!\\d)${apartmentNumber}(?!\\d)`, 'g');

    // Заменяем найденный номер на выделенный жирным и цветным текстом
    return paymentNazn.replace(regex, `<strong style="color: #ff0000;">${apartmentNumber}</strong>`);
}