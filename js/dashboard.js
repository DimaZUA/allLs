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




// ===============================
// 6. РЕНДЕР DASHBOARD
// ===============================
function renderDashboard(data) {
    document.getElementById("maincontainer").innerHTML = `
        <div id="dashboard">

            <div class="dash-card">
                <div class="dash-title">ЗАЛИШОК КОШТІВ</div>
                <div class="dash-total ${data.cashBalance >= 0 ? 'positive' : 'negative'}">
                    ${data.cashBalance.toFixedWithComma(2)} ₴
                </div>

                <table class="dash-table">
                    <tr><td>Надходження (місяць)</td><td>${data.cashMonth.income.toFixedWithComma(2)} ₴</td></tr>
                    <tr><td>Витрати (місяць)</td><td>${data.cashMonth.expense.toFixedWithComma(2)} ₴</td></tr>
                </table>

                ${renderHistogram(data.cashHistory, data.months)}
            </div>

            <div class="dash-card">
                <div class="dash-title">
                    БОРГ СПІВВЛАСНИКІВ (${data.residentsCount})
                </div>

                <div class="dash-total ${data.residentsDebt >= 0 ? 'positive' : 'negative'}">
                    ${data.residentsDebt.toFixedWithComma(2)} ₴
                </div>

                <table class="dash-table">
                    <tr><td>Нараховано (місяць)</td><td>${data.residentsMonth.accrued.toFixedWithComma(2)} ₴</td></tr>
                    <tr><td>Сплачено (місяць)</td><td>${data.residentsMonth.paid.toFixedWithComma(2)} ₴</td></tr>
                </table>

                ${renderHistogram(data.residentsHistory, data.months)}
            </div>
            ${data.liabilities ? renderLiabilitiesCards(data.liabilities) : ''}

        </div>
    `;

}

function renderLiabilitiesCards(liabilities) {

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
                <tr class="liab-cat" onclick="toggleLiab('${id}')">
                    <td>${cat.title}</td>
                    <td>${catSum.toFixedWithComma(2)} ₴</td>
                </tr>
                <tr id="${id}" class="liab-details" style="display:none">
                    <td colspan="2">
                        <table class="dash-table inner">
                            ${details.map(d => `
                                <tr>
                                    <td>
                                        ${cat.key === 'TAX'
                                            ? getAccountTitle(d.account)
                                            : d.label}
                                    </td>
                                    <td>${d.sum.toFixedWithComma(2)} ₴</td>
                                </tr>
                            `).join("")}
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
                <div class="dash-title">${title}</div>
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


// ===============================
// 7. ИНИЦИАЛИЗАЦИЯ
// ===============================
function initDashboard() {

    const months = getLastMonths(CUR_YEAR, CUR_MONTH, 6);

    const cashHistory = months.map(m =>
        calcCashBalanceUntil(plat, m.year, m.month)
    );

    const residentsHistory = months.map(m =>
        calcResidentsDebtUntil(nach, oplat, m.year, m.month).debt
    );

    const cashBalance = cashHistory[cashHistory.length - 1];
    const cashMonth = calcCashTurnoverMonth(plat, CUR_YEAR, CUR_MONTH);

    const residentsAll = calcResidentsDebtUntil(nach, oplat, CUR_YEAR, CUR_MONTH);
    const residentsMonth = calcResidentsMonth(nach, oplat, CUR_YEAR, CUR_MONTH);
    const liabilities = calcLiabilitiesFromAllnachAndPlat(allnach, plat);

// потом передашь в renderDashboard

    renderDashboard({
        cashBalance,
        cashMonth,
        cashHistory,
        residentsDebt: residentsAll.debt,
        residentsCount: residentsAll.residentsCount,
        residentsMonth,
        residentsHistory,
        months,
        liabilities
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
            detailsKey: key
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
