"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "@/components/charts/bar-chart";
import type { MetricTabData } from "@/lib/comparisonRepo";

type MetricTabsProps = {
  metricTabs: MetricTabData[];
  defaultTabId?: string;
  currentUserId?: string;
};

export function MetricTabs({ metricTabs, defaultTabId, currentUserId }: MetricTabsProps) {
  const defaultTab = defaultTabId ?? metricTabs[0]?.id ?? "total";

  if (metricTabs.length === 0) {
    return (
      <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl md:rounded-2xl">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
            تفاصيل المؤشرات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="min-h-[96px] md:min-h-[120px] flex items-center justify-center text-[10px] md:text-sm text-slate-500">
            لا توجد مؤشرات متاحة حالياً.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl md:rounded-2xl">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
          تفاصيل المؤشرات
        </CardTitle>
        <p className="hidden md:block text-xs text-slate-500 mt-1">
          اختر معيارًا لترى ترتيبك فيه، وأفضل 10 في الجامعة، ومقارنة سريعة مع الأعلى أداءً.
        </p>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        <Tabs defaultValue={defaultTab} className="gap-3 md:gap-4">
          <TabsList className="h-auto w-full flex flex-nowrap md:flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
            {metricTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-sm shrink-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {metricTabs.map((tab) => {
            const inTop10 = tab.top10.some((entry) => entry.id === currentUserId);
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-1.5 md:gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-3 min-h-[64px] h-full">
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-slate-500 truncate">
                        ترتيبك في «{tab.label}»
                      </p>
                      <p className="text-lg md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5 md:mt-1">
                        #{tab.myRank}
                      </p>
                    </div>
                    {!inTop10 ? (
                      <span className="rounded-full border border-slate-200 bg-white px-1.5 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-[11px] text-slate-600 w-fit">
                        خارج أفضل 10
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 md:px-2.5 py-0.5 md:py-1 text-[9px] md:text-[11px] font-medium text-emerald-700 w-fit">
                        ضمن أفضل 10
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2 md:px-4 md:py-3 min-h-[64px] h-full">
                    <p className="text-[10px] md:text-xs text-slate-500">قيمتك في هذا المعيار</p>
                    <p className="text-lg md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5 md:mt-1">
                      {tab.myValue}
                    </p>
                    <p className="hidden md:block text-[11px] text-slate-500 mt-1">
                      نقاط حسب وزن المعيار المختار
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:gap-4 lg:grid-cols-2 lg:items-start">
                  <div className="rounded-xl md:rounded-2xl border border-slate-100 bg-white p-2.5 md:p-4 space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] md:text-sm font-semibold text-slate-900">
                        أفضل 10 في الجامعة
                      </p>
                      <span className="text-[9px] md:text-[11px] text-slate-500 truncate">
                        حسب «{tab.label}»
                      </span>
                    </div>
                    {tab.top10.length === 0 ? (
                      <div className="min-h-[96px] md:min-h-[160px] flex items-center justify-center text-[10px] md:text-sm text-slate-500">
                        لا توجد بيانات كافية.
                      </div>
                    ) : (
                      <ol className="space-y-1.5 md:space-y-2">
                        {tab.top10.map((entry, index) => {
                          const isCurrent = entry.id === currentUserId;
                          return (
                            <li
                              key={entry.id}
                              className={`flex items-center gap-2 md:gap-3 rounded-xl border px-2 py-2 md:px-3 md:py-2.5 min-h-[48px] md:min-h-0 ${
                                isCurrent
                                  ? "border-blue-200 bg-blue-50/70"
                                  : "border-slate-100 bg-slate-50/50"
                              }`}
                            >
                              <span className="inline-flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-[10px] md:text-xs font-bold text-slate-700">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] md:text-sm font-semibold text-slate-900 truncate">
                                  {entry.fullName}
                                  {isCurrent ? (
                                    <span className="mr-1 text-[10px] md:text-[11px] font-medium text-blue-700">
                                      (أنت)
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                                  {entry.departmentName}
                                </p>
                              </div>
                              <div className="text-left shrink-0">
                                <p className="text-xs md:text-sm font-bold tabular-nums text-slate-900">
                                  {entry.metricValue}
                                </p>
                                <p className="text-[9px] md:text-[10px] text-slate-500">نقطة</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  <div className="rounded-xl md:rounded-2xl border border-slate-100 bg-white p-2.5 md:p-4 space-y-2 md:space-y-3">
                    <div>
                      <p className="text-[11px] md:text-sm font-semibold text-slate-900">
                        مقارنة سريعة
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                        أعلى 5 في المعيار مقارنةً بك
                      </p>
                    </div>
                    <div className="h-[180px] md:h-[280px]">
                      <BarChart
                        data={tab.chartData.map((row) => ({
                          name: row.name,
                          القيمة: row.isUser ? 0 : row.value,
                          أنت: row.isUser ? row.value : 0,
                        }))}
                        dataKeys={["القيمة", "أنت"]}
                        colors={["#94a3b8", "#2563EB"]}
                        legendLayout="horizontal"
                        legendVerticalAlign="bottom"
                        tooltipLabel={(label, value, dataKey) =>
                          `القيمة لـ ${label}: ${value} ${dataKey === "أنت" ? "(أنت)" : ""}`
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
