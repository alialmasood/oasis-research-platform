"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { buildResearchListUrl, type AdminResearchSection } from "@/lib/admin/researchListUrl";
import type { AdminResearchListFilters, AdminResearchPagination } from "@/lib/admin/researchTypes";

interface ResearchPaginationBarProps {
  pagination: AdminResearchPagination;
  filters: AdminResearchListFilters;
  section?: AdminResearchSection;
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

export function ResearchPaginationBar({
  pagination,
  filters,
  section = "overview",
}: ResearchPaginationBarProps) {
  const { page, pageSize, totalCount, totalPages, rowOffset } = pagination;
  if (totalCount === 0) return null;

  const from = rowOffset + 1;
  const to = Math.min(rowOffset + pageSize, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);
  const linkForPage = (targetPage: number) =>
    buildResearchListUrl({ ...filters, page: targetPage }, section);

  return (
    <div className="border-t border-slate-200 bg-slate-50/80 px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        عرض{" "}
        <span dir="ltr" className="tabular-nums">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{" "}
        من {formatNumber(totalCount)} بحث · {formatNumber(pageSize)} لكل صفحة
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 px-2" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? (
            <Link href={linkForPage(page - 1)}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-4 w-4 opacity-40" />
            </span>
          )}
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
                item === page ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white" : "border-slate-200"
              )}
              asChild={item !== page}
            >
              {item === page ? (
                <span dir="ltr" className="tabular-nums">{item}</span>
              ) : (
                <Link href={linkForPage(item)} dir="ltr" className="tabular-nums">{item}</Link>
              )}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={linkForPage(page + 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4 opacity-40" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
