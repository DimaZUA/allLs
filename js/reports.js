var currentPath = [];
var selectedIndex = 0;
var currentView = "periods";

function buildModernInterface(fileList) {
  var container = document.getElementById("maincontainer");
  container.innerHTML = `
    <div id="customSidebar" class="custom-sidebar">
      <div class="view-switcher">
        <button id="viewPeriods" class="switch-btn selected">Периоды</button>
        <button id="viewReports" class="switch-btn">Отчёты</button>
      </div>
      <ul id="fileTree" class="file-tree"></ul>
    </div>
    <div id="preview"></div>`;

  document.getElementById("viewPeriods").onclick = function () {
    currentView = "periods";
    selectedIndex = 0;
    renderSidebarFiles(document.getElementById("fileTree"), fileList.files);
    toggleSelectedButton(this);
  };
  document.getElementById("viewReports").onclick = function () {
    currentView = "reports";
    selectedIndex = 0;
    renderReportsView(document.getElementById("fileTree"), fileList.files);
    toggleSelectedButton(this);
  };

  renderSidebarFiles(document.getElementById("fileTree"), fileList.files);
  document.addEventListener("keydown", handleKeyboardNavigation);
}

function toggleSelectedButton(btn) {
  document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function getCurrentDir(files) {
  var dir = {};
  files.forEach(function (file) {
    var parts = file.split("/").slice(2);
    var current = dir;
    parts.forEach(function (part, index) {
      if (index === parts.length - 1) {
        current[part] = file;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });
  currentPath.forEach(function (p) {
    if (dir[p]) dir = dir[p];
  });
  return dir;
}

function renderSidebarFiles(container, files) {
  if (currentView !== "periods") return;
  container.innerHTML = "";
  var currentDir = getCurrentDir(files);
  var items = [];
  if (currentPath.length > 0) {
    var backItem = createSidebarItem(".. (Назад)", "folder", function () {
      currentPath.pop();
      selectedIndex = 0;
      renderSidebarFiles(container, files);
    });
    container.appendChild(backItem);
    items.push(backItem);
  }
  Object.keys(currentDir).forEach(function (name) {
    var displayName = name;
    if (/^\d{4}$/.test(name) && name >= "2024" && name <= "2050") {
      displayName = `${name} год`;
    } else if (/^\d{2}$/.test(name) && name >= "01" && name <= "12") {
      var months = [
        "январь", "февраль", "март", "апрель", "май", "июнь",
        "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
      ];
      displayName = months[parseInt(name, 10) - 1];
    }
    if (typeof currentDir[name] === "object") {
      var folderItem = createSidebarItem(displayName, "folder", function () {
        currentPath.push(name);
        selectedIndex = 0;
        renderSidebarFiles(container, files);
      });
      container.appendChild(folderItem);
      items.push(folderItem);
    } else {
      var fileItem = createSidebarItem(displayName, getFileType(name), function (e) {
        return handleFileClick(currentDir[name], e, fileItem);
      });
      container.appendChild(fileItem);
      items.push(fileItem);
    }
  });
  if (items.length > 0) {
    items[selectedIndex]?.classList.add("selected");
    items[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function renderReportsView(container, files) {
  container.innerHTML = "";
  var tree = {};

  files.forEach(function (filePath) {
    var parts = filePath.split("/");
    if (parts.length < 4) return;
    var fileName = parts.at(-1);
    var year = parts[2];
    var isMonthly = parts.length > 4;
    var month = isMonthly ? parts[3] : null;
    if (!tree[fileName]) tree[fileName] = {};
    if (!tree[fileName][year]) tree[fileName][year] = { yearOnly: null, months: [] };
    if (isMonthly) {
      if (!tree[fileName][year].months.includes(month)) tree[fileName][year].months.push(month);
    } else {
      tree[fileName][year].yearOnly = filePath;
    }
  });

  function renderFileList() {
    container.innerHTML = "";
    Object.keys(tree).sort().forEach(function (fileName) {
      var fileItem = createSidebarItem(fileName, getFileType(fileName), function () {
        openLastYearAndMonth(fileName);
      });
      container.appendChild(fileItem);
    });
  }

  function openLastYearAndMonth(fileName) {
    var years = Object.keys(tree[fileName]).sort();
    if (years.length === 0) return;
    var lastYear = years[years.length - 1];
    var yearEntry = tree[fileName][lastYear];

    container.innerHTML = "";
    var backToFiles = createSidebarItem(".. (Назад)", "folder", function () {
      renderFileList();
    });
    container.appendChild(backToFiles);

    years.forEach(function (year) {
      var yearItem = createSidebarItem(year + " год", "folder", function () {
        renderMonthList(fileName, year);
      });
      if (year === lastYear) yearItem.classList.add("selected");
      container.appendChild(yearItem);
    });

    renderMonthList(fileName, lastYear, true);
  }

  function renderMonthList(fileName, year, autoSelect = false) {
    var oldMonthContainer = container.querySelector(".month-container");
    if (oldMonthContainer) oldMonthContainer.remove();

    var yearEntry = tree[fileName][year];
    if (!yearEntry) return;

    var monthContainer = document.createElement("div");
    monthContainer.classList.add("month-container");
    monthContainer.style.display = "grid";
    monthContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    monthContainer.style.gap = "4px";
    monthContainer.style.paddingLeft = "10px";

    var monthsMap = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    var monthLabels = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

    var sortedMonths = yearEntry.months.sort();

    sortedMonths.forEach(function (m) {
      var mItem = document.createElement("div");
      mItem.classList.add("sidebar-item", getFileType(fileName));
      mItem.textContent = monthLabels[monthsMap.indexOf(m)] || m;
      mItem.onclick = function (e) {
        var fullPath = files.find(f => f.endsWith(`/${year}/${m}/${fileName}`));
        handleFileClick(fullPath, e || new MouseEvent("click"), mItem);
        monthContainer.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("selected"));
        mItem.classList.add("selected");
      };
      monthContainer.appendChild(mItem);
    });

    container.appendChild(monthContainer);

if (autoSelect) {
  if (yearEntry.yearOnly) {
    let fileType = getFileType(fileName);
    let dummyEl = document.createElement("div");
    dummyEl.classList.add("sidebar-item", fileType);
    handleFileClick(yearEntry.yearOnly, new MouseEvent("click"), dummyEl);
  } else if (sortedMonths.length > 0) {
    // как было
    let lastMonth = sortedMonths[sortedMonths.length - 1];
    let lastMonthItem = Array.from(monthContainer.children).find(item => item.textContent === (monthLabels[monthsMap.indexOf(lastMonth)] || lastMonth));
    if (lastMonthItem) lastMonthItem.click();
  }
}

// Показать годовой отчёт, если он есть
if (yearEntry.yearOnly) {
  let fileType = getFileType(fileName);
  let dummyEl = document.createElement("div");
  dummyEl.classList.add("sidebar-item", fileType);
  handleFileClick(yearEntry.yearOnly, new MouseEvent("click"), dummyEl);
}
  
  
  
  }

  renderFileList();
}

function createSidebarItem(name, type, onclick) {
  var item = document.createElement("li");
  item.classList.add("sidebar-item", type);
  item.textContent = name;
  item.onclick = onclick;
  var icon = document.createElement("span");
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
  console.log('File element classes:', fileElement?.className);
  event?.stopPropagation?.();
  document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("selected"));
  fileElement?.classList.add("selected", "viewed");
  var preview = document.getElementById("preview");
  preview.innerHTML = "";
  var topBar = document.createElement("div");
  topBar.classList.add("top-bar");
  var downloadBtn = document.createElement("a");
  downloadBtn.href = filePath;
  downloadBtn.download = filePath.split("/").pop();
  downloadBtn.textContent = "📥 Скачать файл";
  downloadBtn.classList.add("download-btn");
  topBar.appendChild(downloadBtn);
  preview.appendChild(topBar);

  var baseUrl = window.location.origin + window.location.pathname;

  if (fileElement?.classList.contains("image")) {
    preview.innerHTML += `<img src="${filePath}" alt="Превью изображения" style="max-width: 100%; height: auto;">`;
  } else if (fileElement?.classList.contains("pdf")) {
    setTimeout(() => {
      preview.innerHTML += `<iframe src="${filePath}" width="100%" height="600px" frameborder="0"></iframe>`;
    }, 100);
  } else if (fileElement?.classList.contains("excel") || fileElement?.classList.contains("word")) {
    var viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(baseUrl + filePath)}`;
    preview.innerHTML += `<iframe src="${viewerUrl}" width="100%" height="600px" frameborder="0"></iframe>`;
  } else {
    downloadBtn.click();
  }
}

function handleKeyboardNavigation(e) {
  // навигация по клавиатуре
}

function reportsInit() {
  buildModernInterface(files);
}


var style = document.createElement("style");
style.textContent =
  `
    .custom-sidebar {
      width: 250px;
      background: #f8f9fa;
      padding: 10px;
      height: 100vh;
      overflow-y: auto;
      float: left;
      box-sizing: border-box;
    }
    .view-switcher {
      margin-bottom: 10px;
    }
    .file-tree {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar-item {
      padding: 10px;
      background: #ffffff;
      cursor: pointer;
      border-bottom: 1px solid #ddd;
      position: relative;
    }
    .folder {
      font-weight: bold;
      background: #ebdb4f;
    }
    .excel {
      background: #d4f8c4;
    }
    .image {
      background: #c4e3f8;
    }
    .pdf {
      background: #ffffff;
    }
    .other {
      background: #e0e0e0;
    }
    .selected {
      background: #007bff;
      color: white;
    }
    .sidebar-item:hover {
      background: #00abff;
      color: white;
    }
    .viewed {
      opacity: 0.5;
    }
    .file-icon {
      position: absolute;
      right: 10px;
      bottom: 10px;
      font-size: 12px;
      opacity: 0.7;
    }
    #preview {
      margin-left: 260px;
      padding: 20px;
    }
    .top-bar {
      margin-bottom: 10px;
    }
  `;
document.head.appendChild(style);
