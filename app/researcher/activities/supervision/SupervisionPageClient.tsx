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
import { Plus, MoreVertical, Eye, Trash2, Calendar, GraduationCap, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createSupervision, updateSupervision, deleteSupervision, listSupervisions } from "./actions";
import { SupervisionKPICards, useSupervisionStats } from "./_components/SupervisionKPICards";
import type { Supervision } from "@prisma/client";
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

const degreeTypeLabels: Record<string, string> = {
  PHD: "دكتوراه",
  MASTERS: "ماجستير",
  BACHELORS: "بكالوريوس",
  HIGHER_DIPLOMA: "دبلوم عالي",
};

const statusLabels: Record<string, string> = {
  COMPLETED: "مكتمل",
  IN_PROGRESS: "غير مكتمل",
};

const supervisionTypeLabels: Record<string, string> = {
  SOLE: "منفرد",
  JOINT: "مشترك",
};

const degreeTypeColors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6"];

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(supervisions: Supervision[], stats: ReturnType<typeof useSupervisionStats>): string {
  if (supervisions.length === 0) {
    return "لم تُسجّل بعد أي إشراف. ابدأ بإضافة إشراف جديد.";
  }
  if (supervisions.length === 1) {
    return `لديك إشراف واحد.`;
  }
  const { total, completed } = stats;
  return `لديك ${total} إشراف (${completed} مكتمل).`;
}

interface SupervisionPageClientProps {
  initialSupervisions: Supervision[];
}

