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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Briefcase, Loader2, Pencil, FileText, MessageCircle } from "lucide-react";
import { createPosition, updatePosition, deletePosition, listPositions } from "./actions";
import { PositionsKPICards, usePositionsStats } from "./_components/PositionsKPICards";
import type { Position } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

/** صيغة تاريخ أوضح للمنصة العربية: 2026 / 01 / 08 */
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

function formatDuration(years: number, months: number, days: number): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "سنة" : "سنة"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "شهر" : "شهر"}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? "يوم" : "يوم"}`);
  return parts.length > 0 ? parts.join("، ") : "0";
}

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(positions: Position[], stats: ReturnType<typeof usePositionsStats>): string {
  if (positions.length === 0) {
    return "لم تُسجّل بعد أي منصب. ابدأ بإضافة منصب.";
  }
  if (positions.length === 1) {
    const p = positions[0];
    return `لديك منصب واحد مسجل: ${p.title} في ${p.organization}.`;
  }
  return `لديك ${stats.total} منصب مسجل في ${stats.uniqueOrganizations} جهة مختلفة. إجمالي المدة: ${formatDuration(stats.totalDurationYears, stats.totalDurationMonths, stats.totalDurationDays)}.`;
}

interface PositionsPageClientProps {
  initialPositions: Position[];
}

export function PositionsPageClient({ initialPositions }: PositionsPageClientProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [viewingPosition, setViewingPosition] = useState<Position | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadPositions = (overrides?: {
    search?: string;
    organization?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const org = overrides?.organization ?? organizationFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listPositions({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        organization: org === "__all__" ? undefined : org,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setPositions(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPositions();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    organization: organizationFilter === "__all__" ? undefined : organizationFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listPositions(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((p: Position) => ({
      المنصب: p.title ?? "",
      الجهة: p.organization ?? "—",
      التاريخ: formatDateCell(p.positionDate),
      المدة: formatDuration(p.durationYears, p.durationMonths, p.durationDays),
      الوصف: p.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(p.createdAt),
      "آخر تحديث": formatDateCell(p.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المناصب");
    XLSX.writeFile(workbook, "positions-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listPositions(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (p: Position) => `
        <tr>
          <td>${p.title ?? "-"}</td>
          <td>${p.organization ?? "-"}</td>
          <td>${formatDateCell(p.positionDate)}</td>
          <td>${formatDuration(p.durationYears, p.durationMonths, p.durationDays)}</td>
          <td>${p.description ?? "-"}</td>
          <td>${formatDateCell(p.createdAt)}</td>
          <td>${formatDateCell(p.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير المناصب</title>
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
          <h1>تقرير المناصب</h1>
          <table>
            <thead>
              <tr>
                <th>المنصب</th>
                <th>الجهة</th>
                <th>التاريخ</th>
                <th>المدة</th>
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

  const stats = usePositionsStats(positions);
  const filteredForDisplay = positions;

  // استخراج الجهات الفريدة للفلتر
  const uniqueOrganizations = Array.from(new Set(positions.map((p) => p.organization))).sort();
  // استخراج السنوات الفريدة للفلتر
  const uniqueYears = Array.from(
    new Set(positions.map((p) => new Date(p.positionDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    positionDate: getTodayISO(),
    durationYears: 0,
    durationMonths: 0,
    durationDays: 0,
    organization: "",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من المدة قبل الإرسال
    if (
      formData.durationYears === 0 &&
      formData.durationMonths === 0 &&
      formData.durationDays === 0
    ) {
      showToast("يجب أن تكون مدة المنصب أكبر من صفر (سنة أو شهر أو يوم على الأقل)", "error");
      return;
    }

    // التحقق من التاريخ
    const selectedDate = new Date(formData.positionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      showToast("التاريخ لا يمكن أن يكون في المستقبل", "error");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...formData,
        positionDate: new Date(formData.positionDate),
        durationYears: Number(formData.durationYears),
        durationMonths: Number(formData.durationMonths),
        durationDays: Number(formData.durationDays),
      };
      const result = editingPosition
        ? await updatePosition({ ...payload, id: editingPosition.id })
        : await createPosition(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(
        editingPosition ? "✅ تم تحديث المنصب بنجاح" : "✅ تم إضافة المنصب بنجاح",
        "success"
      );
      handleCloseAdd();
      await loadPositions();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      const d = new Date(position.positionDate);
      setFormData({
        title: position.title,
        positionDate: d.toISOString().slice(0, 10),
        durationYears: position.durationYears,
        durationMonths: position.durationMonths,
        durationDays: position.durationDays,
        organization: position.organization,
        description: position.description || "",
      });
    } else {
      setEditingPosition(null);
      setFormData({
        title: "",
        positionDate: getTodayISO(),
        durationYears: 0,
        durationMonths: 0,
        durationDays: 0,
        organization: "",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingPosition(null);
    setFormData({
      title: "",
      positionDate: getTodayISO(),
      durationYears: 0,
      durationMonths: 0,
      durationDays: 0,
      organization: "",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنصب؟")) return;
    startTransition(async () => {
      const result = await deletePosition(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف المنصب بنجاح");
      setIsDetailsOpen(false);
      setViewingPosition(null);
      loadPositions();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (p: Position) => {
    setViewingPosition(p);
    setIsDetailsOpen(true);
  };

  const sharePositionViaWhatsApp = (p: Position) => {
    const lines: string[] = [
      `*${p.title}*`,
      `الجهة: ${p.organization}`,
      `التاريخ: ${formatDate(p.positionDate)}`,
      `المدة: ${formatDuration(p.durationYears, p.durationMonths, p.durationDays)}`,
    ];
    if (p.description) {
      lines.push(`الوصف: ${p.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد المناصب": item.value,
  }));

  // Top الجهات - Bar Chart (أفقي)
  const topOrgsBarData = stats.topOrganizations.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    "عدد المناصب": item.value,
  }));

  // Top الجهات - Pie Chart
  const organizationPieData = stats.topOrganizations.map((item, index) => {
    const colors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    return {
      name: item.name,
      value: item.value,
      color: colors[index % colors.length],
    };
  });

  // توزيع المدد
  const durationDistributionData = [
    { name: "قصيرة (< 6 أشهر)", value: stats.durationDistribution.short, color: "#10b981" },
    { name: "متوسطة (6-24 شهر)", value: stats.durationDistribution.medium, color: "#2563EB" },
    { name: "طويلة (> 24 شهر)", value: stats.durationDistribution.long, color: "#f59e0b" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">المناصب</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل مناصبك الأكاديمية والإدارية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة منصب
        </Button>
      </div>

      <PositionsKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* عدد المناصب حسب السنة */}
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد المناصب حسب السنة</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد المناصب"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد المناصب في ${year}: ${count}`}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byYearData.length > 0 && (() => {
                const top = byYearData.reduce(
                  (a, b) => (b["عدد المناصب"] > a["عدد المناصب"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة مناصب: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد المناصب"]} منصب)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* Top الجهات - Pie Chart */}
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">أكثر الجهات (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {organizationPieData.length > 0 ? (
                  <PieChart
                    data={organizationPieData}
                    tooltipLabel={(name, value) => `عدد المناصب في ${name}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
              {organizationPieData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع المناصب حسب الجهة (أول 5 جهات)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top الجهات - Bar Chart أفقي */}
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">أكثر الجهات (Bar)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {topOrgsBarData.length > 0 ? (
                  <BarChart
                    data={topOrgsBarData}
                    dataKeys={["عدد المناصب"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد المناصب في ${name}: ${count}`}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {topOrgsBarData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  أكثر الجهات مناصب (أول 5 جهات)
                </p>
              )}
            </CardContent>
          </Card>

          {/* توزيع المدد */}
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع المدد</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {durationDistributionData.length > 0 ? (
                  <PieChart
                    data={durationDistributionData}
                    tooltipLabel={(name, value) => `${name}: ${value} منصب`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
              {durationDistributionData.length > 0 && (
                <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-center font-medium mb-2">التوزيع:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {durationDistributionData.map((item) => (
                      <span key={item.name} className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-base font-semibold text-slate-800">جدول المناصب</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-3">بحث في المناصب</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="flex flex-wrap items-end gap-3" dir="rtl">
              <div className="flex flex-1 min-w-[200px] max-w-[360px] items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <Input
                  placeholder="العنوان، الجهة، الوصف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button type="submit" variant="secondary" size="sm" className="h-9 rounded-lg px-4 flex-shrink-0">
                  بحث
                </Button>
              </div>
              {uniqueOrganizations.length > 0 && (
                <div className="w-[150px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">الجهة</label>
                  <Select
                    value={organizationFilter}
                    onValueChange={(v) => {
                      setOrganizationFilter(v);
                      loadPositions({ organization: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {uniqueOrganizations.map((org) => (
                        <SelectItem key={org} value={org}>
                          {org}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {uniqueYears.length > 0 && (
                <div className="w-[130px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">السنة</label>
                  <Select
                    value={yearFilter}
                    onValueChange={(v) => {
                      setYearFilter(v);
                      loadPositions({ year: v });
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

          {filteredForDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="rounded-full bg-white border border-slate-200 p-6 mb-5 shadow-sm">
                <Briefcase className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || organizationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي منصب بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || organizationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد مناصب تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول منصب لك."}
              </p>
              {!search && organizationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول منصب
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
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "20%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">المنصب</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الجهة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">المدة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((p) => (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(p)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(p)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا المنصب؟")) {
                                      startTransition(async () => {
                                        const res = await deletePosition(p.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف المنصب بنجاح");
                                          loadPositions();
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
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {p.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {p.organization}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(p.positionDate)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700 font-medium">
                            {formatDuration(p.durationYears, p.durationMonths, p.durationDays)}
                          </TableCell>
                          <TableCell className="align-middle">
                            {p.description ? (
                              p.description.length > 50 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-2 flex-1" dir="rtl">
                                    {p.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setSelectedDescription(p.description || "");
                                      setDescriptionModalOpen(true);
                                    }}
                                  >
                                    <FileText className="h-3 w-3 ml-1" />
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {p.description}
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
              <div className="md:hidden space-y-3">
                {filteredForDisplay.map((p) => (
                  <Card key={p.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {p.title}
                          </h3>
                          <p className="text-sm text-slate-600" dir="rtl">
                            {p.organization}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(p)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(p)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا المنصب؟")) {
                                  startTransition(async () => {
                                    const res = await deletePosition(p.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف المنصب بنجاح");
                                      loadPositions();
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
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-slate-500">التاريخ:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(p.positionDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">المدة:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDuration(p.durationYears, p.durationMonths, p.durationDays)}
                          </span>
                        </div>
                      </div>
                      {p.description && (
                        <div className="pt-3 border-t border-slate-100">
                          {p.description.length > 100 ? (
                            <div>
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2" dir="rtl">
                                {p.description}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                  setSelectedDescription(p.description || "");
                                  setDescriptionModalOpen(true);
                                }}
                              >
                                <FileText className="h-3 w-3 ml-1" />
                                عرض الوصف الكامل
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600" dir="rtl">
                              {p.description}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPosition ? "تعديل المنصب" : "إضافة منصب"}</DialogTitle>
            <DialogDescription>
              {editingPosition
                ? "تعديل بيانات المنصب."
                : "أدخل بيانات المنصب. التاريخ لا يقبل أي تاريخ في المستقبل. يجب أن تكون المدة أكبر من صفر."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {/* 1. المنصب */}
            <div>
              <Label htmlFor="title">المنصب *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثال: رئيس قسم"
                required
                minLength={2}
                className="mt-1"
              />
            </div>

            {/* 2. التاريخ */}
            <div>
              <Label htmlFor="positionDate">التاريخ *</Label>
              <Input
                id="positionDate"
                type="date"
                value={formData.positionDate}
                max={getTodayISO()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayISO();
                  if (selectedDate > today) {
                    showToast("التاريخ لا يمكن أن يكون في المستقبل", "error");
                    return;
                  }
                  setFormData((p) => ({ ...p, positionDate: selectedDate }));
                }}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>

            {/* 3. مدة المنصب */}
            <div>
              <Label>مدة المنصب *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                <div>
                  <Select
                    value={String(formData.durationYears)}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, durationYears: parseInt(v) || 0 }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="السنوات" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} {year === 1 ? "سنة" : "سنة"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-0.5 text-center">السنوات (0-30)</p>
                </div>
                <div>
                  <Select
                    value={String(formData.durationMonths)}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, durationMonths: parseInt(v) || 0 }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الأشهر" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {month} {month === 1 ? "شهر" : "شهر"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-0.5 text-center">الأشهر (0-11)</p>
                </div>
                <div>
                  <Select
                    value={String(formData.durationDays)}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, durationDays: parseInt(v) || 0 }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الأيام" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 32 }, (_, i) => i).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {day} {day === 1 ? "يوم" : "يوم"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-0.5 text-center">الأيام (0-31)</p>
                </div>
              </div>
              {formData.durationYears === 0 &&
                formData.durationMonths === 0 &&
                formData.durationDays === 0 && (
                  <p className="text-xs text-red-600 mt-1">يجب أن تكون المدة أكبر من صفر</p>
                )}
            </div>

            {/* 4. الجهة */}
            <div>
              <Label htmlFor="organization">الجهة *</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData((p) => ({ ...p, organization: e.target.value }))}
                placeholder="مثال: جامعة بغداد"
                required
                minLength={2}
                className="mt-1"
              />
            </div>

            {/* 5. الوصف */}
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن المنصب..."
                rows={3}
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingPosition ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة المنصب"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingPosition(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل المنصب
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل المنصب المحدد</DialogDescription>
          </DialogHeader>
          {viewingPosition && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingPosition.title}
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">الجهة</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingPosition.organization}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingPosition.positionDate)}</span>
                <span className="text-slate-500">المدة</span>
                <span className="font-medium text-slate-900">
                  {formatDuration(
                    viewingPosition.durationYears,
                    viewingPosition.durationMonths,
                    viewingPosition.durationDays
                  )}
                </span>
                {viewingPosition.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingPosition.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => sharePositionViaWhatsApp(viewingPosition)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingPosition(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingPosition);
                    setViewingPosition(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingPosition.id)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description Modal */}
      <Dialog open={descriptionModalOpen} onOpenChange={setDescriptionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              الوصف الكامل
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap" dir="rtl">
              {selectedDescription}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setDescriptionModalOpen(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
