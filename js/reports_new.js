var lastFileData = {};
try {
    lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
} catch(e) {
    console.warn("Неверный JSON в localStorage для lastViewedFile");
}

const monthLabels = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];
let selectedYear = null;
let selectedMonth = null;
let selectedFile = lastFileData.path || null;

function reportsInit() {
    const container = document.getElementById("maincontainer");
    container.innerHTML = `
        <div id="filebar" style="width:250px; float:left; overflow:auto; height:100vh; border:1px solid #ddd; padding:10px; box-sizing:border-box;"></div>
        <div id="preview" style="margin-left:260px; padding:10px;"></div>
    `;
    const filebar = document.getElementById("filebar");
    const preview = document.getElementById("preview");

    function getTopLevelFiles() {
        return files.files.filter(f => {
            if (typeof f !== "string") return false;
            const parts = f.split("/");
            return parts.length === 3 || (parts.length === 4 && !/^\d{4}$/.test(parts[2]));
        });
    }

    function getYears() {
        let yearFiles = files.files.filter(f => f.split("/").length >= 4 && /^\d{4}$/.test(f.split("/")[2]));
        return [...new Set(yearFiles.map(f => f.split("/")[2]))].sort();
    }

    function getMonths(year) {
        const yearFiles = files.files.filter(f => f.includes("/"+year+"/"));
        return monthLabels.map((label, idx) => {
            const monthNum = String(idx+1).padStart(2,'0');
            const hasFiles = yearFiles.some(f => f.split("/")[3] === monthNum);
            return {label, monthNum, hasFiles};
        });
    }

    function getFiles(year=null, month=null) {
        return files.files.filter(f => {
            const parts = f.split("/");
            if (year && parts[2] !== year) return false;
            if (month) return parts[3] === month;
            return year ? parts.length === 4 : true;
        });
    }

    // --- рендер панели ---
    function renderFilebar() {
        filebar.innerHTML = "";

        // --- Верхний уровень ---
        const topFiles = getTopLevelFiles();
        if(topFiles.length > 0){
            const topDiv = document.createElement("div");
            topDiv.innerHTML = `<div style="font-weight:600;"></div>`;
            const ul=document.createElement("ul");
            ul.className="file-list";
            topDiv.appendChild(ul);
            topFiles.forEach(f => {
                const parts = f.split("/");
                const name = parts[2];
                const btn = document.createElement("li");
                btn.className = "file " + getFileClass(name);
                btn.textContent = name;
                btn.dataset.path = f;
                btn.onclick = () => openFile(f, true); // skipRender = true
                if(selectedFile === f) btn.classList.add("active-file");
                if(localStorage.getItem("viewed:"+f)) btn.style.opacity = 0.5;
                ul.appendChild(btn);
            });
            filebar.appendChild(topDiv);
        }

        // --- Года ---
        const years = getYears();
        if(years.length > 0){
            const yearsDiv = document.createElement("div");
            yearsDiv.style.display="flex"; yearsDiv.style.gap="4px"; yearsDiv.style.marginTop="10px";

            const yearButtonsDiv = document.createElement("div");
            yearButtonsDiv.style.display="flex"; yearButtonsDiv.style.gap="4px"; yearButtonsDiv.style.overflowX="auto"; yearButtonsDiv.style.flex="1";

            years.forEach(y => {
                const btn = document.createElement("button");
                btn.textContent = y;
                btn.className = "year-btn";
                if(selectedYear === y) btn.classList.add("active-year");

                btn.onclick = () => {
                    if(selectedYear === y) return; // клик по активному году ничего не делает
                    selectedYear = y;
                    selectedMonth = null;
                    renderFilebar();
                };
                yearButtonsDiv.appendChild(btn);
            });

            if(years.length > 3){
                const scrollLeft = document.createElement("button"); scrollLeft.textContent="◀";
                scrollLeft.onclick = () => yearButtonsDiv.scrollBy({left:-80,behavior:'smooth'});
                const scrollRight = document.createElement("button"); scrollRight.textContent="▶";
                scrollRight.onclick = () => yearButtonsDiv.scrollBy({left:80,behavior:'smooth'});
                yearsDiv.appendChild(scrollLeft); yearsDiv.appendChild(yearButtonsDiv); yearsDiv.appendChild(scrollRight);
            } else yearsDiv.appendChild(yearButtonsDiv);

            filebar.appendChild(yearsDiv);

            // Установка выбранного года при загрузке
            if(!selectedYear){
                const now = Date.now();
                if(lastFileData.path && lastFileData.timestamp && (now - lastFileData.timestamp) < 7*24*60*60*1000){
                    selectedYear = lastFileData.path.split("/")[2];
                    selectedMonth = lastFileData.path.split("/")[3];
                } else selectedYear = years[years.length-1];
            }

            renderYearContent(selectedYear);
        }
    }

    function renderYearContent(year){
        const oldDivs = filebar.querySelectorAll(".files-year-div, .folder-div, .month-grid-div");
        oldDivs.forEach(d => d.remove());

        const yearFiles = files.files.filter(f => f.split("/")[2] === year);

        // --- папки ---
        const potentialFolders = [...new Set(
            yearFiles
                .filter(f => typeof f === "string" && f.split("/").length > 3)
                .map(f => f.split("/")[3])
                .filter(name => typeof name === "string" && name.length > 0 && !/^(0[1-9]|1[0-2])$/.test(name))
        )];

        const folders = potentialFolders.filter(folderName =>
            yearFiles.some(f => f.split("/")[3] === folderName && f.split("/").length > 4)
        );

        if(folders.length > 0){
            const folderDiv = document.createElement("div");
            //folderDiv.className = "folder-div";
            //folderDiv.innerHTML = `<div style="font-weight:600;">Папки ${year}</div>`;
folders.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "file-btn folder";
    btn.textContent = f;

    if(selectedMonth === f) btn.classList.add("active-folder"); // активная папка

    btn.onclick = () => {
        if(selectedMonth === f) return; // клик по активной
        selectedMonth = f;

        // убрать active-folder с других
        filebar.querySelectorAll(".file-btn.folder").forEach(el => el.classList.remove("active-folder"));
        btn.classList.add("active-folder");

        renderFilesInMonth(year, selectedMonth);
    };
    folderDiv.appendChild(btn);
});

            filebar.appendChild(folderDiv);
        }

        // --- месяцы ---
        const months = getMonths(year);
        const monthDiv = document.createElement("div");
        monthDiv.className = "month-grid-div";
        monthDiv.style.display="grid"; monthDiv.style.gridTemplateColumns="repeat(3,1fr)";
        monthDiv.style.gridTemplateRows="repeat(4,auto)"; monthDiv.style.gap="4px"; monthDiv.style.marginTop="6px";

        months.forEach(m => {
            const btn = document.createElement("button");
            btn.textContent = m.label;
            btn.className = "month-btn";
            if(!m.hasFiles) btn.disabled = true;

            if(selectedMonth){
                if(selectedMonth === m.monthNum) btn.classList.add("active-month");
            } else if(lastFileData.path && lastFileData.path.split("/")[2] === year && lastFileData.path.split("/")[3] === m.monthNum){
                btn.classList.add("active-month");
                selectedMonth = m.monthNum;
            } else if(!selectedMonth && m.hasFiles && months.indexOf(m) === months.map(mm => mm.hasFiles).lastIndexOf(true)){
                btn.classList.add("active-month");
                selectedMonth = m.monthNum;
            }

            btn.onclick = () => {
                if(selectedMonth === m.monthNum) return; // клик по активному месяцу
                selectedMonth = m.monthNum;
                filebar.querySelectorAll(".month-btn.active-month").forEach(el => el.classList.remove("active-month"));
                btn.classList.add("active-month");
                renderFilesInMonth(year, m.monthNum);
            };
            monthDiv.appendChild(btn);
        });

        filebar.appendChild(monthDiv);

        // --- файлы ---
        if(selectedMonth) renderFilesInMonth(year, selectedMonth);
        else if(folders.length > 0) renderFilesInMonth(year, folders[0]);
        else renderFilesInMonth(year, null);
    }

