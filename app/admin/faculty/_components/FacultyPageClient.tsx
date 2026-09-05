"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { FacultyStatsCards } from "./FacultyStatsCards";
import { FacultyTable } from "./FacultyTable";
import { DEGREE_LABELS, type FacultyPageData } from "@/lib/admin/facultyTypes";
import { buildFacultyListUrl } from "@/lib/admin/facultyListUrl";
import { Card, CardContent } from "@/components/ui/card";

interface FacultyPageClientProps {
  data: FacultyPageData;
}

const ALL = "__all__";

export function FacultyPageClient({ data }: FacultyPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(data.filters.search);

  useEffect(() => {
    setSearchInput(data.filters.search);
  }, [data.filters.search]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === data.filters.search.trim()) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(
          buildFacultyListUrl({
            ...data.filters,
            search: trimmed,
            page: 1,
          })
        );
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, data.filters, router]);

  const navigate = (patch: Partial<typeof data.filters> & { page?: number }) => {
    startTransition(() => {
      router.push(buildFacultyListUrl({ ...data.filters, ...patch }));
    });
  };

  const hasActiveFilters =
    data.filters.search.trim() !== "" ||
    !!data.filters.entity ||
    !!data.filters.department ||
    !!data.filters.degree ||
    (data.filters.completion !== "all" && !!data.filters.completion);

  const resetFilters = () => {
    setSearchInput("");
    startTransition(() => router.push("/admin/faculty"));
  };

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 pointer-events-none" : ""}`}>
      <AdminPageHeader title="التدريسيون" description="سجل رسمي لأعضاء هيئة التدريس" />

      <FacultyStatsCards stats={data.stats} />

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="py-3 px-4">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0 text-slate-700 pl-1">
              <Filter className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
                البحث والتصفية
              </span>
            </div>

            <div className="relative flex-[2] min-w-[160px] max-w-[240px]">
              <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="بحث..."
                className="h-9 pr-9 text-sm border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/20"
              />
            </div>

            <div className="min-w-[120px] flex-1 max-w-[150px]">
              <Select
                value={data.filters.entity || ALL}
                onValueChange={(value) =>
                  navigate({
                    entity: value === ALL ? "" : value,
                    department: "",
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                  <SelectValue placeholder="التشكيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل التشكيلات</SelectItem>
                  {data.entities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[110px] flex-1 max-w-[140px]">
              <Select
                value={data.filters.department || ALL}
                onValueChange={(value) =>
                  navigate({ department: value === ALL ? "" : value, page: 1 })
                }
              >
                <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                  <SelectValue placeholder="القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل الأقسام</SelectItem>
                  {data.departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[110px] flex-1 max-w-[130px]">
              <Select
                value={data.filters.degree || ALL}
                onValueChange={(value) =>
                  navigate({ degree: value === ALL ? "" : value, page: 1 })
                }
              >
                <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                  <SelectValue placeholder="أعلى شهادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>كل الشهادات</SelectItem>
                  {Object.entries(DEGREE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[110px] flex-1 max-w-[130px]">
              <Select
                value={data.filters.completion || "all"}
                onValueChange={(value) => navigate({ completion: value, page: 1 })}
              >
                <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                  <SelectValue placeholder="اكتمال الملف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="complete">مكتمل 100%</SelectItem>
                  <SelectItem value="incomplete">غير مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 shrink-0 text-slate-500 hover:text-slate-800 px-2"
              >
                <X className="h-4 w-4 ml-1" />
                <span className="whitespace-nowrap">مسح</span>
              </Button>
            )}

            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {data.pagination.totalCount.toLocaleString("ar-IQ")} نتيجة
            </span>
          </div>
        </CardContent>
      </Card>

      <FacultyTable
        faculty={data.faculty}
        rowOffset={data.pagination.rowOffset}
        pagination={data.pagination}
        filters={data.filters}
      />
    </div>
  );
}
