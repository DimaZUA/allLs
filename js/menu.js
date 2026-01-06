// ================================
// НАСТРОЙКИ РЕЖИМОВ ЭКРАНА
// ================================
const SCREEN = {
  MOBILE_MAX: 640,
  TABLET_MAX: 1199
};

function getScreenMode() {
  const w = window.innerWidth;
  if (w <= SCREEN.MOBILE_MAX) return 'mobile';
  if (w <= SCREEN.TABLET_MAX) return 'tablet';
  return 'desktop';
}

// ================================
// СТЕЙТ САЙДБАРА
// ================================
const sidebarState = {
  mode: getScreenMode()
};
function sidebarIsOpen() {
  return document.body.classList.contains("sidebar-open");
}

// ================================
// Список доступных действий
// ================================
let rolse = {};
const actions = [
  { name: "Особові рахунки", actionCode: "accounts" },
  { name: "Перелік", actionCode: "list" },
  { name: "Платежі", actionCode: "payments" },
  { name: "Банк", actionCode: "bank" },
  { name: "Документи", actionCode: "reports" },
  { name: "Інформація", actionCode: "info" },
  { name: "Схема будинку", actionCode: "schema" },
  { name: "Заборгованість", actionCode: "debitorka" }
];

var homes, ls, nach, files, adr, dt, org, b, what, kto, oplat, plat, us, nachnote, allnach;

// ================================
// АКТИВАЦИЯ ИЗ URL
// ================================
function activateMenuFromParams() {
  const homeCode = getParam("homeCode");
  const actionCode = getParam("actionCode");
  if (!homes || homes.length === 0) return;
  if (!homeCode || !actionCode) return;

  const actionSpan = document.querySelector(
    `[data-code="${homeCode}"] ul span[data-action="${actionCode}"]`
  );

  handleMenuClick(homeCode, actionCode, actionSpan, { fromHistory: true, initial: true });
}

// ================================
// ПОДМЕНЮ ДОМА
// ================================
function toggleSubMenu(homeItem, homeCode) {
  var previousActionCode = getParam("actionCode");

  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
    const ul = item.querySelector("ul");
    if (ul) ul.style.display = "none";
  });

  homeItem.classList.add("active");
  const actionList = homeItem.querySelector("ul");
  if (actionList) actionList.style.display = "block";

  let actionItem = Array.from(actionList.querySelectorAll("li")).find(item => {
    const span = item.querySelector("span");
    return actions.some(a =>
      a.actionCode === previousActionCode &&
      a.name === span.textContent
    );
  });

  if (!actionItem) actionItem = actionList.querySelector("li");

  if (actionItem) {
    const actionLink = actionItem.querySelector("span");
    actionLink.classList.add("active-action");
    handleMenuClick(
      homeCode,
      actions.find(a => a.name === actionLink.textContent).actionCode,
      actionLink
    );
  }
}

// ================================
// JSON HELPERS
// ================================
function tryParse(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn("Ошибка парсинга JSON:", e, value);
    return fallback;
  }
}

function parseHomeRow(row) {
  return {
    us: tryParse(row.us, {}),
    b: tryParse(row.b, {}),
    org: row.org ?? "",
    adr: row.adr ?? "",
    dt: row.dt ?? "",
    what: tryParse(row.what, {}),
    kto: tryParse(row.kto, {}),
    nach: tryParse(row.nach, {}),
    nachnote: tryParse(row.nachnote, {}),
    allnach: tryParse(row.allnach, {}),
    oplat: tryParse(row.oplat, {}),
    ls: tryParse(row.ls, {}),
    plat: tryParse(row.plat, {}),
    files: tryParse(row.files, {})
  };
}

