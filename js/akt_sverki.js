// ==============================
//   A K T   S V E R K I  v2.0
//   Быстрая оптимизированная версия
//   Поддерживает формат rows/totals
// ==============================
//

// ------------------------------
// 1. Константы (счета и логика)
// ------------------------------
//
// ===============================
//  INDEX BUILDERS
// ===============================
//
function parseDt(dt) {
    const [d, m, y] = dt.split(' ')[0].split('.').map(Number);
    return new Date(y, m - 1, d);
}

function toISO(value) {

    if (!value) return "";

    let d;

    // Уже Date
    if (value instanceof Date) {
        d = value;
    }
    // Число (timestamp)
    else if (typeof value === "number") {
        d = new Date(value);
    }
    // Строка
    else if (typeof value === "string") {

        const s = value.trim();

        // Формат dd.mm.yyyy
        if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) {
            const [dd, mm, yyyy] = s.split(/[.\s]/);
            d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        }
        // Формат yyyy-mm-dd
        else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            d = new Date(s);
        }
        // Пытаемся распарсить универсально
        else {
            d = new Date(s);
        }
    }
    else {
        return "";
    }

    if (isNaN(d)) return "";

    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

function collectWhoListWithOpeningSaldo(account, dateFrom, dateTo) {
    const meta = collectWhoMeta(account, dateFrom, dateTo);
    return Object.keys(meta).sort();
}


function collectWhatList631Safe(dateFrom, dateTo, who = null) {
    const set = new Set();

    function add(y, m, what) {
        const d = new Date(y, m - 1, 1);
        if (d >= dateFrom && d <= dateTo) {
            set.add(what);
        }
    }

    // Получить список контрагентов:
    // либо конкретный, либо все
    const whoList = who
        ? [who]
        : Object.keys(indexNach["631"] || {});

    // Начисления
    for (const w of whoList) {
        const byWhat = (indexNach["631"] && indexNach["631"][w]) || {};
        for (const what in byWhat) {
            const byYear = byWhat[what];
            for (const y in byYear) {
                for (const m in byYear[y]) {
                    add(+y, +m, what);
                }
            }
        }
    }

    // Платежи
    for (const w of whoList) {
        const byWhat = (indexPlat["631"] && indexPlat["631"][w]) || {};
        for (const what in byWhat) {
            const byYear = byWhat[what];
            for (const y in byYear) {
                for (const m in byYear[y]) {
                    add(+y, +m, what);
                }
            }
        }
    }

    return [...set].sort();
}




function isTaxAccount(account) {
    const cat = getCategoryByAccount(account);
    return cat?.key === 'TAX';
}

function getTaxAccounts() {
    const cat = LIABILITY_CATEGORIES.find(c => c.key === 'TAX');
    return cat?.accounts || [];
}
function getCategoryByAccount(account) {
    return LIABILITY_CATEGORIES.find(cat =>
        cat.key === account ||
        (cat.accounts && cat.accounts.includes(account))
    );
}

//
// ===============================
//  INDEX BUILDERS (используют твои ACCOUNT_RULES и LIABILITY_ACCOUNTS)
// ===============================
//

// список всех счетов, участвующих в акте сверки
const LIABILITY_KEYS = Object.keys(LIABILITY_ACCOUNTS);

window.indexNach = {};
window.indexPlat = {};
// =====================================
// 1) INDEX FOR ALLNACH
// =====================================

function buildNachIndex() {
    const idx = {};

    for (const year in allnach) {
        const months = allnach[year];

        for (const month in months) {
            const arr = months[month];

            for (const r of arr) {

                // ===== ПРОПУСТИТЬ начисления с суммой 0.01 =====
                const sum = Number(r[1]);
                if (sum === 0.01) continue;

                const who   = r[2];
                const what  = r[3];
                const crAcc = String(r[4]);
                const dbAcc = String(r[5]);

                // === CREDIT ===
                if (LIABILITY_KEYS.includes(crAcc)) {
                    if (!idx[crAcc]) idx[crAcc] = {};
                    if (!idx[crAcc][who]) idx[crAcc][who] = {};
                    if (!idx[crAcc][who][what]) idx[crAcc][who][what] = {};
                    if (!idx[crAcc][who][what][year]) idx[crAcc][who][what][year] = {};
                    if (!idx[crAcc][who][what][year][month]) idx[crAcc][who][what][year][month] = [];

                    idx[crAcc][who][what][year][month].push(r);
                }

                // === DEBIT ===
                if (LIABILITY_KEYS.includes(dbAcc)) {
                    if (!idx[dbAcc]) idx[dbAcc] = {};
                    if (!idx[dbAcc][who]) idx[dbAcc][who] = {};
                    if (!idx[dbAcc][who][what]) idx[dbAcc][who][what] = {};
                    if (!idx[dbAcc][who][what][year]) idx[dbAcc][who][what][year] = {};
                    if (!idx[dbAcc][who][what][year][month]) idx[dbAcc][who][what][year][month] = [];

                    idx[dbAcc][who][what][year][month].push(r);
                }
            }
        }
    }

    window.indexNach = idx;
}



// =====================================
// 2) INDEX FOR PLAT
// =====================================

function buildPlatIndex() {
    const idx = {};

    for (const year in plat) {
        const months = plat[year];

        for (const month in months) {
            const arr = months[month];

            for (const r of arr) {

                const who   = r[2];
                const what  = r[3];
                const crAcc = String(r[6]);
                const dbAcc = String(r[7]);

                // === Только счета из LIABILITY_ACCOUNTS ===

                // CREDIT
                if (LIABILITY_KEYS.includes(crAcc)) {
                    if (!idx[crAcc]) idx[crAcc] = {};
                    if (!idx[crAcc][who]) idx[crAcc][who] = {};
                    if (!idx[crAcc][who][what]) idx[crAcc][who][what] = {};
                    if (!idx[crAcc][who][what][year]) idx[crAcc][who][what][year] = {};
                    if (!idx[crAcc][who][what][year][month]) idx[crAcc][who][what][year][month] = [];

                    idx[crAcc][who][what][year][month].push(r);
                }

                // DEBIT
                if (LIABILITY_KEYS.includes(dbAcc)) {
                    if (!idx[dbAcc]) idx[dbAcc] = {};
                    if (!idx[dbAcc][who]) idx[dbAcc][who] = {};
                    if (!idx[dbAcc][who][what]) idx[dbAcc][who][what] = {};
                    if (!idx[dbAcc][who][what][year]) idx[dbAcc][who][what][year] = {};
                    if (!idx[dbAcc][who][what][year][month]) idx[dbAcc][who][what][year][month] = [];

                    idx[dbAcc][who][what][year][month].push(r);
                }
            }
        }
    }

    window.indexPlat = idx;
}

// ------------------------------
// 2. Вспомогательные функции
// ------------------------------


