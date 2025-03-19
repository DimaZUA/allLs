function _typeof(o) {
  "@babel/helpers - typeof";
  return (
    (_typeof =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (o) {
            return typeof o;
          }
        : function (o) {
            return o &&
              "function" == typeof Symbol &&
              o.constructor === Symbol &&
              o !== Symbol.prototype
              ? "symbol"
              : typeof o;
          }),
    _typeof(o)
  );
}
var currentPath = [];
var selectedIndex = 0;
function buildModernInterface(fileList) {
  var container = document.getElementById("maincontainer");
  container.innerHTML =
    '<div id="customSidebar" class="custom-sidebar"><ul id="fileTree" class="file-tree"></ul></div>';
  container.insertAdjacentHTML("beforeend", '<div id="preview"></div>');
  renderSidebarFiles(document.getElementById("fileTree"), fileList.files);
  document.addEventListener("keydown", handleKeyboardNavigation);
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
      displayName = "".concat(name, " \u0433\u043E\u0434");
    } else if (/^\d{2}$/.test(name) && name >= "01" && name <= "12") {
      var months = [
        "январь",
        "февраль",
        "март",
        "апрель",
        "май",
        "июнь",
        "июль",
        "август",
        "сентябрь",
        "октябрь",
        "ноябрь",
        "декабрь"
      ];
      displayName = months[parseInt(name, 10) - 1];
    }
    if (_typeof(currentDir[name]) === "object") {
      var folderItem = createSidebarItem(displayName, "folder", function () {
        currentPath.push(name);
        selectedIndex = 0;
        renderSidebarFiles(container, files);
      });
      container.appendChild(folderItem);
      items.push(folderItem);
    } else {
      var fileItem = createSidebarItem(
        displayName,
        getFileType(name),
        function (e) {
          return handleFileClick(currentDir[name], e, fileItem);
        }
      );
      container.appendChild(fileItem);
      items.push(fileItem);
    }
  });
  if (items.length > 0) {
    var _items$selectedIndex, _items$selectedIndex2;
    (_items$selectedIndex = items[selectedIndex]) === null ||
      _items$selectedIndex === void 0 ||
      _items$selectedIndex.classList.add("selected");
    (_items$selectedIndex2 = items[selectedIndex]) === null ||
      _items$selectedIndex2 === void 0 ||
      _items$selectedIndex2.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
  }
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
  if (name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".gif"))
    return "image";
  if (name.endsWith(".pdf")) return "pdf";
  return "other";
}
function handleFileClick(filePath, event, fileElement) {
  event.stopPropagation();
  document.querySelectorAll(".sidebar-item").forEach(function (el) {
    return el.classList.remove("selected");
  });
  fileElement.classList.add("selected");
  fileElement.classList.add("viewed");
  var preview = document.getElementById("preview");
  preview.innerHTML = "";

  // Создаем контейнер для кнопки скачивания
  var topBar = document.createElement("div");
  topBar.classList.add("top-bar");

  // Создаем кнопку скачивания
  var downloadBtn = document.createElement("a");
  downloadBtn.href = filePath;
  downloadBtn.download = filePath.split("/").pop();
  downloadBtn.textContent = "📥 Скачать файл";
  downloadBtn.classList.add("download-btn");
  topBar.appendChild(downloadBtn);
  preview.appendChild(topBar);
  var baseUrl = window.location.origin + window.location.pathname;
  if (fileElement.classList.contains("image")) {
    preview.innerHTML += '<img src="'.concat(
      filePath,
      '" alt="\u041F\u0440\u0435\u0432\u044C\u044E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" style="max-width: 100%; height: auto;">'
    );
  } else if (fileElement.classList.contains("pdf")) {
    setTimeout(function () {
      preview.innerHTML += '<iframe src="'.concat(
        filePath,
        '" width="100%" height="600px" frameborder="0"></iframe>'
      );
    }, 100);
  } else if (
    fileElement.classList.contains("excel") ||
    fileElement.classList.contains("word")
  ) {
    var viewerUrl = "https://view.officeapps.live.com/op/view.aspx?src=".concat(
      encodeURIComponent(baseUrl + filePath)
    );
    preview.innerHTML += '<iframe src="'.concat(
      viewerUrl,
      '" width="100%" height="600px" frameborder="0"></iframe>'
    );
  } else {
    downloadBtn.click();
  }
}
function handleKeyboardNavigation(e) {
  var _items$selectedIndex5, _items$selectedIndex6;
  var items = document.querySelectorAll(".sidebar-item");
  if (e.key === "ArrowDown" && selectedIndex < items.length - 1) {
    var _items$selectedIndex3;
    (_items$selectedIndex3 = items[selectedIndex]) === null ||
      _items$selectedIndex3 === void 0 ||
      _items$selectedIndex3.classList.remove("selected");
    selectedIndex++;
  } else if (e.key === "ArrowUp" && selectedIndex > 0) {
    var _items$selectedIndex4;
    (_items$selectedIndex4 = items[selectedIndex]) === null ||
      _items$selectedIndex4 === void 0 ||
      _items$selectedIndex4.classList.remove("selected");
    selectedIndex--;
  } else if (e.key === "Enter" && items[selectedIndex]) {
    items[selectedIndex].click();
  }
  (_items$selectedIndex5 = items[selectedIndex]) === null ||
    _items$selectedIndex5 === void 0 ||
    _items$selectedIndex5.classList.add("selected");
  (_items$selectedIndex6 = items[selectedIndex]) === null ||
    _items$selectedIndex6 === void 0 ||
    _items$selectedIndex6.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
}
function reportsInit() {
  buildModernInterface(files);
}
var style = document.createElement("style");
style.textContent =
  "\n    .custom-sidebar { width: 250px; background: #f8f9fa; padding: 10px; position: absolute; top: 0; bottom: 0; overflow-y: auto; }\n    .file-tree { list-style: none; padding: 0; }\n    .sidebar-item { padding: 10px; background: #ffffff; cursor: pointer; border-bottom: 1px solid #ddd; position: relative; }\n    .folder { font-weight: bold; background: #ebdb4f; }\n    .excel { background: #d4f8c4; }\n    .image { background: #c4e3f8; }\n    .pdf { background: #ffffff; }\n    .other { background: #e0e0e0; }\n    .selected { background: #007bff; color: white; }\n    .sidebar-item:hover{ background: #00abff; color: white; }\n    .viewed { opacity: 0.5 }\n    .file-icon { position: absolute; right: 10px; bottom: 10px; font-size: 12px; opacity: 0.7; }\n    #preview { margin-left: 260px; padding: 20px; }\n";
document.head.appendChild(style);
