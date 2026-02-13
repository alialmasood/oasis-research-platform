"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface EvaluationTabProps {
  year: string;
  month: string;
}

const suggestions = [
  {
    id: 1,
    text: "زيادة عدد البحوث المنشورة في مجلات مفهرسة (Scopus/Thomson)",
    priority: "high",
  },
  {
    id: 2,
    text: "المشاركة في مؤتمرات دولية لزيادة النقاط",
    priority: "medium",
  },
  {
    id: 3,
    text: "إكمال البحوث المخططة لتحسين معدل الإنجاز",
    priority: "high",
  },
  {
    id: 4,
    text: "زيادة الأنشطة الأكاديمية مثل الندوات والدورات",
    priority: "medium",
  },
  {
    id: 5,
    text: "تحسين معدل البحوث المشتركة",
    priority: "low",
  },
];

export function EvaluationTab({ year, month }: EvaluationTabProps) {
  const score = 72.5;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-blue-50";
    return "bg-orange-50";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "text-red-600 bg-red-50";
    if (priority === "medium") return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-[#2563EB]" />
            نقاط التقييم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className={`${getScoreBg(score)} rounded-full p-8 mb-4 relative`}
            >
              <div className={`text-6xl font-black ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                / 100
              </div>
            </div>
            <p className="text-sm text-slate-600 text-center max-w-md">
              تقييمك الحالي جيد جداً. يمكنك تحسين النقاط من خلال إكمال البحوث المخططة
              والمشاركة في المزيد من الأنشطة الأكاديمية.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>زيادة +5.2 نقطة عن الفترة السابقة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            ما ينقصني؟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {suggestion.priority === "high" ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {suggestion.text}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                      suggestion.priority
                    )}`}
                  >
                    {suggestion.priority === "high"
                      ? "أولوية عالية"
                      : suggestion.priority === "medium"
                      ? "أولوية متوسطة"
                      : "أولوية منخفضة"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6"
        >
          عرض تفاصيل التقييم
          <ArrowRight className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </div>
  );
}
