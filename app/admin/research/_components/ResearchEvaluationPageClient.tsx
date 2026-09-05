"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Search, TrendingUp, Users, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminResearchEvaluationPageData } from "@/lib/admin/researchTypes";

const PAGE_SIZE = 20;
const ALL = "__all__";

function getPerformanceLevel(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "امتياز", className: "bg-green-100 text-green-800 border-green-200" };
  if (score >= 80) return { label: "جيد جداً", className: "bg-blue-100 text-blue-800 border-blue-200" };
  if (score >= 70) return { label: "جيد", className: "bg-slate-100 text-slate-800 border-slate-200" };
  return { label: "يحتاج تحسين", className: "bg-amber-100 text-amber-800 border-amber-200" };
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

interface ResearchEvaluationPageClientProps {
  data: AdminResearchEvaluationPageData;
}

export function ResearchEvaluationPageClient({ data }: ResearchEvaluationPageClientProps) {
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState(ALL);
  const [page, setPage] = useState(1);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.entries.filter((entry) => {
      if (entity !== ALL && entry.entity !== entity) return false;
      if (!query) return true;
      return (
        entry.displayName.toLowerCase().includes(query) ||
        (entry.entity?.toLowerCase().includes(query) ?? false) ||
        (entry.department?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [data.entries, entity, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, entity]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rowOffset = (page - 1) * PAGE_SIZE;
  const visibleEntries = filteredEntries.slice(rowOffset, rowOffset + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تقييم وانجازات"
        description="ترتيب التدريسيين حسب نقاط التقييم الأكاديمي — على مستوى الجامعة"
      />

      <Card className="border-slate-100 bg-white shadow-lg border-r-4 border-r-[#2563EB]">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2563EB]/10">
              <Award className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">فترة التقييم</p>
              <p className="text-xs text-slate-500">
                العام الدراسي{" "}
                <span className="font-medium tabular-nums" dir="ltr">
                  {data.academicYearLabel}
                </span>{" "}
                · سنة الاحتساب{" "}
                <span className="font-medium tabular-nums" dir="ltr">
                  {data.evaluationYear}
                </span>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            إجمالي التدريسيين:{" "}
            <span className="font-semibold tabular-nums text-slate-800" dir="ltr">
              {formatNumber(data.totalResearchers)}
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-slate-100 bg-white shadow-lg border-r-4 border-r-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">متوسط التقييم</h3>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2" dir="ltr">
              {formatNumber(data.averageScore)}
              <span className="text-sm font-normal text-slate-400 mr-1">/ 100</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-lg border-r-4 border-r-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">امتياز (90+)</h3>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2" dir="ltr">
              {formatNumber(data.excellentCount)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-lg border-r-4 border-r-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">جيد فأعلى (70+)</h3>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2" dir="ltr">
              {formatNumber(data.goodCount + data.excellentCount)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-lg border-r-4 border-r-amber-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">يحتاج تحسين (&lt;70)</h3>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2" dir="ltr">
              {formatNumber(data.needsImprovementCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-[2] min-w-0">
              <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث بالاسم، التشكيل، القسم..."
                className="h-9 pr-9 text-sm border-slate-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                  <SelectValue placeholder="التشكيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل التشكيلات</SelectItem>
                  {data.entities.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0" dir="ltr">
              {formatNumber(filteredEntries.length)} تدريسي
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-xs min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
                <TableHead className="text-white font-semibold text-center px-2 py-2.5 w-[44px]">
                  #
                </TableHead>
                <TableHead className="text-white font-semibold text-right px-3 py-2.5">
                  اسم التدريسي
                </TableHead>
                <TableHead className="text-white font-semibold text-right px-3 py-2.5">
                  التشكيل
                </TableHead>
                <TableHead className="text-white font-semibold text-right px-3 py-2.5">
                  اللقب العلمي
                </TableHead>
                <TableHead className="text-white font-semibold text-center px-3 py-2.5">
                  التقييم
                </TableHead>
                <TableHead className="text-white font-semibold text-center px-3 py-2.5">
                  المستوى
                </TableHead>
                <TableHead className="text-white font-semibold text-center px-3 py-2.5">
                  بحوث
                </TableHead>
                <TableHead className="text-white font-semibold text-center px-3 py-2.5">
                  أنشطة
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                    لا توجد نتائج مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                visibleEntries.map((entry, index) => {
                  const level = getPerformanceLevel(entry.score);
                  return (
                    <TableRow key={entry.id} className="hover:bg-slate-50/80 border-slate-100">
                      <TableCell
                        className="text-center text-slate-400 tabular-nums px-2 py-2.5"
                        dir="ltr"
                      >
                        {formatNumber(rowOffset + index + 1)}
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <Link
                          href={`/admin/faculty/${entry.id}`}
                          className="font-medium text-[#2563EB] hover:underline"
                        >
                          {entry.displayName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600 px-3 py-2.5">
                        {entry.entity ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 px-3 py-2.5 whitespace-nowrap">
                        {entry.academicTitle ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900 px-3 py-2.5 tabular-nums" dir="ltr">
                        {formatNumber(entry.score)}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        <Badge variant="outline" className={cn("text-[10px]", level.className)}>
                          {level.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-700 px-3 py-2.5 tabular-nums" dir="ltr">
                        {formatNumber(entry.researchCount)}
                      </TableCell>
                      <TableCell className="text-center text-slate-700 px-3 py-2.5 tabular-nums" dir="ltr">
                        {formatNumber(entry.activitiesTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredEntries.length > PAGE_SIZE && (
          <EvaluationPaginationBar
            page={page}
            totalCount={filteredEntries.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

function EvaluationPaginationBar({
  page,
  totalCount,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rowOffset = (page - 1) * PAGE_SIZE;
  const from = rowOffset + 1;
  const to = Math.min(rowOffset + PAGE_SIZE, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        عرض{" "}
        <span dir="ltr" className="tabular-nums">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{" "}
        من {formatNumber(totalCount)} تدريسي · {formatNumber(PAGE_SIZE)} لكل صفحة
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 border-slate-200"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">السابق</span>
        </Button>
        {pageNumbers.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`e-${index}`} className="px-1 text-slate-400 text-sm">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 min-w-8 px-2 text-xs",
                item === page
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                  : "border-slate-200"
              )}
              onClick={() => onPageChange(item)}
            >
              <span dir="ltr" className="tabular-nums">
                {item}
              </span>
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 border-slate-200"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">التالي</span>
        </Button>
      </div>
    </div>
  );
}
