// Список доступных действий (например, для каждого дома)
var actions = [{
  name: 'Лицевые счета',
  actionCode: 'accounts'
}, {
  name: 'Список',
  actionCode: 'list'
}, {
  name: 'Платежи',
  actionCode: 'payments'
}, {
  name: 'Банк',
  actionCode: 'bank'
}, {
  name: 'Информация по дому',
  actionCode: 'info'
}];

// Генерация меню
homes.sort(function (a, b) {
  return a.name.localeCompare(b.name);
});
var menu = document.getElementById('menu');
homes.forEach(function (home) {
  var homeItem = document.createElement('li');
  homeItem.setAttribute('data-code', home.code);
  homeItem.classList.add('menu-item');
  var homeLink = document.createElement('span');
  homeLink.textContent = home.name;
  homeLink.onclick = function () {
    return toggleSubMenu(homeItem, home.code);
  };
  homeItem.appendChild(homeLink);
  var actionList = document.createElement('ul');
  actions.forEach(function (action) {
    var actionItem = document.createElement('li');
    var actionLink = document.createElement('span');
    actionLink.textContent = action.name;
    actionLink.onclick = function () {
      return handleMenuClick(home.code, action.actionCode, actionLink);
    };
    actionItem.appendChild(actionLink);
    actionList.appendChild(actionItem);
  });
  homeItem.appendChild(actionList);
  menu.appendChild(homeItem);
});

// Переключение подменю и установка активного дома
function toggleSubMenu(homeItem, homeCode) {
  // Убираем класс 'active' и скрываем все подменю
  document.querySelectorAll('.menu-item').forEach(function (item) {
    item.classList.remove('active'); // Убираем активный класс
    var actionList = item.querySelector('ul');
    if (actionList) {
      actionList.style.display = 'none'; // Скрываем все подменю
    }
  });

  // Добавляем класс 'active' и показываем подменю для выбранного элемента
  homeItem.classList.add('active');
  var actionList = homeItem.querySelector('ul');
  if (actionList) {
    actionList.style.display = actionList.style.display === 'block' ? 'none' : 'block'; // Переключаем отображение подменю
  }
}

// Обработчик клика на пункт подменю
function handleMenuClick(homeCode, actionCode, actionLink) {
  if (window.innerWidth > 768) checkMenu();else toggleMenu();
  document.querySelectorAll('.menu-item ul span').forEach(function (item) {
    return item.classList.remove('active-action');
  });
  actionLink.classList.add('active-action');
  if (actionCode === 'accounts') {
    loadScriptFromHtml(homeCode + '.js', function () {
    fillMissingDates(nach);
      initLS();
    });
  } else if (actionCode === 'list') {
    //document.getElementById('maincontainer');
    loadScriptFromHtml(homeCode + '.js', function () {
    fillMissingDates(nach);
      initTable();
    });
  } else if (actionCode === 'payments') {
    loadScriptFromHtml(homeCode + '.js', function () {
      initPayTable();
    });
  } else if (actionCode === 'bank') {
    loadScriptFromHtml(homeCode + '.js', function () {
      initBankTable();
    });
  } else if (actionCode === 'info') {
          displayHomeInfo(homeCode);
      
  }
  if (homeCode && actionCode) {
    setParam('homeCode', homeCode);
    setParam('actionCode', actionCode);
  }
  console.log("\u0414\u043E\u043C: ".concat(homeCode, ", \u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435: ").concat(actionCode));
}

// Функция для подключения скрипта

