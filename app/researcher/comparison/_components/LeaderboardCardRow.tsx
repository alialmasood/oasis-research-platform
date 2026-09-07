"use client";

import Image from "next/image";
import { useState } from "react";
import type { ComparisonFaculty } from "@/lib/comparisonRepo";

type LeaderboardCardRowProps = {
  entry: ComparisonFaculty;
  rank: number;
  isCurrentUser?: boolean;
  /** compact = بطاقة شبكة متناسقة مع أعلى 3 */
  variant?: "row" | "compact";
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
}

function FacultyAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const box = size === "sm" ? "h-10 w-10" : "h-12 w-12";

  if (showImage && src) {
    return (
      <div className={`relative ${box} rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={size === "sm" ? "40px" : "48px"}
          unoptimized={src.startsWith("/avatars/") || src.startsWith("/api/avatar/")}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${box} rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold border border-slate-200 shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

export function LeaderboardCardRow({
  entry,
  rank,
  isCurrentUser,
  variant = "row",
}: LeaderboardCardRowProps) {
  if (variant === "compact") {
    return (
      <div
        className={`rounded-xl border px-3 py-3 flex flex-col gap-2.5 h-full ${
          isCurrentUser ? "border-blue-200 bg-blue-50/60" : "border-slate-100 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} size="sm" />
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-700">
            #{rank}
          </span>
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
          </p>
          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
            {[entry.collegeName, entry.departmentName, entry.specificSpecialization || null]
              .filter(Boolean)
              .join(" — ")}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">النقاط</span>
          <span className="text-sm font-bold tabular-nums text-slate-900">{entry.totalPoints}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        isCurrentUser ? "border-blue-200 bg-blue-50/70" : "border-slate-100 bg-white"
      }`}
    >
      <div className="min-w-[200px] flex-1">
        <div className="flex items-start justify-between gap-3 w-full" dir="rtl">
          <div className="flex items-center gap-3">
            <FacultyAvatar name={entry.fullName} src={entry.avatarUrl} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">#{rank}</span>
                <p className="text-sm font-semibold text-slate-900">
                  {[entry.academicTitle, entry.fullName].filter(Boolean).join(" ")}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {[entry.collegeName, entry.departmentName, entry.specificSpecialization || null]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            النقاط: {entry.totalPoints}
          </span>
        </div>
      </div>
    </div>
  );
}
