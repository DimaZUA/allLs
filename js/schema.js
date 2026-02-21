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

// ===================== 2. ПОДГОТОВКА ДАННЫХ =====================
function parseKvNum(kv) {
  const m = String(kv).match(/^(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function prepareLsData(ls, nach, oplat) {
  // Сначала создаём список квартир с базовыми данными
  const list = Object.entries(ls)
    .map(([key, item]) => ({ ...item, id: key }))
    .filter(item => item.et && item.pod);

  list.forEach(item => {
    const id = item.id;
    const currentNach = getTotalForCurrentMonth(nach, id);
    const currentOpl = getTotalForCurrentMonthOplat(oplat, id);
    const totalNach = getTotalForAllTime(nach, id);
    const totalOpl = getTotalForAllTimeOplat(oplat, id);
    item.nach = currentNach;
    item.opl = currentOpl;
    item.dolg = totalNach - totalOpl;
  });

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

  return list;
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
keys.forEach(k => {
  const div = document.createElement("div");
  const spanLabel = document.createElement("span");
  spanLabel.textContent = state.itogKeysName[k] + ": ";
  div.appendChild(spanLabel);

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
    val = state.lsList.reduce((s, i) => s + (+i[k] || 0), 0);
  }

  const spanVal = document.createElement("span");
  
  // Вывод значения
  const formattedVal = ["ls","kv","pers"].includes(k) 
    ? val 
    : val.toLocaleString("ru-RU", {minimumFractionDigits:2, maximumFractionDigits:2});

  // Добавляем счетчик только для оплаты
  if (k === "opl") {
    const payCount = state.lsList.filter(i => (+i.opl || 0) > 0).length;
    spanVal.textContent = `${formattedVal} (Платежів: ${payCount})`;
  } else {
    spanVal.textContent = formattedVal;
  }

  // окраска долгов
  if(k === "dolg") {
    spanVal.style.color = val < 0 ? "green" : val > state.avgValues["dolg"] ? "red" : "black";
  }

  div.appendChild(spanVal);
  totalHouseDiv.appendChild(div);
});

root.appendChild(totalHouseDiv);


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
    items.sort((a, b) => parseKvNum(a.kv) - parseKvNum(b.kv));

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("floor-item");
      div.classList.add("poster");
      div.dataset.kv = ls[item.id].kv;
      div.dataset.id = item.id;


      // --- Ширина, номера квартир, значения, подсказки --- //
      let width;
      if (display === "dolg") {
        const dolgs = items.map(i => i.dolg || 0);
        const minDolg = Math.min(...dolgs);
        const maxDolg = Math.max(...dolgs);
        const val = item.dolg || 0;
        const norm = (val - minDolg) / (maxDolg - minDolg || 1);
        width = minWidth + norm * (maxWidth - minWidth);
      } else {
        const avg = avgValues[display] || avgArea;
        const value = parseFloat(item[display]) || 0;
        width = numericDisplays.includes(display)
          ? Math.max(minWidth, Math.min((baseWidth * value) / avg, maxWidth))
          : baseWidth;
      }
      div.style.width = width + "px";
      div.style.transition = "width 0.5s ease, opacity 0.5s ease";
      div.style.height = "40px";

      const kvSpan = document.createElement("span");
      kvSpan.classList.add("kv-background");
      kvSpan.textContent = item.kv;
      kvSpan.classList.remove("green","red","black");
      if(item.dolg < 0) kvSpan.classList.add("green");
      else if(item.dolg > avgValues["dolg"]) kvSpan.classList.add("red");
      else kvSpan.classList.add("black");
      div.appendChild(kvSpan);

      const valSpan = document.createElement("span");
      valSpan.classList.add("value-span");
      let val = ["ls","kv","pers"].includes(display)
        ? item[display]
        : (+item[display] || 0).toFixed(2);
      if(numericDisplays.includes(display) && +val === 0) val = "-";
      valSpan.textContent = val;
      valSpan.style.color = display === "dolg"
        ? (item.dolg < 0 ? "green" : item.dolg > avgValues["dolg"] ? "red" : "black")
        : "black";
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
      const count = countUniqueKv(items) || 1;
      const avgDolg = totalItem.dolg / count;
      span.style.color = avgDolg < 0 ? "green" : avgDolg > avgValues["dolg"] ? "red" : "black";
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

  document.querySelectorAll(".floor-item").forEach(div => {
    const obj = lsList.find(x => x.id === div.dataset.id);
    if(!obj) return;

    // --- Ширина ---
    let width;
    if(newDisplay === "dolg") {
      const dolgs = lsList.map(i => i.dolg || 0);
      const minDolg = Math.min(...dolgs);
      const maxDolg = Math.max(...dolgs);
      const val = obj.dolg || 0;
      const norm = (val - minDolg) / (maxDolg - minDolg || 1);
      width = minWidth + norm * (maxWidth - minWidth);
    } else {
      const avg = avgValues[newDisplay] || avgArea;
      const value = parseFloat(obj[newDisplay]) || 0;
      width = numericDisplays.includes(newDisplay)
        ? Math.max(minWidth, Math.min((baseWidth * value)/avg, maxWidth))
        : baseWidth;
    }
    div.style.width = width + "px";

    // --- Значение ---
    const span = div.querySelector(".value-span");
    let val = ["ls","kv","pers"].includes(newDisplay)
      ? obj[newDisplay]
      : (+obj[newDisplay]||0).toFixed(2);
    if(numericDisplays.includes(newDisplay) && +val === 0) val = "-";
    span.textContent = val;

    // --- Окраска долгов ---
    if(newDisplay === "dolg") {
      if(obj.dolg < 0) span.style.color = "green";
      else if(obj.dolg > avgValues["dolg"]) span.style.color = "red";
      else span.style.color = "black";
    } else span.style.color = "black";

    // --- Цвет номера квартиры ---
    const kvSpan = div.querySelector(".kv-background");
    kvSpan.classList.remove("green","red","black");
    if(obj.dolg < 0) kvSpan.classList.add("green");
    else if(obj.dolg > avgValues["dolg"]) kvSpan.classList.add("red");
    else kvSpan.classList.add("black");
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
      let count = items.length;
      if(id.startsWith("total-") || id.startsWith("stand-")) count = countUniqueKv(items) || 1;
      const avgDolg = total / count;
      span.style.color = avgDolg < 0 ? "green" : avgDolg > avgValues["dolg"] ? "red" : "black";
    } else span.style.color = "black";

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

  const lsList = prepareLsData(ls,nach,oplat);
  const { avgArea, avgValues } = calculateAverages(lsList, numericDisplays);
  const entrances = [...new Set(lsList.map(it=>+it.pod))].sort((a,b)=>a-b);

  const state = { display, displayKeys, displayKeysName, numericDisplays, lsList, avgArea, avgValues, entrances, itogKeysName };
  renderSchema(state);
}

function addFloorItemHandlers() {
  const isTouch = isMobile();

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

