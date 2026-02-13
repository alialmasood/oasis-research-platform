"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, MoreVertical, Eye, Trash2, MapPin, Loader2, Pencil } from "lucide-react";
import {
  createFieldVisit,
  updateFieldVisit,
  deleteFieldVisit,
  listFieldVisits,
} from "./actions";
import { FieldVisitsKPICards, useFieldVisitsStats } from "./_components/FieldVisitsKPICards";
import type { FieldVisit } from "@prisma/client";
import { notifyDashboardUpdate } from "@/lib/dashboardSync";
import * as XLSX from "xlsx";

const POINTS: Record<string, number> = {
  FIELD_VISIT_SUPERVISION: 12,
  VOLUNTARY_INSIDE_MINISTRY: 8,
  SERVICE_OUTSIDE_MINISTRY: 6,
};

const TYPE_LABELS: Record<string, string> = {
  FIELD_VISIT_SUPERVISION: "زيارة ميدانية (إشراف طلبة) — 12 درجة",
  VOLUNTARY_INSIDE_MINISTRY: "عمل تطوعي داخل الوزارة — 8 درجات",
  SERVICE_OUTSIDE_MINISTRY: "خدمة / استشارة / ندوة خارج الوزارة — 6 درجات",
};

const MAX_SECTION_POINTS = 30;

