// gr-common.js - shared generator utilities: sheets, PDF, placeholders, rich text
(function () {
  "use strict";

  const MONTHS_UA_GEN = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
  ];
  const MONTHS_UA_UPPER = [
    "СІЧЕНЬ", "ЛЮТИЙ", "БЕРЕЗЕНЬ", "КВІТЕНЬ", "ТРАВЕНЬ", "ЧЕРВЕНЬ",
    "ЛИПЕНЬ", "СЕРПЕНЬ", "ВЕРЕСЕНЬ", "ЖОВТЕНЬ", "ЛИСТОПАД", "ГРУДЕНЬ"
  ];
  const MONTHS_UA_FULL = [
    "січень", "лютий", "березень", "квітень", "травень", "червень",
    "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"
  ];
  const MONTHS_UA_SHORT = [
    "січ", "лют", "бер", "квіт", "трав", "черв",
    "лип", "серп", "вер", "жовт", "лист", "груд"
  ];
  const MONTHS_UA_LOC = [
    "січні", "лютому", "березні", "квітні", "травні", "червні",
    "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
  ];
  const MONTHS_UA_LOC_UPPER = MONTHS_UA_LOC.map(name => name.toUpperCase());

  const imageDataUrlCache = new Map();

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function numberValue(value, fallback = 0) {
    const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function roundMoney(value) {
    const n = numberValue(value, 0);
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(value, decimals = 2, options) {
    const opts = options || {};
    const n = numberValue(value, NaN);
    if (!Number.isFinite(n)) return opts.fallback == null ? String(value ?? "") : opts.fallback;
    return n.toLocaleString(opts.locale || "uk-UA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function monthNameUa(month, monthCase = "full", options) {
    const idx = Math.max(1, Math.min(12, Number(month) || 1)) - 1;
    const names = {
      gen: MONTHS_UA_GEN,
      full: MONTHS_UA_FULL,
      nom: MONTHS_UA_FULL,
      loc: MONTHS_UA_LOC,
      short: MONTHS_UA_SHORT,
      upper: MONTHS_UA_UPPER,
      locUpper: MONTHS_UA_LOC_UPPER
    };
    let value = (names[monthCase] || names.full)[idx] || "";
    if (options && options.upper) value = value.toUpperCase();
    if (options && options.capital) value = capitalizeFirst(value);
    return value;
  }

  function formatDateUa(value, format = "dd.mm.yyyy") {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return String(format)
      .replace(/yyyy/g, String(year))
      .replace(/yy/g, pad2(year % 100))
      .replace(/mmmm/g, monthNameUa(month, "gen"))
      .replace(/MMMM/g, monthNameUa(month, "full"))
      .replace(/mm/g, pad2(month))
      .replace(/m/g, String(month))
      .replace(/dd/g, pad2(day))
      .replace(/d/g, String(day));
  }

  function moneyText(value) {
    return formatMoney(value, 2);
  }

  function capitalizeFirst(text) {
    const s = String(text || "").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  function applyPlaceholderCase(text, placeholderName) {
    const value = String(text || "").trim();
    const name = String(placeholderName || "");
    if (!value) return "";
    if (name && name === name.toUpperCase()) return value.toUpperCase();
    if (name && name.charAt(0) === name.charAt(0).toUpperCase()) return capitalizeFirst(value);
    return value.toLowerCase();
  }

  function placeholderCaseMode(placeholderName) {
    const name = String(placeholderName || "");
    if (name && name === name.toUpperCase()) return "upper";
    if (name && name.charAt(0) === name.charAt(0).toUpperCase()) return "capital";
    return "lower";
  }

  function applyCaseMode(text, mode) {
    const value = String(text || "").trim();
    if (!value) return "";
    if (mode === "upper") return value.toUpperCase();
    if (mode === "capital") return capitalizeFirst(value);
    return value.toLowerCase();
  }

  function wildcardPatternToRegExp(pattern) {
    const text = String(pattern || "").trim();
    if (!text) return null;
    if (text.length > 1 && text.startsWith("/") && text.endsWith("/")) {
      try {
        return new RegExp(text.slice(1, -1), "i");
      } catch (_err) {}
    }
    const parts = text.split("|").map(part => part.trim()).filter(Boolean);
    const source = (parts.length ? parts : [text]).map(part => {
      let out = "";
      for (let i = 0; i < part.length; i++) {
        const ch = part[i];
        if (ch === "*" || /\s/.test(ch)) {
          out += ".*";
          while (i + 1 < part.length && (part[i + 1] === "*" || /\s/.test(part[i + 1]))) i++;
          continue;
        }
        if (ch === "?") {
          out += ".";
          continue;
        }
        if (ch === "[") {
          const end = part.indexOf("]", i + 1);
          if (end > i + 1) {
            const body = part.slice(i + 1, end).replace(/[\\\]\^-]/g, "\\$&");
            out += `[${body}]`;
            i = end;
            continue;
          }
        }
        out += ch.replace(/[\\^$+?.(){}[\]]/g, "\\$&");
      }
      return out;
    }).join("|");
    return new RegExp(source, "i");
  }

  function matchesSearch(value, pattern) {
    const re = wildcardPatternToRegExp(pattern);
    return !re || re.test(String(value || ""));
  }

  const NUMBER_LANGS = {
    ua: {
      zero: "нуль",
      minus: "мінус",
      ones: {
        m: ["", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"],
        f: ["", "одна", "дві", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"],
        n: ["", "одно", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"]
      },
      teens: ["десять", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"],
      tens: ["", "", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"],
      hundreds: ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"],
      scales: [
        null,
        { gender: "f", forms: ["тисяча", "тисячі", "тисяч"] },
        { gender: "m", forms: ["мільйон", "мільйона", "мільйонів"] },
        { gender: "m", forms: ["мільярд", "мільярда", "мільярдів"] },
        { gender: "m", forms: ["трильйон", "трильйона", "трильйонів"] }
      ],
      monthGen: MONTHS_UA_GEN
    },
    ru: {
      zero: "ноль",
      minus: "минус",
      ones: {
        m: ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
        f: ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
        n: ["", "одно", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
      },
      teens: ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"],
      tens: ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"],
      hundreds: ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"],
      scales: [
        null,
        { gender: "f", forms: ["тысяча", "тысячи", "тысяч"] },
        { gender: "m", forms: ["миллион", "миллиона", "миллионов"] },
        { gender: "m", forms: ["миллиард", "миллиарда", "миллиардов"] },
        { gender: "m", forms: ["триллион", "триллиона", "триллионов"] }
      ],
      monthGen: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
    },
    en: {
      zero: "zero",
      minus: "minus",
      ones: ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
      teens: ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
      tens: ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
      scales: ["", "thousand", "million", "billion", "trillion"],
      monthGen: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    }
  };

  function pluralForm(n, forms) {
    const x = Math.abs(Number(n) || 0) % 100;
    const y = x % 10;
    if (x > 10 && x < 20) return forms[2];
    if (y === 1) return forms[0];
    if (y >= 2 && y <= 4) return forms[1];
    return forms[2];
  }

  function normalizePropisLang(value) {
    const lang = String(value || "").trim().toLowerCase();
    if (lang === "ru" || lang === "rus") return "ru";
    if (lang === "ua" || lang === "uk" || lang === "ukr") return "ua";
    if (lang === "en" || lang === "eng") return "en";
    return "";
  }

  function normalizePropisGender(value) {
    const g = String(value || "").trim().toLowerCase().charAt(0);
    if (g === "ж" || g === "f") return "f";
    if (g === "с" || g === "n") return "n";
    return "m";
  }

  function englishPluralForm(n, forms) {
    return Math.abs(Number(n) || 0) === 1 ? forms[0] : forms[2];
  }

  function normalizeUnitForms(parts) {
    if (parts.length >= 4) return [parts[3], parts[2], parts[1]];
    if (parts.length >= 2) return [parts[1], parts[1], parts[1]];
    return ["", "", ""];
  }

  function parsePropisUnitSpec(spec, defaults) {
    const text = String(spec ?? "").trim();
    if (!text) return null;
    const parts = text.replace(/;/g, "|").split("|").map(part => part.trim());
    const gender = normalizePropisGender(parts[0] || (defaults && defaults.gender));
    const unit = {
      gender,
      forms: normalizeUnitForms(parts),
      decimals: defaults && defaults.decimals,
      format: defaults && defaults.format,
      glue: defaults && defaults.glue,
      words: !!(defaults && defaults.words)
    };
    if (parts.length >= 5) {
      const fmt = String(parts[4] || "").trim();
      const decimals = parseInt(fmt.charAt(0), 10);
      if (Number.isFinite(decimals)) unit.decimals = Math.max(0, Math.min(6, decimals));
      unit.glue = fmt.charAt(1) || "";
      unit.format = fmt.slice(2).trim() || "0";
      unit.words = false;
    }
    return unit;
  }

  function defaultPropisOptions(lang) {
    return {
      lang,
      whole: { gender: "m", forms: ["грн.", "грн.", "грн."] },
      fraction: { gender: "f", forms: ["коп.", "коп.", "коп."], decimals: 2, format: "00", glue: "", words: false }
    };
  }

  function parsePropisOptions(args) {
    const raw = String(args || "").trim();
    if (!raw) return defaultPropisOptions("ua");
    const parts = raw.split(",").map(part => part.trim());
    let lang = normalizePropisLang(parts[2]) || "";
    if (!lang && parts.length === 2 && normalizePropisLang(parts[1])) {
      lang = normalizePropisLang(parts[1]);
      parts[1] = "";
    }
    if (!lang && parts.length === 1 && normalizePropisLang(parts[0])) {
      const opts = defaultPropisOptions(normalizePropisLang(parts[0]));
      return opts;
    }
    lang = lang || "ua";
    const opts = defaultPropisOptions(lang);
    opts.whole = parsePropisUnitSpec(parts[0], { gender: "m" }) || { gender: "m", forms: ["", "", ""] };
    opts.fraction = parsePropisUnitSpec(parts[1], { gender: "f", decimals: 2, format: "00", glue: "", words: true });
    return opts;
  }

  function propisUnitText(n, unit, lang) {
    if (!unit || !unit.forms) return "";
    const forms = unit.forms;
    if (!forms[0] && !forms[1] && !forms[2]) return "";
    return lang === "en" ? englishPluralForm(n, forms) : pluralForm(n, forms);
  }

  function triadWords(value, gender, lang) {
    const data = NUMBER_LANGS[lang] || NUMBER_LANGS.ua;
    const n = Math.floor(Math.abs(Number(value) || 0)) % 1000;
    const words = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (lang === "en") {
      if (hundreds) words.push(data.ones[hundreds], "hundred");
      if (rest) {
        if (rest < 10) words.push(data.ones[rest]);
        else if (rest < 20) words.push(data.teens[rest - 10]);
        else {
          const tens = Math.floor(rest / 10);
          const ones = rest % 10;
          if (tens) words.push(data.tens[tens]);
          if (ones) words.push(data.ones[ones]);
        }
      }
      return words.join(" ");
    }
    if (hundreds) words.push(data.hundreds[hundreds]);
    if (rest) {
      if (rest < 10) words.push(data.ones[gender || "m"][rest]);
      else if (rest < 20) words.push(data.teens[rest - 10]);
      else {
        const tens = Math.floor(rest / 10);
        const ones = rest % 10;
        if (tens) words.push(data.tens[tens]);
        if (ones) words.push(data.ones[gender || "m"][ones]);
      }
    }
    return words.join(" ");
  }

  function intToWords(value, options) {
    const opts = options || {};
    const lang = normalizePropisLang(opts.lang) || "ua";
    const data = NUMBER_LANGS[lang] || NUMBER_LANGS.ua;
    const gender = normalizePropisGender(opts.gender);
    const n = Math.floor(Math.abs(Number(value) || 0));
    if (n === 0) return data.zero;
    const triads = [];
    let restValue = n;
    while (restValue > 0) {
      triads.push(restValue % 1000);
      restValue = Math.floor(restValue / 1000);
    }
    const words = [];
    for (let i = triads.length - 1; i >= 0; i--) {
      const triad = triads[i];
      if (!triad) continue;
      if (lang === "en") {
        words.push(triadWords(triad, gender, lang));
        if (i > 0 && data.scales[i]) words.push(data.scales[i]);
      } else {
        const scale = data.scales[i];
        words.push(triadWords(triad, scale ? scale.gender : gender, lang));
        if (scale) words.push(pluralForm(triad, scale.forms));
      }
    }
    return words.filter(Boolean).join(" ");
  }

  function parseLooseNumber(text) {
    const normalized = String(text || "").replace(/[\s\u00a0]/g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  function propisNumberToWords(value, options) {
    const n = parseLooseNumber(value);
    if (n == null) return "";
    const opts = Object.assign(defaultPropisOptions("ua"), options || {});
    opts.lang = normalizePropisLang(opts.lang) || "ua";
    const caseMode = opts.caseMode || "lower";
    const abs = Math.abs(n);
    const decimals = opts.fraction && Number.isFinite(opts.fraction.decimals) ? opts.fraction.decimals : 0;
    const scale = opts.fraction ? Math.pow(10, decimals) : 1;
    const roundedTotal = opts.fraction ? Math.round(abs * scale) : Math.floor(abs);
    const whole = opts.fraction ? Math.floor(roundedTotal / scale) : roundedTotal;
    const fraction = opts.fraction ? roundedTotal % scale : 0;
    const sign = n < 0 ? (NUMBER_LANGS[opts.lang].minus + " ") : "";
    const wholeUnit = propisUnitText(whole, opts.whole, opts.lang);
    const wholeWords = applyCaseMode(sign + intToWords(whole, { lang: opts.lang, gender: opts.whole && opts.whole.gender }), caseMode);
    const words = [wholeWords];
    if (wholeUnit) words.push(wholeUnit);
    let out = words.filter(Boolean).join(" ");
    if (opts.fraction) {
      const format = opts.fraction.format || "0".repeat(decimals);
      const fractionCaseMode = caseMode === "upper" ? "upper" : "lower";
      const fractionText = opts.fraction.words
        ? applyCaseMode(intToWords(fraction, { lang: opts.lang, gender: opts.fraction.gender }), fractionCaseMode)
        : String(fraction).padStart(Math.max(format.length, decimals), "0");
      const fractionUnit = propisUnitText(fraction, opts.fraction, opts.lang);
      if (opts.fraction.glue && out) out += opts.fraction.glue;
      out = [out, fractionText, fractionUnit].filter(Boolean).join(" ");
    }
    return out.trim();
  }

  function moneyToWords(value, options) {
    return propisNumberToWords(value, options);
  }

  function dateToWords(value, options) {
    const lang = normalizePropisLang(options && options.lang) || "ua";
    const m = String(value || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
    if (!m) return "";
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = Number(m[3].length === 2 ? "20" + m[3] : m[3]);
    if (!day || month < 0 || month > 11 || !year) return "";
    const data = NUMBER_LANGS[lang] || NUMBER_LANGS.ua;
    return `${day} ${data.monthGen[month]} ${year}`;
  }

  function previousNumberOrDateInfo(text) {
    const source = String(text || "");
    let best = null;
    source.replace(/\b\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4})\b/g, (raw, offset) => {
      best = { type: "date", raw, start: offset, end: offset + raw.length };
      return raw;
    });
    source.replace(/(?:\d{1,3}(?:[\s\u00a0]\d{3})+|\d+)(?:[,.]\d+)?/g, (raw, offset) => {
      const end = offset + raw.length;
      if (!best || end > best.end) best = { type: "number", raw, start: offset, end };
      return raw;
    });
    return best;
  }

  function previousNumberOrDateText(text, propisArgs, placeholderName) {
    const options = parsePropisOptions(propisArgs);
    const best = previousNumberOrDateInfo(text);
    if (!best) return "";
    if (best.type === "date") return applyPlaceholderCase(dateToWords(best.raw, options), placeholderName || "Propis");
    return moneyToWords(best.raw, Object.assign({}, options, { caseMode: placeholderCaseMode(placeholderName || "Propis") }));
  }

  function applyPropisPlaceholders(text) {
    let out = String(text || "");
    const re = /\{(propis|пропись|прописью)(?::([^{}]*))?\}/gi;
    let match;
    let result = "";
    let last = 0;
    while ((match = re.exec(out)) !== null) {
      const before = out.slice(0, match.index);
      const best = previousNumberOrDateInfo(before);
      const removeAttachedNumber = /\d$/.test(before) && best && best.end === before.length && best.start >= last;
      const replaceFrom = removeAttachedNumber ? best.start : match.index;
      const options = parsePropisOptions(match[2]);
      const rawWords = best
        ? (best.type === "date"
          ? applyPlaceholderCase(dateToWords(best.raw, options), match[1])
          : moneyToWords(best.raw, Object.assign({}, options, { caseMode: placeholderCaseMode(match[1]) })))
        : "";
      const words = rawWords;
      result += out.slice(last, replaceFrom) + words;
      last = match.index + match[0].length;
    }
    return result + out.slice(last);
  }

  function isTechnicalPlaceholder(key) {
    const k = String(key || "").trim().toLowerCase();
    return !k ||
      k.includes("|") ||
      k.includes("/") ||
      /^f\d*$/.test(k) ||
      /^\^\d+$/.test(k) ||
      /^(=+|=>|<=|<==>|>-<)$/.test(k) ||
      /^(propis|пропись|прописью)(?::.*)?$/.test(k) ||
      /^(privatqr)$/.test(k);
  }

  function unknownPlaceholderCancelSet(replacements) {
    const target = replacements || {};
    if (!Object.prototype.hasOwnProperty.call(target, "__grCancelledUnknownPlaceholders")) {
      try {
        Object.defineProperty(target, "__grCancelledUnknownPlaceholders", {
          value: new Set(),
          enumerable: false,
          configurable: true
        });
      } catch (_err) {
        target.__grCancelledUnknownPlaceholders = new Set();
      }
    }
    return target.__grCancelledUnknownPlaceholders;
  }

  function hasReplacementValue(replacements, rawKey, normalized) {
    if (!replacements) return false;
    return Object.prototype.hasOwnProperty.call(replacements, rawKey) ||
      Object.prototype.hasOwnProperty.call(replacements, normalized);
  }

  function collectUnknownPlaceholderKeys(texts, replacements, docDate) {
    const source = Array.isArray(texts) ? texts : [texts];
    const keys = [];
    const seen = new Set();
    const cancelled = unknownPlaceholderCancelSet(replacements);
    source.forEach(text => {
      String(text || "").replace(/\{([^{}]+)\}/g, function (_m, key) {
        const rawKey = String(key || "").trim();
        const normalized = rawKey.toLowerCase();
        if (seen.has(normalized)) return _m;
        if (cancelled.has(normalized)) return _m;
        if (isTechnicalPlaceholder(rawKey) || canAutoResolvePlaceholder(rawKey, docDate)) return _m;
        if (hasReplacementValue(replacements, rawKey, normalized)) return _m;
        seen.add(normalized);
        keys.push(rawKey);
        return _m;
      });
    });
    return keys;
  }

  function requestMissingPlaceholdersFromUI(keys, replacements, options) {
    const list = Array.from(new Set((keys || []).map(key => String(key || "").trim()).filter(Boolean)));
    if (!list.length) return Promise.resolve(true);
    if (typeof document === "undefined" || !document.body) return Promise.resolve(false);
    const opts = options || {};
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(15, 23, 42, 0.42)";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.padding = "20px";

      const modal = document.createElement("div");
      modal.style.background = "#fff";
      modal.style.borderRadius = "8px";
      modal.style.width = "min(520px, 100%)";
      modal.style.maxHeight = "82vh";
      modal.style.overflowY = "auto";
      modal.style.boxShadow = "0 18px 50px rgba(15, 23, 42, 0.28)";
      modal.style.padding = "20px";
      modal.innerHTML = `
        <h3 style="margin:0 0 8px;font-size:18px">Заполните данные</h3>
        <p style="margin:0 0 16px;color:#64748b;font-size:13px">Найдены неизвестные placeholders. Пустые поля будут заменены пустым значением.</p>
        <div data-gr-missing-fields></div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
          <button type="button" data-gr-missing-cancel style="padding:8px 12px;border:1px solid #cbd5e1;background:#fff;border-radius:6px;cursor:pointer">Отмена</button>
          <button type="button" data-gr-missing-ok style="padding:8px 14px;border:1px solid #2563eb;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer">${opts.okText || "Продолжить"}</button>
        </div>
      `;
      const fields = modal.querySelector("[data-gr-missing-fields]");
      list.forEach(key => {
        const wrapper = document.createElement("label");
        wrapper.style.display = "block";
        wrapper.style.marginBottom = "10px";
        const caption = document.createElement("span");
        caption.textContent = `{${key}}`;
        caption.style.display = "block";
        caption.style.fontSize = "12px";
        caption.style.color = "#475569";
        caption.style.marginBottom = "4px";
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.key = key;
        input.style.boxSizing = "border-box";
        input.style.width = "100%";
        input.style.padding = "8px 10px";
        input.style.border = "1px solid #cbd5e1";
        input.style.borderRadius = "6px";
        wrapper.appendChild(caption);
        wrapper.appendChild(input);
        fields.appendChild(wrapper);
      });

      function close(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      modal.querySelector("[data-gr-missing-cancel]").addEventListener("click", () => {
        const cancelled = unknownPlaceholderCancelSet(replacements);
        list.forEach(key => cancelled.add(String(key || "").trim().toLowerCase()));
        close(false);
      });
      modal.querySelector("[data-gr-missing-ok]").addEventListener("click", () => {
        modal.querySelectorAll("input[data-key]").forEach(input => {
          const key = input.dataset.key;
          const value = String(input.value || "").trim();
          if (replacements) {
            replacements[key] = value;
            replacements[String(key || "").toLowerCase()] = value;
          }
        });
        close(true);
      });
      overlay.addEventListener("click", event => {
        if (event.target === overlay) {
          const cancelled = unknownPlaceholderCancelSet(replacements);
          list.forEach(key => cancelled.add(String(key || "").trim().toLowerCase()));
          close(false);
        }
      });
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      const first = modal.querySelector("input[data-key]");
      if (first) first.focus();
    });
  }

  async function ensureUnknownPlaceholders(texts, replacements, docDate, options) {
    const keys = collectUnknownPlaceholderKeys(texts, replacements, docDate);
    if (!keys.length) return true;
    return requestMissingPlaceholdersFromUI(keys, replacements, options);
  }

  function canAutoResolvePlaceholder(key, docDate) {
    const k = String(key || "").trim();
    if (isTechnicalPlaceholder(k)) return true;
    const parsed = expandFormattedPlaceholder(k);
    if (!parsed) return false;
    return !!applyDateFormat(parsed.base, parsed.format, docDate);
  }

  function resolveUnknownPlaceholders(text, replacements, options) {
    const opts = options || {};
    if (!opts.askUnknown) return text;
    return String(text || "").replace(/\{([^{}]+)\}/g, function (m, key) {
      const rawKey = String(key || "").trim();
      const normalized = rawKey.toLowerCase();
      if (isTechnicalPlaceholder(rawKey) || canAutoResolvePlaceholder(rawKey, opts.docDate)) return m;
      if (unknownPlaceholderCancelSet(replacements).has(normalized)) return m;
      if (hasReplacementValue(replacements, rawKey, normalized)) {
        const value = Object.prototype.hasOwnProperty.call(replacements, rawKey)
          ? replacements[rawKey]
          : replacements[normalized];
        return String(value == null ? "" : value);
      }
      return m;
    });
  }

  function parseDocDate(value) {
    if (!value) return new Date();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function buildDatePlaceholders(docDate) {
    const d = parseDocDate(docDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const nextMonth = new Date(y, m + 1, 1);
    const prevMonth = new Date(y, m - 1, 1);
    const fmt = (dt, pattern) => {
      const yy = dt.getFullYear();
      const mm = dt.getMonth();
      const dd = dt.getDate();
      return pattern
        .replace(/yyyy/g, String(yy))
        .replace(/yy/g, pad2(yy % 100))
        .replace(/mmmm/g, MONTHS_UA_GEN[mm])
        .replace(/MMMM/g, MONTHS_UA_FULL[mm])
        .replace(/mm/g, pad2(mm + 1))
        .replace(/dd/g, pad2(dd));
    };
    const map = {
      "дата": fmt(d, "dd.mm.yyyy"),
      date: fmt(d, "dd.mm.yyyy"),
      "1число": fmt(new Date(y, m, 1), "dd.mm.yyyy"),
      "першечисло": fmt(new Date(y, m, 1), "dd.mm.yyyy"),
      "останнійдень": fmt(new Date(y, m, lastDay), "dd.mm.yyyy"),
      "наступниймісяць": fmt(nextMonth, "dd.mm.yyyy"),
      "попередніймісяць": fmt(prevMonth, "dd.mm.yyyy"),
      "датапропис": fmt(d, "dd mmmm yyyy") + " р.",
      "датазакресленням": "«" + pad2(day) + "» " + MONTHS_UA_GEN[m] + " " + y + " р.",
      "місяць": MONTHS_UA_LOC[m] + " " + y + " р.",
      "наступниймісяцьназва": MONTHS_UA_LOC[nextMonth.getMonth()] + " " + nextMonth.getFullYear() + " р.",
      "попередніймісяцьназва": MONTHS_UA_LOC[prevMonth.getMonth()] + " " + prevMonth.getFullYear() + " р.",
      "сьогодні": fmt(new Date(), "dd.mm.yyyy")
    };
    return map;
  }

  function expandFormattedPlaceholder(key) {
    const m = String(key || "").match(/^(.+?)(?::(dd\.mm\.yyyy|dd\.mm\.yy|dd mmmm yyyy|<<dd>> mmmm yyyy|dd mmmm yyyy р\.))?$/i);
    if (!m) return null;
    return { base: m[1].toLowerCase(), format: (m[2] || "").toLowerCase() };
  }

  function applyDateFormat(baseKey, format, docDate) {
    const d = parseDocDate(docDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const lastDay = new Date(y, m + 1, 0).getDate();
    let dt = d;
    const bk = baseKey.toLowerCase();
    if (bk === "1число" || bk === "першечисло") dt = new Date(y, m, 1);
    else if (bk === "останнійдень") dt = new Date(y, m, lastDay);
    else if (bk === "наступниймісяць" || bk === "1числонаступного") dt = new Date(y, m + 1, 1);
    else if (bk === "попередніймісяць") dt = new Date(y, m - 1, 1);
    if (!format) return buildDatePlaceholders(docDate)[bk] || "";
    const yy = dt.getFullYear();
    const mm = dt.getMonth();
    const dd = dt.getDate();
    if (format === "dd.mm.yyyy") return `${pad2(dd)}.${pad2(mm + 1)}.${yy}`;
    if (format === "dd.mm.yy") return `${pad2(dd)}.${pad2(mm + 1)}.${pad2(yy % 100)}`;
    if (format === "dd mmmm yyyy" || format === "dd mmmm yyyy р.") return `${pad2(dd)} ${MONTHS_UA_GEN[mm]} ${yy} р.`;
    if (format === "<<dd>> mmmm yyyy") return `«${pad2(dd)}» ${MONTHS_UA_GEN[mm]} ${yy}`;
    return `${pad2(dd)}.${pad2(mm + 1)}.${yy}`;
  }

  function detectGenderFromFio(fio) {
    const parts = String(fio || "").trim().split(/\s+/);
    if (parts.length >= 3 && parts[2].length > 2) {
      const middle = parts[2];
      if (/(?:івна|ївна|овна|евна|ична)$/i.test(middle)) return 2;
      if (/(?:ович|евич|йович|іч|ич)$/i.test(middle)) return 1;
    }
    return 3;
  }

  function parseFioParts(fio) {
    const text = String(fio || "").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 3) return { ok: false, fio: text, last: parts[0] || "", first: parts[1] || "", middle: parts[2] || "" };
    const shortFirst = parts[1].length <= 1;
    const shortMiddle = parts[2].length <= 1;
    if (shortFirst || shortMiddle) return { ok: false, fio: text, last: parts[0], first: parts[1], middle: parts[2] };
    return {
      ok: true,
      fio: text,
      last: parts[0],
      first: parts[1],
      middle: parts[2],
      initials: `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`,
      namePatronymic: `${parts[1]} ${parts[2]}`
    };
  }

  function buildObr(fio, kv, pers) {
    const text = String(fio || "");
    if (/фіо/i.test(text)) return `Шановні мешканці квартири ${kv || ""}, `;
    const pol = detectGenderFromFio(text);
    const honorific = pol === 2 ? "а " : (pol === 1 ? "ий " : "ий(а) ");
    let out = `Шановн${honorific}${text}`;
    if (Number(pers) > 1) out += ` та інші мешканці ${kv || ""}-ї квартири`;
    return out + ", ";
  }

  function buildObrKr(fio) {
    const p = parseFioParts(fio);
    if (!p.ok) return `Шановний(а) ${p.fio}`;
    return `Шановний(а) ${p.initials}`;
  }

  function buildLsPlaceholders(lsItem, accountId, homeMeta, periodStart, periodEnd) {
    const item = lsItem || {};
    const fio = String(item.fio || item.owner || "").trim();
    const fp = parseFioParts(fio);
    const map = Object.assign({}, typeof getReplacementMap === "function" ? getReplacementMap(homeMeta || {}) : {});
    Object.keys(item).forEach(k => {
      map[k.toLowerCase()] = item[k] == null ? "" : String(item[k]);
    });
    map.fio = fio;
    map.kv = String(item.kv || "");
    map.kvarta = map.kv;
    map.obr = buildObr(fio, item.kv, item.pers);
    map.obrkr = buildObrKr(fio);
    if (fp.ok) {
      map.familia = fp.last;
      map.imia = fp.first;
      map["побатькові"] = fp.middle;
      map.imiapatronymic = fp.namePatronymic;
      map.initials = fp.initials;
    } else {
      map.familia = map.imia = map["побатькові"] = map.imiapatronymic = map.initials = fio;
    }
    if (accountId && periodStart && periodEnd && typeof collectAccountsPeriodData === "function") {
      const rows = collectAccountsPeriodData(periodStart, periodEnd, {
        ls: { [accountId]: item },
        nach: (homeMeta && homeMeta.nach) || window.nach,
        oplat: (homeMeta && homeMeta.oplat) || window.oplat
      });
      const row = rows.find(r => String(r.accountId) === String(accountId)) || rows[0];
      if (row) {
        map.borgstart = map.borgStart = moneyText(row.debitStart);
        map.borgend = map.borgEnd = moneyText(row.debitEnd);
        map.nachislenno = map.nachisleno = map["нараховано"] = moneyText(row.chargesSum);
        map.oplacheno = map["оплачено"] = moneyText(row.paymentsSum);
        if (typeof moneyPropis === "function") {
          map.borgstartpropis = moneyPropis(row.debitStart);
          map.borgendpropis = moneyPropis(row.debitEnd);
        }
      }
    }
    return map;
  }

  function replacePlaceholders(text, replacements, docDate, options) {
    const opts = Object.assign({}, options || {}, { docDate });
    let out = String(text || "");
    const dateMap = buildDatePlaceholders(docDate);
    const all = Object.assign({}, dateMap, replacements || {});
    Object.keys(all).forEach(key => {
      const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`, "gi");
      out = out.replace(re, all[key] == null ? "" : String(all[key]));
    });
    out = out.replace(/\{([^{}|]+)(?::([^}]+))?\}/g, function (_m, key, fmt) {
      const parsed = expandFormattedPlaceholder(key + (fmt ? ":" + fmt : ""));
      if (!parsed) return _m;
      const val = applyDateFormat(parsed.base, parsed.format, docDate);
      return val || _m;
    });
    out = out.replace(/\{m:([^{}|]*)\|f:([^{}|]*)\}/gi, function (_m, male, female) {
      const pol = detectGenderFromFio(replacements && (replacements.fio || replacements["головаfull"] || replacements["ГоловаFull"]));
      return pol === 2 ? female : male;
    });
    out = applyPropisPlaceholders(out);
    return resolveUnknownPlaceholders(out, replacements, opts);
  }

  function parseInline(text, defaultSize) {
    const runs = [];
    let i = 0;
    let size = defaultSize || null;
    let buffer = "";
    let bufferSup = false;
    const mark = { bold: false, underline: false, italic: false };

    function push(sup) {
      if (!buffer) return;
      runs.push({ text: buffer, size, sup: !!sup, bold: mark.bold, underline: mark.underline, italic: mark.italic });
      buffer = "";
    }

    while (i < text.length) {
      const rest = text.slice(i);
      const longStars = rest.match(/^\*{3,}/);
      if (longStars) { buffer += longStars[0]; i += longStars[0].length; continue; }
      const longUnderscores = rest.match(/^_{3,}/);
      if (longUnderscores) { buffer += longUnderscores[0]; i += longUnderscores[0].length; continue; }
      const font = rest.match(/^\{f(\d+)\}/i);
      if (font) { push(bufferSup); size = Number(font[1]) || null; bufferSup = false; i += font[0].length; continue; }
      if (/^\{f\}/i.test(rest)) { push(bufferSup); size = null; bufferSup = false; i += 3; continue; }
      const sup = rest.match(/^\{\^([^{}]+)\}/);
      if (sup) {
        push(bufferSup);
        i += sup[0].length;
        const value = sup[1];
        if (value) {
          runs.push({
            text: value,
            size,
            sup: true,
            bold: mark.bold,
            underline: mark.underline,
            italic: mark.italic
          });
        }
        bufferSup = false;
        continue;
      }
      if (rest.startsWith("**")) { push(bufferSup); mark.bold = !mark.bold; i += 2; continue; }
      if (rest.startsWith("*")) { push(bufferSup); mark.bold = !mark.bold; i += 1; continue; }
      if (rest.startsWith("__")) { push(bufferSup); mark.underline = !mark.underline; i += 2; continue; }
      if (rest.startsWith("_")) { push(bufferSup); mark.underline = !mark.underline; i += 1; continue; }
      if (rest.startsWith("//")) { push(bufferSup); mark.italic = !mark.italic; i += 2; continue; }
      if (rest.startsWith("/") && (i === 0 || /\s/.test(text[i - 1])) && /[^\s/]/.test(rest[1] || "")) {
        push(bufferSup); mark.italic = !mark.italic; i += 1; continue;
      }
      buffer += text[i];
      i += 1;
    }
    push(bufferSup);
    return runs.length ? runs : [{ text: "", size, sup: false }];
  }

  function parseRichText(text, replacements, docDate) {
    const replaced = replacePlaceholders(text, replacements, docDate).replace(/\{PrivatQR\}/gi, "");
    const blocks = [];
    let pendingAlign = null;
    let defaultSize = null;
    const alignMarkers = [
      { marker: "{=====}", align: "center" },
      { marker: "{==}", align: "center" },
      { marker: "{>--<}", align: "center" },
      { marker: "{=>}", align: "right" },
      { marker: "{<=}", align: "left" },
      { marker: "{<==>}", align: "justify" }
    ];
    String(replaced || "").split(/\r?\n/).forEach(function (rawLine) {
      let line = rawLine;
      let localAlign = null;
      let changed = true;
      while (changed) {
        changed = false;
        const trimmed = line.trimStart();
        const lead = line.slice(0, line.length - trimmed.length);
        for (const item of alignMarkers) {
          if (trimmed.toLowerCase().startsWith(item.marker.toLowerCase())) {
            localAlign = item.align;
            line = lead + trimmed.slice(item.marker.length).trimStart();
            changed = true;
            break;
          }
        }
      }
      const fontOnly = line.trim().match(/^\{f(\d+)\}$/i);
      if (fontOnly) { defaultSize = Number(fontOnly[1]) || null; return; }
      if (/^\{f\}$/i.test(line.trim())) { defaultSize = null; return; }
      if (!line.trim() && localAlign) { pendingAlign = localAlign; return; }
      const align = localAlign || pendingAlign || "left";
      pendingAlign = null;
      blocks.push({ align, runs: parseInline(line, defaultSize) });
    });
    return blocks;
  }

  function renderRuns(runs) {
    return (runs || []).map(function (run) {
      const style = run.size ? ` style="font-size:${Number(run.size)}pt"` : "";
      let text = escapeHtml(run.text);
      if (run.bold) text = `<strong>${text}</strong>`;
      if (run.underline) text = `<u>${text}</u>`;
      if (run.italic) text = `<em>${text}</em>`;
      return run.sup ? `<sup${style}>${text}</sup>` : `<span${style}>${text}</span>`;
    }).join("");
  }

  function renderRichHtml(blocks, paragraphClass, defaultAlign) {
    return (blocks || []).map(function (block) {
      const alignClass = `gr-rich-align-${block.align || defaultAlign || "left"}`;
      const content = renderRuns(block.runs);
      const emptyClass = content ? "" : " gr-rich-empty";
      return `<p class="${paragraphClass || "gr-rich-p"} ${alignClass}${emptyClass}">${content || "&nbsp;"}</p>`;
    }).join("");
  }

  function renderRichPlain(blocks) {
    return (blocks || []).map(b => (b.runs || []).map(r => r.text).join("")).join("\n");
  }

  function escapeXml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function docxRun(text, options) {
    const opts = options || {};
    const props = [];
    if (opts.font) props.push(`<w:rFonts w:ascii="${escapeXml(opts.font)}" w:hAnsi="${escapeXml(opts.font)}" w:cs="${escapeXml(opts.font)}"/>`);
    if (opts.bold) props.push("<w:b/>");
    if (opts.underline) props.push('<w:u w:val="single"/>');
    if (opts.italic) props.push("<w:i/>");
    if (opts.size) props.push(`<w:sz w:val="${Number(opts.size) * 2}"/><w:szCs w:val="${Number(opts.size) * 2}"/>`);
    if (opts.sup) props.push('<w:vertAlign w:val="superscript"/>');
    if (opts.color) props.push(`<w:color w:val="${escapeXml(opts.color)}"/>`);
    props.push('<w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/>');
    const rpr = props.length ? `<w:rPr>${props.join("")}</w:rPr>` : "";
    const parts = String(text || "").split(/\r?\n/);
    return `<w:r>${rpr}${parts.map((part, index) => {
      const preserve = /^\s|\s$/.test(part) ? ' xml:space="preserve"' : "";
      return `${index ? "<w:br/>" : ""}<w:t${preserve}>${escapeXml(part)}</w:t>`;
    }).join("")}</w:r>`;
  }

  function docxPRuns(runs, options) {
    const opts = options || {};
    const blockAlign = opts.defaultAlign && (!opts.align || opts.align === "left") ? opts.defaultAlign : (opts.align || "left");
    const align = { center: "center", right: "right", justify: "both", left: "left" }[blockAlign] || blockAlign || "left";
    const spacing = `<w:spacing w:after="${opts.after == null ? 0 : Number(opts.after)}" w:before="${opts.before == null ? 0 : Number(opts.before)}" w:line="240" w:lineRule="auto"/>`;
    const hasText = (runs || []).some(run => String(run && run.text || "").trim());
    const indent = hasText && opts.firstLine ? `<w:ind w:firstLine="${Number(opts.firstLine) || 0}"/>` : "";
    const body = (runs && runs.length ? runs : [{ text: "" }]).map(run => docxRun(run.text, run)).join("");
    return `<w:p><w:pPr>${spacing}${indent}<w:jc w:val="${align}"/></w:pPr>${body}</w:p>`;
  }

  function docxP(text, options) {
    return docxPRuns([{ text: text || "", ...(options || {}) }], options);
  }

  function docxRichParagraphs(blocks, options) {
    const opts = options || {};
    const runDefaults = {};
    ["font", "size", "color"].forEach(key => {
      if (opts[key] != null) runDefaults[key] = opts[key];
    });
    return (blocks || []).map(block => {
      const runs = (block.runs || []).map(run => {
        const merged = Object.assign({}, runDefaults, run);
        Object.keys(runDefaults).forEach(key => {
          if (run && run[key] == null) merged[key] = runDefaults[key];
        });
        return merged;
      });
      const align = opts.align && (!block.align || block.align === "left") ? opts.align : (block.align || opts.align || "left");
      return docxPRuns(runs, Object.assign({}, opts, { align }));
    }).join("");
  }

  function docxLabelParagraph(label, text, options) {
    return docxPRuns([
      { text: label, bold: true },
      { text: text ? ` ${text}` : "" }
    ], options);
  }

  function docxLabelRichParagraphs(label, blocks, options) {
    const list = blocks && blocks.length ? blocks : [{ align: "left", runs: [{ text: "" }] }];
    const opts = options || {};
    const runDefaults = {};
    ["font", "size", "color"].forEach(key => {
      if (opts[key] != null) runDefaults[key] = opts[key];
    });
    return list.map((block, index) => {
      const blockRuns = (block.runs || []).map(run => {
        const merged = Object.assign({}, runDefaults, run);
        Object.keys(runDefaults).forEach(key => {
          if (run && run[key] == null) merged[key] = runDefaults[key];
        });
        return merged;
      });
      const runs = index === 0
        ? [Object.assign({}, runDefaults, { text: label, bold: true }), Object.assign({}, runDefaults, { text: " " })].concat(blockRuns)
        : blockRuns;
      const align = opts.align && (!block.align || block.align === "left") ? opts.align : (block.align || opts.align || "left");
      return docxPRuns(runs, Object.assign({}, opts, { align }));
    }).join("");
  }

  function wrapSheet(bodyHtml, options) {
    const opts = options || {};
    const cls = ["gr-sheet", opts.className || "", opts.landscape ? "gr-sheet-landscape" : "", opts.compact ? "gr-sheet-compact" : ""].filter(Boolean).join(" ");
    const attrs = opts.attrs
      ? Object.entries(opts.attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join("")
      : "";
    const footer = opts.footerHtml || "";
    const top = opts.topHtml || "";
    return `
      <div class="gr-sheet-wrap">
        <section class="${cls}"${attrs}>
          <div class="gr-sheet-inner">
            ${top ? `<div class="gr-sheet-top">${top}</div>` : ""}
            <div class="gr-sheet-body">${bodyHtml || ""}</div>
            ${footer}
          </div>
        </section>
        ${opts.pageActionsHtml || ""}
      </div>`;
  }

  function renderPageActionsHtml(pageIndex) {
    return `
      <div class="gr-page-actions no-print">
        <button type="button" class="gr-page-action" data-gr-copy-page="${pageIndex}" title="Копіювати сторінку як картинку">
          <img src="img/screenshot.png" alt="">
        </button>
        <button type="button" class="gr-page-action" data-gr-share-page="${pageIndex}" title="Поділитися сторінкою">
          <img src="img/share.png" alt="">
        </button>
      </div>`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  }

  async function imageSrcToDataUrl(src) {
    const url = new URL(src, document.baseURI).href;
    if (url.startsWith("data:")) return url;
    if (imageDataUrlCache.has(url)) return imageDataUrlCache.get(url);
    const promise = fetch(url, { cache: "force-cache" }).then(r => {
      if (!r.ok) throw new Error("Image load failed");
      return r.blob();
    }).then(blobToDataUrl);
    imageDataUrlCache.set(url, promise);
    return promise;
  }

  async function prepareImagesForCanvas(root, dropImages) {
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(imgs.map(async img => {
      if (dropImages) { img.setAttribute("data-html2canvas-ignore", "true"); return; }
      const src = img.currentSrc || img.getAttribute("src");
      if (!src) return;
      try {
        img.src = await imageSrcToDataUrl(src);
        img.removeAttribute("srcset");
        img.crossOrigin = "anonymous";
      } catch (err) {
        img.setAttribute("data-html2canvas-ignore", "true");
      }
    }));
  }

  async function captureSheetCanvas(sheetEl, options) {
    const host = document.createElement("div");
    host.className = "gr-pdf-capture-host";
    host.setAttribute("aria-hidden", "true");
    const clone = sheetEl.cloneNode(true);
    await prepareImagesForCanvas(clone, !!(options && options.dropImages));
    host.appendChild(clone);
    document.body.appendChild(host);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await html2canvas(clone, {
        scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", imageTimeout: 15000, logging: false
      });
    } finally {
      host.remove();
    }
  }

  async function captureSheetDataUrl(sheetEl, type, quality) {
    let canvas = await captureSheetCanvas(sheetEl);
    try {
      return canvas.toDataURL(type, quality);
    } catch (err) {
      if (!(err && err.name === "SecurityError")) throw err;
      canvas = await captureSheetCanvas(sheetEl, { dropImages: true });
      return canvas.toDataURL(type, quality);
    }
  }

  function addPdfTextMarkers(pdf, markers, pageSize) {
    (markers || []).forEach(marker => {
      if (!marker || !marker.text) return;
      pdf.setFontSize(Number(marker.size) || 1);
      const color = marker.color || [255, 255, 255];
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(String(marker.text), Number(marker.x) || 10, Number(marker.y) || (pageSize.height - 10));
    });
    pdf.setTextColor(0, 0, 0);
  }

  function getSheetsFromContainer(container) {
    return [...(container || document).querySelectorAll(".gr-sheet")];
  }

  function renumberSheetActions(container) {
    const sheets = getSheetsFromContainer(container);
    sheets.forEach((sheet, i) => {
      const wrap = sheet.closest(".gr-sheet-wrap");
      if (!wrap) return;
      const copy = wrap.querySelector("[data-gr-copy-page]");
      const share = wrap.querySelector("[data-gr-share-page]");
      if (copy) copy.setAttribute("data-gr-copy-page", String(i));
      if (share) share.setAttribute("data-gr-share-page", String(i));
    });
    return sheets;
  }

  async function copyPageImage(sheetEl, fileName) {
    if (typeof html2canvas !== "function") {
      if (typeof showMessage === "function") showMessage("html2canvas не завантажено", "err");
      return;
    }
    const canvas = await captureSheetCanvas(sheetEl);
    if (!navigator.clipboard || !window.ClipboardItem || !canvas.toBlob) {
      const a = document.createElement("a");
      a.download = fileName || "page.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      return;
    }
    canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => { if (typeof showMessage === "function") showMessage("Сторінку скопійовано", "ok", 2500); })
        .catch(() => { if (typeof showMessage === "function") showMessage("Не вдалося скопіювати", "warn"); });
    }, "image/png");
  }

  async function sharePageImage(sheetEl, fileName) {
    const canvas = await captureSheetCanvas(sheetEl);
    canvas.toBlob(async blob => {
      const file = new File([blob], fileName || "page.png", { type: "image/png" });
      if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
        await copyPageImage(sheetEl, fileName);
        return;
      }
      try { await navigator.share({ title: "Документ", files: [file] }); } catch (e) { /* cancelled */ }
    }, "image/png");
  }

  async function downloadPdfFromSheets(sheets, fileName, onProgress, options) {
    if (!sheets.length) return;
    if (typeof html2canvas !== "function" || !window.jspdf?.jsPDF) {
      if (typeof showMessage === "function") showMessage("Бібліотеки PDF не завантажені", "err");
      return;
    }
    const { jsPDF } = window.jspdf;
    const firstLandscape = sheets[0] && sheets[0].classList.contains("gr-sheet-landscape");
    const pdf = new jsPDF({ orientation: firstLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    for (let i = 0; i < sheets.length; i++) {
      if (onProgress) onProgress(i, sheets.length);
      const landscape = sheets[i].classList.contains("gr-sheet-landscape");
      if (i > 0) pdf.addPage("a4", landscape ? "l" : "p");
      const img = await captureSheetDataUrl(sheets[i], "image/jpeg", 0.95);
      const pageSize = landscape ? { width: 297, height: 210 } : { width: 210, height: 297 };
      const markers = typeof (options && options.textMarkers) === "function"
        ? options.textMarkers(sheets[i], i, pageSize)
        : (options && options.textMarkers);
      addPdfTextMarkers(pdf, markers, pageSize);
      pdf.addImage(img, "JPEG", 0, 0, pageSize.width, pageSize.height);
    }
    pdf.save(fileName || "document.pdf");
  }

  function collectPrintableSheets(containerSelector) {
    const root = containerSelector ? document.querySelector(containerSelector) : document.querySelector("#preview");
    const scope = root || document;
    return Array.from(scope.querySelectorAll(".gr-sheet"))
      .filter(sheet => sheet.offsetWidth > 0 || sheet.offsetHeight > 0 || sheet.getClientRects().length > 0);
  }

  function buildPrintPageStyle(sheets) {
    const list = Array.isArray(sheets) ? sheets : [];
    const hasSheets = list.length > 0;
    const hasLandscape = list.some(sheet => sheet.classList.contains("gr-sheet-landscape"));
    const allLandscape = hasSheets && hasLandscape && list.every(sheet => sheet.classList.contains("gr-sheet-landscape"));
    if (allLandscape) {
      return "@page { size: A4 landscape; margin: 0; } .gr-sheet-landscape { page: auto; }";
    }
    return "@page { size: A4 portrait; margin: 0; } @page gr-landscape { size: A4 landscape; margin: 0; } .gr-sheet-landscape { page: gr-landscape; }";
  }

  function ensureAutoPrintPageStyle() {
    if (document.getElementById("gr-print-page-style") || document.getElementById("gr-auto-print-page-style")) return;
    const sheets = collectPrintableSheets();
    if (!sheets.some(sheet => sheet.classList.contains("gr-sheet-landscape"))) return;
    const pageStyle = document.createElement("style");
    pageStyle.id = "gr-auto-print-page-style";
    pageStyle.textContent = buildPrintPageStyle(sheets);
    document.head.appendChild(pageStyle);
  }

  function removeAutoPrintPageStyle() {
    document.getElementById("gr-auto-print-page-style")?.remove();
  }

  if (!window.__grAutoPrintPageStyleBound) {
    window.__grAutoPrintPageStyleBound = true;
    window.addEventListener("beforeprint", ensureAutoPrintPageStyle);
    window.addEventListener("afterprint", removeAutoPrintPageStyle);
  }

  function printSheets(containerSelector) {
    document.body.classList.add("gr-printing");
    const pageStyle = document.createElement("style");
    pageStyle.id = "gr-print-page-style";
    pageStyle.textContent = buildPrintPageStyle(collectPrintableSheets(containerSelector));
    document.body.setAttribute("data-gr-print-container", containerSelector || "");
    document.head.appendChild(pageStyle);
    window.print();
    setTimeout(() => {
      document.body.classList.remove("gr-printing");
      document.body.removeAttribute("data-gr-print-container");
      pageStyle.remove();
    }, 500);
  }
  function bindPageActions(container, getSheets) {
    if (!container || container.dataset.grPageActionsBound === "1") return;
    container.dataset.grPageActionsBound = "1";
    container.addEventListener("click", e => {
      const copy = e.target.closest("[data-gr-copy-page]");
      const share = e.target.closest("[data-gr-share-page]");
      if (!copy && !share) return;
      const index = Number((copy || share).getAttribute(copy ? "data-gr-copy-page" : "data-gr-share-page"));
      const sheets = typeof getSheets === "function" ? getSheets() : renumberSheetActions(container);
      const sheet = sheets[index];
      if (!sheet) return;
      if (copy) copyPageImage(sheet, `page-${index + 1}.png`);
      else sharePageImage(sheet, `page-${index + 1}.png`);
    });
  }

  function defaultPlaceholderCatalog(homeMeta, lsItem) {
    const home = homeMeta || {};
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home) : {};
    const firstValue = (...values) => {
      for (const value of values) {
        if (value != null && String(value).trim() !== "") return value;
      }
      return "";
    };
    const items = [
      { label: firstValue(map.org, home.org, home.name, "Організація"), token: "{org}" },
      { label: firstValue(map.adr, home.adr, home.address, "Адреса"), token: "{adr}" },
      { label: firstValue(map.adrfull, home.adrfull, map.adr, home.adr, "Повна адреса"), token: "{adrfull}" },
      { label: firstValue(map.okpo, home.okpo, home.code, "ЄДРПОУ"), token: "{okpo}" },
      { label: firstValue(map["ГоловаFull"], map["головаfull"], home["ГоловаFull"], home["головаfull"], "Голова (ПІБ)"), token: "{ГоловаFull}" },
      { label: firstValue(map["голова"], "Голова (скорочено)"), token: "{голова}" },
      { label: "Дата документа", token: "{дата}" },
      { label: "1 число місяця", token: "{1число}" },
      { label: "Останній день місяця", token: "{останнійдень:dd.mm.yyyy}" },
      { label: "1 число наступного місяця", token: "{наступниймісяць:dd.mm.yyyy}" },
      { label: "Дата прописом", token: "{дата:dd mmmm yyyy р.}" },
      { label: "Дата з «»", token: "{дата:<<dd>> mmmm yyyy}" },
      { label: "Число/дата прописью", token: "{propis}" }
    ];
    if (lsItem) {
      const fp = parseFioParts(lsItem.fio);
      items.push(
        { label: lsItem.fio || "PIB", token: "{fio}" },
        { label: buildObr(lsItem.fio, lsItem.kv, lsItem.pers), token: "{obr}" },
        { label: buildObrKr(lsItem.fio), token: "{obrKr}" },
        { label: "Борг на початок", token: "{borgStart}" },
        { label: "Борг на кінець", token: "{borgEnd}" },
        { label: "Нараховано", token: "{nachisleno}" },
        { label: "Сплачено", token: "{oplacheno}" }
      );
      if (fp.ok) {
        items.push(
          { label: fp.last, token: "{familia}" },
          { label: fp.namePatronymic, token: "{imiapatronymic}" },
          { label: fp.initials, token: "{initials}" }
        );
      }
    }
    return items;
  }

  function initPlaceholderPicker(root, getCatalog) {
    if (!root) return;
    root.querySelectorAll("[data-gr-ph-picker]").forEach(btn => {
      if (btn.dataset.grPhBound === "1") return;
      btn.dataset.grPhBound = "1";
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        const field = btn.closest(".gr-ph-field");
        const input = field && (field.querySelector("textarea, input[type=text]"));
        if (!input) return;
        let panel = field.querySelector(".gr-ph-panel");
        if (!panel) {
          panel = document.createElement("div");
          panel.className = "gr-ph-panel";
          panel.hidden = true;
          panel.innerHTML = `<input type="search" class="gr-ph-filter" placeholder="Пошук..."><div class="gr-ph-list"></div>`;
          field.appendChild(panel);
          panel.querySelector(".gr-ph-filter").addEventListener("input", () => fillPanel());
          panel.addEventListener("click", ev => {
            const opt = ev.target.closest("[data-gr-ph-token]");
            if (!opt) return;
            insertAtCursor(input, opt.getAttribute("data-gr-ph-token"));
            panel.hidden = true;
          });
        }
        function fillPanel() {
          const q = (panel.querySelector(".gr-ph-filter").value || "").trim();
          const catalog = typeof getCatalog === "function" ? getCatalog() : [];
          const list = panel.querySelector(".gr-ph-list");
          list.innerHTML = catalog.filter(it => !q || matchesSearch(it.label, q) || matchesSearch(it.token, q))
            .map(it => `<button type="button" data-gr-ph-token="${escapeHtml(it.token)}"><span>${escapeHtml(it.label)}</span><code>${escapeHtml(it.token)}</code></button>`)
            .join("") || `<div class="gr-ph-empty">Нічого не знайдено</div>`;
        }
        const open = panel.hidden !== false;
        document.querySelectorAll(".gr-ph-panel").forEach(p => { p.hidden = true; });
        if (open) { panel.hidden = false; fillPanel(); panel.querySelector(".gr-ph-filter").focus(); }
      });
    });
    if (!document.documentElement.dataset.grPhDocBound) {
      document.documentElement.dataset.grPhDocBound = "1";
      document.addEventListener("click", e => {
        if (e.target.closest(".gr-ph-panel, [data-gr-ph-picker]")) return;
        document.querySelectorAll(".gr-ph-panel").forEach(p => { p.hidden = true; });
      });
    }
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function initPlaceholderHint(root, options) {
    if (!root) return;
    const names = options && Array.isArray(options.names)
      ? new Set(options.names.map(name => String(name)))
      : null;
    root.querySelectorAll(".gr-ph-field textarea").forEach(ta => {
      if (names && !names.has(String(ta.getAttribute("name") || ""))) return;
      if (ta.dataset.grHintBound === "1") return;
      ta.dataset.grHintBound = "1";
      const hint = document.createElement("div");
      hint.className = "gr-ph-hint";
      hint.innerHTML = `<strong>Placeholders:</strong> {org}, {adr}, {ГоловаFull}, {дата}, {1число}, {propis}<br>
        <strong>Вирівнювання:</strong> {==} по центру, {=>} праворуч, {<=} ліворуч, {<==>} по ширині<br>
        <strong>Формат:</strong> *жирний*, _підкреслений_, //курсив//, {f14}розмір{f}, {m:ий|f:а}`;
      const wrap = ta.closest(".gr-ph-field") || ta.parentElement;
      if (wrap) {
        wrap.classList.add("gr-ph-field");
        wrap.appendChild(hint);
        const sync = () => { hint.classList.toggle("is-hidden", !!ta.value.trim()); };
        ta.addEventListener("input", sync);
        ta.addEventListener("focus", sync);
        sync();
      }
    });
  }

  function ensureDocumentsSidebar(homeCode) {
    if (typeof reportsInit === "function") reportsInit(homeCode);
    document.body.classList.add("files-mode");
  }

  function apartmentLinkHtml(kv, accountId, homeCode) {
    const attrs = accountId
      ? ` role="button" tabindex="0" title="Відкрити особовий рахунок" data-gr-account-id="${escapeHtml(accountId)}" data-gr-home-code="${escapeHtml(homeCode || "")}"`
      : "";
    return `<span class="gr-apt-no${accountId ? " gr-apt-link" : ""}"${attrs}>${escapeHtml(kv)}</span>`;
  }

  async function openAccountFromDocument(el) {
    const accountId = el && el.getAttribute("data-gr-account-id");
    const targetHomeCode = el && el.getAttribute("data-gr-home-code");
    if (!accountId) return;
    try {
      if (targetHomeCode && typeof handleMenuClick === "function") {
        await handleMenuClick(String(targetHomeCode), "accounts", null);
      }
      const account = (typeof ls !== "undefined" && ls) ? ls[accountId] : null;
      if (account && typeof setParam === "function") setParam("kv", account.kv || account.ls || accountId);
      if (!document.getElementById("din") && typeof initLS === "function") initLS();
      const input = document.getElementById("number");
      if (input && account) input.value = account.kv || "";
      if (typeof addStuff === "function") addStuff(accountId);
    } catch (err) {
      console.error("Не вдалося відкрити особовий рахунок", err);
      if (typeof showMessage === "function") showMessage("Не вдалося відкрити особовий рахунок", "err", 4000);
    }
  }

  function bindAccountLinks(container) {
    if (!container || container.dataset.grAccountLinksBound === "1") return;
    container.dataset.grAccountLinksBound = "1";
    container.addEventListener("click", e => {
      const account = e.target.closest("[data-gr-account-id]");
      if (!account || !container.contains(account)) return;
      e.preventDefault();
      e.stopPropagation();
      openAccountFromDocument(account);
    });
    container.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const account = e.target.closest("[data-gr-account-id]");
      if (!account || !container.contains(account)) return;
      e.preventDefault();
      openAccountFromDocument(account);
    });
  }

  window.GrCommon = {
    escapeHtml,
    numberValue,
    roundMoney,
    formatMoney,
    moneyText,
    monthNameUa,
    formatDateUa,
    matchesSearch,
    buildDatePlaceholders,
    replacePlaceholders,
    canAutoResolvePlaceholder,
    collectUnknownPlaceholderKeys,
    requestMissingPlaceholdersFromUI,
    ensureUnknownPlaceholders,
    applyPropisPlaceholders,
    previousNumberOrDateInfo,
    previousNumberOrDateText,
    moneyToWords,
    dateToWords,
    parseRichText,
    renderRichHtml,
    renderRichPlain,
    renderRuns,
    escapeXml,
    docxRun,
    docxP,
    docxPRuns,
    docxRichParagraphs,
    docxLabelParagraph,
    docxLabelRichParagraphs,
    wrapSheet,
    renderPageActionsHtml,
    captureSheetCanvas,
    captureSheetDataUrl,
    copyPageImage,
    sharePageImage,
    downloadPdfFromSheets,
    printSheets,
    bindPageActions,
    renumberSheetActions,
    getSheetsFromContainer,
    buildLsPlaceholders,
    buildObr,
    buildObrKr,
    parseFioParts,
    detectGenderFromFio,
    defaultPlaceholderCatalog,
    initPlaceholderPicker,
    initPlaceholderHint,
    insertAtCursor,
    ensureDocumentsSidebar,
    apartmentLinkHtml,
    openAccountFromDocument,
    bindAccountLinks
  };
})();

