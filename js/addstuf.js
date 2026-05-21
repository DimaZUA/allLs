var isTableFocused = false; // Флаг состояния таблицы
var originalParentTable = null; // Оригинальный родитель для таблицы

var originalParentHeader = null; // Оригинальный родитель для элемента с id="header"
var originalSiblings = []; // Сохраняем другие элементы страницы



function handleHeaderClick(event) {
  var table = event.target.closest("table"); // Находим ближайшую таблицу
  if (!table) return;
  var body = document.body;
  if (!isTableFocused) {
    var _document$querySelect, _document$getElementB;
    // Сохраняем оригинальные родительские элементы и соседние элементы
    originalParentTable = table.parentElement;

    originalParentHeader =
      (_document$getElementB = document.getElementById("header")) === null ||
      _document$getElementB === void 0
        ? void 0
        : _document$getElementB.parentElement;
    originalSiblings = Array.from(body.children);

    // Получаем элементы с классом "balance-info" и с id="header"
    //var balanceInfo = document.querySelector(".balance-info");
    var header = document.getElementById("header");
    var settingsModal = document.getElementById("settings-modal");
    // Скрываем всё, кроме таблицы, элементов с классом "balance-info" и с id="header"
    originalSiblings.forEach(function (el) {
      if (el !== table && el !== header && el !== settingsModal) {
        el.style.display = "none";
      }
    });

document.querySelectorAll("button").forEach(function (btn) {
  btn.style.display = "none";
});
    // Создаём обёртку для центрирования
    var wrapper = document.createElement("div");
    wrapper.id = "tableWrapper";

    // Применяем стили обёртки
    Object.assign(wrapper.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "white",
      boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
      padding: "20px",
      borderRadius: "10px",
      maxWidth: "80vw",
      // Устанавливаем максимальную ширину
      maxHeight: "100vh",
      overflow: "auto"
    });

    // Вставляем таблицу в обёртку
    if (header) wrapper.appendChild(header); // Добавляем элемент с id="header"
    //if (balanceInfo) wrapper.appendChild(balanceInfo); // Добавляем элемент с классом "balance-info"
    wrapper.appendChild(table);
    body.appendChild(wrapper);
    showMessage("Для возврата щелкните мышью по заголовку таблицы");
setTimeout(() => {
  document.addEventListener("click", handleOutsideClick);
}, 0);

    isTableFocused = true;
  } 
}

function handleOutsideClick(event) {
  //var table = event.target.closest("table"); // Находим ближайшую таблицу

var tables = document.querySelectorAll('table#main');
var table = null;

tables.forEach(function(t) {
  if (!table && t.offsetParent !== null) { // таблица видимая
    table = t;
  }
});


  if (!table) return;
  var body = document.body;

  if (isTableFocused){
    var _document$getElementB2;
    var settingsModal = document.getElementById("settings-modal");

    // Восстанавливаем элементы
    originalSiblings.forEach(function (el) {
      if (el !== settingsModal) return (el.style.display = "");
    });
// Показываем все button внутри таблицы
document.querySelectorAll("button").forEach(function (btn) {
   btn.style.display = "";
});
document.getElementById("message").style.display='none';
    // Возвращаем таблицу и элементы обратно в их исходные родительские элементы
    if (originalParentTable) originalParentTable.appendChild(table);
    if (originalParentHeader)
      originalParentHeader.insertBefore(
        document.getElementById("header"),
        originalParentHeader.firstChild
      );

    // Удаляем обёртку
    (_document$getElementB2 = document.getElementById("tableWrapper")) ===
      null ||
      _document$getElementB2 === void 0 ||
      _document$getElementB2.remove();
    isTableFocused = false;
  document.removeEventListener("click", handleOutsideClick);

  }
}

function isUserAuthenticated() {
  return document.body.classList.contains("authenticated");
}

function getPageBaseUrl() {
  const base = new URL(window.location.href);
  base.search = "";
  base.hash = "";
  return base.toString();
}

function getMonthNameByCase(month, monthCase) {
  const idx = Math.max(1, Math.min(12, Number(month) || 1)) - 1;
  const names = {
    gen: [
      "січня", "лютого", "березня", "квітня", "травня", "червня",
      "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
    ],
    loc: [
      "січні", "лютому", "березні", "квітні", "травні", "червні",
      "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
    ]
  };
  return (names[monthCase] || names.gen)[idx];
}

function getTarifUnitPhrase(formula) {
  const f = String(formula || "").trim().toUpperCase();
  if (f === "SQR") return "за 1 м².";
  if (f === "PERS") return "з 1 мешканця.";
  return "";
}

function formatTarifMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toFixedWithComma();
}

function getPrevMonthTransactions(accountData, year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  const prevYear = m > 1 ? y : y - 1;
  const prevMonth = m > 1 ? m - 1 : 12;
  return ((accountData[String(prevYear)] || {})[String(prevMonth)] || null);
}

function pickBestTarifRowsForService(serviceRows, serviceId, currentCharge, accountMeta) {
  if (!Array.isArray(serviceRows) || serviceRows.length <= 1) return serviceRows || [];

  const area = Number((accountMeta && accountMeta.pl) || 0);
  const persons = Number((accountMeta && accountMeta.pers) || 0);
  const charge = Number(currentCharge);
  if (!Number.isFinite(charge)) return serviceRows;

  const candidates = [];
  serviceRows.forEach(function (row) {
    const formula = String(row && row.formula || "").trim().toUpperCase();
    const tarif = Number(row && row.tarif);
    if (!Number.isFinite(tarif) || tarif === -1) return;
    let factor = NaN;
    if (formula === "SQR" && area > 0) factor = area;
    if (formula === "PERS" && persons > 0) factor = persons;
    if (!Number.isFinite(factor)) return;
    const expected = tarif * factor;
    const diff = Math.abs(expected - charge);
    const factTarif = charge / factor;
    const diffPerUnit = Math.abs(factTarif - tarif);
    candidates.push({ row: row, diff: diff, diffPerUnit: diffPerUnit });
  });

  if (!candidates.length) return serviceRows;

  candidates.sort(function (a, b) {
    return a.diffPerUnit - b.diffPerUnit;
  });

  const best = candidates[0];
  const second = candidates[1];
  if (best && best.diffPerUnit <= 0.01 + 1e-9) {
    return [best.row];
  }

  if (best && !second) {
    return [best.row];
  }

  // Fallback for rounded area/persons or minor legacy posting drift:
  // when one candidate is clearly closer than the next one, use it.
  if (best && second && best.diffPerUnit * 2 <= second.diffPerUnit) {
    return [best.row];
  }

  return serviceRows;
}

function getTarifRowsByService(source, y, m, monthTransactions, isResidentMode) {
  const byService = {};
  const pushRow = function (serviceId, row) {
    const sid = String(serviceId || "").trim();
    if (!sid || !row || typeof row !== "object") return;
    if (!byService[sid]) byService[sid] = [];
    byService[sid].push(row);
  };
  // Resident mode: for January 2025 use latest tariff rows (<= 01.2025)
  // for services that are actually charged in January 2025.
  if (isResidentMode && y === 2025 && m === 1) {
    const chargedServices = Object.keys(monthTransactions || {}).filter(function (serviceId) {
      const sid = String(serviceId || "").trim();
      if (!sid || sid === "7") return false;
      return Number((monthTransactions && monthTransactions[sid]) || 0) !== 0;
    });
    chargedServices.forEach(function (serviceId) {
      const sid = String(serviceId);
      const rowsForService = source.filter(function (row) {
        if (!row || typeof row !== "object") return false;
        if (String(row.us || "").trim() !== sid) return false;
        const ry = Number(row.year);
        const rm = Number(row.month);
        if (!Number.isFinite(ry) || !Number.isFinite(rm)) return false;
        return ry < y || (ry === y && rm <= m);
      });
      if (!rowsForService.length) return;
      let latestPeriodKey = -Infinity;
      rowsForService.forEach(function (row) {
        const periodKey = Number(row.year) * 12 + Number(row.month);
        if (Number.isFinite(periodKey) && periodKey > latestPeriodKey) latestPeriodKey = periodKey;
      });
      rowsForService.forEach(function (row) {
        const periodKey = Number(row.year) * 12 + Number(row.month);
        if (periodKey === latestPeriodKey) pushRow(sid, row);
      });
    });
    return byService;
  }
  const monthRows = source.filter(function (row) {
    return row && typeof row === "object" && Number(row.year) === y && Number(row.month) === m;
  });
  monthRows.forEach(function (row) {
    pushRow(row.us, row);
  });
  return byService;
}
function buildTarifMonthNotes(year, month, monthTransactions, prevMonthTransactions, accountMeta, isResidentMode) {
  const source = Array.isArray(tarifs)
    ? tarifs
    : (tarifs && typeof tarifs === "object" ? Object.values(tarifs) : []);
  if (!source.length) return [];
  const y = Number(year);
  const m = Number(month);
  const out = [];
  const isResidentStartMonth = !!isResidentMode && y === 2025 && m === 1;
  const byService = getTarifRowsByService(source, y, m, monthTransactions, isResidentMode);
  if (!Object.keys(byService).length) return out;
  Object.keys(byService).forEach(function (serviceId) {
    const serviceRows = byService[serviceId];
    const serviceName = String((us && us[serviceId]) || "").trim();
    const currentCharge = Number((monthTransactions && monthTransactions[serviceId]) || 0);
    const previousCharge = Number((prevMonthTransactions && prevMonthTransactions[serviceId]) || 0);
    if (serviceId === "10") {
      const targetCharge = Number((monthTransactions && monthTransactions[10]) || 0);
      if (!(targetCharge > 0)) return;
      serviceRows.forEach(function (row) {
        const rowYear = Number(row.year) || y;
        const rowMonth = Number(row.month) || m;
        const rowMonthLoc = getMonthNameByCase(rowMonth, "loc");
        const noteText = String(row.note || "").trim().replace(/\s+/g, " ");
        const unitPhrase = getTarifUnitPhrase(row.formula);
        const tariffNum = Number(row.tarif);
        const hasTariff = Number.isFinite(tariffNum) && tariffNum !== -1;
        const showTariffAmount = hasTariff && tariffNum !== 0 && tariffNum !== 1;
        const tariffText = hasTariff ? formatTarifMoney(tariffNum) : "";
        const noteHasTargetPhrase = /\u0426\u0456\u043B\u044C\u043E\u0432\u0438\u0439\s+\u0432\u043D\u0435\u0441\u043E\u043A/i.test(noteText);
        let text = `\u0412 ${rowMonthLoc} ${rowYear} \u0440. \u0431\u0443\u043B\u043E \u043D\u0430\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E`;
        if (noteText) {
          text += noteHasTargetPhrase ? ` ${noteText}` : ` \u0446\u0456\u043B\u044C\u043E\u0432\u0438\u0439 \u0432\u043D\u0435\u0441\u043E\u043A \u043D\u0430 ${noteText}`;
        } else {
          text += " \u0446\u0456\u043B\u044C\u043E\u0432\u0438\u0439 \u0432\u043D\u0435\u0441\u043E\u043A";
        }
        if (showTariffAmount) text += ` \u0432 \u0440\u043E\u0437\u043C\u0456\u0440\u0456 ${tariffText} \u0433\u0440\u043D`;
        if (unitPhrase) text += ` ${unitPhrase}`;
        out.push(text + ".");
      });
      return;
    }
    if (currentCharge === 0) return;
    if (!isResidentStartMonth && currentCharge === previousCharge) return;
    const rowsForOutput = pickBestTarifRowsForService(serviceRows, serviceId, currentCharge, accountMeta);
    rowsForOutput.forEach(function (row) {
      const rowYear = Number(row.year) || y;
      const rowMonth = Number(row.month) || m;
      const rowMonthGen = getMonthNameByCase(rowMonth, "gen");
      const unitPhrase = getTarifUnitPhrase(row.formula);
      const tariffNum = Number(row.tarif);
      const hasTariff = Number.isFinite(tariffNum) && tariffNum !== -1;
      const showTariffAmount = hasTariff && tariffNum !== 0 && tariffNum !== 1;
      const tariffText = hasTariff ? formatTarifMoney(tariffNum) : "";
      if (!unitPhrase || !showTariffAmount) return;
      const title = serviceName || "\u0432\u043D\u0435\u0441\u043E\u043A";
      out.push(`\u0417 1 ${rowMonthGen} ${rowYear} \u0440. \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${title} \u0432 \u0440\u043E\u0437\u043C\u0456\u0440\u0456 ${tariffText} \u0433\u0440\u043D ${unitPhrase}`);
    });
  });
  return out;
}

function buildTarifNoteRows(notes, colSpan, isCurrentMonth) {
  if (!Array.isArray(notes) || !notes.length || !colSpan) return [];
  const row = document.createElement("tr");
  row.className = "tarif-note-row";
  if (isCurrentMonth) row.classList.add("grey");

  const cell = document.createElement("td");
  cell.colSpan = colSpan;
  cell.className = "tarif-note-cell";
  cell.innerHTML = notes
    .map(function (text) {
      return `<div class="tarif-note-line">• ${String(text || "").trim()}</div>`;
    })
    .join("");

  row.appendChild(cell);
  return [row];
}

function buildTarifSummaryBlock(notes) {
  if (!Array.isArray(notes) || !notes.length) return null;
  const block = document.createElement("div");
  block.className = "tarif-summary-tail";
  block.innerHTML = notes.map(function (text) {
    return `<div class="tarif-note-line">• ${String(text || "").trim()}</div>`;
  }).join("");
  return block;
}

function findLatestNonZeroChargeForService(yearData, serviceId) {
  const months = Object.keys(yearData || {})
    .map(function (monthKey) { return Number(monthKey); })
    .filter(function (monthNum) { return Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12; })
    .sort(function (a, b) { return b - a; });

  for (let i = 0; i < months.length; i += 1) {
    const monthNum = months[i];
    const monthTx = (yearData && yearData[String(monthNum)]) || {};
    const charge = Number((monthTx && monthTx[String(serviceId)]) || 0);
    if (Math.abs(charge) > 0.005) {
      return { month: monthNum, charge: charge };
    }
  }

  return null;
}

function buildLatestTarifSummaryNotesForYear(year, yearData, services, accountMeta) {
  const source = Array.isArray(tarifs)
    ? tarifs
    : (tarifs && typeof tarifs === "object" ? Object.values(tarifs) : []);
  if (!source.length) return [];

  const y = Number(year);
  const months = Object.keys(yearData || {})
    .map(function (monthKey) { return Number(monthKey); })
    .filter(function (monthNum) { return Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12; })
    .sort(function (a, b) { return b - a; });
  if (!months.length) return [];

  const latestMonth = months[0];
  const latestPeriodKey = y * 12 + latestMonth;
  const serviceIds = Array.from(services || []).filter(function (serviceId) {
    const sid = String(serviceId || "").trim();
    return sid && sid !== "10";
  });

  const out = [];
  serviceIds.forEach(function (serviceId) {
    const sid = String(serviceId);
    const chargeInfo = findLatestNonZeroChargeForService(yearData, sid);
    if (!chargeInfo) return;

    const rowsForService = source.filter(function (row) {
      if (!row || typeof row !== "object") return false;
      if (String(row.us || "").trim() !== sid) return false;
      const rowYear = Number(row.year);
      const rowMonth = Number(row.month);
      if (!Number.isFinite(rowYear) || !Number.isFinite(rowMonth)) return false;
      const rowPeriodKey = rowYear * 12 + rowMonth;
      return rowPeriodKey <= latestPeriodKey;
    });
    if (!rowsForService.length) return;

    let latestTarifPeriodKey = -Infinity;
    rowsForService.forEach(function (row) {
      const rowPeriodKey = Number(row.year) * 12 + Number(row.month);
      if (Number.isFinite(rowPeriodKey) && rowPeriodKey > latestTarifPeriodKey) latestTarifPeriodKey = rowPeriodKey;
    });

    const latestRows = rowsForService.filter(function (row) {
      const rowPeriodKey = Number(row.year) * 12 + Number(row.month);
      return rowPeriodKey === latestTarifPeriodKey;
    });
    if (!latestRows.length) return;

    const chosenRows = pickBestTarifRowsForService(latestRows, sid, chargeInfo.charge, accountMeta);
    const serviceName = String((us && us[sid]) || "").trim() || "\u0432\u043D\u0435\u0441\u043E\u043A";

    chosenRows.forEach(function (row) {
      const formula = String(row && row.formula || "").trim().toUpperCase();
      if (formula !== "SQR" && formula !== "PERS") return;

      const tariffNum = Number(row.tarif);
      const hasTariff = Number.isFinite(tariffNum) && tariffNum !== -1;
      const showTariffAmount = hasTariff && tariffNum !== 0 && tariffNum !== 1;
      if (!showTariffAmount) return;

      const rowYear = Number(row.year);
      const rowMonth = Number(row.month);
      const rowMonthGen = getMonthNameByCase(rowMonth, "gen");
      const unitPhrase = getTarifUnitPhrase(formula);
      const tariffText = formatTarifMoney(tariffNum);

      out.push(`\u0417 1 ${rowMonthGen} ${rowYear} \u0440. \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${serviceName} \u0432 \u0440\u043E\u0437\u043C\u0456\u0440\u0456 ${tariffText} \u0433\u0440\u043D ${unitPhrase}`);
    });
  });

  return out;
}

