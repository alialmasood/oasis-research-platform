"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SafePlatformUser } from "@/lib/superAdmin/users";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Search,
  ShieldOff,
  UserCheck,
  Users,
} from "lucide-react";
import { SuperAdminEmptyState } from "../_components/EmptyState";
import {
  RoleBadges,
  SUPER_ADMIN_DIALOG_CONTENT,
  StatusBadge,
  formatSuperAdminDate,
  roleLabel,
} from "../_components/presentation";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ToastState = { message: string; type: "success" | "error" } | null;

function displayName(user: SafePlatformUser) {
  return user.fullNameAr?.trim() || user.fullNameEn?.trim() || user.email;
}

export function UsersPageClient({
  initialItems,
  initialPagination,
  roleOptions,
}: {
  initialItems: SafePlatformUser[];
  initialPagination: Pagination;
  roleOptions: string[];
}) {
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detailsUser, setDetailsUser] = useState<SafePlatformUser | null>(null);
  const [editUser, setEditUser] = useState<SafePlatformUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullNameAr: "",
    fullNameEn: "",
    email: "",
    phone: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    user: SafePlatformUser;
    type: "disable" | "enable" | "revoke";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const filtersActive =
    search.trim().length > 0 || role !== "ALL" || status !== "ALL";

  const fetchUsers = useCallback(
    async (opts?: {
      search?: string;
      role?: string;
      status?: "ALL" | "ACTIVE" | "DISABLED";
      page?: number;
    }) => {
      const nextSearch = opts?.search ?? search;
      const nextRole = opts?.role ?? role;
      const nextStatus = opts?.status ?? status;
      const nextPage = opts?.page ?? page;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: nextSearch,
          role: nextRole,
          status: nextStatus,
          page: String(nextPage),
          pageSize: String(pagination.pageSize || 20),
        });
        const res = await fetch(`/api/super-admin/users?${params.toString()}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          showToast(data?.message || "تعذر تحميل المستخدمين", "error");
          return;
        }
        setItems(data.items);
        setPagination(data.pagination);
      } catch {
        showToast("تعذر تحميل المستخدمين", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, role, status, page, pagination.pageSize]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next === search) return;
      setSearch(next);
      setPage(1);
      void fetchUsers({ search: next, page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // intentionally only depend on searchInput for debounce trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const onRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
    void fetchUsers({ role: value, page: 1 });
  };

  const onStatusChange = (value: "ALL" | "ACTIVE" | "DISABLED") => {
    setStatus(value);
    setPage(1);
    void fetchUsers({ status: value, page: 1 });
  };

  const goPage = (next: number) => {
    if (next < 1 || (pagination.totalPages > 0 && next > pagination.totalPages)) return;
    setPage(next);
    void fetchUsers({ page: next });
  };

  const openDetails = async (user: SafePlatformUser) => {
    setDetailsUser(user);
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.user) {
        setDetailsUser(data.user);
      }
    } catch {
      /* keep list snapshot */
    }
  };

  const openEdit = (user: SafePlatformUser) => {
    setEditUser(user);
    setEditForm({
      fullNameAr: user.fullNameAr ?? "",
      fullNameEn: user.fullNameEn ?? "",
      email: user.email,
      phone: user.phone ?? "",
    });
    setFormError("");
    setDetailsUser(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/users/${editUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameAr: editForm.fullNameAr,
          fullNameEn: editForm.fullNameEn,
          email: editForm.email,
          phone: editForm.phone || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setFormError(data?.message || "تعذر تحديث المستخدم");
        return;
      }
      setEditUser(null);
      await fetchUsers();
      showToast("تم تحديث بيانات المستخدم");
    } catch {
      setFormError("تعذر تحديث المستخدم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmAction) return;
    const { user, type } = confirmAction;
    setBusyId(user.id);
    try {
      const path =
        type === "revoke"
          ? `/api/super-admin/users/${user.id}/revoke-sessions`
          : `/api/super-admin/users/${user.id}/${type}`;
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showToast(data?.message || "تعذر تنفيذ العملية", "error");
        return;
      }
      setConfirmAction(null);
      setDetailsUser(null);
      await fetchUsers();
      showToast(
        type === "disable"
          ? "تم تعطيل الحساب"
          : type === "enable"
            ? "تم تفعيل الحساب"
            : "تم إنهاء جميع الجلسات"
      );
    } catch {
      showToast("تعذر تنفيذ العملية", "error");
    } finally {
      setBusyId(null);
    }
  };

  const roleFilterOptions = useMemo(() => {
    const set = new Set(["ADMIN", "RESEARCHER", ...roleOptions]);
    return Array.from(set);
  }, [roleOptions]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    setPage(1);
    void fetchUsers({ search: "", role: "ALL", status: "ALL", page: 1 });
  };

  const renderUserActions = (user: SafePlatformUser) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg border-slate-200 p-0"
          disabled={busyId === user.id}
          aria-label={`إجراءات ${displayName(user)}`}
        >
          {busyId === user.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        <DropdownMenuItem onSelect={() => void openDetails(user)}>
          تفاصيل
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openEdit(user)}>
          <Pencil className="h-3.5 w-3.5" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setConfirmAction({ user, type: "revoke" })}
        >
          <LogOut className="h-3.5 w-3.5" />
          تسجيل خروج من جميع الأجهزة
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isActive ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmAction({ user, type: "disable" })}
          >
            <ShieldOff className="h-3.5 w-3.5" />
            تعطيل
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => setConfirmAction({ user, type: "enable" })}
          >
            <UserCheck className="h-3.5 w-3.5" />
            تفعيل
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5">
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
          إدارة المستخدمين
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          عرض وتعديل حسابات المنصة وتعطيلها أو إنهاء جلساتها.
        </p>
        <p className="mt-1 text-[12px] text-slate-400">
          {pagination.total.toLocaleString("ar-IQ")} مستخدم
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم أو البريد أو الهاتف..."
              className="h-11 rounded-lg border-slate-200 pr-9"
              aria-label="بحث عن مستخدم"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row md:shrink-0">
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-36"
              aria-label="تصفية حسب الدور"
            >
              <option value="ALL">كل الأدوار</option>
              {roleFilterOptions.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "ALL" | "ACTIVE" | "DISABLED")
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-32"
              aria-label="تصفية حسب الحالة"
            >
              <option value="ALL">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="DISABLED">معطّل</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2
              className="h-5 w-5 animate-spin text-blue-600"
              aria-label="جاري التحميل"
            />
          </div>
        ) : null}

        {items.length === 0 ? (
          <SuperAdminEmptyState
            icon={Users}
            title={
              filtersActive ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون بعد"
            }
            description={
              filtersActive
                ? "جرّب تغيير البحث أو الفلاتر."
                : "ستظهر هنا حسابات المنصة عند تسجيل المستخدمين."
            }
            actionLabel={filtersActive ? "مسح الفلاتر" : undefined}
            onAction={filtersActive ? clearFilters : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr className="text-right text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">المستخدم</th>
                    <th className="px-4 py-3 font-medium">البريد / الهاتف</th>
                    <th className="px-4 py-3 font-medium">الدور</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetails(user)}
                          className="text-right font-medium text-slate-900 hover:text-blue-700"
                        >
                          {displayName(user)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700" dir="ltr">
                          <span className="block max-w-[260px] truncate">{user.email}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
                          <span className="block max-w-[260px] truncate">
                            {user.phone || "—"}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadges roles={user.roles} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={user.isActive} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatSuperAdminDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {renderUserActions(user)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {items.map((user) => (
                <div key={user.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => void openDetails(user)}
                      className="w-full text-right"
                    >
                      <p className="font-medium text-slate-900">
                        {displayName(user)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500" dir="ltr">
                        {user.email}
                      </p>
                      {user.phone ? (
                        <p className="mt-0.5 truncate text-xs text-slate-400" dir="ltr">
                          {user.phone}
                        </p>
                      ) : null}
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RoleBadges roles={user.roles} />
                      <StatusBadge active={user.isActive} />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formatSuperAdminDate(user.createdAt)}
                    </p>
                  </div>
                  {renderUserActions(user)}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
          <p className="text-[11px] text-slate-400">
            صفحة {pagination.page.toLocaleString("ar-IQ")} من{" "}
            {Math.max(pagination.totalPages, 1).toLocaleString("ar-IQ")}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1 || loading}
              onClick={() => goPage(page - 1)}
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={
                loading ||
                pagination.totalPages === 0 ||
                page >= pagination.totalPages
              }
              onClick={() => goPage(page + 1)}
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!detailsUser} onOpenChange={(open) => !open && setDetailsUser(null)}>
        <DialogContent className={`sm:max-w-lg ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
            <DialogDescription>بيانات الحساب الأساسية فقط.</DialogDescription>
          </DialogHeader>
          {detailsUser ? (
            <div className="space-y-3 text-sm">
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3">
                <div>
                  <p className="text-[11px] text-slate-500">الاسم</p>
                  <p className="font-medium text-slate-900">
                    {displayName(detailsUser)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">البريد</p>
                  <p className="text-slate-800" dir="ltr">
                    {detailsUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">الهاتف</p>
                  <p className="text-slate-800" dir="ltr">
                    {detailsUser.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">الأدوار</p>
                  <div className="mt-1">
                    <RoleBadges roles={detailsUser.roles} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">الحالة</p>
                  <div className="mt-1">
                    <StatusBadge active={detailsUser.isActive} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-[11px] text-slate-500">تاريخ الإنشاء</p>
                    <p className="text-xs text-slate-700">
                      {formatSuperAdminDate(detailsUser.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">آخر تحديث</p>
                    <p className="text-xs text-slate-700">
                      {formatSuperAdminDate(detailsUser.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button
                  type="button"
                  className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => openEdit(detailsUser)}
                >
                  تعديل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-slate-200"
                  onClick={() =>
                    setConfirmAction({ user: detailsUser, type: "revoke" })
                  }
                >
                  <LogOut className="h-3.5 w-3.5 ml-1" />
                  تسجيل خروج من جميع الأجهزة
                </Button>
                {detailsUser.isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg border-rose-200 text-rose-700"
                    onClick={() =>
                      setConfirmAction({ user: detailsUser, type: "disable" })
                    }
                  >
                    تعطيل
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg border-emerald-200 text-emerald-700"
                    onClick={() =>
                      setConfirmAction({ user: detailsUser, type: "enable" })
                    }
                  >
                    تفعيل
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className={`sm:max-w-lg ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تعديل البيانات الآمنة فقط. الأدوار وكلمة المرور غير قابلة للتعديل من هنا.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3.5">
            {formError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="edit-ar">الاسم بالعربية</Label>
              <Input
                id="edit-ar"
                className="h-10"
                value={editForm.fullNameAr}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, fullNameAr: e.target.value }))
                }
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-en">الاسم بالإنجليزية</Label>
              <Input
                id="edit-en"
                className="h-10"
                dir="ltr"
                value={editForm.fullNameEn}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, fullNameEn: e.target.value }))
                }
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                className="h-10 text-left"
                dir="ltr"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">الهاتف</Label>
              <Input
                id="edit-phone"
                className="h-10 text-left"
                dir="ltr"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                disabled={submitting}
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start">
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : null}
                حفظ
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                disabled={submitting}
                onClick={() => setEditUser(null)}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className={`sm:max-w-md ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>
              {confirmAction?.type === "disable"
                ? "تعطيل الحساب"
                : confirmAction?.type === "enable"
                  ? "تفعيل الحساب"
                  : "تسجيل خروج من جميع الأجهزة"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "disable"
                ? `هل أنت متأكد من تعطيل حساب ${
                    confirmAction ? displayName(confirmAction.user) : ""
                  }؟ لن يتمكن المستخدم من الوصول إلى المنصة حتى إعادة تفعيله.`
                : confirmAction?.type === "enable"
                  ? `هل تريد إعادة تفعيل حساب ${
                      confirmAction ? displayName(confirmAction.user) : ""
                    }؟`
                  : "سيتم إنهاء جميع جلسات هذا الحساب وسيحتاج المستخدم إلى تسجيل الدخول مرة أخرى."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={!!busyId}
              onClick={() => void handleToggle()}
              className={`h-9 rounded-lg ${
                confirmAction?.type === "disable"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : confirmAction?.type === "enable"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {busyId ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              تأكيد
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg"
              disabled={!!busyId}
              onClick={() => setConfirmAction(null)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
