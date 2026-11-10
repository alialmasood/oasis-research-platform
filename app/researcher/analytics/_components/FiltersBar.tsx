"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock3, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FiltersBarProps = {
  initialFrom: string;
  initialTo: string;
  initialGranularity: "month" | "year";
  initialCompare: boolean;
  initialCompareFrom?: string;
  initialCompareTo?: string;
};

const inputMobile =
  "h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] text-slate-700";

export function FiltersBar({
  initialFrom,
  initialTo,
  initialGranularity,
  initialCompare,
  initialCompareFrom,
  initialCompareTo,
}: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [granularity, setGranularity] = useState<"month" | "year">(initialGranularity);
  const [compare, setCompare] = useState(initialCompare);
  const [compareFrom, setCompareFrom] = useState(initialCompareFrom ?? "");
  const [compareTo, setCompareTo] = useState(initialCompareTo ?? "");

  const formatDateLabel = (value: string) => {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const resetToDefaults = () => {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), 0, 1);
    const defaultTo = today;
    const toInput = defaultTo.toISOString().slice(0, 10);
    const fromInput = defaultFrom.toISOString().slice(0, 10);

    setFrom(fromInput);
    setTo(toInput);
    setGranularity("month");
    setCompare(false);
    setCompareFrom("");
    setCompareTo("");

    startTransition(() => {
      router.replace(pathname);
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("from", from);
    params.set("to", to);
    params.set("granularity", granularity);
    if (compare) {
      if (compareFrom) params.set("compareFrom", compareFrom);
      if (compareTo) params.set("compareTo", compareTo);
      params.set("compare", "1");
    } else {
      params.delete("compare");
      params.delete("compareFrom");
      params.delete("compareTo");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const compareDisabled = useMemo(() => !compare, [compare]);

  return (
    <>
      {/* فلاتر موبايل: سطر واحد */}
      <div className="md:hidden space-y-1.5">
        <div className="rounded-xl bg-slate-50 p-1.5">
          <div className="flex items-center gap-1 flex-nowrap min-w-0">
            <Input
              type="date"
              aria-label="من"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputMobile}
            />
            <Input
              type="date"
              aria-label="إلى"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputMobile}
            />
            <select
              aria-label="التجميع"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as "month" | "year")}
              className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] text-slate-700"
            >
              <option value="month">شهري</option>
              <option value="year">سنوي</option>
            </select>
            <label className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 shrink-0">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="h-3 w-3"
                aria-label="تفعيل المقارنة"
              />
              <span className="text-[10px] text-slate-700">مقارنة</span>
            </label>
            <Button
              onClick={applyFilters}
              disabled={isPending}
              size="sm"
              className="h-8 px-2 text-[10px] shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              {isPending ? "..." : "تطبيق"}
            </Button>
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={isPending}
              size="sm"
              className="h-8 px-1.5 text-[10px] shrink-0 bg-white"
            >
              إعادة
            </Button>
          </div>
        </div>
        {compare ? (
          <div className="rounded-xl bg-slate-50 p-1.5">
            <div className="flex items-center gap-1 flex-nowrap min-w-0">
              <Input
                type="date"
                aria-label="من (مقارنة)"
                value={compareFrom}
                onChange={(e) => setCompareFrom(e.target.value)}
                disabled={compareDisabled}
                className={`${inputMobile} disabled:bg-slate-50`}
              />
              <Input
                type="date"
                aria-label="إلى (مقارنة)"
                value={compareTo}
                onChange={(e) => setCompareTo(e.target.value)}
                disabled={compareDisabled}
                className={`${inputMobile} disabled:bg-slate-50`}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* سطح المكتب — بدون تغيير */}
      <Card className="hidden md:block border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">فلاتر الفترة</CardTitle>
          <p className="text-xs text-slate-500">حدد المدى الزمني وطريقة التجميع قبل قراءة التحليل.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">من</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">إلى</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">التجميع</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as "month" | "year")}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="month">شهري</option>
                <option value="year">سنوي</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">مقارنة فترة</label>
              <div className="flex h-10 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
                <input
                  id="compare-toggle"
                  type="checkbox"
                  checked={compare}
                  onChange={(e) => setCompare(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="compare-toggle" className="text-sm text-slate-700">
                  تفعيل المقارنة
                </label>
              </div>
            </div>
          </div>

          {compare ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">من (مقارنة)</label>
                <Input
                  type="date"
                  value={compareFrom}
                  onChange={(e) => setCompareFrom(e.target.value)}
                  disabled={compareDisabled}
                  className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">إلى (مقارنة)</label>
                <Input
                  type="date"
                  value={compareTo}
                  onChange={(e) => setCompareTo(e.target.value)}
                  disabled={compareDisabled}
                  className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:bg-slate-50"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <Clock3 className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                من {formatDateLabel(from)} إلى {formatDateLabel(to)} — عرض{" "}
                {granularity === "year" ? "سنوي" : "شهري"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetToDefaults} className="h-10 rounded-xl text-slate-600" disabled={isPending}>
                إعادة تعيين
              </Button>
              <Button onClick={applyFilters} className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isPending}>
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {isPending ? "جاري التحديث..." : "تطبيق الفلاتر"}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
