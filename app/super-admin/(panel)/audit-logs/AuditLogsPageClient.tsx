"use client";

import { useCallback, useState } from "react";
import type { SafeAuditLog } from "@/lib/superAdmin/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
} from "lucide-react";
import { SuperAdminEmptyState } from "../_components/EmptyState";
import {
  AUDIT_ACTION_LABELS,
  SUPER_ADMIN_DIALOG_CONTENT,
  auditActionLabel,
  auditTargetLabel,
  formatSuperAdminDateTime,
  summarizeAuditMetadata,
} from "../_components/presentation";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ToastState = { message: string; type: "success" | "error" } | null;

export function AuditLogsPageClient({
  initialItems,
  initialPagination,
}: {
  initialItems: SafeAuditLog[];
  initialPagination: Pagination;
}) {
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [targetType, setTargetType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [details, setDetails] = useState<SafeAuditLog | null>(null);
  const [hasQueried, setHasQueried] = useState(false);

  const fetchLogs = useCallback(
    async (opts?: { page?: number }) => {
      const nextPage = opts?.page ?? page;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: "20",
          search,
          action,
          targetType,
        });
        const res = await fetch(`/api/super-admin/audit-logs?${params}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setToast({
            message: data?.message || "تعذر تحميل سجل العمليات",
            type: "error",
          });
          return;
        }
        setItems(data.items);
        setPagination(data.pagination);
        setPage(data.pagination.page);
        setHasQueried(true);
      } catch {
        setToast({ message: "تعذر تحميل سجل العمليات", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [action, page, search, targetType]
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await fetchLogs({ page: 1 });
  };

  const filtersActive =
    search.trim().length > 0 || action !== "ALL" || targetType !== "ALL";
  const emptyTitle =
    filtersActive || hasQueried
      ? "لا توجد نتائج مطابقة"
      : "لا توجد عمليات مسجّلة بعد";
  const emptyDesc =
    filtersActive || hasQueried
      ? "جرّب تغيير البحث أو الفلاتر."
      : "ستظهر هنا العمليات الحساسة التي تنفّذها الإدارة العليا.";

  return (
    <div className="space-y-5">
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
          سجل العمليات
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          عمليات الإدارة العليا الحساسة فقط — بدون كلمات مرور أو أسرار.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm md:flex-row md:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="audit-search" className="text-xs text-slate-500">
            بحث
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              id="audit-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بريد الهدف أو المنفّذ أو المعرّف"
              className="h-9 rounded-lg border-slate-200 pr-9"
            />
          </div>
        </div>
        <div className="w-full space-y-1.5 md:w-48">
          <Label htmlFor="audit-action" className="text-xs text-slate-500">
            العملية
          </Label>
          <select
            id="audit-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="ALL">الكل</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full space-y-1.5 md:w-36">
          <Label htmlFor="audit-target" className="text-xs text-slate-500">
            نوع الهدف
          </Label>
          <select
            id="audit-target"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
          >
            <option value="ALL">الكل</option>
            <option value="ADMIN">إدارة</option>
            <option value="USER">مستخدم</option>
          </select>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تصفية"}
        </Button>
      </form>

      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-label="جاري التحميل" />
          </div>
        ) : null}

        {items.length === 0 ? (
          <SuperAdminEmptyState
            icon={ClipboardList}
            title={emptyTitle}
            description={emptyDesc}
            actionLabel={filtersActive ? "إعادة المحاولة" : undefined}
            onAction={filtersActive ? () => void fetchLogs({ page: 1 }) : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr className="text-right text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">التاريخ والوقت</th>
                    <th className="px-4 py-3 font-medium">العملية</th>
                    <th className="px-4 py-3 font-medium">النوع</th>
                    <th className="px-4 py-3 font-medium">المستهدف</th>
                    <th className="px-4 py-3 font-medium">المنفّذ</th>
                    <th className="px-4 py-3 font-medium">ملخص</th>
                    <th className="px-4 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {formatSuperAdminDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {auditActionLabel(row.action)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {auditTargetLabel(row.targetType)}
                      </td>
                      <td className="px-4 py-3 text-slate-700" dir="ltr">
                        {row.targetEmail || row.targetId || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700" dir="ltr">
                        {row.actorEmail}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
                        {summarizeAuditMetadata(row.metadata)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-slate-200 text-xs"
                          onClick={() => setDetails(row)}
                        >
                          تفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {items.map((row) => (
                <div key={row.id} className="space-y-2 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {auditActionLabel(row.action)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatSuperAdminDateTime(row.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {auditTargetLabel(row.targetType)}
                    </span>
                  </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500" dir="ltr">
                      {row.targetEmail || row.targetId || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      المنفّذ:{" "}
                      <span className="inline-block max-w-full truncate align-bottom" dir="ltr">
                        {row.actorEmail}
                      </span>
                    </p>
                  <p className="text-xs text-slate-500">
                    {summarizeAuditMetadata(row.metadata)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-slate-200 text-xs"
                    onClick={() => setDetails(row)}
                  >
                    تفاصيل
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            {pagination.total.toLocaleString("ar-IQ")} سجل · صفحة{" "}
            {pagination.page.toLocaleString("ar-IQ")}
            {pagination.totalPages
              ? ` من ${pagination.totalPages.toLocaleString("ar-IQ")}`
              : ""}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg border-slate-200 p-0"
              disabled={page <= 1 || loading}
              onClick={() => void fetchLogs({ page: page - 1 })}
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg border-slate-200 p-0"
              disabled={
                loading || pagination.totalPages === 0 || page >= pagination.totalPages
              }
              onClick={() => void fetchLogs({ page: page + 1 })}
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className={`sm:max-w-md ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>تفاصيل العملية</DialogTitle>
            <DialogDescription>معلومات آمنة فقط بدون أسرار.</DialogDescription>
          </DialogHeader>
          {details ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-xs text-slate-500">العملية: </span>
                {auditActionLabel(details.action)}
              </p>
              <p>
                <span className="text-xs text-slate-500">النوع: </span>
                {auditTargetLabel(details.targetType)}
              </p>
              <p dir="ltr">
                <span className="text-xs text-slate-500">المستهدف: </span>
                {details.targetEmail || details.targetId || "—"}
              </p>
              <p dir="ltr">
                <span className="text-xs text-slate-500">المنفّذ: </span>
                {details.actorEmail}
              </p>
              <p>
                <span className="text-xs text-slate-500">الوقت: </span>
                {formatSuperAdminDateTime(details.createdAt)}
              </p>
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-700">
                {summarizeAuditMetadata(details.metadata)}
              </div>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg"
              onClick={() => setDetails(null)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
