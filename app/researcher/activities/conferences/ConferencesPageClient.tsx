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
import { Plus, MoreVertical, Eye, Trash2, Calendar, MapPin, Building2, Loader2, Pencil, MessageCircle } from "lucide-react";
import { addConference, updateConference, removeConference, listConferences } from "./actions";
import type { ResearcherConference } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const scopeLabels: Record<string, string> = { GLOBAL: "عالمي", LOCAL: "محلي" };
const participationLabels: Record<string, string> = { RESEARCHER: "باحث", ATTENDEE: "حضور" };

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

function useConferenceStats(conferences: ResearcherConference[]) {
  const total = conferences.length;
  const global = conferences.filter((c) => c.scope === "GLOBAL").length;
  const local = conferences.filter((c) => c.scope === "LOCAL").length;
  const asResearcher = conferences.filter((c) => c.participationType === "RESEARCHER").length;
  const committeeMember = conferences.filter((c) => c.isCommitteeMember).length;
  const byYear = conferences.reduce<Record<number, number>>((acc, c) => {
    const y = new Date(c.date).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});
  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, "عدد المؤتمرات": count }))
    .sort((a, b) => Number(a.name) - Number(b.name));
  // نوع المشاركة عبر الزمن: باحث vs حضور حسب السنة (للتقييم العلمي وملف الترقيات)
  const byYearParticipation = conferences.reduce<Record<number, { researcher: number; attendee: number }>>((acc, c) => {
    const y = new Date(c.date).getFullYear();
    if (!acc[y]) acc[y] = { researcher: 0, attendee: 0 };
    if (c.participationType === "RESEARCHER") acc[y].researcher += 1;
    else acc[y].attendee += 1;
    return acc;
  }, {});
  const participationByYearData = Object.entries(byYearParticipation)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, v]) => ({
      name: year,
      باحث: v.researcher,
      حضور: v.attendee,
    }));
  const scopePieData = [
    ...(global > 0 ? [{ name: "عالمي", value: global, color: "#2563EB" }] : []),
    ...(local > 0 ? [{ name: "محلي", value: local, color: "#10b981" }] : []),
  ];
  const participationPieData = [
    ...(asResearcher > 0 ? [{ name: "باحث", value: asResearcher, color: "#8b5cf6" }] : []),
    ...(total - asResearcher > 0 ? [{ name: "حضور", value: total - asResearcher, color: "#f59e0b" }] : []),
  ].filter((d) => d.value > 0);

  return {
    total,
    global,
    local,
    asResearcher,
    committeeMember,
    byYearData,
    participationByYearData,
    scopePieData,
    participationPieData,
  };
}

/** سطر توضيحي يعكس حالة المستخدم الحالية (Context Awareness) */
function getContextSummary(conferences: ResearcherConference[], stats: ReturnType<typeof useConferenceStats>): string {
  if (conferences.length === 0) {
    return "لم تُسجّل بعد في أي مؤتمر. ابدأ بإضافة مؤتمر.";
  }
  if (conferences.length === 1) {
    const c = conferences[0];
    const scope = scopeLabels[c.scope];
    const participation = participationLabels[c.participationType];
    const committee = c.isCommitteeMember ? " وعضو لجنة" : "";
    return `أنت مسجل حالياً في مؤتمر واحد ${scope} كمشارك ${participation}${committee}.`;
  }
  const { total, local, global, asResearcher, committeeMember } = stats;
  const attendee = total - asResearcher;
  const parts: string[] = [`أنت مسجل حالياً في ${total} مؤتمرات: ${local} محلي، ${global} عالمي`];
  if (asResearcher > 0 || attendee > 0) {
    const sub: string[] = [];
    if (asResearcher > 0) sub.push(`${asResearcher} كمشارك باحث`);
    if (attendee > 0) sub.push(`${attendee} كمشارك حضور`);
    parts.push(`— منها ${sub.join(" و ")}`);
  }
  if (committeeMember > 0) {
    parts.push(`وعضو لجنة في ${committeeMember} مؤتمر`);
  }
  return `${parts.join(". ")}.`;
}

