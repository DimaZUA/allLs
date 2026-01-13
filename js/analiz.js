function generateAnaliz(start, end) {

  // === 1. Список месяцев ===
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const result = [];

  // === 2. Функция подсчёта месяцев долга ===
  function calculateDebtMonths(chargesHistory, debtEnd) {
    let debt = debtEnd;
    let months = 0;

    for (let i = chargesHistory.length - 1; i >= 0; i--) {
      const charge = chargesHistory[i];
      if (charge <= 0) continue;

      if (debt >= charge) {
        debt -= charge;
        months += 1;
      } else {
        months += debt / charge;
        debt = 0;
        break;
      }
    }

    if (debt > 0) {
      const firstNonZero = chargesHistory.find(c => c > 0);
      if (firstNonZero) months += debt / firstNonZero;
    }

    return months;
  }

  // === 3. Формирование строк данных ===
  months.forEach(monthDate => {
    let row = {
      month: `${String(monthDate.getMonth() + 1).padStart(2,'0')}.${monthDate.getFullYear()}`,

      totalCharged: 0,
      totalPaid: 0,
      overpayCharged: 0,
      overpayPaid: 0,
      overpayDebtEnd: 0,
      debtorCharged: 0,
      debtorPaid: 0,
      debtorCount: 0,
      totalCount: 0,
      totaldebitStart: 0,

      debtors: new Set()   // <<< НОВОЕ: список должников в этом месяце
    };

    Object.keys(nach).forEach(accountId => {

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;

      let chargesBefore = 0, paymentsBefore = 0;
      const chargesHistory = [];

      // собираем историю начислений
      for (const y in nach[accountId]) {
        for (const m in nach[accountId][y]) {

          const charge = Object.values(nach[accountId][y][m]).reduce((s,v)=>s+v,0);
          chargesHistory.push(charge);

          const d = new Date(y, m-1, 1);
          if (d < monthDate) {
            chargesBefore += charge;
            paymentsBefore += (oplat[accountId]?.[y]?.[m] || []).reduce((s,p)=>s+p.sum,0);
          }
        }
      }

      const debitStart = chargesBefore - paymentsBefore;

      const chargesThisMonth =
        Object.values(nach[accountId]?.[year]?.[month] || {}).reduce((s,v)=>s+v,0);

      const paymentsThisMonth =
        (oplat[accountId]?.[year]?.[month] || []).reduce((s,p)=>s+p.sum,0);

      const debitEnd = debitStart + chargesThisMonth - paymentsThisMonth;

      row.totaldebitStart += debitStart;
      row.totalCharged += chargesThisMonth;
      row.totalPaid += paymentsThisMonth;
      row.totalCount++;

      if (debitEnd <= 0) {
        // переплатники
        row.overpayCharged += chargesThisMonth;
        row.overpayPaid += paymentsThisMonth;
        row.overpayDebtEnd += debitEnd;
      } else {
        // должники
        const monthsOfDebt = calculateDebtMonths(chargesHistory, debitEnd);

        if (monthsOfDebt > 3) {
          row.debtorCharged += debitStart;
          row.debtorPaid += paymentsThisMonth;
          row.debtorCount++;

          row.debtors.add(accountId);   // <<< ЗАПИСЫВАЕМ конкретного должника
        }
      }

    });

    // проценты
    row.percentPaid = row.totalCharged ? (row.totalPaid / row.totalCharged) * 100 : 0;
    row.overpayPercent = row.totalCharged ? (-row.overpayDebtEnd / row.totalCharged) * 100 : 0;
    row.debtorPercent = row.totalCharged ? (row.debtorPaid / row.totalCharged) * 100 : 0;
    row.debtorPercentCount = row.totalCount ? (row.debtorCount / row.totalCount) * 100 : 0;

    result.push(row);
  });

  return renderAnalizTable(result);
}


