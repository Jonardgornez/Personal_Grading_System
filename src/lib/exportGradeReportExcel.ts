import type { GradeReportData } from "@/types/grades";
import type ExcelJSType from "exceljs";

// Tailwind-equivalent ARGB colors (FF prefix = fully opaque)
const C = {
  white:     "FFFFFFFF",
  black:     "FF111827",
  gray50:    "FFF9FAFB",
  gray100:   "FFF3F4F6",
  gray500:   "FF6B7280",
  gray600:   "FF4B5563",
  gray700:   "FF374151",
  slate100:  "FFF1F5F9",
  slate500:  "FF64748B",
  blue50:    "FFEFF6FF",
  blue100:   "FFDBEAFE",
  blue700:   "FF1D4ED8",
  blue800:   "FF1E40AF",
  green50:   "FFF0FDF4",
  green100:  "FFDCFCE7",
  green600:  "FF16A34A",
  green700:  "FF15803D",
  green800:  "FF166534",
  red500:    "FFEF4444",
  red600:    "FFDC2626",
  purple50:  "FFFAF5FF",
  purple100: "FFF3E8FF",
  purple700: "FF7E22CE",
  purple800: "FF6B21A8",
  yellow50:  "FFFEFCE8",
  yellow100: "FFFEF9C3",
  yellow700: "FFA16207",
  yellow800: "FF854D0E",
  orange50:  "FFFFF7ED",
  orange100: "FFFFEDD5",
  orange700: "FFC2410C",
  orange800: "FF9A3412",
  emerald50: "FFECFDF5",
  emerald100:"FFD1FAE5",
  emerald200:"FFA7F3D0",
  emerald700:"FF047857",
  emerald900:"FF064E3B",
};

type ECell = ExcelJSType.Cell;

interface StyleOpts {
  bg?: string;
  fg?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number;
  hAlign?: ExcelJSType.Alignment["horizontal"];
}

function applyStyle(cell: ECell, opts: StyleOpts = {}) {
  if (opts.bg) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.bg } };
  }
  cell.font = {
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: { argb: opts.fg ?? C.black },
    size: opts.size ?? 9,
    name: "Calibri",
  };
  cell.alignment = {
    horizontal: opts.hAlign ?? "center",
    vertical: "middle",
    wrapText: false,
  };
  cell.border = {
    top:    { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    left:   { style: "thin", color: { argb: "FFD1D5DB" } },
    right:  { style: "thin", color: { argb: "FFD1D5DB" } },
  };
}

