// Список доступных действий (для каждого дома)
const actions = [
  { name: "Лицевые счета", actionCode: "accounts" },
  { name: "Список", actionCode: "list" },
  { name: "Платежи", actionCode: "payments" },
  { name: "Банк", actionCode: "bank" },
  { name: "Отчеты", actionCode: "reports" },
  { name: "Информация по дому", actionCode: "info" },
  { name: "Схема дома", actionCode: "schema" }
];

async function loadHomesAndBuildMenu() {
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    console.error('Не удалось получить пользователя:', userError);
    return;
  }

  // Загрузим дома пользователя
  let { data: homes, error } = await client
    .from('homes')
    .select('data');

  if (error) {
    console.error('Ошибка загрузки домов:', error);
    return;
  }
  homes = homes.map(row => JSON.parse(row.data)); 
  if (!homes || homes.length === 0) {
    alert('Нет доступных домов для пользователя');
    return;
  }



  // Построение меню (пример простой)
  const menu = document.getElementById('menu');
  menu.innerHTML = '';

  homes.sort((a, b) => a.name.localeCompare(b.name));
  homes.forEach(home => {
    const homeItem = document.createElement('li');
    homeItem.classList.add('menu-item');
    homeItem.textContent = home.name;
    menu.appendChild(homeItem);
  });

  // Скрыть форму логина и показать меню
  document.getElementById('auth-section').style.display = 'none';
  document.querySelector('.sidebar').style.display = 'block';
  document.querySelector('.content').style.display = 'block';
}

// Загрузка домов пользователя из Supabase
async function loadHomesForUser(userId) {
  const { data, error } = await client
    .from('homes')
    .select('*');  // предполагается, что колонка 'uuids' типа uuid[]

  if (error) {
    console.error('Ошибка загрузки домов:', error);
    return [];
  }
  return data;
}



function toggleSubMenu(homeItem, homeCode) {
  const previousActionCode = getParam("actionCode");

  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
    const actionList = item.querySelector("ul");
    if (actionList) actionList.style.display = "none";
  });

  homeItem.classList.add("active");
  const actionList = homeItem.querySelector("ul");
  if (actionList) actionList.style.display = "block";

  let actionItem = Array.from(actionList.querySelectorAll("li")).find(item => {
    const actionLink = item.querySelector("span");
    return actions.some(action =>
      action.actionCode === previousActionCode && action.name === actionLink.textContent
    );
  });

  if (!actionItem) actionItem = actionList.querySelector("li"); // первый пункт меню

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

function handleMenuClick(homeCode, actionCode, actionLink) {
  if (window.innerWidth > 768) checkMenu();
  else toggleMenu();

  document.querySelectorAll(".menu-item ul span").forEach(item => item.classList.remove("active-action"));
  actionLink.classList.add("active-action");

  if (actionCode === "accounts") {
    loadScriptFromHtml(homeCode + ".js", () => {
      fillMissingDates(nach);
      initLS();
    });
  } else if (actionCode === "list") {
    loadScriptFromHtml(homeCode + ".js", () => {
      fillMissingDates(nach);
      initTable();
    });
  } else if (actionCode === "payments") {
    loadScriptFromHtml(homeCode + ".js", () => {
      initPayTable();
    });
  } else if (actionCode === "bank") {
    loadScriptFromHtml(homeCode + ".js", () => {
      initBankTable();
    });
  } else if (actionCode === "reports") {
    loadScriptFromHtml(homeCode + ".js", () => {
      reportsInit();
    });
  } else if (actionCode === "info") {
    displayHomeInfo(homeCode);
  } else if (actionCode === "schema") {
    loadScriptFromHtml(homeCode + ".js", () => {
      initSchema();
    });
  }

  if (homeCode && actionCode) {
    setParam("homeCode", homeCode);
    setParam("actionCode", actionCode);
  }

  console.log(`Дом: ${homeCode}, Действие: ${actionCode}`);
}

function toggleMenu() {
  const logo = document.querySelector(".logo");
  const sidebar = document.getElementById("sidebar");

  logo.classList.add("spin");
  setTimeout(() => logo.classList.remove("spin"), 1000);

  sidebar.classList.toggle("open");
  checkMenu();
}

function checkMenu() {
  const sidebar = document.getElementById("sidebar");
  const content = document.querySelector(".content");

  if (window.innerWidth > 768) {
    if (sidebar.classList.contains("open")) content.classList.add("open");
    else content.classList.remove("open");
  } else {
    if (sidebar.classList.contains("open")) content.classList.remove("open");
    else content.classList.remove("open");
  }
}

function filterHomes(filter) {
  const regexPattern = filter
    .replace(/\s+/g, ".*")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  const regex = new RegExp(regexPattern, "i");

  document.querySelectorAll(".menu-item").forEach(item => {
    const homeCode = item.getAttribute("data-code");
    const home = window.homes.find(h => h.code === homeCode);

    if (home) {
      const matches = Object.values(home).some(val =>
        typeof val === "string" && regex.test(val)
      );
      item.style.display = matches ? "" : "none";
    }
  });
}

function toggleSidebarBasedOnScreenSize() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768 && sidebar.classList.contains("open")) toggleMenu();
}
window.addEventListener("resize", toggleSidebarBasedOnScreenSize);

function checkFullscreenMode() {
  const fullscreenApi =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
  const scaleFactor = window.devicePixelRatio || 1;
  const fullscreenWidth = Math.round(screen.width / scaleFactor);
  const fullscreenHeight = Math.round(screen.height / scaleFactor);
  const isF11Fullscreen =
    Math.abs(window.innerWidth - fullscreenWidth) < 1 &&
    Math.abs(window.innerHeight - fullscreenHeight) < 1;

  console.log(
    `window.innerWidth: ${window.innerWidth}\n` +
    `window.innerHeight: ${window.innerHeight}\n` +
    `fullscreenWidth: ${fullscreenWidth}\n` +
    `fullscreenHeight: ${fullscreenHeight}`
  );

  if (fullscreenApi || isF11Fullscreen) {
    document.body.classList.add("fullscreen");
    console.log("Полноэкранный режим активирован");
  } else {
    document.body.classList.remove("fullscreen");
    console.log("Полноэкранный режим выключен");
  }
}

document.addEventListener("fullscreenchange", checkFullscreenMode);
document.addEventListener("webkitfullscreenchange", checkFullscreenMode);
document.addEventListener("mozfullscreenchange", checkFullscreenMode);
document.addEventListener("MSFullscreenChange", checkFullscreenMode);
window.addEventListener("resize", checkFullscreenMode);

document.addEventListener("DOMContentLoaded", () => {
  toggleMenu();

  const searchInput = document.getElementById("searchHomes");
  if (localStorage.getItem("searchHomes")) {
    searchInput.value = localStorage.getItem("searchHomes");
    filterHomes(searchInput.value);
  }
  searchInput.addEventListener("input", function () {
    const filter = this.value.trim();
    localStorage.setItem("searchHomes", filter);
    filterHomes(filter);
  });
});
