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

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">المؤتمرات</h1>
          <p className="text-sm text-slate-500 mt-1">سجّل مشاركاتك في المؤتمرات المحلية والعالمية</p>
          <p className="text-sm text-slate-600 mt-1.5 font-medium" aria-live="polite">
            {getContextSummary(filteredForDisplay, stats)}
          </p>
        </div>
        <Button onClick={() => handleOpenAdd()} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
          <Plus className="h-4 w-4 ml-2" />
          إضافة مؤتمر
        </Button>
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
        {/* إجمالي المؤتمرات — أزرق */}
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
        {/* عالمي / محلي — أخضر (محلي) + أزرق غامق (عالمي) accent */}
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
        {/* مشاركة كباحث — بنفسجي (علمي) */}
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
        {/* عضو لجنة — برتقالي (مسؤولية) */}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid gap-4 md:grid-cols-2">
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
          <Card className="border-slate-100 bg-white shadow-lg md:col-span-2">
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

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-base font-semibold text-slate-800">جدول المؤتمرات</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-3">بحث في المؤتمرات</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="flex flex-wrap items-end gap-3" dir="rtl">
              {/* شريط البحث + زر البحث مجموعة واحدة على اليمين */}
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

          {filteredForDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="rounded-full bg-white border border-slate-200 p-6 mb-5 shadow-sm">
                <Calendar className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || scopeFilter !== "__all__" || participationFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي مشاركة بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || scopeFilter !== "__all__" || participationFilter !== "__all__"
                  ? "لا توجد مؤتمرات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول مؤتمر لك."}
              </p>
              {!search && scopeFilter === "__all__" && participationFilter === "__all__" && (
                <Button onClick={() => handleOpenAdd()} size="lg" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm">
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة أول مؤتمر
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingConference ? "تعديل المؤتمر" : "إضافة مؤتمر"}</DialogTitle>
            <DialogDescription>
              {editingConference ? "تعديل بيانات المؤتمر." : "أدخل بيانات المؤتمر. التاريخ لا يقبل أي تاريخ في المستقبل."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">عنوان المؤتمر *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان المؤتمر"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sponsor">الجهة الراعية *</Label>
              <Input
                id="sponsor"
                value={formData.sponsor}
                onChange={(e) => setFormData((p) => ({ ...p, sponsor: e.target.value }))}
                placeholder="الجهة الراعية"
                required
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
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">مكان الانعقاد *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="المدينة أو الدولة"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>النطاق</Label>
              <Select
                value={formData.scope}
                onValueChange={(v: "GLOBAL" | "LOCAL") => setFormData((p) => ({ ...p, scope: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">عالمي</SelectItem>
                  <SelectItem value="LOCAL">محلي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع المشاركة</Label>
              <Select
                value={formData.participationType}
                onValueChange={(v: "ATTENDEE" | "RESEARCHER") =>
                  setFormData((p) => ({ ...p, participationType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATTENDEE">حضور</SelectItem>
                  <SelectItem value="RESEARCHER">باحث</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCommitteeMember"
                checked={formData.isCommitteeMember}
                onChange={(e) => setFormData((p) => ({ ...p, isCommitteeMember: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isCommitteeMember">عضو لجنة</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseAdd}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingConference ? "حفظ التعديلات" : "إضافة المؤتمر"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingConference(null))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل المؤتمر
            </DialogTitle>
            <DialogDescription className="sr-only">
              عرض تفاصيل المؤتمر المحدد
            </DialogDescription>
          </DialogHeader>
          {viewingConference && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2" dir="rtl">
                {viewingConference.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{scopeLabels[viewingConference.scope]}</Badge>
                <Badge variant="secondary">{participationLabels[viewingConference.participationType]}</Badge>
                {viewingConference.isCommitteeMember && (
                  <Badge className="bg-amber-100 text-amber-800">عضو لجنة</Badge>
                )}
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingConference.date)}</span>
                <span className="text-slate-500">المكان</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingConference.location}</span>
                <span className="text-slate-500">الجهة الراعية</span>
                <span className="font-medium text-slate-900" dir="rtl">{viewingConference.sponsor}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  onClick={() => shareConferenceViaWhatsApp(viewingConference)}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  إرسال البطاقة عبر واتساب
                </Button>
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingConference(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingConference);
                    setViewingConference(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingConference.id)}
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
