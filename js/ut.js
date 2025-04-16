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
function _regeneratorRuntime() {
  "use strict";
  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime =
    function _regeneratorRuntime() {
      return e;
    };
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o =
      Object.defineProperty ||
      function (t, e, r) {
        t[e] = r.value;
      },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return (
      Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }),
      t[e]
    );
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return (t[e] = r);
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return { type: "normal", arg: t.call(e, r) };
    } catch (t) {
      return { type: "throw", arg: t };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g =
    (GeneratorFunctionPrototype.prototype =
    Generator.prototype =
      Object.create(p));
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await")
          ? e.resolve(h.__await).then(
              function (t) {
                invoke("next", t, i, a);
              },
              function (t) {
                invoke("throw", t, i, a);
              }
            )
          : e.resolve(h).then(
              function (t) {
                (u.value = t), i(u);
              },
              function (t) {
                return invoke("throw", t, i, a);
              }
            );
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return (r = r
          ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg)
          : callInvokeWithMethodAndArg());
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return { value: t, done: !0 };
      }
      for (n.method = i, n.arg = a; ; ) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;
        else if ("throw" === n.method) {
          if (o === h) throw ((o = s), n.arg);
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (((o = n.done ? s : l), p.arg === y)) continue;
          return { value: p.arg, done: n.done };
        }
        "throw" === p.type && ((o = s), (n.method = "throw"), (n.arg = p.arg));
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t)
      return (
        (r.delegate = null),
        ("throw" === n &&
          e.iterator["return"] &&
          ((r.method = "return"),
          (r.arg = t),
          maybeInvokeDelegate(e, r),
          "throw" === r.method)) ||
          ("return" !== n &&
            ((r.method = "throw"),
            (r.arg = new TypeError(
              "The iterator does not provide a '" + n + "' method"
            )))),
        y
      );
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type)
      return (r.method = "throw"), (r.arg = i.arg), (r.delegate = null), y;
    var a = i.arg;
    return a
      ? a.done
        ? ((r[e.resultName] = a.value),
          (r.next = e.nextLoc),
          "return" !== r.method && ((r.method = "next"), (r.arg = t)),
          (r.delegate = null),
          y)
        : a
      : ((r.method = "throw"),
        (r.arg = new TypeError("iterator result is not an object")),
        (r.delegate = null),
        y);
  }
  function pushTryEntry(t) {
    var e = { tryLoc: t[0] };
    1 in t && (e.catchLoc = t[1]),
      2 in t && ((e.finallyLoc = t[2]), (e.afterLoc = t[3])),
      this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    (e.type = "normal"), delete e.arg, (t.completion = e);
  }
  function Context(t) {
    (this.tryEntries = [{ tryLoc: "root" }]),
      t.forEach(pushTryEntry, this),
      this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length; )
              if (n.call(e, o))
                return (next.value = e[o]), (next.done = !1), next;
            return (next.value = t), (next.done = !0), next;
          };
        return (i.next = i);
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return (
    (GeneratorFunction.prototype = GeneratorFunctionPrototype),
    o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }),
    o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }),
    (GeneratorFunction.displayName = define(
      GeneratorFunctionPrototype,
      u,
      "GeneratorFunction"
    )),
    (e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return (
        !!e &&
        (e === GeneratorFunction ||
          "GeneratorFunction" === (e.displayName || e.name))
      );
    }),
    (e.mark = function (t) {
      return (
        Object.setPrototypeOf
          ? Object.setPrototypeOf(t, GeneratorFunctionPrototype)
          : ((t.__proto__ = GeneratorFunctionPrototype),
            define(t, u, "GeneratorFunction")),
        (t.prototype = Object.create(g)),
        t
      );
    }),
    (e.awrap = function (t) {
      return { __await: t };
    }),
    defineIteratorMethods(AsyncIterator.prototype),
    define(AsyncIterator.prototype, c, function () {
      return this;
    }),
    (e.AsyncIterator = AsyncIterator),
    (e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r)
        ? a
        : a.next().then(function (t) {
            return t.done ? t.value : a.next();
          });
    }),
    defineIteratorMethods(g),
    define(g, u, "Generator"),
    define(g, a, function () {
      return this;
    }),
    define(g, "toString", function () {
      return "[object Generator]";
    }),
    (e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return (
        r.reverse(),
        function next() {
          for (; r.length; ) {
            var t = r.pop();
            if (t in e) return (next.value = t), (next.done = !1), next;
          }
          return (next.done = !0), next;
        }
      );
    }),
    (e.values = values),
    (Context.prototype = {
      constructor: Context,
      reset: function reset(e) {
        if (
          ((this.prev = 0),
          (this.next = 0),
          (this.sent = this._sent = t),
          (this.done = !1),
          (this.delegate = null),
          (this.method = "next"),
          (this.arg = t),
          this.tryEntries.forEach(resetTryEntry),
          !e)
        )
          for (var r in this)
            "t" === r.charAt(0) &&
              n.call(this, r) &&
              !isNaN(+r.slice(1)) &&
              (this[r] = t);
      },
      stop: function stop() {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function dispatchException(e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return (
            (a.type = "throw"),
            (a.arg = e),
            (r.next = n),
            o && ((r.method = "next"), (r.arg = t)),
            !!o
          );
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function abrupt(t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (
            o.tryLoc <= this.prev &&
            n.call(o, "finallyLoc") &&
            this.prev < o.finallyLoc
          ) {
            var i = o;
            break;
          }
        }
        i &&
          ("break" === t || "continue" === t) &&
          i.tryLoc <= e &&
          e <= i.finallyLoc &&
          (i = null);
        var a = i ? i.completion : {};
        return (
          (a.type = t),
          (a.arg = e),
          i
            ? ((this.method = "next"), (this.next = i.finallyLoc), y)
            : this.complete(a)
        );
      },
      complete: function complete(t, e) {
        if ("throw" === t.type) throw t.arg;
        return (
          "break" === t.type || "continue" === t.type
            ? (this.next = t.arg)
            : "return" === t.type
            ? ((this.rval = this.arg = t.arg),
              (this.method = "return"),
              (this.next = "end"))
            : "normal" === t.type && e && (this.next = e),
          y
        );
      },
      finish: function finish(t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t)
            return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      catch: function _catch(t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function delegateYield(e, r, n) {
        return (
          (this.delegate = { iterator: values(e), resultName: r, nextLoc: n }),
          "next" === this.method && (this.arg = t),
          y
        );
      }
    }),
    e
  );
}
function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
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
//var host='https://dimazua.github.io/allLs/data/';
var buttons =
  '\n<div class="buttons-container">\n  <button onclick="exportTableToExcel(\'download\')" class="xls-button" title="\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0432 Excel">\n    <img src="img/xlsdownload.png" alt="Excel Icon" class="xls-icon">\n  </button>\n  <button onclick="exportTableToExcel(\'clipboard\')" class="xls-button" title="\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C">\n    <img src="img/copy.svg" alt="Copy Icon" class="xls-icon">\n  </button>\n  <button onclick="captureAndCopy()" class="xls-button" title="\u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0442\u0430\u0431\u043B\u0438\u0446\u044B">\n    <img src="img/screenshot.png" alt="Screenshot Icon" class="xls-icon">\n  </button>\n</div>\n';
