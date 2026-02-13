import { Badge } from "@/components/ui/badge";
import type { ComparisonFaculty } from "@/lib/comparisonRepo";

type LeaderboardCardRowProps = {
  entry: ComparisonFaculty;
  rank: number;
  isCurrentUser?: boolean;
};

export function LeaderboardCardRow({ entry, rank, isCurrentUser }: LeaderboardCardRowProps) {
  const researchCount = entry.researchCount ?? 0;
  const conferencesCount = entry.conferencesCount ?? 0;
  const positionsCount = entry.positionsCount ?? 0;
  const coursesCount = entry.coursesCount ?? 0;
  const seminarsCount = entry.seminarsCount ?? 0;
  const committeesCount = entry.committeesCount ?? 0;
  const volunteeringCount = entry.volunteeringCount ?? 0;
  const fieldVisitsCount = entry.fieldVisitsCount ?? 0;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        isCurrentUser ? "border-blue-200 bg-blue-50/70" : "border-slate-100 bg-white"
      }`}
    >
      <div className="min-w-[200px] flex-1">
        <div className="flex items-start justify-between gap-3 w-full" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-semibold">
              {rank}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{entry.fullName}</p>
              <p className="text-xs text-slate-500">
                {entry.collegeName} — {entry.departmentName} — {entry.academicTitle}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            النقاط: {entry.totalPoints}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          البحوث: {researchCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          المؤتمرات: {conferencesCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          المناصب: {positionsCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          الدورات: {coursesCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          الندوات: {seminarsCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          اللجان: {committeesCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          الأعمال الطوعية: {volunteeringCount}
        </Badge>
        <Badge variant="outline" className="border-slate-200 text-slate-700">
          الزيارات الميدانية: {fieldVisitsCount}
        </Badge>
      </div>
      <div className="text-sm font-semibold text-slate-900" />
    </div>
  );
}
