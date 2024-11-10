// Список доступных действий (например, для каждого дома)
//const host='https://rk.clan.su/js/';
  const host=['https://rk.clan.su/KvPlat/data/','data/'];

const actions = [
    { name: 'Лицевые счета', actionCode: 'accounts' },
    { name: 'Список', actionCode: 'list' },
    { name: 'Платежи', actionCode: 'payments' },
    { name: 'Информация по дому', actionCode: 'info' },
];
toggleMenu();
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

        setSelectedHome(homeCode);
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


    console.log(`Дом: ${homeCode}, Действие: ${actionCode}`);
    // Здесь можно добавить логику для вызова нужной функции
}

// Переменная для хранения кода выбранного дома
let selectedHomeCode = null;

// Функция для обновления выбранного дома и загрузки соответствующего скрипта
function setSelectedHome(homeCode) {
    selectedHomeCode = homeCode; // Сохраняем код выбранного дома
}

// Функция для подключения скрипта
function loadScriptFromHtml(scriptName, callback) {
    // Показываем preloader
    const preloader = document.getElementById('preloader');
    preloader.style.display = 'flex'; // Отображаем preloader

    let hasLoaded = false; // Флаг для отслеживания успешной загрузки

    // Функция загрузки скрипта
    function loadFromHost(hostUrl) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = hostUrl + scriptName //+ `?_=${Date.now()}`; // Формируем путь с меткой времени

            script.async = true;

            script.onload = () => resolve(hostUrl);  // Успешная загрузка
            script.onerror = () => reject(hostUrl);  // Ошибка загрузки
            document.head.appendChild(script);
        });
    }

    // Попробуем загрузить скрипт с нескольких хостов одновременно
    Promise.race(host.map(url => loadFromHost(url)))
        .then(hostUrl => {
            if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

            console.log(`Скрипт ${scriptName} загружен с хоста: ${hostUrl}`);
            preloader.style.display = 'none';  // Скрыть preloader после успешной загрузки

            hasLoaded = true; // Устанавливаем флаг успешной загрузки

            if (callback) callback();  // Вызов коллбэка, если он был передан
        })
        .catch(hostUrl => {
            console.error(`Ошибка загрузки скрипта ${scriptName} с хоста: ${hostUrl}`);
            // Пытаемся загрузить с другого хоста
            preloader.style.display = 'none';  // Скрываем preloader в случае ошибки
        });
}


// Функция для переключения бокового меню
function toggleMenu() {

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