"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TargetItem {
  id: string;
  label: string;
  current: number;
  goal: number;
}

interface AnnualProgressCardProps {
  year: string;
  progress: number;
  targets: TargetItem[];
  onTargetsUpdate?: (targets: TargetItem[]) => void;
}

export function AnnualProgressCard({
  year,
  progress,
  targets: initialTargets,
  onTargetsUpdate,
}: AnnualProgressCardProps) {
  const [targets, setTargets] = useState<TargetItem[]>(initialTargets);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargets, setEditTargets] = useState<TargetItem[]>(initialTargets);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTargets(initialTargets);
    if (!isEditOpen) {
      setEditTargets(initialTargets);
    }
  }, [initialTargets, isEditOpen]);

  const displayTargets = useMemo(
    () =>
      targets
        .filter((t) => t.goal > 0)
        .sort((a, b) => b.goal - a.goal)
        .slice(0, 6),
    [targets]
  );

  const payloadFromTargets = (items: TargetItem[]) =>
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = Math.max(0, item.goal || 0);
      return acc;
    }, {});

  const handleOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (open) {
      setEditTargets(targets.map((t) => ({ ...t })));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/researcher/dashboard/annual-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year, 10),
          goals: payloadFromTargets(editTargets),
        }),
      });
      if (!response.ok) {
        return;
      }
      setTargets(editTargets);
      onTargetsUpdate?.(editTargets);
      setIsEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalChange = (id: string, value: number) => {
    setEditTargets((prev) =>
      prev.map((target) =>
        target.id === id ? { ...target, goal: Math.max(0, value) } : target
      )
    );
  };

  return (
    <Card className="border-0 md:border md:border-slate-100 bg-transparent md:bg-white shadow-none md:shadow-lg overflow-hidden rounded-none md:rounded-xl">
      <CardHeader className="p-0 md:p-6 pb-2.5 md:pb-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm md:text-lg font-semibold text-gray-900 flex items-center gap-2 min-w-0">
            <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600 shrink-0" />
            <span className="truncate">التقدم السنوي {year}</span>
          </CardTitle>
          <Dialog open={isEditOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 md:px-3 text-[11px] md:text-xs text-slate-600 hover:text-slate-900 shrink-0"
              >
                <Edit className="h-3.5 w-3.5 ml-1" />
                <span className="md:hidden">تعديل</span>
                <span className="hidden md:inline">تعديل الأهداف</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[520px] max-h-[85vh] flex flex-col p-4 md:p-6">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">تعديل الأهداف السنوية</DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  حدّد هدف كل فئة للعام {year}. المنجز يُحسب تلقائياً من نشاطاتك ولا يُعدَّل هنا.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2.5 md:space-y-3 overflow-y-auto pr-1 mt-2 flex-1 min-h-0">
                {editTargets.map((target) => (
                  <div
                    key={target.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 md:grid-cols-[1fr_72px_88px] md:gap-2 md:items-end"
                  >
                    <div className="min-w-0">
                      <Label className="text-sm font-medium text-gray-800">{target.label}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:contents">
                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 block">المنجز</Label>
                        <Input
                          type="number"
                          value={target.current}
                          readOnly
                          className="h-9 bg-white text-slate-600"
                          tabIndex={-1}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 block">الهدف</Label>
                        <Input
                          type="number"
                          min={0}
                          value={target.goal}
                          onChange={(e) =>
                            handleGoalChange(target.id, parseInt(e.target.value, 10) || 0)
                          }
                          className="h-9 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-3 shrink-0 md:flex md:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-9"
                  disabled={isSaving}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-0 pt-0 md:p-6 md:pt-0">
        <div className="rounded-xl border border-blue-200/70 bg-gradient-to-l from-blue-50 via-sky-50/80 to-indigo-50/60 p-3 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:bg-none md:p-0 md:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-semibold text-blue-900 md:font-medium md:text-gray-700">
              إنجاز هذا العام
            </span>
            <span className="text-sm md:text-sm font-black text-blue-700 md:font-semibold md:text-blue-600 tabular-nums">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-3 md:h-2.5 bg-blue-100/80 md:bg-primary/20" />
        </div>

        <div className="space-y-2.5 md:space-y-3 pt-1 md:pt-2">
          {displayTargets.length > 0 ? (
            displayTargets.map((target) => {
              const targetProgress =
                target.goal > 0 ? (target.current / target.goal) * 100 : 0;
              return (
                <div key={target.id} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs md:text-sm text-gray-700 truncate min-w-0">
                      {target.label}
                    </span>
                    <span className="text-[11px] md:text-xs font-medium text-slate-600 tabular-nums shrink-0">
                      {target.current} / {target.goal}
                    </span>
                  </div>
                  <Progress value={Math.min(targetProgress, 100)} className="h-1.5 md:h-2" />
                </div>
              );
            })
          ) : (
            <p className="text-xs md:text-sm text-slate-500 text-center py-3 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed px-3">
              لم تُحدد أهداف بعد. اضغط «تعديل الأهداف» لوضع خطتك السنوية.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
