"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, BookOpen, Award, Users, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InsightsCardProps {
  suggestions: string[];
  weeklyTasks: Array<{ id: string; task: string; status: "pending" | "in-progress" }>;
}

export function InsightsCard({ suggestions, weeklyTasks }: InsightsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const normalizedSuggestions =
    suggestions.length > 0
      ? suggestions
      : [
          "حافظ على استمرارية النشر والمشاركة في الفعاليات",
          "ركز على البحوث عالية التأثير في مجلات مرموقة",
          "خطط للمشاركة في مؤتمرات دولية قادمة",
        ];

  const tasksToShow = weeklyTasks.length > 0
    ? weeklyTasks
    : [
        { id: "fallback-1", task: "حدد هدفين واقعيين لهذا الأسبوع", status: "pending" },
        { id: "fallback-2", task: "راجع تقدمك في هدف بحث واحد", status: "pending" },
        { id: "fallback-3", task: "خطط لنشاط أكاديمي واحد على الأقل", status: "pending" },
      ];

  return (
    <>
      <Card className="border-slate-100 bg-gradient-to-br from-amber-50/30 via-white to-blue-50/20 shadow-sm">
        <CardHeader className="p-3 md:p-6 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
              اقتراحات لتحسين نقاطك
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0 md:p-6 md:pt-0">
          <div className="space-y-2">
            {normalizedSuggestions.slice(0, 3).map((text, index) => {
              const Icon = index === 0 ? BookOpen : index === 1 ? Award : Users;
              const colors = [
                {
                  icon: "text-blue-600",
                  bg: "bg-blue-50",
                  border: "border-blue-200",
                },
                {
                  icon: "text-green-600",
                  bg: "bg-green-50",
                  border: "border-green-200",
                },
                {
                  icon: "text-purple-600",
                  bg: "bg-purple-50",
                  border: "border-purple-200",
                },
              ];
              const colorClass = colors[index] ?? colors[0];
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 md:p-2.5 rounded-lg border ${colorClass.bg} ${colorClass.border}`}
                >
                  <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${colorClass.icon} mt-0.5 flex-shrink-0`} />
                  <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                </div>
              );
            })}
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs h-8"
              >
                <Calendar className="h-3.5 w-3.5 ml-2" />
                خطة الأسبوع
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  خطة الأسبوع المقترحة
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  مهام مقترحة لتحسين أدائك الأكاديمي
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {tasksToShow.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {task.status === "in-progress" ? (
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-300 border border-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{task.task}</p>
                      <Badge
                        className={`mt-1.5 text-xs ${
                          task.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {task.status === "in-progress" ? "قيد التنفيذ" : "مخطط"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
