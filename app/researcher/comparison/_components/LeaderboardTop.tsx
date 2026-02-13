import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonFaculty } from "@/lib/comparisonRepo";

type LeaderboardTopProps = {
  entries: ComparisonFaculty[];
};

const medals = ["🥇", "🥈", "🥉"];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
}

export function LeaderboardTop({ entries }: LeaderboardTopProps) {
  const visible = entries.filter((entry) => entry.totalPoints > 0).slice(0, 3);
  const ordered = visible.length === 3 ? [visible[1], visible[0], visible[2]] : visible;

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">أعلى 3 في الجامعة</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-500">لا توجد بيانات كافية للترتيب حالياً.</div>
        ) : (
          ordered.map((entry, index) => (
            <div
              key={entry.id}
              className={`rounded-2xl border px-4 py-4 flex flex-col gap-3 ${
                index === 1 ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white"
              } ${index === 1 ? "md:scale-105" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-semibold">
                  {getInitials(entry.fullName)}
                </div>
                <div className="text-lg">{medals[index === 1 ? 0 : index === 0 ? 1 : 2] ?? "⭐"}</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{entry.fullName}</p>
                <p className="text-xs text-slate-500">{entry.collegeName}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{entry.departmentName}</span>
                <span className="text-sm font-semibold text-slate-900">{entry.totalPoints}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
