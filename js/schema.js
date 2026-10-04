// ===================== 1. ВСПОМОГАТЕЛЬНЫЕ РАСЧЁТЫ =====================
function getTotalForCurrentMonth(nachData, lsId) {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  const y = d.getFullYear(), m = d.getMonth() + 1;
  return nachData[lsId]?.[y]?.[m]
    ? Object.values(nachData[lsId][y][m]).reduce((s, v) => s + v, 0)
    : 0;
}

function getTotalForCurrentMonthOplat(oplatData, lsId) {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  const y = d.getFullYear(), m = d.getMonth() + 1;
  return oplatData[lsId]?.[y]?.[m]
    ? oplatData[lsId][y][m].reduce((s, p) => s + p.sum, 0)
    : 0;
}

function getTotalForAllTime(nachData, lsId) {
  let total = 0;
  if (nachData[lsId]) {
    Object.values(nachData[lsId]).forEach(months =>
      Object.values(months).forEach(days =>
        total += Object.values(days).reduce((s, v) => s + v, 0)
      )
    );
  }
  return total;
}

function getTotalForAllTimeOplat(oplatData, lsId) {
  let total = 0;
  if (oplatData[lsId]) {
    Object.values(oplatData[lsId]).forEach(months =>
      Object.values(months).forEach(payments =>
        total += payments.reduce((s, p) => s + p.sum, 0)
      )
    );
  }
  return total;
}

// ===================== ШКАЛА ЦВЕТОВ ПО ДОЛГУ =====================
// Полосы задаются количеством месяцев задолженности (calculateDebtMonthsFromCache
// из table.js: >0 — долг, <0 — переплата, 0 — долга нет).
const DOLG_BAND_COLORS = {
  green:  "#006400",  // переплата
  black:  "#000000",  // до 3 месяцев
  orange: "#ea580c",  // 3–6 месяцев
  yellow: "#b45309",  // 6–12 месяцев
  red:    "#8B0000",  // больше 12 месяцев
};
const DOLG_BAND_ORANGE = 3;
const DOLG_BAND_YELLOW = 6;
const DOLG_BAND_RED = 12;
const DOLG_BAND_CLASSES = Object.keys(DOLG_BAND_COLORS);

// Опорная дата та же, что и в getTotalForCurrentMonth: текущим считается месяц,
// от которого прошло больше 5 дней.
function getDebtAnchorDate() {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  return d;
}

// Количество месяцев долга по лицевому счету. Если table.js не подключен —
// остаемся на грубом признаке «долг/переплата».
function calcDolgMonths(item) {
  const dolg = +item.dolg || 0;
  if (typeof calculateDebtMonthsFromCache !== "function") {
    return dolg > 0 ? 1 : dolg < 0 ? -1 : 0;
  }
  return +calculateDebtMonthsFromCache(item.id, dolg, getDebtAnchorDate()) || 0;
}

// Полоса шкалы по числу месяцев
function getDolgBandClass(months) {
  const m = +months || 0;
  if (m < 0) return "green";                        // переплата
  if (m > DOLG_BAND_RED) return "red";              // больше 12 месяцев
  if (m > DOLG_BAND_YELLOW) return "yellow";        // 6–12 месяцев
  if (m > DOLG_BAND_ORANGE) return "orange";        // 3–6 месяцев
  return "black";                                   // до 3 месяцев
}

// Полоса шкалы по среднему числу месяцев долга (этаж / стояк / подъезд / дом)
function getAvgDolgBandClass(items) {
  const list = (items || []).filter(i => i && i.dolgMonths !== undefined);
  if (!list.length) return "black";
  const avg = list.reduce((s, i) => s + (+i.dolgMonths || 0), 0) / list.length;
  return getDolgBandClass(avg);
}

// Сброс + установка класса полосы (для фонов, красятся через CSS)
function setDolgBandClass(el, bandClass) {
  if (!el) return;
  el.classList.remove(...DOLG_BAND_CLASSES);
  el.classList.add(bandClass);
}