// ================================
// КЛИК МЕНЮ
// ================================
async function handleMenuClick(homeCode, actionCode, actionLink, { fromHistory = false, initial = false } = {}) {

  // --- MOBILE / TABLET: закрываем меню ---
  if (sidebarState.mode !== 'desktop' && sidebarIsOpen() && actionCode !== 'reports') {
    closeSidebar();
  }

  // --- ПОДСВЕТКА ---
  document.querySelectorAll(".menu-item > span").forEach(el => el.classList.remove("active-home"));
  document.querySelectorAll(".menu-item ul span").forEach(el => el.classList.remove("active-action"));

  document.querySelectorAll(".menu-item").forEach(li => {
    li.classList.remove("open");
    const ul = li.querySelector("ul");
    if (ul) ul.style.display = "none";
  });

  let homeEl, actionEl;

  if (fromHistory || !actionLink) {
    homeEl = document.querySelector(`[data-code="${homeCode}"] > span`);
    actionEl = document.querySelector(
      `[data-code="${homeCode}"] ul span[data-action="${actionCode}"]`
    );
  } else {
    actionEl = actionLink;
    homeEl = document.querySelector(`[data-code="${homeCode}"] > span`);
  }

  if (homeEl) homeEl.classList.add("active-home");
  if (actionEl) actionEl.classList.add("active-action");

  const homeLi = document.querySelector(`[data-code="${homeCode}"]`);
  if (homeLi) {
    homeLi.classList.add("open");
    const ul = homeLi.querySelector("ul");
    if (ul) ul.style.display = "block";
  }

  // --- ДАННЫЕ ДОМА ---
  window.homeData = window.homeData || {};
  let home = window.homeData[homeCode];

  if (!home) {
    const { data, error } = await client
      .from("homes")
      .select("us, b, org, adr, dt, what, kto, nach, oplat, ls, plat, files, nachnote, allnach")
      .eq("code", homeCode)
      .single();

    if (error || !data) return;
    home = parseHomeRow(data);
    window.homeData[homeCode] = home;
  }

  ls = home.ls;
  nach = home.nach;
  nachnote = home.nachnote;
  allnach = home.allnach;
  files = filterFilesByRole(home.files, roles?.[homeCode] || 'Правление');
  adr = home.adr;
  dt = home.dt;
  org = home.org;
  b = home.b;
  what = home.what;
  kto = home.kto;
  oplat = home.oplat;
  plat = home.plat;
  us = home.us;

  // --- HISTORY ---
  const homeObj = homes.find(h => h.code === homeCode);
  const actionObj = actions.find(a => a.actionCode === actionCode);
  document.title = `${homeObj?.name || ""} — ${actionObj?.name || ""}`;

  const params = new URLSearchParams();
  setParam("homeCode", homeCode);
  setParam("actionCode", actionCode);
  const url = `${location.pathname}?${params}`;

  if (initial || fromHistory) {
    history.replaceState({ homeCode, actionCode }, document.title, url);
  } else {
    history.pushState({ homeCode, actionCode }, document.title, url);
  }

  // --- ДЕЙСТВИЕ ---
  switch (actionCode) {
    case "accounts": fillMissingDates(nach); initLS(); break;
    case "list": fillMissingDates(nach); initTable(); break;
    case "payments": initPayTable(); break;
    case "bank": initBankTable(); break;
    case "reports": reportsInit(homeCode); break;
    case "info": displayHomeInfo(homeCode); break;
    case "schema": initSchema(); break;
    case "debitorka": initDashboard(); break;
  }
  updateTopbarTitle(homeCode);

}

// ================================
// SIDEBAR CONTROL
// ================================
function openSidebar() {
  document.body.classList.add('sidebar-open');
  if (sidebarState.mode === 'mobile') lockBodyScroll();
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  unlockBodyScroll();
}

function toggleMenu() {
  sidebarIsOpen() ? closeSidebar() : openSidebar();
}

// ================================
// RESIZE HANDLER
// ================================
function handleResize() {
  const newMode = getScreenMode();
  if (newMode !== sidebarState.mode) {
    sidebarState.mode = newMode;
    closeSidebar();
  }
}
let resizeTimer = null;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    handleResize();
  }, 50); // достаточно и 30–50
});


// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadHomesAndBuildMenu();
  sidebarState.mode = getScreenMode();

  if (sidebarState.mode === 'desktop') {
    openSidebar();
  } else {
    closeSidebar();
  }

  // ======================================
  // TABLET: закрытие сайдбара по тапу вне
  // ======================================
  document.addEventListener('pointerdown', e => {
    if (sidebarState.mode !== 'tablet') return;
    if (!sidebarIsOpen()) return;

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // клик ВНУТРИ сайдбара — игнор
    if (sidebar.contains(e.target)) return;

    // клик по гамбургеру — тоже игнор
    if (e.target.closest('.hamburger')) return;
    if (e.target.closest('.topbar-back')) return;
    closeSidebar();
    blinkHamburger(); 
  });
});
function blinkHamburger() {
  const btn = document.querySelector('.topbar .hamburger');
  if (!btn) return;

  btn.classList.remove('blink'); // на случай повтора
  btn.offsetWidth;               // форсируем reflow
  btn.classList.add('blink');
}


