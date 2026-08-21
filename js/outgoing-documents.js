// outgoing-documents.js
(function () {
  "use strict";

  const TABLE = "outgoing_documents";
  const SECTION = "outgoing_documents";
  const DEFAULT_SIGNATURE_TEXT = "З повагою,\nГолова правління {org}________________/{Голова}";
  const state = {
    homeCode: "",
    docs: [],
    selectedHomeCodes: [],
    filter: "",
    currentDoc: null,
    mode: "list",
    comboOutsideHandler: null,
    autosaveTimer: null,
    autosaveBusy: false,
    autosavePending: false,
    persistPromise: null,
    selectedRowId: "",
    editorDirty: false,
    previewBack: null,
    editorHomeCodes: [],
    editorDocIdsByHome: {},
    editorAccountId: ""
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }

  function shortDate(value) {
    if (!value) return todayIso();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return todayIso();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function filePart(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "document";
  }

  function matchesSearch(value, query) {
    if (window.GrCommon && typeof GrCommon.matchesSearch === "function") {
      return GrCommon.matchesSearch(value, query);
    }
    return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
  }

  function getHomeByCode(code) {
    return (homes || []).find(h => String(h.code) === String(code)) || null;
  }

  function canEditHome(code) {
    void code;
    return typeof hasDocumentSectionAccess !== "function" || hasDocumentSectionAccess(SECTION);
  }

  function selectedHomes() {
    const all = homes || [];
    if (all.length === 1) return all;
    if (!state.selectedHomeCodes.length) return [];
    const set = new Set(state.selectedHomeCodes.map(String));
    return all.filter(h => set.has(String(h.code)));
  }

  function selectedHomeCodes() {
    return selectedHomes().map(h => String(h.code));
  }

  function show(text, type, duration) {
    if (typeof showMessage === "function") showMessage(text, type || "inf", duration || 4000);
  }

  async function ensureHomeData(code) {
    const key = String(code);
    window.homeData = window.homeData || {};
    if (window.homeData[key]) return window.homeData[key];
    if (typeof fetchHomeData === "function") {
      try {
        return await fetchHomeData(key);
      } catch (e) {
        console.warn("Не вдалося завантажити дані будинку", key, e);
      }
    }
    return {};
  }

  function buildReplacementMap(homeMeta, accountId, doc) {
    const menuHome = getHomeByCode(homeMeta && homeMeta.code) || {};
    const source = Object.assign({}, homeMeta || {}, menuHome || {});
    source.org = source.org || source.name || "";
    source.orgfull = source.orgfull || source.org || source.name || "";
    source.adr = source.adr || source.address || source.adrfull || source.adrlong || "";
    source.adrfull = source.adrfull || source.adr || "";
    source.okpo = source.okpo || source.code || "";
    source["сегодня"] = formatDate(new Date());
    const map = typeof getReplacementMap === "function" ? getReplacementMap(source) : {};
    map.org = map.org || source.org || "";
    map.adr = oneLineAddress(map.adr || source.adr || "");
    map.adrfull = oneLineAddress(map.adrfull || source.adrfull || source.adr || "");
    map.okpo = map.okpo || map.code || source.okpo || "";
    map["сегодня"] = map["сегодня"] || source["сегодня"];
    map["голова"] = chairNameWithFullInitials(map["головаfull"] || source["головаfull"] || source["голова"] || map["голова"]);
    const lsSource = source.ls || {};
    const lsItem = accountId && lsSource ? lsSource[accountId] : null;
    if (lsItem && window.GrCommon && GrCommon.buildLsPlaceholders) {
      const d = new Date((doc && doc.doc_date) || Date.now());
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 12);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
      Object.assign(map, GrCommon.buildLsPlaceholders(lsItem, accountId, source, start, end));
    }
    map.adr = oneLineAddress(map.adr || source.adr || "");
    map.adrfull = oneLineAddress(map.adrfull || source.adrfull || map.adr || "");
    return map;
  }

  function oneLineAddress(value) {
    return String(value || "")
      .replace(/\r?\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function chairNameWithFullInitials(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const parts = text.split(/\s+/);
    if (parts.length < 3) return text;
    const lastName = parts[0];
    const firstInitial = parts[1] ? `${parts[1][0]}.` : "";
    const middleInitial = parts[2] ? `${parts[2][0]}.` : "";
    return `${lastName} ${firstInitial}${middleInitial}`.trim();
  }

  function letterHeaderAddress(replacements) {
    return oneLineAddress(replacements && (replacements.adrfull || replacements.adr))
      .replace(/(р-н,?)\s/gi, "$1\n");
  }

  function replaceKnownPlaceholders(text, replacements, docDate) {
    if (window.GrCommon && typeof GrCommon.replacePlaceholders === "function") {
      return GrCommon.replacePlaceholders(text, replacements, docDate, { askUnknown: true });
    }
    let out = String(text || "");
    Object.keys(replacements || {}).forEach(function (key) {
      const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`, "gi");
      out = out.replace(re, replacements[key] == null ? "" : String(replacements[key]));
    });
    return out;
  }

  function parseInline(text, defaultSize) {
    const runs = [];
    let i = 0;
    let size = defaultSize || null;
    let buffer = "";
    let bufferSup = false;
    const mark = { bold: false, underline: false, italic: false };

    function push(sup) {
      if (!buffer) return;
      runs.push({
        text: buffer,
        size,
        sup: !!sup,
        bold: mark.bold,
        underline: mark.underline,
        italic: mark.italic
      });
      buffer = "";
    }

    while (i < text.length) {
      const rest = text.slice(i);
      const longStars = rest.match(/^\*{3,}/);
      if (longStars) {
        buffer += longStars[0];
        i += longStars[0].length;
        continue;
      }
      const longUnderscores = rest.match(/^_{3,}/);
      if (longUnderscores) {
        buffer += longUnderscores[0];
        i += longUnderscores[0].length;
        continue;
      }
      const font = rest.match(/^\{f(\d+)\}/i);
      if (font) {
        push(bufferSup);
        size = Number(font[1]) || null;
        bufferSup = false;
        i += font[0].length;
        continue;
      }
      if (/^\{f\}/i.test(rest)) {
        push(bufferSup);
        size = null;
        bufferSup = false;
        i += 3;
        continue;
      }
      const sup = rest.match(/^\{\^([^{}]+)\}/);
      if (sup) {
        push(bufferSup);
        i += sup[0].length;
        const value = sup[1];
        if (value) {
          runs.push({
            text: value,
            size,
            sup: true,
            bold: mark.bold,
            underline: mark.underline,
            italic: mark.italic
          });
        }
        bufferSup = false;
        continue;
      }
      if (rest.startsWith("**")) {
        push(bufferSup);
        mark.bold = !mark.bold;
        i += 2;
        continue;
      }
      if (rest.startsWith("*")) {
        push(bufferSup);
        mark.bold = !mark.bold;
        i += 1;
        continue;
      }
      if (rest.startsWith("__")) {
        push(bufferSup);
        mark.underline = !mark.underline;
        i += 2;
        continue;
      }
      if (rest.startsWith("_")) {
        push(bufferSup);
        mark.underline = !mark.underline;
        i += 1;
        continue;
      }
      if (rest.startsWith("//")) {
        push(bufferSup);
        mark.italic = !mark.italic;
        i += 2;
        continue;
      }
      if (rest.startsWith("/") && (i === 0 || /\s/.test(text[i - 1])) && /[^\s/]/.test(rest[1] || "")) {
        push(bufferSup);
        mark.italic = !mark.italic;
        i += 1;
        continue;
      }
      buffer += text[i];
      i += 1;
    }
    push(bufferSup);
    return runs.length ? runs : [{ text: "", size, sup: false }];
  }

  function parseDocumentText(text, replacements, docDate) {
    const replaced = replaceKnownPlaceholders(text, replacements, docDate).replace(/\{PrivatQR\}/gi, "");
    const blocks = [];
    let pendingAlign = null;
    let defaultSize = null;
    const alignMarkers = [
      { marker: "{=====}", align: "center" },
      { marker: "{==}", align: "center" },
      { marker: "{>--<}", align: "center" },
      { marker: "{=>}", align: "right" },
      { marker: "{<=}", align: "left" },
      { marker: "{<==>}", align: "justify" }
    ];

    String(replaced || "").split(/\r?\n/).forEach(function (rawLine) {
      let line = rawLine;
      let localAlign = null;
      let changed = true;
      while (changed) {
        changed = false;
        const trimmed = line.trimStart();
        const lead = line.slice(0, line.length - trimmed.length);
        for (const item of alignMarkers) {
          if (trimmed.toLowerCase().startsWith(item.marker.toLowerCase())) {
            localAlign = item.align;
            line = lead + trimmed.slice(item.marker.length).trimStart();
            changed = true;
            break;
          }
        }
      }

      const fontOnly = line.trim().match(/^\{f(\d+)\}$/i);
      if (fontOnly) {
        defaultSize = Number(fontOnly[1]) || null;
        return;
      }
      if (/^\{f\}$/i.test(line.trim())) {
        defaultSize = null;
        return;
      }

      if (!line.trim() && localAlign) {
        pendingAlign = localAlign;
        return;
      }

      const align = localAlign || pendingAlign || "left";
      pendingAlign = null;
      blocks.push({ align, runs: parseInline(line, defaultSize) });
    });
    return blocks;
  }

  function renderRuns(runs) {
    return (runs || []).map(function (run) {
      const style = run.size ? ` style="font-size:${Number(run.size)}pt"` : "";
      let text = escapeHtml(run.text);
      if (run.bold) text = `<strong>${text}</strong>`;
      if (run.underline) text = `<u>${text}</u>`;
      if (run.italic) text = `<em>${text}</em>`;
      return run.sup ? `<sup${style}>${text}</sup>` : `<span${style}>${text}</span>`;
    }).join("");
  }

  function getDocSignature(doc) {
    return doc && doc.signature_text !== null && doc.signature_text !== undefined
      ? String(doc.signature_text)
      : DEFAULT_SIGNATURE_TEXT;
  }

  function orgNameFontSizePt(name, maxSize) {
    const len = String(name || "").length;
    const max = Number(maxSize) || 20;
    if (max >= 36) {
      if (len <= 10) return 36;
      if (len <= 14) return 32;
      if (len <= 18) return 24;
      if (len <= 24) return 18;
      if (len <= 30) return 16;
      if (len <= 38) return 14;
      if (len <= 48) return 12;
      return 11;
    }
    if (len <= 18) return Math.min(max, 20);
    if (len <= 24) return Math.min(max, 18);
    if (len <= 32) return Math.min(max, 16);
    if (len <= 42) return Math.min(max, 14);
    return Math.min(max, 12);
  }

  function renderBlocksHtml(blocks, paragraphClass, defaultAlign) {
    return (blocks || []).map(function (block) {
      const alignClass = `od-align-${block.align || defaultAlign || "left"}`;
      const content = renderRuns(block.runs);
      const emptyClass = content ? "" : " od-empty-paragraph";
      return `<p class="${paragraphClass || "od-doc-paragraph"} ${alignClass}${emptyClass}">${content || "&nbsp;"}</p>`;
    }).join("");
  }

  function blockUnits(block) {
    const text = (block.runs || []).map(run => run.text || "").join("");
    if (!text.trim()) return 1;
    return Math.max(1, Math.ceil(text.length / 92));
  }

  function splitDocumentItems(bodyBlocks, signatureBlocks) {
    const items = (bodyBlocks || []).map(block => ({ type: "body", block }));
    if ((signatureBlocks || []).length) {
      items.push({ type: "signature-spacer", block: { align: "left", runs: [{ text: "" }] } });
      items.push({ type: "signature-spacer", block: { align: "left", runs: [{ text: "" }] } });
      items.push({ type: "signature-spacer", block: { align: "left", runs: [{ text: "" }] } });
      signatureBlocks.forEach(block => items.push({ type: "signature", block }));
    }
    const pages = [];
    let page = [];
    let used = 0;
    let limit = 37;
    items.forEach(item => {
      const units = blockUnits(item.block);
      if (page.length && used + units > limit) {
        pages.push(page);
        page = [];
        used = 0;
        limit = 54;
      }
      page.push(item);
      used += units;
    });
    if (page.length) pages.push(page);
    return pages.length ? pages : [[]];
  }

  function renderDocumentItems(items) {
    const body = [];
    const signature = [];
    (items || []).forEach(item => {
      if (item.type === "signature" || item.type === "signature-spacer") signature.push(item.block);
      else body.push(item.block);
    });
    return `
      <div class="od-doc-body">${renderBlocksHtml(body, "od-doc-paragraph", "justify")}</div>
      ${signature.length ? `<div class="od-signature od-signature-inline">${renderBlocksHtml(signature, "od-signature-paragraph")}</div>` : ""}
    `;
  }

  function renderDocumentSheet(doc, ctx, items, options) {
    const opts = options || {};
    const header = opts.continued ? "" : `
          <div class="od-letter-head">
            <div class="od-letter-brand">
              <img class="od-letter-logo" src="img/logo-small.png" alt="">
              <div>
                <div class="od-letter-org" style="font-size:${ctx.orgFontSize}pt">${escapeHtml(ctx.orgName)}</div>
                ${ctx.address ? `<div class="od-letter-address">${escapeHtml(ctx.address).replace(/\n/g, "<br>")}</div>` : ""}
              </div>
            </div>
            <div class="od-letter-bank">${ctx.bankLines.map(line => `<div>${escapeHtml(line)}</div>`).join("")}</div>
          </div>
          <div class="od-letter-line"></div>
          <div class="od-letter-routing">
            <div class="od-letter-meta">
              ${doc.doc_number ? `<div>Вихідний № ${escapeHtml(doc.doc_number)}</div>` : ""}
              ${doc.doc_date ? `<div>від ${escapeHtml(formatDate(doc.doc_date))}</div>` : ""}
            </div>
            ${ctx.recipientText ? `<div class="od-recipient">${escapeHtml(ctx.recipientText).replace(/\n/g, "<br>")}</div>` : "<div></div>"}
          </div>
    `;
    return `
      <section class="gr-sheet od-sheet ${opts.continued ? "od-sheet-continued" : ""}">
        <div class="gr-sheet-inner od-sheet-inner">
          ${header}
          ${renderDocumentItems(items)}
        </div>
      </section>
    `;
  }

  async function renderDocumentPages(doc) {
    const homeData = await ensureHomeData(doc.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(doc.home_code) || {}, { code: doc.home_code });
    const replacements = buildReplacementMap(home, doc.account_id || state.editorAccountId, doc);
    const bodyBlocks = parseDocumentText(doc.body || "", replacements, doc.doc_date);
    const signatureBlocks = parseDocumentText(getDocSignature(doc), replacements, doc.doc_date);
    const recipientText = replaceKnownPlaceholders(doc.recipient || "", replacements, doc.doc_date);
    const orgName = replacements.org || home.name || "";
    const address = letterHeaderAddress(replacements);
    const orgFontSize = orgNameFontSizePt(orgName, 36);
    const bankLines = [
      replacements.iban ? `IBAN: ${replacements.iban}` : "",
      replacements.bank ? replacements.bank : "",
      replacements.mfo ? `МФО: ${replacements.mfo}` : "",
      replacements.okpo ? `Код ЄДРПОУ: ${replacements.okpo}` : ""
    ].filter(Boolean);
    const ctx = { orgName, address, orgFontSize, bankLines, recipientText };
    const pages = splitDocumentItems(bodyBlocks, signatureBlocks);
    return `
      <div class="od-page-actions no-print">
        <button type="button" class="gr-page-action" data-od-edit="${escapeHtml(doc.id)}" title="Редагувати">✎</button>
        <button type="button" class="gr-page-action" data-od-download="${escapeHtml(doc.id)}" title="Скачати Word">Word</button>
      </div>
      ${pages.map((items, index) => `
        <div class="gr-sheet-wrap">
          ${renderDocumentSheet(doc, ctx, items, { continued: index > 0 })}
          ${window.GrCommon ? GrCommon.renderPageActionsHtml(index) : ""}
        </div>
      `).join("")}
    `;
  }

  function docFilterMatch(doc) {
    const q = state.filter.trim();
    if (!q) return true;
    return [doc.doc_number, doc.summary, doc.recipient, doc.body]
      .some(v => matchesSearch(v, q));
  }

  function filteredDocs() {
    const codes = new Set(selectedHomeCodes());
    return state.docs
      .filter(d => codes.has(String(d.home_code)))
      .filter(docFilterMatch)
      .sort(function (a, b) {
        const ad = String(a.doc_date || "");
        const bd = String(b.doc_date || "");
        if (ad !== bd) return bd.localeCompare(ad);
        return String(b.doc_number || "").localeCompare(String(a.doc_number || ""), undefined, { numeric: true });
      });
  }

  function renderRowsHtml() {
    const docs = filteredDocs();
    if (!docs.some(doc => String(doc.id) === String(state.selectedRowId))) {
      const firstEditable = docs.find(doc => canEditHome(doc.home_code));
      state.selectedRowId = firstEditable ? String(firstEditable.id) : (docs[0] ? String(docs[0].id) : "");
    }
    return docs.map(function (doc) {
      const home = getHomeByCode(doc.home_code);
      const editable = canEditHome(doc.home_code);
      const draftBadge = doc.is_draft ? `<span class="od-draft-badge">Чернетка</span>` : "";
      const selectedClass = String(doc.id) === String(state.selectedRowId) ? " od-row-selected" : "";
      return `<tr data-od-row="${escapeHtml(doc.id)}" ${editable ? `data-od-edit-row="${escapeHtml(doc.id)}"` : ""} class="${editable ? "od-clickable-row" : ""}${selectedClass}" tabindex="-1">
        <td>${escapeHtml(formatDate(doc.doc_date))}</td>
        <td>${escapeHtml(doc.doc_number || "")}${draftBadge}</td>
        <td>${escapeHtml(home ? home.name : doc.home_code)}</td>
        <td>${escapeHtml(doc.recipient || "")}</td>
        <td>${escapeHtml(doc.summary || "")}</td>
        <td class="od-row-actions">
          <div class="od-action-menu">
            <button type="button" class="od-action-toggle" data-od-menu-toggle aria-label="Дії">⋮</button>
            <div class="od-action-dropdown">
              <button type="button" data-od-show="${escapeHtml(doc.id)}"><i data-lucide="eye"></i><span>Показати</span></button>
              <button type="button" data-od-download="${escapeHtml(doc.id)}"><i data-lucide="file-text"></i><span>Word</span></button>
              <button type="button" data-od-copy="${escapeHtml(doc.id)}" ${editable ? "" : "disabled"}><i data-lucide="copy"></i><span>Копія</span></button>
              <button type="button" data-od-edit="${escapeHtml(doc.id)}" ${editable ? "" : "disabled"}><i data-lucide="pencil"></i><span>Редагувати</span></button>
              <button type="button" data-od-delete="${escapeHtml(doc.id)}" ${editable ? "" : "disabled"}><i data-lucide="trash-2"></i><span>Видалити</span></button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join("") || `<tr><td colspan="6" class="od-empty">Документів не знайдено</td></tr>`;
  }

  function renderHomeCombo() {
    if (typeof renderMultiHomePicker !== "function") return "";
    const allHomes = homes || [];
    return renderMultiHomePicker({
      id: "od-home-picker",
      homes: allHomes,
      selectedCodes: state.selectedHomeCodes,
      allSelected: state.selectedHomeCodes.length === allHomes.length,
      label: "Будинки",
      placeholder: "Оберіть будинок…",
      allLabel: "(Всі)",
      searchPlaceholder: "Пошук будинку…"
    });
  }

  function renderHomeFilterField() {
    return renderHomeCombo();
  }

  function renderList() {
    return `
      <div class="gr-app od-app">
        <div class="gr-toolbar od-toolbar">
          <div class="gr-toolbar-grid od-toolbar-grid">
            ${renderHomeFilterField()}
            <div class="gr-field od-filter-field">
              <label>Фільтр</label>
              <input type="search" data-od-filter value="${escapeHtml(state.filter)}" placeholder="номер, опис, кому, текст">
            </div>
            <div class="gr-field od-toolbar-actions">
              <label>&nbsp;</label>
              <button type="button" class="gr-btn gr-btn-primary" data-od-new>Новий документ</button>
            </div>
          </div>
        </div>
        <div class="od-list-wrap">
          <table class="od-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>№</th>
                <th>Будинок</th>
                <th>Кому</th>
                <th>Короткий опис</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${renderRowsHtml()}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function maxNumberForHome(homeCode, excludeId) {
    return state.docs
      .filter(d => String(d.home_code) === String(homeCode) && d.id !== excludeId)
      .map(d => Number(String(d.doc_number || "").replace(/[^\d]/g, "")))
      .filter(Number.isFinite)
      .reduce((max, n) => Math.max(max, n), 0);
  }

  function defaultEditableHome() {
    const current = getHomeByCode(state.homeCode);
    if (current && canEditHome(current.code)) return String(current.code);
    const first = (homes || []).find(h => canEditHome(h.code));
    return first ? String(first.code) : String(state.homeCode || "");
  }

  function editableHomes() {
    return (homes || []).filter(h => canEditHome(h.code));
  }

  function selectedEditorHomeCodes() {
    const editable = new Set(editableHomes().map(h => String(h.code)));
    return (state.editorHomeCodes || []).map(String).filter(code => editable.has(code));
  }

  function renderEditorHomePicker() {
    const list = editableHomes();
    const selectedCodes = selectedEditorHomeCodes();
    if (list.length <= 1) {
      const code = list[0] ? list[0].code : defaultEditableHome();
      return `<input type="hidden" name="home_code" value="${escapeHtml(code)}">`;
    }
    if (typeof renderMultiHomePicker !== "function") {
      const options = list.map(home =>
        `<option value="${escapeHtml(home.code)}" ${selectedCodes.includes(String(home.code)) ? "selected" : ""}>${escapeHtml(home.name || home.code)}</option>`
      ).join("");
      return `<label>Будинки<select name="home_code" multiple required>${options}</select></label>`;
    }
    return renderMultiHomePicker({
      id: "od-editor-home-picker",
      homes: list,
      selectedCodes,
      allSelected: selectedCodes.length === list.length,
      label: "Будинки",
      placeholder: "Оберіть будинок…",
      allLabel: "(Всі)",
      searchPlaceholder: "Пошук будинку…"
    });
  }

  function homeDataForEditorAccount(code) {
    const key = String(code || "");
    return (window.homeData && window.homeData[key])
      || (key && String(activeHomeCode || "") === key ? { ls, nach, oplat } : null)
      || null;
  }

  function renderAccountPicker(item) {
    const codes = state.editorHomeCodes.length ? state.editorHomeCodes : [item.home_code].filter(Boolean);
    if (codes.length !== 1) return "";
    const code = codes[0];
    const home = homeDataForEditorAccount(code);
    const rows = Object.entries((home && home.ls) || {})
      .map(([id, row]) => ({ id, row: row || {} }))
      .sort((a, b) => (Number(a.row.kv) || 0) - (Number(b.row.kv) || 0) || String(a.row.kv || "").localeCompare(String(b.row.kv || ""), "uk"));
    if (!rows.length) return "";
    const selected = item.account_id || state.editorAccountId || "";
    return `<label class="od-account-field">Особовий рахунок<select name="account_id">
      <option value="">Не вибрано</option>
      ${rows.map(({ id, row }) => `<option value="${escapeHtml(id)}" ${String(id) === String(selected) ? "selected" : ""}>кв. ${escapeHtml(row.kv || "")} - ${escapeHtml(row.fio || row.ls || id)}</option>`).join("")}
    </select></label>`;
  }

  function renderEditor(doc, options) {
    const opts = options || {};
    const isNew = !doc || !doc.id;
    state.editorDirty = false;
    state.previewBack = null;
    state.editorDocIdsByHome = {};
    const item = doc || {
      home_code: defaultEditableHome(),
      doc_date: todayIso(),
      doc_number: "",
      recipient: "",
      summary: "",
      body: "",
      signature_text: DEFAULT_SIGNATURE_TEXT,
      account_id: "",
      is_draft: true
    };
    if (isNew && item.home_code && !item.doc_number) {
      item.doc_number = String(maxNumberForHome(item.home_code) + 1);
    }
    const relatedDocs = (opts.docs || [item]).filter(Boolean);
    state.editorHomeCodes = relatedDocs.map(d => String(d.home_code || item.home_code || defaultEditableHome()));
    relatedDocs.forEach(d => {
      if (d.id && d.home_code) state.editorDocIdsByHome[String(d.home_code)] = String(d.id);
    });
    const homeField = renderEditorHomePicker();
    state.editorAccountId = String(item.account_id || "");
    return `
      <div class="gr-app od-app">
        <div class="od-editor">
          <div class="od-editor-head">
            <h2>${isNew ? "Новий вихідний документ" : "Редагування документа"} <span class="od-editor-draft-badge ${item.is_draft ? "" : "is-hidden"}" data-od-editor-draft>${item.is_draft ? "Чернетка" : "Не збережено"}</span></h2>
            <div class="od-editor-actions">
              <button type="button" class="gr-btn" data-od-cancel><i data-lucide="arrow-left"></i><span>Назад</span></button>
              <button type="button" class="gr-btn" data-od-editor-show><i data-lucide="eye"></i><span>Показати</span></button>
              <button type="button" class="gr-btn" data-od-editor-download><i data-lucide="file-text"></i><span>Word</span></button>
              <button type="button" class="gr-btn gr-btn-primary" data-od-save><i data-lucide="save"></i><span>${isNew ? "Створити" : "Зберегти"}</span></button>
            </div>
          </div>
          <form data-od-form data-od-id="${escapeHtml(item.id || "")}" data-od-draft="${item.is_draft ? "true" : "false"}">
            <div class="od-editor-grid">
              ${homeField}
              ${renderAccountPicker(item)}
              <label>Дата<input type="date" name="doc_date" value="${escapeHtml(shortDate(item.doc_date))}"></label>
              <label>Номер<input name="doc_number" value="${escapeHtml(item.doc_number || "")}"></label>
              <label class="gr-ph-field">Кому<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="recipient" rows="3">${escapeHtml(item.recipient || "")}</textarea></label>
              <label class="od-editor-summary">Короткий опис<input name="summary" value="${escapeHtml(item.summary || "")}"></label>
              <label class="od-editor-body gr-ph-field">Текст<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="body" rows="22">${escapeHtml(item.body || "")}</textarea></label>
              <label class="od-editor-signature gr-ph-field">Підпис<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="signature_text" rows="4">${escapeHtml(getDocSignature(item))}</textarea></label>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function getContainer() {
    return document.getElementById("preview") || document.getElementById("maincontainer");
  }

  function ensureRenderContainer() {
    let preview = document.getElementById("preview");
    if (preview) return preview;
    const main = document.getElementById("maincontainer");
    if (!main) return null;
    main.innerHTML = `<div id="preview"></div>`;
    return document.getElementById("preview");
  }

  function render(html) {
    const container = ensureRenderContainer();
    if (container) container.innerHTML = html;
    bindEvents();
    if (window.GrCommon) {
      GrCommon.initPlaceholderPicker(container, currentEditorPlaceholderCatalog);
      GrCommon.initPlaceholderHint(container, { names: ["body"] });
    }
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  function currentEditorPlaceholderCatalog() {
    if (!window.GrCommon || !GrCommon.defaultPlaceholderCatalog) return [];
    const form = document.querySelector("[data-od-form]");
    const code = selectedEditorHomeCodes()[0] || form?.querySelector('[name="home_code"]')?.value || activeHomeCode || "";
    const home = homeDataForEditorAccount(code) || {};
    const homeMeta = Object.assign({}, home, getHomeByCode(code) || {}, { code });
    const accountId = form?.querySelector('[name="account_id"]')?.value || state.editorAccountId || "";
    const lsItem = accountId && home.ls ? home.ls[accountId] : null;
    return GrCommon.defaultPlaceholderCatalog(homeMeta, lsItem);
  }

  async function loadDocs() {
    const codes = (homes || []).map(h => String(h.code));
    if (!codes.length) {
      state.docs = [];
      return;
    }
    try {
      await client.rpc("cleanup_old_outgoing_document_drafts");
    } catch (e) {
      console.warn("Не вдалося очистити старі чернетки вихідних документів", e);
    }
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .in("home_code", codes)
      .order("doc_date", { ascending: false });
    if (error) {
      console.error(error);
      show("Не вдалося завантажити вихідні документи", "err", 7000);
      state.docs = [];
      return;
    }
    state.docs = data || [];
  }

  async function openOutgoingDocuments(homeCodeParam) {
    state.homeCode = String(homeCodeParam || activeHomeCode || "");
    state.mode = "list";
    const current = getHomeByCode(state.homeCode);
    state.selectedHomeCodes = current ? [String(current.code)] : [];
    document.body.classList.add("files-mode");
    render(`<div class="gr-app od-app"><div class="od-loading">Завантаження...</div></div>`);
    await loadDocs();
    render(renderList());
  }

  async function refreshList() {
    await loadDocs();
    render(renderList());
  }

  function findDoc(id) {
    return state.docs.find(d => String(d.id) === String(id)) || null;
  }

  async function showDocs(docs, options) {
    const list = (docs || []).filter(Boolean);
    if (!list.length) return;
    state.currentDoc = list[0];
    state.mode = "show";
    state.previewBack = options && options.returnToEditor ? { mode: "editor", docs: list.slice() } : null;
    const htmlParts = [];
    for (const doc of list) htmlParts.push(await renderDocumentPages(doc));
    render(`<div class="gr-app od-preview-app"><div class="od-preview-tools no-print"><button type="button" class="gr-btn" data-od-back>Назад</button><button type="button" class="gr-btn" data-od-print>Друк</button><button type="button" class="gr-btn" data-od-pdf>PDF</button></div><div class="gr-output od-output">${htmlParts.join("")}</div></div>`);
    const out = document.querySelector(".od-output");
    if (window.GrCommon && out) {
      GrCommon.renumberSheetActions(out);
      GrCommon.bindPageActions(out);
    }
  }

  async function showDoc(id, options) {
    const doc = findDoc(id);
    if (!doc) return;
    await showDocs([doc], options);
  }

  async function deleteDoc(id) {
    const doc = findDoc(id);
    if (!doc || !canEditHome(doc.home_code)) return;
    if (!confirm(`Видалити документ № ${doc.doc_number || ""}?`)) return;
    const { error } = await client.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error(error);
      show("Не вдалося видалити документ", "err");
      return;
    }
    state.docs = state.docs.filter(d => String(d.id) !== String(id));
    render(renderList());
  }

  function editorPayload(form) {
    const fd = new FormData(form);
    return {
      home_code: String(fd.get("home_code") || ""),
      doc_date: fd.get("doc_date") || null,
      doc_number: String(fd.get("doc_number") || "").trim(),
      recipient: String(fd.get("recipient") || ""),
      summary: String(fd.get("summary") || ""),
      body: String(fd.get("body") || ""),
      signature_text: String(fd.get("signature_text") || ""),
      account_id: String(fd.get("account_id") || "")
    };
  }

  function editorHomeCodesFromForm(form) {
    const selected = selectedEditorHomeCodes();
    if (selected.length) return selected;
    const controls = Array.from(form.querySelectorAll('[name="home_code"]'));
    const values = controls.flatMap(control => {
      if (control.tagName === "SELECT" && control.multiple) return Array.from(control.selectedOptions).map(o => String(o.value));
      return [String(control.value || "")];
    }).filter(Boolean);
    return values.length ? values : [defaultEditableHome()].filter(Boolean);
  }

  function updateEditorDraftBadge(text, visible) {
    const badge = document.querySelector("[data-od-editor-draft]");
    if (!badge) return;
    badge.textContent = text || "";
    badge.classList.toggle("is-hidden", !visible);
  }

  function markEditorDirty() {
    state.editorDirty = true;
    const form = document.querySelector("[data-od-form]");
    const isDraft = form && form.dataset.odDraft === "true";
    updateEditorDraftBadge(isDraft ? "Чернетка" : "Не збережено", true);
    scheduleEditorAutosave();
  }

  async function handleBack() {
    if (state.mode === "show" && state.previewBack && state.previewBack.mode === "editor") {
      const docs = state.previewBack.docs || [];
      state.previewBack = null;
      if (docs.length) render(renderEditor(docs[0], { docs }));
      return;
    }
    const form = document.querySelector("[data-od-form]");
    if (form && state.editorDirty) {
      const shouldSave = await showConfirmDialog({
        message: "Зберегти зміни перед виходом?",
        title: "Є незбережені зміни",
        okText: "Зберегти",
        cancelText: "Не зберігати"
      });
      if (shouldSave) await persistEditorForm();
    }
    state.previewBack = null;
    state.editorDirty = false;
    render(renderList());
  }

  async function persistEditorForm(options) {
    if (state.persistPromise) await state.persistPromise;
    const operation = persistEditorFormNow(options);
    state.persistPromise = operation;
    try {
      return await operation;
    } finally {
      if (state.persistPromise === operation) state.persistPromise = null;
    }
  }

  async function persistEditorFormNow(options) {
    const opts = options || {};
    const form = document.querySelector("[data-od-form]");
    if (!form) return null;
    const id = form.dataset.odId || "";
    const basePayload = editorPayload(form);
    state.editorAccountId = basePayload.account_id || "";
    const homeCodes = Array.from(new Set(editorHomeCodesFromForm(form))).filter(Boolean);
    if (!homeCodes.length || homeCodes.some(code => !canEditHome(code))) {
      show("Немає прав на зміну документів вибраних будинків", "warn");
      return null;
    }
    const sourceDoc = id ? findDoc(id) : null;
    const saved = [];
    for (const code of homeCodes) {
      const existingId = state.editorDocIdsByHome[String(code)] || (sourceDoc && String(sourceDoc.home_code) === String(code) ? id : "");
      const payload = Object.assign({}, basePayload, {
        home_code: String(code),
        is_draft: opts.final ? false : form.dataset.odDraft === "true"
      });
      const updatesExisting = !!existingId;
      if (!updatesExisting) payload.doc_number = String(maxNumberForHome(code) + 1);
      if (homeCodes.length > 1 && updatesExisting && !payload.doc_number) {
        payload.doc_number = String(maxNumberForHome(code, existingId) + 1);
      }
      const query = updatesExisting
        ? client.from(TABLE).update(payload).eq("id", existingId).select("*").single()
        : client.from(TABLE).insert(payload).select("*").single();
      const { data, error } = await query;
      if (error) {
        console.error(error);
        if (!opts.silent) show("Не вдалося зберегти документ", "err", 7000);
        return null;
      }
      saved.push(data);
      state.editorDocIdsByHome[String(data.home_code)] = String(data.id);
      const idx = state.docs.findIndex(d => d.id === data.id);
      if (idx >= 0) state.docs[idx] = data;
      else state.docs.unshift(data);
    }
    const primary = saved.find(d => String(d.home_code) === String(sourceDoc && sourceDoc.home_code)) || saved[0];
    form.dataset.odId = primary.id;
    form.dataset.odDraft = primary.is_draft ? "true" : "false";
    state.editorDirty = false;
    const save = document.querySelector("[data-od-save]");
    if (save) {
      const label = save.querySelector("span");
      if (label) label.textContent = "Зберегти";
      else save.textContent = "Зберегти";
    }
    updateEditorDraftBadge(primary.is_draft ? "Чернетка" : "", !!primary.is_draft);
    return saved;
  }

  async function saveForm() {
    const saved = await persistEditorForm({ final: true });
    if (!saved) return;
    state.mode = "list";
    render(renderList());
  }

  async function saveAndShowFromEditor() {
    const saved = await persistEditorForm();
    if (saved) await showDocs(saved, { returnToEditor: true });
  }

  async function saveAndDownloadFromEditor() {
    const saved = await persistEditorForm();
    if (saved) await downloadDocxForDocs(saved);
  }

  function scheduleEditorAutosave() {
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(runEditorAutosave, 5000);
  }

  async function runEditorAutosave() {
    if (state.autosaveBusy) {
      state.autosavePending = true;
      return;
    }
    state.autosaveBusy = true;
    state.autosavePending = false;
    await persistEditorForm({ silent: true });
    state.autosaveBusy = false;
    if (state.autosavePending) scheduleEditorAutosave();
  }

  async function copyDoc(id) {
    const doc = findDoc(id);
    if (!doc || !canEditHome(doc.home_code)) return;
    const copy = Object.assign({}, doc, {
      id: "",
      legacy_code: null,
      doc_date: todayIso(),
      doc_number: String(maxNumberForHome(doc.home_code) + 1),
      is_draft: true
    });
    render(renderEditor(copy));
  }

  function newDoc() {
    render(renderEditor(null));
  }

  function editDoc(id) {
    const doc = findDoc(id);
    if (!doc || !canEditHome(doc.home_code)) return;
    render(renderEditor(doc));
  }

  function previewSheets() {
    return Array.from(document.querySelectorAll(".od-output .gr-sheet"));
  }

  function printPreviewDocs() {
    if (window.GrCommon) GrCommon.printSheets(".od-output");
    else window.print();
  }

  async function downloadPreviewPdf() {
    const sheets = previewSheets();
    if (!sheets.length) return;
    const doc = state.currentDoc || {};
    const name = `${filePart(doc.doc_number || doc.summary || "document")}.pdf`;
    if (window.GrCommon) await GrCommon.downloadPdfFromSheets(sheets, name);
  }

  function updateNumberOnHomeChange(select) {
    const form = select.closest("[data-od-form]");
    if (!form) return;
    const input = form.querySelector('[name="doc_number"]');
    if (!input) return;
    input.value = String(maxNumberForHome(select.value, form.dataset.odId || "") + 1);
  }

  function bindHomeCombo(container) {
    if (typeof bindMultiHomePicker !== "function") return;
    bindMultiHomePicker({
      id: "od-home-picker",
      getHomes: () => homes || [],
      getSelection: () => ({
        selectedCodes: state.selectedHomeCodes,
        allSelected: state.selectedHomeCodes.length === (homes || []).length
      }),
      setSelection: (selectedCodes) => {
        state.selectedHomeCodes = selectedCodes.slice();
      },
      onChange: () => {
      const tbody = container.querySelector(".od-table tbody");
      if (tbody) {
        tbody.innerHTML = renderRowsHtml();
        bindRowButtons(container);
        refreshIcons();
      }
      },
      placeholder: "Оберіть будинок…",
      allLabel: "(Всі)",
      searchPlaceholder: "Пошук будинку…"
    });
  }

  function bindEditorHomePicker(container) {
    const editable = editableHomes();
    if (editable.length <= 1) {
      state.editorHomeCodes = editable[0] ? [String(editable[0].code)] : [];
      return;
    }
    if (typeof bindMultiHomePicker === "function") {
      bindMultiHomePicker({
        id: "od-editor-home-picker",
        getHomes: () => editableHomes(),
        getSelection: () => ({
          selectedCodes: selectedEditorHomeCodes(),
          allSelected: selectedEditorHomeCodes().length === editableHomes().length
        }),
        setSelection: (selectedCodes) => {
          state.editorHomeCodes = selectedCodes.slice();
        },
        onChange: () => {
          updateEditorNumberForSelection();
          refreshEditorAccountPicker(container);
          markEditorDirty();
        },
        placeholder: "Оберіть будинок…",
        allLabel: "(Всі)",
        searchPlaceholder: "Пошук будинку…"
      });
    }
    const select = container.querySelector('[data-od-form] select[name="home_code"]');
    if (select && select.multiple) {
      select.addEventListener("change", function () {
        state.editorHomeCodes = Array.from(select.selectedOptions).map(o => String(o.value));
        updateEditorNumberForSelection();
        refreshEditorAccountPicker(container);
        markEditorDirty();
      });
    }
  }

  function updateEditorNumberForSelection() {
    const form = document.querySelector("[data-od-form]");
    if (!form) return;
    const input = form.querySelector('[name="doc_number"]');
    if (!input) return;
    const codes = selectedEditorHomeCodes();
    if (codes.length === 1) input.value = String(maxNumberForHome(codes[0], form.dataset.odId || "") + 1);
  }

  function refreshEditorAccountPicker(container) {
    const form = container.querySelector("[data-od-form]");
    const grid = form && form.querySelector(".od-editor-grid");
    if (!grid) return;
    const existing = grid.querySelector(".od-account-field");
    if (existing) existing.remove();
    state.editorAccountId = "";
    const codes = selectedEditorHomeCodes();
    if (codes.length !== 1) return;
    const html = renderAccountPicker({ home_code: codes[0], account_id: "" });
    if (!html) return;
    const homeField = grid.querySelector("#od-editor-home-picker") || grid.querySelector('[name="home_code"]')?.closest("label");
    if (homeField) homeField.insertAdjacentHTML("afterend", html);
    else grid.insertAdjacentHTML("afterbegin", html);
  }

  function bindEvents() {
    const container = getContainer();
    if (!container) return;
    bindHomeCombo(container);
    bindEditorHomePicker(container);
    const filter = container.querySelector("[data-od-filter]");
    if (filter) {
      filter.addEventListener("input", function () {
        state.filter = filter.value;
        const tbody = container.querySelector(".od-table tbody");
        if (tbody) {
          tbody.innerHTML = renderRowsHtml();
          bindRowButtons(container);
          refreshIcons();
        }
      });
    }
    bindRowButtons(container);
    const add = container.querySelector("[data-od-new]");
    if (add) add.addEventListener("click", newDoc);
    const back = container.querySelector("[data-od-back], [data-od-cancel]");
    if (back) back.addEventListener("click", handleBack);
    const print = container.querySelector("[data-od-print]");
    if (print) print.addEventListener("click", printPreviewDocs);
    const pdf = container.querySelector("[data-od-pdf]");
    if (pdf) pdf.addEventListener("click", downloadPreviewPdf);
    const save = container.querySelector("[data-od-save]");
    if (save) save.addEventListener("click", saveForm);
    const editorShow = container.querySelector("[data-od-editor-show]");
    if (editorShow) editorShow.addEventListener("click", saveAndShowFromEditor);
    const editorDownload = container.querySelector("[data-od-editor-download]");
    if (editorDownload) editorDownload.addEventListener("click", saveAndDownloadFromEditor);
    const homeSelect = container.querySelector('[data-od-form] select[name="home_code"]');
    if (homeSelect) homeSelect.addEventListener("change", () => {
      updateNumberOnHomeChange(homeSelect);
    });
    const editorForm = container.querySelector("[data-od-form]");
    if (editorForm) {
      editorForm.addEventListener("input", markEditorDirty);
      editorForm.addEventListener("change", event => {
        if (event.target && event.target.name === "account_id") {
          state.editorAccountId = event.target.value || "";
        }
        markEditorDirty();
      });
    }
  }

  function bindRowButtons(container) {
    container.querySelectorAll("[data-od-row]").forEach(row => row.addEventListener("click", function () {
      selectDocumentRow(row.dataset.odRow);
    }));
    container.querySelectorAll("[data-od-edit-row]").forEach(row => row.addEventListener("dblclick", function () {
      editDoc(row.dataset.odEditRow);
    }));
    container.querySelectorAll("[data-od-edit-row]").forEach(row => row.addEventListener("click", function () {
      editDoc(row.dataset.odEditRow);
    }));
    container.querySelectorAll("[data-od-menu-toggle]").forEach(btn => btn.addEventListener("click", function (event) {
      event.stopPropagation();
      const menu = btn.closest(".od-action-menu");
      const wasOpen = menu && menu.classList.contains("is-open");
      container.querySelectorAll(".od-action-menu.is-open").forEach(openMenu => openMenu.classList.remove("is-open"));
      if (menu && !wasOpen) menu.classList.add("is-open");
    }));
    container.querySelectorAll("[data-od-show]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      showDoc(btn.dataset.odShow);
    }));
    container.querySelectorAll("[data-od-download]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      downloadDocx(btn.dataset.odDownload);
    }));
    container.querySelectorAll("[data-od-copy]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      copyDoc(btn.dataset.odCopy);
    }));
    container.querySelectorAll("[data-od-edit]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      editDoc(btn.dataset.odEdit);
    }));
    container.querySelectorAll("[data-od-delete]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      deleteDoc(btn.dataset.odDelete);
    }));
  }

  function visibleDocumentRows() {
    return Array.from(document.querySelectorAll(".od-table tbody tr[data-od-row]"));
  }

  function selectDocumentRow(id) {
    if (!id) return;
    state.selectedRowId = String(id);
    visibleDocumentRows().forEach(row => {
      row.classList.toggle("od-row-selected", String(row.dataset.odRow) === state.selectedRowId);
    });
  }

  function moveDocumentSelection(delta) {
    const rows = visibleDocumentRows();
    if (!rows.length) return;
    const current = rows.findIndex(row => String(row.dataset.odRow) === String(state.selectedRowId));
    const base = current >= 0 ? current : 0;
    const next = Math.max(0, Math.min(rows.length - 1, base + delta));
    const row = rows[next];
    selectDocumentRow(row.dataset.odRow);
    row.scrollIntoView({ block: "nearest" });
  }

  function editSelectedDocumentRow() {
    const row = visibleDocumentRows().find(r => String(r.dataset.odRow) === String(state.selectedRowId));
    if (row && row.dataset.odEditRow) editDoc(row.dataset.odEditRow);
  }

  document.addEventListener("keydown", function (event) {
    const container = getContainer();
    if (!container || !container.querySelector(".od-table")) return;
    const target = event.target;
    if (target && target.closest && target.closest("input, textarea, select, button, .gr-combo")) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveDocumentSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveDocumentSelection(-1);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      moveDocumentSelection(10);
    } else if (event.key === "PageUp") {
      event.preventDefault();
      moveDocumentSelection(-10);
    } else if (event.key === "Enter") {
      event.preventDefault();
      editSelectedDocumentRow();
    }
  });

  document.addEventListener("click", function () {
    document.querySelectorAll(".od-action-menu.is-open").forEach(menu => menu.classList.remove("is-open"));
  });

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function paragraphXml(block, options) {
    const opts = options || {};
    const blockAlign = opts.defaultAlign && (!block.align || block.align === "left") ? opts.defaultAlign : (block.align || "left");
    const align = { center: "center", right: "right", justify: "both", left: "left" }[blockAlign] || "left";
    const runs = (block.runs || [{ text: "" }]).map(function (run) {
      const props = [];
      if (run.bold) props.push("<w:b/>");
      if (run.underline) props.push('<w:u w:val="single"/>');
      if (run.italic) props.push("<w:i/>");
      if (run.size) props.push(`<w:sz w:val="${Number(run.size) * 2}"/><w:szCs w:val="${Number(run.size) * 2}"/>`);
      if (run.sup) props.push(`<w:vertAlign w:val="superscript"/>`);
      props.push('<w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/>');
      const rpr = props.length ? `<w:rPr>${props.join("")}</w:rPr>` : "";
      const preserve = /^\s|\s$/.test(run.text || "") ? ' xml:space="preserve"' : "";
      return `<w:r>${rpr}<w:t${preserve}>${xmlEscape(run.text)}</w:t></w:r>`;
    }).join("");
    const isEmpty = !(block.runs || []).some(run => String(run.text || "").trim());
    const spacing = `<w:spacing w:after="${opts.after == null ? 0 : Number(opts.after)}" w:before="${opts.before == null ? 0 : Number(opts.before)}" w:line="240" w:lineRule="auto"/>`;
    const indent = isEmpty || opts.noFirstLine ? "" : '<w:ind w:firstLine="567"/>';
    return `<w:p><w:pPr>${spacing}${indent}<w:jc w:val="${align}"/></w:pPr>${runs}</w:p>`;
  }

  function blankParagraphXml() {
    return '<w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>';
  }

  function metaParagraph(text, align, bold) {
    const rpr = `<w:rPr>${bold ? "<w:b/>" : ""}<w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/></w:rPr>`;
    const runs = String(text || "").split(/\r?\n/).map((line, index) =>
      `<w:r>${rpr}${index ? "<w:br/>" : ""}<w:t>${xmlEscape(line)}</w:t></w:r>`
    ).join("");
    return `<w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="240" w:lineRule="auto"/><w:jc w:val="${align || "left"}"/></w:pPr>${runs}</w:p>`;
  }

  function wordRun(text, options) {
    const opts = options || {};
    const props = [];
    if (opts.font) props.push(`<w:rFonts w:ascii="${xmlEscape(opts.font)}" w:hAnsi="${xmlEscape(opts.font)}" w:cs="${xmlEscape(opts.font)}"/>`);
    if (opts.bold) props.push("<w:b/>");
    if (opts.size) props.push(`<w:sz w:val="${Number(opts.size) * 2}"/><w:szCs w:val="${Number(opts.size) * 2}"/>`);
    if (opts.color) props.push(`<w:color w:val="${opts.color}"/>`);
    props.push('<w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/>');
    const preserve = /^\s|\s$/.test(text || "") ? ' xml:space="preserve"' : "";
    return `<w:r>${props.length ? `<w:rPr>${props.join("")}</w:rPr>` : ""}<w:t${preserve}>${xmlEscape(text)}</w:t></w:r>`;
  }

  function wordParagraph(text, options) {
    const opts = options || {};
    const jc = opts.align ? `<w:jc w:val="${opts.align}"/>` : "";
    const spacing = `<w:spacing w:after="${opts.after == null ? 0 : Number(opts.after)}" w:before="${opts.before == null ? 0 : Number(opts.before)}" w:line="240" w:lineRule="auto"/>`;
    const runs = String(text || "").split(/\r?\n/).map((line, index) =>
      `${index ? "<w:br/>" : ""}${wordRun(line, opts)}`
    ).join("");
    return `<w:p><w:pPr>${spacing}${jc}</w:pPr>${runs}</w:p>`;
  }

  function headerLogoDrawing() {
    return `
      <w:p>
        <w:pPr><w:spacing w:after="0" w:before="0" w:line="240" w:lineRule="auto"/></w:pPr>
        <w:r>
          <w:drawing>
            <wp:inline distT="0" distB="0" distL="0" distR="0">
              <wp:extent cx="864000" cy="864000"/>
              <wp:docPr id="1" name="logo"/>
              <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
                    <pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
                    <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="864000" cy="864000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
                  </pic:pic>
                </a:graphicData>
              </a:graphic>
            </wp:inline>
          </w:drawing>
        </w:r>
      </w:p>
    `;
  }

  function tableCell(content, width) {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${content}</w:tc>`;
  }

  function routingTableCell(content, width) {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>${content}</w:tc>`;
  }

  function routingTableXml(doc, replacements) {
    const leftLines = [
      doc.doc_number ? `Вихідний № ${doc.doc_number}` : "",
      doc.doc_date ? `від ${formatDate(doc.doc_date)}` : ""
    ].filter(Boolean).join("\n");
    const rightLines = replaceKnownPlaceholders(doc.recipient || "", replacements, doc.doc_date).trim();
    if (!leftLines && !rightLines) return "";
    return `
      <w:tbl>
        <w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr>
        <w:tblGrid><w:gridCol w:w="6334"/><w:gridCol w:w="4438"/></w:tblGrid>
        <w:tr>
          ${routingTableCell(leftLines ? wordParagraph(leftLines, { size: 8 }) : wordParagraph("", { size: 8 }), 6334)}
          ${routingTableCell(rightLines ? wordParagraph(rightLines, { size: 10 }) : wordParagraph("", { size: 10 }), 4438)}
        </w:tr>
      </w:tbl>
    `;
  }

  function headerXml(replacements, home) {
    const orgName = replacements.org || home.name || "";
    const address = letterHeaderAddress(replacements);
    const orgFontSize = orgNameFontSizePt(orgName, 30);
    const bankLines = [
      replacements.iban ? `IBAN: ${replacements.iban}` : "",
      replacements.bank ? replacements.bank : "",
      replacements.mfo ? `МФО: ${replacements.mfo}` : "",
      replacements.okpo ? `Код ЄДРПОУ: ${replacements.okpo}` : ""
    ].filter(Boolean).join("\n");
    const brandText = [
      wordParagraph(orgName, { size: orgFontSize, color: "1F4B7A", font: "Arial Black" }),
      address ? wordParagraph(address, { size: 9 }) : "",
    ].join("");
    const line = `<w:p><w:pPr><w:spacing w:after="0" w:before="0" w:line="1" w:lineRule="exact"/><w:pBdr><w:bottom w:val="single" w:sz="18" w:space="1" w:color="1F5A9D"/></w:pBdr></w:pPr></w:p>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
        <w:tbl>
          <w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr>
          <w:tblGrid><w:gridCol w:w="1350"/><w:gridCol w:w="4984"/><w:gridCol w:w="4438"/></w:tblGrid>
          <w:tr>
            ${tableCell(headerLogoDrawing(), 1350)}
            ${tableCell(brandText, 4984)}
            ${tableCell(wordParagraph(bankLines, { size: 9 }), 4438)}
          </w:tr>
        </w:tbl>
        ${line}
      </w:hdr>`;
  }

  function logoSmallBase64ToUint8Array() {
    const b64 = window.OUTGOING_DOCUMENTS_LOGO_SMALL_BASE64 || "";
    if (!b64) throw new Error("OUTGOING_DOCUMENTS_LOGO_SMALL_BASE64 is missing");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function sectionPrXml(headerRelId) {
    return `<w:sectPr><w:titlePg/><w:headerReference w:type="first" r:id="${headerRelId}"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1850" w:right="567" w:bottom="1134" w:left="567" w:header="280" w:footer="708" w:gutter="0"/></w:sectPr>`;
  }

  async function docxBodyForDoc(doc) {
    const homeData = await ensureHomeData(doc.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(doc.home_code) || {}, { code: doc.home_code });
    const replacements = buildReplacementMap(home, doc.account_id || "", doc);
    const blocks = parseDocumentText(doc.body || "", replacements, doc.doc_date);
    const signatureBlocks = parseDocumentText(getDocSignature(doc), replacements, doc.doc_date);
    const signaturePrefix = signatureBlocks.length ? [blankParagraphXml(), blankParagraphXml(), blankParagraphXml()] : [];
    const body = [
      routingTableXml(doc, replacements),
      ...blocks.map(block => paragraphXml(block, { defaultAlign: "justify" })),
      ...signaturePrefix,
      ...signatureBlocks.map(block => paragraphXml(block, { noFirstLine: true }))
    ].filter(Boolean).join("");
    return { body, replacements, home };
  }

  async function buildDocxBlobForDocs(docs) {
    if (!window.JSZip) throw new Error("JSZip is not loaded");
    const list = (docs || []).filter(Boolean);
    if (!list.length) throw new Error("No documents");
    const zip = new JSZip();
    const docParts = [];
    const contentHeaderOverrides = [];
    const documentRelationships = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'];
    for (let index = 0; index < list.length; index++) {
      const relId = `rIdHeader${index + 1}`;
      const headerName = `header${index + 1}.xml`;
      const part = await docxBodyForDoc(list[index]);
      contentHeaderOverrides.push(`<Override PartName="/word/${headerName}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`);
      documentRelationships.push(`<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="${headerName}"/>`);
      zip.folder("word").file(headerName, headerXml(part.replacements, part.home));
      zip.folder("word").folder("_rels").file(`${headerName}.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>`);
      if (index < list.length - 1) docParts.push(`${part.body}<w:p><w:pPr>${sectionPrXml(relId)}</w:pPr></w:p>`);
      else docParts.push(`${part.body}${sectionPrXml(relId)}`);
    }
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>${contentHeaderOverrides.join("")}<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.folder("word").folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${documentRelationships.join("")}</Relationships>`);
    zip.folder("word").folder("media").file("logo.png", logoSmallBase64ToUint8Array());
    zip.folder("word").file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="uk-UA" w:eastAsia="uk-UA" w:bidi="uk-UA"/></w:rPr></w:style></w:styles>`);
    zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${docParts.join("")}</w:body></w:document>`);
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  async function buildDocxBlob(doc) {
    return buildDocxBlobForDocs([doc]);
  }

  function saveBlob(blob, name) {
    if (typeof saveAs === "function") saveAs(blob, name);
    else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  }

  async function downloadDocxForDocs(docs) {
    const list = (docs || []).filter(Boolean);
    if (!list.length) return;
    try {
      const blob = await buildDocxBlobForDocs(list);
      const first = list[0];
      const home = getHomeByCode(first.home_code);
      const prefix = list.length > 1 ? `${list.length}_bud` : filePart(home && (home.org3 || home.name) || first.home_code);
      const name = `${prefix}_${filePart(first.doc_number || first.summary || "document")}.docx`;
      saveBlob(blob, name);
    } catch (e) {
      console.error(e);
      show("Не вдалося сформувати DOCX", "err", 7000);
    }
  }

  async function downloadDocx(id) {
    const doc = findDoc(id);
    if (!doc) return;
    try {
      const blob = await buildDocxBlob(doc);
      const home = getHomeByCode(doc.home_code);
      const name = `${filePart(home && (home.org3 || home.name) || doc.home_code)}_${filePart(doc.doc_number || doc.summary)}.docx`;
      saveBlob(blob, name);
    } catch (e) {
      console.error(e);
      show("Не вдалося сформувати DOCX", "err", 7000);
    }
  }

  window.openOutgoingDocuments = openOutgoingDocuments;
})();
