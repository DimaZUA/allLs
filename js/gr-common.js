// gr-common.js — спільні утиліти для генераторів (листи, PDF, placeholders, rich text)
(function () {
  "use strict";

  const MONTHS_UA_GEN = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
  ];
  const MONTHS_UA_FULL = [
    "січень", "лютий", "березень", "квітень", "травень", "червень",
    "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"
  ];
  const MONTHS_UA_LOC = [
    "січні", "лютому", "березні", "квітні", "травні", "червні",
    "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
  ];

  const imageDataUrlCache = new Map();

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function parseDocDate(value) {
    if (!value) return new Date();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function buildDatePlaceholders(docDate) {
    const d = parseDocDate(docDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const nextMonth = new Date(y, m + 1, 1);
    const prevMonth = new Date(y, m - 1, 1);
    const fmt = (dt, pattern) => {
      const yy = dt.getFullYear();
      const mm = dt.getMonth();
      const dd = dt.getDate();
      return pattern
        .replace(/yyyy/g, String(yy))
        .replace(/yy/g, pad2(yy % 100))
        .replace(/mmmm/g, MONTHS_UA_GEN[mm])
        .replace(/MMMM/g, MONTHS_UA_FULL[mm])
        .replace(/mm/g, pad2(mm + 1))
        .replace(/dd/g, pad2(dd));
    };
    return {
      дата: fmt(d, "dd.mm.yyyy"),
      date: fmt(d, "dd.mm.yyyy"),
      "1число": fmt(new Date(y, m, 1), "dd.mm.yyyy"),
      "першечисло": fmt(new Date(y, m, 1), "dd.mm.yyyy"),
      "останнійдень": fmt(new Date(y, m, lastDay), "dd.mm.yyyy"),
      "наступниймісяць": fmt(nextMonth, "dd.mm.yyyy"),
      "попередніймісяць": fmt(prevMonth, "dd.mm.yyyy"),
      "датапропис": fmt(d, "dd mmmm yyyy") + " р.",
      "датазакресленням": "«" + pad2(day) + "» " + MONTHS_UA_GEN[m] + " " + y + " р.",
      "місяць": MONTHS_UA_LOC[m] + " " + y + " р.",
      "наступниймісяцьназва": MONTHS_UA_LOC[nextMonth.getMonth()] + " " + nextMonth.getFullYear() + " р.",
      "попередніймісяцьназва": MONTHS_UA_LOC[prevMonth.getMonth()] + " " + prevMonth.getFullYear() + " р.",
      "сегодня": fmt(new Date(), "dd.mm.yyyy")
    };
  }

  function expandFormattedPlaceholder(key) {
    const m = String(key || "").match(/^(.+?)(?::(dd\.mm\.yyyy|dd\.mm\.yy|dd mmmm yyyy|<<dd>> mmmm yyyy|dd mmmm yyyy р\.))?$/i);
    if (!m) return null;
    return { base: m[1].toLowerCase(), format: (m[2] || "").toLowerCase() };
  }

  function applyDateFormat(baseKey, format, docDate) {
    const d = parseDocDate(docDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const lastDay = new Date(y, m + 1, 0).getDate();
    let dt = d;
    const bk = baseKey.toLowerCase();
    if (bk === "1число" || bk === "першечисло") dt = new Date(y, m, 1);
    else if (bk === "останнійдень") dt = new Date(y, m, lastDay);
    else if (bk === "наступниймісяць" || bk === "1числонаступного") dt = new Date(y, m + 1, 1);
    else if (bk === "попередніймісяць") dt = new Date(y, m - 1, 1);
    if (!format) return buildDatePlaceholders(docDate)[bk] || "";
    const yy = dt.getFullYear();
    const mm = dt.getMonth();
    const dd = dt.getDate();
    if (format === "dd.mm.yyyy") return `${pad2(dd)}.${pad2(mm + 1)}.${yy}`;
    if (format === "dd.mm.yy") return `${pad2(dd)}.${pad2(mm + 1)}.${pad2(yy % 100)}`;
    if (format === "dd mmmm yyyy" || format === "dd mmmm yyyy р.") return `${pad2(dd)} ${MONTHS_UA_GEN[mm]} ${yy} р.`;
    if (format === "<<dd>> mmmm yyyy") return `«${pad2(dd)}» ${MONTHS_UA_GEN[mm]} ${yy} р.`;
    return `${pad2(dd)}.${pad2(mm + 1)}.${yy}`;
  }

  function detectGenderFromFio(fio) {
    const parts = String(fio || "").trim().split(/\s+/);
    if (parts.length >= 3 && parts[2].length > 2) {
      const last = parts[2].slice(-1).toUpperCase();
      if (last === "А") return 2;
      if (last === "Ч") return 1;
    }
    return 3;
  }

  function parseFioParts(fio) {
    const text = String(fio || "").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 3) return { ok: false, fio: text, last: parts[0] || "", first: parts[1] || "", middle: parts[2] || "" };
    const shortFirst = parts[1].length <= 1;
    const shortMiddle = parts[2].length <= 1;
    if (shortFirst || shortMiddle) return { ok: false, fio: text, last: parts[0], first: parts[1], middle: parts[2] };
    return {
      ok: true,
      fio: text,
      last: parts[0],
      first: parts[1],
      middle: parts[2],
      initials: `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`,
      namePatronymic: `${parts[1]} ${parts[2]}`
    };
  }

  function buildObr(fio, kv, pers) {
    const text = String(fio || "");
    if (/фіо/i.test(text)) return `Шановні мешканці квартири ${kv || ""}, `;
    const pol = detectGenderFromFio(text);
    const honorific = pol === 2 ? "а " : (pol === 1 ? "ий " : "ий(а) ");
    let out = `Шановн${honorific}${text}`;
    if (Number(pers) > 1) out += ` та інші мешканці ${kv || ""}-ї квартири`;
    return out + ", ";
  }

  function buildObrKr(fio) {
    const p = parseFioParts(fio);
    if (!p.ok) return `Шановний(а) ${p.fio}`;
    return `Шановний(а) ${p.initials}`;
  }

  function buildLsPlaceholders(lsItem, accountId, homeMeta, periodStart, periodEnd) {
    const item = lsItem || {};
    const fio = String(item.fio || item.owner || "").trim();
    const fp = parseFioParts(fio);
    const map = Object.assign({}, typeof getReplacementMap === "function" ? getReplacementMap(homeMeta || {}) : {});
    Object.keys(item).forEach(k => {
      map[k.toLowerCase()] = item[k] == null ? "" : String(item[k]);
    });
    map.fio = fio;
    map.kv = String(item.kv || "");
    map.kvarta = map.kv;
    map.obr = buildObr(fio, item.kv, item.pers);
    map.obrkr = buildObrKr(fio);
    if (fp.ok) {
      map.familia = fp.last;
      map.imia = fp.first;
      map.poбатькові = fp.middle;
      map.imiapatronymic = fp.namePatronymic;
      map.initials = fp.initials;
    } else {
      map.familia = map.imia = map.poбатькові = map.imiapatronymic = map.initials = fio;
    }
    if (accountId && periodStart && periodEnd && typeof collectAccountsPeriodData === "function") {
      const rows = collectAccountsPeriodData(periodStart, periodEnd, {
        ls: { [accountId]: item },
        nach: (homeMeta && homeMeta.nach) || window.nach,
        oplat: (homeMeta && homeMeta.oplat) || window.oplat
      });
      const row = rows.find(r => String(r.accountId) === String(accountId)) || rows[0];
      if (row) {
        map.borgstart = map.borgStart = String(row.debitStart);
        map.borgend = map.borgEnd = String(row.debitEnd);
        map.nachislenno = map.nachisleno = map.нараховано = String(row.chargesSum);
        map.oplacheno = map.оплачено = String(row.paymentsSum);
        if (typeof moneyPropis === "function") {
          map.borgstartpropis = moneyPropis(row.debitStart);
          map.borgendpropis = moneyPropis(row.debitEnd);
        }
      }
    }
    return map;
  }

  function replacePlaceholders(text, replacements, docDate) {
    let out = String(text || "");
    const dateMap = buildDatePlaceholders(docDate);
    const all = Object.assign({}, dateMap, replacements || {});
    Object.keys(all).forEach(key => {
      const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`, "gi");
      out = out.replace(re, all[key] == null ? "" : String(all[key]));
    });
    out = out.replace(/\{([^{}|]+)(?::([^}]+))?\}/g, function (_m, key, fmt) {
      const parsed = expandFormattedPlaceholder(key + (fmt ? ":" + fmt : ""));
      if (!parsed) return _m;
      const val = applyDateFormat(parsed.base, parsed.format, docDate);
      return val || _m;
    });
    return out.replace(/\{m:([^{}|]*)\|f:([^{}|]*)\}/gi, function (_m, male, female) {
      const pol = detectGenderFromFio(replacements && (replacements.fio || replacements.головаfull));
      return pol === 2 ? female : male;
    });
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
      runs.push({ text: buffer, size, sup: !!sup, bold: mark.bold, underline: mark.underline, italic: mark.italic });
      buffer = "";
    }

    while (i < text.length) {
      const rest = text.slice(i);
      const longStars = rest.match(/^\*{3,}/);
      if (longStars) { buffer += longStars[0]; i += longStars[0].length; continue; }
      const longUnderscores = rest.match(/^_{3,}/);
      if (longUnderscores) { buffer += longUnderscores[0]; i += longUnderscores[0].length; continue; }
      const font = rest.match(/^\{f(\d+)\}/i);
      if (font) { push(bufferSup); size = Number(font[1]) || null; bufferSup = false; i += font[0].length; continue; }
      if (/^\{f\}/i.test(rest)) { push(bufferSup); size = null; bufferSup = false; i += 3; continue; }
      const sup = rest.match(/^\{\^(\d+)\}/);
      if (sup) {
        push(bufferSup);
        const count = Number(sup[1]) || 1;
        i += sup[0].length;
        const value = text.slice(i, i + count);
        if (value) runs.push({ text: value, size, sup: true });
        i += value.length;
        bufferSup = false;
        continue;
      }
      if (rest.startsWith("**")) { push(bufferSup); mark.bold = !mark.bold; i += 2; continue; }
      if (rest.startsWith("*")) { push(bufferSup); mark.bold = !mark.bold; i += 1; continue; }
      if (rest.startsWith("__")) { push(bufferSup); mark.underline = !mark.underline; i += 2; continue; }
      if (rest.startsWith("_")) { push(bufferSup); mark.underline = !mark.underline; i += 1; continue; }
      if (rest.startsWith("//")) { push(bufferSup); mark.italic = !mark.italic; i += 2; continue; }
      if (rest.startsWith("/") && (i === 0 || /\s/.test(text[i - 1])) && /[^\s/]/.test(rest[1] || "")) {
        push(bufferSup); mark.italic = !mark.italic; i += 1; continue;
      }
      buffer += text[i];
      i += 1;
    }
    push(bufferSup);
    return runs.length ? runs : [{ text: "", size, sup: false }];
  }

  function parseRichText(text, replacements, docDate) {
    const replaced = replacePlaceholders(text, replacements, docDate).replace(/\{PrivatQR\}/gi, "");
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
      if (fontOnly) { defaultSize = Number(fontOnly[1]) || null; return; }
      if (/^\{f\}$/i.test(line.trim())) { defaultSize = null; return; }
      if (!line.trim() && localAlign) { pendingAlign = localAlign; return; }
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

  function renderRichHtml(blocks, paragraphClass, defaultAlign) {
    return (blocks || []).map(function (block) {
      const alignClass = `gr-rich-align-${block.align || defaultAlign || "left"}`;
      const content = renderRuns(block.runs);
      const emptyClass = content ? "" : " gr-rich-empty";
      return `<p class="${paragraphClass || "gr-rich-p"} ${alignClass}${emptyClass}">${content || "&nbsp;"}</p>`;
    }).join("");
  }

  function renderRichPlain(blocks) {
    return (blocks || []).map(b => (b.runs || []).map(r => r.text).join("")).join("\n");
  }

  function wrapSheet(bodyHtml, options) {
    const opts = options || {};
    const cls = ["gr-sheet", opts.className || "", opts.landscape ? "gr-sheet-landscape" : "", opts.compact ? "gr-sheet-compact" : ""].filter(Boolean).join(" ");
    const attrs = opts.attrs
      ? Object.entries(opts.attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join("")
      : "";
    const footer = opts.footerHtml || "";
    const top = opts.topHtml || "";
    return `
      <div class="gr-sheet-wrap">
        <section class="${cls}"${attrs}>
          <div class="gr-sheet-inner">
            ${top ? `<div class="gr-sheet-top">${top}</div>` : ""}
            <div class="gr-sheet-body">${bodyHtml || ""}</div>
            ${footer}
          </div>
        </section>
        ${opts.pageActionsHtml || ""}
      </div>`;
  }

  function renderPageActionsHtml(pageIndex) {
    return `
      <div class="gr-page-actions no-print">
        <button type="button" class="gr-page-action" data-gr-copy-page="${pageIndex}" title="Копіювати сторінку як картинку">
          <img src="img/screenshot.png" alt="">
        </button>
        <button type="button" class="gr-page-action" data-gr-share-page="${pageIndex}" title="Поділитися сторінкою">
          <img src="img/share.png" alt="">
        </button>
      </div>`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  }

  async function imageSrcToDataUrl(src) {
    const url = new URL(src, document.baseURI).href;
    if (url.startsWith("data:")) return url;
    if (imageDataUrlCache.has(url)) return imageDataUrlCache.get(url);
    const promise = fetch(url, { cache: "force-cache" }).then(r => {
      if (!r.ok) throw new Error("Image load failed");
      return r.blob();
    }).then(blobToDataUrl);
    imageDataUrlCache.set(url, promise);
    return promise;
  }

  async function prepareImagesForCanvas(root, dropImages) {
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(imgs.map(async img => {
      if (dropImages) { img.setAttribute("data-html2canvas-ignore", "true"); return; }
      const src = img.currentSrc || img.getAttribute("src");
      if (!src) return;
      try {
        img.src = await imageSrcToDataUrl(src);
        img.removeAttribute("srcset");
        img.crossOrigin = "anonymous";
      } catch (err) {
        img.setAttribute("data-html2canvas-ignore", "true");
      }
    }));
  }

  async function captureSheetCanvas(sheetEl, options) {
    const host = document.createElement("div");
    host.className = "gr-pdf-capture-host";
    host.setAttribute("aria-hidden", "true");
    const clone = sheetEl.cloneNode(true);
    await prepareImagesForCanvas(clone, !!(options && options.dropImages));
    host.appendChild(clone);
    document.body.appendChild(host);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await html2canvas(clone, {
        scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff", imageTimeout: 15000, logging: false
      });
    } finally {
      host.remove();
    }
  }

  async function captureSheetDataUrl(sheetEl, type, quality) {
    let canvas = await captureSheetCanvas(sheetEl);
    try {
      return canvas.toDataURL(type, quality);
    } catch (err) {
      if (!(err && err.name === "SecurityError")) throw err;
      canvas = await captureSheetCanvas(sheetEl, { dropImages: true });
      return canvas.toDataURL(type, quality);
    }
  }

  function getSheetsFromContainer(container) {
    return [...(container || document).querySelectorAll(".gr-sheet")];
  }

  function renumberSheetActions(container) {
    const sheets = getSheetsFromContainer(container);
    sheets.forEach((sheet, i) => {
      const wrap = sheet.closest(".gr-sheet-wrap");
      if (!wrap) return;
      const copy = wrap.querySelector("[data-gr-copy-page]");
      const share = wrap.querySelector("[data-gr-share-page]");
      if (copy) copy.setAttribute("data-gr-copy-page", String(i));
      if (share) share.setAttribute("data-gr-share-page", String(i));
    });
    return sheets;
  }

  async function copyPageImage(sheetEl, fileName) {
    if (typeof html2canvas !== "function") {
      if (typeof showMessage === "function") showMessage("html2canvas не завантажено", "err");
      return;
    }
    const canvas = await captureSheetCanvas(sheetEl);
    if (!navigator.clipboard || !window.ClipboardItem || !canvas.toBlob) {
      const a = document.createElement("a");
      a.download = fileName || "page.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      return;
    }
    canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => { if (typeof showMessage === "function") showMessage("Сторінку скопійовано", "ok", 2500); })
        .catch(() => { if (typeof showMessage === "function") showMessage("Не вдалося скопіювати", "warn"); });
    }, "image/png");
  }

  async function sharePageImage(sheetEl, fileName) {
    const canvas = await captureSheetCanvas(sheetEl);
    canvas.toBlob(async blob => {
      const file = new File([blob], fileName || "page.png", { type: "image/png" });
      if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
        await copyPageImage(sheetEl, fileName);
        return;
      }
      try { await navigator.share({ title: "Документ", files: [file] }); } catch (e) { /* cancelled */ }
    }, "image/png");
  }

  async function downloadPdfFromSheets(sheets, fileName, onProgress) {
    if (!sheets.length) return;
    if (typeof html2canvas !== "function" || !window.jspdf?.jsPDF) {
      if (typeof showMessage === "function") showMessage("Бібліотеки PDF не завантажені", "err");
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    for (let i = 0; i < sheets.length; i++) {
      if (onProgress) onProgress(i, sheets.length);
      const landscape = sheets[i].classList.contains("gr-sheet-landscape");
      if (i > 0) pdf.addPage("a4", landscape ? "l" : "p");
      const img = await captureSheetDataUrl(sheets[i], "image/jpeg", 0.95);
      if (landscape) pdf.addImage(img, "JPEG", 0, 0, 297, 210);
      else pdf.addImage(img, "JPEG", 0, 0, 210, 297);
    }
    pdf.save(fileName || "document.pdf");
  }

  function printSheets(containerSelector) {
    document.body.classList.add("gr-printing");
    const pageStyle = document.createElement("style");
    pageStyle.id = "gr-print-page-style";
    pageStyle.textContent = "@page { margin: 0; }";
    document.body.setAttribute("data-gr-print-container", containerSelector || "");
    document.head.appendChild(pageStyle);
    window.print();
    setTimeout(() => {
      document.body.classList.remove("gr-printing");
      document.body.removeAttribute("data-gr-print-container");
      pageStyle.remove();
    }, 500);
  }

  function bindPageActions(container, getSheets) {
    if (!container || container.dataset.grPageActionsBound === "1") return;
    container.dataset.grPageActionsBound = "1";
    container.addEventListener("click", e => {
      const copy = e.target.closest("[data-gr-copy-page]");
      const share = e.target.closest("[data-gr-share-page]");
      if (!copy && !share) return;
      const index = Number((copy || share).getAttribute(copy ? "data-gr-copy-page" : "data-gr-share-page"));
      const sheets = typeof getSheets === "function" ? getSheets() : renumberSheetActions(container);
      const sheet = sheets[index];
      if (!sheet) return;
      if (copy) copyPageImage(sheet, `page-${index + 1}.png`);
      else sharePageImage(sheet, `page-${index + 1}.png`);
    });
  }

  function defaultPlaceholderCatalog(homeMeta, lsItem) {
    const home = homeMeta || {};
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home) : {};
    const items = [
      { label: map.org || home.org || "Організація", token: "{org}" },
      { label: map.adr || home.adr || "Адреса", token: "{adr}" },
      { label: map.adrfull || home.adrfull || "Повна адреса", token: "{adrfull}" },
      { label: map.okpo || home.okpo || "ЄДРПОУ", token: "{okpo}" },
      { label: map.головаfull || home.головаfull || "Голова (ПІБ)", token: "{ГоловаFull}" },
      { label: map.голова || "Голова (скорочено)", token: "{голова}" },
      { label: "Дата документа", token: "{дата}" },
      { label: "1 число місяця", token: "{1число}" },
      { label: "Останній день місяця", token: "{останнійдень:dd.mm.yyyy}" },
      { label: "1 число наступного місяця", token: "{наступниймісяць:dd.mm.yyyy}" },
      { label: "Дата прописом", token: "{дата:dd mmmm yyyy р.}" },
      { label: "Дата з «»", token: "{дата:<<dd>> mmmm yyyy}" }
    ];
    if (lsItem) {
      const fp = parseFioParts(lsItem.fio);
      items.push(
        { label: lsItem.fio || "П.І.Б.", token: "{fio}" },
        { label: buildObr(lsItem.fio, lsItem.kv, lsItem.pers), token: "{obr}" },
        { label: buildObrKr(lsItem.fio), token: "{obrKr}" },
        { label: "Борг на початок", token: "{borgStart}" },
        { label: "Борг на кінець", token: "{borgEnd}" },
        { label: "Нараховано", token: "{nachisleno}" },
        { label: "Сплачено", token: "{oplacheno}" }
      );
      if (fp.ok) {
        items.push(
          { label: fp.last, token: "{familia}" },
          { label: fp.namePatronymic, token: "{imiapatronymic}" },
          { label: fp.initials, token: "{initials}" }
        );
      }
    }
    return items;
  }

  function initPlaceholderPicker(root, getCatalog) {
    if (!root) return;
    root.querySelectorAll("[data-gr-ph-picker]").forEach(btn => {
      if (btn.dataset.grPhBound === "1") return;
      btn.dataset.grPhBound = "1";
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        const field = btn.closest(".gr-ph-field");
        const input = field && (field.querySelector("textarea, input[type=text]"));
        if (!input) return;
        let panel = field.querySelector(".gr-ph-panel");
        if (!panel) {
          panel = document.createElement("div");
          panel.className = "gr-ph-panel";
          panel.innerHTML = `<input type="search" class="gr-ph-filter" placeholder="Пошук…"><div class="gr-ph-list"></div>`;
          field.appendChild(panel);
          panel.querySelector(".gr-ph-filter").addEventListener("input", () => fillPanel());
          panel.addEventListener("click", ev => {
            const opt = ev.target.closest("[data-gr-ph-token]");
            if (!opt) return;
            insertAtCursor(input, opt.getAttribute("data-gr-ph-token"));
            panel.hidden = true;
          });
        }
        function fillPanel() {
          const q = (panel.querySelector(".gr-ph-filter").value || "").trim().toLowerCase();
          const catalog = typeof getCatalog === "function" ? getCatalog() : [];
          const list = panel.querySelector(".gr-ph-list");
          list.innerHTML = catalog.filter(it => !q || it.label.toLowerCase().includes(q) || it.token.toLowerCase().includes(q))
            .map(it => `<button type="button" data-gr-ph-token="${escapeHtml(it.token)}"><span>${escapeHtml(it.label)}</span><code>${escapeHtml(it.token)}</code></button>`)
            .join("") || `<div class="gr-ph-empty">Нічого не знайдено</div>`;
        }
        const open = panel.hidden !== false;
        document.querySelectorAll(".gr-ph-panel").forEach(p => { p.hidden = true; });
        if (open) { panel.hidden = false; fillPanel(); panel.querySelector(".gr-ph-filter").focus(); }
      });
    });
    document.addEventListener("click", e => {
      if (e.target.closest(".gr-ph-field")) return;
      document.querySelectorAll(".gr-ph-panel").forEach(p => { p.hidden = true; });
    });
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function initPlaceholderHint(root) {
    if (!root) return;
    root.querySelectorAll(".gr-ph-field textarea").forEach(ta => {
      if (ta.dataset.grHintBound === "1") return;
      ta.dataset.grHintBound = "1";
      const hint = document.createElement("div");
      hint.className = "gr-ph-hint";
      hint.innerHTML = `<strong>Placeholders:</strong> {org}, {adr}, {ГоловаFull}, {дата}, {1число}<br>
        <strong>Вирівнювання:</strong> {==} по центру, {=>} праворуч, {<=} ліворуч, {<==>} по ширині<br>
        <strong>Формат:</strong> *жирний*, _підкреслений_, //курсив//, {f14}розмір{f}, {m:ий|f:а}`;
      const wrap = ta.closest(".gr-ph-field") || ta.parentElement;
      if (wrap) {
        wrap.classList.add("gr-ph-field");
        wrap.appendChild(hint);
        const sync = () => { hint.classList.toggle("is-hidden", !!ta.value.trim()); };
        ta.addEventListener("input", sync);
        ta.addEventListener("focus", sync);
        sync();
      }
    });
  }

  function ensureDocumentsSidebar(homeCode) {
    if (typeof reportsInit === "function") reportsInit(homeCode);
    document.body.classList.add("files-mode");
  }

  window.GrCommon = {
    escapeHtml,
    buildDatePlaceholders,
    replacePlaceholders,
    parseRichText,
    renderRichHtml,
    renderRichPlain,
    renderRuns,
    wrapSheet,
    renderPageActionsHtml,
    captureSheetCanvas,
    captureSheetDataUrl,
    copyPageImage,
    sharePageImage,
    downloadPdfFromSheets,
    printSheets,
    bindPageActions,
    renumberSheetActions,
    getSheetsFromContainer,
    buildLsPlaceholders,
    buildObr,
    buildObrKr,
    parseFioParts,
    detectGenderFromFio,
    defaultPlaceholderCatalog,
    initPlaceholderPicker,
    initPlaceholderHint,
    insertAtCursor,
    ensureDocumentsSidebar
  };
})();
