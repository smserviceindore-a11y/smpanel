const ExcelJS = require('exceljs');
const {
  renderDonutChart,
  renderBarChart,
  renderTrendChart,
} = require('./chartImages');

const BRAND = 'FF0F3D3E';
const ACCENT = 'FF14B8A6';
const HEADER_BG = 'FF0F3D3E';
const HEADER_FG = 'FFFFFFFF';
const MIST = 'FFE7EEEC';
const KPI_BG = 'FF0A2A2B';
const CARD_BG = 'FFF4F7F6';
const WHITE = 'FFFFFFFF';
const MUTED = 'FF5B6E6D';

const fillSolid = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const thinBorder = {
  top: { style: 'thin', color: { argb: 'FFD5E0DD' } },
  left: { style: 'thin', color: { argb: 'FFD5E0DD' } },
  bottom: { style: 'thin', color: { argb: 'FFD5E0DD' } },
  right: { style: 'thin', color: { argb: 'FFD5E0DD' } },
};

const styleHeader = (sheet) => {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: HEADER_FG }, size: 11 };
  row.fill = fillSolid(HEADER_BG);
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.height = 22;
  row.eachCell((cell) => {
    cell.border = thinBorder;
  });
};

const styleDataSheet = (sheet, rowCount) => {
  styleHeader(sheet);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
  for (let r = 2; r <= rowCount + 1; r += 1) {
    const row = sheet.getRow(r);
    if (r % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (!cell.fill || cell.fill?.fgColor?.argb === WHITE) {
          cell.fill = fillSolid(CARD_BG);
        }
      });
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  }
};

const addSheet = (workbook, { name, columns, rows }) => {
  const sheet = workbook.addWorksheet(String(name || 'Sheet').slice(0, 31));
  sheet.columns = (columns || []).map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 18,
  }));
  for (const row of rows || []) {
    sheet.addRow(row);
  }
  styleDataSheet(sheet, (rows || []).length);
  return sheet;
};

/**
 * Stream an .xlsx file to the response.
 */
