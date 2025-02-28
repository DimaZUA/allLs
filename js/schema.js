function initSchema(){
    const displayKeys = ["pl", "ls", "pers", "kv", "dolg", "opl", "nach"];
    const displayKeysName = {"pl":"Площадь", "ls":"Лицевые счета", "pers":"Прописано чел.", "kv":"Номера квартир", "dolg":"Долги", "opl":"Платежи", "nach":"Начисления", "fio":"ФИО","note":""};
    let display = "opl";

    // Создаем новую переменную с данными для работы
// Функции должны быть определены до использования
// Функция для вычисления начислений за текущий месяц
const getTotalForCurrentMonth = (nachData, lsId) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Месяцы от 1 до 12
  
  let totalNach = 0;
  if (nachData[lsId] && nachData[lsId][currentYear] && nachData[lsId][currentYear][currentMonth]) {
    totalNach = Object.values(nachData[lsId][currentYear][currentMonth]).reduce((sum, amount) => sum + amount, 0);
  }

  return totalNach;
};

// Функция для вычисления платежей за текущий месяц
const getTotalForCurrentMonthOplat = (oplatData, lsId) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Месяцы от 1 до 12
  
  let totalOplat = 0;
  if (oplatData[lsId] && oplatData[lsId][currentYear] && oplatData[lsId][currentYear][currentMonth]) {
    totalOplat = oplatData[lsId][currentYear][currentMonth].reduce((sum, payment) => sum + payment.sum, 0);
  }

  return totalOplat;
};

// Функция для вычисления всех начислений за всё время
const getTotalForAllTime = (nachData, lsId) => {
  let totalNach = 0;
  if (nachData[lsId]) {
    Object.entries(nachData[lsId]).forEach(([year, months]) => {
      Object.entries(months).forEach(([month, days]) => {
        totalNach += Object.values(days).reduce((sum, amount) => sum + amount, 0);
      });
    });
  }
  return totalNach;
};

// Функция для вычисления всех платежей за всё время
const getTotalForAllTimeOplat = (oplatData, lsId) => {
  let totalOplat = 0;
  if (oplatData[lsId]) {
    Object.entries(oplatData[lsId]).forEach(([year, months]) => {
      Object.entries(months).forEach(([month, payments]) => {
        totalOplat += payments.reduce((sum, payment) => sum + payment.sum, 0);
      });
    });
  }
  return totalOplat;
};

// Теперь мы можем безопасно обновлять данные в lsWithZeroFloor
const lsWithZeroFloor = Object.entries(ls)
  .map(([key, item]) => ({
    ...item,
    id: key // Добавляем ключ 'key' как 'id'
  }))
  .filter(item => item.et !== 0 && item.et !== undefined && item.pod !== 0 && item.pod !== undefined);

// Обновляем lsWithZeroFloor с начислениями, платежами и долгом
lsWithZeroFloor.forEach(item => {
  const lsId = item.id; // ID квартиры (ЛС)

  // 1. Получаем начисления за текущий месяц
  const currentMonthNach = getTotalForCurrentMonth(nach, lsId);

  // 2. Получаем платежи за текущий месяц
  const currentMonthOplat = getTotalForCurrentMonthOplat(oplat, lsId);

  // 3. Считаем долг: все начисления за всё время минус все платежи за всё время
  const totalNach = getTotalForAllTime(nach, lsId);
  const totalOplat = getTotalForAllTimeOplat(oplat, lsId);
  const dolg = totalNach - totalOplat;

  // Обновляем данные для текущей квартиры (ЛС)
  item.nach = currentMonthNach;
  item.opl = currentMonthOplat;
  item.dolg = dolg;
});

