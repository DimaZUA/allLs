var data = {};
let hk=0;
const DOCX_ORG_HEADER_FONT_SCALE = [
  { maxLen: 8, halfPoints: 56 },        // 28 pt
  { maxLen: 10, halfPoints: 52 },       // 26 pt
  { maxLen: 12, halfPoints: 48 },       // 24 pt
  { maxLen: 14, halfPoints: 36 },       // 18 pt
  { maxLen: 16, halfPoints: 30 },       // 16 pt
  { maxLen: 18, halfPoints: 30 },       // 16 pt
  { maxLen: 21, halfPoints: 28 },       // 14 pt
  { maxLen: 24, halfPoints: 26 },       // 13 pt
  { maxLen: Infinity, halfPoints: 24 }  // 12 pt
];
// Вспомогательный массив для украинских месяцев
const ukrMonths = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
];

// Вспомогательная функция для получения смещенной даты
function getOffsetDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// Форматирование: dd.mm.yyyy
function formatDotted(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Форматирование: dd mmmm yyyy (укр)
function formatFullUkr(date, quoteDay = false) {
  const dd = date.getDate();
  const mm = ukrMonths[date.getMonth()];
  const yyyy = date.getFullYear();
  const dayStr = quoteDay ? `"${String(dd).padStart(2, "0")}"` : dd;
  return `${dayStr} ${mm} ${yyyy} року`;
}
function displayHomeInfo(homeCode) {
  hk=homeCode;
  var home = homes.find(function (h) {
    return h.code === homeCode;
  });

  if (!home) {
    document.getElementById("maincontainer").innerHTML =
      "<h2>Информация не найдена</h2>";
    return;
  }

  // делаем копию, чтобы не портить исходный объект
  data = { ...home };

  var fieldMapping = {
    okpo: "code",
    ORGKR: "name",
    org: "name",
    adrfull: "adr",
    головаfull: "головаfull",
  };

  for (var targetField in fieldMapping) {
    var sourceField = fieldMapping[targetField];
    if (data[targetField] == null && data[sourceField] != null) {
      data[targetField] = data[sourceField];
    }
  }

  // Словарь для отображения ключей
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

  var infoHtml = `
    <div id="dropArea">
      Перетащите файлы сюда или кликните, чтобы выбрать
    </div>
    <input type="file" id="uploadFile" multiple style="display: none;">

    <h2>Информация о доме: ${home.name}</h2>
    <ul>
  `;

  for (var key in home) {
    if (home.hasOwnProperty(key) && keyMap[key] && home[key]) {
      infoHtml += `
        <li
          title="{${key}}"
          onclick="copyToClipboard('{${key}}')"
        >
          <strong>${keyMap[key]}:</strong> ${home[key]}
        </li>
      `;
    }
  }

  infoHtml += `
    </ul>

    <style>
      p {
        margin: 0;
        padding: 0;
        line-height: 1.2;
      }
    </style>

    <h3>Реквізити:</h3>
  `;

  if (home.name && home.Руководителя) {
    infoHtml += `
      <p>
        ${home.name} в особі ${home.Руководителя},
        що діє на підставі Статуту,
      </p>
      <br>
    `;
  }

  if (home.name) {
    infoHtml += `
      <p><strong>Найменування:</strong> ${home.name}</p>
    `;
  }

  if (home.adr) {
    infoHtml += `
      <p><strong>Адреса:</strong> ${home.adr}</p>
    `;
  }

  if (home.code) {
    infoHtml += `
      <p><strong>Код ЄДРПОУ:</strong> ${home.code}</p>
    `;
  }

  if (home.Iban) {
    infoHtml += `
      <p>
        <strong>IBAN:</strong>
        ${home.Iban}${home.Bank ? " в " + home.Bank : ""}
      </p>
    `;
  }

  if (home.email) {
    infoHtml += `
      <p><strong>Електронна пошта:</strong> ${home.email}</p>
    `;
  }

  if (home.tel) {
    infoHtml += `
      <p><strong>Телефон:</strong> ${home.tel}</p>
    `;
  }

  if (home.Podpis) {
    infoHtml += `
      <p>${home.Podpis}</p>
    `;
  }

  document.getElementById("maincontainer").innerHTML = infoHtml;
  var maincontainer= document.getElementById("maincontainer");
  var dropArea = document.getElementById("dropArea");
  var fileInput = document.getElementById("uploadFile");

  // UI-обработчики (без дублирования)
  dropArea.onclick = function () {
    fileInput.click();
  };

  maincontainer.ondragover = function (event) {
    event.preventDefault();
    dropArea.classList.add("hover");
  };

  maincontainer.ondragleave = function () {
    dropArea.classList.remove("hover");
  };

  maincontainer.ondrop = function (event) {
    event.preventDefault();
    dropArea.classList.remove("hover");
    if (event.dataTransfer.files.length) {
      processFiles(event.dataTransfer.files);
    }
  };

fileInput.onchange = function (event) {
  if (event.target.files.length) {
    processFiles(event.target.files);
  }

  // ⬅️ КРИТИЧЕСКИ ВАЖНО
  event.target.value = "";
};

  const res=analyzeTypicalApartments(true);
  console.log ('res:');
  console.log (res);
}


//==========================================
// Обработка документов
//==========================================

function processFiles(files) {
  for (const file of files) {
    const reader = new FileReader();

    reader.onload = async function (event) {
      const content = event.target.result;
      const originalFileName = file.name;
      const extension = originalFileName.split(".").pop().toLowerCase();

      /* =====================================================
         1. Извлекаем плейсхолдеры, реально присутствующие в файле
         ===================================================== */

      let fileKeys = new Set();

      if (extension === "txt" || extension === "xml") {
        fileKeys = extractPlaceholdersFromTextContent(content);
      } else if (extension === "xlsx") {
        fileKeys = await extractPlaceholdersFromXlsx(content);
      } else if (extension === "docx") {
        fileKeys = extractPlaceholdersFromDocx(content);
      }

      /* =====================================================
         2. Формируем карту подстановок из data
         ===================================================== */

      const replacements = getReplacementMap(data);

      /* =====================================================
         2.1 Автоключ {голова} из {головаfull}
         ===================================================== */

      if (
        typeof replacements["головаfull"] === "string" &&
        replacements["головаfull"].trim() !== ""
      ) {
        const parts = replacements["головаfull"].trim().split(/\s+/);

        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstInitial = parts[1] ? parts[1][0] + "." : "";
          const middleInitial = parts[2] ? " " + parts[2][0] + "." : "";

          replacements["голова"] =
            `${lastName} ${firstInitial}${middleInitial}`.trim();
        } else {
          replacements["голова"] = replacements["головаfull"];
        }
      }

      /* =====================================================
         3. Определяем, какие computed-плейсхолдеры используются
         ===================================================== */

      const usedComputedKeys = Object.keys(computedPlaceholders || {})
        .filter(key => fileKeys.has(key));

      /* =====================================================
         4. Собираем недостающие ключи
            - обычные {KEY}
            - зависимости computed-плейсхолдеров
            - исключаем {A/B}
         ===================================================== */

      const missingKeys = [];

      // обычные плейсхолдеры
      for (const key of fileKeys) {
        if (key.includes("/")) {
          continue;
        }

        if (computedPlaceholders && computedPlaceholders[key]) {
          continue;
        }

        if (isMissingValue(replacements, key)) {
          missingKeys.push(key);
        }
      }

      // зависимости вычисляемых плейсхолдеров
      usedComputedKeys.forEach(computedKey => {
        const rule = computedPlaceholders[computedKey];

        if (!rule || !Array.isArray(rule.dependsOn)) {
          return;
        }

        rule.dependsOn.forEach(depKey => {
          if (isMissingValue(replacements, depKey)) {
            missingKeys.push(depKey);
          }
        });
      });

      // делаем список уникальным
      const uniqueMissingKeys = [...new Set(missingKeys)];

      /* =====================================================
         5. Запрашиваем недостающие значения через UI
         ===================================================== */

      if (uniqueMissingKeys.length > 0) {
        try {
          await requestMissingValuesFromUI(uniqueMissingKeys, replacements);
        } catch (e) {
          // пользователь нажал "Отмена" — просто пропускаем файл
          console.warn(`Файл "${originalFileName}" пропущен пользователем`);
          return;
        }
      }

      /* =====================================================
         6. Вычисляем computed-плейсхолдеры
         ===================================================== */

      usedComputedKeys.forEach(computedKey => {
        const rule = computedPlaceholders[computedKey];

        if (
          rule &&
          typeof rule.compute === "function"
        ) {
          replacements[computedKey] = rule.compute(replacements);
        }
      });

      /* =====================================================
         7. Формируем имя выходного файла
         ===================================================== */

      const newFileName = buildNewFileName(originalFileName);

      /* =====================================================
         8. Обрабатываем файл по типу
         ===================================================== */

      try {
        if (extension === "docx") {
          processWordFile(content, newFileName, replacements);
        } else if (extension === "xlsx") {
          await processExcelFile(content, newFileName, replacements);
        } else if (extension === "txt") {
          processTextFile(content, newFileName, replacements);
        } else if (extension === "xml") {
          processXmlFile(content, newFileName, replacements);
        } else {
          console.warn(
            `Файл "${originalFileName}" пропущен: неподдерживаемый формат`
          );
        }
      } catch (err) {
        console.error(`Ошибка обработки файла "${originalFileName}"`, err);
      }
    };

    reader.onerror = function () {
      console.error(`Ошибка чтения файла: ${file.name}`);
    };

    reader.readAsArrayBuffer(file);
  }
}