host = "data/";
var monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек"
];
function initPosters() {
  var sidebar = document.querySelector(".sidebar"); // Предположим, что у панели есть класс 'sidebar'

  document.querySelectorAll(".poster").forEach(function (cell) {
    var tooltip = cell.querySelector(".descr");
    var hideTimeout;
    cell.addEventListener("mouseenter", function (event) {
      if (!isCursorOverSidebar(event, sidebar)) {
        clearTimeout(hideTimeout);
        tooltip.style.display = "block";
        positionTooltip(event, tooltip);
      }
    });
    cell.addEventListener("mousemove", function (event) {
      if (!isCursorOverSidebar(event, sidebar)) {
        tooltip.style.display = "block";
        positionTooltip(event, tooltip);
      } else {
        tooltip.style.display = "none"; // Прячем подсказку, если над панелью
      }
    });
    cell.addEventListener("mouseleave", function () {
      hideTimeout = setTimeout(function () {
        return (tooltip.style.display = "none");
      }, 200);
    });
  });
}

// Функция для проверки, находится ли курсор над боковой панелью
function isCursorOverSidebar(event, sidebar) {
  if (!sidebar) return false;
  var _sidebar$getBoundingC = sidebar.getBoundingClientRect(),
    left = _sidebar$getBoundingC.left,
    top = _sidebar$getBoundingC.top,
    right = _sidebar$getBoundingC.right,
    bottom = _sidebar$getBoundingC.bottom;
  return (
    event.clientX >= left &&
    event.clientX <= right &&
    event.clientY >= top &&
    event.clientY <= bottom
  );
}
function positionTooltip(event, tooltip) {
  var mouseX = event.clientX,
    mouseY = event.clientY;
  var tooltipWidth = tooltip.offsetWidth,
    tooltipHeight = tooltip.offsetHeight;
  var _window = window,
    windowWidth = _window.innerWidth,
    windowHeight = _window.innerHeight;
  var tooltipX = mouseX + 10; // Отступ справа от курсора
  var tooltipY = mouseY + 10; // Отступ снизу от курсора

  // Проверка, чтобы подсказка не выходила за правый край окна
  if (tooltipX + tooltipWidth > windowWidth) {
    tooltipX = mouseX - tooltipWidth - 10; // Перемещаем подсказку влево
  }

  // Проверка, чтобы подсказка не выходила за левый край окна
  if (tooltipX < 0) {
    tooltipX = 10; // Ограничиваем минимальным отступом
  }

  // Проверка, чтобы подсказка не выходила за нижний край окна
  if (tooltipY + tooltipHeight > windowHeight) {
    tooltipY = mouseY - tooltipHeight - 10; // Перемещаем подсказку вверх
  }

  // Проверка, чтобы подсказка не выходила за верхний край окна
  if (tooltipY < 0) {
    tooltipY = 10; // Ограничиваем минимальным отступом
  }

  // Устанавливаем позицию подсказки
  tooltip.style.left = "".concat(tooltipX, "px");
  tooltip.style.top = "".concat(tooltipY, "px");
}
Number.prototype.toFixedWithComma = function () {
  var decimals =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(this);
};
function loadScriptFromHtml(scriptName, callback) {
  var preloader = document.getElementById("preloader");
  var hasLoaded = false; // Флаг для отслеживания успешной загрузки
  var preloaderTimeout;

  // Показываем прелоадер, если загрузка длится больше 1.5 секунд
  preloaderTimeout = setTimeout(function () {
    preloader.style.display = "flex";
  }, 1500);

  // Функция загрузки скрипта
  function loadScript() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = host + scriptName; // Формируем путь

      script.async = true;
      script.onload = function () {
        return resolve();
      }; // Успешная загрузка
      script.onerror = function () {
        return reject();
      }; // Ошибка загрузки

      document.head.appendChild(script);
    });
  }

  // Загружаем скрипт
  loadScript()
    .then(function () {
      if (hasLoaded) return; // Если скрипт уже загружен, ничего не делаем

      console.log(
        "\u0421\u043A\u0440\u0438\u043F\u0442 "
          .concat(
            scriptName,
            " \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u0441 \u0445\u043E\u0441\u0442\u0430: "
          )
          .concat(host)
      );
      clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если загрузка успешна
      preloader.style.display = "none"; // Скрываем прелоадер

      hasLoaded = true; // Устанавливаем флаг успешной загрузки

      if (callback) callback(); // Вызов коллбэка, если он был передан
    })
    ["catch"](function (error) {
      console.error("Ошибка при загрузке скрипта:", error);
      console.error("Сообщение ошибки:", error.message);
      console.error("Стек вызовов:", error.stack);
      clearTimeout(preloaderTimeout); // Останавливаем прелоадер, если произошла ошибка
      preloader.style.display = "none"; // Скрываем прелоадер
    });
}
// Функция для выбора правильной формы слова в зависимости от числа
function okon(number, form1, form2, form3) {
  var lastDigit = number % 10;
  var lastTwoDigits = number % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return form2; // Если заканчивается на 1 (кроме 11)
  } else if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 10 || lastTwoDigits >= 20)
  ) {
    return form3; // Если заканчивается на 2, 3 или 4 (кроме 12, 13, 14)
  } else {
    return form1; // Все остальные случаи (0, 5, 6, 7, 8, 9 и т.д.)
  }
}

