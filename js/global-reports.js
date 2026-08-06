(function(){
// generated-reports.js
// Содержит логику отображения и генерации отчётов, которые строятся на лету

let selectedGeneratedReport = null;

const generatedReportDefinitions = [
  {
    id: "month-accounts",
    title: "Список особових рахунків",
    period: "month",
    extension: "xlsx",
    build: buildMonthAccountsReport
  },
  {
    id: "month-payments",
    title: "Реєстр платежів",
    period: "month",
    extension: "xlsx",
    build: buildMonthPaymentsReport
  },
  {
    id: "month-debtors",
    title: "Список боржників",
    period: "month",
    extension: "xlsx",
    build: buildMonthDebtorsReport
  },
  {
    id: "year-payments",
    title: "Реєстр платежів за рік",
    period: "year",
    extension: "xlsx",
    build: buildYearPaymentsReport
  },
  {
    id: "year-debtors",
    title: "Список боржників за рік",
    period: "year",
    extension: "xlsx",
    build: buildYearDebtorsReport
  }
];

function getGeneratedReportsForPeriod(period) {
  return generatedReportDefinitions.filter(item => item.period === period);
}

const monthLabels = [
  "січ",
  "лют",
  "бер",
  "квіт",
  "трав",
  "черв",
  "лип",
  "серп",
  "вер",
  "жовт",
  "лист",
  "груд"
];

const fullMonthNames = [
  "січень",
  "лютий",
  "березень",
  "квітень",
  "травень",
  "червень",
  "липень",
  "серпень",
  "вересень",
  "жовтень",
  "листопад",
  "грудень"
];

function getMonthRange(startYear, startMonth, endYear, endMonth) {
  const months = [];
  let year = Number(startYear);
  let month = Number(startMonth);
  const lastYear = Number(endYear);
  const lastMonth = Number(endMonth);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push({ year: String(year), month: String(month).padStart(2, '0') });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function buildReportContext(home, periodLabel) {
  return {
    organization: home?.name || home?.org || "Організація",
    periodLabel,
    generatedAt: `Згенеровано: ${new Date().toLocaleDateString("uk-UA")}`
  };
}

function formatDateRangeLabel(startYear, startMonth, endYear, endMonth) {
  const startLabel = `${fullMonthNames[Number(startMonth) - 1] || startMonth} ${startYear}`;
  const endLabel = `${fullMonthNames[Number(endMonth) - 1] || endMonth} ${endYear}`;
  return startYear === endYear && startMonth === endMonth
    ? startLabel
    : `${startLabel} – ${endLabel}`;
}

function buildAggregateMonthReport(reportDef, home, homeData, monthRange) {
  if (!Array.isArray(monthRange) || monthRange.length === 0) return null;

  const yearMonths = monthRange.map(({ year, month }) => ({ year, month }));
  switch (reportDef.id) {
    case "month-accounts":
      return buildMonthAccountsRangeReport(home, homeData, yearMonths);
    case "month-payments":
      return buildMonthPaymentsRangeReport(home, homeData, yearMonths);
    case "month-debtors":
      return buildMonthDebtorsRangeReport(home, homeData, yearMonths);
    default:
      return null;
  }
}

function getReportPeriodLabel(reportDef, startYear, startMonth, endYear, endMonth) {
  if (reportDef.period === "year") {
    return `${startYear} р.`;
  }
  return formatDateRangeLabel(startYear, startMonth, endYear, endMonth);
}

function buildMonthAccountsRangeReport(home, homeData, yearMonths) {
  const periodLabel = formatDateRangeLabel(yearMonths[0].year, yearMonths[0].month, yearMonths[yearMonths.length - 1].year, yearMonths[yearMonths.length - 1].month);
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  const ids = Object.keys(homeData.ls || {}).sort((a, b) => {
    const av = Number(homeData.ls[a]?.kv) || Number(a) || 0;
    const bv = Number(homeData.ls[b]?.kv) || Number(b) || 0;
    return av - bv;
  });
  let totalCharge = 0;
  let totalPaid = 0;
  let totalDiff = 0;

  ids.forEach(accountId => {
    const account = homeData.ls[accountId] || {};
    const kv = account.kv || "";
    const fio = account.fio || account.name || "";
    const area = account.sqr || account.area || account.square || "";
    const charge = yearMonths.reduce((sum, { year, month }) => {
      return sum + Object.values(homeData.nach?.[accountId]?.[year]?.[month] || {}).reduce((rowSum, v) => rowSum + Number(v || 0), 0);
    }, 0);
    const paid = yearMonths.reduce((sum, { year, month }) => {
      return sum + (homeData.oplat?.[accountId]?.[year]?.[month] || []).reduce((rowSum, p) => rowSum + Number(p.sum || 0), 0);
    }, 0);
    const diff = charge - paid;
    totalCharge += charge;
    totalPaid += paid;
    totalDiff += diff;
    rows.push([
      kv,
      fio,
      area ? String(area) : "",
      formatMoney(charge),
      formatMoney(paid),
      formatMoney(diff)
    ]);
  });

  const summary = [`Всього нараховано: ${formatMoney(totalCharge)} грн; сплачено: ${formatMoney(totalPaid)} грн; різниця: ${formatMoney(totalDiff)} грн.`];
  return {
    ...context,
    title: "Список особових рахунків",
    columns: ["Кв.", "ПІБ", "Площа", "Нараховано", "Сплачено", "Різниця"],
    rows,
    summary
  };
}

function buildMonthPaymentsRangeReport(home, homeData, yearMonths) {
  const periodLabel = formatDateRangeLabel(yearMonths[0].year, yearMonths[0].month, yearMonths[yearMonths.length - 1].year, yearMonths[yearMonths.length - 1].month);
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalAmount = 0;
  const payments = [];

  for (const accountId in homeData.oplat || {}) {
    const account = homeData.ls[accountId] || {};
    yearMonths.forEach(({ year, month }) => {
      const paymentsList = homeData.oplat[accountId]?.[year]?.[month] || [];
      paymentsList.forEach(payment => {
        payments.push({
          kv: account.kv || "",
          fio: account.fio || account.name || "",
          date: payment.date || "",
          sum: Number(payment.sum || 0),
          description: payment.nazn || payment.naznachenie || ""
        });
      });
    });
  }

  payments.sort((a, b) => {
    if (a.kv !== b.kv) return (Number(a.kv) || 0) - (Number(b.kv) || 0);
    return a.date.localeCompare(b.date);
  });

  payments.forEach(payment => {
    totalAmount += payment.sum;
    rows.push([
      payment.kv,
      payment.fio,
      payment.date,
      formatMoney(payment.sum),
      escapeHtml(payment.description || "")
    ]);
  });

  const summary = [`Платежів: ${payments.length}; загальна сума: ${formatMoney(totalAmount)} грн.`];
  return {
    ...context,
    title: "Реєстр платежів",
    columns: ["Кв.", "ПІБ", "Дата", "Сума", "Призначення"],
    rows,
    summary
  };
}

function buildMonthDebtorsRangeReport(home, homeData, yearMonths) {
  const periodLabel = formatDateRangeLabel(yearMonths[0].year, yearMonths[0].month, yearMonths[yearMonths.length - 1].year, yearMonths[yearMonths.length - 1].month);
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalDebt = 0;

  Object.keys(homeData.ls || {}).forEach(accountId => {
    const account = homeData.ls[accountId] || {};
    const kv = account.kv || "";
    const fio = account.fio || account.name || "";
    const charge = yearMonths.reduce((sum, { year, month }) => {
      return sum + Object.values(homeData.nach?.[accountId]?.[year]?.[month] || {}).reduce((rowSum, v) => rowSum + Number(v || 0), 0);
    }, 0);
    const paid = yearMonths.reduce((sum, { year, month }) => {
      return sum + (homeData.oplat?.[accountId]?.[year]?.[month] || []).reduce((rowSum, p) => rowSum + Number(p.sum || 0), 0);
    }, 0);
    const debt = charge - paid;
    if (debt > 0.005) {
      totalDebt += debt;
      rows.push([kv, fio, formatMoney(charge), formatMoney(paid), formatMoney(debt)]);
    }
  });

  rows.sort((a, b) => parseMoneyValue(b[4]) - parseMoneyValue(a[4]));
  const summary = [`Заборгованість: ${formatMoney(totalDebt)} грн; боржників: ${rows.length}.`];
  return {
    ...context,
    title: "Список боржників",
    columns: ["Кв.", "ПІБ", "Нараховано", "Сплачено", "Заборгованість"],
    rows,
    summary
  };
}

function renderGeneratedYearReports(container, year) {
  if (!year) return;
  const reports = getGeneratedReportsForPeriod("year");
  if (!reports.length) return;

  const section = document.createElement("div");
  section.className = "generated-report-section";

  const title = document.createElement("div");
  title.className = "generated-report-section-title";
  title.textContent = "Генеровані річні звіти";
  section.appendChild(title);

  const ul = document.createElement("ul");
  ul.className = "file-list";
  reports.forEach(report => {
    const reportPath = getGeneratedReportPath(report.id, year);
    const li = document.createElement("li");
    li.className = "file generated-report excel";
    li.textContent = report.title;
    li.dataset.path = reportPath;
    li.dataset.reportId = report.id;
    li.onclick = () => openGeneratedReport(report, year);
    if (selectedFile === reportPath) li.classList.add("active-file");
    ul.appendChild(li);
  });

  section.appendChild(ul);
  container.appendChild(section);
}

function renderGeneratedMonthReports(container, year, month) {
  if (!year || !month) return;
  const reports = getGeneratedReportsForPeriod("month");
  if (!reports.length) return;

  const section = document.createElement("div");
  section.className = "generated-report-section";

  const title = document.createElement("div");
  title.className = "generated-report-section-title";
  title.textContent = "Генеровані місячні звіти";
  section.appendChild(title);

  const ul = document.createElement("ul");
  ul.className = "file-list";
  reports.forEach(report => {
    const reportPath = getGeneratedReportPath(report.id, year, month);
    const li = document.createElement("li");
    li.className = "file generated-report excel";
    li.textContent = report.title;
    li.dataset.path = reportPath;
    li.dataset.reportId = report.id;
    li.onclick = () => openGeneratedReport(report, year, month);
    if (selectedFile === reportPath) li.classList.add("active-file");
    ul.appendChild(li);
  });

  section.appendChild(ul);
  container.appendChild(section);
}

function getGeneratedReportPath(reportId, year, month) {
  return month ? `generated/${year}/${month}/${reportId}` : `generated/${year}/${reportId}`;
}

function openGeneratedReport(reportDef, year, month) {
  const reportPath = getGeneratedReportPath(reportDef.id, year, month);
  selectedGeneratedReport = reportDef.id;
  selectedFile = reportPath;

  document.querySelectorAll("#filebar li.file").forEach(li => {
    li.classList.toggle("active-file", li.dataset.path === reportPath);
  });

  const preview = document.getElementById("preview");
  if (!preview) return;
  preview.innerHTML = "";

  const reportData = reportDef.build(year, month);

  const actions = document.createElement("div");
  actions.className = "generated-report-actions";

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "📥 Скачать Excel";
  downloadBtn.onclick = () => downloadGeneratedReport(reportDef, year, month, reportData);
  actions.appendChild(downloadBtn);

  if (reportData.summary && reportData.summary.length) {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋 Копировать данные";
    copyBtn.onclick = () => copyGeneratedReportText(reportData);
    actions.appendChild(copyBtn);
  }

  preview.appendChild(actions);
  preview.appendChild(renderGeneratedReportHeader(reportData));
  preview.appendChild(renderGeneratedReportTable(reportData));
}

function renderGeneratedReportHeader(reportData) {
  const header = document.createElement("div");
  header.className = "generated-report-header";

  const logo = document.createElement("div");
  logo.className = "generated-report-logo-wrap";
  const img = document.createElement("img");
  img.className = "generated-report-logo";
  img.src = "img/AllLs.png";
  img.alt = "Логотип";
  logo.appendChild(img);

  const center = document.createElement("div");
  center.className = "generated-report-title-block";
  const title = document.createElement("div");
  title.className = "generated-report-title";
  title.textContent = reportData.title;
  const organisation = document.createElement("div");
  organisation.className = "generated-report-org";
  organisation.textContent = reportData.organization || "Організація";
  const period = document.createElement("div");
  period.className = "generated-report-period";
  period.textContent = reportData.periodLabel;

  center.appendChild(title);
  center.appendChild(organisation);
  center.appendChild(period);

  const meta = document.createElement("div");
  meta.className = "generated-report-meta";
  meta.textContent = reportData.generatedAt || "";

  header.appendChild(logo);
  header.appendChild(center);
  header.appendChild(meta);
  return header;
}

function renderGeneratedReportTable(reportData) {
  const table = document.createElement("table");
  table.className = "generated-report-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  reportData.columns.forEach(column => {
    const th = document.createElement("th");
    th.textContent = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  reportData.rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.innerHTML = cell ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  if (reportData.summary && reportData.summary.length) {
    const tfoot = document.createElement("tfoot");
    reportData.summary.forEach(summaryRow => {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = reportData.columns.length;
      td.className = "generated-report-summary";
      td.innerHTML = summaryRow;
      tr.appendChild(td);
      tfoot.appendChild(tr);
    });
    table.appendChild(tfoot);
  }

  return table;
}

function copyGeneratedReportText(reportData) {
  const text = [reportData.title, reportData.organization, reportData.periodLabel]
    .concat(reportData.rows.map(row => row.join("\t")))
    .join("\n");
  navigator.clipboard.writeText(text).then(() => {
    alert("Дані скопійовано в буфер обміну");
  }, () => {
    alert("Не вдалося скопіювати дані");
  });
}

function downloadGeneratedReport(reportDef, year, month, reportData) {
  if (typeof ExcelJS === "undefined") {
    alert("ExcelJS не завантажено. Спробуйте пізніше.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportDef.title);

  worksheet.addRow([reportData.organization]);
  worksheet.addRow([reportData.title]);
  worksheet.addRow([reportData.periodLabel]);
  worksheet.addRow([]);

  worksheet.addRow(reportData.columns);
  reportData.rows.forEach(row => {
    worksheet.addRow(row.map(cell => typeof cell === "string" ? cell.replace(/<[^>]*>/g, "") : cell));
  });

  if (reportData.summary && reportData.summary.length) {
    worksheet.addRow([]);
    reportData.summary.forEach(summaryRow => {
      worksheet.addRow([summaryRow.replace(/<[^>]*>/g, "")]);
    });
  }

  worksheet.columns.forEach(column => {
    column.width = Math.max(12, (column.header?.toString().length || 0) + 2);
  });

  const fileName = `${reportDef.id}_${year}${month ? `_${month}` : ""}.${reportDef.extension}`;

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function buildReportContext(year, month) {
  const home = homes.find(h => h.code === homeCode) || {};
  const organization = home.name || home.org || home.ORGKR || org || "Організація";
  const monthName = month ? fullMonthName(month) : null;
  const periodLabel = month
    ? `${monthName || month} ${year} р.`
    : `${year} р.`;
  return {
    organization,
    periodLabel,
    generatedAt: `Згенеровано: ${new Date().toLocaleDateString("uk-UA")}`
  };
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fullMonthName(month) {
  const monthNum = Number(month);
  const names = [
    "січень",
    "лютий",
    "березень",
    "квітень",
    "травень",
    "червень",
    "липень",
    "серпень",
    "вересень",
    "жовтень",
    "листопад",
    "грудень"
  ];
  return names[monthNum - 1] || month;
}

function buildMonthAccountsReport(home, homeData, year, month) {
  if (typeof year === 'undefined' && typeof month === 'undefined' && typeof homeData === 'string') {
    month = homeData;
    year = home;
    home = homes.find(h => h.code === activeHomeCode) || {};
    homeData = window.homeData?.[activeHomeCode] || {};
  }
  const periodLabel = `${fullMonthNames[Number(month) - 1] || month} ${year} р.`;
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  const ids = Object.keys(homeData.ls || {}).sort((a, b) => {
    const av = Number(homeData.ls[a]?.kv) || Number(a) || 0;
    const bv = Number(homeData.ls[b]?.kv) || Number(b) || 0;
    return av - bv;
  });
  let totalCharge = 0;
  let totalPaid = 0;
  let totalDiff = 0;

  ids.forEach(accountId => {
    const account = homeData.ls[accountId] || {};
    const kv = account.kv || "";
    const fio = account.fio || account.name || "";
    const area = account.sqr || account.area || account.square || "";
    const charge = Object.values(homeData.nach?.[accountId]?.[year]?.[month] || {}).reduce((sum, v) => sum + Number(v || 0), 0);
    const paid = (homeData.oplat?.[accountId]?.[year]?.[month] || []).reduce((sum, p) => sum + Number(p.sum || 0), 0);
    const diff = charge - paid;
    totalCharge += charge;
    totalPaid += paid;
    totalDiff += diff;
    rows.push([
      kv,
      fio,
      area ? String(area) : "",
      formatMoney(charge),
      formatMoney(paid),
      formatMoney(diff)
    ]);
  });

  const summary = [`Всього нараховано: ${formatMoney(totalCharge)} грн; сплачено: ${formatMoney(totalPaid)} грн; різниця: ${formatMoney(totalDiff)} грн.`];

  return {
    ...context,
    title: "Список особових рахунків",
    columns: ["Кв.", "ПІБ", "Площа", "Нараховано", "Сплачено", "Різниця"],
    rows,
    summary
  };
}

function buildMonthPaymentsReport(home, homeData, year, month) {
  if (typeof year === 'undefined' && typeof month === 'undefined' && typeof homeData === 'string') {
    month = homeData;
    year = home;
    home = homes.find(h => h.code === activeHomeCode) || {};
    homeData = window.homeData?.[activeHomeCode] || {};
  }
  const periodLabel = `${fullMonthNames[Number(month) - 1] || month} ${year} р.`;
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalAmount = 0;
  const payments = [];

  for (const accountId in homeData.oplat || {}) {
    const account = homeData.ls[accountId] || {};
    const paymentsList = homeData.oplat[accountId]?.[year]?.[month] || [];
    paymentsList.forEach(payment => {
      payments.push({
        kv: account.kv || "",
        fio: account.fio || account.name || "",
        date: payment.date || "",
        sum: Number(payment.sum || 0),
        description: payment.nazn || payment.naznachenie || ""
      });
    });
  }

  payments.sort((a, b) => {
    if (a.kv !== b.kv) return (Number(a.kv) || 0) - (Number(b.kv) || 0);
    return a.date.localeCompare(b.date);
  });

  payments.forEach(payment => {
    totalAmount += payment.sum;
    rows.push([
      payment.kv,
      payment.fio,
      payment.date,
      formatMoney(payment.sum),
      escapeHtml(payment.description || "")
    ]);
  });

  const summary = [`Платежів: ${payments.length}; загальна сума: ${formatMoney(totalAmount)} грн.`];

  return {
    ...context,
    title: "Реєстр платежів",
    columns: ["Кв.", "ПІБ", "Дата", "Сума", "Призначення"],
    rows,
    summary
  };
}

function buildMonthDebtorsReport(home, homeData, year, month) {
  if (typeof year === 'undefined' && typeof month === 'undefined' && typeof homeData === 'string') {
    month = homeData;
    year = home;
    home = homes.find(h => h.code === activeHomeCode) || {};
    homeData = window.homeData?.[activeHomeCode] || {};
  }
  const periodLabel = `${fullMonthNames[Number(month) - 1] || month} ${year} р.`;
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalDebt = 0;

  Object.keys(homeData.ls || {}).forEach(accountId => {
    const account = homeData.ls[accountId] || {};
    const kv = account.kv || "";
    const fio = account.fio || account.name || "";
    const charge = Object.values(homeData.nach?.[accountId]?.[year]?.[month] || {}).reduce((sum, v) => sum + Number(v || 0), 0);
    const paid = (homeData.oplat?.[accountId]?.[year]?.[month] || []).reduce((sum, p) => sum + Number(p.sum || 0), 0);
    const debt = charge - paid;
    if (debt > 0.005) {
      totalDebt += debt;
      rows.push([kv, fio, formatMoney(charge), formatMoney(paid), formatMoney(debt)]);
    }
  });

  rows.sort((a, b) => parseMoneyValue(b[4]) - parseMoneyValue(a[4]));

  const summary = [`Заборгованість: ${formatMoney(totalDebt)} грн; боржників: ${rows.length}.`];

  return {
    ...context,
    title: "Список боржників",
    columns: ["Кв.", "ПІБ", "Нараховано", "Сплачено", "Заборгованість"],
    rows,
    summary
  };
}

function buildYearPaymentsReport(home, homeData, year) {
  if (typeof homeData === 'undefined' && typeof year === 'undefined' && typeof home === 'string') {
    const fallbackYear = home;
    home = homes.find(h => h.code === activeHomeCode) || {};
    homeData = window.homeData?.[activeHomeCode] || {};
    year = fallbackYear;
  }
  const periodLabel = `${year} р.`;
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalAmount = 0;
  const payments = [];

  for (const accountId in homeData.oplat || {}) {
    const account = homeData.ls[accountId] || {};
    const paymentsByYear = homeData.oplat[accountId]?.[year] || {};
    Object.keys(paymentsByYear || {}).forEach(month => {
      (paymentsByYear[month] || []).forEach(payment => {
        payments.push({
          kv: account.kv || "",
          fio: account.fio || account.name || "",
          date: payment.date || "",
          month,
          sum: Number(payment.sum || 0),
          description: payment.nazn || payment.naznachenie || ""
        });
      });
    });
  }

  payments.sort((a, b) => {
    if (a.month !== b.month) return a.month.localeCompare(b.month);
    if (a.kv !== b.kv) return (Number(a.kv) || 0) - (Number(b.kv) || 0);
    return a.date.localeCompare(b.date);
  });

  payments.forEach(payment => {
    totalAmount += payment.sum;
    rows.push([
      payment.kv,
      payment.fio,
      monthLabels[Number(payment.month) - 1] || payment.month,
      payment.date,
      formatMoney(payment.sum),
      escapeHtml(payment.description || "")
    ]);
  });

  const summary = [`Платежів: ${payments.length}; загальна сума: ${formatMoney(totalAmount)} грн.`];

  return {
    ...context,
    title: "Реєстр платежів за рік",
    columns: ["Кв.", "ПІБ", "Місяць", "Дата", "Сума", "Призначення"],
    rows,
    summary
  };
}

function buildYearDebtorsReport(home, homeData, year) {
  if (typeof homeData === 'undefined' && typeof year === 'undefined' && typeof home === 'string') {
    const fallbackYear = home;
    home = homes.find(h => h.code === activeHomeCode) || {};
    homeData = window.homeData?.[activeHomeCode] || {};
    year = fallbackYear;
  }
  const periodLabel = `${year} р.`;
  const context = buildReportContext(home, periodLabel);
  const rows = [];
  let totalDebt = 0;

  Object.keys(homeData.ls || {}).forEach(accountId => {
    const account = homeData.ls[accountId] || {};
    const kv = account.kv || "";
    const fio = account.fio || account.name || "";
    const totalCharge = Object.keys(homeData.nach?.[accountId]?.[year] || {}).reduce((sum, month) => {
      return sum + Object.values(homeData.nach[accountId][year][month] || {}).reduce((s, v) => s + Number(v || 0), 0);
    }, 0);
    const totalPaid = Object.keys(homeData.oplat?.[accountId]?.[year] || {}).reduce((sum, month) => {
      return sum + (homeData.oplat[accountId][year][month] || []).reduce((s, p) => s + Number(p.sum || 0), 0);
    }, 0);
    const debt = totalCharge - totalPaid;
    if (debt > 0.005) {
      totalDebt += debt;
      rows.push([kv, fio, formatMoney(totalCharge), formatMoney(totalPaid), formatMoney(debt)]);
    }
  });

  rows.sort((a, b) => parseMoneyValue(b[4]) - parseMoneyValue(a[4]));

  const summary = [`Заборгованість за рік: ${formatMoney(totalDebt)} грн; боржників: ${rows.length}.`];

  return {
    ...context,
    title: "Список боржників за рік",
    columns: ["Кв.", "ПІБ", "Нараховано", "Сплачено", "Заборгованість"],
    rows,
    summary
  };
}

function parseMoneyValue(value) {
  const normalized = String(value).replace(/\s/g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderGlobalReports() {
  document.body.classList.remove("files-mode");

  const container = document.getElementById("maincontainer");
  if (!container) return;

  container.innerHTML = `
    <div class="global-reports-shell">
      <div class="global-reports-panel">
        <div class="global-reports-form">
          <div class="global-reports-row">
            <label for="global-report-select">Звіт</label>
            <select id="global-report-select"></select>
          </div>
          <div class="global-reports-row global-report-period-row">
            <div>
              <label for="global-report-start-year">Початок</label>
              <div class="global-report-period-controls">
                <select id="global-report-start-month"></select>
                <select id="global-report-start-year"></select>
              </div>
            </div>
            <div class="global-report-end-period">
              <label for="global-report-end-year">Кінець</label>
              <div class="global-report-period-controls">
                <select id="global-report-end-month"></select>
                <select id="global-report-end-year"></select>
              </div>
            </div>
          </div>
          <div class="global-reports-row global-report-year-row">
            <label for="global-report-year">Рік</label>
            <select id="global-report-year"></select>
          </div>
          <div class="global-reports-row global-report-split-row" style="display:none;">
            <label>
              <input type="checkbox" id="global-report-split-months" /> Розбити по місяцях
            </label>
          </div>
          <div class="global-reports-row global-report-homes-row">
            <label>Будинки</label>
            <div id="global-report-homes" class="global-report-homes"></div>
          </div>
          <div class="global-reports-actions">
            <button id="global-report-preview-button" type="button">Переглянути</button>
            <button id="global-report-download-button" type="button">Завантажити PDF</button>
          </div>
        </div>
        <div id="global-report-preview" class="global-report-preview"></div>
      </div>
    </div>
  `;

  const reportSelect = document.getElementById("global-report-select");
  const startMonth = document.getElementById("global-report-start-month");
  const startYear = document.getElementById("global-report-start-year");
  const endMonth = document.getElementById("global-report-end-month");
  const endYear = document.getElementById("global-report-end-year");
  const yearSelect = document.getElementById("global-report-year");
  const splitCheckbox = document.getElementById("global-report-split-months");
  const homesContainer = document.getElementById("global-report-homes");
  const previewButton = document.getElementById("global-report-preview-button");
  const downloadButton = document.getElementById("global-report-download-button");

  generatedReportDefinitions.forEach(report => {
    const option = document.createElement("option");
    option.value = report.id;
    option.textContent = report.title;
    reportSelect.appendChild(option);
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = String(i).padStart(2, "0");
    option.textContent = fullMonthNames[i - 1];
    startMonth.appendChild(option.cloneNode(true));
    endMonth.appendChild(option.cloneNode(true));
  }

  for (let year = currentYear; year >= currentYear - 5; year--) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    startYear.appendChild(option.cloneNode(true));
    endYear.appendChild(option.cloneNode(true));
    yearSelect.appendChild(option.cloneNode(true));
  }

  homes.forEach(home => {
    const checkbox = document.createElement("label");
    checkbox.className = "global-report-home-item";
    checkbox.innerHTML = `
      <input type="checkbox" class="global-home-checkbox" value="${escapeHtml(home.code)}" checked />
      <span>${escapeHtml(home.name)}</span>
    `;
    homesContainer.appendChild(checkbox);
  });

  startMonth.value = String(currentMonth).padStart(2, "0");
  endMonth.value = String(currentMonth).padStart(2, "0");
  startYear.value = String(currentYear);
  endYear.value = String(currentYear);
  yearSelect.value = String(currentYear);
  reportSelect.value = generatedReportDefinitions[0].id;

  function refreshFormVisibility() {
    const selectedReport = generatedReportDefinitions.find(r => r.id === reportSelect.value);
    const monthRow = document.querySelector(".global-report-period-row");
    const yearRow = document.querySelector(".global-report-year-row");
    const splitRow = document.querySelector(".global-report-split-row");

    if (selectedReport?.period === "year") {
      monthRow.style.display = "none";
      yearRow.style.display = "flex";
      splitRow.style.display = "none";
    } else {
      monthRow.style.display = "flex";
      yearRow.style.display = "none";
      const range = getMonthRange(startYear.value, startMonth.value, endYear.value, endMonth.value);
      splitRow.style.display = range.length > 1 ? "block" : "none";
    }
  }

  function collectFormState() {
    const selectedHomeCodes = Array.from(document.querySelectorAll(".global-home-checkbox:checked")).map(input => input.value);
    const selectedReport = generatedReportDefinitions.find(r => r.id === reportSelect.value);
    const start = { year: startYear.value, month: startMonth.value };
    const end = { year: endYear.value, month: endMonth.value };
    return {
      reportDef: selectedReport,
      selectedHomeCodes,
      startYear: start.year,
      startMonth: start.month,
      endYear: end.year,
      endMonth: end.month,
      year: yearSelect.value,
      splitByMonths: splitCheckbox.checked
    };
  }

  async function previewSelectedReport() {
    const state = collectFormState();
    const previewContainer = document.getElementById("global-report-preview");
    if (!previewContainer) return;
    previewContainer.innerHTML = "";

    if (!state.selectedHomeCodes.length) {
      previewContainer.textContent = "Виберіть хоча б один будинок.";
      return;
    }

    const firstHomeCode = state.selectedHomeCodes[0];
    const home = homes.find(h => h.code === firstHomeCode);
    if (!home) {
      previewContainer.textContent = "Не знайдено обраний будинок.";
      return;
    }

    const homeData = await loadHomeDataForCodes([firstHomeCode]);
    if (!homeData[firstHomeCode]) {
      previewContainer.textContent = "Не вдалося завантажити дані будинку для попереднього перегляду.";
      return;
    }

    const pages = buildReportPages(state.reportDef, home, homeData[firstHomeCode], state);
    if (!pages || !pages.length) {
      previewContainer.textContent = "Немає даних для обраного періоду.";
      return;
    }

    const summary = document.createElement("div");
    summary.className = "global-report-preview-summary";
    summary.textContent = `Попередній перегляд: ${pages.length} сторінка(и) для будинку ${home.name}.`; 
    previewContainer.appendChild(summary);
    previewContainer.appendChild(renderGeneratedReportHeader(pages[0]));
    previewContainer.appendChild(renderGeneratedReportTable(pages[0]));
  }

  async function downloadPdf() {
    const state = collectFormState();
    if (!state.selectedHomeCodes.length) {
      alert("Виберіть хоча б один будинок.");
      return;
    }

    const homeDataMap = await loadHomeDataForCodes(state.selectedHomeCodes);
    const allPages = [];

    for (const homeCode of state.selectedHomeCodes) {
      const home = homes.find(h => h.code === homeCode);
      const homeData = homeDataMap[homeCode];
      if (!home || !homeData) continue;
      const pages = buildReportPages(state.reportDef, home, homeData, state);
      allPages.push(...pages.map(page => ({ home, page })));
    }

    if (!allPages.length) {
      alert("Немає даних для створення PDF.");
      return;
    }

    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFConstructor || typeof html2canvas !== "function") {
      return openPrintableReport(allPages);
    }

    const pdf = new jsPDFConstructor({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const hidden = document.createElement("div");
    hidden.style.position = "fixed";
    hidden.style.left = "-9999px";
    hidden.style.top = "-9999px";
    hidden.style.width = `${pageWidth}px`;
    hidden.style.padding = "20px";
    hidden.style.background = "#ffffff";
    document.body.appendChild(hidden);

    for (let index = 0; index < allPages.length; index++) {
      const pageData = allPages[index].page;
      const pageElement = document.createElement("div");
      pageElement.className = "generated-report-pdf-page";
      pageElement.style.width = `${pageWidth}px`;
      pageElement.style.padding = "16px";
      pageElement.style.boxSizing = "border-box";
      pageElement.appendChild(renderGeneratedReportHeader(pageData));
      pageElement.appendChild(renderGeneratedReportTable(pageData));
      hidden.appendChild(pageElement);

      const canvas = await html2canvas(pageElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const ratio = pageWidth / canvas.width;
      const imgHeight = canvas.height * ratio;
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      hidden.removeChild(pageElement);
    }

    document.body.removeChild(hidden);
    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`reports_${timestamp}.pdf`);
  }

  function buildReportPages(reportDef, home, homeData, state) {
    if (!reportDef) return [];
    if (reportDef.period === "year") {
      return [reportDef.build(home, homeData, state.year)];
    }

    const monthRange = getMonthRange(state.startYear, state.startMonth, state.endYear, state.endMonth);
    if (monthRange.length === 0) return [];
    if (monthRange.length === 1 || !state.splitByMonths) {
      if (monthRange.length === 1) {
        return [reportDef.build(home, homeData, monthRange[0].year, monthRange[0].month)];
      }
      return [buildAggregateMonthReport(reportDef, home, homeData, monthRange)];
    }

    return monthRange.map(({ year, month }) => reportDef.build(home, homeData, year, month));
  }

  async function loadHomeDataForCodes(homeCodes) {
    const result = {};
    await Promise.all(homeCodes.map(async code => {
      try {
        const home = window.homeData?.[code];
        if (home && isHomeDataFresh(home)) {
          result[code] = home;
          return;
        }
        result[code] = await fetchHomeData(code);
      } catch (e) {
        if (window.homeData?.[code]) {
          result[code] = window.homeData[code];
        }
      }
    }));
    return result;
  }

  function openPrintableReport(allPages) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Не вдалося відкрити вікно для друку.");
      return;
    }

    const doc = printWindow.document;
    doc.write('<html><head><title>Звіти</title><style>body{font-family:Arial, sans-serif;margin:0;padding:20px;background:#fff;} .generated-report-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ddd;margin-bottom:16px;padding-bottom:12px;} .generated-report-title-block{flex:1;margin:0 16px;} .generated-report-title{font-size:18px;font-weight:700;margin-bottom:6px;} .generated-report-period,.generated-report-org,.generated-report-meta{font-size:13px;color:#555;} .generated-report-table{width:100%;border-collapse:collapse;margin-top:12px;} .generated-report-table th,.generated-report-table td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px;} .generated-report-summary td{font-weight:700;background:#f7f7f7;} .page-break{page-break-after:always;}</style></head><body>');
    allPages.forEach((page, index) => {
      const html = renderGeneratedReportHeader(page.page).outerHTML + renderGeneratedReportTable(page.page).outerHTML;
      doc.write(`<div>${html}</div>${index < allPages.length - 1 ? '<div class="page-break"></div>' : ''}`);
    });
    doc.write('</body></html>');
    doc.close();
    printWindow.focus();
    printWindow.print();
  }

  function wireEvents() {
    reportSelect.addEventListener("change", () => {
      refreshFormVisibility();
      previewSelectedReport();
    });
    startMonth.addEventListener("change", () => {
      refreshFormVisibility();
      previewSelectedReport();
    });
    startYear.addEventListener("change", () => {
      refreshFormVisibility();
      previewSelectedReport();
    });
    endMonth.addEventListener("change", () => {
      refreshFormVisibility();
      previewSelectedReport();
    });
    endYear.addEventListener("change", () => {
      refreshFormVisibility();
      previewSelectedReport();
    });
    splitCheckbox.addEventListener("change", previewSelectedReport);
    homesContainer.addEventListener("change", previewSelectedReport);
    previewButton.addEventListener("click", previewSelectedReport);
    downloadButton.addEventListener("click", downloadPdf);
  }

  refreshFormVisibility();
  wireEvents();
  previewSelectedReport();
})();
