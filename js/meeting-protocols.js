// meeting-protocols.js
(function () {
  "use strict";

  const TABLE = "meeting_protocols";
  const EDIT_ROLES = new Set(["Правление", "Администратор"]);
  const MEETING_TYPES = [
    { id: "board", label: "Засідання правління" },
    { id: "general", label: "Загальні збори" },
    { id: "representatives", label: "Збори представників" }
  ];
  const VOTE_BASIS = [
    { id: "apartment", label: "1 квартира = 1 голос" },
    { id: "area", label: "Пропорційно площі" }
  ];
  const MEETING_FORMATS = [
    { id: "none", label: "не указано" },
    { id: "in_person", label: "Очно" },
    { id: "written_poll", label: "Письмове опитування" },
    { id: "mixed", label: "Змішано" }
  ];
  const MEETING_INITIATORS = [
    { id: "none", label: "не указано" },
    { id: "board", label: "Правління" },
    { id: "initiative_group", label: "Ініціативна група" },
    { id: "chair", label: "Голова правління" }
  ];
  const MEETING_KINDS = [
    { id: "none", label: "не указано" },
    { id: "regular", label: "чергові (планові), відповідно до Статуту" },
    { id: "extraordinary", label: "Позачергові" }
  ];
  const MONTHS_UA_LOC = [
    "січні", "лютому", "березні", "квітні", "травні", "червні",
    "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
  ];

  const state = {
    homeCode: "",
    items: [],
    questionTemplates: [],
    selectedHomeCodes: [],
    filter: "",
    current: null
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

  function money(v) {
    const n = Number(v) || 0;
    return n.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseAmount(value) {
    return Number(String(value || "").replace(/\s+/g, "").replace(",", ".")) || 0;
  }

  function parseKv(value) {
    const m = String(value || "").match(/^(\d+)/);
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
  }

  function getHomeByCode(code) {
    return (homes || []).find(h => String(h.code) === String(code)) || null;
  }

  function canEditHome(code) {
    const role = roles && roles[String(code)];
    return EDIT_ROLES.has(role);
  }

  function show(text, type, duration) {
    if (typeof showMessage === "function") showMessage(text, type || "inf", duration || 4000);
  }

  function typeLabel(id) {
    return (MEETING_TYPES.find(t => t.id === id) || MEETING_TYPES[0]).label;
  }

  function voteBasisLabel(id) {
    return (VOTE_BASIS.find(t => t.id === id) || VOTE_BASIS[0]).label;
  }

  function meetingFormatLabel(id) {
    if (id === "none") return "";
    return (MEETING_FORMATS.find(t => t.id === id) || MEETING_FORMATS[0]).label;
  }

  function meetingInitiatorLabel(id) {
    if (id === "none") return "";
    return (MEETING_INITIATORS.find(t => t.id === id) || MEETING_INITIATORS[0]).label;
  }

  function defaultMeetingKind(initiator) {
    return initiator === "initiative_group" ? "extraordinary" : "regular";
  }

  function meetingKindLabel(id) {
    if (id === "none") return "";
    return (MEETING_KINDS.find(t => t.id === id) || MEETING_KINDS[0]).label;
  }

  function meetingKindValue(item) {
    if (!item) return "regular";
    const stored = item.meeting_kind || (item.placeholder_values && item.placeholder_values.__meeting_kind);
    return stored || defaultMeetingKind(item.meeting_initiator || "board");
  }

  function getHomeMeta(code) {
    return Object.assign(
      {},
      String(code || "") === String(activeHomeCode || "") ? { org, adr } : {},
      getHomeByCode(code) || {},
      (window.homeData && window.homeData[String(code || "")]) || {}
    );
  }

  function valueByKey(source, keys) {
    const obj = source || {};
    for (const key of keys) {
      if (obj[key] != null && String(obj[key]).trim()) return String(obj[key]).trim();
    }
    const lower = {};
    Object.keys(obj).forEach(key => { lower[key.toLowerCase()] = obj[key]; });
    for (const key of keys) {
      const value = lower[String(key).toLowerCase()];
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return "";
  }

  function chairFullName(homeCode) {
    const home = getHomeMeta(homeCode);
    const direct = valueByKey(home, ["головаfull", "ГоловаFull", "chairfull", "chair_full", "Председатель"]);
    if (direct) return direct;
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home) : {};
    return valueByKey(map, ["головаfull", "голова"]);
  }

  function defaultChair(homeCode) {
    return chairFullName(homeCode);
  }

  function defaultLocation(homeCode) {
    const home = getHomeMeta(homeCode);
    return valueByKey(home, ["adr", "address", "adrfull", "adrlong"]);
  }

  function detectGender(fullName) {
    const text = String(fullName || "").trim();
    if (/\S+вна\b/i.test(text)) return "female";
    if (/\S+вич\b/i.test(text)) return "male";
    return "male";
  }

  function chairPhrase(homeCode, explicitChair) {
    const name = String(explicitChair || defaultChair(homeCode) || "").trim();
    const gender = detectGender(name);
    return {
      name,
      gender
    };
  }

  function applyGenderVariants(text, gender) {
    return String(text || "").replace(/\{m:([^{}|]*)\|f:([^{}|]*)\}/gi, function (_match, male, female) {
      return gender === "female" ? female : male;
    });
  }

  function templateAvailable(template, meetingType) {
    return !template.types || template.types.includes(meetingType || "general");
  }

  function availableTemplates(meetingType) {
    return state.questionTemplates
      .map((template, index) => ({ template, index }))
      .filter(item => templateAvailable(item.template, meetingType))
      .sort((a, b) => (Number(a.template.sort_order) || 1000) - (Number(b.template.sort_order) || 1000) || a.index - b.index)
      .map(item => item.template);
  }

  function questionTemplateLabel(templateId) {
    const template = state.questionTemplates.find(t => t.id === templateId);
    return template && template.id !== "custom" ? template.label : "Типове питання";
  }

  function inferQuestionTemplateId(question, meetingType) {
    if (question && question.template_id) return question.template_id;
    const subject = String(question && question.subject || "").trim();
    if (!subject) return "";
    const found = availableTemplates(meetingType)
      .filter(t => t.id !== "custom")
      .find(t => String(t.subject || "").trim() === subject || String(buildQuestionFromTemplate(t.id, meetingType).subject || "").trim() === subject);
    return found ? found.id : "";
  }

  function buildQuestionFromTemplate(templateId, meetingType) {
    const template = state.questionTemplates.find(t => t.id === templateId && templateAvailable(t, meetingType));
    if (!template || template.id === "custom") {
      return { template_id: "", repair_amount: "", program_name: "", subject: "", speaker: "", discussion: "", decision: "" };
    }
    return {
      template_id: template.id,
      repair_amount: "",
      program_name: "",
      subject: template.subject || "",
      speaker: template.speaker || "",
      discussion: template.discussion || "",
      decision: template.decision || ""
    };
  }

  function questionTemplateExtraField(templateId, fieldName) {
    const template = state.questionTemplates.find(t => t.id === templateId);
    return !!(template && template.extra_fields && template.extra_fields[fieldName]);
  }

  function renderProtocolText(text, item, question) {
    const chair = chairPhrase(item.home_code, item.chair);
    const secretaryName = String(
      item.secretary ||
      (Array.isArray(item.participants) && item.participants[1] && item.participants[1].fio) ||
      ""
    ).trim();
    const currentSnapshot = placeholderSnapshot(Object.assign({}, item, { placeholder_values: {} }));
    const repairAmount = parseAmount(question && question.repair_amount);
    const programName = String(question && question.program_name || "").trim();
    const totalArea = totalAreaForHome(item.home_code);
    const targetContribution = totalArea > 0 ? repairAmount / totalArea : 0;
    return applyGenderVariants(String(text || ""), chair.gender)
      .replace(/\{головаFull\}/gi, snapshotValue(item, "головаFull", currentSnapshot.головаFull || ""))
      .replace(/\{ГоловаFull\}/g, snapshotValue(item, "головаFull", currentSnapshot.головаFull || ""))
      .replace(/\{голова\}/gi, snapshotValue(item, "голова", currentSnapshot.голова || ""))
      .replace(/\{секретар\}/gi, snapshotValue(item, "секретар", secretaryName || "______________________________"))
      .replace(/\{org\}/gi, snapshotValue(item, "org", currentSnapshot.org || ""))
      .replace(/\{назваПрограми\}/gi, programName || "______________________________")
      .replace(/\{месяц\}/gi, snapshotValue(item, "месяц", currentSnapshot.месяц || ""))
      .replace(/\{СледМесяц\}/gi, snapshotValue(item, "СледМесяц", currentSnapshot.СледМесяц || ""))
      .replace(/\{НаступнийМісяць\}/gi, snapshotValue(item, "НаступнийМісяць", currentSnapshot.НаступнийМісяць || ""))
      .replace(/\{сумаРемонту\}/gi, repairAmount ? money(repairAmount) : "________")
      .replace(/\{цільовийВнесок\}/gi, targetContribution ? money(targetContribution) : "________");
  }

  function renderQuestionTemplateItems(meetingType, filter) {
    const q = String(filter || "").trim().toLowerCase();
    const items = availableTemplates(meetingType)
      .filter(template => template.id !== "custom")
      .filter(template => !q || String(template.label || "").toLowerCase().includes(q) || String(template.subject || "").toLowerCase().includes(q))
      .map(template => `<button type="button" data-mp-question-template-option="${escapeHtml(template.id)}">${escapeHtml(template.label)}</button>`)
      .join("");
    return items || `<div class="mp-template-empty">Нічого не знайдено</div>`;
  }

  async function ensureHomeData(code) {
    const key = String(code || "");
    window.homeData = window.homeData || {};
    if (window.homeData[key]) return window.homeData[key];
    if (typeof fetchHomeData === "function") return fetchHomeData(key);
    return {};
  }

  function selectedHomes() {
    const list = homes || [];
    if (list.length === 1) return list;
    if (!state.selectedHomeCodes.length) return [];
    const selected = new Set(state.selectedHomeCodes.map(String));
    return list.filter(h => selected.has(String(h.code)));
  }

  function editableHomes() {
    return (homes || []).filter(h => canEditHome(h.code));
  }

  function defaultEditableHome() {
    const current = getHomeByCode(state.homeCode);
    if (current && canEditHome(current.code)) return String(current.code);
    const first = editableHomes()[0];
    return first ? String(first.code) : String(state.homeCode || "");
  }

  function maxNumberForHome(homeCode, excludeId) {
    return state.items
      .filter(item => String(item.home_code) === String(homeCode) && String(item.id || "") !== String(excludeId || ""))
      .map(item => Number(String(item.protocol_number || "").replace(/[^\d]/g, "")))
      .filter(Number.isFinite)
      .reduce((max, n) => Math.max(max, n), 0);
  }

  function latestProtocol(homeCode, meetingType, excludeId) {
    return state.items
      .filter(item =>
        String(item.home_code) === String(homeCode || "") &&
        String(item.meeting_type || "") === String(meetingType || "") &&
        String(item.id || "") !== String(excludeId || "")
      )
      .sort((a, b) => {
        const da = new Date(a.protocol_date || 0).getTime() || 0;
        const db = new Date(b.protocol_date || 0).getTime() || 0;
        if (db !== da) return db - da;
        return Number(b.protocol_number || 0) - Number(a.protocol_number || 0);
      })[0] || null;
  }

  function normalizeAgenda(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  }

  function escapeHtmlWithBreaks(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
  }

  function renderProtocolRichInline(text, item, question) {
    const replaced = renderProtocolText(text || "", item, question);
    if (window.GrCommon && GrCommon.parseRichText && GrCommon.renderRuns) {
      const blocks = GrCommon.parseRichText(replaced, {}, item && item.protocol_date);
      return blocks.map(block => GrCommon.renderRuns(block.runs)).join("<br>");
    }
    return escapeHtmlWithBreaks(replaced);
  }

  function renderProtocolRichBlock(text, item, question, paragraphClass, defaultAlign) {
    const replaced = renderProtocolText(text || "", item, question);
    if (window.GrCommon && GrCommon.parseRichText && GrCommon.renderRichHtml) {
      return GrCommon.renderRichHtml(
        GrCommon.parseRichText(replaced, {}, item && item.protocol_date),
        paragraphClass || "mp-rich-p",
        defaultAlign || "justify"
      );
    }
    return `<p class="${paragraphClass || "mp-rich-p"}">${escapeHtmlWithBreaks(replaced)}</p>`;
  }

  function visibleProtocolTitle(item, agenda) {
    const raw = String(item && item.title || "").trim();
    if (raw.startsWith("-")) return "";
    return raw;
  }

  function agendaTitleForInterface(item, agenda) {
    return normalizeAgenda(agenda || item && item.agenda)
      .filter(q => q && q.subject && q.template_id !== "meetingChairSecretary")
      .map(q => renderProtocolText(q.subject || "", item, q))
      .filter(Boolean)
      .join("; ");
  }

  function interfaceProtocolTitle(item) {
    const raw = String(item && item.title || "").trim();
    if (raw.startsWith("-")) return raw.slice(1).trim();
    return raw || agendaTitleForInterface(item);
  }

  function normalizeParticipants(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  }

  function accountNote(item) {
    return String(item?.note || item?.notes || item?.prim || item?.comment || item?.coment || "");
  }

  function accountFio(item) {
    return String(item?.fio || item?.owner || item?.name || "").trim();
  }

  function sourceLsForHome(homeCode) {
    const meta = getHomeMeta(homeCode);
    return meta.ls || (String(homeCode || "") === String(activeHomeCode || "") ? window.ls : null) || {};
  }

  function totalAreaForHome(homeCode) {
    const source = sourceLsForHome(homeCode);
    return Object.values(source).reduce((sum, item) => {
      const area = Number(String(item?.pl || item?.area || "0").replace(",", ".")) || 0;
      return sum + area;
    }, 0);
  }

  function protocolMonthText(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return "";
    return `${MONTHS_UA_LOC[d.getMonth()]} ${d.getFullYear()} р.`;
  }

  function effectiveDateText(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return "01 __________ 20__ р.";
    const target = new Date(d.getFullYear(), d.getMonth() + (d.getDate() === 1 ? 0 : 1), 1);
    return `01 ${MONTHS_UA_LOC[target.getMonth()]} ${target.getFullYear()} р.`;
  }

  function placeholderSnapshot(item) {
    const home = getHomeMeta(item.home_code);
    const chair = chairPhrase(item.home_code, item.chair);
    const secretaryName = String(
      item.secretary ||
      (Array.isArray(item.participants) && item.participants[1] && item.participants[1].fio) ||
      ""
    ).trim();
    return {
      org: valueByKey(home, ["org", "name", "orgname"]) || "",
      головаFull: chair.name || "",
      голова: chair.name || "",
      секретар: secretaryName || "",
      месяц: protocolMonthText(item.protocol_date),
      СледМесяц: effectiveDateText(item.protocol_date),
      НаступнийМісяць: effectiveDateText(item.protocol_date),
      ФормаПроведення: meetingFormatLabel(item.meeting_format || "in_person"),
      Ініціатор: meetingInitiatorLabel(item.meeting_initiator || "board"),
      ВидЗборів: meetingKindLabel(meetingKindValue(item))
    };
  }

  function snapshotValue(item, key, fallback) {
    const values = item && item.placeholder_values && typeof item.placeholder_values === "object"
      ? item.placeholder_values
      : {};
    const value = values[key];
    return value != null && String(value) !== "" ? String(value) : fallback;
  }

  function participantsFromNotes(homeCode, meetingType) {
    const source = sourceLsForHome(homeCode);
    const match = meetingType === "board"
      ? /правл/i
      : /(уповноваж|представ|уполномоч)/i;
    const rows = [];
    Object.entries(source).forEach(([id, item]) => {
      const note = accountNote(item);
      if (!match.test(note)) return;
      const fio = accountFio(item);
      if (!fio) return;
      rows.push({ account_id: id, kv: item.kv || "", fio });
    });
    return rows.sort((a, b) => parseKv(a.kv) - parseKv(b.kv) || String(a.fio).localeCompare(String(b.fio), "uk"));
  }

  function ensureChairFirst(rows, homeCode, meetingType) {
    if (meetingType !== "board" && meetingType !== "representatives") return rows;
    const chair = defaultChair(homeCode);
    if (!chair) return rows;
    const filtered = rows.filter(row => String(row.fio || "").trim() !== chair);
    return [Object.assign({}, filtered[0] || {}, { fio: chair })].concat(filtered);
  }

  function defaultParticipants(homeCode, meetingType, excludeId) {
    if (meetingType !== "board" && meetingType !== "representatives") return [];
    const previous = latestProtocol(homeCode, meetingType, excludeId);
    const previousRows = normalizeParticipants(previous && previous.participants);
    const rows = previousRows.length ? previousRows : participantsFromNotes(homeCode, meetingType);
    return ensureChairFirst(rows.map(row => Object.assign({}, row)), homeCode, meetingType);
  }

  function defaultNotes(homeCode, meetingType, excludeId) {
    const previous = latestProtocol(homeCode, meetingType, excludeId);
    return previous ? String(previous.notes || "") : "";
  }

  function defaultSecretary(homeCode, meetingType, participants, excludeId) {
    if (meetingType === "board" || meetingType === "representatives") {
      return String((participants && participants[1] && participants[1].fio) || "");
    }
    const previous = latestProtocol(homeCode, "general", excludeId);
    return previous ? String(previous.secretary || "") : "";
  }

  function defaultAgenda(homeCode, meetingType, participants) {
    if (meetingType !== "general") return [];
    const q = buildQuestionFromTemplate("meetingChairSecretary", meetingType);
    return [q];
  }

  function filteredItems() {
    const selected = new Set(selectedHomes().map(h => String(h.code)));
    const q = state.filter.trim().toLowerCase();
    return state.items.filter(item => {
      if (selected.size && !selected.has(String(item.home_code))) return false;
      if (!q) return true;
      const hay = [
        item.protocol_number,
        typeLabel(item.meeting_type),
        item.title,
        item.location,
        item.chair,
        item.secretary,
        JSON.stringify(item.agenda || [])
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function renderHomeCombo() {
    if (typeof renderMultiHomePicker !== "function") return "";
    return renderMultiHomePicker({
      id: "mp-home-picker",
      homes: homes || [],
      selectedCodes: state.selectedHomeCodes,
      allSelected: state.selectedHomeCodes.length === (homes || []).length,
      label: "Будинки",
      placeholder: "Оберіть будинок...",
      allLabel: "(Всі)",
      searchPlaceholder: "Пошук будинку..."
    });
  }

  function renderRowsHtml() {
    return filteredItems().map(item => {
      const home = getHomeByCode(item.home_code);
      const editable = canEditHome(item.home_code);
      return `<tr data-mp-row="${escapeHtml(item.id)}" ${editable ? `data-mp-edit-row="${escapeHtml(item.id)}"` : ""} class="${editable ? "mp-clickable-row" : ""}">
        <td>${escapeHtml(formatDate(item.protocol_date))}</td>
        <td>${escapeHtml(item.protocol_number || "")}</td>
        <td>${escapeHtml(home ? home.name : item.home_code)}</td>
        <td>${escapeHtml(typeLabel(item.meeting_type))}</td>
        <td>${escapeHtml(interfaceProtocolTitle(item))}</td>
        <td class="mp-row-actions">
          <div class="od-action-menu">
            <button type="button" class="od-action-toggle" data-mp-menu-toggle aria-label="Дії">⋮</button>
            <div class="od-action-dropdown">
              <button type="button" data-mp-show="${escapeHtml(item.id)}"><i data-lucide="eye"></i><span>Показати</span></button>
              <button type="button" data-mp-word="${escapeHtml(item.id)}"><span>Word</span></button>
              <button type="button" data-mp-copy="${escapeHtml(item.id)}" ${editable ? "" : "disabled"}><i data-lucide="copy"></i><span>Копія</span></button>
              <button type="button" data-mp-edit="${escapeHtml(item.id)}" ${editable ? "" : "disabled"}><i data-lucide="pencil"></i><span>Редагувати</span></button>
              <button type="button" data-mp-delete="${escapeHtml(item.id)}" ${editable ? "" : "disabled"}><i data-lucide="trash-2"></i><span>Видалити</span></button>
            </div>
          </div>
        </td>
      </tr>`;
    }).join("") || `<tr><td colspan="6" class="mp-empty">Протоколів не знайдено</td></tr>`;
  }

  function renderList() {
    return `
      <div class="gr-app mp-app">
        <div class="gr-toolbar mp-toolbar">
          <div class="gr-toolbar-grid mp-toolbar-grid">
            ${renderHomeCombo()}
            <div class="gr-field mp-filter-field">
              <label>Фільтр</label>
              <input type="search" data-mp-filter value="${escapeHtml(state.filter)}" placeholder="номер, тема, тип, голова, секретар">
            </div>
            <div class="gr-field mp-toolbar-actions">
              <label>&nbsp;</label>
              <button type="button" class="gr-btn gr-btn-primary" data-mp-new>Новий протокол</button>
            </div>
          </div>
        </div>
        <div class="od-list-wrap">
          <table class="od-table mp-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>№</th>
                <th>Будинок</th>
                <th>Тип</th>
                <th>Тема</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${renderRowsHtml()}</tbody>
          </table>
        </div>
      </div>`;
  }

  function renderHomeSelect(value) {
    const list = editableHomes();
    if (list.length <= 1) {
      const code = list[0] ? list[0].code : value;
      return `<input type="hidden" name="home_code" value="${escapeHtml(code || "")}">`;
    }
    return `<label>Будинок<select name="home_code" required>
      ${list.map(home => `<option value="${escapeHtml(home.code)}" ${String(home.code) === String(value) ? "selected" : ""}>${escapeHtml(home.name || home.code)}</option>`).join("")}
    </select></label>`;
  }

  function renderAgendaEditor(agenda, meetingType) {
    const rows = normalizeAgenda(agenda);
    const list = rows.length ? rows : [{ subject: "", speaker: "", discussion: "", decision: "" }];
    return list.map((q, index) => {
      const templateId = inferQuestionTemplateId(q, meetingType || "general");
      return `<div class="mp-question" data-mp-question>
      <div class="mp-question-head">
        <strong>Питання ${index + 1}</strong>
        <input type="hidden" name="template_id" value="${escapeHtml(templateId)}">
        <div class="mp-question-move">
          <button type="button" class="gr-btn" data-mp-question-up title="Вгору">▲</button>
          <button type="button" class="gr-btn" data-mp-question-down title="Вниз">▼</button>
        </div>
        <div class="mp-question-template" data-mp-template-combo>
          <button type="button" class="mp-template-toggle" data-mp-template-toggle>${escapeHtml(questionTemplateLabel(templateId))}</button>
          <div class="mp-template-dropdown">
            <input type="search" data-mp-question-template-filter placeholder="фільтр">
            <div class="mp-template-options" data-mp-template-options>${renderQuestionTemplateItems(meetingType || "general", "")}</div>
          </div>
        </div>
        <button type="button" class="gr-btn" data-mp-remove-question><i data-lucide="trash-2"></i><span>Видалити</span></button>
      </div>
      <label class="mp-repair-amount-field ${questionTemplateExtraField(q.template_id, "repair_amount") ? "" : "is-hidden"}">Загальна сума робіт, грн<input name="repair_amount" value="${escapeHtml(q.repair_amount || "")}"></label>
      <label class="mp-program-name-field ${questionTemplateExtraField(q.template_id, "program_name") ? "" : "is-hidden"}">Назва програми<input name="program_name" value="${escapeHtml(q.program_name || "")}"></label>
      <label class="gr-ph-field">Питання порядку денного<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><input name="subject" value="${escapeHtml(q.subject || "")}"><div class="mp-placeholder-preview" data-mp-placeholder-preview="subject"></div></label>
      <label class="gr-ph-field">Виступили<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><input name="speaker" value="${escapeHtml(q.speaker || "")}"><div class="mp-placeholder-preview" data-mp-placeholder-preview="speaker"></div></label>
      <label class="gr-ph-field">Обговорення<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="discussion" rows="4">${escapeHtml(q.discussion || "")}</textarea><div class="mp-placeholder-preview" data-mp-placeholder-preview="discussion"></div></label>
      <label class="gr-ph-field">Вирішили<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="decision" rows="4">${escapeHtml(q.decision || "")}</textarea><div class="mp-placeholder-preview" data-mp-placeholder-preview="decision"></div></label>
    </div>`;
    }).join("");
  }

  function renderParticipantRow(row, meetingType, index) {
    const item = row || {};
    if (meetingType === "board") {
      return `<tr data-mp-participant>
        <td>${index + 1}</td>
        <td><input name="participant_fio" value="${escapeHtml(item.fio || "")}"></td>
        <td><input name="participant_passport" value="${escapeHtml(item.passport || "")}"></td>
        <td><input name="participant_tax_id" value="${escapeHtml(item.tax_id || item.code || "")}"></td>
        <td><input type="date" name="participant_birth_date" value="${escapeHtml(item.birth_date || "")}"></td>
        <td><input type="date" name="participant_passport_date" value="${escapeHtml(item.passport_date || "")}"></td>
        <td><input name="participant_passport_issuer" value="${escapeHtml(item.passport_issuer || "")}"></td>
        <td><button type="button" class="gr-btn" data-mp-remove-participant><i data-lucide="trash-2"></i></button></td>
      </tr>`;
    }
    return `<tr data-mp-participant>
      <td>${index + 1}</td>
      <td><input name="participant_kv" value="${escapeHtml(item.kv || "")}"></td>
      <td><input name="participant_fio" value="${escapeHtml(item.fio || "")}"></td>
      <td><button type="button" class="gr-btn" data-mp-remove-participant><i data-lucide="trash-2"></i></button></td>
    </tr>`;
  }

  function renderParticipantsEditor(meetingType, participants) {
    if (meetingType !== "board" && meetingType !== "representatives") return "";
    const rows = normalizeParticipants(participants);
    const list = rows.length ? rows : [{ fio: "" }, { fio: "" }];
    const isBoard = meetingType === "board";
    return `<div class="mp-participants" data-mp-participants data-mp-participants-type="${escapeHtml(meetingType)}">
      <div class="mp-participants-head">
        <h3>${isBoard ? "Члени правління" : "Уповноважені представники"}</h3>
        <button type="button" class="gr-btn" data-mp-add-participant><i data-lucide="plus"></i><span>Додати</span></button>
      </div>
      <div class="mp-participants-note">Першим у списку має бути голова. Другий у списку буде секретарем протоколу.</div>
      <table class="mp-participants-table">
        <thead>
          ${isBoard
            ? "<tr><th>№</th><th>П.І.Б.</th><th>Паспорт</th><th>Код</th><th>Дата народження</th><th>Дата видачі</th><th>Ким видан</th><th></th></tr>"
            : "<tr><th>№</th><th>Кв.</th><th>П.І.Б.</th><th></th></tr>"}
        </thead>
        <tbody>${list.map((row, index) => renderParticipantRow(row, meetingType, index)).join("")}</tbody>
      </table>
    </div>`;
  }

  function participantRowsForPreview(item, fallbackVoters) {
    if (item.meeting_type !== "board" && item.meeting_type !== "representatives") return fallbackVoters;
    return normalizeParticipants(item.participants)
      .filter(row => row && (row.fio || row.kv))
      .map(row => ({
        passport: row.passport || "",
        tax_id: row.tax_id || row.code || "",
        birth_date: row.birth_date || "",
        passport_date: row.passport_date || "",
        passport_issuer: row.passport_issuer || "",
        kv: row.kv || "",
        fio: row.fio || "",
        area: 0,
        votes: 1
      }));
  }

  function renderEditor(item) {
    const isNew = !item || !item.id;
    const defaultHome = item?.home_code || defaultEditableHome();
    const defaultType = item?.meeting_type || "general";
    const defaultParticipantRows = item
      ? normalizeParticipants(item.participants)
      : defaultParticipants(defaultHome, defaultType, item?.id);
    const doc = item || {
      home_code: defaultHome,
      protocol_date: todayIso(),
      protocol_number: "",
      meeting_type: defaultType,
      vote_basis: "apartment",
      meeting_format: "in_person",
      meeting_initiator: "board",
      meeting_kind: "regular",
      title: "",
      location: defaultLocation(defaultHome),
      chair: defaultChair(defaultHome),
      secretary: defaultSecretary(defaultHome, defaultType, defaultParticipantRows),
      notes: defaultNotes(defaultHome, defaultType),
      participants: defaultParticipantRows,
      agenda: defaultAgenda(defaultHome, defaultType, defaultParticipantRows)
    };
    if (item) doc.participants = defaultParticipantRows;
    if ((doc.meeting_type === "board" || doc.meeting_type === "representatives") && !doc.secretary) {
      doc.secretary = defaultSecretary(doc.home_code, doc.meeting_type, doc.participants, doc.id);
    }
    if (isNew && doc.home_code && !doc.protocol_number) {
      doc.protocol_number = String(maxNumberForHome(doc.home_code) + 1);
    }
    return `
      <div class="gr-app mp-app">
        <div class="od-editor mp-editor">
          <div class="od-editor-head">
            <h2>${isNew ? "Новий протокол" : "Редагування протоколу"}</h2>
            <div class="od-editor-actions">
              <button type="button" class="gr-btn" data-mp-cancel><i data-lucide="arrow-left"></i><span>Назад</span></button>
              <button type="button" class="gr-btn" data-mp-editor-show><i data-lucide="eye"></i><span>Показати</span></button>
              <button type="button" class="gr-btn" data-mp-editor-word><span>Word</span></button>
              <button type="button" class="gr-btn gr-btn-primary" data-mp-save><i data-lucide="save"></i><span>Зберегти</span></button>
            </div>
          </div>
          <form data-mp-form data-mp-id="${escapeHtml(doc.id || "")}">
            <div class="mp-editor-grid">
              ${renderHomeSelect(doc.home_code)}
              <label>Дата<input type="date" name="protocol_date" value="${escapeHtml(shortDate(doc.protocol_date))}"></label>
              <label>Номер<input name="protocol_number" value="${escapeHtml(doc.protocol_number || "")}"></label>
              <label>Тип<select name="meeting_type">
                ${MEETING_TYPES.map(t => `<option value="${t.id}" ${t.id === doc.meeting_type ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
              </select></label>
              <label>Облік голосів<select name="vote_basis">
                ${VOTE_BASIS.map(t => `<option value="${t.id}" ${t.id === doc.vote_basis ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
              </select></label>
              <label class="mp-general-only-field ${doc.meeting_type === "general" ? "" : "is-hidden"}">Форма проведення<select name="meeting_format">
                ${MEETING_FORMATS.map(t => `<option value="${t.id}" ${t.id === (doc.meeting_format || "in_person") ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
              </select></label>
              <label class="mp-general-only-field ${doc.meeting_type === "general" ? "" : "is-hidden"}">Ініціатор<select name="meeting_initiator">
                ${MEETING_INITIATORS.map(t => `<option value="${t.id}" ${t.id === (doc.meeting_initiator || "board") ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
              </select></label>
              <label class="mp-general-only-field ${doc.meeting_type === "general" ? "" : "is-hidden"}">Вид зборів<select name="meeting_kind">
                ${MEETING_KINDS.map(t => `<option value="${t.id}" ${t.id === meetingKindValue(doc) ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
              </select></label>
              <label>Місце проведення<input name="location" value="${escapeHtml(doc.location || "")}"></label>
              <label>Голова зборів<input name="chair" value="${escapeHtml(doc.chair || "")}"></label>
              <label class="mp-secretary-field ${doc.meeting_type === "board" || doc.meeting_type === "representatives" ? "is-hidden" : ""}">Секретар<input name="secretary" value="${escapeHtml(doc.secretary || "")}"></label>
              <label class="mp-title-field gr-ph-field">Тема / короткий опис<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><input name="title" value="${escapeHtml(doc.title || "")}"></label>
              <label class="mp-notes-field gr-ph-field">Додаткові дані<button type="button" class="gr-ph-btn" data-gr-ph-picker title="Вставити placeholder">⋯</button><textarea name="notes" rows="4">${escapeHtml(doc.notes || "")}</textarea></label>
            </div>
            <div data-mp-participants-wrap>${renderParticipantsEditor(doc.meeting_type, doc.participants)}</div>
            <div class="mp-questions-head">
              <h3>Порядок денний, виступи, рішення</h3>
            </div>
            <div data-mp-questions>${renderAgendaEditor(doc.agenda, doc.meeting_type)}</div>
            <div class="mp-add-question-row">
              <button type="button" class="gr-btn" data-mp-add-question><i data-lucide="plus"></i><span>Додати питання</span></button>
            </div>
          </form>
        </div>
      </div>`;
  }

  function editorPayload(form) {
    const fd = new FormData(form);
    const agenda = Array.from(form.querySelectorAll("[data-mp-question]")).slice(0, 10).map(block => ({
      template_id: String(block.querySelector('[name="template_id"]')?.value || "").trim(),
      repair_amount: String(block.querySelector('[name="repair_amount"]')?.value || "").trim(),
      program_name: String(block.querySelector('[name="program_name"]')?.value || "").trim(),
      subject: String(block.querySelector('[name="subject"]')?.value || "").trim(),
      speaker: String(block.querySelector('[name="speaker"]')?.value || "").trim(),
      discussion: String(block.querySelector('[name="discussion"]')?.value || "").trim(),
      decision: String(block.querySelector('[name="decision"]')?.value || "").trim()
    })).filter(q => q.subject || q.speaker || q.discussion || q.decision);
    const meetingType = String(fd.get("meeting_type") || "general");
    const participants = Array.from(form.querySelectorAll("[data-mp-participant]")).map(block => {
      const row = {
        kv: String(block.querySelector('[name="participant_kv"]')?.value || "").trim(),
        fio: String(block.querySelector('[name="participant_fio"]')?.value || "").trim()
      };
      if (meetingType === "board") {
        row.passport = String(block.querySelector('[name="participant_passport"]')?.value || "").trim();
        row.tax_id = String(block.querySelector('[name="participant_tax_id"]')?.value || "").trim();
        row.birth_date = String(block.querySelector('[name="participant_birth_date"]')?.value || "").trim();
        row.passport_date = String(block.querySelector('[name="participant_passport_date"]')?.value || "").trim();
        row.passport_issuer = String(block.querySelector('[name="participant_passport_issuer"]')?.value || "").trim();
      }
      return row;
    }).filter(row => row.fio || row.kv || row.passport || row.tax_id);
    const secretary = meetingType === "board" || meetingType === "representatives"
      ? String((participants[1] && participants[1].fio) || "")
      : String(fd.get("secretary") || "").trim();
    return {
      home_code: String(fd.get("home_code") || ""),
      protocol_date: fd.get("protocol_date") || null,
      protocol_number: String(fd.get("protocol_number") || "").trim(),
      meeting_type: meetingType,
      vote_basis: String(fd.get("vote_basis") || "apartment"),
      meeting_format: meetingType === "general" ? String(fd.get("meeting_format") || "in_person") : "in_person",
      meeting_initiator: meetingType === "general" ? String(fd.get("meeting_initiator") || "board") : "board",
      meeting_kind: meetingType === "general" ? String(fd.get("meeting_kind") || defaultMeetingKind(String(fd.get("meeting_initiator") || "board"))) : "regular",
      title: String(fd.get("title") || "").trim(),
      location: String(fd.get("location") || "").trim(),
      chair: String(fd.get("chair") || "").trim(),
      secretary,
      notes: String(fd.get("notes") || ""),
      participants,
      agenda,
      placeholder_values: {}
    };
  }

  function hasPlaceholderSnapshot(item) {
    return !!(item && item.placeholder_values && typeof item.placeholder_values === "object" && Object.keys(item.placeholder_values).length);
  }

  function placeholderSnapshotNeedsRefresh(previous, payload) {
    if (!hasPlaceholderSnapshot(previous)) return true;
    const keys = ["home_code", "protocol_number", "meeting_type", "chair", "secretary", "meeting_format", "meeting_initiator"];
    if (keys.some(key => String(previous?.[key] || "") !== String(payload?.[key] || ""))) return true;
    if (String(meetingKindValue(previous) || "") !== String(payload?.meeting_kind || "")) return true;
    return shortDate(previous?.protocol_date) !== shortDate(payload?.protocol_date);
  }

  function collectVoters(homeData, voteBasis) {
    const source = (homeData && homeData.ls) || (String(homeData?.code || "") === String(activeHomeCode || "") ? window.ls : null) || {};
    const byKv = new Map();
    Object.entries(source).forEach(([id, item]) => {
      const kv = String(item && item.kv || "").trim();
      if (!kv) return;
      if (parseKv(kv) === 0) return;
      const fio = String(item.fio || item.owner || "").trim();
      const area = Number(String(item.pl || item.area || "0").replace(",", ".")) || 0;
      if (!byKv.has(kv)) byKv.set(kv, { id, kv, fioList: [], area: 0 });
      const row = byKv.get(kv);
      if (fio && !row.fioList.includes(fio)) row.fioList.push(fio);
      row.area += area;
    });
    return Array.from(byKv.values())
      .map(row => ({
        kv: row.kv,
        fio: row.fioList.join(", "),
        area: row.area,
        votes: voteBasis === "area" ? row.area : 1
      }))
      .sort((a, b) => parseKv(a.kv) - parseKv(b.kv) || String(a.kv).localeCompare(String(b.kv), "uk"));
  }

  function chunks(items, size) {
    const out = [];
    const step = Math.max(1, Number(size) || 1);
    for (let i = 0; i < items.length; i += step) out.push(items.slice(i, i + step));
    return out.length ? out : [[]];
  }

  function protocolAppendixText(item) {
    return `Додаток до протоколу загальних зборів № ${item.protocol_number || "__"} ${item.protocol_date ? `від ${formatDate(item.protocol_date)}` : "від __.__.____"}`;
  }

  function renderVotingAgenda(agenda, item) {
    const items = normalizeAgenda(agenda).filter(q => q && q.subject);
    if (!items.length) return "";
    return `<div class="mp-voting-agenda">
      <div>Порядок денний:</div>
      <ol>${items.map(q => `<li>${renderProtocolRichInline(q.subject || "", item, q)}</li>`).join("")}</ol>
    </div>`;
  }

  function createMeasureHost() {
    let host = document.getElementById("gr-measure-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "gr-measure-host";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }
    host.innerHTML = "";
    return host;
  }

  function measureSheetFits(sheetHtml) {
    const host = createMeasureHost();
    host.innerHTML = sheetHtml;
    const sheet = host.querySelector(".gr-sheet");
    const ok = sheet ? sheet.scrollHeight <= sheet.clientHeight + 2 : true;
    host.innerHTML = "";
    return ok;
  }

  function paginateMeasuredRows(items, renderPage) {
    const pages = [];
    let offset = 0;
    let pageIndex = 0;
    const source = items.length ? items : [];
    if (!source.length) return [{ rows: [], offset: 0 }];
    while (offset < source.length) {
      let low = 1;
      let high = source.length - offset;
      let best = 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const rows = source.slice(offset, offset + mid);
        if (measureSheetFits(renderPage(rows, pageIndex, offset, { measuring: true, totalPages: 999 }))) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (best < 1) best = 1;
      pages.push({ rows: source.slice(offset, offset + best), offset });
      offset += best;
      pageIndex += 1;
      if (pageIndex > 300) break;
    }
    return pages;
  }

  function renderVotingPages(home, homeName, voters, agenda, item) {
    const questions = normalizeAgenda(agenda).filter(q => q && q.subject);
    const questionCount = Math.max(1, questions.length);
    const landscape = questionCount > 7;
    const renderPage = (pageRows, pageIndex, offset, opts) => {
      const totalPages = opts && opts.totalPages;
      const rows = pageRows.map((v, i) => `<tr>
        <td>${offset + i + 1}</td>
        <td><span class="gr-apt-no">${escapeHtml(v.kv)}</span></td>
        <td>${escapeHtml(v.fio)}</td>
        ${Array.from({ length: questionCount }, () => `<td class="mp-vote-cell"></td>`).join("")}
        <td></td>
      </tr>`).join("");
      return `<section class="gr-sheet mp-sheet ${landscape ? "gr-sheet-landscape mp-sheet-landscape" : ""} ${pageIndex ? "mp-appendix-continuation" : ""}">
        <div class="mp-page">
          ${renderProtocolHeader(home, "Лист голосування", protocolAppendixText(item))}
          ${renderVotingAgenda(questions, item)}
          <div class="mp-voting-note">У графі питання власноруч зазначається: "за", "проти" або "утримався".</div>
          <table class="mp-print-table">
            <thead><tr><th>№</th><th>Кв.</th><th>П.І.Б.</th>${Array.from({ length: questionCount }, (_x, i) => `<th>Пит. ${i + 1}</th>`).join("")}<th>Підпис</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${totalPages > 1 ? `<div class="mp-page-footer">сторінка ${pageIndex + 1} із ${totalPages}</div>` : ""}
        </div>
      </section>`;
    };
    const pages = paginateMeasuredRows(voters, renderPage);
    return pages.map((page, pageIndex) => renderPage(page.rows, pageIndex, page.offset, { totalPages: pages.length })).join("");
  }

  function renderRegistrationPages(home, homeName, voters, item) {
    const renderPage = (pageRows, pageIndex, offset, opts) => {
      const totalPages = opts && opts.totalPages;
      const rows = pageRows.map((v, i) => `<tr>
        <td>${offset + i + 1}</td>
        <td><span class="gr-apt-no">${escapeHtml(v.kv)}</span></td>
        <td>${escapeHtml(v.fio)}</td>
        ${item.vote_basis === "area" ? `<td>${money(v.votes)}</td>` : ""}
        <td></td>
      </tr>`).join("");
      return `<section class="gr-sheet mp-sheet ${pageIndex ? "mp-appendix-continuation" : ""}">
        <div class="mp-page">
          ${renderProtocolHeader(home, "Список реєстрації", protocolAppendixText(item))}
          <table class="mp-print-table">
            <thead><tr><th>№</th><th>Кв.</th><th>П.І.Б.</th>${item.vote_basis === "area" ? "<th>Голосів</th>" : ""}<th>Підпис</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${totalPages > 1 ? `<div class="mp-page-footer">сторінка ${pageIndex + 1} із ${totalPages}</div>` : ""}
        </div>
      </section>`;
    };
    const pages = paginateMeasuredRows(voters, renderPage);
    return pages.map((page, pageIndex) => renderPage(page.rows, pageIndex, page.offset, { totalPages: pages.length })).join("");
  }

  function renderMeetingNoticePages(home, homeName, voters, agenda, item) {
    const questions = normalizeAgenda(agenda).filter(q => q && q.subject && q.template_id !== "meetingChairSecretary");
    const meetingDate = item.protocol_date ? formatDate(item.protocol_date) : "__.__.____";
    const meetingPlace = String(item.location || "________________").trim();
    const pages = chunks(voters, 6);
    const agendaHtml = questions.length
      ? `<ol>${questions.map(q => `<li>${renderProtocolRichInline(q.subject || "", item, q)}</li>`).join("")}</ol>`
      : `<div class="mp-notice-muted">Порядок денний буде повідомлено додатково.</div>`;
    return pages.map((pageRows) => `
      <section class="gr-sheet mp-sheet">
        <div class="mp-page mp-notice-page">
          <div class="mp-notice-grid">
            ${pageRows.map(v => `
              <div class="mp-notice-card">
                <h3>Повідомлення про проведення загальних зборів</h3>
                <div class="mp-notice-recipient">Співвласнику квартири <strong>${escapeHtml(v.kv)}</strong></div>
                <div class="mp-notice-fio">${escapeHtml(v.fio)}</div>
                <p>Повідомляємо про проведення загальних зборів співвласників будинку <strong>${escapeHtml(homeName)}</strong>.</p>
                <div class="mp-notice-meta">
                  <div><strong>Дата:</strong> ${escapeHtml(meetingDate)}</div>
                  <div><strong>Місце:</strong> ${escapeHtml(meetingPlace)}</div>
                </div>
                <div class="mp-notice-agenda">
                  <strong>Порядок денний:</strong>
                  ${agendaHtml}
                </div>
                <div class="mp-notice-sign">Правління ОСББ/ЖБК ____________________</div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `).join("");
  }

  function renderPollPages(home, homeName, voters, agenda, item) {
    const questions = normalizeAgenda(agenda).filter(q => q && q.subject);
    return voters.map((v, index) => `<section class="gr-sheet mp-sheet">
      <div class="mp-page">
        ${renderProtocolHeader(home, "Лист опитування", protocolAppendixText(item))}
        <div class="mp-poll-meta">
          <div><strong>Квартира:</strong> ${escapeHtml(v.kv)}</div>
          <div><strong>Співвласник:</strong> ${escapeHtml(v.fio)}</div>
          <div><strong>Кількість голосів:</strong> ${item.vote_basis === "area" ? money(v.votes) : "1"}</div>
        </div>
        <table class="mp-print-table">
          <thead><tr><th>№</th><th>Формулювання рішення</th><th>Голос</th></tr></thead>
          <tbody>${questions.map((q, i) => `<tr><td>${i + 1}</td><td>${renderProtocolRichInline(q.decision || q.subject || "", item, q)}</td><td class="mp-poll-vote-cell"></td></tr>`).join("")}</tbody>
        </table>
        <div class="mp-voting-note">У графі "Голос" власноруч зазначається: "за", "проти" або "утримався".</div>
        <div class="mp-poll-sign">Підпис співвласника ____________________________ / ${escapeHtml(shortInitials(v.fio || ""))}</div>
      </div>
    </section>`).join("");
  }

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function docxP(text, opts) {
    const o = opts || {};
    const align = o.align ? `<w:jc w:val="${o.align}"/>` : "";
    const bold = o.bold ? "<w:b/>" : "";
    const size = o.size ? `<w:sz w:val="${Number(o.size) * 2}"/><w:szCs w:val="${Number(o.size) * 2}"/>` : "";
    return `<w:p><w:pPr>${align}</w:pPr><w:r><w:rPr>${bold}${size}</w:rPr><w:t xml:space="preserve">${xmlEscape(text || "")}</w:t></w:r></w:p>`;
  }

  function docxQuestion(q, index, item) {
    return [
      docxP(`${index + 1}. ${renderProtocolText(q.subject || "", item, q)}`, { bold: true, size: 13 }),
      q.speaker ? docxP(`Виступили: ${renderProtocolText(q.speaker, item, q)}`) : "",
      q.discussion ? docxP(`Обговорення: ${renderProtocolText(q.discussion, item, q)}`) : "",
      q.decision ? docxP(`Вирішили: ${renderProtocolText(q.decision, item, q)}`) : "",
      docxP("Голосування: за ___, проти ___, утримались ___.")
    ].join("");
  }

  async function buildProtocolDocxBlob(item) {
    if (!window.JSZip) throw new Error("JSZip is not loaded");
    const homeData = await ensureHomeData(item.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(item.home_code) || {}, { code: item.home_code });
    const voters = participantRowsForPreview(item, collectVoters(home, item.vote_basis));
    const totalVotes = voters.reduce((sum, v) => sum + (Number(v.votes) || 0), 0);
    const homeName = home?.name || home?.org || item.home_code || "";
    const agenda = normalizeAgenda(item.agenda).filter(q => q && q.subject);
    const title = visibleProtocolTitle(item, agenda);
    const formatLabel = meetingFormatLabel(item.meeting_format || "in_person");
    const initiatorLabel = meetingInitiatorLabel(item.meeting_initiator || "board");
    const kindLabel = meetingKindLabel(meetingKindValue(item));
    const body = [
      docxP(homeName, { bold: true, size: 16, align: "center" }),
      docxP(`Протокол № ${item.protocol_number || ""} ${item.protocol_date ? `від ${formatDate(item.protocol_date)}` : ""}`, { bold: true, size: 14, align: "center" }),
      docxP(typeLabel(item.meeting_type), { bold: true, size: 14, align: "center" }),
      title ? docxP(title, { bold: true, align: "center" }) : "",
      docxP(`Місце проведення: ${item.location || ""}`),
      item.meeting_type === "general" && formatLabel ? docxP(`Форма проведення: ${formatLabel}`) : "",
      item.meeting_type === "general" && initiatorLabel ? docxP(`Ініціатор: ${initiatorLabel}`) : "",
      item.meeting_type === "general" && kindLabel ? docxP(`Вид зборів: ${kindLabel}`) : "",
      docxP(`Облік голосів: ${voteBasisLabel(item.vote_basis)}`),
      docxP(`Учасників у реєстрі: ${voters.length}`),
      docxP(`Загальна кількість голосів: ${item.vote_basis === "area" ? money(totalVotes) : String(totalVotes)}`),
      docxP("Присутні: ____________________; кворум є."),
      docxP(`Голова: ${item.chair || ""}`),
      docxP(`Секретар: ${item.secretary || ""}`),
      docxP("Порядок денний", { bold: true, size: 13 }),
      agenda.map((q, i) => docxP(`${i + 1}. ${renderProtocolText(q.subject || "", item, q)}`)).join(""),
      agenda.map((q, i) => docxQuestion(q, i, item)).join(""),
      item.notes ? docxP(`Додатково: ${item.notes}`) : "",
      docxP(""),
      docxP(item.meeting_type === "general" ? `Голова зборів __________________ / ${shortInitials(item.chair || "")}` : `Голова правління __________________ / ${shortInitials(item.chair || "")}`),
      item.meeting_type === "general" ? docxP(`Секретар __________________ / ${shortInitials(item.secretary || "")}`) : ""
    ].join("");
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.folder("word").folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
    zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr></w:body></w:document>`);
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
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

  function filePart(value) {
    return String(value || "").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "protocol";
  }

  async function downloadProtocolWord(idOrItem) {
    const item = typeof idOrItem === "object" ? idOrItem : findItem(idOrItem);
    if (!item) return;
    try {
      const blob = await buildProtocolDocxBlob(item);
      const home = getHomeByCode(item.home_code);
      saveBlob(blob, `${filePart(home && (home.org3 || home.name) || item.home_code)}_${filePart(`protocol_${item.protocol_number || ""}`)}.docx`);
    } catch (e) {
      console.error(e);
      show("Не вдалося сформувати Word", "err", 7000);
    }
  }

  function renderProtocolHeader(home, title, subtitle) {
    const homeName = home?.name || home?.org || home?.code || "";
    const address = home?.adr || home?.address || "";
    return `<div class="mp-doc-head">
      <div class="mp-brand">
        <img class="mp-logo" src="img/logo.png" alt="">
        <div>
          <div class="mp-org">${escapeHtml(homeName)}</div>
          ${address ? `<div class="mp-address">${escapeHtml(address)}</div>` : ""}
        </div>
      </div>
      <div class="mp-doc-title">
        <div>${escapeHtml(title || "")}</div>
        ${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ""}
      </div>
    </div>
    <div class="mp-blue-line"></div>`;
  }

  function shortInitials(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length < 3) return String(fullName || "").trim();
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }

  function renderInlineSignatures(item) {
    const participants = normalizeParticipants(item.participants).filter(row => row && row.fio);
    if (item.meeting_type === "general") {
      return `<div class="mp-signatures">
        <div>Голова зборів __________________ / ${escapeHtml(shortInitials(item.chair || ""))}</div>
        <div>Секретар __________________ / ${escapeHtml(shortInitials(item.secretary || ""))}</div>
      </div>`;
    }
    const title = item.meeting_type === "board" ? "Члени правління:" : "Уповноважені представники:";
    const memberRows = participants.slice(1).map(row =>
      `<div class="mp-member-signature">${escapeHtml(shortInitials(row.fio))} __________________</div>`
    ).join("");
    return `<div class="mp-signature-block">
      <div>Голова правління __________________ / ${escapeHtml(shortInitials((participants[0] && participants[0].fio) || item.chair || ""))}</div>
      ${participants.length > 1 ? `<div class="mp-member-signatures-title">${escapeHtml(title)}</div>${memberRows}` : ""}
    </div>`;
  }

  function renderQuestionBlock(q, index, item) {
    return `<div class="mp-question-view">
      <h3>${index + 1}. ${renderProtocolRichInline(q.subject || "", item, q)}</h3>
      ${q.speaker ? `<div class="mp-question-rich"><strong>Виступили:</strong>${renderProtocolRichBlock(q.speaker, item, q, "mp-rich-p")}</div>` : ""}
      ${q.discussion ? `<div class="mp-question-rich"><strong>Обговорення:</strong>${renderProtocolRichBlock(q.discussion, item, q, "mp-rich-p")}</div>` : ""}
      ${q.decision ? `<div class="mp-question-rich"><strong>Вирішили:</strong>${renderProtocolRichBlock(q.decision, item, q, "mp-rich-p")}</div>` : ""}
      <p><strong>Голосування:</strong> за ___, проти ___, утримались ___.</p>
    </div>`;
  }

  function estimateQuestionSize(q, item) {
    const text = [
      renderProtocolText(q.subject || "", item, q),
      renderProtocolText(q.speaker || "", item, q),
      renderProtocolText(q.discussion || "", item, q),
      renderProtocolText(q.decision || "", item, q)
    ].join(" ");
    return text.length + 220;
  }

  function splitProtocolQuestions(agenda, item) {
    const questions = normalizeAgenda(agenda).map((q, index) => ({ q, index })).filter(row => row.q && row.q.subject);
    if (!questions.length) return [[]];
    const agendaSize = questions.reduce((sum, row) => sum + String(renderProtocolText(row.q.subject || "", item, row.q)).length, 0);
    const firstLimit = Math.max(850, 2050 - agendaSize * 0.75 - (item.title ? 120 : 0));
    const nextLimit = 3300;
    const pages = [];
    let page = [];
    let used = 0;
    questions.forEach(row => {
      const size = estimateQuestionSize(row.q, item);
      const limit = pages.length ? nextLimit : firstLimit;
      if (page.length && used + size > limit) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push(row);
      used += size;
    });
    if (page.length) pages.push(page);
    return pages.length ? pages : [[]];
  }

  function renderProtocolDoc(item, home, voters) {
    const agenda = normalizeAgenda(item.agenda);
    const title = visibleProtocolTitle(item, agenda);
    const totalVotes = voters.reduce((sum, v) => sum + (Number(v.votes) || 0), 0);
    const homeName = home?.name || home?.org || item.home_code || "";
    const protocolCaption = `Протокол № ${item.protocol_number || ""}`;
    const protocolDate = item.protocol_date ? `від ${formatDate(item.protocol_date)}` : "";
    const formatLabel = meetingFormatLabel(item.meeting_format || "in_person");
    const initiatorLabel = meetingInitiatorLabel(item.meeting_initiator || "board");
    const kindLabel = meetingKindLabel(meetingKindValue(item));
    const questionPages = splitProtocolQuestions(agenda, item);
    const protocolPages = questionPages.map((pageRows, pageIndex) => `
      <section class="gr-sheet mp-sheet">
        <div class="mp-page">
          ${pageIndex === 0 ? `
            ${renderProtocolHeader(home, protocolCaption, protocolDate)}
            <h1>${escapeHtml(typeLabel(item.meeting_type))}</h1>
            ${title ? `<h2>${renderProtocolRichInline(title, item, null)}</h2>` : ""}
            <div class="mp-meta">
              <div><strong>Будинок:</strong> ${escapeHtml(homeName)}</div>
              <div><strong>Місце проведення:</strong> ${escapeHtml(item.location || "")}</div>
              ${item.meeting_type === "general" && formatLabel ? `<div><strong>Форма проведення:</strong> ${escapeHtml(formatLabel)}</div>` : ""}
              ${item.meeting_type === "general" && initiatorLabel ? `<div><strong>Ініціатор:</strong> ${escapeHtml(initiatorLabel)}</div>` : ""}
              ${item.meeting_type === "general" && kindLabel ? `<div><strong>Вид зборів:</strong> ${escapeHtml(kindLabel)}</div>` : ""}
              <div><strong>Облік голосів:</strong> ${escapeHtml(voteBasisLabel(item.vote_basis))}</div>
              <div><strong>Учасників у реєстрі:</strong> ${voters.length}</div>
              <div><strong>Загальна кількість голосів:</strong> ${item.vote_basis === "area" ? money(totalVotes) : String(totalVotes)}</div>
              <div><strong>Присутні:</strong> ____________________; кворум є.</div>
              <div><strong>Голова:</strong> ${escapeHtml(item.chair || "")}</div>
              <div><strong>Секретар:</strong> ${escapeHtml(item.secretary || "")}</div>
            </div>
            <h3>Порядок денний</h3>
            <ol class="mp-agenda-list">${agenda.map(q => `<li>${renderProtocolRichInline(q.subject || "", item, q)}</li>`).join("") || "<li></li>"}</ol>
          ` : ``}
          ${pageRows.map(row => renderQuestionBlock(row.q, row.index, item)).join("")}
          ${pageIndex === questionPages.length - 1 ? `
            ${item.notes ? `<h3>Додатково</h3>${renderProtocolRichBlock(item.notes, item, null, "mp-rich-p")}` : ""}
            ${renderInlineSignatures(item)}
          ` : ""}
          ${pageIndex > 0 ? `<div class="mp-page-footer">${escapeHtml(protocolCaption)} ${protocolDate ? escapeHtml(protocolDate) : ""} (сторінка ${pageIndex + 1} із ${questionPages.length})</div>` : ""}
        </div>
      </section>`).join("");
    return `${protocolPages}${item.meeting_type === "general" ? renderVotingPages(home, homeName, voters, agenda, item) : ""}`;
  }

  function getContainer() {
    return document.getElementById("maincontainer");
  }

  function render(html) {
    const container = getContainer();
    if (container) container.innerHTML = html;
    bindEvents();
    if (window.GrCommon) {
      GrCommon.initPlaceholderPicker(container, currentProtocolPlaceholderCatalog);
      GrCommon.initPlaceholderHint(container);
    }
    enhanceProtocolPreview(container);
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  function currentProtocolPlaceholderCatalog() {
    const form = document.querySelector("[data-mp-form]");
    if (!form || !window.GrCommon || !GrCommon.defaultPlaceholderCatalog) return [];
    const item = editorPayload(form);
    item.placeholder_values = placeholderSnapshot(item);
    const home = getHomeMeta(item.home_code);
    const base = GrCommon.defaultPlaceholderCatalog(home, null);
    const protocolItems = Object.entries(item.placeholder_values || {}).map(([key, value]) => ({
      label: String(value || key),
      token: `{${key}}`
    }));
    return base.concat(protocolItems);
  }

  function enhanceProtocolPreview(container) {
    if (!container || typeof GrCommon === "undefined") return;
    const output = container.querySelector(".mp-output");
    if (!output) return;
    Array.from(output.children).forEach((child, index) => {
      if (!child.classList || !child.classList.contains("gr-sheet")) return;
      const wrap = document.createElement("div");
      wrap.className = "gr-sheet-wrap";
      output.insertBefore(wrap, child);
      wrap.appendChild(child);
      wrap.insertAdjacentHTML("beforeend", GrCommon.renderPageActionsHtml(index));
    });
    GrCommon.renumberSheetActions(output);
    GrCommon.bindPageActions(output, () => GrCommon.renumberSheetActions(output));
  }

  async function downloadProtocolPdf() {
    if (typeof GrCommon === "undefined") return;
    const sheets = GrCommon.getSheetsFromContainer(document.querySelector(".mp-output"));
    await GrCommon.downloadPdfFromSheets(sheets, "protocol.pdf");
  }

  async function loadItems() {
    const codes = (homes || []).map(h => String(h.code));
    if (!codes.length) {
      state.items = [];
      return;
    }
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .in("home_code", codes)
      .order("protocol_date", { ascending: false });
    if (error) {
      console.error(error);
      show("Не вдалося завантажити протоколи", "err", 7000);
      state.items = [];
      return;
    }
    state.items = data || [];
  }

  async function loadQuestionTemplates() {
    const { data, error } = await client
      .from("meeting_question_templates")
      .select("id,label,types,subject,speaker,discussion,decision,sort_order,is_active,extra_fields")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });
    if (error) {
      console.error(error);
      state.questionTemplates = [];
      show("Не вдалося завантажити шаблони питань порядку денного", "err", 7000);
      return;
    }
    state.questionTemplates = (data || []).map(row => ({
      id: row.id,
      label: row.label || row.id,
      types: Array.isArray(row.types) ? row.types : [],
      subject: row.subject || "",
      speaker: row.speaker || "",
      discussion: row.discussion || "",
      decision: row.decision || "",
      sort_order: Number(row.sort_order) || 1000,
      is_active: row.is_active !== false,
      extra_fields: row.extra_fields || {}
    }));
  }

  async function openMeetingProtocols(homeCodeParam) {
    state.homeCode = String(homeCodeParam || activeHomeCode || "");
    const current = getHomeByCode(state.homeCode);
    state.selectedHomeCodes = current ? [String(current.code)] : [];
    document.body.classList.add("files-mode");
    render(`<div class="gr-app mp-app"><div class="od-loading">Завантаження...</div></div>`);
    await loadQuestionTemplates();
    await loadItems();
    render(renderList());
  }

  function findItem(id) {
    return state.items.find(item => String(item.id) === String(id)) || null;
  }

  async function saveForm(options) {
    const form = document.querySelector("[data-mp-form]");
    if (!form) return null;
    const id = form.dataset.mpId || "";
    const payload = editorPayload(form);
    if (!canEditHome(payload.home_code)) {
      show("Немає прав на зміну протоколів цього будинку", "warn");
      return null;
    }
    if (!payload.protocol_number) payload.protocol_number = String(maxNumberForHome(payload.home_code, id) + 1);
    const previous = id ? findItem(id) : null;
    payload.placeholder_values = previous && !placeholderSnapshotNeedsRefresh(previous, payload)
      ? previous.placeholder_values
      : placeholderSnapshot(payload);
    payload.placeholder_values = Object.assign({}, payload.placeholder_values, {
      __meeting_kind: payload.meeting_kind || "regular"
    });
    delete payload.meeting_kind;
    const query = id
      ? client.from(TABLE).update(payload).eq("id", id).select("*").single()
      : client.from(TABLE).insert(payload).select("*").single();
    const { data, error } = await query;
    if (error) {
      console.error(error);
      show("Не вдалося зберегти протокол", "err", 7000);
      return null;
    }
    const idx = state.items.findIndex(item => item.id === data.id);
    if (idx >= 0) state.items[idx] = data;
    else state.items.unshift(data);
    if (!options || !options.keepEditor) render(renderList());
    return data;
  }

  async function showItem(idOrItem) {
    const item = typeof idOrItem === "object" ? idOrItem : findItem(idOrItem);
    if (!item) return;
    const homeData = await ensureHomeData(item.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(item.home_code) || {}, { code: item.home_code });
    const voters = participantRowsForPreview(item, collectVoters(home, item.vote_basis));
    render(`<div class="gr-app mp-preview-app">
      <div class="od-preview-tools no-print">
        <button type="button" class="gr-btn" data-mp-back>Назад</button>
        <button type="button" class="gr-btn" data-mp-print>Друк</button>
        <button type="button" class="gr-btn" data-mp-pdf>PDF</button>
        <button type="button" class="gr-btn" data-mp-word="${escapeHtml(item.id || "")}"><span>Word</span></button>
        ${item.meeting_type === "general" ? `<button type="button" class="gr-btn" data-mp-registration="${escapeHtml(item.id || "")}">Список реєстрації</button><button type="button" class="gr-btn" data-mp-polls="${escapeHtml(item.id || "")}">Листи опитування</button><button type="button" class="gr-btn" data-mp-notices="${escapeHtml(item.id || "")}">Повідомлення</button>` : ""}
      </div>
      <div class="gr-output mp-output">${renderProtocolDoc(item, home, voters)}</div>
    </div>`);
  }

  async function showRegistrationList(id) {
    const item = findItem(id);
    if (!item) return;
    const homeData = await ensureHomeData(item.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(item.home_code) || {}, { code: item.home_code });
    const voters = participantRowsForPreview(item, collectVoters(home, item.vote_basis));
    const homeName = home?.name || home?.org || item.home_code || "";
    render(`<div class="gr-app mp-preview-app">
      <div class="od-preview-tools no-print"><button type="button" class="gr-btn" data-mp-back-to-protocol="${escapeHtml(item.id)}">Назад</button><button type="button" class="gr-btn" data-mp-print>Друк</button><button type="button" class="gr-btn" data-mp-pdf>PDF</button></div>
      <div class="gr-output mp-output">${renderRegistrationPages(home, homeName, voters, item)}</div>
    </div>`);
  }

  async function showPollSheets(id) {
    const item = findItem(id);
    if (!item) return;
    const homeData = await ensureHomeData(item.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(item.home_code) || {}, { code: item.home_code });
    const voters = participantRowsForPreview(item, collectVoters(home, item.vote_basis));
    const homeName = home?.name || home?.org || item.home_code || "";
    render(`<div class="gr-app mp-preview-app">
      <div class="od-preview-tools no-print"><button type="button" class="gr-btn" data-mp-back-to-protocol="${escapeHtml(item.id)}">Назад</button><button type="button" class="gr-btn" data-mp-print>Друк</button><button type="button" class="gr-btn" data-mp-pdf>PDF</button></div>
      <div class="gr-output mp-output">${renderPollPages(home, homeName, voters, normalizeAgenda(item.agenda), item)}</div>
    </div>`);
  }

  async function showMeetingNotices(id) {
    const item = findItem(id);
    if (!item) return;
    const homeData = await ensureHomeData(item.home_code);
    const home = Object.assign({}, homeData || {}, getHomeByCode(item.home_code) || {}, { code: item.home_code });
    const voters = participantRowsForPreview(item, collectVoters(home, item.vote_basis));
    const homeName = home?.name || home?.org || item.home_code || "";
    render(`<div class="gr-app mp-preview-app">
      <div class="od-preview-tools no-print"><button type="button" class="gr-btn" data-mp-back-to-protocol="${escapeHtml(item.id)}">Назад</button><button type="button" class="gr-btn" data-mp-print>Друк</button><button type="button" class="gr-btn" data-mp-pdf>PDF</button></div>
      <div class="gr-output mp-output">${renderMeetingNoticePages(home, homeName, voters, normalizeAgenda(item.agenda), item)}</div>
    </div>`);
  }

  async function deleteItem(id) {
    const item = findItem(id);
    if (!item || !canEditHome(item.home_code)) return;
    const ok = typeof showConfirmDialog === "function"
      ? await showConfirmDialog({ title: "Видалити протокол", message: `Видалити протокол № ${item.protocol_number || ""}?`, okText: "Видалити", cancelText: "Скасувати" })
      : confirm(`Видалити протокол № ${item.protocol_number || ""}?`);
    if (!ok) return;
    const { error } = await client.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error(error);
      show("Не вдалося видалити протокол", "err");
      return;
    }
    state.items = state.items.filter(item => String(item.id) !== String(id));
    render(renderList());
  }

  function editItem(id) {
    const item = findItem(id);
    if (!item || !canEditHome(item.home_code)) return;
    render(renderEditor(item));
  }

  function copyItem(id) {
    const item = findItem(id);
    if (!item || !canEditHome(item.home_code)) return;
    render(renderEditor(Object.assign({}, item, {
      id: "",
      placeholder_values: {},
      protocol_date: todayIso(),
      protocol_number: String(maxNumberForHome(item.home_code) + 1)
    })));
  }

  function newItem() {
    render(renderEditor(null));
  }

  function bindHomeCombo(container) {
    if (typeof bindMultiHomePicker !== "function") return;
    bindMultiHomePicker({
      id: "mp-home-picker",
      getHomes: () => homes || [],
      getSelection: () => ({
        selectedCodes: state.selectedHomeCodes,
        allSelected: state.selectedHomeCodes.length === (homes || []).length
      }),
      setSelection: selectedCodes => { state.selectedHomeCodes = selectedCodes.slice(); },
      onChange: () => {
        const tbody = container.querySelector(".mp-table tbody");
        if (tbody) {
          tbody.innerHTML = renderRowsHtml();
          bindRowButtons(container);
          if (window.lucide) window.lucide.createIcons();
        }
      },
      placeholder: "Оберіть будинок...",
      allLabel: "(Всі)",
      searchPlaceholder: "Пошук будинку..."
    });
  }

  function bindRowButtons(container) {
    container.querySelectorAll("[data-mp-edit-row]").forEach(row => row.addEventListener("click", () => editItem(row.dataset.mpEditRow)));
    container.querySelectorAll("[data-mp-menu-toggle]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      const menu = btn.closest(".od-action-menu");
      const wasOpen = menu && menu.classList.contains("is-open");
      container.querySelectorAll(".od-action-menu.is-open").forEach(open => open.classList.remove("is-open"));
      if (menu && !wasOpen) menu.classList.add("is-open");
    }));
    container.querySelectorAll("[data-mp-show]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      showItem(btn.dataset.mpShow);
    }));
    container.querySelectorAll("[data-mp-word]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      downloadProtocolWord(btn.dataset.mpWord);
    }));
    container.querySelectorAll("[data-mp-copy]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      copyItem(btn.dataset.mpCopy);
    }));
    container.querySelectorAll("[data-mp-edit]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      editItem(btn.dataset.mpEdit);
    }));
    container.querySelectorAll("[data-mp-delete]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      deleteItem(btn.dataset.mpDelete);
    }));
  }

  function renumberQuestions() {
    document.querySelectorAll("[data-mp-question]").forEach((block, index) => {
      const title = block.querySelector(".mp-question-head strong");
      if (title) title.textContent = `Питання ${index + 1}`;
    });
  }

  function updateAddQuestionVisibility(container) {
    const root = container || getContainer();
    const questions = root?.querySelector("[data-mp-questions]");
    const add = root?.querySelector("[data-mp-add-question]");
    if (!questions || !add) return;
    add.style.display = questions.querySelectorAll("[data-mp-question]").length >= 10 ? "none" : "";
  }

  function refreshQuestionsUi(container) {
    renumberQuestions();
    updateAddQuestionVisibility(container);
  }

  function hasPlaceholder(value) {
    return /\{[^{}]+\}/.test(String(value || ""));
  }

  function questionFromBlock(block) {
    return {
      template_id: String(block?.querySelector('[name="template_id"]')?.value || "").trim(),
      repair_amount: String(block?.querySelector('[name="repair_amount"]')?.value || "").trim(),
      program_name: String(block?.querySelector('[name="program_name"]')?.value || "").trim(),
      subject: String(block?.querySelector('[name="subject"]')?.value || "").trim(),
      speaker: String(block?.querySelector('[name="speaker"]')?.value || "").trim(),
      discussion: String(block?.querySelector('[name="discussion"]')?.value || "").trim(),
      decision: String(block?.querySelector('[name="decision"]')?.value || "").trim()
    };
  }

  function previewItemFromForm(form) {
    if (!form) return {};
    const fd = new FormData(form);
    const participants = Array.from(form.querySelectorAll("[data-mp-participant]")).map(block => ({
      fio: String(block.querySelector('[name="participant_fio"]')?.value || "").trim()
    }));
    return {
      home_code: String(fd.get("home_code") || activeHomeCode || "").trim(),
      protocol_date: String(fd.get("protocol_date") || todayIso()).trim(),
      chair: String(fd.get("chair") || "").trim(),
      secretary: String(fd.get("secretary") || "").trim(),
      participants
    };
  }

  function updateQuestionPlaceholderPreview(block, form) {
    if (!block) return;
    const question = questionFromBlock(block);
    const item = previewItemFromForm(form || block.closest("form"));
    ["subject", "speaker", "discussion", "decision"].forEach(name => {
      const target = block.querySelector(`[data-mp-placeholder-preview="${name}"]`);
      if (!target) return;
      const raw = question[name] || "";
      if (!hasPlaceholder(raw)) {
        target.textContent = "";
        target.classList.remove("is-visible");
        return;
      }
      target.textContent = renderProtocolText(raw, item, question);
      target.classList.add("is-visible");
    });
  }

  function updateAllQuestionPlaceholderPreviews(container) {
    const form = container?.querySelector("[data-mp-form]");
    container?.querySelectorAll("[data-mp-question]").forEach(block => updateQuestionPlaceholderPreview(block, form));
  }

  function fillQuestionBlock(block, question) {
    if (!block || !question) return;
    const fields = {
      template_id: question.template_id || "",
      repair_amount: question.repair_amount || "",
      program_name: question.program_name || "",
      subject: question.subject || "",
      speaker: question.speaker || "",
      discussion: question.discussion || "",
      decision: question.decision || ""
    };
    Object.keys(fields).forEach(name => {
      const input = block.querySelector(`[name="${name}"]`);
      if (input) input.value = fields[name];
    });
    const amountField = block.querySelector(".mp-repair-amount-field");
    if (amountField) amountField.classList.toggle("is-hidden", !questionTemplateExtraField(question.template_id, "repair_amount"));
    const programField = block.querySelector(".mp-program-name-field");
    if (programField) programField.classList.toggle("is-hidden", !questionTemplateExtraField(question.template_id, "program_name"));
    const toggle = block.querySelector("[data-mp-template-toggle]");
    if (toggle) toggle.textContent = questionTemplateLabel(question.template_id || "");
    updateQuestionPlaceholderPreview(block, block.closest("form"));
  }

  function refreshQuestionTemplateOptions(container, meetingType) {
    container.querySelectorAll("[data-mp-template-options]").forEach(options => {
      const block = options.closest("[data-mp-question]");
      const filter = block?.querySelector("[data-mp-question-template-filter]")?.value || "";
      options.innerHTML = renderQuestionTemplateItems(meetingType || "general", filter);
    });
  }

  function renumberParticipants(container) {
    container.querySelectorAll("[data-mp-participant]").forEach((row, index) => {
      const cell = row.querySelector("td");
      if (cell) cell.textContent = String(index + 1);
    });
  }

  function rerenderParticipants(container, meetingType, rows) {
    const wrap = container.querySelector("[data-mp-participants-wrap]");
    if (!wrap) return;
    wrap.innerHTML = renderParticipantsEditor(meetingType, rows);
    if (window.lucide) window.lucide.createIcons();
  }

  function updateSecretaryVisibility(container, meetingType) {
    const field = container.querySelector(".mp-secretary-field");
    if (field) field.classList.toggle("is-hidden", meetingType === "board" || meetingType === "representatives");
  }

  function updateGeneralFieldsVisibility(container, meetingType) {
    container.querySelectorAll(".mp-general-only-field").forEach(field => {
      field.classList.toggle("is-hidden", meetingType !== "general");
    });
  }

  function currentHomeCodeFromForm(container) {
    return container.querySelector('[data-mp-form] [name="home_code"]')?.value || defaultEditableHome();
  }

  function currentProtocolId(container) {
    return container.querySelector("[data-mp-form]")?.dataset.mpId || "";
  }

  function bindEvents() {
    const container = getContainer();
    if (!container) return;
    bindHomeCombo(container);
    bindRowButtons(container);
    const filter = container.querySelector("[data-mp-filter]");
    if (filter) filter.addEventListener("input", () => {
      state.filter = filter.value;
      const tbody = container.querySelector(".mp-table tbody");
      if (tbody) {
        tbody.innerHTML = renderRowsHtml();
        bindRowButtons(container);
        if (window.lucide) window.lucide.createIcons();
      }
    });
    const add = container.querySelector("[data-mp-new]");
    if (add) add.addEventListener("click", newItem);
    const back = container.querySelector("[data-mp-back], [data-mp-cancel]");
    if (back) back.addEventListener("click", () => render(renderList()));
    const save = container.querySelector("[data-mp-save]");
    if (save) save.addEventListener("click", () => saveForm());
    const showBtn = container.querySelector("[data-mp-editor-show]");
    if (showBtn) showBtn.addEventListener("click", async () => {
      const saved = await saveForm({ keepEditor: true });
      if (saved) await showItem(saved);
    });
    const wordBtn = container.querySelector("[data-mp-editor-word]");
    if (wordBtn) wordBtn.addEventListener("click", async () => {
      const saved = await saveForm({ keepEditor: true });
      if (saved) await downloadProtocolWord(saved);
    });
    const registrationBtn = container.querySelector("[data-mp-registration]");
    if (registrationBtn) registrationBtn.addEventListener("click", () => showRegistrationList(registrationBtn.dataset.mpRegistration));
    const pollsBtn = container.querySelector("[data-mp-polls]");
    if (pollsBtn) pollsBtn.addEventListener("click", () => showPollSheets(pollsBtn.dataset.mpPolls));
    const noticesBtn = container.querySelector("[data-mp-notices]");
    if (noticesBtn) noticesBtn.addEventListener("click", () => showMeetingNotices(noticesBtn.dataset.mpNotices));
    const printBtn = container.querySelector("[data-mp-print]");
    if (printBtn) printBtn.addEventListener("click", () => {
      if (typeof GrCommon !== "undefined") GrCommon.printSheets(".mp-output");
      else window.print();
    });
    const pdfBtn = container.querySelector("[data-mp-pdf]");
    if (pdfBtn) pdfBtn.addEventListener("click", downloadProtocolPdf);
    const backToProtocol = container.querySelector("[data-mp-back-to-protocol]");
    if (backToProtocol) backToProtocol.addEventListener("click", () => showItem(backToProtocol.dataset.mpBackToProtocol));
    const homeSelect = container.querySelector('[data-mp-form] select[name="home_code"]');
    if (homeSelect) homeSelect.addEventListener("change", async () => {
      const input = container.querySelector('[name="protocol_number"]');
      if (input) input.value = String(maxNumberForHome(homeSelect.value, container.querySelector("[data-mp-form]")?.dataset.mpId || "") + 1);
      const chair = container.querySelector('[name="chair"]');
      if (chair && !chair.value.trim()) chair.value = defaultChair(homeSelect.value);
      const location = container.querySelector('[name="location"]');
      if (location && !location.value.trim()) location.value = defaultLocation(homeSelect.value);
      const meetingType = container.querySelector('[data-mp-form] select[name="meeting_type"]')?.value || "general";
      await ensureHomeData(homeSelect.value);
      rerenderParticipants(container, meetingType, defaultParticipants(homeSelect.value, meetingType, currentProtocolId(container)));
    });
    const typeSelect = container.querySelector('[data-mp-form] select[name="meeting_type"]');
    if (typeSelect) typeSelect.addEventListener("change", async () => {
      refreshQuestionTemplateOptions(container, typeSelect.value);
      updateSecretaryVisibility(container, typeSelect.value);
      updateGeneralFieldsVisibility(container, typeSelect.value);
      const homeCode = currentHomeCodeFromForm(container);
      await ensureHomeData(homeCode);
      rerenderParticipants(container, typeSelect.value, defaultParticipants(homeCode, typeSelect.value, currentProtocolId(container)));
      const notes = container.querySelector('[name="notes"]');
      if (notes && !notes.value.trim()) notes.value = defaultNotes(homeCode, typeSelect.value, currentProtocolId(container));
    });
    const participantWrap = container.querySelector("[data-mp-participants-wrap]");
    if (participantWrap) {
      participantWrap.addEventListener("click", event => {
        const remove = event.target.closest("[data-mp-remove-participant]");
        if (remove) {
          remove.closest("[data-mp-participant]")?.remove();
          renumberParticipants(participantWrap);
          return;
        }
        const addParticipant = event.target.closest("[data-mp-add-participant]");
        if (!addParticipant) return;
        const block = addParticipant.closest("[data-mp-participants]");
        const meetingType = block?.dataset.mpParticipantsType || "representatives";
        const tbody = block?.querySelector("tbody");
        if (!tbody) return;
        const index = tbody.querySelectorAll("[data-mp-participant]").length;
        tbody.insertAdjacentHTML("beforeend", renderParticipantRow({}, meetingType, index));
        if (window.lucide) window.lucide.createIcons();
      });
    }
    const questions = container.querySelector("[data-mp-questions]");
    const addQuestion = container.querySelector("[data-mp-add-question]");
    if (addQuestion && questions) addQuestion.addEventListener("click", () => {
      if (questions.querySelectorAll("[data-mp-question]").length >= 10) return;
      const meetingType = container.querySelector('[data-mp-form] select[name="meeting_type"]')?.value || "general";
      questions.insertAdjacentHTML("beforeend", renderAgendaEditor([{ subject: "", speaker: "", discussion: "", decision: "" }], meetingType));
      refreshQuestionsUi(container);
      updateAllQuestionPlaceholderPreviews(container);
      if (window.lucide) window.lucide.createIcons();
    });
    if (questions) {
      questions.addEventListener("click", event => {
        const toggle = event.target.closest("[data-mp-template-toggle]");
        if (toggle) {
          event.stopPropagation();
          const combo = toggle.closest("[data-mp-template-combo]");
          const wasOpen = combo && combo.classList.contains("is-open");
          questions.querySelectorAll("[data-mp-template-combo].is-open").forEach(open => open.classList.remove("is-open"));
          if (combo && !wasOpen) {
            combo.classList.add("is-open");
            combo.querySelector("[data-mp-question-template-filter]")?.focus();
          }
          return;
        }
        const option = event.target.closest("[data-mp-question-template-option]");
        if (option) {
          event.stopPropagation();
          const block = option.closest("[data-mp-question]");
          const form = container.querySelector("[data-mp-form]");
          const meetingType = form?.querySelector('[name="meeting_type"]')?.value || "general";
          const question = buildQuestionFromTemplate(option.dataset.mpQuestionTemplateOption, meetingType);
          fillQuestionBlock(block, question);
          updateQuestionPlaceholderPreview(block, form);
          option.closest("[data-mp-template-combo]")?.classList.remove("is-open");
          return;
        }
        const remove = event.target.closest("[data-mp-remove-question]");
        if (!remove) {
          const up = event.target.closest("[data-mp-question-up]");
          const down = event.target.closest("[data-mp-question-down]");
          const moveBtn = up || down;
          if (!moveBtn) return;
          event.preventDefault();
          const block = moveBtn.closest("[data-mp-question]");
          if (!block) return;
          if (up && block.previousElementSibling) questions.insertBefore(block, block.previousElementSibling);
          if (down && block.nextElementSibling) questions.insertBefore(block.nextElementSibling, block);
          refreshQuestionsUi(container);
          updateAllQuestionPlaceholderPreviews(container);
          return;
        }
        remove.closest("[data-mp-question]")?.remove();
        refreshQuestionsUi(container);
      });
      questions.addEventListener("input", event => {
        const filter = event.target.closest("[data-mp-question-template-filter]");
        if (filter) {
          const block = filter.closest("[data-mp-question]");
          const options = block?.querySelector("[data-mp-template-options]");
          if (!options) return;
          const meetingType = container.querySelector('[data-mp-form] select[name="meeting_type"]')?.value || "general";
          options.innerHTML = renderQuestionTemplateItems(meetingType, filter.value);
          return;
        }
        const block = event.target.closest("[data-mp-question]");
        if (block) updateQuestionPlaceholderPreview(block, container.querySelector("[data-mp-form]"));
      });
    }
    const form = container.querySelector("[data-mp-form]");
    if (form) {
      form.addEventListener("input", event => {
        if (event.target.closest("[data-mp-question]")) return;
        if (event.target.matches('[name="home_code"], [name="protocol_date"], [name="chair"], [name="secretary"], [name="participant_fio"]')) {
          updateAllQuestionPlaceholderPreviews(container);
        }
      });
      form.addEventListener("change", event => {
        if (event.target.matches('[name="home_code"], [name="protocol_date"], [name="meeting_type"], [name="chair"], [name="secretary"], [name="participant_fio"]')) {
          updateAllQuestionPlaceholderPreviews(container);
        }
      });
      updateAllQuestionPlaceholderPreviews(container);
    }
    refreshQuestionsUi(container);
  }

  document.addEventListener("click", function () {
    document.querySelectorAll(".od-action-menu.is-open").forEach(menu => menu.classList.remove("is-open"));
    document.querySelectorAll("[data-mp-template-combo].is-open").forEach(combo => combo.classList.remove("is-open"));
  });

  window.openMeetingProtocols = openMeetingProtocols;
})();
