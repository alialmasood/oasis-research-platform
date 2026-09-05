"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { ResearchPaginationBar } from "./ResearchPaginationBar";
import type {
  AdminResearchItem,
  AdminResearchListFilters,
  AdminResearchPagination,
} from "@/lib/admin/researchTypes";
import type { AdminResearchSection } from "@/lib/admin/researchListUrl";

interface ResearchTableProps {
  items: AdminResearchItem[];
  rowOffset?: number;
  pagination?: AdminResearchPagination;
  filters?: AdminResearchListFilters;
  section?: AdminResearchSection;
  variant?: "default" | "scopus";
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const cls = "text-[10px] px-1.5 py-0 font-medium";
  if (status === "COMPLETED") {
    return (
      <Badge className={cn("bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50", cls)}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge className={cn("bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50", cls)}>
      {label}
    </Badge>
  );
}

function PublishBadge({ status, label }: { status: string | null; label: string | null }) {
  const cls = "text-[10px] px-1.5 py-0 font-medium";
  if (status === "PUBLISHED") {
    return (
      <Badge className={cn("bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50", cls)}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge className={cn("bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50", cls)}>
      {label ?? "—"}
    </Badge>
  );
}

function ProgressCell({ percent, status }: { percent: number | null; status: string }) {
  if (status === "COMPLETED") {
    return <span className="text-emerald-600 font-semibold tabular-nums" dir="ltr">100%</span>;
  }
  const value = percent ?? 0;
  return (
    <div className="flex flex-col gap-0.5 min-w-[52px]">
      <span className="text-[10px] font-medium text-slate-600 tabular-nums" dir="ltr">{value}%</span>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function formatResearchDate(iso: string) {
  return formatDate(iso, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ResearchDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: AdminResearchItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const fields: { label: string; value: ReactNode }[] = [
    { label: "عنوان البحث", value: item.title },
    {
      label: "الباحث",
      value: (
        <Link href={`/admin/faculty/${item.researcher.id}`} className="text-[#2563EB] hover:underline">
          {item.researcher.displayName}
        </Link>
      ),
    },
    { label: "التشكيل", value: item.researcher.entity ?? "—" },
    { label: "القسم", value: item.researcher.department ?? "—" },
    { label: "نوع البحث", value: item.researchTypeLabel },
    { label: "الملكية", value: item.ownershipLabel },
    { label: "حالة الإنجاز", value: item.statusLabel },
    {
      label: "نسبة التقدّم",
      value: item.status === "COMPLETED" ? "100%" : `${formatNumber(item.progressPercent ?? 0)}%`,
    },
    { label: "سنة البحث", value: formatNumber(item.year) },
    { label: "حالة النشر", value: item.publishStatusLabel ?? "—" },
    { label: "نوع النشر", value: item.publishTypeLabel ?? "—" },
    {
      label: "شهر النشر",
      value: item.publishMonthLabel ? `${item.publishMonthLabel} ${formatNumber(item.year)}` : "—",
    },
    { label: "دار النشر / المجلة", value: item.publisher ?? "—" },
    { label: "DOI", value: item.doi ?? "—" },
    { label: "التصنيف", value: item.categoriesLabel },
    { label: "تصنيف سكوبس", value: item.scopusQuartile ?? "—" },
    { label: "تاريخ الإدخال", value: formatResearchDate(item.createdAt) },
    { label: "آخر تحديث", value: formatResearchDate(item.updatedAt) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base leading-relaxed pr-0">
            تفاصيل البحث
          </DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          {fields.map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[120px_1fr] gap-2 border-b border-slate-100 pb-2">
              <dt className="text-slate-500 font-medium">{label}</dt>
              <dd className="text-slate-800 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {item.researchUrl && (
          <a
            href={item.researchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline mt-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            رابط البحث
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ResearchTable({
  items,
  rowOffset = 0,
  pagination,
  filters,
  section = "overview",
  variant = "default",
}: ResearchTableProps) {
  const [detailItem, setDetailItem] = useState<AdminResearchItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        {variant === "scopus"
          ? "لا توجد بحوث SCOPUS مطابقة لمعايير البحث"
          : "لا توجد بحوث مطابقة لمعايير البحث الحالية"}
      </div>
    );
  }

  if (variant === "scopus") {
    return (
      <>
        <ScopusResearchTableBody
          items={items}
          rowOffset={rowOffset}
          pagination={pagination}
          filters={filters}
          section={section}
          onViewDetail={setDetailItem}
        />
        <ResearchDetailDialog
          item={detailItem}
          open={!!detailItem}
          onOpenChange={(open) => !open && setDetailItem(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed text-xs min-w-[1100px]">
            <colgroup>
              <col className="w-[36px]" />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[220px]" />
              <col className="w-[72px]" />
              <col className="w-[72px]" />
              <col className="w-[68px]" />
              <col className="w-[52px]" />
              <col className="w-[72px]" />
              <col className="w-[90px]" />
              <col className="w-[56px]" />
              <col className="w-[80px]" />
              <col className="w-[44px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">#</TableHead>
                <TableHead className="text-white font-semibold text-right px-2 py-2.5">الباحث</TableHead>
                <TableHead className="text-white font-semibold text-right px-2 py-2.5">التشكيل</TableHead>
                <TableHead className="text-white font-semibold text-right px-2 py-2.5">عنوان البحث</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">النوع</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">الحالة</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">التقدّم</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">السنة</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">النشر</TableHead>
                <TableHead className="text-white font-semibold text-right px-2 py-2.5">التصنيف</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">سكوبس</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">تاريخ الإدخال</TableHead>
                <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">تفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 border-slate-100">
                  <TableCell className="text-center text-slate-400 font-mono px-1.5 py-2 tabular-nums" dir="ltr">
                    {formatNumber(rowOffset + index + 1)}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <Link
                      href={`/admin/faculty/${item.researcher.id}`}
                      className="font-medium text-[#2563EB] hover:underline line-clamp-2 leading-snug"
                      title={item.researcher.displayName}
                    >
                      {item.researcher.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600 px-2 py-2 truncate" title={item.researcher.entity ?? ""}>
                    {item.researcher.entity ?? "—"}
                  </TableCell>
                  <TableCell className="text-slate-800 px-2 py-2">
                    <span className="line-clamp-2 leading-snug" title={item.title}>
                      {item.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2 text-slate-600 whitespace-nowrap">
                    {item.researchTypeLabel}
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2">
                    <StatusBadge status={item.status} label={item.statusLabel} />
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2">
                    <ProgressCell percent={item.progressPercent} status={item.status} />
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2 font-medium text-slate-700 tabular-nums" dir="ltr">
                    {formatNumber(item.year)}
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2">
                    <PublishBadge status={item.publishStatus} label={item.publishStatusLabel} />
                  </TableCell>
                  <TableCell className="text-slate-600 px-2 py-2 truncate" title={item.categoriesLabel}>
                    {item.categoriesLabel}
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2 text-slate-600">
                    {item.scopusQuartile ?? "—"}
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2 text-slate-500 whitespace-nowrap tabular-nums" dir="ltr">
                    {formatResearchDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-center px-1.5 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-[#2563EB] hover:bg-[#2563EB]/10"
                      onClick={() => setDetailItem(item)}
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && filters && (
          <ResearchPaginationBar pagination={pagination} filters={filters} section={section} />
        )}
      </div>

      <ResearchDetailDialog
        item={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => !open && setDetailItem(null)}
      />
    </>
  );
}

function QuartileBadge({ quartile }: { quartile: string | null }) {
  if (!quartile) {
    return <span className="text-slate-400">—</span>;
  }
  const colors: Record<string, string> = {
    Q1: "bg-emerald-100 text-emerald-800",
    Q2: "bg-teal-100 text-teal-800",
    Q3: "bg-cyan-100 text-cyan-800",
    Q4: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        colors[quartile] ?? "bg-slate-100 text-slate-700"
      )}
      dir="ltr"
    >
      {quartile}
    </span>
  );
}

function ScopusResearchTableBody({
  items,
  rowOffset,
  pagination,
  filters,
  section,
  onViewDetail,
}: {
  items: AdminResearchItem[];
  rowOffset: number;
  pagination?: AdminResearchPagination;
  filters?: AdminResearchListFilters;
  section: AdminResearchSection;
  onViewDetail: (item: AdminResearchItem) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed text-xs min-w-[1280px]">
          <TableHeader>
            <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 w-[36px]">#</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">الباحث</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">التشكيل</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5 min-w-[200px]">عنوان البحث</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">الربع</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">النشر</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">نوع النشر</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">الناشر / المجلة</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">DOI</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">الحالة</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">التقدّم</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">السنة</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 w-[44px]">تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-slate-50/80 border-slate-100">
                <TableCell className="text-center text-slate-400 px-1.5 py-2 tabular-nums" dir="ltr">
                  {formatNumber(rowOffset + index + 1)}
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Link
                    href={`/admin/faculty/${item.researcher.id}`}
                    className="font-medium text-[#2563EB] hover:underline line-clamp-2"
                  >
                    {item.researcher.displayName}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-600 px-2 py-2 truncate">{item.researcher.entity ?? "—"}</TableCell>
                <TableCell className="text-slate-800 px-2 py-2">
                  <span className="line-clamp-2 leading-snug" title={item.title}>
                    {item.title}
                  </span>
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <QuartileBadge quartile={item.scopusQuartile} />
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <PublishBadge status={item.publishStatus} label={item.publishStatusLabel} />
                </TableCell>
                <TableCell className="text-center px-1.5 py-2 text-slate-600 whitespace-nowrap">
                  {item.publishTypeLabel ?? "—"}
                </TableCell>
                <TableCell className="text-slate-600 px-2 py-2 truncate" title={item.publisher ?? ""}>
                  {item.publisher ?? "—"}
                </TableCell>
                <TableCell className="text-slate-500 px-2 py-2 truncate font-mono text-[10px]" dir="ltr" title={item.doi ?? ""}>
                  {item.doi ?? "—"}
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <StatusBadge status={item.status} label={item.statusLabel} />
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <ProgressCell percent={item.progressPercent} status={item.status} />
                </TableCell>
                <TableCell className="text-center px-1.5 py-2 font-medium tabular-nums" dir="ltr">
                  {formatNumber(item.year)}
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[#2563EB] hover:bg-[#2563EB]/10"
                    onClick={() => onViewDetail(item)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && filters && (
        <ResearchPaginationBar pagination={pagination} filters={filters} section={section} />
      )}
    </div>
  );
}