console.log(lsWithZeroFloor);






    // Получаем уникальные подъезды
    const entrances = [...new Set(lsWithZeroFloor.map(item => item.pod))].sort();

    const calculateZeroFloor = () => {
      const zeroFloorData = {};

      entrances.forEach((pod) => {
        const stacks = [];
        const maxFloor = Math.max(...lsWithZeroFloor.filter(item => item.pod === pod).map(item => item.et)); // Определяем максимальный этаж для текущего подъезда

        // Проходим по всем этажам
        for (let i = 1; i <= maxFloor; i++) {
          const itemsOnFloor = lsWithZeroFloor.filter(item => item.pod === pod && item.et === i);

          // Для каждого этажа суммируем по стоякам
          itemsOnFloor.forEach((item, index) => {
            if (!stacks[index]) stacks[index] = { pers: 0, dolg: 0, opl: 0, nach: 0, pl: 0, ls: 0, kv: 0 }; // Инициализируем стояк

            // Суммируем по каждому ключу
            displayKeys.forEach((key) => {
              if (key === 'fio' || key === 'ls' || key === 'kv') {
                stacks[index][key] = 1 + stacks[index][key]; // Для этих полей +1
              } else {
                stacks[index][key] += item[key] || 0; // Для других  суммируем
              }
            });
          });
        }

        // Добавляем данные 0-го этажа
        const zeroFloorStacks = stacks.map((stack, index) => ({
          ...stack,
          et: 0, // Нулевой этаж
          pod, // Подъезд
          kv: stack.kv, // Сумма по квартирам
          ls: stack.ls, // Сумма по ЛС
          fio: "", // Для 0-го этажа пустое поле fio
        }));

        zeroFloorData[pod] = zeroFloorStacks; // Сохраняем итог для подъезда
      });

      Object.entries(zeroFloorData).forEach(([pod, stacks]) => {
        stacks.forEach((stack, index) => {
          lsWithZeroFloor.push({
            et: 0,
            pod: parseInt(pod),
            kv: stack.kv,
            ls: stack.ls,
            fio: stack.fio,
            pl: formatNumber(stack.pl),
            pers: stack.pers,
            dolg: stack.dolg,
            opl: stack.opl,
            nach: stack.nach,
          });
        });
      });

      return lsWithZeroFloor; // Возвращаем обновленные данные
    };

    // Вызываем функцию для расчета и обновления данных
    calculateZeroFloor();

    // Получаем уникальные этажи и подъезды с учетом 0-го этажа
    const floors = [...new Set([...lsWithZeroFloor.map((item) => item.et), 0])].sort((a, b) => b - a);

    // Функция для расчета общего значения
const getTotal = (filterFn, data) => {
  const items = data.filter(filterFn);
  return ["ls", "kv", "fio"].includes(display) ? items.length : items.reduce((sum, item) => sum + (parseFloat(item[display]) || 0), 0);
};

    // Функция для создания кнопки переключения отображения
    const createButton = (key) => {
      const button = document.createElement("button");
      button.classList.add("p-2", "border");
      if (display === key) {
        button.classList.add("bg-blue-500", "text-white");
      }
      button.textContent = displayKeysName[key];
      button.addEventListener("click", () => {
        display = key;
        renderSchema();
      });
      return button;
    };

    // Функция для создания строки этажей для каждого подъезда
    const createEntrancesAndFloors = () => {
      const gridContainer = document.createElement("div");
      gridContainer.classList.add("entrances-grid"); // Применяем новый класс для адаптивности

      entrances.forEach((pod) => {
        const podDiv = document.createElement("div");
        podDiv.classList.add("border", "p-2");

        const podTitle = document.createElement("div");
        podTitle.classList.add("font-bold");
        podTitle.textContent = `Подъезд ${pod}`;
        podDiv.appendChild(podTitle);

        createFloorsForPod(pod, podDiv); // Вставляем этажи для текущего подъезда


        gridContainer.appendChild(podDiv);
      });

      return gridContainer;
    };

// Функция для создания этажей в подъезде
const createFloorsForPod = (pod, podDiv) => {
  floors.forEach((et) => {
    const floorDiv = document.createElement("div");
    floorDiv.classList.add("floor-row"); // Новый класс для горизонтального расположения

    // Номер этажа
    const floorNumber = document.createElement("div");
    floorNumber.classList.add("floor-number");
    floorNumber.textContent = et === 0 ? 'Итог' : et;

    // Контейнер для элементов этажа
    const floorItemsContainer = document.createElement("div");
    floorItemsContainer.classList.add("floor-item-container"); // Контейнер для квадратов на этаже

    createItemsForFloor(pod, et, floorItemsContainer); // Вставляем элементы для текущего этажа

     // Добавляем итог по этажу
    const floorTotalDiv = document.createElement("div");
    floorTotalDiv.classList.add("floor-total");
    const floorTotal = getTotal(item => item.et === et && item.pod === pod, lsWithZeroFloor);
    floorTotalDiv.textContent = formatNumber(floorTotal);
    floorItemsContainer.appendChild(floorTotalDiv);

    // Вставляем номер этажа, элементы и итог в один контейнер
    floorDiv.appendChild(floorNumber);
    floorDiv.appendChild(floorItemsContainer);
    

    // Вставляем номер этажа и элементы в один ряд
    floorDiv.appendChild(floorNumber);
    floorDiv.appendChild(floorItemsContainer);

    podDiv.appendChild(floorDiv);
  });
};


