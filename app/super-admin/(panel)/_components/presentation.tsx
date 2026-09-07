import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Shared DialogContent classes for RTL: close on the left + scrollable height. */
export const SUPER_ADMIN_DIALOG_CONTENT =
  "max-h-[min(92vh,760px)] overflow-y-auto [&_[data-slot=dialog-close]]:left-4 [&_[data-slot=dialog-close]]:right-auto";

export const SUPER_ADMIN_NAV = [
  { key: "home", href: "/super-admin", label: "لوحة التحكم" },
  { key: "users", href: "/super-admin/users", label: "المستخدمون" },
  { key: "admins", href: "/super-admin/admins", label: "حسابات الإدارة" },
  { key: "audit-logs", href: "/super-admin/audit-logs", label: "سجل العمليات" },
] as const;

export type SuperAdminNavKey = (typeof SUPER_ADMIN_NAV)[number]["key"];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ADMIN_CREATED: "إنشاء حساب إدارة",
  ADMIN_UPDATED: "تعديل حساب إدارة",
  ADMIN_DISABLED: "تعطيل حساب إدارة",
  ADMIN_ENABLED: "تفعيل حساب إدارة",
  ADMIN_PASSWORD_RESET: "إعادة تعيين كلمة مرور إدارة",
  USER_UPDATED: "تعديل مستخدم",
  USER_DISABLED: "تعطيل مستخدم",
  USER_ENABLED: "تفعيل مستخدم",
  USER_SESSIONS_REVOKED: "تسجيل خروج من جميع الأجهزة",
};

export const AUDIT_TARGET_LABELS: Record<string, string> = {
  ADMIN: "إدارة",
  USER: "مستخدم",
};

const FIELD_LABELS: Record<string, string> = {
  email: "البريد الإلكتروني",
  fullNameAr: "الاسم العربي",
  fullNameEn: "الاسم الإنجليزي",
  phone: "الهاتف",
  role: "الدور",
  fullName: "الاسم",
};

export function formatSuperAdminDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatSuperAdminDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function roleLabel(role: string) {
  if (role === "ADMIN") return "إدارة";
  if (role === "RESEARCHER") return "باحث";
  return role;
}

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditTargetLabel(targetType: string) {
  return AUDIT_TARGET_LABELS[targetType] ?? targetType;
}

export function summarizeAuditMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "—";
  }
  const obj = metadata as Record<string, unknown>;

  if (Array.isArray(obj.changedFields) && obj.changedFields.length > 0) {
    const fields = (obj.changedFields as unknown[])
      .filter((v): v is string => typeof v === "string")
      .map((f) => FIELD_LABELS[f] ?? f);
    return fields.length ? `الحقول المعدلة: ${fields.join("، ")}` : "—";
  }

  if ("previousIsActive" in obj && "newIsActive" in obj) {
    const from = obj.previousIsActive ? "نشط" : "معطّل";
    const to = obj.newIsActive ? "نشط" : "معطّل";
    return `الحالة: ${from} ← ${to}`;
  }

  if (obj.sessionInvalidated === true) {
    return "تم إبطال الجلسات الحالية";
  }

  if (obj.reason === "super_admin_revoke_sessions") {
    return "إنهاء جميع جلسات الحساب";
  }

  if (typeof obj.reason === "string" && obj.reason.trim()) {
    return obj.reason;
  }

  const keys = Object.keys(obj);
  return keys.length ? "تفاصيل إضافية متاحة" : "—";
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 py-0.5 text-[11px] font-medium",
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-rose-100 bg-rose-50 text-rose-700"
      )}
    >
      {active ? "نشط" : "معطّل"}
    </Badge>
  );
}

export function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles.length) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-medium",
            role === "ADMIN"
              ? "border-blue-100 bg-blue-50 text-blue-700"
              : role === "RESEARCHER"
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-white text-slate-600"
          )}
        >
          {roleLabel(role)}
        </Badge>
      ))}
    </div>
  );
}
