"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages } from "lucide-react";
import type { Language } from "@prisma/client";

interface LanguagesDisplayCardProps {
  languages: Language[];
}

const levelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  NATIVE: "طليق",
};

const levelRank: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  NATIVE: 4,
};

const levelBarClass: Record<string, string> = {
  BEGINNER: "bg-blue-500",
  INTERMEDIATE: "bg-amber-500",
  ADVANCED: "bg-emerald-500",
  NATIVE: "bg-emerald-600",
};

const levelChipClass: Record<string, string> = {
  BEGINNER: "bg-blue-50 text-blue-700 border-blue-100",
  INTERMEDIATE: "bg-amber-50 text-amber-800 border-amber-100",
  ADVANCED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  NATIVE: "bg-emerald-50 text-emerald-800 border-emerald-100",
};

function languageCountLabel(count: number): string {
  if (count === 0) return "لا توجد لغات";
  if (count === 1) return "لغة واحدة";
  if (count === 2) return "لغتان";
  if (count >= 3 && count <= 10) return `${count} لغات`;
  return `${count} لغة`;
}

export function LanguagesDisplayCard({ languages }: LanguagesDisplayCardProps) {
  return (
    <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm h-full flex flex-col gap-0 overflow-hidden">
      <CardHeader className="p-3 md:p-6 pb-2.5 md:pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <CardTitle className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <Languages className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
            </span>
            <span className="truncate">اللغات</span>
          </CardTitle>
          {languages.length > 0 && (
            <span className="text-[10px] md:text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 md:px-2.5 py-0.5 md:py-1 shrink-0">
              {languageCountLabel(languages.length)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-3 md:pt-4 flex-1 flex flex-col">
        {languages.length > 0 ? (
          <>
            <ul className="space-y-2 md:space-y-2.5 flex-1">
              {languages.map((language) => {
                const rank = levelRank[language.level] ?? 1;
                const percent = (rank / 4) * 100;
                const label = levelLabels[language.level] || language.level;
                return (
                  <li
                    key={language.id}
                    className="rounded-lg md:rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2 md:px-3.5 md:py-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-2.5">
                      <span className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                        {language.name}
                      </span>
                      <span
                        className={`text-[10px] md:text-[11px] font-medium border rounded-full px-1.5 md:px-2 py-0.5 shrink-0 ${
                          levelChipClass[language.level] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          levelBarClass[language.level] || "bg-slate-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-slate-100">
              <p className="text-[10px] md:text-[11px] text-slate-400 mb-1.5 md:mb-2">
                مقياس الإتقان
              </p>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-1 md:gap-1.5">
                {(
                  [
                    ["BEGINNER", "مبتدئ"],
                    ["INTERMEDIATE", "متوسط"],
                    ["ADVANCED", "متقدم"],
                    ["NATIVE", "طليق"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-[11px] text-slate-500"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${levelBarClass[key]}`} />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4 md:py-6">لا توجد لغات مضافة</p>
        )}
      </CardContent>
    </Card>
  );
}
