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
        if (selectedFile === f) return;
        selectedFile = f;
        highlightFileInPanel(f);
        localStorage.setItem("viewed:" + f, "1");
        li.classList.add("viewed");

        localStorage.setItem("lastViewedFile", JSON.stringify({ path: f, timestamp: Date.now() }));
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");

        openFile(f);
  // ================================
  // AUTO-CLOSE SIDEBAR (file only)
  // ================================
  autoCloseSidebarOnFileClick();
    };
if (files._restrictedFiles?.includes(f)) {
    li.classList.add("restricted");

    const lock = document.createElement("span");
    lock.className = "lock";
    lock.textContent = "🔒";
    li.appendChild(lock);
}

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
    const name = getDownloadName(f);

    const url =
        "https://snowy-morning-ec72.dimaz-khua.workers.dev/?key=" +
        encodeURIComponent(f) +
        "&name=" +
        encodeURIComponent(name);

    try {
        const resp = await fetch(url);

        if (!resp.ok) {
            let text = "";
            try { text = await resp.text(); } catch {}
            throw new Error(`HTTP ${resp.status} ${resp.statusText} ${text}`);
        }

        const blob = await resp.blob();

        if (!blob || blob.size === 0) {
            throw new Error("Пустой файл");
        }

        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = name;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    } catch (e) {
        console.error("Download failed:", e);

        // fallback — прямой переход (на случай редких сбоев)
        try {
            window.location.href = url;
        } catch {}

        alert("Не удалось скачать файл: " + (e?.message || e));
    }
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

    const dpr = window.devicePixelRatio || 1;
    const maxCssWidth = window.innerWidth - 16;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);

        // CSS viewport
        const cssViewport = page.getViewport({ scale: 1 });
        const cssScale = maxCssWidth / cssViewport.width;

        // РЕАЛЬНЫЙ viewport (с учётом DPR)
        const renderViewport = page.getViewport({
            scale: cssScale * dpr
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // ФИЗИЧЕСКОЕ разрешение
        canvas.width  = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);

        // CSS-размер
        canvas.style.width  = Math.floor(renderViewport.width / dpr) + "px";
        canvas.style.height = Math.floor(renderViewport.height / dpr) + "px";

        canvas.style.display = "block";
        canvas.style.margin = "0 auto 12px";
        canvas.style.background = "#fff";

        container.appendChild(canvas);

        await page.render({
            canvasContext: ctx,
            viewport: renderViewport
        }).promise;
    }
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

