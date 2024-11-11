// Список доступных действий (например, для каждого дома)
//const host='https://rk.clan.su/js/';
  const host='data/';

const actions = [
    { name: 'Лицевые счета', actionCode: 'accounts' },
    { name: 'Список', actionCode: 'list' },
    { name: 'Платежи', actionCode: 'payments' },
    { name: 'Информация по дому', actionCode: 'info' },
];


// Генерация меню
const menu = document.getElementById('menu');
homes.forEach(home => {
    const homeItem = document.createElement('li');
    homeItem.classList.add('menu-item');

    const homeLink = document.createElement('span');
    homeLink.textContent = home.name;
    homeLink.onclick = () => toggleSubMenu(homeItem, home.code);
    homeItem.appendChild(homeLink);

    const actionList = document.createElement('ul');
    actions.forEach(action => {
        const actionItem = document.createElement('li');
        const actionLink = document.createElement('span');
        actionLink.textContent = action.name;
        actionLink.onclick = () => handleMenuClick(home.code, action.actionCode, actionLink);
        actionItem.appendChild(actionLink);
        actionList.appendChild(actionItem);
    });

    homeItem.appendChild(actionList);
    menu.appendChild(homeItem);
});

// Переключение подменю и установка активного дома
function toggleSubMenu(homeItem, homeCode) {
    // Убираем класс 'active' и скрываем все подменю
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');  // Убираем активный класс
        const actionList = item.querySelector('ul');
        if (actionList) {
            actionList.style.display = 'none';  // Скрываем все подменю
        }
    });

    // Добавляем класс 'active' и показываем подменю для выбранного элемента
    homeItem.classList.add('active');

    const actionList = homeItem.querySelector('ul');
    if (actionList) {
        actionList.style.display = actionList.style.display === 'block' ? 'none' : 'block';  // Переключаем отображение подменю
    }
}

// Обработчик клика на пункт подменю
function handleMenuClick(homeCode, actionCode, actionLink) {
	 if (window.innerWidth > 768) checkMenu(); else toggleMenu();
    document.querySelectorAll('.menu-item ul span').forEach(item => item.classList.remove('active-action'));
    actionLink.classList.add('active-action');

        if (actionCode === 'accounts') {
        document.getElementById('maincontainer').style.maxWidth = '1000px'; 
            loadScriptFromHtml(homeCode+'.js', function() {
                initLS();
            });
        }else if (actionCode === 'list'){ 
        document.getElementById('maincontainer').style.maxWidth = '1000px'; 
            loadScriptFromHtml(homeCode+'.js', function() {
                initTable();
            });
        }else if (actionCode === 'payments'){
        document.getElementById('maincontainer').innerHTML=`<DIV id='maincontainer'><H2>${actionCode} в разработке....</H2></DIV>`;
        }else if (actionCode === 'info'){
        document.getElementById('maincontainer').innerHTML=`<DIV id='maincontainer'><H2>${actionCode} в разработке....</H2></DIV>`;
        } 
    if (homeCode && actionCode){
    setParam('homeCode', homeCode);
    setParam('actionCode', actionCode);
    }
    console.log(`Дом: ${homeCode}, Действие: ${actionCode}`);
}


// Функция для подключения скрипта
function loadScriptFromHtml(scriptName, callback) {
    const preloader = document.getElementById('preloader');

    let hasLoaded = false; // Флаг для отслеживания успешной загрузки
    let preloaderTimeout;

    // Показываем прелоадер, если загрузка длится больше 1.5 секунд
    preloaderTimeout = setTimeout(() => {
        preloader.style.display = 'flex';
    }, 1500);

    // Функция загрузки скрипта
    function loadScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = host + scriptName; // Формируем путь

            script.async = true;

            script.onload = () => resolve();  // Успешная загрузка
            script.onerror = () => reject();  // Ошибка загрузки

            document.head.appendChild(script);
        });
    }

    // Загружаем скрипт
    loadScript()
        .then(() => {
            if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

            console.log(`Скрипт ${scriptName} успешно загружен с хоста: ${host}`);
            clearTimeout(preloaderTimeout);  // Останавливаем прелоадер, если загрузка успешна
            preloader.style.display = 'none'; // Скрываем прелоадер

            hasLoaded = true; // Устанавливаем флаг успешной загрузки

            if (callback) callback();  // Вызов коллбэка, если он был передан
        })
	.catch((error) => {
            console.error('Ошибка при загрузке скрипта:', error);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек вызовов:', error.stack);
            clearTimeout(preloaderTimeout);  // Останавливаем прелоадер, если произошла ошибка
            preloader.style.display = 'none'; // Скрываем прелоадер
        });
}



// Функция для переключения бокового меню
function toggleMenu() {
    const logo = document.querySelector('.logo');

    // Вращение логотипа
    logo.classList.add('spin');
    setTimeout(() => logo.classList.remove('spin'), 1000);

    // Переключаем класс "open" для боковой панели
    sidebar.classList.toggle('open');
    checkMenu();

}

function checkMenu(){
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content');

    // Логика для компьютеров
    if (window.innerWidth > 768) {
        if (sidebar.classList.contains('open')) {
            content.style.marginLeft = '250px'; // Панель открыта, сдвигаем контент
        } else {
            content.style.marginLeft = '0'; // Панель закрыта, контент занимает все место
        }
    } else {
        // Для мобильных устройств
        if (sidebar.classList.contains('open')) {
            content.style.marginLeft = '0'; // На мобильных устройствах контент занимает весь экран
        } else {
            content.style.marginLeft = '0'; // На мобильных устройствах контент также не сдвигается
        }
    }
}
Number.prototype.toFixedWithComma = function (decimals = 2) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(this);
};

document.addEventListener('DOMContentLoaded', () => {
    toggleMenu();

    // Если параметры найдены в URL, используем их, иначе — из localStorage
    const homeCode = getParam('homeCode');
    const actionCode = getParam('actionCode');

    if (homeCode && actionCode) {
        // Находим соответствующий дом в массиве homes по коду
        const home = homes.find(home => home.code === homeCode);

        if (home) {
            // Находим элемент меню по имени дома
            const homeItem = Array.from(document.querySelectorAll('.menu-item')).find(item => {
                return item.querySelector('span').textContent === home.name;
            });

            if (homeItem) {
                // Активируем этот дом
                homeItem.classList.add('active');

                // Находим и показываем подменю этого дома
                const actionList = homeItem.querySelector('ul');
                if (actionList) {
                    actionList.style.display = 'block'; // Показываем подменю
                }

                // Находим и активируем соответствующий пункт действия по actionCode
                const actionItem = Array.from(actionList.querySelectorAll('li')).find(item => {
                    // Сравниваем actionCode с кодом действия
                    const actionLink = item.querySelector('span');
                    return actions.find(action => action.actionCode === actionCode && action.name === actionLink.textContent);
                });

                if (actionItem) {
                    const actionLink = actionItem.querySelector('span');
                    actionLink.classList.add('active-action'); // Добавляем класс активного действия
                    handleMenuClick(homeCode, actionCode, actionLink); // Выполняем клик на пункте действия
                }
            }
        }
    }
});