function pad(n) {
    return n.toString().padStart(2, "0");
}

function toDMY(d) {
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
}

// Формат суммы: 1234.56 → "1 234,56"
Number.prototype.toMoney = function () {
    return this.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(".", ",");
};

// Безопасное имя контрагента
function safeWhoName(w) {
    if (!w) return "";
    return (window.kto && window.kto[w]) ? window.kto[w] : w;
}

// Безопасное название услуги
function safeWhatName(w) {
    if (!w) return "";
    return (window.what && window.what[w]) ? window.what[w] : w;
}

// ------------------------------
// 3. Получение массива месяцев
// ------------------------------
function getMonthsBetween(dateFrom, dateTo) {
    const res = [];

    let y = dateFrom.getFullYear();
    let m = dateFrom.getMonth() + 1;

    const y2 = dateTo.getFullYear();
    const m2 = dateTo.getMonth() + 1;

    while (y < y2 || (y === y2 && m <= m2)) {
        res.push({ year: y, month: m });
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
    }

    return res;
}

//
// ==============================
// 4. Определение владельца сальдо
// ==============================
//

function getSaldoOwner(account, saldo, who = null) {

    const acc = LIABILITY_ACCOUNTS[account];
    if (!acc) return null;

    if (!saldo || Math.abs(saldo) < 0.01) {
        return null;
    }

    // special → active
    const type = acc.type === "special" ? "active" : acc.type;

    const positiveIsOur =
        type === "active"; // активні — дебіторка (нам винні)

    const saldoIsPositive = saldo > 0;

    const isOurFavor =
        positiveIsOur ? saldoIsPositive : !saldoIsPositive;

    return {
        side: isOurFavor ? "our" : "counterparty",
        name: isOurFavor
            ? org
            : (who ? (kto[who] || who) : acc.title)
    };
}


//
// =========================================
// 5. Как проводка влияет на сальдо
// -----------------------------------------
function getPostingEffect(account, side, sum) {
    // side = 'debit' | 'credit'

    const acc = LIABILITY_ACCOUNTS[account];
    const type = acc.type === "special" ? "active" : acc.type;

    // ПРАВИЛО:
    // Активный:   дебет +, кредит -
    // Пассивный:  дебет -, кредит +
    
    if (type === "active") {
        return side === "debit" ? +sum : -sum;
    }

    if (type === "passive") {
        return side === "debit" ? -sum : +sum;
    }

    return 0;
}


//
// =========================================
// 6. Расчёт начального сальдо
// -----------------------------------------
//
// Быстрый — использует индексированные данные.
// Проходим только по месяцам до dateFrom.
//

function calcOpeningSaldo(account, who, whatSet, dateFrom) {

    let saldo = 0;

    const yearTo = dateFrom.getFullYear();
    const monthTo = dateFrom.getMonth() + 1;

    // определяем список контрагентов
    const whoList = (who !== null)
        ? [who]
        : [
            ...new Set([
                ...Object.keys(indexNach[account] || {}),
                ...Object.keys(indexPlat[account] || {})
            ])
        ];

    for (const w of whoList) {

        // --- НАЧИСЛЕНИЯ ---
        const nachByWho = indexNach[account]?.[w];
        if (nachByWho) {
            for (const whatCode in nachByWho) {

                if (whatSet && whatSet.size > 0 && !whatSet.has(whatCode)) continue;

                const byYear = nachByWho[whatCode];

                for (const y in byYear) {
                    const year = +y;
                    if (year > yearTo) continue;

                    for (const m in byYear[year]) {
                        const month = +m;
                        if (year === yearTo && month >= monthTo) continue;

                        for (const r of byYear[year][month]) {
                            const sum    = r[1];
                            const credit = String(r[4]);
                            const debit  = String(r[5]);

                            if (credit === account) saldo += getPostingEffect(account, "credit", sum);
                            if (debit  === account) saldo += getPostingEffect(account, "debit",  sum);
                        }
                    }
                }
            }
        }

        // --- ПЛАТЕЖИ ---
        const platByWho = indexPlat[account]?.[w];
        if (platByWho) {
            for (const whatCode in platByWho) {

                if (whatSet && whatSet.size > 0 && !whatSet.has(whatCode)) continue;

                const byYear = platByWho[whatCode];

                for (const y in byYear) {
                    const year = +y;
                    if (year > yearTo) continue;

                    for (const m in byYear[year]) {
                        const month = +m;
                        if (year === yearTo && month >= monthTo) continue;

                        for (const r of byYear[year][month]) {
                            const sum    = r[1];
                            const credit = String(r[6]);
                            const debit  = String(r[7]);

                            if (credit === account) saldo += getPostingEffect(account, "credit", sum);
                            if (debit  === account) saldo += getPostingEffect(account, "debit",  sum);
                        }
                    }
                }
            }
        }
    }

    return saldo;
}


//
// =========================================
// 7. Индексаторы
// -----------------------------------------
// indexNach[account][who][what][year][month] = [r, r, r]
// indexPlat[account][who][what][year][month] = [r, r, r]
//
// Эти структуры уже существуют в глобальном пространстве,
// создаются загрузчиком данных. Здесь просто проверяем.
// -----------------------------------------
//

if (typeof indexNach !== "object") {
    console.error("indexNach не определён!");
}

if (typeof indexPlat !== "object") {
    console.error("indexPlat не определён!");
}
//
// ============================================
// 8. Быстрый расчёт полного акта сверки
// --------------------------------------------
// Возвращает:
// {
//   rows: [
//      { year, month, accrued, paid, saldo, accruedDetails[], paidDetails[] }
//   ],
//   totals: { accrued, paid, saldo }
// }
// --------------------------------------------
//

