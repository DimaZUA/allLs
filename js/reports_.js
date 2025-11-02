var lastFileData = {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const BASE_URL = "https://dimazua.github.io/allLs/files/"; // глобальный путь к файлам
const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];

let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null;
let homeCode = 0;

function reportsInit(homeCodeParam=0) {
    homeCode = homeCodeParam;

    try {
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
    } catch(e) {
        console.warn("Неверный JSON в localStorage для lastViewedFile");
    }

    const container = document.getElementById("maincontainer");
    container.innerHTML = `
        <div id="filebar" style="width:250px; float:left; height:100vh; border:1px solid #ddd; padding:10px; box-sizing:border-box;"></div>
        <div id="preview" style="margin-left:260px; padding:10px;"></div>
    `;

    restoreLastFile();
    renderFilebar();
}

// --- Сканируем папку ---
function listDir(path) {
    const results = { years: [], months: [], folders: [], files: [] };
    const pathParts = path.split("/");

    files.files.forEach(f => {
        if (!f.startsWith(path + "/") && path !== "") return;

        const rel = path === "" ? f : f.substring(path.length + 1);
        const parts = rel.split("/");

        if (parts.length === 1) {
            results.files.push(f);
        } else if (parts.length > 1) {
            const first = parts[0];

            if (/^20\d{2}$|^21\d{2}$/.test(first)) {
                if (!results.years.includes(first)) results.years.push(first);
            } else if (/^(0[1-9]|1[0-2])$/.test(first) && pathParts.length >= 1 && /^20\d{2}$|^21\d{2}$/.test(pathParts[pathParts.length-1])) {
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

// --- Создаем элемент файла ---
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
        document.querySelectorAll("#filebar ul li").forEach(el => el.classList.remove("active-file"));
        li.classList.add("active-file");
        localStorage.setItem("viewed:" + f, "1");
        li.classList.add("viewed");

        // сохраняем только если реально выбрал
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

// --- Восстановление последнего файла ---
function restoreLastFile() {
    if (!lastFileData.path) return;

    const now = Date.now();
    if (now - lastFileData.timestamp > 7*24*60*60*1000) return; // старше 7 дней

    selectedFile = lastFileData.path;
    const parts = lastFileData.path.split("/");
    selectedYear = parts.find(p => /^20\d{2}$|^21\d{2}$/.test(p)) || null;
    selectedMonth = parts.find(p => /^(0[1-9]|1[0-2])$/.test(p)) || null;
}

// --- Отображение структуры ---
function renderFilebar() {
    const filebar = document.getElementById("filebar");
    filebar.innerHTML = "";

    const rootPath = files.files[0].split("/")[0]; // текущий дом
    const rootDir = listDir(rootPath);

    // --- Восстанавливаем файл в новом доме ---
    let restoredFile = null;
    if (lastFileData.path) {
        const lastFileName = lastFileData.path.split("/").pop();
        // ищем файл с таким именем в текущем доме
        restoredFile = files.files.find(f => f.startsWith(rootPath + "/") && f.endsWith("/" + lastFileName));
        if (restoredFile) selectedFile = restoredFile;
    }

    // --- Файлы и папки верхнего уровня (не годы) ---
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
            };
            ul.appendChild(li);
        });
        rootDir.files.forEach(f => addFileLi(ul, f));
        filebar.appendChild(ul);
    }

    // --- Года ---
    if (rootDir.years.length > 0) {
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
            };
            yearsDiv.appendChild(btn);
        });
        filebar.appendChild(yearsDiv);
    }

    if (!selectedYear && rootDir.years.length > 0) selectedYear = rootDir.years[rootDir.years.length-1];

    if (selectedYear) {
        const yearPath = rootPath + "/" + selectedYear;
        const yearDir = listDir(yearPath);

        // --- Файлы и папки внутри года ---
        if (yearDir.folders.length > 0 || yearDir.files.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "file-list";
            yearDir.folders.forEach(f => {
                const li = document.createElement("li");
                li.textContent = f;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = yearPath + "/" + f;
                    renderFilebar();
                };
                ul.appendChild(li);
            });
            yearDir.files.forEach(f => addFileLi(ul, f));
            filebar.appendChild(ul);
        }

        // --- Сетка месяцев ---
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
                const { files: monthFiles } = listDir(monthPath);
                if (monthFiles.length) {
                    // ищем последний выбранный файл по имени
                    let f = monthFiles.find(ff => lastFileData.path && ff.split("/").pop() === lastFileData.path.split("/").pop());
                    if (!f) f = monthFiles[0];
                    openFile(f);
                }
                renderFilebar();
            };
            monthDiv.appendChild(btn);
        }
        filebar.appendChild(monthDiv);

        // --- UL с файлами выбранного месяца ---
        if (selectedMonth) {
            const monthPath = yearPath + "/" + selectedMonth;
            const monthDir = listDir(monthPath);
            if (monthDir.folders.length > 0 || monthDir.files.length > 0) {
                const monthUL = document.createElement("ul");
                monthUL.className = "file-list month-files";
                monthDir.folders.forEach(f => {
                    const li = document.createElement("li");
                    li.textContent = f;
                    li.className = "folder";
                    li.onclick = () => {
                        currentFolderPath = monthPath + "/" + f;
                        renderFilebar();
                    };
                    monthUL.appendChild(li);
                });
                monthDir.files.forEach(f => addFileLi(monthUL, f));
                filebar.appendChild(monthUL);

                // если ранее найден файл из нового дома — открыть его
                if (restoredFile) openFile(restoredFile);
            }
        }
    }
}


// --- Открытие файла ---
function openFile(f) {
    const preview = document.getElementById("preview");
    preview.innerHTML = "";
    selectedFile = f;

    const btnContainer = document.createElement("div");
    btnContainer.style.marginBottom = "10px";
    preview.appendChild(btnContainer);

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "📥 Скачать файл";
    downloadBtn.style.marginRight = "10px";
    downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = BASE_URL + f;
        a.download = f.split("/").pop();
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    btnContainer.appendChild(downloadBtn);

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
        downloadBtn.click();
    }
}
