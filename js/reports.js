var lastFileData = {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const BASE_URL = "https://dimazua.github.io/allLs/files/";
const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
const BOTTOM_MARGIN_PX = 20;

let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null;
let homeCode = 0;

// --- Инициализация ---
function reportsInit(homeCodeParam=0) {
    homeCode = homeCodeParam;

    try {
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
    } catch(e) { console.warn("Неверный JSON в localStorage для lastViewedFile"); }

    const container = document.getElementById("maincontainer");
    container.innerHTML = `
        <div id="filebar" style="width:250px; float:left; height:100vh; border:1px solid #ddd; padding:10px; box-sizing:border-box;"></div>
        <div id="preview" style="margin-left:260px; padding:10px;"></div>
    `;

    renderFilebar();
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
        if (selectedFile === f) return;
        selectedFile = f;
        highlightFileInPanel(f);
        localStorage.setItem("viewed:" + f, "1");
        li.classList.add("viewed");

        localStorage.setItem("lastViewedFile", JSON.stringify({ path: f, timestamp: Date.now() }));
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");

        openFile(f);
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
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;

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

        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = bottom;
        croppedCanvas.getContext("2d").drawImage(canvas, 0, 0, canvas.width, bottom, 0, 0, canvas.width, bottom);

        const link = document.createElement("a");
        link.href = croppedCanvas.toDataURL("image/png");
        const baseName = getDownloadName(pdfUrl).replace(/\.pdf$/i, '');
        link.download = `${baseName}-p${pageNum}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

// --- Рендер панели ---
function renderFilebar() {
    const filebar = document.getElementById("filebar");
    filebar.innerHTML = "";

    const rootPath = files.files[0].split("/")[0];
    const rootDir = listDir(rootPath);

    if (!selectedYear && rootDir.years.length) selectedYear = rootDir.years[rootDir.years.length-1];

    // --- Файлы/папки на верхнем уровне ---
    if (rootDir.folders.length > 0 || rootDir.files.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "file-list";
        rootDir.folders.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            li.className = "folder";
            li.onclick = () => {
                currentFolderPath = rootPath + "/" + f;
                renderFilebar();
                const folderFiles = listDir(currentFolderPath).files;
                const fileToOpen = getFileToOpen(folderFiles);
                if (fileToOpen) openFile(fileToOpen);
            };
            ul.appendChild(li);
        });
        rootDir.files.forEach(f => addFileLi(ul, f));
        filebar.appendChild(ul);
    }

    // --- Годы ---
    if (rootDir.years.length) {
        const yearsDiv = document.createElement("div");
        yearsDiv.style.display = "flex";
        yearsDiv.style.gap = "4px";
        yearsDiv.style.margin = "10px 0";
        yearsDiv.style.overflowX = "auto";

        rootDir.years.forEach(y => {
            const btn = document.createElement("button");
            btn.textContent = y;
            btn.className = "year-btn";
            if (y === selectedYear) btn.classList.add("active-year");
            btn.onclick = () => {
                selectedYear = y;
                selectedMonth = null;
                renderFilebar();

                // открыть последний файл за этот год, если есть
                const yearPath = rootPath + "/" + selectedYear;
                const yearFiles = listDir(yearPath).files;
                const fileToOpen = getFileToOpen(yearFiles);
                if (fileToOpen) openFile(fileToOpen);
            };
            yearsDiv.appendChild(btn);
        });
        filebar.appendChild(yearsDiv);
    }

    // --- Месяцы ---
    if (selectedYear) {
        const yearPath = rootPath + "/" + selectedYear;
        const monthDiv = document.createElement("div");
        monthDiv.style.display = "grid";
        monthDiv.style.gridTemplateColumns = "repeat(3,1fr)";
        monthDiv.style.gap = "4px";
        monthDiv.style.margin = "10px 0";

        for (let i = 1; i <= 12; i++) {
            const m = String(i).padStart(2, "0");
            const monthPath = yearPath + "/" + m;
            const monthDir = listDir(monthPath);

            const btn = document.createElement("button");
            btn.textContent = monthLabels[i-1];
            btn.className = "month-btn";
            btn.disabled = monthDir.files.length === 0 && monthDir.folders.length === 0;
            if (m === selectedMonth) btn.classList.add("active-month");

            btn.onclick = () => {
                selectedMonth = m;
                renderFilebar();

                const monthFiles = monthDir.files;
                const fileToOpen = getFileToOpen(monthFiles);
                if (fileToOpen) openFile(fileToOpen);
            };
            monthDiv.appendChild(btn);
        }
        filebar.appendChild(monthDiv);

        // --- Файлы текущего месяца ---
        if (selectedMonth) {
            const monthPath = yearPath + "/" + selectedMonth;
            const monthDir = listDir(monthPath);
            if (monthDir.files.length > 0 || monthDir.folders.length > 0) {
                const monthUL = document.createElement("ul");
                monthUL.className = "file-list month-files";
                monthDir.folders.forEach(f => {
                    const li = document.createElement("li");
                    li.textContent = f;
                    li.className = "folder";
                    li.onclick = () => {
                        currentFolderPath = monthPath + "/" + f;
                        renderFilebar();
                        const folderFiles = listDir(currentFolderPath).files;
                        const fileToOpen = getFileToOpen(folderFiles);
                        if (fileToOpen) openFile(fileToOpen);
                    };
                    monthUL.appendChild(li);
                });
                monthDir.files.forEach(f => addFileLi(monthUL, f));
                filebar.appendChild(monthUL);

                const fileToOpen = getFileToOpen(monthDir.files);
                if (fileToOpen) openFile(fileToOpen);
            }
        }
    }
}

// --- Открытие файла ---
function openFile(f) {
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
        const pngBtn = document.createElement("button");
        pngBtn.textContent = "🖼 Скачать PDF как PNG";
        pngBtn.onclick = () => downloadPdfAsPng(BASE_URL + f);
        btnContainer.appendChild(pngBtn);
    }

    const content = document.createElement("div");
    content.style.width = "100%";
    content.style.height = "calc(100vh - 80px)";
    preview.appendChild(content);

    if (f.match(/\.pdf$/i)) {
        const iframe = document.createElement("iframe");
        iframe.src = BASE_URL + f;
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
