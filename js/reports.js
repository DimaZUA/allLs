var lastFileData = {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

//const BASE_URL = "https://dimazua.github.io/allLs/files/";
const BASE_URL = "https://pub-bf08b4f84d3e447e8021dc49cca3a1bf.r2.dev/";
const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
const BOTTOM_MARGIN_PX = 20;

let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null;
let homeCode = 0;

// --- Инициализация ---
function reportsInit(homeCodeParam = 0) {
  /* --- включаем режим документов --- */
  document.body.classList.add("files-mode");
  document.body.classList.add("sidebar-open");

  /* --- сбрасываем состояние --- */
currentFolderPath = null;
restoreStateFromLastFile();

  homeCode = homeCodeParam;

  /* --- last viewed file --- */
  try {
    lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
  } catch (e) {
    console.warn("Неверный JSON в localStorage для lastViewedFile");
    lastFileData = {};
  }

  /* --- чистим основной контент --- */
  const container = document.getElementById("maincontainer");
  container.innerHTML = `<div id="preview"></div>`;

  /* --- наполняем SIDEBAR → FILES --- */
  const sidebarFiles = document.querySelector(".sidebar-files");
  if (!sidebarFiles) {
    console.error("sidebar-files not found");
    return;
  }

  sidebarFiles.innerHTML = "";   // очищаем
  renderFilebar();               // рисуем содержимое (СПИСОК ФАЙЛОВ)
}


// --- Восстановление файла в текущем контексте ---
function getFileToOpen(fileList) {
    if (!fileList || fileList.length === 0) return null;
    if (lastFileData.path && fileList.includes(lastFileData.path)) return lastFileData.path;
    return fileList[0]; // первый файл в списке
}

// --- Выделение файла в панели ---
function highlightFileInPanel(f) {
    document.querySelectorAll("#filebar ul li.file").forEach(li => {
        li.classList.toggle("active-file", li.dataset.path === f);
    });
}

// --- Создание элемента файла ---
function addFileLi(ul, f) {
    const name = f.split("/").pop();
    const li = document.createElement("li");
    li.className = "file " + getFileClass(name);
    li.textContent = name;
    li.dataset.path = f;
    if (selectedFile === f) li.classList.add("active-file");
    if (localStorage.getItem("viewed:" + f)) li.classList.add("viewed");

li.onclick = () => {
  selectedFile = f;
  highlightFileInPanel(f);

  localStorage.setItem("viewed:" + f, "1");
  li.classList.add("viewed");

  localStorage.setItem(
    "lastViewedFile",
    JSON.stringify({ path: f, timestamp: Date.now() })
  );
  lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");

  openFile(f, { userClick: true });
};

    ul.appendChild(li);
}

// --- Класс по расширению ---
function getFileClass(name) {
    if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return "image";
    if (name.match(/\.(xls|xlsx)$/i)) return "excel";
    if (name.match(/\.pdf$/i)) return "pdf";
    if (name.match(/\.(txt|doc|docx)$/i)) return "doc";
    return "other";
}

// --- Формирование имени для скачивания ---
function getDownloadName(f) {
    f = f.replace(/([?_])t=\d+$/, "");
    const parts = f.split("/");
    let year = null;
    let month = null;
    let name = parts.pop();

    for (let i = 0; i < parts.length; i++) {
        if (/^\d{4}$/.test(parts[i])) year = parts[i].slice(2);
        if (/^(0[1-9]|1[0-2])$/.test(parts[i])) month = parts[i];
    }

    const home = homes.find(h => h.code === homeCode);
    const prefix = home && home.org3 ? home.org3 + "_" : "";

    if (year && month) return `${prefix}${year}_${month}_${name}`;
    if (year) return `${prefix}${year}_${name}`;
    return `${prefix}${name}`;
}

// --- Скачать файл ---
async function downloadFile(f) {
    const url = BASE_URL + f;
    const name = getDownloadName(f);
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Ошибка загрузки файла");
        const blob = await resp.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) { alert("Не удалось скачать файл: " + e.message); }
}

