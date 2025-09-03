var lastFileData = {};
try {
    lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
} catch(e) {
    console.warn("Неверный JSON в localStorage для lastViewedFile");
}

const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
let selectedYear = null;
let selectedMonth = null;
let selectedFile = null;
let currentFolderPath = null; // если зашли в папку

function reportsInit() {
    const container = document.getElementById("maincontainer");
    container.innerHTML = `
        <div id="filebar" style="width:250px; float:left; height:100vh; border:1px solid #ddd; padding:10px; box-sizing:border-box;"></div>
        <div id="preview" style="margin-left:260px; padding:10px;"></div>
    `;

    const filebar = document.getElementById("filebar");
    const preview = document.getElementById("preview");

    // --- Универсальная выборка детей ---
function listDir(path) {
    const results = { years: [], months: [], folders: [], files: [] };
    const pathDepth = path.split("/").length;

    files.files.forEach(f => {
        if (!f.startsWith(path + "/")) return;

        const rel = f.substring(path.length + 1); // путь без текущего префикса
        const parts = rel.split("/");

        if (parts.length === 1) {
            // файл прямо в этой папке
            results.files.push(f);
        } else {
            const first = parts[0];

            // спец. обработка только для корня/года
            if (/^\d{4}$/.test(first) && pathDepth === 2) {
                if (!results.years.includes(first)) results.years.push(first);
            } else if (/^(0[1-9]|1[0-2])$/.test(first) && pathDepth === 3) {
                if (!results.months.includes(first)) results.months.push(first);
            } else {
                // в любом другом случае это папка
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



    // --- элемент файла ---
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

            openFile(f);
        };
        ul.appendChild(li);
    }

    // --- предпросмотр ---
    function openFile(f) {
        selectedFile = f;
        localStorage.setItem("lastViewedFile", JSON.stringify({path:f, timestamp:Date.now()}));

        preview.innerHTML="";
        const downloadBtn = document.createElement("a");
        downloadBtn.href = f;
        downloadBtn.download = f.split("/").pop();
        downloadBtn.textContent = "📥 Скачать файл";
        downloadBtn.style.display="block";
        downloadBtn.style.marginBottom="10px";
        preview.appendChild(downloadBtn);

        if(f.match(/\.(jpg|png|gif)$/i)) {
            preview.innerHTML += `<img src="${f}" style="max-width:100%;height:100%;">`;
        } else if(f.match(/\.pdf$/i)) {
            preview.innerHTML += `<iframe src="${f}" width="100%" height="100%" frameborder="0"></iframe>`;
        } else if(f.match(/\.(xls|xlsx)$/i)) {
            const viewerUrl=`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(window.location.origin+"/"+f)}`;
            preview.innerHTML += `<iframe src="${viewerUrl}" width="100%" height="100%" frameborder="0"></iframe>`;
        } else {
            downloadBtn.click();
        }
    }

    function getFileClass(name){
        if(name.match(/\.(jpg|jpeg|png|gif)$/i)) return "image";
        if(name.match(/\.(xls|xlsx)$/i)) return "excel";
        if(name.match(/\.pdf$/i)) return "pdf";
        if(name.match(/\.(txt|doc|docx)$/i)) return "doc";
        return "other";
    }

    // --- Восстановление состояния ---
    function restoreState(rootPath, years) {
        const maxAge = 7*24*60*60*1000;
        if (!lastFileData.path || !lastFileData.timestamp || (Date.now() - lastFileData.timestamp > maxAge)) {
            // Старый localStorage → последний год, последний месяц, первый файл
            selectedYear = years[years.length - 1];
            const { months } = listDir(rootPath + "/" + selectedYear);
            if (months.length > 0) {
                selectedMonth = months[months.length - 1];
                const { files: monthFiles } = listDir(rootPath + "/" + selectedYear + "/" + selectedMonth);
                if (monthFiles.length > 0) {
                    openFile(monthFiles[0]);
                }
            } else {
                const { files: yearFiles } = listDir(rootPath + "/" + selectedYear);
                if (yearFiles.length > 0) openFile(yearFiles[0]);
            }
        } else {
            const parts = lastFileData.path.split("/");
            selectedYear = parts[2];
            selectedMonth = /^\d{2}$/.test(parts[3]) ? parts[3] : null;

            if (selectedMonth) {
                const { files: monthFiles } = listDir(rootPath + "/" + selectedYear + "/" + selectedMonth);
                const found = monthFiles.find(f => f.endsWith("/" + parts.pop()));
                if (found) {
                    openFile(found);
                } else if (monthFiles.length > 0) {
                    openFile(monthFiles[0]);
                }
            } else {
                const { files: yearFiles } = listDir(rootPath + "/" + selectedYear);
                const found = yearFiles.find(f => f === lastFileData.path);
                if (found) {
                    openFile(found);
                } else if (yearFiles.length > 0) {
                    openFile(yearFiles[0]);
                }
            }
        }
    }

    // --- Основной рендер ---
    function renderFilebar() {
        filebar.innerHTML = "";

        // --- Если внутри папки ---
        if (currentFolderPath) {
            const { folders, files: fileList } = listDir(currentFolderPath);

            const ul = document.createElement("ul");
            ul.className="file-list"
            const backLi = document.createElement("li");
            backLi.textContent = "..";
            backLi.className = "folder";
            backLi.onclick = () => {
                currentFolderPath = null;
                renderFilebar();
            };
            ul.appendChild(backLi);

            folders.forEach(folder => {
                const li = document.createElement("li");
                li.textContent = folder;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = currentFolderPath + "/" + folder;
                    renderFilebar();
                };
                ul.appendChild(li);
            });

            fileList.forEach(f => addFileLi(ul, f));
            filebar.appendChild(ul);
            return;
        }

        // --- Верхний уровень ---
        const rootPath = files.files[0].split("/").slice(0, 2).join("/");
        const { years, folders: rootFolders, files: rootFiles } = listDir(rootPath);

        // 1. Папки и файлы верхнего уровня
        if (rootFolders.length > 0 || rootFiles.length > 0) {
            const ul = document.createElement("ul");
            ul.className="file-list"
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

        // 2. Года
        if (years.length > 0) {
            const yearsDiv = document.createElement("div");
            yearsDiv.style.display="flex"; yearsDiv.style.gap="4px"; yearsDiv.style.margin="10px 0"; yearsDiv.style.overflowX="auto";

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

            // 3. Папки и файлы года
            const yearPath = rootPath + "/" + selectedYear;
            const { months, folders: yearFolders, files: yearFiles } = listDir(yearPath);

            const yearUl = document.createElement("ul");
            yearUl.className="file-list"
            yearFolders.forEach(folder => {
                const li = document.createElement("li");
                li.textContent = folder;
                li.className = "folder";
                li.onclick = () => {
                    currentFolderPath = yearPath + "/" + folder;
                    renderFilebar();
                };
                yearUl.appendChild(li);
            });
            yearFiles.forEach(f => addFileLi(yearUl, f));
            if (yearFolders.length > 0 || yearFiles.length > 0) filebar.appendChild(yearUl);

            // 4. Сетка месяцев
            if (months.length > 0) {
                const monthDiv = document.createElement("div");
                monthDiv.style.display="grid"; monthDiv.style.gridTemplateColumns="repeat(3,1fr)";
                monthDiv.style.gap="4px"; monthDiv.style.margin="10px 0";

                for (let i=1; i<=12; i++) {
                    const m = String(i).padStart(2, "0");
                    const btn = document.createElement("button");
                    btn.textContent = monthLabels[i-1];
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

                // 5. Файлы и папки выбранного месяца
                if (selectedMonth) {
                    const monthPath = yearPath + "/" + selectedMonth;
                    const { folders: monthFolders, files: monthFiles } = listDir(monthPath);

                    const monthUl = document.createElement("ul");
                    monthUl.className="file-list"
                    monthFolders.forEach(folder => {
                        const li = document.createElement("li");
                        li.textContent = folder;
                        li.className = "folder";
                        li.onclick = () => {
                            currentFolderPath = monthPath + "/" + folder;
                            renderFilebar();
                        };
                        monthUl.appendChild(li);
                    });
                    monthFiles.forEach(f => addFileLi(monthUl, f));
                    if (monthFolders.length > 0 || monthFiles.length > 0) filebar.appendChild(monthUl);
                }
            }
        }
    }

    // --- Рендер и восстановление ---
    const rootPath = files.files[0].split("/").slice(0, 2).join("/");
    const { years } = listDir(rootPath);
    restoreState(rootPath, years);
    renderFilebar();
}