// Функция для вычисления времени "сколько времени назад"
function timeAgo(dateString) {
  var now = new Date(); // Текущая дата и время
  var pastDate = new Date(
    dateString.replace(
      /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/,
      "$3-$2-$1T$4:$5:$6"
    )
  ); // Преобразуем строку в формат ISO 8601

  var diffInMs = now - pastDate; // Разница в миллисекундах
  var diffInSeconds = Math.floor(diffInMs / 1000); // Переводим в секунды
  var diffInMinutes = Math.floor(diffInSeconds / 60); // Переводим в минуты
  var diffInHours = Math.floor(diffInMinutes / 60); // Переводим в часы
  var diffInDays = Math.floor(diffInHours / 24); // Переводим в дни

  var result = "";

  // Используем функцию okon для выбора правильных окончаний
  if (diffInDays > 0) {
    result += ""
      .concat(diffInDays, " ")
      .concat(okon(diffInDays, "дней", "день", "дня"), " ");
  }
  if (diffInHours % 24 > 0) {
    result += ""
      .concat(diffInHours % 24, " ")
      .concat(okon(diffInHours % 24, "часов", "час", "часа"), " ");
  }
  if (diffInMinutes % 60 > 0) {
    result += ""
      .concat(diffInMinutes % 60, " ")
      .concat(okon(diffInMinutes % 60, "минут", "минута", "минуты"), " ");
  }
  return result || "Менее минуты назад";
}
function setParam(paramName, paramValue) {
  // Извлекаем параметры URL
  var urlParams = new URLSearchParams(window.location.search);

  // Удаляем старый параметр, если он существует
  urlParams["delete"](paramName);

  // Добавляем новый параметр
  urlParams.append(paramName, paramValue);

  // Формируем новый URL
  var newUrl = ""
    .concat(window.location.pathname, "?")
    .concat(urlParams.toString());

  // Обновляем адресную строку
  history.replaceState(null, "", newUrl);

  // Сохраняем параметр в localStorage с ключом 'last_paramName'
  localStorage.setItem("last_".concat(paramName), paramValue);
}
function getParam(paramName) {
  // Проверяем поддержку URLSearchParams
  if (typeof URLSearchParams === "function") {
    // Извлекаем параметры из URL
    var urlParams = new URLSearchParams(window.location.search);

    // Проверяем, есть ли параметр в URL
    if (urlParams.has(paramName)) {
      return urlParams.get(paramName); // Если параметр найден в URL, возвращаем его значение
    }
  } else {
    // Если URLSearchParams не поддерживается, используем альтернативу
    var query = window.location.search.substring(1); // Убираем "?" в начале строки
    var params = query.split("&"); // Разбиваем строку на пары ключ-значение
    for (var i = 0; i < params.length; i++) {
      var pair = params[i].split("=");
      if (decodeURIComponent(pair[0]) === paramName) {
        return decodeURIComponent(pair[1]); // Возвращаем значение параметра
      }
    }
  }

  // Если параметр не найден в URL, пытаемся найти его в localStorage
  var storedValue = localStorage.getItem("last_" + paramName);
  if (storedValue) {
    return storedValue; // Возвращаем значение из localStorage
  }

  // Если параметр не найден ни в URL, ни в localStorage, возвращаем null
  return null;
}

