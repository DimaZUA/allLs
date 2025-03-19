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
function _createForOfIteratorHelper(r, e) {
  var t =
    ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
  if (!t) {
    if (
      Array.isArray(r) ||
      (t = _unsupportedIterableToArray(r)) ||
      (e && r && "number" == typeof r.length)
    ) {
      t && (r = t);
      var _n = 0,
        F = function F() {};
      return {
        s: F,
        n: function n() {
          return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] };
        },
        e: function e(r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError(
      "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
    );
  }
  var o,
    a = !0,
    u = !1;
  return {
    s: function s() {
      t = t.call(r);
    },
    n: function n() {
      var r = t.next();
      return (a = r.done), r;
    },
    e: function e(r) {
      (u = !0), (o = r);
    },
    f: function f() {
      try {
        a || null == t["return"] || t["return"]();
      } finally {
        if (u) throw o;
      }
    }
  };
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
var data = {};
function displayHomeInfo(homeCode) {
  var home = homes.find(function (h) {
    return h.code === homeCode;
  });
  data = home;
  var fieldMapping = {
    okpo: "code",
    ORGKR: "name",
    org: "name",
    adrfull: "adr",
    голова: "головаfull"
  };
  for (var targetField in fieldMapping) {
    var sourceField = fieldMapping[targetField];
    data[targetField] = data[targetField] || data[sourceField];
  }
  if (!home) {
    document.getElementById("maincontainer").innerHTML =
      "<h2>Информация не найдена</h2>";
    return;
  }

  // Словарь для замены ключей на понятные надписи
  var keyMap = {
    name: "Наименование",
    code: "Код ЄДРПОУ",
    adr: "Адрес",
    головаfull: "Председатель",
    Дир: "Руководитель",
    Руководителя: "В лице",
    Исп: "Исполнитель",
    email: "Электронная почта",
    tel: "Телефон",
    гб: "Бухгалтер",
    Bank: "Банк",
    "ЖК/ОСББ": "ЖК/ОСББ",
    Iban: "IBAN"
  };
  var infoHtml =
    '    <div id="dropArea">\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u0430\u0439\u043B\u044B \u0441\u044E\u0434\u0430 \u0438\u043B\u0438 \u043A\u043B\u0438\u043A\u043D\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C</div>\n    <input type="file" id="uploadFile" multiple style="display: none;">\n<h2>\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0434\u043E\u043C\u0435: '.concat(
      home.name,
      "</h2><ul>"
    );
  for (var key in home) {
    if (home.hasOwnProperty(key) && keyMap[key] && home[key]) {
      infoHtml += '<li \n                        title="['
        .concat(key, ']"\n                        onclick="copyToClipboard(\'[')
        .concat(key, "]')\">\n                        <strong>")
        .concat(keyMap[key], ":</strong> ")
        .concat(home[key], "\n                     </li>");
    }
  }
  infoHtml += "</ul>";

  // Добавляем секцию для реквизитов
  infoHtml +=
    "<style>\n                    p {\n                        margin: 0;\n                        padding: 0;\n                        line-height: 1.2;\n                    }\n                </style><h3>\u0420\u0435\u043A\u0432\u0456\u0437\u0438\u0442\u0438:</h3>";
  if (home.name)
    infoHtml += "<p>"
      .concat(home.name, " \u0432 \u043E\u0441\u043E\u0431\u0456 ")
      .concat(
        home.Руководителя,
        ", \u0449\u043E \u0434\u0456\u0454 \u043D\u0430 \u043F\u0456\u0434\u0441\u0442\u0430\u0432\u0456 \u0421\u0442\u0430\u0442\u0443\u0442\u0443,</p><br>"
      );
  if (home.name)
    infoHtml +=
      "<p><strong>\u041D\u0430\u0439\u043C\u0435\u043D\u0443\u0432\u0430\u043D\u043D\u044F:</strong> ".concat(
        home.name,
        "</p>"
      );
  if (home.adr)
    infoHtml +=
      "<p><strong>\u0410\u0434\u0440\u0435\u0441\u0430:</strong> ".concat(
        home.adr,
        "</p>"
      );
  if (home.code)
    infoHtml +=
      "<p><strong>\u041A\u043E\u0434 \u0404\u0414\u0420\u041F\u041E\u0423:</strong> ".concat(
        home.code,
        "</p>"
      );
  if (home.Iban)
    infoHtml += "<p><strong>IBAN:</strong> "
      .concat(home.Iban)
      .concat(home.Bank ? " в " + home.Bank : "", "</p>");
  if (home.email)
    infoHtml +=
      "<p><strong>\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430 \u043F\u043E\u0448\u0442\u0430:</strong> ".concat(
        home.email,
        "</p>"
      );
  if (home.tel)
    infoHtml +=
      "<p><strong>\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</strong> ".concat(
        home.tel,
        "</p>"
      );
  if (home.Podpis) infoHtml += "<p>".concat(home.Podpis, "</p>");
  document.getElementById("maincontainer").innerHTML = infoHtml;
  var dropArea = document.getElementById("dropArea");
  var fileInput = document.getElementById("uploadFile");

  // Открытие диалога выбора файлов при клике по области
  dropArea.addEventListener("click", function () {
    fileInput.click();
  });

  // Обработчик перетаскивания файлов
  dropArea.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropArea.classList.add("hover");
  });
  dropArea.addEventListener("dragleave", function () {
    dropArea.classList.remove("hover");
  });
  dropArea.addEventListener("drop", function (event) {
    event.preventDefault();
    dropArea.classList.remove("hover");
    var files = event.dataTransfer.files;
    if (files.length) {
      processFiles(files);
    }
  });

  // Обработчик загрузки файлов через input
  fileInput.addEventListener("change", function (event) {
    var files = event.target.files;
    if (files.length) {
      processFiles(files);
    }
  });
}

