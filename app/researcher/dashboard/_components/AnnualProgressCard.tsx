"use client";

import { useState } from "react";
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

  const payloadFromTargets = (items: TargetItem[]) =>
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.goal;
      return acc;
    }, {});

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

  const handleTargetChange = (id: string, field: "current" | "goal", value: number) => {
    setEditTargets((prev) =>
      prev.map((target) => (target.id === id ? { ...target, [field]: value } : target))
    );
  };

  return (
    <>
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="p-3 md:p-6 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              التقدم السنوي {year}
            </CardTitle>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900"
                >
                  <Edit className="h-3.5 w-3.5 ml-1.5" />
                  تعديل الأهداف
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>تعديل الأهداف السنوية</DialogTitle>
                  <DialogDescription>قم بتحديث أهدافك للعام {year}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                  {editTargets.map((target) => (
                    <div key={target.id} className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{target.label}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">المنجز</Label>
                          <Input
                            type="number"
                            value={target.current}
                            onChange={(e) =>
                              handleTargetChange(target.id, "current", parseInt(e.target.value) || 0)
                            }
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">الهدف</Label>
                          <Input
                            type="number"
                            value={target.goal}
                            onChange={(e) =>
                              handleTargetChange(target.id, "goal", parseInt(e.target.value) || 0)
                            }
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditOpen(false)}
                      className="h-9"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="h-9 bg-blue-600 hover:bg-blue-700"
                      disabled={isSaving}
                    >
                      حفظ
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-3 pt-0 md:p-6 md:pt-0">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">إنجاز هذا العام</span>
              <span className="text-sm font-semibold text-blue-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          {/* Targets */}
          <div className="space-y-3 pt-2">
            {targets.map((target) => {
              const targetProgress = target.goal > 0 ? (target.current / target.goal) * 100 : 0;
              return (
                <div key={target.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{target.label}</span>
                      <span className="text-xs font-medium text-slate-600">
                        {target.current} / {target.goal}
                      </span>
                    </div>
                    <Progress value={Math.min(targetProgress, 100)} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