function buildPrivat24PayUrl(homeToken, personalAccount) {
  const token = String(homeToken || "").trim();
  const account = String(personalAccount || "").trim();
  if (!token || !account || Number(account) <= 0) return "";
  const payload = JSON.stringify({
    token: token,
    personalAccount: account
  });
  return `https://next.privat24.ua/payments/form/${encodeURIComponent(payload)}`;
}

async function buildResidentCabinetUrl(accountId) {
  const homeCode = String(getParam("homeCode") || "");
  const kv = String(ls?.[accountId]?.kv || "").trim();
  const params = new URLSearchParams();

  try {
    if (window.client && typeof client.rpc === "function" && homeCode && accountId) {
      const { data, error } = await client.rpc("resident_token_make", {
        p_okpo: homeCode,
        p_account_id: String(accountId)
      });
      if (!error && data) {
        const token = String(data);
        params.set("rt", token);
        return `${getPageBaseUrl()}?${params.toString()}`;
      }
    }
  } catch (e) {
    // Fallback: URL without token if RPC is unavailable.
  }

  if (homeCode) params.set("homeCode", homeCode);
  params.set("actionCode", "accounts");
  if (kv) params.set("kv", kv);
  return `${getPageBaseUrl()}?${params.toString()}`;
}

async function copyTextPortable(text) {
  if (!text) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fallback below
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-9999px";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

async function ensureResidentCabinetButton(accountId) {
  const host = document.querySelector("#header .buttons-container");
  if (!host) return;

  let button = document.getElementById("residentCabinetCopyBtn");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.id = "residentCabinetCopyBtn";
    button.className = "xls-button resident-link-button";
    button.title = "\u0421\u043A\u043E\u043F\u0456\u044E\u0432\u0430\u0442\u0438 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043E\u0441\u043E\u0431\u0438\u0441\u0442\u043E\u0433\u043E \u043A\u0430\u0431\u0456\u043D\u0435\u0442\u0443";
    button.setAttribute("aria-label", button.title);
    button.textContent = "\u041E\u041A";
    host.appendChild(button);
  }

  if (!isUserAuthenticated()) {
    button.style.display = "none";
    return;
  }

  const url = await buildResidentCabinetUrl(accountId);
  button.style.display = "";
  button.onclick = async function () {
    const copied = await copyTextPortable(url);
    if (copied) {
      showMessage("\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043D\u0430 \u043E\u0441\u043E\u0431\u0438\u0441\u0442\u0438\u0439 \u043A\u0430\u0431\u0456\u043D\u0435\u0442 \u0441\u043A\u043E\u043F\u0456\u0439\u043E\u0432\u0430\u043D\u043E \u0434\u043E \u0431\u0443\u0444\u0435\u0440\u0443 \u043E\u0431\u043C\u0456\u043D\u0443");
    } else {
      showMessage("\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u0441\u043A\u043E\u043F\u0456\u044E\u0432\u0430\u0442\u0438 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F", "err");
    }
  };
}

function ensurePayButton(payUrl, isResidentMode) {
  const host = document.querySelector("#header .buttons-container");
  if (!host) return;

  let button = document.getElementById("payLinkBtn");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.id = "payLinkBtn";
    button.className = "xls-button pay-link-button";
    button.title = "Оплатити";
    button.setAttribute("aria-label", button.title);
    button.textContent = "Оплатити";
    host.appendChild(button);
  }

  if (!isResidentMode || !payUrl) {
    button.style.display = "none";
    button.onclick = null;
    return;
  }

  button.style.display = "";
  button.onclick = function () {
    window.open(payUrl, "_blank", "noopener,noreferrer");
  };
}

function moneyText(value) {
  const num = Number(value) || 0;
  return `${num.toFixedWithComma()} грн`;
}

function base64UrlEncodeUtf8(input) {
  const text = String(input || "");
  let binary = "";
  const bytes = new TextEncoder().encode(text);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildNbuQrLink(params) {
  const receiver = String(params?.receiver || "").trim();
  const iban = String(params?.iban || "").trim();
  if (!receiver || !iban || receiver === "—" || iban === "—") return "";

  const code = String(params?.code || "").trim();
  const purpose = String(params?.purpose || "").trim();
  const amountNum = Math.max(Number(params?.amount) || 0, 0);
  const amount = amountNum.toFixed(2);

  let payload = [
    "BCD",
    "002",
    "2",
    "UCT",
    "",
    receiver,
    iban,
    `UAH${amount}`,
    code,
    "",
    "",
    purpose,
    "",
    ""
  ].join("\n");

  if (payload.length > 500) payload = payload.slice(0, 500);
  payload = payload.replace(/і/g, "i").replace(/І/g, "I");
  return `https://bank.gov.ua/qr/${base64UrlEncodeUtf8(payload)}`;
}

function buildQrImageUrl(data, size) {
  const safeSize = Number(size) > 0 ? Number(size) : 220;
  return "https://api.qrserver.com/v1/create-qr-code/?" +
    "size=" + encodeURIComponent(`${safeSize}x${safeSize}`) +
    "&ecc=L" +
    "&qzone=4" +
    "&format=svg" +
    "&data=" + encodeURIComponent(String(data || ""));
}

function moneySigned(value) {
  return `${(Number(value) || 0).toFixedWithComma()} грн`;
}

function normalizeMoney(value) {
  const num = Number(value) || 0;
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
}

function formatResidentAsOfDate(rawDateTime) {
  const raw = String(rawDateTime || "").trim();
  if (!raw) return "—";
  const datePart = raw.split(" ")[0] || "";
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(datePart)) {
    return `${datePart} року`;
  }
  return raw;
}

function balanceMeta(balance) {
  const value = normalizeMoney(balance);
  if (value > 0) {
    return {
      cls: "debt",
      status: "Заборгованість",
      currentLabel: "Поточна заборгованість складає"
    };
  }
  if (value < 0) {
    return {
      cls: "credit",
      status: "Переплата",
      currentLabel: "Поточна переплата складає"
    };
  }
  return {
    cls: "neutral",
    status: "Заборгованості немає",
    currentLabel: "Поточний баланс складає"
  };
}

function openingBalanceLabel(value) {
  const num = Number(value) || 0;
  if (num > 0) return "На початок року заборгованість складала";
  if (num < 0) return "На початок року була переплата";
  return "На початок року баланс рахунку складав";
}

function pickRequisites(homeCode, accountData) {
  const home = Array.isArray(homes)
    ? homes.find(h => String(h?.code || "") === String(homeCode || ""))
    : null;
  const details = Object.assign({}, window.residentHomeMeta || {}, home || {});
  let ibanValue = details.Iban || details.iban || "";
  let mfoValue = details.MFO || details.mfo || details["МФО"] || "";
  if (!mfoValue && ibanValue && String(ibanValue).length >= 10) {
    mfoValue = String(ibanValue).substring(4, 10);
  }
  const destination = `ОР ${accountData?.ls || ""}, ${adr || ""}/${accountData?.kv || ""}, ${accountData?.fio || ""}, внесок на управління будинком`;

  return {
    receiver: details.name || details.ORGKR || org || "—",
    code: details.code || details.okpo || homeCode || "—",
    iban: ibanValue || "—",
    bank: details.Bank || details.bank || "—",
    mfo: mfoValue || "—",
    viberQr: String(details.ViberQr || details.viberQr || "").trim(),
    privatToken: String(details.privatToken || details.PrivatToken || details.privat_token || "").trim(),
    privatQr: String(details.PrivatQr || details.privatQr || details.privat_qr || "").trim(),
    privatQrLen: String(details.PrivatQRLen || details.privatQrLen || details.privat_qr_len || "").trim(),
    purpose: destination
  };
}

function requisitesNeedHydration(requisites) {
  if (!requisites || typeof requisites !== "object") return true;
  const iban = String(requisites.iban || "").trim();
  const bank = String(requisites.bank || "").trim();
  return !iban || iban === "—" || !bank || bank === "—";
}

