// Список доступных действий (например, для каждого дома)
let rolse={};
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


function activateMenuFromParams() {
  const homeCode = getParam("homeCode");
  const actionCode = getParam("actionCode");

  if (!homes || homes.length === 0) return;
  if (!homeCode || !actionCode) return;

  // Находим span действия в меню (который нужен handleMenuClick)
  const actionSpan = document.querySelector(
    `[data-code="${homeCode}"] ul span[data-action="${actionCode}"]`
  );

  // Вызываем так, как будто это клик, но с отметкой что восстанавливаем историю
  handleMenuClick(homeCode, actionCode, actionSpan, { fromHistory: true, initial: true });
}



// Переключение подменю и установка активного дома
function toggleSubMenu(homeItem, homeCode) {
  var previousActionCode = getParam("actionCode");
  document.querySelectorAll(".menu-item").forEach(function (item) {
    item.classList.remove("active");
    var actionList = item.querySelector("ul");
    if (actionList) {
      actionList.style.display = "none";
    }
  });
  homeItem.classList.add("active");
  var actionList = homeItem.querySelector("ul");
  if (actionList) {
    actionList.style.display = "block";
  }
  var actionItem = Array.from(actionList.querySelectorAll("li")).find(function (
    item
  ) {
    var actionLink = item.querySelector("span");
    return actions.some(function (action) {
      return (
        action.actionCode === previousActionCode &&
        action.name === actionLink.textContent
      );
    });
  });
  if (!actionItem) {
    actionItem = actionList.querySelector("li"); // Берем первый пункт меню
  }
  if (actionItem) {
    var actionLink = actionItem.querySelector("span");
    actionLink.classList.add("active-action");
    handleMenuClick(
      homeCode,
      actions.find(function (a) {
        return a.name === actionLink.textContent;
      }).actionCode,
      actionLink
    );
  }
}

// Обработчик клика на пункт подменю
// Универсальный парсер строки/объекта jsonb
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

// Парсит одну строку из таблицы homes
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