// Функция для преобразования номера месяца в название
function getMonthName(month) {
  var monthNames = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень"
  ];
  return monthNames[month - 1];
}
function formatDate(date, format) {
  if (!format) format = "YYYY-MM-DD";
  var day = String(date.getDate());
  var month = String(date.getMonth() + 1);
  var year = date.getFullYear();
  var yearShort = String(year).slice(-2); // Последние две цифры года

  // Заменяем в строке формата соответствующие компоненты
  return format
    .replace("dd", day.padStart(2, "0")) // Двузначный день
    .replace("d", day) // Одиночный день
    .replace("mmmm", monthNames[month - 1])
    .replace("mmm", monthNames[month * 1 + 11])
    .replace("mm", month.padStart(2, "0"))
    .replace("m", month)
    .replace("yyyy", year)
    .replace("yy", yearShort)
    .replace("y", yearShort)
    .replace("DD", day.padStart(2, "0")) // Двузначный день
    .replace("D", day) // Одиночный день
    .replace("MMMM", monthNames[month - 1])
    .replace("MMM", monthNames[month * 1 + 11])
    .replace("MM", month.padStart(2, "0"))
    .replace("M", month)
    .replace("YYYY", year)
    .replace("YY", yearShort)
    .replace("Y", yearShort);
}
function fillMissingDates(nach) {
  for (var id in nach) {
    var years = [];
    for (var key in nach[id]) {
      if (nach[id].hasOwnProperty(key)) {
        years.push(Number(key));
      }
    }
    years.sort(function (a, b) {
      return a - b;
    });
    var minYear = years[0];
    var maxYear = years[years.length - 1];

    // Найти последний заполненный месяц в последнем году
    var lastYearMonths = [];
    for (var monthKey in nach[id][maxYear]) {
      if (nach[id][maxYear].hasOwnProperty(monthKey)) {
        lastYearMonths.push(Number(monthKey));
      }
    }
    var lastMonth = Math.max.apply(null, lastYearMonths);

    // Пройтись по всем годам от минимального до последнего года
    for (var year = minYear; year <= maxYear; year++) {
      if (!nach[id][year]) {
        nach[id][year] = {};
      }

      // Пройтись по всем месяцам от 1 до 12
      var maxMonth = year === maxYear ? lastMonth : 12;
      for (var month = 1; month <= maxMonth; month++) {
        if (!nach[id][year][month]) {
          nach[id][year][month] = {
            1: 0
          };
        }
      }
    }

    // Убедиться, что ключи отсортированы
    var sortedNach = {};
    var sortedYears = Object.keys(nach[id]).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < sortedYears.length; i++) {
      var year = sortedYears[i];
      sortedNach[year] = {};
      var sortedMonths = Object.keys(nach[id][year]).sort(function (a, b) {
        return a - b;
      });
      for (var j = 0; j < sortedMonths.length; j++) {
        var month = sortedMonths[j];
        sortedNach[year][month] = nach[id][year][month];
      }
    }
    nach[id] = sortedNach;
  }
}
function isMonth(sdat, monthOffset) {
  monthOffset = typeof monthOffset === "undefined" ? 0 : monthOffset;
  var currentDate = new Date();

  // Получаем первый день текущего месяца
  var currentMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  // Если monthOffset не равен 0, сдвигаем текущий месяц на нужное количество месяцев
  var targetMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + monthOffset,
    1
  );

  // Преобразуем sdat в первый день месяца той же даты
  var sdatStartOfMonth = new Date(sdat.getFullYear(), sdat.getMonth(), 1);

  // Проверяем, совпадает ли месяц и год с учетом сдвига
  return sdatStartOfMonth.getTime() === targetMonthStart.getTime();
}

// Функция для преобразования числа Год*12 + Месяц в дату (1-е число месяца)
function convertToDate(monthNumber) {
  if (!monthNumber) return 0;
  var year = Math.floor(monthNumber / 12); // Получаем год
  var month = monthNumber % 12; // Получаем месяц (от 0 до 11, поэтому добавим 1 для правильной даты)
  if (month === 0) {
    year -= 1;
    month = 12; // Январь следующего года
  }
  return new Date(year, month - 1, 1); // Возвращаем 1-е число месяца
}

// Дебаунс-функция для уменьшения количества вызовов
function debounce(func, delay) {
  var timeoutId;
  return function () {
    var _this = this;
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      return func.apply(_this, args);
    }, delay);
  };
}
function showMessage(messageText) {
  var messageElement = document.getElementById("message");
  messageElement.textContent = messageText; // Устанавливаем текст сообщения
  messageElement.style.display = "block"; // Показываем сообщение

  // Через 3 секунды скрываем сообщение
  setTimeout(function () {
    messageElement.style.display = "none";
  }, 3000);
}
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      // Показываем сообщение "Ключ скопирован"
      showMessage("Ключ скопирован в буфер обмена!");
    })
    ["catch"](function (err) {
      console.error("Ошибка при копировании: ", err);
    });
}
// Функция для форматирования чисел (с двумя знаками после запятой)
var formatNumber = function formatNumber(num) {
  return num.toFixed(2).replace(/\.00$/, "") * 1;
};