const createItemsForFloor = (pod, et, floorItemsContainer) => {
  const items = lsWithZeroFloor.filter(item => item.et === et && item.pod === pod);
  
  items.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("floor-item"); // Применяем новый класс для одинаковых размеров квадратов

    // Добавляем класс для fio, если отображение нужно по ФИО
    if (display === 'fio') {
      itemDiv.classList.add("fio-text"); // Добавляем класс для fio
    }

    let value = item[display] || 0; // Получаем значение или 0, если оно отсутствует

    // Если display - это один из "opl", "dolg", "nach", то форматируем с двумя знаками после запятой
    if (["opl", "dolg", "nach"].includes(display)) {
      value = parseFloat(value).toFixed(2); // Преобразуем в число и округляем до двух знаков после запятой

      // Если значение равно 0, выводим прочерк
      if (parseFloat(value) === 0) {
        value = "-";
      }
    }

    // Устанавливаем текстовое содержание
    itemDiv.textContent = value;

    // Добавляем класс, если значение отрицательное
    if (display === "opl" || display === "nach") {
      if (parseFloat(value) < 0) {
        itemDiv.classList.add("red");
      }
    }

    // Добавляем класс для "dolg" если оно меньше 0
    if (display === "dolg") {
      if (parseFloat(value) < 0) {
        itemDiv.classList.add("green");
      }

      // Если dolg больше, чем nach * 6, добавляем класс red
      if (item.dolg && item.nach && parseFloat(value) > (item.nach * 6)) {
        itemDiv.classList.add("red");
      }
    }

    // Используем data-атрибут для хранения полного ФИО
//    if (display === 'fio') {
//      itemDiv.setAttribute('data-fio', item[display]);
//    }
//if (display === 'fio') {
itemDiv.setAttribute(
  "data-fio",
  Object.entries(displayKeysName)
    .map(([key, name]) => {
      let value = item[key] ?? "";
      if (typeof value === "number") {
        value = formatNumber(value);
      }

      // Пропускаем значения, если они пустые
      if (value === "") return "";
      if (key==display)  return "";
      // Если name пустое, то не добавляем двоеточие
      return name ? `${name}: ${value}` : value;
    })
    .filter((entry) => entry !== "")  // Убираем пустые строки
    .join("\n") // Используем \n для удобного разбора
);

//}

    // Добавляем элемент в контейнер
    floorItemsContainer.appendChild(itemDiv);
  });
};


    // Функция для создания общего итога
    const createTotal = () => {
      const totalDiv = document.createElement("div");
      totalDiv.classList.add("text-center", "font-bold", "mt-4");
      totalDiv.textContent = `Общий итог: ${formatNumber(getTotal(item => item.et > 0, lsWithZeroFloor))}`;
      return totalDiv;
    };

    // Основная функция для рендеринга всей страницы
    const renderSchema = () => {
      const root = document.createElement("div");
      root.id = "root";
      root.innerHTML = ""; // Очищаем предыдущий контент

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("mb-2", "flex", "gap-2");

      // Добавляем кнопки для переключения отображаемых данных
      displayKeys.forEach((key) => {
        buttonContainer.appendChild(createButton(key));
      });

      root.appendChild(buttonContainer);
      root.appendChild(createEntrancesAndFloors()); // Добавляем этажи и подъезды
      root.appendChild(createTotal()); // Добавляем общий итог


const mainContainer = document.getElementById("maincontainer");

// Вставляем <div id="root"></div> внутрь <div id="maincontainer"></div>
mainContainer.innerHTML = "";

mainContainer.appendChild(root);    
    
    
  // Обновляем всплывающие подсказки для fio
  const fioItems = document.querySelectorAll(".floor-item");

  // Создаем (если нет) или переиспользуем всплывающий элемент
  let tooltip = document.querySelector(".fio-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.classList.add("fio-tooltip");
    document.body.appendChild(tooltip);
  }

  fioItems.forEach((item) => {
    item.addEventListener("mouseenter", (e) => {
      const fio = item.getAttribute("data-fio");
      if (fio) {
        tooltip.innerHTML = fio.replace(/\n/g, "<br>"); 
        tooltip.style.display = "block";
      }
    });

    item.addEventListener("mousemove", (e) => {
      tooltip.style.top = e.pageY + 10 + "px";
      tooltip.style.left = e.pageX + 10 + "px";
    });

    item.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });

    
    
    };

renderSchema();

}