function calcReconciliation({ account, who, whatSet, dateFrom, dateTo }) {

    console.log("CALC START", account, who, whatSet);

    console.log("indexNach[account]:", indexNach[account]);
    console.log("indexPlat[account]:", indexPlat[account]);

    const months = getMonthsBetween(dateFrom, dateTo);

    // ============================
    // 0) Сальдо на начало периода
    // ============================
    let saldo = calcOpeningSaldo(account, who, whatSet, dateFrom);

    const rows = [];

// === Добавляем строку начального сальдо ===
rows.push({
    type: "opening",
    year: null,
    month: null,
    accrued: 0,
    paid: 0,
    saldo,
    label: `Сальдо на початок періоду (${toDMY(dateFrom)})`,
    accruedDetails: [],
    paidDetails: []
});

    let totalAccrued = 0;
    let totalPaid    = 0;

    // ============================
    // 1) список who
    // ============================
    const whoList = who
        ? [who]
        : Array.from(new Set([
            ...Object.keys(indexNach[account] || {}),
            ...Object.keys(indexPlat[account] || {})
        ]));
console.log("WHO LIST:", whoList);


    // ============================
    // 2) основной цикл по месяцам
    // ============================
    for (const { year, month } of months) {

        let accrued = 0;
        let paid    = 0;

        const accruedDetails = [];
        const paidDetails    = [];

        // ---------------------------------------------
        // ПРОХОД ПО ВСЕМ КОНТРАГЕНТАМ
        // ---------------------------------------------
        for (const w of whoList) {

            //
            // 2.1 — НАЧИСЛЕНИЯ (indexNach)
            //
            const srcNach = indexNach[account]?.[w];
            if (srcNach) {

                for (const whatCode in srcNach) {
console.log("CHECK WHAT", w, whatCode, "SET=", whatSet);

                    // фильтр по услугам
                    if (whatSet && whatSet.size > 0 && !whatSet.has(whatCode)) continue;

                    const byYear = srcNach[whatCode];
                    const arr = byYear?.[year]?.[month];
                    if (!arr) continue;

                    for (const r of arr) {
                        const day    = r[0];
                        const sum    = r[1];
                        const credit = String(r[4]);
                        const debit  = String(r[5]);
                        const file   = r[6] || null;

                        let delta = 0;
                        if (credit === account) delta = getPostingEffect(account, "credit", sum);
                        if (debit  === account) delta = getPostingEffect(account, "debit",  sum);
console.log("нач OP", {
    year, month, w,
    whatCode,
    day, sum, credit, debit, delta
});

                        saldo += delta;

                        if (delta > 0) {
                            // начислено
                            accrued += delta;
                            accruedDetails.push({
                                day,
                                title: safeWhatName(whatCode),
                                sum: sum,
                                fileUrl: file ? buildActPdfUrl(year, month,file) : null,
                                info: null
                            });
                        } else if (delta < 0) {
                            // теоретически редко, но логика нужна
                            paid += delta;
                            paidDetails.push({
                                day,
                                title: safeWhatName(whatCode),
                                sum: -sum,
                                fileUrl: file ?  buildActPdfUrl(year, month,file) : null,
                                info: null
                            });
                        }
                    }
                }
            }


            //
            // 2.2 — ПЛАТЕЖИ (indexPlat)
            //
            const srcPlat = indexPlat[account]?.[w];
            if (srcPlat) {

                for (const whatCode in srcPlat) {

                    // фильтр по услугам
                    if (whatSet && whatSet.size > 0 && !whatSet.has(whatCode)) continue;

                    const byYear = srcPlat[whatCode];
                    const arr = byYear?.[year]?.[month];
                    if (!arr) continue;

                    for (const r of arr) {
                        const day    = r[0];
                        const sum    = r[1];
                        const credit = String(r[6]);
                        const debit  = String(r[7]);
                        const docNo  = r[4];
                        const descr  = r[5];

                        let delta = 0;
                        if (credit === account) delta = getPostingEffect(account, "credit", sum);
                        if (debit  === account) delta = getPostingEffect(account, "debit",  sum);
console.log("NACH OP", {
    year, month, w,
    whatCode,
    day, sum, credit, debit, delta
});

                        saldo += delta;

                        if (delta > 0) {
                            accrued += delta;
                            accruedDetails.push({
                                day,
                                title: safeWhatName(whatCode),
                                sum: sum,
                                fileUrl: null,
                                info: descr || null
                            });
                        } else if (delta < 0) {
                            paid += delta;
                            paidDetails.push({
                                day,
                                title: safeWhatName(whatCode),
                                sum: -sum,
                                fileUrl: null,
                                info: descr || null
                            });
                        }
                    }
                }
            }
        } // конец цикла по who


        // ================================
        // Запись строки месяца
        // ================================
        rows.push({
            year,
            month,
            accrued,
            paid,
            saldo,
            accruedDetails,
            paidDetails
        });

        totalAccrued += accrued;
        totalPaid    += paid;
    }


    // ================================
    // Итоги
    // ================================
    const totals = {
        accrued: totalAccrued,
        paid:    totalPaid,
        saldo
    };

    return { rows, totals };
}

//
// ============================================
// 9. Вспомогательные HTML-форматтеры
// ============================================
//

// Форматирует детальный список начислений или платежей
function formatDetails(details) {
    if (!details || !details.length) return "";

    let html = `<ul class="liab-details">`;

    for (const d of details) {
        html += `<li>`;

        if (d.fileUrl) {
            html += `<a href="${d.fileUrl}" class="file-link" target="_blank">${d.title}</a>`;
        } else {
            html += `<span class="title">${d.title}</span>`;
        }

        if (d.info) {
            html += `<span class="descr"> — ${d.info}</span>`;
        }

        html += `: <b>${(+d.sum).toMoney()} ₴</b>`;

        html += `</li>`;
    }

    html += `</ul>`;
    return html;
}

// Всплывашка для строки (когда есть детализация)
function renderPoster(sum, details) {
    if (!sum || Math.abs(sum) < 0.005) {
    return `<span>-</span>`;
}
    if (!details || !details.length) {
        return `
        <span>
            ${sum.toFixedWithComma(2)} ₴
        </span>`;
    }

    const files = details.map(d => d.fileUrl).filter(Boolean);
    const hasFiles = files.length > 0;

    return `
        <span class="poster"
            ${hasFiles ? `
                data-files='${JSON.stringify(files)}'
                data-file-index="0"
            ` : ''}>
            ${sum.toFixedWithComma(2)} ₴
            ${hasFiles ? `<span class="act-icon">📄</span>` : ''}
            <div class="descr">
                ${details.map(d =>
                    `${d.title}: ${d.sum.toFixedWithComma(2)} грн` +
                    (d.info ? `<br><small>${d.info}</small>` : '')
                ).join("<br>")}
            </div>
        </span>
    `;
}


//
// ============================================
// 10. Рендер таблицы акта сверки
// ============================================
//

function renderReconciliationTable(rows, totals, account, who, dateTo = null) {

    const saldoOwner = getSaldoOwner(account, totals.saldo, who);

    const saldoClass =
        saldoOwner?.side === "our"
            ? "green"
            : (saldoOwner?.side === "counterparty" ? "red" : "");

    let html = `
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
    `;

    for (const r of rows) {

        if (r.type === "opening") {
            html += `
                <tr class="opening">
                    <td colspan="3">${r.label}</td>
                    <td>${r.saldo.toFixedWithComma(2)} ₴</td>
                </tr>
            `;
            continue;
        }

        html += `
            <tr>
                <td>${MONTH_NAMES_UA_SHORT[r.month - 1]} ${r.year}</td>
                <td class="poster-cell">${renderPoster(r.accrued, r.accruedDetails, true)}</td>
                <td class="poster-cell">${renderPoster(-r.paid, r.paidDetails, true)}</td>
                <td>${r.saldo.toFixedWithComma(2)} ₴</td>
            </tr>
        `;
    }

    html += `
    </tbody>
    <tfoot>
        <tr class="liab-total ${saldoClass}">
            <td><b>Всього</b></td>
            <td><b>${totals.accrued.toFixedWithComma(2)} ₴</b></td>
            <td><b>${(-totals.paid).toFixedWithComma(2)} ₴</b></td>
            <td>
                <b>${Math.abs(totals.saldo).toFixedWithComma(2)} ₴</b><br>
                ${
                    saldoOwner
                        ? `<small>станом на ${toDMY(dateTo || new Date())}<br> на користь <b>${saldoOwner.name}</b></small>`
                        : `<small>заборгованість відсутня</small>`
                }
            </td>
        </tr>
    </tfoot>
</table>
`;

    return html;
}




