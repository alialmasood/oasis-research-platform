"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, MoreVertical, Eye, Trash2, MapPin, Loader2, Pencil, Calendar, MessageCircle } from "lucide-react";
import {
  createFieldVisit,
  updateFieldVisit,
  deleteFieldVisit,
  listFieldVisits,
} from "./actions";
import { FieldVisitsKPICards, useFieldVisitsStats } from "./_components/FieldVisitsKPICards";
import type { FieldVisit } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const POINTS: Record<string, number> = {
  FIELD_VISIT_SUPERVISION: 12,
  VOLUNTARY_INSIDE_MINISTRY: 8,
  SERVICE_OUTSIDE_MINISTRY: 6,
};

const TYPE_LABELS: Record<string, string> = {
  FIELD_VISIT_SUPERVISION: "زيارة ميدانية (إشراف طلبة) — 12 درجة",
  VOLUNTARY_INSIDE_MINISTRY: "عمل تطوعي داخل الوزارة — 8 درجات",
  SERVICE_OUTSIDE_MINISTRY: "خدمة / استشارة / ندوة خارج الوزارة — 6 درجات",
};

const TYPE_LABELS_SHORT: Record<string, string> = {
  FIELD_VISIT_SUPERVISION: "زيارة ميدانية",
  VOLUNTARY_INSIDE_MINISTRY: "تطوع داخل الوزارة",
  SERVICE_OUTSIDE_MINISTRY: "خدمة خارج الوزارة",
};

const MAX_SECTION_POINTS = 30;

