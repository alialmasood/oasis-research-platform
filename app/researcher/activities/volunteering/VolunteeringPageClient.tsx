"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createVolunteering, updateVolunteering, deleteVolunteering, listVolunteerings } from "./actions";
import { VolunteeringKPICards, useVolunteeringStats } from "./_components/VolunteeringKPICards";
import type { Volunteering } from "@prisma/client";
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

/** حساب المدة من الفرق بين تاريخين (سنوات، أشهر، أيام) */
function calculateDuration(startDate: string, endDate: string): { years: number; months: number; days: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    return { years: 0, months: 0, days: 0 };
  }
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  // تصحيح القيم السالبة
  if (days < 0) {
    months--;
    // الحصول على عدد أيام الشهر السابق
    const lastDayOfPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += lastDayOfPrevMonth;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
}

const typeLabels = {
  HELPING_POOR_NEEDY: "مساعدة الفقراء والمحتاجين",
  ENVIRONMENTAL_PROTECTION: "حماية البيئة",
  EMERGENCY_SUPPORT: "تقديم الدعم في حالة الطوارئ",
  CULTURAL_EDUCATIONAL_ACTIVITIES: "المساهمة في الانشطة الثقافية والتعليمية",
  HELPING_ELDERLY: "مساعدة كبار السن",
  SPORTS_ACTIVITIES: "المشاركة في الانشطة الرياضية",
  SOCIAL_ACTIVITIES: "المشاركة في الانشطة الاجتماعية",
  HOSPITALS_ORPHANAGES: "التطوع في المشتشفيات ودور الايتام",
  EDUCATION_FIELD: "التطوع في مجال التعليم",
  COMMUNITY_DEVELOPMENT: "التطوع في مجال التنمية المجتمعية",
  HUMAN_RIGHTS: "التطوع في مجال حقوق الانسان",
  ARTS_CULTURE: "التطوع في مجال الفنون والثقافة",
  TECHNOLOGY_COMMUNICATIONS: "التطوع في مجال التكنولوجيا والاتصالات",
  LAW_FIELD: "التطوع في مجال القانون",
  HEALTH_FIELD: "التطوع في مجال الصحة",
  FIRST_AID: "التطوع في مجال الاسعافات الأولية",
  ANIMAL_WELFARE: "التطوع في مجال رعاية الحيوان",
} as const;

const roleLabels = {
  COORDINATOR: "منسق",
  LEADER: "قائد",
  PARTICIPANT: "مشارك",
  MEMBER: "عضو",
  VOLUNTEER: "متطوع",
} as const;

