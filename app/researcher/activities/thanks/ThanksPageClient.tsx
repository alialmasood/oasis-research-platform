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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Heart, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createThankYouLetter, updateThankYouLetter, deleteThankYouLetter, listThankYouLetters } from "./actions";
import { ThanksKPICards, useThanksStats } from "./_components/ThanksKPICards";
import type { ThankYouLetter } from "@prisma/client";
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
function getContextSummary(letters: ThankYouLetter[], stats: ReturnType<typeof useThanksStats>): string {
  if (letters.length === 0) {
    return "لم تُسجّل بعد أي كتاب شكر. ابدأ بإضافة كتاب شكر.";
  }
  if (letters.length === 1) {
    return `لديك كتاب شكر واحد.`;
  }
  const { total, asPresenter, asParticipant } = stats;
  return `لديك ${total} كتب شكر: ${asPresenter} كمحاضر، ${asParticipant} كمشترك.`;
}

interface ThanksPageClientProps {
  initialThankYouLetters: ThankYouLetter[];
}

export function ThanksPageClient({ initialThankYouLetters }: ThanksPageClientProps) {
  const [thankYouLetters, setThankYouLetters] = useState<ThankYouLetter[]>(initialThankYouLetters);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("__all__");
  const [participationFilter, setParticipationFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<ThankYouLetter | null>(null);
  const [viewingLetter, setViewingLetter] = useState<ThankYouLetter | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadThankYouLetters = (overrides?: {
    search?: string;
    issuingOrganization?: string;
    participationType?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const organization = overrides?.issuingOrganization ?? organizationFilter;
      const part = overrides?.participationType ?? participationFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listThankYouLetters({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        issuingOrganization: organization === "__all__" ? undefined : organization,
        participationType: part === "__all__" ? undefined : part,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setThankYouLetters(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadThankYouLetters();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    issuingOrganization: organizationFilter === "__all__" ? undefined : organizationFilter,
    participationType: participationFilter === "__all__" ? undefined : participationFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listThankYouLetters(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((l: ThankYouLetter) => ({
      "الجهة المانحة": l.issuingOrganization ?? "",
      السبب: l.reason ?? "—",
      التاريخ: formatDateCell(l.date),
      الوصف: l.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(l.createdAt),
      "آخر تحديث": formatDateCell(l.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "كتب الشكر والتقدير");
    XLSX.writeFile(workbook, "thanks-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listThankYouLetters(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (l: ThankYouLetter) => `
        <tr>
          <td>${l.issuingOrganization ?? "-"}</td>
          <td>${l.reason ?? "-"}</td>
          <td>${formatDateCell(l.date)}</td>
          <td>${l.description ?? "-"}</td>
          <td>${formatDateCell(l.createdAt)}</td>
          <td>${formatDateCell(l.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير كتب الشكر والتقدير</title>
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
          <h1>تقرير كتب الشكر والتقدير</h1>
          <table>
            <thead>
              <tr>
                <th>الجهة المانحة</th>
                <th>السبب</th>
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

  const stats = useThanksStats(thankYouLetters);
  const filteredForDisplay = thankYouLetters;

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد كتب الشكر": item.value,
  }));

  const topOrganizationsBarData = stats.topOrganizations.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    "عدد كتب الشكر": item.value,
  }));

  const organizationsPieData = stats.topOrganizations.map((item, index) => {
    const colors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    return {
      name: item.name,
      value: item.value,
      color: colors[index % colors.length],
    };
  });

  // استخراج الجهات والسنوات الفريدة للفلاتر
  const uniqueOrganizations = Array.from(new Set(thankYouLetters.map((l) => l.issuingOrganization))).sort();
  const uniqueYears = Array.from(
    new Set(thankYouLetters.map((l) => new Date(l.date).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    issuingOrganization: "",
    reason: "",
    date: getTodayISO(),
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        issuingOrganization: formData.issuingOrganization,
        reason: formData.reason,
        date: new Date(formData.date),
        participationType: null,
        description: formData.description || null,
      };
      const result = editingLetter
        ? await updateThankYouLetter({ ...payload, id: editingLetter.id })
        : await createThankYouLetter(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingLetter ? "✅ تم تحديث كتاب الشكر بنجاح" : "✅ تم إضافة كتاب الشكر بنجاح");
      setIsAddOpen(false);
      setEditingLetter(null);
      setFormData({
        issuingOrganization: "",
        reason: "",
        date: getTodayISO(),
        description: "",
      });
      loadThankYouLetters();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (letter?: ThankYouLetter) => {
    if (letter) {
      setEditingLetter(letter);
      const letterDate = new Date(letter.date);
      setFormData({
        issuingOrganization: letter.issuingOrganization,
        reason: letter.reason,
        date: letterDate.toISOString().slice(0, 10),
        description: letter.description || "",
      });
    } else {
      setEditingLetter(null);
      setFormData({
        issuingOrganization: "",
        reason: "",
        date: getTodayISO(),
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingLetter(null);
    setFormData({
      issuingOrganization: "",
      reason: "",
      date: getTodayISO(),
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا كتاب الشكر؟")) return;
    startTransition(async () => {
      const result = await deleteThankYouLetter(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف كتاب الشكر بنجاح");
      setIsDetailsOpen(false);
      setViewingLetter(null);
      loadThankYouLetters();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (l: ThankYouLetter) => {
    setViewingLetter(l);
    setIsDetailsOpen(true);
  };

  const shareThankYouLetterViaWhatsApp = (l: ThankYouLetter) => {
    const lines: string[] = [
      `*كتاب شكر من ${l.issuingOrganization}*`,
      `توجيه الشكر: ${l.reason}`,
      `التاريخ: ${formatDate(l.date)}`,
    ];
    if (l.participationType) {
      lines.push(`نوع المشاركة: ${participationLabels[l.participationType]}`);
    }
    if (l.description) {
      lines.push(`الوصف: ${l.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">كتب الشكر والتقدير</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل كتب الشكر والتقدير التي حصلت عليها</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة كتاب شكر
        </Button>
      </div>

      <ThanksKPICards stats={stats} />

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
                    tooltipLabel={(name, value) => `عدد كتب الشكر كمشارك ${name}: ${value}`}
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

          {/* عدد كتب الشكر حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد كتب الشكر حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد كتب الشكر"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد كتب الشكر في ${year}: ${count}`}
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
                  (a, b) => (b["عدد كتب الشكر"] > a["عدد كتب الشكر"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة كتب شكر: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد كتب الشكر"]} كتاب شكر)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* أكثر الجهات المانحة (Bar) - col-span-12 lg:col-span-6 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">أكثر الجهات المانحة للشكر</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {topOrganizationsBarData.length > 0 ? (
                  <BarChart
                    data={topOrganizationsBarData}
                    dataKeys={["عدد كتب الشكر"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد كتب الشكر من ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {topOrganizationsBarData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  أكثر الجهات المانحة للشكر (أول 5 جهات)
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

      {/* آخر كتاب شكر مضافة */}
      {thankYouLetters.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر كتاب شكر مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {thankYouLetters[0].issuingOrganization}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(thankYouLetters[0].date)}
                  </span>
                  {thankYouLetters[0].participationType && (
                    <Badge
                      variant={thankYouLetters[0].participationType === "PRESENTER" ? "default" : "secondary"}
                      className={thankYouLetters[0].participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                    >
                      {participationLabels[thankYouLetters[0].participationType]}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(thankYouLetters[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول كتب الشكر والتقدير</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في كتب الشكر</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
              {/* البحث */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="الجهة المانحة، توجيه الشكر..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
              </div>
              {/* الجهة المانحة */}
              {uniqueOrganizations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الجهة المانحة</label>
                  <Select
                    value={organizationFilter}
                    onValueChange={(v) => {
                      setOrganizationFilter(v);
                      loadThankYouLetters({ issuingOrganization: v });
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
              {/* نوع المشاركة */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع المشاركة</label>
                <Select
                  value={participationFilter}
                  onValueChange={(v) => {
                    setParticipationFilter(v);
                    loadThankYouLetters({ participationType: v });
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
                      loadThankYouLetters({ year: v });
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
                <Heart className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || organizationFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي كتاب شكر بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || organizationFilter !== "__all__" || participationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد كتب شكر تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول كتاب شكر لك."}
              </p>
              {!search && organizationFilter === "__all__" && participationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول كتاب شكر
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
                        <TableHead className="text-right font-medium text-slate-600">الجهة المانحة للشكر</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">توجيه الشكر</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع المشاركة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الوصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((l) => (
                        <TableRow key={l.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(l)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(l)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا كتاب الشكر؟")) {
                                      startTransition(async () => {
                                        const res = await deleteThankYouLetter(l.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف كتاب الشكر بنجاح");
                                          loadThankYouLetters();
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
                              {l.issuingOrganization}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {l.reason.length > 30 ? (
                              <span className="text-sm line-clamp-1">{l.reason}</span>
                            ) : (
                              <span className="text-sm">{l.reason}</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(l.date)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            {l.participationType ? (
                              <Badge
                                variant={l.participationType === "PRESENTER" ? "default" : "secondary"}
                                className={l.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                              >
                                {participationLabels[l.participationType]}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle">
                            {l.description ? (
                              l.description.length > 30 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 line-clamp-1 flex-1" dir="rtl">
                                    {l.description}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs flex-shrink-0"
                                    onClick={() => {
                                      setViewingLetter(l);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    عرض
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600" dir="rtl">
                                  {l.description}
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
                {filteredForDisplay.map((l) => (
                  <Card key={l.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {l.issuingOrganization}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2" dir="rtl">
                            {l.reason}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(l)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(l)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا كتاب الشكر؟")) {
                                  startTransition(async () => {
                                    const res = await deleteThankYouLetter(l.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف كتاب الشكر بنجاح");
                                      loadThankYouLetters();
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
                            {formatDate(l.date)}
                          </span>
                        </div>
                        {l.participationType && (
                          <div>
                            <span className="text-slate-500">نوع المشاركة:</span>
                            <Badge
                              variant={l.participationType === "PRESENTER" ? "default" : "secondary"}
                              className={l.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800 mr-2" : "mr-2"}
                            >
                              {participationLabels[l.participationType]}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {l.description && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingLetter(l);
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
            <DialogTitle>{editingLetter ? "تعديل كتاب الشكر" : "إضافة كتاب شكر"}</DialogTitle>
            <DialogDescription>
              {editingLetter
                ? "تعديل بيانات كتاب الشكر."
                : "أدخل بيانات كتاب الشكر. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="issuingOrganization">الجهة المانحة للشكر *</Label>
              <Input
                id="issuingOrganization"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData((p) => ({ ...p, issuingOrganization: e.target.value }))}
                placeholder="الجهة المانحة للشكر"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reason">توجيه الشكر *</Label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                placeholder="توجيه الشكر..."
                rows={3}
                required
                minLength={2}
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن كتاب الشكر..."
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
                ) : editingLetter ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة كتاب الشكر"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingLetter(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل كتاب الشكر
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل كتاب الشكر المحدد</DialogDescription>
          </DialogHeader>
          {viewingLetter && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingLetter.issuingOrganization}
              </h3>
              {viewingLetter.participationType && (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={viewingLetter.participationType === "PRESENTER" ? "default" : "secondary"}
                    className={viewingLetter.participationType === "PRESENTER" ? "bg-purple-100 text-purple-800" : ""}
                  >
                    {participationLabels[viewingLetter.participationType]}
                  </Badge>
                </div>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">توجيه الشكر</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingLetter.reason}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingLetter.date)}</span>
                {viewingLetter.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingLetter.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareThankYouLetterViaWhatsApp(viewingLetter)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingLetter(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingLetter);
                    setViewingLetter(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingLetter.id)}
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
