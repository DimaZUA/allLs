let servicesInitialized631 = false;
const TODAY = new Date();
const CUR_YEAR  = TODAY.getFullYear();
const CUR_MONTH = TODAY.getMonth() + 1; // 1..12
const CUR_DAY   = TODAY.getDate();
const LIABILITY_CATEGORIES = [
    { key: '3771', title: 'Провайдери та сервітути' },
    { key: '631',  title: 'Постачальники товарів і послуг' },
    { key: '372',  title: 'Підзвітні особи' },
    { key: '482',  title: 'Пільги (ХМР)' },
    { key: 'TAX',  title: 'Податки і збори', accounts: ['641','651','652'] },
    { key: '661',  title: 'Заробітна плата' },
];


const ACCOUNT_RULES = {
  '631':  { useWho: true,  useWhat: true  },
  '3771': { useWho: true,  useWhat: false },
  '372':  { useWho: true,  useWhat: false },
  '482':  { useWho: false, useWhat: false },
  '661':  { useWho: false, useWhat: false },
  '641':  { useWho: false, useWhat: false },
  '651':  { useWho: false, useWhat: false },
  '652':  { useWho: false, useWhat: false }
};

const DASH_MODES = {
    cash: [
        { key: 'balance', title: 'ЗАЛИШОК КОШТІВ' },
        { key: 'income',  title: 'НАДХОДЖЕННЯ' },
        { key: 'expense', title: 'ВИТРАТИ' }
    ],
    residents: [
        { key: 'debt',     title: 'БОРГ СПІВВЛАСНИКІВ' },
        { key: 'accrued',  title: 'НАРАХОВАНО' },
        { key: 'paid',     title: 'СПЛАЧЕНО' }
    ]
};
// текущее состояние карточек (для переключений)
const dashState = {
    cash: 'balance',
    residents: 'debt'
};





const EPS = 0.005; // 0.5 копейки
function round2(v) {
    return Math.round(v * 100) / 100;
}

const MONTH_NAMES_UA_SHORT = [
    "січ", "лют", "бер", "квіт", "трав", "черв",
    "лип", "сер", "вер", "жов", "лис", "груд"
];

// ===============================
// Вспомогательное: последние 6 месяцев
// ===============================
function getLastMonths(year, month, count = 6) {
    const res = [];
    let y = year, m = month;

    for (let i = 0; i < count; i++) {
        res.unshift({ year: y, month: m });
        m--;
        if (m === 0) {
            m = 12;
            y--;
        }
    }
    return res;
}

// ===============================
// 1. ЗАЛИШОК КОШТІВ — ДО КОНЦА МЕСЯЦА
// ===============================
function calcCashBalanceUntil(plat, year, month) {
    let income = 0;
    let expense = 0;

    for (const y in plat) {
        for (const m in plat[y]) {
            if (y > year || (y == year && m > month)) continue;

            for (const r of plat[y][m]) {
                const sum = Number(r[1]) || 0;
                const credit = String(r[6] || "");
                const debit  = String(r[7] || "");

                const isCredit31 = credit.startsWith("31");
                const isDebit31  = debit.startsWith("31");

                if (isCredit31 && isDebit31) continue;

                if (isDebit31) income += sum;
                if (isCredit31) expense += sum;
            }
        }
    }
    return income - expense;
}

// ===============================
// 2. ОБОРОТЫ ПО СЧЕТУ — ТЕКУЩИЙ МЕСЯЦ
// ===============================
function calcCashTurnoverMonth(plat, year, month) {
    let income = 0;
    let expense = 0;

    const rows = plat?.[year]?.[month];
    if (!rows) return { income: 0, expense: 0 };

    for (const r of rows) {
        const sum = Number(r[1]) || 0;
        const credit = String(r[6] || "");
        const debit  = String(r[7] || "");

        if (credit.startsWith("31") && debit.startsWith("31")) continue;
        if (debit.startsWith("31")) income += sum;
        if (credit.startsWith("31")) expense += sum;
    }
    return { income, expense };
}

// ===============================
// 3. БОРГ МЕШКАНЦІВ ДО КОНЦА МЕСЯЦА
// ===============================
function calcResidentsDebtUntil(nach, oplat, year, month) {
    let accrued = 0;
    let paid = 0;
    let residentsCount = 0;

    for (const acc in nach) {
        residentsCount++;
        for (const y in nach[acc]) {
            for (const m in nach[acc][y]) {
                if (y > year || (y == year && m > month)) continue;

                for (const srv in nach[acc][y][m]) {
                    accrued += Number(nach[acc][y][m][srv]) || 0;
                }
            }
        }
    }

    for (const acc in oplat) {
        for (const y in oplat[acc]) {
            for (const m in oplat[acc][y]) {
                if (y > year || (y == year && m > month)) continue;

                for (const p of oplat[acc][y][m]) {
                    paid += Number(p.sum) || 0;
                }
            }
        }
    }

    return { debt: accrued - paid, residentsCount };
}

// ===============================
// 4. НАЧИСЛЕНО / СПЛАЧЕНО — МЕСЯЦ
// ===============================
function calcResidentsMonth(nach, oplat, year, month) {
    let accrued = 0;
    let paid = 0;

    for (const acc in nach) {
        const m = nach?.[acc]?.[year]?.[month];
        if (!m) continue;

        for (const srv in m) {
            accrued += Number(m[srv]) || 0;
        }
    }

    for (const acc in oplat) {
        const rows = oplat?.[acc]?.[year]?.[month];
        if (!rows) continue;

        for (const p of rows) {
            paid += Number(p.sum) || 0;
        }
    }
    return { accrued, paid };
}

// ===============================
// 5. ГИСТОГРАММА (HTML)
// ===============================
function renderHistogram(values, months) {
    const { min, top, levels } = buildYLevels(values, 4);

    return `
        <div class="dash-histogram">

            <!-- Ось Y -->
            <div class="hist-y">
                ${levels.map(v => `
                    <div>${v.toFixedWithComma(0)}</div>
                `).join("")}
            </div>

            <!-- Поле графика -->
            <div class="hist-plot">
                ${values.map((v, i) => {
                    const height = (top > min)
                        ? Math.round((Math.abs(v) - min) / (top - min) * 100)
                        : 0;

                    const isCurrent = i === values.length - 1;
                    const m = months[i].month - 1;

                    return `
                        <div class="hist-col">

                            <div class="hist-bar"
                                 style="
                                    height:${height}%;
                                    background:${isCurrent ? '#2563eb' : '#94a3b8'};
                                 ">
                                ${v.toFixedWithComma(0)}
                            </div>

                            <div style="
                                position:absolute;
                                bottom:-22px;
                                width:100%;
                                text-align:center;
                                font-size:11px;
                                color:#555;
                            ">
                                ${MONTH_NAMES_UA_SHORT[m]}
                            </div>

                        </div>
                    `;
                }).join("")}
            </div>

        </div>
    `;
}

function detectScaleStep(minVal, maxVal) {
    const range = maxVal - minVal;
    if (range <= 0) return 1;

    const candidates = [1_000_000, 100_000, 10_000, 1_000, 100, 10];

    for (const step of candidates) {
        if (range / step > 0.75) {
            return step;
        }
    }

    return 1;
}
function ceilToStep(value, step) {
    return Math.ceil(value / step) * step;
}

function floorToStep(value, step) {
    return Math.floor(value / step) * step;
}