//==========================================
// Вспомогательные функции
//==========================================

function getReplacementMap(sourceData) {
  const map = {};

  if (!sourceData || typeof sourceData !== "object") {
    return map;
  }

  // 1. Формируем orgfull (берем первое непустое)
  sourceData.orgfull = sourceData.orgfull || sourceData.name || org || "";

  // 2. Формируем mfo из Iban, если само mfo пустое
  if (!sourceData.mfo || String(sourceData.mfo).trim() === "") {
    if (sourceData.Iban && sourceData.Iban.length >= 10) {
      // 5, 6, 7, 8, 9, 10 символы — это индекс с 4 по 10
      sourceData.mfo = sourceData.Iban.substring(4, 10);
    }
  }

  // Теперь переносим всё в карту замен в нижнем регистре
  Object.keys(sourceData).forEach(function (key) {
    const value = sourceData[key];
    map[key.toLowerCase()] =
      value === null || value === undefined ? "" : String(value);
  });

  return map;
}

function buildNewFileName(originalFileName) {
  // 1. Разделяем имя и расширение
  const dotIndex = originalFileName.lastIndexOf(".");
  let name =
    dotIndex >= 0
      ? originalFileName.slice(0, dotIndex)
      : originalFileName;
  const ext =
    dotIndex >= 0
      ? originalFileName.slice(dotIndex)
      : "";

  /*
    2. Удаляем TPL как маркер шаблона

    Правила:
    - TPL должно удаляться вместе с несловесными символами вокруг
    - Работает для:
      TPL_Документ
      Документ TPL
      Документа-TPL-
      Документ_TPL
  */

  name = name.replace(
    /([^a-zA-Z0-9а-яА-ЯёЁ]*)TPL([^a-zA-Z0-9а-яА-ЯёЁ]*)/gi,
    " "
  );

  // Чистим хвосты: лишние пробелы, подчёркивания, дефисы
  name = name
    .replace(/\s+/g, " ")
    .trim();

  // 3. Формируем дату и время
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const dateTime = `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;

  const home = homes.find(h => h.code === hk);
  const prefix = home && home.org3 ? home.org3 + "_" : "";

  // 4. Итоговое имя файла
  return `${prefix}${name}_${dateTime}${ext}`;
}


//==========================================
// Нормализация текста шаблона
//==========================================

function normalizeTemplateText(text, replacements, orgValue) {
  text = resolveConditionalPlaceholders(text, orgValue);
  text = replacePlaceholders(text, replacements);
  return text;
}

//==========================================
// Извлечение плейсхолдеров
//==========================================

function extractPlaceholdersFromTextContent(content) {
  const text = new TextDecoder().decode(content);
  return extractPlaceholdersFromText(text);
}

function extractPlaceholdersFromText(text) {
  const keys = new Set();
  const re = /\{([^}]+)\}/g;
  let match;

  while ((match = re.exec(text)) !== null) {
    keys.add(match[1].toLowerCase());
  }

  return keys;
}

async function extractPlaceholdersFromXlsx(content) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(content);

  const keys = new Set();

  workbook.eachSheet(function (sheet) {
    sheet.eachRow(function (row) {
      row.eachCell(function (cell) {
        const text =
          cell.value && cell.value.formula
            ? cell.value.formula
            : cell.value != null
            ? cell.value.toString()
            : "";

        extractPlaceholdersFromText(text).forEach(function (k) {
          keys.add(k);
        });
      });
    });
  });

  return keys;
}

function extractPlaceholdersFromDocx(content) {
  const zip = new PizZip(content);

  const doc = new window.docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" }
  });

  const fullText = doc.getFullText();
  return extractPlaceholdersFromText(fullText);
}

//==========================================
// Проверка отсутствующих значений
//==========================================

function isMissingValue(replacements, key) {
  return (
    !replacements.hasOwnProperty(key) ||
    replacements[key] === null ||
    replacements[key] === undefined ||
    String(replacements[key]).trim() === ""
  );
}

//==========================================
// Замена данных
//==========================================

function replacePlaceholders(text, replacements) {
  let result = text;

  Object.keys(replacements).forEach(function (key) {
    const re = new RegExp(`\\{${key}\\}`, "gi");
    result = result.replace(re, replacements[key]);
  });

  return result;
}

function replaceCellValue(cellValue, replacements) {
  const text =
    cellValue && cellValue.formula
      ? cellValue.formula
      : cellValue != null
      ? cellValue.toString()
      : "";

  return normalizeTemplateText(text, replacements, data.org);
}

//==========================================
// Обработка файлов
//==========================================

function processTextFile(content, newFileName, replacements) {
  let text = new TextDecoder().decode(content);
  text = normalizeTemplateText(text, replacements, data.org);

  saveAs(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
    newFileName
  );
}

function processXmlFile(content, newFileName, replacements) {
  let xmlText = new TextDecoder().decode(content);
  xmlText = normalizeTemplateText(xmlText, replacements, data.org);

  saveAs(
    new Blob([xmlText], { type: "application/xml" }),
    newFileName
  );
}

async function processExcelFile(content, newFileName, replacements) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(content);

  const worksheet = workbook.worksheets[0];

  worksheet.eachRow(function (row) {
    row.eachCell(function (cell) {
      const newValue = replaceCellValue(cell.value, replacements);

      if (cell.value && cell.value.formula) {
        cell.value.formula = newValue;
      } else {
        cell.value = newValue;
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), newFileName);
}

function decodeDocxXmlText(text) {
  return String(text || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractDocxParagraphText(paragraphXml) {
  const parts = [];
  String(paragraphXml || "").replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g, function (_, text) {
    parts.push(decodeDocxXmlText(text));
    return _;
  });
  return parts.join("").replace(/\s+/g, " ").trim();
}

function getDocxParagraphFontHalfPoints(paragraphXml) {
  const match = String(paragraphXml || "").match(/<w:sz\b[^>]*\bw:val="(\d+)"/);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : 24;
}

function docxCssLengthToTwips(value) {
  const text = String(value || "").trim();
  const match = text.match(/^([0-9.]+)\s*(pt|in|cm|mm)?$/i);
  if (!match) return 0;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = String(match[2] || "pt").toLowerCase();
  if (unit === "in") return n * 1440;
  if (unit === "cm") return n * 566.929;
  if (unit === "mm") return n * 56.6929;
  return n * 20;
}

function parseVmlInsetTwips(insetValue) {
  const parts = String(insetValue || "").split(",").map(function (part) {
    return docxCssLengthToTwips(part);
  });
  return {
    left: Number.isFinite(parts[0]) && parts[0] > 0 ? parts[0] : 108,
    right: Number.isFinite(parts[2]) && parts[2] > 0 ? parts[2] : 108
  };
}

function getDocxParagraphWidthTwips(headerXml, paragraphOffset) {
  const before = headerXml.slice(0, paragraphOffset);
  const drawingStart = before.lastIndexOf("<w:drawing");
  const drawingEndBefore = before.lastIndexOf("</w:drawing>");
  if (drawingStart > drawingEndBefore) {
    const drawingEnd = headerXml.indexOf("</w:drawing>", paragraphOffset);
    if (drawingEnd > paragraphOffset) {
      const drawingXml = headerXml.slice(drawingStart, drawingEnd);
      const extent = drawingXml.match(/<wp:extent\b[^>]*\bcx="(\d+)"/);
      if (extent) {
        const value = Number(extent[1]) / 635;
        const bodyPr = drawingXml.match(/<(?:wps:)?bodyPr\b[^>]*>/);
        const leftIns = bodyPr && bodyPr[0].match(/\blIns="(\d+)"/);
        const rightIns = bodyPr && bodyPr[0].match(/\brIns="(\d+)"/);
        const marginLeft = leftIns ? Number(leftIns[1]) / 635 : 108;
        const marginRight = rightIns ? Number(rightIns[1]) / 635 : 108;
        if (Number.isFinite(value) && value > 0) {
          return Math.max(1, value - (Number.isFinite(marginLeft) ? marginLeft : 108) - (Number.isFinite(marginRight) ? marginRight : 108));
        }
      }
    }
  }

  const pictStart = before.lastIndexOf("<w:pict");
  const pictEndBefore = before.lastIndexOf("</w:pict>");
  if (pictStart > pictEndBefore) {
    const pictEnd = headerXml.indexOf("</w:pict>", paragraphOffset);
    if (pictEnd > paragraphOffset) {
      const pictXml = headerXml.slice(pictStart, pictEnd);
      const widthPt = pictXml.match(/width\s*:\s*([0-9.]+)\s*pt/i);
      if (widthPt) {
        const value = Number(widthPt[1]) * 20;
        const inset = pictXml.match(/\binset="([^"]+)"/i);
        const margins = inset ? parseVmlInsetTwips(inset[1]) : { left: 108, right: 108 };
        if (Number.isFinite(value) && value > 0) return Math.max(1, value - margins.left - margins.right);
      }
      const widthIn = pictXml.match(/width\s*:\s*([0-9.]+)\s*in/i);
      if (widthIn) {
        const value = Number(widthIn[1]) * 1440;
        const inset = pictXml.match(/\binset="([^"]+)"/i);
        const margins = inset ? parseVmlInsetTwips(inset[1]) : { left: 108, right: 108 };
        if (Number.isFinite(value) && value > 0) return Math.max(1, value - margins.left - margins.right);
      }
      const widthCm = pictXml.match(/width\s*:\s*([0-9.]+)\s*cm/i);
      if (widthCm) {
        const value = Number(widthCm[1]) * 566.929;
        const inset = pictXml.match(/\binset="([^"]+)"/i);
        const margins = inset ? parseVmlInsetTwips(inset[1]) : { left: 108, right: 108 };
        if (Number.isFinite(value) && value > 0) return Math.max(1, value - margins.left - margins.right);
      }
    }
  }

  const tcStart = before.lastIndexOf("<w:tc");
  const tcEndBefore = before.lastIndexOf("</w:tc>");
  if (tcStart > tcEndBefore) {
    const tcEnd = headerXml.indexOf("</w:tc>", paragraphOffset);
    if (tcEnd > paragraphOffset) {
      const tcXml = headerXml.slice(tcStart, tcEnd);
      const tcWidth = tcXml.match(/<w:tcW\b[^>]*\bw:w="(\d+)"/);
      if (tcWidth) {
        const value = Number(tcWidth[1]);
        if (Number.isFinite(value) && value > 0) {
          const leftMar = tcXml.match(/<w:left\b[^>]*\bw:w="(\d+)"/);
          const rightMar = tcXml.match(/<w:right\b[^>]*\bw:w="(\d+)"/);
          const marginLeft = leftMar ? Number(leftMar[1]) : 108;
          const marginRight = rightMar ? Number(rightMar[1]) : 108;
          const innerWidth = value - (Number.isFinite(marginLeft) ? marginLeft : 108) - (Number.isFinite(marginRight) ? marginRight : 108);
          return Math.max(1, innerWidth);
        }
      }
    }
  }

  const pgSz = headerXml.match(/<w:pgSz\b[^>]*\bw:w="(\d+)"/);
  const pgMar = headerXml.match(/<w:pgMar\b[^>]*\bw:left="(\d+)"[^>]*\bw:right="(\d+)"/);
  const pageWidth = pgSz ? Number(pgSz[1]) : 11906;
  const left = pgMar ? Number(pgMar[1]) : 1440;
  const right = pgMar ? Number(pgMar[2]) : 1440;
  const width = pageWidth - left - right;
  return Number.isFinite(width) && width > 0 ? width : 8926;
}

function estimateDocxTextWidthTwips(text, halfPoints) {
  const hp = Math.max(1, Number(halfPoints) || 24);
  let units = 0;
  String(text || "").split("").forEach(function (ch) {
    if (/\s/.test(ch)) units += 0.36;
    else if (/[.,:;'"’`!?|/\\()[\]{}]/.test(ch)) units += 0.28;
    else if (/[A-ZА-ЯІЇЄҐ]/.test(ch)) units += 0.72;
    else if (/[0-9]/.test(ch)) units += 0.56;
    else units += 0.56;
  });
  const safetyFactor = units <= 7
    ? 1.02
    : (units <= 10 ? 1.08 : 1.38);
  return units * hp * 10 * safetyFactor;
}