async function handleMenuClick(homeCode, actionCode, actionLink, { fromHistory = false, initial = false } = {}) {

  // --- мобильное меню ---
  if (window.innerWidth <= 768) toggleMenu();


  //
  // --- ПОДСВЕТКА / РАСКРЫТИЕ МЕНЮ ---
  //
  document.querySelectorAll(".menu-item > span").forEach(el => el.classList.remove("active-home"));
  document.querySelectorAll(".menu-item ul span").forEach(el => el.classList.remove("active-action"));

  // закрываем все дома
  document.querySelectorAll(".menu-item").forEach(li => {
    li.classList.remove("open");
    const ul = li.querySelector("ul");
    if (ul) ul.style.display = "none";
  });

  let homeEl, actionEl;

  if (fromHistory || !actionLink) {
    // ищем элементы по data-атрибутам
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

  // раскрываем дом
  const homeLi = document.querySelector(`[data-code="${homeCode}"]`);
  if (homeLi) {
    homeLi.classList.add("open");
    const ul = homeLi.querySelector("ul");
    if (ul) ul.style.display = "block";
  }


  //
  // --- ЗАГРУЗКА ДАННЫХ ДОМА ---
  //
  window.homeData = window.homeData || {};
  let home = window.homeData[homeCode];

  if (!home) {
    try {
      const { data, error } = await client
        .from("homes")
        .select("us, b, org, adr, dt, what, kto, nach, oplat, ls, plat, files, nachnote, allnach")
        .eq("code", homeCode)
        .single();

      if (error || !data) { console.error(error); return; }

      home = parseHomeRow(data);
      window.homeData[homeCode] = home;

    } catch (err) {
      console.error("Ошибка загрузки дома:", err);
      return;
    }
  }

  // --- GLOBALS ---
  ls = home.ls;
  nach = home.nach;
  nachnote=home.nachnote;
  allnach=home.allnach;
  files = home.files;
  adr = home.adr;
  dt = home.dt;
  org = home.org;
  b = home.b;
  what = home.what;
  kto = home.kto;
  oplat = home.oplat;
  plat = home.plat;
  us = home.us;


const role = roles?.[homeCode] || 'Правление';
files = filterFilesByRole(files, role);



//
// --- HISTORY + TITLE ---
//
const homeObj = homes.find(h => h.code === homeCode);
const actionObj = actions.find(a => a.actionCode === actionCode);
const title = `${homeObj?.name || ""} — ${actionObj?.name || ""}`;
document.title = title;

const params = new URLSearchParams(window.location.search);
params.set("homeCode", homeCode);
params.set("actionCode", actionCode);
setParam("homeCode", homeCode);
setParam("actionCode", actionCode);

const newUrl = `${window.location.pathname}?${params.toString()}`;
//const newUrl = `${window.location.pathname}`;

// состояние, которое сейчас в history.state
const prev = history.state || {};
const same = prev.homeCode === homeCode && prev.actionCode === actionCode;

if (initial) {
  // первый запуск страницы — только replace
  history.replaceState({ homeCode, actionCode }, title, newUrl);
}
else if (fromHistory) {
  // двигаемся по истории — всегда replace (не плодим записи)
  history.replaceState({ homeCode, actionCode }, title, newUrl);
}
else {
  // обычный клик
  if (same) {
    // повторный клик на тот же пункт — НЕ push, только replace
    history.replaceState({ homeCode, actionCode }, title, newUrl);
  } else {
    history.pushState({ homeCode, actionCode }, title, newUrl);
  }
}

  //
  // --- ДЕЙСТВИЕ ---
  //
  switch (actionCode) {
    case "accounts": fillMissingDates(nach); initLS(); break;
    case "list":     fillMissingDates(nach); initTable(); break;
    case "payments": initPayTable(); break;
    case "bank":     initBankTable(); break;
    case "reports":  reportsInit(homeCode); break;
    case "info":     displayHomeInfo(homeCode); break;
    case "schema":   initSchema(); break;
    case "debitorka":   initDashboard(); break;
    default: console.warn("Unknown action:", actionCode);
  }

console.log(`Дом: ${homeCode}, действие: ${actionCode} (${fromHistory ? "history" : "click"})`);

}


// Функция для переключения бокового меню
function toggleMenu() {
  var logo = document.querySelector(".logo");

  // Вращение логотипа
  logo.classList.add("spin");
  setTimeout(function () {
    return logo.classList.remove("spin");
  }, 1000);

  // Переключаем класс "open" для боковой панели
  sidebar.classList.toggle("open");
  checkMenu();
}
function checkMenu() {
  var sidebar = document.getElementById("sidebar");
  var content = document.querySelector(".content");

  // Логика для компьютеров
  if (window.innerWidth > 768) {
    if (sidebar.classList.contains("open")) {
      content.classList.add("open"); // Панель открыта, сдвигаем контент
    } else {
      content.classList.remove("open"); // Панель закрыта, контент занимает все место
    }
  } else {
    // Для мобильных устройств
    if (sidebar.classList.contains("open")) {
      //      content.style.marginLeft = '0'; // На мобильных устройствах контент занимает весь экран
      content.classList.remove("open");
    } else {
      //      content.style.marginLeft = '0'; // На мобильных устройствах контент также не сдвигается
      content.classList.remove("open");
    }
  }
}
document.addEventListener("DOMContentLoaded", async function () {
  // Загружаем дома и строим меню
  await loadHomesAndBuildMenu();

  // Открываем мобильное меню на старте (если нужно)
  toggleMenu();

  // Пытаемся восстановить состояние из URL
  const homeCode = getParam("homeCode");
  const actionCode = getParam("actionCode");

  if (homeCode && actionCode) {
    // Активируем меню через историю, чтобы всё подсветилось правильно
    //activateMenuFromParams();
  } else {
    console.log("Нет параметров — меню пока не выбрано");
  }
});
;
function toggleSidebarBasedOnScreenSize() {
  var sidebar = document.querySelector(".sidebar");
  //    if ((window.innerWidth > 768 && !sidebar.classList.contains('open')) || (window.innerWidth <= 768 && sidebar.classList.contains('open')))
  if (window.innerWidth <= 768 && sidebar.classList.contains("open"))
    toggleMenu();
}
window.addEventListener("resize", toggleSidebarBasedOnScreenSize);
function checkFullscreenMode() {
  var fullscreenApi =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
  var scaleFactor = window.devicePixelRatio || 1;
  var fullscreenWidth = Math.round(screen.width / scaleFactor);
  var fullscreenHeight = Math.round(screen.height / scaleFactor);
  var isF11Fullscreen =
    Math.abs(window.innerWidth - fullscreenWidth) < 1 &&
    Math.abs(window.innerHeight - fullscreenHeight) < 1;
  console.log(
    "window.innerWidth: " +
      window.innerWidth +
      "\nwindow.innerHeight: " +
      window.innerHeight +
      "\nfullscreenWidth: " +
      fullscreenWidth +
      "\nfullscreenHeight: " +
      fullscreenHeight
  );
  if (fullscreenApi || isF11Fullscreen) {
    document.body.classList.add("fullscreen");
    console.log("Полноэкранный режим активирован");
  } else {
    document.body.classList.remove("fullscreen");
    console.log("Полноэкранный режим выключен");
  }
}

// Обработчики событий
document.addEventListener("fullscreenchange", checkFullscreenMode);
document.addEventListener("webkitfullscreenchange", checkFullscreenMode);
document.addEventListener("mozfullscreenchange", checkFullscreenMode);
document.addEventListener("MSFullscreenChange", checkFullscreenMode);
window.addEventListener("resize", checkFullscreenMode);

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

}
// Инициализация
checkFullscreenMode();

window.addEventListener("popstate", (event) => {
  const state = event.state;
  if (state && state.homeCode && state.actionCode) {
    handleMenuClick(state.homeCode, state.actionCode, null, { fromHistory: true });
  } else {
    const homeCode = getParam("homeCode");
    const actionCode = getParam("actionCode");
    if (homeCode && actionCode) {
      handleMenuClick(homeCode, actionCode, null, { fromHistory: true });
    }
  }
});



function filterFilesByRole(filesObj, role) {
  if (!filesObj || !Array.isArray(filesObj.files)) return filesObj;

  const fullAccessRoles = [
    "Администратор",
    "Бухгалтер",
    "Председатель"
  ];

  if (fullAccessRoles.includes(role)) return filesObj;

  const excludeMasks = [
    "*/ОР за боргом*",
    "*/ОР передоплата*",
    "*/Льгот*",
    "*/Пільг**",
    "*/ЗП_Табель*",
    "*/ЗП_Наказ_*",
    "*/ЗП_Звіт_*",
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

  return {
    ...filesObj,
    files: filesObj.files.filter(path =>
      !excludeRegexes.some(rx => rx.test(path))
    )
  };
}

function wildcardToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // экранируем спецсимволы RegExp
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(escaped, "i");
}
