import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SimilarFacultyEntry } from "@/lib/comparisonRepo";

type SimilarFacultyProps = {
  items: SimilarFacultyEntry[];
};

function activityHighlights(item: SimilarFacultyEntry) {
  return [
    { label: "بحوث", value: item.researchCount },
    { label: "مؤتمرات", value: item.conferencesCount },
    { label: "مناصب", value: item.positionsCount },
    { label: "دورات", value: item.coursesCount },
  ].filter((row) => row.value > 0);
}

export function SimilarFaculty({ items }: SimilarFacultyProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg h-full flex flex-col gap-0 overflow-hidden rounded-xl md:rounded-2xl">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
          باحثون مشابهون
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 md:px-6 pb-3 md:pb-6">
        {items.length === 0 ? (
          <div className="h-full min-h-[96px] md:min-h-[140px] flex items-center justify-center text-[10px] md:text-sm text-slate-500 text-center px-2 md:px-4">
            لا توجد بيانات كافية لتحديد الباحثين المشابهين.
          </div>
        ) : (
          <ul className="space-y-1.5 md:space-y-2.5">
            {items.slice(0, 4).map((item) => {
              const highlights = activityHighlights(item).slice(0, 3);
              return (
                <li
                  key={item.userId}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 md:px-3 md:py-2.5 space-y-1.5 md:space-y-2 min-h-[72px] md:min-h-0"
                >
                  <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] md:text-sm font-semibold text-slate-900 leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 truncate">
                        {item.department}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white border border-slate-200 px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] font-medium text-slate-600 tabular-nums">
                      فرق: {Math.round(item.pointDiff)}
                    </span>
                  </div>
                  {item.sharedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {item.sharedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700 text-[9px] md:text-[11px] font-normal px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {highlights.length > 0 ? (
                    <p className="text-[10px] md:text-[11px] text-slate-500">
                      {highlights.map((row) => `${row.label}: ${row.value}`).join(" · ")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
