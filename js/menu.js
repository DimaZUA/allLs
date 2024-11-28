﻿// Список доступных действий (например, для каждого дома)
//const host='https://rk.clan.su/js/';
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
      initLS();
    });
  } else if (actionCode === 'list') {
    document.getElementById('maincontainer');
    loadScriptFromHtml(homeCode + '.js', function () {
      initTable();
    });
  } else if (actionCode === 'payments') {
    loadScriptFromHtml(homeCode + '.js', function () {
      initPayTable();
    });
  } else if (actionCode === 'info') {
    document.getElementById('maincontainer').innerHTML = "<DIV id='maincontainer'><H2>".concat(actionCode, " \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435....</H2></DIV>");
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