"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toast } from "@/components/ui/toast";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import { Plus, MoreVertical, Eye, Trash2, Calendar, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createReviewing, updateReviewing, deleteReviewing, listReviewings } from "./actions";
import { ReviewingKPICards, useReviewingStats } from "./_components/ReviewingKPICards";
import type { Reviewing } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

/** صيغة تاريخ: 2026 / 01 / 08 */
function formatDate(d: Date) {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y} / ${m} / ${day}`;
}

function getTodayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const typeLabels: Record<string, string> = {
  RESEARCHES: "بحوث",
  SCIENTIFIC_ARTICLES: "مقالات علمية",
  THESES: "رسائل وأطاريح",
  PATENTS: "براءات اختراع",
  SCIENTIFIC_CONSULTATIONS: "استشارات علمية",
};

const statusLabels: Record<string, string> = {
  COMPLETED: "مكتمل",
  IN_PROGRESS: "قيد التنفيذ",
  PLANNED: "مخطط",
};

const typeColors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(reviewings: Reviewing[], stats: ReturnType<typeof useReviewingStats>): string {
  if (reviewings.length === 0) {
    return "لم تُسجّل بعد أي تقويم علمي. ابدأ بإضافة تقويم جديد.";
  }
  if (reviewings.length === 1) {
    return `لديك تقويم علمي واحد.`;
  }
  const { total, completed } = stats;
  return `لديك ${total} تقويم علمي (${completed} مكتمل).`;
}

interface ReviewingPageClientProps {
  initialReviewings: Reviewing[];
}

export function ReviewingPageClient({ initialReviewings }: ReviewingPageClientProps) {
  const [reviewings, setReviewings] = useState<Reviewing[]>(initialReviewings);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingReviewing, setEditingReviewing] = useState<Reviewing | null>(null);
  const [viewingReviewing, setViewingReviewing] = useState<Reviewing | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadReviewings = (overrides?: {
    search?: string;
    type?: string;
    status?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const type = overrides?.type ?? typeFilter;
      const status = overrides?.status ?? statusFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listReviewings({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        type: type === "__all__" ? undefined : type,
        status: status === "__all__" ? undefined : status,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setReviewings(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviewings();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    type: typeFilter === "__all__" ? undefined : typeFilter,
    status: statusFilter === "__all__" ? undefined : statusFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listReviewings(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((r: Reviewing) => ({
      العنوان: r.title ?? "",
      النوع: typeLabels[r.type] ?? r.type,
      التاريخ: formatDateCell(r.date),
      الحالة: statusLabels[r.status] ?? r.status,
      الوصف: r.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(r.createdAt),
      "آخر تحديث": formatDateCell(r.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقويمات العلمية");
    XLSX.writeFile(workbook, "reviewing-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listReviewings(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (r: Reviewing) => `
        <tr>
          <td>${r.title ?? "-"}</td>
          <td>${typeLabels[r.type] ?? r.type}</td>
          <td>${formatDateCell(r.date)}</td>
          <td>${statusLabels[r.status] ?? r.status}</td>
          <td>${r.description ?? "-"}</td>
          <td>${formatDateCell(r.createdAt)}</td>
          <td>${formatDateCell(r.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير التقويمات العلمية</title>
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
          <h1>تقرير التقويمات العلمية</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الوصف</th>
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

  const stats = useReviewingStats(reviewings);
  const filteredForDisplay = reviewings;

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(reviewings.map((r) => new Date(r.date).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    type: "RESEARCHES" as "RESEARCHES" | "SCIENTIFIC_ARTICLES" | "THESES" | "PATENTS" | "SCIENTIFIC_CONSULTATIONS",
    date: getTodayISO(),
    status: "PLANNED" as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date),
        status: formData.status,
        description: formData.description || null,
      };
      const result = editingReviewing
        ? await updateReviewing({ ...payload, id: editingReviewing.id })
        : await createReviewing(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingReviewing ? "✅ تم تحديث التقويم بنجاح" : "✅ تم إضافة التقويم بنجاح");
      setIsAddOpen(false);
      setEditingReviewing(null);
      setFormData({
        title: "",
        type: "RESEARCHES",
        date: getTodayISO(),
        status: "PLANNED",
        description: "",
      });
      loadReviewings();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (reviewing?: Reviewing) => {
    if (reviewing) {
      setEditingReviewing(reviewing);
      setFormData({
        title: reviewing.title,
        type: reviewing.type,
        date: new Date(reviewing.date).toISOString().slice(0, 10),
        status: reviewing.status,
        description: reviewing.description || "",
      });
    } else {
      setEditingReviewing(null);
      setFormData({
        title: "",
        type: "RESEARCHES",
        date: getTodayISO(),
        status: "PLANNED",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingReviewing(null);
    setFormData({
      title: "",
      type: "RESEARCHES",
      date: getTodayISO(),
      status: "PLANNED",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقويم العلمي؟")) return;
    startTransition(async () => {
      const result = await deleteReviewing(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف التقويم العلمي بنجاح");
      setIsDetailsOpen(false);
      setViewingReviewing(null);
      loadReviewings();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Reviewing) => {
    setViewingReviewing(s);
    setIsDetailsOpen(true);
  };

  const shareReviewingViaWhatsApp = (r: Reviewing) => {
    const lines: string[] = [
      `*${r.title}*`,
      `نوع التقويم: ${typeLabels[r.type]}`,
      `تاريخ التقويم: ${formatDate(r.date)}`,
      `الحالة: ${statusLabels[r.status]}`,
    ];
    if (r.description) {
      lines.push(`الوصف: ${r.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const reviewingActionsMenu = (c: Reviewing) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleView(c)}>
          <Eye className="h-4 w-4 ml-2" />
          عرض التفاصيل
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenAdd(c)}>
          <Pencil className="h-4 w-4 ml-2" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm("هل أنت متأكد من حذف هذا التقويم العلمي؟")) {
              startTransition(async () => {
                const res = await deleteReviewing(c.id);
                if (res.error) showToast(res.error, "error");
                else {
                  showToast("✅ تم حذف التقويم العلمي بنجاح");
                  loadReviewings();
                  notifyDashboardUpdate("activities");
                }
              });
            }
          }}
        >
          <Trash2 className="h-4 w-4 ml-2" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد التقويمات": item.value,
  }));

  const byTypeData = stats.byType.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: typeColors[index % typeColors.length],
  }));

  const byStatusData = stats.byStatus.map((item) => ({
    name: item.name,
    "عدد التقويمات": item.value,
  }));

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "__all__" ||
    statusFilter !== "__all__" ||
    yearFilter !== "__all__";

  return (
    <div className="space-y-3 md:space-y-6 min-w-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">التقويم العلمي</h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">سجّل تقويماتك العلمية</p>
          <p
            className="text-[11px] md:text-sm text-slate-500 md:text-slate-600 mt-0.5 md:mt-1.5 md:font-medium line-clamp-2 md:line-clamp-none"
            aria-live="polite"
          >
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          size="sm"
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 md:h-10 shrink-0 px-2.5 md:px-4 text-xs md:text-sm"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
          <span className="md:hidden">إضافة</span>
          <span className="hidden md:inline">إضافة تقويم</span>
        </Button>
      </div>

      <ReviewingKPICards stats={stats} />

      <div>
        <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2.5 md:mb-4">الرسوم البيانية</h3>

        {/* موبايل: تخطيط متناسق */}
        <div className="md:hidden space-y-2">
          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد التقويمات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد التقويمات في ${year}: ${count}`}
                    tickFontSize={10}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl h-[168px]">
              <CardHeader className="px-2 pt-2 pb-0">
                <CardTitle className="text-[11px] font-semibold text-gray-900 leading-tight">
                  أنواع التقويم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {byTypeData.length > 0 ? (
                    <PieChart
                      data={byTypeData}
                      outerRadius={40}
                      innerRadius={14}
                      legendLayout="horizontal"
                      legendVerticalAlign="bottom"
                      legendWrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                      tooltipLabel={(name, value) => `${name}: ${value}`}
                    />
                  ) : (
                    <EmptyChartState type="pie" />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl h-[168px]">
              <CardHeader className="px-2 pt-2 pb-0">
                <CardTitle className="text-[11px] font-semibold text-gray-900 leading-tight">
                  ملخص التقويمات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1 flex items-center justify-center h-[130px]">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums text-gray-900 leading-none">
                    {stats.total}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {stats.completed} مكتمل · {stats.inProgress} قيد التنفيذ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {byStatusData.length > 0 ? (
                  <BarChart
                    data={byStatusData}
                    dataKeys={["عدد التقويمات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد التقويمات ${name}: ${count}`}
                    tickFontSize={10}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* حاسوب: التخطيط السابق */}
        <div className="hidden md:grid grid-cols-12 gap-4">
          {/* الصف الأول: عدد التقويمات حسب السنة (أكبر) + توزيع أنواع التقويم (أصغر) */}
          {/* عدد التقويمات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد التقويمات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد التقويمات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد التقويمات في ${year}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={12}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byYearData.length > 0 && (() => {
                const top = byYearData.reduce(
                  (a, b) => (b["عدد التقويمات"] > a["عدد التقويمات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة تقويمات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد التقويمات"]} تقويم)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* توزيع أنواع التقويم (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع أنواع التقويم</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byTypeData.length > 0 ? (
                  <PieChart
                    data={byTypeData}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    outerRadius={90}
                    innerRadius={30}
                    legendWrapperStyle={{ fontSize: "12px" }}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
              {byTypeData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع أنواع التقويم (بحوث، مقالات علمية، رسائل وأطاريح، براءات اختراع، استشارات علمية)
                </p>
              )}
            </CardContent>
          </Card>

          {/* الصف الثاني: توزيع الحالات (كامل العرض) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byStatusData.length > 0 ? (
                  <BarChart
                    data={byStatusData}
                    dataKeys={["عدد التقويمات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد التقويمات ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byStatusData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الحالات (مخطط، قيد التنفيذ، مكتمل)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر تقويم مضافة */}
      {reviewings.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg border-l-4 border-l-blue-500 gap-0 overflow-hidden rounded-xl">
          <CardContent className="p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">آخر تقويم مضافة</span>
                </div>
                <h3 className="text-xs md:text-base font-semibold text-slate-900 mb-0.5 md:mb-1 line-clamp-1" dir="rtl">
                  {reviewings[0].title}
                </h3>
                <p className="text-[10px] md:text-sm text-slate-600 truncate">
                  {[
                    formatDate(reviewings[0].date),
                    typeLabels[reviewings[0].type],
                    statusLabels[reviewings[0].status],
                  ].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(reviewings[0])}
                className="flex-shrink-0 h-8 px-2.5 text-[11px] md:text-sm"
              >
                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                عرض
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl">
        <CardContent className="p-3 md:p-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول التقويمات العلمية</div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 px-2.5 md:px-3 text-[11px] md:text-sm"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <span className="md:hidden">Excel</span>
                <span className="hidden md:inline">تصدير Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 px-2.5 md:px-3 text-[11px] md:text-sm"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <span className="md:hidden">PDF</span>
                <span className="hidden md:inline">تصدير PDF</span>
              </Button>
            </div>
          </div>

          {/* فلاتر موبايل: سطر واحد */}
          <form
            onSubmit={handleSearchSubmit}
            className="md:hidden rounded-xl bg-slate-50 p-1.5 mb-3"
          >
            <div className="flex items-center gap-1 flex-nowrap min-w-0">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 min-w-0 flex-[1.2]">
                <Input
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-[10px] px-1.5"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="h-7 rounded-md px-2 text-[10px] shrink-0"
                >
                  بحث
                </Button>
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  loadReviewings({ type: v });
                }}
              >
                <SelectTrigger
                  className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                  aria-label="نوع التقويم"
                >
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الأنواع</SelectItem>
                  <SelectItem value="RESEARCHES">بحوث</SelectItem>
                  <SelectItem value="SCIENTIFIC_ARTICLES">مقالات علمية</SelectItem>
                  <SelectItem value="THESES">رسائل وأطاريح</SelectItem>
                  <SelectItem value="PATENTS">براءات اختراع</SelectItem>
                  <SelectItem value="SCIENTIFIC_CONSULTATIONS">استشارات علمية</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  loadReviewings({ status: v });
                }}
              >
                <SelectTrigger
                  className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                  aria-label="الحالة"
                >
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الحالات</SelectItem>
                  <SelectItem value="PLANNED">مخطط</SelectItem>
                  <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                  <SelectItem value="COMPLETED">مكتمل</SelectItem>
                </SelectContent>
              </Select>
              {uniqueYears.length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(v) => {
                    setYearFilter(v);
                    loadReviewings({ year: v });
                  }}
                >
                  <SelectTrigger
                    className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                    aria-label="السنة"
                  >
                    <SelectValue placeholder="السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">كل السنوات</SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </form>

          {/* فلاتر حاسوب */}
          <div className="hidden md:block">
            <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في التقويم العلميات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
                {/* البحث */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <Input
                      placeholder="عنوان التقويم..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                      بحث
                    </Button>
                  </div>
                </div>
                {/* نوع التقويم */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع التقويم</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setTypeFilter(v);
                      loadReviewings({ type: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="RESEARCHES">بحوث</SelectItem>
                      <SelectItem value="SCIENTIFIC_ARTICLES">مقالات علمية</SelectItem>
                      <SelectItem value="THESES">رسائل وأطاريح</SelectItem>
                      <SelectItem value="PATENTS">براءات اختراع</SelectItem>
                      <SelectItem value="SCIENTIFIC_CONSULTATIONS">استشارات علمية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* الحالة */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      loadReviewings({ status: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="PLANNED">مخطط</SelectItem>
                      <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                      <SelectItem value="COMPLETED">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* السنة */}
                {uniqueYears.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                    <Select
                      value={yearFilter}
                      onValueChange={(v) => {
                        setYearFilter(v);
                        loadReviewings({ year: v });
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">الكل</SelectItem>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </form>
          </div>

          {filteredForDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 md:px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="rounded-full bg-white border border-slate-200 p-4 md:p-6 mb-3 md:mb-5 shadow-sm">
                <Calendar className="h-8 w-8 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold text-slate-800 mb-1 md:mb-2 text-center">
                {hasActiveFilters ? "لا توجد نتائج" : "لم يتم تسجيل أي تقويم بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {hasActiveFilters
                  ? "لا توجد تقويمات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول تقويم لك."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="sm"
                  className="md:h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" />
                  إضافة أول تقويم
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "30%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">عنوان التقويم</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع التقويم</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ التقويم</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الحالة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            {reviewingActionsMenu(c)}
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {c.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {typeLabels[c.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(c.date)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant={c.status === "COMPLETED" ? "default" : c.status === "IN_PROGRESS" ? "secondary" : "outline"} className={c.status === "COMPLETED" ? "bg-green-100 text-green-800" : c.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-800" : ""}>
                              {statusLabels[c.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            {c.description ? (
                              c.description.length > 30 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-1 flex-1" dir="rtl">
                                    {c.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setViewingReviewing(c);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {c.description}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards List */}
              <div className="md:hidden space-y-2">
                {filteredForDisplay.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm min-h-[96px]"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(c)}
                        className="min-w-0 flex-1 text-right space-y-0.5"
                      >
                        <p className="text-[12px] font-semibold text-slate-900 line-clamp-1 leading-snug">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[formatDate(c.date), typeLabels[c.type], statusLabels[c.status]].join(" · ")}
                        </p>
                      </button>
                      {reviewingActionsMenu(c)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">نوع التقويم</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {typeLabels[c.type]}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">الحالة</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {statusLabels[c.status]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {editingReviewing ? "تعديل التقويم العلمي" : "إضافة تقويم"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingReviewing
                ? "تعديل بيانات التقويم العلمي."
                : "أدخل بيانات التقويم العلمي. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="title" className="text-xs md:text-sm">عنوان التقويم *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان التقويم"
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">نوع التقويم *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: "RESEARCHES" | "SCIENTIFIC_ARTICLES" | "THESES" | "PATENTS" | "SCIENTIFIC_CONSULTATIONS") => {
                    setFormData((p) => ({ ...p, type: v }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESEARCHES">بحوث</SelectItem>
                    <SelectItem value="SCIENTIFIC_ARTICLES">مقالات علمية</SelectItem>
                    <SelectItem value="THESES">رسائل وأطاريح</SelectItem>
                    <SelectItem value="PATENTS">براءات اختراع</SelectItem>
                    <SelectItem value="SCIENTIFIC_CONSULTATIONS">استشارات علمية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">حالة التقويم *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => {
                    setFormData((p) => ({
                      ...p,
                      status: v as "PLANNED" | "IN_PROGRESS" | "COMPLETED",
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">مخطط</SelectItem>
                    <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                    <SelectItem value="COMPLETED">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="date" className="text-xs md:text-sm">تاريخ التقويم *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                max={getTodayISO()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayISO();
                  if (selectedDate > today) {
                    showToast("تاريخ التقويم لا يمكن أن يكون في المستقبل", "error");
                    return;
                  }
                  setFormData((p) => ({ ...p, date: selectedDate }));
                }}
                required
                className="mt-1 h-9 md:h-10 text-sm"
              />
              <p className="text-[10px] md:text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>
            <div>
              <Label htmlFor="description" className="text-xs md:text-sm">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن التقويم العلمي..."
                rows={3}
                className="mt-1 flex min-h-[72px] md:min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingReviewing ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة التقويم"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingReviewing(null))}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل التقويم العلمي
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل التقويم العلمي المحددة</DialogDescription>
          </DialogHeader>
          {viewingReviewing && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingReviewing.title}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 line-clamp-2" dir="rtl">
                {[
                  typeLabels[viewingReviewing.type],
                  statusLabels[viewingReviewing.status],
                  formatDate(viewingReviewing.date),
                ].join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">نوع التقويم</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {typeLabels[viewingReviewing.type]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الحالة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {statusLabels[viewingReviewing.status]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0 col-span-2">
                  <p className="text-[10px] text-slate-400">تاريخ التقويم</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {formatDate(viewingReviewing.date)}
                  </p>
                </div>
                {viewingReviewing.description && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">الوصف</p>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap" dir="rtl">
                      {viewingReviewing.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-slate-500">نوع التقويم</span>
                  <span className="font-medium text-slate-900">{typeLabels[viewingReviewing.type]}</span>
                  <span className="text-slate-500">تاريخ التقويم</span>
                  <span className="font-medium text-slate-900">{formatDate(viewingReviewing.date)}</span>
                  <span className="text-slate-500">الحالة</span>
                  <span className="font-medium text-slate-900">
                    <Badge variant={viewingReviewing.status === "COMPLETED" ? "default" : viewingReviewing.status === "IN_PROGRESS" ? "secondary" : "outline"} className={viewingReviewing.status === "COMPLETED" ? "bg-green-100 text-green-800" : viewingReviewing.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-800" : ""}>
                      {statusLabels[viewingReviewing.status]}
                    </Badge>
                  </span>
                  {viewingReviewing.description && (
                    <>
                      <span className="text-slate-500">الوصف</span>
                      <span className="font-medium text-slate-900" dir="rtl">
                        {viewingReviewing.description}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-2 pt-2 md:pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 justify-center"
                  onClick={() => shareReviewingViaWhatsApp(viewingReviewing)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  <span className="md:hidden">واتساب</span>
                  <span className="hidden md:inline">إرسال عبر واتساب</span>
                </Button>
                <div className="grid grid-cols-3 gap-2 md:contents">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => (setIsDetailsOpen(false), setViewingReviewing(null))}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingReviewing);
                      setViewingReviewing(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingReviewing.id)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
