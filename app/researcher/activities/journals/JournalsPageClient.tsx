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
import { Plus, MoreVertical, Eye, Trash2, Calendar, BookOpen, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createJournal, updateJournal, deleteJournal, listJournals } from "./actions";
import { JournalsKPICards, useJournalsStats } from "./_components/JournalsKPICards";
import type { Journal } from "@prisma/client";
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

const roleLabels: Record<string, string> = {
  EDITOR_IN_CHIEF: "مدير تحرير",
  ASSOCIATE_EDITOR: "محرر مساعد",
  EDITORIAL_BOARD: "عضو هيئة تحرير",
  REVIEWER: "محكم",
};

const typeLabels: Record<string, string> = {
  LOCAL: "محلية",
  INTERNATIONAL: "عالمية",
  ARABIC: "عربية",
  ENGLISH: "إنجليزية",
};

const roleColors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6"];

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(journals: Journal[], stats: ReturnType<typeof useJournalsStats>): string {
  if (journals.length === 0) {
    return "لم تُسجّل بعد في أي مجلة. ابدأ بإضافة عضوية.";
  }
  if (journals.length === 1) {
    return `لديك عضوية في مجلة واحدة.`;
  }
  const { total, active } = stats;
  return `لديك ${total} عضوية في مجلات (${active} نشط حالياً).`;
}

interface JournalsPageClientProps {
  initialJournals: Journal[];
}

