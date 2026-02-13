"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const levelColors: Record<string, string> = {
  BEGINNER: "bg-blue-100 text-blue-700 border-blue-200", // أزرق (أساسي)
  INTERMEDIATE: "bg-orange-100 text-orange-700 border-orange-200", // برتقالي (متوسط)
  ADVANCED: "bg-green-100 text-green-700 border-green-200", // أخضر (إيجابي/مستوى)
  NATIVE: "bg-green-100 text-green-700 border-green-200", // أخضر (أعلى مستوى)
};

export function LanguagesDisplayCard({ languages }: LanguagesDisplayCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Languages className="h-5 w-5 text-blue-600" />
          اللغات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {languages.map((language) => (
              <div
                key={language.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-sm"
              >
                <span className="font-medium text-gray-900">{language.name}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${levelColors[language.level] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                >
                  {levelLabels[language.level] || language.level}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">لا توجد لغات مضافة</p>
        )}
      </CardContent>
    </Card>
  );
}
