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
import { Loader2, X, User, MapPin } from "lucide-react";
import type { ProfileCV } from "@prisma/client";

interface CvDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (formData: FormData) => void;
  profileCv: ProfileCV | null;
  isPending: boolean;
}

const genderOptions = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
  { value: "OTHER", label: "آخر" },
];

const navigationItems = [
  { id: "personal", label: "معلومات شخصية", icon: User },
  { id: "address", label: "عنوان السكن", icon: MapPin },
];

export function CvDialog({
  isOpen,
  onCloseAction,
  onSubmitAction,
  profileCv,
  isPending,
}: CvDialogProps) {
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">(
    (profileCv?.gender as "MALE" | "FEMALE" | "OTHER") || ""
  );
  const [activeSection, setActiveSection] = useState("personal");

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (gender) {
      formData.set("gender", gender);
    }
    onSubmitAction(formData);
  };

  const handleGenderChange = (value: string) => {
    if (value === "MALE" || value === "FEMALE" || value === "OTHER") {
      setGender(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction} modal={false}>
      <DialogContent className="w-[94vw] max-w-[820px] p-0 rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[86vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {profileCv ? "تعديل السيرة الذاتية" : "إضافة السيرة الذاتية"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                أدخل معلوماتك الشخصية
              </DialogDescription>
            </div>
            <button
              onClick={onCloseAction}
              className="h-9 w-9 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 h-px bg-slate-100" />
        </DialogHeader>

        {/* Body with Two-Column Layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden" dir="rtl">
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
              {/* Left Sidebar - Navigation */}
              <aside className="hidden lg:block">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-1 sticky top-0">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full rounded-xl px-3 py-2 text-sm text-right transition-all ${
                          isActive
                            ? "bg-white border border-slate-200 shadow-sm font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Content - Form Sections */}
              <div className="space-y-5">
                {/* Card 1: معلومات شخصية */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-slate-900">معلومات شخصية</h3>
                  <p className="text-xs text-slate-500 mt-1">أدخل معلوماتك الشخصية الأساسية</p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        الجنس
                      </Label>
                      <Select value={gender} onValueChange={handleGenderChange}>
                        <SelectTrigger
                          id="gender"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                        >
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        القومية
                      </Label>
                      <Input
                        id="nationality"
                        name="nationality"
                        defaultValue={profileCv?.nationality || ""}
                        placeholder="مثال: عراقي"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="dateOfBirth" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        تاريخ الميلاد
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        defaultValue={formatDateForInput(profileCv?.dateOfBirth)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        dir="ltr"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 leading-4 text-right">
                        سيتم حساب العمر تلقائياً
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: عنوان السكن */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-slate-900">عنوان السكن</h3>
                  <p className="text-xs text-slate-500 mt-1">أدخل تفاصيل عنوان سكنك</p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        المحافظة
                      </Label>
                      <Input
                        id="province"
                        name="province"
                        defaultValue={profileCv?.province || ""}
                        placeholder="مثال: البصرة"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        القضاء
                      </Label>
                      <Input
                        id="district"
                        name="district"
                        defaultValue={profileCv?.district || ""}
                        placeholder="مثال: قضاء البصرة"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="area" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        المنطقة
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        defaultValue={profileCv?.area || ""}
                        placeholder="مثال: منطقة كذا"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="text-xs font-medium text-slate-600 mb-1 block text-right">
                        تفاصيل العنوان
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={profileCv?.address || ""}
                        placeholder="مثال: شارع كذا، مجمع كذا"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 border-t border-slate-100 bg-white/90 backdrop-blur px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCloseAction}
                disabled={isPending}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 px-5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ السيرة الذاتية"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