// ================================
// POPSTATE
// ================================
window.addEventListener("popstate", e => {
  if (e.state) {
    handleMenuClick(e.state.homeCode, e.state.actionCode, null, { fromHistory: true });
  }
});

// ================================
// ФИЛЬТРАЦИЯ ФАЙЛОВ
// ================================
function filterFilesByRole(filesObj, role) {
  if (!filesObj || !Array.isArray(filesObj.files)) return filesObj;

  const fullAccessRoles = ["Администратор", "Бухгалтер", "Председатель"];

  const excludeMasks = [
    "*/ОР за боргом*",
    "*/ОР передоплата*",
    "*/Льгот*",
    "*/Пільг**",
    "*/ЗП_Табель*",
    "*/ЗП_Наказ_*",
    "*/ЗП_Звіт_*",
    "*/Наказ*",
    "*компенсац*",
    "*коменсац*",
    "*Авансов*",
    "*Зарплата*",
    "*ЗП_Штатний*",
    "*Заліки*",
    "*Б-Витрати коштів з рахунку з січня.pdf",
    "*Рух коштів з січня*",
    "*ОР по квартирам з січня*",
    "*Оплата співвласників з січня.pdf",
  ];

  const excludeRegexes = excludeMasks.map(wildcardToRegExp);

  // --- вычисляем "запрещённые" файлы ОДИН РАЗ ---
  const restricted = filesObj.files.filter(p =>
    excludeRegexes.some(rx => rx.test(p))
  );

  // --- если НЕ полный доступ — режем как раньше ---
  if (!fullAccessRoles.includes(role)) {
    return {
      ...filesObj,
      files: filesObj.files.filter(p =>
        !excludeRegexes.some(rx => rx.test(p))
      )
    };
  }

  // --- полный доступ: ничего не режем ---
  // --- но сохраняем список restricted отдельно ---
  return {
    ...filesObj,
    _restrictedFiles: restricted   // ← НОВОЕ ПОЛЕ
  };
}



function wildcardToRegExp(pattern) {
  return new RegExp(
    pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&")
           .replace(/\*/g, ".*")
           .replace(/\?/g, "."),
    "i"
  );
}
async function loadHomesAndBuildMenu() {
  // Получаем пользователя
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    console.error('Не удалось получить пользователя:', userError);
    return;
  }

  // Загружаем дома из таблицы
  const { data, error } = await client
    .from('homes')
    .select('data');

  if (error) {
    console.error('Ошибка загрузки домов:', error);
    return;
  }

  // Преобразуем данные и сохраняем в глобальную переменную
  homes = data.map(row => JSON.parse(row.data));
  roles=await loadHomeRoles();
  if (!homes || homes.length === 0) {
    alert('Нет доступных домов для пользователя');
    return;
  }
  const searchInput = document.getElementById('searchHomes');
  if (homes.length > 5) {
    searchInput.style.display = 'block'; // показываем
  } else {
    searchInput.style.display = 'none';  // скрываем
  }
  // Сортируем дома по имени
  homes.sort((a, b) => a.name.localeCompare(b.name));

// Генерируем меню
const menu = document.getElementById("menu");
menu.innerHTML = ''; // очистить меню перед добавлением

homes.forEach(home => {
  const homeItem = document.createElement("li");
  homeItem.setAttribute("data-code", home.code);
  homeItem.classList.add("menu-item");

  const homeLink = document.createElement("span");
  homeLink.textContent = home.name;
  homeLink.onclick = () => toggleSubMenu(homeItem, home.code);

  homeItem.appendChild(homeLink);

  const actionList = document.createElement("ul");
  
  actions.forEach(action => {
    const actionItem = document.createElement("li");
    const actionLink = document.createElement("span");

    actionLink.textContent = action.name;
    actionLink.setAttribute("data-action", action.actionCode); // ✅ важный момент

    actionLink.onclick = () => {
      handleMenuClick(home.code, action.actionCode, actionLink);
    };

    actionItem.appendChild(actionLink);
    actionList.appendChild(actionItem);
  });

  homeItem.appendChild(actionList);
  menu.appendChild(homeItem);
});


  // Активируем меню по параметрам URL (если есть)
  activateMenuFromParams();