const typeColors = ["#2563EB", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

const durationUnitLabels: Record<string, string> = {
  YEAR: "سنة",
  MONTH: "شهر",
  DAY: "يوم",
};

/** سطر توضيحي يعكس حالة المستخدم الحالية */
function getContextSummary(volunteerings: Volunteering[], stats: ReturnType<typeof useVolunteeringStats>): string {
  if (volunteerings.length === 0) {
    return "لم تُسجّل بعد أي عمل طوعي. ابدأ بإضافة عمل طوعي جديد.";
  }
  if (volunteerings.length === 1) {
    return `لديك عمل طوعي واحد.`;
  }
  const { total, ongoing } = stats;
  return `لديك ${total} عمل طوعي (${ongoing} مستمر).`;
}

interface VolunteeringPageClientProps {
  initialVolunteerings: Volunteering[];
}

export function VolunteeringPageClient({ initialVolunteerings }: VolunteeringPageClientProps) {
  const [volunteerings, setVolunteerings] = useState<Volunteering[]>(initialVolunteerings);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVolunteering, setEditingVolunteering] = useState<Volunteering | null>(null);
  const [viewingVolunteering, setViewingVolunteering] = useState<Volunteering | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadVolunteerings = (overrides?: {
    search?: string;
    type?: string;
    role?: string;
    year?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const type = overrides?.type ?? typeFilter;
      const role = overrides?.role ?? roleFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listVolunteerings({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        type: type === "__all__" ? undefined : (type as keyof typeof typeLabels),
        role: role === "__all__" ? undefined : (role as keyof typeof roleLabels),
        year: year === "__all__" ? undefined : parseInt(year),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setVolunteerings(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVolunteerings();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    type: typeFilter === "__all__" ? undefined : (typeFilter as keyof typeof typeLabels),
    role: roleFilter === "__all__" ? undefined : (roleFilter as keyof typeof roleLabels),
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const formatDurationCell = (v: Volunteering) => {
    const years = v.durationYears ?? 0;
    const months = v.durationMonths ?? 0;
    const days = v.durationDays ?? 0;
    if (years === 0 && months === 0 && days === 0) return "—";

    const unit = durationUnitLabels[v.durationUnit] ?? v.durationUnit;
    const primaryValue =
      v.durationUnit === "YEAR" ? years : v.durationUnit === "MONTH" ? months : v.durationUnit === "DAY" ? days : 0;
    if (primaryValue > 0) {
      return `${primaryValue} ${unit}`;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} سنة`);
    if (months > 0) parts.push(`${months} شهر`);
    if (days > 0) parts.push(`${days} يوم`);
    return parts.join(" ") || "—";
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listVolunteerings(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((v) => ({
      العنوان: v.title ?? "",
      النوع: typeLabels[v.type] ?? v.type,
      الدور: roleLabels[v.role] ?? v.role,
      "تاريخ البداية": formatDateCell(v.startDate),
      "تاريخ الانتهاء": v.endDate ? formatDateCell(v.endDate) : "—",
      المدة: formatDurationCell(v),
      الحالة: v.isOngoing ? "مستمر" : "منتهي",
      الوصف: v.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(v.createdAt),
      "آخر تحديث": formatDateCell(v.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الأعمال الطوعية");
    XLSX.writeFile(workbook, "volunteering-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listVolunteerings(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (v) => `
        <tr>
          <td>${v.title ?? "-"}</td>
          <td>${typeLabels[v.type] ?? v.type}</td>
          <td>${roleLabels[v.role] ?? v.role}</td>
          <td>${formatDateCell(v.startDate)}</td>
          <td>${v.endDate ? formatDateCell(v.endDate) : "-"}</td>
          <td>${formatDurationCell(v)}</td>
          <td>${v.isOngoing ? "مستمر" : "منتهي"}</td>
          <td>${v.description ?? "-"}</td>
          <td>${formatDateCell(v.createdAt)}</td>
          <td>${formatDateCell(v.updatedAt)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير الأعمال الطوعية</title>
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
          <h1>تقرير الأعمال الطوعية</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>النوع</th>
                <th>الدور</th>
                <th>تاريخ البداية</th>
                <th>تاريخ الانتهاء</th>
                <th>المدة</th>
                <th>الحالة</th>
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

  const stats = useVolunteeringStats(volunteerings);
  const filteredForDisplay = volunteerings;

  // استخراج السنوات الفريدة للفلاتر
  const uniqueYears = Array.from(
    new Set(volunteerings.map((v) => new Date(v.startDate).getFullYear()))
  )
    .sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    title: "",
    type: "HELPING_POOR_NEEDY" as "HELPING_POOR_NEEDY" | "ENVIRONMENTAL_PROTECTION" | "EMERGENCY_SUPPORT" | "CULTURAL_EDUCATIONAL_ACTIVITIES" | "HELPING_ELDERLY" | "SPORTS_ACTIVITIES" | "SOCIAL_ACTIVITIES" | "HOSPITALS_ORPHANAGES" | "EDUCATION_FIELD" | "COMMUNITY_DEVELOPMENT" | "HUMAN_RIGHTS" | "ARTS_CULTURE" | "TECHNOLOGY_COMMUNICATIONS" | "LAW_FIELD" | "HEALTH_FIELD" | "FIRST_AID" | "ANIMAL_WELFARE",
    role: "VOLUNTEER" as "COORDINATOR" | "LEADER" | "PARTICIPANT" | "MEMBER" | "VOLUNTEER",
    organizationName: "",
    startDate: getTodayISO(),
    endDate: "" as string | null,
    isOngoing: false,
    durationYears: 0,
    durationMonths: 0,
    durationDays: 0,
    durationUnit: "YEAR" as "YEAR" | "MONTH" | "DAY",
    location: "",
    beneficiaries: "",
    certificates: "",
    description: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: formData.title,
        type: formData.type,
        role: formData.role,
        organizationName: formData.organizationName,
        startDate: new Date(formData.startDate),
        endDate: formData.isOngoing ? null : (formData.endDate ? new Date(formData.endDate) : null),
        isOngoing: formData.isOngoing,
        durationYears: formData.durationYears,
        durationMonths: formData.durationMonths,
        durationDays: formData.durationDays,
        durationUnit: formData.durationUnit,
        location: formData.location || null,
        beneficiaries: formData.beneficiaries || null,
        certificates: formData.certificates || null,
        description: formData.description || null,
      };
      const result = editingVolunteering
        ? await updateVolunteering({ ...payload, id: editingVolunteering.id })
        : await createVolunteering(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingVolunteering ? "✅ تم تحديث العمل الطوعي بنجاح" : "✅ تم إضافة العمل الطوعي بنجاح");
      setIsAddOpen(false);
      setEditingVolunteering(null);
      setFormData({
        title: "",
        type: "HELPING_POOR_NEEDY",
        role: "VOLUNTEER",
        organizationName: "",
        startDate: getTodayISO(),
        endDate: null,
        isOngoing: false,
        durationYears: 0,
        durationMonths: 0,
        durationDays: 0,
        durationUnit: "YEAR",
        location: "",
        beneficiaries: "",
        certificates: "",
        description: "",
      });
      loadVolunteerings();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (volunteering?: Volunteering) => {
    if (volunteering) {
      setEditingVolunteering(volunteering);
      const startDateStr = new Date(volunteering.startDate).toISOString().slice(0, 10);
      const endDateStr = volunteering.endDate ? new Date(volunteering.endDate).toISOString().slice(0, 10) : null;
      
      // حساب المدة تلقائياً إذا كان هناك تاريخ نهاية
      let calculatedDuration = { years: 0, months: 0, days: 0, unit: "YEAR" as "YEAR" | "MONTH" | "DAY" };
      if (!volunteering.isOngoing && endDateStr) {
        const duration = calculateDuration(startDateStr, endDateStr);
        calculatedDuration = {
          years: duration.years,
          months: duration.months,
          days: duration.days,
          unit: duration.years > 0 ? "YEAR" : duration.months > 0 ? "MONTH" : "DAY",
        };
      }
      
      setFormData({
        title: volunteering.title,
        type: volunteering.type,
        role: volunteering.role,
        organizationName: volunteering.organizationName,
        startDate: startDateStr,
        endDate: endDateStr,
        isOngoing: volunteering.isOngoing,
        durationYears: calculatedDuration.years || volunteering.durationYears,
        durationMonths: calculatedDuration.months || volunteering.durationMonths,
        durationDays: calculatedDuration.days || volunteering.durationDays,
        durationUnit: calculatedDuration.unit || volunteering.durationUnit,
        location: volunteering.location || "",
        beneficiaries: volunteering.beneficiaries || "",
        certificates: volunteering.certificates || "",
        description: volunteering.description || "",
      });
    } else {
      setEditingVolunteering(null);
      setFormData({
        title: "",
        type: "HELPING_POOR_NEEDY",
        role: "VOLUNTEER",
        organizationName: "",
        startDate: getTodayISO(),
        endDate: null,
        isOngoing: false,
        durationYears: 0,
        durationMonths: 0,
        durationDays: 0,
        durationUnit: "YEAR",
        location: "",
        beneficiaries: "",
        certificates: "",
        description: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingVolunteering(null);
    setFormData({
      title: "",
      type: "HELPING_POOR_NEEDY",
      role: "VOLUNTEER",
      organizationName: "",
      startDate: getTodayISO(),
      endDate: null,
      isOngoing: false,
      durationYears: 0,
      durationMonths: 0,
      durationDays: 0,
      durationUnit: "YEAR",
      location: "",
      beneficiaries: "",
      certificates: "",
      description: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العمل الطوعي؟")) return;
    startTransition(async () => {
      const result = await deleteVolunteering(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف العمل الطوعي بنجاح");
      setIsDetailsOpen(false);
      setViewingVolunteering(null);
      loadVolunteerings();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (v: Volunteering) => {
    setViewingVolunteering(v);
    setIsDetailsOpen(true);
  };

  const shareVolunteeringViaWhatsApp = (v: Volunteering) => {
    const lines: string[] = [
      `*${v.title}*`,
      `نوع العمل: ${typeLabels[v.type]}`,
      `الدور: ${roleLabels[v.role]}`,
      `الجهة المنظمة: ${v.organizationName}`,
      `تاريخ البداية: ${formatDate(v.startDate)}`,
    ];
    if (v.endDate) {
      lines.push(`تاريخ النهاية: ${formatDate(v.endDate)}`);
    }
    if (v.isOngoing) {
      lines.push(`الحالة: مستمر`);
    }
    if (v.location) {
      lines.push(`الموقع: ${v.location}`);
    }
    if (v.description) {
      lines.push(`الوصف: ${v.description}`);
    }
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // بيانات الرسوم البيانية
  const byYearData = stats.byYear.map((item) => ({
    name: item.name,
    "عدد الأعمال الطوعية": item.value,
  }));

  const byTypeData = stats.byType.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: typeColors[index % typeColors.length],
  }));

  const byRoleData = stats.byRole.map((item) => ({
    name: item.name,
    "عدد الأعمال الطوعية": item.value,
  }));

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">الأعمال الطوعية</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">سجّل أعمالك الطوعية</p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة عمل طوعي
        </Button>
      </div>

      <VolunteeringKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          {/* الصف الأول: عدد الأعمال الطوعية حسب السنة (أكبر) + توزيع أنواع الأعمال الطوعية (أصغر) */}
          {/* عدد الأعمال الطوعية حسب السنة (Bar) - col-span-12 lg:col-span-8 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">عدد الأعمال الطوعية حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byYearData.length > 0 ? (
                  <BarChart
                    data={byYearData}
                    dataKeys={["عدد الأعمال الطوعية"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد الأعمال الطوعية في ${year}: ${count}`}
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
                  (a, b) => (b["عدد الأعمال الطوعية"] > a["عدد الأعمال الطوعية"] ? b : a),
                  byYearData[0]
                );
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة أعمال طوعية: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد الأعمال الطوعية"]} عمل طوعي)
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* توزيع أنواع الأعمال الطوعية (Pie) - col-span-12 lg:col-span-4 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع أنواع الأعمال الطوعية</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byTypeData.length > 0 ? (
                  <PieChart
                    data={byTypeData}
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
              {byTypeData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع أنواع الأعمال الطوعية (مساعدة الفقراء، حماية البيئة، التطوع في التعليم، وغيرها)
                </p>
              )}
            </CardContent>
          </Card>

          {/* الصف الثاني: توزيع الأدوار (كامل العرض) - col-span-12 */}
          <Card className="border-slate-100 bg-white shadow-lg col-span-12">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">توزيع الأدوار</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col">
              <div className="flex-1 min-h-0">
                {byRoleData.length > 0 ? (
                  <BarChart
                    data={byRoleData}
                    dataKeys={["عدد الأعمال الطوعية"]}
                    colors={["#10b981"]}
                    tooltipLabel={(name, count) => `عدد الأعمال الطوعية ${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {byRoleData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع الأدوار (منسق، قائد، مشارك، عضو، متطوع)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر عمل طوعي مضافة */}
      {volunteerings.length > 0 && (
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-500">آخر عمل طوعي مضافة</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-1" dir="rtl">
                  {volunteerings[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(volunteerings[0].startDate)}
                  </span>
                  <Badge variant={volunteerings[0].isOngoing ? "default" : "secondary"} className={volunteerings[0].isOngoing ? "bg-green-100 text-green-800" : ""}>
                    {volunteerings[0].isOngoing ? "مستمر" : "مكتمل"}
                  </Badge>
                  <span className="text-slate-600">
                    {typeLabels[volunteerings[0].type]}
                  </span>
                  <span className="text-slate-600">
                    {roleLabels[volunteerings[0].role]}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(volunteerings[0])}
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
            <div className="text-base font-semibold text-slate-800">جدول الأعمال الطوعية</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">بحث في الأعمال الطوعية</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="flex flex-wrap items-end gap-3" dir="rtl">
              {/* البحث */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="عنوان العمل الطوعي..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
              </div>
              {/* نوع العمل */}
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع العمل</label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    loadVolunteerings({ type: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* الدور */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">الدور</label>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v);
                    loadVolunteerings({ role: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* السنة */}
              {uniqueYears.length > 0 && (
                <div className="min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                  <Select
                    value={yearFilter}
                    onValueChange={(v) => {
                      setYearFilter(v);
                      loadVolunteerings({ year: v });
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
                {search || typeFilter !== "__all__" || roleFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي عمل طوعي بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || typeFilter !== "__all__" || roleFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد أعمال طوعية تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول عمل طوعي لك."}
              </p>
              {!search && typeFilter === "__all__" && roleFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول عمل طوعي
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
                      <col style={{ width: "7%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">عنوان العمل الطوعي</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع العمل</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الدور</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الجهة المنظمة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">تاريخ البداية</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">المدة</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((v) => (
                        <TableRow key={v.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(v)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(v)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا العمل الطوعي؟")) {
                                      startTransition(async () => {
                                        const res = await deleteVolunteering(v.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف العمل الطوعي بنجاح");
                                          loadVolunteerings();
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
                              {v.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {typeLabels[v.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              {roleLabels[v.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle text-sm text-slate-700" dir="rtl">
                            {v.organizationName}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(v.startDate)}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {v.isOngoing ? (
                              <span className="text-slate-500">مستمر</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                {v.durationYears > 0 && <span>{v.durationYears} سنة</span>}
                                {v.durationMonths > 0 && <span>{v.durationMonths} شهر</span>}
                                {v.durationDays > 0 && <span>{v.durationDays} يوم</span>}
                                {v.durationYears === 0 && v.durationMonths === 0 && v.durationDays === 0 && (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge variant={v.isOngoing ? "default" : "secondary"} className={v.isOngoing ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                              {v.isOngoing ? "مستمر" : "مكتمل"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards List */}
              <div className="md:hidden space-y-3">
                {filteredForDisplay.map((v) => (
                  <Card key={v.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {v.title}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(v)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(v)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا العمل الطوعي؟")) {
                                  startTransition(async () => {
                                    const res = await deleteVolunteering(v.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف العمل الطوعي بنجاح");
                                      loadVolunteerings();
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
                          <span className="text-slate-500">نوع العمل:</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 mr-2">
                            {typeLabels[v.type]}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-500">الدور:</span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 mr-2">
                            {roleLabels[v.role]}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-500">الجهة المنظمة:</span>
                          <span className="text-slate-900 font-medium mr-2" dir="rtl">
                            {v.organizationName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">تاريخ البداية:</span>
                          <span className="text-slate-900 font-medium mr-2">
                            {formatDate(v.startDate)}
                          </span>
                        </div>
                        {!v.isOngoing && (
                          <div>
                            <span className="text-slate-500">المدة:</span>
                            <span className="text-slate-900 font-medium mr-2">
                              {v.durationYears > 0 && `${v.durationYears} سنة `}
                              {v.durationMonths > 0 && `${v.durationMonths} شهر `}
                              {v.durationDays > 0 && `${v.durationDays} يوم`}
                              {v.durationYears === 0 && v.durationMonths === 0 && v.durationDays === 0 && "—"}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">الحالة:</span>
                          <Badge variant={v.isOngoing ? "default" : "secondary"} className={v.isOngoing ? "bg-green-100 text-green-800 mr-2" : "bg-slate-100 text-slate-800 mr-2"}>
                            {v.isOngoing ? "مستمر" : "مكتمل"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setViewingVolunteering(v);
                            setIsDetailsOpen(true);
                          }}
                        >
                          عرض التفاصيل
                        </Button>
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
            <DialogTitle>{editingVolunteering ? "تعديل الأعمال الطوعية" : "إضافة عمل طوعي"}</DialogTitle>
            <DialogDescription>
              {editingVolunteering
                ? "تعديل بيانات الأعمال الطوعية."
                : "أدخل بيانات الأعمال الطوعية. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان العمل الطوعي *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان العمل الطوعي"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>نوع العمل *</Label>
              <Select
                value={formData.type}
                onValueChange={(v: any) => {
                  setFormData((p) => ({ ...p, type: v }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الدور *</Label>
              <Select
                value={formData.role}
                onValueChange={(v: any) => {
                  setFormData((p) => ({ ...p, role: v }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="organizationName">اسم الجهة المنظمة للعمل الطوعي *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => setFormData((p) => ({ ...p, organizationName: e.target.value }))}
                placeholder="اسم الجهة المنظمة"
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startDate">تاريخ البداية *</Label>
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
                  
                  // إذا كان هناك تاريخ نهاية، إعادة حساب المدة تلقائياً
                  if (!formData.isOngoing && formData.endDate && selectedDate <= formData.endDate) {
                    const duration = calculateDuration(selectedDate, formData.endDate);
                    setFormData((p) => ({
                      ...p,
                      startDate: selectedDate,
                      durationYears: duration.years,
                      durationMonths: duration.months,
                      durationDays: duration.days,
                      durationUnit: duration.years > 0 ? "YEAR" : duration.months > 0 ? "MONTH" : "DAY",
                    }));
                  } else {
                    setFormData((p) => ({ ...p, startDate: selectedDate }));
                  }
                }}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isOngoing}
                  onChange={(e) => {
                    setFormData((p) => ({
                      ...p,
                      isOngoing: e.target.checked,
                      endDate: e.target.checked ? null : p.endDate,
                    }));
                  }}
                  className="rounded"
                />
                العمل الطوعي مستمر
              </Label>
            </div>
            {!formData.isOngoing && (
              <>
                <div>
                  <Label htmlFor="endDate">تاريخ النهاية *</Label>
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
                      
                      // حساب المدة تلقائياً من الفرق بين التاريخين
                      const duration = calculateDuration(formData.startDate, selectedDate);
                      
                      setFormData((p) => ({
                        ...p,
                        endDate: selectedDate,
                        durationYears: duration.years,
                        durationMonths: duration.months,
                        durationDays: duration.days,
                        durationUnit: duration.years > 0 ? "YEAR" : duration.months > 0 ? "MONTH" : "DAY",
                      }));
                    }}
                    required={!formData.isOngoing}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
                </div>
                {formData.endDate && (
                  <div>
                    <Label>المدة المحسوبة تلقائياً</Label>
                    <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">السنوات:</span>
                          <span className="font-semibold text-slate-900">{formData.durationYears}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">الأشهر:</span>
                          <span className="font-semibold text-slate-900">{formData.durationMonths}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">الأيام:</span>
                          <span className="font-semibold text-slate-900">{formData.durationDays}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">الوحدة:</span>
                          <Badge variant="outline" className="bg-white">
                            {durationUnitLabels[formData.durationUnit]}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        تم حساب المدة تلقائياً من الفرق بين تاريخ البداية وتاريخ النهاية
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div>
              <Label htmlFor="location">الموقع (اختياري)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="الموقع"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="beneficiaries">المستفيدون (اختياري)</Label>
              <Input
                id="beneficiaries"
                value={formData.beneficiaries}
                onChange={(e) => setFormData((p) => ({ ...p, beneficiaries: e.target.value }))}
                placeholder="المستفيدون"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="certificates">الشهادات أو الوثائق (اختياري)</Label>
              <Input
                id="certificates"
                value={formData.certificates}
                onChange={(e) => setFormData((p) => ({ ...p, certificates: e.target.value }))}
                placeholder="الشهادات أو الوثائق"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف الإضافي (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف إضافي عن العمل الطوعي..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingVolunteering ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة العمل طوعي"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingVolunteering(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل الأعمال الطوعية
            </DialogTitle>
            <DialogDescription className="sr-only">عرض تفاصيل الأعمال الطوعية المحددة</DialogDescription>
          </DialogHeader>
          {viewingVolunteering && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingVolunteering.title}
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <span className="text-slate-500">نوع العمل</span>
                <span className="font-medium text-slate-900">{typeLabels[viewingVolunteering.type]}</span>
                <span className="text-slate-500">الدور</span>
                <span className="font-medium text-slate-900">{roleLabels[viewingVolunteering.role]}</span>
                <span className="text-slate-500">الجهة المنظمة</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingVolunteering.organizationName}</span>
                <span className="text-slate-500">تاريخ البداية</span>
                <span className="font-medium text-slate-900">{formatDate(viewingVolunteering.startDate)}</span>
                {viewingVolunteering.endDate && (
                  <>
                    <span className="text-slate-500">تاريخ النهاية</span>
                    <span className="font-medium text-slate-900">{formatDate(viewingVolunteering.endDate)}</span>
                  </>
                )}
                <span className="text-slate-500">الحالة</span>
                <span className="font-medium text-slate-900">
                  <Badge variant={viewingVolunteering.isOngoing ? "default" : "secondary"} className={viewingVolunteering.isOngoing ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                    {viewingVolunteering.isOngoing ? "مستمر" : "مكتمل"}
                  </Badge>
                </span>
                <span className="text-slate-500">المدة</span>
                <span className="font-medium text-slate-900">
                  {viewingVolunteering.durationYears > 0 && `${viewingVolunteering.durationYears} سنة `}
                  {viewingVolunteering.durationMonths > 0 && `${viewingVolunteering.durationMonths} شهر `}
                  {viewingVolunteering.durationDays > 0 && `${viewingVolunteering.durationDays} يوم `}
                  ({durationUnitLabels[viewingVolunteering.durationUnit]})
                </span>
                {viewingVolunteering.location && (
                  <>
                    <span className="text-slate-500">الموقع</span>
                    <span className="font-medium text-slate-900" dir="rtl">{viewingVolunteering.location}</span>
                  </>
                )}
                {viewingVolunteering.beneficiaries && (
                  <>
                    <span className="text-slate-500">المستفيدون</span>
                    <span className="font-medium text-slate-900" dir="rtl">{viewingVolunteering.beneficiaries}</span>
                  </>
                )}
                {viewingVolunteering.certificates && (
                  <>
                    <span className="text-slate-500">الشهادات أو الوثائق</span>
                    <span className="font-medium text-slate-900" dir="rtl">{viewingVolunteering.certificates}</span>
                  </>
                )}
                {viewingVolunteering.description && (
                  <>
                    <span className="text-slate-500">الوصف الإضافي</span>
                    <span className="font-medium text-slate-900" dir="rtl">
                      {viewingVolunteering.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareVolunteeringViaWhatsApp(viewingVolunteering)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingVolunteering(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingVolunteering);
                    setViewingVolunteering(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingVolunteering.id)}
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
