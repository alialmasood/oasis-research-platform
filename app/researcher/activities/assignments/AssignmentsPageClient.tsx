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
import { Plus, MoreVertical, Eye, Trash2, Calendar, ClipboardList, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createAssignment, updateAssignment, deleteAssignment, listAssignments } from "./actions";
import { AssignmentsKPICards, useAssignmentsStats } from "./_components/AssignmentsKPICards";
import type { Assignment } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const statusLabels: Record<string, string> = { COMPLETED: "منتهي", IN_PROGRESS: "غير منتهي" };

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

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(assignments: Assignment[], stats: ReturnType<typeof useAssignmentsStats>): string {
  if (assignments.length === 0) {
    return "لم تُسجّل بعد أي تكليف. ابدأ بإضافة تكليف.";
  }
  if (assignments.length === 1) {
    const a = assignments[0];
    const status = statusLabels[a.status];
    return `لديك تكليف واحد ${status}.`;
  }
  const { total, completed, inProgress } = stats;
  return `لديك ${total} تكليفات: ${completed} منتهي، ${inProgress} غير منتهي.`;
}

interface AssignmentsPageClientProps {
  initialAssignments: Assignment[];
}

export function AssignmentsPageClient({ initialAssignments }: AssignmentsPageClientProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadAssignments = (overrides?: {
    search?: string;
    status?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const status = overrides?.status ?? statusFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listAssignments({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        status: status === "__all__" ? undefined : status,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error ?? "حدث خطأ غير متوقع", "error");
        return;
      }
      setAssignments(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssignments();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    status: statusFilter === "__all__" ? undefined : statusFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listAssignments(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error ?? "حدث خطأ غير متوقع", "error");
      return;
    }

    const rows = result.items.map((a: Assignment) => ({
      العنوان: a.title ?? "",
      التاريخ: formatDateCell(a.assignmentDate),
      الحالة: statusLabels[a.status] ?? a.status,
      "تاريخ الإنجاز": a.completionDate ? formatDateCell(a.completionDate) : "—",
      الوصف: a.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(a.createdAt),
      "آخر تحديث": formatDateCell(a.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التكليفات");
    XLSX.writeFile(workbook, "assignments-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listAssignments(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error ?? "حدث خطأ غير متوقع", "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (a: Assignment) => `
        <tr>
          <td>${a.title ?? "-"}</td>
          <td>${formatDateCell(a.assignmentDate)}</td>
          <td>${statusLabels[a.status] ?? a.status}</td>
          <td>${a.completionDate ? formatDateCell(a.completionDate) : "-"}</td>
          <td>${a.description ?? "-"}</td>
          <td>${formatDateCell(a.createdAt)}</td>
          <td>${formatDateCell(a.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير التكليفات</title>
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
          <h1>تقرير التكليفات</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>تاريخ الإنجاز</th>
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

  const stats = useAssignmentsStats(assignments);
  const filteredForDisplay = assignments;

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد التكليفات": item.value,
  }));

  const statusPieData = [
    ...(stats.completed > 0 ? [{ name: "منتهي", value: stats.completed, color: "#10b981" }] : []),
    ...(stats.inProgress > 0 ? [{ name: "غير منتهي", value: stats.inProgress, color: "#f59e0b" }] : []),
  ].filter((d) => d.value > 0);

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(assignments.map((a) => new Date(a.assignmentDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    assignmentDate: getTodayISO(),
    status: "IN_PROGRESS" as "COMPLETED" | "IN_PROGRESS",
    completionDate: "",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: formData.title,
        assignmentDate: new Date(formData.assignmentDate),
        status: formData.status,
        completionDate: formData.status === "COMPLETED" && formData.completionDate ? new Date(formData.completionDate) : null,
        description: formData.description || null,
      };
      const result = editingAssignment
        ? await updateAssignment({ ...payload, id: editingAssignment.id })
        : await createAssignment(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingAssignment ? "✅ تم تحديث التكليف بنجاح" : "✅ تم إضافة التكليف بنجاح");
      setIsAddOpen(false);
      setEditingAssignment(null);
      setFormData({
        title: "",
        assignmentDate: getTodayISO(),
        status: "IN_PROGRESS",
        completionDate: "",
        description: "",
      });
      loadAssignments();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      const assignmentD = new Date(assignment.assignmentDate);
      setFormData({
        title: assignment.title,
        assignmentDate: assignmentD.toISOString().slice(0, 10),
        status: assignment.status,
        completionDate: assignment.completionDate ? new Date(assignment.completionDate).toISOString().slice(0, 10) : "",
        description: assignment.description || "",
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: "",
        assignmentDate: getTodayISO(),
        status: "IN_PROGRESS",
        completionDate: "",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingAssignment(null);
    setFormData({
      title: "",
      assignmentDate: getTodayISO(),
      status: "IN_PROGRESS",
      completionDate: "",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التكليف؟")) return;
    startTransition(async () => {
      const result = await deleteAssignment(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف التكليف بنجاح");
      setIsDetailsOpen(false);
      setViewingAssignment(null);
      loadAssignments();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (a: Assignment) => {
    setViewingAssignment(a);
    setIsDetailsOpen(true);
  };

  const shareAssignmentViaWhatsApp = (a: Assignment) => {
    const lines: string[] = [
      `*${a.title}*`,
      `تاريخ التكليف: ${formatDate(a.assignmentDate)}`,
      `الحالة: ${statusLabels[a.status]}`,
    ];
    if (a.completionDate) {
      lines.push(`تاريخ الانتهاء: ${formatDate(a.completionDate)}`);
    }
    if (a.description) {
      lines.push(`الوصف: ${a.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">التكليفات</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل تكليفاتك الأكاديمية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة تكليف
        </Button>
      </div>

      <AssignmentsKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          {/* حالة التكليفات (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">حالة التكليفات</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {statusPieData.length > 0 ? (
                  <PieChart
                    data={statusPieData}
                    tooltipLabel={(name, value) => `عدد التكليفات ${name}: ${value}`}
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
              {statusPieData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الحالة (منتهي / غير منتهي)
                </p>
              )}
            </CardContent>
          </Card>

          {/* عدد التكليفات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد التكليفات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد التكليفات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد التكليفات في ${year}: ${count}`}
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
                  (a, b) => (b["عدد التكليفات"] > a["عدد التكليفات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة تكليفات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد التكليفات"]} تكليف)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* حالة التكليفات عبر الزمن (Stacked Bar) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">حالة التكليفات عبر الزمن</CardTitle>
              <p className="text-xs text-slate-500 mt-1">منتهي vs غير منتهي — مفيد لمتابعة التقدم</p>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.statusByYear.length > 0 ? (
                  <BarChart
                    data={stats.statusByYear}
                    dataKeys={["منتهي", "غير منتهي"]}
                    colors={["#10b981", "#f59e0b"]}
                    stackId="status"
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {stats.statusByYear.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الحالة (منتهي / غير منتهي) حسب السنة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر تكليف مضافة */}
      {assignments.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر تكليف مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {assignments[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(assignments[0].assignmentDate)}
                  </span>
                  <Badge
                    variant={assignments[0].status === "COMPLETED" ? "default" : "secondary"}
                    className={assignments[0].status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                  >
                    {statusLabels[assignments[0].status]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(assignments[0])}
                className="flex-shrink-0"
              >
                <Eye className="h-4 w-4 ml-2" />
                عرض
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-base font-semibold text-slate-800">جدول التكليفات</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في التكليفات</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end" dir="rtl">
              {/* البحث */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="موضوع التكليف، الوصف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
              </div>
              {/* الحالة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    loadAssignments({ status: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    <SelectItem value="COMPLETED">منتهي</SelectItem>
                    <SelectItem value="IN_PROGRESS">غير منتهي</SelectItem>
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
                      loadAssignments({ year: v });
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
                <ClipboardList className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || statusFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي تكليف بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || statusFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد تكليفات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول تكليف لك."}
              </p>
              {!search && statusFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول تكليف
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
                      <col style={{ width: "30%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">موضوع التكليف</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ التكليف</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الحالة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ الانتهاء</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((a) => (
                        <TableRow key={a.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(a)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(a)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا التكليف؟")) {
                                      startTransition(async () => {
                                        const res = await deleteAssignment(a.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف التكليف بنجاح");
                                          loadAssignments();
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
                              {a.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(a.assignmentDate)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge
                              variant={a.status === "COMPLETED" ? "default" : "secondary"}
                              className={a.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                            >
                              {statusLabels[a.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {a.completionDate ? formatDate(a.completionDate) : <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell className="align-middle">
                            {a.description ? (
                              a.description.length > 30 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-1 flex-1" dir="rtl">
                                    {a.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setViewingAssignment(a);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {a.description}
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
                {filteredForDisplay.map((a) => (
                  <Card key={a.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {a.title}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(a)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(a)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا التكليف؟")) {
                                  startTransition(async () => {
                                    const res = await deleteAssignment(a.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف التكليف بنجاح");
                                      loadAssignments();
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
                          <span className="text-slate-500">تاريخ التكليف:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(a.assignmentDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">تاريخ الانتهاء:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {a.completionDate ? formatDate(a.completionDate) : <span className="text-slate-400">—</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <Badge
                          variant={a.status === "COMPLETED" ? "default" : "secondary"}
                          className={a.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                        >
                          {statusLabels[a.status]}
                        </Badge>
                        {a.description && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingAssignment(a);
                              setIsDetailsOpen(true);
                            }}
                          >
                            عرض الوصف
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "تعديل التكليف" : "إضافة تكليف"}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? "تعديل بيانات التكليف."
                : "أدخل بيانات التكليف. تاريخ التكليف لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">موضوع التكليف *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="موضوع التكليف"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="assignmentDate">تاريخ التكليف *</Label>
              <Input
                id="assignmentDate"
                type="date"
                value={formData.assignmentDate}
                max={getTodayISO()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayISO();
                  if (selectedDate > today) {
                    showToast("تاريخ التكليف لا يمكن أن يكون في المستقبل", "error");
                    return;
                  }
                  setFormData((p) => ({ ...p, assignmentDate: selectedDate }));
                }}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>
            <div>
              <Label>حالة التكليف *</Label>
              <Select
                value={formData.status}
                onValueChange={(v: "COMPLETED" | "IN_PROGRESS") => {
                  setFormData((p) => ({
                    ...p,
                    status: v,
                    completionDate: v === "IN_PROGRESS" ? "" : p.completionDate,
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PROGRESS">غير منتهي</SelectItem>
                  <SelectItem value="COMPLETED">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === "COMPLETED" && (
              <div>
                <Label htmlFor="completionDate">تاريخ الانتهاء *</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={formData.completionDate}
                  max={getTodayISO()}
                  min={formData.assignmentDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = getTodayISO();
                    if (selectedDate > today) {
                      showToast("تاريخ الانتهاء لا يمكن أن يكون في المستقبل", "error");
                      return;
                    }
                    if (selectedDate < formData.assignmentDate) {
                      showToast("تاريخ الانتهاء يجب أن يكون بعد تاريخ التكليف", "error");
                      return;
                    }
                    setFormData((p) => ({ ...p, completionDate: selectedDate }));
                  }}
                  required={formData.status === "COMPLETED"}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل أو قبل تاريخ التكليف</p>
              </div>
            )}
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن التكليف..."
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
                ) : editingAssignment ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة التكليف"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingAssignment(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل التكليف
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل التكليف المحدد</DialogDescription>
          </DialogHeader>
          {viewingAssignment && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingAssignment.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={viewingAssignment.status === "COMPLETED" ? "default" : "secondary"}
                  className={viewingAssignment.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                >
                  {statusLabels[viewingAssignment.status]}
                </Badge>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">تاريخ التكليف</span>
                <span className="font-medium text-slate-900">{formatDate(viewingAssignment.assignmentDate)}</span>
                {viewingAssignment.completionDate && (
                  <>
                    <span className="text-slate-500">تاريخ الانتهاء</span>
                    <span className="font-medium text-slate-900">{formatDate(viewingAssignment.completionDate)}</span>
                  </>
                )}
                {viewingAssignment.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingAssignment.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareAssignmentViaWhatsApp(viewingAssignment)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingAssignment(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingAssignment);
                    setViewingAssignment(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingAssignment.id)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
