"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminResearcherGapTable } from "@/lib/admin/researchTypes";
import { ResearchResearcherGapExportBar } from "./ResearchResearcherGapExportBar";

const GAP_TABLE_PAGE_SIZE = 20;

interface ResearchResearcherGapTablesProps {
  tables: AdminResearcherGapTable[];
  totalResearchers: number;
  academicYearLabel: string;
}

interface GapTableSectionProps {
  table: AdminResearcherGapTable;
  totalResearchers: number;
  academicYearLabel: string;
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

function GapTablePaginationBar({
  page,
  totalCount,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / GAP_TABLE_PAGE_SIZE));
  if (totalCount === 0 || totalPages <= 1) return null;

  const rowOffset = (page - 1) * GAP_TABLE_PAGE_SIZE;
  const from = rowOffset + 1;
  const to = Math.min(rowOffset + GAP_TABLE_PAGE_SIZE, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        عرض{" "}
        <span dir="ltr" className="tabular-nums">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{" "}
        من {formatNumber(totalCount)} تدريسي · {formatNumber(GAP_TABLE_PAGE_SIZE)} لكل صفحة
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

function GapTableSection({ table, totalResearchers, academicYearLabel }: GapTableSectionProps) {
  const [page, setPage] = useState(1);
  const totalCount = table.members.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / GAP_TABLE_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [table.id]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rowOffset = (page - 1) * GAP_TABLE_PAGE_SIZE;
  const visibleMembers = table.members.slice(rowOffset, rowOffset + GAP_TABLE_PAGE_SIZE);

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 leading-snug">
            {table.title}
            <span className="font-normal text-slate-500"> · {table.description}</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 tabular-nums" dir="ltr">
            {formatNumber(table.count)} من {formatNumber(totalResearchers)} تدريسي
          </span>
          <ResearchResearcherGapExportBar
            table={table}
            totalResearchers={totalResearchers}
            academicYearLabel={academicYearLabel}
          />
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-8 text-center text-sm text-emerald-800">
          لا يوجد تدريسيون في هذه الفئة — الوضع ممتاز
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs min-w-[720px]">
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
                    أعلى شهادة
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.map((member, index) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/80 border-slate-100">
                    <TableCell
                      className="text-center text-slate-400 tabular-nums px-2 py-2.5"
                      dir="ltr"
                    >
                      {formatNumber(rowOffset + index + 1)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Link
                        href={`/admin/faculty/${member.id}`}
                        className="font-medium text-[#2563EB] hover:underline"
                      >
                        {member.displayName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600 px-3 py-2.5">
                      {member.entity ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-600 px-3 py-2.5 whitespace-nowrap">
                      {member.academicTitle ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-slate-700 px-3 py-2.5 whitespace-nowrap">
                      {member.highestDegree ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <GapTablePaginationBar page={page} totalCount={totalCount} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}

export function ResearchResearcherGapTables({
  tables,
  totalResearchers,
  academicYearLabel,
}: ResearchResearcherGapTablesProps) {
  return (
    <div className="space-y-8">
      {tables.map((table) => (
        <GapTableSection
          key={table.id}
          table={table}
          totalResearchers={totalResearchers}
          academicYearLabel={academicYearLabel}
        />
      ))}
    </div>
  );
}
