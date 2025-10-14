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
          writable: !0,
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
    note: "",
  };
  var display = "opl";

  // --- Показатели с числовыми значениями (меняют ширину пропорционально)
  const numericDisplays = ["opl", "nach", "dolg", "pl"];

  // --- Служебные функции расчёта начислений/платежей ---
  var getTotalForCurrentMonth = function (nachData, lsId) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5);
    var y = currentDate.getFullYear(),
      m = currentDate.getMonth() + 1;
    var total = 0;
    if (nachData[lsId]?.[y]?.[m]) {
      total = Object.values(nachData[lsId][y][m]).reduce((s, v) => s + v, 0);
    }
    return total;
  };

  var getTotalForCurrentMonthOplat = function (oplatData, lsId) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5);
    var y = currentDate.getFullYear(),
      m = currentDate.getMonth() + 1;
    var total = 0;
    if (oplatData[lsId]?.[y]?.[m]) {
      total = oplatData[lsId][y][m].reduce((s, p) => s + p.sum, 0);
    }
    return total;
  };

  var getTotalForAllTime = function (nachData, lsId) {
    var total = 0;
    if (nachData[lsId]) {
      Object.values(nachData[lsId]).forEach((months) =>
        Object.values(months).forEach((days) => {
          total += Object.values(days).reduce((s, v) => s + v, 0);
        })
      );
    }
    return total;
  };

  var getTotalForAllTimeOplat = function (oplatData, lsId) {
    var total = 0;
    if (oplatData[lsId]) {
      Object.values(oplatData[lsId]).forEach((months) =>
        Object.values(months).forEach((payments) => {
          total += payments.reduce((s, p) => s + p.sum, 0);
        })
      );
    }
    return total;
  };

  // --- Подготовка данных ---
  var lsWithZeroFloor = Object.entries(ls)
    .map(([key, item]) => ({ ...item, id: key }))
    .filter((item) => item.et && item.pod);

  // Добавляем начисления, платежи, долг
  lsWithZeroFloor.forEach((item) => {
    var id = item.id;
    var currentNach = getTotalForCurrentMonth(nach, id);
    var currentOpl = getTotalForCurrentMonthOplat(oplat, id);
    var totalNach = getTotalForAllTime(nach, id);
    var totalOpl = getTotalForAllTimeOplat(oplat, id);
    var dolg = totalNach - totalOpl;

    item.nach = currentNach;
    item.opl = currentOpl;
    item.dolg = dolg;
  });

  // --- Средняя площадь по всему дому ---
  const allAreas = lsWithZeroFloor
    .map((it) => parseFloat(it.pl) || parseFloat(it.area) || 0)
    .filter((a) => a > 0);
  const avgArea =
    allAreas.reduce((a, b) => a + b, 0) / (allAreas.length || 1);

  // --- Средние значения по numericDisplays ---
  const avgValues = {};
  numericDisplays.forEach((key) => {
    const vals = lsWithZeroFloor.map((i) => parseFloat(i[key]) || 0);
    avgValues[key] =
      vals.reduce((a, b) => a + b, 0) / (vals.filter((v) => v > 0).length || 1);
  });

  // --- Подъезды и этажи ---
  var entrances = [...new Set(lsWithZeroFloor.map((it) => +it.pod))].sort(
    (a, b) => a - b
  );
  var floors = [...new Set(lsWithZeroFloor.map((it) => it.et).concat([0]))].sort(
    (a, b) => b - a
  );

  // --- Создание квартирных блоков ---
  var createItemsForFloor = function (pod, et, container) {
    var items = lsWithZeroFloor.filter((i) => i.pod === pod && i.et === et);
    items.forEach((item) => {
      var itemDiv = document.createElement("div");
      itemDiv.classList.add("floor-item");
      if (item.et == 0) itemDiv.classList.add("floor-zero");

      // 📏 Пропорциональная ширина
      const baseWidth = 60;
      let width = baseWidth;

      if (numericDisplays.includes(display)) {
        const avg = avgValues[display] || avgArea;
        const value = parseFloat(item[display]) || avg;
        const scale = value / avg;
        width = Math.max(30, Math.min(baseWidth * scale, 120));
      }

      // ✨ Плавная анимация при переключении
      itemDiv.style.transition = "width 0.6s ease";
      itemDiv.style.width = width + "px";
      itemDiv.style.height = "40px";

      // 🔹 Номер квартиры
      var kvBackground = document.createElement("span");
      kvBackground.classList.add("kv-background");
      if (item.dolg < item.nach + 10) kvBackground.classList.add("green");
      if (item.dolg > item.nach * 6 && item.nach > 50)
        kvBackground.classList.add("red");
      kvBackground.textContent = item.kv;
      itemDiv.appendChild(kvBackground);

      // 🔹 Значение
      var valueSpan = document.createElement("span");
      valueSpan.classList.add("value-span");
      var value = item[display] || 0;

      if (numericDisplays.includes(display)) {
        value = parseFloat(value).toFixed(2);
        if (parseFloat(value) === 0) value = "-";
      }

      valueSpan.textContent = value;
      itemDiv.appendChild(valueSpan);

      if (display === "fio") itemDiv.classList.add("fio-text");
      if (display === "opl" || display === "nach") {
        if (parseFloat(value) < 0) valueSpan.classList.add("red");
      }
      if (display === "dolg") {
        if (parseFloat(value) < 0) valueSpan.classList.add("green");
        if (item.dolg && item.nach && item.dolg > item.nach * 6 && item.nach > 50)
          itemDiv.classList.add("red");
      }

      // 🔹 data-fio для подсказки
      itemDiv.setAttribute(
        "data-fio",
        Object.entries(displayKeysName)
          .map(([key, name]) => {
            var v = item[key] ?? "";
            if (typeof v === "number") v = formatNumber(v);
            if (v === "" || item.et === 0) return "";
            return name ? `${name}: ${v}` : v;
          })
          .filter(Boolean)
          .join("\n")
      );

      container.appendChild(itemDiv);
    });
  };

  // --- Отрисовка этажей и подъездов ---
  var createFloorsForPod = function (pod, podDiv) {
    floors.forEach((et) => {
      var floorDiv = document.createElement("div");
      floorDiv.classList.add("floor-row");

      var floorNumber = document.createElement("div");
      floorNumber.classList.add("floor-number");
      floorNumber.textContent = et === 0 ? "Итог" : et;

      var container = document.createElement("div");
      container.classList.add("floor-item-container");
      createItemsForFloor(pod, et, container);

      floorDiv.appendChild(floorNumber);
      floorDiv.appendChild(container);
      podDiv.appendChild(floorDiv);
    });
  };

  var createEntrancesAndFloors = function () {
    var grid = document.createElement("div");
    grid.classList.add("entrances-grid");
    entrances.forEach((pod) => {
      var podDiv = document.createElement("div");
      podDiv.classList.add("border", "p-2");
      var title = document.createElement("div");
      title.classList.add("font-bold");
      title.textContent = `Подъезд ${pod}`;
      podDiv.appendChild(title);
      createFloorsForPod(pod, podDiv);
      grid.appendChild(podDiv);
    });
    return grid;
  };

  // --- Общий итог ---
  var getTotal = (filterFn, data) =>
    ["ls", "kv", "fio"].includes(display)
      ? data.filter(filterFn).length
      : data
          .filter(filterFn)
          .reduce((sum, i) => sum + (parseFloat(i[display]) || 0), 0);

  var createTotal = function () {
    var div = document.createElement("div");
    div.classList.add("text-center", "font-bold", "mt-4");
    div.textContent = `Общий итог: ${formatNumber(
      getTotal((i) => i.et > 0, lsWithZeroFloor)
    )}`;
    return div;
  };

  // --- Рендер всей схемы ---
  var renderSchema = function () {
    var root = document.createElement("div");
    root.id = "root";

    var buttons = document.createElement("div");
    buttons.classList.add("mb-2", "flex", "gap-2");
    displayKeys.forEach((key) => {
      var btn = document.createElement("button");
      btn.classList.add("p-2", "border");
      if (display === key) btn.classList.add("bg-blue-500", "text-white");
      btn.textContent = displayKeysName[key];
      btn.addEventListener("click", function () {
        display = key;
        renderSchema();
      });
      buttons.appendChild(btn);
    });

    root.appendChild(buttons);
    root.appendChild(createEntrancesAndFloors());
    root.appendChild(createTotal());

    var main = document.getElementById("maincontainer");
    main.innerHTML = "";
    main.appendChild(root);

    // --- Подсказки fio ---
    var tooltip = document.querySelector(".fio-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.classList.add("fio-tooltip");
      document.body.appendChild(tooltip);
    }

    document.querySelectorAll(".floor-item").forEach((item) => {
      item.addEventListener("mouseenter", (e) => {
        var fio = item.getAttribute("data-fio");
        if (fio) {
          tooltip.innerHTML = fio.replace(/\n/g, "<br>");
          tooltip.style.display = "block";
        }
      });
      item.addEventListener("mousemove", (e) => {
        var tw = tooltip.offsetWidth,
          th = tooltip.offsetHeight;
        var x = e.clientX + 10,
          y = e.clientY + 10;
        tooltip.style.maxWidth = window.innerWidth * 0.8 + "px";
        if (x + tw > window.innerWidth) x = e.clientX - tw - 10;
        if (y + th > window.innerHeight) y = e.clientY - th - 10;
        if (x < 0) x = 10;
        tooltip.style.top = y + "px";
        tooltip.style.left = x + "px";
      });
      item.addEventListener("mouseleave", () => (tooltip.style.display = "none"));
    });
  };

  renderSchema();
}