const sendExcel = async (res, { filename, sheetName, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SM Global Solution Hub';
  workbook.created = new Date();

  addSheet(workbook, { name: sheetName || 'Sheet1', columns, rows });
  await writeWorkbook(res, workbook, filename);
};

/**
 * Multi-sheet workbook (styled tables).
 * sheets: [{ name, columns, rows }]
 */
const sendMultiSheetExcel = async (res, { filename, sheets = [] }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SM Global Solution Hub';
  workbook.created = new Date();

  for (const sheet of sheets) {
    addSheet(workbook, sheet);
  }

  if (!sheets.length) {
    addSheet(workbook, {
      name: 'Empty',
      columns: [{ header: 'Info', key: 'info', width: 40 }],
      rows: [{ info: 'No data' }],
    });
  }

  await writeWorkbook(res, workbook, filename);
};

const writeWorkbook = async (res, workbook, filename) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${String(filename || 'export.xlsx').replace(/"/g, '')}"`
  );
  await workbook.xlsx.write(res);
  res.end();
};

const setCell = (sheet, ref, value, style = {}) => {
  const cell = sheet.getCell(ref);
  cell.value = value;
  if (style.font) cell.font = style.font;
  if (style.fill) cell.fill = style.fill;
  if (style.alignment) cell.alignment = style.alignment;
  if (style.border) cell.border = style.border;
  if (style.numFmt) cell.numFmt = style.numFmt;
  return cell;
};

const mergeFill = (sheet, range, fillArgb) => {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(':')[0]);
  cell.fill = fillSolid(fillArgb);
  return cell;
};

/**
 * Build professional Master Reports dashboard workbook.
 *
 * @param {object} payload
 * @param {object} payload.applied - active filters
 * @param {object} payload.summary - { totalProjects, totalViews, totalLeads, wonDeals, conversionRate }
 * @param {Array<{key,count}>} payload.byStatus / byOwner / byCategory / reqStatus / custStatus
 * @param {Array} payload.monthlyTrend - [{ label, projects, requirements, customizations }]
 * @param {Array<{name,columns,rows}>} payload.detailSheets
 */
const buildMasterDashboardWorkbook = async (payload = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SM Global Solution Hub';
  workbook.created = new Date();
  workbook.description = 'Master analytics dashboard export';

  const {
    applied = {},
    summary = {},
    byStatus = [],
    byOwner = [],
    byCategory = [],
    reqStatus = [],
    custStatus = [],
    monthlyTrend = [],
    detailSheets = [],
    categoryName = '',
  } = payload;

  const dash = workbook.addWorksheet('Dashboard', {
    properties: { tabColor: { argb: ACCENT } },
    views: [{ showGridLines: false }],
  });

  // Column widths for dashboard canvas
  const widths = [3, 18, 14, 14, 14, 14, 14, 3, 18, 14, 3, 18, 14, 3, 20, 14, 3];
  widths.forEach((w, i) => {
    dash.getColumn(i + 1).width = w;
  });

  // —— Banner ——
  mergeFill(dash, 'B2:P3', BRAND);
  setCell(dash, 'B2', 'SM GLOBAL · MASTER ANALYTICS DASHBOARD', {
    font: { bold: true, size: 18, color: { argb: WHITE }, name: 'Calibri' },
    alignment: { vertical: 'middle', horizontal: 'left' },
  });
  dash.getRow(2).height = 28;
  dash.getRow(3).height = 18;
  setCell(dash, 'B3', `Generated ${new Date().toLocaleString('en-IN')}  ·  Confidential ops report`, {
    font: { size: 10, color: { argb: 'FF5EEAD4' } },
    alignment: { vertical: 'top' },
  });

  // —— Active filters strip ——
  mergeFill(dash, 'B5:P5', MIST);
  const filterBits = [
    `From: ${applied.dateFrom || 'All'}`,
    `To: ${applied.dateTo || 'All'}`,
    `Owner: ${applied.ownerType || 'All'}`,
    `Status: ${applied.projectStatus || 'All'}`,
    `Category: ${categoryName || applied.category || 'All'}`,
    `Industry: ${applied.industry || 'All'}`,
    `Lead: ${applied.leadStatus || 'All'}`,
  ].join('   |   ');
  setCell(dash, 'B5', `ACTIVE SLICERS   ·   ${filterBits}`, {
    font: { bold: true, size: 9, color: { argb: BRAND } },
    alignment: { vertical: 'middle' },
  });
  dash.getRow(5).height = 22;

  // —— KPI cards (row 7-9) ——
  const kpis = [
    { label: 'PROJECTS', value: summary.totalProjects ?? 0, col: 2 },
    { label: 'VIEWS', value: summary.totalViews ?? 0, col: 4 },
    { label: 'LEADS', value: summary.totalLeads ?? 0, col: 6 },
    { label: 'WON DEALS', value: summary.wonDeals ?? 0, col: 9 },
    { label: 'CONVERSION', value: `${summary.conversionRate ?? 0}%`, col: 12 },
  ];

  kpis.forEach((kpi) => {
    const c1 = kpi.col;
    const c2 = kpi.col + 1;
    dash.mergeCells(7, c1, 7, c2);
    dash.mergeCells(8, c1, 9, c2);

    const labelCell = dash.getCell(7, c1);
    labelCell.value = kpi.label;
    labelCell.font = { bold: true, size: 9, color: { argb: 'FF5EEAD4' } };
    labelCell.fill = fillSolid(KPI_BG);
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dash.getCell(7, c2).fill = fillSolid(KPI_BG);

    const valueCell = dash.getCell(8, c1);
    valueCell.value = kpi.value;
    valueCell.font = { bold: true, size: 22, color: { argb: WHITE } };
    valueCell.fill = fillSolid(KPI_BG);
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dash.getCell(8, c2).fill = fillSolid(KPI_BG);
    dash.getCell(9, c1).fill = fillSolid(KPI_BG);
    dash.getCell(9, c2).fill = fillSolid(KPI_BG);

    [7, 8, 9].forEach((r) => {
      [c1, c2].forEach((c) => {
        dash.getCell(r, c).border = {
          top: { style: 'medium', color: { argb: ACCENT } },
          left: { style: 'medium', color: { argb: ACCENT } },
          bottom: { style: 'medium', color: { argb: ACCENT } },
          right: { style: 'medium', color: { argb: ACCENT } },
        };
      });
    });
  });
  dash.getRow(7).height = 18;
  dash.getRow(8).height = 28;
  dash.getRow(9).height = 16;

  // —— Charts (embedded PNG — fixed pixel size, no stretch distortion) ——
  mergeFill(dash, 'B11:P11', BRAND);
  setCell(dash, 'B11', 'VISUAL ANALYTICS', {
    font: { bold: true, size: 12, color: { argb: 'FF5EEAD4' } },
    alignment: { vertical: 'middle' },
  });
  dash.getRow(11).height = 24;

  const [ownerImg, statusImg, categoryImg, reqImg, custImg, trendImg] = await Promise.all([
    Promise.resolve(renderDonutChart('Owner mix', byOwner, 420)),
    Promise.resolve(renderDonutChart('Projects by status', byStatus, 420)),
    Promise.resolve(renderBarChart('Projects by category', byCategory, { width: 420 })),
    Promise.resolve(renderBarChart('Requirement funnel', reqStatus, { width: 520 })),
    Promise.resolve(renderBarChart('Customization funnel', custStatus, { width: 520 })),
    Promise.resolve(
      renderTrendChart('Monthly activity (grouped)', monthlyTrend, { width: 980, height: 360 })
    ),
  ]);

  const addPng = (img, col, row) => {
    if (!img?.buffer) return;
    const id = workbook.addImage({ buffer: img.buffer, extension: 'png' });
    // Use native pixel size so Excel does not stretch/squash the chart
    dash.addImage(id, {
      tl: { col, row },
      ext: { width: img.width, height: img.height },
      editAs: 'oneCell',
    });
  };

  // ExcelJS row/col are 0-based; leave breathing room between charts
  addPng(ownerImg, 1.1, 11.6);
  addPng(statusImg, 6.4, 11.6);
  addPng(categoryImg, 11.7, 11.6);

  // Reserve vertical space for top chart row (~420px ≈ 28 rows @15px)
  for (let r = 12; r <= 38; r += 1) dash.getRow(r).height = 15;

  addPng(reqImg, 1.1, 38.4);
  addPng(custImg, 9.0, 38.4);
  for (let r = 39; r <= 58; r += 1) dash.getRow(r).height = 15;

  addPng(trendImg, 1.1, 58.6);
  for (let r = 59; r <= 82; r += 1) dash.getRow(r).height = 15;

  // Footer only — raw tables live on dedicated sheets (no duplicate on Dashboard)
  const tipRow = 84;
  mergeFill(dash, `B${tipRow}:P${tipRow}`, MIST);
  setCell(
    dash,
    `B${tipRow}`,
    'Detail numbers → sheet tabs: Projects by Owner / Status / Category · Requirements Status · Customizations Status · Projects · Requirements · Customizations · Quotations · Invoices · Transactions · Contacts',
    {
      font: { size: 9, color: { argb: MUTED }, italic: true },
      alignment: { vertical: 'middle', wrapText: true },
    }
  );
  dash.getRow(tipRow).height = 32;

  for (const sheetDef of detailSheets) {
    addSheet(workbook, sheetDef);
  }

  workbook.views = [{ activeTab: 0, firstSheet: 0 }];
  return workbook;
};

/**
 * Stream master dashboard workbook.
 */
const sendMasterDashboardExcel = async (res, { filename, ...payload }) => {
  const workbook = await buildMasterDashboardWorkbook(payload);
  await writeWorkbook(res, workbook, filename || `master-reports-${Date.now()}.xlsx`);
};

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  sendExcel,
  sendMultiSheetExcel,
  sendMasterDashboardExcel,
  buildMasterDashboardWorkbook,
  escapeRegex,
};
