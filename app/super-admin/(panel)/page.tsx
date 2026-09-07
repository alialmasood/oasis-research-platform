import Link from "next/link";
import { SuperAdminShell } from "./SuperAdminShell";
import { getPlatformStats } from "@/lib/superAdmin/users";
import { getAdminStats } from "@/lib/superAdmin/admins";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
            {value.toLocaleString("ar-IQ")}
          </p>
          {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
        </div>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({
  title,
  description,
  href,
  cta,
  primary,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  primary?: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200/70 bg-white px-5 py-5 shadow-sm transition-colors hover:border-slate-300/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <Button
        asChild
        variant={primary ? "default" : "outline"}
        className={`h-9 self-start rounded-lg text-sm ${
          primary ? "bg-blue-600 hover:bg-blue-700" : "border-slate-200"
        }`}
      >
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

export default async function SuperAdminHomePage() {
  const [platform, admins] = await Promise.all([getPlatformStats(), getAdminStats()]);

  return (
    <SuperAdminShell active="home">
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            لوحة التحكم
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            نظرة عامة مختصرة على مستخدمي المنصة وحسابات الإدارة — دون الوصول إلى كلمات المرور.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي المستخدمين"
            value={platform.totalUsers}
            hint={`${platform.activeUsers.toLocaleString("ar-IQ")} نشط`}
            icon={Users}
            iconClass="bg-slate-50 text-slate-500"
          />
          <StatCard
            label="الباحثون"
            value={platform.totalResearchers}
            icon={GraduationCap}
            iconClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="حسابات الإدارة"
            value={admins.total}
            hint={`${admins.active.toLocaleString("ar-IQ")} نشط`}
            icon={ShieldCheck}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="الحسابات المعطّلة"
            value={platform.disabledUsers}
            icon={UserX}
            iconClass="bg-rose-50 text-rose-500"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ShortcutCard
            title="إدارة المستخدمين"
            description="بحث وفلترة وتعديل البيانات الآمنة وتعطيل أو تفعيل الحسابات."
            href="/super-admin/users"
            cta="فتح المستخدمين"
            primary
            icon={Users}
          />
          <ShortcutCard
            title="حسابات الإدارة"
            description="إنشاء حسابات Admin وإعادة تعيين كلمات المرور ومتابعة حالتها."
            href="/super-admin/admins"
            cta="فتح حسابات الإدارة"
            icon={ShieldCheck}
          />
          <ShortcutCard
            title="سجل العمليات"
            description="متابعة العمليات الحساسة التي نفّذتها الإدارة العليا."
            href="/super-admin/audit-logs"
            cta="فتح سجل العمليات"
            icon={ClipboardList}
          />
        </div>
      </div>
    </SuperAdminShell>
  );
}
