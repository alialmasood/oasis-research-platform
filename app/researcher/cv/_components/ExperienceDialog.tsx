"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { addExperience } from "../_actions";
import type { Experience } from "@prisma/client";

interface ExperienceDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  editingExperience: Experience | null;
  isPending: boolean;
}

export function ExperienceDialog({
  isOpen,
  onCloseAction,
  editingExperience,
  isPending,
}: ExperienceDialogProps) {
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await addExperience(formData);
    if (result.success) {
      onCloseAction();
      window.location.reload();
    } else {
      alert(result.error || "حدث خطأ أثناء إضافة الخبرة");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction} modal={false}>
      <DialogContent className="w-[94vw] max-w-[640px] p-5 md:p-6 rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[82vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                إضافة خبرة
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                أدخل معلومات الخبرة الوظيفية
              </DialogDescription>
            </div>
            <button
              onClick={onCloseAction}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                  العنوان الوظيفي *
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingExperience?.title || ""}
                  required
                  placeholder="مثال: مطور برمجيات"
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                  الجهة *
                </Label>
                <Input
                  id="organization"
                  name="organization"
                  defaultValue={editingExperience?.organization || ""}
                  required
                  placeholder="مثال: شركة XYZ"
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                  تاريخ البدء *
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  defaultValue={formatDateForInput(editingExperience?.startDate)}
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                  تاريخ الانتهاء (اختياري)
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  defaultValue={formatDateForInput(editingExperience?.endDate)}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-4 text-right">
                  اتركه فارغاً إذا كانت الخبرة مستمرة
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingExperience?.description || ""}
                placeholder="وصف مختصر للخبرة..."
                rows={4}
                className="rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-100 px-5 md:px-6 py-4 -mx-5 md:-mx-6 mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
              disabled={isPending}
              className="rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