function niceFloor(value, step = 10000) {
    if (value <= 0) return 0;
    return Math.floor(value / step) * step;
}

function buildYLevels(values, steps = 4) {
    const abs = values.map(v => Math.abs(v));
    const maxVal = Math.max(...abs);
    const minVal = Math.min(...abs);

    if (maxVal <= 0) {
        return {
            min: 0,
            top: 0,
            step: 1,
            levels: Array.from({ length: steps + 1 }, () => 0)
        };
    }

    // 1️⃣ определяем крок шкали
    const step = detectScaleStep(minVal, maxVal);

    // 2️⃣ верх шкалы
    const top = ceilToStep(maxVal, step);

    // 3️⃣ низ шкалы: -10% и округление вниз
    const rawMin = minVal * 0.9;
    const min = floorToStep(rawMin, step);

    // 4️⃣ уровни
    const range = top - min || step;
    const levelStep = range / steps;

    const levels = [];
    for (let i = steps; i >= 0; i--) {
        levels.push(min + i * levelStep);
    }

    return { min, top, step, levels };
}


function niceCeil(value) {
    if (value <= 0) return 0;

    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    const n = value / pow;

    let rounded;
    if (n <= 1) rounded = 1;
    else if (n <= 2) rounded = 2;
    else if (n <= 5) rounded = 5;
    else rounded = 10;

    return rounded * pow;
}




