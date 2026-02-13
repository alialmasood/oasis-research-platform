import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SimilarFacultyEntry } from "@/lib/comparisonRepo";

type SimilarFacultyProps = {
  items: SimilarFacultyEntry[];
};

export function SimilarFaculty({ items }: SimilarFacultyProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-lg h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">باحثون مشابهون</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">لا توجد بيانات كافية لتحديد الباحثين المشابهين.</div>
        ) : (
          items.map((item) => (
            <div key={item.userId} className="rounded-lg border border-slate-100 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.department}</p>
                </div>
                <div className="text-xs text-slate-500">فرق النقاط: {Math.round(item.pointDiff)}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.sharedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-slate-200 text-slate-700">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  البحوث: {item.researchCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  المؤتمرات: {item.conferencesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  المناصب: {item.positionsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الدورات: {item.coursesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الندوات: {item.seminarsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  اللجان: {item.committeesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الأعمال الطوعية: {item.volunteeringCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الزيارات الميدانية: {item.fieldVisitsCount}
                </Badge>
              </div>
              {item.sharedTags.length > 0 ? (
                <p className="text-xs text-slate-500 mt-2">
                  سبب التشابه: {item.sharedTags.join(" + ")}
                </p>
              ) : null}
              <Button variant="outline" size="sm" className="mt-3 h-8 rounded-lg">
                عرض الفروق
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