// Функция для извлечения скрытого текста из <div class="descr">
function extractHiddenText(td) {
  var hiddenDiv = td.querySelector(".descr");
  if (!hiddenDiv) return "";
  var text = "";

  // Если внутри есть просто текст
  if (hiddenDiv.textContent.trim()) {
    text += hiddenDiv.textContent.trim();
  }

  // Если внутри есть таблица
  var subTable = hiddenDiv.querySelector(".subtable");
  if (subTable) {
    var rows = Array.from(subTable.querySelectorAll("tr"));
    text +=
      "\n\n" +
      rows
        .map(function (row) {
          var cols = Array.from(row.querySelectorAll("th, td")).map(function (
            cell
          ) {
            return cell.innerText.trim();
          });
          return cols.join(" | ");
        })
        .join("\n");
  }
  return text.trim();
}

// Функция для получения месяца и года в формате ММ.ГГГГ
function getMonthYear(actionCode) {
  var monthYear = "";
  if (actionCode === "list") {
    var monthInput = document.getElementById("end-date");
    var dateValue = monthInput.value;
    if (dateValue) {
      var _dateValue$split = dateValue.split("-"),
        _dateValue$split2 = _slicedToArray(_dateValue$split, 2),
        year = _dateValue$split2[0],
        month = _dateValue$split2[1];
      monthYear = "".concat(month.padStart(2, "0"), ".").concat(year);
    }
  } else if (actionCode === "payments") {
    var selectMonth = document.getElementById("monthSelect");
    var selectedOption = selectMonth.value;
    if (selectedOption) {
      var _selectedOption$split = selectedOption.split("-"),
        _selectedOption$split2 = _slicedToArray(_selectedOption$split, 2),
        _year = _selectedOption$split2[0],
        _month = _selectedOption$split2[1];
      monthYear = "".concat(_month.padStart(2, "0"), ".").concat(_year);
    }
  } else if (actionCode === "bank") {
    var dateInput = document.getElementById("toDate");
    var _dateValue = dateInput.value;
    if (_dateValue) {
      var _month2 = _dateValue.split("-")[1];
      var _year2 = _dateValue.split("-")[0];
      monthYear = "".concat(_month2.padStart(2, "0"), ".").concat(_year2);
    }
  }
  return monthYear;
}