// Легенда шкалы — одна строка внизу схемы.
// Подписи берутся из тех же констант, что и раскраска, чтобы не расходились.
function createDolgLegend() {
  const parts = [
    ["green",  "переплата"],
    ["black",  "до 3 мес."],
    ["orange", `${DOLG_BAND_ORANGE}–${DOLG_BAND_YELLOW} мес.`],
    ["yellow", `${DOLG_BAND_YELLOW}–${DOLG_BAND_RED} мес.`],
    ["red",    `> ${DOLG_BAND_RED} мес.`],
  ];

  const div = document.createElement("div");
  div.classList.add("dolg-legend");

  parts.forEach(([band, label], idx) => {
    if (idx) div.appendChild(document.createTextNode(" · "));
    const swatch = document.createElement("span");
    swatch.classList.add("dolg-legend-swatch");
    swatch.style.backgroundColor = LEGEND_COLORS[band];   // цвет берётся из палитры полос
    div.appendChild(swatch);
    div.appendChild(document.createTextNode(` ${label}`));
  });

  return div;
}

// ===================== ЗАЛИВКА ПЛИТКИ =====================
// На вкладках «Борг» и «Платіж» все плитки одного размера, а величина
// показывается полосой в нижней части, под суммой. На «Площа» и «Нараховано»
// сохраняется прежнее изменение ширины.
const FILL_DISPLAYS = ["dolg", "opl"];
const FILL_TRACK = "#e6e6e6";           // незакрытая часть полосы

// Палитра заливки намеренно полупрозрачная: сумма в плитке важнее шкалы,
// поэтому заливка не должна перекрикивать число. Чем тяжелее полоса, тем
// плотнее заливка: переплаты и мелкие долги — еле заметные, тяжёлые — явные.
const DOLG_BAR_COLORS = {
  black:  "rgba(156, 163, 175, 0.50)",  // до 3 мес.  — полупрозрачный серый
  orange: "rgba(253, 186, 116, 0.75)",  // 3–6 мес.
  yellow: "rgba(220, 198, 26, 0.50)",   // 6–12 мес.
  red:    "rgba(252, 165, 165, 1)",     // больше 12 мес. — плотная
};
const FILL_NEUTRAL = "rgba(147, 197, 253, 0.75)";   // платёж

// Толщина насыщенной линии по краю заливки. Из-за полупрозрачности
// сама граница заливки с дорожкой читается слабо, поэтому точное значение
// показывает эта линия, а не размытая заливка.
const FILL_EDGE_PCT = 2;

// Цвета легенды: заливка полупрозрачна, зелёный остаётся насыщенным —
// у переплатчиков полосы нет, только цвет текста.
const LEGEND_COLORS = {
  green:  DOLG_BAND_COLORS.green,
  black:  DOLG_BAR_COLORS.black,
  orange: DOLG_BAR_COLORS.orange,
  yellow: DOLG_BAR_COLORS.yellow,
  red:    DOLG_BAR_COLORS.red,
};

// Заливка не рисуется у переплатчиков и у тех, кто должен меньше 1,5 месяцев:
// для них полоса была бы визуальным шумом, а не показателем.
const DOLG_FILL_MIN_MONTHS = 1.5;

// Потолок шкалы — 95-й перцентиль, чтобы единичный выброс не задавал шкалу.
// Всё выше обрезается в 100%. Линейная шкала не годится: один долг в десятки
// тысяч делает мелкие полоски неразличимыми от пустых, поэтому корень.
const DOLG_FILL_PCTL = 0.95;

// Шкала заполнения по сумме долга
function buildDolgFillScale(lsList) {
  const debts = lsList.map(i => +i.dolg || 0).filter(v => v > 0).sort((a, b) => a - b);
  if (!debts.length) return () => 0;

  const pctl = debts[Math.min(debts.length - 1, Math.floor(debts.length * DOLG_FILL_PCTL))];
  const top = pctl > 0 ? pctl : debts[debts.length - 1];
  const root = Math.sqrt(top);
  if (!(root > 0)) return () => 0;

  return v => {
    const x = +v || 0;
    if (x <= 0) return 0;                 // нет долга или переплата
    return Math.min((Math.sqrt(x) / root) * 100, 100);
  };
}

// Шкала платежа: линейная от среднего платежа по дому
function buildOplScale(lsList, display, avgValues) {
  const avg = avgValues[display];
  if (!(avg > 0)) return () => 0;
  return v => Math.max(0, Math.min((v / avg) * 100, 100));
}

