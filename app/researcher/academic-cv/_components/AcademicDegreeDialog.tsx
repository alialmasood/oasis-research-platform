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
import { Loader2 } from "lucide-react";
import type { AcademicDegree } from "@prisma/client";

interface AcademicDegreeDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (formData: FormData) => void;
  editingDegree: AcademicDegree | null;
  isPending: boolean;
}

const degreeOptions = [
  { value: "BACHELORS", label: "بكالوريوس" },
  { value: "DIPLOMA", label: "دبلوم" },
  { value: "HIGHER_DIPLOMA", label: "دبلوم عالي" },
  { value: "MASTERS", label: "ماجستير" },
  { value: "PHD", label: "دكتوراه" },
  { value: "BOARD", label: "بورد" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear + 1 - 1950 + 1 }, (_, i) => 1950 + i).reverse();

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          جاري الحفظ...
        </>
      ) : (
        "حفظ"
      )}
    </Button>
  );
}

export function AcademicDegreeDialog({
  isOpen,
  onCloseAction,
  onSubmitAction,
  editingDegree,
  isPending,
}: AcademicDegreeDialogProps) {
  // استخدام القيم مباشرة من editingDegree - سيتم إعادة تعيين المكون عند تغيير key في المكون الأب
  const [degree, setDegree] = useState<"BACHELORS" | "DIPLOMA" | "HIGHER_DIPLOMA" | "MASTERS" | "PHD" | "BOARD">(
    editingDegree?.degree || "BACHELORS"
  );
  const [graduationYear, setGraduationYear] = useState(
    editingDegree?.graduationYear?.toString() || currentYear.toString()
  );

  // لا حاجة لـ useEffect - key prop في المكون الأب يعيد تعيين المكون تلقائياً

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("degree", degree);
    formData.set("graduationYear", graduationYear);
    onSubmitAction(formData);
  };

  const handleDegreeChange = (value: string) => {
    if (value === "BACHELORS" || value === "DIPLOMA" || value === "HIGHER_DIPLOMA" || value === "MASTERS" || value === "PHD" || value === "BOARD") {
      setDegree(value);
    }
  };

  const labelClass = "text-[11px] md:text-sm font-medium";
  const controlClass = "h-9 md:h-10 text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction} modal={false}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[500px] p-4 md:p-6 gap-3 md:gap-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm md:text-lg">
            {editingDegree ? "تعديل شهادة علمية" : "إضافة شهادة علمية"}
          </DialogTitle>
          <DialogDescription className="text-[11px] md:text-sm">
            أدخل معلومات الشهادة العلمية
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {/* الدرجة + السنة بنفس السطر على الموبايل */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-4">
            <div className="space-y-1 md:space-y-2 min-w-0">
              <Label htmlFor="degree" className={labelClass}>
                الدرجة العلمية *
              </Label>
              <Select value={degree} onValueChange={handleDegreeChange}>
                <SelectTrigger id="degree" className={controlClass}>
                  <SelectValue placeholder="اختر الدرجة" />
                </SelectTrigger>
                <SelectContent>
                  {degreeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:space-y-2 min-w-0">
              <Label htmlFor="graduationYear" className={labelClass}>
                سنة التخرج *
              </Label>
              <Select value={graduationYear} onValueChange={setGraduationYear}>
                <SelectTrigger id="graduationYear" className={controlClass}>
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="majorGeneral" className={labelClass}>
              التخصص العام *
            </Label>
            <Input
              id="majorGeneral"
              name="majorGeneral"
              defaultValue={editingDegree?.majorGeneral || ""}
              required
              placeholder="مثال: علوم الحاسوب"
              className={controlClass}
            />
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="majorSpecific" className={labelClass}>
              التخصص الدقيق (اختياري)
            </Label>
            <Input
              id="majorSpecific"
              name="majorSpecific"
              defaultValue={editingDegree?.majorSpecific || ""}
              placeholder="مثال: الذكاء الاصطناعي"
              className={controlClass}
            />
          </div>

          {/* موبايل: الجامعة + الدولة بنفس السطر. حاسوب: كل حقل بعرض كامل كما كان */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 md:gap-4">
            <div className="space-y-1 md:space-y-2 min-w-0">
              <Label htmlFor="university" className={labelClass}>
                الجامعة *
              </Label>
              <Input
                id="university"
                name="university"
                defaultValue={editingDegree?.university || ""}
                required
                placeholder="جامعة البصرة"
                className={controlClass}
              />
            </div>

            <div className="space-y-1 md:space-y-2 min-w-0">
              <Label htmlFor="country" className={labelClass}>
                الدولة *
              </Label>
              <Input
                id="country"
                name="country"
                defaultValue={editingDegree?.country || ""}
                required
                placeholder="العراق"
                className={controlClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-stretch md:justify-end gap-2 md:gap-3 pt-2 md:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
              disabled={isPending}
              className="h-9 md:h-10 flex-1 md:flex-none text-xs md:text-sm"
            >
              إلغاء
            </Button>
            <div className="flex-1 md:flex-none [&_button]:w-full md:[&_button]:w-auto [&_button]:h-9 md:[&_button]:h-10 [&_button]:text-xs md:[&_button]:text-sm">
              <SubmitButton isPending={isPending} />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