export function JournalsPageClient({ initialJournals }: JournalsPageClientProps) {
  const [journals, setJournals] = useState<Journal[]>(initialJournals);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadJournals = (overrides?: {
    search?: string;
    role?: string;
    type?: string;
    isActive?: boolean;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const role = overrides?.role ?? roleFilter;
      const type = overrides?.type ?? typeFilter;
      const status = overrides?.isActive !== undefined ? overrides.isActive : (statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined);
      const year = overrides?.year ?? yearFilter;
      const result = await listJournals({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        role: role === "__all__" ? undefined : role,
        type: type === "__all__" ? undefined : type,
        isActive: status,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setJournals(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJournals();
  };

  const getExportFilters = () => {
    const isActive =
      statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
    return {
      search: search.trim() || undefined,
      role: roleFilter === "__all__" ? undefined : roleFilter,
      type: typeFilter === "__all__" ? undefined : typeFilter,
      isActive,
      year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
    };
  };

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listJournals(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((j: Journal) => ({
      "اسم المجلة": j.name ?? "",
      الدور: roleLabels[j.role] ?? j.role,
      النوع: typeLabels[j.type] ?? j.type,
      "تاريخ البداية": formatDateCell(j.startDate),
      "تاريخ الانتهاء": j.endDate ? formatDateCell(j.endDate) : "—",
      الحالة: j.isActive ? "نشط" : "منتهي",
      "عامل التأثير": j.impactFactor ?? "—",
      الوصف: j.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(j.createdAt),
      "آخر تحديث": formatDateCell(j.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "العضويات");
    XLSX.writeFile(workbook, "journals-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listJournals(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (j: Journal) => `
        <tr>
          <td>${j.name ?? "-"}</td>
          <td>${roleLabels[j.role] ?? j.role}</td>
          <td>${typeLabels[j.type] ?? j.type}</td>
          <td>${formatDateCell(j.startDate)}</td>
          <td>${j.endDate ? formatDateCell(j.endDate) : "-"}</td>
          <td>${j.isActive ? "نشط" : "منتهي"}</td>
          <td>${j.impactFactor ?? "-"}</td>
          <td>${j.description ?? "-"}</td>
          <td>${formatDateCell(j.createdAt)}</td>
          <td>${formatDateCell(j.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير العضويات</title>
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
          <h1>تقرير العضويات</h1>
          <table>
            <thead>
              <tr>
                <th>اسم المجلة</th>
                <th>الدور</th>
                <th>النوع</th>
                <th>تاريخ البداية</th>
                <th>تاريخ الانتهاء</th>
                <th>الحالة</th>
                <th>عامل التأثير</th>
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

  const stats = useJournalsStats(journals);
  const filteredForDisplay = journals;

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(journals.map((j) => new Date(j.startDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    name: "",
    role: "EDITOR_IN_CHIEF" as "EDITOR_IN_CHIEF" | "ASSOCIATE_EDITOR" | "EDITORIAL_BOARD" | "REVIEWER",
    type: "LOCAL" as "LOCAL" | "INTERNATIONAL" | "ARABIC" | "ENGLISH",
    startDate: getTodayISO(),
    isActive: true,
    endDate: "" as string | null,
    impactFactor: "" as string | null,
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name: formData.name,
        role: formData.role,
        type: formData.type,
        startDate: new Date(formData.startDate),
        isActive: formData.isActive,
        endDate: formData.isActive ? null : (formData.endDate ? new Date(formData.endDate) : null),
        impactFactor: formData.impactFactor ? parseFloat(formData.impactFactor) : null,
        description: formData.description || null,
      };
      const result = editingJournal
        ? await updateJournal({ ...payload, id: editingJournal.id })
        : await createJournal(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingJournal ? "✅ تم تحديث العضوية بنجاح" : "✅ تم إضافة العضوية بنجاح");
      setIsAddOpen(false);
      setEditingJournal(null);
      setFormData({
        name: "",
        role: "EDITOR_IN_CHIEF",
        type: "LOCAL",
        startDate: getTodayISO(),
        isActive: true,
        endDate: null,
        impactFactor: null,
        description: "",
      });
      loadJournals();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (journal?: Journal) => {
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        name: journal.name,
        role: journal.role,
        type: journal.type,
        startDate: new Date(journal.startDate).toISOString().slice(0, 10),
        isActive: journal.isActive,
        endDate: journal.endDate ? new Date(journal.endDate).toISOString().slice(0, 10) : null,
        impactFactor: journal.impactFactor ? String(journal.impactFactor) : null,
        description: journal.description || "",
      });
    } else {
      setEditingJournal(null);
      setFormData({
        name: "",
        role: "EDITOR_IN_CHIEF",
        type: "LOCAL",
        startDate: getTodayISO(),
        isActive: true,
        endDate: null,
        impactFactor: null,
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingJournal(null);
    setFormData({
      name: "",
      role: "EDITOR_IN_CHIEF",
      type: "LOCAL",
      startDate: getTodayISO(),
      isActive: true,
      endDate: null,
      impactFactor: null,
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه العضوية؟")) return;
    startTransition(async () => {
      const result = await deleteJournal(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف العضوية بنجاح");
      setIsDetailsOpen(false);
      setViewingJournal(null);
      loadJournals();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Journal) => {
    setViewingJournal(s);
    setIsDetailsOpen(true);
  };

  const shareJournalViaWhatsApp = (c: Journal) => {
    const lines: string[] = [
      `*${c.name}*`,
      `الدور: ${roleLabels[c.role]}`,
      `نوع المجلة: ${typeLabels[c.type]}`,
      `تاريخ البداية: ${formatDate(c.startDate)}`,
      `الحالة: ${c.isActive ? "نشط" : "غير نشط"}`,
    ];
    if (c.endDate) {
      lines.push(`تاريخ النهاية: ${formatDate(c.endDate)}`);
    }
    if (c.impactFactor !== null) {
      lines.push(`معامل التأثير: ${c.impactFactor}`);
    }
    if (c.description) {
      lines.push(`الوصف: ${c.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const journalActionsMenu = (c: Journal) => (
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
            if (confirm("هل أنت متأكد من حذف هذه العضوية؟")) {
              startTransition(async () => {
                const res = await deleteJournal(c.id);
                if (res.error) showToast(res.error, "error");
                else {
                  showToast("✅ تم حذف العضوية بنجاح");
                  loadJournals();
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
    "عدد العضويات": item.value,
  }));

  const byRoleData = stats.byRole.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: roleColors[index % roleColors.length],
  }));

  const byTypeData = stats.byType.map((item) => ({
    name: item.name,
    "عدد العضويات": item.value,
  }));

  const hasActiveFilters =
    Boolean(search) ||
    roleFilter !== "__all__" ||
    typeFilter !== "__all__" ||
    statusFilter !== "__all__" ||
    yearFilter !== "__all__";

  return (
    <div className="space-y-3 md:space-y-6 min-w-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">إدارة المجلات</h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">سجّل عضوياتك في المجلات الأكاديمية</p>
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
          <span className="hidden md:inline">إضافة عضوية</span>
        </Button>
      </div>

      <JournalsKPICards stats={stats} />

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
                    dataKeys={["عدد العضويات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد العضويات في ${year}: ${count}`}
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
                  توزيع الأدوار
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {byRoleData.length > 0 ? (
                    <PieChart
                      data={byRoleData}
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
                  ملخص العضويات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1 flex items-center justify-center h-[130px]">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums text-gray-900 leading-none">
                    {stats.total}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {stats.active} نشط · {stats.inactive} منتهي
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">أنواع المجلات</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {byTypeData.length > 0 ? (
                  <BarChart
                    data={byTypeData}
                    dataKeys={["عدد العضويات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد العضويات في ${name}: ${count}`}
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
          {/* الصف الأول: عدد العضويات حسب السنة (أكبر) + توزيع الأدوار (أصغر) */}
          {/* عدد العضويات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد العضويات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد العضويات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد العضويات في ${year}: ${count}`}
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
                  (a, b) => (b["عدد العضويات"] > a["عدد العضويات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة عضويات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد العضويات"]} عضوية)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* توزيع الأدوار (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع الأدوار</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byRoleData.length > 0 ? (
                  <PieChart
                    data={byRoleData}
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
              {byRoleData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الأدوار في المجلات
                </p>
              )}
            </CardContent>
          </Card>

          {/* الصف الثاني: توزيع أنواع المجلات (كامل العرض) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع أنواع المجلات</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byTypeData.length > 0 ? (
                  <BarChart
                    data={byTypeData}
                    dataKeys={["عدد العضويات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد العضويات في ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byTypeData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع أنواع المجلات (محلية، عالمية، عربية، إنجليزية)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر عضوية مضافة */}
      {journals.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg border-l-4 border-l-blue-500 gap-0 overflow-hidden rounded-xl">
          <CardContent className="p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">آخر عضوية مضافة</span>
                </div>
                <h3 className="text-xs md:text-base font-semibold text-slate-900 mb-0.5 md:mb-1 line-clamp-1" dir="rtl">
                  {journals[0].name}
                </h3>
                <p className="text-[10px] md:text-sm text-slate-600 truncate">
                  {[formatDate(journals[0].startDate), roleLabels[journals[0].role]].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(journals[0])}
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
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول العضويات</div>
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

          {/* فلاتر موبايل */}
          <form onSubmit={handleSearchSubmit} className="md:hidden rounded-xl bg-slate-50 p-2 space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-0.5">
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0 text-[11px] px-2"
              />
              <Button type="submit" variant="secondary" size="sm" className="h-7 rounded-md px-2.5 text-[11px] shrink-0">
                بحث
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  loadJournals({ role: v });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="الدور">
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الأدوار</SelectItem>
                  <SelectItem value="EDITOR_IN_CHIEF">مدير تحرير</SelectItem>
                  <SelectItem value="ASSOCIATE_EDITOR">محرر مساعد</SelectItem>
                  <SelectItem value="EDITORIAL_BOARD">عضو هيئة تحرير</SelectItem>
                  <SelectItem value="REVIEWER">محكم</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  loadJournals({ type: v });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="نوع المجلة">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الأنواع</SelectItem>
                  <SelectItem value="LOCAL">محلية</SelectItem>
                  <SelectItem value="INTERNATIONAL">عالمية</SelectItem>
                  <SelectItem value="ARABIC">عربية</SelectItem>
                  <SelectItem value="ENGLISH">إنجليزية</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  loadJournals({ isActive: v === "active" ? true : v === "inactive" ? false : undefined });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="الحالة">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
              {uniqueYears.length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(v) => {
                    setYearFilter(v);
                    loadJournals({ year: v });
                  }}
                >
                  <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="السنة">
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
            <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في العضويات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
                {/* البحث */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <Input
                      placeholder="اسم المجلة..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                      بحث
                    </Button>
                  </div>
                </div>
                {/* الدور */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الدور</label>
                  <Select
                    value={roleFilter}
                    onValueChange={(v) => {
                      setRoleFilter(v);
                      loadJournals({ role: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="EDITOR_IN_CHIEF">مدير تحرير</SelectItem>
                      <SelectItem value="ASSOCIATE_EDITOR">محرر مساعد</SelectItem>
                      <SelectItem value="EDITORIAL_BOARD">عضو هيئة تحرير</SelectItem>
                      <SelectItem value="REVIEWER">محكم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* نوع المجلة */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع المجلة</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setTypeFilter(v);
                      loadJournals({ type: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="LOCAL">محلية</SelectItem>
                      <SelectItem value="INTERNATIONAL">عالمية</SelectItem>
                      <SelectItem value="ARABIC">عربية</SelectItem>
                      <SelectItem value="ENGLISH">إنجليزية</SelectItem>
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
                      loadJournals({ isActive: v === "active" ? true : v === "inactive" ? false : undefined });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
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
                        loadJournals({ year: v });
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
                <BookOpen className="h-8 w-8 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold text-slate-800 mb-1 md:mb-2 text-center">
                {hasActiveFilters ? "لا توجد نتائج" : "لم يتم تسجيل أي عضوية بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {hasActiveFilters
                  ? "لا توجد عضويات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول عضوية لك."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="sm"
                  className="md:h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" />
                  إضافة أول عضوية
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
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">اسم المجلة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الدور</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ البداية</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            {journalActionsMenu(c)}
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {c.name}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {roleLabels[c.role]}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(c.startDate)}
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
                                      setViewingJournal(c);
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
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[formatDate(c.startDate), roleLabels[c.role]].join(" · ")}
                        </p>
                      </button>
                      {journalActionsMenu(c)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">نوع المجلة</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {typeLabels[c.type]}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">الوصف</p>
                        {c.description ? (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-blue-600 truncate block w-full text-right"
                            onClick={() => {
                              setViewingJournal(c);
                              setIsDetailsOpen(true);
                            }}
                          >
                            عرض التفاصيل
                          </button>
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
              {editingJournal ? "تعديل العضوية" : "إضافة عضوية"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingJournal
                ? "تعديل بيانات العضوية في المجلة."
                : "أدخل بيانات العضوية في المجلة. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs md:text-sm">اسم المجلة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="اسم المجلة"
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">الدور في المجلة *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v: "EDITOR_IN_CHIEF" | "ASSOCIATE_EDITOR" | "EDITORIAL_BOARD" | "REVIEWER") =>
                    setFormData((p) => ({ ...p, role: v }))
                  }
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR_IN_CHIEF">مدير تحرير</SelectItem>
                    <SelectItem value="ASSOCIATE_EDITOR">محرر مساعد</SelectItem>
                    <SelectItem value="EDITORIAL_BOARD">عضو هيئة تحرير</SelectItem>
                    <SelectItem value="REVIEWER">محكم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">نوع المجلة *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: "LOCAL" | "INTERNATIONAL" | "ARABIC" | "ENGLISH") =>
                    setFormData((p) => ({ ...p, type: v }))
                  }
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOCAL">محلية</SelectItem>
                    <SelectItem value="INTERNATIONAL">عالمية</SelectItem>
                    <SelectItem value="ARABIC">عربية</SelectItem>
                    <SelectItem value="ENGLISH">إنجليزية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">الحالة *</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(v) => {
                    setFormData((p) => ({ ...p, isActive: v === "active", endDate: v === "active" ? null : p.endDate }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط حالياً</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 -mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            {!formData.isActive && (
              <div>
                <Label htmlFor="endDate" className="text-xs md:text-sm">تاريخ النهاية *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  max={getTodayISO()}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = getTodayISO();
                    if (selectedDate > today) {
                      showToast("تاريخ النهاية لا يمكن أن يكون في المستقبل", "error");
                      return;
                    }
                    if (selectedDate < formData.startDate) {
                      showToast("تاريخ النهاية يجب أن يكون بعد تاريخ البداية", "error");
                      return;
                    }
                    setFormData((p) => ({ ...p, endDate: selectedDate }));
                  }}
                  required={!formData.isActive}
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
            )}
            <div>
              <Label htmlFor="impactFactor" className="text-xs md:text-sm">معامل التأثير (اختياري)</Label>
              <Input
                id="impactFactor"
                type="number"
                step="0.01"
                min="0"
                value={formData.impactFactor || ""}
                onChange={(e) => setFormData((p) => ({ ...p, impactFactor: e.target.value || null }))}
                placeholder="معامل التأثير"
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs md:text-sm">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن العضوية..."
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
                ) : editingJournal ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة العضوية"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingJournal(null))}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل العضوية
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل العضوية المحددة</DialogDescription>
          </DialogHeader>
          {viewingJournal && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingJournal.name}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500">
                {[roleLabels[viewingJournal.role], typeLabels[viewingJournal.type], formatDate(viewingJournal.startDate)].join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الدور</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {roleLabels[viewingJournal.role]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">نوع المجلة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {typeLabels[viewingJournal.type]}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">تاريخ البداية</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {formatDate(viewingJournal.startDate)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الحالة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {viewingJournal.isActive ? "نشط حالياً" : "غير نشط"}
                  </p>
                </div>
                {viewingJournal.endDate && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">تاريخ النهاية</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {formatDate(viewingJournal.endDate)}
                    </p>
                  </div>
                )}
                {viewingJournal.impactFactor != null && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">معامل التأثير</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {viewingJournal.impactFactor}
                    </p>
                  </div>
                )}
                {viewingJournal.description && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">الوصف</p>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap" dir="rtl">
                      {viewingJournal.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-slate-500">الدور</span>
                  <span className="font-medium text-slate-900">{roleLabels[viewingJournal.role]}</span>
                  <span className="text-slate-500">نوع المجلة</span>
                  <span className="font-medium text-slate-900">{typeLabels[viewingJournal.type]}</span>
                  <span className="text-slate-500">تاريخ البداية</span>
                  <span className="font-medium text-slate-900">{formatDate(viewingJournal.startDate)}</span>
                  <span className="text-slate-500">الحالة</span>
                  <span className="font-medium text-slate-900">
                    <Badge variant={viewingJournal.isActive ? "default" : "secondary"} className={viewingJournal.isActive ? "bg-green-100 text-green-800" : ""}>
                      {viewingJournal.isActive ? "نشط حالياً" : "غير نشط"}
                    </Badge>
                  </span>
                  {viewingJournal.endDate && (
                    <>
                      <span className="text-slate-500">تاريخ النهاية</span>
                      <span className="font-medium text-slate-900">{formatDate(viewingJournal.endDate)}</span>
                    </>
                  )}
                  {viewingJournal.impactFactor != null && (
                    <>
                      <span className="text-slate-500">معامل التأثير</span>
                      <span className="font-medium text-slate-900">{viewingJournal.impactFactor}</span>
                    </>
                  )}
                  {viewingJournal.description && (
                    <>
                      <span className="text-slate-500">الوصف</span>
                      <span className="font-medium text-slate-900" dir="rtl">
                        {viewingJournal.description}
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
                  onClick={() => shareJournalViaWhatsApp(viewingJournal)}
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
                    onClick={() => (setIsDetailsOpen(false), setViewingJournal(null))}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingJournal);
                      setViewingJournal(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingJournal.id)}
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
