"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ComparisonFaculty } from "@/lib/comparisonRepo";

type CollegeDepartmentLeadersProps = {
  collegeEntries: ComparisonFaculty[];
  departmentEntries: ComparisonFaculty[];
  collegeName: string;
  departmentName: string;
  collegeRank: number;
  departmentRank: number;
  currentUserId: string;
  moreHref: { pathname: string; query: Record<string, string> };
};

const medals = ["🥇", "🥈", "🥉"];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
}

function FacultyAvatar({ name, src }: { name: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (showImage && src) {
    return (
      <div className="relative h-12 w-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized={src.startsWith("/avatars/") || src.startsWith("/api/avatar/")}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold border border-slate-200 shrink-0">
      {getInitials(name)}
    </div>
  );
}

function TopThreePanel({
  title,
  scopeLabel,
  myRank,
  entries,
  currentUserId,
  accent,
}: {
  title: string;
  scopeLabel: string;
  myRank: number;
  entries: ComparisonFaculty[];
  currentUserId: string;
  accent: "blue" | "violet";
}) {
  const accentClasses =
    accent === "blue"
      ? {
          panel: "border-blue-100 bg-blue-50/40",
          chip: "bg-blue-100 text-blue-800 border-blue-200",
          first: "border-blue-200 bg-white",
        }
      : {
          panel: "border-violet-100 bg-violet-50/40",
          chip: "bg-violet-100 text-violet-800 border-violet-200",
          first: "border-violet-200 bg-white",
        };

  const gridClass =
    entries.length <= 1
      ? "grid gap-2.5 grid-cols-1"
      : entries.length === 2
        ? "grid gap-2.5 sm:grid-cols-2"
        : "grid gap-2.5 sm:grid-cols-3";

  return (
    <div className={`rounded-2xl border p-4 h-full flex flex-col gap-3 ${accentClasses.panel}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 truncate">{scopeLabel || "—"}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shrink-0 ${accentClasses.chip}`}
        >
          ترتيبك: #{myRank}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 min-h-[140px] flex items-center justify-center text-sm text-slate-500 text-center px-2">
          لا توجد بيانات كافية لهذا الترتيب.
        </div>
      ) : (
        <>
          <div className={`${gridClass} flex-1`}>
            {entries.map((entry, index) => {
              const isCurrent = entry.id === currentUserId;
              const isFirst = index === 0;
              const single = entries.length === 1;

              if (single) {
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl border px-4 py-3.5 flex items-center gap-3 ${
                      isCurrent
                        ? "border-slate-900/20 bg-white ring-1 ring-slate-900/10"
                        : accentClasses.first
                    }`}
                  >
                    <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base leading-none" aria-hidden>
                          {medals[0]}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
                          {isCurrent ? (
                            <span className="mr-1 text-[11px] font-medium text-slate-500">(أنت)</span>
                          ) : null}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {[entry.departmentName, entry.specificSpecialization || null]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-[11px] text-slate-500">النقاط</p>
                      <p className="text-base font-bold tabular-nums text-slate-900">{entry.totalPoints}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3 py-3 flex flex-col gap-2.5 h-full ${
                    isCurrent
                      ? "border-slate-900/20 bg-white ring-1 ring-slate-900/10"
                      : isFirst
                        ? accentClasses.first
                        : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} />
                    <span className="text-base leading-none" aria-hidden>
                      {medals[index] ?? `#${index + 1}`}
                    </span>
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                      {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
                      {isCurrent ? (
                        <span className="mr-1 text-[11px] font-medium text-slate-500">(أنت)</span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {[entry.departmentName, entry.specificSpecialization || null]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">النقاط</span>
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {entry.totalPoints}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {entries.length < 3 ? (
            <p className="text-[11px] text-slate-500 text-center">
              يظهر حالياً {entries.length === 1 ? "تدريسي واحد فقط" : "تدريسيان فقط"} ضمن هذا المستوى.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function CollegeDepartmentLeaders({
  collegeEntries,
  departmentEntries,
  collegeName,
  departmentName,
  collegeRank,
  departmentRank,
  currentUserId,
  moreHref,
}: CollegeDepartmentLeadersProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-semibold text-slate-900">
            الأفضل في الكلية والقسم
          </CardTitle>
          <p className="text-xs text-slate-500">
            أعلى 3 تدريسيين ضمن كليتك وقسمك — مع ترتيبك الحالي في كل مستوى.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 rounded-lg shrink-0">
          <Link href={moreHref}>عرض المزيد</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <TopThreePanel
            title="أفضل 3 في الكلية"
            scopeLabel={collegeName}
            myRank={collegeRank}
            entries={collegeEntries}
            currentUserId={currentUserId}
            accent="blue"
          />
          <TopThreePanel
            title="أفضل 3 في القسم"
            scopeLabel={departmentName}
            myRank={departmentRank}
            entries={departmentEntries}
            currentUserId={currentUserId}
            accent="violet"
          />
        </div>
      </CardContent>
    </Card>
  );
}