function renderFilesInMonth(year, month){
    const oldDiv = filebar.querySelector(".files-year-div");
    if(oldDiv) oldDiv.remove();

    const filesDiv = document.createElement("div");
    filesDiv.style.marginTop = "10px";
    filesDiv.className = "files-year-div";

    const filesToShow = getFiles(year, month);
    if(filesToShow.length === 0) {
        console.log(`Нет файлов для ${year}/${month}`);
        return;
    }

    console.log(`Файлы для ${year}/${month}:`, filesToShow);

    const list = document.createElement("ul");
    list.className = "file-list";

    // Берём последний просмотренный файл из localStorage
    let lastFileData = {};
    try {
        lastFileData = JSON.parse(localStorage.getItem("lastViewedFile") || "{}");
    } catch(e){
        console.warn("Ошибка парсинга lastViewedFile", e);
    }

    const lastFileName = lastFileData.path ? lastFileData.path.split("/").pop() : null;
    console.log("Имя последнего просмотренного файла:", lastFileName);

    // Сначала ищем файл с таким же именем, если нет — первый файл месяца
    let activeInMonth = filesToShow.find(f => f.split("/").pop() === lastFileName) || filesToShow[0];
    selectedFile = activeInMonth;

    console.log("Выбран активный файл для месяца:", selectedFile);

    filesToShow.forEach(f => {
        const name = f.split("/").pop();
        const li = document.createElement("li");
        li.className = "file " + getFileClass(name);
        li.textContent = name;
        li.dataset.path = f;

        if(f === selectedFile) li.classList.add("active-file");
        if(localStorage.getItem("viewed:" + f)) li.classList.add("viewed");

        li.onclick = () => {
            if(selectedFile === f) return; // клик по активному
            selectedFile = f;

            list.querySelectorAll("li").forEach(el => el.classList.remove("active-file"));
            li.classList.add("active-file");

            localStorage.setItem("viewed:" + f, "1");
            li.classList.add("viewed");

            openFile(f, true); // предпросмотр
        };

        list.appendChild(li);
    });

    filesDiv.appendChild(list);

    if(selectedFile) openFile(selectedFile, true);

    filebar.appendChild(filesDiv);
}





    function openFile(f, skipRender = true){
        selectedFile = f;
        localStorage.setItem("lastViewedFile", JSON.stringify({path:f, timestamp:Date.now()}));
        localStorage.setItem("viewed:"+f,"1");

        if(!skipRender) renderFilebar(); // только при кликах по году/месяцу/папке

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

    renderFilebar();
}


