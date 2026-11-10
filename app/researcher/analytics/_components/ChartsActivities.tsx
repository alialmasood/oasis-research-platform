"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { AnalyticsTimelinePoint } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Inbox } from "lucide-react";

type ChartsActivitiesProps = {
  timeline: AnalyticsTimelinePoint[];
};

export function ChartsActivities({ timeline }: ChartsActivitiesProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"area" | "bar">("area");
  const summary = useMemo(() => {
    if (timeline.length === 0) return "";
    const totals = timeline.reduce(
      (acc, point) => {
        acc.research += point.research;
        acc.conference += point.conference;
        acc.workshop += point.workshop;
        acc.committee += point.committee;
        return acc;
      },
      { research: 0, conference: 0, workshop: 0, committee: 0 }
    );
    const entries = [
      { label: "البحوث", value: totals.research },
      { label: "المؤتمرات", value: totals.conference },
      { label: "الورش", value: totals.workshop },
      { label: "اللجان", value: totals.committee },
    ];
    const top = entries.reduce((best, item) => (item.value > best.value ? item : best), entries[0]);
    return top.value > 0 ? `التركيز الأكبر كان على ${top.label} خلال الفترة المحددة.` : "";
  }, [timeline]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <div className="md:hidden rounded-xl border border-slate-100 bg-white shadow-sm h-[168px]" />
        <div className="hidden md:block rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />
      </>
    );
  }

  const viewToggle = (
    <>
      <div className="md:hidden inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        <Button
          size="sm"
          variant={view === "area" ? "default" : "ghost"}
          className="h-7 rounded-md px-2 text-[10px]"
          onClick={() => setView("area")}
        >
          Area
        </Button>
        <Button
          size="sm"
          variant={view === "bar" ? "default" : "ghost"}
          className="h-7 rounded-md px-2 text-[10px]"
          onClick={() => setView("bar")}
        >
          Bar
        </Button>
      </div>
      <div className="hidden md:inline-flex rounded-full border border-slate-200 bg-white p-1">
        <Button
          size="sm"
          variant={view === "area" ? "default" : "ghost"}
          className="rounded-full px-4"
          onClick={() => setView("area")}
        >
          Area
        </Button>
        <Button
          size="sm"
          variant={view === "bar" ? "default" : "ghost"}
          className="rounded-full px-4"
          onClick={() => setView("bar")}
        >
          Bar
        </Button>
      </div>
    </>
  );

  return (
    <SectionCard
      title="توزيع النشاطات حسب النوع"
      description="تجميع شهري/سنوي لكل نوع"
      headerRight={viewToggle}
    >
      {timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 md:gap-3 py-4 md:py-6 text-center">
          <div className="rounded-full bg-slate-100 p-2.5 md:p-4 text-slate-500">
            <Inbox className="h-5 w-5 md:h-8 md:w-8" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium text-slate-700">لا توجد بيانات نشاط للفترة المحددة.</p>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">أضف مؤتمرات أو ورش عمل لتظهر البيانات هنا.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <Button asChild size="sm" className="h-8 text-[10px] md:text-sm md:h-9">
              <Link href="/researcher/activities/conferences">إضافة مؤتمر</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-[10px] md:text-sm md:h-9">
              <Link href="/researcher/activities/workshops">إضافة ورشة</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          <div className="h-[168px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={140}>
              {view === "area" ? (
                <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={28} />
                  <Area type="monotone" dataKey="research" stackId="1" stroke="#2563EB" fill="#93c5fd" name="البحوث" />
                  <Area type="monotone" dataKey="conference" stackId="1" stroke="#10b981" fill="#6ee7b7" name="المؤتمرات" />
                  <Area type="monotone" dataKey="workshop" stackId="1" stroke="#f59e0b" fill="#fde68a" name="الورش" />
                  <Area type="monotone" dataKey="committee" stackId="1" stroke="#8b5cf6" fill="#c4b5fd" name="اللجان" />
                </AreaChart>
              ) : (
                <BarChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={28} />
                  <Bar dataKey="research" stackId="1" fill="#93c5fd" name="البحوث" />
                  <Bar dataKey="conference" stackId="1" fill="#6ee7b7" name="المؤتمرات" />
                  <Bar dataKey="workshop" stackId="1" fill="#fde68a" name="الورش" />
                  <Bar dataKey="committee" stackId="1" fill="#c4b5fd" name="اللجان" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          {summary ? <p className="text-[10px] md:text-sm text-slate-600 line-clamp-2 md:line-clamp-none">{summary}</p> : null}
        </div>
      )}
    </SectionCard>
  );
}
