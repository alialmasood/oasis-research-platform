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

  const seminarActionsMenu = (s: Seminar) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
  );

  return (
    <div className="space-y-3 md:space-y-6 min-w-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">الندوات</h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">سجّل مشاركاتك في الندوات الأكاديمية</p>
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
          <span className="hidden md:inline">إضافة ندوة</span>
        </Button>
      </div>

      <SeminarsKPICards stats={stats} />

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
                    dataKeys={["عدد الندوات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الندوات في ${year}: ${count}`}
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
                  نوع المشاركة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {stats.participationPieData.length > 0 ? (
                    <PieChart
                      data={stats.participationPieData}
                      outerRadius={40}
                      innerRadius={14}
                      legendLayout="horizontal"
                      legendVerticalAlign="bottom"
                      legendWrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                      tooltipLabel={(name, value) => `عدد الندوات كمشارك ${name}: ${value}`}
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
                  الجهات المستفيدة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {topBeneficiariesBarData.length > 0 ? (
                    <BarChart
                      data={topBeneficiariesBarData}
                      dataKeys={["عدد الندوات"]}
                      colors={["#10b981"]}
                      tooltipLabel={(name, count) => `عدد الندوات في ${name}: ${count}`}
                      tickFontSize={9}
                    />
                  ) : (
                    <EmptyChartState type="bar" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">المشاركة عبر الزمن</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {stats.participationByYear.length > 0 ? (
                  <BarChart
                    data={stats.participationByYear}
                    dataKeys={["محاضر", "مشترك"]}
                    colors={["#8b5cf6", "#f59e0b"]}
                    stackId="participation"
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

      {seminars.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg border-l-4 border-l-blue-500 gap-0 overflow-hidden rounded-xl">
          <CardContent className="p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">آخر ندوة مضافة</span>
                </div>
                <h3 className="text-xs md:text-base font-semibold text-slate-900 mb-0.5 md:mb-1 line-clamp-1" dir="rtl">
                  {seminars[0].title}
                </h3>
                <p className="text-[10px] md:text-sm text-slate-600 truncate">
                  {[formatDate(seminars[0].date), seminars[0].beneficiary].join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(seminars[0])}
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
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول الندوات</div>
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
            <div className="grid grid-cols-3 gap-1.5">
              {uniqueBeneficiaries.length > 0 && (
                <Select
                  value={beneficiaryFilter}
                  onValueChange={(v) => {
                    setBeneficiaryFilter(v);
                    loadSeminars({ beneficiary: v });
                  }}
                >
                  <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="الجهة">
                    <SelectValue placeholder="الجهة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">كل الجهات</SelectItem>
                    {uniqueBeneficiaries.map((ben) => (
                      <SelectItem key={ben} value={ben}>
                        {ben}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={participationFilter}
                onValueChange={(v) => {
                  setParticipationFilter(v);
                  loadSeminars({ participationType: v });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="المشاركة">
                  <SelectValue placeholder="المشاركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">الكل</SelectItem>
                  <SelectItem value="PRESENTER">محاضر</SelectItem>
                  <SelectItem value="PARTICIPANT">مشترك</SelectItem>
                </SelectContent>
              </Select>
              {uniqueYears.length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(v) => {
                    setYearFilter(v);
                    loadSeminars({ year: v });
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
            <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في الندوات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
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
          </div>

          {filteredForDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 md:px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="rounded-full bg-white border border-slate-200 p-4 md:p-6 mb-3 md:mb-5 shadow-sm">
                <Presentation className="h-8 w-8 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold text-slate-800 mb-1 md:mb-2 text-center">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي ندوة بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {search || beneficiaryFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد ندوات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول ندوة لك."}
              </p>
              {!search && beneficiaryFilter === "__all__" && participationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="sm"
                  className="md:h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" />
                  إضافة أول ندوة
                </Button>
              )}
            </div>
          ) : (
            <>
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
                            {seminarActionsMenu(s)}
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

              <div className="md:hidden space-y-2">
                {filteredForDisplay.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm min-h-[96px]"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(s)}
                        className="min-w-0 flex-1 text-right space-y-0.5"
                      >
                        <p className="text-[12px] font-semibold text-slate-900 line-clamp-1 leading-snug">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[
                            formatDate(s.date),
                            participationLabels[s.participationType],
                            s.beneficiary,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </button>
                      {seminarActionsMenu(s)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">المكان</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">{s.location || "—"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">الوصف</p>
                        {s.description ? (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-blue-600 truncate block w-full text-right"
                            onClick={() => {
                              setViewingSeminar(s);
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

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {editingSeminar ? "تعديل الندوة" : "إضافة ندوة"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingSeminar
                ? "تعديل بيانات الندوة."
                : "أدخل بيانات الندوة. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="title" className="text-xs md:text-sm">عنوان الندوة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان الندوة"
                required
                minLength={2}
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label htmlFor="date" className="text-xs md:text-sm">التاريخ *</Label>
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
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">نوع المشاركة</Label>
                <Select
                  value={formData.participationType}
                  onValueChange={(v: "PRESENTER" | "PARTICIPANT") =>
                    setFormData((p) => ({ ...p, participationType: v }))
                  }
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENTER">محاضر</SelectItem>
                    <SelectItem value="PARTICIPANT">مشترك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label htmlFor="beneficiary" className="text-xs md:text-sm">الجهة المستفيدة *</Label>
                <Input
                  id="beneficiary"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData((p) => ({ ...p, beneficiary: e.target.value }))}
                  placeholder="الجهة المستفيدة"
                  required
                  minLength={2}
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="location" className="text-xs md:text-sm">مكان الانعقاد *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  placeholder="المدينة أو المكان"
                  required
                  minLength={2}
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-xs md:text-sm">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن الندوة..."
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

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingSeminar(null))}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل الندوة
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الندوة المحددة</DialogDescription>
          </DialogHeader>
          {viewingSeminar && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingSeminar.title}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500">
                {[
                  participationLabels[viewingSeminar.participationType],
                  formatDate(viewingSeminar.date),
                ].join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الجهة المستفيدة</p>
                  <p className="text-xs font-semibold text-slate-900 truncate" dir="rtl">
                    {viewingSeminar.beneficiary}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">المكان</p>
                  <p className="text-xs font-semibold text-slate-900 truncate" dir="rtl">
                    {viewingSeminar.location}
                  </p>
                </div>
                {viewingSeminar.description && (
                  <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                    <p className="text-[10px] text-slate-400">الوصف</p>
                    <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap" dir="rtl">
                      {viewingSeminar.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block space-y-4">
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
              </div>
              <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-2 pt-2 md:pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 justify-center"
                  onClick={() => shareSeminarViaWhatsApp(viewingSeminar)}
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
                    onClick={() => (setIsDetailsOpen(false), setViewingSeminar(null))}
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingSeminar);
                      setViewingSeminar(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingSeminar.id)}
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