function formatDate(d: Date) {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y} / ${m} / ${day}`;
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function computeTotalPoints(items: FieldVisit[]): number {
  const total = items.reduce((sum, item) => sum + (POINTS[item.type] ?? 0), 0);
  return Math.min(total, MAX_SECTION_POINTS);
}

interface FieldVisitsPageClientProps {
  initialItems: FieldVisit[];
}

export function FieldVisitsPageClient({ initialItems }: FieldVisitsPageClientProps) {
  const [items, setItems] = useState<FieldVisit[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FieldVisit | null>(null);
  const [viewingItem, setViewingItem] = useState<FieldVisit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (message?: string, type: "success" | "error" = "success") =>
    setToast({ message: message ?? "حدث خطأ غير متوقع", type });

  const loadItems = (overrides?: { search?: string; type?: string; year?: string }) => {
    startTransition(async () => {
      const q = overrides?.search ?? search;
      const type = overrides?.type ?? typeFilter;
      const year = overrides?.year ?? yearFilter;
      const result = await listFieldVisits({
        search: (typeof q === "string" ? q : "").trim() || undefined,
        type: type === "__all__" ? undefined : (type as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY"),
        year: year === "__all__" ? undefined : parseInt(year, 10),
      });
      if ("error" in result) {
        showToast(result.error, "error");
        return;
      }
      setItems(result.items);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const getExportFilters = () => ({
    search: search.trim() || undefined,
    type:
      typeFilter === "__all__"
        ? undefined
        : (typeFilter as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY"),
    year: yearFilter === "__all__" ? undefined : parseInt(yearFilter, 10),
  });

  const formatDateCell = (date: Date | string | null | undefined) =>
    date ? formatDate(new Date(date)) : "—";

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listFieldVisits(getExportFilters());
    setIsExporting(false);
    if ("error" in result) {
      showToast(result.error, "error");
      return;
    }

    const rows = result.items.map((v) => ({
      "نوع النشاط": TYPE_LABELS[v.type] ?? v.type,
      العنوان: v.title ?? "",
      التاريخ: formatDateCell(v.activityDate),
      التوثيق: v.documentationRef ?? "—",
      الدرجة: POINTS[v.type] ?? 0,
      الوصف: v.description ?? "—",
      "تاريخ الإنشاء": formatDateCell(v.createdAt),
      "آخر تحديث": formatDateCell(v.updatedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الزيارات الميدانية");
    XLSX.writeFile(workbook, "field-visits-data.xlsx");
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const result = await listFieldVisits(getExportFilters());
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
          <td>${TYPE_LABELS[v.type] ?? v.type}</td>
          <td>${v.title ?? "-"}</td>
          <td>${formatDateCell(v.activityDate)}</td>
          <td>${v.documentationRef ?? "-"}</td>
          <td>${POINTS[v.type] ?? 0}</td>
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
          <title>تقرير الزيارات الميدانية والنشاطات</title>
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
          <h1>تقرير الزيارات الميدانية والنشاطات</h1>
          <table>
            <thead>
              <tr>
                <th>نوع النشاط</th>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>التوثيق</th>
                <th>الدرجة</th>
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

  const filteredForDisplay = items;
  const totalPoints = computeTotalPoints(filteredForDisplay);
  const stats = useFieldVisitsStats(filteredForDisplay);
  const uniqueYears = Array.from(
    new Set(items.map((i) => new Date(i.activityDate).getFullYear()))
  ).sort((a, b) => b - a);

  const [formData, setFormData] = useState({
    type: "FIELD_VISIT_SUPERVISION" as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY",
    title: "",
    activityDate: getTodayISO(),
    description: "",
    documentationRef: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        type: formData.type,
        title: formData.title,
        activityDate: new Date(formData.activityDate),
        description: formData.description || null,
        documentationRef: formData.documentationRef || null,
      };
      const result = editingItem
        ? await updateFieldVisit({ ...payload, id: editingItem.id })
        : await createFieldVisit(payload);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(editingItem ? "✅ تم تحديث السجل بنجاح" : "✅ تم إضافة الزيارة الميدانية بنجاح");
      setIsAddOpen(false);
      setEditingItem(null);
      setFormData({
        type: "FIELD_VISIT_SUPERVISION",
        title: "",
        activityDate: getTodayISO(),
        description: "",
        documentationRef: "",
      });
      loadItems();
      notifyDashboardUpdate("activities");
    });
  };

  const handleOpenAdd = (item?: FieldVisit) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        type: item.type,
        title: item.title,
        activityDate: new Date(item.activityDate).toISOString().slice(0, 10),
        description: item.description || "",
        documentationRef: item.documentationRef || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        type: "FIELD_VISIT_SUPERVISION",
        title: "",
        activityDate: getTodayISO(),
        description: "",
        documentationRef: "",
      });
    }
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setEditingItem(null);
    setFormData({
      type: "FIELD_VISIT_SUPERVISION",
      title: "",
      activityDate: getTodayISO(),
      description: "",
      documentationRef: "",
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    startTransition(async () => {
      const result = await deleteFieldVisit(id);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("✅ تم حذف السجل بنجاح");
      setIsDetailsOpen(false);
      setViewingItem(null);
      loadItems();
      notifyDashboardUpdate("activities");
    });
  };

  const handleView = (item: FieldVisit) => {
    setViewingItem(item);
    setIsDetailsOpen(true);
  };

  const byYearChartData = stats.byYear.map((item) => ({ name: item.name, "عدد النشاطات": item.value }));
  const byTypeBarData = stats.byType.map((item) => ({ name: item.name, "عدد النشاطات": item.value }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">
            الزيارات الميدانية والحقلية والأعمال التطوعية
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            زيارة ميدانية لإشراف الطلبة، عمل تطوعي داخل الوزارة، أو خدمة/استشارة خارج الوزارة. الحد الأقصى للفقرة 30 درجة.
          </p>
        </div>
        <Button
          onClick={() => handleOpenAdd()}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex-shrink-0 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة زيارة ميدانية
        </Button>
      </div>

      <FieldVisitsKPICards stats={stats} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسوم البيانية</h3>
        <div className="grid grid-cols-12 gap-4">
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">عدد النشاطات حسب السنة</h4>
              <div className="h-[300px] flex flex-col">
                {stats.byYear.length > 0 ? (
                  <BarChart
                    data={byYearChartData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(year, count) => `عدد النشاطات في ${year}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={12}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">توزيع أنواع النشاط</h4>
              <div className="h-[300px] flex flex-col">
                {stats.byType.length > 0 ? (
                  <PieChart
                    data={stats.byType}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    outerRadius={80}
                    innerRadius={28}
                    legendWrapperStyle={{ fontSize: "11px" }}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">عدد النشاطات حسب النوع</h4>
              <div className="h-[280px] flex flex-col">
                {stats.byType.length > 0 ? (
                  <BarChart
                    data={byTypeBarData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB", "#10b981", "#f59e0b"]}
                    tooltipLabel={(name, count) => `${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-base font-semibold text-slate-800">جدول الزيارات الميدانية والنشاطات</div>
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
          <h3 className="text-base font-semibold text-slate-800 mb-4">قائمة الزيارات الميدانية والنشاطات</h3>
          <form onSubmit={handleSearchSubmit} className="w-full bg-slate-50 rounded-xl px-4 py-4 mb-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">البحث</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Input
                    placeholder="عنوان النشاط أو الوصف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="h-10 rounded-lg px-4 flex-shrink-0">
                    بحث
                  </Button>
                </div>
              </div>
              <div className="min-w-[220px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع النشاط</label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v);
                    loadItems({ type: v });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {uniqueYears.length > 0 && (
                <div className="min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">السنة</label>
                  <Select
                    value={yearFilter}
                    onValueChange={(v) => {
                      setYearFilter(v);
                      loadItems({ year: v });
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 w-full">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {uniqueYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
                <MapPin className="h-14 w-14 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {search || typeFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد نتائج"
                  : "لم يتم تسجيل أي زيارة ميدانية أو نشاط بعد"}
              </h3>
              <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                {search || typeFilter !== "__all__" || yearFilter !== "__all__"
                  ? "لا توجد سجلات تطابق الفلاتر. جرّب تغيير البحث أو الفلاتر."
                  : "ابدأ بإضافة أول زيارة ميدانية أو عمل تطوعي أو خدمة (وفق الدليل الإرشادي)."}
              </p>
              {!search && typeFilter === "__all__" && yearFilter === "__all__" && (
                <Button
                  onClick={() => handleOpenAdd()}
                  size="lg"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة زيارة ميدانية
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50">
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-right font-medium text-slate-600">العمليات</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">نوع النشاط</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">العنوان</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التاريخ</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">التوثيق</TableHead>
                        <TableHead className="text-right font-medium text-slate-600">الدرجة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForDisplay.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50">
                          <TableCell className="align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleView(row)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenAdd(row)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
                                      startTransition(async () => {
                                        const res = await deleteFieldVisit(row.id);
                                        if (res.error) showToast(res.error, "error");
                                        else {
                                          showToast("✅ تم حذف السجل بنجاح");
                                          loadItems();
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
                            <Badge variant="secondary" className="bg-slate-100 text-slate-800 whitespace-normal text-right">
                              {TYPE_LABELS[row.type] ?? row.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="font-medium text-slate-900 block" dir="rtl">
                              {row.title}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap text-sm text-slate-700">
                            {formatDate(row.activityDate)}
                          </TableCell>
                          <TableCell className="align-middle text-sm text-slate-700" dir="rtl">
                            {row.documentationRef ? (
                              <span className="line-clamp-2">{row.documentationRef}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <Badge className="bg-emerald-100 text-emerald-800">
                              {POINTS[row.type] ?? 0} درجة
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {filteredForDisplay.map((row) => (
                  <Card key={row.id} className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1" dir="rtl">
                            {row.title}
                          </h3>
                          <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-800 text-xs">
                            {TYPE_LABELS[row.type]} — {POINTS[row.type]} درجة
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleView(row)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAdd(row)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
                                  startTransition(async () => {
                                    const res = await deleteFieldVisit(row.id);
                                    if (res.error) showToast(res.error, "error");
                                    else {
                                      showToast("✅ تم حذف السجل بنجاح");
                                      loadItems();
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
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">التاريخ: </span>
                          <span className="text-slate-900">{formatDate(row.activityDate)}</span>
                        </div>
                        {row.documentationRef && (
                          <div>
                            <span className="text-slate-500">التوثيق: </span>
                            <span className="text-slate-900" dir="rtl">{row.documentationRef}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">الدرجة: </span>
                          <Badge className="bg-emerald-100 text-emerald-800">{POINTS[row.type]} درجة</Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleView(row)}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        عرض التفاصيل
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* نافذة الإضافة / التعديل */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && handleCloseAdd()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "تعديل زيارة ميدانية / نشاط" : "إضافة زيارة ميدانية جديدة"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "تعديل بيانات السجل."
                : "اختر نوع النشاط (زيارة ميدانية 12 درجة، عمل تطوعي داخل الوزارة 8 درجات، خدمة خارج الوزارة 6 درجات). الحد الأقصى للفقرة 30 درجة."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label>نوع النشاط *</Label>
              <Select
                value={formData.type}
                onValueChange={(v: "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY") =>
                  setFormData((p) => ({ ...p, type: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">عنوان النشاط *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثال: زيارة ميدانية لمختبر التحليلات، حملة تشجير..."
                required
                minLength={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="activityDate">تاريخ النشاط *</Label>
              <Input
                id="activityDate"
                type="date"
                value={formData.activityDate}
                max={getTodayISO()}
                onChange={(e) => setFormData((p) => ({ ...p, activityDate: e.target.value }))}
                required
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">لا يمكن اختيار تاريخ في المستقبل</p>
            </div>
            <div>
              <Label htmlFor="documentationRef">التوثيق (اختياري)</Label>
              <Input
                id="documentationRef"
                value={formData.documentationRef}
                onChange={(e) => setFormData((p) => ({ ...p, documentationRef: e.target.value }))}
                placeholder="استمارة الدليل الإرشادي أو كتاب رسمي من التشكيل/الجامعة"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للنشاط..."
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
                ) : editingItem ? (
                  "حفظ التعديلات"
                ) : (
                  "إضافة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة التفاصيل */}
      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => !open && (setIsDetailsOpen(false), setViewingItem(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right" dir="rtl">
              تفاصيل الزيارة الميدانية / النشاط
            </DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900" dir="rtl">
                {viewingItem.title}
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <span className="text-slate-500">نوع النشاط</span>
                <span className="font-medium text-slate-900">{TYPE_LABELS[viewingItem.type]}</span>
                <span className="text-slate-500">التاريخ</span>
                <span className="font-medium text-slate-900">{formatDate(viewingItem.activityDate)}</span>
                <span className="text-slate-500">الدرجة</span>
                <span className="font-medium text-slate-900">{POINTS[viewingItem.type]} درجة</span>
                {viewingItem.documentationRef && (
                  <>
                    <span className="text-slate-500">التوثيق</span>
                    <span className="font-medium text-slate-900" dir="rtl">{viewingItem.documentationRef}</span>
                  </>
                )}
                {viewingItem.description && (
                  <>
                    <span className="text-slate-500">الوصف</span>
                    <span className="font-medium text-slate-900" dir="rtl">{viewingItem.description}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => (setIsDetailsOpen(false), setViewingItem(null))}>
                  إغلاق
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenAdd(viewingItem);
                    setViewingItem(null);
                  }}
                >
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(viewingItem.id)}
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
