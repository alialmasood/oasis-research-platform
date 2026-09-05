"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { exportAdminResearchAction } from "../actions";
import type { AdminResearchListFilters } from "@/lib/admin/researchTypes";
import { formatDate } from "@/lib/utils";

interface ResearchExportBarProps {
  filters: AdminResearchListFilters;
  totalCount: number;
}

export function ResearchExportBar({ filters, totalCount }: ResearchExportBarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const fetchExportItems = async () => {
    const result = await exportAdminResearchAction(filters);
    if ("error" in result) {
      alert(result.error);
      return null;
    }
    return result.items;
  };

  const handleExportExcel = async () => {
    if (isExporting || totalCount === 0) return;
    setIsExporting(true);
    const items = await fetchExportItems();
    setIsExporting(false);
    if (!items?.length) return;

    const rows = items.map((r) => ({
      الباحث: r.researcher.displayName,
      التشكيل: r.researcher.entity ?? "—",
      القسم: r.researcher.department ?? "—",
      العنوان: r.title,
      "نوع البحث": r.researchTypeLabel,
      الحالة: r.statusLabel,
      "نسبة التقدّم": r.status === "COMPLETED" ? 100 : (r.progressPercent ?? 0),
      "حالة النشر": r.publishStatusLabel ?? "—",
      السنة: r.year,
      "شهر النشر": r.publishMonthLabel ?? "—",
      "نوع النشر": r.publishTypeLabel ?? "—",
      الناشر: r.publisher ?? "—",
      الملكية: r.ownershipLabel,
      التصنيفات: r.categoriesLabel,
      "تصنيف سكوبس": r.scopusQuartile ?? "—",
      DOI: r.doi ?? "—",
      "رابط البحث": r.researchUrl ?? "—",
      "تاريخ الإدخال": formatDate(r.createdAt, { year: "numeric", month: "short", day: "numeric" }),
      "آخر تحديث": formatDate(r.updatedAt, { year: "numeric", month: "short", day: "numeric" }),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "البحوث");
    XLSX.writeFile(workbook, "uob-research-export.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting || totalCount === 0) return;
    setIsExporting(true);
    const items = await fetchExportItems();
    setIsExporting(false);
    if (!items?.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = items
      .map(
        (r) => `
        <tr>
          <td>${r.researcher.displayName}</td>
          <td>${r.researcher.entity ?? "—"}</td>
          <td>${r.title}</td>
          <td>${r.researchTypeLabel}</td>
          <td>${r.statusLabel}</td>
          <td>${r.status === "COMPLETED" ? 100 : (r.progressPercent ?? 0)}%</td>
          <td>${r.publishStatusLabel ?? "—"}</td>
          <td>${r.year}</td>
          <td>${r.publishTypeLabel ?? "—"}</td>
          <td>${r.categoriesLabel}</td>
          <td>${r.scopusQuartile ?? "—"}</td>
          <td>${r.doi ?? "—"}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير البحوث — جامعة البصرة</title>
          <style>
            body { font-family: "Cairo", Arial, sans-serif; padding: 20px; direction: rtl; }
            h1 { text-align: center; color: #1e3a8a; margin-bottom: 8px; font-size: 20px; }
            p.sub { text-align: center; color: #64748b; margin-bottom: 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px; text-align: right; vertical-align: top; }
            th { background: #1e3a8a; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>تقرير البحوث — لوحة الإدارة</h1>
          <p class="sub">جامعة البصرة · واحة الباحث · ${items.length} بحث</p>
          <table>
            <thead>
              <tr>
                <th>الباحث</th>
                <th>التشكيل</th>
                <th>العنوان</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>التقدّم</th>
                <th>النشر</th>
                <th>السنة</th>
                <th>نوع النشر</th>
                <th>التصنيف</th>
                <th>سكوبس</th>
                <th>DOI</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 text-xs border-slate-200"
        onClick={handleExportExcel}
        disabled={isExporting || totalCount === 0}
      >
        <FileSpreadsheet className="h-3.5 w-3.5 ml-1.5" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 text-xs border-slate-200"
        onClick={handleExportPDF}
        disabled={isExporting || totalCount === 0}
      >
        <FileText className="h-3.5 w-3.5 ml-1.5" />
        PDF
      </Button>
    </div>
  );
}
