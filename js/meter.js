(function () {
  "use strict";

  const EDIT_ROLES = new Set(["Правление", "Администратор", "Бухгалтер", "Председатель"]);
  const RESOURCE_TYPES = [
    { id: "electricity", label: "Електроенергія" },
    { id: "heat", label: "Тепло" }
  ];
  const ELECTRICITY_GROUP_ID = "__electricity__";
  const state = {
    homeCode: "",
    meters: [],
    channels: [],
    readings: [],
    values: [],
    selectedMeterId: "",
    readingDate: nearestMonthEndIso(),
    readingDateManual: false,
    actReadingDate: "",
    chartMonths: 12,
    chartDisabledMeters: new Set(),
    chartDisabledChannels: new Set(),
    chartEnabledChannels: new Set(),
    loading: false,
    inputCarryover: null,
    warnTimers: new WeakMap()
  };
  state.mobileView = "input";

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

  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function nearestMonthEndIso() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const previousDiff = Math.abs(today.getTime() - previousMonthEnd.getTime());
    const currentDiff = Math.abs(currentMonthEnd.getTime() - today.getTime());
    return isoDate(currentDiff <= previousDiff ? currentMonthEnd : previousMonthEnd);
  }

  function todayIso() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isoDate(today);
  }

  function currentTimeLabel() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function defaultReadingDate() {
    const meter = selectedMeter();
    if (state.selectedMeterId === ELECTRICITY_GROUP_ID || (meter && meter.resource_type === "electricity")) {
      return nearestMonthEndIso();
    }
    if (meter && meter.resource_type === "heat") return todayIso();
    return nearestMonthEndIso();
  }

  function applyDefaultReadingDate() {
    if (!state.readingDateManual) state.readingDate = defaultReadingDate();
  }

  function monthCodeFromDate(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return 0;
    return d.getFullYear() * 12 + d.getMonth() + 1;
  }

  function dateLabel(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }

  function num(value, fallback) {
    const n = Number(String(value == null ? "" : value).replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function fmt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("uk-UA", { maximumFractionDigits: 4 }) : "";
  }

  function uiText(value) {
    return String(value || "").replace(/(\p{L})-(\p{L})/gu, "$1$2");
  }

  function uiChannelLabel(channel) {
    return uiText(channel && (channel.label || channel.code) || "Канал");
  }

  function readingDelta(current, previous, channel) {
    const currentNum = num(current, NaN);
    const previousNum = num(previous, NaN);
    if (!Number.isFinite(currentNum) || !Number.isFinite(previousNum)) return null;
    let delta = channel && channel.is_reverse ? previousNum - currentNum : currentNum - previousNum;
    const rollover = num(channel && channel.max_value, NaN);
    if (delta < 0 && Number.isFinite(rollover) && rollover > 0) {
      while (delta < 0) delta += rollover;
    }
    return delta;
  }

  function canEditHome(code) {
    return EDIT_ROLES.has(roles && roles[String(code)]);
  }

  function editableHomes() {
    return (homes || []).filter(home => canEditHome(home.code));
  }

  function homeName(code) {
    const home = (homes || []).find(h => String(h.code) === String(code));
    return home ? (home.name || home.org || home.code) : code;
  }

  function homeMeta(code) {
    return Object.assign(
      {},
      String(code || "") === String(activeHomeCode || "") ? { org, adr } : {},
      (homes || []).find(h => String(h.code) === String(code)) || {},
      (window.homeData && window.homeData[String(code || "")]) || {},
      { code: code || "" }
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

  function homeOkpo(code) {
    const home = homeMeta(code);
    const direct = valueByKey(home, ["okpo", "okpo1", "code", "edrpou", "edrpou_code", "ЄДРПОУ"]);
    if (direct) return direct;
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home || {}) : {};
    return valueByKey(map, ["okpo", "okpo1", "code", "edrpou", "edrpou_code", "ЄДРПОУ"]);
  }

  function homeChair(code) {
    const home = homeMeta(code);
    const direct = valueByKey(home, ["Голова", "голова", "головаfull", "ГоловаFull", "chair", "chair_full", "Председатель"]);
    if (direct) return direct;
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home || {}) : {};
    return valueByKey(map, ["Голова", "голова", "головаfull", "ГоловаFull", "chair", "chair_full", "Председатель"]);
  }

  function homePhone(code) {
    const home = homeMeta(code);
    const direct = valueByKey(home, ["tel", "phone", "Телефон", "телефон", "Конт.тел", "Контактний телефон"]);
    if (direct) return direct;
    const map = typeof getReplacementMap === "function" ? getReplacementMap(home || {}) : {};
    return valueByKey(map, ["tel", "phone", "Телефон", "телефон", "Конт.тел", "Контактний телефон"]);
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

  function readingForMeterAt(meterId, readingDate) {
    return state.readings.find(row => String(row.meter_id) === String(meterId) && row.reading_date === readingDate) || null;
  }

  function readingForMeter(meterId) {
    return readingForMeterAt(meterId, state.readingDate);
  }

  function valuesForReading(readingId) {
    return state.values.filter(row => String(row.reading_id) === String(readingId));
  }

  function currentValueFor(channelId, readingId) {
    if (!readingId) return "";
    const found = valuesForReading(readingId).find(row => String(row.channel_id) === String(channelId));
    return found ? found.current_value || "" : "";
  }

  function inputDraftKey(meterId, channelId) {
    return `${String(meterId || "")}:${String(channelId || "")}`;
  }

  function captureInputCarryover(mode) {
    const map = new Map();
    document.querySelectorAll(`[data-ma-reading-row][data-ma-mode="${mode}"]`).forEach(row => {
      const input = row.querySelector('[name="current_value"]');
      if (!input) return;
      map.set(inputDraftKey(row.dataset.meterId, row.dataset.channelId), input.value);
    });
    return map;
  }

  function previousReadingForAt(meterId, readingDate) {
    return state.readings
      .filter(row => String(row.meter_id) === String(meterId) && row.reading_date < readingDate)
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)))[0] || null;
  }

  function previousValueForAt(meterId, channelId, readingDate) {
    const previousReadings = state.readings
      .filter(row => String(row.meter_id) === String(meterId) && row.reading_date < readingDate)
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)));
    for (const reading of previousReadings) {
      const found = state.values.find(row => String(row.reading_id) === String(reading.id) && String(row.channel_id) === String(channelId));
      if (found && String(found.current_value || "").trim() !== "") return found.current_value;
    }
    return "";
  }

  function channelForMeterByCode(meterId, code) {
    const target = String(code || "").trim().toLowerCase();
    return channelsForMeter(meterId).find(channel => String(channel.code || "").trim().toLowerCase() === target) || null;
  }

  function valueForReadingChannelCode(meterId, readingId, code) {
    const channel = channelForMeterByCode(meterId, code);
    return channel ? currentValueFor(channel.id, readingId) : "";
  }

  function daysBetweenDates(fromDate, toDate) {
    const from = new Date(`${fromDate || ""}T00:00:00`);
    const to = new Date(`${toDate || ""}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
  }

  function workTimeUnitMultiplier(meterId, channel, previousReading, previousNumber) {
    const unit = String(channel && channel.input_unit || "").trim().toLowerCase();
    if (unit.includes("дн") || unit.includes("day")) return 1;
    if (unit.includes("год") || unit.includes("hour") || unit === "h" || unit === "hr") return 24;

    const beforePreviousReading = previousReadingForAt(meterId, previousReading && previousReading.reading_date);
    if (!beforePreviousReading) return 1;
    const beforePreviousValue = currentValueFor(channel.id, beforePreviousReading.id);
    const beforePreviousNumber = num(beforePreviousValue, NaN);
    if (!Number.isFinite(beforePreviousNumber)) return 1;
    const previousDays = daysBetweenDates(beforePreviousReading.reading_date, previousReading.reading_date);
    if (!previousDays) return 1;
    const previousChange = Math.abs(previousNumber - beforePreviousNumber);
    const daysError = Math.abs(previousChange - previousDays);
    const hoursError = Math.abs(previousChange - previousDays * 24);
    return hoursError < daysError ? 24 : 1;
  }

  function parseTimeValue(value) {
    const match = String(value || "").trim().match(/^(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return { hours: 0, minutes: 0 };
    const hours = Math.min(23, Math.max(0, Number(match[1]) || 0));
    const minutes = Math.min(59, Math.max(0, Number(match[2]) || 0));
    return { hours, minutes };
  }

  function dateTimeFromValues(dateValue, timeValue) {
    const date = parseDateValue(dateValue);
    if (!date) return null;
    const time = parseTimeValue(timeValue);
    date.setHours(time.hours, time.minutes, 0, 0);
    return date;
  }

  function workTimeDateValue(meterId, reading, fallbackDate) {
    const date = reading ? valueForReadingChannelCode(meterId, reading.id, "current_date") : "";
    return String(date || "").trim() || dateLabel(fallbackDate);
  }

  function workTimeTimeValue(meterId, reading) {
    const time = reading ? valueForReadingChannelCode(meterId, reading.id, "current_time") : "";
    return String(time || "").trim() || "10:00";
  }

  function workTimeStep(meterId, channel, previousReading, previousNumber, readingDate, currentDateValue, currentTimeValue) {
    const unitMultiplier = workTimeUnitMultiplier(meterId, channel, previousReading, previousNumber);
    const previousDate = workTimeDateValue(meterId, previousReading, previousReading && previousReading.reading_date);
    const currentDate = String(currentDateValue || "").trim() || dateLabel(readingDate);
    if (unitMultiplier === 24) {
      const previousTime = workTimeTimeValue(meterId, previousReading);
      const currentTime = String(currentTimeValue || "").trim() || currentTimeLabel();
      const from = dateTimeFromValues(previousDate, previousTime);
      const to = dateTimeFromValues(currentDate, currentTime);
      if (from && to) return Math.max(0, Math.round((to.getTime() - from.getTime()) / 3600000));
    }
    return daysBetweenDates(previousDate, currentDate);
  }

  function signedDaysBetweenDates(fromDate, toDate) {
    const from = parseDateValue(fromDate);
    const to = parseDateValue(toDate);
    if (!from || !to) return null;
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }

  function parseDateValue(value) {
    const text = String(value || "").trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const d = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const d = new Date(`${match[3]}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  function defaultCurrentValueFor(meter, channel, readingDate) {
    const code = String(channel && channel.code || "").trim().toLowerCase();
    if (code === "current_date") return dateLabel(readingDate);
    if (code === "current_time") return currentTimeLabel();
    if (code === "error_hours") return "0";
    if (code === "error_code") return "-";
    if (code === "work_time") {
      const previousReading = previousReadingForAt(meter && meter.id, readingDate);
      if (!previousReading) return "";
      const previousValue = currentValueFor(channel.id, previousReading.id);
      const previousNumber = num(previousValue, NaN);
      if (!Number.isFinite(previousNumber)) return "";
      const step = workTimeStep(meter && meter.id, channel, previousReading, previousNumber, readingDate);
      return fmt(channel && channel.is_reverse ? previousNumber - step : previousNumber + step);
    }
    return "";
  }

  function currentValueOrDefaultFor(meter, channel, readingId, readingDate) {
    const current = currentValueFor(channel.id, readingId);
    if (String(current || "").trim() !== "") return current;
    if (!readingId && state.inputCarryover && state.inputCarryover.has(inputDraftKey(meter && meter.id, channel && channel.id))) {
      return state.inputCarryover.get(inputDraftKey(meter && meter.id, channel && channel.id));
    }
    return defaultCurrentValueFor(meter, channel, readingDate || state.readingDate);
  }

  function previousValueFor(meterId, channelId) {
    return previousValueForAt(meterId, channelId, state.readingDate);
  }

  function historicalDeltasForChannel(meterId, channelId) {
    const channel = channelById(channelId);
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
      const delta = readingDelta(points[i].value, points[i - 1].value, channel);
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
    return (meter && meter.name) || "Новий прилад";
  }

  function resourceLabel(value) {
    return (RESOURCE_TYPES.find(item => item.id === value) || {}).label || value || "";
  }

  function channelLabelWithUnit(channel, unitField) {
    const label = channel.label || channel.code || "";
    const unit = channel[unitField] || "";
    return `${escapeHtml(label)}${unit ? `<small>${escapeHtml(unit)}</small>` : ""}`;
  }

  function heatUnitLabel(unit) {
    return String(unit || "").replace(/m3/gi, "м³");
  }

  function heatChannelLabel(channel) {
    const label = channel.label || channel.code || "";
    const unit = heatUnitLabel(channel.input_unit || "");
    return `${escapeHtml(label)}${unit ? ` <small>${escapeHtml(unit)}</small>` : ""}`;
  }

  function heatActHeaderLabel(channel) {
    const rawLabel = String(channel.label || channel.code || "");
    const label = escapeHtml(rawLabel).replace(/\s+/g, "<br>");
    const unit = heatUnitLabel(channel.input_unit || "");
    return `${label}${unit ? `<br><small>${escapeHtml(unit)}</small>` : ""}`;
  }

  function heatChannelClass(channel) {
    const code = String(channel.code || "").toLowerCase();
    const label = String(channel.label || "").toLowerCase();
    if (/error|помил|current_time|час$/.test(code) || /код помилки|поточний час/.test(label)) return "ma-heat-col-narrow";
    if (/work_time/.test(code) || /час роботи/.test(label)) return "ma-heat-col-small";
    if (/flow|power|temp|hours/.test(code) || /витрата|потуж|температур|годин/.test(label)) return "ma-heat-col-small";
    return "";
  }

  function heatColumnWidth(channel) {
    const code = String(channel.code || "").toLowerCase();
    if (code === "work_time") return "40pt";
    if (code === "error_code") return "36pt";
    if (code === "current_date") return "78pt";
    if (code === "current_time") return "46pt";
    if (code === "error_hours") return "46pt";
    const cls = heatChannelClass(channel);
    if (cls === "ma-heat-col-narrow") return "44pt";
    if (cls === "ma-heat-col-small") return "54pt";
    return "58pt";
  }

  function heatCellStyle(channel) {
    return `width:${heatColumnWidth(channel)};mso-width-source:userset`;
  }

  function heatHeaderCellStyle(channel) {
    return `${heatCellStyle(channel)};font-weight:normal;font-size:${channelShowsDelta(channel) ? "12pt" : "10pt"}`;
  }

  function channelShowsDelta(channel) {
    return (channel.value_type || "number") === "number";
  }

  function heatShowDelta(channel) {
    return channelShowsDelta(channel);
  }

  function channelById(channelId) {
    return state.channels.find(channel => String(channel.id) === String(channelId)) || null;
  }

  function isWorkTimeChannel(channel) {
    return String(channel && channel.code || "").trim().toLowerCase() === "work_time";
  }

  function selectedMeter() {
    if (state.selectedMeterId === ELECTRICITY_GROUP_ID) {
      return state.meters.find(meter => meter.is_active !== false && meter.resource_type === "electricity") || null;
    }
    return state.meters.find(meter => String(meter.id) === String(state.selectedMeterId)) || null;
  }

  function meterById(meterId) {
    return state.meters.find(meter => String(meter.id) === String(meterId)) || null;
  }


  function renderMeterList() {
    if (!state.meters.length) return `<div class="ma-empty">Прилади ще не додані.</div>`;
    const electricMeters = activeMeters("electricity");
    const heatMeters = activeMeters("heat");
    const items = [];
    if (electricMeters.length) {
      items.push(`<button type="button" class="ma-meter-row ${state.selectedMeterId === ELECTRICITY_GROUP_ID ? "is-selected" : ""}" data-ma-select-meter="${ELECTRICITY_GROUP_ID}">
        <span>
          <strong>Електроенергія</strong>
          <small>${electricMeters.length} лічильників</small>
        </span>
      </button>`);
    }
    heatMeters.forEach(meter => {
      const selected = String(meter.id) === String(state.selectedMeterId);
      const channels = readingChannelsFor(meter);
      items.push(`<button type="button" class="ma-meter-row ${selected ? "is-selected" : ""}" data-ma-select-meter="${escapeHtml(meter.id)}">
        <span>
          <strong>Тепло - ${escapeHtml(meterLabel(meter))}</strong>
          <small>${channels.length || 0} каналів</small>
        </span>
      </button>`);
    });
    return items.join("") || `<div class="ma-empty">Немає активних приладів.</div>`;
  }

  function activeMeters(resourceType) {
    return state.meters
      .filter(meter => meter.is_active !== false && (!resourceType || meter.resource_type === resourceType));
  }

  function readingChannelsFor(meter) {
    return channelsForMeter(meter.id).filter(channel => channel.is_active !== false && channel.is_reading !== false);
  }

  function selectedInputMeters() {
    if (state.selectedMeterId === ELECTRICITY_GROUP_ID) return activeMeters("electricity");
    const meter = selectedMeter();
    return meter ? [meter] : [];
  }

  function channelColumnLabel(meter, channel, channelCount) {
    const meterText = meterLabel(meter);
    const channelText = channel.label || channel.code || "";
    const unit = channel.input_unit || "";
    const small = [];
    if (channelCount > 1 && channelText) small.push(channelText);
    if (unit) small.push(unit);
    return `<strong>${escapeHtml(meterText)}</strong>${small.length ? `<small>${escapeHtml(small.join(" · "))}</small>` : ""}`;
  }

  function historyChannelHead(text) {
    const parts = String(text || "").split(" · ");
    const label = parts.shift() || "";
    const unit = parts.join(" · ");
    return `${escapeHtml(label)}${unit ? `<small>${escapeHtml(unit)}</small>` : ""}`;
  }

  function historyHeaderCell(content, showDelta) {
    if (!showDelta) return `<th class="ma-history-channel-head ma-history-no-delta" rowspan="2">${content}</th>`;
    return `<th class="ma-history-channel-head ma-history-has-delta" colspan="2">${content}</th>`;
  }

  function inputCell(meter, channel, index, mode, includeDelta) {
    const reading = readingForMeter(meter.id);
    const current = currentValueOrDefaultFor(meter, channel, reading && reading.id, state.readingDate);
    const previous = previousValueFor(meter.id, channel.id);
    const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
    const showDelta = channelShowsDelta(channel);
    const renderDelta = includeDelta == null ? showDelta : includeDelta;
    const delta = showDelta && current !== "" && previous !== "" ? readingDelta(current, previous, channel) : null;
    const report = delta == null ? null : delta * factor;
    const autoBounds = autoConsumptionBounds(meter.id, channel.id);
    const deltaId = `ma-delta-${index}`;
    return `<td data-ma-reading-row data-ma-mode="${escapeHtml(mode || "desktop")}" data-meter-id="${escapeHtml(meter.id)}" data-channel-id="${escapeHtml(channel.id)}" data-previous="${escapeHtml(previous)}" data-factor="${escapeHtml(factor)}" data-min="${escapeHtml(meter.min_consumption ?? "")}" data-max="${escapeHtml(meter.max_consumption ?? "")}" data-auto-min="${escapeHtml(autoBounds.min)}" data-auto-max="${escapeHtml(autoBounds.max)}" data-delta-target="${escapeHtml(deltaId)}">
      <input name="current_value" value="${escapeHtml(current)}">
      <div class="ma-reading-warning" data-ma-warning hidden></div>
      <span data-ma-report hidden>${escapeHtml(report == null ? "" : fmt(report))}</span>
    </td>${renderDelta ? `<td id="${escapeHtml(deltaId)}" data-ma-delta>${escapeHtml(showDelta && delta != null ? fmt(delta) : "")}</td>` : ""}`;
  }

  function readingInputAttrs(meter, channel, index, mode) {
    const reading = readingForMeter(meter.id);
    const current = currentValueOrDefaultFor(meter, channel, reading && reading.id, state.readingDate);
    const previous = previousValueFor(meter.id, channel.id);
    const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
    const showDelta = channelShowsDelta(channel);
    const delta = showDelta && current !== "" && previous !== "" ? readingDelta(current, previous, channel) : null;
    const autoBounds = autoConsumptionBounds(meter.id, channel.id);
    return {
      current,
      previous,
      showDelta,
      delta,
      attrs: `data-ma-reading-row data-ma-mode="${escapeHtml(mode)}" data-meter-id="${escapeHtml(meter.id)}" data-channel-id="${escapeHtml(channel.id)}" data-previous="${escapeHtml(previous)}" data-factor="${escapeHtml(factor)}" data-min="${escapeHtml(meter.min_consumption ?? "")}" data-max="${escapeHtml(meter.max_consumption ?? "")}" data-auto-min="${escapeHtml(autoBounds.min)}" data-auto-max="${escapeHtml(autoBounds.max)}" data-delta-target="ma-mobile-delta-${escapeHtml(index)}"`
    };
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

  function latestReadingDateForMeter(meterId) {
    const latest = state.readings
      .filter(row => String(row.meter_id) === String(meterId))
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)))[0];
    return latest ? latest.reading_date : "";
  }

  function actDateForMeter(meter) {
    if (!meter || !meter.id) return state.readingDate;
    if (state.actReadingDate && readingForMeterAt(meter.id, state.actReadingDate)) return state.actReadingDate;
    return latestReadingDateForMeter(meter.id) || state.readingDate;
  }

  function readingValueAt(meter, channel, readingDate) {
    const reading = readingForMeterAt(meter.id, readingDate);
    return valueForReading(reading && reading.id, channel.id);
  }

  function historyDatesForMeters(meters) {
    return Array.from(new Set(state.readings
      .filter(row => meters.some(meter => String(meter.id) === String(row.meter_id)))
      .map(row => row.reading_date)))
      .filter(date => date !== state.readingDate)
      .sort((a, b) => String(b).localeCompare(String(a)));
  }

  function renderWideReadingsTable(meters) {
    const pairs = meters.flatMap(meter => {
      const channels = readingChannelsFor(meter);
      return channels.map(channel => ({ meter, channel, channelCount: channels.length, showDelta: channelShowsDelta(channel) }));
    });
    const selected = selectedMeter();
    const selectedDate = selected ? actDateForMeter(selected) : "";
    const dates = historyDatesForMeters(meters);
    const tableColspan = 1 + pairs.reduce((sum, pair) => sum + (pair.showDelta ? 2 : 1), 0);
    return `<table class="ma-table ma-history-table ma-history-table-wide">
      <thead>
        <tr><th rowspan="2">Дата</th>${pairs.map(pair => historyHeaderCell(channelColumnLabel(pair.meter, pair.channel, pair.channelCount), pair.showDelta)).join("")}</tr>
        <tr>${pairs.map(pair => pair.showDelta ? `<th>Покази</th><th>Різниця</th>` : "").join("")}</tr>
      </thead>
      <tbody>
        <tr class="ma-input-history-row">
          <td><input type="date" data-ma-reading-date value="${escapeHtml(state.readingDate)}"></td>
          ${pairs.map((pair, index) => inputCell(pair.meter, pair.channel, index, "desktop", pair.showDelta)).join("")}
        </tr>
        ${dates.map(date => {
          const rowSelected = date === selectedDate;
          return `<tr class="ma-history-row ${rowSelected ? "is-selected" : ""}" data-ma-act-date="${escapeHtml(date)}">
            <td>${escapeHtml(dateLabel(date))}</td>
            ${pairs.map(pair => {
              const value = readingValueAt(pair.meter, pair.channel, date);
              return `<td>${escapeHtml(value ? value.current_value : "")}</td>${pair.showDelta ? `<td>${escapeHtml(value && value.delta_value != null ? fmt(value.delta_value) : "")}</td>` : ""}`;
            }).join("")}
          </tr>`;
        }).join("") || `<tr><td colspan="${tableColspan}" class="ma-empty-cell">Історії ще немає.</td></tr>`}
      </tbody>
    </table>`;
  }

  function renderMeterRowsReadingsTable(meters) {
    const selected = selectedMeter();
    const selectedDate = selected ? actDateForMeter(selected) : "";
    const maxChannels = Math.max(1, ...meters.map(meter => readingChannelsFor(meter).length));
    const dates = historyDatesForMeters(meters);
    const columnShowDelta = Array.from({ length: maxChannels }, (_, index) => meters.some(meter => {
      const channel = readingChannelsFor(meter)[index];
      return channel && channelShowsDelta(channel);
    }));
    const tableColspan = 2 + columnShowDelta.reduce((sum, showDelta) => sum + (showDelta ? 2 : 1), 0);
    const headerPairs = Array.from({ length: maxChannels }, (_, index) => {
      const labels = Array.from(new Set(meters.map(meter => {
        const channel = readingChannelsFor(meter)[index];
        if (!channel) return "";
        return [channel.label || channel.code || `Канал ${index + 1}`, channel.input_unit || ""].filter(Boolean).join(" · ");
      }).filter(Boolean)));
      const label = labels.length === 1 ? labels[0] : `Канал ${index + 1}`;
      return historyHeaderCell(historyChannelHead(label), columnShowDelta[index]);
    }).join("");
    const renderCells = (meter, date, inputBase) => {
      const channels = readingChannelsFor(meter);
      const cells = Array.from({ length: maxChannels }, (_x, index) => {
        const channel = channels[index];
        const showDeltaColumn = columnShowDelta[index];
        if (!channel) return `<td></td>${showDeltaColumn ? `<td></td>` : ""}`;
        if (inputBase != null) return inputCell(meter, channel, inputBase + index, "desktop", showDeltaColumn);
        const showDelta = channelShowsDelta(channel);
        const value = readingValueAt(meter, channel, date);
        return `<td>${escapeHtml(value ? value.current_value : "")}</td>${showDeltaColumn ? `<td>${escapeHtml(showDelta && value && value.delta_value != null ? fmt(value.delta_value) : "")}</td>` : ""}`;
      }).join("");
      return cells;
    };
    return `<table class="ma-table ma-history-table ma-history-table-by-meter">
      <thead>
        <tr><th rowspan="2">Дата</th><th rowspan="2">Прилад</th>${headerPairs}</tr>
        <tr>${Array.from({ length: maxChannels }, (_x, index) => columnShowDelta[index] ? `<th>Покази</th><th>Різниця</th>` : "").join("")}</tr>
      </thead>
      <tbody>
        ${meters.map((meter, meterIndex) => `<tr class="ma-input-history-row">
          ${meterIndex === 0 ? `<td rowspan="${meters.length}"><input type="date" data-ma-reading-date value="${escapeHtml(state.readingDate)}"></td>` : ""}
          <td><strong>${escapeHtml(meterLabel(meter))}</strong></td>
          ${renderCells(meter, state.readingDate, meterIndex * maxChannels)}
        </tr>`).join("")}
        ${dates.flatMap(date => meters.map(meter => {
          const rowSelected = String(meter.id) === String(selected && selected.id) && date === selectedDate;
          return `<tr class="ma-history-row ${rowSelected ? "is-selected" : ""}" data-ma-act-date="${escapeHtml(date)}">
            <td>${escapeHtml(dateLabel(date))}</td>
            <td><strong>${escapeHtml(meterLabel(meter))}</strong></td>
            ${renderCells(meter, date, null)}
          </tr>`;
        })).join("") || `<tr><td colspan="${tableColspan}" class="ma-empty-cell">Історії ще немає.</td></tr>`}
      </tbody>
    </table>`;
  }

  function renderMobileInput(meters) {
    let index = 0;
    return `<section class="ma-mobile-section ma-mobile-input">
      <label class="ma-mobile-date">Дата<input type="date" data-ma-reading-date value="${escapeHtml(state.readingDate)}"></label>
      ${meters.map(meter => {
        const channels = readingChannelsFor(meter);
        return `<article class="ma-mobile-card">
          <div class="ma-mobile-meter-title">
            <strong>${escapeHtml(meterLabel(meter))}</strong>
          </div>
          ${channels.map((channel, channelIndex) => {
            const itemIndex = index++;
            const data = readingInputAttrs(meter, channel, itemIndex, "mobile");
            const channelName = channels.length > 1 ? uiChannelLabel(channel) : "";
            const unit = channel.input_unit || "";
            return `<div class="ma-mobile-channel ${channelIndex % 2 ? "is-alt" : ""}" ${data.attrs}>
              ${channelName ? `<div class="ma-mobile-channel-name">${escapeHtml(channelName)}${unit ? ` <small>${escapeHtml(unit)}</small>` : ""}</div>` : (unit ? `<div class="ma-mobile-channel-name"><small>${escapeHtml(unit)}</small></div>` : "")}
              <div class="ma-mobile-prev">Попереднє: <strong>${escapeHtml(data.previous)}</strong></div>
              <input name="current_value" inputmode="decimal" autocomplete="off" value="${escapeHtml(data.current)}">
              ${data.showDelta ? `<div class="ma-mobile-delta">Різниця: <strong id="ma-mobile-delta-${escapeHtml(itemIndex)}" data-ma-delta>${escapeHtml(data.delta == null ? "" : fmt(data.delta))}</strong></div>` : ""}
              <div class="ma-reading-warning" data-ma-warning hidden></div>
            </div>`;
          }).join("") || `<div class="ma-empty">Немає активних каналів.</div>`}
        </article>`;
      }).join("") || `<div class="ma-empty">Немає активних каналів показань.</div>`}
      <div class="ma-mobile-savebar">
        <button type="button" class="gr-btn gr-btn-primary" data-ma-save-readings>Зберегти показання</button>
      </div>
    </section>`;
  }

  function renderMobileHistory(meters) {
    const electricityWide = state.selectedMeterId === ELECTRICITY_GROUP_ID && meters.length < 6;
    return `<section class="ma-mobile-section ma-mobile-history">
      <div class="ma-history-scroll">
        ${meters.length ? (electricityWide ? renderWideReadingsTable(meters) : renderMeterRowsReadingsTable(meters)) : `<div class="ma-empty">Історії ще немає.</div>`}
      </div>
    </section>`;
  }

  function renderMobileView(meters, selected) {
    const view = ["input", "history", "act", "chart"].includes(state.mobileView) ? state.mobileView : "input";
    return `<div class="ma-mobile-view">
      <div class="ma-mobile-switch">
        <button type="button" class="${view === "input" ? "is-selected" : ""}" data-ma-mobile-view="input">Введення</button>
        <button type="button" class="${view === "history" ? "is-selected" : ""}" data-ma-mobile-view="history">Історія</button>
        <button type="button" class="${view === "act" ? "is-selected" : ""}" data-ma-mobile-view="act">Акт</button>
        <button type="button" class="${view === "chart" ? "is-selected" : ""}" data-ma-mobile-view="chart">Графік</button>
      </div>
      ${view === "history" ? renderMobileHistory(meters) : ""}
      ${view === "act" ? `<section class="ma-mobile-section ma-mobile-act">${renderAct(selected)}</section>` : ""}
      ${view === "chart" ? `<section class="ma-mobile-section ma-mobile-chart">${renderMeterChart()}</section>` : ""}
      ${view === "input" ? renderMobileInput(meters) : ""}
    </div>`;
  }

  function currentReadingSnapshot(meter, readingDate) {
    const date = readingDate || state.readingDate;
    const channels = channelsForMeter(meter.id).filter(ch => ch.is_active !== false && ch.is_reading !== false);
    const rows = channels.map(channel => {
      const reading = readingForMeterAt(meter.id, date);
      const saved = valueForReading(reading && reading.id, channel.id);
      const current = currentValueOrDefaultFor(meter, channel, reading && reading.id, date);
      const previous = previousValueForAt(meter.id, channel.id, date);
      const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
      const showDelta = channelShowsDelta(channel);
      const savedDelta = saved && saved.delta_value != null ? num(saved.delta_value, NaN) : NaN;
      const delta = showDelta && Number.isFinite(savedDelta) ? savedDelta : (showDelta && current !== "" && previous !== "" ? readingDelta(current, previous, channel) : null);
      return {
        channel,
        previous,
        current,
        showDelta,
        delta,
        report: delta == null ? null : delta * factor
      };
    });
    return { channels, rows };
  }

  function latestPreviousReading(meterId) {
    const date = actDateForMeter({ id: meterId });
    return state.readings
      .filter(row => String(row.meter_id) === String(meterId) && row.reading_date < date)
      .sort((a, b) => String(b.reading_date).localeCompare(String(a.reading_date)))[0] || null;
  }

  function valueForReading(readingId, channelId) {
    if (!readingId) return null;
    return state.values.find(row => String(row.reading_id) === String(readingId) && String(row.channel_id) === String(channelId)) || null;
  }

  function monthYearLabel(value) {
    const d = new Date(`${value || state.readingDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
  }

  function actTools() {
    return `<div class="ma-act-tools no-print">
      <button type="button" class="gr-btn" data-ma-print-act>Друк</button>
      <button type="button" class="gr-btn" data-ma-pdf-act>PDF</button>
      <button type="button" class="gr-btn" data-ma-word-act>Word</button>
    </div>`;
  }

  function heatActRows(meter, readingDate) {
    const previousReading = latestPreviousReading(meter.id);
    const currentReading = readingForMeterAt(meter.id, readingDate);
    const channels = channelsForMeter(meter.id).filter(ch => ch.is_active !== false && ch.is_reading !== false);
    const rows = channels.map(channel => {
      const previous = valueForReading(previousReading && previousReading.id, channel.id);
      const current = valueForReading(currentReading && currentReading.id, channel.id);
      const previousValue = previous ? previous.current_value : "";
      const currentValue = current && String(current.current_value || "").trim() !== "" ? current.current_value : defaultCurrentValueFor(meter, channel, readingDate);
      const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
      const showDelta = heatShowDelta(channel);
      const savedDelta = current && current.delta_value != null ? num(current.delta_value, NaN) : NaN;
      const delta = showDelta && Number.isFinite(savedDelta) ? savedDelta : (showDelta && currentValue !== "" && previousValue !== "" ? readingDelta(currentValue, previousValue, channel) : null);
      return {
        channel,
        previous: previousValue,
        current: currentValue,
        showDelta,
        delta,
        report: delta == null ? null : delta * factor
      };
    });
    return { previousReading, currentReading, rows };
  }

  function heatEnergyDeltaGcal(rows) {
    const energyRow = (rows || []).find(row => String(row.channel && row.channel.code || "").toLowerCase() === "energy");
    if (!energyRow || energyRow.delta == null) return null;
    const unit = String((energyRow.channel && (energyRow.channel.input_unit || energyRow.channel.report_unit)) || "").trim().toLowerCase();
    const factorByUnit = {
      "gcal": 1,
      "гкал": 1,
      "gj": 1000000 / 4186800,
      "гдж": 1000000 / 4186800,
      "mj": 1000 / 4186800,
      "мдж": 1000 / 4186800,
      "kj": 1 / 4186800,
      "кдж": 1 / 4186800,
      "mcal": 0.001,
      "мкал": 0.001,
      "kcal": 0.000001,
      "ккал": 0.000001
    };
    const factor = factorByUnit[unit] == null ? 1 : factorByUnit[unit];
    return energyRow.delta * factor;
  }

  function renderHeatAct(meter) {
    const actDate = actDateForMeter(meter);
    const snap = heatActRows(meter, actDate);
    const home = homeName(meter.home_code);
    const chair = homeChair(meter.home_code);
    const phone = homePhone(meter.home_code);
    const okpo = homeOkpo(meter.home_code);
    const cols = snap.rows.map(row => row.channel);
    const energyGcal = heatEnergyDeltaGcal(snap.rows);
    const previousDate = snap.previousReading ? snap.previousReading.reading_date : "";
    return `${actTools()}
    <div class="gr-sheet gr-sheet-landscape ma-act-sheet ma-act-heat-sheet">
      <div class="ma-act ma-act-heat">
        <h2>Відомість обліку споживання теплової енергії</h2>
        <h3>${escapeHtml(home)}</h3>
        <div class="ma-act-subtitle">Тип теплолічильника ${escapeHtml(meter.meter_type || meter.name || "")}</div>
        <div class="ma-act-line">
          <span>Дата первинного приймання ${escapeHtml(dateLabel(meter.contract_date || ""))}</span>
          <span>Теплові втрати: ${escapeHtml(meter.heat_loss || "____________________")}</span>
        </div>
        <table class="ma-act-table ma-heat-table">
          <colgroup>
            <col class="ma-heat-col-date" style="width:78pt">
            ${cols.map(ch => `<col class="${escapeHtml(heatChannelClass(ch))}" style="width:${escapeHtml(heatColumnWidth(ch))}">`).join("")}
          </colgroup>
          <thead>
            <tr>
              <th style="width:78pt;mso-width-source:userset;font-weight:normal">Дата</th>
              ${cols.map(ch => `<th class="${channelShowsDelta(ch) ? "ma-heat-delta-head" : "ma-heat-no-delta-head"}" style="${escapeHtml(heatHeaderCellStyle(ch))}">${heatActHeaderLabel(ch)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ma-nowrap" nowrap style="width:78pt;mso-width-source:userset;white-space:nowrap">${escapeHtml(dateLabel(previousDate))}</td>
              ${snap.rows.map(row => `<td style="${escapeHtml(heatCellStyle(row.channel))}">${escapeHtml(row.previous)}</td>`).join("")}
            </tr>
            <tr>
              <td class="ma-nowrap" nowrap style="width:78pt;mso-width-source:userset;white-space:nowrap">${escapeHtml(dateLabel(actDate))}</td>
              ${snap.rows.map(row => `<td style="${escapeHtml(heatCellStyle(row.channel))}">${escapeHtml(row.current)}</td>`).join("")}
            </tr>
            <tr class="ma-act-total-row">
              <th style="width:78pt;mso-width-source:userset">Різниця:</th>
              ${snap.rows.map(row => `<th style="${escapeHtml(heatCellStyle(row.channel))}">${escapeHtml(row.showDelta ? (row.delta == null ? "" : fmt(row.delta)) : "-")}</th>`).join("")}
            </tr>
          </tbody>
        </table>
        <div class="ma-act-total">Gcal: <strong>${escapeHtml(energyGcal == null ? "" : fmt(energyGcal))}</strong></div>
        <div class="ma-act-signatures ma-act-signatures-wide">
          <div>Здав: Голова правління ${escapeHtml(home)}<br><br>______________________________/${escapeHtml(chair)}<br>Конт.тел: ${escapeHtml(phone)}<br><span class="ma-ecp-marker">ECP ${escapeHtml(okpo)}</span></div>
          <div>Прийняв ________________________________<br><br>Контролер теплозбуту:____________________</div>
        </div>
      </div>
    </div>`;
  }

  function mainReadingChannel(meter) {
    return channelsForMeter(meter.id).find(ch => ch.is_active !== false && ch.is_reading !== false && (ch.value_type || "number") === "number") || null;
  }

  function electricityActRows(readingDate) {
    return state.meters
      .filter(meter => meter.is_active !== false && meter.resource_type === "electricity")
      .map(meter => {
        const channel = mainReadingChannel(meter);
        const reading = readingForMeterAt(meter.id, readingDate);
        const value = channel ? valueForReading(reading && reading.id, channel.id) : null;
        const currentValue = value ? value.current_value || "" : "";
        const previousValue = channel ? previousValueForAt(meter.id, channel.id, readingDate) : "";
        const savedDelta = value && value.delta_value != null ? num(value.delta_value, NaN) : NaN;
        const delta = Number.isFinite(savedDelta) ? savedDelta : (currentValue !== "" && previousValue !== "" ? readingDelta(currentValue, previousValue, channel) : null);
        const factor = num(channel && channel.unit_factor, 1) * num(meter.calculation_factor, 1);
        return {
          meter,
          channel,
          current: currentValue,
          previous: previousValue,
          factor,
          report: delta == null ? null : delta * factor
        };
      })
      .filter(row => row.channel);
  }

  function renderElectricityAct(meter) {
    const actDate = actDateForMeter(meter);
    const rows = electricityActRows(actDate);
    const home = homeName(meter.home_code);
    const chair = homeChair(meter.home_code);
    const total = rows.reduce((sum, row) => sum + (Number(row.report) || 0), 0);
    return `${actTools()}
    <div class="gr-sheet gr-sheet-landscape ma-act-sheet ma-act-electric-sheet">
      <div class="ma-act ma-act-electric">
        <table class="ma-act-plain-table ma-act-electric-top"><tbody><tr>
          <td>Код ЄДРПОУ: <strong>${escapeHtml(homeOkpo(meter.home_code))}</strong></td>
          <td>Особовий рахунок: <strong>${escapeHtml(meter.operator_account || "")}</strong></td>
        </tr></tbody></table>
        <h2>Звіт про покази засобів обліку електричної енергії</h2>
        <h3>${escapeHtml(home)}</h3>
        <div class="ma-act-subtitle">відповідно до договору про надання послуг з розподілу електричної енергії № ${escapeHtml(meter.contract_number || "")} від ${escapeHtml(dateLabel(meter.contract_date || ""))}</div>
        <div class="ma-act-subtitle">за ${escapeHtml(monthYearLabel(actDate))}</div>
        <table class="ma-act-table ma-electric-table">
          <colgroup>
            <col class="ma-el-col-no">
            <col class="ma-el-col-date">
            <col class="ma-el-col-name">
            <col class="ma-el-col-eic">
            <col class="ma-el-col-meter">
            <col class="ma-el-col-type">
            <col class="ma-el-col-value">
            <col class="ma-el-col-value">
            <col class="ma-el-col-factor">
            <col class="ma-el-col-consumption">
          </colgroup>
          <thead>
            <tr>
              <th>№ з/п</th>
              <th>Дата зняття показів</th>
              <th>Найменування приєднання та об’єкту</th>
              <th>EIC-код</th>
              <th>№ електро-<br>лічильника</th>
              <th>Тип вимірювань</th>
              <th>Поточні</th>
              <th>Поперед-<br>ні</th>
              <th class="ma-el-factor-head">Розрахун-<br>ковий коефі-<br>цієнт</th>
              <th>Обсяг<br>споживання,<br>кВт*г</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `<tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(dateLabel(actDate))}</td>
              <td>${escapeHtml([row.meter.connection_name, row.meter.object_name].filter(Boolean).join("; ") || row.meter.name || "")}</td>
              <td>${escapeHtml(row.meter.eic_code || "")}</td>
              <td>${escapeHtml(row.meter.meter_type || "")}${row.meter.meter_type && row.meter.meter_number ? "<br>" : ""}${escapeHtml(row.meter.meter_number || "")}</td>
              <td>${escapeHtml(row.meter.measurement_type || "")}</td>
              <td><strong>${escapeHtml(row.current)}</strong></td>
              <td>${escapeHtml(row.previous)}</td>
              <td>${escapeHtml(fmt(row.factor))}</td>
              <td><strong>${escapeHtml(row.report == null ? "" : fmt(row.report))}</strong></td>
            </tr>`).join("")}
            <tr class="ma-act-total-row"><td colspan="9">Разом:</td><td><strong>${escapeHtml(fmt(total))}</strong></td></tr>
          </tbody>
        </table>
        <table class="ma-act-plain-table ma-act-sign-table"><tbody><tr>
          <td>Голова правління___________________/${escapeHtml(chair)}<br>${escapeHtml(dateLabel(actDate))}<span class="ma-ecp-anchor" aria-hidden="true"></span></td>
          <td>Оператор системи розподілу прийняв:<br><br>________________ / ____________________</td>
        </tr></tbody></table>
      </div>
    </div>`;
  }

  function renderAct(meter) {
    if (!meter || !meter.id) return "";
    if (meter.resource_type === "heat") return renderHeatAct(meter);
    if (meter.resource_type === "electricity") return renderElectricityAct(meter);
    const actDate = actDateForMeter(meter);
    const snap = currentReadingSnapshot(meter, actDate);
    const total = snap.rows.reduce((sum, row) => sum + (Number(row.report) || 0), 0);
    const home = homeName(meter.home_code);
    return `${actTools()}
    <div class="gr-sheet gr-sheet-landscape ma-act-sheet">
      <div class="ma-act">
        <div class="ma-act-top">
          <div>
            <h2>Акт фіксації показань приладу обліку</h2>
            <div>${escapeHtml(home)}</div>
          </div>
          <div class="ma-act-date">${escapeHtml(dateLabel(actDate))}</div>
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
            <td>${channelLabelWithUnit(row.channel, "report_unit")}</td>
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

  function chartMeters() {
    if (state.selectedMeterId === ELECTRICITY_GROUP_ID) {
      const main = activeMeters("electricity")
        .filter(meter => !["resident", "control"].includes(String(meter.role || "").toLowerCase()));
      return main.length ? main : activeMeters("electricity");
    }
    const meter = selectedMeter();
    return meter ? [meter] : [];
  }

  function chartChannelsFor(meter) {
    return readingChannelsFor(meter).filter(channel => !chartChannelHidden(channel));
  }

  function chartChannelKey(channel) {
    return String(channel.code || channel.id || "");
  }

  function chartChannelHidden(channel) {
    return /date|hours|time|error/i.test(String(channel && channel.code || ""));
  }

  function chartScaleKey(point) {
    const code = String(point.channel && point.channel.code || "");
    const parts = code.split("_").filter(Boolean);
    const unit = chartChannelUnit(point.channel);
    if (parts.length > 1) return `${parts[parts.length - 1]}:${unit}`;
    return `${code || point.channelKey}:${unit}`;
  }

  function chartSeriesKey(point) {
    return `${point.meter && point.meter.id}:${point.channel && (point.channel.id || point.channel.code)}`;
  }

  function stableColorForKey(key) {
    const colors = ["#1f5a9d", "#16a34a", "#dc2626", "#7c3aed", "#ea580c", "#0891b2", "#4b5563", "#be123c"];
    let hash = 0;
    String(key || "").split("").forEach(char => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    return colors[Math.abs(hash) % colors.length];
  }

  function chartChannelUnit(channel) {
    return channelShowsDelta(channel) ? (channel.report_unit || channel.input_unit || "") : (channel.input_unit || channel.report_unit || "");
  }

  function chartChannelDefaultEnabled(channel, meter) {
    const code = String(channel.code || "").toLowerCase();
    if (meter && meter.resource_type === "electricity") return channelShowsDelta(channel) && /^zone_\d+$/.test(code);
    if (meter && meter.resource_type === "heat") return code === "energy";
    return channelShowsDelta(channel);
  }

  function chartChannelEnabled(option) {
    const key = String(option.key || "");
    if (state.chartEnabledChannels.has(key)) return true;
    if (state.chartDisabledChannels.has(key)) return false;
    return !!option.defaultEnabled;
  }

  function monthDiffInclusive(fromDate, toDate) {
    const from = new Date(`${fromDate || ""}T00:00:00`);
    const to = new Date(`${toDate || ""}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    return Math.max(1, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1);
  }

  function addMonthsIso(dateValue, months) {
    const d = new Date(`${dateValue || ""}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    d.setMonth(d.getMonth() + months);
    return isoDate(d);
  }

  function chartRawPoints(meters) {
    const points = [];
    meters.forEach(meter => {
      chartChannelsFor(meter).forEach(channel => {
        const readings = state.readings
          .filter(row => String(row.meter_id) === String(meter.id))
          .sort((a, b) => String(a.reading_date).localeCompare(String(b.reading_date)));
        const values = readings.map(reading => {
          const value = valueForReading(reading.id, channel.id);
          const current = value && String(value.current_value || "").trim() !== "" ? num(value.current_value, NaN) : NaN;
          const delta = value && value.delta_value != null ? num(value.delta_value, NaN) : NaN;
          return { reading, current, delta };
        }).filter(item => Number.isFinite(item.current));
        const showDelta = channelShowsDelta(channel);
        if (!showDelta) {
          values.forEach(item => {
            points.push({
              meter,
              channel,
              channelKey: chartChannelKey(channel),
              unit: chartChannelUnit(channel),
              date: item.reading.reading_date,
              days: null,
              delta: null,
              value: item.current,
              kind: "value"
            });
          });
          return;
        }
        for (let index = 1; index < values.length; index += 1) {
          const prev = values[index - 1];
          const curr = values[index];
          const days = daysBetweenDates(prev.reading.reading_date, curr.reading.reading_date);
          const delta = Number.isFinite(curr.delta) ? curr.delta : readingDelta(curr.current, prev.current, channel);
          if (!days || !Number.isFinite(delta)) continue;
          const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
          points.push({
            meter,
            channel,
            channelKey: chartChannelKey(channel),
            unit: chartChannelUnit(channel),
            date: curr.reading.reading_date,
            days,
            delta,
            value: delta * factor / days * 30.44,
            kind: "monthly"
          });
        }
      });
    });
    return points.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function chartScope(meters) {
    const dates = state.readings
      .filter(row => meters.some(meter => String(meter.id) === String(row.meter_id)))
      .map(row => row.reading_date)
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
    if (dates.length < 2) return { hasSlider: false, maxMonths: 12, selectedMonths: 12, cutoff: "" };
    const maxMonths = monthDiffInclusive(dates[0], dates[dates.length - 1]);
    const hasSlider = maxMonths > 12;
    const selectedMonths = hasSlider ? Math.min(Math.max(Number(state.chartMonths) || 12, 1), maxMonths) : maxMonths;
    const cutoff = addMonthsIso(dates[dates.length - 1], -selectedMonths);
    return { hasSlider, maxMonths, selectedMonths, cutoff };
  }

  function chartChannelOptions(meters) {
    const byKey = new Map();
    meters.forEach(meter => {
      chartChannelsFor(meter).forEach(channel => {
        const key = chartChannelKey(channel);
        const existing = byKey.get(key);
        const defaultEnabled = chartChannelDefaultEnabled(channel, meter);
        if (!existing) byKey.set(key, {
          key,
          label: uiChannelLabel(channel) || key,
          unit: chartChannelUnit(channel),
          valueType: channel.value_type || "number",
          showDelta: channelShowsDelta(channel),
          defaultEnabled
        });
        else existing.defaultEnabled = existing.defaultEnabled || defaultEnabled;
      });
    });
    return Array.from(byKey.values()).sort((a, b) => String(a.label).localeCompare(String(b.label), "uk"));
  }

  function renderChartSvg(points) {
    const width = 980;
    const height = 310;
    const pad = { left: 54, right: 18, top: 18, bottom: 54 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const dates = Array.from(new Set(points.map(point => point.date))).sort((a, b) => String(a).localeCompare(String(b)));
    const dateTimes = dates.map(date => new Date(`${date}T00:00:00`).getTime()).filter(time => Number.isFinite(time));
    const minTime = Math.min(...dateTimes);
    const maxTime = Math.max(...dateTimes);
    const x = date => {
      const time = new Date(`${date}T00:00:00`).getTime();
      if (!Number.isFinite(time) || !Number.isFinite(minTime) || !Number.isFinite(maxTime) || minTime === maxTime) return pad.left + plotW / 2;
      return pad.left + (time - minTime) / (maxTime - minTime) * plotW;
    };
    const bySeries = new Map();
    points.forEach(point => {
      const key = chartSeriesKey(point);
      const arr = bySeries.get(key) || [];
      arr.push(point);
      bySeries.set(key, arr);
    });
    const maxByScale = new Map();
    points.forEach(point => {
      const key = chartScaleKey(point);
      maxByScale.set(key, Math.max(maxByScale.get(key) || 1, Math.max(0, Number(point.value) || 0)));
    });
    const seriesList = Array.from(bySeries.values()).map(series => {
      const scaleKey = chartScaleKey(series[0]);
      const maxValue = Math.max(1, maxByScale.get(scaleKey) || 1);
      return { series, maxValue, color: stableColorForKey(chartSeriesKey(series[0])) };
    });
    const y = (value, maxValue) => pad.top + plotH - Math.max(0, Number(value) || 0) / maxValue * plotH;
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    return `<svg class="ma-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Графік споживання">
      ${ticks.map(part => {
        const yy = pad.top + plotH - part * plotH;
        return `<line x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}" class="ma-chart-grid"></line><text x="${pad.left - 8}" y="${yy + 4}" class="ma-chart-axis" text-anchor="end">${escapeHtml(Math.round(part * 100))}%</text>`;
      }).join("")}
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" class="ma-chart-axis-line"></line>
      <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" class="ma-chart-axis-line"></line>
      ${dates.map((date, index) => {
        const xx = x(date);
        if (dates.length > 12 && index % Math.ceil(dates.length / 12) !== 0 && index !== dates.length - 1) return "";
        return `<text x="${xx}" y="${height - 24}" class="ma-chart-axis" text-anchor="middle">${escapeHtml(dateLabel(date).slice(0, 5))}</text>`;
      }).join("")}
      ${seriesList.map(({ series, maxValue, color }, seriesIndex) => {
        const isMonthly = series[0] && series[0].kind === "monthly";
        if (isMonthly) {
          const monthlyCount = Math.max(1, seriesList.filter(item => item.series[0] && item.series[0].kind === "monthly").length);
          const monthlyIndex = seriesList.slice(0, seriesIndex).filter(item => item.series[0] && item.series[0].kind === "monthly").length;
          const step = dates.length <= 1 ? plotW : plotW / Math.max(1, dates.length - 1);
          const barW = Math.max(5, Math.min(28, step / (monthlyCount + 1)));
          return series.map(point => {
            const xx = x(point.date) - (monthlyCount * barW) / 2 + monthlyIndex * barW;
            const yy = y(point.value, maxValue);
            const h = pad.top + plotH - yy;
            return `<rect x="${xx}" y="${yy}" width="${barW - 2}" height="${Math.max(1, h)}" fill="${color}" opacity="0.82"><title>${escapeHtml(`${dateLabel(point.date)} · ${meterLabel(point.meter)} · ${uiChannelLabel(point.channel)}: ${fmt(point.value)} / міс.; різниця ${fmt(point.delta)} за ${point.days} дн.`)}</title></rect>`;
          }).join("");
        }
        const path = series.map(point => `${x(point.date)},${y(point.value, maxValue)}`).join(" ");
        return `<polyline points="${path}" fill="none" stroke="${color}" stroke-width="2.5"></polyline>${series.map(point => {
          const detail = point.kind === "monthly"
            ? `${fmt(point.value)} / міс.; різниця ${fmt(point.delta)} за ${point.days} дн.`
            : `${fmt(point.value)} ${point.unit || ""}`;
          return `<circle cx="${x(point.date)}" cy="${y(point.value, maxValue)}" r="3.5" fill="${color}"><title>${escapeHtml(`${dateLabel(point.date)} · ${meterLabel(point.meter)} · ${uiChannelLabel(point.channel)}: ${detail}`)}</title></circle>`;
        }).join("")}`;
      }).join("")}
    </svg>`;
  }

  function renderChartLegend(points) {
    const bySeries = new Map();
    points.forEach(point => {
      const key = chartSeriesKey(point);
      const arr = bySeries.get(key) || [];
      arr.push(point);
      bySeries.set(key, arr);
    });
    const maxByScale = new Map();
    points.forEach(point => {
      const key = chartScaleKey(point);
      maxByScale.set(key, Math.max(maxByScale.get(key) || 1, Math.max(0, Number(point.value) || 0)));
    });
    return `<div class="ma-chart-legend">${Array.from(bySeries.values()).map(series => {
      const sample = series[0];
      const maxValue = Math.max(1, maxByScale.get(chartScaleKey(sample)) || 1);
      const suffix = sample.kind === "monthly" ? "/міс." : (sample.unit || "");
      const shape = sample.kind === "monthly" ? "стовпці" : "лінія";
      return `<span><i style="background:${stableColorForKey(chartSeriesKey(sample))}"></i>${escapeHtml(meterLabel(sample.meter))} · ${escapeHtml(uiChannelLabel(sample.channel))}: max ${escapeHtml(fmt(maxValue))} ${escapeHtml(suffix)} <small>${shape}</small></span>`;
    }).join("")}</div>`;
  }

  function renderMeterChart() {
    const meters = chartMeters();
    const numberChannels = chartChannelOptions(meters);
    if (!meters.length || !numberChannels.length) return `<div class="ma-panel ma-chart-panel no-print"><h3>Графік</h3><div class="ma-empty">Немає числових каналів для графіка.</div></div>`;
    const scope = chartScope(meters);
    const visibleMeters = meters.filter(meter => !state.chartDisabledMeters.has(String(meter.id)));
    const enabledChannelKeys = new Set(numberChannels.filter(option => chartChannelEnabled(option)).map(option => option.key));
    const points = chartRawPoints(visibleMeters)
      .filter(point => enabledChannelKeys.has(point.channelKey))
      .filter(point => !scope.cutoff || point.date >= scope.cutoff);
    return `<div class="ma-panel ma-chart-panel no-print">
      <div class="ma-chart-head">
        <h3>Графік споживання</h3>
        ${scope.hasSlider ? `<label>Період: <strong>${scope.selectedMonths} міс.</strong><input type="range" min="1" max="${escapeHtml(scope.maxMonths)}" value="${escapeHtml(scope.selectedMonths)}" data-ma-chart-months></label>` : `<span>Вся історія</span>`}
      </div>
      <div class="ma-chart-controls">
        <div>${meters.length > 1 ? meters.map(meter => `<label><input type="checkbox" data-ma-chart-meter="${escapeHtml(meter.id)}" ${state.chartDisabledMeters.has(String(meter.id)) ? "" : "checked"}> ${escapeHtml(meterLabel(meter))}</label>`).join("") : ""}</div>
        <div>${numberChannels.length > 1 ? numberChannels.map(channel => `<label><input type="checkbox" data-ma-chart-channel="${escapeHtml(channel.key)}" ${chartChannelEnabled(channel) ? "checked" : ""}> ${escapeHtml(channel.label)}${channel.unit ? ` <small>${escapeHtml(channel.unit)}</small>` : ""}${channel.showDelta ? ` <small>міс.</small>` : ""}</label>`).join("") : ""}</div>
      </div>
      ${points.length ? `${renderChartSvg(points)}${renderChartLegend(points)}` : `<div class="ma-empty">Недостатньо даних для графіка за вибраний період.</div>`}
    </div>`;
  }

  function renderReadings() {
    const meters = selectedInputMeters();
    const electricityWide = state.selectedMeterId === ELECTRICITY_GROUP_ID && meters.length < 6;
    return `<div class="ma-panel ma-readings ma-desktop-readings">
      <div class="ma-form-head">
        <h3>Показання та історія</h3>
        <div class="ma-reading-tools">
          <button type="button" class="gr-btn gr-btn-primary" data-ma-save-readings>Зберегти показання</button>
        </div>
      </div>
      <div class="ma-history-scroll">
        ${meters.length ? (electricityWide ? renderWideReadingsTable(meters) : renderMeterRowsReadingsTable(meters)) : `<div class="ma-empty">Немає активних каналів показань.</div>`}
      </div>
    </div>`;
  }

  function renderApp() {
    const selected = selectedMeter();
    return `<div class="gr-app ma-app">
      <div class="ma-toolbar">
        <h2>Прилади обліку</h2>
        ${state.meters.length ? `<div class="ma-meter-tabs">${renderMeterList()}</div>` : ""}
      </div>
      ${state.loading ? `<div class="od-loading">Завантаження...</div>` : `
        <div class="ma-layout ma-layout-single">
          <main class="ma-main">
            ${renderReadings()}
            ${renderMobileView(selectedInputMeters(), selected)}
            <div class="ma-desktop-act">${renderAct(selected)}</div>
            <div class="ma-desktop-chart">${renderMeterChart()}</div>
          </main>
        </div>
      `}
    </div>`;
  }

  function render() {
    const container = ensureRenderContainer();
    if (!container) return;
    try {
      container.innerHTML = renderApp();
      bindEvents(container);
    } catch (err) {
      console.error(err);
      state.loading = false;
      container.innerHTML = `<div class="gr-app ma-app"><div class="ma-toolbar"><h2>Прилади обліку</h2></div><div class="ma-empty">Не вдалося показати прилади обліку. Подивіться помилку в консолі браузера.</div></div>`;
    }
  }

  async function loadData() {
    if (!state.homeCode) return;
    state.loading = true;
    render();
    try {
      const { data: metersData, error: metersError } = await client
        .from("meters")
        .select("*")
        .eq("home_code", state.homeCode)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (metersError) {
        console.error(metersError);
        show("Не вдалося завантажити прилади обліку", "err", 7000);
        state.meters = [];
        return;
      }
      state.meters = metersData || [];
      const hasElectricity = state.meters.some(meter => meter.is_active !== false && meter.resource_type === "electricity");
      const selectedExists = state.selectedMeterId === ELECTRICITY_GROUP_ID
        ? hasElectricity
        : state.meters.some(m => String(m.id) === String(state.selectedMeterId));
      if (!selectedExists) {
        const firstHeat = state.meters.find(meter => meter.is_active !== false && meter.resource_type === "heat");
        state.selectedMeterId = hasElectricity ? ELECTRICITY_GROUP_ID : (firstHeat ? firstHeat.id : (state.meters[0] ? state.meters[0].id : ""));
      }
      applyDefaultReadingDate();
      await loadChildren();
      state.inputCarryover = null;
    } catch (err) {
      console.error(err);
      state.meters = [];
      state.channels = [];
      state.readings = [];
      state.values = [];
      show("Не вдалося завантажити прилади обліку", "err", 7000);
    } finally {
      state.loading = false;
      render();
    }
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
    const mode = window.matchMedia && window.matchMedia("(max-width: 1024px)").matches ? "mobile" : "desktop";
    const rows = Array.from(document.querySelectorAll(`[data-ma-reading-row][data-ma-mode="${mode}"]`));
    const warnings = collectValidationWarnings(rows, true);
    if (warnings.length) {
      const message = `${warnings.join("\n")}\n\nВсе одно зберегти?`;
      const ok = typeof showConfirmDialog === "function"
        ? await showConfirmDialog({
          title: "Попередження при збереженні",
          message,
          okText: "Зберегти",
          cancelText: "Скасувати"
        })
        : confirm(message);
      if (!ok) {
        show("Збереження скасовано", "warn");
        return;
      }
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
          const channel = channelById(row.dataset.channelId);
          const showDelta = channelShowsDelta(channel || {});
          const delta = showDelta && current !== "" && previous !== "" ? readingDelta(current, previous, channel) : null;
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
      state.actReadingDate = state.readingDate;
      await loadChildren();
      render();
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
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page{size:A4 landscape;margin:0}
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;width:297mm;height:210mm;overflow:hidden;background:#fff;color:#111;font-family:Arial,sans-serif}
      .ma-act-print-page{width:297mm;height:210mm;padding:28px 32px;overflow:hidden}
      .ma-act{width:100%;font-size:14px;color:#111}
      h2,h3{text-align:center;margin:0}
      h2{font-size:22px;line-height:1.25}
      h3{font-size:20px;margin-top:4px}
      .ma-act-subtitle{text-align:center;margin-top:10px;font-size:16px}
      .ma-act-plain-table{width:100%;border-collapse:collapse;margin:16px 0 8px}
      .ma-act-plain-table td{width:50%;border:0!important;padding:0!important;vertical-align:top}
      .ma-act-plain-table td:last-child{text-align:right}
      .ma-act-sign-table{margin-top:44px}
      .ma-act-table{width:100%;border-collapse:collapse;font-size:14px}
      .ma-act-table th,.ma-act-table td{border:1px solid #555;padding:7px 8px}
      .ma-act-table th{background:#edf2f7}
      .ma-heat-table,.ma-electric-table{margin-top:16px;font-size:14px;table-layout:fixed}
      .ma-heat-table th,.ma-heat-table td,.ma-electric-table th,.ma-electric-table td{border-color:#111;text-align:center;vertical-align:middle}
      .ma-heat-table th{font-size:11px;line-height:1.05;overflow-wrap:anywhere;word-break:break-word}
      .ma-heat-table td{font-size:13px}
      .ma-heat-table small{font-size:10px;line-height:1}
      .ma-heat-table .ma-heat-col-date{width:88px}
      .ma-heat-table .ma-heat-col-small{width:76px}
      .ma-heat-table .ma-heat-col-narrow{width:64px}
      .ma-electric-table th:nth-child(3),.ma-electric-table td:nth-child(3){text-align:left}
      .ma-electric-table .ma-el-col-no{width:28px}
      .ma-electric-table .ma-el-col-date{width:82px}
      .ma-electric-table .ma-el-col-name{width:210px}
      .ma-electric-table .ma-el-col-eic{width:150px}
      .ma-electric-table .ma-el-col-meter{width:110px}
      .ma-electric-table .ma-el-col-type{width:90px}
      .ma-electric-table .ma-el-col-value{width:72px}
      .ma-electric-table .ma-el-col-factor{width:68px}
      .ma-electric-table .ma-el-col-consumption{width:94px}
      .ma-electric-table th{font-size:13px;line-height:1.08;overflow-wrap:anywhere}
      .ma-electric-table .ma-el-factor-head{font-size:11px;line-height:1.02}
      .ma-act-total-row th,.ma-act-total-row td{font-weight:700}
      .ma-act-total{margin-top:8px;font-size:18px;font-weight:700}
      .ma-ecp-marker{display:inline-block;color:#fff;background:#fff;font-size:1px;line-height:1}
    </style></head><body><div class="ma-act-print-page">${sheet.innerHTML}</div></body></html>`);
    doc.close();
    setTimeout(() => {
      let cleanupTimer = null;
      const cleanup = () => {
        if (cleanupTimer) window.clearTimeout(cleanupTimer);
        frame.remove();
      };
      frame.contentWindow.addEventListener("afterprint", cleanup, { once: true });
      cleanupTimer = window.setTimeout(cleanup, 60000);
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }, 50);
  }

  async function pdfAct() {
    if (!window.GrCommon || !GrCommon.downloadPdfFromSheets) return show("PDF недоступний", "warn");
    const sheet = actSheet();
    if (!sheet) return;
    const meter = selectedMeter();
    await GrCommon.downloadPdfFromSheets([sheet], "meter-act.pdf", null, {
      textMarkers: (pdfSheet, _index, pageSize) => {
        const anchor = pdfSheet.querySelector(".ma-ecp-anchor");
        const sheetRect = pdfSheet.getBoundingClientRect();
        const anchorRect = anchor ? anchor.getBoundingClientRect() : null;
        const x = anchorRect ? ((anchorRect.left - sheetRect.left) / sheetRect.width) * pageSize.width : (pageSize.width > pageSize.height ? 32 : 24);
        const y = anchorRect ? ((anchorRect.top - sheetRect.top) / sheetRect.height) * pageSize.height : (pageSize.width > pageSize.height ? 103 : 146);
        return [{
          text: `ECP ${homeOkpo(meter && meter.home_code)}`,
          x: x + 52,
          y: y + 2,
          size: 1,
          color: [255, 255, 255]
        }];
      }
    });
  }

  function wordActHtml(sheet) {
    const clone = sheet.cloneNode(true);
    clone.querySelectorAll(".ma-act-plain-table").forEach(table => {
      table.setAttribute("border", "0");
      table.setAttribute("cellspacing", "0");
      table.setAttribute("cellpadding", "0");
      table.style.cssText = `${table.style.cssText};border:none;mso-border-alt:none;border-collapse:collapse;`;
      table.querySelectorAll("tr,td,th").forEach(cell => {
        cell.style.cssText = `${cell.style.cssText};border:none;mso-border-alt:none;`;
        cell.style.padding = cell.tagName === "TD" ? "0" : cell.style.padding;
      });
      table.querySelectorAll("td:last-child").forEach(cell => {
        cell.style.textAlign = "right";
      });
    });
    const meter = selectedMeter();
    const marker = document.createElement("span");
    marker.className = "ma-ecp-marker";
    marker.textContent = `ЕЦП ${homeOkpo(meter && meter.home_code)}`;
    const signCell = clone.querySelector(".ma-act-sign-table td:first-child");
    if (signCell) {
      signCell.appendChild(document.createTextNode("\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0"));
      signCell.appendChild(marker);
    } else {
      const signer = clone.querySelector(".ma-act-signatures div:first-child");
      if (signer) {
        signer.appendChild(document.createElement("br"));
        signer.appendChild(marker);
      }
    }
    return clone.innerHTML;
  }

  function wordAct() {
    const sheet = actSheet();
    if (!sheet) return;
    const bodyHtml = wordActHtml(sheet);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page WordSection1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:28.35pt 28.35pt 28.35pt 28.35pt}
      div.WordSection1{page:WordSection1}
      body{font-family:Arial,sans-serif;font-size:12pt}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #555;padding:4px}
      h2,h3{text-align:center;margin:0}
      h2{font-size:18pt}
      h3{font-size:16pt;margin-top:4px}
      small{display:block;color:#555;font-size:9pt}
      .ma-act-subtitle{text-align:center;margin-top:8px}
      .ma-act-line{display:table;width:100%;margin:12px 0 8px}
      .ma-act-line span{display:table-cell;width:50%;white-space:nowrap}
      .ma-act-line span:last-child{text-align:right}
      .ma-act-plain-table{width:100%;border-collapse:collapse;margin:12px 0 8px}
      .ma-act-plain-table,.ma-act-plain-table tr,.ma-act-plain-table td{border:none!important;mso-border-alt:none!important}
      .ma-act-plain-table td{padding:0!important;vertical-align:top}
      .ma-act-plain-table td:last-child{text-align:right}
      .ma-act-top{display:flex;justify-content:space-between;border-bottom:3px solid #1f5a9d;margin-bottom:14px}
      .ma-act-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}
      .ma-act-signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}
      .ma-act-sign-table{margin-top:36px}
      .ma-heat-table th,.ma-heat-table td,.ma-electric-table th,.ma-electric-table td{text-align:center;border-color:#111}
      .ma-heat-table{table-layout:fixed;width:100%;font-size:7pt}
      .ma-heat-table th{font-size:7pt;line-height:1.02;padding:2pt 2pt;word-break:normal;font-weight:normal}
      .ma-heat-table th.ma-heat-no-delta-head{font-size:10pt}
      .ma-heat-table td{font-size:7pt;line-height:1.05;padding:2pt 2pt;white-space:nowrap}
      .ma-heat-table small{font-size:6pt;line-height:1;white-space:nowrap}
      .ma-heat-table .ma-heat-col-date{width:78pt}
      .ma-heat-table .ma-heat-col-small{width:54pt}
      .ma-heat-table .ma-heat-col-narrow{width:44pt}
      .ma-nowrap{white-space:nowrap}
      .ma-electric-table{table-layout:fixed}
      .ma-electric-table .ma-el-col-no{width:28px}
      .ma-electric-table .ma-el-col-date{width:82px}
      .ma-electric-table .ma-el-col-name{width:210px}
      .ma-electric-table .ma-el-col-eic{width:150px}
      .ma-electric-table .ma-el-col-meter{width:110px}
      .ma-electric-table .ma-el-col-type{width:90px}
      .ma-electric-table .ma-el-col-value{width:72px}
      .ma-electric-table .ma-el-col-factor{width:68px}
      .ma-electric-table .ma-el-col-consumption{width:94px}
      .ma-electric-table th{font-size:10pt;line-height:1.08}
      .ma-electric-table .ma-el-factor-head{font-size:8.5pt;line-height:1.02}
      .ma-electric-table th:nth-child(3),.ma-electric-table td:nth-child(3){text-align:left}
      .ma-act-total-row th,.ma-act-total-row td{font-weight:bold}
      .ma-act-total{margin-top:8px;font-size:14pt;font-weight:bold}
      .ma-ecp-marker{display:inline-block;color:#fff;background:#fff;font-size:1px;line-height:1}
    </style></head><body><div class="WordSection1">${bodyHtml}</div></body></html>`;
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
    const channel = channelById(row.dataset.channelId);
    const showDelta = channelShowsDelta(channel || {});
    const deltaCell = row.querySelector("[data-ma-delta]") || (row.dataset.deltaTarget ? document.getElementById(row.dataset.deltaTarget) : null);
    const reportCell = row.querySelector("[data-ma-report]");
    if (!showDelta || !current || !previous) {
      if (deltaCell) deltaCell.textContent = "";
      if (reportCell) reportCell.textContent = "";
      return;
    }
    const delta = readingDelta(current, previous, channel);
    if (delta == null) return;
    const report = delta * num(row.dataset.factor, 1);
    if (deltaCell) deltaCell.textContent = fmt(delta);
    if (reportCell) reportCell.textContent = fmt(report);
  }

  function inputRowForChannelCode(meterId, code, mode) {
    const target = String(code || "").trim().toLowerCase();
    return Array.from(document.querySelectorAll(`[data-ma-reading-row][data-meter-id="${CSS.escape(String(meterId || ""))}"][data-ma-mode="${CSS.escape(String(mode || ""))}"]`))
      .find(row => {
        const channel = channelById(row.dataset.channelId);
        return String(channel && channel.code || "").trim().toLowerCase() === target;
      }) || null;
  }

  function inputValueForChannelCode(meterId, code, mode) {
    const row = inputRowForChannelCode(meterId, code, mode);
    return String(row && row.querySelector('[name="current_value"]')?.value || "").trim();
  }

  function recalcWorkTimeInput(meterId, mode) {
    const row = inputRowForChannelCode(meterId, "work_time", mode);
    if (!row) return;
    const input = row.querySelector('[name="current_value"]');
    const channel = channelById(row.dataset.channelId);
    const previousReading = previousReadingForAt(meterId, state.readingDate);
    if (!input || !channel || !previousReading) return;
    const previousValue = currentValueFor(channel.id, previousReading.id);
    const previousNumber = num(previousValue, NaN);
    if (!Number.isFinite(previousNumber)) return;
    const currentDate = inputValueForChannelCode(meterId, "current_date", mode);
    const currentTime = inputValueForChannelCode(meterId, "current_time", mode);
    const step = workTimeStep(meterId, channel, previousReading, previousNumber, state.readingDate, currentDate, currentTime);
    input.value = fmt(channel.is_reverse ? previousNumber - step : previousNumber + step);
    recalcReadingRow(row);
  }

  function validationMessageForRow(row) {
    const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
    const previous = String(row.dataset.previous || "").trim();
    const channel = channelById(row.dataset.channelId);
    const code = String(channel && channel.code || "").toLowerCase();
    if (code === "current_date" && current) {
      const diff = signedDaysBetweenDates(state.readingDate, current);
      if (diff != null && Math.abs(diff) > 31) return `поточна дата ${current} далі ніж на місяць від дати зняття показань ${dateLabel(state.readingDate)}.`;
    }
    if (isWorkTimeChannel(channel)) return "";
    if (!channelShowsDelta(channel || {})) return "";
    if (!current || !previous) return "";
    const delta = readingDelta(current, previous, channel);
    if (!Number.isFinite(delta)) return "";
    const manualMin = num(row.dataset.min, 0);
    const manualMax = num(row.dataset.max, 0);
    const autoMin = num(row.dataset.autoMin, NaN);
    const autoMax = num(row.dataset.autoMax, NaN);
    const hasMin = manualMin > 0 || Number.isFinite(autoMin);
    const hasMax = manualMax > 0 || (Number.isFinite(autoMax) && autoMax > 0);
    const min = manualMin > 0 ? manualMin : autoMin;
    const max = manualMax > 0 ? manualMax : autoMax;
    if (hasMin && delta < min) return `споживання ${fmt(delta)} менше мінімального ${fmt(min)}.`;
    if (hasMax && delta > max) return `споживання ${fmt(delta)} більше максимального ${fmt(max)}.`;
    return "";
  }

  function emptyFieldMessageForRow(row) {
    const current = String(row.querySelector('[name="current_value"]')?.value || "").trim();
    return current ? "" : "показання не заповнено.";
  }

  function rowCurrentValue(row) {
    return String(row.querySelector('[name="current_value"]')?.value || "").trim();
  }

  function rowDeltaValue(row, channel) {
    const current = rowCurrentValue(row);
    const previous = String(row.dataset.previous || "").trim();
    if (!channelShowsDelta(channel || {}) || !current || !previous) return null;
    return readingDelta(current, previous, channel);
  }

  function channelBaseCode(channel) {
    return String(channel && channel.code || "").toLowerCase().replace(/\d+/g, "");
  }

  function average(values) {
    const nums = values.filter(value => Number.isFinite(value));
    return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : null;
  }

  function labelForWarning(channel) {
    const label = uiChannelLabel(channel);
    return channel && channel.input_unit ? `${label} ${channel.input_unit}` : label;
  }

  function channelNameForWarning(channel) {
    return uiChannelLabel(channel);
  }

  function modalWarningText(row, text) {
    const channel = channelById(row && row.dataset.channelId);
    const meter = meterById(row && row.dataset.meterId);
    const withMeter = state.selectedMeterId === ELECTRICITY_GROUP_ID || selectedInputMeters().length > 1;
    const prefix = [withMeter && meter ? meterLabel(meter) : "", channelNameForWarning(channel)].filter(Boolean).join(" ");
    return `${prefix}: ${text}`;
  }

  function groupedValidationMessages(rows) {
    const messages = [];
    const byMeter = new Map();
    rows.forEach(row => {
      const meterId = String(row.dataset.meterId || "");
      if (!meterId) return;
      const arr = byMeter.get(meterId) || [];
      arr.push(row);
      byMeter.set(meterId, arr);
    });
    byMeter.forEach(meterRows => {
      const byCode = new Map();
      meterRows.forEach(row => {
        const channel = channelById(row.dataset.channelId);
        if (!channel) return;
        byCode.set(String(channel.code || "").toLowerCase(), { row, channel });
      });
      const supply = byCode.get("supply_temp");
      const ret = byCode.get("return_temp");
      const supplyValue = supply ? num(rowCurrentValue(supply.row), NaN) : NaN;
      const returnValue = ret ? num(rowCurrentValue(ret.row), NaN) : NaN;
      if (Number.isFinite(supplyValue) && Number.isFinite(returnValue) && supplyValue < returnValue) {
        messages.push({
          row: supply.row,
          text: `температура подачі ${fmt(supplyValue)} менша за температуру повернення ${fmt(returnValue)}.`
        });
      }

      const deltaGroups = new Map();
      meterRows.forEach(row => {
        const channel = channelById(row.dataset.channelId);
        if (!channel || isWorkTimeChannel(channel) || !channelShowsDelta(channel)) return;
        const baseCode = channelBaseCode(channel);
        if (!baseCode) return;
        const delta = rowDeltaValue(row, channel);
        if (!Number.isFinite(delta)) return;
        const arr = deltaGroups.get(baseCode) || [];
        arr.push({ row, channel, delta });
        deltaGroups.set(baseCode, arr);
      });
      deltaGroups.forEach(items => {
        if (items.length < 2) return;
        for (let i = 0; i < items.length; i += 1) {
          for (let j = i + 1; j < items.length; j += 1) {
            const left = items[i];
            const right = items[j];
            const historyAvg = average([
              ...historicalDeltasForChannel(left.row.dataset.meterId, left.channel.id),
              ...historicalDeltasForChannel(right.row.dataset.meterId, right.channel.id)
            ]);
            if (!Number.isFinite(historyAvg) || historyAvg <= 0) continue;
            const diff = Math.abs(left.delta - right.delta);
            if (diff > historyAvg * 0.01) {
              messages.push({
                row: right.row,
                text: `${labelForWarning(left.channel)} ${fmt(left.delta)}, а ${labelForWarning(right.channel)} ${fmt(right.delta)}.`
              });
            }
          }
        }
      });
    });
    return messages;
  }

  function collectValidationWarnings(rows, visible) {
    const rowMessages = new Map();
    const modalMessages = [];
    const add = (row, text) => {
      if (!row || !text) return;
      const arr = rowMessages.get(row) || [];
      arr.push(text);
      rowMessages.set(row, arr);
      modalMessages.push(modalWarningText(row, text));
    };
    rows.forEach(row => {
      add(row, validationMessageForRow(row));
      add(row, emptyFieldMessageForRow(row));
    });
    groupedValidationMessages(rows).forEach(item => add(item.row, item.text));
    rows.forEach(row => {
      const warning = row.querySelector("[data-ma-warning]");
      const messages = rowMessages.get(row) || [];
      if (warning) {
        warning.textContent = messages.join(" ");
        warning.hidden = !(visible && messages.length);
      }
    });
    return modalMessages;
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
    container.querySelectorAll("[data-ma-mobile-view]").forEach(btn => btn.addEventListener("click", () => {
      state.mobileView = btn.dataset.maMobileView || "input";
      render();
    }));
    container.querySelectorAll("button[data-ma-select-meter]").forEach(btn => btn.addEventListener("click", () => {
      state.selectedMeterId = btn.dataset.maSelectMeter || "";
      applyDefaultReadingDate();
      state.inputCarryover = null;
      state.actReadingDate = "";
      render();
    }));
    container.querySelectorAll("[data-ma-reading-date]").forEach(input => input.addEventListener("change", async event => {
      const value = event.target.value || "";
      const mode = window.matchMedia && window.matchMedia("(max-width: 1024px)").matches ? "mobile" : "desktop";
      state.inputCarryover = captureInputCarryover(mode);
      state.readingDateManual = Boolean(value);
      state.readingDate = value || defaultReadingDate();
      await loadChildren();
      render();
    }));
    container.querySelectorAll("[data-ma-reading-row] input").forEach(input => input.addEventListener("input", () => {
      const row = input.closest("[data-ma-reading-row]");
      if (row) {
        recalcReadingRow(row);
        const channel = channelById(row.dataset.channelId);
        const code = String(channel && channel.code || "").trim().toLowerCase();
        if (code === "current_date" || code === "current_time") {
          recalcWorkTimeInput(row.dataset.meterId, row.dataset.maMode);
        }
        const warning = row.querySelector("[data-ma-warning]");
        if (warning) warning.hidden = true;
        scheduleReadingWarning(input);
      }
    }));
    container.querySelectorAll("[data-ma-save-readings]").forEach(btn => btn.addEventListener("click", saveReadings));
    container.querySelectorAll("[data-ma-act-date]").forEach(row => row.addEventListener("click", () => {
      if (row.dataset.maSelectMeter) state.selectedMeterId = row.dataset.maSelectMeter;
      state.actReadingDate = row.dataset.maActDate || "";
      render();
    }));
    container.querySelector("[data-ma-print-act]")?.addEventListener("click", printAct);
    container.querySelector("[data-ma-pdf-act]")?.addEventListener("click", pdfAct);
    container.querySelector("[data-ma-word-act]")?.addEventListener("click", wordAct);
    container.querySelectorAll("[data-ma-chart-meter]").forEach(input => input.addEventListener("change", () => {
      const id = String(input.dataset.maChartMeter || "");
      if (!id) return;
      if (input.checked) state.chartDisabledMeters.delete(id);
      else state.chartDisabledMeters.add(id);
      render();
    }));
    container.querySelectorAll("[data-ma-chart-channel]").forEach(input => input.addEventListener("change", () => {
      const key = String(input.dataset.maChartChannel || "");
      if (!key) return;
      if (input.checked) {
        state.chartDisabledChannels.delete(key);
        state.chartEnabledChannels.add(key);
      } else {
        state.chartEnabledChannels.delete(key);
        state.chartDisabledChannels.add(key);
      }
      render();
    }));
    container.querySelector("[data-ma-chart-months]")?.addEventListener("input", event => {
      state.chartMonths = Number(event.target.value) || 12;
      render();
    });
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