async function fetchHomeMetaByCode(homeCode) {
  const code = String(homeCode || "").trim();
  if (!code || !window.client || typeof client.from !== "function") return null;
  try {
    const { data, error } = await client
      .from("homes")
      .select("data")
      .eq("code", code)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const raw = data.data;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function mergeRequisites(requisites, meta, homeCode) {
  const merged = Object.assign({}, requisites || {});
  const source = meta || {};
  merged.receiver = merged.receiver === "—" ? (source.name || source.ORGKR || merged.receiver) : merged.receiver;
  merged.code = merged.code === "—" ? (source.code || source.okpo || homeCode || merged.code) : merged.code;
  merged.iban = merged.iban === "—" ? (source.Iban || source.iban || merged.iban) : merged.iban;
  merged.bank = merged.bank === "—" ? (source.Bank || source.bank || merged.bank) : merged.bank;
  if (merged.mfo === "—") {
    merged.mfo = source.MFO || source.mfo || source["МФО"] || merged.mfo;
  }
  if ((merged.mfo === "—" || !merged.mfo) && merged.iban && merged.iban !== "—" && String(merged.iban).length >= 10) {
    merged.mfo = String(merged.iban).substring(4, 10);
  }
  if (!merged.privatToken) {
    merged.privatToken = String(source.privatToken || source.PrivatToken || source.privat_token || "").trim();
  }
  if (!merged.privatQr) {
    merged.privatQr = String(source.PrivatQr || source.privatQr || source.privat_qr || "").trim();
  }
  if (!merged.privatQrLen) {
    merged.privatQrLen = String(source.PrivatQRLen || source.privatQrLen || source.privat_qr_len || "").trim();
  }
  return merged;
}

function renderRequisitesFields(requisites) {
  const setText = function (id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "—";
  };
  setText("resident-rec-receiver", requisites.receiver);
  setText("resident-rec-code", requisites.code);
  setText("resident-iban-value", requisites.iban);
  setText("resident-rec-bank", requisites.bank);
  setText("resident-rec-mfo", requisites.mfo);
}

async function bindCopyButton(buttonId, textProvider, okText) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.onclick = async function () {
    const text = typeof textProvider === "function" ? textProvider() : textProvider;
    const copied = await copyTextPortable(String(text || ""));
    if (copied) {
      showMessage(okText);
    } else {
      showMessage("Не вдалося скопіювати", "err");
    }
  };
}

async function bindCopyRows(root) {
  const container = typeof root === "string" ? document.querySelector(root) : root;
  if (!container) return;

  const rows = container.querySelectorAll(".resident-copy-row");
  rows.forEach(function (row) {
    row.style.cursor = "copy";
    row.title = "Натисніть, щоб скопіювати значення";
    row.onclick = async function (e) {
      if (e.target.closest("a,button,input,textarea,select")) return;
      const valueEl = row.querySelector(".resident-copy-value");
      const value = String(valueEl ? valueEl.textContent : "").trim();
      if (!value || value === "—") return;

      const copied = await copyTextPortable(value);
      if (copied) {
        showMessage("Скопійовано");
      } else {
        showMessage("Не вдалося скопіювати", "err");
      }
    };
  });
}

function addStuff(accountId) {
  if (document.body.classList.contains("resident-mode")) {
    return addStuffResident(accountId);
  }
  return addStuffRegular(accountId);
}

function addStuffRegular(accountId) {
  return addStuffCore(accountId, false);
}

function addStuffResident(accountId) {
  return addStuffCore(accountId, true);
}

function addStuffCore(accountId, isResidentMode) {
  var accountData = nach[accountId] || {}; // Данные для указанного accountId
  var paymentData = oplat[accountId] || {}; // Данные оплат для указанного accountId

  for (const paymentYear in paymentData) {
        if (!accountData[paymentYear]) {
            accountData[paymentYear] = {};
        }
        for (const paymentMonth in paymentData[paymentYear]) {
            if (!accountData[paymentYear][paymentMonth]) {
                accountData[paymentYear][paymentMonth] = { 1: 0 };
            }
        }
    }  
  const link=(Array.isArray(homes) ? homes.find(h => h.code == getParam('homeCode')) : null)?.token ?? "";
  const adrLink=document.getElementById("adr")
  const currentKv=ls[accountId].kv;
const payUrl = buildPrivat24PayUrl(link, currentKv);

if (payUrl && !isResidentMode) {
  adrLink.href = payUrl;
  adrLink.target = "_blank";       // открывать в новой вкладке
  adrLink.rel = "noopener noreferrer"; // безопасное открытие
} else {
  adrLink.removeAttribute("href");
  adrLink.removeAttribute("target");
  adrLink.removeAttribute("rel");
}
  ensurePayButton(payUrl, isResidentMode);
  if (!isResidentMode) {
    ensureResidentCabinetButton(accountId);
  }

  var container = document.getElementById("din"); // Контейнер для таблицы
  container.innerHTML = ""; // Очищаем контейнер перед добавлением новой таблицы
  var curLS = ls[accountId] || {};
  document.getElementById("fio").textContent = curLS.fio || "";
  const lsHeadEl = document.getElementById("ls-head");
  if (lsHeadEl) {
    lsHeadEl.textContent = curLS.ls || "—";
  }
  if (!accountData) {
    container.innerHTML = "<p>Дані для ID " + accountId + " не знайдено.</p>";
    return;
  }
  if (isResidentMode) {
    container.classList.add("resident-cabinet");
  } else {
    container.classList.remove("resident-cabinet");
  }
  var cumulativeBalance = 0;
  var currentMonth = new Date().getMonth(); // Текущий месяц
  var currentYear = new Date().getFullYear();
  var lastYearToggle; // Переменная для хранения чекбокса последнего года
  var lastRow;
  var lastRowExtraRows = [];
  var yearSummaries = {};
  var residentOverviewRoot = null;
  var residentRequisitesRoot = null;
  var residentViberRoot = null;
  var historyHost = container;
  var historyContentHost = container;
  var residentHistoryDetails = null;
  var lastYearTarifSummaryBlock = null;

  if (isResidentMode) {
    residentOverviewRoot = document.createElement("section");
    residentOverviewRoot.className = "resident-overview-card";
    container.appendChild(residentOverviewRoot);

    residentRequisitesRoot = document.createElement("section");
    residentRequisitesRoot.className = "resident-requisites-card";
    container.appendChild(residentRequisitesRoot);

    historyHost = document.createElement("section");
    historyHost.className = "resident-history-block";
    historyHost.innerHTML =
      '<details class="resident-history-details">' +
      '  <summary>Історія нарахувань та оплат</summary>' +
      '  <div class="resident-history-content"></div>' +
      '</details>';
    residentHistoryDetails = historyHost.querySelector(".resident-history-details");
    historyContentHost = historyHost.querySelector(".resident-history-content") || historyHost;
    container.appendChild(historyHost);

    residentViberRoot = document.createElement("section");
    residentViberRoot.className = "resident-viber-card";
    residentViberRoot.style.display = "none";
    container.appendChild(residentViberRoot);
  }
  var allYearsSorted = Object.keys(accountData).sort(function (a, b) {
    return Number(a) - Number(b);
  });
  var yearsToRender = allYearsSorted.filter(function (yearKey) {
    if (!isResidentMode) return true;
    var yearNum = Number(yearKey);
    return Number.isFinite(yearNum) && yearNum >= 2025;
  });

  // В resident-режиме считаем входящее сальдо по "скрытым" годам (< 2025),
  // чтобы долги в отображаемых годах были корректными.
  if (isResidentMode) {
    var hiddenYears = allYearsSorted.filter(function (yearKey) {
      var yearNum = Number(yearKey);
      return Number.isFinite(yearNum) && yearNum < 2025;
    });

    hiddenYears.forEach(function (hiddenYear) {
      var months = Object.keys(accountData[hiddenYear] || {}).sort(function (a, b) {
        return Number(a) - Number(b);
      });

      months.forEach(function (monthKey) {
        var monthChargesByService = accountData[hiddenYear][monthKey] || {};
        var monthCharge = Object.values(monthChargesByService).reduce(function (sum, value) {
          return sum + (Number(value) || 0);
        }, 0);

        var monthPayments = ((paymentData[hiddenYear] || {})[monthKey] || []).reduce(function (sum, payment) {
          return sum + (Number(payment && payment.sum) || 0);
        }, 0);

        cumulativeBalance += monthCharge - monthPayments;
      });
    });
  }

  var _loop = function _loop(year) {
    var yearDiv = document.createElement("div");
    var balanceDiv = document.createElement("div");
    var yearToggle = document.createElement("input");
    var yearLabel = document.createElement("label");
    var yearContent = document.createElement("div");
    var openingBalanceForYear = cumulativeBalance;

    // Настройка чекбокса для разворачивания/сворачивания
    yearToggle.className = "toggle-box";
    yearToggle.id = `block-${year}`;
    yearToggle.type = "checkbox";
    yearLabel.setAttribute("for", `block-${year}`);
    yearLabel.innerHTML = `<div>${year}</div>`;
    yearContent.className = "box";
    var table = document.createElement("table");
    table.id = "main";
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");

    // Определение уникальных услуг для текущего года
    var services = new Set();
    for (var month in accountData[year]) {
      for (var serviceId in accountData[year][month]) {
        services.add(serviceId);
      }
    }

    // Заголовок таблицы
    var headerRow = document.createElement("tr");
const servicesCount = [...services].filter(n => n !== "7").length;

headerRow.innerHTML = `
  <td rowspan="2" align="center" class="clickable">Місяць</td>
  <td colspan="${servicesCount}" align="center" class="clickable">
    Нараховано за місяць
  </td>
  <td rowspan="2" align="center" class="clickable">
    Оплачено в місяці<br>(число, сума, період)
  </td>
  <td rowspan="2" align="center" class="clickable">
    Борг(+) Переплата(-) на кінець місяця
  </td>
`;

    // Добавляем обработчик кликов к заголовкам
    //Array.from(headerRow.children).forEach(function (header, index) {
    //  header.addEventListener("click", handleHeaderClick);
    //});
    thead.appendChild(headerRow);

    // Второй ряд заголовка с названиями услуг
    var servicesRow = document.createElement("tr");
    services.forEach(function (serviceId) {
      if (serviceId != 7) {
      	var serviceName = us[serviceId] || `Услуга ${serviceId}`;
        var serviceHeader = document.createElement("td");
        serviceHeader.setAttribute("align", "CENTER");
        serviceHeader.textContent = serviceName;
        serviceHeader.classList.add("clickable"); // Добавляем класс

        // Навешиваем обработчик клика
        //serviceHeader.addEventListener("click", handleHeaderClick);
        servicesRow.appendChild(serviceHeader);
      }
    });
    thead.appendChild(servicesRow); // Добавляем строку с услугами в заголовок


if (cumulativeBalance !== 0) {
  var balanceRow = document.createElement("tr");
  var balanceCell = document.createElement("td");

  // colspan зависит от количества колонок: 1 (месяц) + n (услуги) + 1 (оплата) + 1 (баланс)
  var colSpan = 3 + [...services].filter(n => n !== "7").length;
  balanceCell.colSpan = colSpan;
  balanceCell.className = "balance-info";

  var balanceText =
    cumulativeBalance > 0
      ? "⚠️ Вхідний борг на початок року"
      : "✅ Вхідна переплата на початок року";

  var balanceValue = document.createElement("span");
  balanceValue.textContent = cumulativeBalance.toFixedWithComma();
  balanceValue.classList.add(cumulativeBalance > 0 ? "red" : "green");

  balanceCell.innerHTML = `${balanceText}: `;
  balanceCell.appendChild(balanceValue);
  //balanceCell.append(" грн.");
  balanceRow.appendChild(balanceCell);
  //balanceRow.appendChild(balanceValue);
  tbody.appendChild(balanceRow);
}




    // Переменные для итоговых сумм по году
    var totalChargesByService = {};
    var totalPaymentsByService = {};
    var totalChargeForYear = 0;
    var totalPaymentsForYear = 0;
    // Заполнение таблицы данными по месяцам
    var _loop2 = function _loop2() {
      var _paymentData$year;
      // Пропускаем текущий месяц

      var transactions = accountData[year][_month];
      var cur = _month == currentMonth + 1 && year == currentYear;
      var prevMonthTransactions = getPrevMonthTransactions(accountData, year, _month);
      var monthTarifNotes = buildTarifMonthNotes(year, _month, transactions, prevMonthTransactions, curLS, isResidentMode);
      var row = document.createElement("tr");
      var monthTitleText = `${getMonthName(_month)} ${year}`;
      row.innerHTML = `<td align="LEFT">${monthTitleText}${isResidentMode && cur ? '<div class="resident-current-month-note">попередньо</div>' : ""}</td>`;
      var rowCharges = {};
      var monthlyChargesTotal = 0;
      services.forEach(function (serviceId) {
        var charge = transactions[serviceId] || 0;
        rowCharges[serviceId] = charge;
        monthlyChargesTotal += charge;
      });

      // Добавляем начисления по каждой услуге в строку
      services.forEach(function (serviceId) {
        var charge = rowCharges[serviceId];
        var cell = document.createElement("td");
        if (serviceId == 1 && rowCharges[7]) charge += rowCharges[7];
        cell.textContent = charge != 0 ? charge.toFixedWithComma() : "";
        if (serviceId == 1 && rowCharges[7]) {
          cell.className = "poster"; // Добавляем класс оформления
          cell.innerHTML = `${charge.toFixedWithComma()}<div class="descr">Утримання будинку:${rowCharges[1].toFixedWithComma()} грн.<br>Вивіз ТПВ:${rowCharges[7].toFixedWithComma()} грн.</div>`;
        }
        if (serviceId == 13){
        const val = nachnote?.[accountId]?.[year]?.[_month]?.[13];

        const noteText = Array.isArray(val)
	  ? val.join('\n')
	  : (val ?? '');

        if (noteText) {
          //console.log(noteText);
          cell.className = "poster"; // Добавляем класс оформления
          cell.innerHTML = `${charge.toFixedWithComma()}<div class="descr">${noteText.replace(/\n/g, "<br>")}</div>`;
        }
        }
        if (serviceId != 7) row.appendChild(cell);
      });
      // Получаем данные оплат за текущий месяц
      var monthlyPayments =
        ((_paymentData$year = paymentData[year]) === null ||
        _paymentData$year === void 0
          ? void 0
          : _paymentData$year[_month]) || [];
      var totalPayments = createPaymentCell(row, monthlyPayments, accountId);
      if (!cur) {
        cumulativeBalance += monthlyChargesTotal - totalPayments;
        // Сохраняем суммы для итогов
        services.forEach(function (serviceId) {
          totalChargesByService[serviceId] =
            (totalChargesByService[serviceId] || 0) + rowCharges[serviceId];
        });
        totalPaymentsForYear += totalPayments;
      }

      // Добавляем ячейку с долгом/переплатой
      var balanceCell = document.createElement("td");
      if (cur) {
        balanceCell.textContent = (
          cumulativeBalance +
          monthlyChargesTotal -
          totalPayments
        ).toFixedWithComma();
        if (cumulativeBalance + monthlyChargesTotal - totalPayments > 0)
          balanceCell.classList.add("red");
        else balanceCell.classList.add("green");
      } else {
        balanceCell.textContent = cumulativeBalance.toFixedWithComma();
        if (cumulativeBalance > 0) balanceCell.classList.add("red");
        else balanceCell.classList.add("green");
      }
      row.appendChild(balanceCell);
      var noteRows = buildTarifNoteRows(monthTarifNotes, row.children.length, cur);
      if (noteRows.length) {
        row.classList.add("has-tarif-note");
      }
      if (cur) {
        row.classList.add("grey");
        lastRow = row;
        lastRowExtraRows = noteRows;
      } else {
        noteRows.forEach(function (noteRow) {
          tbody.appendChild(noteRow);
        });
        tbody.appendChild(row);
      }
    };
    for (var _month in accountData[year]) {
      _loop2();
    }
    // Итоги по году
    if (
      Array.from(services).filter(function (n) {
        return n !== "7";
      }).length > 1
    ) {
      // Если несколько услуг
      var totalRow = document.createElement("tr");
      totalRow.classList.add("itog");
totalRow.innerHTML =`<td rowspan="2" align="center">Разом за ${year} рік</td>`;

      // Итог по каждой услуге
      services.forEach(function (serviceId) {
        var chargeTotal = totalChargesByService[serviceId] || 0;
        if (serviceId == 1) chargeTotal += totalChargesByService[7] || 0;
        var totalCell = document.createElement("td");
        totalCell.textContent = chargeTotal.toFixedWithComma();
        if (serviceId != 7) totalRow.appendChild(totalCell);
      });

      // Общая сумма оплаченных денег
      var totalPaymentsCell = document.createElement("td");
      totalPaymentsCell.rowSpan = 2;
      totalPaymentsCell.textContent = totalPaymentsForYear.toFixedWithComma();
      totalRow.appendChild(totalPaymentsCell);

      // Общий долг/переплата на конец года
      var finalBalanceCell = document.createElement("td");
      finalBalanceCell.rowSpan = 2;
      if (cumulativeBalance > 0) finalBalanceCell.classList.add("red");
      else finalBalanceCell.classList.add("green");
      finalBalanceCell.textContent = cumulativeBalance.toFixedWithComma();
      totalRow.appendChild(finalBalanceCell);
      tbody.appendChild(totalRow);

      // Ряд с итогами по всем услугам
      var chargesSummaryRow = document.createElement("tr");
      chargesSummaryRow.classList.add("itog");
      var totalChargeForAllServices = Object.values(
        totalChargesByService
      ).reduce(function (sum, value) {
        return sum + value;
      }, 0);
const servicesCount = Array.from(services).filter(n => n !== "7").length;


chargesSummaryRow.innerHTML =
  `<td colspan="${servicesCount}" align="center">
     Усього нараховано: ${totalChargeForAllServices.toFixedWithComma()}
   </td>`;

      tbody.appendChild(chargesSummaryRow);
    } else {
      var _Object$values$;
      // Если одна услуга
      var _totalRow = document.createElement("tr");
      _totalRow.classList.add("itog");
_totalRow.innerHTML =
  `<td align="left">Разом за ${year} рік</td>`;


      // Итог начислений по единственной услуге
      var totalChargeForOneService =
        Object.values(totalChargesByService)[0] || 0; // Получаем сумму для единственной услуги
      totalChargeForOneService +=
        (_Object$values$ = Object.values(totalChargesByService)[1]) !== null &&
        _Object$values$ !== void 0
          ? _Object$values$
          : 0;
      _totalRow.innerHTML += `<td>${totalChargeForOneService.toFixedWithComma()}</td>`;

      // Итог по оплатам (без учета текущего месяца текущего года)
      var totalPaymentsForOneService = 0;
      for (var _month2 in paymentData[year]) {
        if (!(year == currentYear && _month2 == currentMonth + 1)) {
          // Исключаем только текущий месяц текущего года
          var monthlyPayments = paymentData[year][_month2] || [];
          var monthPaymentsSum = monthlyPayments.reduce(function (
            sum,
            payment
          ) {
            return sum + payment.sum;
          },
          0);
          totalPaymentsForOneService += monthPaymentsSum;
        }
      }
      _totalRow.innerHTML += `<td>${totalPaymentsForOneService.toFixedWithComma()}</td>`;

      // Общий долг/переплата на конец года
      _totalRow.innerHTML += `<td class="${cumulativeBalance > 0 ? "red" : "green"}">${cumulativeBalance.toFixedWithComma()}</td>`;
      tbody.appendChild(_totalRow);
    }
    if (lastRow) {
      lastRowExtraRows.forEach(function (noteRow) {
        tbody.appendChild(noteRow);
      });
      tbody.appendChild(lastRow);
    }
    var latestTarifSummaryNotes = [];
    var lastRenderedYear = yearsToRender[yearsToRender.length - 1];
    if (String(year) === String(lastRenderedYear)) {
      latestTarifSummaryNotes = buildLatestTarifSummaryNotesForYear(year, accountData[year] || {}, services, curLS);
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    yearContent.appendChild(table);
    yearContent.dataset.id = "block-" + year;


const yearBlock = document.createElement("div");
yearBlock.className = "year-block";

yearContent.classList.add("year-table");
yearContent.dataset.id = "block-" + year;

yearBlock.appendChild(yearToggle);
yearBlock.appendChild(yearLabel);
yearBlock.appendChild(yearContent);

historyContentHost.appendChild(yearBlock);
if (latestTarifSummaryNotes.length) {
  var tarifSummaryBlock = buildTarifSummaryBlock(latestTarifSummaryNotes);
  if (tarifSummaryBlock) {
    if (isResidentMode) {
      tarifSummaryBlock.classList.add("resident-history-note");
      lastYearTarifSummaryBlock = tarifSummaryBlock;
    } else {
      historyContentHost.appendChild(tarifSummaryBlock);
    }
  }
}

//yearsBar.appendChild(yearToggle);
//yearsBar.appendChild(yearLabel);
//yearContent.classList.add("year-table");
//container.appendChild(yearContent);

    var totalAccruedForYear = Object.values(totalChargesByService).reduce(function (sum, value) {
      return sum + (Number(value) || 0);
    }, 0);
    yearSummaries[year] = {
      openingBalance: openingBalanceForYear,
      accrued: totalAccruedForYear,
      paid: totalPaymentsForYear,
      closingBalance: cumulativeBalance
    };

    lastYearToggle = yearToggle; // Сохраняем чекбокс последнего года
  };
var yearsBar = document.createElement("div");
yearsBar.id = "years-bar";
historyContentHost.appendChild(yearsBar);

  yearsToRender.forEach(function (year) {
    _loop(year);
  });

if (isResidentMode) {
  var historyNoteMonths = [
    "січень", "лютий", "березень", "квітень", "травень", "червень",
    "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"
  ];
  var historyNoteMonthName = historyNoteMonths[Math.max(0, Math.min(11, currentMonth))];
  var historyNote = document.createElement("p");
  historyNote.className = "resident-history-note";
  historyNote.textContent = `* За ${historyNoteMonthName} ${currentYear} р. показано попередній розрахунок. Остаточна сума може змінитися після надходження та обробки оплат.`;
  historyContentHost.appendChild(historyNote);
  if (lastYearTarifSummaryBlock) {
    historyContentHost.appendChild(lastYearTarifSummaryBlock);
  }
}

const preferredYearToggle = document.getElementById(`block-${currentYear}`);
const toggleToOpen = preferredYearToggle || lastYearToggle;
if (toggleToOpen) {
    toggleToOpen.checked = true;

    const id = toggleToOpen.id;
    const table = document.querySelector(`.year-table[data-id="${id}"]`);
    if (table) {
        table.classList.add("active");
    }

    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
        label.classList.add("active");
    }
}

  if (isResidentMode && residentOverviewRoot) {
    const summaryYear =
      yearSummaries[String(currentYear)] ? String(currentYear) :
      (yearsToRender[yearsToRender.length - 1] || allYearsSorted[allYearsSorted.length - 1] || String(currentYear));

    const summary = yearSummaries[summaryYear] || {
      openingBalance: 0,
      accrued: 0,
      paid: 0,
      closingBalance: cumulativeBalance
    };

    const currentMonthKey = String(currentMonth + 1);
    const currentYearKey = String(currentYear);
    const currentMonthPaidNowRaw =
      summaryYear === currentYearKey
        ? (((paymentData[currentYearKey] || {})[currentMonthKey] || []).reduce(function (sum, payment) {
            return sum + (Number(payment && payment.sum) || 0);
          }, 0))
        : 0;
    const currentMonthPaidNow = normalizeMoney(currentMonthPaidNowRaw);
    const currentMonthAccruedRaw =
      summaryYear === currentYearKey
        ? Object.values(((accountData[currentYearKey] || {})[currentMonthKey] || {})).reduce(function (sum, value) {
            return sum + (Number(value) || 0);
          }, 0)
        : 0;
    const currentMonthAccrued = normalizeMoney(currentMonthAccruedRaw);
    const hasPaymentThisMonth = currentMonthPaidNow >= 0.01;

    const currentBalance = normalizeMoney((Number(summary.closingBalance) || 0) - currentMonthPaidNow);
    const debtTolerance = 10;
    const effectiveBalance = currentBalance > 0 && currentBalance <= debtTolerance ? 0 : currentBalance;
    const shouldCollapseHistory =
      effectiveBalance <= 0 ||
      (currentMonthAccrued > 0.005 && effectiveBalance < 3 * currentMonthAccrued);
    if (residentHistoryDetails) {
      residentHistoryDetails.open = !shouldCollapseHistory;
    }
    const recommendedToPay = Math.max(effectiveBalance, 0);
    const meta = balanceMeta(effectiveBalance);
    const updatedAtText = formatResidentAsOfDate(dt);
    const updatedAtShort = String(updatedAtText || "").replace(/\s*року$/i, "");
    const asOfDate = updatedAtShort || "—";
    const statusHeadline = `Станом на ${asOfDate}`;
    const statusText =
      effectiveBalance > 0
        ? "Заборгованість"
        : effectiveBalance < 0
          ? "Переплата"
          : "Заборгованість відсутня";
    const requisites = pickRequisites(getParam("homeCode"), curLS);
    const viberUrl = String(requisites.viberQr || "").trim();
    const hasViberQr = viberUrl.length > 0;
    const privatQrValue = String(requisites.privatQr || "").trim();
    const privatTokenValue = String(requisites.privatToken || "").trim();
    const privatQrLenRaw = String(requisites.privatQrLen || "").trim();
    const accountLsRaw = String(curLS.ls || "").trim();
    const privatQrLenNum = Number(privatQrLenRaw);
    let qrLsPart = accountLsRaw;
    if (Number.isFinite(privatQrLenNum) && privatQrLenNum > 0 && privatQrLenNum > accountLsRaw.length) {
      qrLsPart = "0".repeat(privatQrLenNum - accountLsRaw.length) + accountLsRaw;
    }
    const privatQrPayload = `EK_V3_ls_${qrLsPart}_${privatQrValue}`;
    const hasPrivatQr = !!payUrl && privatQrValue.length > 0 && (privatTokenValue.length > 0 || !!payUrl);
    const monthNamesNom = [
      "січень", "лютий", "березень", "квітень", "травень", "червень",
      "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"
    ];
    const monthNamesGen = [
      "січня", "лютого", "березня", "квітня", "травня", "червня",
      "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
    ];
    const monthNamesLoc = [
      "січні", "лютому", "березні", "квітні", "травні", "червні",
      "липні", "серпні", "вересні", "жовтні", "листопаді", "грудні"
    ];
    const currentMonthNameGen = monthNamesGen[Math.max(0, Math.min(11, currentMonth))];
    const currentMonthNameNom = monthNamesNom[Math.max(0, Math.min(11, currentMonth))];
    const currentMonthNameLoc = monthNamesLoc[Math.max(0, Math.min(11, currentMonth))];
    const currentMonthYearLocLabel = `${currentMonthNameLoc} ${summaryYear} р.`;
    const nbuPurpose = `кв.${curLS.ls || ""}`.trim();
    const nbuQrLink = buildNbuQrLink({
      receiver: requisites.receiver,
      iban: requisites.iban,
      code: requisites.code,
      purpose: nbuPurpose,
      amount: recommendedToPay
    });
    const hasNbuQr = nbuQrLink.length > 0;
    const hasBothPayOptions = hasPrivatQr && hasNbuQr;
    const completedMonthsCount =
      summaryYear === currentYearKey
        ? Math.max(0, Math.min(12, currentMonth))
        : 12;
    let periodLabel = `за ${summaryYear} р.`;
    if (completedMonthsCount > 0 && completedMonthsCount < 12) {
      const firstMonth = monthNamesNom[0];
      const lastMonth = monthNamesNom[completedMonthsCount - 1];
      periodLabel =
        completedMonthsCount === 1
          ? `за ${firstMonth} ${summaryYear} р.`
          : `за ${firstMonth}-${lastMonth} ${summaryYear} р.`;
    }
    const currentMonthPaidLine =
      currentMonthPaidNow >= 0.01
        ? `<p>У ${monthNamesLoc[Math.max(0, Math.min(11, currentMonth))]} ${summaryYear} р. вже сплачено ${moneyText(currentMonthPaidNow)}.</p>`
        : "";
    const periodPaidLine =
      normalizeMoney(summary.paid) >= 0.01
        ? `<p>${periodLabel} було сплачено ${moneyText(summary.paid)}.</p>`
        : "";
    let advisoryTone = "neutral";
    let advisoryText = "";
    const debtNow = Math.max(effectiveBalance, 0);
    if (effectiveBalance < 0) {
      advisoryTone = "good";
      advisoryText = "Дякуємо за випереджувальну сплату внесків. Переплата на особовому рахунку допомагає будинку своєчасно оплачувати необхідні послуги, здійснювати обслуговування та виконувати поточні роботи.";
    } else if (effectiveBalance === 0) {
      advisoryTone = "good";
      advisoryText = "Дякуємо за своєчасну сплату внесків. Регулярна оплата допомагає будинку своєчасно оплачувати необхідні послуги, здійснювати обслуговування та виконувати поточні роботи.";
    } else {
      const hasMonthBase = currentMonthAccrued > 0.005;
      const triple = hasMonthBase ? 3 * currentMonthAccrued : Number.POSITIVE_INFINITY;
      const sixfold = hasMonthBase ? 6 * currentMonthAccrued : Number.POSITIVE_INFINITY;
      if (debtNow > sixfold && !hasPaymentThisMonth) {
        advisoryTone = "critical";
        advisoryText = "За особовим рахунком обліковується тривала заборгованість, оплата останнім часом не надходила. Просимо терміново погасити борг або звернутися для звірки. У разі подальшої несплати матеріали можуть бути передані для претензійно-позовної роботи, що може призвести до додаткових витрат боржника.";
      } else if (debtNow > triple && !hasPaymentThisMonth) {
        advisoryTone = "danger";
        advisoryText = "За особовим рахунком обліковується значна заборгованість, а у поточному місяці оплата не надходила. Просимо здійснити оплату або звернутися для звірки. Накопичення боргу ускладнює своєчасну оплату послуг, здійснення обслуговування та виконання робіт, необхідних для утримання будинку.";
      } else if (debtNow > triple && hasPaymentThisMonth) {
        advisoryTone = "warn";
        advisoryText = "Дякуємо, що у поточному місяці була здійснена оплата. Разом з тим, за особовим рахунком ще залишається заборгованість. Просимо поступово погасити залишок або звернутися для звірки, якщо сума потребує уточнення.";
      } else {
        advisoryTone = "neutral";
        advisoryText = "Дякуємо за участь у забезпеченні роботи будинку. За особовим рахунком є поточна сума до сплати. Просимо за можливості сплатити внески своєчасно, щоб будинок міг без затримок оплачувати необхідні послуги, здійснювати обслуговування та виконувати поточні роботи.";
      }
    }
    const advisoryHtml = `<div class="resident-advice resident-advice-${advisoryTone}">${advisoryText}</div>`;
    const advisoryContactHtml = `
      <div class="resident-advice-contact">
        Якщо у Вас є питання щодо нарахувань або оплат, зверніться для звірки:
        <a href="mailto:abon.omega@gmail.com">abon.omega@gmail.com</a>
      </div>
    `;
    const balanceExplainHtml =
      currentMonthPaidNow >= 0.01
        ? `<div class="resident-balance-explain">Поточний баланс враховує оплати, що вже надійшли у ${currentMonthYearLocLabel} Нарахування за ${currentMonthNameNom} ${summaryYear} р. показано нижче у таблиці як попередній розрахунок.</div>`
        : "";
    const payOptionsHtml = hasBothPayOptions
      ? `
        <div id="resident-pay-privat-pane" class="resident-pay-pane">
          <div id="resident-privat-pay-content" class="resident-pay-details-content">
            <a id="resident-privat-qr-link" class="resident-privat-qr-link" target="_blank" rel="noopener noreferrer">
              <span class="resident-privat-qr-frame">
                <img id="resident-privat-qr-img" alt="Privat24 QR" class="resident-privat-qr-img">
                <img src="img/24.png" alt="" aria-hidden="true" class="resident-privat-qr-icon">
              </span>
              <span class="resident-privat-qr-note">Скануйте в мобільному застосунку Privat24</span>
            </a>
          </div>
          <button id="resident-switch-to-nbu" type="button" class="resident-pay-switch">▸ Оплатити з іншого банку</button>
        </div>
        <div id="resident-pay-nbu-pane" class="resident-pay-pane" hidden>
          <div class="resident-pay-details-content">
            <a id="resident-nbu-qr-link" class="resident-privat-qr-link" target="_blank" rel="noopener noreferrer">
              <span class="resident-privat-qr-frame">
                <img id="resident-nbu-qr-img" alt="NBU QR" class="resident-privat-qr-img">
              </span>
              <span class="resident-privat-qr-note">Скануйте у мобільному застосунку банку</span>
            </a>
          </div>
          <button id="resident-switch-to-privat" type="button" class="resident-pay-switch">▸ Оплатити з Приватбанку</button>
        </div>
      `
      : hasPrivatQr
        ? `
          <a id="resident-privat-qr-link" class="resident-privat-qr-link" target="_blank" rel="noopener noreferrer">
            <span class="resident-privat-qr-frame">
              <img id="resident-privat-qr-img" alt="Privat24 QR" class="resident-privat-qr-img">
              <img src="img/24.png" alt="" aria-hidden="true" class="resident-privat-qr-icon">
            </span>
            <span class="resident-privat-qr-note">Скануйте в мобільному застосунку Privat24</span>
          </a>
        `
        : hasNbuQr
          ? `
            <a id="resident-nbu-qr-link" class="resident-privat-qr-link" target="_blank" rel="noopener noreferrer">
              <span class="resident-privat-qr-frame">
                <img id="resident-nbu-qr-img" alt="NBU QR" class="resident-privat-qr-img">
              </span>
              <span class="resident-privat-qr-note">Скануйте у мобільному застосунку банку</span>
            </a>
          `
          : "";
    residentOverviewRoot.innerHTML = `
      <h2>Поточний стан рахунку</h2>
      <div class="resident-status resident-${meta.cls}">
        <span class="resident-status-left">
          <span class="resident-status-title">${statusHeadline}</span>
          <span class="resident-status-pill resident-${meta.cls}">${statusText}</span>
        </span>
        <strong>${moneyText(Math.abs(currentBalance))}</strong>
      </div>
      <div class="resident-overview-body">
        <div class="resident-overview-main">
          ${balanceExplainHtml}
          <div class="resident-overview-details">
            <p>${openingBalanceLabel(summary.openingBalance)} ${moneyText(Math.abs(summary.openingBalance))}.</p>
            <p>${periodLabel} було нараховано ${moneyText(summary.accrued)}.</p>
            ${periodPaidLine}
            ${currentMonthPaidLine}
            <p><strong>${meta.currentLabel}: <span class="resident-${meta.cls}">${moneyText(Math.abs(currentBalance))}</span>.</strong></p>
          </div>
          ${advisoryHtml}
          ${advisoryContactHtml}
        </div>
        <div class="resident-recommended">
          <div id="resident-pay-slot">
            ${payOptionsHtml}
          </div>
        </div>
      </div>
    `;

    const paySlot = document.getElementById("resident-pay-slot");
    const payBtn = document.getElementById("payLinkBtn");
    if (paySlot && payBtn) {
      const privatContent = document.getElementById("resident-privat-pay-content") || paySlot;
      const qrNode = privatContent.querySelector("#resident-privat-qr-link") || paySlot.querySelector("#resident-privat-qr-link");
      privatContent.appendChild(payBtn);
      if (qrNode) {
        privatContent.appendChild(qrNode);
      }
      payBtn.classList.add("resident-main-pay-btn");
      if (recommendedToPay >= 0.01) {
        payBtn.textContent = `Сплатити ${moneyText(recommendedToPay)}`;
        payBtn.title = "Сплатити";
        payBtn.classList.remove("soft-pay");
      } else {
        payBtn.textContent = "Поповнити рахунок";
        payBtn.title = "Поповнити рахунок";
        payBtn.classList.add("soft-pay");
      }
    }

    if (hasBothPayOptions) {
      const privatPane = document.getElementById("resident-pay-privat-pane");
      const nbuPane = document.getElementById("resident-pay-nbu-pane");
      const toNbuBtn = document.getElementById("resident-switch-to-nbu");
      const toPrivatBtn = document.getElementById("resident-switch-to-privat");
      if (privatPane && nbuPane && toNbuBtn && toPrivatBtn) {
        toNbuBtn.onclick = function () {
          privatPane.hidden = true;
          nbuPane.hidden = false;
        };
        toPrivatBtn.onclick = function () {
          nbuPane.hidden = true;
          privatPane.hidden = false;
        };
      }
    }

    if (hasPrivatQr) {
      const privatQrLink = document.getElementById("resident-privat-qr-link");
      const privatQrImg = document.getElementById("resident-privat-qr-img");
      if (privatQrLink) {
        privatQrLink.href = payUrl;
      }
      if (privatQrImg) {
        privatQrImg.src = buildQrImageUrl(privatQrPayload, 220);
      }
    }
    if (hasNbuQr) {
      const nbuLinkEl = document.getElementById("resident-nbu-qr-link");
      const nbuImgEl = document.getElementById("resident-nbu-qr-img");
      if (nbuLinkEl) {
        nbuLinkEl.href = nbuQrLink;
      }
      if (nbuImgEl) {
        nbuImgEl.src = buildQrImageUrl(nbuQrLink, 220);
      }
    }

    residentRequisitesRoot.innerHTML = `
      <details class="resident-requisites-details">
        <summary>Реквізити для оплати вручну</summary>
        <div class="resident-requisites-grid">
          <div class="resident-copy-row"><span>Отримувач</span><strong class="resident-copy-value">${requisites.receiver}</strong></div>
          <div class="resident-copy-row"><span>Код ЄДРПОУ</span><strong class="resident-copy-value">${requisites.code}</strong></div>
          <div class="resident-copy-row"><span>IBAN</span><strong id="resident-iban-value" class="resident-copy-value">${requisites.iban}</strong></div>
          <div class="resident-copy-row"><span>Банк</span><strong class="resident-copy-value">${requisites.bank}</strong></div>
          <div class="resident-copy-row"><span>МФО</span><strong class="resident-copy-value">${requisites.mfo}</strong></div>
          <div class="resident-purpose-row resident-copy-row"><span>Призначення платежу</span><strong id="resident-purpose-value" class="resident-copy-value">${requisites.purpose}</strong></div>
        </div>
        <div class="resident-requisites-actions">
          <button id="copyIbanBtn" type="button" class="resident-copy-btn">Скопіювати IBAN</button>
          <button id="copyPurposeBtn" type="button" class="resident-copy-btn">Скопіювати призначення платежу</button>
        </div>
      </details>
    `;

    if (!payUrl) {
      const recDetails = residentRequisitesRoot.querySelector(".resident-requisites-details");
      if (recDetails) recDetails.open = true;
    }

    if (residentViberRoot) {
      residentViberRoot.innerHTML = "";
      residentViberRoot.style.display = "none";
      if (hasViberQr) {
        residentViberRoot.innerHTML = `
          <details class="resident-viber-details">
            <summary>Група будинку у Viber</summary>
            <div class="resident-viber-block">
              <a id="resident-viber-link" class="resident-viber-link" target="_blank" rel="noopener noreferrer">
                Приєднуйтесь до групи будинку у Viber.
              </a>
              <a id="resident-viber-qr-link" class="resident-viber-qr-link" target="_blank" rel="noopener noreferrer">
                <img id="resident-viber-qr" alt="Viber QR" class="resident-viber-qr-img">
              </a>
            </div>
          </details>
        `;
        residentViberRoot.style.display = "";
      }
    }

bindCopyButton("copyIbanBtn", function () {
      return requisites.iban;
    }, "IBAN скопійовано");

    bindCopyButton("copyPurposeBtn", function () {
      return requisites.purpose;
    }, "Призначення платежу скопійовано");

    bindCopyRows(residentRequisitesRoot.querySelector(".resident-requisites-grid"));

    if (hasViberQr) {
      const viberLink = document.getElementById("resident-viber-link");
      const viberQrLink = document.getElementById("resident-viber-qr-link");
      const viberQrImg = document.getElementById("resident-viber-qr");
      if (viberLink) viberLink.href = viberUrl;
      if (viberQrLink) viberQrLink.href = viberUrl;
      if (viberQrImg) {
        viberQrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(viberUrl);
      }
    }
  }

  container = document.getElementById("datetime");
  container.style.cursor = "default";
  const showChangeRequestButton = isResidentMode || isUserAuthenticated();
  const changeButtonHtml = showChangeRequestButton
    ? '<div class="change-request-wrap"><button id="changeRequestBtn" type="button" class="change-request-btn">Повідомити про зміни</button></div>'
    : "";
  const updatedAt = dt ? `${dt}${typeof timeAgo === "function" ? ` (${timeAgo(dt)} тому.)` : ""}` : "—";

  const content = isResidentMode
    ? `
      <section class="resident-flat-card">
        <h3>Інформація про квартиру</h3>
        <div class="resident-flat-grid">
          <div class="resident-copy-row"><span>Особовий рахунок</span><strong class="resident-copy-value">${curLS.ls || "—"}</strong></div>
          <div class="resident-copy-row"><span>П.І.Б.</span><strong class="resident-copy-value">${curLS.fio || "—"}</strong></div>
          <div class="resident-copy-row"><span>Площа</span><strong class="resident-copy-value">${curLS.pl ? `${curLS.pl} м²` : "—"}</strong></div>
          <div class="resident-copy-row"><span>Кількість мешканців</span><strong class="resident-copy-value">${curLS.pers || "—"}</strong></div>
          <div class="resident-copy-row"><span>Поверх</span><strong class="resident-copy-value">${curLS.et || "—"}</strong></div>
          <div class="resident-copy-row"><span>Під'їзд</span><strong class="resident-copy-value">${curLS.pod || "—"}</strong></div>
        </div>
        ${changeButtonHtml}
      </section>
    `
    : `
      <span class="original">
        <br>
        <div>
          ОР: ${curLS.ls}<br>
          П.І.Б.: ${curLS.fio}<br>
          ${curLS.pl ? `Площа: ${curLS.pl} м²<br>` : ""}
          ${curLS.pers ? `Мешканців: ${curLS.pers}<br>` : ""}
          ${curLS.komn ? `Кімнат: ${curLS.komn}<br>` : ""}
          ${curLS.et ? `Поверх: ${curLS.et}<br>` : ""}
          ${curLS.pod ? `Під'їзд: ${curLS.pod}<br>` : ""}
          ${curLS.lgota ? `Пільговик: ${curLS.lgota}<br>` : ""}
          ${curLS.tel ? `Телефон: ${curLS.tel}<br>` : ""}
          ${curLS.note ? `Примітка: ${curLS.note.replace(/\n/g, "<br>")}<br>` : ""}
          ${curLS.email ? `e-mail: ${curLS.email}<br>` : ""}
          ${changeButtonHtml}
          <br>Дані вказані станом на <br>${updatedAt}
        </div>
      </span>
    `;

container.innerHTML = content;
  if (isResidentMode) {
    bindCopyRows(container.querySelector(".resident-flat-grid"));
  }
  const changeBtn = document.getElementById("changeRequestBtn");
  if (changeBtn) {
    changeBtn.onclick = function () {
      if (isResidentMode) {
        handleResidentChangeRequest(accountId);
      } else {
        handleChangeRequest(accountId);
      }
    };
  }

initPosters();
setParam("kv", ls[accountId].kv);

//lastRow.scrollIntoView({ behavior: "smooth", block: "end" });

  updateStickyTop(); 
}
function createPaymentCell(row, monthlyPayments, accountId) {
  var paymentCell = document.createElement("td");
  var totalPayments = monthlyPayments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var charges = nach[accountId] || {};
  var payments = oplat[accountId] || {};
  function getMonthsForPayment(paymentSum, paymentDate, accountId) {
    var paymentDateParts = paymentDate.split(".");
    var day = Number(paymentDateParts[0]);
    var month = Number(paymentDateParts[1]);
    var year = Number(paymentDateParts[2]);
    if (!nach[accountId]) return "";
    var paidMonths = [];
    var remainingSum = 0;
    var years = [];
    for (var key in nach[accountId]) {
      if (nach[accountId].hasOwnProperty(key)) {
        years.push(key);
      }
    }
    years.sort(function (a, b) {
      return a - b;
    });

    // Подсчет уже оплаченных начислений до paymentDate
    if (oplat[accountId]) {
      for (var y in oplat[accountId]) {
        for (var m in oplat[accountId][y]) {
          var payments = oplat[accountId][y][m];
          for (var i = 0; i < payments.length; i++) {
            var payment = payments[i];
            var paymentDateParts = payment.date.split(".");
            var pDay = Number(paymentDateParts[0]);
            var pMonth = Number(paymentDateParts[1]);
            var pYear = Number(paymentDateParts[2]);
            if (
              pYear < year ||
              (pYear === year && pMonth < month) ||
              (pYear === year && pMonth === month && pDay < day)
            ) {
              remainingSum += payment.sum;
            }
          }
        }
      }
    }
    var start = null;
    var end = null;
    var totalCharge = 0;
    for (var _i = 0, _years = years; _i < _years.length; _i++) {
      var y = _years[_i];
      var shortYear = y.slice(-2);
      var months = [];
      for (var key in nach[accountId][y]) {
        if (nach[accountId][y].hasOwnProperty(key)) {
          months.push(key);
        }
      }
      months.sort(function (a, b) {
        return a - b;
      });
      for (var _i2 = 0, _months = months; _i2 < _months.length; _i2++) {
        var m = _months[_i2];
        var charges = Object.values(nach[accountId][y][m]);
        var monthCharge = 0;
        for (var i = 0; i < charges.length; i++) {
          monthCharge += charges[i];
        }
        remainingSum -= monthCharge;
        totalCharge += monthCharge;
        if (remainingSum < -0.01 && !start) {
          start = m.padStart(2, "0") + "." + shortYear;
        }
        if (monthCharge > 0 && remainingSum + paymentSum < 0.01) {
          end = m.padStart(2, "0") + "." + shortYear;
          return start === end ? start : start + "-" + end;
        }
      }
    }
    end = "...";
    return start === end ? start : start + "-" + end;
  }

  // Формируем строки с данными платежей
if (monthlyPayments.length === 0) {
  // Если оплат нет — вставляем непустое содержимое, чтобы Excel не смещал колонки
  paymentCell.innerHTML = "&nbsp;";
} else {
  var tableRows = monthlyPayments
    .map(function (payment) {
      var formattedDate = payment.date.split(".")[0]; // Преобразуем дату в формат D
      var formattedSum = payment.sum.toFixed(2).replace(".", ","); // Преобразуем сумму в формат 0.00
      var paymentMonths = getMonthsForPayment(
        payment.sum,
        payment.date,
        accountId
      );
      return (
        "<tr>" +
        '<td class="big">' +
        formattedDate +
        "</td>" +
        '<td class="big">' +
        formattedSum +
        "</td>" +
        "<td>" +
        paymentMonths +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  // Устанавливаем содержимое ячейки оплаты
  paymentCell.innerHTML =
    "<div>" +
    '<table class="paysubtable">' +
    "<tbody>" +
    tableRows +
    "</tbody>" +
    "</table>" +
    "</div>";
}

  row.appendChild(paymentCell);
  return totalPayments;
}
function createPaymentCell_old(row, monthlyPayments) {
  var totalPayments = monthlyPayments.reduce(function (sum, payment) {
    return sum + payment.sum;
  }, 0);
  var paymentCell = document.createElement("td");
  if (monthlyPayments.length === 1) {
    paymentCell.className = "poster"; // Добавляем класс оформления
    // Одна оплата — отображаем простую строку
    var payment = monthlyPayments[0];
paymentCell.innerHTML = `
  ${totalPayments.toFixedWithComma()}
  <div class="descr">
    <div class="big">
      Оплачено ${payment.date} через ${b[payment.yur]}
      ${payment.kvit ? `<br>Квітанція: ${payment.kvit}` : ``}
      ${payment.nazn ? `<br>Призначення: ${payment.nazn}` : ``}
    </div>
  </div>
`;
  } else if (monthlyPayments.length > 1) {
    paymentCell.className = "poster"; // Добавляем класс оформления
    // Несколько оплат — отображаем таблицу с деталями
    // Определяем, есть ли хотя бы одна запись для квитанции или назначения
    var hasKvit = monthlyPayments.some(function (payment) {
      return payment.kvit;
    });
    var hasNazn = monthlyPayments.some(function (payment) {
      return payment.nazn;
    });

    // Настраиваем строку заголовка таблицы
var headerRow = `
  <tr>
    <th>Дата</th>
    <th>Оплачено через</th>
    ${hasKvit ? `<th>Квітанція</th>` : ``}
    <th>Сума</th>
    ${hasNazn ? `<th>Призначення</th>` : ``}
  </tr>
`;
    // Формируем строки с данными платежей
    var tableRows = monthlyPayments
      .map(function (payment) {
        return `
    <tr>
        <td class="big">${payment.date}</td>
        <td>${b[payment.yur]}</td>
        ${hasKvit ? `<td>${payment.kvit || ""}</td>` : ""}
        <td class="big">${payment.sum.toFixedWithComma()}</td>
        ${hasNazn ? `<td>${payment.nazn || ""}</td>` : ""}
    </tr>
`;
      })
      .join("");

    // Устанавливаем содержимое ячейки оплаты

    paymentCell.innerHTML = `
      ${totalPayments.toFixedWithComma()}
      <div class="descr">
        <table class="subtable">
          <tbody>
            ${headerRow}
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }
  row.appendChild(paymentCell);
  return totalPayments;
}
function initLSAutocomplete(input, ls) {
let backStateAdded = false;
let suppressPop = false; // блокируем обработчик во время программного закрытия

function isMobile() {
    return window.innerWidth <= 640;
}

    let filteredIds = [];
    let highlightedIndex = -1;

    const picker      = document.getElementById("ls-picker");
    const pickerInput = document.getElementById("ls-picker-input");
    const pickerList  = document.getElementById("ls-picker-list");
    const closeBtn    = document.getElementById("ls-picker-close");

    let lastFoundId = null;

    // ----------------------------------------
    // НОРМАЛИЗАЦИЯ ТЕКСТА
    // ----------------------------------------
    function normalizePhone(phone) {
        return (phone || "")
          .replace(/[\s\-\(\)\+]/g, "")
          .replace(/\D/g, "");
    }

    function extractPhoneQueries(str) {
        if (!str) return [];
        const cleaned = str.replace(/[^\d]/g, "");
        const results = cleaned.match(/\d{5,15}/g);
        return results || [];
    }

    // ----------------------------------------
    // ПОДСВЕТКА
    // ----------------------------------------
    function highlightTokens(text, query) {
        if (!text) return "";
        if (!query) return text;

        const tokens = query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

        let result = text;

        for (const token of tokens) {
            const safe = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(safe, "gi");
            result = result.replace(re, m => `<mark>${m}</mark>`);
        }
        return result;
    }

    function highlightPhone(originalPhone, query) {
        if (!originalPhone) return "";

        const queries = extractPhoneQueries(query);
        if (queries.length === 0) return originalPhone;

        const norm = normalizePhone(originalPhone);

        let matchStart = -1, matchLen = 0;

        for (const q of queries) {
            const idx = norm.indexOf(q);
            if (idx >= 0) {
                matchStart = idx;
                matchLen = q.length;
                break;
            }
        }

        if (matchStart < 0) return originalPhone;

        let digitIndex = 0;
        let result = "";

        for (const ch of originalPhone) {
            if (/\d/.test(ch)) {
                if (digitIndex >= matchStart && digitIndex < matchStart + matchLen) {
                    result += `<mark>${ch}</mark>`;
                } else {
                    result += ch;
                }
                digitIndex++;
            } else {
                result += ch;
            }
        }

        return result;
    }

    // ----------------------------------------
    // РЕНДЕР СПИСКА
    // ----------------------------------------
function filterList(val) {

    const query = val.toLowerCase();
    const phoneQueries = extractPhoneQueries(val);

    pickerList.innerHTML = "";
    filteredIds.length = 0;
    highlightedIndex = -1;

    const tokens = query.split(/\s+/).filter(Boolean);

    // ==============================================
    // 1. СОБИРАЕМ ВСЕ ЗАПИСИ В МАССИВ (для сортировки)
    // ==============================================
    let results = [];

    Object.entries(ls).forEach(([id, data]) => {

        const kvRaw  = String(data.kv);       // Оригинал
        const kvNorm = kvRaw.toLowerCase();   // Для поиска
        const fioSrc = data.fio || "";
        const fio    = fioSrc.toLowerCase();
        const note   = (data.note || "").toLowerCase();
        const tel    = data.tel || "";

        // ---- НОРМАЛИЗОВАТЬ ТЕЛЕФОНЫ ----
        const telNorm = normalizePhone(tel);

let match = false;
let priority = 100;

// 0. Пустой ввод → показываем всё
if (!query) {
    match = true;
    priority = 10;
}

// 1. Точное совпадение квартиры
if (!match && kvNorm === query) {
    match = true;
    priority = 1;
}

// 2. Начинается с квартиры
if (!match && kvNorm.startsWith(query)) {
    match = true;
    priority = 2;
}

// 3. ФИО
if (!match && tokens.length > 0 && tokens.every(t => fio.includes(t))) {
    match = true;
    priority = 3;
}

// 4. Телефон — ОТДЕЛЬНО, НЕ ELSE IF
if (!match && phoneQueries.length > 0 && telNorm) {
    if (phoneQueries.some(q => telNorm.includes(q))) {
        match = true;
        priority = 4;
    }
}

// 5. Примечание
if (!match && tokens.length > 0 && tokens.every(t => note.includes(t))) {
    match = true;
    priority = 5;
}

if (!match) return;

        // Добавляем результат в массив
        results.push({
            id,
            data,
            kvRaw,
            kvNorm,
            priority
        });
    });

    // ==============================================
    // 2. СОРТИРОВКА:
    //    - сначала priority (1 — лучший)
    //    - внутри сортировка по номеру квартиры
    // ==============================================
    function parseKv(kv) {
        const m = kv.match(/^(\d+)(.*)$/);
        if (!m) return { num: 999999, suf: kv };
        return {
            num: parseInt(m[1], 10),
            suf: m[2] || ""
        };
    }

    results.sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority - b.priority;

        const A = parseKv(a.kvRaw);
        const B = parseKv(b.kvRaw);

        if (A.num !== B.num)
            return A.num - B.num;

        return A.suf.localeCompare(B.suf, 'uk'); // для А/Б/Г
    });

    // ==============================================
    // 3. РЕНДЕР
    // ==============================================
    results.forEach(({id, data, kvRaw}) => {

        filteredIds.push(id);

        const kvHTML   = highlightTokens(kvRaw, query);
        const fioHTML  = highlightTokens(data.fio || "", query);
        const noteHTML = highlightTokens(data.note || "", query);
        const telHTML  = data.tel ? highlightPhone(data.tel, query) : "";

        const div = document.createElement("div");
        div.className = "ls-item";

        div.innerHTML = `
            <div><strong>Кв. ${kvHTML}</strong></div>
            <div>${fioHTML}</div>
            ${data.tel ? `<div>Тел: ${telHTML}</div>` : ""}
            ${data.note ? `<div class="note">${noteHTML}</div>` : ""}
            <small>Під'їзд: ${data.pod || ""} &nbsp; Поверх: ${data.et || ""}</small>
        `;

        div.onclick = () => selectId(id);

        pickerList.appendChild(div);
    });

    // ===== DESKTOP: авто-высота =====
    if (!isMobile()) {
        const pickerContent = document.getElementById("picker-content");

        picker.style.height = "auto";
        pickerContent.style.height = "auto";
        pickerContent.style.maxHeight = "none";

        const contentH = pickerContent.scrollHeight;
        const maxH = 520;
        const finalH = Math.min(contentH, maxH);

        pickerContent.style.height = finalH + "px";
        pickerContent.style.maxHeight = maxH + "px";

        const headerH = document.querySelector(".ls-picker-header").offsetHeight;
        picker.style.height = (headerH + finalH) + "px";
    }
}