function formatDate(d: Date) {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y} / ${m} / ${day}`;
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getContextSummary(
  items: FieldVisit[],
  stats: ReturnType<typeof useFieldVisitsStats>
): string {
  if (items.length === 0) {
    return "لم تُسجّل بعد أي زيارة ميدانية. ابدأ بإضافة زيارة جديدة.";
  }
  if (items.length === 1) {
    return "لديك زيارة ميدانية / نشاط واحد.";
  }
  return `لديك ${stats.total} سجل (${stats.totalPoints}/${MAX_SECTION_POINTS} درجة).`;
}

interface FieldVisitsPageClientProps {
  initialItems: FieldVisit[];
}

export function FieldVisitsPageClient({ initialItems }: FieldVisitsPageClientProps) {
  const [items, setItems] = useState<FieldVisit[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FieldVisit | null>(null);
  const [viewingItem, setViewingItem] = useState<FieldVisit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadItems = (overrides?: { search?: string; type?: string; year?: string }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const type = overrides?.type ?? typeFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listFieldVisits({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        type: type === "__all__" ? undefined : (type as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY"),
        year: year === "__all__" ? undefined : parseInt(year, 10),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setItems(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    type:
      typeFilter === "__all__"
        ? undefined
        : (typeFilter as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY"),
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter, 10),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listFieldVisits(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((v) => ({
      "نوع النشاط": TYPE_LABELS[v.type] ?? v.type,
      العنوان: v.title ?? "",
      التاريخ: formatDateCell(v.activityDate),
      التوثيق: v.documentationRef ?? "—",
      الدرجة: POINTS[v.type] ?? 0,
      الوصف: v.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(v.createdAt),
      "آخر تحديث": formatDateCell(v.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الزيارات الميدانية");
    XLSX.writeFile(workbook, "field-visits-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listFieldVisits(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (v) => `
        <tr>
          <td>${TYPE_LABELS[v.type] ?? v.type}</td>
          <td>${v.title ?? "-"}</td>
          <td>${formatDateCell(v.activityDate)}</td>
          <td>${v.documentationRef ?? "-"}</td>
          <td>${POINTS[v.type] ?? 0}</td>
          <td>${v.description ?? "-"}</td>
          <td>${formatDateCell(v.createdAt)}</td>
          <td>${formatDateCell(v.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير الزيارات الميدانية والنشاطات</title>
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
          <h1>تقرير الزيارات الميدانية والنشاطات</h1>
          <table>
            <thead>
              <tr>
                <th>نوع النشاط</th>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>التوثيق</th>
                <th>الدرجة</th>
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

  const filteredForDisplay = items;
  const stats = useFieldVisitsStats(filteredForDisplay);
  const uniqueYears = Array.from(
    new Set(items.map((i) => new Date(i.activityDate).getFullYear()))
  ).sort((a, b) => b - a);

  const hasActiveFilters =
    Boolean(search) || typeFilter !== "__all__" || yearFilter !== "__all__";

  const [formData, setFormData] = useState({
    type: "FIELD_VISIT_SUPERVISION" as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY",
    title: "",
    activityDate: getTodayISO(),
    description: "",
    documentationRef: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        type: formData.type,
        title: formData.title,
        activityDate: new Date(formData.activityDate),
        description: formData.description || null,
        documentationRef: formData.documentationRef || null,
      };
      const result = editingItem
        ? await updateFieldVisit({ ...payload, id: editingItem.id })
        : await createFieldVisit(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingItem ? "✅ تم تحديث السجل بنجاح" : "✅ تم إضافة الزيارة الميدانية بنجاح");
      setIsAddOpen(false);
      setEditingItem(null);
      setFormData({
        type: "FIELD_VISIT_SUPERVISION",
        title: "",
        activityDate: getTodayISO(),
        description: "",
        documentationRef: "",
      });
      loadItems();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (item?: FieldVisit) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        type: item.type,
        title: item.title,
        activityDate: new Date(item.activityDate).toISOString().slice(0, 10),
        description: item.description || "",
        documentationRef: item.documentationRef || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        type: "FIELD_VISIT_SUPERVISION",
        title: "",
        activityDate: getTodayISO(),
        description: "",
        documentationRef: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingItem(null);
    setFormData({
      type: "FIELD_VISIT_SUPERVISION",
      title: "",
      activityDate: getTodayISO(),
      description: "",
      documentationRef: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    startTransition(async () => {
      const result = await deleteFieldVisit(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف السجل بنجاح");
      setIsDetailsOpen(false);
      setViewingItem(null);
      loadItems();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (item: FieldVisit) => {
    setViewingItem(item);
    setIsDetailsOpen(true);
  };

  const shareViaWhatsApp = (item: FieldVisit) => {
    const lines: string[] = [
      `*${item.title}*`,
      `نوع النشاط: ${TYPE_LABELS[item.type]}`,
      `التاريخ: ${formatDate(item.activityDate)}`,
      `الدرجة: ${POINTS[item.type] ?? 0} درجة`,
    ];
    if (item.documentationRef) {
      lines.push(`التوثيق: ${item.documentationRef}`);
    }
    if (item.description) {
      lines.push(`الوصف: ${item.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const fieldVisitActionsMenu = (row: FieldVisit) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleView(row)}>
          <Eye className="h-4 w-4 ml-2" />
          عرض التفاصيل
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenAdd(row)}>
          <Pencil className="h-4 w-4 ml-2" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
              startTransition(async () => {
                const res = await deleteFieldVisit(row.id);
                if (res.error) showToast(res.error, "error");
                else {
                  showToast("✅ تم حذف السجل بنجاح");
                  loadItems();
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

  const byYearChartData = stats.byYear.map((item) => ({ name: item.name, "عدد النشاطات": item.value }));
  const byTypeBarData = stats.byType.map((item) => ({ name: item.name, "عدد النشاطات": item.value }));

  return (
    <div className="space-y-3 md:space-y-6 min-w-0" dir="rtl">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">
            الزيارات الميدانية والحقلية والأعمال التطوعية
          </h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">
            زيارة ميدانية لإشراف الطلبة، عمل تطوعي داخل الوزارة، أو خدمة/استشارة خارج الوزارة. الحد الأقصى للفقرة 30 درجة.
          </p>
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
          <span className="hidden md:inline">إضافة زيارة ميدانية</span>
        </Button>
      </div>

      <FieldVisitsKPICards stats={stats} />

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
                {byYearChartData.length > 0 ? (
                  <BarChart
                    data={byYearChartData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد النشاطات في ${year}: ${count}`}
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
                  أنواع النشاط
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {stats.byType.length > 0 ? (
                    <PieChart
                      data={stats.byType}
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
                  ملخص النشاطات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1 flex items-center justify-center h-[130px]">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums text-gray-900 leading-none">
                    {stats.total}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {stats.totalPoints}/{MAX_SECTION_POINTS} درجة · {stats.fieldVisitCount} زيارة
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">حسب النوع</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {byTypeBarData.length > 0 ? (
                  <BarChart
                    data={byTypeBarData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB", "#10b981", "#f59e0b"]}
                    tooltipLabel={(name, count) => `${name}: ${count}`}
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
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">عدد النشاطات حسب السنة</h4>
              <div className="h-[300px] flex flex-col">
                {stats.byYear.length > 0 ? (
                  <BarChart
                    data={byYearChartData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد النشاطات في ${year}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={12}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">توزيع أنواع النشاط</h4>
              <div className="h-[300px] flex flex-col">
                {stats.byType.length > 0 ? (
                  <PieChart
                    data={stats.byType}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    outerRadius={80}
                    innerRadius={28}
                    legendWrapperStyle={{ fontSize: "11px" }}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">عدد النشاطات حسب النوع</h4>
              <div className="h-[280px] flex flex-col">
                {stats.byType.length > 0 ? (
                  <BarChart
                    data={byTypeBarData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB", "#10b981", "#f59e0b"]}
                    tooltipLabel={(name, count) => `${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر زيارة ميدانية مضافة */}
      {items.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg border-l-4 border-l-blue-500 gap-0 overflow-hidden rounded-xl">
          <CardContent className="p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">آخر زيارة ميدانية مضافة</span>
                </div>
                <h3 className="text-xs md:text-base font-semibold text-slate-900 mb-0.5 md:mb-1 line-clamp-1" dir="rtl">
                  {items[0].title}
                </h3>
                <p className="text-[10px] md:text-sm text-slate-600 truncate">
                  {[
                    formatDate(items[0].activityDate),
                    TYPE_LABELS_SHORT[items[0].type] ?? TYPE_LABELS[items[0].type],
                    `${POINTS[items[0].type] ?? 0} درجة`,
                  ].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(items[0])}
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
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول الزيارات الميدانية والنشاطات</div>
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
                  loadItems({ type: v });
                }}
              >
                <SelectTrigger
                  className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                  aria-label="نوع النشاط"
                >
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الأنواع</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {uniqueYears.length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(v) => {
                    setYearFilter(v);
                    loadItems({ year: v });
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
                    {uniqueYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </form>

          {/* فلاتر حاسوب */}
          <div className="hidden md:block">
            <h3 className="text-base font-semibold text-slate-800 mb-4">قائمة الزيارات الميدانية والنشاطات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <Input
                      placeholder="عنوان النشاط أو الوصف..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                      بحث
                    </Button>
                  </div>
                </div>
                <div className="min-w-[220px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع النشاط</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setTypeFilter(v);
                      loadItems({ type: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {uniqueYears.length > 0 && (
                  <div className="min-w-[120px]">
                    <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                    <Select
                      value={yearFilter}
                      onValueChange={(v) => {
                        setYearFilter(v);
                        loadItems({ year: v });
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">الكل</SelectItem>
                        {uniqueYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
              <div className="rounded-full bg-white border border-slate-200 p-4 md:p-6 mb-4 md:mb-5 shadow-sm">
                <MapPin className="h-10 w-10 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-base md:text-xl font-semibold text-slate-800 mb-2">
                {hasActiveFilters
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي زيارة ميدانية أو نشاط بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {hasActiveFilters
                  ? "لا توجد سجلات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول زيارة ميدانية أو عمل تطوعي أو خدمة (وفق الدليل الإرشادي)."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="sm"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm h-9 md:h-10"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-2" />
                  إضافة زيارة ميدانية
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع النشاط</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">العنوان</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التوثيق</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الدرجة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            {fieldVisitActionsMenu(row)}
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-800 whitespace-normal text-right">
                              {TYPE_LABELS[row.type] ?? row.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {row.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(row.activityDate)}
                          </TableCell>
                          <TableCell className="align-middle text-sm text-slate-700" dir="rtl">
                            {row.documentationRef ? (
                              <span className="line-clamp-2">{row.documentationRef}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge className="bg-emerald-100 text-emerald-800">
                              {POINTS[row.type] ?? 0} درجة
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards List */}
              <div className="md:hidden space-y-2">
                {filteredForDisplay.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm min-h-[96px]"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(row)}
                        className="min-w-0 flex-1 text-right space-y-0.5"
                      >
                        <p className="text-[12px] font-semibold text-slate-900 line-clamp-1 leading-snug" dir="rtl">
                          {row.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[
                            formatDate(row.activityDate),
                            TYPE_LABELS_SHORT[row.type] ?? row.type,
                            `${POINTS[row.type] ?? 0} درجة`,
                          ].join(" · ")}
                        </p>
                      </button>
                      {fieldVisitActionsMenu(row)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">نوع النشاط</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {TYPE_LABELS_SHORT[row.type] ?? TYPE_LABELS[row.type]}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">التوثيق</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate" dir="rtl">
                          {row.documentationRef || "—"}
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

      {/* نافذة الإضافة / التعديل */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {editingItem ? "تعديل زيارة ميدانية / نشاط" : "إضافة زيارة ميدانية جديدة"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingItem
                ? "تعديل بيانات السجل."
                : "اختر نوع النشاط (زيارة ميدانية 12 درجة، عمل تطوعي داخل الوزارة 8 درجات، خدمة خارج الوزارة 6 درجات). الحد الأقصى للفقرة 30 درجة."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-xs md:text-sm">نوع النشاط *</Label>
              <Select
                value={formData.type}
                onValueChange={(v: "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY") =>
                  setFormData((p) => ({ ...p, type: v }))
                }
              >
                <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title" className="text-xs md:text-sm">عنوان النشاط *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثال: زيارة ميدانية لمختبر التحليلات، حملة تشجير..."
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label htmlFor="activityDate" className="text-xs md:text-sm">تاريخ النشاط *</Label>
                <Input
                  id="activityDate"
                  type="date"
                  value={formData.activityDate}
                  max={getTodayISO()}
                  onChange={(e) => setFormData((p) => ({ ...p, activityDate: e.target.value }))}
                  required
                  className="mt-1 h-9 md:h-10 text-sm"
                />
                <p className="text-[10px] md:text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
              </div>
              <div className="min-w-0">
                <Label htmlFor="documentationRef" className="text-xs md:text-sm">التوثيق (اختياري)</Label>
                <Input
                  id="documentationRef"
                  value={formData.documentationRef}
                  onChange={(e) => setFormData((p) => ({ ...p, documentationRef: e.target.value }))}
                  placeholder="استمارة أو كتاب رسمي"
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-xs md:text-sm">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للنشاط..."
                rows={3}
                className="mt-1 min-h-[72px] md:min-h-[80px] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingItem ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة التفاصيل */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingItem(null))}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل الزيارة الميدانية / النشاط
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الزيارة الميدانية المحددة</DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingItem.title}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 line-clamp-2" dir="rtl">
                {[
                  TYPE_LABELS_SHORT[viewingItem.type] ?? TYPE_LABELS[viewingItem.type],
                  formatDate(viewingItem.activityDate),
                  `${POINTS[viewingItem.type] ?? 0} درجة`,
                ].join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">نوع النشاط</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {TYPE_LABELS_SHORT[viewingItem.type] ?? TYPE_LABELS[viewingItem.type]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الدرجة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {POINTS[viewingItem.type] ?? 0} درجة
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0 col-span-2">
                  <p className="text-[10px] text-slate-400">التاريخ</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {formatDate(viewingItem.activityDate)}
                  </p>
                </div>
                {viewingItem.documentationRef && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">التوثيق</p>
                    <p className="text-xs font-medium text-slate-900" dir="rtl">
                      {viewingItem.documentationRef}
                    </p>
                  </div>
                )}
                {viewingItem.description && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">الوصف</p>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap" dir="rtl">
                      {viewingItem.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <span className="text-slate-500">نوع النشاط</span>
                  <span className="font-medium text-slate-900">{TYPE_LABELS[viewingItem.type]}</span>
                  <span className="text-slate-500">التاريخ</span>
                  <span className="font-medium text-slate-900">{formatDate(viewingItem.activityDate)}</span>
                  <span className="text-slate-500">الدرجة</span>
                  <span className="font-medium text-slate-900">{POINTS[viewingItem.type]} درجة</span>
                  {viewingItem.documentationRef && (
                    <>
                      <span className="text-slate-500">التوثيق</span>
                      <span className="font-medium text-slate-900" dir="rtl">{viewingItem.documentationRef}</span>
                    </>
                  )}
                  {viewingItem.description && (
                    <>
                      <span className="text-slate-500">الوصف</span>
                      <span className="font-medium text-slate-900" dir="rtl">{viewingItem.description}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-2 pt-2 md:pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 justify-center"
                  onClick={() => shareViaWhatsApp(viewingItem)}
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
                    onClick={() => (setIsDetailsOpen(false), setViewingItem(null))}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingItem);
                      setViewingItem(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingItem.id)}
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