// --- Логика выбора года по умолчанию ---
if (!selectedYear || !rootDir.years.includes(selectedYear)) {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentYearStr = String(now.getFullYear());
    const prevYearStr = String(now.getFullYear() - 1);

    // До 25 января включительно используем прошлый год, если он есть в списке
    if (currentMonthNum === 1 && currentDay < 25) {
        selectedYear = rootDir.years.includes(prevYearStr) ? prevYearStr : rootDir.years[rootDir.years.length - 1];
    } else {
        // После 25 января (или в другие месяцы) текущий год, если он есть
        selectedYear = rootDir.years.includes(currentYearStr) ? currentYearStr : rootDir.years[rootDir.years.length - 1];
    }
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

// --- Логика выбора месяца по умолчанию ---
if (!selectedMonth) {
    const now = new Date();
    const currentDay = now.getDate();
    const currentYearStr = String(now.getFullYear());
    
    let targetMonthNum;

    // Если сегодня 25-е и далее — текущий месяц, иначе — предыдущий
    if (currentDay >= 25) {
        targetMonthNum = now.getMonth() + 1;
    } else {
        targetMonthNum = now.getMonth(); // Предыдущий месяц (0 для января превратится в логику ниже)
    }

    // Обработка перехода года (если targetMonthNum стал 0)
    let yearForMonthCheck = selectedYear;
    if (targetMonthNum === 0) {
        targetMonthNum = 12;
    }

    const targetMonthStr = String(targetMonthNum).padStart(2, "0");

    // Проверяем: если мы в выбранном году и целевой месяц доступен
    if (availableMonths.includes(targetMonthStr)) {
        selectedMonth = targetMonthStr;
    } else {
        // Если целевого месяца нет, берем последний доступный в этом году
        selectedMonth = availableMonths[availableMonths.length - 1];
    }
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

    const preview = document.getElementById("preview");
    if (!preview) return;

    preview.innerHTML = "";
    selectedFile = f;
    highlightFileInPanel(f);

    // ==================================================
    // КНОПКИ
    // ==================================================
    const btnContainer = document.createElement("div");
    btnContainer.style.marginBottom = "3px";
    preview.appendChild(btnContainer);
    btnContainer.style.textAlign = "right";

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "📥 Скачать файл";
    downloadBtn.style.marginRight = "10px";
    downloadBtn.onclick = () => downloadFile(f);
    btnContainer.appendChild(downloadBtn);

    // ==================================================
    // ОСНОВНОЙ КОНТЕЙНЕР
    // ==================================================
    const content = document.createElement("div");
    content.style.width = "100%";
    content.style.height = "calc(100vh - 115px)";
    preview.appendChild(content);

    // ==================================================
    // PDF
    // ==================================================
    if (f.match(/\.pdf$/i)) {
        const pdfUrl = nocache(BASE_URL + f);

        // ---------- MOBILE ----------
        if (isMobile()) {

            const pdfContainer = document.createElement("div");
            pdfContainer.style.fontSize = "12px";
            pdfContainer.style.lineHeight = "1.4";
            pdfContainer.style.padding = "4px";
            content.appendChild(pdfContainer);

            const log = (msg) => {
                const d = document.createElement("div");
                d.textContent = msg;
                d.style.color = "#444";
                pdfContainer.appendChild(d);
            };

            const logError = (msg) => {
                const d = document.createElement("div");
                d.textContent = "❌ " + msg;
                d.style.color = "#b91c1c";
                pdfContainer.appendChild(d);
            };

            if (typeof pdfjsLib === "undefined") {
                logError("pdfjsLib не загружен");
                return;
            }

            if (typeof renderPdfPreview !== "function") {
                logError("renderPdfPreview не определена");
                return;
            }

            renderPdfPreview(pdfContainer, pdfUrl)
                .then(() => {})
                .catch(err => {
                    logError("Ошибка PDF");
                    logError(err?.message || String(err));
                });

            return;
        }

        // ---------- DESKTOP ----------
        const iframe = document.createElement("iframe");
        iframe.src = pdfUrl + "#page=1&zoom=page-width&navpanes=0&scrollbar=1";
        iframe.style.width = "100%";
        iframe.style.height = "99%";
        iframe.style.border = "0";
        iframe.style.overflow = "hidden";
        iframe.setAttribute("scrolling", "no");
        content.appendChild(iframe);
        return;
    }

    // ==================================================
    // ИЗОБРАЖЕНИЯ
    // ==================================================
    if (f.match(/\.(jpg|jpeg|png|gif)$/i)) {
        const img = document.createElement("img");
        img.src = nocache(BASE_URL + f);
        img.style.maxWidth = "100%";
        img.style.display = "block";
        content.appendChild(img);
        return;
    }

    // ==================================================
    // EXCEL
    // ==================================================
    if (f.match(/\.(xls|xlsx)$/i)) {
        const iframe = document.createElement("iframe");
        iframe.src =
            `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(nocache(BASE_URL + f))}`;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        content.appendChild(iframe);
        return;
    }

    // ==================================================
    // DOC / DOCX
    // ==================================================
    if (f.match(/\.(doc|docx)$/i)) {

        const iframe = document.createElement("iframe");
        const url = nocache(BASE_URL + f);

        iframe.src =
            "https://docs.google.com/gview?url=" +
            encodeURIComponent(url) +
            "&embedded=true";

        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";

        content.appendChild(iframe);

        return;
    }

    // ==================================================
    // НЕПОДДЕРЖИВАЕМЫЙ ФОРМАТ
    // ==================================================
    const msg = document.createElement("div");
    msg.textContent =
        "Файл не поддерживается для предпросмотра. Используйте кнопку скачать.";
    content.appendChild(msg);
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
function getPath(f) {
    return typeof f === "object" ? f.path : f;
}
function autoCloseSidebarOnFileClick() {
  if (sidebarState.mode === 'desktop') return;

  closeSidebar();
  blinkHamburger();
}