function naturalCompare(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}



    // ----------------------------------------
    // Выбор элемента
    // ----------------------------------------
    function selectId(id) {
        lastFoundId = id;
        input.value = ls[id].kv;
        addStuff(id);
        setParam("kv", ls[id].kv);
        closePicker();
    }

    // ----------------------------------------
    // Позиционирование (перекрываем input)
    // ----------------------------------------
function positionPicker() {
    if (isMobile()) return;

    const rect = input.getBoundingClientRect();

    picker.style.left = rect.left + "px";
    picker.style.top  = rect.top + window.scrollY + "px";
}


    // ----------------------------------------
    // Открытие / Закрытие пикера
    // ----------------------------------------
function openPicker() {

    if (isMobile()) {
        picker.style.position = "fixed";
        picker.style.left = "0";
        picker.style.right = "0";
        picker.style.top = "0";
        picker.style.bottom = "0";
        picker.classList.remove("desktop-picker-pos");
        if (!backStateAdded) {
           history.pushState({ lsPicker: true }, ""); 
           backStateAdded = true;
        }
    } else {
        picker.classList.add("desktop-picker-pos");
        positionPicker();
    }

    picker.classList.remove("hidden");

    const val = input.value;
    pickerInput.value = val;

    //filterList(val);
    filterList("");

    // --- МАГИЯ ДЛЯ ГАРАНТИРОВАННОГО ВЫДЕЛЕНИЯ ---
    setTimeout(() => {

        pickerInput.focus();

        // 1) Попытка обычного выделения (работает в desktop)
        pickerInput.select();

        // 2) Попытка ручного выставления диапазона (хуже, но работает в Android)
        try {
            pickerInput.setSelectionRange(0, pickerInput.value.length);
        } catch (e) {}

        // 3) Повторить позже — исправляет iOS, которая сбрасывает выделение
        setTimeout(() => {
            try {
                pickerInput.setSelectionRange(0, pickerInput.value.length);
            } catch (e) {}
        }, 30);

    }, 20);
}




    function closePicker() {
        picker.classList.add("hidden");
        highlightedIndex = -1;
if (backStateAdded) {
    suppressPop = true;                      // чтобы popstate не закрыл ещё раз
    history.back();                          // откат записи
    backStateAdded = false;

    // через микрозадержку сбрасываем блокировку
    setTimeout(() => suppressPop = false, 50);
}
    }

    // ----------------------------------------
    // Навигация в pickerInput
    // ----------------------------------------