function estimateDocxLineCount(text, halfPoints, widthTwips) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return 1;
  const width = Math.max(1, Number(widthTwips) || 1);
  const words = normalized.split(" ");
  let lines = 1;
  let lineWidth = 0;
  const spaceWidth = estimateDocxTextWidthTwips(" ", halfPoints);

  words.forEach(function (word) {
    const wordWidth = estimateDocxTextWidthTwips(word, halfPoints);
    if (lineWidth <= 0) {
      lineWidth = wordWidth;
      if (wordWidth > width) lines += Math.ceil(wordWidth / width) - 1;
      return;
    }
    if (lineWidth + spaceWidth + wordWidth <= width) {
      lineWidth += spaceWidth + wordWidth;
    } else {
      lines += 1;
      lineWidth = wordWidth;
      if (wordWidth > width) lines += Math.ceil(wordWidth / width) - 1;
    }
  });

  return Math.max(1, lines);
}

function setDocxRunFontHalfPoints(runXml, halfPoints) {
  const value = String(Math.max(1, Math.round(Number(halfPoints) || 24)));

  function updateRPr(rPrXml) {
    let out = rPrXml;
    if (/<w:sz\b/.test(out)) {
      out = out.replace(/<w:sz\b[^>]*\/>/, `<w:sz w:val="${value}"/>`);
    } else {
      out = out.replace("</w:rPr>", `<w:sz w:val="${value}"/></w:rPr>`);
    }
    if (/<w:szCs\b/.test(out)) {
      out = out.replace(/<w:szCs\b[^>]*\/>/, `<w:szCs w:val="${value}"/>`);
    } else {
      out = out.replace("</w:rPr>", `<w:szCs w:val="${value}"/></w:rPr>`);
    }
    return out;
  }

  if (/<w:rPr\b/.test(runXml)) {
    return runXml.replace(/<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/, updateRPr);
  }
  return runXml.replace(/(<w:r\b[^>]*>)/, `$1<w:rPr><w:sz w:val="${value}"/><w:szCs w:val="${value}"/></w:rPr>`);
}

