var lastFileData = {};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null;

function reportsInit(homeCode=0) {
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

    const filebar = document.getElementById("filebar");
    const preview = document.getElementById("preview");

    function listDir(path) {
        const results = { years: [], months: [], folders: [], files: [] };
        const pathDepth = path.split("/").length;

        files.files.forEach(f => {
            if (!f.startsWith(path + "/")) return;
            const rel = f.substring(path.length + 1);
            const parts = rel.split("/");

            if (parts.length === 1) results.files.push(f);
            else {
                const first = parts[0];
                if (/^\d{4}$/.test(first) && pathDepth === 2) {
                    if (!results.years.includes(first)) results.years.push(first);
                } else if (/^(0[1-9]|1[0-2])$/.test(first) && pathDepth === 3) {
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

        // обновляем визуально
        filebar.querySelectorAll("ul li").forEach(el => el.classList.remove("active-file"));
        li.classList.add("active-file");
        localStorage.setItem("viewed:" + f, "1");
        li.classList.add("viewed");

        // только теперь обновляем lastViewedFile
        console.log('Сохранен ' + JSON.stringify({ path: f, timestamp: Date.now() }))
        localStorage.setItem("lastViewedFile", JSON.stringify({ path: f, timestamp: Date.now() }));
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
        console.log("lastFileData:", lastFileData);
        openFile(f); // рендер
    };
    ul.appendChild(li);
}





    function getFileClass(name) {
        if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return "image";
        if (name.match(/\.(xls|xlsx)$/i)) return "excel";
        if (name.match(/\.pdf$/i)) return "pdf";
        if (name.match(/\.(txt|doc|docx)$/i)) return "doc";
        return "other";
    }

function restoreState(rootPath, years) {
try {
    lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
} catch(e) {
    console.warn("Неверный JSON в localStorage для lastViewedFile");
}

    console.log("restoreState called");
    console.log("lastFileData:", lastFileData);

    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
    const now = Date.now();

    // --- Проверка валидности lastFileData ---
    const isValid = lastFileData.path && lastFileData.timestamp && (now - lastFileData.timestamp <= maxAge);

    if (!isValid) {
        console.log("No valid lastFileData, using latest year/month/file");
        selectedYear = years[years.length - 1];
        const { months } = listDir(rootPath + "/" + selectedYear);
        selectedMonth = months.length ? months[months.length - 1] : null;

        let fileToOpen = null;
        if (selectedMonth) {
            const { files: monthFiles } = listDir(rootPath + "/" + selectedYear + "/" + selectedMonth);
            if (monthFiles.length) fileToOpen = monthFiles[0];
        } else {
            const { files: yearFiles } = listDir(rootPath + "/" + selectedYear);
            if (yearFiles.length) fileToOpen = yearFiles[0];
        }

        if (fileToOpen) openFile(fileToOpen);
        return;
    }

    // --- Попытка восстановить последний файл ---
    const parts = lastFileData.path.split("/");
    selectedYear = parts[2];
    selectedMonth = /^\d{2}$/.test(parts[3]) ? parts[3] : null;
    const fileName = parts.pop(); // имя файла
    console.log("Selected year:", selectedYear, "Selected month:", selectedMonth, "File name:", fileName);

    let fileToOpen = null;

    if (selectedMonth) {
        const { files: monthFiles } = listDir(rootPath + "/" + selectedYear + "/" + selectedMonth);
        fileToOpen = monthFiles.find(f => f.endsWith("/" + fileName)) || monthFiles[0];
    } else {
        const { files: yearFiles } = listDir(rootPath + "/" + selectedYear);
        fileToOpen = yearFiles.find(f => f.endsWith("/" + fileName)) || yearFiles[0];
    }

    if (fileToOpen) {
        console.log("Restoring file:", fileToOpen);
        openFile(fileToOpen);
    } else {
        console.warn("No file found to restore");
    }
}


function openFile(f) {
    console.log("openFile called with:", f);
    selectedFile = f;

    preview.innerHTML = "";

    // контейнер для кнопок
    const btnContainer = document.createElement("div");
    btnContainer.style.marginBottom = "10px";
    preview.appendChild(btnContainer);

// кнопка "Скачать файл" (оригинал) через <button>
const downloadBtn = document.createElement("button");
downloadBtn.textContent = "📥 Скачать файл";
downloadBtn.style.marginRight = "10px";
downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = f;
    a.download = getDownloadName(f); // используем новую функцию
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
btnContainer.appendChild(downloadBtn);

    // контейнер для содержимого файла
    const content = document.createElement("div");
    content.style.width = "100%";
    content.style.height = "calc(100vh - 80px)";
    preview.appendChild(content);

    if (f.match(/\.pdf$/i)) {
        // кнопка "Сохранить как картинку"
        const pngBtn = document.createElement("button");
        pngBtn.textContent = "🖼 Сохранить как картинку";
        pngBtn.onclick = () => downloadPdfAsPng(f);
        btnContainer.appendChild(pngBtn);

        // урл с отключением кэша для последнего месяца
let noCacheUrl = f;
        if (selectedYear && selectedMonth) {
    const rootPath = files.files[0].split("/").slice(0, 2).join("/");

            const { months } = listDir(rootPath +'/'+ selectedYear);
            if (selectedMonth === months[months.length - 1]) {
                noCacheUrl += "?t=" + Date.now();
            }
        }


        const iframe = document.createElement("iframe");
        iframe.src = noCacheUrl;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";
        content.appendChild(iframe);

    } else if (f.match(/\.(jpg|png|gif)$/i)) {
        const img = document.createElement("img");
        img.src = f;
        img.style.maxWidth = "100%";
        img.style.height = "100%";
        content.appendChild(img);

    } else if (f.match(/\.(xls|xlsx)$/i)) {
        const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(window.location.origin + "/allLs/" + f)}`;
        const iframe = document.createElement("iframe");
        iframe.src = viewerUrl;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameBorder = "0";
        content.appendChild(iframe);

    } else {
        // для txt/doc — просто скачиваем
        downloadBtn.click();
    }
}



const BOTTOM_MARGIN_PX = 20; // сколько оставляем белыми пикселей снизу

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

        // --- определяем нижнюю границу контента ---
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let bottom = canvas.height;

        outer: for (let y = canvas.height - 1; y >= 0; y--) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                if (imgData.data[idx] < 250 || imgData.data[idx + 1] < 250 || imgData.data[idx + 2] < 250) {
                    bottom = y + 1 + BOTTOM_MARGIN_PX; // оставляем подушку
                    if (bottom > canvas.height) bottom = canvas.height;
                    break outer;
                }
            }
        }

        // --- создаём обрезанный canvas ---
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = bottom;
        const croppedCtx = croppedCanvas.getContext("2d");
        croppedCtx.drawImage(canvas, 0, 0, canvas.width, bottom, 0, 0, canvas.width, bottom);

        // --- скачиваем PNG ---
        const link = document.createElement("a");
        link.href = croppedCanvas.toDataURL("image/png");

        // используем getDownloadName для базового имени
        const baseName = getDownloadName(pdfUrl).replace(/\.pdf$/i, '');
        link.download = `${baseName}-p${pageNum}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}










// --- Вход в папку ---
function renderFilebar() {
    filebar.innerHTML = "";
    const rootPath = files.files[0].split("/").slice(0, 2).join("/");
    const { years, folders: rootFolders, files: rootFiles } = listDir(rootPath);

    // --- Папки и файлы верхнего уровня (без анимации) ---
    if (rootFolders.length > 0 || rootFiles.length > 0) {
        const ul = document.createElement("ul");
        ul.className="file-list";
        rootFolders.forEach(folder => {
            const li = document.createElement("li");
            li.textContent = folder;
            li.className = "folder";
            li.onclick = () => {
                currentFolderPath = rootPath + "/" + folder;
                renderFilebar();
            };
            ul.appendChild(li);
        });
        rootFiles.forEach(f => addFileLi(ul, f));
        filebar.appendChild(ul);
    }

    // --- Года ---
    if (years.length > 0) {
        const yearsDiv = document.createElement("div");
        yearsDiv.style.display = "flex";
        yearsDiv.style.gap = "4px";
        yearsDiv.style.margin = "10px 0";
        yearsDiv.style.overflowX = "auto";

        years.forEach(y => {
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

        if (!selectedYear) selectedYear = years[years.length - 1];

        const yearPath = rootPath + "/" + selectedYear;
        const { months, folders: yearFolders, files: yearFiles } = listDir(yearPath);

        // --- Папки и файлы года (без анимации) ---
        if (yearFolders.length > 0 || yearFiles.length > 0) {
            const yearUL = document.createElement("ul");
            yearUL.className="file-list";
            yearFolders.forEach(folder => {
                const li = document.createElement("li");
                li.textContent = folder;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = yearPath + "/" + folder;
                    renderFilebar();
                };
                yearUL.appendChild(li);
            });
            yearFiles.forEach(f => addFileLi(yearUL, f));
            filebar.appendChild(yearUL);
        }

        // --- Сетка месяцев ---
        if (months.length > 0) {
            const monthDiv = document.createElement("div");
            monthDiv.style.display = "grid";
            monthDiv.style.gridTemplateColumns = "repeat(3,1fr)";
            monthDiv.style.gap = "4px";
            monthDiv.style.margin = "10px 0";

            for (let i = 1; i <= 12; i++) {
                const m = String(i).padStart(2, "0");
                const btn = document.createElement("button");
                btn.textContent = monthLabels[i - 1];
                btn.className = "month-btn";
                btn.disabled = !months.includes(m);
                if (m === selectedMonth) btn.classList.add("active-month");
                btn.onclick = () => {
                    selectedMonth = m;
                    const { files: monthFiles } = listDir(yearPath + "/" + m);
                    if (monthFiles.length > 0) {
                        let f = monthFiles.find(f => f.split("/").pop() === (selectedFile ? selectedFile.split("/").pop() : ""));
                        if (!f) f = monthFiles[0];
                        openFile(f);
                    }
                    renderFilebar();
                };
                monthDiv.appendChild(btn);
            }
            filebar.appendChild(monthDiv);

            // --- UL с файлами выбранного месяца (анимируется только этот UL) ---
            if (selectedMonth) {
                const monthPath = yearPath + "/" + selectedMonth;
                const { folders: monthFolders, files: monthFiles } = listDir(monthPath);
                if (monthFolders.length > 0 || monthFiles.length > 0) {
                    const monthUL = document.createElement("ul");
                    monthUL.className = "file-list month-files"; // для анимации
                    monthUL.id = "animated-month-list"; // уникальный id для анимации месяца
                    monthFolders.forEach(folder => {
                        const li = document.createElement("li");
                        li.textContent = folder;
                        li.className = "folder";
                        li.onclick = () => {
                            currentFolderPath = monthPath + "/" + folder;
                            renderFilebar();
                        };
                        monthUL.appendChild(li);
                    });
                    monthFiles.forEach(f => addFileLi(monthUL, f));

                    const oldUL = document.getElementById("animated-month-list");
                    updateFileListWithAnimation(oldUL, monthUL);
                }
            }
        }
    }

    // --- Если зашли в папку (анимация не нужна) ---
    if (currentFolderPath) {
        const { folders: subFolders, files: subFiles } = listDir(currentFolderPath);
        if (subFolders.length > 0 || subFiles.length > 0) {
            const folderUL = document.createElement("ul");
            folderUL.className="file-list";
            const backLi = document.createElement("li");
            backLi.textContent = "..";
            backLi.className = "folder";
            backLi.onclick = () => {
                currentFolderPath = null;
                renderFilebar();
            };
            folderUL.appendChild(backLi);
            subFolders.forEach(f => {
                const li = document.createElement("li");
                li.textContent = f;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = currentFolderPath + "/" + f;
                    renderFilebar();
                };
                folderUL.appendChild(li);
            });
            subFiles.forEach(f => addFileLi(folderUL, f));
            filebar.innerHTML = "";
filebar.appendChild(folderUL);

        }
    }
}



function updateFileListWithAnimation (oldUL, newUL) {
    const container = filebar;

    if (oldUL) {
        // подготовка старого UL
        oldUL.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        oldUL.style.transform = "translateX(0)";
        oldUL.style.opacity = "1";

        // новый UL сразу добавляем справа
        newUL.style.transform = "translateX(100%)";
        newUL.style.opacity = "0";
        newUL.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        container.appendChild(newUL);

        // запускаем анимацию через requestAnimationFrame
        requestAnimationFrame(() => {
            oldUL.style.transform = "translateX(-100%)";
            oldUL.style.opacity = "0";

            newUL.style.transform = "translateX(0)";
            newUL.style.opacity = "1";
        });

        // удаляем старый UL после задержки, равной анимации
        setTimeout(() => {
            oldUL.remove();
        }, 300);
    } else {
        // если старого UL нет – просто показываем новый
        newUL.style.transform = "translateX(100%)";
        newUL.style.opacity = "0";
        newUL.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        container.appendChild(newUL);

        requestAnimationFrame(() => {
            newUL.style.transform = "translateX(0)";
            newUL.style.opacity = "1";
        });
    }
}




function getDownloadName(f) {
    const parts = f.split("/");
    let year = null;
    let month = null;
    let name = parts.pop();

    // ищем год и месяц в пути
    for (let i = 0; i < parts.length; i++) {
        if (/^\d{4}$/.test(parts[i])) year = parts[i].slice(2); // YY
        if (/^(0[1-9]|1[0-2])$/.test(parts[i])) month = parts[i]; // MM
    }

    // ищем home
    const home = homes.find(h => h.code === homeCode);
    const prefix = home && home.org3 ? home.org3 + "_" : "";

    if (year && month) return `${prefix}${year}_${month}_${name}`;
    if (year) return `${prefix}${year}_${name}`;
    return `${prefix}${name}`;
}




    const rootPath = files.files[0].split("/").slice(0, 2).join("/");
    const { years } = listDir(rootPath);
    restoreState(rootPath, years);
    renderFilebar();





}