// Обработка нескольких файлов
function processFiles(files) {
  var _iterator = _createForOfIteratorHelper(files),
    _step;
  try {
    var _loop = function _loop() {
      var file = _step.value;
      var reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = function (e) {
        var content = e.target.result;
        var fileExtension = file.name.split(".").pop().toLowerCase();
        if (fileExtension === "docx") {
          processWordFile(content, file.name);
        } else if (fileExtension === "xlsx") {
          processExcelFile(content, file.name);
        } else if (fileExtension === "txt") {
          processTextFile(content, file.name);
        } else if (fileExtension === "xml") {
          processXmlFile(content, file.name);
        } else {
          console.warn(
            '\u23ED \u0424\u0430\u0439\u043B "'.concat(
              file.name,
              '" \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D: \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442'
            )
          );
        }
      };
    };
    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
      _loop();
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

// Функция замены в DOCX
function processWordFile(content, originalFileName) {
  try {
    var zip = new PizZip(content);
    var myParser = function myParser(tag) {
      return {
        get:
          tag === "."
            ? function (s) {
                return s;
              }
            : function (s) {
                return s[tag.toLowerCase()]; // Ищем значение по ключу в нижнем регистре
              }
      };
    };
    var doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "[",
        end: "]"
      },
      nullGetter: function nullGetter(key) {
        return "[".concat(key.value, "]");
      },
      // Возвращаем сам ключ как строку
      parser: myParser
    });
    var normalizedData = normalizeData(data);
    doc.render(normalizedData);
    var blob = doc.getZip().generate({
      type: "blob"
    });
    var newFileName = originalFileName.replace(".docx", "_modified.docx");
    saveAs(blob, newFileName);
  } catch (error) {
    console.error(
      "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 DOCX (".concat(
        originalFileName,
        "):"
      ),
      error
    );
  }
}

