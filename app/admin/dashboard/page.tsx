import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Award, KeyRound, UserCircle } from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";

const chartData = [
  { name: "يناير", أنشطة: 12, مستخدمون: 8 },
  { name: "فبراير", أنشطة: 19, مستخدمون: 15 },
  { name: "مارس", أنشطة: 15, مستخدمون: 12 },
  { name: "أبريل", أنشطة: 22, مستخدمون: 18 },
  { name: "مايو", أنشطة: 18, مستخدمون: 14 },
  { name: "يونيو", أنشطة: 25, مستخدمون: 20 },
];

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("ADMIN")) {
    redirect("/login");
  }

  // جلب عدد المستخدمين الفعلي من قاعدة البيانات
  let totalUsers = 0;
  try {
    totalUsers = await prisma.user.count();
  } catch {
    totalUsers = 0;
  }

  const kpiData = [
    { label: "إجمالي المستخدمين", value: String(totalUsers), icon: Users, change: "—" },
    { label: "الأنشطة المعلقة", value: "45", icon: FileText, change: "+5%" },
    { label: "نسبة النمو", value: "23%", icon: TrendingUp, change: "+3%" },
    { label: "الجوائز", value: "89", icon: Award, change: "+8%" },
  ];

  return (
    <DashboardLayout user={{ id: user.id, fullName: user.fullName, roles: user.roles }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground">
            نظرة عامة على منصة البحث العلمي
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">{kpi.change}</span> من
                    الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* بيانات المستخدمين الافتراضيين (للتطوير/الاختبار) */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600" />
              بيانات المستخدمين الافتراضية
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              حسابات من سكربت seed — للتطوير والاختبار فقط
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

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>الأنشطة الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={chartData} dataKeys={["أنشطة", "مستخدمون"]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اتجاه النمو</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={chartData}
                dataKeys={[
                  { key: "أنشطة", stroke: "#8884d8" },
                  { key: "مستخدمون", stroke: "#82ca9d" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
