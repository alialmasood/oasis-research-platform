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
    <Card className="border-slate-100 bg-white shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">الشارات المكتسبة</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {badges.length === 0 ? (
          <div className="h-full min-h-[140px] flex items-center justify-center text-sm text-slate-500 text-center px-4">
            أضف المزيد من الإنجازات لتحصل على شارات جديدة.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {badges.map((badge) => (
              <li
                key={badge.code}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-base"
                  aria-hidden
                >
                  {badgeIcons[badge.code] ?? "🏅"}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">{badge.label}</p>
                  {badge.description ? (
                    <p className="text-xs text-slate-500 leading-snug">{badge.description}</p>
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