// Функция замены в Excel (XLSX) с ExcelJS
function processExcelFile(_x, _x2) {
  return _processExcelFile.apply(this, arguments);
} // Функция замены в TXT
function _processExcelFile() {
  _processExcelFile = _asyncToGenerator(
    /*#__PURE__*/ _regeneratorRuntime().mark(function _callee(
      content,
      originalFileName
    ) {
      var workbook, worksheet, normalizedData, buffer, newFileName;
      return _regeneratorRuntime().wrap(
        function _callee$(_context) {
          while (1)
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.prev = 0;
                workbook = new ExcelJS.Workbook();
                _context.next = 4;
                return workbook.xlsx.load(content);
              case 4:
                worksheet = workbook.worksheets[0];
                normalizedData = normalizeData(data);
                worksheet.eachRow(function (row) {
                  row.eachCell(function (cell) {
                    var _cell$value, _cell$value2, _cell$value3;
                    var cellValue =
                      ((_cell$value = cell.value) === null ||
                      _cell$value === void 0
                        ? void 0
                        : _cell$value.formula) ||
                      ((_cell$value2 = cell.value) === null ||
                      _cell$value2 === void 0
                        ? void 0
                        : _cell$value2.toString()) ||
                      "";
                    Object.keys(normalizedData).forEach(function (key) {
                      var regex = new RegExp("\\[".concat(key, "\\]"), "gi");
                      cellValue = cellValue.replace(regex, normalizedData[key]);
                    });
                    if (
                      (_cell$value3 = cell.value) !== null &&
                      _cell$value3 !== void 0 &&
                      _cell$value3.formula
                    ) {
                      cell.value.formula = cellValue;
                    } else {
                      cell.value = cellValue;
                    }
                  });
                });
                _context.next = 9;
                return workbook.xlsx.writeBuffer();
              case 9:
                buffer = _context.sent;
                newFileName = originalFileName.replace(
                  ".xlsx",
                  "_modified.xlsx"
                );
                saveAs(new Blob([buffer]), newFileName);
                _context.next = 17;
                break;
              case 14:
                _context.prev = 14;
                _context.t0 = _context["catch"](0);
                console.error(
                  "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 XLSX (".concat(
                    originalFileName,
                    "):"
                  ),
                  _context.t0
                );
              case 17:
              case "end":
                return _context.stop();
            }
        },
        _callee,
        null,
        [[0, 14]]
      );
    })
  );
  return _processExcelFile.apply(this, arguments);
}
function processTextFile(content, originalFileName) {
  try {
    var text = new TextDecoder().decode(content);
    var normalizedText = text;
    var normalizedData = normalizeData(data);
    Object.keys(normalizedData).forEach(function (key) {
      var regex = new RegExp("\\[".concat(key, "\\]"), "gi");
      normalizedText = normalizedText.replace(regex, normalizedData[key]);
    });
    var blob = new Blob([normalizedText], {
      type: "text/plain;charset=utf-8"
    });
    var newFileName = originalFileName.replace(".txt", "_modified.txt");
    saveAs(blob, newFileName);
  } catch (error) {
    console.error(
      "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 TXT (".concat(
        originalFileName,
        "):"
      ),
      error
    );
  }
}

// Функция замены в XML
function processXmlFile(content, originalFileName) {
  try {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(
      new TextDecoder().decode(content),
      "application/xml"
    );
    var xmlText = new XMLSerializer().serializeToString(xmlDoc);
    var normalizedData = normalizeData(data);
    Object.keys(normalizedData).forEach(function (key) {
      var regex = new RegExp("\\[".concat(key, "\\]"), "gi");
      xmlText = xmlText.replace(regex, normalizedData[key]);
    });
    var blob = new Blob([xmlText], {
      type: "application/xml"
    });
    var newFileName = originalFileName.replace(".xml", "_modified.xml");
    saveAs(blob, newFileName);
  } catch (error) {
    console.error(
      "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 XML (".concat(
        originalFileName,
        "):"
      ),
      error
    );
  }
}

// Преобразует ключи в нижний регистр для нечувствительного поиска
function normalizeData(data) {
  var normalizedData = {};
  Object.keys(data).forEach(function (key) {
    normalizedData[key.toLowerCase()] = data[key];
  });
  return normalizedData;
}