//
// ============================================
// 11. Обработчики всплывающих подсказок
// ============================================
//

function bindPosterHandlers() {
    const posters = document.querySelectorAll(".poster-btn");

    posters.forEach(btn => {
        const popup = btn.querySelector(".poster-popup");
        if (!popup) return;

        btn.addEventListener("mouseenter", () => {
            popup.style.display = "block";
        });

        btn.addEventListener("mouseleave", () => {
            popup.style.display = "none";
        });
    });
}

//
// ============================================
// 12. Получение списка контрагентов
// ============================================
//

// Собираем список контрагентов, у которых есть операции в периоде

function collectWhoList(account, dateFrom, dateTo) {

    const accRules = ACCOUNT_RULES[account];
    if (!accRules) return [];

    // получаем объединённую мета-информацию
    const meta = collectWhoMeta(account, dateFrom, dateTo);

    return Object.keys(meta)
        .map(who => ({
            who,
            name: safeWhoName(who),
            inactive: !meta[who].hasMovement && !meta[who].hasSaldo
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
function collectWhoMeta(account, dateFrom, dateTo) {

    const res = {}; // who → { hasMovement: bool, hasSaldo: bool }

    const yFrom  = dateFrom.getFullYear();
    const mFrom  = dateFrom.getMonth() + 1;

    const yTo    = dateTo.getFullYear();
    const mTo    = dateTo.getMonth() + 1;

    function inRange(y, m) {
        if (y < yFrom) return false;
        if (y > yTo)   return false;
        if (y === yFrom && m < mFrom) return false;
        if (y === yTo   && m > mTo)   return false;
        return true;
    }

    // ============================================
    // 1) ДВИЖЕНИЯ В ВЫБРАННОМ ПЕРИОДЕ
    // ============================================

    // Начисления
    if (indexNach[account]) {
        for (const who in indexNach[account]) {
            const byWhat = indexNach[account][who];

            outer1:
            for (const what in byWhat) {
                const byYear = byWhat[what];

                for (const y in byYear) {
                    for (const m in byYear[y]) {

                        if (inRange(+y, +m)) {
                            if (!res[who]) res[who] = {};
                            res[who].hasMovement = true;
                            break outer1;
                        }
                    }
                }
            }
        }
    }

    // Платежи
    if (indexPlat[account]) {
        for (const who in indexPlat[account]) {
            const byWhat = indexPlat[account][who];

            outer2:
            for (const what in byWhat) {
                const byYear = byWhat[what];

                for (const y in byYear) {
                    for (const m in byYear[y]) {

                        if (inRange(+y, +m)) {
                            if (!res[who]) res[who] = {};
                            res[who].hasMovement = true;
                            break outer2;
                        }
                    }
                }
            }
        }
    }

    // ============================================
    // 2) САЛЬДО НА НАЧАЛО ПЕРИОДА
    // ============================================

    const allWho = new Set([
        ...Object.keys(indexNach[account] || {}),
        ...Object.keys(indexPlat[account] || {})
    ]);

    for (const who of allWho) {

        // calcOpeningSaldo возвращает корректное сальдо на дату dateFrom
        const saldo = calcOpeningSaldo(account, who, null, dateFrom);

        if (Math.abs(saldo) >= 0.01) {
            if (!res[who]) res[who] = {};
            res[who].hasSaldo = true;
        }
    }

    return res;
}






//
// ============================================
// 13. Получение списка услуг (what) для 631
// ============================================
//

function collectWhatList(account, who) {
    const rules = ACCOUNT_RULES[account];
    if (!rules || !rules.useWhat) return [];

    const set = new Set();

    // Начисления
    if (indexNach[account]?.[who]) {
        for (const what in indexNach[account][who]) {
            set.add(what);
        }
    }

    // Платежи
    if (indexPlat[account]?.[who]) {
        for (const what in indexPlat[account][who]) {
            set.add(what);
        }
    }

    return [...set].map(whatCode => ({
        what: whatCode,
        title: safeWhatName(whatCode)
    }));
}

//
// ============================================
// 14. Рендер выпадающего списка контрагентов
// ============================================
//

function renderWhoSelect(account, dateFrom, dateTo, selectedWho) {

    const rules = ACCOUNT_RULES[account];
    const showWho = rules && rules.useWho;

    if (!showWho) {
        return `<div class="liab-who-wrap"></div>`; // пусто
    }

    const list = collectWhoList(account, dateFrom, dateTo);

    if (!list.length) {
        return `
        <div class="liab-who-wrap">
            <label>Контрагент:</label>
            <div class="empty">Немає даних</div>
        </div>`;
    }

    let html = `
    <div class="liab-who-wrap">
        <label>Контрагент:</label>
        <select id="whoSelect" class="liab-who">
            <option value="">(всі)</option>
    `;

    for (const row of list) {
        const sel = selectedWho === row.who ? "selected" : "";
        html += `<option value="${row.who}" ${sel}>${row.name}</option>`;
    }

    html += `</select></div>`;

    return html;
}

//
// ============================================
// 15. Рендер списка услуг (what)
// ============================================
//

function renderWhatSelect(account, who, selectedWhatSet) {

    const rules = ACCOUNT_RULES[account];
    if (!rules || !rules.useWhat) return "";

    if (!who) {
        return `<div class="liab-what-wrap"></div>`; // услуг нет без контрагента
    }

    const list = collectWhatList(account, who);

    if (!list.length) {
        return `
        <div class="liab-what-wrap">
            <label>Послуги:</label>
            <div class="empty">Немає</div>
        </div>`;
    }

    let html = `
    <div class="liab-what-wrap">
        <label>Послуги:</label>
        <div class="liab-what-list">
    `;

    for (const item of list) {
        const checked = selectedWhatSet && selectedWhatSet.has(item.what) ? "checked" : "";
        html += `
            <label class="liab-what-item">
                <input type="checkbox" class="liab-what" value="${item.what}" ${checked}>
                <span>${item.title}</span>
            </label>
        `;
    }

    html += `</div></div>`;
    return html;
}
//
// ============================================
// 16. Основная функция открытия акта сверки
// ============================================
//

function openLiabilityHistory({ account, who = null }) {

    window.currentLiabAccount = account;

    const dateTo = parseDt(dt);

    // === ЛОГИКА ДАТЫ ОТ ===
    const currentMonth = dateTo.getMonth() + 1; // 1..12
    const year = dateTo.getFullYear();

    const dateFrom = 
        (currentMonth <= 3)
            ? new Date(year - 1, 0, 1)   // январь прошлого года
            : new Date(year,     0, 1);  // январь текущего года

    dateFrom.setHours(0,0,0,0);

    renderLiabPage(account, dateFrom, dateTo, who);

    reloadLiabAdvanced();
}




//
// ============================================
// 17. Рендер страницы акта сверки (фильтры + контейнер таблицы)
// ============================================
//

function renderLiabPage(account, dateFrom, dateTo, who) {

    const accInfo = LIABILITY_ACCOUNTS[account];

    //
    // --- Определяем выбранное значение who в select ---
    //
    let selectedWho = who;

    // Если это налоговый счет (641/651/652) и who == null,
    // то пользователь хочет открыть ИМЕННО ЭТОТ счет,
    // а не категорию TAX.
    if (accInfo.analytics === "account" && !selectedWho) {
        selectedWho = account;
    }

    // --- услуги только для 631 ---
    const whatList = (account === "631")
        ? collectWhatList631Safe(dateFrom, dateTo, selectedWho)
        : [];

    const subtitleText = selectedWho ? safeWhoName(selectedWho) : getAccountTitle(account);
    const titleText = selectedWho
        ? 'Звірка розрахунків з контрагентом'
        : (account === '482'
            ? 'Звірка розрахунків по пільгам ХМР'
            : 'Звірка розрахунків за рахунком');

    // --- рендер всей страницы ---
    maincontainer.innerHTML = `
        <div class="liab-history-page">

            <div class="liab-header">
                <button onclick="initDashboard()">← Назад</button>
                <h2>${titleText}</h2>

                <div class="liab-subtitle">

                    <!-- Контрагент -->
                    <div class="liab-subtitle-line">
                        Контрагент:
                        <select id="whoSelect">
                            ${buildWhoOptions(account, dateFrom, dateTo, selectedWho)}
                        </select>
                    </div>

                    <!-- Услуги -->
                    ${account === "631" ? `
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
                            `).join("")}
                        </div>
                    ` : ""}

                    <!-- Период -->
                    <div class="liab-subtitle-line">
                        Період:
                        <input type="date" id="dateFrom" value="${toISO(dateFrom)}">
                        —
                        <input type="date" id="dateTo" value="${toISO(dateTo)}">
                    </div>

                </div>
            </div>

            <!-- Печатная шапка акта -->
            <div class="print-act-header">
                <div class="act-title">АКТ ЗВІРКИ ВЗАЄМНИХ РОЗРАХУНКІВ</div>

                <div class="act-meta">
                    <div>м. _____________</div>
                    <div>«___» ____________ 20__ р.</div>
                </div>

                <div class="act-text">
                </div>
            </div>

            <!-- Таблица -->
            <div id="tableContainer"></div>

            <!-- Печатный блок подписи -->
            <div class="print-act-sign">
            </div>

        </div>
    `;
    updatePrintHeader(account, selectedWho, dateTo);

    // --- bind elements ---
    window.dateFromEl = document.getElementById("dateFrom");
    window.dateToEl   = document.getElementById("dateTo");
    window.whoSelect  = document.getElementById("whoSelect");
    window.whatContainer = document.querySelector(".liab-what-list");
    window.tableContainer = document.getElementById("tableContainer");

    // === Навешиваем обработчики ===
    whoSelect.addEventListener("change", () => {
        if (account === "631") update631ServicesByWho();
        reloadLiabAdvanced();
    });

    dateFromEl.addEventListener("change", triggerLiabRecalc);
    dateToEl.addEventListener("change", triggerLiabRecalc);

    document
        .querySelectorAll(".what-checkbox")
        .forEach(cb =>
            cb.addEventListener("change", reloadLiabAdvanced)
        );
}

function updatePrintHeader(account, who, dateTo) {

    let subtitleText = "";

    const accInfo = LIABILITY_ACCOUNTS[account];
    const taxCat  = LIABILITY_CATEGORIES.find(c => c.key === "TAX");

    // ---- 1) Все налоги и зарплата (а также TAX) ----
    if (taxCat.accounts.includes(account)) {

        if (who === "TAX") {
            // Объединённый режим: 661 + 641 + 651 + 652
            subtitleText = taxCat.title;    // "Зарплата і податки"
        }
        else if (who && taxCat.accounts.includes(who)) {
            // Пользователь выбрал конкретный налог
            subtitleText = LIABILITY_ACCOUNTS[who].title;
        }
        else {
            // Открыт один счет, например 641 или 661
            subtitleText = accInfo.title;
        }
    }

    // ---- 2) ЛЬГОТИ 482 (analytics = total) ----
    else if (accInfo.analytics === "total") {
        subtitleText = accInfo.title;
    }

    // ---- 3) Счета с контрагентами (analytics = who) ----
    else if (accInfo.analytics === "who") {
        subtitleText = who ? safeWhoName(who) : accInfo.title;
    }

    // ---- 4) Дефолт (если что-то добавится позже) ----
    else {
        subtitleText = accInfo.title;
    }


    // ---- вставка в DOM ----

    const actText   = document.querySelector(".print-act-header .act-text");
    const signBlock = document.querySelector(".print-act-sign");

    if (actText) {
        actText.innerHTML = `
            Ми, що нижче підписалися, представники
            <b>${org}</b>
            та
            <b>${subtitleText}</b>,
            склали цей акт про те, що станом на
            <b>${toDMY(dateTo)}</b> взаємні розрахунки мають наступний стан:
        `;
    }

    if (signBlock) {
        signBlock.innerHTML = `
            <div>
                Від ${org}:<br><br>
                ___________________ / ___________________
            </div>

            <div>
                Від ${subtitleText}:<br><br>
                ___________________ / ___________________
            </div>
        `;
    }
}







//
// ============================================
// 18. Привязка обработчиков интерфейса
// ============================================
//

function bindLiabControls(account) {

    const btn = document.getElementById("liabReloadBtn");
    btn.addEventListener("click", () => triggerLiabRecalc(account));

    // контрагент
    const whoSelect = document.getElementById("whoSelect");
    if (whoSelect) {
        whoSelect.addEventListener("change", () => triggerLiabRecalc(account, true));
    }

    // услуги
    const whatInputs = document.querySelectorAll(".liab-what");
    whatInputs.forEach(inp => {
        inp.addEventListener("change", () => triggerLiabRecalc(account));
    });
}

//
// ============================================
// 19. Сбор параметров и запуск пересчёта
// ============================================
//

let liabRecalcTimer = null;

function triggerLiabRecalc() {
    clearTimeout(liabRecalcTimer);

    liabRecalcTimer = setTimeout(() => {

        const dateFromEl = document.getElementById('dateFrom');
        const dateToEl   = document.getElementById('dateTo');

        if (!isValidDateInput(dateFromEl) || !isValidDateInput(dateToEl)) {
            return; // НЕ СЧИТАТЬ
        }

        reloadLiabAdvanced();

    }, 300);
}



//
// ============================================
// 20. Перерасчёт акта (главная рабочая функция)
// ============================================
//

function reloadLiabAdvanced() {

    if (!window.dateFromEl || !window.dateToEl || !window.tableContainer) return;

    const dateFrom = new Date(dateFromEl.value);
    const dateTo   = new Date(dateToEl.value);

    if (isNaN(dateFrom) || isNaN(dateTo)) return;

    const account = window.currentLiabAccount;
    const accInfo = LIABILITY_ACCOUNTS[account];
    if (!accInfo) return;

    //
    // 1. Выбранное значение
    //
    let sel = whoSelect.value || null;

    //
    // 2. Услуги для 631
    //
    let whatList = null;
    if (account === "631") {
        whatList = [...document.querySelectorAll(".what-checkbox")]
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    //
    // 3. Перестраиваем селект
    //
    whoSelect.innerHTML = buildWhoOptions(account, dateFrom, dateTo, sel);
    sel = whoSelect.value || null;

    //
    // 4. НАЛОГИ (analytics = account)
    //
    if (accInfo.analytics === "account") {

        const taxCat = LIABILITY_CATEGORIES.find(c => c.key === "TAX");

        // === Все налоги вместе ===
        if (sel === "TAX") {

            let mergedRows = null;
            let mergedTotals = { accrued: 0, paid: 0, saldo: 0 };

            for (const tax of taxCat.accounts) {

                const r = calcReconciliation({
                    account: tax,
                    who: null,
                    whatSet: null,
                    dateFrom,
                    dateTo
                });

                // totals
                mergedTotals.accrued += r.totals.accrued;
                mergedTotals.paid    += r.totals.paid;
                mergedTotals.saldo   += r.totals.saldo;

                // rows
                if (!mergedRows) {
                    mergedRows = r.rows.map(row => ({ ...row }));
                } else {
                    for (let i = 0; i < mergedRows.length; i++) {
                        mergedRows[i].accrued += r.rows[i].accrued;
                        mergedRows[i].paid    += r.rows[i].paid;
                        mergedRows[i].saldo   += r.rows[i].saldo;
                        mergedRows[i].accruedDetails.push(...r.rows[i].accruedDetails);
                        mergedRows[i].paidDetails.push(...r.rows[i].paidDetails);
                    }
                }
            }

            tableContainer.innerHTML = renderReconciliationTable(
                mergedRows,
                mergedTotals,
                "TAX",
                null,
                dateTo
            );

            updatePrintHeader(account, sel, dateTo);
            closeActPreview();
            bindPosterHandlers();
            return;
        }

        // === Конкретный налог (641/651/652) ===
        const r = calcReconciliation({
            account: sel,
            who: null,
            whatSet: null,
            dateFrom,
            dateTo
        });

        tableContainer.innerHTML = renderReconciliationTable(
            r.rows,
            r.totals,
            sel,
            null,
            dateTo
        );
        updatePrintHeader(account, sel, dateTo);
        closeActPreview();
        bindPosterHandlers();
        return;
    }

    //
    // 5. ЛЬГОТЫ (482)
    //
    if (accInfo.analytics === "total") {

        // ВАЖНО: Льготы считаются по пустому контрагенту
        sel = "";

        const result = calcReconciliation({
            account,
            who: sel,    // "" — правильно
            whatSet: null,
            dateFrom,
            dateTo
        });

        tableContainer.innerHTML = renderReconciliationTable(
            result.rows,
            result.totals,
            account,
            sel,
            dateTo
        );
        updatePrintHeader(account, sel, dateTo);
        closeActPreview();
        bindPosterHandlers();
        return;
    }

    //
    // 6. Остальные счета
    //
    const result = calcReconciliation({
        account,
        who: sel,
        whatSet: whatList ? new Set(whatList) : null,
        dateFrom,
        dateTo
    });

    tableContainer.innerHTML = renderReconciliationTable(
        result.rows,
        result.totals,
        account,
        sel,
        dateTo
    );
    updatePrintHeader(account, sel, dateTo);
    closeActPreview();
    bindPosterHandlers();
}









//
// ============================================
// 21. Заробітна плата (рахунок 661)
// ============================================
//

// Совместимо с indexNach / indexPlat

function calcSalary661(dateFrom, dateTo) {

    const account = "661";
    const rows = [];

    const months = getMonthsBetween(dateFrom, dateTo);
    let saldo = calcOpeningSaldo(account, "", null, dateFrom);

    let totalAccrued = 0;
    let totalPaid    = 0;

    for (const { year, month } of months) {

        let accrued = 0;
        let paid    = 0;

        //
        // НАЧИСЛЕНИЯ (indexNach["661"][""])
        //
        const srcNach = indexNach[account]?.[""];
        if (srcNach) {
            for (const whatCode in srcNach) {
                const byYear  = srcNach[whatCode];
                const arr = byYear?.[year]?.[month];
                if (!arr) continue;

                for (const r of arr) {
                    const sum = r[1];
                    const credit = String(r[4]);
                    const debit  = String(r[5]);

                    let delta = 0;
                    if (credit === account) delta = getPostingEffect(account, "credit", sum);
                    if (debit  === account) delta = getPostingEffect(account, "debit",  sum);
console.log("PLAT OP", {
    year, month, w,
    whatCode,
    day, sum, credit, debit, delta
});

                    saldo += delta;
                    if (delta > 0) accrued += delta;
                    else           paid    += delta;
                }
            }
        }

        //
        // ПЛАТЕЖИ (indexPlat["661"][""])
        //
        const srcPlat = indexPlat[account]?.[""];
        if (srcPlat) {
            for (const whatCode in srcPlat) {
                const byYear = srcPlat[whatCode];
                const arr = byYear?.[year]?.[month];
                if (!arr) continue;

                for (const r of arr) {
                    const sum = r[1];
                    const credit = String(r[6]);
                    const debit  = String(r[7]);

                    let delta = 0;
                    if (credit === account) delta = getPostingEffect(account, "credit", sum);
                    if (debit  === account) delta = getPostingEffect(account, "debit",  sum);
console.log("плат OP", {
    year, month, w,
    whatCode,
    day, sum, credit, debit, delta
});

                    saldo += delta;

                    if (delta > 0) accrued += delta;
                    else           paid    += delta;
                }
            }
        }

        rows.push({
            year,
            month,
            accrued,
            paid,
            saldo
        });

        totalAccrued += accrued;
        totalPaid    += paid;
    }

    const totals = {
        accrued: totalAccrued,
        paid:    totalPaid,
        saldo
    };

    return { rows, totals };
}

//
// ============================================
// 22. Рендер таблицы зарплаты
// ============================================
//




//
// ============================================
// 23. Пересчёт зарплаты (используется в UI)
// ============================================
//

function reloadSalaryAdvanced(dateFrom, dateTo) {

    const { rows, totals } = calcSalary661(dateFrom, dateTo);

    const html = renderSalaryTable(rows, totals);

    const container = document.querySelector(".salary-table-container");
    if (container) {
        container.innerHTML = html;
        bindPosterHandlers();
    }
}
//
// ============================================
// 24. Вспомогательные функции для DOM / событий
// ============================================
//

// Универсальная функция: получить значение чекбоксов по классу
function getCheckedValues(className) {
    const result = new Set();
    document.querySelectorAll("." + className).forEach(i => {
        if (i.checked) result.add(i.value);
    });
    return result.size ? result : null;
}

// Получить дату из поля типа month
function readMonth(id) {
    const v = document.getElementById(id).value; // YYYY-MM
    if (!v) return null;
    const [year, month] = v.split("-");
    return new Date(+year, +month - 1, 1);
}

// ==============================
// 25. Экспорт (опционально)
// ==============================
// В старом модуле был экспорт PDF/Excel, но в новом файле
// пока что нет необходимости подключать, чтобы не усложнять код.
// Если захочешь — я добавлю rеаl export XLSX/PDF.


// ==============================
// 26. Проверки наличия контейнеров
// ==============================

function ensureContainer(selector, msg) {
    const el = document.querySelector(selector);
    if (!el) {
        console.warn("Контейнер не найден:", selector, msg || "");
    }
    return el;
}


// ==============================
// 27. Инициализация модуля
// ==============================
// Ничего автоматически не запускается.
// Функция openLiabilityHistory(account) вызывается извне,
// так же как и раньше.
let last631Who = null;

function update631ServicesByWho() {
    const dateFrom = new Date(dateFromEl.value);
    const dateTo   = new Date(dateToEl.value);
    const who = whoSelect.value || null;

    // Собираем услуги по ТЕКУЩЕМУ контрагенту
    const available = collectWhatList631Safe(dateFrom, dateTo, who || null);

    // Все услуги ВКЛЮЧЕНЫ
    const checked = available;

    whatContainer.innerHTML = available.map(w => `
        <label class="what-tag">
            <input type="checkbox"
                   class="what-checkbox"
                   value="${w}"
                   checked>
            <span>${what[w] || w}</span>
        </label>
    `).join("");

    // Навесить обработчики
    document.querySelectorAll(".what-checkbox")
        .forEach(cb => cb.addEventListener("change", reloadLiabAdvanced));
}





function isValidDateInput(el) {
    if (!el || !el.value) return false;

    const d = new Date(el.value);
    if (isNaN(d)) return false;

    const year = d.getFullYear();

    // допустимый диапазон бухгалтерии
    if (year < 2000 || year > 2100) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    // дата не может быть в будущем
    if (d > today) return false;

    return true;
}
function closeActPreview() {
    document
        .querySelectorAll('.act-preview-row')
        .forEach(r => r.remove());
}
function fmtMoneyOrDash(value) {
    if (!value || Math.abs(value) < 0.005) return "-";
    return value.toFixedWithComma(2) + " ₴";
}

function buildWhoOptions(account, dateFrom, dateTo, selected) {
    const accInfo = LIABILITY_ACCOUNTS[account];

    // ================
    // НАЛОГИ (analytics=account)
    // ================
    if (accInfo.analytics === "account") {

        const taxCat = LIABILITY_CATEGORIES.find(c => c.key === "TAX");
        const accounts = taxCat.accounts;

        let html = `
            <option value="TAX" ${selected === "TAX" ? "selected" : ""}>
                ${taxCat.title}
            </option>
        `;

        for (const acc of accounts) {
            const title = LIABILITY_ACCOUNTS[acc].title;
            html += `
                <option value="${acc}" ${selected === acc ? "selected" : ""}>
                    ${title}
                </option>
            `;
        }

        return html;
    }

    // ================
    // 482 (total → only ХМР)
    // ================
    if (accInfo.analytics === "total") {
        if (/ХМР/i.test(accInfo.title)) {
            return `
                <option value="ХМР" ${selected === "ХМР" ? "selected" : ""}>
                    ХМР
                </option>
            `;
        }
        return `<option value="" selected>${accInfo.title}</option>`;
    }

    // ================
    // Обычные счета (who)
    // ================
    const list = collectWhoList(account, dateFrom, dateTo);

    let html = `<option value="">— всі —</option>`;

    for (const row of list) {
        html += `
            <option value="${row.who}" ${selected === row.who ? "selected" : ""}>
                ${row.name}
            </option>
        `;
    }

    return html;
}





function openSalaryHistory() {
    const today = new Date();
    const dateFrom = salaryOpeningDate();
    const dateTo   = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    renderSalaryPage(dateFrom, dateTo);
    reloadSalaryAdvanced();
    
}

function renderSalaryPage(dateFrom, dateTo) {

    maincontainer.innerHTML = `
        <div class="liab-history-page">

            <div class="liab-header">
                <button onclick="initDashboard()">← Назад</button>
                <h2>Звіт по заробітній платі</h2>

                <div class="liab-subtitle">

                    <!-- Период -->
                    <div class="liab-subtitle-line">
                        Період:
                        <input type="date" id="salaryDateFrom" value="${toISO(dateFrom)}">
                        —
                        <input type="date" id="salaryDateTo" value="${toISO(dateTo)}">
                    </div>

                </div>
            </div>

            <div id="salaryTableContainer"></div>
        </div>
    `;

    window.salaryDateFromEl = document.getElementById("salaryDateFrom");
    window.salaryDateToEl   = document.getElementById("salaryDateTo");
    window.salaryTableContainer = document.getElementById("salaryTableContainer");

    salaryDateFromEl.addEventListener("change", reloadSalaryAdvanced);
    salaryDateToEl.addEventListener("change", reloadSalaryAdvanced);
}

function calcSalaryReconciliation(dateFrom, dateTo) {

    // === Валидация ===
    if (!isValidSalaryDate(dateFrom)) {
        return { rows: [], totals: {} };
    }

    // === НАЧАЛЬНЫЙ ОСТАТОК ===
    const openingRangeFrom = salaryOpeningDate();
    const openingRangeTo   = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 0);

    const openingSaldo = calcReconciliation({
        account: "661",
        who: null,
        whatSet: null,
        dateFrom: openingRangeFrom,
        dateTo: openingRangeTo
    }).totals.saldo;

    // === итоговые значения ===
    const totals = {
        opening: openingSaldo,
        accrued: 0,
        pdf: 0,
        vs: 0,
        toPay: 0,
        paid: 0,
        saldo: openingSaldo,
        esv: 0
    };

    const rows = [];
    const ymList = generateMonthList(dateFrom, dateTo);

    for (const { year, month } of ymList) {
        const pdf641     = sumByYearMonth(indexNach["641"], year, month);
        const vs652      = sumByYearMonth(indexNach["652"], year, month);

        const accrued661 = sumByYearMonth(indexNach["661"], year, month)-pdf641-vs652;
        const esv651     = sumByYearMonth(indexNach["651"], year, month);

        const paid661    = sumByPayments(indexPlat["661"], year, month);

        const toPay = accrued661 - pdf641 - vs652;
        const saldo = toPay - paid661;

        rows.push({ year, month, accrued: accrued661, pdf: pdf641, vs: vs652,
                    toPay, paid: paid661, saldo, esv: esv651 });

        totals.accrued += accrued661;
        totals.pdf     += pdf641;
        totals.vs      += vs652;
        totals.toPay   += toPay;
        totals.paid    += paid661;
        totals.esv     += esv651;
        totals.saldo=saldo;
    }

    //totals.saldo = totals.opening + (totals.toPay - totals.paid);

    return { rows, totals };
}



function reloadSalaryAdvanced() {

    const dateFrom = new Date(salaryDateFromEl.value);
    const dateTo   = new Date(salaryDateToEl.value);

    if (isNaN(dateFrom) || isNaN(dateTo)) return;

    const { rows, totals } = calcSalaryReconciliation(dateFrom, dateTo);

    salaryTableContainer.innerHTML = renderSalaryTable(rows, totals);
    initPosters();

}

function generateMonthList(dateFrom, dateTo) {
    const list = [];
    let y = dateFrom.getFullYear();
    let m = dateFrom.getMonth() + 1;

    while (y < dateTo.getFullYear() ||
          (y === dateTo.getFullYear() && m <= dateTo.getMonth() + 1)) {

        list.push({ year: y, month: m });

        m++;
        if (m > 12) { m = 1; y++; }
    }

    return list;
}

function sumByYearMonth(index, year, month) {
    if (!index) return 0;

    let sum = 0;

    for (const who in index) {
        const byWhat = index[who];
        for (const what in byWhat) {
            const arr = byWhat[what]?.[year]?.[month];
            if (!arr) continue;

            for (const row of arr) {
                sum += row[1]; // row[1] = сумма
            }
        }
    }

    return sum;
}



function sumByPayments(index, year, month) {
    if (!index) return 0;

    let sum = 0;

    for (const who in index) {
        const byWhat = index[who];
        for (const what in byWhat) {
            const arr = byWhat[what]?.[year]?.[month];
            if (!arr) continue;

            for (const row of arr) {
                sum += row[1]; // row[1] = сумма
            }
        }
    }

    return sum;
}




function collectPaymentDetails(account, year, month) {
    const list = [];

    if (!indexPlat[account]) return list;

    for (const who in indexPlat[account]) {
        const byWhat = indexPlat[account][who];

        for (const what in byWhat) {
            const byYear = byWhat[what];
            const rows = byYear?.[year]?.[month];
            if (!rows) continue;

            for (const r of rows) {

                const day = String(r[0]).padStart(2, "0"); // r[0] = день месяца
                const dateStr = `${day}.${String(month).padStart(2,'0')}.${year}`;

                const sum = r[1];
                const purpose = r[5] || "";         // НАЗНАЧЕННЯ
                const payOrderNo = r[4] || "";      // № платіжного доручення

                // формируем info
                let info = "";
                if (purpose) info += purpose;
                if (payOrderNo) info += ` (П/д №${payOrderNo})`;
                info += ` — ${dateStr}`;

                list.push({
                    title: what || "Платіж",
                    sum: sum,
                    info: info,
                    fileUrl: null
                });
            }
        }
    }

    return list;
}


function fmt(n) {
    if (!n || isNaN(n)) return "0";
    return Number(n).toLocaleString("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function salaryOpeningDate() {
    const today = new Date();
    const m = today.getMonth() + 1;

    // если сейчас январь, февраль или март → прошлый год
    const year = (m <= 3) ? today.getFullYear() - 1 : today.getFullYear();

    return new Date(year, 0, 1);  // 1 января
}


function isValidSalaryDate(d) {
    if (!(d instanceof Date) || isNaN(d)) return false;

    const y = d.getFullYear();
    if (y < 2000 || y > 2100) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    if (d > today) return false;

    return true;
}


function renderSalaryTable(rows, totals) {

    let html = `
        <table class="main salary-table">
            <thead>
                <tr>
                    <th>Місяць</th>
                    <th>Нараховано</th>
                    <th>ПДФО</th>
                    <th>ВС</th>
                    <th>До Виплати</th>
                    <th>Виплачено</th>
                    <th>Залишок</th>
                    <th>Нараховано ЄСВ</th>
                </tr>
            </thead>

            <tbody>
                <tr class="opening-row">
                    <td><b>Залишок на початок</b></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><b>${fmt(totals.opening)}</b></td>
                    <td></td>
                </tr>
    `;
    for (const r of rows) {
        const ymLabel = `${r.month.toString().padStart(2,'0')}.${r.year}`;
        const details = collectPaymentDetails("661", r.year, r.month);
        html += `
            <tr>
                <td>${ymLabel}</td>
                <td>${fmt(r.accrued)}</td>
                <td>${fmt(r.pdf)}</td>
                <td>${fmt(r.vs)}</td>
                <td>${fmt(r.toPay)}</td>

                <td class="salary-paid">
                    ${renderPoster(r.paid, details)}
                </td>

                <td>${fmt(r.saldo)}</td>
                <td>${fmt(r.esv)}</td>
            </tr>
        `;
    }

    html += `
            </tbody>

            <tfoot>
                <tr>
                    <th>Всього</th>
                    <th>${fmt(totals.accrued)}</th>
                    <th>${fmt(totals.pdf)}</th>
                    <th>${fmt(totals.vs)}</th>
                    <th>${fmt(totals.toPay)}</th>
                    <th>${fmt(totals.paid)}</th>
                    <th>${fmt(totals.saldo)}</th>
                    <th>${fmt(totals.esv)}</th>
                </tr>
            </tfoot>
        </table>
    `;

    return html;
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
console.log("OPEN FILE:", idx, file);

});


function buildActPdfUrl( year, month, fileBase) {


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
