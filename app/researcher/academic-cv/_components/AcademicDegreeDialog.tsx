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

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction} modal={false}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingDegree ? "تعديل شهادة علمية" : "إضافة شهادة علمية"}
          </DialogTitle>
          <DialogDescription>
            أدخل معلومات الشهادة العلمية
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">الدرجة العلمية *</Label>
              <Select value={degree} onValueChange={handleDegreeChange}>
                <SelectTrigger id="degree">
                  <SelectValue placeholder="اختر الدرجة العلمية" />
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

            <div className="space-y-2">
              <Label htmlFor="graduationYear">سنة التخرج *</Label>
              <Select value={graduationYear} onValueChange={setGraduationYear}>
                <SelectTrigger id="graduationYear">
                  <SelectValue placeholder="اختر سنة التخرج" />
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

          <div className="space-y-2">
            <Label htmlFor="majorGeneral">التخصص العام *</Label>
            <Input
              id="majorGeneral"
              name="majorGeneral"
              defaultValue={editingDegree?.majorGeneral || ""}
              required
              placeholder="مثال: علوم الحاسوب"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="majorSpecific">التخصص الدقيق (اختياري)</Label>
            <Input
              id="majorSpecific"
              name="majorSpecific"
              defaultValue={editingDegree?.majorSpecific || ""}
              placeholder="مثال: الذكاء الاصطناعي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">الجامعة *</Label>
            <Input
              id="university"
              name="university"
              defaultValue={editingDegree?.university || ""}
              required
              placeholder="مثال: جامعة البصرة"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">الدولة *</Label>
            <Input
              id="country"
              name="country"
              defaultValue={editingDegree?.country || ""}
              required
              placeholder="مثال: العراق"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCloseAction} disabled={isPending}>
              إلغاء
            </Button>
            <SubmitButton isPending={isPending} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
