(function () {
  "use strict";

  const EDIT_ROLES = new Set(["Правление", "Администратор", "Бухгалтер", "Председатель"]);
  const RESOURCE_TYPES = [
    { id: "electricity", label: "Електроенергія" },
    { id: "heat", label: "Тепло" }
  ];
  const METER_ROLES = [
    { id: "billable", label: "Розрахунковий" },
    { id: "control", label: "Контрольний" },
    { id: "submeter", label: "Дочірній" },
    { id: "info", label: "Інформаційний" }
  ];
  const VALUE_TYPES = [
    { id: "number", label: "Число" },
    { id: "text", label: "Текст" },
    { id: "date", label: "Дата" },
    { id: "time", label: "Час" }
  ];

  const state = {
    homeCode: "",
    meters: [],
    channels: [],
    readings: [],
    values: [],
    selectedMeterId: "",
    readingDate: todayIso(),
    loading: false,
    showAct: false,
    warnTimers: new WeakMap()
  };

  function escapeHtml(value) {
    if (window.GrCommon && GrCommon.escapeHtml) return GrCommon.escapeHtml(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function show(text, type, timeout) {
    if (typeof showMessage === "function") showMessage(text, type || "info", timeout || 5000);
    else console[type === "err" ? "error" : "log"](text);
  }

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function monthCodeFromDate(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return 0;
    return d.getFullYear() * 12 + d.getMonth() + 1;
  }

  function dateLabel(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }

  function num(value, fallback) {
    const n = Number(String(value == null ? "" : value).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function fmt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("uk-UA", { maximumFractionDigits: 4 }) : "";
  }

  function canEditHome(code) {
    return EDIT_ROLES.has(roles && roles[String(code)]);
  }

  function editableHomes() {
    return (homes || []).filter(home => canEditHome(home.code));
  }

  function homesWithMeters() {
    const codes = new Set(state.meters.map(meter => String(meter.home_code)));
    const list = (homes || []).filter(home => codes.has(String(home.code)) || String(home.code) === String(state.homeCode));
    return list.length ? list : editableHomes();
  }

  function homeName(code) {
    const home = (homes || []).find(h => String(h.code) === String(code));
    return home ? (home.name || home.org || home.code) : code;
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

  function channelsForMeter(meterId) {
    return state.channels
      .filter(ch => String(ch.meter_id) === String(meterId))
      .sort((a, b) => (Number(a.sort_order) || 1000) - (Number(b.sort_order) || 1000) || String(a.code).localeCompare(String(b.code), "uk"));
  }

  function readingForMeter(meterId) {
    return state.readings.find(row => String(row.meter_id) === String(meterId) && row.reading_date === state.readingDate) || null;
  }

  function valuesForReading(readingId) {
    return state.values.filter(row => String(row.reading_id) === String(readingId));
  }

  function currentValueFor(channelId, readingId) {
    if (!readingId) return "";
    const found = valuesForReading(readingId).find(row => String(row.channel_id) === String(channelId));
    return found ? found.current_value || "" : "";
  }

  function previousValueFor(meterId, channelId) {
    const previousReadings = state.readings
      .filter(row => String(row.meter_id) === String(meterId) && row.reading_date < state.readingDate)
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)));
    for (const reading of previousReadings) {
      const found = state.values.find(row => String(row.reading_id) === String(reading.id) && String(row.channel_id) === String(channelId));
      if (found && String(found.current_value || "").trim() !== "") return found.current_value;
    }
    return "";
  }

  function historicalDeltasForChannel(meterId, channelId) {
    const selected = new Date(`${state.readingDate}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return [];
    const since = new Date(selected);
    since.setFullYear(since.getFullYear() - 1);
    const readings = state.readings
      .filter(row => String(row.meter_id) === String(meterId) && row.reading_date < state.readingDate)
      .sort((a, b) => String(a.reading_date).localeCompare(String(b.reading_date)));
    const points = readings.map(reading => {
      const found = state.values.find(row => String(row.reading_id) === String(reading.id) && String(row.channel_id) === String(channelId));
      const value = found && String(found.current_value || "").trim() !== "" ? num(found.current_value, NaN) : NaN;
      return { date: reading.reading_date, value };
    }).filter(point => Number.isFinite(point.value));
    const deltas = [];
    for (let i = 1; i < points.length; i += 1) {
      const date = new Date(`${points[i].date}T00:00:00`);
      const delta = points[i].value - points[i - 1].value;
      if (date >= since && Number.isFinite(delta) && delta >= 0) deltas.push(delta);
    }
    return deltas;
  }

  function autoConsumptionBounds(meterId, channelId) {
    const deltas = historicalDeltasForChannel(meterId, channelId);
    if (!deltas.length) return { min: "", max: "" };
    const min = Math.max(0, Math.min(...deltas) * 0.7);
    const max = Math.max(...deltas) * 1.3;
    return {
      min: Number.isFinite(min) ? min : "",
      max: Number.isFinite(max) && max > 0 ? max : ""
    };
  }

  function meterLabel(meter) {
    const parts = [meter.name, meter.meter_number].filter(Boolean);
    return parts.join(" / ") || "Новий прилад";
  }

  function resourceLabel(value) {
    return (RESOURCE_TYPES.find(item => item.id === value) || {}).label || value || "";
  }

  function renderSelect(name, value, items) {
    return `<select name="${name}">${items.map(item =>
      `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`
    ).join("")}</select>`;
  }

  function renderHomePicker() {
    const list = homesWithMeters();
    return `<label>Будинок<select data-ma-home>${list.map(home =>
      `<option value="${escapeHtml(home.code)}" ${String(home.code) === String(state.homeCode) ? "selected" : ""}>${escapeHtml(home.name || home.org || home.code)}</option>`
    ).join("")}</select></label>`;
  }

  function emptyMeter() {
    return {
      id: "",
      home_code: state.homeCode,
      resource_type: "electricity",
      name: "",
      meter_type: "",
      meter_number: "",
      eic_code: "",
      operator_account: "",
      contract_number: "",
      contract_date: "",
      measurement_type: "",
      calculation_factor: 1,
      min_consumption: "",
      max_consumption: "",
      zones_count: 1,
      connection_name: "",
      object_name: "",
      role: "billable",
      is_active: true,
      sort_order: 1000,
      note: ""
    };
  }

  function selectedMeter() {
    return state.meters.find(meter => String(meter.id) === String(state.selectedMeterId)) || null;
  }

  function renderMeterList() {
    if (!state.meters.length) return `<div class="ma-empty">Прилади ще не додані.</div>`;
    return state.meters.map(meter => {
      const selected = String(meter.id) === String(state.selectedMeterId);
      const channels = channelsForMeter(meter.id);
      return `<button type="button" class="ma-meter-row ${selected ? "is-selected" : ""}" data-ma-select-meter="${escapeHtml(meter.id)}">
        <span>
          <strong>${escapeHtml(meterLabel(meter))}</strong>
          <small>${escapeHtml(resourceLabel(meter.resource_type))}${meter.is_active ? "" : " · неактивний"}</small>
        </span>
        <em>${channels.length || 0} каналів</em>
      </button>`;
    }).join("");
  }

  function renderMeterForm(meter) {
    const m = meter || emptyMeter();
    return `<form class="ma-form" data-ma-meter-form data-meter-id="${escapeHtml(m.id || "")}">
      <div class="ma-form-head">
        <h3>${m.id ? "Прилад обліку" : "Новий прилад"}</h3>
        <div>
          ${m.id ? `<button type="button" class="gr-btn" data-ma-new-meter>Новий</button>` : ""}
          <button type="submit" class="gr-btn gr-btn-primary">Зберегти прилад</button>
        </div>
      </div>
      <div class="ma-grid">
        <label>Назва<input name="name" value="${escapeHtml(m.name || "")}" placeholder="Ввід, будинок, під'їзд..."></label>
        <label>Ресурс${renderSelect("resource_type", m.resource_type || "electricity", RESOURCE_TYPES)}</label>
        <label>Тип<input name="meter_type" value="${escapeHtml(m.meter_type || "")}" placeholder="НІК, ЛУЗОД..."></label>
        <label>Номер<input name="meter_number" value="${escapeHtml(m.meter_number || "")}"></label>
        <label>EIC / точка обліку<input name="eic_code" value="${escapeHtml(m.eic_code || "")}"></label>
        <label>Особовий рахунок оператора<input name="operator_account" value="${escapeHtml(m.operator_account || "")}"></label>
        <label>Договір №<input name="contract_number" value="${escapeHtml(m.contract_number || "")}"></label>
        <label>Дата договору<input type="date" name="contract_date" value="${escapeHtml(m.contract_date || "")}"></label>
        <label>Тип вимірювання<input name="measurement_type" value="${escapeHtml(m.measurement_type || "")}" placeholder="активна, реактивна..."></label>
        <label>Коефіцієнт<input type="number" step="0.0001" name="calculation_factor" value="${escapeHtml(m.calculation_factor || 1)}"></label>
        <label>Мін. споживання<input type="number" step="0.0001" name="min_consumption" value="${escapeHtml(m.min_consumption ?? "")}" placeholder="без контролю"></label>
        <label>Макс. споживання<input type="number" step="0.0001" name="max_consumption" value="${escapeHtml(m.max_consumption ?? "")}" placeholder="без контролю"></label>
        <label>Зон<input type="number" min="1" max="3" step="1" name="zones_count" value="${escapeHtml(m.zones_count || 1)}"></label>
        <label>Роль${renderSelect("role", m.role || "billable", METER_ROLES)}</label>
        <label>Приєднання<input name="connection_name" value="${escapeHtml(m.connection_name || "")}"></label>
        <label>Об'єкт<input name="object_name" value="${escapeHtml(m.object_name || "")}"></label>
        <label>Сортування<input type="number" step="1" name="sort_order" value="${escapeHtml(m.sort_order || 1000)}"></label>
        <label class="ma-check"><input type="checkbox" name="is_active" ${m.is_active !== false ? "checked" : ""}> Активний</label>
        <label class="ma-wide">Примітка<textarea name="note" rows="2">${escapeHtml(m.note || "")}</textarea></label>
      </div>
    </form>`;
  }

  function renderChannels(meter) {
    if (!meter || !meter.id) return `<div class="ma-panel"><h3>Канали</h3><div class="ma-empty">Спочатку збережіть прилад.</div></div>`;
    const rows = channelsForMeter(meter.id);
    return `<div class="ma-panel">
      <div class="ma-form-head">
        <h3>Канали показань</h3>
        <button type="button" class="gr-btn" data-ma-add-channel>Додати канал</button>
      </div>
      <table class="ma-table">
        <thead><tr><th>Код</th><th>Назва</th><th>Од. вводу</th><th>Од. звіту</th><th>Коеф.</th><th>Тип</th><th>Активний</th><th></th></tr></thead>
        <tbody>
          ${rows.map(ch => renderChannelRow(ch)).join("") || `<tr><td colspan="8" class="ma-empty-cell">Каналів немає.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  }

  function renderChannelRow(channel) {
    const ch = channel || {};
    return `<tr data-ma-channel-row data-channel-id="${escapeHtml(ch.id || "")}">
      <td><input name="code" value="${escapeHtml(ch.code || "")}" placeholder="t1"></td>
      <td><input name="label" value="${escapeHtml(ch.label || "")}" placeholder="День"></td>
      <td><input name="input_unit" value="${escapeHtml(ch.input_unit || "кВт⋅год")}"></td>
      <td><input name="report_unit" value="${escapeHtml(ch.report_unit || ch.input_unit || "кВт⋅год")}"></td>
      <td><input type="number" step="0.0001" name="unit_factor" value="${escapeHtml(ch.unit_factor || 1)}"></td>
      <td>${renderSelect("value_type", ch.value_type || "number", VALUE_TYPES)}</td>
      <td class="ma-center"><input type="checkbox" name="is_active" ${ch.is_active !== false ? "checked" : ""}></td>
      <td><button type="button" class="gr-btn" data-ma-save-channel>Зберегти</button></td>
    </tr>`;
  }

  function readingRows() {
    return state.meters
      .filter(meter => meter.is_active !== false)
      .flatMap(meter => channelsForMeter(meter.id)
        .filter(channel => channel.is_active !== false && channel.is_reading !== false)
        .map(channel => ({ meter, channel })));
  }

  function historyForMeter(meterId) {
    const meterReadings = state.readings
      .filter(row => String(row.meter_id) === String(meterId))
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)));
    return meterReadings.map(reading => ({
      reading,
      values: state.values.filter(value => String(value.reading_id) === String(reading.id))
    }));
  }

  function renderHistory(meter) {
    if (!meter || !meter.id) return "";
    const channels = channelsForMeter(meter.id);
    const rows = historyForMeter(meter.id);
    return `<div class="ma-panel">
      <div class="ma-form-head">
        <h3>Історія показань</h3>
        <button type="button" class="gr-btn" data-ma-toggle-act>${state.showAct ? "Сховати акт" : "Сформувати акт"}</button>
      </div>
      <table class="ma-table">
        <thead><tr><th>Дата</th>${channels.map(ch => `<th>${escapeHtml(ch.label || ch.code)}</th>`).join("")}<th>Різниця</th><th>До звіту</th></tr></thead>
        <tbody>${rows.map(row => {
          const deltas = [];
          const reports = [];
          const cells = channels.map(ch => {
            const value = row.values.find(v => String(v.channel_id) === String(ch.id));
            if (value && value.delta_value != null) deltas.push(fmt(value.delta_value));
            if (value && value.report_value != null) reports.push(fmt(value.report_value));
            return `<td>${escapeHtml(value ? value.current_value : "")}</td>`;
          }).join("");
          return `<tr><td>${escapeHtml(dateLabel(row.reading.reading_date))}</td>${cells}<td>${escapeHtml(deltas.join(" / "))}</td><td>${escapeHtml(reports.join(" / "))}</td></tr>`;
        }).join("") || `<tr><td colspan="${channels.length + 3}" class="ma-empty-cell">Історії ще немає.</td></tr>`}</tbody>
      </table>
    </div>`;
  }

  function currentReadingSnapshot(meter) {
    const channels = channelsForMeter(meter.id).filter(ch => ch.is_active !== false && ch.is_reading !== false);
    const rows = channels.map(channel => {
      const reading = readingForMeter(meter.id);
      const current = currentValueFor(channel.id, reading && reading.id);
      const previous = previousValueFor(meter.id, channel.id);
      const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
      const delta = current !== "" && previous !== "" ? num(current, 0) - num(previous, 0) : null;
      return {
        channel,
        previous,
        current,
        delta,
        report: delta == null ? null : delta * factor
      };
    });
    return { channels, rows };
  }

  function renderAct(meter) {
    if (!meter || !meter.id || !state.showAct) return "";
    const snap = currentReadingSnapshot(meter);
    const total = snap.rows.reduce((sum, row) => sum + (Number(row.report) || 0), 0);
    const home = homeName(meter.home_code);
    return `<div class="ma-act-tools no-print">
      <button type="button" class="gr-btn" data-ma-print-act>Друк</button>
      <button type="button" class="gr-btn" data-ma-pdf-act>PDF</button>
      <button type="button" class="gr-btn" data-ma-word-act>Word</button>
    </div>
    <div class="gr-sheet ma-act-sheet">
      <div class="ma-act">
        <div class="ma-act-top">
          <div>
            <h2>Акт фіксації показань приладу обліку</h2>
            <div>${escapeHtml(home)}</div>
          </div>
          <div class="ma-act-date">${escapeHtml(dateLabel(state.readingDate))}</div>
        </div>
        <div class="ma-act-meta">
          <div><strong>Прилад:</strong> ${escapeHtml(meter.name || "")}</div>
          <div><strong>Номер:</strong> ${escapeHtml(meter.meter_number || "")}</div>
          <div><strong>Ресурс:</strong> ${escapeHtml(resourceLabel(meter.resource_type))}</div>
          <div><strong>EIC:</strong> ${escapeHtml(meter.eic_code || "")}</div>
          <div><strong>Особовий рахунок:</strong> ${escapeHtml(meter.operator_account || "")}</div>
          <div><strong>Об'єкт:</strong> ${escapeHtml(meter.object_name || meter.connection_name || "")}</div>
        </div>
        <table class="ma-act-table">
          <thead><tr><th>Показник</th><th>Попереднє</th><th>Поточне</th><th>Різниця</th><th>До звіту</th></tr></thead>
          <tbody>${snap.rows.map(row => `<tr>
            <td>${escapeHtml(row.channel.label || row.channel.code)}</td>
            <td>${escapeHtml(row.previous)}</td>
            <td>${escapeHtml(row.current)}</td>
            <td>${escapeHtml(row.delta == null ? "" : fmt(row.delta))}</td>
            <td>${escapeHtml(row.report == null ? "" : fmt(row.report))}</td>
          </tr>`).join("")}</tbody>
          <tfoot><tr><th colspan="4">Разом</th><th>${escapeHtml(fmt(total))}</th></tr></tfoot>
        </table>
        <div class="ma-act-signatures">
          <div>Представник ОСББ/ЖБК ____________________</div>
          <div>Представник оператора ____________________</div>
        </div>
      </div>
    </div>`;
  }

  function renderReadings() {
    const rows = readingRows();
    return `<div class="ma-panel ma-readings">
      <div class="ma-form-head">
        <h3>Показання</h3>
        <div class="ma-reading-tools">
          <label>Дата<input type="date" data-ma-reading-date value="${escapeHtml(state.readingDate)}"></label>
          <button type="button" class="gr-btn gr-btn-primary" data-ma-save-readings>Зберегти показання</button>
        </div>
      </div>
      <table class="ma-table">
        <thead><tr><th>Прилад</th><th>Канал</th><th>Попереднє</th><th>Поточне</th><th>Різниця</th><th>До звіту</th></tr></thead>
        <tbody>
          ${rows.map(({ meter, channel }) => {
            const reading = readingForMeter(meter.id);
            const current = currentValueFor(channel.id, reading && reading.id);
            const previous = previousValueFor(meter.id, channel.id);
            const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
            const delta = current !== "" && previous !== "" ? num(current, 0) - num(previous, 0) : null;
            const report = delta == null ? null : delta * factor;
            const autoBounds = autoConsumptionBounds(meter.id, channel.id);
            return `<tr data-ma-reading-row data-meter-id="${escapeHtml(meter.id)}" data-channel-id="${escapeHtml(channel.id)}" data-previous="${escapeHtml(previous)}" data-factor="${escapeHtml(factor)}" data-min="${escapeHtml(meter.min_consumption ?? "")}" data-max="${escapeHtml(meter.max_consumption ?? "")}" data-auto-min="${escapeHtml(autoBounds.min)}" data-auto-max="${escapeHtml(autoBounds.max)}">
              <td><strong>${escapeHtml(meterLabel(meter))}</strong><small>${escapeHtml(homeName(meter.home_code))}</small></td>
              <td>${escapeHtml(channel.label || channel.code)}</td>
              <td>${escapeHtml(previous)}</td>
              <td><input name="current_value" value="${escapeHtml(current)}"><div class="ma-reading-warning" data-ma-warning hidden></div></td>
              <td data-ma-delta>${escapeHtml(delta == null ? "" : fmt(delta))}</td>
              <td data-ma-report>${escapeHtml(report == null ? "" : fmt(report))}</td>
            </tr>`;
          }).join("") || `<tr><td colspan="6" class="ma-empty-cell">Немає активних каналів показань.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  }

  function renderApp() {
    const selected = selectedMeter();
    const hasMeterPicker = state.meters.length > 1;
    return `<div class="gr-app ma-app">
      <div class="ma-toolbar">
        <h2>Прилади обліку</h2>
        <div>${renderHomePicker()}</div>
      </div>
      ${state.loading ? `<div class="od-loading">Завантаження...</div>` : `
        <div class="ma-layout ${hasMeterPicker ? "" : "ma-layout-single"}">
          ${hasMeterPicker ? `<aside class="ma-sidebar">
            <div class="ma-side-head">
              <strong>Прилади</strong>
            </div>
            ${renderMeterList()}
          </aside>` : ""}
          <main class="ma-main">
            ${renderReadings()}
            ${renderHistory(selected)}
            ${renderAct(selected)}
          </main>
        </div>
      `}
    </div>`;
  }

  function render() {
    const container = ensureRenderContainer();
    if (!container) return;
    container.innerHTML = renderApp();
    bindEvents(container);
  }

  async function loadData() {
    if (!state.homeCode) return;
    state.loading = true;
    render();
    const { data: metersData, error: metersError } = await client
      .from("meters")
      .select("*")
      .eq("home_code", state.homeCode)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (metersError) {
      console.error(metersError);
      show("Не вдалося завантажити прилади обліку", "err", 7000);
      state.loading = false;
      render();
      return;
    }
    state.meters = metersData || [];
    if (!state.selectedMeterId || !state.meters.some(m => String(m.id) === String(state.selectedMeterId))) {
      state.selectedMeterId = state.meters[0] ? state.meters[0].id : "";
    }
    await loadChildren();
    state.loading = false;
    render();
  }

  async function loadChildren() {
    const ids = state.meters.map(meter => meter.id).filter(Boolean);
    state.channels = [];
    state.readings = [];
    state.values = [];
    if (!ids.length) return;
    const [{ data: channelsData, error: channelsError }, { data: readingsData, error: readingsError }] = await Promise.all([
      client.from("meter_channels").select("*").in("meter_id", ids).order("sort_order", { ascending: true }),
      client.from("meter_readings").select("*").in("meter_id", ids).order("reading_date", { ascending: false }).limit(1500)
    ]);
    if (channelsError || readingsError) {
      console.error(channelsError || readingsError);
      show("Не вдалося завантажити канали або показання", "err", 7000);
      return;
    }
    state.channels = channelsData || [];
    state.readings = readingsData || [];
    const readingIds = state.readings.map(row => row.id).filter(Boolean);
    if (!readingIds.length) return;
    const { data: valuesData, error: valuesError } = await client
      .from("meter_reading_values")
      .select("*")
      .in("reading_id", readingIds);
    if (valuesError) {
      console.error(valuesError);
      show("Не вдалося завантажити значення показань", "err", 7000);
      return;
    }
    state.values = valuesData || [];
  }

  function meterPayload(form) {
    const fd = new FormData(form);
    return {
      home_code: state.homeCode,
      resource_type: String(fd.get("resource_type") || "electricity"),
      name: String(fd.get("name") || "").trim(),
      meter_type: String(fd.get("meter_type") || "").trim(),
      meter_number: String(fd.get("meter_number") || "").trim(),
      eic_code: String(fd.get("eic_code") || "").trim(),
      operator_account: String(fd.get("operator_account") || "").trim(),
      contract_number: String(fd.get("contract_number") || "").trim(),
      contract_date: fd.get("contract_date") || null,
      measurement_type: String(fd.get("measurement_type") || "").trim(),
      calculation_factor: num(fd.get("calculation_factor"), 1),
      min_consumption: String(fd.get("min_consumption") || "").trim() === "" ? null : num(fd.get("min_consumption"), null),
      max_consumption: String(fd.get("max_consumption") || "").trim() === "" ? null : num(fd.get("max_consumption"), null),
      zones_count: Math.max(1, Math.min(3, Math.round(num(fd.get("zones_count"), 1)))),
      connection_name: String(fd.get("connection_name") || "").trim(),
      object_name: String(fd.get("object_name") || "").trim(),
      role: String(fd.get("role") || "billable"),
      is_active: !!fd.get("is_active"),
      sort_order: Math.round(num(fd.get("sort_order"), 1000)),
      note: String(fd.get("note") || "").trim()
    };
  }

  async function saveMeter(form) {
    if (!canEditHome(state.homeCode)) return show("Немає прав на зміну приладів цього будинку", "warn");
    const id = form.dataset.meterId || "";
    const payload = meterPayload(form);
    const query = id
      ? client.from("meters").update(payload).eq("id", id).select("*").single()
      : client.from("meters").insert(payload).select("*").single();
    const { data, error } = await query;
    if (error) {
      console.error(error);
      show("Не вдалося зберегти прилад", "err", 7000);
      return;
    }
    state.selectedMeterId = data.id;
    show("Прилад збережено", "ok");
    await loadData();
  }

  function channelPayload(row, meterId, index) {
    const get = name => row.querySelector(`[name="${name}"]`);
    return {
      meter_id: meterId,
      code: String(get("code")?.value || `ch${index + 1}`).trim(),
      label: String(get("label")?.value || "").trim(),
      input_unit: String(get("input_unit")?.value || "").trim(),
      report_unit: String(get("report_unit")?.value || "").trim(),
      unit_factor: num(get("unit_factor")?.value, 1),
      value_type: String(get("value_type")?.value || "number"),
      is_reading: true,
      is_active: !!get("is_active")?.checked,
      sort_order: index * 10 + 10
    };
  }

  async function saveChannel(row) {
    const meter = selectedMeter();
    if (!meter) return;
    const rows = Array.from(document.querySelectorAll("[data-ma-channel-row]"));
    const id = row.dataset.channelId || "";
    const payload = channelPayload(row, meter.id, rows.indexOf(row));
    if (!payload.code) return show("Вкажіть код каналу", "warn");
    const query = id
      ? client.from("meter_channels").update(payload).eq("id", id).select("*").single()
      : client.from("meter_channels").insert(payload).select("*").single();
    const { error } = await query;
    if (error) {
      console.error(error);
      show("Не вдалося зберегти канал", "err", 7000);
      return;
    }
    show("Канал збережено", "ok");
    await loadData();
  }

  async function upsertReading(meterId) {
    const payload = {
      meter_id: meterId,
      reading_date: state.readingDate,
      report_month: monthCodeFromDate(state.readingDate),
      source: "manual"
    };
    const { data, error } = await client
      .from("meter_readings")
      .upsert(payload, { onConflict: "meter_id,reading_date" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function saveReadings() {
    if (!canEditHome(state.homeCode)) return show("Немає прав на зміну показань цього будинку", "warn");
    const rows = Array.from(document.querySelectorAll("[data-ma-reading-row]"));
    const warnings = rows.map(row => validateReadingRow(row, true)).filter(Boolean);
    if (warnings.length && typeof confirm === "function" && !confirm("Є показання за межами встановленого контролю. Все одно зберегти?")) {
      show("Збереження скасовано", "warn");
      return;
    }
    const grouped = new Map();
    rows.forEach(row => {
      const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
      if (!current) return;
      const meterId = row.dataset.meterId;
      if (!grouped.has(meterId)) grouped.set(meterId, []);
      grouped.get(meterId).push(row);
    });
    if (!grouped.size) return show("Немає заповнених показань", "warn");
    try {
      for (const [meterId, groupRows] of grouped.entries()) {
        const reading = await upsertReading(meterId);
        const payload = groupRows.map(row => {
          const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
          const previous = String(row.dataset.previous || "").trim();
          const delta = current !== "" && previous !== "" ? num(current, 0) - num(previous, 0) : null;
          const factor = num(row.dataset.factor, 1);
          return {
            reading_id: reading.id,
            channel_id: row.dataset.channelId,
            current_value: current,
            previous_value: previous,
            previous_manual: false,
            delta_value: delta,
            report_value: delta == null ? null : delta * factor
          };
        });
        const { error } = await client
          .from("meter_reading_values")
          .upsert(payload, { onConflict: "reading_id,channel_id" });
        if (error) throw error;
      }
      show("Показання збережено", "ok");
      await loadData();
    } catch (err) {
      console.error(err);
      show("Не вдалося зберегти показання", "err", 7000);
    }
  }

  function actSheet() {
    return document.querySelector(".ma-act-sheet");
  }

  function printAct() {
    const sheet = actSheet();
    if (!sheet) return;
    const old = document.body.classList.contains("ma-print-act-only");
    document.body.classList.add("ma-print-act-only");
    window.print();
    if (!old) setTimeout(() => document.body.classList.remove("ma-print-act-only"), 500);
  }

  async function pdfAct() {
    if (!window.GrCommon || !GrCommon.downloadPdfFromSheets) return show("PDF недоступний", "warn");
    const sheet = actSheet();
    if (!sheet) return;
    await GrCommon.downloadPdfFromSheets([sheet], "meter-act.pdf");
  }

  function wordAct() {
    const sheet = actSheet();
    if (!sheet) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif;font-size:12pt}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #555;padding:5px}
      .ma-act-top{display:flex;justify-content:space-between;border-bottom:3px solid #1f5a9d;margin-bottom:14px}
      .ma-act-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}
      .ma-act-signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}
    </style></head><body>${sheet.innerHTML}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meter-act.doc";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function recalcReadingRow(row) {
    const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
    const previous = String(row.dataset.previous || "").trim();
    const deltaCell = row.querySelector("[data-ma-delta]");
    const reportCell = row.querySelector("[data-ma-report]");
    if (!current || !previous) {
      if (deltaCell) deltaCell.textContent = "";
      if (reportCell) reportCell.textContent = "";
      return;
    }
    const delta = num(current, 0) - num(previous, 0);
    const report = delta * num(row.dataset.factor, 1);
    if (deltaCell) deltaCell.textContent = fmt(delta);
    if (reportCell) reportCell.textContent = fmt(report);
  }

  function validationMessageForRow(row) {
    const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
    const previous = String(row.dataset.previous || "").trim();
    if (!current || !previous) return "";
    const delta = num(current, NaN) - num(previous, NaN);
    if (!Number.isFinite(delta)) return "";
    const manualMin = num(row.dataset.min, 0);
    const manualMax = num(row.dataset.max, 0);
    const autoMin = num(row.dataset.autoMin, NaN);
    const autoMax = num(row.dataset.autoMax, NaN);
    const hasMin = manualMin > 0 || Number.isFinite(autoMin);
    const hasMax = manualMax > 0 || (Number.isFinite(autoMax) && autoMax > 0);
    const min = manualMin > 0 ? manualMin : autoMin;
    const max = manualMax > 0 ? manualMax : autoMax;
    if (hasMin && delta < min) return `Увага: споживання ${fmt(delta)} менше мінімального ${fmt(min)}.`;
    if (hasMax && delta > max) return `Увага: споживання ${fmt(delta)} більше максимального ${fmt(max)}.`;
    return "";
  }

  function validateReadingRow(row, visible) {
    const warning = row.querySelector("[data-ma-warning]");
    const message = validationMessageForRow(row);
    if (warning) {
      warning.textContent = message;
      warning.hidden = !(visible && message);
    }
    return message;
  }

  function scheduleReadingWarning(input) {
    const row = input.closest("[data-ma-reading-row]");
    if (!row) return;
    const previous = state.warnTimers.get(input);
    if (previous) clearTimeout(previous);
    const timer = setTimeout(() => validateReadingRow(row, true), 4500);
    state.warnTimers.set(input, timer);
  }

  function bindEvents(container) {
    container.querySelector("[data-ma-home]")?.addEventListener("change", async event => {
      state.homeCode = event.target.value;
      state.selectedMeterId = "";
      await loadData();
    });
    container.querySelectorAll("[data-ma-select-meter]").forEach(btn => btn.addEventListener("click", () => {
      state.selectedMeterId = btn.dataset.maSelectMeter || "";
      state.showAct = false;
      render();
    }));
    container.querySelector("[data-ma-reading-date]")?.addEventListener("change", async event => {
      state.readingDate = event.target.value || todayIso();
      await loadChildren();
      render();
    });
    container.querySelectorAll("[data-ma-reading-row] input").forEach(input => input.addEventListener("input", () => {
      const row = input.closest("[data-ma-reading-row]");
      if (row) {
        recalcReadingRow(row);
        const warning = row.querySelector("[data-ma-warning]");
        if (warning) warning.hidden = true;
        scheduleReadingWarning(input);
      }
    }));
    container.querySelector("[data-ma-save-readings]")?.addEventListener("click", saveReadings);
    container.querySelector("[data-ma-toggle-act]")?.addEventListener("click", () => {
      state.showAct = !state.showAct;
      render();
    });
    container.querySelector("[data-ma-print-act]")?.addEventListener("click", printAct);
    container.querySelector("[data-ma-pdf-act]")?.addEventListener("click", pdfAct);
    container.querySelector("[data-ma-word-act]")?.addEventListener("click", wordAct);
  }

  async function openMeterAdmin(homeCodeParam) {
    const first = editableHomes()[0];
    state.homeCode = String(homeCodeParam || activeHomeCode || (first && first.code) || "");
    state.selectedMeterId = "";
    document.body.classList.remove("files-mode");
    await loadData();
  }

  window.openMeterAdmin = openMeterAdmin;
})();
