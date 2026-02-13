import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-slate-100 bg-white shadow-lg h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">الشارات المكتسبة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {badges.length === 0 ? (
          <div className="text-sm text-slate-500">أضف المزيد من الإنجازات لتحصل على شارات جديدة.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge.code}
                  variant="secondary"
                  title={badge.description ?? badge.label}
                  className="rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {badgeIcons[badge.code] ?? "🏅"} {badge.label}
                </Badge>
              ))}
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              {badges.map((badge) =>
                badge.description ? (
                  <p key={`${badge.code}-desc`}>• {badge.description}</p>
                ) : null
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