function clampPct(v) {
  return Math.round(Math.max(0, Math.min(100, +v || 0)) * 100) / 100;
}

// Двухцветная полоса с резкой границей на позиции head
function fillGradient(color, head) {
  const p = clampPct(head);
  return `linear-gradient(90deg, ${color} 0%, ${color} ${p}%, ${FILL_TRACK} ${p}%, ${FILL_TRACK} 100%)`;
}

// Полоса должника: длина — по сумме долга, цвет — зона по месяцам.
// Заливка полупрозрачная и потому блёклая; точное значение показывает
// насыщенная линия по её краю. Так в полосе видно и «сколько должен»,
// и «как давно не платит», но заливка не спорит с числом.
// Возвращает null, когда полоса не рисуется вовсе.
function dolgFillGradient(dolg, months, scale) {
  if ((+months || 0) < DOLG_FILL_MIN_MONTHS) return null;
  const band = getDolgBandClass(months);
  const wash = DOLG_BAR_COLORS[band] || DOLG_BAR_COLORS.black;
  const edge = DOLG_BAND_COLORS[band];                 // насыщенный цвет той же полосы
  const p = clampPct(scale ? scale(dolg) : 0);
  const p2 = Math.min(100, p + FILL_EDGE_PCT);
  return `linear-gradient(90deg, ${wash} 0%, ${wash} ${p}%, ` +
         `${edge} ${p}%, ${edge} ${p2}%, ${FILL_TRACK} ${p2}%, ${FILL_TRACK} 100%)`;
}

// Добавить/обновить слой заливки внутри плитки.
// background = null -> полосы нет вовсе (ни заливки, ни дорожки).
function setTileFill(div, background) {
  let fill = div.querySelector(".tile-fill");
  if (!fill) {
    fill = document.createElement("div");
    fill.classList.add("tile-fill");
    div.insertBefore(fill, div.firstChild);
  }
  fill.style.backgroundImage = background || "none";
}

// ===================== 2. ПОДГОТОВКА ДАННЫХ =====================
function parseKvNum(kv) {
  const m = String(kv).match(/^(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

// Кв. 0 — технический счёт, куда падают платежи с неопознанной квартирой.
// Такой счёт не является помещением: он не попадает в схему, в площадь,
// в число лицевых и в количество помещений. Учитывается только в общей
// сумме долга и в оплатах за текущий месяц.
function isTechAccount(kv) {
  return String(kv).replace(/[^0-9]/g, "") === "0";
}

function prepareLsData(ls, nach, oplat) {
  const all = Object.entries(ls)
    .map(([key, item]) => ({ ...item, id: key }))
    .filter(item => item.et && item.pod);

  all.forEach(item => {
    const id = item.id;
    const currentNach = getTotalForCurrentMonth(nach, id);
    const currentOpl = getTotalForCurrentMonthOplat(oplat, id);
    const totalNach = getTotalForAllTime(nach, id);
    const totalOpl = getTotalForAllTimeOplat(oplat, id);
    item.nach = currentNach;
    item.opl = currentOpl;
    item.dolg = totalNach - totalOpl;
    item.dolgMonths = calcDolgMonths(item);
    item.isTech = isTechAccount(item.kv);
  });

  // Технические счета держим отдельно — вернутся только в двух итогах по дому
  const list = all.filter(item => !item.isTech);
  const techItems = all.filter(item => item.isTech);

  // --- Разделение первого этажа на цокольный + первый, если нужно ---
  const pods = [...new Set(list.map(i => i.pod))]; // все подъезды

  pods.forEach(podId => {
    // квартиры выше первого этажа
    const upperFloors = list.filter(i => i.pod === podId && i.et > 1);
    const upperFloorCount = new Set(upperFloors.map(i => i.et)).size;
    const avgKvUpper = upperFloorCount ? upperFloors.length / upperFloorCount : 0;

    // квартиры на первом этаже
    const firstFloor = list.filter(i => i.pod === podId && i.et === 1);
    if (firstFloor.length >= avgKvUpper * 1.5) {
      // если квартир примерно в 2 раза больше, создаём "цокольный этаж"
      firstFloor.sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));
      const half = Math.ceil(firstFloor.length / 2);
      firstFloor.forEach((item, idx) => {
        item.et = idx < half ? 0.5 : 1; // цокольный этаж = 0.5, остальное 1
      });
    }
  });

  // --- Вычисляем стояки ---
  const groupedByPodEt = {};
  list.forEach(item => {
    const key = `${item.pod}-${item.et}`;
    if (!groupedByPodEt[key]) groupedByPodEt[key] = [];
    groupedByPodEt[key].push(item);
  });

  Object.values(groupedByPodEt).forEach(items => {
    items.sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));
    const firstKv = items[0];
    if (!firstKv) return;
    const baseNum = parseKvNum(firstKv.kv);
    items.forEach(it => {
      const num = parseKvNum(it.kv);
      it.st = num ? (num - baseNum + 1) : 1;
    });
  });

  return { list, techItems };
}



