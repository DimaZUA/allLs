let currentPath = [];
let selectedIndex = 0;

function buildModernInterface(fileList) {
    const container = document.getElementById("maincontainer");
    container.innerHTML = '<div id="customSidebar" class="custom-sidebar"><ul id="fileTree" class="file-tree"></ul></div>';
    container.insertAdjacentHTML('beforeend', '<div id="preview"></div>');
    renderSidebarFiles(document.getElementById("fileTree"), fileList.files);
    document.addEventListener("keydown", handleKeyboardNavigation);
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

function renderSidebarFiles(container, files) {
    container.innerHTML = "";
    const currentDir = getCurrentDir(files);
    const items = [];

    if (currentPath.length > 0) {
        const backItem = createSidebarItem(".. (Назад)", "folder", () => {
            currentPath.pop();
            selectedIndex = 0;
            renderSidebarFiles(container, files);
        });
        container.appendChild(backItem);
        items.push(backItem);
    }

    Object.keys(currentDir).forEach(name => {
        let displayName = name;
        if (/^\d{4}$/.test(name) && name >= "2024" && name <= "2050") {
            displayName = `${name} год`;
        } else if (/^\d{2}$/.test(name) && name >= "01" && name <= "12") {
            const months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
            displayName = months[parseInt(name, 10) - 1];
        }
        
        if (typeof currentDir[name] === "object") {
            const folderItem = createSidebarItem(displayName, "folder", () => {
                currentPath.push(name);
                selectedIndex = 0;
                renderSidebarFiles(container, files);
            });
            container.appendChild(folderItem);
            items.push(folderItem);
        } else {
            const fileItem = createSidebarItem(displayName, getFileType(name), (e) => handleFileClick(currentDir[name], e, fileItem));
            container.appendChild(fileItem);
            items.push(fileItem);
        }
    });

    if (items.length > 0) {
        items[selectedIndex]?.classList.add("selected");
        items[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

function createSidebarItem(name, type, onclick) {
    const item = document.createElement("li");
    item.classList.add("sidebar-item", type);
    item.textContent = name;
    item.onclick = onclick;
    const icon = document.createElement("span");
    icon.classList.add("file-icon", type);
    item.appendChild(icon);
    return item;
}

function getFileType(name) {
    if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "excel";
    if (name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".gif")) return "image";
    if (name.endsWith(".pdf")) return "pdf";
    return "other";
}

function handleFileClick(filePath, event, fileElement) {
    event.stopPropagation();
    document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("selected"));
    fileElement.classList.add("selected");
    fileElement.classList.add("viewed");
    const preview = document.getElementById("preview");
    if (fileElement.classList.contains("image")) {
        preview.innerHTML = `<img src="${filePath}" style="max-width: 100%; height: auto;">`;
    } else {
        preview.innerHTML = `<iframe src="${filePath}" width="100%" height="600px"></iframe>`;
    }
}

function handleKeyboardNavigation(e) {
    const items = document.querySelectorAll(".sidebar-item");
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
    items[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function reportsInit() {
    buildModernInterface(files);
}

const style = document.createElement("style");
style.textContent = `
    .custom-sidebar { width: 250px; background: #f8f9fa; padding: 10px; position: absolute; top: 0; bottom: 0; overflow-y: auto; }
    .file-tree { list-style: none; padding: 0; }
    .sidebar-item { padding: 10px; background: #ffffff; cursor: pointer; border-bottom: 1px solid #ddd; position: relative; }
    .folder { font-weight: bold; background: #ffeb3b; }
    .excel { background: #d4f8c4; }
    .image { background: #c4e3f8; }
    .pdf { background: #ffffff; }
    .other { background: #e0e0e0; }
    .sidebar-item:hover, .selected { background: #007bff; color: white; }
    .viewed { text-decoration: line-through; }
    .file-icon { position: absolute; right: 10px; bottom: 10px; font-size: 12px; opacity: 0.7; }
    #preview { margin-left: 260px; padding: 20px; }
`;
document.head.appendChild(style);
