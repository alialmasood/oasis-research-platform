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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Presentation, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createSeminar, updateSeminar, deleteSeminar, listSeminars } from "./actions";
import { SeminarsKPICards, useSeminarsStats } from "./_components/SeminarsKPICards";
import type { Seminar } from "@prisma/client";
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
function getContextSummary(seminars: Seminar[], stats: ReturnType<typeof useSeminarsStats>): string {
  if (seminars.length === 0) {
    return "لم تُسجّل بعد في أي ندوة. ابدأ بإضافة ندوة.";
  }
  if (seminars.length === 1) {
    const s = seminars[0];
    const participation = participationLabels[s.participationType];
    return `أنت مسجل حالياً في ندوة واحدة كمشارك ${participation}.`;
  }
  const { total, asPresenter, asParticipant } = stats;
  return `أنت مسجل حالياً في ${total} ندوات: ${asPresenter} كمحاضر، ${asParticipant} كمشترك.`;
}

interface SeminarsPageClientProps {
  initialSeminars: Seminar[];
}

export function SeminarsPageClient({ initialSeminars }: SeminarsPageClientProps) {
  const [seminars, setSeminars] = useState<Seminar[]>(initialSeminars);
  const [search, setSearch] = useState("");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>("__all__");
  const [participationFilter, setParticipationFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [viewingSeminar, setViewingSeminar] = useState<Seminar | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadSeminars = (overrides?: {
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
      const result = await listSeminars({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        beneficiary: beneficiary === "__all__" ? undefined : beneficiary,
        participationType: part === "__all__" ? undefined : part,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setSeminars(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSeminars();
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
    const result = await listSeminars(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((s: Seminar) => ({
      العنوان: s.title ?? "",
      "الجهة المستفيدة": s.beneficiary ?? "—",
      المكان: s.location ?? "—",
      التاريخ: formatDateCell(s.date),
      "نوع المشاركة": participationLabels[s.participationType] ?? s.participationType,
      الوصف: s.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(s.createdAt),
      "آخر تحديث": formatDateCell(s.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الندوات");
    XLSX.writeFile(workbook, "seminars-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listSeminars(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (s: Seminar) => `
        <tr>
          <td>${s.title ?? "-"}</td>
          <td>${s.beneficiary ?? "-"}</td>
          <td>${s.location ?? "-"}</td>
          <td>${formatDateCell(s.date)}</td>
          <td>${participationLabels[s.participationType] ?? s.participationType}</td>
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
          <title>تقرير الندوات</title>
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
          <h1>تقرير الندوات</h1>
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

  const stats = useSeminarsStats(seminars);
  const filteredForDisplay = seminars;

  // استخراج الجهات والسنوات الفريدة للفلاتر
  const uniqueBeneficiaries = Array.from(new Set(seminars.map((s) => s.beneficiary))).sort();
  const uniqueYears = Array.from(
    new Set(seminars.map((s) => new Date(s.date).getFullYear()))
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
      const result = editingSeminar
        ? await updateSeminar({ ...payload, id: editingSeminar.id })
        : await createSeminar(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingSeminar ? "✅ تم تحديث الندوة بنجاح" : "✅ تم إضافة الندوة بنجاح");
      setIsAddOpen(false);
      setEditingSeminar(null);
      setFormData({
        title: "",
        date: getTodayISO(),
        beneficiary: "",
        location: "",
        participationType: "PARTICIPANT",
        description: "",
      });
      loadSeminars();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (seminar?: Seminar) => {
    if (seminar) {
      setEditingSeminar(seminar);
      const d = new Date(seminar.date);
      setFormData({
        title: seminar.title,
        date: d.toISOString().slice(0, 10),
        beneficiary: seminar.beneficiary,
        location: seminar.location,
        participationType: seminar.participationType,
        description: seminar.description || "",
      });
    } else {
      setEditingSeminar(null);
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
    setEditingSeminar(null);
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
    if (!confirm("هل أنت متأكد من حذف هذه الندوة؟")) return;
    startTransition(async () => {
      const result = await deleteSeminar(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف الندوة بنجاح");
      setIsDetailsOpen(false);
      setViewingSeminar(null);
      loadSeminars();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Seminar) => {
    setViewingSeminar(s);
    setIsDetailsOpen(true);
  };

  const shareSeminarViaWhatsApp = (s: Seminar) => {
    const lines: string[] = [
      `*${s.title}*`,
      `الجهة المستفيدة: ${s.beneficiary}`,
      `التاريخ: ${formatDate(s.date)}`,
      `المكان: ${s.location}`,
      `نوع المشاركة: ${participationLabels[s.participationType]}`,
    ];
    if (s.description) {
      lines.push(`الوصف: ${s.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد الندوات": item.value,
  }));

  const topBeneficiariesBarData = stats.topBeneficiaries.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    "عدد الندوات": item.value,
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
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">الندوات</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل مشاركاتك في الندوات الأكاديمية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة ندوة
        </Button>
      </div>

      <SeminarsKPICards stats={stats} />

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
                    tooltipLabel={(name, value) => `عدد الندوات كمشارك ${name}: ${value}`}
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

          {/* عدد الندوات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد الندوات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد الندوات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الندوات في ${year}: ${count}`}
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
                  (a, b) => (b["عدد الندوات"] > a["عدد الندوات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة ندوات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد الندوات"]} ندوة)
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
                    dataKeys={["عدد الندوات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد الندوات في ${name}: ${count}`}
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

      {/* آخر ندوة مضافة */}
      {seminars.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر ندوة مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {seminars[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(seminars[0].date)}
                  </span>
                  <span className="flex items-center gap-1" dir="rtl">
                    <Presentation className="h-3.5 w-3.5" />
                    {seminars[0].beneficiary}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(seminars[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول الندوات</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في الندوات</h3>
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
                      loadSeminars({ beneficiary: v });
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
                    loadSeminars({ participationType: v });
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
                      loadSeminars({ year: v });
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
                <Presentation className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي ندوة بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد ندوات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول ندوة لك."}
              </p>
              {!search && beneficiaryFilter === "__all__" && participationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول ندوة
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
                        <TableHead className="text-right font-medium text-slate-600">عنوان الندوة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الجهة المستفيدة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">المكان</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع المشاركة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((s) => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(s)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(s)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذه الندوة؟")) {
                                      startTransition(async () => {
                                        const res = await deleteSeminar(s.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف الندوة بنجاح");
                                          loadSeminars();
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
                              {s.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {s.beneficiary}
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {s.location}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(s.date)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge
                              variant={s.participationType === "PRESENTER" ? "default" : "secondary"}
                              className={s.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                            >
                              {participationLabels[s.participationType]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            {s.description ? (
                              s.description.length > 30 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-1 flex-1" dir="rtl">
                                    {s.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setViewingSeminar(s);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {s.description}
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
                {filteredForDisplay.map((s) => (
                  <Card key={s.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {s.title}
                          </h3>
                          <p className="text-sm text-slate-600" dir="rtl">
                            {s.beneficiary}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(s)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(s)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذه الندوة؟")) {
                                  startTransition(async () => {
                                    const res = await deleteSeminar(s.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف الندوة بنجاح");
                                      loadSeminars();
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
                            {s.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">التاريخ:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(s.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <Badge
                          variant={s.participationType === "PRESENTER" ? "default" : "secondary"}
                          className={s.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                        >
                          {participationLabels[s.participationType]}
                        </Badge>
                        {s.description && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingSeminar(s);
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
            <DialogTitle>{editingSeminar ? "تعديل الندوة" : "إضافة ندوة"}</DialogTitle>
            <DialogDescription>
              {editingSeminar
                ? "تعديل بيانات الندوة."
                : "أدخل بيانات الندوة. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان الندوة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان الندوة"
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
              <Label htmlFor="location">مكان انعقاد الندوة *</Label>
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
                placeholder="وصف إضافي عن الندوة..."
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
                ) : editingSeminar ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة الندوة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingSeminar(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل الندوة
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الندوة المحددة</DialogDescription>
          </DialogHeader>
          {viewingSeminar && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingSeminar.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={viewingSeminar.participationType === "PRESENTER" ? "default" : "secondary"}
                  className={viewingSeminar.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                >
                  {participationLabels[viewingSeminar.participationType]}
                </Badge>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">الجهة المستفيدة</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingSeminar.beneficiary}</span>
                <span className="text-slate-500">المكان</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingSeminar.location}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingSeminar.date)}</span>
                {viewingSeminar.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingSeminar.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareSeminarViaWhatsApp(viewingSeminar)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingSeminar(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingSeminar);
                    setViewingSeminar(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingSeminar.id)}
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
