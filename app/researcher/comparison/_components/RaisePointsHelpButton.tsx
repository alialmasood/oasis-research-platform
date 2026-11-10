"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RaisePointsHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 md:h-10 min-w-0 md:min-w-[148px] px-2 md:px-3 text-[10px] md:text-xs font-medium border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
        onClick={() => setOpen(true)}
      >
        <span className="md:hidden">رفع النقاط؟</span>
        <span className="hidden md:inline">كيف أرفع نقاطي؟</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">كيف أرفع نقاطي؟</DialogTitle>
            <DialogDescription className="text-[11px] md:text-sm">
              أكثر الأنشطة تأثيرًا بسرعة حسب نظام النقاط الحالي.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-1.5 md:block md:space-y-2 text-[11px] md:text-sm text-slate-700">
            <p className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 md:border-0 md:bg-transparent md:px-0 md:py-0">
              • بحث منشور = +5
            </p>
            <p className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 md:border-0 md:bg-transparent md:px-0 md:py-0">
              • مشاركة مؤتمر = +2
            </p>
            <p className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 md:border-0 md:bg-transparent md:px-0 md:py-0">
              • إشراف على طالب = +4
            </p>
            <p className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 md:border-0 md:bg-transparent md:px-0 md:py-0">
              • دورة تدريبية = +2
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
