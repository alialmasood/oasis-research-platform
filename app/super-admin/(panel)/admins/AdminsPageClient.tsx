"use client";

import { useMemo, useState } from "react";
import type { SafeAdmin } from "@/lib/superAdmin/admins";
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
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldOff,
  UserCheck,
  Users,
} from "lucide-react";
import { SuperAdminEmptyState } from "../_components/EmptyState";
import {
  SUPER_ADMIN_DIALOG_CONTENT,
  StatusBadge,
  formatSuperAdminDate,
} from "../_components/presentation";

type ToastState = { message: string; type: "success" | "error" } | null;

function fullName(admin: SafeAdmin) {
  return `${admin.firstName} ${admin.lastName}`.trim() || admin.email;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          dir="ltr"
          className="h-10 pl-10 text-left"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">8 أحرف على الأقل</p>
    </div>
  );
}

export function AdminsPageClient({ initialAdmins }: { initialAdmins: SafeAdmin[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [toast, setToast] = useState<ToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<SafeAdmin | null>(null);
  const [resetAdmin, setResetAdmin] = useState<SafeAdmin | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    admin: SafeAdmin;
    type: "disable" | "enable" | "revoke";
  } | null>(null);

  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const counts = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((a) => a.isActive).length,
    }),
    [admins]
  );

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const refreshAdmins = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/super-admin/admins", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const resetCreatePasswordVisibility = () => {
    setShowCreatePassword(false);
    setShowCreateConfirm(false);
  };

  const resetResetPasswordVisibility = () => {
    setShowResetPassword(false);
    setShowResetConfirm(false);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    resetCreatePasswordVisibility();
  };

  const closeReset = () => {
    setResetAdmin(null);
    setResetForm({ password: "", confirmPassword: "" });
    setFormError("");
    resetResetPasswordVisibility();
  };

  const openCreate = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    resetCreatePasswordVisibility();
    setCreateOpen(true);
  };

  const openEdit = (admin: SafeAdmin) => {
    setEditAdmin(admin);
    setEditForm({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
    });
    setFormError("");
  };

  const openReset = (admin: SafeAdmin) => {
    setResetAdmin(admin);
    setResetForm({ password: "", confirmPassword: "" });
    setFormError("");
    resetResetPasswordVisibility();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (createForm.password !== createForm.confirmPassword) {
      setFormError("كلمتا المرور غير متطابقتين");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          password: createForm.password,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setFormError(data?.message || "تعذر إنشاء الحساب");
        return;
      }
      closeCreate();
      await refreshAdmins();
      showToast("تم إنشاء حساب الإدارة بنجاح");
    } catch {
      setFormError("تعذر إنشاء الحساب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/admins/${editAdmin.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setFormError(data?.message || "تعذر تحديث الحساب");
        return;
      }
      setEditAdmin(null);
      await refreshAdmins();
      showToast("تم تحديث بيانات الحساب");
    } catch {
      setFormError("تعذر تحديث الحساب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAdmin) return;
    setFormError("");
    if (resetForm.password !== resetForm.confirmPassword) {
      setFormError("كلمتا المرور غير متطابقتين");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/super-admin/admins/${resetAdmin.id}/reset-password`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: resetForm.password }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setFormError(data?.message || "تعذر إعادة تعيين كلمة المرور");
        return;
      }
      closeReset();
      showToast("تم إعادة تعيين كلمة المرور بنجاح");
    } catch {
      setFormError("تعذر إعادة تعيين كلمة المرور");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmAction) return;
    const { admin, type } = confirmAction;
    setBusyId(admin.id);
    try {
      const path =
        type === "revoke"
          ? `/api/super-admin/admins/${admin.id}/revoke-sessions`
          : `/api/super-admin/admins/${admin.id}/${type}`;
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
      await refreshAdmins();
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

  const renderAdminActions = (admin: SafeAdmin) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg border-slate-200 p-0"
          disabled={busyId === admin.id}
          aria-label={`إجراءات ${fullName(admin)}`}
        >
          {busyId === admin.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        <DropdownMenuItem onSelect={() => openEdit(admin)}>
          <Pencil className="h-3.5 w-3.5" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openReset(admin)}>
          <KeyRound className="h-3.5 w-3.5" />
          كلمة المرور
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setConfirmAction({ admin, type: "revoke" })}
        >
          <LogOut className="h-3.5 w-3.5" />
          إنهاء الجلسات
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {admin.isActive ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmAction({ admin, type: "disable" })}
          >
            <ShieldOff className="h-3.5 w-3.5" />
            تعطيل
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => setConfirmAction({ admin, type: "enable" })}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            حسابات الإدارة
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            إدارة حسابات لوحة الإدارة: إنشاء، تعديل، وكلمات المرور.
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            {counts.total.toLocaleString("ar-IQ")} حساب ·{" "}
            {counts.active.toLocaleString("ar-IQ")} نشط
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="h-9 rounded-lg bg-blue-600 text-sm hover:bg-blue-700"
        >
          <Plus className="ml-2 h-3.5 w-3.5" />
          إضافة حساب إدارة
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
        {refreshing ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2
              className="h-5 w-5 animate-spin text-blue-600"
              aria-label="جاري التحميل"
            />
          </div>
        ) : null}

        {admins.length === 0 ? (
          <SuperAdminEmptyState
            icon={Users}
            title="لا توجد حسابات إدارة بعد"
            description="أضف أول حساب إدارة للوصول إلى لوحة الإدارة."
            actionLabel="إضافة حساب إدارة"
            onAction={openCreate}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr className="text-right text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">الاسم</th>
                    <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {fullName(admin)}
                      </td>
                      <td className="px-4 py-3 text-slate-600" dir="ltr">
                        <span className="block max-w-[280px] truncate">{admin.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={admin.isActive} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatSuperAdminDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {renderAdminActions(admin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-start gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-medium text-slate-900">
                      {fullName(admin)}
                    </p>
                    <p className="truncate text-xs text-slate-500" dir="ltr">
                      {admin.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge active={admin.isActive} />
                      <span className="text-[11px] text-slate-400">
                        {formatSuperAdminDate(admin.createdAt)}
                      </span>
                    </div>
                  </div>
                  {renderAdminActions(admin)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      >
        <DialogContent className={`sm:max-w-lg ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>إضافة حساب إدارة</DialogTitle>
            <DialogDescription>
              سيتمكن الحساب من الدخول عبر صفحة تسجيل الدخول العادية إلى لوحة الإدارة.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            {formError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-first">الاسم الأول</Label>
                <Input
                  id="create-first"
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-last">الاسم الأخير</Label>
                <Input
                  id="create-last"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">البريد الإلكتروني</Label>
              <Input
                id="create-email"
                type="email"
                dir="ltr"
                className="h-10 text-left"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                }
                required
                disabled={submitting}
              />
            </div>
            <PasswordField
              id="create-password"
              label="كلمة المرور"
              value={createForm.password}
              onChange={(password) => setCreateForm((p) => ({ ...p, password }))}
              show={showCreatePassword}
              onToggleShow={() => setShowCreatePassword((v) => !v)}
              disabled={submitting}
            />
            <PasswordField
              id="create-confirm"
              label="تأكيد كلمة المرور"
              value={createForm.confirmPassword}
              onChange={(confirmPassword) =>
                setCreateForm((p) => ({ ...p, confirmPassword }))
              }
              show={showCreateConfirm}
              onToggleShow={() => setShowCreateConfirm((v) => !v)}
              disabled={submitting}
            />
            <DialogFooter className="gap-2 sm:justify-start">
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : null}
                إنشاء الحساب
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="h-9 rounded-lg"
                onClick={closeCreate}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editAdmin}
        onOpenChange={(open) => {
          if (!open) {
            setEditAdmin(null);
            setFormError("");
          }
        }}
      >
        <DialogContent className={`sm:max-w-lg ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>تعديل حساب الإدارة</DialogTitle>
            <DialogDescription>
              تحديث الاسم والبريد فقط. كلمة المرور لها إجراء منفصل.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3.5">
            {formError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-first">الاسم الأول</Label>
                <Input
                  id="edit-first"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-last">الاسم الأخير</Label>
                <Input
                  id="edit-last"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                dir="ltr"
                className="h-10 text-left"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                required
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
                حفظ التغييرات
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="h-9 rounded-lg"
                onClick={() => {
                  setEditAdmin(null);
                  setFormError("");
                }}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetAdmin}
        onOpenChange={(open) => {
          if (!open) closeReset();
        }}
      >
        <DialogContent className={`sm:max-w-md ${SUPER_ADMIN_DIALOG_CONTENT}`} dir="rtl">
          <DialogHeader className="pl-8 text-right">
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>
              تعيين كلمة مرور جديدة لحساب {resetAdmin ? fullName(resetAdmin) : ""}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-3.5">
            {formError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <PasswordField
              id="reset-password"
              label="كلمة المرور الجديدة"
              value={resetForm.password}
              onChange={(password) => setResetForm((p) => ({ ...p, password }))}
              show={showResetPassword}
              onToggleShow={() => setShowResetPassword((v) => !v)}
              disabled={submitting}
            />
            <PasswordField
              id="reset-confirm"
              label="تأكيد كلمة المرور"
              value={resetForm.confirmPassword}
              onChange={(confirmPassword) =>
                setResetForm((p) => ({ ...p, confirmPassword }))
              }
              show={showResetConfirm}
              onToggleShow={() => setShowResetConfirm((v) => !v)}
              disabled={submitting}
            />
            <DialogFooter className="gap-2 sm:justify-start">
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : null}
                تحديث كلمة المرور
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="h-9 rounded-lg"
                onClick={closeReset}
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
                ? `هل تريد تعطيل حساب ${confirmAction ? fullName(confirmAction.admin) : ""}؟ لن يتمكن من تسجيل الدخول حتى يُعاد تفعيله.`
                : confirmAction?.type === "enable"
                  ? `هل تريد إعادة تفعيل حساب ${confirmAction ? fullName(confirmAction.admin) : ""}؟`
                  : "سيتم إنهاء جميع جلسات هذا الحساب وسيحتاج المستخدم إلى تسجيل الدخول مرة أخرى."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={!!busyId}
              onClick={() => void handleToggleActive()}
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
              disabled={!!busyId}
              className="h-9 rounded-lg"
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