// Функция для генерации имени файла
function generateFileName(home, actionCode) {
  var name = home.name;

  // Проверяем наличие текста в кавычках
  var match = name.match(/"([^"]+)"/);
  if (match) {
    // Если текст в кавычках есть, берем первые три буквы из него
    name = match[1].substring(0, 3);
  } else {
    // Иначе убираем "ЖК" или "ОСББ" и пробелы в начале
    name = name.replace(/^(ЖК|ОСББ)\s*/i, "").substring(0, 3);
  }

  // Добавляем код действия в имя файла
  var actionSuffix = "";
  if (actionCode === "list") {
    actionSuffix = "_ЛС_";
  } else if (actionCode === "payments") {
    actionSuffix = "_оплаты_";
  } else if (actionCode === "bank") {
    actionSuffix = "_банк_";
  }

  // Получаем месяц и год в нужном формате
  var monthYear = getMonthYear(actionCode);
  return "".concat(name).concat(actionSuffix).concat(monthYear, ".xlsx");
}
function isElementVisible(el) {
  while (el) {
    var style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return false;
    }
    el = el.parentElement;
  }
  return true;
}
function parseCellValue(value) {
  var trimmedValue = value.replace(/\u00A0/g, " ").trim();

  // Списки месяцев
  var monthNamesUA = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень"
  ];
  var monthNamesRU = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ];
  var monthShortRU = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек"
  ];

  // Проверка на формат "Месяц Год"
  var monthYearPattern =
    /^([\u0404\u0406\u0407\u0410-\u044F\u0454\u0456\u0457\u1C80-\u1C83\u1C85\u1C86]+)[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]([0-9]{4})$/i;
  var match = trimmedValue.match(monthYearPattern);
  if (match) {
    var monthName = match[1].toLowerCase(); // Делаем регистр независимым
    var year = parseInt(match[2], 10);

    // Ищем месяц в списках
    var monthIndex = monthNamesUA.findIndex(function (m) {
      return m.toLowerCase() === monthName;
    });
    if (monthIndex === -1) {
      monthIndex = monthNamesRU.findIndex(function (m) {
        return m.toLowerCase() === monthName;
      });
    }
    if (monthIndex === -1) {
      monthIndex = monthShortRU.findIndex(function (m) {
        return m.toLowerCase() === monthName;
      });
    }
    if (monthIndex !== -1) {
      // Создаём дату в UTC
      return new Date(Date.UTC(year, monthIndex, 1));
    }
  }

  // Если это "0,00" или "0.00", возвращаем null
  if (
    trimmedValue === "0,00" ||
    trimmedValue === "0.00" ||
    trimmedValue === "0" ||
    trimmedValue === "0.0" ||
    trimmedValue === "0,0"
  ) {
    return 0;
  }

  // Проверка на числа
  var numberPattern = /^[+-]?\d{1,3}([ \u00A0\d]*)?([.,]\d+)?$/;
  if (
    numberPattern.test(trimmedValue) &&
    !trimmedValue.startsWith("0") &&
    trimmedValue !== "0"
  ) {
    var normalizedNumber = trimmedValue
      .replace(/[\s\u00A0]+/g, "")
      .replace(",", ".");
    var parsedNumber = parseFloat(normalizedNumber);
    if (!isNaN(parsedNumber)) return parsedNumber;
  }

  // Проверка на дату в формате DD.MM.YYYY
  var datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/;
  match = trimmedValue.match(datePattern);
  if (match) {
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10) - 1; // Месяцы начинаются с 0 (январь = 0)
    var _year3 = parseInt(match[3], 10);

    // Если год двухзначный, добавляем 2000
    if (_year3 < 100) {
      _year3 += 2000;
    }

    // Проверяем, что день существует в месяце (например, 31 февраля — это ошибка)
    var _date = new Date(_year3, month, day);

    // Если дата невалидна (например, 31 февраля), создаём некорректную дату
    if (
      _date.getDate() === day &&
      _date.getMonth() === month &&
      _date.getFullYear() === _year3
    ) {
      // Преобразуем в UTC
      return new Date(Date.UTC(_year3, month, day));
    }
  }
  // Проверка на дату с помощью конструктора Date (например, для форматов MM/DD/YYYY)
  var date = new Date(trimmedValue);
  if (!isNaN(date.getTime())) {
    // Преобразуем обычную дату в UTC и возвращаем
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
  }

  // Если это не дата и не число, возвращаем исходное значение
  return value;
}
function handleHeaders(tableCopy, ws) {
  var thead = tableCopy.querySelector("thead");
  if (thead) {
    var headerRows = Array.from(thead.querySelectorAll("tr"));

    // Определяем, с какой строки начинать новый заголовок
    var startRowIndex = ws.rowCount + 1;

    // Добавляем пустую строку перед новым заголовком, если это не первая таблица
    if (ws.rowCount > 0) {
      ws.addRow([]);
      startRowIndex++;
    }

    // Массив для отслеживания занятых ячеек по колонкам
    var occupiedCells = [];
    headerRows.forEach(function (row, rowIndex) {
      var cells = Array.from(row.querySelectorAll("td, th"));
      var currentColIndex = 0; // Индекс текущей колонки

      cells.forEach(function (cell) {
        // Пропускаем занятые ячейки
        while (
          occupiedCells[rowIndex] &&
          occupiedCells[rowIndex][currentColIndex]
        ) {
          currentColIndex++;
        }
        var colspan = parseInt(cell.getAttribute("colspan")) || 1;
        var rowspan = parseInt(cell.getAttribute("rowspan")) || 1;

        // Записываем значение в Excel
        var cellValue = cell.innerText.trim();
        var excelCell = ws.getCell(
          startRowIndex + rowIndex,
          currentColIndex + 1
        );
        excelCell.value = cellValue;

        // Отмечаем занятые ячейки
        for (var i = 0; i < colspan; i++) {
          if (!occupiedCells[rowIndex]) {
            occupiedCells[rowIndex] = [];
          }
          occupiedCells[rowIndex][currentColIndex + i] = true;
        }
        if (rowspan > 1) {
          for (var _i = 1; _i < rowspan; _i++) {
            if (!occupiedCells[rowIndex + _i]) {
              occupiedCells[rowIndex + _i] = [];
            }
            occupiedCells[rowIndex + _i][currentColIndex] = true;
          }
        }

        // Объединяем ячейки, если есть colspan и rowspan
        if (colspan > 1) {
          ws.mergeCells(
            startRowIndex + rowIndex,
            currentColIndex + 1,
            startRowIndex + rowIndex,
            currentColIndex + colspan
          );
        }
        if (rowspan > 1) {
          ws.mergeCells(
            startRowIndex + rowIndex,
            currentColIndex + 1,
            startRowIndex + rowIndex + rowspan - 1,
            currentColIndex + 1
          );
        }

        // Двигаемся к следующей колонке
        currentColIndex++;
      });
    });
  }
}
function exportTableToExcel() {
  return _exportTableToExcel.apply(this, arguments);
}
function _exportTableToExcel() {
  _exportTableToExcel = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee() {
      var action,
        mainContainer,
        tables,
        wb,
        ws,
        buffer,
        blob,
        link,
        homeCode,
        actionCode,
        home,
        fileName,
        clipboardData,
        rows,
        _args = arguments;
      return _regeneratorRuntime().wrap(
        function _callee$(_context) {
          while (1)
            switch ((_context.prev = _context.next)) {
              case 0:
                action =
                  _args.length > 0 && _args[0] !== undefined
                    ? _args[0]
                    : "download";
                mainContainer = document.getElementById("maincontainer");
                if (mainContainer) {
                  _context.next = 5;
                  break;
                }
                showMessage("Контейнер с id='maincontainer' не найден");
                return _context.abrupt("return");
              case 5:
                // Ищем все видимые таблицы
                tables = Array.from(
                  mainContainer.querySelectorAll(
                    "#banktable, #paytable, .main, #main"
                  )
                ).filter(function (el) {
                  while (el) {
                    var style = window.getComputedStyle(el);
                    if (
                      style.display === "none" ||
                      style.visibility === "hidden" ||
                      style.opacity === "0"
                    ) {
                      return false;
                    }
                    el = el.parentElement;
                  }
                  return true;
                });
                if (!(tables.length === 0)) {
                  _context.next = 9;
                  break;
                }
                showMessage("Нет видимых таблиц");
                return _context.abrupt("return");
              case 9:
                wb = new ExcelJS.Workbook();
                ws = wb.addWorksheet("Sheet1"); // Обрабатываем таблицы
                tables.forEach(function (table) {
                  // Создаем копию таблицы, чтобы не модифицировать оригинальную
                  var tableCopy = table.cloneNode(true);

                  // Удаляем все элементы .descr из копии
                  var descrElements = tableCopy.querySelectorAll(".descr");
                  descrElements.forEach(function (el) {
                    return el.remove();
                  });

                  // Обработка заголовков таблицы с учетом colspan и rowspan
                  handleHeaders(tableCopy, ws);

                  // Извлекаем данные из строк таблицы
                  handleRows(tableCopy, ws);
                });
                if (!(action === "download")) {
                  _context.next = 28;
                  break;
                }
                _context.next = 15;
                return wb.xlsx.writeBuffer();
              case 15:
                buffer = _context.sent;
                blob = new Blob([buffer], {
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });
                link = document.createElement("a");
                link.href = URL.createObjectURL(blob);

                // Получаем код дома и код действия
                homeCode = getParam("homeCode");
                actionCode = getParam("actionCode");
                home = homes.find(function (home) {
                  return home.code === homeCode;
                });
                fileName = generateFileName(home, actionCode);
                link.download = fileName;
                link.click();
                showMessage(
                  "\u0424\u0430\u0439\u043B ".concat(
                    fileName,
                    " \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D \u0432 \u043F\u0430\u043F\u043A\u0443 \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0438"
                  )
                );
                _context.next = 41;
                break;
              case 28:
                if (!(action === "clipboard")) {
                  _context.next = 41;
                  break;
                }
                // Копирование данных в буфер обмена
                clipboardData = ""; // Получаем данные из строк рабочего листа (ws)
                rows = ws.getRows(1, ws.rowCount); // Получаем все строки из листа
                rows.forEach(function (row) {
                  var rowData = [];

                  // Проходим по каждой ячейке в строке
                  row.eachCell(function (cell, colNumber) {
                    // Проверяем, является ли ячейка объединенной
                    if (cell.isMerged) {
                      // Для объединенных ячеек добавляем пустые значения в остальные ячейки объединенной области
                      if (rowData[colNumber - 1] === undefined) {
                        rowData[colNumber - 1] = parseCellValue1(cell.text);
                      }
                    } else {
                      rowData[colNumber - 1] = parseCellValue1(cell.text || ""); // Добавляем обработанное значение ячейки
                    }
                  });

                  // Формируем строку для буфера обмена
                  clipboardData += rowData.join("\t") + "\n"; // Разделение ячеек табуляцией
                });
                _context.prev = 32;
                _context.next = 35;
                return navigator.clipboard.writeText(clipboardData);
              case 35:
                showMessage("Данные скопированы в буфер обмена!");
                _context.next = 41;
                break;
              case 38:
                _context.prev = 38;
                _context.t0 = _context["catch"](32);
                showMessage("Не удалось скопировать данные в буфер обмена.");
              case 41:
              case "end":
                return _context.stop();
            }
        },
        _callee,
        null,
        [[32, 38]]
      );
    })
  );
  return _exportTableToExcel.apply(this, arguments);
}
function handleRows(tableCopy, ws) {
  var tbody = tableCopy.querySelector("tbody");
  if (tbody) {
    var rows = Array.from(tbody.querySelectorAll("tr")); // Массив строк из tbody
    var colorIndex = 0; // Индекс для смены цветов
    var colors = [
      "FFFF99",
      "99FF99",
      "99CCFF",
      "FF9999",
      "CC99FF",
      "FFCC99",
      "CCCCCC"
    ]; // Набор цветов
    var rowIndex = 0;
    rows.forEach(function (row) {
      var rowData = []; // Данные текущей строки
      var nextRowDataArray = []; // Данные всех следующих строк .paysubtable

      // Перебираем все ячейки в строке
      var cells = Array.from(row.querySelectorAll("td"));
      cells.forEach(function (cell, cellIndex) {
        var paysubtable = cell.querySelector(".paysubtable"); // Находим .paysubtable в ячейке

        if (paysubtable) {
          var nestedRows = paysubtable.querySelectorAll("tr");
          if (nestedRows.length > 0) {
            // Добавляем первую строку вложенной таблицы в текущую строку
            var firstNestedRow = nestedRows[0];
            var firstNestedCells = firstNestedRow.querySelectorAll("td");
            rowData.push(firstNestedCells[1].innerText.trim());

            // Запоминаем индекс столбца, куда вставили значение
            var paySubtableColumnIndex = rowData.length - 1;

            // Обрабатываем все строки кроме первой
            nestedRows.forEach(function (nestedRow, nestedRowIndex) {
              if (nestedRowIndex > 0) {
                var nestedCells = nestedRow.querySelectorAll("td");
                var nextRowData = Array(rowData.length).fill(""); // Заполняем пустыми ячейками
                nextRowData[paySubtableColumnIndex] =
                  nestedCells[1].innerText.trim();
                nextRowDataArray.push(nextRowData);
              }
            });
          }
        } else {
          if (cell.closest(".paysubtable") == null) {
            rowData.push(cell.innerText.trim());
          }
        }
      });
      if (rowData.length) {
        // Обрабатываем основную строку
        var excelRow = rowData.map(function (cell) {
          return parseCellValue(cell);
        });
        ws.addRow(excelRow);
        rowIndex++;

        // Обрабатываем все строки из nextRowDataArray
        nextRowDataArray.forEach(function (nextRowData) {
          var excelNextRowData = nextRowData.map(function (cell) {
            return parseCellValue(cell);
          });
          ws.addRow(excelNextRowData);
          rowIndex++;
        });
      }
    });
  }
}
function parseCellValue1(value) {
  // Если значение является числом и не равно 0, пропускаем дальнейшую обработку
  if (typeof value === "number") {
    return value.toString().replace(".", ","); // Заменяем точку на запятую для чисел
  }

  // Проверяем, является ли значение числом (и не 0) для строковых значений
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    return value.replace(".", ","); // Заменяем точку на запятую только для чисел
  }

  // Проверка, является ли значение валидной датой
  var trimmedValue = value.trim();
  var date = new Date(trimmedValue);

  // Проверка на валидную дату
  if (!isNaN(date.getTime()) && isNaN(parseFloat(trimmedValue))) {
    var currentYear = new Date().getFullYear();
    var minYear = 2000;
    var maxYear = currentYear + 10;

    // Проверяем, что год в пределах от 2000 до текущего года + 10
    if (date.getUTCFullYear() >= minYear && date.getUTCFullYear() <= maxYear) {
      // Преобразуем в UTC и форматируем в DD.MM.YYYY
      var day = String(date.getUTCDate()).padStart(2, "0"); // Делаем день двузначным
      var month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0, поэтому +1
      var year = date.getUTCFullYear();

      // Возвращаем дату в формате DD.MM.YYYY
      return "".concat(day, ".").concat(month, ".").concat(year);
    }
  }

  // Если не дата или дата вне диапазона, возвращаем исходное значение
  return value;
}