function calculateAverages(lsList, numericDisplays) {
  const allAreas = lsList
    .map(it => parseFloat(it.pl) || parseFloat(it.area) || 0)
    .filter(a => a > 0);
  const avgArea = allAreas.reduce((a, b) => a + b, 0) / (allAreas.length || 1);

  const avgValues = {};
  numericDisplays.forEach(key => {
    const vals = lsList.map(i => parseFloat(i[key]) || 0);
    avgValues[key] =
      vals.reduce((a, b) => a + b, 0) /
      (vals.filter(v => v > 0).length || 1);
  });

  return { avgArea, avgValues };
}

function countUniqueKv(items) {
  const seen = new Set();
  items.forEach(i => {
    const num = parseKvNum(i.kv);
    if (num) seen.add(num);
  });
  return seen.size;
}

function countLs(items) {
  return items.length;
}





function createFloorsForPod(lsList, pod, podDiv, opts) {
  // берем только этажи этого подъезда
  const floors = [...new Set(lsList.filter(it => it.pod === pod && it.et > 0).map(it => it.et))]
                   .sort((a, b) => b - a);

  floors.forEach(et => {
    const floorDiv = document.createElement("div");
    floorDiv.classList.add("floor-row");

    const floorNum = document.createElement("div");
    floorNum.classList.add("floor-number");
    floorNum.textContent = et === 0.5 ? "Цок." : et; // показываем 0,5 как "0,5"

    const cont = document.createElement("div");
    cont.classList.add("floor-item-container");

    createItemsForFloor(lsList, pod, et, cont, { ...opts, isFloorTotal: false });
    createItemsForFloor(lsList, pod, et, cont, { ...opts, isFloorTotal: true });

    floorDiv.appendChild(floorNum);
    floorDiv.appendChild(cont);
    podDiv.appendChild(floorDiv);
  });

  // --- Далее итог по стоякам и подъезду без изменений ---
  const standsRow = document.createElement("div");
  standsRow.classList.add("floor-row");

  const standsLabel = document.createElement("div");
  standsLabel.classList.add("floor-number");
  standsLabel.textContent = "Разом";

  const standsContainer = document.createElement("div");
  standsContainer.classList.add("floor-item-container");

  const podItems = lsList.filter(i => i.pod === pod);
  const maxSt = Math.max(...podItems.map(i => i.st || 0));
  const display = opts.display;

  for (let st = 1; st <= maxSt; st++) {
    const stItems = podItems.filter(i => i.st === st);
    let total;
    if (["ls", "kv"].includes(display)) {
      total = display === "ls" ? countLs(stItems) : countUniqueKv(stItems);
    } else {
      total = stItems.reduce((s, i) => s + (+i[display] || 0), 0);
    }

    const div = document.createElement("div");
    div.classList.add("floor-total");
    div.dataset.id = `stand-${pod}-${st}`;
    div.style.width = "60px";
    div.style.opacity = 0;
    div.style.transition = "opacity 0.5s ease";

    const span = document.createElement("span");
    span.classList.add("value-span");
    span.textContent = ["ls","kv"].includes(display) ? total : total.toFixed(2);
    if (display === "dolg") {
      span.style.color = DOLG_BAND_COLORS[getAvgDolgBandClass(stItems)];
    }
    div.appendChild(span);
    standsContainer.appendChild(div);

    requestAnimationFrame(() => { div.style.opacity = 1; });
  }

  let totalPod;
  if (["ls", "kv"].includes(display)) {
    totalPod = display === "ls" ? countLs(podItems) : countUniqueKv(podItems);
  } else {
    totalPod = podItems.reduce((s, i) => s + (+i[display] || 0), 0);
  }
  const divTotal = document.createElement("div");
  divTotal.classList.add("floor-total");
  divTotal.dataset.id = `totalpod-${pod}`;
  divTotal.style.width = "60px";
  divTotal.style.opacity = 0;
  divTotal.style.transition = "opacity 0.5s ease";

  const spanTotal = document.createElement("span");
  spanTotal.classList.add("value-span");
  spanTotal.textContent = ["ls","kv"].includes(display) ? totalPod : totalPod.toFixed(2);
  if (display === "dolg") {
    spanTotal.style.color = DOLG_BAND_COLORS[getAvgDolgBandClass(podItems)];
  }
  divTotal.appendChild(spanTotal);
  standsContainer.appendChild(divTotal);

  standsRow.appendChild(standsLabel);
  standsRow.appendChild(standsContainer);
  podDiv.appendChild(standsRow);
}