function renderDashboard(data) {

    // ===== ТЕКУЩИЙ МЕСЯЦ (динамически) =====
    const monthLabel = new Intl.DateTimeFormat('uk-UA', {
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    // начальные режимы
    dashState.cash = 'balance';
    dashState.residents = 'debt';

    document.getElementById("maincontainer").innerHTML = `
        <div id="dashboard">

            <!-- ================= CASH ================= -->
            <div class="dash-card">
                <div id="cash-title" class="dash-title">ЗАЛИШОК КОШТІВ</div>

                <div id="cash-total"
                     class="dash-total ${data.cashBalance >= 0 ? 'positive' : 'negative'}">
                    ${data.cashBalance.toFixedWithComma(2)} ₴
                </div>

                <table id="cash-table" class="dash-table">
                    <tr id="cash-income">
                        <td>Надходження (${monthLabel})</td>
                        <td>${data.cashMonth.income.toFixedWithComma(2)} ₴</td>
                    </tr>
                    <tr id="cash-expense">
                        <td>Витрати (${monthLabel})</td>
                        <td>${data.cashMonth.expense.toFixedWithComma(2)} ₴</td>
                    </tr>
                </table>

                <div id="cash-hist">
                    ${renderHistogram(data.cashHistory, data.months)}
                </div>
            </div>

            <!-- ================= RESIDENTS ================= -->
            <div class="dash-card">
                <div id="residents-title" class="dash-title">
                    БОРГ СПІВВЛАСНИКІВ (${data.residentsCount})
                </div>

                <div id="residents-total"
                     class="dash-total ${data.residentsDebt >= 0 ? 'positive' : 'negative'}">
                    ${data.residentsDebt.toFixedWithComma(2)} ₴
                </div>

                <table id="residents-table" class="dash-table">
                    <tr id="residents-accrued">
                        <td>Нараховано (${monthLabel})</td>
                        <td>${data.residentsMonth.accrued.toFixedWithComma(2)} ₴</td>
                    </tr>
                    <tr id="residents-paid">
                        <td>Сплачено (${monthLabel})</td>
                        <td>${data.residentsMonth.paid.toFixedWithComma(2)} ₴</td>
                    </tr>
                </table>

                <div id="residents-hist">
                    ${renderHistogram(data.residentsHistory, data.months)}
                </div>
            </div>

            <!-- ================= LIABILITIES ================= -->
            ${data.liabilities ? renderLiabilitiesCards(data.liabilities) : ''}

        </div>
    `;

    // ===== АНИМАЦИЯ ЦИФР =====
    requestAnimationFrame(() => {
        document.querySelectorAll('.dash-total').forEach(el => {
            let txt = el.textContent
                .replace(/\s| /g, '')
                .replace('₴', '')
                .replace(',', '.');

            const value = Number(txt);
            if (!isNaN(value)) {
                el.textContent = '0 ₴';
                animateNumber(el, value);
            }
        });
    });

    // ===== КЛИКИ (ТОЛЬКО СТРОКИ) =====
    document.getElementById('cash-income')?.addEventListener('click', () =>
        switchDash('cash', 'income', data));

    document.getElementById('cash-expense')?.addEventListener('click', () =>
        switchDash('cash', 'expense', data));

    document.getElementById('residents-accrued')?.addEventListener('click', () =>
        switchDash('residents', 'accrued', data));

    document.getElementById('residents-paid')?.addEventListener('click', () =>
        switchDash('residents', 'paid', data));
}

function switchDash(card, mode, data) {

    dashState[card] = mode;

    const cfg = DASH_MODES[card].find(m => m.key === mode);
    const monthLabel = new Intl.DateTimeFormat('uk-UA', {
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    let value, history;

    // ================= CASH =================
    if (card === 'cash') {

        document.getElementById('cash-title').textContent = cfg.title;

        if (mode === 'balance') {
            value = data.cashBalance;
            history = data.cashHistory;

            document.getElementById('cash-table').innerHTML = `
                <tr id="cash-income">
                    <td>Надходження (${monthLabel})</td>
                    <td>${data.cashMonth.income.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="cash-expense">
                    <td>Витрати (${monthLabel})</td>
                    <td>${data.cashMonth.expense.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        if (mode === 'income') {
            value = data.cashMonth.income;
            history = data.cashIncomeHistory;

            document.getElementById('cash-table').innerHTML = `
                <tr id="cash-balance">
                    <td>Залишок коштів</td>
                    <td>${data.cashBalance.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="cash-expense">
                    <td>Витрати (${monthLabel})</td>
                    <td>${data.cashMonth.expense.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        if (mode === 'expense') {
            value = data.cashMonth.expense;
            history = data.cashExpenseHistory;

            document.getElementById('cash-table').innerHTML = `
                <tr id="cash-income">
                    <td>Надходження (${monthLabel})</td>
                    <td>${data.cashMonth.income.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="cash-balance">
                    <td>Залишок коштів</td>
                    <td>${data.cashBalance.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        // клики
        document.getElementById('cash-income')?.addEventListener('click', () =>
            switchDash('cash', 'income', data));
        document.getElementById('cash-expense')?.addEventListener('click', () =>
            switchDash('cash', 'expense', data));
        document.getElementById('cash-balance')?.addEventListener('click', () =>
            switchDash('cash', 'balance', data));

        document.getElementById('cash-total').textContent = '0 ₴';
        animateNumber(document.getElementById('cash-total'), value);

const cashHist = document.getElementById('cash-hist');
cashHist.innerHTML = renderHistogram(history, data.months);

requestAnimationFrame(() => {
    cashHist
        .querySelectorAll('.hist-bar')
        .forEach(b => b.classList.add('animate'));
});

    }

    // ================= RESIDENTS =================
    if (card === 'residents') {

        document.getElementById('residents-title').textContent = cfg.title;

        if (mode === 'debt') {
            value = data.residentsDebt;
            history = data.residentsHistory;

            document.getElementById('residents-table').innerHTML = `
                <tr id="residents-accrued">
                    <td>Нараховано (${monthLabel})</td>
                    <td>${data.residentsMonth.accrued.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="residents-paid">
                    <td>Сплачено (${monthLabel})</td>
                    <td>${data.residentsMonth.paid.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        if (mode === 'accrued') {
            value = data.residentsMonth.accrued;
            history = data.residentsAccruedHistory;

            document.getElementById('residents-table').innerHTML = `
                <tr id="residents-debt">
                    <td>Борг співвласників</td>
                    <td>${data.residentsDebt.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="residents-paid">
                    <td>Сплачено (${monthLabel})</td>
                    <td>${data.residentsMonth.paid.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        if (mode === 'paid') {
            value = data.residentsMonth.paid;
            history = data.residentsPaidHistory;

            document.getElementById('residents-table').innerHTML = `
                <tr id="residents-accrued">
                    <td>Нараховано (${monthLabel})</td>
                    <td>${data.residentsMonth.accrued.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="residents-debt">
                    <td>Борг співвласників</td>
                    <td>${data.residentsDebt.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
        }

        // клики
        document.getElementById('residents-accrued')?.addEventListener('click', () =>
            switchDash('residents', 'accrued', data));
        document.getElementById('residents-paid')?.addEventListener('click', () =>
            switchDash('residents', 'paid', data));
        document.getElementById('residents-debt')?.addEventListener('click', () =>
            switchDash('residents', 'debt', data));

        document.getElementById('residents-total').textContent = '0 ₴';
        animateNumber(document.getElementById('residents-total'), value);

const resHist = document.getElementById('residents-hist');
resHist.innerHTML = renderHistogram(history, data.months);

requestAnimationFrame(() => {
    resHist
        .querySelectorAll('.hist-bar')
        .forEach(b => b.classList.add('animate'));
});

    }
}


function renderLiabilitiesCards(liabilities) {

const [d, m, y] = dt.split(' ')[0].split('.');
const dateLabel = new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
}).format(new Date(y, m - 1, d));


    function renderSide(title, side) {

        const rows = [];

        for (const cat of LIABILITY_CATEGORIES) {

            let catSum = 0;
            let details = [];

            if (cat.key === 'TAX') {
                // агрегируем 641+651+652
                side.rows.forEach(r => {
                    if (cat.accounts.includes(r.account)) {
                        catSum += r.sum;
                        details.push(r);
                    }
                });
            } else {
                side.rows.forEach(r => {
                    if (r.account === cat.key) {
                        catSum += r.sum;
                        details.push(r);
                    }
                });
            }

            if (catSum < EPS) continue;

            const id = `liab_${title}_${cat.key}`;

            rows.push(`
                <tr class="liab-cat" onclick='toggleLiab("${id}")'>
                    <td>${cat.title}</td>
                    <td>${catSum.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="${id}" class="liab-details" style="display:none">
                    <td colspan="2">
                        <table class="dash-table inner">
${details.map(d => {

    const isSalary = d.account === '661';
    const isTaxOrNoWho = ['641','651','652','482'].includes(d.account);

    let onClick;

    if (isSalary) {
        // спец-экран зарплаты
        onClick = `openSalaryHistory()`;
    }
    else if (isTaxOrNoWho) {
        // налоги и прочие БЕЗ контрагента
        onClick = `openLiabilityHistory({
            account: "${d.account}",
            who: null
        })`;
    }
    else {
        // обычные счета с аналитикой по контрагенту
        onClick = `openLiabilityHistory({
            account: "${d.account}",
            who: "${d.detailsKey}"
        })`;
    }

    const title =
        isSalary
            ? 'Заробітна плата'
            : (cat.key === 'TAX'
                ? getAccountTitle(d.account)
                : d.label);

    return `
        <tr class="liab-item"
            style="cursor:pointer"
            onclick='${onClick}'>
            <td>${title}</td>
            <td>${d.sum.toFixedWithComma(2)} ₴</td>
        </tr>
    `;
}).join("")}





                        </table>
                    </td>
                </tr>
            `);
        }

        if (!rows.length) {
            rows.push(`<tr><td colspan="2">—</td></tr>`);
        }

        return `
            <div class="dash-card">
                <div class="dash-title">
                    ${title}
                    <div class="dash-subtitle">
                        станом на ${dateLabel}
                    </div>
                </div>

                <div class="dash-total ${title === 'НАМ ВИННІ' ? 'positive' : 'negative'}">
                    ${side.total.toFixedWithComma(2)} ₴
                </div>

                <table class="dash-table">
                    ${rows.join("")}
                </table>
            </div>
        `;
    }

    return `
        ${renderSide('НАМ ВИННІ', liabilities.receivable)}
        ${renderSide('МИ ВИННІ',  liabilities.payable)}
    `;
}


function toggleLiab(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.style.display = el.style.display === 'none' ? '' : 'none';
}



function animateNumber(el, target, duration = 300) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);

        // имитация "неровного" роста
        const noise = Math.random() * 0.08;
        const value = target * (progress + noise * (1 - progress));

        el.textContent = round2(value).toFixedWithComma(2) + ' ₴';

        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixedWithComma(2) + ' ₴';
    }

    requestAnimationFrame(tick);
}

// ===============================
// 7. ИНИЦИАЛИЗАЦИЯ
// ===============================
function initDashboard() {

    const months = getLastMonths(CUR_YEAR, CUR_MONTH, 6);
    // история оборотов по деньгам
    const cashIncomeHistory = months.map(m =>
    calcCashTurnoverMonth(plat, m.year, m.month).income
    );

    const cashExpenseHistory = months.map(m =>
    calcCashTurnoverMonth(plat, m.year, m.month).expense
    );
    const cashHistory = months.map(m =>
        calcCashBalanceUntil(plat, m.year, m.month)
    );

    const residentsHistory = months.map(m =>
        calcResidentsDebtUntil(nach, oplat, m.year, m.month).debt
    );
const residentsAccruedHistory = months.map(m =>
    calcResidentsMonth(nach, oplat, m.year, m.month).accrued
);

const residentsPaidHistory = months.map(m =>
    calcResidentsMonth(nach, oplat, m.year, m.month).paid
);

    const cashBalance = cashHistory[cashHistory.length - 1];
    const cashMonth = calcCashTurnoverMonth(plat, CUR_YEAR, CUR_MONTH);

    const residentsAll = calcResidentsDebtUntil(nach, oplat, CUR_YEAR, CUR_MONTH);
    const residentsMonth = calcResidentsMonth(nach, oplat, CUR_YEAR, CUR_MONTH);
    const liabilities = calcLiabilitiesFromAllnachAndPlat(allnach, plat);


window.__dashData = {
    cashBalance,
    cashMonth,
    cashHistory,
    cashIncomeHistory,
    cashExpenseHistory,

    residentsDebt: residentsAll.debt,
    residentsMonth,
    residentsHistory,
    residentsAccruedHistory,
    residentsPaidHistory,

    months
};

renderDashboard({
    cashBalance,
    cashMonth,
    cashHistory,
    cashIncomeHistory,
    cashExpenseHistory,

    residentsDebt: residentsAll.debt,
    residentsCount: residentsAll.residentsCount,
    residentsMonth,
    residentsHistory,
    residentsAccruedHistory,
    residentsPaidHistory,

    months,
    liabilities
});


    requestAnimationFrame(() => {
    document
        .querySelectorAll('.hist-bar')
        .forEach(b => b.classList.add('animate'));
});

}

// ======================================================
// НАСТРОЙКИ СЧЕТОВ, КОТОРЫЕ УЧИТЫВАЕМ
// ======================================================
const LIABILITY_ACCOUNTS = {
    '3771': { type: 'active',  analytics: 'who',     title: 'Провайдери та сервітути' },
    '482':  { type: 'active',  analytics: 'total',   title: 'Пільги (ХМР)' },
    '372':  { type: 'special', analytics: 'who',     title: 'Підзвітні особи' },
    '631':  { type: 'passive', analytics: 'who',     title: 'Постачальники товарів і послуг' },
    '661':  { type: 'passive', analytics: 'total',   title: 'Заробітна плата' },
    '641':  { type: 'passive', analytics: 'account', title: 'ПДФО (641)' },
    '651':  { type: 'passive', analytics: 'account', title: 'ЄСВ (651)' },
    '652':  { type: 'passive', analytics: 'account', title: 'Військовий збір (652)' }
};
function getAccountTitle(acc) {
    return LIABILITY_ACCOUNTS?.[acc]?.title || acc;
}

function normAcc(v) {
    return String(v || '').trim();
}

function isTrackedAccount(acc) {
    return Object.prototype.hasOwnProperty.call(LIABILITY_ACCOUNTS, acc);
}

function addTo(obj, key, value) {
    if (!obj[key]) obj[key] = 0;
    obj[key] += value;
}


function calcLiabilitiesFromAllnachAndPlat(allnach, plat) {

    // saldo[account][analyticKey] = sum
    const saldo = {};
    for (const acc in LIABILITY_ACCOUNTS) saldo[acc] = {};

    // ==================================================
    // 1. НАЧИСЛЕНИЯ (allnach)
    // ==================================================
    for (const y in allnach) {
        const year = Number(y);
        if (year > CUR_YEAR) continue;

        for (const m in allnach[y]) {
            const month = Number(m);
            if (year === CUR_YEAR && month > CUR_MONTH) continue;

            for (const row of allnach[y][m]) {

                const day = Number(row[0]) || 0;
                if (
                    year === CUR_YEAR &&
                    month === CUR_MONTH &&
                    day > CUR_DAY
                ) continue;

                const sum    = Number(row[1]) || 0;
                const who    = String(row[2]);
                const credit = normAcc(row[4]); // КРЕДИТ
                const debit  = normAcc(row[5]); // ДЕБЕТ

                if (isTrackedAccount(debit)) {
                    applyPosting(debit, who, sum, 'debit');
                }

                if (isTrackedAccount(credit)) {
                    applyPosting(credit, who, sum, 'credit');
                }
            }
        }
    }

    // ==================================================
    // 2. ПЛАТЕЖИ (plat) — ТОЧНО ТАК ЖЕ, БЕЗ 31
    // ==================================================
    for (const y in plat) {
        for (const m in plat[y]) {
            for (const row of plat[y][m]) {

                const sum    = Number(row[1]) || 0;
                const who    = String(row[2]);
                const credit = normAcc(row[6]); // КРЕДИТ
                const debit  = normAcc(row[7]); // ДЕБЕТ

                if (isTrackedAccount(debit)) {
                    applyPosting(debit, who, sum, 'debit');
                }

                if (isTrackedAccount(credit)) {
                    applyPosting(credit, who, sum, 'credit');
                }
            }
        }
    }

    // ==================================================
    // ЕДИНАЯ ФУНКЦИЯ ПРОВОДКИ
    // ==================================================
    function applyPosting(account, who, sum, side) {
        const accInfo = LIABILITY_ACCOUNTS[account];

        const key =
            accInfo.analytics === 'who'     ? who :
            accInfo.analytics === 'account' ? account :
            '_total';

        let delta = 0;

        switch (accInfo.type) {
            case 'active':
                delta = (side === 'debit') ? sum : -sum;
                break;

            case 'passive':
                delta = (side === 'credit') ? sum : -sum;
                break;

            case 'special': // 372
                delta = (side === 'debit') ? sum : -sum;
                break;
        }

        addTo(saldo[account], key, delta);
    }

// ==================================================
// 3. ФОРМИРОВАНИЕ КАРТОЧЕК (ИСПРАВЛЕНО)
// ==================================================
const receivable = { total: 0, rows: [] }; // НАМ ВИННІ
const payable    = { total: 0, rows: [] }; // МИ ВИННІ

for (const acc in saldo) {
    const accInfo = LIABILITY_ACCOUNTS[acc];
    const items = saldo[acc];

    for (const key in items) {
        const val = items[key];
        if (Math.abs(val) < EPS) continue;

        const row = {
            account: acc,
            label: accInfo.analytics === 'who'
                ? (kto?.[key] || key)
                : accInfo.title,
            sum: Math.abs(val),
            detailsKey: key,
        };

        let toReceivable = false;

        if (accInfo.type === 'active' || accInfo.type === 'special') {
            toReceivable = val > 0;
        } else if (accInfo.type === 'passive') {
            toReceivable = val < 0;
        }

        if (toReceivable) {
            receivable.total = round2(receivable.total + row.sum);
            receivable.rows.push(row);
        } else {
            payable.total = round2(payable.total + row.sum);
            payable.rows.push(row);
        }
    }
}


    return { receivable, payable };
}






//===========================================!!!!!!!!!!!!!!!!!!!!!!!!!
// СВЕРКА / ЗАРПЛАТА — ПОЛНАЯ ВЕРСИЯ
//===========================================

// ===========================================
// ДАТЫ
// ===========================================
function parseDt(dt) {
    const [d, m, y] = dt.split(' ')[0].split('.').map(Number);
    return new Date(y, m - 1, d);
}

function toISO(d) {
    return d.toISOString().slice(0, 10);
}

// ===========================================
// БУХ-ЭФФЕКТ ПРОВОДКИ
// ===========================================
function getPostingEffect(account, side, sum) {
    const acc = LIABILITY_ACCOUNTS[account];
    if (!acc) return 0;

    switch (acc.type) {
        case 'active':
            return side === 'debit' ? sum : -sum;
        case 'passive':
            return side === 'credit' ? sum : -sum;
        case 'special':
            return side === 'debit' ? sum : -sum;
    }
    return 0;
}

// ===========================================
// МЕСЯЦЫ В ПЕРИОДЕ
// ===========================================
function getMonthsBetween(dateFrom, dateTo) {
    const res = [];
    let y = dateFrom.getFullYear();
    let m = dateFrom.getMonth() + 1;

    while (
        y < dateTo.getFullYear() ||
        (y === dateTo.getFullYear() && m <= dateTo.getMonth() + 1)
    ) {
        res.push({ year: y, month: m });
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
    }
    return res;
}

// ===========================================
// ВХОДЯЩЕЕ САЛЬДО ДО dateFrom
// ===========================================
function calcOpeningSaldo({ account, who, whatSet, dateFrom }) {

    let saldo = 0;

    function before(d) {
        return d < dateFrom;
    }

    // НАЧИСЛЕНИЯ
    for (const y in allnach) {
        for (const m in allnach[y]) {
            for (const r of allnach[y][m]) {

                const d = new Date(y, m - 1, r[0] || 1);
                if (!before(d)) continue;

                const sum = Number(r[1]) || 0;
                if (sum <= 0.019 || >-0.005) continue;
                const whoCod = String(r[2]);
                const what = String(r[3]);
                const credit = String(r[4]);
                const debit  = String(r[5]);

                if (who && whoCod !== who) continue;
                if (whatSet && !whatSet.has(what)) continue;

                if (credit === account)
                    saldo += getPostingEffect(account, 'credit', sum);

                if (debit === account)
                    saldo += getPostingEffect(account, 'debit', sum);
            }
        }
    }

    // ПЛАТЕЖИ
    for (const y in plat) {
        for (const m in plat[y]) {
            for (const r of plat[y][m]) {

                const d = new Date(y, m - 1, r[0] || 1);
                if (!before(d)) continue;

                const sum = Number(r[1]) || 0;
                const whoCod = String(r[2]);
                const credit = String(r[6]);
                const debit  = String(r[7]);

const what = String(r[3]);

if (who && whoCod !== who) continue;
if (whatSet && !whatSet.has(what)) continue;

if (credit === account)
    saldo += getPostingEffect(account, 'credit', sum);

if (debit === account)
    saldo += getPostingEffect(account, 'debit', sum);

            }
        }
    }

    return round2(saldo);
}

// ===========================================
// ОСНОВНАЯ СВЕРКА
// ===========================================
function calcReconciliation({
    account,
    who = null,
    whatList = null,
    dateFrom,
    dateTo
}) {

    const months  = getMonthsBetween(dateFrom, dateTo);
    const whatSet = whatList ? new Set(whatList) : null;

let totalAccrued = 0;
let totalPaid    = 0;

    let saldo = calcOpeningSaldo({
        account, who, whatSet, dateFrom
    });

    const rows = [{
        type: 'opening',
        label: `Сальдо на ${toISO(dateFrom)}`,
        saldo
    }];

    for (const { year, month } of months) {

        let debit  = 0;
        let credit = 0;

        const debitDetails  = [];
        const creditDetails = [];

        // =========================
        // НАЧИСЛЕНИЯ
        // =========================
        for (const r of allnach?.[year]?.[month] || []) {

            const day = r[0] || 1;
            const d   = new Date(year, month - 1, day);
            if (d < dateFrom || d > dateTo) continue;

            const sum = Number(r[1]) || 0;
            if (sum <= 0.019 || >-0.005) continue;

            const whoCod  = String(r[2] || '');
            const whatCod = String(r[3] || '');
            const cr      = String(r[4] || '');
            const db      = String(r[5] || '');

            if (who && whoCod !== who) continue;
            if (whatSet && !whatSet.has(whatCod)) continue;

            const title = what[whatCod] || 'Нарахування';

const fileBase = r[6] ? String(r[6]).trim() : '';

const fileUrl = fileBase
    ? buildActPdfUrl({
          year,
          month,
          fileBase
      })
    : null;


if (db === account) {
    debit += sum;
    debitDetails.push({
        title,
        sum,
        fileUrl
    });
}

if (cr === account) {
    credit += sum;
    creditDetails.push({
        title,
        sum,
        fileUrl
    });
}

        }

        // =========================
        // ПЛАТЕЖИ
        // =========================
        for (const r of plat?.[year]?.[month] || []) {

            const day = r[0] || 1;
            const d   = new Date(year, month - 1, day);
            if (d < dateFrom || d > dateTo) continue;

            const sum = Number(r[1]) || 0;
            if (!sum) continue;

            const whoCod  = String(r[2] || '');
            const whatCod = String(r[3] || '');
            const purpose = String(r[5] || '');
            const cr      = String(r[6] || '');
            const db      = String(r[7] || '');

            if (who && whoCod !== who) continue;
            if (whatSet && !whatSet.has(whatCod)) continue;

            const title = what[whatCod] || 'Оплата';
            const info  =
                `${String(day).padStart(2,'0')}.` +
                `${String(month).padStart(2,'0')}.` +
                `${year}` +
                (purpose ? ` — ${purpose}` : '');

            if (db === account) {
                debit += sum;
                debitDetails.push({
                    title,
                    sum,
                    info
                });
            }

            if (cr === account) {
                credit += sum;
                creditDetails.push({
                    title,
                    sum,
                    info
                });
            }
        }

        saldo = round2(
            saldo +
            getPostingEffect(account, 'debit', debit) +
            getPostingEffect(account, 'credit', credit)
        );

const sem = mapAccountSemantics(account, debit, credit);

totalAccrued += sem.accrued;
totalPaid    += sem.paid;

// ⬇️ ВАЖНО: так же маппим ДЕТАЛИ
let accruedDetails = [];
let paidDetails    = [];

if (LIABILITY_ACCOUNTS[account]?.type === 'passive') {
    // пассивные: начислено = Кт, оплачено = Дт
    accruedDetails = creditDetails;
    paidDetails    = debitDetails;
} else {
    // активные / special: начислено = Дт, оплачено = Кт
    accruedDetails = debitDetails;
    paidDetails    = creditDetails;
}

rows.push({
    type: 'month',
    year,
    month,

    accrued: sem.accrued,
    paid:    sem.paid,

    accruedDetails,
    paidDetails,

    saldo
});


    }

    return {
    rows,
    totals: {
        accrued: round2(totalAccrued),
        paid:    round2(totalPaid),
        saldo:   round2(saldo)
    }
};

}



// ===========================================
// UI ОТКРЫТИЯ СВЕРКИ
// ===========================================
function openLiabilityHistory({ account, who = null }) {
window.currentLiabAccount = account;

    // === СПЕЦ-ЭКРАН ЗАРПЛАТЫ ===
    if (account === '661') {
        openSalaryHistory();
        return;
    }

    // === НАЛОГИ ===
    const isTax = isTaxAccount(account);
    const taxAccounts = isTax ? getTaxAccounts() : [];

    const dateTo   = parseDt(dt);
    const dateFrom = new Date(dateTo.getFullYear(), 0, 1);

    // === НАЧАЛЬНЫЙ РАСЧЁТ ===
const result = calcReconciliation({
    account,
    who,
    dateFrom,
    dateTo
});

const rows   = result.rows;
const totals = result.totals;

const saldoOwner = getSaldoOwner(
    account,
    totals.saldo,
    who
);



    const subtitleText = who
        ? (kto[who] || who)
        : getAccountTitle(account);

    // === УСЛОВИЯ ФИЛЬТРОВ ===
    const showWhoSelect  = ['631','3771','372'].includes(account);
    const showWhatSelect = account === '631';

    // === ДАННЫЕ ДЛЯ ФИЛЬТРОВ ===
    const whoList = showWhoSelect
        ? collectWhoList(account, dateFrom, dateTo)
        : [];

    const whatList = showWhatSelect
        ? collectWhatList631(dateFrom, dateTo, who)
        : [];
    const titleText = who
        ? 'Звірка розрахунків з контрагентом'
        : (account=='482'?'Звірка розрахунків по пільгам ХМР':'Звірка розрахунків за рахунком');

if (account === '631') {
    servicesInitialized631 = false;
}
const actPartiesText = `Ми, що нижче підписалися, представники <b>${org}</b>` +
    (who
        ? ` та <b>${kto[who] || who}</b>`
        : ` та <b>${getAccountTitle(account)}</b>`
    ) +
    `, склали цей акт про те, що станом на <b>${toISO(dateTo)}</b> взаємні розрахунки між сторонами мають наступний стан:`;

    // === РЕНДЕР ===
    maincontainer.innerHTML = `
        <div class="liab-history-page">

            <div class="liab-header">
                <button onclick="initDashboard()">← Назад</button>
                <h2>${titleText}</h2>

                <div class="liab-subtitle">

                    <!-- Название счёта / контрагента
                    <div class="liab-subtitle-line">
                        <span id="liabAccountTitle">${subtitleText}</span>
                    </div>
                     -->
                    <!-- НАЛОГИ -->
                    ${isTax ? `
                        <div class="liab-subtitle-line">
                            Рахунок:
                            <select id="taxAccountSelect">
                                ${taxAccounts.map(acc => `
                                    <option value="${acc}" ${acc === account ? 'selected' : ''}>
                                        ${getAccountTitle(acc)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <!-- КОНТРАГЕНТ -->
                    ${showWhoSelect ? `
                        <div class="liab-subtitle-line">
                            Контрагент:
                            <select id="whoSelect">
                                <option value="">— всі —</option>
                                ${whoList.map(w => `
                                    <option value="${w}" ${w === who ? 'selected' : ''}>
                                        ${kto[w] || w}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <!-- УСЛУГИ (631) -->
                    ${showWhatSelect ? `
                        <div class="liab-subtitle-line liab-what-list">
                            Послуги:
                            ${whatList.map(w => `
<label class="what-tag">
    <input type="checkbox"
           class="what-checkbox"
           value="${w}"
           checked>
    <span>${what[w] || w}</span>
</label>

                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- ПЕРИОД -->
                    <div class="liab-subtitle-line">
                        Період:
                        <input type="date" id="dateFrom" value="${toISO(dateFrom)}">
                        —
                        <input type="date" id="dateTo" value="${toISO(dateTo)}">

                    </div>

                </div>
            </div>
<div class="print-act-header">
    <div class="act-title">
        АКТ ЗВІРКИ ВЗАЄМНИХ РОЗРАХУНКІВ
    </div>

    <div class="act-meta">
        <div>
            м. _____________
        </div>
        <div>
            «___» ____________ 20__ р.
        </div>
    </div>

<div class="act-text">
    ${actPartiesText}
</div>
</div>

            ${renderReconciliationTable(rows, totals, saldoOwner, dateTo)}
<div class="print-act-sign">
    <div>
        Від ${org}:<br><br>
        _______________________ / _______________________
    </div>

    <div>
        Від ${who ? `${kto[who] || who}` : `${getAccountTitle(account)}`}:<br><br>
        _______________________ / _______________________
    </div>
</div>

        </div>
    `;
// === ОБНОВЛЕНИЕ УСЛУГ ПРИ СМЕНЕ КОНТРАГЕНТА ===
const whoSelect = document.getElementById('whoSelect');

if (whoSelect) {
    whoSelect.addEventListener('change', () => {

        // только для 631 есть услуги
        if (window.currentLiabAccount === '631') {
            update631ServicesByWho();
        }

        triggerLiabRecalc();
    });
}


const dateFromEl = document.getElementById('dateFrom');
const dateToEl   = document.getElementById('dateTo');

if (dateFromEl) dateFromEl.addEventListener('change', triggerLiabRecalc);
if (dateToEl)   dateToEl.addEventListener('change', triggerLiabRecalc);
const taxSelect = document.getElementById('taxAccountSelect');
if (taxSelect) {
    taxSelect.addEventListener('change', triggerLiabRecalc);
}
document
    .querySelectorAll('.what-checkbox')
    .forEach(cb => {
        cb.addEventListener('change', triggerLiabRecalc);
    });

}




// ===========================================
// ТАБЛИЦА
// ===========================================

function renderReconciliationTable(rows, totals = null, saldoOwner = null, dateTo = null) {

function renderPoster(sum, details) {
    if (!sum) sum = 0;

    const files = (details || [])
        .map(d => d.fileUrl)
        .filter(Boolean);

    const hasFiles = files.length > 0;
    const hasDescr = details && details.length;

    return `
        <span class="poster"
              ${hasFiles ? `
                  data-files='${JSON.stringify(files)}'
                  data-file-index="0"
              ` : ''}>

            ${sum.toFixedWithComma(2)} ₴
            ${hasFiles ? `<span class="act-icon">📄</span>` : ''}

            ${hasDescr ? `
                <div class="descr">
                    ${details.map(d =>
                        `${d.title}: ${d.sum.toFixedWithComma(2)} грн`
                        + (d.info ? `<br><small>${d.info}</small>` : '')
                    ).join('<br>')}
                </div>
            ` : ''}

        </span>
    `;
}


    return `
        <table class="dash-table liab-table">
            <thead>
                <tr>
                    <th>Період</th>
                    <th>Нараховано</th>
                    <th>Оплачено</th>
                    <th>Борг</th>
                </tr>
            </thead>

            <tbody>
                ${rows.map(r => {

                    if (r.type === 'opening') {
                        return `
                            <tr class="opening">
                                <td colspan="3">${r.label}</td>
                                <td>${r.saldo.toFixedWithComma(2)} ₴</td>
                            </tr>
                        `;
                    }

                    return `
                        <tr>
                            <td>${MONTH_NAMES_UA_SHORT[r.month - 1]} ${r.year}</td>

                            <td class="poster-cell">
                                ${renderPoster(r.accrued, r.accruedDetails)}
                            </td>

                            <td class="poster-cell">
                                ${renderPoster(r.paid, r.paidDetails)}
                            </td>

                            <td>${r.saldo.toFixedWithComma(2)} ₴</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>

            ${totals && saldoOwner ? `
                <tfoot>
                    <tr class="liab-total">
                        <td><b>Всього</b></td>

                        <td>
                            <b>${totals.accrued.toFixedWithComma(2)} ₴</b>
                        </td>

                        <td>
                            <b>${totals.paid.toFixedWithComma(2)} ₴</b>
                        </td>

                        <td>
                            <b>${Math.abs(totals.saldo).toFixedWithComma(2)} ₴</b><br>
                            <small>
                                станом на ${toISO(dateTo)}<br>
                                на користь <b>${saldoOwner.name}</b>
                            </small>
                        </td>
                    </tr>
                </tfoot>
            ` : ''}
        </table>
    `;
}

// ===========================================
// СПЕЦ-ЭКРАН ЗАРПЛАТА (661)
// ===========================================
function openSalaryHistory() { 
	const account = '661'; 
	const dateTo = parseDt(dt); 
	const dateFrom = new Date(dateTo.getFullYear(), 0, 1); 
	const rows = calcSalaryReconciliation({ dateFrom, dateTo }); 
	maincontainer.innerHTML = `<div class="liab-history-page"> <div class="liab-header"> <button onclick="initDashboard()">← Назад</button> <h2>Заробітна плата</h2> <div class="liab-subtitle"> Рахунок 661 — розрахунки з працівниками<br> Період: <input type="date" id="salaryFrom" value="${toISO(dateFrom)}"> — <input type="date" id="salaryTo" value="${toISO(dateTo)}"> <button onclick="reloadSalary()">Перерахувати</button> </div> </div> ${renderSalaryTable(rows)} </div>` ; }




// ===========================================
// РАСЧЁТ ЗАРПЛАТЫ (661)
// ===========================================

function calcSalaryReconciliation({ dateFrom, dateTo }) {

    const months = getMonthsBetween(dateFrom, dateTo);

    const openingSaldo = calcOpeningSaldo({
        account: '661',
        who: null,
        dateFrom
    });

    let runningSaldo = openingSaldo;

    const rows = [{
        type: 'opening',
        label: `Сальдо на ${toISO(dateFrom)}`,
        saldo: openingSaldo
    }];

    for (const { year, month } of months) {

        let accrued  = 0; // нараховано
        let withheld = 0; // утримано
        let paid     = 0; // виплачено

        // ===== НАЧИСЛЕНИЯ =====
        for (const r of allnach?.[year]?.[month] || []) {

            const day = Number(r[0]) || 1;

            if (
                year === dateTo.getFullYear() &&
                month === dateTo.getMonth() + 1 &&
                day > dateTo.getDate()
            ) continue;

            const sum    = Number(r[1]) || 0;
            const credit = String(r[4]);
            const debit  = String(r[5]);

            if (credit === '661') accrued += sum;
            if (debit  === '661') withheld += sum;
        }

        // ===== ВЫПЛАТА =====
        for (const r of plat?.[year]?.[month] || []) {

            const sum   = Number(r[1]) || 0;
            const debit = String(r[7]);

            if (debit === '661') paid += sum;
        }

        runningSaldo = round2(
            runningSaldo +
            accrued -
            withheld -
            paid
        );

        rows.push({
            type: 'month',
            year,
            month,
            accrued:  round2(accrued),
            withheld: round2(withheld),
            paid:     round2(paid),
            saldo:    runningSaldo
        });
    }

    return rows;
}

// ===========================================
// РЕНДЕР ТАБЛИЦЫ ЗАРПЛАТЫ (661)
// ===========================================

function renderSalaryTable(rows) {

    if (!rows || !rows.length) {
        return `<div class="empty">Немає даних за обраний період</div>`;
    }

    return `
        <table class="dash-table salary-table">
            <thead>
                <tr>
                    <th>Період</th>
                    <th>Нараховано</th>
                    <th>Утримано</th>
                    <th>Виплачено</th>
                    <th>Залишок</th>
                    <th>Переплата</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => {

                    if (r.type === 'opening') {
                        return `
                            <tr class="opening">
                                <td colspan="4">${r.label}</td>
                                <td colspan="2">
                                    ${r.saldo.toFixedWithComma(2)} ₴
                                </td>
                            </tr>
                        `;
                    }

                    const debt     = r.saldo > 0 ? r.saldo : 0;
                    const overpaid = r.saldo < 0 ? Math.abs(r.saldo) : 0;

                    return `
                        <tr>
                            <td>${MONTH_NAMES_UA_SHORT[r.month - 1]} ${r.year}</td>
                            <td>${r.accrued.toFixedWithComma(2)} ₴</td>
                            <td>${r.withheld.toFixedWithComma(2)} ₴</td>
                            <td>${r.paid.toFixedWithComma(2)} ₴</td>
                            <td class="positive">
                                ${debt ? debt.toFixedWithComma(2) : '0,00'} ₴
                            </td>
                            <td class="negative">
                                ${overpaid ? overpaid.toFixedWithComma(2) : '0,00'} ₴
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getCategoryByAccount(account) {
    return LIABILITY_CATEGORIES.find(cat =>
        cat.key === account ||
        (cat.accounts && cat.accounts.includes(account))
    );
}

function isTaxAccount(account) {
    const cat = getCategoryByAccount(account);
    return cat?.key === 'TAX';
}

function getTaxAccounts() {
    const cat = LIABILITY_CATEGORIES.find(c => c.key === 'TAX');
    return cat?.accounts || [];
}

function reloadLiabAdvanced() {

    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo   = new Date(document.getElementById('dateTo').value);

    // === СЧЁТ (обычный или налоговый) ===
    let account = window.currentLiabAccount;

    const taxSelect = document.getElementById('taxAccountSelect');
    if (taxSelect) {
        account = taxSelect.value;
        window.currentLiabAccount = account;
    }

    // === КОНТРАГЕНТ ===
    const whoSelect = document.getElementById('whoSelect');
    const who = whoSelect && whoSelect.value
        ? whoSelect.value
        : null;

    // === УСЛУГИ ===
    let whatList = null;
    const whatCheckboxes = document.querySelectorAll('.what-checkbox');

    if (whatCheckboxes.length) {
        whatList = [...whatCheckboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    // === РАСЧЁТ ===
    const result = calcReconciliation({
        account,
        who,
        whatList,
        dateFrom,
        dateTo
    });

    const rows   = result.rows;
    const totals = result.totals;

    const saldoOwner = getSaldoOwner(
        account,
        totals.saldo,
        who
    );

    // === ТАБЛИЦА ===
    const table = document.querySelector('.liab-history-page table');
    if (table) {
        table.outerHTML = renderReconciliationTable(rows);
    }

    // === SUMMARY (итоги) ===
    const oldSummary = document.querySelector('.liab-summary');

    const summaryHTML = saldoOwner ? `
        <div class="liab-summary">
            <div>
                Всього нараховано:
                <b>${totals.accrued.toFixedWithComma(2)} ₴</b>
            </div>
            <div>
                Всього оплачено:
                <b>${totals.paid.toFixedWithComma(2)} ₴</b>
            </div>
            <div class="liab-final">
                Всього станом на ${toISO(dateTo)}:
                <b>${Math.abs(totals.saldo).toFixedWithComma(2)} ₴</b>
                на користь <b>${saldoOwner.name}</b>
            </div>
        </div>
    ` : '';

    if (oldSummary) {
        oldSummary.outerHTML = summaryHTML;
    } else if (summaryHTML) {
        // если summary ещё не было — вставляем после таблицы
        const page = document.querySelector('.liab-history-page');
        page.insertAdjacentHTML('beforeend', summaryHTML);
    }

    // === ЗАГОЛОВОК ===
    const titleEl = document.getElementById('liabAccountTitle');
    if (titleEl) {
        titleEl.textContent =
            who ? (kto[who] || who) : getAccountTitle(account);
    }
}






function collectWhoList(account, dateFrom, dateTo) {
    const set = new Set();

    function scan(rows, getCredit, getDebit, getWho, getDate) {
        for (const y in rows) {
            for (const m in rows[y]) {
                for (const r of rows[y][m]) {

                    const d = getDate(r, y, m);
                    if (d < dateFrom || d > dateTo) continue;

                    const credit = getCredit(r);
                    const debit  = getDebit(r);

                    // ❗ ВАЖНО: только если счет участвует
                    if (credit !== account && debit !== account) continue;

                    const who = getWho(r);
                    if (who) set.add(who);
                }
            }
        }
    }

    // начисления
    scan(
        allnach,
        r => String(r[4] || ''),
        r => String(r[5] || ''),
        r => String(r[2] || ''),
        (r, y, m) => new Date(y, m - 1, r[0] || 1)
    );

    // платежи
    scan(
        plat,
        r => String(r[6] || ''),
        r => String(r[7] || ''),
        r => String(r[2] || ''),
        (r, y, m) => new Date(y, m - 1, r[0] || 1)
    );

    return [...set].sort();
}


function collectWhatList631(dateFrom, dateTo, who = null) {
    const set = new Set();

    function scan(rows, getDate, getWho, getWhat, getCredit, getDebit) {
        for (const y in rows) {
            for (const m in rows[y]) {
                for (const r of rows[y][m]) {

                    const d = getDate(r, y, m);
                    if (d > dateTo) continue;

                    const credit = getCredit(r);
                    const debit  = getDebit(r);

                    // только операции по 631
                    if (credit !== '631' && debit !== '631') continue;

                    const rowWho = getWho(r);
                    if (who && rowWho !== who) continue;

                    const what = getWhat(r);
                    if (what) set.add(what);
                }
            }
        }
    }

    // ===== НАЧИСЛЕНИЯ =====
    scan(
        allnach,
        (r, y, m) => new Date(y, m - 1, r[0] || 1),
        r => String(r[2] || ''),
        r => String(r[3] || ''),
        r => String(r[4] || ''),
        r => String(r[5] || '')
    );

    // ===== ПЛАТЕЖИ =====
    scan(
        plat,
        (r, y, m) => new Date(y, m - 1, r[0] || 1),
        r => String(r[2] || ''),
        r => String(r[3] || ''),
        r => String(r[6] || ''),
        r => String(r[7] || '')
    );

    return [...set].sort();
}


function update631ServicesByWho() {

    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo   = new Date(document.getElementById('dateTo').value);

    const whoSelect = document.getElementById('whoSelect');
    const who = whoSelect && whoSelect.value
        ? whoSelect.value
        : null;

    const whatContainer = document.querySelector('.liab-what-list');
    if (!whatContainer) return;

    // ранее выбранные услуги
    const prevChecked = new Set(
        [...whatContainer.querySelectorAll('.what-checkbox')]
            .filter(cb => cb.checked)
            .map(cb => cb.value)
    );

    const availableWhat = collectWhatList631(dateFrom, dateTo, who);

    // определяем, какие услуги включать
    let checkedSet;

    if (!servicesInitialized631) {
        // первый рендер — включаем всё
        checkedSet = new Set(availableWhat);
        servicesInitialized631 = true;
    } else {
        // оставляем только пересечение
        checkedSet = new Set(
            availableWhat.filter(w => prevChecked.has(w))
        );

        // если пересечения нет — включаем всё
        if (checkedSet.size === 0) {
            checkedSet = new Set(availableWhat);
        }
    }

    whatContainer.innerHTML = `
        Послуги:
        ${availableWhat.map(w => `
            <label class="what-tag">
                <input type="checkbox"
                       class="what-checkbox"
                       value="${w}"
                       ${checkedSet.has(w) ? 'checked' : ''}>
                <span>${what[w] || w}</span>
            </label>
        `).join('')}
    `;
whatContainer
    .querySelectorAll('.what-checkbox')
    .forEach(cb => {
        cb.addEventListener('change', triggerLiabRecalc);
    });

}

let liabRecalcTimer = null;

function triggerLiabRecalc() {
    clearTimeout(liabRecalcTimer);

    liabRecalcTimer = setTimeout(() => {

        const dateFromEl = document.getElementById('dateFrom');
        const dateToEl   = document.getElementById('dateTo');

        if (
            !isValidDateInput(dateFromEl) ||
            !isValidDateInput(dateToEl)
        ) {
            return; // ⛔ не считаем
        }

        reloadLiabAdvanced();

    }, 300);
}

function isValidDateInput(el) {
    if (!el || !el.value) return false;

    const d = new Date(el.value);
    if (isNaN(d)) return false;

    const year = d.getFullYear();

    // бухгалтерский разумный диапазон
    if (year < 2000 || year > 2100) return false;

    return true;
}
function buildDescr(details) {
    return details.map(d => {
        let line = `${d.title}: ${d.sum.toFixedWithComma(2)} грн.`;

        if (d.info) {
            line += `<br><small>${d.info}</small>`;
        }

        return line;
    }).join('<br>');
}

function mapAccountSemantics(account, debit, credit) {

    const acc = LIABILITY_ACCOUNTS[account];
    if (!acc) {
        return { accrued: debit, paid: credit };
    }

    switch (acc.type) {

        case 'active':
        case 'special':
            return {
                accrued: debit,   // Дт
                paid: credit      // Кт
            };

        case 'passive':
            return {
                accrued: credit,  // Кт
                paid: debit       // Дт
            };

        default:
            return {
                accrued: debit,
                paid: credit
            };
    }
}

function getSaldoOwner(account, saldo, who = null) {

    if (!saldo || Math.abs(saldo) < 0.01) {
        return null;
    }

    const acc = LIABILITY_ACCOUNTS[account];
    if (!acc) return null;

    const positiveIsOur =
        acc.type === 'active' || acc.type === 'special';

    const saldoIsPositive = saldo > 0;

    const isOurFavor =
        positiveIsOur ? saldoIsPositive : !saldoIsPositive;

    return {
        side: isOurFavor ? 'our' : 'counterparty',
        name: isOurFavor
            ? org
            : (who ? (kto[who] || who) : acc.title)
    };
}
// ===========================================
// ГЛОБАЛЬНЫЙ КЛИК ПО ЯЧЕЙКАМ С PDF
// ===========================================
document.addEventListener('click', e => {

    // не реагируем на hover-детализацию
    if (e.target.closest('.descr')) return;

    const cell = e.target.closest('.poster-cell');
    if (!cell) return;

    const poster = cell.querySelector('.poster');
    if (!poster) return;

    const filesJson = poster.dataset.files;
    if (!filesJson) return;

    let files;
    try {
        files = JSON.parse(filesJson);
    } catch {
        return;
    }
    if (!files.length) return;

    const isOpen = poster.dataset.previewOpen === '1';
    const idx    = Number(poster.dataset.fileIndex || 0);
    const last   = files.length - 1;

    // === СЛУЧАЙ: предпросмотр открыт ===
    if (isOpen) {

        // если файл последний (или единственный) — закрываем
        if (idx === 0 || idx > last) {
            closeActPreview();
            poster.dataset.previewOpen = '0';
            poster.dataset.fileIndex = '0';
            return;
        }
    }

    // === ОТКРЫВАЕМ / ПЕРЕКЛЮЧАЕМ ===
    const file = files[idx];

    showActPreview(cell, file);

    poster.dataset.previewOpen = '1';

    // следующий индекс
    if (idx === last) {
        // следующий клик будет закрывать
        poster.dataset.fileIndex = '0';
    } else {
        poster.dataset.fileIndex = String(idx + 1);
    }
});


function buildActPdfUrl({ year, month, fileBase }) {


    if (!fileBase) return null;

    const rootPath = files?.files?.[0]?.split("/")?.[0];
    if (!rootPath) return null;

    const mm = String(month).padStart(2, '0');

    return (
        BASE_URL +
        rootPath + '/' +
        year + '/' +
        mm + '/' +
        'Вхідні/' +
        fileBase + '.pdf' +
        '?t=' + Date.now()
    );}
function showActPreview(cell, fileUrl) {

    // закрываем предыдущий предпросмотр
    document
        .querySelectorAll('.act-preview-row')
        .forEach(r => r.remove());

    // строка таблицы
    const tr = cell.closest('tr');
    if (!tr) return;

    const colCount = tr.children.length;

    const previewRow = document.createElement('tr');
    previewRow.className = 'act-preview-row';

    previewRow.innerHTML = `
        <td colspan="${colCount}">
            <div class="act-preview">
                <iframe src="${fileUrl}" loading="lazy"></iframe>
            </div>
        </td>
    `;

    tr.after(previewRow);
}
function closeActPreview() {
    document
        .querySelectorAll('.act-preview-row')
        .forEach(r => r.remove());
}
