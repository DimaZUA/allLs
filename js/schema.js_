function _typeof(o) {
  "@babel/helpers - typeof";
  return (
    (_typeof =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (o) {
            return typeof o;
          }
        : function (o) {
            return o &&
              "function" == typeof Symbol &&
              o.constructor === Symbol &&
              o !== Symbol.prototype
              ? "symbol"
              : typeof o;
          }),
    _typeof(o)
  );
}
function _toConsumableArray(r) {
  return (
    _arrayWithoutHoles(r) ||
    _iterableToArray(r) ||
    _unsupportedIterableToArray(r) ||
    _nonIterableSpread()
  );
}
function _nonIterableSpread() {
  throw new TypeError(
    "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}
function _iterableToArray(r) {
  if (
    ("undefined" != typeof Symbol && null != r[Symbol.iterator]) ||
    null != r["@@iterator"]
  )
    return Array.from(r);
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r &&
      (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })),
      t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2
      ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
      : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (
    (r = _toPropertyKey(r)) in e
      ? Object.defineProperty(e, r, {
          value: t,
          enumerable: !0,
          configurable: !0,
          writable: !0
        })
      : (e[r] = t),
    e
  );
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _slicedToArray(r, e) {
  return (
    _arrayWithHoles(r) ||
    _iterableToArrayLimit(r, e) ||
    _unsupportedIterableToArray(r, e) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return (
      "Object" === t && r.constructor && (t = r.constructor.name),
      "Map" === t || "Set" === t
        ? Array.from(r)
        : "Arguments" === t ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
        ? _arrayLikeToArray(r, a)
        : void 0
    );
  }
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit(r, l) {
  var t =
    null == r
      ? null
      : ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (((i = (t = t.call(r)).next), 0 === l)) {
        if (Object(t) !== t) return;
        f = !1;
      } else
        for (
          ;
          !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
          f = !0
        );
    } catch (r) {
      (o = !0), (n = r);
    } finally {
      try {
        if (!f && null != t["return"] && ((u = t["return"]()), Object(u) !== u))
          return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function initSchema() {
  var displayKeys = ["pl", "ls", "pers", "kv", "dolg", "opl", "nach"];
  var displayKeysName = {
    pl: "Площадь",
    ls: "Лицевые счета",
    pers: "Прописано чел.",
    kv: "Номера квартир",
    dolg: "Долги",
    opl: "Платежи",
    nach: "Начисления",
    fio: "ФИО",
    note: ""
  };
  var display = "opl";

  // Создаем новую переменную с данными для работы
  // Функции должны быть определены до использования
  // Функция для вычисления начислений за текущий месяц
  var getTotalForCurrentMonth = function getTotalForCurrentMonth(
    nachData,
    lsId
  ) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5);
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth() + 1; // Месяцы от 1 до 12

    var totalNach = 0;
    if (
      nachData[lsId] &&
      nachData[lsId][currentYear] &&
      nachData[lsId][currentYear][currentMonth]
    ) {
      totalNach = Object.values(
        nachData[lsId][currentYear][currentMonth]
      ).reduce(function (sum, amount) {
        return sum + amount;
      }, 0);
    }
    return totalNach;
  };

  // Функция для вычисления платежей за текущий месяц
  var getTotalForCurrentMonthOplat = function getTotalForCurrentMonthOplat(
    oplatData,
    lsId
  ) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5);
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth() + 1; // Месяцы от 1 до 12

    var totalOplat = 0;
    if (
      oplatData[lsId] &&
      oplatData[lsId][currentYear] &&
      oplatData[lsId][currentYear][currentMonth]
    ) {
      totalOplat = oplatData[lsId][currentYear][currentMonth].reduce(function (
        sum,
        payment
      ) {
        return sum + payment.sum;
      },
      0);
    }
    return totalOplat;
  };

  // Функция для вычисления всех начислений за всё время
  var getTotalForAllTime = function getTotalForAllTime(nachData, lsId) {
    var totalNach = 0;
    if (nachData[lsId]) {
      Object.entries(nachData[lsId]).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          year = _ref2[0],
          months = _ref2[1];
        Object.entries(months).forEach(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            month = _ref4[0],
            days = _ref4[1];
          totalNach += Object.values(days).reduce(function (sum, amount) {
            return sum + amount;
          }, 0);
        });
      });
    }
    return totalNach;
  };

  // Функция для вычисления всех платежей за всё время
  var getTotalForAllTimeOplat = function getTotalForAllTimeOplat(
    oplatData,
    lsId
  ) {
    var totalOplat = 0;
    if (oplatData[lsId]) {
      Object.entries(oplatData[lsId]).forEach(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
          year = _ref6[0],
          months = _ref6[1];
        Object.entries(months).forEach(function (_ref7) {
          var _ref8 = _slicedToArray(_ref7, 2),
            month = _ref8[0],
            payments = _ref8[1];
          totalOplat += payments.reduce(function (sum, payment) {
            return sum + payment.sum;
          }, 0);
        });
      });
    }
    return totalOplat;
  };

  // Теперь мы можем безопасно обновлять данные в lsWithZeroFloor
  var lsWithZeroFloor = Object.entries(ls)
    .map(function (_ref9) {
      var _ref10 = _slicedToArray(_ref9, 2),
        key = _ref10[0],
        item = _ref10[1];
      return _objectSpread(
        _objectSpread({}, item),
        {},
        {
          id: key // Добавляем ключ 'key' как 'id'
        }
      );
    })
    .filter(function (item) {
      return (
        item.et !== 0 &&
        item.et !== undefined &&
        item.pod !== 0 &&
        item.pod !== undefined
      );
    });

  // Обновляем lsWithZeroFloor с начислениями, платежами и долгом
  lsWithZeroFloor.forEach(function (item) {
    var lsId = item.id; // ID квартиры (ЛС)

    // 1. Получаем начисления за текущий месяц
    var currentMonthNach = getTotalForCurrentMonth(nach, lsId);

    // 2. Получаем платежи за текущий месяц
    var currentMonthOplat = getTotalForCurrentMonthOplat(oplat, lsId);

    // 3. Считаем долг: все начисления за всё время минус все платежи за всё время
    var totalNach = getTotalForAllTime(nach, lsId);
    var totalOplat = getTotalForAllTimeOplat(oplat, lsId);
    var dolg = totalNach - totalOplat;

    // Обновляем данные для текущей квартиры (ЛС)
    item.nach = currentMonthNach;
    item.opl = currentMonthOplat;
    item.dolg = dolg;
  });
  console.log(lsWithZeroFloor);

  // Получаем уникальные подъезды
  var entrances = _toConsumableArray(
    new Set(
      lsWithZeroFloor.map(function (item) {
        return +item.pod;
      })
    )
  ).sort(function (a, b) {
    return a - b;
  });
  var calculateZeroFloor = function calculateZeroFloor() {
    var zeroFloorData = {};
    entrances.forEach(function (pod) {
      var stacks = [];
      var maxFloor = Math.max.apply(
        Math,
        _toConsumableArray(
          lsWithZeroFloor
            .filter(function (item) {
              return item.pod === pod;
            })
            .map(function (item) {
              return item.et;
            })
        )
      ); // Определяем максимальный этаж для текущего подъезда

      // Проходим по всем этажам
      var _loop = function _loop(i) {
        var itemsOnFloor = lsWithZeroFloor.filter(function (item) {
          return item.pod === pod && item.et === i;
        });

        // Для каждого этажа суммируем по стоякам
        itemsOnFloor.forEach(function (item, index) {
          if (!stacks[index])
            stacks[index] = {
              pers: 0,
              dolg: 0,
              opl: 0,
              nach: 0,
              pl: 0,
              ls: 0,
              kv: 0
            }; // Инициализируем стояк

          // Суммируем по каждому ключу
          displayKeys.forEach(function (key) {
            if (key === "fio" || key === "ls" || key === "kv") {
              stacks[index][key] = 1 + stacks[index][key]; // Для этих полей +1
            } else {
              stacks[index][key] += item[key] || 0; // Для других  суммируем
            }
          });
        });
      };
      for (var i = 1; i <= maxFloor; i++) {
        _loop(i);
      }

      // Добавляем данные 0-го этажа
      var zeroFloorStacks = stacks.map(function (stack, index) {
        return _objectSpread(
          _objectSpread({}, stack),
          {},
          {
            et: 0,
            // Нулевой этаж
            pod: pod,
            // Подъезд
            kv: stack.kv,
            // Сумма по квартирам
            ls: stack.ls,
            // Сумма по ЛС
            fio: "" // Для 0-го этажа пустое поле fio
          }
        );
      });
      zeroFloorData[pod] = zeroFloorStacks; // Сохраняем итог для подъезда
    });
    Object.entries(zeroFloorData).forEach(function (_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
        pod = _ref12[0],
        stacks = _ref12[1];
      stacks.forEach(function (stack, index) {
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
          nach: stack.nach
        });
      });
    });
    return lsWithZeroFloor; // Возвращаем обновленные данные
  };

  // Вызываем функцию для расчета и обновления данных
  calculateZeroFloor();

  // Получаем уникальные этажи и подъезды с учетом 0-го этажа
  var floors = _toConsumableArray(
    new Set(
      [].concat(
        _toConsumableArray(
          lsWithZeroFloor.map(function (item) {
            return item.et;
          })
        ),
        [0]
      )
    )
  ).sort(function (a, b) {
    return b - a;
  });

  // Функция для расчета общего значения
  var getTotal = function getTotal(filterFn, data) {
    var items = data.filter(filterFn);
    return ["ls", "kv", "fio"].includes(display)
      ? items.length
      : items.reduce(function (sum, item) {
          return sum + (parseFloat(item[display]) || 0);
        }, 0);
  };

  // Функция для создания кнопки переключения отображения
  var createButton = function createButton(key) {
    var button = document.createElement("button");
    button.classList.add("p-2", "border");
    if (display === key) {
      button.classList.add("bg-blue-500", "text-white");
    }
    button.textContent = displayKeysName[key];
    button.addEventListener("click", function () {
      display = key;
      renderSchema();
    });
    return button;
  };

  // Функция для создания строки этажей для каждого подъезда
  var createEntrancesAndFloors = function createEntrancesAndFloors() {
    var gridContainer = document.createElement("div");
    gridContainer.classList.add("entrances-grid"); // Применяем новый класс для адаптивности

    entrances.forEach(function (pod) {
      var podDiv = document.createElement("div");
      podDiv.classList.add("border", "p-2");
      var podTitle = document.createElement("div");
      podTitle.classList.add("font-bold");
      podTitle.textContent =
        "\u041F\u043E\u0434\u044A\u0435\u0437\u0434 ".concat(pod);
      podDiv.appendChild(podTitle);
      createFloorsForPod(pod, podDiv); // Вставляем этажи для текущего подъезда

      gridContainer.appendChild(podDiv);
    });
    return gridContainer;
  };

  // Функция для создания этажей в подъезде
  var createFloorsForPod = function createFloorsForPod(pod, podDiv) {
    floors.forEach(function (et) {
      var floorDiv = document.createElement("div");
      floorDiv.classList.add("floor-row"); // Новый класс для горизонтального расположения

      // Номер этажа
      var floorNumber = document.createElement("div");
      floorNumber.classList.add("floor-number");
      floorNumber.textContent = et === 0 ? "Итог" : et;

      // Контейнер для элементов этажа
      var floorItemsContainer = document.createElement("div");
      floorItemsContainer.classList.add("floor-item-container"); // Контейнер для квадратов на этаже

      createItemsForFloor(pod, et, floorItemsContainer); // Вставляем элементы для текущего этажа

      // Добавляем итог по этажу
      var floorTotalDiv = document.createElement("div");
      floorTotalDiv.classList.add("floor-total");
      var floorTotal = getTotal(function (item) {
        return item.et === et && item.pod === pod;
      }, lsWithZeroFloor);
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
  var createItemsForFloor = function createItemsForFloor(
    pod,
    et,
    floorItemsContainer
  ) {
    var items = lsWithZeroFloor.filter(function (item) {
      return item.et === et && item.pod === pod;
    });
    items.forEach(function (item) {
      var itemDiv = document.createElement("div");
      itemDiv.classList.add("floor-item"); // Применяем новый класс для одинаковых размеров квадратов

      // Добавляем класс для fio, если отображение нужно по ФИО
      if (display === "fio") {
        itemDiv.classList.add("fio-text"); // Добавляем класс для fio
      }
      var value = item[display] || 0; // Получаем значение или 0, если оно отсутствует

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
        if (item.dolg && item.nach && parseFloat(value) > item.nach * 6) {
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
          .map(function (_ref13) {
            var _item$key;
            var _ref14 = _slicedToArray(_ref13, 2),
              key = _ref14[0],
              name = _ref14[1];
            var value =
              (_item$key = item[key]) !== null && _item$key !== void 0
                ? _item$key
                : "";
            if (typeof value === "number") {
              value = formatNumber(value);
            }

            // Пропускаем значения, если они пустые
            if (value === "") return "";
            if (key == display) return "";
            // Пропускаем 0-й этаж
            if (item.et === 0) return "";
            // Если name пустое, то не добавляем двоеточие
            return name ? "".concat(name, ": ").concat(value) : value;
          })
          .filter(function (entry) {
            return entry !== "";
          }) // Убираем пустые строки
          .join("\n") // Используем \n для удобного разбора
      );

      //}

      // Добавляем элемент в контейнер
      floorItemsContainer.appendChild(itemDiv);
    });
  };

  // Функция для создания общего итога
  var createTotal = function createTotal() {
    var totalDiv = document.createElement("div");
    totalDiv.classList.add("text-center", "font-bold", "mt-4");
    totalDiv.textContent =
      "\u041E\u0431\u0449\u0438\u0439 \u0438\u0442\u043E\u0433: ".concat(
        formatNumber(
          getTotal(function (item) {
            return item.et > 0;
          }, lsWithZeroFloor)
        )
      );
    return totalDiv;
  };

  // Основная функция для рендеринга всей страницы
  var renderSchema = function renderSchema() {
    var root = document.createElement("div");
    root.id = "root";
    root.innerHTML = ""; // Очищаем предыдущий контент

    var buttonContainer = document.createElement("div");
    buttonContainer.classList.add("mb-2", "flex", "gap-2");

    // Добавляем кнопки для переключения отображаемых данных
    displayKeys.forEach(function (key) {
      buttonContainer.appendChild(createButton(key));
    });
    root.appendChild(buttonContainer);
    root.appendChild(createEntrancesAndFloors()); // Добавляем этажи и подъезды
    root.appendChild(createTotal()); // Добавляем общий итог

    var mainContainer = document.getElementById("maincontainer");

    // Вставляем <div id="root"></div> внутрь <div id="maincontainer"></div>
    mainContainer.innerHTML = "";
    mainContainer.appendChild(root);

    // Обновляем всплывающие подсказки для fio
    var fioItems = document.querySelectorAll(".floor-item");

    // Создаем (если нет) или переиспользуем всплывающий элемент
    var tooltip = document.querySelector(".fio-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.classList.add("fio-tooltip");
      document.body.appendChild(tooltip);
    }
    fioItems.forEach(function (item) {
      item.addEventListener("mouseenter", function (e) {
        var fio = item.getAttribute("data-fio");
        if (fio) {
          tooltip.innerHTML = fio.replace(/\n/g, "<br>");
          tooltip.style.display = "block";
        }
      });
      item.addEventListener("mousemove", function (e) {
        var tooltipWidth = tooltip.offsetWidth;
        var tooltipHeight = tooltip.offsetHeight;

        // Получаем координаты мыши относительно окна
        var tooltipX = e.clientX + 10; // Отступ от мыши
        var tooltipY = e.clientY + 10; // Отступ от мыши

        // Устанавливаем максимальную ширину tooltip на 80% от ширины окна
        tooltip.style.maxWidth = window.innerWidth * 0.8 + "px";

        // Проверка на правую границу экрана, если tooltip выходит за пределы
        if (tooltipX + tooltipWidth > window.innerWidth) {
          tooltipX = e.clientX - tooltipWidth - 10; // Если выходит, отображаем слева от курсора
        }

        // Проверка на нижнюю границу экрана, если tooltip выходит за пределы
        if (tooltipY + tooltipHeight > window.innerHeight) {
          tooltipY = e.clientY - tooltipHeight - 10; // Если выходит, отображаем сверху от курсора
        }

        // Проверка на левую границу экрана (если tooltip слишком широкий)
        if (tooltipX < 0) {
          tooltipX = 10; // Если выходит за левую границу, устанавливаем его отступ слева
        }

        // Устанавливаем новые позиции для tooltip
        tooltip.style.top = tooltipY + "px";
        tooltip.style.left = tooltipX + "px";
      });
      item.addEventListener("mouseleave", function () {
        tooltip.style.display = "none";
      });
    });
  };
  renderSchema();
}
