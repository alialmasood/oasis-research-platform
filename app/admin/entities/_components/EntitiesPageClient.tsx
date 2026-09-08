"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronDown,
  GitBranch,
  Network,
  School,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

export type EntityGroupView = {
  name: string;
  departments: string[];
  branches: string[];
};

export type EntitiesPageData = {
  structure: {
    colleges: number;
    centers: number;
    departments: number;
    branches: number;
  };
  colleges: EntityGroupView[];
  centers: EntityGroupView[];
  others: string[];
};

function formatCount(value: number) {
  return value.toLocaleString("ar-IQ");
}

function EntitiesPageHeader() {
  return (
    <header className="space-y-2">
      <nav aria-label="مسار التنقل" className="text-[12px] text-slate-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>البيانات الأكاديمية</li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="text-slate-500">التشكيلات</li>
        </ol>
      </nav>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-x-3 sm:gap-y-0">
        <h1 className="shrink-0 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          التشكيلات
        </h1>
        <p className="max-w-3xl text-[13px] leading-relaxed text-slate-500 md:text-sm">
          إدارة الهيكل التنظيمي للكليات والمراكز والتشكيلات التابعة لجامعة البصرة
        </p>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-[80px] items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#2563EB]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight text-slate-900">
          {formatCount(value)}
        </p>
        <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

type OrgKind = "college" | "center";

const ORG_COPY: Record<
  OrgKind,
  {
    kindLabel: string;
    departmentsTitle: string;
    emptyMessage: string;
    closeAriaLabel: string;
    detailsId: string;
  }
> = {
  college: {
    kindLabel: "كلية أكاديمية",
    departmentsTitle: "الأقسام الأكاديمية",
    emptyMessage: "لا توجد أقسام أو فروع مسجلة لهذه الكلية.",
    closeAriaLabel: "إغلاق تفاصيل الكلية",
    detailsId: "college-detail-section",
  },
  center: {
    kindLabel: "مركز جامعي",
    departmentsTitle: "الأقسام",
    emptyMessage: "لا توجد وحدات تنظيمية فرعية مسجلة لهذا المركز.",
    closeAriaLabel: "إغلاق تفاصيل المركز",
    detailsId: "center-detail-section",
  },
};

function OrganizationalRow({
  group,
  open,
  onToggle,
  kind,
  detailsId,
}: {
  group: EntityGroupView;
  open: boolean;
  onToggle: () => void;
  kind: OrgKind;
  detailsId?: string;
}) {
  const deptCount = group.departments.length;
  const branchCount = group.branches.length;
  const copy = ORG_COPY[kind];

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white transition-colors",
        open
          ? "border-[#2563EB]/30 bg-[#2563EB]/[0.02] ring-1 ring-[#2563EB]/10"
          : "hover:border-[#2563EB]/20 hover:bg-slate-50/50"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open && detailsId ? detailsId : undefined}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-right",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-offset-1"
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900 sm:text-[15px]">
              {group.name}
            </p>
            <p className="shrink-0 text-xs tabular-nums text-slate-500 sm:pt-0.5">
              {formatCount(deptCount)} أقسام · {formatCount(branchCount)} فروع
            </p>
          </div>
          <p className="text-xs text-slate-500">{copy.kindLabel}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-[#2563EB]"
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

function UnitListItem({
  name,
  icon: Icon,
}: {
  name: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <p className="min-w-0 text-sm leading-snug text-slate-800">{name}</p>
    </div>
  );
}

function EntityDetailSection({
  entity,
  kind,
  onClose,
  detailsId,
}: {
  entity: EntityGroupView;
  kind: OrgKind;
  onClose: () => void;
  detailsId: string;
}) {
  const copy = ORG_COPY[kind];
  const deptCount = entity.departments.length;
  const branchCount = entity.branches.length;
  const isEmpty = deptCount === 0 && branchCount === 0;

  return (
    <section
      id={detailsId}
      className="mt-4 rounded-xl border border-slate-200 bg-slate-50/40"
      aria-label={`تفاصيل ${entity.name}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <h3 className="text-[15px] font-semibold text-slate-900">{entity.name}</h3>
            <p className="text-xs tabular-nums text-slate-500">
              {formatCount(deptCount)} أقسام · {formatCount(branchCount)} فروع
            </p>
          </div>
          <p className="text-xs text-slate-500">{copy.kindLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.closeAriaLabel}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400",
            "hover:bg-white hover:text-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          )}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5">
        {isEmpty ? (
          <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <p>{copy.emptyMessage}</p>
          </div>
        ) : (
          <>
            {deptCount > 0 ? (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold tracking-wide text-slate-600">
                  {copy.departmentsTitle}
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {entity.departments.map((dept) => (
                    <UnitListItem key={dept} name={dept} icon={Network} />
                  ))}
                </div>
              </div>
            ) : null}

            {deptCount > 0 && branchCount > 0 ? (
              <div className="border-t border-slate-200/80" aria-hidden />
            ) : null}

            {branchCount > 0 ? (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold tracking-wide text-slate-600">
                  الفروع
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {entity.branches.map((branch) => (
                    <UnitListItem key={branch} name={branch} icon={GitBranch} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function EntityPanel({
  groups,
  emptyLabel,
  variant,
}: {
  groups: EntityGroupView[];
  emptyLabel: string;
  variant: OrgKind;
}) {
  const [query, setQuery] = useState("");
  const [openName, setOpenName] = useState<string | null>(null);
  const copy = ORG_COPY[variant];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return groups;
    return groups.filter((group) => {
      const hay = [group.name, ...group.departments, ...group.branches].join(" ");
      return hay.includes(q);
    });
  }, [groups, query]);

  const selectedEntity = useMemo(() => {
    if (!openName) return null;
    return filtered.find((group) => group.name === openName) ?? null;
  }, [filtered, openName]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الكلية أو المركز أو القسم أو الفرع..."
          className="h-11 rounded-xl border-slate-200 bg-white pr-9 text-sm shadow-none focus-visible:ring-[#2563EB]/25"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        {formatCount(filtered.length)}{" "}
        {filtered.length === 1 ? "نتيجة" : "نتائج"}
        {query.trim() ? ` من أصل ${formatCount(groups.length)}` : ""}
        {" — "}اضغط على التشكيل لعرض الأقسام والفروع
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filtered.map((group) => {
              const open = openName === group.name;
              return (
                <OrganizationalRow
                  key={group.name}
                  group={group}
                  open={open}
                  kind={variant}
                  detailsId={open ? copy.detailsId : undefined}
                  onToggle={() =>
                    setOpenName((current) => (current === group.name ? null : group.name))
                  }
                />
              );
            })}
          </div>

          {selectedEntity ? (
            <EntityDetailSection
              entity={selectedEntity}
              kind={variant}
              detailsId={copy.detailsId}
              onClose={() => setOpenName(null)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export function EntitiesPageClient({ data }: { data: EntitiesPageData }) {
  const { structure, colleges, centers, others } = data;

  return (
    <div className="space-y-4">
      <EntitiesPageHeader />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          label="الكليات"
          value={structure.colleges}
          hint="تبدأ باسم كلية"
          icon={School}
        />
        <StatCard
          label="المراكز"
          value={structure.centers}
          hint="تبدأ باسم مركز"
          icon={Building2}
        />
        <StatCard
          label="الأقسام"
          value={structure.departments}
          hint="تحت الكليات والمراكز"
          icon={Network}
        />
        <StatCard
          label="الفروع"
          value={structure.branches}
          hint="تحت الكليات والمراكز"
          icon={GitBranch}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-semibold text-slate-900">دليل التشكيلات</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
            استعرض الهيكل التنظيمي والوحدات التابعة
          </p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-4">
          <Tabs defaultValue="colleges" className="gap-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              <TabsTrigger
                value="colleges"
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-medium text-slate-500 shadow-none sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#2563EB]",
                  "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
                  "hover:text-slate-700"
                )}
              >
                الكليات ({formatCount(colleges.length)})
              </TabsTrigger>
              <TabsTrigger
                value="centers"
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-medium text-slate-500 shadow-none sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#2563EB]",
                  "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
                  "hover:text-slate-700"
                )}
              >
                المراكز ({formatCount(centers.length)})
              </TabsTrigger>
              <TabsTrigger
                value="others"
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-medium text-slate-500 shadow-none sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#2563EB]",
                  "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
                  "hover:text-slate-700"
                )}
              >
                أخرى ({formatCount(others.length)})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colleges" className="mt-0 outline-none">
              <EntityPanel
                groups={colleges}
                emptyLabel="لا توجد كليات مطابقة للبحث."
                variant="college"
              />
            </TabsContent>

            <TabsContent value="centers" className="mt-0 outline-none">
              <EntityPanel
                groups={centers}
                emptyLabel="لا توجد مراكز مطابقة للبحث."
                variant="center"
              />
            </TabsContent>

            <TabsContent value="others" className="mt-0 outline-none">
              {others.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                  لا توجد تشكيلات أخرى.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {others.map((name) => (
                    <div
                      key={name}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3 text-sm font-medium text-slate-800"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