function renderAnalizTable(data) {

  // === 1. Конфигурация колонок ===
const COLS = {
  month:              { title: "Місяць",          type: "text",    isValue: false, visible: true },

  totalCharged:       { title: "Нараховано",      type: "number",  isValue: true,  visible: true },
  totalPaid:          { title: "Сплачено",        type: "number",  isValue: true,  visible: true },
  percentPaid:        { title: "% оплати",        type: "percent", isValue: true,  visible: true },

  overpayPaid:        { title: "Сплачено",        type: "number",  isValue: true,  visible: true },
  overpayDebtEnd:     { title: "Переплата",       type: "number",  isValue: true,  visible: false },
  overpayPercent:     { title: "% переплати",     type: "percent", isValue: true,  visible: false },

  debtorPaid:         { title: "Сплачено",        type: "number",  isValue: true,  visible: true },
  debtorPercent:      { title: "% оплати",        type: "percent", isValue: true,  visible: true },
  debtorCount:        { title: "К-сть",           type: "int",     isValue: true,  visible: true },
  debtorPercentCount: { title: "% кв",            type: "percent", isValue: true,  visible: false }
};

  // === 2. Группы колонок ===
  const COL_GROUPS = [
    {
      title: "Всього по будинку",
      class: "th-total",
      cols: ["totalCharged","totalPaid","percentPaid"]
    },
    {
      title: "Переплатники",
      class: "th-overpay",
      cols: ["overpayPaid","overpayDebtEnd","overpayPercent"]
    },
    {
      title: "Боржники",
      class: "th-debtor",
      cols: ["debtorPaid","debtorPercent","debtorCount","debtorPercentCount"]
    }
  ];

  // === 3. Форматирование ===
  const fmt = (type, val) => {
    if (type === "number") return Math.round(val);
    if (type === "percent") return val.toFixed(1);
    if (type === "int") return Math.round(val);
    return val;
  };

  // === 4. Помощник: список всех видимых колонок в правильном порядке ===
  const orderedCols = [
    "month",
    "totalCharged","totalPaid","percentPaid",
    "overpayPaid","overpayDebtEnd","overpayPercent",
    "debtorPaid","debtorPercent","debtorCount","debtorPercentCount"
  ].filter(c => COLS[c].visible);

  // === 5. Создание таблицы ===
  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  table.classList.add("analiz-table");

  const thead = document.createElement("thead");

  // === 6. Первая строка шапки ===
  const tr1 = document.createElement("tr");
  const thMonth = document.createElement("th");
  thMonth.rowSpan = 2;
  thMonth.textContent = "Місяць";
  tr1.appendChild(thMonth);

  COL_GROUPS.forEach(gr => {
    const visibleCols = gr.cols.filter(c => COLS[c].visible);
    if (visibleCols.length === 0) return;

    const th = document.createElement("th");
    th.className = gr.class;
    th.colSpan = visibleCols.length;
    th.textContent = gr.title;
    tr1.appendChild(th);
  });

  // === 7. Вторая строка шапки ===
  const tr2 = document.createElement("tr");

  COL_GROUPS.forEach(gr => {
    gr.cols.forEach(col => {
      if (!COLS[col].visible) return;
      const th = document.createElement("th");
      th.className = gr.class;
      th.textContent = COLS[col].title;
      tr2.appendChild(th);
    });
  });

  thead.appendChild(tr1);
  thead.appendChild(tr2);
  table.appendChild(thead);

  // === 8. Тело таблицы ===
  const tbody = document.createElement("tbody");
  const rows = [];

  data.forEach(r => {
    const tr = document.createElement("tr");

    orderedCols.forEach(col => {
      const td = document.createElement("td");
      const cfg = COLS[col];

      td.className = 
        (col.startsWith("total") ? "td-total" :
        col.startsWith("overpay") ? "td-overpay" :
        col.startsWith("debtor") ? "td-debtor" : "");

      td.textContent = fmt(cfg.type, r[col]);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
    rows.push(tr);
  });

  // === 9. Итоги ===
  const topSummary = document.createElement("tr");
  topSummary.classList.add("summary-row", "top-summary");

  const spacer = document.createElement("tr");
  spacer.classList.add("spacer");
  spacer.style.height = "10px";

  const bottomSummary = document.createElement("tr");
  bottomSummary.classList.add("summary-row", "bottom-summary");

  tbody.appendChild(bottomSummary);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // === 10. Пересчет итогов ===
function updateSummaries(splitIndex) {

    const topData = data.slice(0, splitIndex);
    const bottomData = data.slice(splitIndex);

    const sum = (arr, f) => arr.reduce((a, r) => a + r[f], 0);
    const avg = (arr, f) => arr.length ? sum(arr, f) / arr.length : 0;

    // === Итоговые значения для верхней и нижней части ===
function summary(arr) {
    const totalCount = sum(arr, "totalCount");
    const debtorCount = sum(arr, "debtorCount");

    const debtorIDs = new Set();

    arr.forEach(r => {
        if (r.debtors && r.debtors.size > 0) {
            r.debtors.forEach(id => debtorIDs.add(id));
        }
    });

    return {
      rowCount: arr.length,
      totalCharged: sum(arr,"totalCharged"),
      totalPaid: sum(arr,"totalPaid"),
      percentPaid: totalCount ? (sum(arr,"totalPaid") / sum(arr,"totalCharged")) * 100 : 0,

      overpayPaid: sum(arr,"overpayPaid"),
      overpayDebtEnd: sum(arr,"overpayDebtEnd"),
      overpayPercent: avg(arr,"overpayPercent"),

      debtorPaid: sum(arr,"debtorPaid"),
      debtorPercent: sum(arr,"totalCharged") ? (sum(arr,"debtorPaid") / sum(arr,"totalCharged")) * 100 : 0,
      debtorCount: debtorCount,
      debtorPercentCount: totalCount ? (debtorCount / totalCount) * 100 : 0,

      debtors: debtorIDs   // здесь храним реальные квартиры-должники
    };
}


    const topS = summary(topData);
    const bottomS = summary(bottomData);

    // === Заполнение итоговой строки ===
    function fill(tr, S) {
      tr.innerHTML = "";

      const td0 = document.createElement("td");
      td0.textContent = `В середньому за ${S.rowCount} міс.:`;
      tr.appendChild(td0);

      orderedCols.slice(1).forEach(col => {
        const td = document.createElement("td");
        const cfg = COLS[col];

        let val = S[col];
        if (cfg.type === "number" || cfg.type === "int") {
          val = S.rowCount ? val / S.rowCount : 0;
        }

        td.className =
          (col.startsWith("total") ? "summary-total" :
          col.startsWith("overpay") ? "summary-overpay" :
          col.startsWith("debtor") ? "summary-debtor" : "");

        td.textContent = fmt(cfg.type, val);
        tr.appendChild(td);
      });
    }

    // === Переставляем строки итогов под splitIndex ===
    const refNode = rows[splitIndex - 1] || null;
    if (topSummary.parentNode) topSummary.remove();
    if (spacer.parentNode) spacer.remove();

    if (refNode) {
      refNode.after(topSummary);
      topSummary.after(spacer);
    }

    fill(topSummary, topS);
    fill(bottomSummary, bottomS);

    // === 11. ГИСТОГРАММА "Было / Стало" ===
    const old = table.querySelector(".compare-row");
    if (old) old.remove();

    const compareCols = orderedCols.filter(col =>
      col !== "month" && COLS[col].isValue === true
    );

    let rowCmp = null;

    if (splitIndex < data.length && compareCols.length > 0) {

      rowCmp = document.createElement("tr");
      rowCmp.classList.add("compare-row");
      bottomSummary.after(rowCmp);

      const tdLabel = document.createElement("td");
      tdLabel.innerHTML =
        `<div><span style="color:gray;">Було</span><br><span style="color:green;">Стало</span></div>`;
      rowCmp.appendChild(tdLabel);

      compareCols.forEach(col => {
        const cfg = COLS[col];
        const td = document.createElement("td");
        td.style.height = "60px";
        td.style.verticalAlign = "bottom";

        const idx = orderedCols.indexOf(col);

        const parseVal = cell => {
          if (!cell) return 0;
          return parseFloat(cell.textContent.replace("%","").trim()) || 0;
        };

        const topV = parseVal(topSummary.cells[idx]);
        const botV = parseVal(bottomSummary.cells[idx]);

        const maxV = Math.max(Math.abs(topV), Math.abs(botV), 1);

        const h1 = Math.abs(topV) / maxV * 60;
        const h2 = Math.abs(botV) / maxV * 60;

        let color;
        const positiveBetter = [
          "totalCharged", "totalPaid", "percentPaid",
          "overpayPaid", "overpayPercent",
          "debtorPaid", "debtorPercent"
        ].includes(col);

        const negativeBetter = [
          "overpayDebtEnd",
          "debtorCount", "debtorPercentCount"
        ].includes(col);

        if (topV === botV) {
            color = "#808080";
        } else if (positiveBetter) {
            color = botV > topV ? "#006400" : "#8B0000";
        } else {
            color = botV < topV ? "#006400" : "#8B0000";
        }

td.innerHTML = `
  <div style="
      display:flex;
      gap:4px;
      align-items:flex-end;
      justify-content:center;
      height:60px;
      width:100%;
  ">
    <div style="width:30px; height:${h1}px; background:gray; border-radius:4px;"></div>
    <div style="width:30px; height:${h2}px; background:${color}; border-radius:4px;"></div>
  </div>
`;

        rowCmp.appendChild(td);
      });
    }

    // === 12. Если итог опущен в самый низ — скрываем нижний итог ===
    if (splitIndex === rows.length) {
        bottomSummary.style.display = "none";
        if (spacer.parentNode) spacer.remove();
        const cmp = table.querySelector(".compare-row");
        if (cmp) cmp.remove();
        if (wrapper._debtInfo) wrapper._debtInfo.innerHTML = "";
        return;
    } else {
        bottomSummary.style.display = "";
    }

    // === 13. ТЕКСТОВАЯ ИНФОРМАЦИЯ О ДОЛЖНИКАХ ПОД ТАБЛИЦЕЙ ===

    // создаём инфо-блок, если он ещё не создан
    if (!wrapper._debtInfo) {
        const div = document.createElement("div");
        div.style.marginTop = "8px";
        div.style.fontSize = "13px";
        div.style.fontWeight = "500";
        div.style.color = "#333";
        wrapper.appendChild(div);
        wrapper._debtInfo = div;
    }

    // сравнение множеств должников
    const topDebtors = topS.debtors;
    const bottomDebtors = bottomS.debtors;

const wasDebtors = data[splitIndex - 1]?.debtors || new Set();
const nowDebtors = data[data.length - 1]?.debtors || new Set();

const still = [...wasDebtors].filter(x => nowDebtors.has(x));
const paidOff = [...wasDebtors].filter(x => !nowDebtors.has(x));
const added = [...nowDebtors].filter(x => !wasDebtors.has(x));


//
// === 13. Надпись + 3 постера со списками квартир ===
//

// чистим контейнер
wrapper._debtInfo.innerHTML = "";

function addSimplePoster(title, list, color) {

    const poster = document.createElement("div");
    poster.className = "poster";
    poster.style.display = "inline-block";
    poster.style.margin = "6px 12px 6px 0";
    poster.style.padding = "6px 10px";
    poster.style.border = "1px solid #aaa";
    poster.style.borderRadius = "6px";
    poster.style.background = "#fafafa";
    poster.style.fontWeight = "bold";
    poster.style.color = color;
    poster.textContent = `${title}: ${list.length}`;

    // === descr ===
    const descr = document.createElement("div");
    descr.className = "descr";   // твой CSS

    let html = "";
    if (list.length === 0) {
        html = "";
    } else {
        list.forEach(acc => {
            html += 'кв.'+ls[acc].kv+' '+ls[acc].fio  + "<br>";
        });
    }
    descr.innerHTML = html;

    // descr должен быть в body, т.к. position:fixed
    if (html>'') poster.appendChild(descr);


    wrapper._debtInfo.appendChild(poster);
}

// три строки
addSimplePoster("Нові боржники", added, "#8B0000");
addSimplePoster("Погасили борг", paidOff, "#006400");
addSimplePoster("Залишились боржникми", still, "#444");

// === 12b. Расчёт изменений в оплате и погашении долгов ===

// === Δ оплаты ===
const avgChargedBottom = bottomS.rowCount
    ? bottomS.totalCharged / bottomS.rowCount
    : 0;

const deltaPayPercent = bottomS.percentPaid - topS.percentPaid;
const deltaPayValue = avgChargedBottom * (deltaPayPercent / 100);

// === Δ погашения долгов ===
const deltaDebtPercent = bottomS.debtorPercent - topS.debtorPercent;
const deltaDebtValue   = avgChargedBottom * (deltaDebtPercent / 100);

// === Формируем текст ===

const infoPay ='<span style="font-size: 12px;">Відносні показники (виключено вплив зміни тарифу або нарахування цільових внесків):</span><br>'+
    (deltaPayValue >= 0 ? "Зростання" : "Зменшення") +
    ` платежів в будинку (в місяць): ` +
    `<span class="${deltaPayValue >= 0 ? 'green' : 'red'}">` +
        fmt("number", Math.abs(deltaPayValue)) +
    ` грн</span>`;

const infoDebt =
    (deltaDebtValue >= 0 ? "Зростання" : "Зменшення") +
    ` погашення боргів (в місяць): ` +
    `<span class="${deltaDebtValue >= 0 ? 'green' : 'red'}">` +
        fmt("number", Math.abs(deltaDebtValue)) +
    ` грн</span>`;



// выводим два итоговых текста
const textBlock = document.createElement("div");
textBlock.style.marginBottom = "8px";
textBlock.style.fontSize = "18px";
textBlock.innerHTML =
    infoPay + "<br>" +
    infoDebt;

wrapper._debtInfo.appendChild(textBlock);

initPosters();


}





  // === 12. Определить splitIndex по умолчанию ===
  let splitIndex = data.length;
  if (data.length > 1) {
    const dec = data
      .map((r,i)=>({i,isDec:r.month.startsWith("12.")}))
      .filter(x=>x.isDec)
      .map(x=>x.i+1);
    splitIndex = dec.length ? dec[dec.length-1] : Math.round(data.length/2);
  }

  updateSummaries(splitIndex);

  // === 13. Перетаскивание итоговой строки ===
  let isDragging = false;
  let startY = 0;
  let startIndex = 0;

  topSummary.style.cursor = "ns-resize";

  topSummary.addEventListener("mousedown", e => {
    isDragging = true;
    startY = e.clientY;
    startIndex = splitIndex;
    topSummary.style.background = "#eef";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dy = e.clientY - startY;
    const rowHeight = rows[0].offsetHeight || 25;
    const delta = Math.round(dy / rowHeight);
    const newIndex = Math.min(Math.max(1, startIndex + delta), rows.length);
    if (newIndex !== splitIndex) {
      splitIndex = newIndex;
      updateSummaries(splitIndex);
    }
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    topSummary.style.background = "";
    document.body.style.userSelect = "";
  });

  return wrapper;
}