// ===================== 5. РЕНДЕР =====================
function renderSchema(state) {
  const { displayKeys, displayKeysName, display } = state;
  const root = document.createElement("div");
  root.id = "root";

  const buttons = document.createElement("div");
  buttons.classList.add("mb-2", "flex", "gap-2");

  displayKeys.forEach(key => {
    const btn = document.createElement("button");
    btn.classList.add("p-2", "border");
    if (display === key) btn.classList.add("bg-blue-500", "text-white");
    btn.textContent = displayKeysName[key];
    btn.addEventListener("click", () => updateDisplay(key, state));
    buttons.appendChild(btn);
  });

  root.appendChild(buttons);

  const grid = document.createElement("div");
  grid.classList.add("entrances-grid");
  state.entrances.forEach(pod => {
    const podDiv = document.createElement("div");
    podDiv.classList.add("pod-block"); // рамка
    const title = document.createElement("div");
    title.classList.add("font-bold");
    title.textContent = `Під'їзд ${pod}`;
    podDiv.appendChild(title);
    createFloorsForPod(state.lsList, pod, podDiv, state);
    grid.appendChild(podDiv);
  });
  root.appendChild(grid);

  // Итоги по дому
const totalHouseDiv = document.createElement("div");
totalHouseDiv.classList.add("total-house");

const keys = ["pl","ls","pers","kv","dolg","opl","nach"];
// Технический счёт (кв. 0) возвращается в общую сумму долга и в оплаты
// месяца, но не в площадь, лицевые счета, проживающих, помещения и начисления.
const TECH_TOTAL_KEYS = ["dolg", "opl"];
keys.forEach(k => {
  const div = document.createElement("div");
  const spanLabel = document.createElement("span");
  spanLabel.textContent = state.itogKeysName[k] + ": ";
  div.appendChild(spanLabel);

  const src = TECH_TOTAL_KEYS.includes(k)
    ? state.lsList.concat(state.techItems)
    : state.lsList;

  let val;
  if(k === "ls") {
    val = state.lsList.length;
  } else if(k === "kv") {
    const seen = new Set();
    state.lsList.forEach(i => {
      const normalized = String(i.kv).replace(/[^0-9]/g,'');
      if(normalized) seen.add(normalized);
    });
    val = seen.size;
  } else {
    val = src.reduce((s, i) => s + (+i[k] || 0), 0);
  }

  const spanVal = document.createElement("span");
  
  // Вывод значения
  const formattedVal = ["ls","kv","pers"].includes(k) 
    ? val 
    : val.toLocaleString("ru-RU", {minimumFractionDigits:2, maximumFractionDigits:2});

  // Добавляем счетчик только для оплаты
  if (k === "opl") {
    const payCount = src.filter(i => (+i.opl || 0) > 0).length;
    spanVal.textContent = `${formattedVal} (Платежів: ${payCount})`;
  } else {
    spanVal.textContent = formattedVal;
  }

  // окраска долгов
  if(k === "dolg") {
    spanVal.style.color = DOLG_BAND_COLORS[getAvgDolgBandClass(state.lsList)];
  }

  div.appendChild(spanVal);
  totalHouseDiv.appendChild(div);
});

root.appendChild(totalHouseDiv);

// Легенда шкалы нужна только на вкладке «Борг»
const dolgLegend = createDolgLegend();
dolgLegend.style.display = display === "dolg" ? "" : "none";
root.appendChild(dolgLegend);
state.legend = dolgLegend;


  const main = document.getElementById("maincontainer");
  main.innerHTML = "";
  main.appendChild(root);

  initPosters();
  addFloorItemHandlers();
}