function setDocxParagraphFontHalfPoints(paragraphXml, halfPoints) {
  return String(paragraphXml || "").replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, function (runXml) {
    if (!/<w:t\b|<w:tab\b|<w:br\b/.test(runXml)) return runXml;
    return setDocxRunFontHalfPoints(runXml, halfPoints);
  });
}

function normalizeDocxFitValue(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function getDocxOrgVisualLength(text) {
  let len = 0;
  String(text || "").replace(/\s+/g, " ").trim().split("").forEach(function (ch) {
    if (/\s/.test(ch)) len += 0.5;
    else if (/[.,:;'"’`!?|/\\()[\]{}]/.test(ch)) len += 0.35;
    else if (/[A-ZА-ЯІЇЄҐ]/.test(ch)) len += 1.25;
    else if (/[0-9]/.test(ch)) len += 0.9;
    else len += 0.85;
  });
  return len;
}

function pickDocxOrgHeaderFontSize(text) {
  const len = getDocxOrgVisualLength(text);
  const rule = DOCX_ORG_HEADER_FONT_SCALE.find(function (item) {
    return len <= item.maxLen;
  });
  return rule ? rule.halfPoints : 24;
}

function pickDocxHeaderFontSize(text, currentHalfPoints, widthTwips, options) {
  const minHalfPoints = options.minHalfPoints;
  const maxHalfPoints = options.maxHalfPoints;
  const maxLines = options.maxLines;
  const canIncrease = !!options.canIncrease;
  const current = Math.max(minHalfPoints, Math.min(maxHalfPoints, Math.round(currentHalfPoints || 24)));
  let best = current;

  if (canIncrease) {
    for (let hp = minHalfPoints; hp <= maxHalfPoints; hp += 1) {
      if (estimateDocxLineCount(text, hp, widthTwips) <= maxLines) best = hp;
      else if (hp > current) break;
    }
    return best;
  }

  best = current;
  while (best > minHalfPoints && estimateDocxLineCount(text, best, widthTwips) > maxLines) {
    best -= 1;
  }
  return best;
}

function adjustDocxHeaderPlaceholderFonts(zip, replacements) {
  if (!zip || !zip.files || !replacements) return;

  const orgValues = ["orgkr", "org", "orgfull"].map(function (key) {
    return normalizeDocxFitValue(replacements[key]);
  }).filter(Boolean);
  const addressValues = ["adr", "adrfull", "adrlong"].map(function (key) {
    return normalizeDocxFitValue(replacements[key]);
  }).filter(Boolean);

  const uniqueOrgValues = Array.from(new Set(orgValues));
  const uniqueAddressValues = Array.from(new Set(addressValues));
  if (!uniqueOrgValues.length && !uniqueAddressValues.length) return;

  Object.keys(zip.files).forEach(function (path) {
    if (!/^word\/header\d+\.xml$/i.test(path)) return;
    const file = zip.file(path);
    if (!file) return;

    let xml = file.asText();
    xml = xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, function (paragraphXml, offset) {
      const paragraphText = extractDocxParagraphText(paragraphXml);
      if (!paragraphText) return paragraphXml;

      const orgMatch = uniqueOrgValues.some(function (value) {
        return value && paragraphText.includes(value);
      });
      const addressMatch = uniqueAddressValues.some(function (value) {
        return value && paragraphText.includes(value);
      });
      if (!orgMatch && !addressMatch) return paragraphXml;

      const currentHalfPoints = getDocxParagraphFontHalfPoints(paragraphXml);
      const targetHalfPoints = orgMatch
        ? pickDocxOrgHeaderFontSize(paragraphText)
        : pickDocxHeaderFontSize(
            paragraphText,
            currentHalfPoints,
            getDocxParagraphWidthTwips(xml, offset),
            {
              minHalfPoints: 14,
              maxHalfPoints: currentHalfPoints,
              maxLines: 2,
              canIncrease: false
            }
          );

      return setDocxParagraphFontHalfPoints(paragraphXml, targetHalfPoints);
    });

    zip.file(path, xml);
  });
}

function processWordFile(content, newFileName, replacements) {
  const zip = new PizZip(content);

  const doc = new window.docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },

    // 👇 КЛЮЧЕВОЕ МЕСТО
    parser: function (tag) {
      return {
        get: function (scope) {
          // 1. Условный {A/B}
          if (tag.includes("/")) {
            const resolved = resolveConditionalKey(tag, data.org);
            if (resolved !== null) {
              return resolved;
            }
          }

          // 2. Обычный {KEY}
          const key = tag.toLowerCase();
          if (replacements.hasOwnProperty(key)) {
            return replacements[key];
          }

          // 3. Неизвестный ключ — оставить как есть
          return `{${tag}}`;
        }
      };
    },

    nullGetter: function (key) {
      return `{${key.value}}`;
    }
  });

  doc.render({}); // replacements обрабатываются через parser
  adjustDocxHeaderPlaceholderFonts(doc.getZip(), replacements);

  const blob = doc.getZip().generate({ type: "blob" });
  saveAs(blob, newFileName);
}

