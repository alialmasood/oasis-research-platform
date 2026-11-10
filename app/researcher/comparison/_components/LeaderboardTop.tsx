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

function FacultyAvatar({
  name,
  src,
  compact,
}: {
  name: string;
  src?: string | null;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const box = compact ? "h-9 w-9 md:h-14 md:w-14" : "h-14 w-14";

  if (showImage && src) {
    return (
      <div className={`relative ${box} rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={compact ? "36px" : "56px"}
          unoptimized={src.startsWith("/avatars/") || src.startsWith("/api/avatar/")}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${box} rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] md:text-sm font-semibold border border-slate-200 shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

export function LeaderboardTop({ entries }: LeaderboardTopProps) {
  const visible = entries.filter((entry) => entry.totalPoints > 0).slice(0, 3);
  // ترتيب العرض: الثاني، الأول، الثالث (الأول في المنتصف)
  const ordered = visible.length === 3 ? [visible[1], visible[0], visible[2]] : visible;

  return (
    <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl md:rounded-2xl">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
          أعلى 3 تدريسيين في الجامعة
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-1.5 md:gap-3 px-3 md:px-6 pb-3 md:pb-6 md:grid-cols-3">
        {visible.length === 0 ? (
          <div className="col-span-3 text-[10px] md:text-sm text-slate-500">
            لا توجد بيانات كافية للترتيب حالياً.
          </div>
        ) : (
          ordered.map((entry, index) => {
            const medalIndex = index === 1 ? 0 : index === 0 ? 1 : 2;
            return (
              <div
                key={entry.id}
                className={`rounded-xl md:rounded-2xl border px-2 py-2 md:px-4 md:py-4 flex flex-col gap-1.5 md:gap-3 min-h-[96px] md:min-h-0 h-full ${
                  index === 1
                    ? "border-amber-200 bg-amber-50 md:scale-105"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1 md:gap-2">
                  <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} compact />
                  <div className="text-sm md:text-lg" aria-hidden>
                    {medals[medalIndex] ?? "⭐"}
                  </div>
                </div>
                <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
                  <p className="text-[10px] md:text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                    {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
                  </p>
                  <p className="hidden md:block text-xs text-slate-500 leading-snug">
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
                  <span className="text-[9px] md:text-xs text-slate-500">النقاط</span>
                  <span className="text-xs md:text-base font-bold tabular-nums text-slate-900">
                    {entry.totalPoints}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