// В конце функции loadHomesAndBuildMenu(), после цикла по домам:
const logoutItem = document.createElement("li");
logoutItem.classList.add("menu-item", "logout-item");

const logoutLink = document.createElement("span");
logoutLink.textContent = "Вийти";
logoutLink.style.color = "red";
logoutLink.style.cursor = "pointer";
logoutLink.onclick = async () => {
  await client.auth.signOut();
  window.location.reload(); // Перезагрузить страницу, чтобы сбросить состояние
};
logoutItem.appendChild(logoutLink);

const settingsItem = document.createElement("li");
settingsItem.classList.add("menu-item", "settings-item");

const settingsLink = document.createElement("span");
settingsLink.id = "settingsLink";
settingsLink.textContent = "Налаштування";
settingsLink.style.cursor = "pointer";
settingsLink.onclick = () => {
userSettings();
};
settingsItem.appendChild(settingsLink);

// Добавляем в меню
menu.appendChild(settingsItem);
menu.appendChild(logoutItem);
  if (homes.length > 5) {
  // Восстанавливаем значение из localStorage
  if (localStorage.getItem("searchHomes")) {
    searchInput.value = localStorage.getItem("searchHomes");
    filterHomes(searchInput.value);
  }
  searchInput.addEventListener("input", function () {
    var filter = this.value.trim();
    localStorage.setItem("searchHomes", filter); // Сохраняем в localStorage
    filterHomes(filter);
  });
}

// ================================
// AUTO-SELECT FIRST HOME (FIRST LOAD)
// ================================
const hasParams =
  getParam("homeCode") && getParam("actionCode");

if (!hasParams && homes.length > 0) {
  const firstHome = homes[0];
  const firstAction = actions[0];

  const actionEl = document.querySelector(
    `[data-code="${firstHome.code}"] ul span[data-action="${firstAction.actionCode}"]`
  );

  // на mobile / tablet — показать меню
  if (sidebarState.mode !== 'desktop') {
    document.body.classList.add("sidebar-open");
  }

  handleMenuClick(
    firstHome.code,
    firstAction.actionCode,
    actionEl,
    { initial: true }
  );
}


}
function filterHomes(filter) {
  var regexPattern = filter
    .replace(/\s+/g, ".*") // Пробелы заменяем на .*
    .replace(/\*/g, ".*") // '*' заменяем на .*
    .replace(/\?/g, "."); // '?' заменяем на .

  var regex = new RegExp(regexPattern, "i"); // Создаем регистронезависимый RegExp

  document.querySelectorAll(".menu-item").forEach(function (item) {
    var homeCode = item.getAttribute("data-code"); // Получаем код дома
    var home = homes.find(function (h) {
      return h.code === homeCode;
    }); // Находим объект дома

    if (home) {
      var matches = Object.values(home).some(function (value) {
        return typeof value === "string" && regex.test(value);
      });
      item.style.display = matches ? "" : "none";
    }
  });
}
function userSettings() {
  // Получаем элементы
  const settingsLink = document.getElementById('settingsLink'); // Ссылка "Настройки"
  const settingsModal = document.getElementById('settings-modal');
  const settingsForm = document.getElementById('settings-form');
  const settingsOldPassword = document.getElementById('old-password');
  const settingsNewPassword = document.getElementById('new-password');
  const settingsConfirmPassword = document.getElementById('confirm-password');
  const settingsCancel = document.getElementById('settings-cancel');
  const settingsStatus = document.getElementById('settings-status');

  // Показать модальное окно при клике
  settingsLink.onclick = () => {
    settingsForm.reset();
    settingsStatus.textContent = '';
    settingsModal.style.display = 'flex';
  };

  // Закрыть модальное окно при отмене
  settingsCancel.onclick = () => {
    settingsModal.style.display = 'none';
    settingsStatus.textContent = '';
  };

  // Обработка отправки формы
  settingsForm.onsubmit = async (e) => {
    e.preventDefault();
    settingsStatus.style.color = 'red';
    settingsStatus.textContent = '';

    const oldPassword = settingsOldPassword.value;
    const newPassword = settingsNewPassword.value;
    const confirmPassword = settingsConfirmPassword.value;

    if (!oldPassword) {
      settingsStatus.textContent = 'Введіть старий пароль';
      return;
    }
    if (!newPassword) {
      settingsStatus.textContent = 'Введіть новий пароль';
      return;
    }
    if (newPassword.length < 6) {
      settingsStatus.textContent = 'Новий пароль повинен містити не меньш 6 символів';
      return;
    }
    if (newPassword !== confirmPassword) {
      settingsStatus.textContent = 'Новий пароль та підтвердження не збігаються';
      return;
    }

    try {
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        settingsStatus.textContent = 'Не удалось получить текущего пользователя';
        return;
      }

      // Проверяем старый пароль — пробуем повторно войти
      const { error: signInError } = await client.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (signInError) {
        settingsStatus.textContent = 'Старый пароль неверный';
        return;
      }

      // Обновляем пароль
      const { error: updateError } = await client.auth.updateUser({ password: newPassword });
      if (updateError) {
        settingsStatus.textContent = 'Ошибка обновления пароля: ' + updateError.message;
        return;
      }

      settingsStatus.style.color = 'green';
      settingsStatus.textContent = 'Пароль успешно обновлен';

      setTimeout(() => {
        settingsModal.style.display = 'none';
        settingsStatus.textContent = '';
        settingsForm.reset();
      }, 2000);
    } catch (err) {
      settingsStatus.textContent = 'Ошибка: ' + err.message;
    }
  };
}
function updateTopbarTitle(homeCode) {
  const el = document.getElementById('topbar-title');
  if (!el) return;

  const home = homes?.find(h => h.code === homeCode);
  el.textContent = home ? home.name : '';
}