interface ConferencesPageClientProps {
  initialConferences: ResearcherConference[];
}

export function ConferencesPageClient({ initialConferences }: ConferencesPageClientProps) {
  const [conferences, setConferences] = useState<ResearcherConference[]>(initialConferences);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("__all__");
  const [participationFilter, setParticipationFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConference, setEditingConference] = useState<ResearcherConference | null>(null);
  const [viewingConference, setViewingConference] = useState<ResearcherConference | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadConferences = (overrides?: {
    search?: string;
    scope?: string;
    participationType?: string;
  }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const scope = overrides?.scope ?? scopeFilter;
      const part = overrides?.participationType ?? participationFilter;
      const result = await listConferences({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        scope: scope === "__all__" ? undefined : scope,
        participationType: part === "__all__" ? undefined : part,
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setConferences(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadConferences();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    scope: scopeFilter === "__all__" ? undefined : scopeFilter,
    participationType: participationFilter === "__all__" ? undefined : participationFilter,
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listConferences(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((c: ResearcherConference) => ({
      العنوان: c.title ?? "",
      الراعي: c.sponsor ?? "—",
      التاريخ: formatDateCell(c.date),
      المكان: c.location ?? "—",
      النطاق: scopeLabels[c.scope] ?? c.scope,
      "نوع المشاركة": participationLabels[c.participationType] ?? c.participationType,
      "عضو لجنة": c.isCommitteeMember ? "نعم" : "لا",
      "تاريخ الإنشاء": formatDateCell(c.createdAt),
      "آخر تحديث": formatDateCell(c.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المؤتمرات");
    XLSX.writeFile(workbook, "conferences-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listConferences(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = result.items
      .map(
        (c: ResearcherConference) => `
        <tr>
          <td>${c.title ?? "-"}</td>
          <td>${c.sponsor ?? "-"}</td>
          <td>${formatDateCell(c.date)}</td>
          <td>${c.location ?? "-"}</td>
          <td>${scopeLabels[c.scope] ?? c.scope}</td>
          <td>${participationLabels[c.participationType] ?? c.participationType}</td>
          <td>${c.isCommitteeMember ? "نعم" : "لا"}</td>
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
          <title>تقرير المؤتمرات</title>
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
          <h1>تقرير المؤتمرات</h1>
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>الراعي</th>
                <th>التاريخ</th>
                <th>المكان</th>
                <th>النطاق</th>
                <th>نوع المشاركة</th>
                <th>عضو لجنة</th>
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

  const stats = useConferenceStats(conferences);
  const filteredForDisplay = conferences;

  const [formData, setFormData] = useState({
    title: "",
    sponsor: "",
    date: getTodayISO(),
    location: "",
    scope: "LOCAL" as "GLOBAL" | "LOCAL",
    isCommitteeMember: false,
    participationType: "ATTENDEE" as "ATTENDEE" | "RESEARCHER",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...formData,
        date: new Date(formData.date),
      };
      const result = editingConference
        ? await updateConference({ ...payload, id: editingConference.id })
        : await addConference(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingConference ? "✅ تم تحديث المؤتمر بنجاح" : "✅ تم إضافة المؤتمر بنجاح");
      setIsAddOpen(false);
      setEditingConference(null);
      setFormData({
        title: "",
        sponsor: "",
        date: getTodayISO(),
        location: "",
        scope: "LOCAL",
        isCommitteeMember: false,
        participationType: "ATTENDEE",
      });
      loadConferences();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (conference?: ResearcherConference) => {
    if (conference) {
      setEditingConference(conference);
      const d = new Date(conference.date);
      setFormData({
        title: conference.title,
        sponsor: conference.sponsor,
        date: d.toISOString().slice(0, 10),
        location: conference.location,
        scope: conference.scope,
        isCommitteeMember: conference.isCommitteeMember,
        participationType: conference.participationType,
      });
    } else {
      setEditingConference(null);
      setFormData({
        title: "",
        sponsor: "",
        date: getTodayISO(),
        location: "",
        scope: "LOCAL",
        isCommitteeMember: false,
        participationType: "ATTENDEE",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingConference(null);
    setFormData({
      title: "",
      sponsor: "",
      date: getTodayISO(),
      location: "",
      scope: "LOCAL",
      isCommitteeMember: false,
      participationType: "ATTENDEE",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المؤتمر؟")) return;
    startTransition(async () => {
      const result = await removeConference(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف المؤتمر بنجاح");
      setIsDetailsOpen(false);
      setViewingConference(null);
      loadConferences();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (c: ResearcherConference) => {
    setViewingConference(c);
    setIsDetailsOpen(true);
  };

  const shareConferenceViaWhatsApp = (c: ResearcherConference) => {
    const lines: string[] = [
      `*${c.title}*`,
      `الجهة الراعية: ${c.sponsor}`,
      `التاريخ: ${formatDate(c.date)}`,
      `المكان: ${c.location}`,
      `النطاق: ${scopeLabels[c.scope]}`,
      `نوع المشاركة: ${participationLabels[c.participationType]}`,
    ];
    if (c.isCommitteeMember) lines.push("عضو لجنة: نعم");
    const text = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const conferenceActionsMenu = (c: ResearcherConference) => (
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
            if (confirm("هل أنت متأكد من حذف هذا المؤتمر؟")) {
              startTransition(async () => {
                const res = await removeConference(c.id);
                if (res.error) showToast(res.error, "error");
                else {
                  showToast("✅ تم حذف المؤتمر بنجاح");
                  loadConferences();
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
        <div className="min-w-0">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">المؤتمرات</h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">
            سجّل مشاركاتك في المؤتمرات المحلية والعالمية
          </p>
          <p className="text-[11px] md:text-sm text-slate-500 md:text-slate-600 mt-0.5 md:mt-1.5 md:font-medium line-clamp-2 md:line-clamp-none" aria-live="polite">
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
          <span className="hidden md:inline">إضافة مؤتمر</span>
        </Button>
      </div>

      {/* موبايل: مؤشرات متساوية الحجم */}
      <div className="grid grid-cols-2 gap-2 md:hidden auto-rows-fr">
        {[
          { label: "الإجمالي", value: String(stats.total), icon: Calendar, softBg: "bg-blue-50", softText: "text-blue-600" },
          { label: "عالمي / محلي", value: `${stats.global} / ${stats.local}`, icon: MapPin, softBg: "bg-teal-50", softText: "text-teal-600" },
          { label: "مشاركة كباحث", value: String(stats.asResearcher), icon: Building2, softBg: "bg-purple-50", softText: "text-purple-600" },
          { label: "عضو لجنة", value: String(stats.committeeMember), icon: Eye, softBg: "bg-orange-50", softText: "text-orange-600" },
        ].map(({ label, value, icon: Icon, softBg, softText }) => (
          <div
            key={label}
            className="h-[64px] rounded-xl border border-slate-100 bg-white px-2.5 py-2 min-w-0 shadow-sm flex items-center"
          >
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className={`h-8 w-8 rounded-lg ${softBg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-3.5 w-3.5 ${softText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold tabular-nums text-gray-900 leading-none truncate">{value}</div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* حاسوب: المؤشرات كما كانت */}
      <div className="hidden md:grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">{stats.total}</div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">إجمالي المؤتمرات</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 border-t-2 border-t-green-400 border-r-2 border-r-blue-700 bg-white shadow-lg">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="bg-teal-500 p-1.5 rounded-lg flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">
                {stats.global} / {stats.local}
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">عالمي / محلي</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="bg-purple-500 p-1.5 rounded-lg flex-shrink-0">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">{stats.asResearcher}</div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">مشاركة كباحث</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 border-r-4 border-r-orange-500 bg-white shadow-lg">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="bg-orange-500 p-1.5 rounded-lg flex-shrink-0">
                <Eye className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">{stats.committeeMember}</div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">عضو لجنة</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2.5 md:mb-4">الرسوم البيانية</h3>

        {/* موبايل: تخطيط متناسق — شريطيان بعرض كامل وارتفاع موحّد + دائرتان متجاورتان */}
        <div className="md:hidden space-y-2">
          <Card className="border-slate-100 bg-white shadow-sm gap-0 overflow-hidden rounded-xl">
            <CardHeader className="px-2.5 pt-2 pb-0">
              <CardTitle className="text-[11px] font-semibold text-gray-900">حسب السنة</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-1">
              <div className="h-[132px]">
                {stats.byYearData.length > 0 ? (
                  <BarChart
                    data={stats.byYearData}
                    dataKeys={["عدد المؤتمرات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد المؤتمرات في ${year}: ${count}`}
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
                  النطاق
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {stats.scopePieData.length > 0 ? (
                    <PieChart
                      data={stats.scopePieData}
                      outerRadius={42}
                      legendLayout="horizontal"
                      legendVerticalAlign="bottom"
                      legendWrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                      tooltipLabel={(name, value) =>
                        `عدد المؤتمرات ${name === "عالمي" ? "العالمية" : "المحلية"}: ${value}`
                      }
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
                  المشاركة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <div className="h-[130px]">
                  {stats.participationPieData.length > 0 ? (
                    <PieChart
                      data={stats.participationPieData}
                      outerRadius={42}
                      legendLayout="horizontal"
                      legendVerticalAlign="bottom"
                      legendWrapperStyle={{ fontSize: 10, paddingTop: 0 }}
                      tooltipLabel={(name, value) => `عدد المشاركات كـ${name}: ${value}`}
                    />
                  ) : (
                    <EmptyChartState type="pie" />
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
                {stats.participationByYearData.length > 0 ? (
                  <BarChart
                    data={stats.participationByYearData}
                    dataKeys={["باحث", "حضور"]}
                    colors={["#8b5cf6", "#f59e0b"]}
                    stackId="participation"
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* حاسوب: التخطيط السابق بدون تغيير */}
        <div className="hidden md:grid gap-4 grid-cols-2">
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">حسب السنة</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {stats.byYearData.length > 0 ? (
                  <BarChart
                    data={stats.byYearData}
                    dataKeys={["عدد المؤتمرات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد المؤتمرات في ${year}: ${count}`}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {stats.byYearData.length > 0 && (() => {
                const top = stats.byYearData.reduce((a, b) => (b["عدد المؤتمرات"] > a["عدد المؤتمرات"] ? b : a), stats.byYearData[0]);
                return (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                    أكثر سنة مشاركة: <span className="font-medium text-slate-700">{top.name}</span> ({top["عدد المؤتمرات"]} مؤتمر)
                  </p>
                );
              })()}
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">النطاق (عالمي / محلي)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {stats.scopePieData.length > 0 ? (
                  <PieChart
                    data={stats.scopePieData}
                    tooltipLabel={(name, value) => `عدد المؤتمرات ${name === "عالمي" ? "العالمية" : "المحلية"}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
              {stats.scopePieData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  {stats.scopePieData.length === 2
                    ? `عالمي: ${stats.scopePieData.find((d) => d.name === "عالمي")?.value ?? 0} — محلي: ${stats.scopePieData.find((d) => d.name === "محلي")?.value ?? 0}`
                    : stats.scopePieData.map((d) => `${d.name}: ${d.value}`).join(" — ")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-lg col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">نوع المشاركة عبر الزمن</CardTitle>
              <p className="text-xs text-slate-500 mt-1">باحث vs حضور — مفيد للتقييم العلمي وملف الترقيات</p>
            </CardHeader>
            <CardContent>
              <div style={{ height: "220px" }}>
                {stats.participationByYearData.length > 0 ? (
                  <BarChart
                    data={stats.participationByYearData}
                    dataKeys={["باحث", "حضور"]}
                    colors={["#8b5cf6", "#f59e0b"]}
                    stackId="participation"
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
              {stats.participationByYearData.length > 0 && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 text-center">
                  توزيع المشاركة (باحث / حضور) حسب السنة
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl">
        <CardContent className="p-3 md:p-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
            <div className="text-sm md:text-base font-semibold text-slate-800 truncate">جدول المؤتمرات</div>
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

          {/* فلاتر موبايل: سطران */}
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
                value={scopeFilter}
                onValueChange={(v) => {
                  setScopeFilter(v);
                  loadConferences({ scope: v });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="النطاق">
                  <SelectValue placeholder="النطاق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل النطاق</SelectItem>
                  <SelectItem value="GLOBAL">عالمي</SelectItem>
                  <SelectItem value="LOCAL">محلي</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={participationFilter}
                onValueChange={(v) => {
                  setParticipationFilter(v);
                  loadConferences({ participationType: v });
                }}
              >
                <SelectTrigger className="h-8 rounded-lg bg-white text-[11px] px-2" aria-label="نوع المشاركة">
                  <SelectValue placeholder="المشاركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل المشاركة</SelectItem>
                  <SelectItem value="RESEARCHER">باحث</SelectItem>
                  <SelectItem value="ATTENDEE">حضور</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          {/* فلاتر حاسوب */}
          <div className="hidden md:block">
            <h3 className="text-base font-semibold text-slate-800 mb-3">بحث في المؤتمرات</h3>
            <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
              <div className="flex flex-wrap items-end gap-3" dir="rtl">
                <div className="flex flex-1 min-w-[200px] max-w-[360px] items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="العنوان، الراعي، المكان..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-9 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
                <div className="w-[130px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">النطاق</label>
                  <Select
                    value={scopeFilter}
                    onValueChange={(v) => {
                      setScopeFilter(v);
                      loadConferences({ scope: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="GLOBAL">عالمي</SelectItem>
                      <SelectItem value="LOCAL">محلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[140px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع المشاركة</label>
                  <Select
                    value={participationFilter}
                    onValueChange={(v) => {
                      setParticipationFilter(v);
                      loadConferences({ participationType: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      <SelectItem value="RESEARCHER">باحث</SelectItem>
                      <SelectItem value="ATTENDEE">حضور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {filteredForDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 md:px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="rounded-full bg-white border border-slate-200 p-4 md:p-6 mb-3 md:mb-5 shadow-sm">
                <Calendar className="h-8 w-8 md:h-14 md:w-14 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-xl font-semibold text-slate-800 mb-1 md:mb-2 text-center">
                {search || scopeFilter !== "__all__" || participationFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي مشاركة بعد"}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 text-center max-w-md mb-4 md:mb-6">
                {search || scopeFilter !== "__all__" || participationFilter !== "__all__"
                  ? "لا توجد مؤتمرات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول مؤتمر لك."}
              </p>
              {!search && scopeFilter === "__all__" && participationFilter === "__all__" && (
                <Button onClick={() => handleOpenAdd()} size="sm" className="md:h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm">
                  <Plus className="h-4 w-4 md:h-5 md:w-5 ml-1 md:ml-2" />
                  إضافة أول مؤتمر
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* بطاقات موبايل — ارتفاع موحّد تقريباً */}
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
                          {c.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {[
                            formatDate(c.date),
                            scopeLabels[c.scope],
                            participationLabels[c.participationType],
                            c.isCommitteeMember ? "عضو لجنة" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </button>
                      {conferenceActionsMenu(c)}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">الراعي</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">{c.sponsor || "—"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400">المكان</p>
                        <p className="text-[11px] font-medium text-slate-800 truncate">{c.location || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* جدول حاسوب */}
              <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">العنوان</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">الجهة الراعية</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">المكان</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">النطاق</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">عضو لجنة</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">نوع المشاركة</TableHead>
                      <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForDisplay.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50">
                        <TableCell className="align-middle whitespace-nowrap">
                          {conferenceActionsMenu(c)}
                        </TableCell>
                        <TableCell className="align-middle max-w-[200px]">
                          <span className="font-medium text-slate-900 truncate block" dir="rtl">
                            {c.title}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle text-slate-700 truncate max-w-[140px]" dir="rtl">
                          {c.sponsor}
                        </TableCell>
                        <TableCell className="align-middle text-slate-700 truncate max-w-[140px]" dir="rtl">
                          {c.location}
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {scopeLabels[c.scope]}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap">
                          {c.isCommitteeMember ? (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">نعم</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                          {participationLabels[c.participationType]}
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                          {formatDate(c.date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {editingConference ? "تعديل المؤتمر" : "إضافة مؤتمر"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {editingConference ? "تعديل بيانات المؤتمر." : "أدخل بيانات المؤتمر. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="title" className="text-xs md:text-sm">عنوان المؤتمر *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان المؤتمر"
                required
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label htmlFor="sponsor" className="text-xs md:text-sm">الجهة الراعية *</Label>
                <Input
                  id="sponsor"
                  value={formData.sponsor}
                  onChange={(e) => setFormData((p) => ({ ...p, sponsor: e.target.value }))}
                  placeholder="الجهة الراعية"
                  required
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="date" className="text-xs md:text-sm">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  max={getTodayISO()}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  required
                  className="mt-1 h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location" className="text-xs md:text-sm">مكان الانعقاد *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="المدينة أو الدولة"
                required
                className="mt-1 h-9 md:h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">النطاق</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v: "GLOBAL" | "LOCAL") => setFormData((p) => ({ ...p, scope: v }))}
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GLOBAL">عالمي</SelectItem>
                    <SelectItem value="LOCAL">محلي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-xs md:text-sm">نوع المشاركة</Label>
                <Select
                  value={formData.participationType}
                  onValueChange={(v: "ATTENDEE" | "RESEARCHER") =>
                    setFormData((p) => ({ ...p, participationType: v }))
                  }
                >
                  <SelectTrigger className="mt-1 h-9 md:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATTENDEE">حضور</SelectItem>
                    <SelectItem value="RESEARCHER">باحث</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCommitteeMember"
                checked={formData.isCommitteeMember}
                onChange={(e) => setFormData((p) => ({ ...p, isCommitteeMember: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isCommitteeMember" className="text-xs md:text-sm">عضو لجنة</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingConference ? "حفظ التعديلات" : "إضافة المؤتمر"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingConference(null))}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-4 md:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base md:text-lg" dir="rtl">
              تفاصيل المؤتمر
            </DialogTitle>
            <DialogDescription className="sr-only">
              عرض تفاصيل المؤتمر المحدد
            </DialogDescription>
          </DialogHeader>
          {viewingConference && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingConference.title}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500">
                {[
                  scopeLabels[viewingConference.scope],
                  participationLabels[viewingConference.participationType],
                  viewingConference.isCommitteeMember ? "عضو لجنة" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">التاريخ</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">{formatDate(viewingConference.date)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">المكان</p>
                  <p className="text-xs font-semibold text-slate-900 truncate" dir="rtl">{viewingConference.location}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
                  <p className="text-[10px] text-slate-400">الجهة الراعية</p>
                  <p className="text-xs font-semibold text-slate-900 truncate" dir="rtl">{viewingConference.sponsor}</p>
                </div>
              </div>
              <div className="hidden md:grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingConference.date)}</span>
                <span className="text-slate-500">المكان</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingConference.location}</span>
                <span className="text-slate-500">الجهة الراعية</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingConference.sponsor}</span>
              </div>
              <div className="flex flex-col md:flex-row md:flex-wrap md:justify-end gap-2 pt-2 md:pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 justify-center"
                  onClick={() => shareConferenceViaWhatsApp(viewingConference)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  <span className="md:hidden">واتساب</span>
                  <span className="hidden md:inline">إرسال البطاقة عبر واتساب</span>
                </Button>
                <div className="grid grid-cols-3 gap-2 md:contents">
                  <Button variant="outline" size="sm" className="h-9" onClick={() => (setIsDetailsOpen(false), setViewingConference(null))}>
                    إغلاق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenAdd(viewingConference);
                      setViewingConference(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 ml-1 md:ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(viewingConference.id)}
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