pickerInput.addEventListener("keydown", function(e) {

    const items = pickerList.querySelectorAll(".ls-item");
    const total = items.length;

    if (total === 0) return;

    // ESC закрыть
    if (e.key === "Escape") {
        closePicker();
        return;
    }

    // ========= ArrowDown =========
    if (e.key === "ArrowDown") {
        e.preventDefault();

        if (highlightedIndex < total - 1) {
            highlightedIndex++;   // обычный шаг вниз
        }
        // если уже на последнем — остаёмся

        updateHighlight(items);
        return;
    }

    // ========= ArrowUp =========
    if (e.key === "ArrowUp") {
        e.preventDefault();

        if (highlightedIndex > 0) {
            highlightedIndex--;   // обычный шаг вверх
        }
        // если на первом — остаёмся

        updateHighlight(items);
        return;
    }

    // ========= HOME — первая строка =========
    if (e.key === "Home") {
        e.preventDefault();
        highlightedIndex = 0;
        updateHighlight(items);
        return;
    }

    // ========= END — последняя строка =========
    if (e.key === "End") {
        e.preventDefault();
        highlightedIndex = total - 1;
        updateHighlight(items);
        return;
    }

    // ========= PAGE DOWN — +10 =========
    if (e.key === "PageDown") {
        e.preventDefault();

        const oldIndex = highlightedIndex;
        highlightedIndex = Math.min(highlightedIndex + 10, total - 1);

        // если осталось меньше 10 строк вниз → прыжок на последнюю
        if (highlightedIndex === oldIndex) {
            highlightedIndex = total - 1;
        }

        updateHighlight(items);
        return;
    }

    // ========= PAGE UP — −10 =========
    if (e.key === "PageUp") {
        e.preventDefault();

        const oldIndex = highlightedIndex;
        highlightedIndex = Math.max(highlightedIndex - 10, 0);

        // если сверху меньше 10 → прыжок на первую
        if (highlightedIndex === oldIndex) {
            highlightedIndex = 0;
        }

        updateHighlight(items);
        return;
    }

    // ========= ENTER =========
    if (e.key === "Enter") {
        e.preventDefault();

        let id = null;

        if (highlightedIndex >= 0 && highlightedIndex < filteredIds.length) {
            id = filteredIds[highlightedIndex];
        } else if (filteredIds.length > 0) {
            id = filteredIds[0];
        }

        if (id) selectId(id);
        return;
    }
});


