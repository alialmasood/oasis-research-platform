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
import { Plus, MoreVertical, Eye, Trash2, Calendar, Award, Loader2, Pencil, MessageCircle } from "lucide-react";
import { createCertificate, updateCertificate, deleteCertificate, listCertificates } from "./actions";
import { CertificatesKPICards, useCertificatesStats } from "./_components/CertificatesKPICards";
import type { Certificate } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

/** صيغة تاريخ شهر وسنة فقط: 2026 / 01 */
function formatDate(d: Date) {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y} / ${m}`;
}

function getTodayMonthISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(certificates: Certificate[], stats: ReturnType<typeof useCertificatesStats>): string {
  if (certificates.length === 0) {
    return "لم تُسجّل بعد في أي شهادة. ابدأ بإضافة شهادة.";
  }
  if (certificates.length === 1) {
    return `لديك شهادة مشاركة واحدة.`;
  }
  const { total } = stats;
  return `لديك ${total} شهادات مشاركة.`;
}

interface CertificatesPageClientProps {
  initialCertificates: Certificate[];
}

export function CertificatesPageClient({ initialCertificates }: CertificatesPageClientProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadCertificates = (overrides?: {
    search?: string;
    issuingOrganization?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const organization = overrides?.issuingOrganization ?? organizationFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listCertificates({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        issuingOrganization: organization === "__all__" ? undefined : organization,
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error ?? "حدث خطأ غير متوقع", "error");
        return;
      }
      setCertificates(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCertificates();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    issuingOrganization: organizationFilter === "__all__" ? undefined : organizationFilter,
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listCertificates(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error ?? "حدث خطأ غير متوقع", "error");
      return;
    }

    const rows = result.items.map((c: Certificate) => ({
      العنوان: c.title ?? "",
      "الجهة المانحة": c.issuingOrganization ?? "—",
      التاريخ: formatDateCell(c.date),
      الوصف: c.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(c.createdAt),
      "آخر تحديث": formatDateCell(c.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "شهادات المشاركة");
    XLSX.writeFile(workbook, "certificates-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listCertificates(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error ?? "حدث خطأ غير متوقع", "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (c: Certificate) => `
        <tr>
          <td>${c.title ?? "-"}</td>
          <td>${c.issuingOrganization ?? "-"}</td>
          <td>${formatDateCell(c.date)}</td>
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
          <title>تقرير شهادات المشاركة</title>
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
          <h1>تقرير شهادات المشاركة</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الجهة المانحة</th>
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

  const stats = useCertificatesStats(certificates);
  const filteredForDisplay = certificates;

  // استخراج الجهات والسنوات الفريدة للفلاتر
  const uniqueOrganizations = Array.from(new Set(certificates.map((c) => c.issuingOrganization))).sort();
  const uniqueYears = Array.from(
    new Set(certificates.map((c) => new Date(c.date).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    issuingOrganization: "",
    date: getTodayMonthISO(),
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // تحويل month input (YYYY-MM) إلى Date (أول يوم من الشهر)
      const [year, month] = formData.date.split("-").map(Number);
      const dateObj = new Date(year, month - 1, 1);
      
      const payload = {
        title: formData.title,
        issuingOrganization: formData.issuingOrganization,
        date: dateObj,
        description: formData.description || null,
      };
      const result = editingCertificate
        ? await updateCertificate({ ...payload, id: editingCertificate.id })
        : await createCertificate(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingCertificate ? "✅ تم تحديث الشهادة بنجاح" : "✅ تم إضافة الشهادة بنجاح");
      setIsAddOpen(false);
      setEditingCertificate(null);
      setFormData({
        title: "",
        issuingOrganization: "",
        date: getTodayMonthISO(),
        description: "",
      });
      loadCertificates();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (certificate?: Certificate) => {
    if (certificate) {
      setEditingCertificate(certificate);
      const d = new Date(certificate.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      setFormData({
        title: certificate.title,
        issuingOrganization: certificate.issuingOrganization,
        date: `${year}-${month}`,
        description: certificate.description || "",
      });
    } else {
      setEditingCertificate(null);
      setFormData({
        title: "",
        issuingOrganization: "",
        date: getTodayMonthISO(),
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingCertificate(null);
    setFormData({
      title: "",
      issuingOrganization: "",
      date: getTodayMonthISO(),
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    startTransition(async () => {
      const result = await deleteCertificate(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف الشهادة بنجاح");
      setIsDetailsOpen(false);
      setViewingCertificate(null);
      loadCertificates();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (s: Certificate) => {
    setViewingCertificate(s);
    setIsDetailsOpen(true);
  };

  const shareCertificateViaWhatsApp = (c: Certificate) => {
    const lines: string[] = [
      `*${c.title}*`,
      `الجهة المانحة: ${c.issuingOrganization}`,
      `التاريخ: ${formatDate(c.date)}`,
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
    "عدد الشهادات": item.value,
  }));

  const topOrganizationsBarData = stats.topOrganizations.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    "عدد الشهادات": item.value,
  }));

  const byMonthData = stats.byMonth.map((item) => ({
    name: item.name,
    "عدد الشهادات": item.value,
  }));

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">شهادات المشاركة</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل شهادات المشاركة التي حصلت عليها</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة شهادة مشاركة
        </Button>
      </div>

      <CertificatesKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          {/* الصف الأول: عدد الشهادات حسب السنة (أكبر) + أكثر الجهات المانحة (أصغر) */}
          {/* عدد الشهادات حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد الشهادات حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد الشهادات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الشهادات في ${year}: ${count}`}
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
                  (a, b) => (b["عدد الشهادات"] > a["عدد الشهادات"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة شهادات: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد الشهادات"]} شهادة)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* أكثر الجهات المانحة (Bar) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">أكثر الجهات المانحة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {topOrganizationsBarData.length > 0 ? (
                  <BarChart
                    data={topOrganizationsBarData}
                    dataKeys={["عدد الشهادات"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد الشهادات من ${name}: ${count}`}
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
                  أكثر الجهات المانحة (أول 5 جهات)
                </p>
              )}
            </CardContent>
          </Card>

          {/* الصف الثاني: عدد الشهادات حسب الشهر (كامل العرض) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد الشهادات حسب الشهر</CardTitle>
              <p className="text-xs text-slate-500 mt-1">آخر 12 شهر — مفيد لمتابعة النشاط</p>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byMonthData.length > 0 ? (
                  <BarChart
                    data={byMonthData}
                    dataKeys={["عدد الشهادات"]}
                    colors={["#8b5cf6"]}
                    tooltipLabel={(month, count) => `عدد الشهادات في ${month}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byMonthData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الشهادات حسب الشهر (آخر 12 شهر)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر شهادة مضافة */}
      {certificates.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر شهادة مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {certificates[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(certificates[0].date)}
                  </span>
                  <span className="text-slate-600" dir="rtl">
                    {certificates[0].issuingOrganization}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(certificates[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول شهادات المشاركة</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في الشهادات</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" dir="rtl">
              {/* البحث */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="عنوان الشهادة..."
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
                      loadCertificates({ issuingOrganization: v });
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
              {/* السنة */}
              {uniqueYears.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                  <Select
                    value={yearFilter}
                    onValueChange={(v) => {
                      setYearFilter(v);
                      loadCertificates({ year: v });
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
                <Award className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || organizationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي شهادة بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || organizationFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد شهادات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول شهادة لك."}
              </p>
              {!search && organizationFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول شهادة
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
                        <TableHead className="text-right font-medium text-slate-600">عنوان الشهادة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الجهة المانحة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
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
                                    if (confirm("هل أنت متأكد من حذف هذه الشهادة؟")) {
                                      startTransition(async () => {
                                        const res = await deleteCertificate(c.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف الشهادة بنجاح");
                                          loadCertificates();
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
                          <TableCell className="align-middle text-slate-700" dir="rtl">
                            {c.issuingOrganization}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(c.date)}
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
                                      setViewingCertificate(c);
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
                                if (confirm("هل أنت متأكد من حذف هذه الشهادة؟")) {
                                  startTransition(async () => {
                                    const res = await deleteCertificate(c.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف الشهادة بنجاح");
                                      loadCertificates();
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
                      <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-slate-500">الجهة المانحة:</span>
                          <span className="text-slate-900 font-medium mr-2" dir="rtl">
                            {c.issuingOrganization}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">التاريخ:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(c.date)}
                          </span>
                        </div>
                      </div>
                      {c.description && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setViewingCertificate(c);
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
            <DialogTitle>{editingCertificate ? "تعديل الشهادة" : "إضافة شهادة"}</DialogTitle>
            <DialogDescription>
              {editingCertificate
                ? "تعديل بيانات الشهادة."
                : "أدخل بيانات الشهادة. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان الشهادة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان الشهادة"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="issuingOrganization">الجهة المانحة *</Label>
              <Input
                id="issuingOrganization"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData((p) => ({ ...p, issuingOrganization: e.target.value }))}
                placeholder="الجهة المانحة للشهادة"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date">التاريخ (شهر وسنة) *</Label>
              <Input
                id="date"
                type="month"
                value={formData.date}
                max={getTodayMonthISO()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayMonthISO();
                  if (selectedDate > today) {
                    showToast("التاريخ لا يمكن أن يكون في المستقبل", "error");
                    return;
                  }
                  setFormData((p) => ({ ...p, date: selectedDate }));
                }}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل (شهر وسنة فقط)</p>
            </div>
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن الشهادة..."
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
                ) : editingCertificate ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة الشهادة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingCertificate(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل الشهادة
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الشهادة المحددة</DialogDescription>
          </DialogHeader>
          {viewingCertificate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingCertificate.title}
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">الجهة المانحة</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingCertificate.issuingOrganization}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingCertificate.date)}</span>
                {viewingCertificate.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingCertificate.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareCertificateViaWhatsApp(viewingCertificate)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingCertificate(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingCertificate);
                    setViewingCertificate(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingCertificate.id)}
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
