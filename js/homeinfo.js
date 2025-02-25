let data={};
function displayHomeInfo(homeCode) {
    let home = homes.find(h => h.code === homeCode);
    data=home;
const fieldMapping = {
    okpo: 'code',
    ORGKR: 'name',
    org: 'name',
    adrfull: 'adr',
    голова: 'головаfull'
};

for (let targetField in fieldMapping) {
    const sourceField = fieldMapping[targetField];
    data[targetField] = data[targetField] || data[sourceField];
}

    if (!home) {
        document.getElementById('maincontainer').innerHTML = "<h2>Информация не найдена</h2>";
        return;
    }

    // Словарь для замены ключей на понятные надписи
    const keyMap = {
        name: "Наименование",
        code: "Код ЄДРПОУ",
        adr: "Адрес",
        головаfull: "Председатель",
        Podpis: "Подпись",
        Руководителя: "В лице",
        Исп: "Исполнитель",
        email: "Электронная почта",
        tel: "Телефон",
        гб: "Бухгалтер",
        Bank: "Банк",
        Iban: "IBAN"
    };

    let infoHtml = `    <div id="dropArea">Перетащите файлы сюда или кликните, чтобы выбрать</div>
    <input type="file" id="uploadFile" multiple style="display: none;">
<h2>Информация о доме: ${home.name}</h2><ul>`;
for (let key in home) {
    if (home.hasOwnProperty(key)) {
        let displayKey = keyMap[key] || key;  // Если нет замены, оставляем ключ как есть
        infoHtml += `<li 
                        title="[${key}]"
                        onclick="copyToClipboard('[${key}]')">
                        <strong>${displayKey}:</strong> ${home[key]}
                     </li>`;
    }
}

    infoHtml += `</ul>`;

    // Добавляем секцию для реквизитов
    infoHtml += `<h3>Реквизиты:</h3>`;
    if (home.name) infoHtml += `<p><strong>Наименование:</strong> ${home.name}</p>`;
    if (home.adr) infoHtml += `<p><strong>Адрес:</strong> ${home.adr}</p>`;
    if (home.code) infoHtml += `<p><strong>Код ЄДРПОУ:</strong> ${home.code}</p>`;
    if (home.Iban) infoHtml += `<p><strong>IBAN:</strong> ${home.Iban}</p>`;
    if (home.email) infoHtml += `<p><strong>Электронная почта:</strong> ${home.email}</p>`;
    if (home.tel) infoHtml += `<p><strong>Телефон:</strong> ${home.tel}</p>`;
    if (home.Podpis) infoHtml += `<p>${home.Podpis}</p>`;

    document.getElementById('maincontainer').innerHTML = infoHtml;
       const dropArea = document.getElementById("dropArea");
       const fileInput = document.getElementById("uploadFile");


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

            const files = event.dataTransfer.files;
            if (files.length) {
                processFiles(files);
            }
        });

        // Обработчик загрузки файлов через input
        fileInput.addEventListener("change", function (event) {
            const files = event.target.files;
            if (files.length) {
                processFiles(files);
            }
        });

}


        // Обработка нескольких файлов
        function processFiles(files) {
            for (let file of files) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);

                reader.onload = function (e) {
                    const content = e.target.result;
                    const fileExtension = file.name.split('.').pop().toLowerCase();

                    if (fileExtension === 'docx') {
                        processWordFile(content, file.name);
                    } else if (fileExtension === 'xlsx') {
                        processExcelFile(content, file.name);
                    } else if (fileExtension === 'txt') {
                        processTextFile(content, file.name);
                    } else if (fileExtension === 'xml') {
                        processXmlFile(content, file.name);
                    } else {
                        console.warn(`⏭ Файл "${file.name}" пропущен: неподдерживаемый формат`);
                    }
                };
            }
        }

        // Функция замены в DOCX
        function processWordFile(content, originalFileName) {
            try {
                const zip = new PizZip(content);
const myParser = function(tag) {
    return {
        get: tag === '.' ? function(s) { return s; } : function(s) {
            return s[tag.toLowerCase()]; // Ищем значение по ключу в нижнем регистре
        }
    };
};
const doc = new window.docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '[', end: ']' },
    nullGetter: (key) => `[${key.value}]`,  // Возвращаем сам ключ как строку
    parser: myParser
});


                const normalizedData = normalizeData(data);
                
                doc.render(normalizedData);

                const blob = doc.getZip().generate({ type: "blob" });
                const newFileName = originalFileName.replace('.docx', '_modified.docx');
                saveAs(blob, newFileName);
            } catch (error) {
                console.error(`❌ Ошибка обработки DOCX (${originalFileName}):`, error);
            }
        }

        // Функция замены в Excel (XLSX) с ExcelJS
        async function processExcelFile(content, originalFileName) {
            try {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(content);

                const worksheet = workbook.worksheets[0];

                const normalizedData = normalizeData(data);
                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        let cellValue = cell.value ? cell.value.toString() : "";
                        Object.keys(normalizedData).forEach(key => {
                            const regex = new RegExp(`\\[${key}\\]`, 'gi');
                            cellValue = cellValue.replace(regex, normalizedData[key]);
                        });
                        cell.value = cellValue;
                    });
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const newFileName = originalFileName.replace('.xlsx', '_modified.xlsx');
                saveAs(new Blob([buffer]), newFileName);
            } catch (error) {
                console.error(`❌ Ошибка обработки XLSX (${originalFileName}):`, error);
            }
        }

        // Функция замены в TXT
        function processTextFile(content, originalFileName) {
            try {
                const text = new TextDecoder().decode(content);

                let normalizedText = text;
                const normalizedData = normalizeData(data);
                Object.keys(normalizedData).forEach(key => {
                    const regex = new RegExp(`\\[${key}\\]`, 'gi');
                    normalizedText = normalizedText.replace(regex, normalizedData[key]);
                });

                const blob = new Blob([normalizedText], { type: 'text/plain;charset=utf-8' });
                const newFileName = originalFileName.replace('.txt', '_modified.txt');
                saveAs(blob, newFileName);
            } catch (error) {
                console.error(`❌ Ошибка обработки TXT (${originalFileName}):`, error);
            }
        }

        // Функция замены в XML
        function processXmlFile(content, originalFileName) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(new TextDecoder().decode(content), "application/xml");

                let xmlText = new XMLSerializer().serializeToString(xmlDoc);
                const normalizedData = normalizeData(data);
                Object.keys(normalizedData).forEach(key => {
                    const regex = new RegExp(`\\[${key}\\]`, 'gi');
                    xmlText = xmlText.replace(regex, normalizedData[key]);
                });

                const blob = new Blob([xmlText], { type: 'application/xml' });
                const newFileName = originalFileName.replace('.xml', '_modified.xml');
                saveAs(blob, newFileName);
            } catch (error) {
                console.error(`❌ Ошибка обработки XML (${originalFileName}):`, error);
            }
        }

        // Преобразует ключи в нижний регистр для нечувствительного поиска
        function normalizeData(data) {
            const normalizedData = {};
            Object.keys(data).forEach(key => {
                normalizedData[key.toLowerCase()] = data[key];
            });
            return normalizedData;
        }
