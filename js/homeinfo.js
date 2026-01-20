var data = {};

function displayHomeInfo(homeCode) {
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

  var dropArea = document.getElementById("dropArea");
  var fileInput = document.getElementById("uploadFile");

  // UI-обработчики (без дублирования)
  dropArea.onclick = function () {
    fileInput.click();
  };

  dropArea.ondragover = function (event) {
    event.preventDefault();
    dropArea.classList.add("hover");
  };

  dropArea.ondragleave = function () {
    dropArea.classList.remove("hover");
  };

  dropArea.ondrop = function (event) {
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
  };
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

      // 1. Получаем все плейсхолдеры, реально существующие в файле
      let fileKeys = new Set();

      if (extension === "txt" || extension === "xml") {
        fileKeys = extractPlaceholdersFromTextContent(content);
      } else if (extension === "xlsx") {
        fileKeys = await extractPlaceholdersFromXlsx(content);
      } else if (extension === "docx") {
        fileKeys = extractPlaceholdersFromDocx(content);
      }

      // 2. Формируем карту подстановок
      const replacements = getReplacementMap(data);

// ===== автоключ {голова} из {головаfull} =====
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

      // 3. Запрашиваем ТОЛЬКО отсутствующие значения
// 3. Собираем недостающие ключи (кроме {A/B})
const missingKeys = [];

for (const key of fileKeys) {
  if (key.includes("/")) {
    continue;
  }

  if (isMissingValue(replacements, key)) {
    missingKeys.push(key);
  }
}

// 4. Если есть недостающие — показываем форму
if (missingKeys.length > 0) {
  await requestMissingValuesFromUI(missingKeys, replacements);
}



      // 4. Получение нового имени файла (ЕДИНСТВЕННОЕ МЕСТО)
      const newFileName = buildNewFileName(originalFileName, replacements);

      // 5. Маршрутизация обработки
      switch (extension) {
        case "docx":
          processWordFile(content, newFileName, replacements);
          break;

        case "xlsx":
          await processExcelFile(content, newFileName, replacements);
          break;

        case "txt":
          processTextFile(content, newFileName, replacements);
          break;

        case "xml":
          processXmlFile(content, newFileName, replacements);
          break;

        default:
          console.warn(
            `Файл "${originalFileName}" пропущен: неподдерживаемый формат`
          );
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

  Object.keys(sourceData).forEach(function (key) {
    const value = sourceData[key];
    map[key.toLowerCase()] =
      value === null || value === undefined ? "" : String(value);
  });

  return map;
}

function buildNewFileName(originalFileName, replacements) {
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
    /(^|[^a-zA-Z0-9а-яА-ЯёЁ])TPL([^a-zA-Z0-9а-яА-ЯёЁ]|$)/gi,
    " "
  );

  // Чистим хвосты: лишние пробелы, подчёркивания, дефисы
  name = name
    .replace(/[_\-]+/g, " ")
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

  const home = homes.find(h => h.code === homeCode);
  const prefix = home && home.org3 ? home.org3 + "_" : "";

  // 4. Итоговое имя файла
  return `${prefix}_${name}_${dateTime}${ext}`;
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
        replacements[input.dataset.key] = input.value || "";
      });

      document.body.removeChild(overlay);
      resolve();
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}