function resolveConditionalKey(key, orgValue) {
  if (!key.includes("/")) {
    return null;
  }

  const parts = key.split("/").map(s => s.trim());
  if (parts.length !== 2) {
    return null;
  }

  const orgType = detectOrgType(orgValue);

  if (!orgType) {
    return parts[0];
  }

  const [a, b] = parts;

  const aIsCoop = textHasCoopMarker(a);
  const aIsOsbb = textHasOsbbMarker(a);

  const bIsCoop = textHasCoopMarker(b);
  const bIsOsbb = textHasOsbbMarker(b);

  if (orgType === "COOP") {
    if (aIsCoop && !bIsCoop) return a;
    if (bIsCoop && !aIsCoop) return b;
  }

  if (orgType === "OSBB") {
    if (aIsOsbb && !bIsOsbb) return a;
    if (bIsOsbb && !aIsOsbb) return b;
  }

  return a;
}




//==========================================
// Определение типа организации
//==========================================

function detectOrgType(orgValue) {
  if (!orgValue) {
    return null;
  }

  // Строгая проверка аббревиатур
  if (/(^|[^а-яa-z0-9])(жк|жбк)(?=[^а-яa-z0-9]|$)/i.test(orgValue)) {
    return "COOP";
  }

  if (/(^|[^а-яa-z0-9])(осбб|осмд)(?=[^а-яa-z0-9]|$)/i.test(orgValue)) {
    return "OSBB";
  }

  // Fallback
  if (/коопера/i.test(orgValue)) {
    return "COOP";
  }

  if (/(власник|владельц)/i.test(orgValue)) {
    return "OSBB";
  }

  return null;
}