// ===================== 3. СОЗДАНИЕ DOM =====================
function createItemsForFloor(lsList, pod, et, container, opts) {
  const { displayKeys, displayKeysName, display, numericDisplays, avgValues, avgArea, isFloorTotal } = opts;
  const items = lsList.filter(i => i.pod === pod && i.et === et);
  const baseWidth = 60;
  const minWidth = 30;
  const maxWidth = 120;
  const isTouch = isMobile();
  let lastTappedId = 0;

  if (!isFloorTotal) {
    // Данные для полосы общие для всего дома — считаем один раз на этаж
    const fillCtx = { scale: display === "dolg"
      ? buildDolgFillScale(lsList)
      : buildOplScale(lsList, display, avgValues) };

    items.sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("floor-item");
      div.classList.add("poster");
      div.dataset.kv = ls[item.id].kv;
      div.dataset.id = item.id;


      // --- Размер, номера квартир, значения, подсказки --- //
      // На «Борге» и «Платіжі» плитки одинаковые, величина — заливка.
      // На «Площа» и «Нараховано» размер плитки пропорционален значению.
      const usesFill = FILL_DISPLAYS.includes(display);
      if (usesFill) {
        div.style.width = baseWidth + "px";
      } else {
        const avg = avgValues[display] || avgArea;
        const value = parseFloat(item[display]) || 0;
        div.style.width = (numericDisplays.includes(display)
          ? Math.max(minWidth, Math.min((baseWidth * value) / avg, maxWidth))
          : baseWidth) + "px";
      }
      div.style.transition = "width 0.5s ease, opacity 0.5s ease";
      div.style.height = "40px";

      if (usesFill) {
        setTileFill(div, display === "dolg"
          ? dolgFillGradient(item.dolg, item.dolgMonths, fillCtx.scale)
          : ((+item.opl || 0) > 0 ? fillGradient(FILL_NEUTRAL, fillCtx.scale(+item.opl || 0)) : null));
      }

      const kvSpan = document.createElement("span");
      kvSpan.classList.add("kv-background");
      kvSpan.textContent = item.kv;
      setDolgBandClass(kvSpan, getDolgBandClass(item.dolgMonths));
      div.appendChild(kvSpan);

      const valSpan = document.createElement("span");
      valSpan.classList.add("value-span");
      let val = ["ls","kv","pers"].includes(display)
        ? item[display]
        : (+item[display] || 0).toFixed(2);
      if(numericDisplays.includes(display) && +val === 0) val = "-";
      valSpan.textContent = val;
      valSpan.style.color = display === "dolg"
        ? DOLG_BAND_COLORS[getDolgBandClass(item.dolgMonths)]
        : "#000000";
      div.appendChild(valSpan);

      const infoParts = [];
      for (const [key, name] of Object.entries(displayKeysName)) {
        let v = item[key] ?? "";
        if (typeof v === "number") v = v.toLocaleString("ru-RU");
        if (v === "" || item.et === 0) continue;
        infoParts.push(`${name}: ${v}`);
      }
      if (item.fio) infoParts.push(`Власник: ${item.fio}`);
      if (item.tel) infoParts.push(`Телефон: ${item.tel}`);
      if (item.email) infoParts.push(`Електронна пошта: ${item.email}`);
      if (item.note) infoParts.push(`Примітка: ${item.note.replace(/\n/g, "<br>")}`);
      //div.dataset.fio = infoParts.join("\n");
      const descr=document.createElement("span");
      descr.classList.add('descr');
      descr.innerHTML = infoParts.join("<br>");
      div.appendChild(descr);
      container.appendChild(div);
    });
  } else {
    // --- Итог по этажу ---
    const totalItem = { et, pod };
    displayKeys.forEach(key => {
      if(["ls","kv"].includes(key)) totalItem[key] = key === "ls" ? countLs(items) : countUniqueKv(items);
      else totalItem[key] = items.reduce((s,i) => s + (+i[key]||0), 0);
    });

    const div = document.createElement("div");
    div.classList.add("floor-total");
    div.dataset.id = `total-${pod}-${et}`;
    div.style.width = "60px";
    div.style.transition = "opacity 0.5s ease";
    div.style.opacity = 0;

    const span = document.createElement("span");
    span.classList.add("value-span");
    span.textContent = ["ls","kv"].includes(display) ? totalItem[display] : totalItem[display].toFixed(2);
    if(display === "dolg") {
      span.style.color = DOLG_BAND_COLORS[getAvgDolgBandClass(items)];
    }
    div.appendChild(span);
    container.appendChild(div);

    requestAnimationFrame(() => { div.style.opacity = 1; });
  }
}




