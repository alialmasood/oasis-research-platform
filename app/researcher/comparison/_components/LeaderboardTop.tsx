"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonFaculty } from "@/lib/comparisonRepo";

type LeaderboardTopProps = {
  entries: ComparisonFaculty[];
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
      <div className="relative h-14 w-14 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="56px"
          unoptimized={src.startsWith("/avatars/") || src.startsWith("/api/avatar/")}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="h-14 w-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-semibold border border-slate-200 shrink-0">
      {getInitials(name)}
    </div>
  );
}

export function LeaderboardTop({ entries }: LeaderboardTopProps) {
  const visible = entries.filter((entry) => entry.totalPoints > 0).slice(0, 3);
  // ترتيب العرض: الثاني، الأول، الثالث (الأول في المنتصف)
  const ordered = visible.length === 3 ? [visible[1], visible[0], visible[2]] : visible;

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          أعلى 3 تدريسيين في الجامعة
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-500">لا توجد بيانات كافية للترتيب حالياً.</div>
        ) : (
          ordered.map((entry, index) => {
            const medalIndex = index === 1 ? 0 : index === 0 ? 1 : 2;
            return (
              <div
                key={entry.id}
                className={`rounded-2xl border px-4 py-4 flex flex-col gap-3 ${
                  index === 1 ? "border-amber-200 bg-amber-50 md:scale-105" : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} />
                  <div className="text-lg" aria-hidden>
                    {medals[medalIndex] ?? "⭐"}
                  </div>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-xs text-slate-500 leading-snug">
                    {[
                      entry.collegeName,
                      entry.departmentName,
                      entry.specificSpecialization || null,
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                </div>
                <div className="mt-auto pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">النقاط</span>
                  <span className="text-base font-bold tabular-nums text-slate-900">{entry.totalPoints}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