// Функция для переключения бокового меню
function toggleMenu() {
  var logo = document.querySelector('.logo');

  // Вращение логотипа
  logo.classList.add('spin');
  setTimeout(function () {
    return logo.classList.remove('spin');
  }, 1000);

  // Переключаем класс "open" для боковой панели
  sidebar.classList.toggle('open');
  checkMenu();
}
function checkMenu() {
  var sidebar = document.getElementById('sidebar');
  var content = document.querySelector('.content');

  // Логика для компьютеров
  if (window.innerWidth > 768) {
    if (sidebar.classList.contains('open')) {
      content.classList.add('open');  // Панель открыта, сдвигаем контент
    } else {
      content.classList.remove('open'); // Панель закрыта, контент занимает все место
    }
  } else {
    // Для мобильных устройств
    if (sidebar.classList.contains('open')) {
//      content.style.marginLeft = '0'; // На мобильных устройствах контент занимает весь экран
content.classList.remove('open');
    } else {
//      content.style.marginLeft = '0'; // На мобильных устройствах контент также не сдвигается
content.classList.remove('open');
    }
  }
}
document.addEventListener('DOMContentLoaded', function () {
  toggleMenu();

  // Если параметры найдены в URL, используем их, иначе — из localStorage
  var homeCode = getParam('homeCode');
  var actionCode = getParam('actionCode');
  if (homeCode && actionCode) {
    // Находим соответствующий дом в массиве homes по коду
    var home = homes.find(function (home) {
      return home.code === homeCode;
    });
    if (home) {
      // Находим элемент меню по имени дома
      var homeItem = Array.from(document.querySelectorAll('.menu-item')).find(function (item) {
        return item.querySelector('span').textContent === home.name;
      });
      if (homeItem) {
        // Активируем этот дом
        homeItem.classList.add('active');

        // Находим и показываем подменю этого дома
        var actionList = homeItem.querySelector('ul');
        if (actionList) {
          actionList.style.display = 'block'; // Показываем подменю
        }

        // Находим и активируем соответствующий пункт действия по actionCode
        var actionItem = Array.from(actionList.querySelectorAll('li')).find(function (item) {
          // Сравниваем actionCode с кодом действия
          var actionLink = item.querySelector('span');
          return actions.find(function (action) {
            return action.actionCode === actionCode && action.name === actionLink.textContent;
          });
        });
        if (actionItem) {
          var actionLink = actionItem.querySelector('span');
          actionLink.classList.add('active-action'); // Добавляем класс активного действия
          handleMenuClick(homeCode, actionCode, actionLink); // Выполняем клик на пункте действия
        }
      }
    }
  }
});
function toggleSidebarBasedOnScreenSize() {
  var sidebar = document.querySelector('.sidebar');
  //    if ((window.innerWidth > 768 && !sidebar.classList.contains('open')) || (window.innerWidth <= 768 && sidebar.classList.contains('open')))
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) toggleMenu();
}

window.addEventListener('resize', toggleSidebarBasedOnScreenSize);

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
    "window.innerWidth: " + window.innerWidth +
    "\nwindow.innerHeight: " + window.innerHeight +
    "\nfullscreenWidth: " + fullscreenWidth +
    "\nfullscreenHeight: " + fullscreenHeight
);
    if (fullscreenApi || isF11Fullscreen) {
        document.body.classList.add('fullscreen');
        console.log('Полноэкранный режим активирован');
    } else {
        document.body.classList.remove('fullscreen');
        console.log('Полноэкранный режим выключен');
    }
}

// Обработчики событий
document.addEventListener('fullscreenchange', checkFullscreenMode);
document.addEventListener('webkitfullscreenchange', checkFullscreenMode);
document.addEventListener('mozfullscreenchange', checkFullscreenMode);
document.addEventListener('MSFullscreenChange', checkFullscreenMode);
window.addEventListener('resize', checkFullscreenMode);
document.addEventListener('DOMContentLoaded', function () {
    let searchInput = document.getElementById('searchHomes');

    // Восстанавливаем значение из localStorage
    if (localStorage.getItem('searchHomes')) {
        searchInput.value = localStorage.getItem('searchHomes');
        filterHomes(searchInput.value);
    }

    searchInput.addEventListener('input', function () {
        let filter = this.value.trim();
        localStorage.setItem('searchHomes', filter); // Сохраняем в localStorage
        filterHomes(filter);
    });
});

function filterHomes(filter) {
    let regexPattern = filter
        .replace(/\s+/g, '.*')  // Пробелы заменяем на .*
        .replace(/\*/g, '.*')    // '*' заменяем на .*
        .replace(/\?/g, '.');    // '?' заменяем на .

    let regex = new RegExp(regexPattern, 'i'); // Создаем регистронезависимый RegExp

    document.querySelectorAll('.menu-item').forEach(function (item) {
        let homeCode = item.getAttribute('data-code'); // Получаем код дома
        let home = homes.find(h => h.code === homeCode); // Находим объект дома

        if (home) {
            let matches = Object.values(home).some(value =>
                typeof value === 'string' && regex.test(value)
            );
            item.style.display = matches ? '' : 'none';
        }
    });
}

// Инициализация
checkFullscreenMode();
