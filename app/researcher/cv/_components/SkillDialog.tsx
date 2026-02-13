"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { addSkill } from "../_actions";
import type { Skill } from "@prisma/client";

interface SkillDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  editingSkill: Skill | null;
  isPending: boolean;
}

const levelOptions = [
  { value: "LEVEL_1", label: "مبتدئ (1)" },
  { value: "LEVEL_2", label: "متوسط (2)" },
  { value: "LEVEL_3", label: "جيد (3)" },
  { value: "LEVEL_4", label: "متقدم (4)" },
  { value: "LEVEL_5", label: "خبير (5)" },
];

export function SkillDialog({
  isOpen,
  onCloseAction,
  editingSkill,
  isPending,
}: SkillDialogProps) {
  const [level, setLevel] = useState<"LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "LEVEL_5">(
    (editingSkill?.level as "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "LEVEL_5") || "LEVEL_1"
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("level", level);

    const result = await addSkill(formData);
    if (result.success) {
      onCloseAction();
      window.location.reload();
    } else {
      alert(result.error || "حدث خطأ أثناء إضافة المهارة");
    }
  };

  const handleLevelChange = (value: string) => {
    if (value === "LEVEL_1" || value === "LEVEL_2" || value === "LEVEL_3" || value === "LEVEL_4" || value === "LEVEL_5") {
      setLevel(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction} modal={false}>
      <DialogContent className="w-[94vw] max-w-[480px] p-5 md:p-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                إضافة مهارة
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                أدخل معلومات المهارة
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-slate-600 mb-1 block text-right">
              اسم المهارة *
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={editingSkill?.name || ""}
              required
              placeholder="مثال: JavaScript، Python، إدارة المشاريع"
              className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-xs font-medium text-slate-600 mb-1 block text-right">
              المستوى *
            </Label>
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger
                id="level"
                className="h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
              >
                <SelectValue placeholder="اختر المستوى" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
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
