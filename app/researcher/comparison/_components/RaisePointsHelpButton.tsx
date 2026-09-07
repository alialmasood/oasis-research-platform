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
        className="h-10 min-w-[148px] px-3 text-xs font-medium border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
        onClick={() => setOpen(true)}
      >
        كيف أرفع نقاطي؟
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كيف أرفع نقاطي؟</DialogTitle>
            <DialogDescription>
              أكثر الأنشطة تأثيرًا بسرعة حسب نظام النقاط الحالي.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-slate-700">
            <p>• بحث منشور = +5 نقاط</p>
            <p>• مشاركة مؤتمر = +2 نقاط</p>
            <p>• إشراف على طالب = +4 نقاط</p>
            <p>• دورة تدريبية = +2 نقاط</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
