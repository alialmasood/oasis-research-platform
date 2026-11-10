import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonBadge } from "@/lib/comparisonRepo";

const badgeIcons: Record<string, string> = {
  TOP3_UNI: "🥇",
  TOP10_UNI: "⭐",
  TOP5_COLLEGE: "🏅",
  IMPROVER: "📈",
  SPECIALIST: "🏆",
};

type BadgesPanelProps = {
  badges: ComparisonBadge[];
};

export function BadgesPanel({ badges }: BadgesPanelProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg h-full flex flex-col gap-0 overflow-hidden rounded-xl md:rounded-2xl">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
          الشارات المكتسبة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 md:px-6 pb-3 md:pb-6">
        {badges.length === 0 ? (
          <div className="h-full min-h-[96px] md:min-h-[140px] flex items-center justify-center text-[10px] md:text-sm text-slate-500 text-center px-2 md:px-4">
            أضف المزيد من الإنجازات لتحصل على شارات جديدة.
          </div>
        ) : (
          <ul className="space-y-1.5 md:space-y-2.5">
            {badges.map((badge) => (
              <li
                key={badge.code}
                className="flex items-start gap-2 md:gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 md:px-3 md:py-2.5 min-h-[56px] md:min-h-0"
              >
                <span
                  className="inline-flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-sm md:text-base"
                  aria-hidden
                >
                  {badgeIcons[badge.code] ?? "🏅"}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[11px] md:text-sm font-semibold text-slate-900 leading-snug">
                    {badge.label}
                  </p>
                  {badge.description ? (
                    <p className="text-[10px] md:text-xs text-slate-500 leading-snug line-clamp-2 md:line-clamp-none">
                      {badge.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