// --- Скачать PDF как PNG ---
async function downloadPdfAsPng(pdfUrl) {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const baseName = getDownloadName(pdfUrl).replace(/\.pdf$/i, '');

    if (pdf.numPages <= 5) {
        // Скачивание отдельных файлов
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const canvas = await renderPdfPage(pdf, pageNum);
            const link = document.createElement("a");
            const pageStr = String(pageNum).padStart(2, '0');
            link.href = canvas.toDataURL("image/png");
            link.download = `${baseName}-${pageStr}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // минимальная пауза для браузера
            await new Promise(r => setTimeout(r, 50));
        }
    } else {
        // Скачивание в ZIP
        const zip = new JSZip();
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const canvas = await renderPdfPage(pdf, pageNum);
            const pageStr = String(pageNum).padStart(2, '0');

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, "image/png")
            );
            zip.file(`${baseName}-${pageStr}.png`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipBlob);
        a.download = `${baseName}.zip`;
        a.click();
    }
}

// Вспомогательная функция: рендер страницы и обрезка
async function renderPdfPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Обрезка по нижнему краю
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let bottom = canvas.height;
    outer: for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            if (imgData.data[idx] < 250 || imgData.data[idx+1] < 250 || imgData.data[idx+2] < 250) {
                bottom = y + 1 + BOTTOM_MARGIN_PX;
                if (bottom > canvas.height) bottom = canvas.height;
                break outer;
            }
        }
    }

    if (bottom < canvas.height) {
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = bottom;
        croppedCanvas.getContext("2d").drawImage(canvas, 0, 0, canvas.width, bottom, 0, 0, canvas.width, bottom);
        return croppedCanvas;
    }

    return canvas;
}

async function renderPdfPreview(container, pdfUrl) {
  container.innerHTML = "";

  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({
    scale: Math.min(2, window.innerWidth / page.getViewport({ scale: 1 }).width)
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  canvas.style.maxWidth = "100%";
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";

  container.appendChild(canvas);

  await page.render({
    canvasContext: ctx,
    viewport
  }).promise;
}




// --- Отображение структуры файлов ---
function listDir(path) {
    const results = { years: [], months: [], folders: [], files: [] };
    const pathParts = path.split("/");

    files.files.forEach(f => {
        if (!f.startsWith(path + "/") && path !== "") return;

        const rel = path === "" ? f : f.substring(path.length + 1);
        const parts = rel.split("/");

        if (parts.length === 1) results.files.push(f);
        else if (parts.length > 1) {
            const first = parts[0];
            if (/^\d{4}$/.test(first)) {
                if (!results.years.includes(first)) results.years.push(first);
            } else if (/^(0[1-9]|1[0-2])$/.test(first) && pathParts.length >= 1 && /^\d{4}$/.test(pathParts[pathParts.length-1])) {
                if (!results.months.includes(first)) results.months.push(first);
            } else {
                if (!results.folders.includes(first)) results.folders.push(first);
            }
        }
    });

    results.years.sort();
    results.months.sort();
    results.folders.sort();
    results.files.sort();
    return results;
}

// --- Выбор файла для открытия из списка ---
function getFileToOpen(fileList) {
    if (!fileList || !fileList.length) return null;

    // Попытка найти последний просмотренный файл
    if (lastFileData.path) {
        const lastFileName = lastFileData.path.split("/").pop();
        const found = fileList.find(f => f.endsWith("/" + lastFileName) || f === lastFileData.path);
        if (found) return found;
    }

    // Иначе первый файл в списке
    return fileList[0];
}

// --- Отрисовка панели файлов ---
function renderFilebar() {
    const filebar = document.querySelector(".sidebar-files");
    if (!filebar || !files || !files.files || !files.files.length) return;

    filebar.innerHTML = "";

    const rootPath = files.files[0].split("/")[0];

    // ==================================================
    // РЕЖИМ ПРОСМОТРА ПАПКИ
    // ==================================================
    if (currentFolderPath) {
        const folderDir = listDir(currentFolderPath);

        const parts = currentFolderPath.split("/");
        const folderName = parts[parts.length - 1] || "";

        const backBtn = document.createElement("button");
        backBtn.textContent = "⬅ Назад" + (folderName ? " / " + folderName : "");
        backBtn.style.marginBottom = "10px";
        backBtn.onclick = () => {
            currentFolderPath = null;
            renderFilebar();
        };
        filebar.appendChild(backBtn);

        if (folderDir.folders.length || folderDir.files.length) {
            const ul = document.createElement("ul");
            ul.className = "file-list folder-files";

            folderDir.folders.forEach(f => {
                const li = document.createElement("li");
                li.textContent = f;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = currentFolderPath + "/" + f;
                    renderFilebar();
                    const subDir = listDir(currentFolderPath);
                    const fileToOpen = getFileToOpen(subDir.files);
                    if (fileToOpen) openFile(fileToOpen);
                };
                ul.appendChild(li);
            });

            folderDir.files.forEach(f => addFileLi(ul, f));
            filebar.appendChild(ul);
        }

        filebar.querySelectorAll("li.file").forEach(li => {
            li.classList.toggle("active-file", li.dataset.path === selectedFile);
        });

        return;
    }

    // ==================================================
    // ВОССТАНОВЛЕНИЕ ПОСЛЕДНЕГО ФАЙЛА
    // ==================================================
    if (lastFileData.path) {
        const lastFileName = lastFileData.path.split("/").pop();
        const restored = files.files.find(
            f => f.startsWith(rootPath + "/") && f.endsWith("/" + lastFileName)
        );
        if (restored) selectedFile = restored;
    }

    const rootDir = listDir(rootPath);

    // ==================================================
    // КОРЕНЬ
    // ==================================================
    if (rootDir.folders.length || rootDir.files.length) {
        const ul = document.createElement("ul");
        ul.className = "file-list";

        rootDir.folders.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            li.className = "folder";
            li.onclick = () => {
                currentFolderPath = rootPath + "/" + f;
                renderFilebar();
                const sub = listDir(currentFolderPath);
                const open = getFileToOpen(sub.files);
                if (open) openFile(open);
            };
            ul.appendChild(li);
        });

        rootDir.files.forEach(f => addFileLi(ul, f));
        filebar.appendChild(ul);
    }

    // ==================================================
    // ГОДЫ
    // ==================================================
    if (rootDir.years.length) {
        const yearsDiv = document.createElement("div");
        yearsDiv.style.display = "flex";
        yearsDiv.style.gap = "4px";
        yearsDiv.style.margin = "10px 0";
        yearsDiv.style.overflowX = "auto";

        rootDir.years.slice().reverse().forEach(y => {
            const btn = document.createElement("button");
            btn.textContent = y;
            btn.className = "year-btn";
            if (y === selectedYear) btn.classList.add("active-year");
            btn.onclick = () => {
                selectedYear = y;
                selectedMonth = null;
                currentFolderPath = null;
                renderFilebar();
            };
            yearsDiv.appendChild(btn);
        });

        filebar.appendChild(yearsDiv);
    }

if (!selectedYear || !rootDir.years.includes(selectedYear)) {
  selectedYear = rootDir.years[rootDir.years.length - 1];
}

    // ==================================================
    // ГОД → МЕСЯЦЫ
    // ==================================================
    if (!selectedYear) return;

    const yearPath = rootPath + "/" + selectedYear;
    const yearDir = listDir(yearPath);

    if (yearDir.folders.length) {
        const ul = document.createElement("ul");
        ul.className = "file-list year-folders";

        yearDir.folders.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            li.className = "folder";
            li.onclick = () => {
                currentFolderPath = yearPath + "/" + f;
                renderFilebar();
                const sub = listDir(currentFolderPath);
                const open = getFileToOpen(sub.files);
                if (open) openFile(open);
            };
            ul.appendChild(li);
        });

        filebar.appendChild(ul);
    }

    const yearFiles = yearDir.files.filter(
        f => !/^(0[1-9]|1[0-2])\//.test(f.substring((yearPath + "/").length))
    );

    if (yearFiles.length) {
        const ul = document.createElement("ul");
        ul.className = "file-list year-files";
        yearFiles.forEach(f => addFileLi(ul, f));
        filebar.appendChild(ul);
    }

    // ==================================================
    // МЕСЯЦЫ
    // ==================================================
    const monthDiv = document.createElement("div");
    monthDiv.style.display = "grid";
    monthDiv.style.gridTemplateColumns = "repeat(3,1fr)";
    monthDiv.style.gap = "4px";
    monthDiv.style.margin = "10px 0";

    const availableMonths = [];

    for (let i = 1; i <= 12; i++) {
        const m = String(i).padStart(2, "0");
        const monthPath = yearPath + "/" + m;
        const monthDir = listDir(monthPath);

        const btn = document.createElement("button");
        btn.textContent = monthLabels[i - 1];
        btn.className = "month-btn";
        btn.disabled = !monthDir.files.length && !monthDir.folders.length;

        if (!btn.disabled) availableMonths.push(m);

        btn.onclick = () => {
            selectedMonth = m;
            currentFolderPath = null;
            renderFilebar();
            const open = getFileToOpen(monthDir.files);
            if (open) openFile(open);
        };

        monthDiv.appendChild(btn);
    }

    if (availableMonths.length) filebar.appendChild(monthDiv);

    if (!selectedMonth) {
        const now = String(new Date().getMonth() + 1).padStart(2, "0");
        selectedMonth =
            availableMonths.includes(now)
                ? now
                : availableMonths[availableMonths.length - 1];
    }

    filebar.querySelectorAll(".month-btn").forEach(btn => {
        const idx = monthLabels.indexOf(btn.textContent);
        const m = String(idx + 1).padStart(2, "0");
        btn.classList.toggle("active-month", m === selectedMonth);
    });

    if (selectedMonth) {
        const mp = yearPath + "/" + selectedMonth;
        const md = listDir(mp);

        if (md.folders.length || md.files.length) {
            const ul = document.createElement("ul");
            ul.className = "file-list month-files";

            md.folders.forEach(f => {
                const li = document.createElement("li");
                li.textContent = f;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = mp + "/" + f;
                    renderFilebar();
                    const sub = listDir(currentFolderPath);
                    const open = getFileToOpen(sub.files);
                    if (open) openFile(open);
                };
                ul.appendChild(li);
            });

            md.files.forEach(f => addFileLi(ul, f));
            filebar.appendChild(ul);

            const open = getFileToOpen(md.files);
            if (open) openFile(open);
        }
    }

    filebar.querySelectorAll("li.file").forEach(li => {
        li.classList.toggle("active-file", li.dataset.path === selectedFile);
    });
}







// --- Помощник: выбрать файл для открытия ---
function getFileToOpen(fileList) {
    if (!fileList || !fileList.length) return null;
    if (!lastFileData.path) return fileList[0];
    const found = fileList.find(f => f.split("/").pop() === lastFileData.path.split("/").pop());
    return found || fileList[0];
}


// --- Открытие файла ---
function openFile(f, { userClick = false } = {}) {
 if (userClick && window.innerWidth <= 640) {
    document.body.classList.remove("sidebar-open");
  }
    
    const preview = document.getElementById("preview");
    preview.innerHTML = "";
    selectedFile = f;
    highlightFileInPanel(f);

    const btnContainer = document.createElement("div");
    btnContainer.style.marginBottom = "10px";
    preview.appendChild(btnContainer);

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "📥 Скачать файл";
    downloadBtn.style.marginRight = "10px";
    downloadBtn.onclick = () => downloadFile(f);
    btnContainer.appendChild(downloadBtn);

if (f.match(/\.pdf$/i)) {
    const pdfUrl = nocache(BASE_URL + f);

    if (isMobile()) {

        // === Контейнер PDF + логов ===
        const pdfContainer = document.createElement("div");
        pdfContainer.style.width = "100%";
        pdfContainer.style.fontSize = "12px";
        pdfContainer.style.lineHeight = "1.4";
        content.appendChild(pdfContainer);

        // === ЛОГГЕР В DOM ===
        const log = (msg) => {
            const line = document.createElement("div");
            line.textContent = msg;
            line.style.color = "#444";
            pdfContainer.appendChild(line);
        };

        const logError = (msg) => {
            const line = document.createElement("div");
            line.textContent = "❌ " + msg;
            line.style.color = "#b91c1c";
            pdfContainer.appendChild(line);
        };

        log("📄 PDF mobile preview");
        log("URL: " + pdfUrl);
        log("isMobile(): true");

        // === ПРОВЕРКИ ===
        if (typeof pdfjsLib === "undefined") {
            logError("pdfjsLib не загружен");
            return;
        }
        log("pdfjsLib OK");

        if (typeof renderPdfPreview !== "function") {
            logError("renderPdfPreview не определена");
            return;
        }
        log("renderPdfPreview OK");

        // === РЕНДЕР ===
        try {
            log("Начинаем renderPdfPreview...");
            Promise
                .resolve(renderPdfPreview(pdfContainer, pdfUrl))
                .then(() => {
                    log("✔ PDF успешно отрендерен");
                })
                .catch(err => {
                    logError("Ошибка в renderPdfPreview");
                    logError(err?.message || String(err));
                });
        } catch (e) {
            logError("Исключение до Promise");
            logError(e?.message || String(e));
        }

    } else {
        // 🖥 DESKTOP — iframe
        const iframe = document.createElement("iframe");
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        content.appendChild(iframe);
    }
}

    const content = document.createElement("div");
    content.style.width = "100%";
    content.style.height = "calc(100vh - 80px)";
    preview.appendChild(content);

    if (f.match(/\.pdf$/i)) {
        const iframe = document.createElement("iframe");
        iframe.src = nocache(BASE_URL + f);
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";
        content.appendChild(iframe);
    } else if (f.match(/\.(jpg|png|gif)$/i)) {
        const img = document.createElement("img");
        img.src = BASE_URL + f;
        img.style.maxWidth = "100%";
        img.style.height = "100%";
        content.appendChild(img);
    } else if (f.match(/\.(xls|xlsx)$/i)) {
        const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(BASE_URL + f)}`;
        const iframe = document.createElement("iframe");
        iframe.src = viewerUrl;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";
        content.appendChild(iframe);
    } else {
        const msg = document.createElement("div");
        msg.textContent = "Файл не поддерживается для предпросмотра. Используйте кнопку скачать.";
        content.appendChild(msg);
    }
}
function exitFilesMode() {
  document.body.classList.remove("files-mode");

  // даём доиграть анимацию
  setTimeout(() => {
    const filebar = document.getElementById("filebar");
    if (filebar) filebar.innerHTML = "";
  }, 300);
}
function restoreStateFromLastFile() {
  if (!lastFileData.path) return;

  const parts = lastFileData.path.split("/");

  const year = parts.find(p => /^\d{4}$/.test(p));
  const month = parts.find(p => /^(0[1-9]|1[0-2])$/.test(p));

  if (year) selectedYear = year;
  if (month) selectedMonth = month;

  selectedFile = lastFileData.path;
}
