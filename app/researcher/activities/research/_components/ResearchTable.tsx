"use client";

import { useState } from "react";
import { Edit, Trash2, Loader2, ExternalLink, Eye, MoreVertical, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import type { Research } from "@prisma/client";

interface ResearchTableProps {
  research: Research[];
  onEdit: (research: Research) => void;
  onDelete: (id: string) => void;
  onView: (research: Research) => void;
  isPending: boolean;
  onFilterChange: (filters: {
    search?: string;
    status?: string;
    publishStatus?: string;
    researchType?: string;
    year?: string;
    category?: string;
    publishType?: string;
    scopusQuartile?: string;
  }) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** قيم الفلاتر الموجودة فعلياً في البيانات فقط */
  availableYears?: number[];
  availableStatuses?: string[]; // e.g. ["IN_PROGRESS", "COMPLETED"]
  availablePublishStatuses?: string[]; // e.g. ["DRAFT", "PUBLISHED"]
  availableResearchTypes?: string[]; // e.g. ["PLANNED", "UNPLANNED"]
  availablePublishTypes?: string[]; // e.g. ["JOURNAL", "CONFERENCE"]
  availableCategories?: string[]; // e.g. ["SCOPUS", "ISI"]
  availableScopusQuartiles?: string[]; // e.g. ["Q1", "Q2"]
}

const statusLabels: Record<string, string> = {
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
};

const publishStatusLabels: Record<string, string> = {
  DRAFT: "غير منشور",
  PUBLISHED: "منشور",
};

const researchTypeLabels: Record<string, string> = {
  PLANNED: "مخطط",
  UNPLANNED: "غير مخطط",
};

const publishTypeLabels: Record<string, string> = {
  JOURNAL: "مجلة",
  CONFERENCE: "مؤتمر",
  BOOK_CHAPTER: "فصل كتاب",
  REPORT: "تقرير",
  OTHER: "أخرى",
};

const categoryLabels: Record<string, string> = {
  SCOPUS: "SCOPUS",
  ISI: "ISI",
  LOCAL: "محلي",
  INTERNATIONAL: "دولي",
};

const scopusQuartileLabels: Record<string, string> = {
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
};

const ALL_FILTER_VALUE = "__all__";

export function ResearchTable({
  research,
  onEdit,
  onDelete,
  onView,
  isPending,
  onFilterChange,
  currentPage,
  totalPages,
  onPageChange,
  availableYears = [],
  availableStatuses = [],
  availablePublishStatuses = [],
  availableResearchTypes = [],
  availablePublishTypes = [],
  availableCategories = [],
  availableScopusQuartiles = [],
}: ResearchTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE);
  const [publishStatusFilter, setPublishStatusFilter] = useState<string>(ALL_FILTER_VALUE);
  const [researchTypeFilter, setResearchTypeFilter] = useState<string>(ALL_FILTER_VALUE);
  const [yearFilter, setYearFilter] = useState<string>(ALL_FILTER_VALUE);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER_VALUE);
  const [publishTypeFilter, setPublishTypeFilter] = useState<string>(ALL_FILTER_VALUE);
  const [scopusQuartileFilter, setScopusQuartileFilter] = useState<string>(ALL_FILTER_VALUE);

  const toFilterValue = (v: string) => (v === ALL_FILTER_VALUE ? undefined : v);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      search: value,
      status: toFilterValue(statusFilter),
      publishStatus: toFilterValue(publishStatusFilter),
      researchType: toFilterValue(researchTypeFilter),
      year: toFilterValue(yearFilter),
      category: toFilterValue(categoryFilter),
      publishType: toFilterValue(publishTypeFilter),
      scopusQuartile: toFilterValue(scopusQuartileFilter),
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "publishStatus") setPublishStatusFilter(value);
    if (key === "researchType") setResearchTypeFilter(value);
    if (key === "year") setYearFilter(value);
    if (key === "category") {
      setCategoryFilter(value);
      // إذا تم إلغاء اختيار سكوبس، امسح فلتر الربع
      if (value !== "SCOPUS" && value !== ALL_FILTER_VALUE) {
        setScopusQuartileFilter(ALL_FILTER_VALUE);
      }
    }
    if (key === "publishType") setPublishTypeFilter(value);
    if (key === "scopusQuartile") setScopusQuartileFilter(value);
    
    onFilterChange({
      search,
      status: key === "status" ? toFilterValue(value) : toFilterValue(statusFilter),
      publishStatus: key === "publishStatus" ? toFilterValue(value) : toFilterValue(publishStatusFilter),
      researchType: key === "researchType" ? toFilterValue(value) : toFilterValue(researchTypeFilter),
      year: key === "year" ? toFilterValue(value) : toFilterValue(yearFilter),
      category: key === "category" ? toFilterValue(value) : toFilterValue(categoryFilter),
      publishType: key === "publishType" ? toFilterValue(value) : toFilterValue(publishTypeFilter),
      scopusQuartile:
        key === "scopusQuartile"
          ? toFilterValue(value)
          : key === "category" && value !== "SCOPUS" && value !== ALL_FILTER_VALUE
            ? undefined
            : toFilterValue(scopusQuartileFilter),
    });
  };

  // استخدام القيم المتاحة من البيانات فقط
  const years = availableYears.length > 0
    ? [...availableYears].sort((a, b) => b - a)
    : [];

  const monthNames = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  return (
    <div className="space-y-4">
      <div className="w-full bg-slate-50 rounded-lg overflow-x-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-3 w-full min-w-[900px] items-end">
          <div className={categoryFilter === "SCOPUS" ? "col-span-3 min-w-0" : "col-span-3 min-w-0"}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">البحث</label>
            <Input
              placeholder="بحث في العناوين..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 rounded-xl bg-white w-full"
            />
          </div>
          <div className="col-span-2 min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">السنة</label>
            <Select value={yearFilter} onValueChange={(v) => handleFilterChange("year", v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">الحالة</label>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                {availableStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusLabels[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">حالة النشر</label>
            <Select
              value={publishStatusFilter}
              onValueChange={(v) => handleFilterChange("publishStatus", v)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                {availablePublishStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {publishStatusLabels[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={categoryFilter === "SCOPUS" ? "col-span-1 min-w-0" : "col-span-2 min-w-0"}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع النشر</label>
            <Select
              value={publishTypeFilter}
              onValueChange={(v) => handleFilterChange("publishType", v)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                {availablePublishTypes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {publishTypeLabels[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={categoryFilter === "SCOPUS" ? "col-span-1 min-w-0" : "col-span-1 min-w-0"}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">التصنيف</label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => handleFilterChange("category", v)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                {availableCategories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {categoryLabels[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {categoryFilter === "SCOPUS" && (
            <div className="col-span-1 min-w-0">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">الربع</label>
              <Select
                value={scopusQuartileFilter}
                onValueChange={(v) => handleFilterChange("scopusQuartile", v)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-white w-full">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>الكل</SelectItem>
                  {availableScopusQuartiles.map((value) => (
                    <SelectItem key={value} value={value}>
                      {scopusQuartileLabels[value] ?? value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <Table className="table-fixed w-full">
          <colgroup>
            {["7%", "30%", "7%", "6%", "8%", "8%", "7%", "4%", "5%", "4%", "5%", "5%"].map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="border-b border-slate-200">
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                إجراءات
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                العنوان
              </TableHead>
              <TableHead className="text-center font-medium text-slate-600 bg-slate-50 px-2 py-3 whitespace-nowrap align-middle">
                الإنجاز
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                السنة
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                الحالة
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                حالة النشر
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                نوع النشر
              </TableHead>
              <TableHead className="text-right font-medium text-slate-600 bg-slate-50 px-4 py-3 whitespace-nowrap align-middle">
                الربع
              </TableHead>
              <TableHead className="text-center font-medium text-slate-600 bg-slate-50 px-2 py-3 whitespace-nowrap align-middle">
                SCOPUS
              </TableHead>
              <TableHead className="text-center font-medium text-slate-600 bg-slate-50 px-2 py-3 whitespace-nowrap align-middle">
                ISI
              </TableHead>
              <TableHead className="text-center font-medium text-slate-600 bg-slate-50 px-2 py-3 whitespace-nowrap align-middle">
                محلي
              </TableHead>
              <TableHead className="text-center font-medium text-slate-600 bg-slate-50 px-2 py-3 whitespace-nowrap align-middle">
                دولي
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {research.map((r) => {
              const hasScopus = r.categories.includes("SCOPUS");
              const hasIsi = r.categories.includes("ISI");
              const hasLocal = r.categories.includes("LOCAL");
              const hasInternational = r.categories.includes("INTERNATIONAL");
              return (
                <TableRow key={r.id} className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors">
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={isPending}
                          className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 text-slate-600"
                          title="الإجراءات"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]" side="left">
                        <DropdownMenuItem onClick={() => onView(r)} disabled={isPending}>
                          <Eye className="h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(r)} disabled={isPending}>
                          <Edit className="h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        {(r.downloadUrl || r.researchUrl) && (
                          <DropdownMenuItem
                            onClick={() => window.open(r.downloadUrl || r.researchUrl!, "_blank")}
                            disabled={isPending}
                          >
                            <Download className="h-4 w-4" />
                            تحميل البحث
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete(r.id)}
                          disabled={isPending}
                          variant="destructive"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-right min-w-0">
                    <div className="min-w-0">
                      {r.researchUrl ? (
                        <a
                          href={r.researchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate block font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
                          title={r.title}
                        >
                          {r.title}
                        </a>
                      ) : (
                        <div className="truncate font-medium text-slate-900" title={r.title}>
                          {r.title}
                        </div>
                      )}
                      {(r.year || r.publishMonth || r.doi) && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {[r.year, r.publishMonth ? monthNames[r.publishMonth] : null, r.doi].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-3 align-middle text-center whitespace-nowrap min-w-0">
                    {r.status === "COMPLETED" ? (
                      <span className="text-slate-400">—</span>
                    ) : r.status === "IN_PROGRESS" && r.progressPercent != null ? (
                      <div className="flex items-center justify-center gap-1.5 min-w-0">
                        <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, r.progressPercent)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">{r.progressPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap text-sm text-slate-600">
                    {r.year}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <Badge
                      className={
                        "inline-flex items-center justify-center gap-2 " +
                        (r.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200")
                      }
                    >
                      {statusLabels[r.status]}
                    </Badge>
                  </TableCell>
                  {/* حالة النشر: قيد التنفيذ "—"، مكتمل badge */}
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {r.status === "IN_PROGRESS" ? (
                      <span className="text-slate-400">—</span>
                    ) : r.publishStatus ? (
                      <Badge
                        className={
                          r.publishStatus === "PUBLISHED"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {publishStatusLabels[r.publishStatus]}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  {/* نوع النشر: غير منشور أو قيد التنفيذ "—"، وإلا badge صغيرة */}
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {r.status === "IN_PROGRESS" || r.publishStatus !== "PUBLISHED" ? (
                      <span className="text-slate-400">—</span>
                    ) : r.publishType ? (
                      <Badge variant="secondary" className="text-xs">
                        {publishTypeLabels[r.publishType]}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {r.scopusQuartile ? (
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                        {r.scopusQuartile}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {hasScopus ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {hasIsi ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {hasLocal ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    {hasInternational ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
          >
            السابق
          </Button>
          <span className="text-sm text-slate-600">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