// ===================== Вспомогательная функция для перехода =====================
function goToAccount(accountId) {
  const homeCode = getParam("homeCode");
  if (!homeCode) return console.warn("homeCode не найден");

  const actionLink = Array.from(
    document.querySelectorAll(`.menu-item[data-code="${homeCode}"] ul span`)
  ).find(span => span.textContent.trim() === "Особові рахунки");

  if (!actionLink) {
    console.warn('Не найден пункт меню "Особові рахунки" для', homeCode);
    return;
  }

  setParam("kv", ls[accountId].kv);
  let tooltip = document.querySelector(".fio-tooltip");
  if (tooltip) tooltip.style.display = "none";

  handleMenuClick(homeCode, "accounts", actionLink);
}


// ===================== 7. ОБНОВЛЕНИЕ =====================
function updateDisplay(newDisplay, state) {
  state.display = newDisplay;
  const { lsList, numericDisplays, avgValues, avgArea, displayKeysName } = state;
  const baseWidth = 60;
  const minWidth = 30;
  const maxWidth = 120;

  const fillCtx = { scale: newDisplay === "dolg"
    ? buildDolgFillScale(lsList)
    : buildOplScale(lsList, newDisplay, avgValues) };
  const usesFill = FILL_DISPLAYS.includes(newDisplay);

  document.querySelectorAll(".floor-item").forEach(div => {
    const obj = lsList.find(x => x.id === div.dataset.id);
    if(!obj) return;

    // --- Размер плитки и полоса ---
    if(usesFill) {
      div.style.width = baseWidth + "px";
      setTileFill(div, newDisplay === "dolg"
        ? dolgFillGradient(obj.dolg, obj.dolgMonths, fillCtx.scale)
        : ((+obj[newDisplay] || 0) > 0 ? fillGradient(FILL_NEUTRAL, fillCtx.scale(+obj[newDisplay] || 0)) : null));
    } else {
      // Уходим с вкладки с полосой — слой мог остаться от прошлой вкладки
      setTileFill(div, null);

      const avg = avgValues[newDisplay] || avgArea;
      const value = parseFloat(obj[newDisplay]) || 0;
      div.style.width = (numericDisplays.includes(newDisplay)
        ? Math.max(minWidth, Math.min((baseWidth * value)/avg, maxWidth))
        : baseWidth) + "px";
    }

    // --- Значение ---
    const span = div.querySelector(".value-span");
    let val = ["ls","kv","pers"].includes(newDisplay)
      ? obj[newDisplay]
      : (+obj[newDisplay]||0).toFixed(2);
    if(numericDisplays.includes(newDisplay) && +val === 0) val = "-";
    span.textContent = val;

    // --- Окраска долгов и номера квартиры ---
    const kvSpan = div.querySelector(".kv-background");
    if(newDisplay === "dolg") {
      const band = getDolgBandClass(obj.dolgMonths);
      span.style.color = DOLG_BAND_COLORS[band];
      setDolgBandClass(kvSpan, band);
    } else {
      span.style.color = "#000000";
      setDolgBandClass(kvSpan, "black");
    }
  });

  // --- Обновление итогов по этажам/стоякам/подъезду (остается как раньше) ---
  document.querySelectorAll(".floor-total").forEach(div => {
    const id = div.dataset.id;
    if(!id) return;

    let items = [];
    if(id.startsWith("total-")) {
      const [,pod,et] = id.match(/^total-(\d+)-([\d\.]+)/) || [];
      items = lsList.filter(i => i.pod==pod && i.et==et);
    } else if(id.startsWith("stand-")) {
      const [,pod,st] = id.match(/^stand-(\d+)-([\d\.]+)/) || [];
      items = lsList.filter(i => i.pod==pod && i.st==st);
    } else if(id.startsWith("totalpod-")) {
      const [,pod] = id.match(/^totalpod-(\d+)/) || [];
      items = lsList.filter(i => i.pod==pod);
    }

    let total;
    if(["ls","kv"].includes(newDisplay)) {
      total = newDisplay==="ls"? items.length : countUniqueKv(items);
    } else {
      total = items.reduce((s,i)=> s + (+i[newDisplay]||0), 0);
    }

    const span = div.querySelector(".value-span");
    span.textContent = ["ls","kv","pers"].includes(newDisplay) ? total : total.toFixed(2);

    if(newDisplay === "dolg") {
      span.style.color = DOLG_BAND_COLORS[getAvgDolgBandClass(items)];
    } else span.style.color = "#000000";

    div.style.opacity = 0;
    requestAnimationFrame(() => { div.style.opacity = 1; });
  });

  // --- Кнопки ---
  document.querySelectorAll("#root button").forEach(btn => {
    const key = Object.entries(displayKeysName).find(([k,v]) => v===btn.textContent)?.[0];
    const active = key===newDisplay;
    btn.classList.toggle("bg-blue-500", active);
    btn.classList.toggle("text-white", active);
  });

  // --- Легенда только на вкладке «Борг» ---
  if (state.legend) state.legend.style.display = newDisplay === "dolg" ? "" : "none";
}



