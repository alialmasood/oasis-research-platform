import XLSX from "xlsx-js-style";
import { formatDate, formatNumber } from "@/lib/utils";
import type { AdminResearcherGapTable } from "./researchTypes";

const FILE_SLUGS: Record<AdminResearcherGapTable["id"], string> = {
  no_research: "no-research",
  no_scopus: "no-scopus",
  no_academic_activity: "no-academic-activity",
};

const HEADERS = ["#", "اسم التدريسي", "التشكيل", "اللقب العلمي", "أعلى شهادة"] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

function buildRows(table: AdminResearcherGapTable) {
  return table.members.map((member, index) => [
    index + 1,
    member.displayName,
    cell(member.entity),
    cell(member.academicTitle),
    cell(member.highestDegree),
  ]);
}

function buildMetaLine(table: AdminResearcherGapTable, totalResearchers: number, academicYearLabel: string) {
  const reportDate = formatDate(new Date(), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `تاريخ التقرير: ${reportDate} · العام الدراسي: ${academicYearLabel} · ${formatNumber(table.count)} من ${formatNumber(totalResearchers)} تدريسي`;
}

const thinBorder = {
  top: { style: "thin", color: { rgb: "CBD5E1" } },
  bottom: { style: "thin", color: { rgb: "CBD5E1" } },
  left: { style: "thin", color: { rgb: "CBD5E1" } },
  right: { style: "thin", color: { rgb: "CBD5E1" } },
};

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "1E3A8A" } },
  alignment: { horizontal: "right", vertical: "center", readingOrder: 2 },
  border: thinBorder,
};

const titleStyle = {
  font: { bold: true, color: { rgb: "1E3A8A" }, name: "Arial", sz: 14 },
  alignment: { horizontal: "center", vertical: "center", readingOrder: 2 },
};

const subtitleStyle = {
  font: { bold: true, color: { rgb: "334155" }, name: "Arial", sz: 12 },
  alignment: { horizontal: "center", vertical: "center", readingOrder: 2 },
};

const metaStyle = {
  font: { color: { rgb: "64748B" }, name: "Arial", sz: 10 },
  alignment: { horizontal: "center", vertical: "center", readingOrder: 2 },
};

function dataStyle(rowIndex: number) {
  return {
    font: { name: "Arial", sz: 10, color: { rgb: "334155" } },
    fill: {
      patternType: "solid",
      fgColor: { rgb: rowIndex % 2 === 0 ? "FFFFFF" : "F8FAFC" },
    },
    alignment: { horizontal: "right", vertical: "center", readingOrder: 2 },
    border: thinBorder,
  };
}

export function exportResearcherGapTableExcel(
  table: AdminResearcherGapTable,
  totalResearchers: number,
  academicYearLabel: string
) {
  const rows = buildRows(table);
  const metaLine = buildMetaLine(table, totalResearchers, academicYearLabel);
  const sheetData = [
    [{ v: "جامعة البصرة — واحة الباحث", t: "s", s: titleStyle }],
    [{ v: `${table.title} · ${table.description}`, t: "s", s: subtitleStyle }],
    [{ v: metaLine, t: "s", s: metaStyle }],
    [{ v: "", t: "s" }],
    HEADERS.map((h) => ({ v: h, t: "s", s: headerStyle })),
    ...rows.map((row, rowIndex) =>
      row.map((value, colIndex) => ({
        v: value,
        t: typeof value === "number" ? "n" : "s",
        s: {
          ...dataStyle(rowIndex),
          alignment: {
            horizontal: colIndex === 0 ? "center" : "right",
            vertical: "center",
            readingOrder: 2,
          },
        },
      }))
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
  ];
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];
  worksheet["!rows"] = [{ hpt: 28 }, { hpt: 24 }, { hpt: 20 }, { hpt: 8 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
  XLSX.writeFile(workbook, `uob-indicators-${FILE_SLUGS[table.id]}.xlsx`);
}

export function exportResearcherGapTablePdf(
  table: AdminResearcherGapTable,
  totalResearchers: number,
  academicYearLabel: string
) {
  const rows = buildRows(table);
  const metaLine = buildMetaLine(table, totalResearchers, academicYearLabel);

  const rowsHtml = rows
    .map(
      (row, index) => `
        <tr>
          <td class="num">${formatNumber(row[0] as number)}</td>
          <td>${escapeHtml(String(row[1]))}</td>
          <td>${escapeHtml(String(row[2]))}</td>
          <td>${escapeHtml(String(row[3]))}</td>
          <td class="center">${escapeHtml(String(row[4]))}</td>
        </tr>
      `
    )
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(table.title)}</title>
    <style>
      @page { size: A4 portrait; margin: 14mm 12mm; }
      * { box-sizing: border-box; }
      body {
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        direction: rtl;
        color: #1e293b;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .report {
        width: 100%;
        max-width: 186mm;
        margin: 0 auto;
      }
      .brand {
        text-align: center;
        border-bottom: 3px solid #1e3a8a;
        padding-bottom: 10px;
        margin-bottom: 14px;
      }
      .brand h1 {
        margin: 0;
        font-size: 20px;
        color: #1e3a8a;
        font-weight: 700;
      }
      .brand p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #64748b;
      }
      .report-title {
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;
        line-height: 1.5;
      }
      .report-title span {
        font-weight: 400;
        color: #475569;
        font-size: 13px;
      }
      .report-meta {
        text-align: center;
        font-size: 11px;
        color: #64748b;
        margin: 0 0 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 7px 8px;
        text-align: right;
        vertical-align: middle;
      }
      th {
        background: #1e3a8a;
        color: #ffffff;
        font-weight: 600;
      }
      tbody tr:nth-child(even) td { background: #f8fafc; }
      td.num, td.center { text-align: center; }
      .footer {
        margin-top: 14px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        font-size: 10px;
        color: #94a3b8;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="report">
      <div class="brand">
        <h1>جامعة البصرة</h1>
        <p>منصة واحة الباحث — لوحة الإدارة</p>
      </div>
      <h2 class="report-title">${escapeHtml(table.title)} <span>· ${escapeHtml(table.description)}</span></h2>
      <p class="report-meta">${escapeHtml(metaLine)}</p>
      <table>
        <thead>
          <tr>
            ${HEADERS.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="footer">جامعة البصرة · ${escapeHtml(formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" }))}</div>
    </div>
  </body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}