export function SupervisionPageClient({ initialSupervisions }: SupervisionPageClientProps) {
  const [supervisions, setSupervisions] = useState<Supervision[]>(initialSupervisions);
  const [search, setSearch] = useState("");
  const [degreeTypeFilter, setDegreeTypeFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [supervisionTypeFilter, setSupervisionTypeFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupervision, setEditingSupervision] = useState<Supervision | null>(null);
  const [viewingSupervision, setViewingSupervision] = useState<Supervision | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadSupervisions = (overrides?: {
    search?: string;
    degreeType?: string;
    status?: string;
    supervisionType?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const degreeType = overrides?.degreeType ?? degreeTypeFilter;
      const status = overrides?.status ?? statusFilter;
      const supervisionType = overrides?.supervisionType ?? supervisionTypeFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listSupervisions({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        degreeType: degreeType === "__all__" ? undefined : degreeType,
        status: status === "__all__" ? undefined : status,
        supervisionType: supervisionType === "__all__" ? undefined : supervisionType,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setSupervisions(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSupervisions();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    degreeType: degreeTypeFilter === "__all__" ? undefined : degreeTypeFilter,
    status: statusFilter === "__all__" ? undefined : statusFilter,
    supervisionType: supervisionTypeFilter === "__all__" ? undefined : supervisionTypeFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listSupervisions(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((s: Supervision) => ({
      "اسم الطالب": s.studentName ?? "",
      الدرجة: degreeTypeLabels[s.degreeType] ?? s.degreeType,
      "عنوان الرسالة": s.thesisTitle ?? "—",
      "نوع الإشراف": s.supervisionType ? (supervisionTypeLabels[s.supervisionType] ?? s.supervisionType) : "—",
      الحالة: statusLabels[s.status] ?? s.status,
      "تاريخ البداية": formatDateCell(s.startDate),
      "تاريخ الانتهاء": s.endDate ? formatDateCell(s.endDate) : "—",
      الوصف: s.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(s.createdAt),
      "آخر تحديث": formatDateCell(s.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الإشرافات");
    XLSX.writeFile(workbook, "supervision-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listSupervisions(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (s: Supervision) => `
        <tr>
          <td>${s.studentName ?? "-"}</td>
          <td>${degreeTypeLabels[s.degreeType] ?? s.degreeType}</td>
          <td>${s.thesisTitle ?? "-"}</td>
          <td>${s.supervisionType ? (supervisionTypeLabels[s.supervisionType] ?? s.supervisionType) : "-"}</td>
          <td>${statusLabels[s.status] ?? s.status}</td>
          <td>${formatDateCell(s.startDate)}</td>
          <td>${s.endDate ? formatDateCell(s.endDate) : "-"}</td>
          <td>${s.description ?? "-"}</td>
          <td>${formatDateCell(s.createdAt)}</td>
          <td>${formatDateCell(s.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير الإشرافات</title>
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
          <h1>تقرير الإشرافات</h1>
          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>الدرجة</th>
                <th>عنوان الرسالة</th>
                <th>نوع الإشراف</th>
                <th>الحالة</th>
                <th>تاريخ البداية</th>
                <th>تاريخ الانتهاء</th>
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

  const stats = useSupervisionStats(supervisions);
  const filteredForDisplay = supervisions;

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(supervisions.map((s) => new Date(s.startDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    studentName: "",
    degreeType: "PHD" as "PHD" | "MASTERS" | "BACHELORS" | "HIGHER_DIPLOMA",
    thesisTitle: "",
    startDate: getTodayISO(),
    endDate: "" as string | null,
    status: "IN_PROGRESS" as "COMPLETED" | "IN_PROGRESS",
    supervisionType: "SOLE" as "SOLE" | "JOINT" | null,
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        studentName: formData.studentName,
        degreeType: formData.degreeType,
        thesisTitle: formData.thesisTitle,
        startDate: new Date(formData.startDate),
        endDate: formData.status === "COMPLETED" ? (formData.endDate ? new Date(formData.endDate) : null) : null,
        status: formData.status,
        supervisionType: (formData.degreeType === "PHD" || formData.degreeType === "MASTERS") ? (formData.supervisionType || null) : null,
        description: formData.description || null,
      };
      const result = editingSupervision
        ? await updateSupervision({ ...payload, id: editingSupervision.id })
        : await createSupervision(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingSupervision ? "✅ تم تحديث الإشراف بنجاح" : "✅ تم إضافة الإشراف بنجاح");
      setIsAddOpen(false);
      setEditingSupervision(null);
      setFormData({
        studentName: "",
        degreeType: "PHD",
        thesisTitle: "",
        startDate: getTodayISO(),
        endDate: null,
        status: "IN_PROGRESS",
        supervisionType: "SOLE",
        description: "",
      });
      loadSupervisions();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (supervision?: Supervision) => {
    if (supervision) {
      setEditingSupervision(supervision);
      setFormData({
        studentName: supervision.studentName,
        degreeType: supervision.degreeType,
        thesisTitle: supervision.thesisTitle,
        startDate: new Date(supervision.startDate).toISOString().slice(0, 10),
        endDate: supervision.endDate ? new Date(supervision.endDate).toISOString().slice(0, 10) : null,
        status: supervision.status,
        supervisionType: supervision.supervisionType || "SOLE",
        description: supervision.description || "",
      });
    } else {
      setEditingSupervision(null);
      setFormData({
        studentName: "",
        degreeType: "PHD",
        thesisTitle: "",
        startDate: getTodayISO(),
        endDate: null,
        status: "IN_PROGRESS",
        supervisionType: "SOLE",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingSupervision(null);
    setFormData({
      studentName: "",
      degreeType: "PHD",
      thesisTitle: "",
      startDate: getTodayISO(),
      endDate: null,
      status: "IN_PROGRESS",
      supervisionType: "SOLE",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشراف؟")) return;
    startTransition(async () => {
      const result = await deleteSupervision(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف الإشراف بنجاح");
      setIsDetailsOpen(false);
      setViewingSupervision(null);
      loadSupervisions();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Supervision) => {
    setViewingSupervision(s);
    setIsDetailsOpen(true);
  };

  const shareSupervisionViaWhatsApp = (s: Supervision) => {
    const lines: string[] = [
      `*${s.studentName}*`,
      `نوع الدرجة: ${degreeTypeLabels[s.degreeType]}`,
      `عنوان الرسالة/المشروع: ${s.thesisTitle}`,
      `تاريخ البداية: ${formatDate(s.startDate)}`,
      `الحالة: ${statusLabels[s.status]}`,
    ];
    if (s.endDate) {
      lines.push(`تاريخ الانتهاء: ${formatDate(s.endDate)}`);
    }
    if (s.supervisionType) {
      lines.push(`نوع الإشراف: ${supervisionTypeLabels[s.supervisionType]}`);
    }
    if (s.description) {
      lines.push(`الوصف: ${s.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const supervisionActionsMenu = (c: Supervision) => (
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
            if (confirm("هل أنت متأكد من حذف هذا الإشراف؟")) {
              startTransition(async () => {
                const res = await deleteSupervision(c.id);
                if (res.error) showToast(res.error, "error");
                else {
                  showToast("✅ تم حذف الإشراف بنجاح");
                  loadSupervisions();
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
    "عدد الإشرافات": item.value,
  }));

  const byDegreeTypeData = stats.byDegreeType.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: degreeTypeColors[index % degreeTypeColors.length],
  }));

  const byStatusData = stats.byStatus.map((item) => ({
    name: item.name,
    "عدد الإشرافات": item.value,
  }));

  const bySupervisionTypeData = stats.bySupervisionType.map((item) => ({
    name: item.name,
    "عدد الإشرافات": item.value,
  }));

  const hasActiveFilters =
    Boolean(search) ||
    degreeTypeFilter !== "__all__" ||
    statusFilter !== "__all__" ||
    supervisionTypeFilter !== "__all__" ||
    yearFilter !== "__all__";

  return (
    <div className="space-y-3 md:space-y-6 min-w-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">الإشراف على الطلبة</h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">سجّل إشرافاتك على الطلبة والنشاطات العلمية</p>
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
          <span className="hidden md:inline">إضافة إشراف</span>
        </Button>
      </div>

      <SupervisionKPICards stats={stats} />

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
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الإشرافات في ${year}: ${count}`}
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
                  أنواع الدرجات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {byDegreeTypeData.length > 0 ? (
                    <PieChart
                      data={byDegreeTypeData}
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
                  ملخص الإشرافات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1 flex items-center justify-center h-[130px]">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums text-gray-900 leading-none">
                    {stats.total}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {stats.completed} مكتمل · {stats.inProgress} غير مكتمل
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
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد الإشرافات ${name}: ${count}`}
                    tickFontSize={10}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>

          {bySupervisionTypeData.length > 0 && (
            <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
              <CardHeader className="px-2.5 pt-2 pb-0">
                <CardTitle className="text-[11px] font-semibold text-gray-900">أنواع الإشراف</CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-1">
                <div className="h-[132px]">
                  <BarChart
                    data={bySupervisionTypeData}
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#8b5cf6"]}
                    tooltipLabel={(name, count) => `عدد الإشرافات ${name}: ${count}`}
                    tickFontSize={10}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* حاسوب: التخطيط السابق */}
        <div className="hidden md:grid grid-cols-12 gap-4">
          {/* الصف الأول: عدد الإشرافات حسب السنة (أكبر) + توزيع الأدوار (أصغر) */}
          {/* عدد الإشرافات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد الإشرافات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الإشرافات في ${year}: ${count}`}
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
                  (a, b) => (b["عدد الإشرافات"] > a["عدد الإشرافات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة إشرافات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد الإشرافات"]} إشراف)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* توزيع أنواع الدرجات (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع أنواع الدرجات</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byDegreeTypeData.length > 0 ? (
                  <PieChart
                    data={byDegreeTypeData}
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
              {byDegreeTypeData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع أنواع الدرجات (دكتوراه، ماجستير، بكالوريوس، دبلوم عالي)
                </p>
              )}
            </CardContent>
          </Card>

          {/* الصف الثاني: توزيع الحالات (Bar) - col-span-12 lg:col-span-6 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byStatusData.length > 0 ? (
                  <BarChart
                    data={byStatusData}
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد الإشرافات ${name}: ${count}`}
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
                  توزيع الحالات (مكتمل، غير مكتمل)
                </p>
              )}
            </CardContent>
          </Card>

          {/* توزيع أنواع الإشراف (Bar) - col-span-12 lg:col-span-6 */}
          {bySupervisionTypeData.length > 0 && (
            <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">توزيع أنواع الإشراف</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] flex flex-col">
                <div className="flex-1 min-h-0">
                  <BarChart
                    data={bySupervisionTypeData}
                    dataKeys={["عدد الإشرافات"]}
                    colors={["#8b5cf6"]}
                    tooltipLabel={(name, count) => `عدد الإشرافات ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع أنواع الإشراف (منفرد، مشترك) - لدكتوراه وماجستير فقط
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* آخر إشراف مضافة */}
      {supervisions.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg border-l-4 border-l-blue-500 gap-0 overflow-hidden rounded-xl">
          <CardContent className="p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">آخر إشراف مضافة</span>
                </div>
                <h3 className="text-xs md:text-base font-semibold text-slate-900 mb-0.5 md:mb-1 line-clamp-1" dir="rtl">
                  {supervisions[0].studentName}
                </h3>
                <p className="text-[10px] md:text-sm text-slate-600 truncate">
                  {[
                    formatDate(supervisions[0].startDate),
                    degreeTypeLabels[supervisions[0].degreeType],
                    statusLabels[supervisions[0].status],
                  ].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(supervisions[0])}
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
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول الإشرافات</div>
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
                value={degreeTypeFilter}
                onValueChange={(v) => {
                  setDegreeTypeFilter(v);
                  loadSupervisions({ degreeType: v });
                }}
              >
                <SelectTrigger
                  className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                  aria-label="نوع الدرجة"
                >
                  <SelectValue placeholder="الدرجة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الدرجات</SelectItem>
                  <SelectItem value="PHD">دكتوراه</SelectItem>
                  <SelectItem value="MASTERS">ماجستير</SelectItem>
                  <SelectItem value="BACHELORS">بكالوريوس</SelectItem>
                  <SelectItem value="HIGHER_DIPLOMA">دبلوم عالي</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  loadSupervisions({ status: v });
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
                  <SelectItem value="COMPLETED">مكتمل</SelectItem>
                  <SelectItem value="IN_PROGRESS">غير مكتمل</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={supervisionTypeFilter}
                onValueChange={(v) => {
                  setSupervisionTypeFilter(v);
                  loadSupervisions({ supervisionType: v });
                }}
              >
                <SelectTrigger
                  className="h-8 rounded-lg bg-white text-[10px] px-1.5 min-w-0 flex-1"
                  aria-label="نوع الإشراف"
                >
                  <SelectValue placeholder="الإشراف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الأنواع</SelectItem>
                  <SelectItem value="SOLE">منفرد</SelectItem>
                  <SelectItem value="JOINT">مشترك</SelectItem>
                </SelectContent>
              </Select>
              {uniqueYears.length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(v) => {
                    setYearFilter(v);
                    loadSupervisions({ year: v });
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
            <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في الإشرافات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
                {/* البحث */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <Input
                      placeholder="اسم الطالب أو عنوان الرسالة..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                      بحث
                    </Button>
                  </div>
                </div>
                {/* نوع الدرجة */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع الدرجة</label>
                  <Select
                    value={degreeTypeFilter}
                    onValueChange={(v) => {
                      setDegreeTypeFilter(v);
                      loadSupervisions({ degreeType: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="PHD">دكتوراه</SelectItem>
                      <SelectItem value="MASTERS">ماجستير</SelectItem>
                      <SelectItem value="BACHELORS">بكالوريوس</SelectItem>
                      <SelectItem value="HIGHER_DIPLOMA">دبلوم عالي</SelectItem>
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
                      loadSupervisions({ status: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="COMPLETED">مكتمل</SelectItem>
                      <SelectItem value="IN_PROGRESS">غير مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* نوع الإشراف */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع الإشراف</label>
                  <Select
                    value={supervisionTypeFilter}
                    onValueChange={(v) => {
                      setSupervisionTypeFilter(v);
                      loadSupervisions({ supervisionType: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="SOLE">منفرد</SelectItem>
                      <SelectItem value="JOINT">مشترك</SelectItem>
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
                        loadSupervisions({ year: v });
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
                <GraduationCap className="h-8 w-8 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold text-slate-800 mb-1 md:mb-2 text-center">
                {hasActiveFilters ? "لا توجد نتائج" : "لم يتم تسجيل أي إشراف بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {hasActiveFilters
                  ? "لا توجد إشرافات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول إشراف لك."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="sm"
                  className="md:h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" />
                  إضافة أول إشراف
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
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">اسم الطالب</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع الدرجة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">عنوان الرسالة/المشروع</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ البداية</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ الانتهاء</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الحالة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع الإشراف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            {supervisionActionsMenu(c)}
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {c.studentName}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {degreeTypeLabels[c.degreeType]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="text-sm text-slate-700 line-clamp-2" dir="rtl">
                              {c.thesisTitle}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(c.startDate)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {c.endDate ? formatDate(c.endDate) : "—"}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant={c.status === "COMPLETED" ? "default" : "secondary"} className={c.status === "COMPLETED" ? "bg-green-100 text-green-800" : ""}>
                              {statusLabels[c.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            {c.supervisionType ? (
                              <Badge variant="outline">
                                {supervisionTypeLabels[c.supervisionType]}
                              </Badge>
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
                          {c.studentName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[formatDate(c.startDate), degreeTypeLabels[c.degreeType], statusLabels[c.status]].join(" · ")}
                        </p>
                      </button>
                      {supervisionActionsMenu(c)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">عنوان الرسالة</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate" dir="rtl">
                          {c.thesisTitle}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">نوع الإشراف</p>
                        {c.supervisionType ? (
                          <p className="text-[11px] font-medium text-slate-800 truncate">
                            {supervisionTypeLabels[c.supervisionType]}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">—</p>
                        )}
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
              {editingSupervision ? "تعديل الإشراف" : "إضافة إشراف"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingSupervision
                ? "تعديل بيانات الإشراف."
                : "أدخل بيانات الإشراف. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="studentName" className="text-xs md:text-sm">اسم الطالب *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => setFormData((p) => ({ ...p, studentName: e.target.value }))}
                placeholder="اسم الطالب"
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">نوع الدرجة *</Label>
                <Select
                  value={formData.degreeType}
                  onValueChange={(v: "PHD" | "MASTERS" | "BACHELORS" | "HIGHER_DIPLOMA") => {
                    setFormData((p) => ({
                      ...p,
                      degreeType: v,
                      supervisionType: (v === "PHD" || v === "MASTERS") ? (p.supervisionType || "SOLE") : null,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHD">دكتوراه</SelectItem>
                    <SelectItem value="MASTERS">ماجستير</SelectItem>
                    <SelectItem value="BACHELORS">بكالوريوس</SelectItem>
                    <SelectItem value="HIGHER_DIPLOMA">دبلوم عالي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">حالة المشروع *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => {
                    setFormData((p) => ({
                      ...p,
                      status: v as "COMPLETED" | "IN_PROGRESS",
                      endDate: v === "COMPLETED" ? (p.endDate || null) : null,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">مكتمل</SelectItem>
                    <SelectItem value="IN_PROGRESS">غير مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="thesisTitle" className="text-xs md:text-sm">عنوان الرسالة/المشروع *</Label>
              <Input
                id="thesisTitle"
                value={formData.thesisTitle}
                onChange={(e) => setFormData((p) => ({ ...p, thesisTitle: e.target.value }))}
                placeholder="عنوان الرسالة أو المشروع"
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label htmlFor="startDate" className="text-xs md:text-sm">تاريخ البداية *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  max={getTodayISO()}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = getTodayISO();
                    if (selectedDate > today) {
                      showToast("تاريخ البداية لا يمكن أن يكون في المستقبل", "error");
                      return;
                    }
                    setFormData((p) => ({ ...p, startDate: selectedDate }));
                  }}
                  required
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
              {(formData.degreeType === "PHD" || formData.degreeType === "MASTERS") ? (
                <div className="min-w-0">
                  <Label className="text-xs md:text-sm">نوع الإشراف *</Label>
                  <Select
                    value={formData.supervisionType || "SOLE"}
                    onValueChange={(v: "SOLE" | "JOINT") => {
                      setFormData((p) => ({ ...p, supervisionType: v }));
                    }}
                  >
                    <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOLE">منفرد</SelectItem>
                      <SelectItem value="JOINT">مشترك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="min-w-0" />
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 -mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            {formData.status === "COMPLETED" && (
              <div>
                <Label htmlFor="endDate" className="text-xs md:text-sm">تاريخ الانتهاء *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  max={getTodayISO()}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = getTodayISO();
                    if (selectedDate > today) {
                      showToast("تاريخ الانتهاء لا يمكن أن يكون في المستقبل", "error");
                      return;
                    }
                    if (selectedDate < formData.startDate) {
                      showToast("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية", "error");
                      return;
                    }
                    setFormData((p) => ({ ...p, endDate: selectedDate }));
                  }}
                  required={formData.status === "COMPLETED"}
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
            )}
            <div>
              <Label htmlFor="description" className="text-xs md:text-sm">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن الإشراف..."
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
                ) : editingSupervision ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة الإشراف"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingSupervision(null))}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل الإشراف
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الإشراف المحددة</DialogDescription>
          </DialogHeader>
          {viewingSupervision && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingSupervision.studentName}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 line-clamp-2" dir="rtl">
                {[
                  degreeTypeLabels[viewingSupervision.degreeType],
                  statusLabels[viewingSupervision.status],
                  formatDate(viewingSupervision.startDate),
                ].join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">نوع الدرجة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {degreeTypeLabels[viewingSupervision.degreeType]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الحالة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {statusLabels[viewingSupervision.status]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">تاريخ البداية</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {formatDate(viewingSupervision.startDate)}
                  </p>
                </div>
                {viewingSupervision.endDate && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">تاريخ الانتهاء</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {formatDate(viewingSupervision.endDate)}
                    </p>
                  </div>
                )}
                {viewingSupervision.supervisionType && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">نوع الإشراف</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {supervisionTypeLabels[viewingSupervision.supervisionType]}
                    </p>
                  </div>
                )}
                <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">عنوان الرسالة/المشروع</p>
                  <p className="text-xs font-medium text-slate-900" dir="rtl">
                    {viewingSupervision.thesisTitle}
                  </p>
                </div>
                {viewingSupervision.description && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">الوصف</p>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap" dir="rtl">
                      {viewingSupervision.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-slate-600 mb-3" dir="rtl">
                  {viewingSupervision.thesisTitle}
                </p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-slate-500">نوع الدرجة</span>
                  <span className="font-medium text-slate-900">{degreeTypeLabels[viewingSupervision.degreeType]}</span>
                  <span className="text-slate-500">تاريخ البداية</span>
                  <span className="font-medium text-slate-900">{formatDate(viewingSupervision.startDate)}</span>
                  <span className="text-slate-500">الحالة</span>
                  <span className="font-medium text-slate-900">
                    <Badge variant={viewingSupervision.status === "COMPLETED" ? "default" : "secondary"} className={viewingSupervision.status === "COMPLETED" ? "bg-green-100 text-green-800" : ""}>
                      {statusLabels[viewingSupervision.status]}
                    </Badge>
                  </span>
                  {viewingSupervision.endDate && (
                    <>
                      <span className="text-slate-500">تاريخ الانتهاء</span>
                      <span className="font-medium text-slate-900">{formatDate(viewingSupervision.endDate)}</span>
                    </>
                  )}
                  {viewingSupervision.supervisionType && (
                    <>
                      <span className="text-slate-500">نوع الإشراف</span>
                      <span className="font-medium text-slate-900">{supervisionTypeLabels[viewingSupervision.supervisionType]}</span>
                    </>
                  )}
                  {viewingSupervision.description && (
                    <>
                      <span className="text-slate-500">الوصف</span>
                      <span className="font-medium text-slate-900" dir="rtl">
                        {viewingSupervision.description}
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
                  onClick={() => shareSupervisionViaWhatsApp(viewingSupervision)}
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
                    onClick={() => (setIsDetailsOpen(false), setViewingSupervision(null))}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingSupervision);
                      setViewingSupervision(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingSupervision.id)}
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
