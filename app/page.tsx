import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  BookOpen, 
  Presentation, 
  FileText, 
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";

export default function HomePage() {
  // Sample data for preview chart
  const chartData = [
    { name: "يناير", قيمة: 12 },
    { name: "فبراير", قيمة: 19 },
    { name: "مارس", قيمة: 15 },
    { name: "أبريل", قيمة: 22 },
    { name: "مايو", قيمة: 18 },
    { name: "يونيو", قيمة: 25 },
  ];

  const featureCards = [
    {
      title: "البحوث والمنشورات",
      description: "إدارة شاملة",
      icon: BookOpen,
      color: "bg-blue-600",
      bgColor: "bg-blue-50",
      value: "1,234+",
    },
    {
      title: "المؤتمرات والندوات",
      description: "تتبع المشاركات",
      icon: Presentation,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      value: "456+",
    },
    {
      title: "التقارير والإحصائيات",
      description: "تحليلات متقدمة",
      icon: BarChart3,
      color: "bg-green-600",
      bgColor: "bg-green-50",
      value: "89%",
    },
  ];

  return (
    <div className="h-screen bg-[#F5F7FB] flex flex-col overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-green-50/20 pointer-events-none" />
      
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            {/* Left: Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
                <Image
                  src="/uob-logo.png"
                  alt="شعار جامعة البصرة"
                  width={40}
                  height={40}
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">واحة الباحث</span>
                <span className="text-xs text-gray-500">جامعة البصرة</span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/register">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  إنشاء حساب
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="sm"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
                >
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Screen */}
      <main className="relative z-10 flex-1 overflow-hidden mb-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 h-[calc(100vh-3rem-3.5rem)] py-2 lg:py-3 pb-4">
            {/* Left Column: Analytics Preview (Full Height) */}
            <div className="hidden lg:block min-h-0">
              <Card className="border-slate-100 bg-white shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-4 pt-3 pb-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      نظرة عامة
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-600 font-medium">+12.5%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                  {/* KPI Cards - Unified colors */}
                  <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
                    <div className="text-center p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-lg font-bold text-gray-900 mb-1">1.2K</div>
                      <div className="text-xs text-slate-500">باحث</div>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-lg font-bold text-gray-900 mb-1">456</div>
                      <div className="text-xs text-slate-500">منشور</div>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-lg font-bold text-gray-900 mb-1">89</div>
                      <div className="text-xs text-slate-500">مؤتمر</div>
                    </div>
                  </div>

                  {/* Chart Preview */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="h-full min-h-[100px]">
                      <LineChart
                        data={chartData}
                        dataKeys={[
                          { key: "قيمة", stroke: "#2563EB" },
                        ]}
                        showDots={true}
                        gridOpacity={0.08}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Hero + CTA + Feature Cards */}
            <div className="flex flex-col gap-2 lg:gap-3 min-h-0 justify-end">
              {/* Hero Section */}
              <div className="flex flex-col flex-shrink-0">
                <div>
                  <h1 className="text-6xl lg:text-7xl font-semibold text-gray-900 mb-1 leading-tight tracking-tight" style={{ fontWeight: 600 }}>
                    واحة الباحث
                  </h1>
                  <h2 className="text-lg lg:text-xl font-medium text-slate-500 mb-2 leading-tight tracking-wide" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                    Oasis Research Platform
                  </h2>
                </div>
              </div>

              {/* CTA Buttons - Centered in empty space */}
              <div className="flex flex-col justify-center flex-1 min-h-0 gap-4">
                {/* Description Capsule */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center px-4 py-3 rounded-full border border-slate-200 bg-white/70 backdrop-blur-sm max-w-lg">
                    <p className="text-sm lg:text-base text-slate-600 leading-relaxed font-normal text-center">
                      وثّق إنجازاتك البحثية، نظّم منشوراتك، واصنع ملفك العلمي الرسمي في جامعة البصرة.
                    </p>
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/login" className="sm:w-auto">
                    <Button 
                      size="sm"
                      className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm px-5 text-xs h-9"
                    >
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link href="/register" className="sm:w-auto">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto border-gray-200 text-gray-700 hover:bg-gray-50 px-5 text-xs h-9"
                    >
                      إنشاء حساب جديد
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Feature Cards Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 flex-shrink-0 items-end">
                {featureCards.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card 
                      key={index}
                      className="border-slate-200 bg-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out h-fit rounded-2xl"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <div className={`${feature.bgColor} ${feature.color} p-2.5 rounded-xl mb-3`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-base text-gray-900 mb-1.5">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-slate-500 mb-2">
                            {feature.description}
                          </p>
                          <div className="text-2xl font-bold text-gray-900">
                            {feature.value}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3 w-3" />
              <span>واحة الباحث - جامعة البصرة</span>
            </div>
            <div>© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