function captureAndCopy() {
  var mainContainer = document.getElementById("maincontainer");
  var tables = Array.from(
    mainContainer.querySelectorAll("#banktable, #paytable, .main, #main")
  ).filter(function (el) {
    while (el) {
      var style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }
      el = el.parentElement;
    }
    return true;
  });

  if (tables.length > 0) {
    var parentElement = tables[0].parentElement;

    if (getParam("actionCode") == "accounts") {
      var address = document.getElementById("adr").innerText;
      var selectElement = document.getElementById("number");
      var apartmentNumber = selectElement.options[selectElement.selectedIndex].text;
      var fio = document.getElementById("fio").innerText;
      var result = address + "" + apartmentNumber + ", " + fio;

      parentElement.insertAdjacentHTML('afterbegin', '<p class="tmp">' + result + '</p>');

      var labels = document.querySelectorAll('label');
      labels.forEach(function(label) {
        label.style.display = 'none';
      });
    }

    html2canvas(parentElement, {
      onrendered: function(canvas) {
        var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        var useModernClipboard = navigator.clipboard && window.ClipboardItem && !isFirefox;

        if (useModernClipboard) {
          canvas.toBlob(function(blob) {
            if (!blob) {
              console.error("canvas.toBlob() returned null.");
              return;
            }
            navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]).then(function() {
              showMessage("Скриншот таблицы скопирован в буфер обмена");
            }).catch(function(err) {
              console.error("Ошибка при копировании в буфер", err);
            });
          });
        } else {
          var img = new Image();
          img.src = canvas.toDataURL("image/png");
          var editableDiv = document.createElement("div");
          editableDiv.contentEditable = true;
          editableDiv.style.position = "fixed";
          editableDiv.style.left = "-9999px";
          document.body.appendChild(editableDiv);
          editableDiv.appendChild(img);

          var range = document.createRange();
          range.selectNodeContents(editableDiv);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);

          try {
            document.execCommand("copy");
            showMessage("Скриншот таблицы скопирован (устаревший метод)");
          } catch (err) {
            console.error("Ошибка копирования через execCommand", err);
          }

          document.body.removeChild(editableDiv);
        }

        setTimeout(function() {
          var labels = document.querySelectorAll('label');
          labels.forEach(function(label) {
            label.style.display = '';
          });
          var tmpElements = document.querySelectorAll('.tmp');
          tmpElements.forEach(function(element) {
            element.remove();
          });
        }, 500);
      }
    });
  }
}







