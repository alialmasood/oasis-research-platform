"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResearchHeader } from "./ResearchHeader";
import { ResearchFormDialog } from "./ResearchFormDialog";
import { ResearchTable } from "./ResearchTable";
import { ResearchDetailsModal } from "./ResearchDetailsModal";
import { EmptyState } from "./EmptyState";
import { ResearchKPICards } from "./ResearchKPICards";
import type { ResearchStats } from "@/lib/research/researchStats";
import { ResearchChartsSection } from "./ResearchChartsSection";
import { Toast } from "@/components/ui/toast";
import { createResearch, updateResearch, deleteResearch, listResearch, listResearchAll, getResearchStatsAction } from "../actions";
import type { Research } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import { RESEARCH_CATEGORY_LABELS, RESEARCH_STATUS_LABELS } from "@/lib/research/categoryLabels";
import * as XLSX from "xlsx";

interface ResearchClientProps {
  initialData: {
    items: Research[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  initialStats: ResearchStats | null;
}

export function ResearchClient({ initialData, initialStats }: ResearchClientProps) {
  const [research, setResearch] = useState(initialData.items);
  const [stats, setStats] = useState<ResearchStats | null>(initialStats);
  const [total, setTotal] = useState(initialData.total);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<Research | null>(null);
  const [viewingResearch, setViewingResearch] = useState<Research | null>(null);
  const [filters, setFilters] = useState<{
    search?: string;
    status?: string;
    publishStatus?: string;
    researchType?: string;
    year?: string;
    category?: string;
    publishType?: string;
    scopusQuartile?: string;
  }>({});
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const statusLabels = RESEARCH_STATUS_LABELS;
  const publishStatusLabels: Record<string, string> = {
    DRAFT: "غير منشور",
    PUBLISHED: "منشور",
  };
  const researchTypeLabels: Record<string, string> = {
    PLANNED: "مخطط",
    UNPLANNED: "غير مخطط",
  };
  const publishTypeLabels: Record<string, string> = {
    JOURNAL: "مجلة",
    CONFERENCE: "مؤتمر",
    BOOK_CHAPTER: "فصل كتاب",
    REPORT: "تقرير",
    OTHER: "أخرى",
  };
  const monthNames = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString("ar-IQ");
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listResearchAll(filters as any);
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((r) => ({
      العنوان: r.title ?? "",
      "نوع البحث": researchTypeLabels[r.researchType] ?? r.researchType,
      الحالة: statusLabels[r.status] ?? r.status,
      "حالة النشر": r.publishStatus ? (publishStatusLabels[r.publishStatus] ?? r.publishStatus) : "—",
      السنة: r.year ?? "—",
      "شهر النشر": r.publishMonth ? monthNames[r.publishMonth] : "—",
      "نوع النشر": r.publishType ? (publishTypeLabels[r.publishType] ?? r.publishType) : "—",
      الناشر: r.publisher ?? "—",
      الملكية: r.ownership ?? "—",
      التصنيفات: (r.categories ?? []).map((c) => RESEARCH_CATEGORY_LABELS[c] ?? c).join(" | ") || "—",
      "تصنيف سكوبس": r.scopusQuartile ?? "—",
      DOI: r.doi ?? "—",
      "رابط البحث": r.researchUrl ?? "—",
      "رابط التحميل": r.downloadUrl ?? "—",
      "تاريخ الإنشاء": formatDate(r.createdAt),
      "آخر تحديث": formatDate(r.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الأبحاث");
    XLSX.writeFile(workbook, "research-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listResearchAll(filters as any);
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (r) => `
        <tr>
          <td>${r.title ?? "-"}</td>
          <td>${researchTypeLabels[r.researchType] ?? r.researchType}</td>
          <td>${statusLabels[r.status] ?? r.status}</td>
          <td>${r.publishStatus ? (publishStatusLabels[r.publishStatus] ?? r.publishStatus) : "—"}</td>
          <td>${r.year ?? "—"}</td>
          <td>${r.publishMonth ? monthNames[r.publishMonth] : "—"}</td>
          <td>${r.publishType ? (publishTypeLabels[r.publishType] ?? r.publishType) : "—"}</td>
          <td>${r.publisher ?? "—"}</td>
          <td>${r.ownership ?? "—"}</td>
          <td>${(r.categories ?? []).map((c) => RESEARCH_CATEGORY_LABELS[c] ?? c).join(" | ") || "—"}</td>
          <td>${r.scopusQuartile ?? "—"}</td>
          <td>${r.doi ?? "—"}</td>
          <td>${r.researchUrl ?? "—"}</td>
          <td>${r.downloadUrl ?? "—"}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td>${formatDate(r.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير الأبحاث</title>
          <style>
            body { font-family: "Cairo", Arial, sans-serif; padding: 20px; direction: rtl; }
            h1 { text-align: center; color: #1f2937; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; vertical-align: top; }
            th { background: #f8fafc; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>تقرير الأبحاث</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>نوع البحث</th>
                <th>الحالة</th>
                <th>حالة النشر</th>
                <th>السنة</th>
                <th>شهر النشر</th>
                <th>نوع النشر</th>
                <th>الناشر</th>
                <th>الملكية</th>
                <th>التصنيفات</th>
                <th>تصنيف سكوبس</th>
                <th>DOI</th>
                <th>رابط البحث</th>
                <th>رابط التحميل</th>
                <th>تاريخ الإنشاء</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const showToast = (message?: string, type: "success" | "error" = "success") => {
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });
  };

  const loadResearch = async (page: number = currentPage, newFilters?: typeof filters) => {
    const activeFilters = newFilters ?? filters;
    const result = await listResearch(
      {
        status: activeFilters.status as any,
        publishStatus: activeFilters.publishStatus as any,
        researchType: activeFilters.researchType,
        year: activeFilters.year ? parseInt(activeFilters.year) : undefined,
        category: activeFilters.category,
        publishType: activeFilters.publishType,
        scopusQuartile: activeFilters.scopusQuartile,
        search: activeFilters.search,
      },
      page,
      10
    );
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }
    setResearch(result.items);
    setTotal(result.total);
    setCurrentPage(result.page);
    setTotalPages(result.totalPages);
  };

  const handleOpenDialog = (research?: Research) => {
    setEditingResearch(research || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResearch(null);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    startTransition(async () => {
      const result = editingResearch
        ? await updateResearch(data)
        : await createResearch(data);

      if (result.error) {
        showToast(result.error, "error");
        return;
      }

      showToast(editingResearch ? "تم تحديث البحث بنجاح" : "تم إضافة البحث بنجاح");
      handleCloseDialog();
      await loadResearch(1);
      const newStats = await getResearchStatsAction();
      if (!("error" in newStats)) setStats(newStats);
      notifyDashboardUpdate("research");
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البحث؟")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteResearch(id);

      if (result.error) {
        showToast(result.error, "error");
        return;
      }

      showToast("تم حذف البحث بنجاح");
      await loadResearch(currentPage);
      const newStats = await getResearchStatsAction();
      if (!("error" in newStats)) setStats(newStats);
      notifyDashboardUpdate("research");
    });
  };

  const handleDeleteFromDetails = async (id: string) => {
    startTransition(async () => {
      const result = await deleteResearch(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("تم حذف البحث بنجاح");
      setIsDetailsOpen(false);
      setViewingResearch(null);
      await loadResearch(currentPage);
      const newStats = await getResearchStatsAction();
      if (!("error" in newStats)) setStats(newStats);
      notifyDashboardUpdate("research");
    });
  };

  const handleView = (r: Research) => {
    setViewingResearch(r);
    setIsDetailsOpen(true);
  };

  const handleFilterChange = async (newFilters: typeof filters) => {
    setFilters(newFilters);
    await loadResearch(1, newFilters);
  };

  const handlePageChange = async (page: number) => {
    await loadResearch(page);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ResearchHeader onAddClick={() => handleOpenDialog()} />

      {stats && (
        <>
          <ResearchKPICards stats={stats} />
          <ResearchChartsSection stats={stats} />
        </>
      )}

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-base font-semibold text-slate-800">جدول الأبحاث</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                تصدير Excel
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                تصدير PDF
              </Button>
            </div>
          </div>
          {research.length === 0 ? (
            <EmptyState />
          ) : (
            <ResearchTable
              research={research}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onView={handleView}
              isPending={isPending}
              onFilterChange={handleFilterChange}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              availableYears={
                stats?.byYear.map(({ year }) => year) ??
                Array.from(new Set(research.map((r) => r.year))).sort((a, b) => b - a)
              }
              availableStatuses={
                stats
                  ? [
                      ...(stats.byStatus.inProgress > 0 ? (["IN_PROGRESS"] as const) : []),
                      ...(stats.byStatus.completed > 0 ? (["COMPLETED"] as const) : []),
                    ]
                  : []
              }
              availablePublishStatuses={
                stats
                  ? [
                      ...(stats.byPublishStatus.published > 0 ? (["PUBLISHED"] as const) : []),
                      ...(stats.byPublishStatus.unpublished > 0 ? (["DRAFT"] as const) : []),
                    ]
                  : []
              }
              availableResearchTypes={
                stats
                  ? [
                      ...(stats.byResearchType.planned > 0 ? (["PLANNED"] as const) : []),
                      ...(stats.byResearchType.unplanned > 0 ? (["UNPLANNED"] as const) : []),
                    ]
                  : []
              }
              availablePublishTypes={
                stats
                  ? ([
                      "journal",
                      "conference",
                      "bookChapter",
                      "report",
                      "other",
                    ] as const)
                      .filter((k) => (stats!.byPublishType[k] ?? 0) > 0)
                      .map((k) =>
                        k === "bookChapter" ? "BOOK_CHAPTER" : k.toUpperCase()
                      )
                  : []
              }
              availableCategories={stats?.availableCategories ?? []}
              availableScopusQuartiles={
                stats
                  ? (["Q1", "Q2", "Q3", "Q4"] as const).filter(
                      (q) => (stats!.scopusQuartiles[q] ?? 0) > 0
                    )
                  : []
              }
            />
          )}
        </CardContent>
      </Card>

      <ResearchFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingResearch={editingResearch}
        isPending={isPending}
      />

      <ResearchDetailsModal
        research={viewingResearch}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setViewingResearch(null);
        }}
        onEdit={(r) => {
          setIsDetailsOpen(false);
          setViewingResearch(null);
          handleOpenDialog(r);
        }}
        onDelete={(id) => {
          if (confirm("هل أنت متأكد من حذف هذا البحث؟")) {
            handleDeleteFromDetails(id);
          }
        }}
        onCopySuccess={() => showToast("تم النسخ")}
      />
    </div>
  );
}
