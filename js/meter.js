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
    actReadingDate: "",
    loading: false,
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

  function previousValueFor(meterId, channelId) {
    return previousValueForAt(meterId, channelId, state.readingDate);
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

  function channelLabelWithUnit(channel, unitField) {
    const label = channel.label || channel.code || "";
    const unit = channel[unitField] || "";
    return `${escapeHtml(label)}${unit ? `<small>${escapeHtml(unit)}</small>` : ""}`;
  }

  function selectedMeter() {
    if (state.selectedMeterId === ELECTRICITY_GROUP_ID) {
      return state.meters.find(meter => meter.is_active !== false && meter.resource_type === "electricity") || null;
    }
    return state.meters.find(meter => String(meter.id) === String(state.selectedMeterId)) || null;
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

  function inputCell(meter, channel, index) {
    const reading = readingForMeter(meter.id);
    const current = currentValueFor(channel.id, reading && reading.id);
    const previous = previousValueFor(meter.id, channel.id);
    const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
    const delta = current !== "" && previous !== "" ? num(current, 0) - num(previous, 0) : null;
    const report = delta == null ? null : delta * factor;
    const autoBounds = autoConsumptionBounds(meter.id, channel.id);
    const deltaId = `ma-delta-${index}`;
    return `<td data-ma-reading-row data-meter-id="${escapeHtml(meter.id)}" data-channel-id="${escapeHtml(channel.id)}" data-previous="${escapeHtml(previous)}" data-factor="${escapeHtml(factor)}" data-min="${escapeHtml(meter.min_consumption ?? "")}" data-max="${escapeHtml(meter.max_consumption ?? "")}" data-auto-min="${escapeHtml(autoBounds.min)}" data-auto-max="${escapeHtml(autoBounds.max)}" data-delta-target="${escapeHtml(deltaId)}">
      <input name="current_value" value="${escapeHtml(current)}">
      <div class="ma-reading-warning" data-ma-warning hidden></div>
      <span data-ma-report hidden>${escapeHtml(report == null ? "" : fmt(report))}</span>
    </td><td id="${escapeHtml(deltaId)}" data-ma-delta>${escapeHtml(delta == null ? "" : fmt(delta))}</td>`;
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
      return channels.map(channel => ({ meter, channel, channelCount: channels.length }));
    });
    const selected = selectedMeter();
    const selectedDate = selected ? actDateForMeter(selected) : "";
    const dates = historyDatesForMeters(meters);
    return `<table class="ma-table ma-history-table ma-history-table-wide">
      <thead>
        <tr><th rowspan="2">Дата</th>${pairs.map(pair => `<th colspan="2">${channelColumnLabel(pair.meter, pair.channel, pair.channelCount)}</th>`).join("")}</tr>
        <tr>${pairs.map(() => `<th>Покази</th><th>Різниця</th>`).join("")}</tr>
      </thead>
      <tbody>
        <tr class="ma-input-history-row">
          <td><input type="date" data-ma-reading-date value="${escapeHtml(state.readingDate)}"></td>
          ${pairs.map((pair, index) => inputCell(pair.meter, pair.channel, index)).join("")}
        </tr>
        ${dates.map(date => {
          const rowSelected = date === selectedDate;
          return `<tr class="ma-history-row ${rowSelected ? "is-selected" : ""}" data-ma-act-date="${escapeHtml(date)}">
            <td>${escapeHtml(dateLabel(date))}</td>
            ${pairs.map(pair => {
              const value = readingValueAt(pair.meter, pair.channel, date);
              return `<td>${escapeHtml(value ? value.current_value : "")}</td><td>${escapeHtml(value && value.delta_value != null ? fmt(value.delta_value) : "")}</td>`;
            }).join("")}
          </tr>`;
        }).join("") || `<tr><td colspan="${1 + pairs.length * 2}" class="ma-empty-cell">Історії ще немає.</td></tr>`}
      </tbody>
    </table>`;
  }

  function renderMeterRowsReadingsTable(meters) {
    const selected = selectedMeter();
    const selectedDate = selected ? actDateForMeter(selected) : "";
    const maxChannels = Math.max(1, ...meters.map(meter => readingChannelsFor(meter).length));
    const dates = historyDatesForMeters(meters);
    const headerPairs = Array.from({ length: maxChannels }, (_, index) => {
      const labels = Array.from(new Set(meters.map(meter => {
        const channel = readingChannelsFor(meter)[index];
        if (!channel) return "";
        return [channel.label || channel.code || `Канал ${index + 1}`, channel.input_unit || ""].filter(Boolean).join(" · ");
      }).filter(Boolean)));
      const label = labels.length === 1 ? labels[0] : `Канал ${index + 1}`;
      return `<th colspan="2">${escapeHtml(label)}</th>`;
    }).join("");
    const subHeader = Array.from({ length: maxChannels }, () => `<th>Покази</th><th>Різниця</th>`).join("");
    const renderCells = (meter, date, inputBase) => {
      const channels = readingChannelsFor(meter);
      const cells = channels.map((channel, index) => {
        if (inputBase != null) return inputCell(meter, channel, inputBase + index);
        const value = readingValueAt(meter, channel, date);
        return `<td>${escapeHtml(value ? value.current_value : "")}</td><td>${escapeHtml(value && value.delta_value != null ? fmt(value.delta_value) : "")}</td>`;
      }).join("");
      const empty = Array.from({ length: maxChannels - channels.length }, () => `<td></td><td></td>`).join("");
      return cells + empty;
    };
    return `<table class="ma-table ma-history-table ma-history-table-by-meter">
      <thead>
        <tr><th rowspan="2">Дата</th><th rowspan="2">Прилад</th>${headerPairs}</tr>
        <tr>${subHeader}</tr>
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
        })).join("") || `<tr><td colspan="${2 + maxChannels * 2}" class="ma-empty-cell">Історії ще немає.</td></tr>`}
      </tbody>
    </table>`;
  }

  function currentReadingSnapshot(meter, readingDate) {
    const date = readingDate || state.readingDate;
    const channels = channelsForMeter(meter.id).filter(ch => ch.is_active !== false && ch.is_reading !== false);
    const rows = channels.map(channel => {
      const reading = readingForMeterAt(meter.id, date);
      const current = currentValueFor(channel.id, reading && reading.id);
      const previous = previousValueForAt(meter.id, channel.id, date);
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
      const currentValue = current ? current.current_value : "";
      const factor = num(channel.unit_factor, 1) * num(meter.calculation_factor, 1);
      const delta = currentValue !== "" && previousValue !== "" ? num(currentValue, 0) - num(previousValue, 0) : null;
      return {
        channel,
        previous: previousValue,
        current: currentValue,
        delta,
        report: delta == null ? null : delta * factor
      };
    });
    return { previousReading, currentReading, rows };
  }

  function renderHeatAct(meter) {
    const actDate = actDateForMeter(meter);
    const snap = heatActRows(meter, actDate);
    const total = snap.rows.reduce((sum, row) => sum + (Number(row.report) || 0), 0);
    const home = homeName(meter.home_code);
    const cols = snap.rows.map(row => row.channel);
    const previousDate = snap.previousReading ? snap.previousReading.reading_date : "";
    return `${actTools()}
    <div class="gr-sheet gr-sheet-landscape ma-act-sheet ma-act-heat-sheet">
      <div class="ma-act ma-act-heat">
        <h2>Відомість обліку споживання теплової енергії</h2>
        <h3>${escapeHtml(home)}</h3>
        <div class="ma-act-subtitle">Тип теплолічильника ${escapeHtml(meter.meter_type || meter.name || "")}</div>
        <div class="ma-act-line">
          <span>Дата первинного приймання ${escapeHtml(dateLabel(meter.contract_date || ""))}</span>
          <span>Теплові втрати: ____________________</span>
        </div>
        <table class="ma-act-table ma-heat-table">
          <thead>
            <tr>
              <th>Дата</th>
              ${cols.map(ch => `<th>${channelLabelWithUnit(ch, "input_unit")}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(dateLabel(previousDate))}</td>
              ${snap.rows.map(row => `<td>${escapeHtml(row.previous)}</td>`).join("")}
            </tr>
            <tr>
              <td>${escapeHtml(dateLabel(actDate))}</td>
              ${snap.rows.map(row => `<td>${escapeHtml(row.current)}</td>`).join("")}
            </tr>
            <tr class="ma-act-total-row">
              <th>Різниця:</th>
              ${snap.rows.map(row => `<th>${escapeHtml(row.delta == null ? "" : fmt(row.delta))}</th>`).join("")}
            </tr>
          </tbody>
        </table>
        <div class="ma-act-total">${escapeHtml((cols[0] && cols[0].report_unit) || "До акту")}: <strong>${escapeHtml(fmt(total))}</strong></div>
        <div class="ma-act-signatures ma-act-signatures-wide">
          <div>Здав: ${escapeHtml(home)}<br><br>_______________________</div>
          <div>Прийняв ________________________________</div>
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
        const currentValue = channel ? currentValueFor(channel.id, reading && reading.id) : "";
        const previousValue = channel ? previousValueForAt(meter.id, channel.id, readingDate) : "";
        const delta = currentValue !== "" && previousValue !== "" ? num(currentValue, 0) - num(previousValue, 0) : null;
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
        <div class="ma-act-subtitle">за ${escapeHtml(monthYearLabel(actDate))} року.</div>
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
              <th>Найменування приєднання</th>
              <th>EIC-код</th>
              <th>№ електро-<br>лічильника</th>
              <th>Тип вимірювань</th>
              <th>Поточні</th>
              <th>Поперед-<br>ні</th>
              <th class="ma-el-factor-head">Розрахун-<br>ковий коефі-<br>цієнт</th>
              <th>Номінальне споживання</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `<tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(dateLabel(actDate))}</td>
              <td>${escapeHtml(row.meter.connection_name || row.meter.object_name || row.meter.name || "")}</td>
              <td>${escapeHtml(row.meter.eic_code || "")}</td>
              <td>${escapeHtml(row.meter.meter_number || "")}</td>
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
          <td>Голова правління___________________/${escapeHtml(chair)}<br><br>${escapeHtml(dateLabel(actDate))}</td>
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

  function renderReadings() {
    const meters = selectedInputMeters();
    const electricityWide = state.selectedMeterId === ELECTRICITY_GROUP_ID && meters.length < 6;
    return `<div class="ma-panel ma-readings">
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
    const hasElectricity = state.meters.some(meter => meter.is_active !== false && meter.resource_type === "electricity");
    const selectedExists = state.selectedMeterId === ELECTRICITY_GROUP_ID
      ? hasElectricity
      : state.meters.some(m => String(m.id) === String(state.selectedMeterId));
    if (!selectedExists) {
      const firstHeat = state.meters.find(meter => meter.is_active !== false && meter.resource_type === "heat");
      state.selectedMeterId = hasElectricity ? ELECTRICITY_GROUP_ID : (firstHeat ? firstHeat.id : (state.meters[0] ? state.meters[0].id : ""));
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
    await GrCommon.downloadPdfFromSheets([sheet], "meter-act.pdf");
  }

  function wordAct() {
    const sheet = actSheet();
    if (!sheet) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page WordSection1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:28.35pt 28.35pt 28.35pt 28.35pt}
      div.WordSection1{page:WordSection1}
      body{font-family:Arial,sans-serif;font-size:12pt}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #555;padding:5px}
      h2,h3{text-align:center;margin:0}
      h2{font-size:18pt}
      h3{font-size:16pt;margin-top:4px}
      small{display:block;color:#555;font-size:9pt}
      .ma-act-subtitle{text-align:center;margin-top:8px}
      .ma-act-line{display:flex;justify-content:space-between;margin:12px 0 8px}
      .ma-act-plain-table{width:100%;border-collapse:collapse;margin:12px 0 8px}
      .ma-act-plain-table td{border:0!important;padding:0!important;vertical-align:top}
      .ma-act-plain-table td:last-child{text-align:right}
      .ma-act-top{display:flex;justify-content:space-between;border-bottom:3px solid #1f5a9d;margin-bottom:14px}
      .ma-act-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}
      .ma-act-signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:36px}
      .ma-act-sign-table{margin-top:36px}
      .ma-heat-table th,.ma-heat-table td,.ma-electric-table th,.ma-electric-table td{text-align:center;border-color:#111}
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
    </style></head><body><div class="WordSection1">${sheet.innerHTML}</div></body></html>`;
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
    const deltaCell = row.querySelector("[data-ma-delta]") || (row.dataset.deltaTarget ? document.getElementById(row.dataset.deltaTarget) : null);
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
    container.querySelectorAll("button[data-ma-select-meter]").forEach(btn => btn.addEventListener("click", () => {
      state.selectedMeterId = btn.dataset.maSelectMeter || "";
      state.actReadingDate = "";
      render();
    }));
    container.querySelector("[data-ma-reading-date]")?.addEventListener("change", async event => {
      state.readingDate = event.target.value || nearestMonthEndIso();
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
    container.querySelectorAll("[data-ma-act-date]").forEach(row => row.addEventListener("click", () => {
      if (row.dataset.maSelectMeter) state.selectedMeterId = row.dataset.maSelectMeter;
      state.actReadingDate = row.dataset.maActDate || "";
      render();
    }));
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
