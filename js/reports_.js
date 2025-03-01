let currentPath = [];
let selectedIndex = 0;

function buildCommanderInterface(fileList) {
    const container = document.getElementById("maincontainer");
    container.innerHTML = '<div id="panel" class="panel"></div>';
    renderCommanderFiles(document.getElementById("panel"), fileList.files);
    document.addEventListener("keydown", handleKeyboardNavigation);
}

function renderCommanderFiles(container, files) {
    container.innerHTML = "";
    const currentDir = getCurrentDir(files);
    const items = [];

    if (currentPath.length > 0) {
        const backItem = document.createElement("div");
        backItem.classList.add("file-item", "folder-item");
        backItem.textContent = ".. (Назад)";
        backItem.onclick = () => {
            currentPath.pop();
            renderCommanderFiles(container, files);
        };
        container.appendChild(backItem);
        items.push(backItem);
    }

    Object.keys(currentDir).forEach(name => {
        const fileItem = document.createElement("div");
        fileItem.classList.add("file-item");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = name;
        fileItem.appendChild(nameSpan);

        if (typeof currentDir[name] === "object") {
            fileItem.classList.add("folder-item");
            fileItem.onclick = () => {
                currentPath.push(name);
                renderCommanderFiles(container, files);
            };
        } else {
            fileItem.onclick = (e) => handleFileClick(currentDir[name], e, fileItem);
            const downloadBtn = document.createElement("button");
            downloadBtn.textContent = "↓";
            downloadBtn.classList.add("download-btn");
            downloadBtn.onclick = (e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = currentDir[name];
                link.download = name;
                link.click();
            };
            fileItem.appendChild(downloadBtn);
        }
        container.appendChild(fileItem);
        items.push(fileItem);
    });

    container.style.height = `${Math.max(10, items.length) * 30}px`;
    container.style.overflowY = items.length > 10 ? "scroll" : "hidden";

    if (items.length > 0) {
        items[selectedIndex]?.classList.add("selected");
    }
}

function getCurrentDir(files) {
    let dir = {};
    files.forEach(file => {
        const parts = file.split("/").slice(2);
        let current = dir;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                current[part] = file;
            } else {
                if (!current[part]) current[part] = {};
                current = current[part];
            }
        });
    });

    currentPath.forEach(p => {
        if (dir[p]) dir = dir[p];
    });

    return dir;
}

function handleFileClick(filePath, event, fileElement) {
    event.stopPropagation();
    const preview = document.getElementById("preview");
    preview.innerHTML = "";
    const ext = filePath.split(".").pop().toLowerCase();

    if (ext === "pdf") {
        preview.innerHTML = `<iframe src="${filePath}" width="100%" height="600px"></iframe>`;
    } else if (["jpg", "png"].includes(ext)) {
        preview.innerHTML = `<img src="${filePath}" width="100%">`;
    } else if (["xls", "xlsx"].includes(ext)) {
        preview.innerHTML = `<iframe src="https://docs.google.com/gview?url=${filePath}&embedded=true" width="100%" height="600px"></iframe>`;
    } else {
        window.open(filePath, '_blank');
    }
}

function handleKeyboardNavigation(e) {
    const items = document.querySelectorAll(".file-item");
    if (e.key === "ArrowDown" && selectedIndex < items.length - 1) {
        items[selectedIndex]?.classList.remove("selected");
        selectedIndex++;
    } else if (e.key === "ArrowUp" && selectedIndex > 0) {
        items[selectedIndex]?.classList.remove("selected");
        selectedIndex--;
    } else if (e.key === "Enter" && items[selectedIndex]) {
        items[selectedIndex].click();
    }
    items[selectedIndex]?.classList.add("selected");
}

function reportsInit() {
    buildCommanderInterface(files);
    document.getElementById("maincontainer").insertAdjacentHTML('beforeend', '<div id="preview"></div>');
}

// CSS для стиля
const style = document.createElement("style");
style.textContent = `
    .panel { display: block; width: 100%; max-width: 1024px; border: 1px solid #ccc; padding: 10px; margin: 5px; background: #000088; color: #ffffff; }
    .file-item { display: flex; justify-content: space-between; align-items: center; padding: 5px; cursor: pointer; height: 30px; }
    .file-item:hover { background: #0000aa; }
    .folder-item { font-weight: bold; }
    .selected { background: #5555ff; }
    .download-btn { background: #ffffff; color: #000088; border: none; padding: 2px 5px; cursor: pointer; }
    .download-btn:hover { background: #ccccff; }
    #preview { margin-top: 10px; border: 1px solid #ccc; padding: 10px; }
`;
document.head.appendChild(style);

reportsInit();