// ===================================================
// Обновление визуальной подсветки
// ===================================================
function updateHighlight(items) {

    items.forEach((el, i) => {
        el.classList.toggle("active", i === highlightedIndex);
    });

    const activeEl = items[highlightedIndex];

    if (activeEl) {
        activeEl.scrollIntoView({
            block: "nearest",
            behavior: "auto"
        });
    }
}



    // ----------------------------------------
    // Поиск
    // ----------------------------------------
    pickerInput.addEventListener("input", function () {
        filterList(this.value);
    });

    // ----------------------------------------
    // Клик вне
    // ----------------------------------------
    document.addEventListener("mousedown", function(e) {
        if (picker.classList.contains("hidden")) return;
        if (picker.contains(e.target)) return;
        if (input.contains(e.target)) return;
        closePicker();
    });

    closeBtn.onclick = () => closePicker();

    // ----------------------------------------
    // Открытие пикера
    // ----------------------------------------
    input.addEventListener("focus", function () {
        openPicker();
        this.blur();
    });

    // ----------------------------------------
    // Восстановление значения
    // ----------------------------------------
    input.addEventListener("blur", function () {
        if (lastFoundId && ls[lastFoundId]) {
            this.value = ls[lastFoundId].kv;
        }
    });

    // ----------------------------------------
    // СИНХРОНИЗАЦИЯ текста input → pickerInput
    // ----------------------------------------
    input.addEventListener("input", function () {
        pickerInput.value = this.value;
        filterList(this.value);
    });
// ----------------------------------------
// ПЕРЕРАСЧЁТ ПОЗИЦИИ ПРИ ПЕРЕВОРОТЕ ЭКРАНА
// ----------------------------------------
window.addEventListener("resize", () => {
    if (!picker.classList.contains("hidden") && !isMobile()) {
        positionPicker();
    }
});

window.addEventListener("orientationchange", () => {
    // Небольшая задержка чтобы браузер успел перестроить layout
    setTimeout(() => {
        if (!picker.classList.contains("hidden") && !isMobile()) {
            positionPicker();
        }
    }, 100);
});
// Закрытие по кнопке "Назад" Android
window.addEventListener("popstate", () => {
    if (suppressPop) return; // если закрыли программно — игнорируем
    if (!picker.classList.contains("hidden") && backStateAdded) {
        closePicker();
    }
});

}






function initLS() {
  const isResidentMode = document.body.classList.contains("resident-mode");

  document.getElementById("maincontainer").innerHTML = `
<div id="ls-picker" class="ls-picker hidden">
    <div class="ls-picker-header">
        <input id="ls-picker-input" type="text">
        <button id="ls-picker-close">×</button>
    </div>

    <div id="picker-content" class="picker-content">
        <div id="ls-picker-list" class="ls-picker-list"></div>
    </div>
</div>

</div>
    <div id="header" class="header ${isResidentMode ? "resident-header" : ""}">
      <div class="header-row">
        <div class="header-left">

          <div class="line line-address">
            <span class="label">Адреса:</span>
            <span class="value">
              <a id="adr"></a>
              <input
                id="number"
                list="number-list"
                type="text"
                inputmode="search"
                autocomplete="off">
              <datalist id="number-list"></datalist>
            </span>
            ${isResidentMode ? '<span id="org-head" class="org-head-inline"></span>' : ""}
          </div>

          ${isResidentMode ? `
          <div class="line">
            <span class="label">Особовий рахунок:</span>
            <span class="value" id="ls-head">—</span>
          </div>
          ` : ""}

          <div class="line">
            <span class="label">П.І.Б.:</span>
            <span class="value" id="fio"></span>
          </div>

        </div>

        <div class="header-right">
          <div class="buttons-container">
            ${isResidentMode ? "" : buttons}
          </div>
        </div>
      </div>
    </div>

    <div id="din"></div>
    <div id="datetime"></div>
  `;

  document.getElementById("adr").textContent = adr + " / ";
  const orgHead = document.getElementById("org-head");
  if (orgHead) orgHead.textContent = String(org || "");
  updateResidentAddressLayout();
  document.title = org + " " + adr;
  ensureTopbarHistoryButton();

  const input = document.getElementById("number");
  const list  = document.getElementById("number-list");

  if (isResidentMode) {
    const allKeys = Object.keys(ls || {});
    const fallbackId = allKeys[0] || null;
    const kvParam = getParam("kv");
    let ind = null;

    if (kvParam) {
      ind = allKeys.find(key => ls[key].kv === kvParam || ls[key].ls === kvParam) || null;
    }
    if (!ind) ind = fallbackId;
    if (!ind || !ls[ind]) return;

    if (input) {
      const numberText = document.createElement("span");
      numberText.id = "number-static";
      numberText.className = "number-static";
      numberText.textContent = ls[ind].kv || "";
      input.replaceWith(numberText);
    }
    if (list) {
      list.remove();
    }

    addStuff(ind);
    if (ls[ind]?.kv) {
      setParam("kv", ls[ind].kv);
    }
    updateHeaderCompactState();
    return;
  }

  // ================================
  // datalist
  // ================================
  list.innerHTML = "";

  Object.values(ls).forEach(data => {
    const opt = document.createElement("option");
    opt.value = data.kv;       // подставляется в input
    opt.label = data.fio || ""; // подсказка
    list.appendChild(opt);
  });

  // ================================
  // состояние
  // ================================
  let lastFoundId = null;

  // ================================
  // поиск при вводе
  // ================================
  input.addEventListener("input", function () {
    const val = this.value.trim().toLowerCase();
    if (!val) {
      lastFoundId = null;
      return;
    }

    let foundId = null;

    Object.entries(ls).some(([accountId, data]) => {
      const kv  = String(data.kv);
      const fio = (data.fio || "").toLowerCase();

      if (kv === val) {
        foundId = accountId;
        return true; // точное совпадение — сразу
      }
      if (!foundId && kv.startsWith(val)) {
        foundId = accountId;
      }
      if (!foundId && fio.includes(val)) {
        foundId = accountId;
      }
    });

    if (foundId) {
      lastFoundId = foundId;
      addStuff(foundId);
      setParam("kv", ls[foundId].kv);
    }
  });

  // ================================
  // нормализация при выходе из поля
  // ================================
  input.addEventListener("blur", function () {
    if (lastFoundId && ls[lastFoundId]) {
      this.value = ls[lastFoundId].kv;
    } else {
      this.value = "";
    }
  });

  // Enter = зафиксировать значение
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      this.blur();
    }
  });

  // ================================
  // начальная инициализация
  // ================================
  let ind = getParam("kv");

  if (!ind) {
    ind = Object.keys(ls)[1];
  } else {
    ind = Object.keys(ls).find(key =>
      ls[key].kv === ind || ls[key].ls === ind
    );
    if (ind === undefined) {
      ind = Object.keys(ls)[1];
    }
  }

  lastFoundId = ind;
  addStuff(ind);
  input.value = ls[ind]?.kv || "";
  updateHeaderCompactState();
initLSAutocomplete(input, ls);
}

function ensureTopbarHistoryButton() {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  let btn = document.getElementById("topbarHistoryBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "topbarHistoryBtn";
    btn.type = "button";
    btn.textContent = "Історія запитів";
    btn.style.marginLeft = "auto";
    btn.style.height = "32px";
    btn.style.padding = "0 10px";
    btn.style.border = "1px solid rgba(255,255,255,0.35)";
    btn.style.borderRadius = "6px";
    btn.style.background = "rgba(255,255,255,0.12)";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.style.whiteSpace = "nowrap";
    topbar.appendChild(btn);
  }

  btn.onclick = () => {
    ShowHistory({
      accountId: null,
      myOnly: false,
      orgOnly: false,
      showFilters: true,
      title: "Історія запитів на зміну"
    });
  };
}



// script.js
function stripEmailFlags(email) {
  return String(email || "").replace(/^\s*-+/, "").trim();
}

function isEmailSubscribed(email) {
  const raw = String(email || "").trim();
  if (!raw) return false;
  return !raw.startsWith("-");
}

function hasNoKvit(noteText) {
  return /(^|\s)NoKvit(\s|$)/i.test(String(noteText || ""));
}

function applyNoKvitFlag(noteText, noPaperReceipt) {
  let value = String(noteText || "");
  value = value.replace(/(^|\s)NoKvit(?=\s|$)/gi, " ");
  value = value.replace(/\s{2,}/g, " ").trim();
  if (noPaperReceipt) {
    value = value ? `${value} NoKvit` : "NoKvit";
  }
  return value;
}

async function sendResidentChangeRequest(accountId, payload) {
  const token = String(getParam("rt") || "").trim();
  if (!token) {
    showMessage("Не знайдено токен доступу", "err");
    return false;
  }

  const rpcPayload = {
    p_token: token,
    p_fio: payload.fio || "",
    p_email: payload.email || "",
    p_tel: payload.tel || "",
    p_subscribed: !!payload.subscribed,
    p_paperless: !!payload.paperless
  };

  const loader = showLoader("Відправка даних...");
  try {
    const statusLabel = "очікує обробки";
    const { data, error } = await client.rpc("resident_submit_change", rpcPayload);
    loader.close();
    if (error) {
      showMessage("Помилка при відправці даних", "err");
      return false;
    }
    if (data && data.ok === false) {
      showMessage(data.message || "Зміни відсутні", "warn");
      return false;
    }

    // Resident-mode fix: force persisted status text in DB.
    try {
      const candidateId =
        Number(data?.id) ||
        Number(data?.change_id) ||
        Number(data?.correction_id) ||
        0;

      if (candidateId > 0) {
        await client
          .from("corrections")
          .update({ status: statusLabel })
          .eq("id", candidateId);
      } else {
        const sinceIso = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { data: latestRows } = await client
          .from("corrections")
          .select("id,status,submitted_at")
          .eq("account_id", String(accountId))
          .gte("submitted_at", sinceIso)
          .order("submitted_at", { ascending: false })
          .limit(3);

        const badRow = Array.isArray(latestRows)
          ? latestRows.find(function (row) {
              const st = String(row?.status || "");
              return !st || /^\?+(\s+\?+)*$/.test(st) || st.toLowerCase() === "pending";
            })
          : null;

        if (badRow?.id) {
          await client
            .from("corrections")
            .update({ status: statusLabel })
            .eq("id", badRow.id);
        }
      }
    } catch (_) {
      // Ignore: this is a best-effort write fix, main request already succeeded.
    }

    // Email notification for resident-mode requests (same channel as regular mode).
    try {
      const current = ls[accountId] || {};
      const displayFio = String(payload.fio || current.fio || "").trim();
      const senderLabelRaw = displayFio || `ОР ${current.ls || accountId}`;
      const senderLabel = String(senderLabelRaw).replace(/^resident\s*:\s*/i, "").trim() || `ОР ${current.ls || accountId}`;
      const senderEmail = String(payload.email || "").trim();
      const oldFio = String(current.fio || "");
      const oldTel = String(current.tel || "");
      const oldEmail = stripEmailFlags(current.email || "");
      const oldNoPaper = hasNoKvit(current.note || "");
      const newNoPaper = !!payload.paperless;

      const changes = [];
      if (oldFio !== String(payload.fio || "")) changes.push(`ФІО: ${oldFio || "—"} → ${payload.fio || "—"}`);
      if (oldTel !== String(payload.tel || "")) changes.push(`Телефон: ${oldTel || "—"} → ${payload.tel || "—"}`);
      if (oldEmail !== String(payload.email || "")) changes.push(`Email: ${oldEmail || "—"} → ${payload.email || "—"}`);
      if (oldNoPaper !== newNoPaper) {
        changes.push(`Паперова квитанція: ${oldNoPaper ? "Відмова" : "Так"} → ${newNoPaper ? "Відмова" : "Так"}`);
      }
      if (changes.length === 0) {
        changes.push("Зміни передано через особистий кабінет.");
      }

      const templateParams = {
        name: senderLabel,
        from_name: senderLabel,
        sender: senderEmail ? `${senderLabel} (${senderEmail})` : senderLabel,
        subject: `Зміни по ${org || ""} (особистий кабінет)`,
        address: `${adr || ""}/${current.kv || ""}`,
        changes: changes.join("\r\n"),
        correction: "—",
        correctionText: "—",
        uvaga: ""
      };

      await emailjs.send("service_ed425wm", "template_vcrj80e", templateParams, "GieX-9pNBnKJ0Z2HK");
    } catch (mailErr) {
      console.error("Resident mail sending error:", mailErr);
    }

    showMessage("Запит успішно відправлено");

    if (ls[accountId]) {
      ls[accountId].email = payload.storedEmail;
      ls[accountId].tel = payload.tel;
      ls[accountId].note = payload.note;
    }
    addStuff(accountId);
    return true;
  } catch (e) {
    loader.close();
    showMessage("Не вдалося відправити дані", "err");
    return false;
  }
}

