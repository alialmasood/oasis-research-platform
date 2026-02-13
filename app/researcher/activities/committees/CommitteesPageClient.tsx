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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Users, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createCommittee, updateCommittee, deleteCommittee, listCommittees } from "./actions";
import { CommitteesKPICards, useCommitteesStats } from "./_components/CommitteesKPICards";
import type { Committee } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const roleLabels: Record<string, string> = { MEMBER: "عضو لجنة", CHAIRPERSON: "رئيس لجنة" };

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
function getContextSummary(committees: Committee[], stats: ReturnType<typeof useCommitteesStats>): string {
  if (committees.length === 0) {
    return "لم تُسجّل بعد في أي لجنة. ابدأ بإضافة لجنة.";
  }
  if (committees.length === 1) {
    const c = committees[0];
    const role = roleLabels[c.role];
    return `أنت مسجل حالياً في لجنة واحدة ${role}.`;
  }
  const { total, asMember, asChairperson } = stats;
  return `أنت مسجل حالياً في ${total} لجان: ${asMember} كعضو، ${asChairperson} كرئيس.`;
}

interface CommitteesPageClientProps {
  initialCommittees: Committee[];
}

export function CommitteesPageClient({ initialCommittees }: CommitteesPageClientProps) {
  const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [viewingCommittee, setViewingCommittee] = useState<Committee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadCommittees = (overrides?: {
    search?: string;
    role?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const role = overrides?.role ?? roleFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listCommittees({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        role: role === "__all__" ? undefined : role,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setCommittees(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCommittees();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    role: roleFilter === "__all__" ? undefined : roleFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listCommittees(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((c: Committee) => ({
      العنوان: c.title ?? "",
      الدور: roleLabels[c.role] ?? c.role,
      التاريخ: formatDateCell(c.assignmentDate),
      الوصف: c.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(c.createdAt),
      "آخر تحديث": formatDateCell(c.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "اللجان");
    XLSX.writeFile(workbook, "committees-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listCommittees(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (c: Committee) => `
        <tr>
          <td>${c.title ?? "-"}</td>
          <td>${roleLabels[c.role] ?? c.role}</td>
          <td>${formatDateCell(c.assignmentDate)}</td>
          <td>${c.description ?? "-"}</td>
          <td>${formatDateCell(c.createdAt)}</td>
          <td>${formatDateCell(c.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير اللجان</title>
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
          <h1>تقرير اللجان</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الدور</th>
                <th>التاريخ</th>
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

  const stats = useCommitteesStats(committees);
  const filteredForDisplay = committees;

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(committees.map((c) => new Date(c.assignmentDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    assignmentDate: getTodayISO(),
    role: "MEMBER" as "MEMBER" | "CHAIRPERSON",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: formData.title,
        assignmentDate: new Date(formData.assignmentDate),
        role: formData.role,
        description: formData.description || null,
      };
      const result = editingCommittee
        ? await updateCommittee({ ...payload, id: editingCommittee.id })
        : await createCommittee(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingCommittee ? "✅ تم تحديث اللجنة بنجاح" : "✅ تم إضافة اللجنة بنجاح");
      setIsAddOpen(false);
      setEditingCommittee(null);
      setFormData({
        title: "",
        assignmentDate: getTodayISO(),
        role: "MEMBER",
        description: "",
      });
      loadCommittees();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (committee?: Committee) => {
    if (committee) {
      setEditingCommittee(committee);
      const d = new Date(committee.assignmentDate);
      setFormData({
        title: committee.title,
        assignmentDate: d.toISOString().slice(0, 10),
        role: committee.role,
        description: committee.description || "",
      });
    } else {
      setEditingCommittee(null);
      setFormData({
        title: "",
        assignmentDate: getTodayISO(),
        role: "MEMBER",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingCommittee(null);
    setFormData({
      title: "",
      assignmentDate: getTodayISO(),
      role: "MEMBER",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللجنة؟")) return;
    startTransition(async () => {
      const result = await deleteCommittee(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف اللجنة بنجاح");
      setIsDetailsOpen(false);
      setViewingCommittee(null);
      loadCommittees();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Committee) => {
    setViewingCommittee(s);
    setIsDetailsOpen(true);
  };

  const shareCommitteeViaWhatsApp = (c: Committee) => {
    const lines: string[] = [
      `*${c.title}*`,
      `تاريخ التكليف: ${formatDate(c.assignmentDate)}`,
      `نوع التكليف: ${roleLabels[c.role]}`,
    ];
    if (c.description) {
      lines.push(`الوصف: ${c.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد اللجان": item.value,
  }));

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">اللجان</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل مشاركاتك في اللجان الأكاديمية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة لجنة
        </Button>
      </div>

      <CommitteesKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          {/* نوع التكليف (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">نوع التكليف</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.rolePieData.length > 0 ? (
                  <PieChart
                    data={stats.rolePieData}
                    tooltipLabel={(name, value) => `عدد اللجان كمشارك ${name}: ${value}`}
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
              {stats.rolePieData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع المشاركة (محاضر / مشترك)
                </p>
              )}
            </CardContent>
          </Card>

          {/* عدد اللجان حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد اللجان حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد اللجان"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد اللجان في ${year}: ${count}`}
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
                  (a, b) => (b["عدد اللجان"] > a["عدد اللجان"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة لجان: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد اللجان"]} لجنة)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* نوع التكليف عبر الزمن (Stacked Bar) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">نوع التكليف عبر الزمن</CardTitle>
              <p className="text-xs text-slate-500 mt-1">عضو لجنة vs رئيس لجنة — مفيد للتقييم العلمي وملف الترقيات</p>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.roleByYear.length > 0 ? (
                  <BarChart
                    data={stats.roleByYear}
                    dataKeys={["عضو", "رئيس"]}
                    colors={["#2563EB", "#f59e0b"]}
                    stackId="role"
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {stats.roleByYear.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع التكليف (عضو لجنة / رئيس لجنة) حسب السنة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر لجنة مضافة */}
      {committees.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر لجنة مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {committees[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(committees[0].assignmentDate)}
                  </span>
                  <Badge
                    variant={committees[0].role === "CHAIRPERSON" ? "default" : "secondary"}
                    className={committees[0].role === "CHAIRPERSON" ? "bg-amber-100 text-amber-800" : ""}
                  >
                    {roleLabels[committees[0].role]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(committees[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول اللجان</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في اللجان</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
              {/* البحث */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="عنوان اللجنة..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
              </div>
              {/* الجهة المستفيدة */}
              {/* نوع التكليف */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع التكليف</label>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v);
                    loadCommittees({ role: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    <SelectItem value="MEMBER">عضو لجنة</SelectItem>
                    <SelectItem value="CHAIRPERSON">رئيس لجنة</SelectItem>
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
                      loadCommittees({ year: v });
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
                <Users className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || roleFilter !== "__all__" || roleFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي لجنة بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || roleFilter !== "__all__" || roleFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد ندوات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول لجنة لك."}
              </p>
              {!search && roleFilter === "__all__" && roleFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول لجنة
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
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">عنوان اللجنة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ التكليف</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع التكليف</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                    if (confirm("هل أنت متأكد من حذف هذه اللجنة؟")) {
                                      startTransition(async () => {
                                        const res = await deleteCommittee(c.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف اللجنة بنجاح");
                                          loadCommittees();
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
                              {c.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(c.assignmentDate)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge
                              variant={c.role === "CHAIRPERSON" ? "default" : "secondary"}
                              className={c.role === "CHAIRPERSON" ? "bg-amber-100 text-amber-800" : ""}
                            >
                              {roleLabels[c.role]}
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
                                      setViewingCommittee(c);
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
              <div className="md:hidden space-y-3">
                {filteredForDisplay.map((c) => (
                  <Card key={c.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {c.title}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                                if (confirm("هل أنت متأكد من حذف هذه اللجنة؟")) {
                                  startTransition(async () => {
                                    const res = await deleteCommittee(c.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف اللجنة بنجاح");
                                      loadCommittees();
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
                            {formatDate(c.assignmentDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">نوع التكليف:</span>
                          <Badge
                            variant={c.role === "CHAIRPERSON" ? "default" : "secondary"}
                            className={c.role === "CHAIRPERSON" ? "bg-amber-100 text-amber-800 mr-2" : "mr-2"}
                          >
                            {roleLabels[c.role]}
                          </Badge>
                        </div>
                      </div>
                      {c.description && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingCommittee(c);
                              setIsDetailsOpen(true);
                            }}
                          >
                            عرض الوصف
                          </Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCommittee ? "تعديل اللجنة" : "إضافة لجنة"}</DialogTitle>
            <DialogDescription>
              {editingCommittee
                ? "تعديل بيانات اللجنة."
                : "أدخل بيانات اللجنة. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان اللجنة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان اللجنة"
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
              <Label>نوع التكليف *</Label>
              <Select
                value={formData.role}
                onValueChange={(v: "MEMBER" | "CHAIRPERSON") =>
                  setFormData((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">عضو لجنة</SelectItem>
                  <SelectItem value="CHAIRPERSON">رئيس لجنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن اللجنة..."
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
                ) : editingCommittee ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة اللجنة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingCommittee(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل اللجنة
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل اللجنة المحددة</DialogDescription>
          </DialogHeader>
          {viewingCommittee && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingCommittee.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={viewingCommittee.role === "CHAIRPERSON" ? "default" : "secondary"}
                  className={viewingCommittee.role === "CHAIRPERSON" ? "bg-amber-100 text-amber-800" : ""}
                >
                  {roleLabels[viewingCommittee.role]}
                </Badge>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">تاريخ التكليف</span>
                <span className="font-medium text-slate-900">{formatDate(viewingCommittee.assignmentDate)}</span>
                {viewingCommittee.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingCommittee.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareCommitteeViaWhatsApp(viewingCommittee)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingCommittee(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingCommittee);
                    setViewingCommittee(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingCommittee.id)}
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
