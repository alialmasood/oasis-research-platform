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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Wrench, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createWorkshop, updateWorkshop, deleteWorkshop, listWorkshops } from "./actions";
import { WorkshopsKPICards, useWorkshopsStats } from "./_components/WorkshopsKPICards";
import type { Workshop } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const participationLabels: Record<string, string> = { PRESENTER: "محاضر", PARTICIPANT: "مشترك" };

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
function getContextSummary(workshops: Workshop[], stats: ReturnType<typeof useWorkshopsStats>): string {
  if (workshops.length === 0) {
    return "لم تُسجّل بعد في أي ورشة عمل. ابدأ بإضافة ورشة عمل.";
  }
  if (workshops.length === 1) {
    const w = workshops[0];
    const participation = participationLabels[w.participationType];
    return `أنت مسجل حالياً في ورشة عمل واحدة كمشارك ${participation}.`;
  }
  const { total, asPresenter, asParticipant } = stats;
  return `أنت مسجل حالياً في ${total} ورش عمل: ${asPresenter} كمحاضر، ${asParticipant} كمشترك.`;
}

interface WorkshopsPageClientProps {
  initialWorkshops: Workshop[];
}

export function WorkshopsPageClient({ initialWorkshops }: WorkshopsPageClientProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops);
  const [search, setSearch] = useState("");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>("__all__");
  const [participationFilter, setParticipationFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [viewingWorkshop, setViewingWorkshop] = useState<Workshop | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadWorkshops = (overrides?: {
    search?: string;
    beneficiary?: string;
    participationType?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const beneficiary = overrides?.beneficiary ?? beneficiaryFilter;
      const part = overrides?.participationType ?? participationFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listWorkshops({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        beneficiary: beneficiary === "__all__" ? undefined : beneficiary,
        participationType: part === "__all__" ? undefined : part,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setWorkshops(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkshops();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    beneficiary: beneficiaryFilter === "__all__" ? undefined : beneficiaryFilter,
    participationType: participationFilter === "__all__" ? undefined : participationFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listWorkshops(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((w: Workshop) => ({
      العنوان: w.title ?? "",
      "الجهة المستفيدة": w.beneficiary ?? "—",
      المكان: w.location ?? "—",
      التاريخ: formatDateCell(w.date),
      "نوع المشاركة": participationLabels[w.participationType] ?? w.participationType,
      الوصف: w.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(w.createdAt),
      "آخر تحديث": formatDateCell(w.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ورش العمل");
    XLSX.writeFile(workbook, "workshops-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listWorkshops(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (w: Workshop) => `
        <tr>
          <td>${w.title ?? "-"}</td>
          <td>${w.beneficiary ?? "-"}</td>
          <td>${w.location ?? "-"}</td>
          <td>${formatDateCell(w.date)}</td>
          <td>${participationLabels[w.participationType] ?? w.participationType}</td>
          <td>${w.description ?? "-"}</td>
          <td>${formatDateCell(w.createdAt)}</td>
          <td>${formatDateCell(w.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير ورش العمل</title>
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
          <h1>تقرير ورش العمل</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الجهة المستفيدة</th>
                <th>المكان</th>
                <th>التاريخ</th>
                <th>نوع المشاركة</th>
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

  const stats = useWorkshopsStats(workshops);
  const filteredForDisplay = workshops;

  // استخراج الجهات والسنوات الفريدة للفلاتر
  const uniqueBeneficiaries = Array.from(new Set(workshops.map((w) => w.beneficiary))).sort();
  const uniqueYears = Array.from(
    new Set(workshops.map((w) => new Date(w.date).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    date: getTodayISO(),
    beneficiary: "",
    location: "",
    participationType: "PARTICIPANT" as "PRESENTER" | "PARTICIPANT",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...formData,
        date: new Date(formData.date),
      };
      const result = editingWorkshop
        ? await updateWorkshop({ ...payload, id: editingWorkshop.id })
        : await createWorkshop(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingWorkshop ? "✅ تم تحديث ورشة العمل بنجاح" : "✅ تم إضافة ورشة العمل بنجاح");
      setIsAddOpen(false);
      setEditingWorkshop(null);
      setFormData({
        title: "",
        date: getTodayISO(),
        beneficiary: "",
        location: "",
        participationType: "PARTICIPANT",
        description: "",
      });
      loadWorkshops();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (workshop?: Workshop) => {
    if (workshop) {
      setEditingWorkshop(workshop);
      const d = new Date(workshop.date);
      setFormData({
        title: workshop.title,
        date: d.toISOString().slice(0, 10),
        beneficiary: workshop.beneficiary,
        location: workshop.location,
        participationType: workshop.participationType,
        description: workshop.description || "",
      });
    } else {
      setEditingWorkshop(null);
      setFormData({
        title: "",
        date: getTodayISO(),
        beneficiary: "",
        location: "",
        participationType: "PARTICIPANT",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingWorkshop(null);
    setFormData({
      title: "",
      date: getTodayISO(),
      beneficiary: "",
      location: "",
      participationType: "PARTICIPANT",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه ورشة العمل؟")) return;
    startTransition(async () => {
      const result = await deleteWorkshop(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف ورشة العمل بنجاح");
      setIsDetailsOpen(false);
      setViewingWorkshop(null);
      loadWorkshops();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (w: Workshop) => {
    setViewingWorkshop(w);
    setIsDetailsOpen(true);
  };

  const shareWorkshopViaWhatsApp = (w: Workshop) => {
    const lines: string[] = [
      `*${w.title}*`,
      `الجهة المستفيدة: ${w.beneficiary}`,
      `التاريخ: ${formatDate(w.date)}`,
      `المكان: ${w.location}`,
      `نوع المشاركة: ${participationLabels[w.participationType]}`,
    ];
    if (w.description) {
      lines.push(`الوصف: ${w.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد ورش العمل": item.value,
  }));

  const topBeneficiariesBarData = stats.topBeneficiaries.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    "عدد ورش العمل": item.value,
  }));

  const beneficiariesPieData = stats.topBeneficiaries.map((item, index) => {
    const colors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    return {
      name: item.name,
      value: item.value,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">ورش العمل</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل مشاركاتك في ورش العمل الأكاديمية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة ورشة عمل
        </Button>
      </div>

      <WorkshopsKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          {/* نوع المشاركة (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">نوع المشاركة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.participationPieData.length > 0 ? (
                  <PieChart
                    data={stats.participationPieData}
                    tooltipLabel={(name, value) => `عدد ورش العمل كمشارك ${name}: ${value}`}
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
              {stats.participationPieData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع المشاركة (محاضر / مشترك)
                </p>
              )}
            </CardContent>
          </Card>

          {/* عدد الدورات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد ورش العمل حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد ورش العمل"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد ورش العمل في ${year}: ${count}`}
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
                  (a, b) => (b["عدد ورش العمل"] > a["عدد ورش العمل"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة ورش عمل: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد ورش العمل"]} ورشة عمل)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* أكثر الجهات المستفيدة (Bar) - col-span-12 lg:col-span-6 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">أكثر الجهات المستفيدة</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {topBeneficiariesBarData.length > 0 ? (
                  <BarChart
                    data={topBeneficiariesBarData}
                    dataKeys={["عدد ورش العمل"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد ورش العمل في ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {topBeneficiariesBarData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  أكثر الجهات المستفيدة (أول 5 جهات)
                </p>
              )}
            </CardContent>
          </Card>

          {/* نوع المشاركة عبر الزمن (Stacked Bar) - col-span-12 lg:col-span-6 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">نوع المشاركة عبر الزمن</CardTitle>
              <p className="text-xs text-slate-500 mt-1">محاضر vs مشترك — مفيد للتقييم العلمي وملف الترقيات</p>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.participationByYear.length > 0 ? (
                  <BarChart
                    data={stats.participationByYear}
                    dataKeys={["محاضر", "مشترك"]}
                    colors={["#8b5cf6", "#f59e0b"]}
                    stackId="participation"
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {stats.participationByYear.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع المشاركة (محاضر / مشترك) حسب السنة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر ورشة عمل مضافة */}
      {workshops.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر ورشة عمل مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {workshops[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(workshops[0].date)}
                  </span>
                  <span className="flex items-center gap-1" dir="rtl">
                    <Wrench className="h-3.5 w-3.5" />
                    {workshops[0].beneficiary}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(workshops[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول ورش العمل</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في ورش العمل</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
              {/* البحث */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="العنوان، الجهة المستفيدة، المكان..."
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
              {uniqueBeneficiaries.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الجهة المستفيدة</label>
                  <Select
                    value={beneficiaryFilter}
                    onValueChange={(v) => {
                      setBeneficiaryFilter(v);
                      loadWorkshops({ beneficiary: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {uniqueBeneficiaries.map((ben) => (
                        <SelectItem key={ben} value={ben}>
                          {ben}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* نوع المشاركة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع المشاركة</label>
                <Select
                  value={participationFilter}
                  onValueChange={(v) => {
                    setParticipationFilter(v);
                    loadWorkshops({ participationType: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    <SelectItem value="PRESENTER">محاضر</SelectItem>
                    <SelectItem value="PARTICIPANT">مشترك</SelectItem>
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
                      loadWorkshops({ year: v });
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
                <Wrench className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي ورشة عمل بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد ورش عمل تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول ورشة عمل لك."}
              </p>
              {!search && beneficiaryFilter === "__all__" && participationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول ورشة عمل
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
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "8%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">عنوان ورشة العمل</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الجهة المستفيدة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">المكان</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع المشاركة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((w) => (
                        <TableRow key={w.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(w)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(w)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذه ورشة العمل؟")) {
                                      startTransition(async () => {
                                        const res = await deleteWorkshop(w.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف ورشة العمل بنجاح");
                                          loadWorkshops();
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
                              {w.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {w.beneficiary}
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {w.location}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(w.date)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge
                              variant={w.participationType === "PRESENTER" ? "default" : "secondary"}
                              className={w.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                            >
                              {participationLabels[w.participationType]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            {w.description ? (
                              w.description.length > 30 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-1 flex-1" dir="rtl">
                                    {w.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setViewingWorkshop(w);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {w.description}
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
                {filteredForDisplay.map((w) => (
                  <Card key={w.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {w.title}
                          </h3>
                          <p className="text-sm text-slate-600" dir="rtl">
                            {w.beneficiary}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(w)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(w)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذه ورشة العمل؟")) {
                                  startTransition(async () => {
                                    const res = await deleteWorkshop(w.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف ورشة العمل بنجاح");
                                      loadWorkshops();
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
                          <span className="text-slate-500">المكان:</span>
                          <span className="text-slate-900 font-medium mr-2" dir="rtl">
                            {w.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">التاريخ:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(w.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <Badge
                          variant={w.participationType === "PRESENTER" ? "default" : "secondary"}
                          className={w.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                        >
                          {participationLabels[w.participationType]}
                        </Badge>
                        {w.description && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingWorkshop(w);
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
            <DialogTitle>{editingWorkshop ? "تعديل ورشة العمل" : "إضافة ورشة عمل"}</DialogTitle>
            <DialogDescription>
              {editingWorkshop
                ? "تعديل بيانات ورشة العمل."
                : "أدخل بيانات ورشة العمل. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان ورشة العمل *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان ورشة العمل"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date">التاريخ *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                max={getTodayISO()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayISO();
                  if (selectedDate > today) {
                    showToast("التاريخ لا يمكن أن يكون في المستقبل", "error");
                    return;
                  }
                  setFormData((p) => ({ ...p, date: selectedDate }));
                }}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>
            <div>
              <Label htmlFor="beneficiary">الجهة المستفيدة *</Label>
              <Input
                id="beneficiary"
                value={formData.beneficiary}
                onChange={(e) => setFormData((p) => ({ ...p, beneficiary: e.target.value }))}
                placeholder="الجهة المستفيدة"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">مكان انعقاد ورشة العمل *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="المدينة أو المكان"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>نوع المشاركة</Label>
              <Select
                value={formData.participationType}
                onValueChange={(v: "PRESENTER" | "PARTICIPANT") =>
                  setFormData((p) => ({ ...p, participationType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENTER">محاضر</SelectItem>
                  <SelectItem value="PARTICIPANT">مشترك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن ورشة العمل..."
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
                ) : editingWorkshop ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة ورشة العمل"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingWorkshop(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل ورشة العمل
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل ورشة العمل المحددة</DialogDescription>
          </DialogHeader>
          {viewingWorkshop && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingWorkshop.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={viewingWorkshop.participationType === "PRESENTER" ? "default" : "secondary"}
                  className={viewingWorkshop.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                >
                  {participationLabels[viewingWorkshop.participationType]}
                </Badge>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">الجهة المستفيدة</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingWorkshop.beneficiary}</span>
                <span className="text-slate-500">المكان</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingWorkshop.location}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingWorkshop.date)}</span>
                {viewingWorkshop.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingWorkshop.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareWorkshopViaWhatsApp(viewingWorkshop)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingWorkshop(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingWorkshop);
                    setViewingWorkshop(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingWorkshop.id)}
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
