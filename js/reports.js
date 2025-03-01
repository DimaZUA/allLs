        function buildTree(fileList) {
            const tree = { "Отчеты": {} };
            let latestYear = "", latestMonth = "";
            fileList.files.forEach(path => {
                const parts = path.split("/").slice(2);
                if (parts.length < 2) return;
                let year = parts[0];
                let month = parts[1];
                
                if (!latestYear || year > latestYear) {
                    latestYear = year;
                    latestMonth = month;
                } else if (year === latestYear && month > latestMonth) {
                    latestMonth = month;
                }
                
                let current = tree["Отчеты"];
                parts.forEach((part, index) => {
                    if (!current[part]) {
                        current[part] = index === parts.length - 1 ? path : {};
                    }
                    current = current[part];
                });
            });
            return { tree, latestYear, latestMonth };
        }

        function renderTree(container, tree, expandPath = []) {
            const ul = document.createElement("ul");
            Object.entries(tree).forEach(([name, value]) => {
                const li = document.createElement("li");
                if (typeof value === "string") {
                    li.textContent = name;
                    li.classList.add("file");
                    li.onclick = (e) => handleFileClick(value, e, li);
                } else {
                    li.textContent = name;
                    li.classList.add("folder");
                    const subContainer = document.createElement("div");
                    if (expandPath.includes(name)) {
                        subContainer.style.display = "block";
                    } else {
                        subContainer.style.display = "none";
                    }

                    li.onclick = (e) => {
                        e.stopPropagation(); // Останавливаем всплытие события
                        // Изменяем видимость вложенных элементов только для папок
                        if (subContainer.style.display === "none") {
                            subContainer.style.display = "block";
                        } else {
                            subContainer.style.display = "none";
                        }
                    };
                    renderTree(subContainer, value, expandPath);
                    li.appendChild(subContainer);
                }
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }

        function handleFileClick(filePath, event, liElement) {
            event.stopPropagation(); // Останавливаем всплытие события на файле
            const preview = document.getElementById("preview");
            preview.innerHTML = "";
            const ext = filePath.split(".").pop().toLowerCase();
            if (ext === "pdf") {
                preview.innerHTML = `<iframe src="${filePath}" width="100%" height="1500px"></iframe>`;
            } else if (["jpg", "png"].includes(ext)) {
                preview.innerHTML = `<img src="${filePath}" width="100%">`;
            } else {
                const link = document.createElement("a");
                link.href = filePath;
                link.download = filePath.split("/").pop();
                link.click();
            }

            // Помечаем файл как просмотренный
            liElement.classList.add("viewed");
        }

        const { tree: fileTree, latestYear, latestMonth } = buildTree(files);
        function reportsInit(){
        document.getElementById('maincontainer').innerHTML ='<div id="fileTree"></div> <div id="preview"></div>'
        renderTree(document.getElementById("fileTree"), fileTree, ["Отчеты", latestYear, latestMonth]);
        }