function toggleMenuFiles(homeCode) {

  if (sidebarState.mode === 'desktop') return;

  const inFiles = document.body.classList.contains("files-mode");

  // ============================
  // МЫ В ДОКУМЕНТАХ → В МЕНЮ
  // ============================
  if (inFiles) {
    document.body.classList.remove("files-mode");
    openSidebar();              // ✅ вместо classList
    return;
  }

  // ============================
  // МЫ В МЕНЮ → В ДОКУМЕНТЫ
  // ============================
  if (!homeCode) return;

  const homeEl = document.querySelector(`[data-code="${homeCode}"]`);
  if (!homeEl) return;

  const actionEl = homeEl.querySelector(`ul span[data-action="reports"]`);

  // перед переходом в документы — считаем, что сайдбар открыт


  handleMenuClick(
    homeCode,
    "reports",
    actionEl,
    { fromGesture: true }
  );
}


// ================================
// SWIPE: SIDEBAR ⇄ FILES  (mobile + tablet)
// ================================
(function initMenuFilesSwipe() {

  const SWIPE_THRESHOLD = 80; // px
  const MAX_VERTICAL = 40;    // px

  let startX = 0;
  let startY = 0;
  let tracking = false;

  function isSwipeAllowed() {
    return sidebarState.mode === 'mobile' || sidebarState.mode === 'tablet';
  }

  function sidebarIsOpen() {
    return document.body.classList.contains("sidebar-open");
  }

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  sidebar.addEventListener("touchstart", e => {
    if (!isSwipeAllowed()) return;
    if (!sidebarIsOpen()) return;
    if (e.touches.length !== 1) return;

    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  sidebar.addEventListener("touchmove", e => {
    if (!tracking) return;

    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // вертикальный скролл — отменяем жест
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      tracking = false;
    }
  }, { passive: true });

  sidebar.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;

    if (!isSwipeAllowed()) return;
    if (!sidebarIsOpen()) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // чистый горизонтальный свайп
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dy) <= MAX_VERTICAL) {
      toggleMenuFiles(getParam("homeCode"));
    }
  });

})();

let scrollTopBeforeLock = 0;

function lockBodyScroll() {
  scrollTopBeforeLock = window.scrollY;
  document.body.style.top = `-${scrollTopBeforeLock}px`;
  document.body.classList.add("sidebar-scroll-lock");
}

function unlockBodyScroll() {
  document.body.classList.remove("sidebar-scroll-lock");
  document.body.style.top = "";
  window.scrollTo(0, scrollTopBeforeLock);
}