function handleResidentChangeRequest(accountId) {
  const data = ls[accountId] || {};
  const existingModal = document.getElementById("residentChangeModal");
  if (existingModal) existingModal.remove();

  const emailVisible = stripEmailFlags(data.email || "");
  const subscribedDefault = isEmailSubscribed(data.email || "");
  const noPaperDefault = hasNoKvit(data.note || "");

  const modal = document.createElement("div");
  modal.id = "residentChangeModal";
  modal.className = "modal-overlay";
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.remove();
  });

  const container = document.createElement("div");
  container.className = "modal-container";
  container.innerHTML = `
    <h3>Повідомити про зміни</h3>
    <div class="modal-section">
      <div class="resident-change-form">
        <div class="resident-field">
          <label for="residentFio">П.І.Б.</label>
          <input type="text" id="residentFio" value="${data.fio || ""}">
        </div>
        <div class="resident-field">
          <label for="residentTel">Телефон</label>
          <input type="text" id="residentTel" value="${data.tel || ""}">
        </div>
        <div class="resident-field">
          <label for="residentEmail">E-mail</label>
          <input type="email" id="residentEmail" value="${emailVisible}">
        </div>
        <label class="resident-check">
          <input type="checkbox" id="residentSubscribed" ${subscribedDefault ? "checked" : ""}>
          <span>Отримувати e-mail розсилку</span>
        </label>
        <label class="resident-check">
          <input type="checkbox" id="residentNoPaper" ${noPaperDefault ? "checked" : ""}>
          <span>Відмовитись від паперової квитанції</span>
        </label>
        <div class="resident-change-note">
          Повідомлення буде передано для перевірки. Дані змінюються після підтвердження адміністратором.
        </div>
      </div>
    </div>
    <div class="form-actions">
      <div class="left-buttons">
        <button type="button" id="residentSaveBtn" class="primary">Надіслати заявку</button>
        <button type="button" id="residentCancelBtn" class="secondary">Скасувати</button>
      </div>
    </div>
  `;

  modal.appendChild(container);
  document.body.appendChild(modal);

  const cancelBtn = container.querySelector("#residentCancelBtn");
  if (cancelBtn) {
    cancelBtn.onclick = function () {
      modal.remove();
    };
  }

  const emailInput = container.querySelector("#residentEmail");
  const subscribedInput = container.querySelector("#residentSubscribed");
  const noPaperInput = container.querySelector("#residentNoPaper");
  const syncResidentEmailRequired = function () {
    if (!emailInput) return;
    const requiredNow = !!(subscribedInput?.checked);
    emailInput.required = requiredNow;
    emailInput.setAttribute("aria-required", requiredNow ? "true" : "false");
  };
  if (subscribedInput) subscribedInput.addEventListener("change", syncResidentEmailRequired);
  if (noPaperInput) noPaperInput.addEventListener("change", syncResidentEmailRequired);
  syncResidentEmailRequired();

  const saveBtn = container.querySelector("#residentSaveBtn");
  if (saveBtn) {
    saveBtn.onclick = async function () {
      const fio = String(container.querySelector("#residentFio")?.value || "").trim();
      const tel = String(container.querySelector("#residentTel")?.value || "").trim();
      const emailInput = container.querySelector("#residentEmail");
      const emailVisibleInput = stripEmailFlags(emailInput?.value || "");
      const subscribed = !!container.querySelector("#residentSubscribed")?.checked;
      const noPaper = !!container.querySelector("#residentNoPaper")?.checked;
      const emailRequired = subscribed;

      if (emailRequired && !emailVisibleInput) {
        showMessage("Вкажіть e-mail, якщо увімкнено e-mail розсилку", "warn");
        if (emailInput) emailInput.focus();
        return;
      }

      if (emailVisibleInput && emailInput && !emailInput.checkValidity()) {
        showMessage("Перевірте формат e-mail", "warn");
        emailInput.focus();
        return;
      }

      const storedEmail = emailVisibleInput
        ? (subscribed ? emailVisibleInput : `-${emailVisibleInput}`)
        : "";
      const noteOld = String(data.note || "");
      const noteNew = applyNoKvitFlag(noteOld, noPaper);

      const changed =
        fio !== String(data.fio || "").trim() ||
        tel !== String(data.tel || "").trim() ||
        storedEmail !== String(data.email || "").trim() ||
        noteNew !== String(data.note || "");

      if (!changed) {
        showMessage("Зміни відсутні", "warn");
        return;
      }

      const ok = await sendResidentChangeRequest(accountId, {
        fio: fio,
        tel: tel,
        email: emailVisibleInput,
        subscribed: subscribed,
        paperless: noPaper,
        storedEmail: storedEmail,
        note: noteNew
      });
      if (ok) modal.remove();
    };
  }
}

function handleChangeRequest(accountId) {
  const data = ls[accountId] || {};

  const existingModal = document.getElementById('changeModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'changeModal';
  modal.className = 'modal-overlay';

  // Закрытие при клике за пределами модалки
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const container = document.createElement('div');
  container.className = 'modal-container';

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

// Локальный формат YYYY-MM-DD
const firstOfMonthStr = firstOfMonth.getFullYear() + '-' +
                        String(firstOfMonth.getMonth() + 1).padStart(2, '0') + '-' +
                        String(firstOfMonth.getDate()).padStart(2, '0');


  const monthStr = today.toISOString().slice(0,7);

  // ===== Блок 1 =====
  const block1 = document.createElement('div');
  block1.className = 'modal-section modal-block-1';
  block1.innerHTML = `
    <h4>Основні дані</h4>
    <div>Станом на</div>
    <div style="color: gray;">${today.toLocaleDateString()}</div>
    <div><input type="date" name="effectiveDate" value="${firstOfMonthStr}"></div>

    <div>П.І. по Б.</div>
    <div style="color: gray;">${data.fio || ''}</div>
    <div><input type="text" name="fio" value="${data.fio || ''}"></div>

    <div>Площа</div>
    <div style="color: gray;">${data.pl || ''}</div>
    <div><input type="number" name="pl" value="${data.pl || ''}" step="0.01"></div>

    <div>Мешканців</div>
    <div style="color: gray;">${data.pers || ''}</div>
    <div><input type="number" name="pers" value="${data.pers || ''}"></div>
  `;

  // ===== Блок 2 =====
  const block2 = document.createElement('div');
  block2.className = 'modal-section modal-block-2';
  block2.innerHTML = `
    <h4>Корекція(списаня/донарахування) по особовому рахунку</h4>
    <label>Місяць: <input type="month" name="correctionMonth" value="${monthStr}"></label>
    <label>Сума: <input type="number" name="correctionAmount" step="1" value=""></label>
    <label id="correctionTextLabel">Підстава для зміни боргу: <input type="text" name="correctionText"></label>
  `;
  block2.querySelector('input[name="correctionAmount"]').addEventListener('input', function() {
    const label = block2.querySelector('#correctionTextLabel');
    if (this.value && parseFloat(this.value) < 0) {
      label.innerHTML = 'Підстава для збільшення боргу: <input type="text" name="correctionText">';
    } else {
      label.innerHTML = 'Підстава для зменшення боргу: <input type="text" name="correctionText">';
    }
  });

  // ===== Блок 3 =====
  const block3 = document.createElement('div');
  block3.className = 'modal-section modal-block-3';
  block3.innerHTML = `
    <h4>Контактні дані</h4>
    <div><span class="label">Підїзд:</span><input type="number" name="pod" value="${data.pod || ''}"></div>
    <div><span class="label">Поверх:</span><input type="number" name="et" value="${data.et || ''}"></div>
    <div><span class="label">Електронна адреса:</span><input type="text" name="email" value="${data.email || ''}"></div>
    <div><span class="label">Номер телефону:</span><input type="text" name="tel" value="${data.tel || ''}"></div>
    <div id="noteField"><span class="label">Примітка:</span><textarea name="note">${data.note || ''}</textarea></div>
  `;

  container.appendChild(block1);
  container.appendChild(block2);
  container.appendChild(block3);

// Кнопки
const btnContainer = document.createElement('div');
btnContainer.style.marginTop = '15px';
btnContainer.style.display = 'flex';
btnContainer.style.justifyContent = 'space-between'; // две слева, одна справа
btnContainer.style.width = '100%';

btnContainer.innerHTML = `
  <div>
    <button type="submit" id="saveChanges">Повідомити про зміни</button>
    <button type="button" id="closeModal">Закрити</button>
  </div>
  <div>
    <button type="button" id="showHistoryBtn">Історія запитів</button>
  </div>
`;

container.appendChild(btnContainer);


  modal.appendChild(container);
  document.body.appendChild(modal);
// Вешаем обработчик
document.getElementById('showHistoryBtn').addEventListener('click', () => {
  ShowHistory(accountId);
});


  function closeModal() {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
  }

document.getElementById('saveChanges').onclick = async function () {
  const inputs = container.querySelectorAll('input, textarea');

  const trackedFields = ['fio','pl','pers','note','tel','email','pod','et'];
  const keyFields = ['fio','pl','pers'];

  function norm(v) {
    if (v === undefined || v === null) return '';
    const s = String(v).trim().toLowerCase();
    if (s === '0') return '';
    return s;
  }

  const payload = {};
  let keyChanged = false;

  trackedFields.forEach(name => {
    const oldRaw = data[name] ?? '';
    const newRaw = container.querySelector(`[name="${name}"]`)?.value ?? '';

    const oldNorm = norm(oldRaw);
    const newNorm = norm(newRaw);

    if (oldNorm !== newNorm) {
      payload[name + '_old'] = oldRaw ?? '';
      payload[name + '_new'] = newRaw ?? '';

      if (keyFields.includes(name)) keyChanged = true;
    }
  });

  // Коррекция долга
  const correctionAmount = parseFloat(
    container.querySelector(`[name="correctionAmount"]`)?.value || 0
  );

  if (correctionAmount) {
    payload.correctionAmount = correctionAmount;
    payload.correctionMonth = container.querySelector(`[name="correctionMonth"]`)?.value || '';
    payload.correctionText = container.querySelector(`[name="correctionText"]`)?.value || '';
  }

  // Effective date only if key data changed
  if (keyChanged) {
    payload.effectiveDate = container.querySelector(`[name="effectiveDate"]`)?.value || '';
  }

  // Базовые поля
  payload.accountId = accountId;
  payload.address = adr + ', ' + (ls[accountId]?.kv || '');
  payload.homeCode = getParam("homeCode");
  payload.org = org;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name;
      const email = user.email || '';
      payload.sender = name ? `${name} (${email})` : email;
    }
  } catch {
    payload.sender = '';
  }

  if (Object.keys(payload).length <= 5) {
    //alert("Зміни відсутні");
    showMessage("Зміни відсутні","warn");
    //closeModal();
    return;
  }

  await sendCorrection(payload, accountId);

  console.log("Отправлено на почту:", payload);
  closeModal();
};



  document.getElementById('closeModal').onclick = closeModal;
}






// --- Отправка коррекции ---
async function sendCorrection(payload, accountId) {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    showMessage("Потрібно увійти в систему","err");
    return;
  }

  const senderName = user.user_metadata?.full_name || "";
  const senderEmail = user.email || "";
  const sender = senderName ? `${senderName} (${senderEmail})` : senderEmail;

  const finalData = {
    account_id: accountId,
    address: payload.address || "",
    home_code: payload.homeCode || "",
    org: payload.org || "",
    sender:sender || "",
    effective_date: payload.effectiveDate || null,
    fio_old: payload.fio_old || "",
    fio_new: payload.fio_new || "",
    pl_old: payload.pl_old || null,
    pl_new: payload.pl_new || null,
    pers_old: payload.pers_old || null,
    pers_new: payload.pers_new || null,
    pod_old: payload.pod_old || null,
    pod_new: payload.pod_new || null,
    et_old: payload.et_old || null,
    et_new: payload.et_new || null,
    email_old: payload.email_old || "",
    email_new: payload.email_new || "",
    tel_old: payload.tel_old || "",
    tel_new: payload.tel_new || "",
    note_old: payload.note_old || "",
    note_new: payload.note_new || "",
    correction_month: payload.correctionMonth ? new Date(payload.correctionMonth) : null,
    correction_amount: payload.correctionAmount || null,
    correction_text: payload.correctionText || "",
    submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: "очікує обробки"
  };

  const loader = showLoader("Відправка даних...");
  try {
    const { data: insertedData, error: insertError } = await client
      .from('corrections')
      .insert([finalData]);

    loader.close();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      showMessage("Помилка при відправці даних.","err");
      return;
    }

    showMessage("Дані відправлено успішно!");
    console.log("Inserted row:", insertedData);

    // --- Формируем изменения как строку для EmailJS ---
    const changes = [];
    if (finalData.effective_date) changes.push(`Дата змін: ${formatDate(finalData.effective_date,"DD.MM.YYYY")}`);
    if (finalData.fio_old !== finalData.fio_new) changes.push(`ФІО: ${finalData.fio_old} → ${finalData.fio_new}`);
    if (finalData.pl_old !== finalData.pl_new) changes.push(`Площа: ${finalData.pl_old} → ${finalData.pl_new}`);
    if (finalData.pers_old !== finalData.pers_new) changes.push(`Мешканців: ${finalData.pers_old} → ${finalData.pers_new}`);
    if (finalData.pod_old !== finalData.pod_new) changes.push(`Під’їзд: ${finalData.pod_old} → ${finalData.pod_new}`);
    if (finalData.et_old !== finalData.et_new) changes.push(`Поверх: ${finalData.et_old} → ${finalData.et_new}`);
    if (finalData.email_old !== finalData.email_new) changes.push(`Email: ${finalData.email_old} → ${finalData.email_new}`);
    if (finalData.tel_old !== finalData.tel_new) changes.push(`Телефон: ${finalData.tel_old} → ${finalData.tel_new}`);
    if (finalData.note_old !== finalData.note_new) changes.push(`Примітка: ${finalData.note_old} → ${finalData.note_new}`);
    const changesStr = changes.join("\r\n");

    // --- Отправка через EmailJS ---
const isOlderThan90 = d => {
    if (!d) return false;                     // не задано
    const dt = new Date(d);
    if (isNaN(dt)) return false;              // некорректная дата
    const days = (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
};

const uvaga =
    (typeof finalData !== "undefined" && isOlderThan90(finalData.effective_date))
        ? "УВАГА!!!"
        : "";

    try {
      const templateParams = {
        name: finalData.sender,
        sender: finalData.sender,
        subject: "Зміни по "+ payload.org,
        address: finalData.address,
        changes: changesStr || "—",
        correction: finalData.correction_amount ? formatDate(finalData.correction_month,"MM.YYYY")+"  "+finalData.correction_amount+" грн." : "—",
        correctionText: finalData.correction_text || "—",
        uvaga: uvaga
      };

      await emailjs.send("service_ed425wm", "template_vcrj80e", templateParams, "GieX-9pNBnKJ0Z2HK");
      console.log("Email sent successfully!");

    } catch (mailErr) {
      console.error("Mail sending error:", mailErr);
      alert("Не вдалося надіслати повідомлення на пошту.");
    }

  } catch (err) {
    loader.close();
    console.error("Помилка мережі:", err);
    showMessage("Не вдалося відправити дані.","err");
  }
}




function showLoader(message = "Завантаження...", cancelCallback) {
  let loaderModal = null;
  let timer = setTimeout(() => {
    loaderModal = document.createElement("div");
    loaderModal.className = "modal-overlay";
    loaderModal.style = `
      position:fixed;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.8);
      display:flex; justify-content:center; align-items:center;
      z-index:10000;
    `;
    loaderModal.innerHTML = `
      <div style="background:#fff; padding:30px 40px; border-radius:10px; text-align:center; position:relative;">
        <h3 style="margin-bottom:20px;">${message}</h3>
        <div id="spinner" style="margin:20px auto; width:50px; height:50px; border:6px solid #f3f3f3; border-top:6px solid #3498db; border-radius:50%; animation: spin 1s linear infinite;"></div>
        <button id="cancelBtn" style="margin-top:20px; padding:6px 12px; cursor:pointer;">Відмінити</button>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .modal-overlay * { font-family: sans-serif; }
      </style>
    `;
    document.body.appendChild(loaderModal);

    const cancelBtn = loaderModal.querySelector("#cancelBtn");
    cancelBtn.addEventListener("click", () => {
      if (cancelCallback) cancelCallback();
      loaderModal.remove();
    });
  }, 1000); // показываем только если прошло >1с

  return {
    close: () => {
      clearTimeout(timer);      // если запрос завершился раньше 1с, лоадер не покажется
      if (loaderModal) loaderModal.remove(); // если уже показался, удаляем
    },
    element: loaderModal
  };
}