// ===================== 8. ИНИЦИАЛИЗАЦИЯ =====================
function initSchema() {
  const displayKeys = ["pl", "ls", "pers", "kv", "dolg", "opl", "nach"];
  const displayKeysName = {
    pl: "Площа",
    ls: "Особовий рахунок",
    pers: "Прописано осіб",
    kv: "Квартира",
    dolg: "Борг",
    opl: "Платіж",
    nach: "Нараховано",
  };
  const itogKeysName = {
    pl: "Площа всіх преміщень",
    ls: "Кількість особових рахунків",
    pers: "Прописано осіб",
    kv: "Кількість приміщень",
    dolg: "Загальний борг по особовим рахункам",
    opl: "Сплачено в поточному місяці",
    nach: "Нараховано за поточний місяць",
  };

  const numericDisplays = ["opl","nach","dolg","pl"];
  let display = "pl";

  const { list: lsList, techItems } = prepareLsData(ls,nach,oplat);
  const { avgArea, avgValues } = calculateAverages(lsList, numericDisplays);
  const entrances = [...new Set(lsList.map(it=>+it.pod))].sort((a,b)=>a-b);

  const state = { display, displayKeys, displayKeysName, numericDisplays, lsList, techItems, avgArea, avgValues, entrances, itogKeysName };
  renderSchema(state);
}

function addFloorItemHandlers() {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  document.querySelectorAll(".floor-item").forEach(floorItem => {
    const lsId = floorItem.dataset.id;

    // пропускаем итоги, стояки и служебные элементы
    if (!lsId || !/^\d+$/.test(lsId)) return;

    const go = () => goToAccount(lsId);

    // ================= DESKTOP =================
    if (!isTouch) {
      // клик — сразу переход
      floorItem.addEventListener("click", go);
      return;
    }

    // ================= MOBILE =================
    // добавляем ТОЛЬКО long-press
    let pressTimer = null;

    const onTouchStart = () => {
      pressTimer = setTimeout(() => {
        go();
      }, 900); // долгий тап
    };

    const cancel = () => {
      clearTimeout(pressTimer);
      pressTimer = null;
    };

    floorItem.addEventListener("touchstart", onTouchStart, { passive: true });
    floorItem.addEventListener("touchend", cancel, { passive: true });
    floorItem.addEventListener("touchmove", cancel, { passive: true });
    floorItem.addEventListener("touchcancel", cancel, { passive: true });
  });
}

