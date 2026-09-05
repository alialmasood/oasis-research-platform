import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  TrendingUp,
  Award,
  KeyRound,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { cn } from "@/lib/utils";

const chartData = [
  { name: "يناير", أنشطة: 12, مستخدمون: 8 },
  { name: "فبراير", أنشطة: 19, مستخدمون: 15 },
  { name: "مارس", أنشطة: 15, مستخدمون: 12 },
  { name: "أبريل", أنشطة: 22, مستخدمون: 18 },
  { name: "مايو", أنشطة: 18, مستخدمون: 14 },
  { name: "يونيو", أنشطة: 25, مستخدمون: 20 },
];

const kpiAccentStyles = [
  { border: "border-r-blue-500", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
  { border: "border-r-amber-500", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
  { border: "border-r-emerald-500", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
  { border: "border-r-purple-500", iconBg: "bg-purple-500/10", iconColor: "text-purple-600" },
];

type KpiItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  change: string;
  changePositive?: boolean;
};

function KpiCard({
  kpi,
  accent,
}: {
  kpi: KpiItem;
  accent: (typeof kpiAccentStyles)[number];
}) {
  const Icon = kpi.icon;
  return (
    <Card
      className={cn(
        "border border-slate-100 bg-white shadow-lg border-r-4 min-h-[100px]",
        accent.border
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-slate-600">{kpi.label}</CardTitle>
        <div className={cn("p-2 rounded-lg flex-shrink-0", accent.iconBg)}>
          <Icon className={cn("h-4 w-4", accent.iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
        {kpi.change !== "—" && (
          <p className="text-xs text-slate-500 mt-1">
            <span className={kpi.changePositive ? "text-emerald-600" : "text-slate-500"}>
              {kpi.change}
            </span>{" "}
            من الشهر الماضي
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("ADMIN")) {
    redirect("/login");
  }

  let totalUsers = 0;
  try {
    totalUsers = await prisma.user.count();
  } catch {
    totalUsers = 0;
  }

  const kpiData: KpiItem[] = [
    { label: "إجمالي المستخدمين", value: String(totalUsers), icon: Users, change: "—" },
    {
      label: "الأنشطة المعلقة",
      value: "45",
      icon: FileText,
      change: "+5%",
      changePositive: true,
    },
    {
      label: "نسبة النمو",
      value: "23%",
      icon: TrendingUp,
      change: "+3%",
      changePositive: true,
    },
    {
      label: "الجوائز",
      value: "89",
      icon: Award,
      change: "+8%",
      changePositive: true,
    },
  ];

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#2563EB] font-medium mb-1">جامعة البصرة · الخطة العلمية</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">لوحة تحكم المدير</h1>
        <p className="text-slate-500 mt-1">نظرة عامة على منصة واحة الباحث</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KpiCard key={kpi.label} kpi={kpi} accent={kpiAccentStyles[index]} />
        ))}
      </div>

      {isDev && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <KeyRound className="h-4 w-4 text-amber-600" />
              بيانات المستخدمين الافتراضية
            </CardTitle>
            <p className="text-xs text-slate-500">
              حسابات من سكربت seed — تظهر في بيئة التطوير فقط
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <UserCircle className="h-4 w-4 text-amber-600" />
                  مدير النظام (ADMIN)
                </div>
                <dl className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-500">البريد:</span>
                    <span className="mr-2 font-mono text-slate-800">admin@uobasrah.edu.iq</span>
                  </div>
                  <div>
                    <span className="text-slate-500">كلمة المرور:</span>
                    <span className="mr-2 font-mono text-slate-800">admin123</span>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <UserCircle className="h-4 w-4 text-amber-600" />
                  باحث تجريبي (RESEARCHER)
                </div>
                <dl className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-500">البريد:</span>
                    <span className="mr-2 font-mono text-slate-800">researcher@uobasrah.edu.iq</span>
                  </div>
                  <div>
                    <span className="text-slate-500">كلمة المرور:</span>
                    <span className="mr-2 font-mono text-slate-800">researcher123</span>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">الأنشطة الشهرية</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <BarChart
              data={chartData}
              dataKeys={["أنشطة", "مستخدمون"]}
              colors={["#2563EB", "#10b981"]}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">اتجاه النمو</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <LineChart
              data={chartData}
              dataKeys={[
                { key: "أنشطة", stroke: "#2563EB" },
                { key: "مستخدمون", stroke: "#10b981" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