export async function exportGradeReportExcel(data: GradeReportData) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Grade Report");

  const {
    weights, attendanceMonthCols, attendanceSessionsPerMonth,
    activityCols, performanceCols, rows,
  } = data;

  const subtitle = [data.subjectSection, data.semester, data.schoolYear]
    .filter(Boolean).join(" · ");

  // ── Column layout (1-based) ──────────────────────────────────────────────
  let c = 1;
  const studentStart = c; c += 3; // No, ID, Name

  const attStart = c;
  const attMonthCount = weights.attendance > 0 ? attendanceMonthCols.length : 0;
  const attSpan = weights.attendance > 0 ? attMonthCount + 4 : 0;
  c += attSpan;

  const actStart = c;
  const actSpan = weights.activities > 0 ? activityCols.length + 2 : 0;
  c += actSpan;

  const perfStart = c;
  const perfSpan = weights.participation > 0 ? performanceCols.length + 2 : 0;
  c += perfSpan;

  const midStart = c;
  const midSpan = weights.midterm > 0 ? 2 : 0;
  c += midSpan;

  const finStart = c;
  const finSpan = weights.final > 0 ? 2 : 0;
  c += finSpan;

  const sumStart = c;
  const totalCols = c + 1; // sumStart + Status column

  // ── Column widths ────────────────────────────────────────────────────────
  for (let i = 1; i <= totalCols; i++) ws.getColumn(i).width = 11;
  ws.getColumn(2).width = 16;   // ID
  ws.getColumn(3).width = 26;   // Name
  ws.getColumn(sumStart).width = 14;
  ws.getColumn(sumStart + 1).width = 10;

  // ── Row 1: Title ─────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `Grade Report — ${data.subjectCode} ${data.subjectTitle}`;
  titleCell.font = { bold: true, size: 14, color: { argb: C.black }, name: "Calibri" };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.white } };
  ws.getRow(1).height = 26;

  // ── Row 2: Subtitle ──────────────────────────────────────────────────────
  ws.mergeCells(2, 1, 2, totalCols);
  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle || "";
  subCell.font = { italic: true, size: 10, color: { argb: C.gray500 }, name: "Calibri" };
  subCell.alignment = { horizontal: "left", vertical: "middle" };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.white } };
  ws.getRow(2).height = 18;

  // ── Row 3: Group headers ─────────────────────────────────────────────────
  ws.getRow(3).height = 20;

  ws.mergeCells(3, studentStart, 3, studentStart + 2);
  const siCell = ws.getCell(3, studentStart);
  siCell.value = "Student Info";
  applyStyle(siCell, { bg: C.gray100, fg: C.gray700, bold: true });

  if (weights.attendance > 0) {
    if (attSpan > 1) ws.mergeCells(3, attStart, 3, attStart + attSpan - 1);
    const cell = ws.getCell(3, attStart);
    cell.value = `Attendance ${weights.attendance}%`;
    applyStyle(cell, { bg: C.blue50, fg: C.blue800, bold: true });
  }
  if (weights.activities > 0) {
    if (actSpan > 1) ws.mergeCells(3, actStart, 3, actStart + actSpan - 1);
    const cell = ws.getCell(3, actStart);
    cell.value = `Activities ${weights.activities}%`;
    applyStyle(cell, { bg: C.green50, fg: C.green800, bold: true });
  }
  if (weights.participation > 0) {
    if (perfSpan > 1) ws.mergeCells(3, perfStart, 3, perfStart + perfSpan - 1);
    const cell = ws.getCell(3, perfStart);
    cell.value = `Performance ${weights.participation}%`;
    applyStyle(cell, { bg: C.purple50, fg: C.purple800, bold: true });
  }
  if (weights.midterm > 0) {
    ws.mergeCells(3, midStart, 3, midStart + 1);
    const cell = ws.getCell(3, midStart);
    cell.value = `Midterm ${weights.midterm}%`;
    applyStyle(cell, { bg: C.yellow50, fg: C.yellow800, bold: true });
  }
  if (weights.final > 0) {
    ws.mergeCells(3, finStart, 3, finStart + 1);
    const cell = ws.getCell(3, finStart);
    cell.value = `Final ${weights.final}%`;
    applyStyle(cell, { bg: C.orange50, fg: C.orange800, bold: true });
  }
  ws.mergeCells(3, sumStart, 3, sumStart + 1);
  const sumHeaderCell = ws.getCell(3, sumStart);
  sumHeaderCell.value = "Final Summary";
  applyStyle(sumHeaderCell, { bg: C.emerald100, fg: C.emerald900, bold: true });

  // ── Row 4: Sub-headers ───────────────────────────────────────────────────
  ws.getRow(4).height = 18;

  const h = (col: number, value: string, opts: StyleOpts = {}) => {
    const cell = ws.getCell(4, col);
    cell.value = value;
    applyStyle(cell, { bg: C.gray50, fg: C.gray700, bold: true, ...opts });
  };

  h(1, "No");
  h(2, "ID");
  h(3, "Name", { hAlign: "left" });

  if (weights.attendance > 0) {
    attendanceMonthCols.forEach((col, i) => h(attStart + i, col.label));
    h(attStart + attMonthCount,     "Present", { fg: C.green700 });
    h(attStart + attMonthCount + 1, "Absent",  { fg: C.red500 });
    h(attStart + attMonthCount + 2, "Total",   { bg: C.slate100 });
    h(attStart + attMonthCount + 3, "%",       { bg: C.blue100,   fg: C.blue800 });
  }
  if (weights.activities > 0) {
    activityCols.forEach((col, i) => h(actStart + i, col.title));
    h(actStart + activityCols.length,     "Total", { bg: C.slate100 });
    h(actStart + activityCols.length + 1, "%",     { bg: C.green100, fg: C.green800 });
  }
  if (weights.participation > 0) {
    performanceCols.forEach((col, i) => h(perfStart + i, col.title));
    h(perfStart + performanceCols.length,     "Total", { bg: C.slate100 });
    h(perfStart + performanceCols.length + 1, "%",     { bg: C.purple100, fg: C.purple800 });
  }
  if (weights.midterm > 0) {
    h(midStart,     "Total Score", { bg: C.slate100 });
    h(midStart + 1, "%",          { bg: C.yellow100, fg: C.yellow800 });
  }
  if (weights.final > 0) {
    h(finStart,     "Total Score", { bg: C.slate100 });
    h(finStart + 1, "%",          { bg: C.orange100, fg: C.orange800 });
  }
  h(sumStart,     "Overall Grade", { bg: C.emerald200, fg: C.emerald900 });
  h(sumStart + 1, "Status",        { bg: C.emerald200, fg: C.emerald900 });

  // ── Data rows ────────────────────────────────────────────────────────────
  rows.forEach((row, idx) => {
    const r = 5 + idx;
    ws.getRow(r).height = 16;

    const d = (col: number, value: string | number, opts: StyleOpts = {}) => {
      const cell = ws.getCell(r, col);
      cell.value = value;
      applyStyle(cell, opts);
    };

    d(1, row.rowIndex);
    d(2, row.studentNo, { fg: C.slate500 });
    d(3, row.fullName,  { bold: true, hAlign: "left" });

    if (weights.attendance > 0) {
      attendanceMonthCols.forEach((col, i) =>
        d(attStart + i, `${row.monthCounts[col.key] ?? 0}/${attendanceSessionsPerMonth[col.key] ?? 0}`)
      );
      d(attStart + attMonthCount,     row.attendancePresent, { fg: C.green700 });
      d(attStart + attMonthCount + 1, row.attendanceAbsent,  { fg: C.red500 });
      d(attStart + attMonthCount + 2, row.attendanceTotal,   { bg: C.gray50 });
      d(attStart + attMonthCount + 3, `${row.attendanceWeightedScore.toFixed(2)}%`, { bg: C.blue50, fg: C.blue700, bold: true });
    }
    if (weights.activities > 0) {
      activityCols.forEach((col, i) => {
        const score = row.activityScores[col.id];
        d(actStart + i, score !== null && score !== undefined ? `${score}/${col.totalScore}` : "—");
      });
      d(actStart + activityCols.length,     `${row.activitiesTotalEarned}/${row.activitiesTotalPossible}`, { bg: C.gray50 });
      d(actStart + activityCols.length + 1, `${row.activitiesWeightedScore.toFixed(2)}%`, { bg: C.green50, fg: C.green700, bold: true });
    }
    if (weights.participation > 0) {
      performanceCols.forEach((col, i) => {
        const score = row.performanceScores[col.id];
        d(perfStart + i, score !== null && score !== undefined ? `${score}/${col.totalScore}` : "—");
      });
      d(perfStart + performanceCols.length,     `${row.performanceTotalEarned}/${row.performanceTotalPossible}`, { bg: C.gray50 });
      d(perfStart + performanceCols.length + 1, `${row.performanceWeightedScore.toFixed(2)}%`, { bg: C.purple50, fg: C.purple700, bold: true });
    }
    if (weights.midterm > 0) {
      d(midStart,     `${row.midtermEarned}/${row.midtermPossible}`,      { bg: C.gray50 });
      d(midStart + 1, `${row.midtermWeightedScore.toFixed(2)}%`,          { bg: C.yellow50, fg: C.yellow700, bold: true });
    }
    if (weights.final > 0) {
      d(finStart,     `${row.finalEarned}/${row.finalPossible}`,          { bg: C.gray50 });
      d(finStart + 1, `${row.finalWeightedScore.toFixed(2)}%`,            { bg: C.orange50, fg: C.orange700, bold: true });
    }

    const statusColor = row.status === "PASSED"
      ? { grade: C.emerald700, label: C.green600 }
      : row.status === "INC"
        ? { grade: C.yellow700, label: C.yellow800 }
        : { grade: C.red600, label: C.red600 };
    d(sumStart,     `${row.overallGrade}%`, { bg: C.emerald50, fg: statusColor.grade, bold: true, size: 11 });
    d(sumStart + 1, row.status,             { bg: C.emerald50, fg: statusColor.label, bold: true });
  });

  // ── Download ─────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grade-report.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