// --- Получение истории из Supabase ---
async function fetchHistoryRows(params) {
  const accountId = params.accountId || null;
  const myOnly = !!params.myOnly;
  const orgOnly = !!params.orgOnly;
  const sender = params.sender || "";
  const activeHomeCode = params.activeHomeCode || "";
  const accessibleHomeCodes = Array.isArray(params.accessibleHomeCodes)
    ? params.accessibleHomeCodes.filter(Boolean)
    : [];

  let query = client
    .from('corrections')
    .select('*');

  if (accessibleHomeCodes.length > 0) {
    query = query.in('home_code', accessibleHomeCodes);
  }
  if (accountId) query = query.eq('account_id', accountId);
  if (myOnly) query = query.eq('sender', sender);
  if (orgOnly && activeHomeCode) {
    query = query.eq('home_code', activeHomeCode);
  } else if (orgOnly && typeof org !== "undefined" && org) {
    query = query.eq('org', org);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Supabase returned data is not an array");
  return data;
}

async function ShowHistory(params = {}) {
  const isObjectParams = params && typeof params === "object" && !Array.isArray(params);
  const options = isObjectParams ? params : { accountId: params };
  const accountId = options.accountId || null;
  const myOnly = !!options.myOnly;
  const orgOnly = !!options.orgOnly;
  const showFilters = !!options.showFilters;
  const title = options.title || "Історія запитів на зміну";
  const activeHomeCode = String(getParam("homeCode") || "");
  let accessibleHomeCodes = Array.isArray(homes)
    ? homes.map(h => h && h.code).filter(Boolean)
    : [];
  if (accessibleHomeCodes.length === 0 && activeHomeCode) {
    accessibleHomeCodes = [activeHomeCode];
  }
  const showOrgFilter = accessibleHomeCodes.length > 1;
  const effectiveOrgOnly = showOrgFilter ? orgOnly : false;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return showMessage("Потрібно увійти в систему","warn");

  const senderName = user?.user_metadata?.full_name || "";
  const senderEmail = user?.email || "";
  const sender = senderName ? `${senderName} (${senderEmail})` : senderEmail;

  const loader = showLoader("Завантаження історії...");
  try {
    const data = await fetchHistoryRows({
      accountId,
      myOnly,
      orgOnly: effectiveOrgOnly,
      sender,
      activeHomeCode,
      accessibleHomeCodes
    });
    loader.close();

    showHistoryModal(data, {
      sender,
      title,
      showFilters,
      showOrgFilter,
      filters: { myOnly, orgOnly: effectiveOrgOnly },
      onFilterChange: async nextFilters => {
        return fetchHistoryRows({
          accountId,
          myOnly: !!nextFilters?.myOnly,
          orgOnly: showOrgFilter ? !!nextFilters?.orgOnly : false,
          sender,
          activeHomeCode,
          accessibleHomeCodes
        });
      }
    });

  } catch (err) {
    loader.close();
    console.error(err);
    showMessage("Помилка отримання історії","err");
  }
}

function renderHistoryList(list, data) {
  list.innerHTML = "";

  if (!data || data.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Запитів ще не було.";
    list.appendChild(emptyMsg);
    return;
  }

  const uniqueHomeCodes = Array.from(
    new Set((data || []).map(r => String(r?.home_code || "")).filter(Boolean))
  );
  const singleHomeMode = uniqueHomeCodes.length <= 1;

  const normalizeHistoryStatus = function (rawStatus) {
    const source = String(rawStatus || "").trim();
    const lower = source.toLowerCase();

    if (source === "+") return "Зміни внесено";
    if (source === "-") return "Відхилено";

    if (!source || /^\?+(\s+\?+)*$/.test(source) || lower === "pending" || lower === "unknown") {
      return "очікує обробки";
    }
    if (lower.includes("очіку")) return "очікує обробки";
    if (lower.includes("внесено")) return "Зміни внесено";
    if (lower.includes("відхил")) return "Відхилено";

    return source;
  };

  data.forEach(row => {
    row.status = normalizeHistoryStatus(row.status);

    const item = document.createElement("div");
    item.style = `
      border:1px solid #ccc;
      border-radius:6px;
      margin-bottom:10px;
      padding:10px;
      background:#fff;
      position:relative;
    `;

    if (String(row.status || "").toLowerCase().includes("очікує")) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✖";
      deleteBtn.style = `
        position:absolute;
        top:5px;
        right:5px;
        cursor:pointer;
        background:transparent;
        border:none;
        font-size:16px;
        color:red;
      `;
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Видалити запис?")) return;
        try {
          const { error } = await client
            .from('corrections')
            .delete()
            .eq('id', row.id);

          if (error) {
            console.error(error);
            alert("Помилка видалення запису");
          } else {
            item.remove();
          }
        } catch (err) {
          console.error(err);
          alert("Помилка мережі");
        }
      });
      item.appendChild(deleteBtn);
    }

    const contentDiv = document.createElement("div");

    const dateEntry = row.submitted_at ? new Date(row.submitted_at) : null;
    const dateChange = row.effective_date ? new Date(row.effective_date) : null;
    const dateDiv = document.createElement("div");
    dateDiv.style.fontWeight = "bold";

    const line1 = dateEntry ? row.sender + " " + dateEntry.toLocaleString("uk-UA") : "";
    const line2 = dateChange ? "зміни з: " + dateChange.toLocaleDateString("uk-UA") : "";

    dateDiv.innerHTML = [line1, line2].filter(x => x).join("<br>");
    contentDiv.appendChild(dateDiv);

    const addrDiv = document.createElement("div");
    const address = String(row.address || "").trim();
    if (singleHomeMode) {
      const lastPart = address.split(",").map(x => x.trim()).filter(Boolean).pop() || "";
      const looksLikeKv = /^(кв\.?\s*)?\d+[а-яa-z\-\/]*$/i.test(lastPart);
      const kvText = looksLikeKv ? lastPart.replace(/^кв\.?\s*/i, "") : (row.account_id || "");
      addrDiv.innerHTML = `кв.: <b>${kvText || "—"}</b>`;
    } else {
      addrDiv.innerHTML = `Адреса: <b>${address || "—"}</b>`;
    }
    contentDiv.appendChild(addrDiv);

    let statusColor = "#ffe79a";
    if (row.status?.toLowerCase().includes("внесено")) {
      statusColor = "#b6ffb3";
    } else if (row.status?.toLowerCase().includes("відхилено")) {
      statusColor = "#ffb3b3";
    }

    const fields = [
      { label: "ФІО", old: row.fio_old, new: row.fio_new },
      { label: "Площа", old: row.pl_old, new: row.pl_new },
      { label: "Мешканців", old: row.pers_old, new: row.pers_new },
      { label: "Під’їзд", old: row.pod_old, new: row.pod_new },
      { label: "Поверх", old: row.et_old, new: row.et_new },
      { label: "Email", old: row.email_old, new: row.email_new },
      { label: "Телефон", old: row.tel_old, new: row.tel_new },
      { label: "Примітка", old: row.note_old, new: row.note_new }
    ];

    fields.forEach(f => {
      if ((f.old || "") !== (f.new || "")) {
        const fDiv = document.createElement("div");
        fDiv.innerHTML = `${f.label}: <span style="color:#888">${f.old || "—"}</span> → <span style="background:#ffff99">${f.new || "—"}</span>`;
        contentDiv.appendChild(fDiv);
      }
    });

    if (row.correction_amount) {
      const corrDiv = document.createElement("div");
      corrDiv.innerHTML = `Корекція: ${row.correction_amount} за ${row.correction_month ? new Date(row.correction_month).toLocaleDateString("uk-UA", {
        month: "long",
        year: "numeric"
      }) : ""}<br>Підстава: ${row.correction_text || ""}`;
      contentDiv.appendChild(corrDiv);
    }

    const statusDiv = document.createElement("div");
    statusDiv.className = "modal-status";
    statusDiv.style.background = statusColor;

    statusDiv.textContent = row.status;
    contentDiv.appendChild(statusDiv);

    item.appendChild(contentDiv);
    list.appendChild(item);
  });
}

function showHistoryModal(data, options = {}) {
  const titleText = options.title || "Історія запитів на зміну";
  const showFilters = !!options.showFilters;
  const showOrgFilter = !!options.showOrgFilter;
  const filters = options.filters || { myOnly: false, orgOnly: false };
  const onFilterChange = typeof options.onFilterChange === "function" ? options.onFilterChange : null;

  let modal = document.getElementById("historyModalOverlay");
  let list;
  let statusLine;
  let titleEl;
  let mineInput;
  let orgInput;

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "historyModalOverlay";
    modal.className = "modal-overlay";
    modal.style = `
      position:fixed;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.8);
      display:flex; justify-content:center; align-items:flex-start;
      padding-top:40px;
      overflow-y:auto;
      z-index:10000;
    `;

    const modalWindow = document.createElement("div");
    modalWindow.className = "modal-window";
    modalWindow.style = `
      background:#fff;
      max-width:650px;
      width:90%;
      padding:20px;
      border-radius:10px;
      position:relative;
    `;

    titleEl = document.createElement("h3");
    titleEl.id = "historyModalTitle";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    closeBtn.style = `
      position:absolute;
      top:15px;
      right:15px;
      cursor:pointer;
      background:transparent;
      border:none;
      font-size:18px;
    `;
    closeBtn.addEventListener("click", () => modal.remove());

    const filtersWrap = document.createElement("div");
    filtersWrap.id = "historyFiltersWrap";
    filtersWrap.style.marginTop = "8px";
    filtersWrap.style.marginBottom = "8px";
    filtersWrap.style.display = "none";
    filtersWrap.style.gap = "14px";
    filtersWrap.style.flexWrap = "wrap";

    const mineLabel = document.createElement("label");
    mineLabel.style.display = "inline-flex";
    mineLabel.style.alignItems = "center";
    mineLabel.style.gap = "6px";
    mineLabel.innerHTML = `<input type="checkbox" id="historyFilterMine"> Лише мої запити`;

    const orgLabel = document.createElement("label");
    orgLabel.id = "historyFilterOrgLabel";
    orgLabel.style.display = "inline-flex";
    orgLabel.style.alignItems = "center";
    orgLabel.style.gap = "6px";
    orgLabel.innerHTML = `<input type="checkbox" id="historyFilterOrg"> Лише по ${org || "активному дому"}`;

    filtersWrap.appendChild(mineLabel);
    filtersWrap.appendChild(orgLabel);

    statusLine = document.createElement("div");
    statusLine.id = "historyFilterStatus";
    statusLine.style.marginTop = "4px";
    statusLine.style.fontSize = "12px";
    statusLine.style.color = "#666";

    list = document.createElement("div");
    list.id = "historyList";
    list.style.marginTop = "20px";

    modalWindow.appendChild(titleEl);
    modalWindow.appendChild(closeBtn);
    modalWindow.appendChild(filtersWrap);
    modalWindow.appendChild(statusLine);
    modalWindow.appendChild(list);
    modal.appendChild(modalWindow);
    document.body.appendChild(modal);

    mineInput = mineLabel.querySelector("#historyFilterMine");
    orgInput = orgLabel.querySelector("#historyFilterOrg");

    const triggerFilterChange = async () => {
      const state = modal._historyState || {};
      if (!state.onFilterChange || state.updating) return;

      state.updating = true;
      statusLine.textContent = "Оновлення...";
      mineInput.disabled = true;
      orgInput.disabled = true;

      try {
        const newData = await state.onFilterChange({
          myOnly: mineInput.checked,
          orgOnly: orgInput.checked
        });
        renderHistoryList(list, newData);
      } catch (err) {
        console.error(err);
        showMessage("Помилка отримання історії","err");
      } finally {
        state.updating = false;
        statusLine.textContent = "";
        mineInput.disabled = false;
        orgInput.disabled = false;
      }
    };

    mineInput.addEventListener("change", triggerFilterChange);
    orgInput.addEventListener("change", triggerFilterChange);

    modal.addEventListener("click", e => {
      if (e.target === modal) modal.remove();
    });
  } else {
    titleEl = modal.querySelector("#historyModalTitle");
    list = modal.querySelector("#historyList");
    statusLine = modal.querySelector("#historyFilterStatus");
    mineInput = modal.querySelector("#historyFilterMine");
    orgInput = modal.querySelector("#historyFilterOrg");
  }

  const filtersWrap = modal.querySelector("#historyFiltersWrap");
  if (titleEl) titleEl.textContent = titleText;

  modal._historyState = {
    onFilterChange,
    updating: false
  };

  const orgLabel = modal.querySelector("#historyFilterOrgLabel");

  if (filtersWrap && mineInput && orgInput) {
    filtersWrap.style.display = showFilters ? "flex" : "none";
    if (orgLabel) orgLabel.style.display = showOrgFilter ? "inline-flex" : "none";
    mineInput.checked = !!filters.myOnly;
    orgInput.checked = !!filters.orgOnly;
    mineInput.disabled = !showFilters;
    orgInput.disabled = !showFilters || !showOrgFilter;
  }

  if (statusLine) statusLine.textContent = "";
  renderHistoryList(list, data);
}
let headerResizeObserver = null;
let isHeaderCompact = false;
let headerCompactLockUntil = 0;

function updateResidentAddressLayout() {
  if (!document.body.classList.contains("resident-mode")) return;
  const line = document.querySelector("#header .line-address");
  if (!line) return;

  const label = line.querySelector(".label");
  const value = line.querySelector(".value");
  const orgEl = line.querySelector("#org-head");
  if (!label || !value || !orgEl) return;

  line.classList.remove("org-stacked");

  const measureTextWidth = function (sourceEl, text) {
    const probe = document.createElement("span");
    const cs = window.getComputedStyle(sourceEl);
    probe.style.position = "absolute";
    probe.style.left = "-99999px";
    probe.style.top = "-99999px";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    probe.style.font = cs.font;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.textContent = String(text || "");
    document.body.appendChild(probe);
    const w = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();
    return w;
  };

  const lineStyles = window.getComputedStyle(line);
  const gap = parseFloat(lineStyles.columnGap || lineStyles.gap || "0") || 0;
  const available = Math.max(0, Math.floor(line.clientWidth));
  const labelWidth = measureTextWidth(label, label.textContent || "");
  const valueText = value.textContent || "";
  const valueWidth = measureTextWidth(value, valueText);
  const orgWidth = measureTextWidth(orgEl, orgEl.textContent || "");
  const needed = labelWidth + valueWidth + orgWidth + gap * 2;

  if (needed > available + 2) {
    line.classList.add("org-stacked");
  }
}

function updateHeaderCompactState() {
  const header = document.getElementById("header");
  if (!header) return;
  if (document.body.classList.contains("resident-mode")) {
    if (isHeaderCompact) {
      isHeaderCompact = false;
      header.classList.remove("header-compact");
    }
    return;
  }

  const now = Date.now();
  if (now < headerCompactLockUntil) return;

  const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const COMPACT_ON = 80;
  const COMPACT_OFF = 1;
  const compactNow = isHeaderCompact ? y > COMPACT_OFF : y > COMPACT_ON;
  if (compactNow === isHeaderCompact) return;

  isHeaderCompact = compactNow;
  header.classList.toggle("header-compact", compactNow);
  headerCompactLockUntil = now + 140;
  updateStickyTop();
}

function updateStickyTop() {
  const header = document.querySelector(".header-row");
  if (!header) return;

  const topbarOffset = document.body.classList.contains("resident-mode") ? 0 : 48;
  const rect = header.getBoundingClientRect();
  const stickyTop = Math.ceil(topbarOffset + rect.height);

  document.documentElement.style.setProperty(
    "--topbar-offset",
    `${topbarOffset}px`
  );

  document.documentElement.style.setProperty(
    "--header-height",
    `${stickyTop}px`
  );

  // Подключаем ResizeObserver ТОЛЬКО ОДИН РАЗ
  if ("ResizeObserver" in window && !headerResizeObserver) {
    headerResizeObserver = new ResizeObserver(() => {
      updateStickyTop();
      updateResidentAddressLayout();
    });
    headerResizeObserver.observe(header);
  }
}

// fallback
window.addEventListener("load", updateStickyTop);
window.addEventListener("resize", updateStickyTop);
window.addEventListener("load", updateHeaderCompactState);
window.addEventListener("resize", updateHeaderCompactState);
window.addEventListener("scroll", updateHeaderCompactState, { passive: true });
window.addEventListener("load", updateResidentAddressLayout);
window.addEventListener("resize", updateResidentAddressLayout);
document.addEventListener("click", function (e) {
    const label = e.target.closest("label[for^='block-']");
    if (!label) return;

    const id = label.getAttribute("for");
    const table = document.querySelector(`.year-table[data-id="${id}"]`);
    if (!table) return;

    // переключаем только ЭТУ таблицу
    table.classList.toggle("active");

    // (опционально) подсветка активной кнопки
    label.classList.toggle("active", table.classList.contains("active"));
});