function textHasCoopMarker(text) {
  if (!text) {
    return false;
  }

  return (
    /(^|[^а-яa-z0-9])(жк|жбк)(?=[^а-яa-z0-9]|$)/i.test(text) ||
    /коопера/i.test(text)
  );
}

function textHasOsbbMarker(text) {
  if (!text) {
    return false;
  }

  return (
    /(^|[^а-яa-z0-9])(осбб|осмд)(?=[^а-яa-z0-9]|$)/i.test(text) ||
    /(власник|владельц)/i.test(text)
  );
}

//==========================================
// Обработка условных {A/B}
//==========================================

function requestMissingValuesFromUI(keys, replacements) {
  return new Promise((resolve, reject) => {
    // overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.zIndex = 9999;
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    // modal
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "6px";
    modal.style.width = "400px";
    modal.style.maxHeight = "80vh";
    modal.style.overflowY = "auto";
    modal.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";

    modal.innerHTML = `
      <h3 style="margin-top:0">Заполните данные</h3>
      <div id="missing-fields"></div>
      <div style="margin-top:15px; text-align:right">
        <button id="cancelBtn">Отмена</button>
        <button id="okBtn">Скачать</button>
      </div>
    `;

    const fieldsContainer = modal.querySelector("#missing-fields");

    keys.forEach(key => {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "10px";

      const label = document.createElement("label");
      label.textContent = `{${key}}`;
      label.style.display = "block";
      label.style.fontSize = "12px";
      label.style.marginBottom = "4px";

      const input = document.createElement("input");
      input.type = "text";
      input.style.width = "100%";
      input.dataset.key = key;

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      fieldsContainer.appendChild(wrapper);
    });

modal.querySelector("#cancelBtn").onclick = () => {
  document.body.removeChild(overlay);
  reject(new Error("User cancelled"));
};

modal.querySelector("#okBtn").onclick = () => {
  const inputs = modal.querySelectorAll("input[data-key]");

  inputs.forEach(input => {
    let val = input.value.trim();

    if (val === "") {
      replacements[input.dataset.key] = "";
      return;
    }

    // убираем пробелы (разделители тысяч)
    let normalized = val.replace(/\s+/g, "");

    // заменяем запятую на точку
    normalized = normalized.replace(",", ".");

    // строгая проверка числа
    if (/^-?\d+(\.\d+)?$/.test(normalized)) {
      replacements[input.dataset.key] = Number(normalized);
    } else {
      replacements[input.dataset.key] = val;
    }
  });
      document.body.removeChild(overlay);
      resolve(true);
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

// ==========================================
// Реестр вычисляемых плейсхолдеров
// ==========================================

const computedPlaceholders = {
// Формат dd.mm.yyyy
  "сегодня": { dependsOn: [], compute: () => formatDotted(getOffsetDate(0)) },
  "вчера":   { dependsOn: [], compute: () => formatDotted(getOffsetDate(-1)) },
  "завтра":  { dependsOn: [], compute: () => formatDotted(getOffsetDate(1)) },

  // Формат dd mmmm yyyy (укр)
  "сегодня1": { dependsOn: [], compute: () => formatFullUkr(getOffsetDate(0)) },
  "вчера1":   { dependsOn: [], compute: () => formatFullUkr(getOffsetDate(-1)) },
  "завтра1":  { dependsOn: [], compute: () => formatFullUkr(getOffsetDate(1)) },

  // Отдельные части даты
  "год":   { dependsOn: [], compute: () => new Date().getFullYear().toString() },
  "месяц": { dependsOn: [], compute: () => ukrMonths[new Date().getMonth()] },

  // Периоды
  "началомесяца": { 
    dependsOn: [], 
    compute: () => formatDotted(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) 
  },
  "началогода": { 
    dependsOn: [], 
    compute: () => formatDotted(new Date(new Date().getFullYear(), 0, 1)) 
  },

  // Специальный формат: "dd" mmmm yyyy
  "дата": { dependsOn: [], compute: () => formatFullUkr(getOffsetDate(0), true) },
"pl": {
    dependsOn: [],
    compute() {
      return Object.values(ls)
        .filter(item => item.kv !== '0')
        .reduce((sum, item) => sum + (item.pl || 0), 0)
        .toFixedWithComma(2);
    }
  },
  "et": {
    dependsOn: [],
    compute() {
      const ets = Object.values(ls)
        .filter(item => item.kv !== '0')
        .map(item => item.et || 0);
      return Math.max(...ets);
    }
  },
  "kv": {
    dependsOn: [],
    compute() {
      return Object.values(ls)
        .filter(item => item.kv !== '0')
        .length;
    }
  },
  "pod": {
    dependsOn: [],
    compute() {
      const pods = Object.values(ls)
        .filter(item => item.kv !== '0')
        .map(item => item.pod || 0);
      if (pods.length === 0) return 0;
      const min = Math.min(...pods);
      const max = Math.max(...pods);
      return max - min + 1;
    }
  },
"тарпроц":{
dependsOn: ["тариф", "тариф старый"],
compute(replacements) {
      const newTariff = parseFloat(replacements["тариф"]);
      const oldTariff = parseFloat(replacements["тариф старый"]);

      if (isNaN(newTariff) || isNaN(oldTariff)) {
        return "";
      }
      const diff = newTariff - oldTariff;
      return (diff/oldTariff).toFixedWithComma()*100;
}
},

  "приклад": {
    dependsOn: ["тариф", "тариф старый"],

    compute(replacements) {
      const newTariff = parseFloat(replacements["тариф"]);
      const oldTariff = parseFloat(replacements["тариф старый"]);

      if (isNaN(newTariff) || isNaN(oldTariff)) {
        return "";
      }

      const analysisResult = analyzeTypicalApartments(false);

      if (
        !analysisResult ||
        !Array.isArray(analysisResult.types) ||
        analysisResult.types.length === 0
      ) {
        return "";
      }

      const diff = newTariff - oldTariff;
      const parts = [];

      analysisResult.types.forEach(function (type) {
        if (typeof type.avg !== "number") {
          return;
        }

        // 1. Округление площади до 0,5
        const roundedArea = Math.round(type.avg * 2) / 2;

        // 2. Разница в гривнах (округление до целых)
        const amount = Math.round(diff * roundedArea*100)/100;

        // 3. Текстовый фрагмент
        parts.push(
          `${formatNumber(amount)} грн. для квартири площею ${roundedArea.toFixedWithComma(1)} кв.м.`
        );
      });

      // 4. Склейка без лишнего ";"
      return parts.join("; ");
    }
  }
};

